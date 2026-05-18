import importlib
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from fastapi.testclient import TestClient


class MockFirecrawlHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path not in ("/v2/search", "/v1/search"):
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        payload = json.loads(raw.decode("utf-8"))
        query = payload.get("query", "")

        body = {
            "success": True,
            "data": [
                {
                    "title": f"Mock Firecrawl Result for {query}",
                    "url": "https://example.org/legal/firecrawl-result",
                    "markdown": "This is a Firecrawl-backed legal web result with detailed extracted markdown.",
                    "description": "Mock description",
                }
            ],
        }

        encoded = json.dumps(body).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format, *args):
        return


def main():
    os.environ["FIRECRAWL_ENABLED"] = "true"
    os.environ["FIRECRAWL_BASE_URL"] = "http://127.0.0.1:8765"
    os.environ["FIRECRAWL_API_KEY"] = ""
    os.environ["FIRECRAWL_SEARCH_LIMIT"] = "2"

    server = HTTPServer(("127.0.0.1", 8765), MockFirecrawlHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        import config
        from services import firecrawl_service
        from ai import rag_pipeline
        import main as backend_main

        importlib.reload(config)
        importlib.reload(firecrawl_service)
        importlib.reload(rag_pipeline)
        importlib.reload(backend_main)

        direct = firecrawl_service.firecrawl_search("anticipatory bail", max_results=2)
        assert direct, "Expected Firecrawl direct search results"
        assert direct[0]["source"] == "Firecrawl", direct[0]

        report = rag_pipeline.search_legal("anticipatory bail in criminal procedure")
        assert report.get("web_sources"), "Expected web_sources in research report"
        assert any("example.org" in item.get("url", "") for item in report["web_sources"]), report["web_sources"]
        assert report.get("results"), "Expected non-empty research results"

        client = TestClient(backend_main.app)
        response = client.post("/api/legal-search", json={"query": "anticipatory bail in criminal procedure"})
        assert response.status_code == 200, response.text
        route_payload = response.json()
        assert route_payload.get("web_sources"), "Expected Firecrawl web sources through API route"

        print("PASS: Firecrawl integration verified")
        print(json.dumps({
            "web_sources": report.get("web_sources", []),
            "api_web_sources": route_payload.get("web_sources", []),
            "trace": report.get("trace", {}),
            "source": report.get("source"),
        }, indent=2))
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
