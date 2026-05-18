import json, os

base = "backend/legal_data"
files = ["hf_court_judgments.json", "hf_court_cases.json", "hf_indian_laws.json"]

for f in files:
    path = os.path.join(base, f)
    if not os.path.exists(path):
        print(f"{f}: MISSING!")
        continue
    with open(path, encoding="utf-8") as file:
        data = json.load(file)
    size_mb = os.path.getsize(path) / (1024 * 1024)
    print(f"{f}: {len(data)} records, {size_mb:.1f} MB")
    if data:
        print(f"  Keys: {list(data[0].keys())}")
        # Identify name field
        name = data[0].get('case_title') or data[0].get('act_name') or "N/A"
        print(f"  Sample name: {name[:80]}")
    print("-" * 30)
