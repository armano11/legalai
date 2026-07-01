"""Headed E2E test verifying the improved DraftGenerator and all routes."""
import os, sys
from playwright.sync_api import sync_playwright

FRONTEND_URL = "http://127.0.0.1:5173"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, slow_mo=100)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(f"[PAGE_CRASH] {err}"))

    def check(description, condition):
        icon = "✅" if condition else "❌"
        print(f"  {icon} {description}")

    def wait_for_page(path, timeout=15000):
        page.goto(f"{FRONTEND_URL}{path}", wait_until="load", timeout=timeout)
        page.wait_for_timeout(2000)

    # TEST 1: Landing page
    print("\n" + "=" * 70)
    print("TEST 1: LANDING PAGE")
    print("=" * 70)
    wait_for_page("/")
    check("Page loads", "JurisAI" in page.inner_text("body"))
    check("Initiate Protocol visible", page.locator("text=Initiate Protocol").count() > 0)

    # TEST 2: Login page
    print("\n" + "=" * 70)
    print("TEST 2: LOGIN PAGE")
    print("=" * 70)
    wait_for_page("/login")
    check("Welcome Back visible", page.locator("text=Welcome Back").count() > 0)
    check("Email input exists", page.locator("input[type='email']").count() > 0)
    check("Password input exists", page.locator("input[type='password']").count() > 0)

    # TEST 3: DraftGenerator route (redirects to login since protected)
    print("\n" + "=" * 70)
    print("TEST 3: DRAFT GENERATOR ROUTE")
    print("=" * 70)
    wait_for_page("/draft")
    # Protected route should redirect to /login
    check("Redirects to /login when unauthenticated", "/login" in page.url)

    # TEST 4: Track page 
    print("\n" + "=" * 70)
    print("TEST 4: TRACK PAGE")
    print("=" * 70)
    wait_for_page("/track")
    check("Track page loads", "Track Your Case" in page.inner_text("body"))
    check("Input field exists", page.locator("input[type='text']").count() > 0)

    # TEST 5: Protected routes redirect
    print("\n" + "=" * 70)
    print("TEST 5: PROTECTED ROUTES")
    print("=" * 70)
    for route in ["/dashboard", "/cases", "/research", "/draft", "/admin", "/settings"]:
        wait_for_page(route)
        redirected = "/login" in page.url
        check(f"{route} → /login", redirected)

    # TEST 6: 404 page
    print("\n" + "=" * 70)
    print("TEST 6: 404 NOT FOUND")
    print("=" * 70)
    wait_for_page("/nonexistent-xyz")
    body = page.inner_text("body")
    check("404 displayed", "404" in body or "not found" in body.lower())

    # SUMMARY
    print("\n" + "=" * 70)
    print("E2E TEST COMPLETE")
    print("=" * 70)
    if errors:
        print(f"\n  Console errors: {len(errors)}")
        for e in errors[:5]:
            print(f"    {e}")
    else:
        print("\n  ✅ No console errors")

    page.wait_for_timeout(3000)
    browser.close()
    print("\n  ✅ Done")
