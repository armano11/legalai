"""
Scrapling-powered web research service for LegalForge.
Provides Perplexity-style web search with full content extraction using Scrapling's adaptive fetchers.
Replaces the legacy Firecrawl service and consolidates all web search logic.
"""
import logging
import re
import requests
from html import unescape
from urllib.parse import parse_qs, unquote, urlparse
from scrapling.fetchers import Fetcher

logger = logging.getLogger(__name__)

FETCH_TIMEOUT = 15
MAX_CONTENT_LENGTH = 5000


# ─── DuckDuckGo Search ─────────────────────────────────────────────────────

def _web_session() -> requests.Session:
    session = requests.Session()
    session.trust_env = False
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    })
    return session


def _flatten_related_topics(items: list, limit: int) -> list:
    flattened = []
    for item in items:
        if len(flattened) >= limit:
            break
        if isinstance(item, dict) and item.get("Text"):
            flattened.append(item)
            continue
        if isinstance(item, dict) and isinstance(item.get("Topics"), list):
            for nested in item["Topics"]:
                if isinstance(nested, dict) and nested.get("Text"):
                    flattened.append(nested)
                if len(flattened) >= limit:
                    break
    return flattened[:limit]


def _normalize_result_url(url: str) -> str:
    if not url:
        return ""
    clean = unescape(url.strip())
    if clean.startswith("//"):
        clean = f"https:{clean}"
    parsed = urlparse(clean)
    if "duckduckgo.com" in parsed.netloc and parsed.path.startswith("/l/"):
        target = parse_qs(parsed.query).get("uddg", [""])[0]
        if target:
            return unquote(target)
    return clean


def duckduckgo_search(query: str, max_results: int = 5) -> list:
    """Search DuckDuckGo for legal queries. Returns list of result dicts."""
    results = []
    try:
        session = _web_session()
        resp = session.get(
            "https://api.duckduckgo.com/",
            params={"q": f"{query} Indian law legal", "format": "json", "no_html": 1, "skip_disambig": 1},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("AbstractText"):
                results.append({
                    "title": data.get("Heading", "Legal Reference"),
                    "snippet": data["AbstractText"][:500],
                    "source": data.get("AbstractSource", "DuckDuckGo"),
                    "url": data.get("AbstractURL", "")
                })
            for topic in _flatten_related_topics(data.get("RelatedTopics", []), max_results):
                if isinstance(topic, dict) and topic.get("Text"):
                    results.append({
                        "title": topic.get("Text", "")[:100],
                        "snippet": topic.get("Text", "")[:400],
                        "source": "DuckDuckGo",
                        "url": _normalize_result_url(topic.get("FirstURL", ""))
                    })
    except Exception as e:
        logger.warning(f"DuckDuckGo API search failed: {e}")

    if results:
        return results[:max_results]

    try:
        session = _web_session()
        resp = session.get(
            "https://html.duckduckgo.com/html/",
            params={"q": f"{query} Indian law legal"},
            timeout=10,
        )
        if resp.status_code == 200:
            html = resp.text
            matches = re.findall(
                r'nofollow" class="result__a" href="(?P<url>[^"]+)">(?P<title>.*?)</a>.*?<a class="result__snippet"[^>]*>(?P<snippet>.*?)</a>',
                html,
                flags=re.DOTALL,
            )
            for url, title, snippet in matches[:max_results]:
                clean_title = re.sub(r"<.*?>", "", title).strip()
                clean_snippet = re.sub(r"<.*?>", "", snippet).strip()
                if clean_title and clean_snippet:
                    results.append({
                        "title": clean_title[:120],
                        "snippet": clean_snippet[:500],
                        "source": "DuckDuckGo",
                        "url": _normalize_result_url(url),
                    })
    except Exception as e:
        logger.warning(f"DuckDuckGo HTML fallback failed: {e}")

    return results[:max_results]


# ─── Scrapling Content Extraction ──────────────────────────────────────────

def _element_text(element) -> str:
    """Extract all text from a Scrapling element."""
    try:
        t = element.css("::text")
        if t:
            parts = t.getall()
            return " ".join(parts) if parts else ""
    except Exception:
        pass
    return str(element).strip()


def _extract_readable_text(page) -> str:
    """Extract the main readable content from a Scrapling page."""
    for selector in ("article", "main", '[role="main"]', ".post-content", ".entry-content",
                     "#content", ".content", ".article-body", "body"):
        try:
            elements = page.css(selector)
            if elements:
                texts = [_element_text(el) for el in elements]
                text = " ".join(texts)
                text = re.sub(r'\s+', ' ', text).strip()
                if len(text) > 200:
                    return text[:MAX_CONTENT_LENGTH]
        except Exception:
            continue
    try:
        body_el = page.css("body")
        if body_el:
            texts = [_element_text(el) for el in body_el]
            text = " ".join(texts)
            text = re.sub(r'\s+', ' ', text).strip()
            return text[:MAX_CONTENT_LENGTH]
    except Exception as e:
        logger.warning("Body text extraction failed: %s", e)
    return ""


def _extract_title(page) -> str:
    """Extract page title."""
    try:
        title_el = page.css("title")
        if title_el:
            t = _element_text(title_el[0])
            return t.strip()[:200]
    except Exception:
        pass
    return ""


def scrapling_fetch_page(url: str) -> dict:
    """Fetch a URL using Scrapling's adaptive fetcher and extract readable content.

    Returns dict with title, url, snippet, markdown (full text), source.
    """
    if not url or not url.startswith("http"):
        return {}

    try:
        page = Fetcher.get(url, timeout=FETCH_TIMEOUT)
        if not page or page.status >= 400:
            logger.warning("Scrapling fetch failed (%s) for %s", getattr(page, "status", "?"), url)
            return {}

        title = _extract_title(page)

        text = _extract_readable_text(page)
        if not text:
            return {}

        return {
            "title": title,
            "url": url,
            "snippet": text[:500],
            "markdown": text,
            "source": "Scrapling",
        }
    except Exception as e:
        logger.warning("Scrapling fetch error for %s: %s", url, e)
    return {}


def scrapling_web_search(query: str, max_results: int = 5) -> list:
    """Perplexity-style web research: DuckDuckGo search + Scrapling full-content extraction.

    Returns list of enriched result dicts with full content extracted.
    """
    results = duckduckgo_search(query, max_results=max_results)
    if not results:
        return []

    enriched = []
    for result in results[:max_results]:
        url = result.get("url", "")
        if not url:
            continue
        fetched = scrapling_fetch_page(url)
        if fetched:
            enriched.append(fetched)
        else:
            enriched.append(result)

    if not enriched:
        return results

    return enriched


def web_search(query: str, max_results: int = 5) -> list:
    """Fast web search: DuckDuckGo + Scrapling enrichment of the top result only.

    Designed as a lightweight drop-in for RAG pipeline usage.
    """
    results = duckduckgo_search(query, max_results=max_results)
    if not results:
        return []

    try:
        top_url = results[0].get("url", "")
        if top_url:
            enriched = scrapling_fetch_page(top_url)
            if enriched:
                results[0] = {
                    **results[0],
                    "snippet": enriched.get("snippet") or results[0].get("snippet", ""),
                    "source": "Scrapling",
                    "url": enriched.get("url") or top_url,
                    "markdown": enriched.get("markdown", ""),
                }
    except Exception as e:
        logger.warning("Scrapling enrichment failed: %s", e)

    return results[:max_results]


def perplexity_search(query: str, max_results: int = 5) -> list:
    """Full Perplexity-style research: search, extract full content from top sources.

    Returns a list of dicts with title, url, snippet, markdown, source.
    Best used as input to an LLM for synthesis into a research answer.
    """
    return scrapling_web_search(query, max_results=max_results)


# ─── Deep Research (5-Person Research Team) ────────────────────────────────

def _generate_query_variations(query: str) -> list[str]:
    """Person 1: Generate 3-4 search angles from the original query."""
    variations = [query]
    words = [w for w in query.split() if len(w) > 2]

    # Variation 2: Add "legal analysis" framing
    if not any(w in query.lower() for w in ["legal", "law", "judgment", "case"]):
        variations.append(f"legal analysis {query}")

    # Variation 3: Key terms only (remove stop words)
    stop_words = {"what", "when", "where", "why", "how", "the", "of", "in", "for", "and", "to", "a", "is", "are", "was", "were", "has", "have", "been", "its", "their", "with", "from"}
    key_terms = [w for w in words if w.lower() not in stop_words]
    if key_terms:
        variations.append(" ".join(key_terms[:6]))

    # Variation 4: Indian law framing
    if "india" not in query.lower():
        variations.append(f"{query} Indian Supreme Court")

    return variations[:4]


def _extract_links_from_page(text: str, base_url: str, max_links: int = 3) -> list[str]:
    """Person 3's assistant: extract citation/reference links from fetched content."""
    links = set()
    # Find URLs in text
    urls = re.findall(r'https?://[^\s<>"\')\]]+', text)
    for url in urls[:max_links * 5]:
        try:
            parsed = urlparse(url)
            # Skip same-domain navigation pages, ads, social media
            path = parsed.path.lower()
            if any(skip in path for skip in ["/tag/", "/category/", "/author/", "/page/", "#", "facebook", "twitter"]):
                continue
            # Prefer legal content paths
            if any(kw in path for kw in ["/judgment", "/case", "/law", "/legal", "/article", "/blog", "/opinion", "/ruling", "/verdict", "/analysis", "/commentary"]):
                links.add(url)
        except Exception:
            continue
    return list(links)[:max_links]


def _deepen_on_sources(sources: list[dict], max_new: int = 8) -> list[dict]:
    """Person 3: Deep dive — follow reference links from top sources."""
    if not sources:
        return []

    new_sources = []
    seen_urls = {s.get("url", "") for s in sources if s.get("url")}

    for src in sources:
        if len(new_sources) >= max_new:
            break
        text = src.get("markdown") or src.get("snippet", "")
        base_url = src.get("url", "")
        if not text or not base_url:
            continue

        candidate_links = _extract_links_from_page(text, base_url, max_links=2)
        for link in candidate_links:
            if link in seen_urls:
                continue
            seen_urls.add(link)
            fetched = scrapling_fetch_page(link)
            if fetched and fetched.get("markdown"):
                logger.info("Deepened: %s", link)
                new_sources.append(fetched)
            if len(new_sources) >= max_new:
                break

    return new_sources


def _thematic_discovery(query: str, existing_text: str, max_sources: int = 8) -> list[dict]:
    """Person 4: Thematic expansion — discover adjacent legal topics."""
    # Extract legal entities (case names, statutes, court names) from discovered content
    entities = set()
    # Find statute/case references like "IPC 302", "CrPC 154", "Article 21"
    for match in re.findall(r'(?:IPC|CrPC|Article|Section|Act|BNS|BNSS)\s+\d+[A-Za-z]?', existing_text, re.IGNORECASE):
        entities.add(match[:30])

    # Generate thematic queries from discovered entities
    thematic_queries = []
    for entity in list(entities)[:3]:
        thematic_queries.append(f"{entity} {query}")

    # If no entities found, try key phrase expansion
    if not thematic_queries:
        words = [w for w in query.split() if len(w) > 3]
        if len(words) >= 3:
            for i in range(min(2, len(words) - 2)):
                phrase = " ".join(words[i:i+3])
                thematic_queries.append(f"{phrase} legal analysis")

    all_new = []
    seen_urls = set()
    for tq in thematic_queries:
        if len(all_new) >= max_sources:
            break
        results = duckduckgo_search(tq, max_results=4)
        for r in results:
            url = r.get("url", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            fetched = scrapling_fetch_page(url)
            if fetched and fetched.get("markdown"):
                all_new.append(fetched)
            if len(all_new) >= max_sources:
                break

    return all_new


def _llm_synthesis_report(query: str, all_sources: list[dict], max_synthesis_chars: int = 40000) -> str:
    """Person 5: Editor — produce a structured legal research report from all sources."""
    from ai.llm_fallback import _call_neural_node

    # Compile source content into a compact context
    context_parts = []
    for i, src in enumerate(all_sources, 1):
        text = src.get("markdown") or src.get("snippet", "")
        if not text:
            continue
        title = src.get("title", f"Source {i}")
        url = src.get("url", "")
        context_parts.append(f"[{i}] {title}\nURL: {url}\n{text[:2000]}\n")

    context_str = "\n".join(context_parts)[:max_synthesis_chars]

    system_prompt = (
        "You are a senior legal research analyst at a top Indian law firm. "
        "You have been given a research query and a collection of web sources. "
        "Produce a comprehensive, structured legal research report in Markdown. "
        "Use the following structure:\n\n"
        "## Executive Summary\n_Brief 2-3 sentence overview._\n\n"
        "## Key Findings\n_Discuss the main legal principles, rulings, or statutory provisions found._\n\n"
        "## Source-by-Source Analysis\n_For each source, note what it contributes: case holdings, statutory text, procedural guidance._\n\n"
        "## Synthesis & Conclusions\n_Synthesize across sources — where do they agree, where do they diverge? What is the overall legal position?_\n\n"
        "## References\n_Numbered list of all sources with URLs._\n\n"
        "Be specific. Cite sources by [number]. Do not fabricate case citations or statutory text."
    )

    user_prompt = f"Research Query: {query}\n\nSources:\n{context_str}"

    try:
        report = _call_neural_node(
            f"{system_prompt}\n\n{user_prompt}",
            max_tokens=4000,
            total_timeout_s=60
        )
        if report:
            return report
    except Exception as e:
        logger.warning("LLM synthesis failed: %s", e)

    return _build_fallback_synthesis(query, all_sources)


def _build_fallback_synthesis(query: str, all_sources: list[dict]) -> str:
    """Fallback when LLM is unavailable — produce a structured summary from sources."""
    lines = []
    lines.append("## Executive Summary")
    lines.append(f"Deep research was conducted for: **{query}**. ")
    lines.append(f"A total of **{len(all_sources)} sources** were discovered and analyzed across multiple search angles and iterative deepening. ")
    lines.append("LLM synthesis was unavailable; this report is a structured compilation of discovered content.\n")

    lines.append("## Key Findings")
    lines.append("The following sources were identified as relevant to the query:\n")

    for i, src in enumerate(all_sources, 1):
        title = src.get("title", f"Source {i}")
        snippet = (src.get("markdown") or src.get("snippet", ""))[:300]
        url = src.get("url", "")
        lines.append(f"### {i}. {title}")
        lines.append(f"**URL:** {url}")
        lines.append(f"{snippet}...\n")

    lines.append("## References")
    for i, src in enumerate(all_sources, 1):
        lines.append(f"{i}. [{src.get('title', f'Source {i}')}]({src.get('url', '')})")

    return "\n".join(lines)


# ─── Deep Research Task Management ──────────────────────────────────────────

import threading
import uuid
import time as time_module

_deep_tasks: dict[str, dict] = {}
_deep_lock = threading.Lock()

def _update_task(task_id: str, **kwargs):
    with _deep_lock:
        if task_id in _deep_tasks:
            _deep_tasks[task_id].update(kwargs)


def start_deep_research(query: str, max_sources: int = 30) -> str:
    """Launch deep research in a background thread. Returns task_id for polling."""
    task_id = f"deep_{uuid.uuid4().hex[:12]}"
    with _deep_lock:
        _deep_tasks[task_id] = {
            "task_id": task_id,
            "query": query,
            "status": "starting",
            "progress": 0,
            "phase": "Initializing",
            "sources_found": 0,
            "synthesis": None,
            "all_sources": [],
            "error": None,
            "started_at": time_module.time(),
        }

    def _run():
        try:
            _run_deep_research(task_id, query, max_sources)
        except Exception as e:
            logger.exception("Deep research task %s failed", task_id)
            _update_task(task_id, status="failed", error=str(e))

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return task_id


def get_deep_task(task_id: str) -> dict | None:
    with _deep_lock:
        return _deep_tasks.get(task_id)


def _run_deep_research(task_id: str, query: str, max_sources: int):
    """Execute the 5-person research pipeline."""
    all_sources = []
    seen_urls = set()

    # ── Phase 1: Broad Discovery (Person 1) ──
    _update_task(task_id, status="running", phase="Broad Discovery — generating search angles", progress=5)
    variations = _generate_query_variations(query)
    logger.info("Phase 1: %d query variations", len(variations))

    phase1_results = []
    for i, vq in enumerate(variations):
        _update_task(task_id, progress=5 + (i * 5), phase=f"Searching: \"{vq[:60]}...\"")
        results = duckduckgo_search(vq, max_results=5)
        for r in results:
            url = r.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                phase1_results.append(r)

    # ── Phase 2: Content Extraction (Person 2) ──
    _update_task(task_id, phase="Deep Content Extraction — reading all sources", progress=25)
    extracted = []
    for i, r in enumerate(phase1_results[:max_sources]):
        url = r.get("url", "")
        if not url:
            continue
        _update_task(task_id, progress=25 + int((i / max(1, len(phase1_results))) * 20),
                     sources_found=i)
        fetched = scrapling_fetch_page(url)
        if fetched and fetched.get("markdown"):
            extracted.append(fetched)
        time_module.sleep(0.1)  # polite crawl delay

    all_sources.extend(extracted)
    _update_task(task_id, sources_found=len(all_sources))

    # ── Phase 3: Iterative Deepening (Person 3) ──
    _update_task(task_id, phase="Iterative Deepening — following reference links", progress=50)
    deepened = _deepen_on_sources(extracted, max_new=8)
    for src in deepened:
        url = src.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            all_sources.append(src)

    _update_task(task_id, sources_found=len(all_sources))

    # ── Phase 4: Thematic Expansion (Person 4) ──
    _update_task(task_id, phase="Thematic Expansion — discovering adjacent topics", progress=65)
    combined_text = " ".join([s.get("markdown") or s.get("snippet", "") for s in all_sources])
    thematic = _thematic_discovery(query, combined_text, max_sources=8)
    for src in thematic:
        url = src.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            all_sources.append(src)

    _update_task(task_id, sources_found=len(all_sources))
    all_sources = all_sources[:max_sources]

    # Deduplicate by URL
    seen = set()
    unique_sources = []
    for s in all_sources:
        u = s.get("url", "")
        if u and u not in seen:
            seen.add(u)
            unique_sources.append(s)
    all_sources = unique_sources

    # ── Phase 5: LLM Synthesis (Person 5) ──
    _update_task(task_id, phase="Legal Synthesis — producing final report from all sources", progress=85)
    synthesis = _llm_synthesis_report(query, all_sources)

    _update_task(
        task_id,
        status="completed",
        phase="Complete",
        progress=100,
        synthesis=synthesis,
        all_sources=all_sources,
    )
    logger.info("Deep research completed: %d sources, %d chars synthesis", len(all_sources), len(synthesis))
