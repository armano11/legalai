import requests, json

url = "https://datasets-server.huggingface.co/rows"
params = {"dataset": "ThanniruVenkata/Indian_Laws_Structured_Legal_Dataset", "config": "default", "split": "train", "offset": 0, "length": 1}
r = requests.get(url, params=params, timeout=15)
d = r.json()

if "rows" in d and d["rows"]:
    row = d["rows"][0]["row"]
    print("KEYS_LIST:", json.dumps(list(row.keys())))
    print("-" * 50)
    for k, v in row.items():
        print(f"KEY: {k} | TYPE: {type(v).__name__} | LEN: {len(str(v)) if v else 0}")
        print(f"  PREVIEW: {repr(v)[:200]}")
else:
    print("NO ROWS")
