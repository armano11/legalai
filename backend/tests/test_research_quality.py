import sys
import os
import json

# Add backend to path
sys.path.append(os.path.dirname(__file__))

from ai.rag_pipeline import search_legal

def test_research_quality():
    print("\n--- Testing Legal Research Quality ---")
    
    queries = [
        "murder with self defense plea in India",
        "tenant rights regarding security deposit refund in Bangalore"
    ]
    
    for query in queries:
        print(f"\nQuery: {query}")
        result = search_legal(query)
        
        # 1. Check for expected fields
        required_fields = ["synthesis", "similar_cases", "penal_codes", "procedures", "risk_assessment"]
        missing = [f for f in required_fields if f not in result]
        if missing:
            print(f"FAIL: Missing fields: {missing}")
        else:
            print("PASS: All required fields present.")
            
        # 2. Check synthesis length
        syn = result.get("synthesis", "")
        if len(syn) < 500:
            print(f"FAIL: Synthesis too short ({len(syn)} chars). Expected > 500.")
        else:
            print(f"PASS: Synthesis length is good ({len(syn)} chars).")
            
        # 3. Check for non-empty arrays
        if not result.get("similar_cases"):
            print("FAIL: similar_cases is empty.")
        else:
            print(f"PASS: found {len(result['similar_cases'])} cases.")
            
        if not result.get("penal_codes"):
            print("FAIL: penal_codes is empty.")
        else:
            print(f"PASS: found {len(result['penal_codes'])} penal codes.")

        if not result.get("procedures"):
            print("FAIL: procedures is empty.")
        else:
            print(f"PASS: found {len(result['procedures'])} procedures.")

        # 4. Check Risk Assessment
        risk = result.get("risk_assessment", {})
        if not risk.get("factors_for") or not risk.get("factors_against"):
            print("FAIL: Risk assessment factors are empty.")
        else:
            print("PASS: Risk assessment factors populated.")

if __name__ == "__main__":
    try:
        test_research_quality()
    except Exception as e:
        print(f"CRITICAL ERROR during test: {e}")
        import traceback
        traceback.print_exc()
