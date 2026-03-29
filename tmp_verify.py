import requests, json

url = "https://datasets-server.huggingface.co/rows"
params = {"dataset": "ThanniruVenkata/Indian_Laws_Structured_Legal_Dataset", "config": "default", "split": "train", "offset": 0, "length": 3}
r = requests.get(url, params=params, timeout=15)
d = r.json()

# Print full raw JSON of first row
row = d["rows"][0]["row"]
print("ALL KEYS:", list(row.keys()))
print()
for k, v in row.items():
    if isinstance(v, str):
        print(f"{k} (len={len(v)}): {repr(v[:300])}")
    else:
        print(f"{k}: {v}")
