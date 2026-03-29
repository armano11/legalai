"""
Download and structure 3 HuggingFace Indian Legal Datasets.

Datasets:
  1. santoshtyss/indian_courts_cases  (28,816 rows - raw judgments)
  2. maheshCoder/indian_court_cases   (8,000 rows  - structured cases)
  3. ThanniruVenkata/Indian_Laws_Structured_Legal_Dataset (2,158 rows - statute sections)

Usage:
  python scripts/download_hf_datasets.py                    # default: 500 judgments, all cases & laws
  python scripts/download_hf_datasets.py --max-rows 2000    # first 2000 judgments
  python scripts/download_hf_datasets.py --max-rows 0       # ALL rows (28K+ judgments — slow)
"""

import os
import sys
import re
import json
import time
import argparse
import requests

# --- Config ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "backend", "legal_data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

HF_API = "https://datasets-server.huggingface.co/rows"
BATCH_SIZE = 100  # HuggingFace API max per request

DATASETS = {
    "judgments": {
        "dataset": "santoshtyss/indian_courts_cases",
        "output": "hf_court_judgments.json",
        "default_max": 500,  # large dataset — limit by default
    },
    "cases": {
        "dataset": "maheshCoder/indian_court_cases",
        "output": "hf_court_cases.json",
        "default_max": 0,  # 0 = fetch all
    },
    "laws": {
        "dataset": "ThanniruVenkata/Indian_Laws_Structured_Legal_Dataset",
        "output": "hf_indian_laws.json",
        "default_max": 0,
    },
}


def fetch_rows(dataset_id: str, max_rows: int = 0) -> list:
    """Paginate through the HuggingFace dataset rows API."""
    all_rows = []
    offset = 0
    while True:
        if max_rows > 0 and offset >= max_rows:
            break
        length = min(BATCH_SIZE, max_rows - offset) if max_rows > 0 else BATCH_SIZE
        params = {
            "dataset": dataset_id,
            "config": "default",
            "split": "train",
            "offset": offset,
            "length": length,
        }
        try:
            resp = requests.get(HF_API, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            rows = data.get("rows", [])
            if not rows:
                break
            for r in rows:
                all_rows.append(r["row"])
            print(f"  Fetched {len(all_rows)} rows...", end="\r")
            offset += len(rows)
            if len(rows) < length:
                break  # no more rows
            time.sleep(0.2)  # polite rate limiting
        except requests.exceptions.HTTPError as e:
            print(f"\n  HTTP error at offset {offset}: {e}")
            break
        except Exception as e:
            print(f"\n  Error at offset {offset}: {e}")
            time.sleep(1)
            continue
    print(f"  Fetched {len(all_rows)} rows total.       ")
    return all_rows


# ──────────────────────────────────────────────
# Structuring functions — normalize raw data
# ──────────────────────────────────────────────

def _extract_judgment_metadata(text: str, idx: int) -> dict:
    """Parse raw judgment text to extract structured metadata."""
    text_clean = text.strip()

    # Try to extract case title from first lines
    lines = text_clean.split("\n")
    title = "Unknown Case"
    court = "Unknown Court"
    year = "Unknown"

    # Heuristics for court
    text_upper = text_clean[:500].upper()
    if "SUPREME COURT" in text_upper:
        court = "Supreme Court of India"
    elif "HIGH COURT" in text_upper:
        # Try to find which HC
        hc_match = re.search(r'HIGH COURT OF (\w+)', text_upper)
        court = f"High Court of {hc_match.group(1).title()}" if hc_match else "High Court"
    elif "DISTRICT COURT" in text_upper:
        court = "District Court"
    elif "TRIBUNAL" in text_upper:
        court = "Tribunal"

    # Try to extract year from text
    year_matches = re.findall(r'\b(19[5-9]\d|20[0-2]\d)\b', text_clean[:1000])
    if year_matches:
        year = year_matches[0]

    # Title: try "X v. Y" or "X vs Y" pattern
    vs_match = re.search(r'([A-Z][A-Za-z\s\.]+)\s+(?:v\.|vs\.?|versus)\s+([A-Z][A-Za-z\s\.]+)', text_clean[:500])
    if vs_match:
        title = f"{vs_match.group(1).strip()} v. {vs_match.group(2).strip()}"
    else:
        # Use first non-empty line as title
        for line in lines[:5]:
            line = line.strip()
            if len(line) > 10 and not line.startswith("IN THE"):
                title = line[:120]
                break

    # Build summary (first 600 chars, cleaned)
    summary = re.sub(r'\s+', ' ', text_clean[:600]).strip()

    return {
        "id": f"hf_judgment_{idx}",
        "case_title": title[:150],
        "court": court,
        "year": year,
        "summary": summary,
        "full_text": text_clean,
        "data_type": "hf_judgment",
        "source_dataset": "santoshtyss/indian_courts_cases",
    }


def structure_judgments(rows: list) -> list:
    """Structure raw judgment texts into metadata-rich records."""
    structured = []
    for i, row in enumerate(rows):
        text = row.get("text", "")
        if not text or len(text.strip()) < 50:
            continue
        record = _extract_judgment_metadata(text, i)
        structured.append(record)
    return structured


def structure_cases(rows: list) -> list:
    """Structure the already-structured court cases dataset."""
    structured = []
    for i, row in enumerate(rows):
        case_desc = row.get("Case Description", "") or ""
        if not case_desc:
            continue
        structured.append({
            "id": row.get("Case ID", f"hf_case_{i}"),
            "case_title": f"Case {row.get('Case ID', i)} — {row.get('Case Type', 'General')}",
            "case_type": row.get("Case Type", "Unknown"),
            "case_status": row.get("Case Status", "Unknown"),
            "filing_date": row.get("Filing Date", ""),
            "judge": row.get("Judge", "Unknown"),
            "witness": row.get("Witness", ""),
            "court_location": row.get("Court Location", "Unknown"),
            "description": case_desc,
            "data_type": "hf_case",
            "source_dataset": "maheshCoder/indian_court_cases",
        })
    return structured


def structure_laws(rows: list) -> list:
    """Structure the Indian Laws dataset into searchable records."""
    structured = []
    for i, row in enumerate(rows):
        # DS3 can have different text fields depending on the split/version
        text = (
            row.get("text") or 
            row.get("act_content") or 
            row.get("content") or 
            row.get("law_text") or 
            ""
        )
        if not text or len(str(text).strip()) < 10:
            continue
        
        structured.append({
            "id": row.get("doc_id", f"hf_law_{i}"),
            "act_name": row.get("act_name", "Unknown Act"),
            "section": row.get("section", ""),
            "chapter_name": row.get("chapter_name", ""),
            "chapter_subtype": row.get("chapter_subtype", ""),
            "text": str(text).strip(),
            "chunk_index": int(row.get("chunk_index", 0)) if row.get("chunk_index") else 0,
            "total_chunks": int(row.get("total_chunks", 1)) if row.get("total_chunks") else 1,
            "data_type": "hf_law",
            "source_dataset": "ThanniruVenkata/Indian_Laws_Structured_Legal_Dataset",
        })
    return structured


def save_json(data: list, filename: str):
    """Save structured data as pretty-printed JSON."""
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    size_mb = os.path.getsize(path) / (1024 * 1024)
    print(f"  Saved {len(data)} records to {path} ({size_mb:.1f} MB)")


def main():
    parser = argparse.ArgumentParser(description="Download HuggingFace Indian Legal Datasets")
    parser.add_argument("--max-rows", type=int, default=None,
                        help="Max rows for judgments dataset (default: 500, 0=all)")
    parser.add_argument("--only", type=str, default=None,
                        choices=["judgments", "cases", "laws"],
                        help="Download only one specific dataset")
    args = parser.parse_args()

    print("=" * 60)
    print("  HuggingFace Indian Legal Dataset Downloader")
    print("=" * 60)

    targets = [args.only] if args.only else ["judgments", "cases", "laws"]

    for key in targets:
        ds = DATASETS[key]
        max_r = ds["default_max"]
        if key == "judgments" and args.max_rows is not None:
            max_r = args.max_rows

        label = f"ALL" if max_r == 0 else f"max {max_r}"
        print(f"\n[{key.upper()}] Downloading {ds['dataset']} ({label} rows)...")

        rows = fetch_rows(ds["dataset"], max_rows=max_r)
        if not rows:
            print(f"  No data fetched for {key}. Skipping.")
            continue

        # Structure the data
        if key == "judgments":
            structured = structure_judgments(rows)
        elif key == "cases":
            structured = structure_cases(rows)
        elif key == "laws":
            structured = structure_laws(rows)

        save_json(structured, ds["output"])

    print("\n" + "=" * 60)
    print("  Download complete!")
    print("=" * 60)
    print(f"\nFiles saved to: {OUTPUT_DIR}")
    print("Run the backend server to auto-ingest into the RAG vector store.")


if __name__ == "__main__":
    main()
