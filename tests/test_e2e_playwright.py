"""E2E tests using Playwright (browser automation engine).
Tests: landing page, login, track case, protected routes, 404 page.
"""

import re
import sys
from playwright.sync_api import sync_playwright, expect

FRONTEND_URL = "http://localhost:5173"

errors_found = []

def on_console(msg):
    if msg.type == "error":
        errors_found.append(f"JS ERROR: {msg.text}")

def on_pageerror(err):
    errors_found.append(f"PAGE CRASH: {err}")


def test_landing_page():
    """Landing page renders hero, features, track section, and footer."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", on_console)
        page.on("pageerror", on_pageerror)

        page.goto(FRONTEND_URL, wait_until="networkidle")
        page.wait_for_timeout(3000)

        body_text = page.inner_text("body")

        checks = {
            "hero_heading": "Enterprise OS" in body_text or "Law" in body_text,
            "initiate_protocol_btn": "Initiate Protocol" in body_text,
            "track_case_section": "Track Your Case" in body_text,
            "footer_legalforge": "LegalForge" in body_text,
        }

        failed = [k for k, v in checks.items() if not v]
        if failed:
            print(f"  FAILED checks: {failed}")
        else:
            print("  All checks PASSED")

        if errors_found:
            print(f"  Console errors: {errors_found}")

        print(f"  Page title: {page.title()}")
        print(f"  URL: {page.url}")
        browser.close()
        return len(failed) == 0


def test_login_page():
    """Login page renders form elements."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", on_console)
        page.on("pageerror", on_pageerror)

        page.goto(f"{FRONTEND_URL}/login", wait_until="networkidle")
        content = page.content()

        checks = {
            "welcome_back": "Welcome Back" in content,
            "email_field": page.locator("input[type='email']").count() > 0,
            "password_field": page.locator("input[type='password']").count() > 0,
            "login_button": page.locator("button:has-text('Login')").count() > 0
                            or page.locator("button:has-text('Authenticate')").count() > 0
                            or page.locator("button:has-text('Sign In')").count() > 0,
            "register_link": "Create Workspace" in content or "Register" in content,
        }

        failed = [k for k, v in checks.items() if not v]
        if failed:
            print(f"  FAILED checks: {failed}")
        else:
            print("  All checks PASSED")

        if errors_found:
            print(f"  Console errors: {errors_found}")

        print(f"  URL: {page.url}")
        browser.close()
        return len(failed) == 0


def test_track_page():
    """Public case tracking page with input field."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", on_console)
        page.on("pageerror", on_pageerror)

        page.goto(f"{FRONTEND_URL}/track", wait_until="networkidle")
        content = page.content()

        checks = {
            "track_heading": "Track Your Case" in content or "Track" in content,
            "input_exists": page.locator("input").count() > 0,
        }

        failed = [k for k, v in checks.items() if not v]
        if failed:
            print(f"  FAILED checks: {failed}")
        else:
            print("  All checks PASSED")

        if errors_found:
            print(f"  Console errors: {errors_found}")

        print(f"  URL: {page.url}")
        browser.close()
        return len(failed) == 0


def test_protected_routes_redirect():
    """Unauthenticated access to /dashboard and /cases redirects to /login."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", on_console)
        page.on("pageerror", on_pageerror)

        page.goto(f"{FRONTEND_URL}/dashboard", wait_until="networkidle")
        redirected_to_login = "/login" in page.url

        print(f"  /dashboard redirected to login: {redirected_to_login}")
        print(f"  URL after dashboard redirect: {page.url}")

        page.goto(f"{FRONTEND_URL}/cases", wait_until="networkidle")
        cases_redirected = "/login" in page.url
        print(f"  /cases redirected to login: {cases_redirected}")
        print(f"  URL after cases redirect: {page.url}")

        if errors_found:
            print(f"  Console errors: {errors_found}")

        browser.close()
        return redirected_to_login and cases_redirected


def test_404_page():
    """Non-existent route shows 404 page."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", on_console)
        page.on("pageerror", on_pageerror)

        page.goto(f"{FRONTEND_URL}/nonexistent-test-12345", wait_until="networkidle")
        content = page.content()

        has_404 = ("404" in content or "Page Not Found" in content
                   or "Not Found" in content or "not found" in content)

        print(f"  404 message displayed: {has_404}")
        print(f"  URL: {page.url}")

        if errors_found:
            print(f"  Console errors: {errors_found}")

        browser.close()
        return has_404


if __name__ == "__main__":
    tests = [
        ("Landing Page", test_landing_page),
        ("Login Page", test_login_page),
        ("Track Page", test_track_page),
        ("Protected Routes", test_protected_routes_redirect),
        ("404 Page", test_404_page),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        print(f"\n{'#'*60}")
        print(f"# TEST: {name}")
        print(f"{'#'*60}")
        errors_found.clear()
        try:
            if fn():
                print(f"  -> PASSED")
                passed += 1
            else:
                print(f"  -> FAILED")
                failed += 1
        except Exception as e:
            print(f"  -> EXCEPTION: {e}")
            failed += 1

    print(f"\n{'='*60}")
    print(f"E2E SUMMARY: {passed} passed, {failed} failed")
    print(f"{'='*60}")
    sys.exit(0 if failed == 0 else 1)
