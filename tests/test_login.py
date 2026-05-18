from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Listen to all console events
        page.on("console", lambda msg: print(f"BROWSER_LOG [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER_CRASH: {err.message}"))
        
        # Navigate to login
        page.goto("http://localhost:5173/login")
        print("Loaded login page")

        # Fill credentials
        page.fill("input[type='email']", "test@test.com")
        page.fill("input[type='password']", "wrongpassword123")
        
        # Click authenticate
        print("Clicking authenticate...")
        page.click("button:has-text('Authenticate')")

        # Wait
        page.wait_for_timeout(3000)
        print("Test finished.")
        browser.close()

if __name__ == "__main__":
    run()
