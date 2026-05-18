import sys
import os
import json

# Add the current directory to sys.path so we can import from ai and config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai.llm_fallback import _internal_deep_processing

print("\n--- Testing Neural API Connection (Perplexity Style Output) ---")
try:
    result = _internal_deep_processing("Explain IPC Section 420 in 3 sentences")
    print("\n[SUCCESS] AI engine returned the following JSON synthesis:")
    print("---------------------------------------------------------")
    print(json.dumps(result, indent=2)[:800] + "...\n[TRUNCATED FOR LENGTH]")
except Exception as e:
    print(f"\n[ERROR] Test failed: {e}")
