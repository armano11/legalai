import logging
import json
import requests
from config import APP_CORE_TOKEN

logger = logging.getLogger(__name__)

AI_ENABLE_MANAGED_MODELS = True
NVIDIA_RESEARCH_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

class AIGatewayError(Exception):
    pass

def generate_text(prompt: str, kind: str = "document", temperature: float = 0.2, max_tokens: int = 2000) -> dict:
    from ai.llm_fallback import _call_neural_node
    
    text = _call_neural_node(prompt, max_tokens=max_tokens, total_timeout_s=20)
    if not text:
        raise AIGatewayError("Failed to generate text from AI Gateway")
    
    return {
        "text": text,
        "trace": {
            "provider": "openrouter",
            "model": NVIDIA_RESEARCH_MODEL,
            "status": "ok"
        }
    }

def _nvidia_stream(prompt: str, system: str, model: str, temperature: float = 0.15, max_tokens: int = 3200):
    _u = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {APP_CORE_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "stream": True,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    try:
        with requests.post(_u, headers=headers, json=payload, stream=True, timeout=30) as resp:
            if resp.status_code != 200:
                logger.error(f"Stream error: {resp.status_code}")
                yield f"Error: {resp.status_code}"
                return
                
            for line in resp.iter_lines():
                if line:
                    decoded = line.decode("utf-8")
                    if decoded.startswith("data: "):
                        data_str = decoded[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            content = data["choices"][0].get("delta", {}).get("content")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            pass
    except Exception as e:
        logger.error(f"NVIDIA stream failed: {e}")
        yield f"Error: {str(e)}"
