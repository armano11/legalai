import time
import uuid
import json
import requests

BASE_URL = "http://127.0.0.1:8000"
TIMEOUT = 45


def _req(method, path, **kwargs):
    return requests.request(method, f"{BASE_URL}{path}", timeout=TIMEOUT, **kwargs)


def _print_result(name, ok, detail):
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}: {detail}")
    return ok


def run():
    results = []
    stamp = int(time.time())
    nonce = uuid.uuid4().hex[:8]

    admin_email = f"admin_{stamp}_{nonce}@example.com"
    lawyer_email = f"lawyer_{stamp}_{nonce}@example.com"
    password = "StrongPass#1234"

    # 1) Signup -> Login -> Logout(modelled as token removal / unauthorized check)
    try:
        r = _req("POST", "/api/register", json={
            "name": "Runtime Admin",
            "email": admin_email,
            "password": password,
            "role": "admin",
            "plan": "professional",
            "firm_name": "Runtime Firm"
        })
    except Exception as exc:
        results.append(_print_result("signup(admin)", False, str(exc)))
        print("\nHard stop: cannot continue without admin user.")
        return all(results)
    results.append(_print_result("signup(admin)", r.status_code == 200, f"{r.status_code} {r.text[:160]}"))

    try:
        r = _req("POST", "/api/login", json={"email": admin_email, "password": password})
    except Exception as exc:
        results.append(_print_result("login(admin)", False, str(exc)))
        print("\nHard stop: cannot continue without auth token.")
        return all(results)
    login_ok = r.status_code == 200 and "access_token" in r.json()
    results.append(_print_result("login(admin)", login_ok, f"{r.status_code}"))
    if not login_ok:
        print("\nHard stop: cannot continue without auth token.")
        return all(results)

    admin_token = r.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    r = _req("GET", "/api/me", headers=admin_headers)
    results.append(_print_result("session token works (/api/me)", r.status_code == 200, f"{r.status_code}"))

    # "Logout" behavior in this API is client-side token drop; verify unauthorized without token
    r = _req("GET", "/api/me")
    results.append(_print_result("logout-equivalent unauthorized check", r.status_code == 401, f"{r.status_code}"))

    # 2) Create case -> Assign lawyer -> Retrieve case -> Update case
    r = _req("POST", "/api/admin/lawyers", headers=admin_headers, json={
        "name": "Runtime Lawyer",
        "email": lawyer_email,
        "password": password,
        "title": "Associate",
        "practice_areas": ["Civil"],
        "bio": "Runtime test user",
    })
    lawyer_created = r.status_code == 200
    results.append(_print_result("create lawyer", lawyer_created, f"{r.status_code} {r.text[:160]}"))

    r = _req("POST", "/api/lawyers/cases", headers=admin_headers, json={
        "title": "Runtime E2E Case",
        "description": "Created by automated runtime test",
        "lawyer_email": lawyer_email,
        "lawyer_name": "Runtime Lawyer",
        "client_name": "Client Runtime",
        "client_email": f"client_{stamp}@example.com",
        "client_number": "+911234567890",
        "case_type": "Civil",
        "court": "District Court",
        "priority": "high",
    })
    create_case_ok = r.status_code == 200 and "case_id" in r.json()
    case_id = r.json().get("case_id") if create_case_ok else None
    results.append(_print_result("create case", create_case_ok, f"{r.status_code} {r.text[:200]}"))

    if case_id:
        r = _req("GET", "/api/lawyers/cases", headers=admin_headers)
        cases_ok = r.status_code == 200 and any(str(c.get("id")) == str(case_id) for c in r.json().get("cases", []))
        results.append(_print_result("retrieve case list", cases_ok, f"{r.status_code}"))

        r = _req("PUT", f"/api/lawyers/cases/{case_id}", headers=admin_headers, json={
            "status": "Investigation",
            "progress_notes": "Runtime status update."
        })
        results.append(_print_result("update case progress", r.status_code == 200, f"{r.status_code} {r.text[:120]}"))

        r = _req("PUT", f"/api/lawyers/cases/{case_id}/stage", headers=admin_headers, json={"new_stage": "Hearing"})
        results.append(_print_result("update case stage", r.status_code == 200, f"{r.status_code} {r.text[:120]}"))

    # 3) Research pipeline
    r = _req("POST", "/api/legal-search", json={"query": "breach of contract remedies in india"})
    research_ok = r.status_code == 200 and isinstance(r.json(), dict)
    results.append(_print_result("research legal-search", research_ok, f"{r.status_code}"))
    research_ctx = r.json().get("context_for_ai", "") if research_ok else ""
    if not research_ctx:
        research_ctx = json.dumps(r.json())[:500] if research_ok else "fallback context"

    try:
        r = _req("POST", "/api/research/synthesize", json={
            "query": "breach of contract remedies in india",
            "context": research_ctx
        })
        synth_ok = r.status_code == 200
        # 504 is treated as controlled behavior, but still marked as failure for strict E2E quality gates.
        if r.status_code == 504:
            synth_ok = False
        results.append(_print_result("research synthesize", synth_ok, f"{r.status_code} {r.text[:120]}"))
    except Exception as exc:
        results.append(_print_result("research synthesize", False, str(exc)))

    # 4) Draft generator
    try:
        r = _req("POST", "/api/generate-draft", headers=admin_headers, json={
            "doc_type": "Legal Notice",
            "client_name": "Client Runtime",
            "opposing_party": "Opposing Runtime Pvt Ltd",
            "case_description": "Notice for recovery of unpaid invoice amount and contractual damages."
        })
        draft_ok = r.status_code == 200 and "draft_id" in r.json() and bool((r.json().get("generated_draft") or "").strip())
        results.append(_print_result("generate draft", draft_ok, f"{r.status_code}"))
    except Exception as exc:
        results.append(_print_result("generate draft", False, str(exc)))

    # 5) Add hearing to case
    if case_id:
        hearing_resp = _req("POST", f"/api/lawyers/cases/{case_id}/hearings", headers=admin_headers, json={
            "date": "2026-05-20",
            "time": "10:30",
            "court": "District Court",
            "notes": "Runtime hearing",
            "hearing_type": "Regular Hearing"
        })
        hearing_ok = hearing_resp.status_code == 200 and "hearing" in hearing_resp.json()
        results.append(_print_result("add hearing", hearing_ok, f"{hearing_resp.status_code}"))

    passed = sum(1 for x in results if x)
    total = len(results)
    print(f"\nResult: {passed}/{total} checks passed")
    return passed == total


if __name__ == "__main__":
    ok = run()
    raise SystemExit(0 if ok else 1)
