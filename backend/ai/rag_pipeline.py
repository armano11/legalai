import os
import re
import json
import uuid
import logging
import pdfplumber
import requests
from ai.embeddings import embed_text, embed_batch
from ai.vector_store import add_documents, search, get_document_count
from ai.llm_fallback import generate_fallback_response, _internal_deep_processing, _internal_synthesis_engine
from config import RAG_SIMILARITY_THRESHOLD, RAG_TOP_K, LEGAL_DATA_DIR

logger = logging.getLogger(__name__)


# --- Web Search Integration (DuckDuckGo) ---
def _web_search(query: str, max_results: int = 5) -> list:
    """Search the web using DuckDuckGo Instant Answer API + HTML fallback."""
    results = []
    try:
        # DuckDuckGo Instant Answer API
        resp = requests.get(
            "https://api.duckduckgo.com/",
            params={"q": f"{query} Indian law legal", "format": "json", "no_html": 1, "skip_disambig": 1},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            # Abstract
            if data.get("AbstractText"):
                results.append({
                    "title": data.get("Heading", "Legal Reference"),
                    "snippet": data["AbstractText"][:500],
                    "source": data.get("AbstractSource", "DuckDuckGo"),
                    "url": data.get("AbstractURL", "")
                })
            # Related topics
            for topic in data.get("RelatedTopics", [])[:max_results]:
                if isinstance(topic, dict) and topic.get("Text"):
                    results.append({
                        "title": topic.get("Text", "")[:100],
                        "snippet": topic.get("Text", "")[:400],
                        "source": "DuckDuckGo",
                        "url": topic.get("FirstURL", "")
                    })
    except Exception as e:
        logger.warning(f"Web search failed: {e}")
    return results[:max_results]

# --- In-memory knowledge stores (loaded once) ---
_ipc_sections = None
_crpc_procedures = None
_landmark_cases = None
_hf_judgments = None
_hf_cases = None
_hf_laws = None


def _load_json(filename):
    path = os.path.join(LEGAL_DATA_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def get_ipc_sections():
    global _ipc_sections
    if _ipc_sections is None:
        _ipc_sections = _load_json("ipc_sections.json")
        logger.info(f"Loaded {len(_ipc_sections)} IPC sections")
    return _ipc_sections


def get_crpc_procedures():
    global _crpc_procedures
    if _crpc_procedures is None:
        _crpc_procedures = _load_json("crpc_procedures.json")
        logger.info(f"Loaded {len(_crpc_procedures)} CrPC procedures")
    return _crpc_procedures


def get_landmark_cases():
    global _landmark_cases
    if _landmark_cases is None:
        _landmark_cases = _load_json("landmark_cases.json")
        logger.info(f"Loaded {len(_landmark_cases)} landmark cases")
    return _landmark_cases


def get_hf_judgments():
    """Load HuggingFace court judgments dataset."""
    global _hf_judgments
    if _hf_judgments is None:
        _hf_judgments = _load_json("hf_court_judgments.json")
        if _hf_judgments:
            logger.info(f"Loaded {len(_hf_judgments)} HF court judgments")
    return _hf_judgments


def get_hf_cases():
    """Load HuggingFace structured court cases dataset."""
    global _hf_cases
    if _hf_cases is None:
        _hf_cases = _load_json("hf_court_cases.json")
        if _hf_cases:
            logger.info(f"Loaded {len(_hf_cases)} HF court cases")
    return _hf_cases


def get_hf_laws():
    """Load HuggingFace Indian laws dataset."""
    global _hf_laws
    if _hf_laws is None:
        _hf_laws = _load_json("hf_indian_laws.json")
        if _hf_laws:
            logger.info(f"Loaded {len(_hf_laws)} HF Indian law sections")
    return _hf_laws


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> list:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def extract_text_from_file(file_path: str) -> str:
    text = ""
    try:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
    except Exception as e:
        logger.error(f"Text extraction error for {file_path}: {e}")
    return text.strip()


def _ingest_hf_judgments() -> int:
    """Ingest HuggingFace court judgments into vector store."""
    data = get_hf_judgments()
    if not data:
        return 0
    chunks, metas, ids = [], [], []
    for rec in data:
        full_text = rec.get("full_text", "") or rec.get("summary", "")
        if not full_text or len(full_text) < 50:
            continue
        # Chunk long judgments
        text_chunks = chunk_text(full_text, chunk_size=400, overlap=80)
        for ci, ch in enumerate(text_chunks):
            chunks.append(ch)
            metas.append({
                "source": "hf_court_judgments.json",
                "case_title": rec.get("case_title", "Unknown Case"),
                "year": str(rec.get("year", "Unknown")),
                "court": rec.get("court", "Unknown"),
                "data_type": "hf_judgment",
                "chunk_index": ci
            })
            ids.append(f"hfj_{rec.get('id', ci)}_{ci}_{uuid.uuid4().hex[:6]}")
    if chunks:
        # Batch embed in groups of 256 to avoid memory issues
        batch_size = 256
        for i in range(0, len(chunks), batch_size):
            batch_end = min(i + batch_size, len(chunks))
            embeddings = embed_batch(chunks[i:batch_end])
            add_documents(chunks[i:batch_end], embeddings, metas[i:batch_end], ids[i:batch_end])
        logger.info(f"Ingested {len(chunks)} HF judgment chunks")
    return len(chunks)


def _ingest_hf_cases() -> int:
    """Ingest HuggingFace structured court cases into vector store."""
    data = get_hf_cases()
    if not data:
        return 0
    chunks, metas, ids = [], [], []
    for rec in data:
        desc = rec.get("description", "")
        if not desc:
            continue
        # Build rich searchable text from all structured fields
        text = (
            f"Case: {rec.get('case_title', '')}. "
            f"Type: {rec.get('case_type', '')}. "
            f"Status: {rec.get('case_status', '')}. "
            f"Judge: {rec.get('judge', '')}. "
            f"Court: {rec.get('court_location', '')}. "
            f"Filed: {rec.get('filing_date', '')}. "
            f"Description: {desc}"
        )
        chunks.append(text)
        metas.append({
            "source": "hf_court_cases.json",
            "case_title": rec.get("case_title", "Unknown"),
            "year": rec.get("filing_date", "Unknown")[:4] if rec.get("filing_date") else "Unknown",
            "court": rec.get("court_location", "Unknown"),
            "data_type": "hf_case",
            "case_type": rec.get("case_type", ""),
            "case_status": rec.get("case_status", ""),
            "judge": rec.get("judge", ""),
            "chunk_index": 0
        })
        ids.append(f"hfc_{rec.get('id', '')}_{uuid.uuid4().hex[:6]}")
    if chunks:
        batch_size = 256
        for i in range(0, len(chunks), batch_size):
            batch_end = min(i + batch_size, len(chunks))
            embeddings = embed_batch(chunks[i:batch_end])
            add_documents(chunks[i:batch_end], embeddings, metas[i:batch_end], ids[i:batch_end])
        logger.info(f"Ingested {len(chunks)} HF court case records")
    return len(chunks)


def _ingest_hf_laws() -> int:
    """Ingest HuggingFace Indian laws/statutes into vector store."""
    data = get_hf_laws()
    if not data:
        return 0
    chunks, metas, ids = [], [], []
    for rec in data:
        text = rec.get("text", "")
        if not text or len(text) < 20:
            continue
        # Prefix with act/section/chapter for better search
        searchable = (
            f"Act: {rec.get('act_name', '')}. "
            f"Section: {rec.get('section', '')}. "
            f"Chapter: {rec.get('chapter_name', '')}. "
            f"{text}"
        )
        # Chunk long statute text
        text_chunks = chunk_text(searchable, chunk_size=400, overlap=80)
        for ci, ch in enumerate(text_chunks):
            chunks.append(ch)
            metas.append({
                "source": "hf_indian_laws.json",
                "case_title": f"{rec.get('act_name', '')} — {rec.get('section', '')}",
                "year": "Current",
                "court": rec.get("act_name", "Indian Law"),
                "data_type": "hf_law",
                "act_name": rec.get("act_name", ""),
                "section": rec.get("section", ""),
                "chapter": rec.get("chapter_name", ""),
                "chunk_index": ci
            })
            ids.append(f"hfl_{rec.get('id', ci)}_{ci}_{uuid.uuid4().hex[:6]}")
    if chunks:
        batch_size = 256
        for i in range(0, len(chunks), batch_size):
            batch_end = min(i + batch_size, len(chunks))
            embeddings = embed_batch(chunks[i:batch_end])
            add_documents(chunks[i:batch_end], embeddings, metas[i:batch_end], ids[i:batch_end])
        logger.info(f"Ingested {len(chunks)} HF Indian law chunks")
    return len(chunks)


def ingest_json_datasets():
    """Ingest IPC sections, CrPC procedures, landmark cases, and HuggingFace datasets into vector store."""
    total = 0

    # Ingest IPC sections
    ipc = get_ipc_sections()
    if ipc:
        chunks, metas, ids = [], [], []
        for s in ipc:
            text = f"{s['section']} - {s['title']}: {s['description']} Punishment: {s['punishment']}. Category: {s['category']}. Severity: {s['severity']}."
            chunks.append(text)
            metas.append({
                "source": "ipc_sections.json",
                "case_title": f"{s['section']} - {s['title']}",
                "year": "1860",
                "court": "Indian Penal Code",
                "data_type": "ipc_section",
                "category": s.get("category", ""),
                "severity": s.get("severity", ""),
                "chunk_index": 0
            })
            ids.append(f"ipc_{s['section'].replace(' ', '_')}_{uuid.uuid4().hex[:6]}")
        if chunks:
            embeddings = embed_batch(chunks)
            add_documents(chunks, embeddings, metas, ids)
            total += len(chunks)
            logger.info(f"Ingested {len(chunks)} IPC sections")

    # Ingest CrPC procedures
    crpc = get_crpc_procedures()
    if crpc:
        chunks, metas, ids = [], [], []
        for proc in crpc:
            for step in proc.get("steps", []):
                text = f"Procedure: {proc['scenario']} - Step {step['step']}: {step['title']}. {step['description']} Timeline: {step.get('timeline', 'N/A')}."
                chunks.append(text)
                metas.append({
                    "source": "crpc_procedures.json",
                    "case_title": f"{proc['scenario']} - Step {step['step']}",
                    "year": "1973",
                    "court": "Code of Criminal Procedure",
                    "data_type": "procedure",
                    "category": proc["scenario"].lower().replace(" ", "_"),
                    "chunk_index": step["step"]
                })
                ids.append(f"crpc_{proc['scenario'][:20]}_{step['step']}_{uuid.uuid4().hex[:6]}")
        if chunks:
            embeddings = embed_batch(chunks)
            add_documents(chunks, embeddings, metas, ids)
            total += len(chunks)
            logger.info(f"Ingested {len(chunks)} CrPC procedure steps")

    # Ingest landmark cases
    cases = get_landmark_cases()
    if cases:
        chunks, metas, ids = [], [], []
        for c in cases:
            text = f"Case: {c['case_name']} ({c['citation']}, {c['year']}). Court: {c['court']}. Facts: {c['facts']} Judgment: {c['judgment']} Legal Principles: {', '.join(c.get('legal_principles', []))}. Sections: {', '.join(c.get('sections_cited', []))}."
            # Split long cases into chunks
            case_chunks = chunk_text(text, chunk_size=400, overlap=80)
            for i, ch in enumerate(case_chunks):
                chunks.append(ch)
                metas.append({
                    "source": "landmark_cases.json",
                    "case_title": c["case_name"],
                    "year": c["year"],
                    "court": c["court"],
                    "data_type": "landmark_case",
                    "category": c.get("category", ""),
                    "citation": c.get("citation", ""),
                    "chunk_index": i
                })
                ids.append(f"case_{c['case_name'][:20]}_{i}_{uuid.uuid4().hex[:6]}")
        if chunks:
            embeddings = embed_batch(chunks)
            add_documents(chunks, embeddings, metas, ids)
            total += len(chunks)
            logger.info(f"Ingested {len(chunks)} landmark case chunks")

    # --- Ingest HuggingFace datasets ---
    total += _ingest_hf_judgments()
    total += _ingest_hf_cases()
    total += _ingest_hf_laws()

    return total


def ingest_file(file_path: str, case_title: str = "", year: str = "", court: str = ""):
    logger.info(f"Ingesting File: {file_path}")
    text = extract_text_from_file(file_path)
    if not text:
        return 0
    chunks = chunk_text(text)
    if not chunks:
        return 0
    embeddings = embed_batch(chunks)
    file_name = os.path.basename(file_path)
    metadatas = [{
        "source": file_name,
        "case_title": case_title or file_name.replace(".pdf", "").replace(".txt", ""),
        "year": year or "Unknown",
        "court": court or "Unknown",
        "data_type": "document",
        "chunk_index": i
    } for i in range(len(chunks))]
    ids = [f"{file_name}_{uuid.uuid4().hex[:8]}_{i}" for i in range(len(chunks))]
    add_documents(chunks, embeddings, metadatas, ids)
    logger.info(f"Ingested {len(chunks)} chunks from {file_name}")
    return len(chunks)


def ingest_all_legal_data():
    """Ingest all legal data: JSON datasets + file-based documents."""
    total = 0
    # First: structured JSON datasets
    total += ingest_json_datasets()

    # Then: PDF/TXT files
    if os.path.exists(LEGAL_DATA_DIR):
        for filename in os.listdir(LEGAL_DATA_DIR):
            if filename.lower().endswith((".pdf", ".txt")):
                filepath = os.path.join(LEGAL_DATA_DIR, filename)
                total += ingest_file(filepath)

    logger.info(f"Total chunks ingested: {total}")
    return total


# --- Category map: query keywords → IPC categories ---
QUERY_CATEGORY_MAP = {
    # Violence / bodily harm
    "murder": ["murder", "homicide"], 
    "killing": ["murder", "homicide"],
    "homicide": ["homicide", "murder"],
    "assault": ["assault"],
    "battery": ["assault"],
    "hit": ["assault"],
    "beat": ["assault"],
    # Theft / property
    "theft": ["theft"],
    "stolen": ["theft"],
    "steal": ["theft"],
    "robbery": ["robbery", "dacoity"],
    "dacoity": ["dacoity", "robbery"],
    "extortion": ["extortion"],
    "burglary": ["theft", "trespass"],
    # Cheating / fraud / business (Tightened)
    "cheating": ["cheating", "breach_of_trust"],
    "fraud": ["cheating", "breach_of_trust", "forgery"],
    "fraudulent": ["cheating", "breach_of_trust"],
    "forgery": ["forgery"],
    "breach of trust": ["breach_of_trust"],
    "misappropriation": ["breach_of_trust"],
    "embezzlement": ["breach_of_trust"],
    "contract": ["breach_of_trust", "cheating"],
    "payment": ["breach_of_trust"],
    "money": ["breach_of_trust", "cheating"],
    # Sexual offences (CRITICAL: Strict requirement)
    "rape": ["sexual_offence"], 
    "sexual assault": ["sexual_offence"],
    "molestation": ["sexual_offence"], 
    "stalking": ["sexual_offence"],
    "modesty": ["sexual_offence"],
    # Domestic / marriage
    "dowry": ["domestic_violence"], 
    "cruelty": ["domestic_violence"],
    "domestic violence": ["domestic_violence"],
    "marriage offence": ["marriage_offence"],
    "divorce": ["marriage_offence"],
    # Defamation
    "defamation": ["defamation"], 
    "libel": ["defamation"], 
    "slander": ["defamation"],
    # Kidnapping
    "kidnapping": ["kidnapping"], 
    "abduction": ["kidnapping"],
    # Trespass
    "trespass": ["trespass"], 
    "encroachment": ["trespass"],
}


COMMON_STOP_WORDS = {
    "this", "that", "these", "those", "from", "with", "what", "when", 
    "where", "why", "how", "have", "been", "they", "their", "them", 
    "your", "yours", "will", "would", "could", "should", "some", "any", 
    "which", "who", "whom", "whose", "there", "their", "than", "then",
    "just", "like", "into", "over", "under", "about", "against",
    "involving", "whoever", "shall", "committed", "punished", "punishment",
    "shall", "also", "liable", "fine", "either", "any", "other", "such",
    "with", "under", "being", "made", "does", "done"
}

from collections import Counter

def _find_matching_ipc(query: str) -> list:
    """Find IPC sections matching the query using weighted category mapping + keyword scoring."""
    query_lower = query.lower()
    # Normalize query: keep alphanumeric and spaces
    query_clean = re.sub(r'[^a-z0-9 ]', ' ', query_lower)
    query_words = [w for w in query_clean.split() if len(w) > 2]
    
    # Step 1: Count category matches from all keywords (weight logic)
    category_scores = Counter()
    has_sexual_keywords = any(w in query_words for w in ["rape", "molestation", "sexual", "stalking", "modesty"])
    has_violent_keywords = any(w in query_words for w in ["murder", "homicide", "kill", "assault", "beat"])
    
    for word in query_words:
        # Check direct keyword matches
        if word in QUERY_CATEGORY_MAP:
            for cat in QUERY_CATEGORY_MAP[word]:
                # Strong bias: don't suggest sexual offences unless explicit keywords exist
                if cat == "sexual_offence" and not has_sexual_keywords:
                    continue
                # Don't suggest homicide unless explicit
                if cat in ["murder", "homicide"] and not has_violent_keywords:
                    continue
                category_scores[cat] += 15
        else:
            # Substring matching for categories
            for keyword, categories in QUERY_CATEGORY_MAP.items():
                if len(keyword) > 4 and keyword in word: # Only for longer keywords to avoid noise
                    for cat in categories:
                        if cat == "sexual_offence" and not has_sexual_keywords:
                            continue
                        category_scores[cat] += 5

    matches = []
    for s in get_ipc_sections():
        score = 0
        section_cat = s.get("category", "").lower()

        # Category match (weighted by frequency of keywords)
        if section_cat in category_scores:
            score += category_scores[section_cat]

        # Severity boost only if category matches strongly
        if s.get("severity") == "serious" and category_scores[section_cat] >= 15:
            score += 5

        # Title / description keyword match (supplementary, ignoring stop words)
        check_text = f"{s['title']} {s['description']}".lower()
        for word in query_words:
            if word not in COMMON_STOP_WORDS and len(word) > 3:
                if f" {word} " in f" {check_text} ": # Match whole words in description
                    score += 5
                elif word in check_text:
                    score += 1

        # Strict Threshold
        if score >= 20: 
            matches.append((score, s))

    # Sort by score descending
    matches.sort(key=lambda x: x[0], reverse=True)
    return [m[1] for m in matches[:10]]



# --- Procedure scenario map ---
PROCEDURE_KEYWORD_MAP = {
    "fir": ["Filing an FIR"], "police": ["Filing an FIR"],
    "complaint": ["Filing an FIR", "Consumer Complaint"],
    "arrest": ["Filing an FIR", "Bail Application"],
    "bail": ["Bail Application"], "custody": ["Bail Application"],
    "anticipatory": ["Bail Application"],
    "civil": ["Filing a Civil Suit"], "suit": ["Filing a Civil Suit"],
    "recovery": ["Filing a Civil Suit"], "injunction": ["Filing a Civil Suit"],
    "writ": ["Filing a Writ Petition"], "fundamental": ["Filing a Writ Petition"],
    "habeas": ["Filing a Writ Petition"], "mandamus": ["Filing a Writ Petition"],
    "constitutional": ["Filing a Writ Petition"],
    "consumer": ["Consumer Complaint"], "product": ["Consumer Complaint"],
    "defective": ["Consumer Complaint"], "service": ["Consumer Complaint"],
    "refund": ["Consumer Complaint"],
    "divorce": ["Divorce Petition"], "separation": ["Divorce Petition"],
    "maintenance": ["Divorce Petition"], "alimony": ["Divorce Petition"],
    "custody": ["Divorce Petition"],
    "rti": ["RTI Application"], "information": ["RTI Application"],
    "government": ["RTI Application"],
    "property": ["Filing a Civil Suit"], "land": ["Filing a Civil Suit"],
    "tenant": ["Filing a Civil Suit"], "evict": ["Filing a Civil Suit"],
    "rent": ["Filing a Civil Suit"],
    "business": ["Filing a Civil Suit", "Filing an FIR"],
    "partner": ["Filing a Civil Suit"],
    "funds": ["Filing an FIR", "Filing a Civil Suit"],
    "company": ["Filing a Civil Suit"],
    "cheat": ["Filing an FIR", "Filing a Civil Suit"],
    "fraud": ["Filing an FIR", "Filing a Civil Suit"],
    "theft": ["Filing an FIR"], "robbery": ["Filing an FIR"],
    "assault": ["Filing an FIR", "Bail Application"],
    "murder": ["Filing an FIR"],
    "dowry": ["Filing an FIR", "Divorce Petition"],
    "domestic": ["Filing an FIR", "Divorce Petition"],
    "harassment": ["Filing an FIR"],
}


def _find_matching_procedures(query: str) -> list:
    """Find CrPC procedures matching the query using keyword→scenario mapping."""
    query_lower = query.lower()
    all_procs = get_crpc_procedures()

    # Find matching scenarios from keyword map
    matched_scenarios = set()
    for keyword, scenarios in PROCEDURE_KEYWORD_MAP.items():
        if keyword in query_lower:
            matched_scenarios.update(scenarios)

    matches = []
    for proc in all_procs:
        score = 0
        scenario = proc["scenario"]

        # Scenario match from keyword map (strong signal)
        if scenario in matched_scenarios:
            score += 10

        # Supplementary keyword match in scenario name
        for word in query_lower.split():
            if len(word) > 3 and word in scenario.lower():
                score += 2

        if score > 0:
            matches.append((score, proc))

    matches.sort(key=lambda x: x[0], reverse=True)
    return matches[:3]


def _enrich_cases_from_knowledge_base(vector_results: list) -> list:
    """Enrich vector search results with full landmark case data when available."""
    landmark_cases = get_landmark_cases()
    case_lookup = {c["case_name"].lower(): c for c in landmark_cases}

    enriched = []
    for r in vector_results:
        title = r.get("case_title", "")
        # Try to find matching landmark case
        matched_case = None
        title_lower = title.lower()
        for case_name, case_data in case_lookup.items():
            if case_name in title_lower or title_lower in case_name:
                matched_case = case_data
                break

        if matched_case:
            enriched.append({
                "case_title": matched_case["case_name"],
                "court": matched_case["court"],
                "year": matched_case["year"],
                "summary": f"{matched_case['facts'][:200]}... Judgment: {matched_case['judgment'][:250]}...",
                "citation": matched_case["citation"],
                "relevance": r.get("relevance", 0),
                "source_type": "retrieved",
                "legal_principles": matched_case.get("legal_principles", []),
                "sections_cited": matched_case.get("sections_cited", [])
            })
        else:
            enriched.append(r)

    return enriched


def _build_smart_static_research(query: str, matched_ipc: list, matched_procs: list, cases: list) -> dict:
    """Build a rich, realistic static research response from actual knowledge base data."""
    query_lower = query.lower()

    # --- Build synthesis from real data ---
    synthesis_parts = []
    synthesis_parts.append("Based on a comprehensive analysis of the facts presented and the applicable provisions of Indian law, the following legal framework applies to this matter:")

    # IPC section references in synthesis
    if matched_ipc:
        section_refs = ", ".join([f"{s['section']} ({s['title']})" for s in matched_ipc[:5]])
        synthesis_parts.append(f"\n\nThe primary statutory provisions applicable are: {section_refs}.")

        # Add severity context
        serious = [s for s in matched_ipc if s.get("severity") == "serious"]
        if serious:
            synthesis_parts.append(f" Of these, {len(serious)} section(s) are classified as serious offences "
                                   f"with non-bailable warrants. The most significant provision is "
                                   f"{serious[0]['section']} — {serious[0]['title']}, which carries a punishment of "
                                   f"{serious[0]['punishment']}.")

        moderate = [s for s in matched_ipc if s.get("severity") == "moderate"]
        if moderate:
            synthesis_parts.append(f" Additionally, {len(moderate)} provision(s) of moderate severity apply, "
                                   f"including {moderate[0]['section']} ({moderate[0]['title']}).")

    # Case law references in synthesis
    if cases and cases[0].get("source_type") != "general_insight":
        case_refs = []
        for c in cases[:3]:
            citation = c.get("citation", "")
            if citation and citation != "Generated by JurisAI":
                case_refs.append(f"{c['case_title']} ({citation})")
            else:
                case_refs.append(f"{c['case_title']} ({c.get('year', 'N/A')})")
        if case_refs:
            synthesis_parts.append(f"\n\nRelevant judicial precedents that inform this analysis include: "
                                   f"{'; '.join(case_refs)}. These cases establish important legal principles "
                                   f"that are directly applicable to the present facts.")

    # Procedure references in synthesis
    if matched_procs:
        proc_names = [p["scenario"] for _, p in matched_procs[:2]]
        synthesis_parts.append(f"\n\nFrom a procedural standpoint, the following legal processes are "
                               f"relevant: {', '.join(proc_names)}. Strict adherence to the prescribed "
                               f"procedural steps is essential to protect the client's rights and ensure "
                               f"the admissibility of evidence.")

    # General closing
    synthesis_parts.append("\n\nIt is strongly recommended that the client engage a qualified advocate "
                           "specializing in the relevant area of law to evaluate the specific facts, "
                           "preserve evidence, and determine the most effective legal strategy. Time "
                           "limitations under the Limitation Act 1963 should be reviewed immediately.")

    synthesis = "".join(synthesis_parts)

    # --- Build query-specific court hierarchy ---
    court_hierarchy = []
    is_criminal = any(s.get("cognizable") for s in matched_ipc) if matched_ipc else False
    has_constitutional = any(w in query_lower for w in ["fundamental", "constitutional", "writ", "rights"])
    has_consumer = any(w in query_lower for w in ["consumer", "product", "service", "defective"])
    has_family = any(w in query_lower for w in ["divorce", "maintenance", "custody", "marriage"])

    if has_family:
        court_hierarchy.append({"court": "Family Court", "jurisdiction": "Exclusive jurisdiction over matrimonial disputes, maintenance, custody, and guardianship under Family Courts Act 1984", "relevance": "Primary forum for all family law matters", "recommended": True})
    elif has_consumer:
        court_hierarchy.append({"court": "District Consumer Disputes Redressal Commission", "jurisdiction": "Claims up to ₹1 crore under Consumer Protection Act 2019", "relevance": "Primary forum for consumer complaints", "recommended": True})
    elif is_criminal:
        court_hierarchy.append({"court": "Metropolitan Magistrate / Judicial Magistrate First Class", "jurisdiction": "Trial of offences punishable with imprisonment up to 3 years", "relevance": "First court for FIR-based criminal cases", "recommended": True})
        court_hierarchy.append({"court": "Sessions Court", "jurisdiction": "Trial of offences punishable with imprisonment exceeding 3 years, death, or life imprisonment", "relevance": "Cases committed by Magistrate for serious offences", "recommended": False})
    else:
        court_hierarchy.append({"court": "Civil Judge / District Court", "jurisdiction": "Original civil jurisdiction for suits based on pecuniary limits", "relevance": "Primary forum for civil disputes, recovery suits, property matters", "recommended": True})

    court_hierarchy.append({"court": "High Court", "jurisdiction": "Appellate jurisdiction over subordinate courts + Writ Petitions under Article 226", "relevance": "Appeals against lower court orders, constitutional remedies, bail applications", "recommended": has_constitutional})
    court_hierarchy.append({"court": "Supreme Court of India", "jurisdiction": "Special Leave Petitions (Article 136), fundamental rights cases (Article 32)", "relevance": "Final appellate authority — approached after exhausting lower court remedies", "recommended": False})

    # --- Build query-specific further steps ---
    further_steps = []
    if is_criminal:
        further_steps.append({"priority": "high", "action": "File an FIR at the jurisdictional police station", "reason": "Under Section 154 CrPC, registration of FIR is mandatory for cognizable offences (Lalita Kumari v. Govt. of U.P., 2014)"})
        further_steps.append({"priority": "high", "action": "Engage a criminal defence advocate", "reason": "Right to legal representation is a fundamental right under Article 22(1) of the Constitution"})
        further_steps.append({"priority": "high", "action": "Preserve all physical and documentary evidence", "reason": "Evidence is the foundation of criminal proceedings — delay or tampering can weaken the case"})
    else:
        further_steps.append({"priority": "high", "action": "Send a legal notice to the opposing party", "reason": "Legal notice is a statutory prerequisite for many civil actions and demonstrates bona fide intent to resolve"})
        further_steps.append({"priority": "high", "action": "Engage a civil litigation advocate", "reason": "Complex procedural requirements under CPC mandate professional legal representation"})
        further_steps.append({"priority": "high", "action": "Collect and notarize all supporting documents", "reason": "Documentary evidence carries significant evidentiary value under the Indian Evidence Act 1872"})

    further_steps.append({"priority": "medium", "action": "Verify the limitation period for filing", "reason": "The Limitation Act 1963 prescribes strict time limits — filing beyond the limitation period results in dismissal"})
    further_steps.append({"priority": "medium", "action": "Explore Alternative Dispute Resolution (ADR)", "reason": "Mediation and arbitration are faster and cost-effective — courts often encourage ADR under Section 89 CPC"})
    further_steps.append({"priority": "low", "action": "Document a chronological timeline of events", "reason": "A clear factual timeline strengthens legal arguments and assists the advocate in case preparation"})

    # --- Build query-specific risk assessment ---
    score = 50
    factors_for = []
    factors_against = []

    if matched_ipc:
        score += 10
        factors_for.append(f"Clear statutory provisions identified ({len(matched_ipc)} applicable IPC sections)")
    if cases and cases[0].get("source_type") != "general_insight":
        score += 10
        factors_for.append(f"Supporting judicial precedents found ({len(cases)} relevant cases)")
    if matched_procs:
        score += 5
        factors_for.append("Established procedural framework available")

    if any(s.get("severity") == "serious" for s in matched_ipc):
        factors_for.append("Serious offence classification increases prosecutorial priority")
    if any(not s.get("bailable", True) for s in matched_ipc):
        factors_for.append("Non-bailable offence — stronger enforcement mechanism available")

    factors_against.append("Assessment based on initial facts — detailed evidence review required")
    factors_against.append("Opposing party's defence arguments not yet considered")
    if not any(w in query_lower for w in ["evidence", "proof", "witness", "document"]):
        factors_against.append("No evidence details mentioned — evidentiary strength uncertain")

    score = min(85, max(30, score))
    strength = "strong" if score >= 70 else "moderate" if score >= 45 else "weak"

    risk_assessment = {
        "strength": strength,
        "score": score,
        "summary": f"Based on {len(matched_ipc)} applicable statutory provisions and {len(cases)} relevant precedents, the legal position appears {strength}. A detailed review of evidence and facts by a qualified advocate is essential for a definitive assessment.",
        "factors_for": factors_for,
        "factors_against": factors_against
    }

    return {
        "synthesis": synthesis,
        "similar_cases": cases[:5], # Ensure frontend has precedents even in static mode
        "court_hierarchy": court_hierarchy,
        "further_steps": further_steps,
        "risk_assessment": risk_assessment
    }


def search_legal(query: str) -> dict:
    """
    Main RAG search + structured knowledge base lookup + web search.
    Returns a comprehensive legal research report.
    Always produces rich results even when AI engines are offline.
    """
    # 1. Vector search (may fail if embeddings not loaded)
    results = []
    rag_succeeded = False
    try:
        query_embedding = embed_text(query)
        raw_results = search(query_embedding, top_k=RAG_TOP_K)

        documents = raw_results.get("documents", [[]])[0]
        metadatas = raw_results.get("metadatas", [[]])[0]
        distances = raw_results.get("distances", [[]])[0]

        for doc, meta, dist in zip(documents, metadatas, distances):
            similarity = 1 - dist
            if similarity >= RAG_SIMILARITY_THRESHOLD:
                rag_succeeded = True
                results.append({
                    "case_title": meta.get("case_title", "Unknown"),
                    "court": meta.get("court", "Unknown"),
                    "year": meta.get("year", "Unknown"),
                    "summary": doc[:500] + ("..." if len(doc) > 500 else ""),
                    "citation": meta.get("citation", f"{meta.get('case_title', 'N/A')} ({meta.get('year', 'N/A')})"),
                    "relevance": round(similarity * 100, 1),
                    "source_type": "retrieved"
                })
    except Exception as e:
        logger.warning(f"Vector search failed: {e}")

    # Deduplicate by case_title
    seen_titles = set()
    unique_results = []
    for r in results:
        if r["case_title"] not in seen_titles:
            seen_titles.add(r["case_title"])
            unique_results.append(r)
    results = unique_results
    results.sort(key=lambda x: x["relevance"], reverse=True)

    # Enrich cases with full landmark case data
    results = _enrich_cases_from_knowledge_base(results)

    # 2. Direct knowledge base lookups (ALWAYS runs — this is the core data source)
    matched_ipc = _find_matching_ipc(query)
    matched_procs = _find_matching_procedures(query)

    # If vector search returned nothing, pull matching cases from all knowledge bases
    if not results:
        query_lower = query.lower()
        query_words = [w for w in re.sub(r'[^a-z0-9 ]', ' ', query_lower).split() if len(w) > 3]

        # Search landmark cases
        landmark_cases = get_landmark_cases()
        for case in landmark_cases:
            case_text = f"{case['case_name']} {case.get('facts', '')} {case.get('judgment', '')} {' '.join(case.get('legal_principles', []))}".lower()
            score = sum(3 for w in query_words if w in case_text)
            if score >= 3:
                results.append({
                    "case_title": case["case_name"],
                    "court": case["court"],
                    "year": case["year"],
                    "summary": f"{case['facts'][:200]}... Judgment: {case['judgment'][:250]}...",
                    "citation": case["citation"],
                    "relevance": min(95, score * 10),
                    "source_type": "knowledge_base",
                    "legal_principles": case.get("legal_principles", []),
                    "sections_cited": case.get("sections_cited", [])
                })

        # Search HF court judgments
        for rec in get_hf_judgments():
            rec_text = f"{rec.get('case_title', '')} {rec.get('summary', '')}".lower()
            score = sum(3 for w in query_words if w in rec_text)
            if score >= 3:
                results.append({
                    "case_title": rec.get("case_title", "Unknown"),
                    "court": rec.get("court", "Unknown"),
                    "year": str(rec.get("year", "Unknown")),
                    "summary": rec.get("summary", "")[:500],
                    "citation": f"{rec.get('case_title', 'N/A')} ({rec.get('year', 'N/A')})",
                    "relevance": min(90, score * 8),
                    "source_type": "hf_judgment"
                })

        # Search HF structured cases
        for rec in get_hf_cases():
            rec_text = f"{rec.get('case_title', '')} {rec.get('description', '')} {rec.get('case_type', '')}".lower()
            score = sum(3 for w in query_words if w in rec_text)
            if score >= 3:
                results.append({
                    "case_title": rec.get("case_title", "Unknown"),
                    "court": rec.get("court_location", "Unknown"),
                    "year": rec.get("filing_date", "Unknown")[:4] if rec.get("filing_date") else "Unknown",
                    "summary": rec.get("description", "")[:500],
                    "citation": f"{rec.get('id', '')} ({rec.get('court_location', 'N/A')})",
                    "relevance": min(85, score * 8),
                    "source_type": "hf_case"
                })

        # Search HF Indian laws
        for rec in get_hf_laws():
            rec_text = f"{rec.get('act_name', '')} {rec.get('section', '')} {rec.get('text', '')}".lower()
            score = sum(3 for w in query_words if w in rec_text)
            if score >= 3:
                results.append({
                    "case_title": f"{rec.get('act_name', '')} — {rec.get('section', '')}",
                    "court": rec.get("act_name", "Indian Law"),
                    "year": "Current",
                    "summary": rec.get("text", "")[:500],
                    "citation": f"{rec.get('act_name', '')} {rec.get('section', '')}",
                    "relevance": min(85, score * 8),
                    "source_type": "hf_law"
                })

        results.sort(key=lambda x: x["relevance"], reverse=True)
        results = results[:10]

    # 3. Web search enrichment (runs in parallel for additional context)
    web_results = []
    try:
        web_results = _web_search(query, max_results=5)
        logger.info(f"Web search returned {len(web_results)} results")
    except Exception as e:
        logger.warning(f"Web search enrichment failed: {e}")

    # Add web results as supplementary cases if we have few results
    if len(results) < 3 and web_results:
        for wr in web_results[:3]:
            if wr.get("snippet") and len(wr["snippet"]) > 50:
                results.append({
                    "case_title": wr.get("title", "Web Research")[:100],
                    "court": wr.get("source", "Online Legal Database"),
                    "year": "Current",
                    "summary": wr["snippet"][:500],
                    "citation": wr.get("url", "Web Search"),
                    "relevance": 60,
                    "source_type": "web_search"
                })

    penal_codes = [
        {"code": s["section"], "title": s["title"], "description": s["description"],
         "severity": s["severity"], "punishment": s.get("punishment", "")}
        for s in matched_ipc
    ]

    procedures = []
    for _, proc in matched_procs:
        for step in proc.get("steps", []):
            procedures.append({
                "step": step["step"],
                "title": f"{proc['scenario']}: {step['title']}",
                "description": step["description"],
                "timeline": step.get("timeline", "")
            })

    # 4. Build context for LLM (include web search data)
    context_str = ""
    if results:
        context_str = "\n".join([
            f"- {r['case_title']} ({r['year']}, {r['court']}): {r['summary'][:300]}..."
            for r in results[:5]
        ])
    if matched_ipc:
        context_str += "\nRelevant IPC Sections:\n" + "\n".join([
            f"- {s['section']}: {s['title']} — {s['description'][:150]}"
            for s in matched_ipc[:5]
        ])
    if web_results:
        context_str += "\nWeb Research Findings:\n" + "\n".join([
            f"- {wr['title']}: {wr['snippet'][:200]}"
            for wr in web_results[:3]
        ])

    # 5. LLM synthesis — Qwen-powered deep research (Perplexity-style)
    logger.info("Generating Qwen-powered deep research report...")
    deep = {}
    try:
        deep = _internal_deep_processing(query, context=context_str if context_str else None)
        if deep and isinstance(deep, dict) and deep.get("synthesis"):
            logger.info(f"AI synthesis succeeded ({len(deep.get('synthesis', ''))} chars)")
        else:
            logger.warning("AI synthesis returned empty — falling back to static engine")
            deep = _build_smart_static_research(query, matched_ipc, matched_procs, results)
    except Exception as e:
        logger.error(f"Deep research failed: {e} — using static fallback")
        deep = _build_smart_static_research(query, matched_ipc, matched_procs, results)


    # Merge LLM-generated data with knowledge base data
    llm_penal = deep.get("penal_codes", [])
    llm_procs = deep.get("procedures", [])

    # Knowledge base data takes priority, LLM data supplements
    if not penal_codes:
        penal_codes = llm_penal
    elif llm_penal:
        existing_codes = {p["code"] for p in penal_codes}
        for lp in llm_penal:
            if lp.get("code") not in existing_codes:
                penal_codes.append(lp)

    if not procedures:
        procedures = llm_procs

    court_hierarchy = deep.get("court_hierarchy", [
        {"court": "District Court / Sessions Court", "jurisdiction": "Original criminal/civil jurisdiction", "relevance": "First court for most cases", "recommended": True},
        {"court": "High Court", "jurisdiction": "Appellate + Writ jurisdiction (Article 226)", "relevance": "Appeals and constitutional remedies", "recommended": False},
        {"court": "Supreme Court of India", "jurisdiction": "Final appellate jurisdiction (Article 136)", "relevance": "Special Leave Petitions, fundamental rights", "recommended": False}
    ])

    further_steps = deep.get("further_steps", [
        {"priority": "high", "action": "Consult a qualified advocate", "reason": "Professional legal advice is essential"},
        {"priority": "high", "action": "Preserve all evidence and documentation", "reason": "Evidence is critical for legal proceedings"},
        {"priority": "medium", "action": "Check limitation period", "reason": "Most legal actions have statutory time limits"},
        {"priority": "low", "action": "Consider mediation/ADR", "reason": "Alternative dispute resolution is faster and cheaper"}
    ])

    risk_assessment = deep.get("risk_assessment", {
        "strength": "moderate",
        "score": 55,
        "summary": "Based on available legal provisions and precedents.",
        "factors_for": ["Legal query identified relevant area of law"],
        "factors_against": ["Detailed evidence review needed for complete assessment"]
    })

    source = "rag" if rag_succeeded and results else "knowledge_base"
    if not results:
        # Absolute fallback — always return something useful
        synthesis = deep.get("synthesis", "Analysis based on matched legal data.")
        results = [{
            "case_title": "Legal Analysis Summary",
            "court": "JurisAI Knowledge Base",
            "year": "Current",
            "summary": synthesis[:500],
            "citation": "JurisAI Legal Research",
            "relevance": 75,
            "source_type": "knowledge_base"
        }]

    return {
        "results": results,
        "similar_cases": results, # Field normalization for frontend consistency
        "synthesis": deep.get("synthesis", "Analysis based on matched legal data."),
        "penal_codes": penal_codes,
        "procedures": procedures,
        "court_hierarchy": court_hierarchy,
        "further_steps": further_steps,
        "risk_assessment": risk_assessment,
        "total": len(results),
        "source": source,
        "web_sources": [{"title": wr.get("title", ""), "url": wr.get("url", "")} for wr in web_results[:5]] if web_results else [],
        "context_for_ai": context_str, # Return this so frontend can pass it back for synthesis
        "synthesis_ready": True
    }

def get_research_synthesis(query: str, context: str) -> dict:
    """Late-load AI synthesis for research report."""
    try:
        result = _internal_synthesis_engine(query, context)
        if result and isinstance(result, dict):
            return result
        return {"synthesis": "AI reasoning is currently unavailable. Using JurisCore static analysis."}
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        return {"synthesis": "AI reasoning is currently unavailable. Using JurisCore static analysis."}


async def get_llm_response(prompt: str, json_mode: bool = False) -> str:
    """Async wrapper for LLM responses, used by legal_paper_service."""
    import asyncio
    from functools import partial
    
    # Run the synchronous generate_fallback_response in a thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    if json_mode:
        # If json_mode is requested, we ensure the prompt asks for it and we use the deep research logic
        # OR we just use the standard fallback and clean it.
        # For simplicity and speed in document analysis, we use the standard fallback.
        pass
    
    response = await loop.run_in_executor(None, partial(generate_fallback_response, prompt))
    return response
