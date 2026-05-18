"""Test OpenRouter Connection."""
import sys
import os

# Add the current directory to sys.path so we can import from the backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai.llm_fallback import _call_neural_node

if __name__ == "__main__":
    print("Testing OpenRouter API...")
    result = _call_neural_node("Explain res judicata in one sentence.", max_tokens=100)
    if result:
        print("SUCCESS! Output:")
        print(result)
    else:
        print("FAILED to get a response from OpenRouter.")
