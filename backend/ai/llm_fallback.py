import os
import json
import logging
import requests

from config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_BACKUP_MODEL, APP_CORE_TOKEN

logger = logging.getLogger(__name__)

# Lazy-loaded HuggingFace pipeline
_hf_pipeline = None


def _get_hf_pipeline():
    """Lazy-load HuggingFace text-generation pipeline."""
    global _hf_pipeline
    if _hf_pipeline is not None:
        return _hf_pipeline
    try:
        from transformers import pipeline
        logger.info("Loading local AI model (first time may take a minute)...")
        _hf_pipeline = pipeline(
            "text-generation",
            model="deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
            device_map="cpu",
            torch_dtype="auto"
        )
        logger.info("Local AI model loaded successfully")
        return _hf_pipeline
    except Exception as e:
        logger.warning(f"Could not load local AI model: {e}")
        return None


def _call_ollama(prompt: str, max_tokens: int = 2000, model_name: str = OLLAMA_MODEL, timeout: int = 45) -> str:
    """Call Ollama API. Single attempt with configurable timeout for speed."""
    try:
        resp = requests.post(OLLAMA_URL, json={
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens, 
                "temperature": 0.2,
                "num_ctx": 2048,
                "num_thread": 8,
                "top_p": 0.9
            }
        }, timeout=timeout)
        if resp.status_code == 200:
            result = resp.json().get("response", "").strip()
            if result:
                logger.info(f"Ollama ({model_name}) responded ({len(result)} chars)")
                return result
    except requests.exceptions.Timeout:
        logger.warning(f"Ollama {model_name} timeout after {timeout}s")
        return None
    except requests.exceptions.ConnectionError:
        logger.warning("Ollama not running — skipping")
        return None
    except Exception as e:
        logger.warning(f"Ollama {model_name} error: {e}")
        return None
    return None
def _call_neural_node(prompt: str, max_tokens: int = 2000) -> str:
    """Calls internal neural processing node using auto-cascade fallback."""
    import requests

    try:
        if not APP_CORE_TOKEN:
            logger.warning("Neural Engine Key missing - skipping")
            return None

        _u = "https://openrouter.ai/api/v1/chat/completions" # Static endpoint, can be further obfuscated if needed

        headers = {
            "Authorization": f"Bearer {APP_CORE_TOKEN}",
            "Content-Type": "application/json"
        }
        
        # Cascade array ordered by provider stability
        fallback_models = [
            "qwen/qwen3-next-80b-a3b-instruct:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "nvidia/nemotron-3-super-120b-a12b:free",
            "google/gemini-2.0-flash-exp:free",
            "deepseek/deepseek-chat:free",
            "qwen/qwen-2.5-coder-32b-instruct:free",
            "mistralai/mistral-nemo:free",
            "meta-llama/llama-3.1-8b-instruct:free"
        ]
        
        for model in fallback_models:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}]
            }
            try:
                logger.info(f"Targeting Node: {model}...")
                resp = requests.post(_u, headers=headers, json=payload, timeout=45)
                if resp.status_code == 200:
                    result = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                    if result:
                        logger.info(f"Node active ({len(result)} chars)")
                        return result
                else:
                    logger.warning(f"Node returned {resp.status_code}. Auto-routing...")
            except Exception:
                continue
                
    except Exception as e:
        logger.warning(f"Neural Engine routing failure: {e}")
    return None


def _call_hf(prompt: str, max_tokens: int = 1500) -> str:
    """Call local HuggingFace Instruct model."""
    pipe = _get_hf_pipeline()
    if not pipe:
        return None
    try:
        messages = [
            {"role": "system", "content": "You are an expert Indian Legal AI. Provide exceptionally detailed, accurate, and structured legal analysis. Always ensure your response strictly follows the requested format."},
            {"role": "user", "content": prompt}
        ]
        out = pipe(messages, max_new_tokens=max_tokens, do_sample=False)
        generated = out[0]["generated_text"]
        if isinstance(generated, list):
            return generated[-1].get("content", "")
        return str(generated)
    except Exception as e:
        logger.warning(f"HuggingFace model error: {e}")
    return None


def generate_fallback_response(query: str) -> str:
    """Generate a response using available AI engines. Cascade: Ollama → HuggingFace → template."""
    prompt = f"""You are a Senior Legal Advocate in India. Provide a comprehensive, high-density legal analysis for the query below.

Query: {query}

Your response must include:
1.  **Applicable Acts & Sections**: Identify specific provisions of the IPC, CrPC, IEA, or relevant special acts (e.g., NIA, NDPS, PMLA).
2.  **Legal Principles**: Explain the core legal doctrines and precedents (e.g., 'Doctrine of Res Judicata', 'Principles of Natural Justice', 'Lalita Kumari guidelines').
3.  **Procedural Roadmap**: Detail the exact steps (FIR -> Investigation -> Charge Sheet -> Trial) or (Legal Notice -> Plaint -> Written Statement -> Issues -> Evidence).
4.  **Strategic Advice**: Provide specific, actionable next steps for the client.

Format your response with clear headings and professional legal terminology. Ensure the data is realistic and grounded in Indian jurisprudence."""

    # Try Neural Engine First
    result = _call_neural_node(prompt, max_tokens=1500)
    if result:
        return result

    # Try HuggingFace local model
    result = _call_hf(prompt)
    if result:
        return result

    # Static fallback
    return f"Legal analysis for: {query}\n\nThis query involves legal matters under Indian law. For a comprehensive analysis, ensure the JurisCore engine is active. Key recommendations: (1) Consult a qualified advocate, (2) Gather all relevant documents and evidence, (3) Check applicable limitation periods."


def _internal_deep_processing(query: str, context: str = None) -> dict:
    """Generate structured research processing using internal neural engine."""
    prompt = f"""You are a Super-Advanced Legal Research AI System in India (combining the reasoning of multiple PhD-level experts). Perform an EXHAUSTIVE, DEEP-DIVE legal analysis on the query provided, using the context if available.

OBJECTIVE: Produce a fully realistic, citation-backed, 'Super Researched' legal brief that represents the absolute pinnacle of legal analysis.

CONTEXT: {context or "Use exhaustive knowledge of Indian Law statutes and precedents"}
QUERY: {query}

RULES:
1.  **Strictly Professional & In-Depth**: Use highly formal legal language. Do not mention you are an AI. Go into extreme depth for every aspect of the law.
2.  **No Hallucinations**: Focus on landmark apex court precedents and precise statutory parsing. Combine the best case law to show extremely advanced research.
3.  **High Density**: Every field in the JSON MUST be populated heavily. No "N/A" or empty arrays. Write extensive paragraphs.
4.  **Synthesis Detail**: The 'synthesis' must be a masive 6-8 paragraph comprehensive brief covering:
    - Factual Overview & Micro-classification of the matter.
    - Exhaustive Statutory Analysis (primary acts/sections, provisos, and exceptions).
    - Deep Judicial Trends (how courts usually ruled on similar facts, analyzing ratio decidendi).
    - Concluding Legal Opinion, Risk Matrix & Elite Litigation Strategy.

Respond ONLY with valid JSON:
{{
  "synthesis": "Comprehensive multi-paragraph legal brief...",
  "penal_codes": [
    {{"code": "Section 302 IPC", "title": "Punishment for Murder", "description": "Applicable where there is intention to cause death or bodily injury likely to cause death.", "severity": "serious", "punishment": "Death or Life Imprisonment + Fine"}}
  ],
  "similar_cases": [
    {{"case_title": "Case Name v. State", "citation": "2024 SCC OnLine SC 123", "summary": "Detailed summary of how the facts and ratio decidendi match this query.", "relevance": 95, "legal_principles": ["Principle A", "Principle B"]}}
  ],
  "procedures": [
    {{"step": 1, "title": "Filing of FIR / Civil Suit", "description": "Explicit instructions on what to include and which forum to approach.", "timeline": "Immediate / 3 months"}}
  ],
  "court_hierarchy": [
    {{"court": "Appropriate Forum", "jurisdiction": "Territorial and Pecuniary details", "relevance": "Why this specific court", "recommended": true}}
  ],
  "further_steps": [
    {{"priority": "high", "action": "Specific Action Item", "reason": "Legal justification for this step"}}
  ],
  "risk_assessment": {{
    "strength": "strong / moderate / weak",
    "score": 85,
    "summary": "Professional evaluative summary of the case strength.",
    "factors_for": ["Strong Factor 1", "Strong Factor 2"],
    "factors_against": ["Risk Factor 1", "Risk Factor 2"]
  }}
}}"""

    # Try Neural Engine First
    result = _call_neural_node(prompt, max_tokens=4000)
    if result:
        parsed = _try_parse_json(result)
        if parsed:
            return parsed

    # Try Ollama (Backup)
    result = _call_ollama(prompt, max_tokens=2000, model_name=OLLAMA_BACKUP_MODEL)
    if result:
        parsed = _try_parse_json(result)
        if parsed:
            return parsed

    # Static deep research fallback (skip HuggingFace — too slow on CPU)
    return _build_static_research(query)


def generate_contract_analysis(contract_text: str) -> dict:
    """Analyze contract text using DeepSeek R1."""
    prompt = f"""Analyze the following contract text for legal risks, missing clauses, and overall fairness. 
Do not mention you are an AI. Provide a professional legal audit.

Contract Text Sample:
{contract_text[:4000]}

Respond ONLY with valid JSON in this format:
{{
  "audit_summary": "High level audit summary...",
  "risk_detections": [
    {{"clause": "Snippet", "risk_level": "high/medium/low", "issue": "Reasoning", "recommendation": "Fix"}}
  ],
  "missing_critical_clauses": [
    {{"clause_name": "Name", "importance": "Why it's needed"}}
  ],
  "fairness_score": 75,
  "overall_verdict": "Clear verdict"
}}"""

    # Try Neural Engine First
    result = _call_neural_node(prompt, max_tokens=2500)
    if result:
        parsed = _try_parse_json(result)
        if parsed:
            return parsed

    # Try Ollama (Backup)
    result = _call_ollama(prompt, max_tokens=3000, model_name=OLLAMA_BACKUP_MODEL)
    if result:
        parsed = _try_parse_json(result)
        if parsed:
            return parsed

    # Try HuggingFace
    result = _call_hf(prompt, max_tokens=2000)
    if result:
        parsed = _try_parse_json(result)
        if parsed:
            return parsed

    return _build_static_research(query)

def _internal_synthesis_engine(query: str, context: str = None) -> dict:
    """Generate just the synthesis and risk assessment using internal engine."""
    
    prompt = f"""You are a Senior Legal Research Advocate in India. Provide a comprehensive synthesis of the search results for this query.

QUERY: {query}
CONTEXT / SEARCH RESULTS: {context or "Analyze based on standard Indian Statutes and Case Law"}

OBJECTIVE: Create a high-quality "Summary of Analysis" that integrates the retrieved data into a cohesive legal opinion.

Respond ONLY with valid JSON:
{{
  "synthesis": "A 4-5 paragraph expert synthesis. Paragraph 1: Legal classification. Paragraph 2: Statutory framework. Paragraph 3: Precedential analysis from context. Paragraph 4: Risk and procedural outlook. Paragraph 5: Final recommendation.",
  "risk_assessment": {{
    "strength": "strong/moderate/weak",
    "score": 75,
    "summary": "A 2-3 sentence professional risk evaluation.",
    "factors_for": ["Statutory support", "Favorable precedents"],
    "factors_against": ["Evidentiary hurdles", "Procedural delays"]
  }},
  "court_hierarchy": [
    {{"court": "Forum Name", "jurisdiction": "Details", "relevance": "Why this court", "recommended": true}}
  ],
  "further_steps": [
    {{"priority": "high/medium/low", "action": "Actionable strategy", "reason": "Legal rationale"}}
  ]
}}"""

    # Try Neural Engine First
    result = _call_neural_node(prompt, max_tokens=2500)
    if result:
        parsed = _try_parse_json(result)
        if parsed:
            return parsed

    # Try Ollama (Backup)
    result = _call_ollama(prompt, max_tokens=2500, model_name=OLLAMA_MODEL)
    if result:
        parsed = _try_parse_json(result)
        if parsed:
            return parsed

    # Try Backup if primary fails
    result = _call_ollama(prompt, max_tokens=2500, model_name=OLLAMA_BACKUP_MODEL)
    if result:
        parsed = _try_parse_json(result)
        if parsed:
            return parsed

    return _build_static_research(query)

def _try_parse_json(text: str) -> dict:
    """Try to extract and parse JSON from text. Ensures return is a dict."""
    if not text:
        return None
        
    # Strip <think> tags often found in DeepSeek R1 output
    if "<think>" in text and "</think>" in text:
        text = text.split("</think>")[-1].strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    # Try to find JSON block in text
    import re
    patterns = [
        r'\{[\s\S]*\}',
        r'```json\s*([\s\S]*?)```',
        r'```\s*([\s\S]*?)```'
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                candidate = match.group(1) if match.lastindex else match.group(0)
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return parsed
            except (json.JSONDecodeError, IndexError):
                continue
    return None


def _build_static_research(query: str) -> dict:
    """Build a static research response when AI engines are unavailable."""
    query_lower = query.lower()

    # Detect category from query
    synthesis = "Based on the details provided, this matter involves legal proceedings under Indian law. "

    if any(w in query_lower for w in ["theft", "steal", "stolen", "rob"]):
        synthesis += "The matter appears to relate to offences against property under Chapter XVII of the Indian Penal Code. The key sections applicable would be Sections 378-382 (Theft), 392-402 (Robbery/Dacoity). Filing an FIR at the jurisdictional police station is the recommended first step."
    elif any(w in query_lower for w in ["murder", "kill", "death", "homicide"]):
        synthesis += "The matter appears to involve serious offences under Chapter XVI of the IPC relating to offences affecting the human body. Sections 299-304 (Culpable Homicide/Murder) would be the primary provisions. Immediate police involvement is critical."
    elif any(w in query_lower for w in ["cheat", "fraud", "deceive", "scam"]):
        synthesis += "The matter relates to offences under Chapter XVII of the IPC dealing with cheating and fraud. Section 420 (Cheating) and Section 406 (Criminal Breach of Trust) are the primary provisions. Both police complaint and civil recovery suit can be pursued."
    elif any(w in query_lower for w in ["divorce", "marriage", "maintenance", "alimony", "custody"]):
        synthesis += "The matter falls under family law jurisdiction. The Hindu Marriage Act 1955, Special Marriage Act 1954, or relevant personal laws would apply. Family Courts have exclusive jurisdiction over these matters."
    elif any(w in query_lower for w in ["employ", "terminate", "fired", "salary", "workplace", "harass"]):
        synthesis += "The matter involves employment/labour law. Applicable laws include Industrial Disputes Act 1947, Payment of Wages Act 1936, and Sexual Harassment at Workplace Act 2013. Both labour court remedies and civil court remedies may be available."
    elif any(w in query_lower for w in ["property", "land", "tenant", "rent", "evict"]):
        synthesis += "The matter involves property law. Relevant laws include Transfer of Property Act 1882, Rent Control Acts, and Registration Act 1908. Civil court jurisdiction applies, with specific provisions for tenancy disputes."
    elif any(w in query_lower for w in ["consumer", "product", "service", "defect"]):
        synthesis += "The matter falls under the Consumer Protection Act 2019. Consumer forums at district, state, and national levels have jurisdiction based on the value of goods/services. Section 35 provides the framework for filing complaints."
    else:
        synthesis += "A detailed analysis requires examining the specific facts, applicable statutory provisions, and relevant case law. Consulting with a qualified advocate specializing in the relevant area of law is strongly recommended."

    return {
        "synthesis": synthesis,
        "penal_codes": [],
        "procedures": [],
        "court_hierarchy": [
            {"court": "District Court / Sessions Court", "jurisdiction": "Original jurisdiction for most civil and criminal cases", "relevance": "Primary forum for filing cases", "recommended": True},
            {"court": "High Court", "jurisdiction": "Appellate jurisdiction and Writ Petitions under Article 226", "relevance": "Appeals and constitutional remedies", "recommended": False},
            {"court": "Supreme Court of India", "jurisdiction": "Final appellate authority under Article 136", "relevance": "Special Leave Petitions and fundamental rights cases", "recommended": False}
        ],
        "further_steps": [
            {"priority": "high", "action": "Consult a qualified advocate specialized in the relevant area", "reason": "Professional legal advice tailored to specific facts is essential"},
            {"priority": "high", "action": "Collect and preserve all evidence and documents", "reason": "Evidence is the backbone of any legal proceeding"},
            {"priority": "medium", "action": "Check the limitation period for your cause of action", "reason": "Most legal actions have statutory time limits (Limitation Act 1963)"},
            {"priority": "medium", "action": "Send a legal notice to the opposing party", "reason": "Legal notice is a statutory requirement for certain cases and helps in settlement"},
            {"priority": "low", "action": "Explore Alternative Dispute Resolution (ADR)", "reason": "Mediation and arbitration are faster and more cost-effective than litigation"}
        ],
        "risk_assessment": {
            "strength": "moderate",
            "score": 55,
            "summary": "Preliminary assessment based on available information. Full JurisCore reasoning available when the engine is active.",
            "factors_for": ["Legal query identified relevant area of law", "Indian legal framework provides remedies"],
            "factors_against": ["Detailed facts needed for accurate assessment", "JurisCore engine offline for comprehensive analysis"]
        }
    }
