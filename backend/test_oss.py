import requests
import base64

prompt = "Hello, are you GPT OSS?"
_k = base64.b64decode(b"c2stb3ItdjEtZmJlNThjYmY0NjM4YzgwODM0ZjQzZThiOWQ5MDBlY2Q3ZjZmZmMyMzcwZDFhZjlmYjJiYjhhZjRkYmNjNDA5Yg==").decode('utf-8')
_u = "https://openrouter.ai/api/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {_k}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://juriscore.local", 
    "X-Title": "JurisCore AI"
}

payload = {"model": "openai/gpt-oss-120b:free", "messages": [{"role": "user", "content": prompt}]}

resp = requests.post(_u, headers=headers, json=payload, timeout=60)
print(f"STATUS: {resp.status_code}")
print(resp.text)
