#!/usr/bin/env python3
import requests
import json
import time

url = "http://localhost:8000/api/research/synthesize"
payload = {
    "query": "Can someone use self defense against a murder charge?",
    "context": "Section 300 IPC defines culpable homicide. Section 335 IPC defines intentional act. Kesavananda Bharati case established constitutional protections."
}

print("Testing NVIDIA GLM-5.1 Synthesis...")
print("=" * 60)
start = time.time()
try:
    response = requests.post(url, json=payload, timeout=180)
    elapsed = time.time() - start
    print(f"✓ Response received in {elapsed:.1f}s")
    print(f"Status: {response.status_code}\n")
    
    data = response.json()
    print(f"Response keys: {list(data.keys())}\n")
    
    if "synthesis" in data:
        syn = data["synthesis"]
        print(f"Synthesis ({len(syn)} chars):")
        print(syn[:400] + "...\n" if len(syn) > 400 else syn + "\n")
    
    if "trace" in data:
        trace = data["trace"]
        print(f"Provider: {trace.get('provider')}")
        print(f"Model: {trace.get('model')}")
        print(f"Status: {trace.get('status')}")
        
except Exception as e:
    elapsed = time.time() - start
    print(f"✗ Error after {elapsed:.1f}s: {type(e).__name__}: {e}")
