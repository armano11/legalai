import os
import json
import logging
import requests
from config import FIRECRAWL_BASE_URL, FIRECRAWL_API_KEY, FIRECRAWL_SEARCH_LIMIT, FIRECRAWL_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)

def firecrawl_search(query: str, max_results: int = FIRECRAWL_SEARCH_LIMIT) -> list:
    """Search the web using Firecrawl API."""
    if not FIRECRAWL_BASE_URL:
        return []
    
    url = f"{FIRECRAWL_BASE_URL}/v2/search"
    headers = {
        "Content-Type": "application/json"
    }
    if FIRECRAWL_API_KEY:
        headers["Authorization"] = f"Bearer {FIRECRAWL_API_KEY}"
        
    payload = {
        "query": query,
        "limit": max_results
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=FIRECRAWL_TIMEOUT_SECONDS)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                results = []
                payload = data.get("data", [])
                items = payload if isinstance(payload, list) else payload.get("web", [])
                for item in items:
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": item.get("description", item.get("markdown", ""))[:500],
                        "markdown": item.get("markdown", ""),
                        "source": "Firecrawl"
                    })
                return results
        else:
            logger.warning("Firecrawl search failed (%s): %s", resp.status_code, resp.text[:300])
    except Exception as e:
        logger.warning(f"Firecrawl search error: {e}")
        
    return []

def native_scrape_fallback(url: str) -> dict:
    """A clean, native fallback scraper that works when Firecrawl is down."""
    logger.info(f"Using native fallback scraper for: {url}")
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            # Basic HTML extraction (ideally would use BeautifulSoup/Trafilatura here)
            # For now, we'll return the text as a placeholder or use a regex to clean it
            import re
            text = resp.text
            # Remove scripts and styles
            text = re.sub(r'<script\b[^>]*>([\s\S]*?)<\/script>', '', text)
            text = re.sub(r'<style\b[^>]*>([\s\S]*?)<\/style>', '', text)
            # Get body content
            body_match = re.search(r'<body[^>]*>([\s\S]*?)<\/body>', text, re.IGNORECASE)
            if body_match:
                text = body_match.group(1)
            # Remove tags
            clean_text = re.sub(r'<[^>]+>', ' ', text)
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()
            
            return {
                "title": "Web Resource (Native)",
                "url": url,
                "snippet": clean_text[:500],
                "markdown": clean_text,
                "source": "NativeFallback"
            }
    except Exception as e:
        logger.warning(f"Native fallback scraper failed: {e}")
    return {}

def firecrawl_scrape(url: str) -> dict:
    """Scrape a specific URL using Firecrawl API with Native Fallback."""
    if not FIRECRAWL_BASE_URL:
        return native_scrape_fallback(url)
        
    api_url = f"{FIRECRAWL_BASE_URL}/v1/scrape"
    headers = {
        "Content-Type": "application/json"
    }
    if FIRECRAWL_API_KEY:
        headers["Authorization"] = f"Bearer {FIRECRAWL_API_KEY}"
        
    payload = {
        "url": url,
        "formats": ["markdown"]
    }
    
    try:
        resp = requests.post(api_url, headers=headers, json=payload, timeout=FIRECRAWL_TIMEOUT_SECONDS)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                item = data.get("data", {})
                return {
                    "title": item.get("title", ""),
                    "url": item.get("url", url),
                    "snippet": item.get("description", item.get("markdown", ""))[:500],
                    "markdown": item.get("markdown", ""),
                    "source": "Firecrawl"
                }
        else:
            logger.warning("Firecrawl scrape failed (%s): %s", resp.status_code, resp.text[:300])
    except requests.exceptions.ConnectionError:
        logger.error("Firecrawl local engine is not running on port 3002. Use `docker compose up` in external/firecrawl.")
    except Exception as e:
        logger.warning(f"Firecrawl scrape error: {e}")
        
    # Final fallback if Firecrawl fails
    return native_scrape_fallback(url)
