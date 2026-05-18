"""Test frontend-backend proxy connectivity."""
import requests
import json

print("=== FRONTEND HTML ===")
r = requests.get("http://localhost:5173/")
print(f"Status: {r.status_code}, Content-Type: {r.headers.get('content-type')}")
print(f"Contains app root: {'<div id=' in r.text}")
print()

print("=== PROXY TEST: /api/case-insights via frontend port ===")
r2 = requests.get("http://localhost:5173/api/case-insights")
print(f"Status: {r2.status_code}")
data = r2.json()
print(f"Response: {json.dumps(data, indent=2)}")
print()

print("=== PROXY TEST: /api/legal-search via frontend port ===")
r3 = requests.post("http://localhost:5173/api/legal-search", json={"query": "contract law"})
print(f"Status: {r3.status_code}")
print(f"Response keys: {list(r3.json().keys())}")
print()

if r.status_code == 200 and r2.status_code == 200 and r3.status_code == 200:
    print("=== FRONTEND-BACKEND CONNECTIVITY: VERIFIED ===")
else:
    print("=== CONNECTIVITY FAILED ===")
