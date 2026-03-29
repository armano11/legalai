import requests, json

url = "https://datasets-server.huggingface.co/rows"
params = {"dataset": "ThanniruVenkata/Indian_Laws_Structured_Legal_Dataset", "config": "default", "split": "train", "offset": 0, "length": 1}
r = requests.get(url, params=params, timeout=15)
d = r.json()

if "rows" in d and d["rows"]:
    row = d["rows"][0]["row"]
    print("ALL KEYS (REPR):", [repr(k) for k in row.keys()])
    print("-" * 50)
    for k, v in row.items():
        if "text" in k:
            print(f"MATCHED KEY: {repr(k)}")
            print(f"VALUE TYPE: {type(v)}")
            print(f"VALUE LEN: {len(str(v)) if v else 0}")
            print(f"VALUE REPR: {repr(v)[:200]}")
else:
    print("NO ROWS")
