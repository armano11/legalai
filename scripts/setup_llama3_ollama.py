import requests
import json
import sys

# ==========================================
# LEGAL FORGE - LOCAL LLA-MA 3 INTEGRATION
# ==========================================
# This script demonstrates how to connect your LegalAI backend
# to Meta's free LLaMA 3 (8B) model running entirely locally via Ollama.
#
# PREREQUISITES:
# 1. Download and install Ollama from https://ollama.com
# 2. Open a terminal and run: `ollama run llama3`
#    (This will download the Meta LLaMA 3 8B model - approx 4.7GB)
# ==========================================

OLLAMA_URL = "http://localhost:11434/api/generate"

def generate_legal_advice(prompt, context=""):
    """
    Calls the local Meta LLaMA 3 model to generate a legal response.
    """
    print("🧠 Connecting to local Meta LLaMA 3...")
    
    # Constructing a robust prompt for the Legal AI
    system_prompt = (
        "You are an expert Indian Legal AI named LegalForge. "
        "You provide accurate, highly structured, and professional legal analysis based on Indian Law. "
        "Always cite the relevant sections of the IPC, CrPC, BNS, or constitutional articles if applicable."
    )
    
    full_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nUser Query: {prompt}\n\nResponse:"

    payload = {
        "model": "llama3",
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": 0.2, # Low temperature for factual legal accuracy
            "top_p": 0.9,
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result.get("response", "No response generated.")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to Ollama.")
        print("Please ensure Ollama is installed and you have run: 'ollama run llama3' in your terminal.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    test_query = "What is the procedure for obtaining anticipatory bail under the new BNSS (Bharatiya Nagarik Suraksha Sanhita)?"
    
    # Optional: Mock context that would normally come from your ChromaDB RAG pipeline
    rag_context = (
        "Under Section 482 of the BNSS (formerly Section 438 of CrPC), any person who has reason to believe "
        "that they may be arrested on an accusation of having committed a non-bailable offence may apply to "
        "the High Court or the Court of Session for a direction that in the event of such arrest, they shall be released on bail."
    )

    print(f"User Query: {test_query}\n")
    
    # Generate response
    response = generate_legal_advice(test_query, rag_context)
    
    print("\n==================================================")
    print("⚖️  LLaMA 3 RESPONSE:")
    print("==================================================\n")
    print(response)
    print("\n==================================================")
