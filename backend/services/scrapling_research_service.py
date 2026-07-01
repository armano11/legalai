"""
Scrapling-powered web research service for JurisAI.
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
