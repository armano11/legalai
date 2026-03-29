import asyncio
import json
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai.rag_pipeline import search_legal
from ai.llm_fallback import generate_deep_research

async def test_research_quality(query, log_file):
    log_file.write(f"\n{'='*60}\n")
    log_file.write(f"Testing Query: {query}\n")
    log_file.write(f"{'='*60}\n")
    
    results = search_legal(query)
    log_file.write(f"\n[1] RAG Search Results:\n")
    log_file.write(f"Source: {results.get('source')}\n")
    log_file.write(f"Total Results: {results.get('total')}\n")
    
    log_file.write(f"\n[2] Matched IPC Sections:\n")
    for ipc in results.get('penal_codes', []):
        log_file.write(f"- {ipc['code']}: {ipc['title']} ({ipc['severity']})\n")
        
    log_file.write(f"\n[3] Synthesis Preview (First 200 chars):\n")
    log_file.write(results.get('synthesis', '')[:200] + "...\n")
    
    query_lower = query.lower()
    is_business = any(k in query_lower for k in ["business", "partner", "fraud", "contract", "payment"])
    
    if is_business:
        irrelevant_keywords = ["rape", "sexual", "theft", "murder"]
        found_irrelevant = [k for k in irrelevant_keywords if k in str(results.get('penal_codes', [])).lower()]
        if found_irrelevant:
            log_file.write(f"\n[!] WARNING: Found potentially irrelevant IPC categories: {found_irrelevant}\n")
        else:
            log_file.write("\n[✓] Results seem relevant at a quick glance.\n")

if __name__ == "__main__":
    queries = [
        "Business partnership dispute involving unauthorized fund transfers and embezzlement",
        "Property tenant dispute for non-payment of rent"
    ]
    
    with open("reproduction_results.txt", "w", encoding="utf-8") as f:
        for q in queries:
            asyncio.run(test_research_quality(q, f))
    print("Results written to reproduction_results.txt")
