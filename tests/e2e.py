from pathlib import Path
import os
import re
from playwright.sync_api import sync_playwright


def run():
    errors = []
    base_url = os.environ.get("BASE_URL", "http://127.0.0.1:5173")
    admin_url = os.environ.get("ADMIN_URL", "http://127.0.0.1:5175/")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.goto(base_url)
        page.wait_for_load_state("networkidle")
        assert page.get_by_role("heading", name="Bangladesh, in a practical order.").is_visible()
        page.screenshot(path="/tmp/tourismubd-home.png", full_page=True)

        page.locator(".water-band").get_by_role("button", name="Find a Houseboat").click()
        assert page.get_by_role("tab", name="Houseboats").get_attribute("aria-selected") == "true"
        page.get_by_role("button", name="Discover", exact=True).click()
        page.get_by_role("button", name="Places", exact=True).click()
        search = page.get_by_placeholder("Search by place, area, or category")
        search.fill("Bisnakandi")
        assert page.get_by_role("button", name="Bichanakandi", exact=True).is_visible()
        search.fill("")
        page.get_by_role("button", name="Lake", exact=True).click()
        assert page.get_by_role("button", name="Lake", exact=True).get_attribute("class").endswith("active")
        page.get_by_role("button", name="Discover", exact=True).click()
        page.get_by_role("button", name="Places", exact=True).click()
        assert page.get_by_role("button", name="Lake", exact=True).get_attribute("class").endswith("active")
        page.get_by_role("button", name="All", exact=True).click()
        page.get_by_role("button", name="Add to trip", exact=True).nth(0).click()
        page.get_by_role("button", name="Add to trip", exact=True).nth(0).click()
        page.locator("nav").get_by_role("button", name=re.compile(r"^My trip")).click()
        page.get_by_label("Destination district").select_option("sylhet")
        assert page.get_by_role("heading", name="Suggested places").is_visible()
        assert page.get_by_role("button", name=re.compile(r"Ratargul Swamp Forest")).is_visible()
        for place_name in ["Jaflong Gowainghat", "Lalakhal Jaintiapur", "Panthumai West Jaflong, Gowainghat"]:
            page.get_by_role("button", name=place_name, exact=True).click()
        page.get_by_role("button", name="Khadimnagar National Park Khadimnagar", exact=True).click()
        assert page.get_by_text("6 selected in Sylhet").is_visible()
        page.get_by_role("button", name="Build selected places route").click()
        page.get_by_text("Selected places plan").wait_for()
        assert page.get_by_text("6 places", exact=True).is_visible()
        assert page.get_by_text("Day 1", exact=True).is_visible()
        assert page.get_by_text("Day 2", exact=True).is_visible()
        page.get_by_role("button", name="Plan full district").click()
        page.get_by_text("Full district plan").wait_for()
        assert page.get_by_text("Day 1", exact=True).is_visible()
        assert page.get_by_text("Day 2", exact=True).is_visible()
        assert page.get_by_text("Prototype sequence based", exact=False).is_visible()
        page.get_by_role("button", name="Save trip").click()
        assert page.get_by_text("Trip saved on this device.").is_visible()
        page.screenshot(path="/tmp/tourismubd-route.png", full_page=True)

        page.get_by_role("button", name="Local services", exact=True).click()
        page.get_by_role("tab", name="Houseboats").click()
        assert page.get_by_text("No houseboats", exact=False).is_visible()
        for service in ["Resorts & hotels", "Car & transport", "Parking", "Area tours"]:
            tab = page.get_by_role("tab", name=service)
            tab.click()
            assert tab.get_attribute("aria-selected") == "true"
        page.screenshot(path="/tmp/tourismubd-services.png", full_page=True)
        admin = browser.new_page(viewport={"width": 1440, "height": 1000})
        admin.goto(admin_url)
        admin.wait_for_load_state("networkidle")
        assert admin.get_by_role("heading", name="Connect Supabase to open operations.").is_visible()
        assert admin.get_by_text("Admin backend not connected").is_visible()
        admin.screenshot(path="/tmp/tourismubd-admin.png", full_page=True)

        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile.goto(base_url)
        mobile.wait_for_load_state("networkidle")
        mobile.get_by_role("button", name="Toggle navigation").click()
        assert mobile.get_by_role("button", name="Places", exact=True).is_visible()
        mobile.screenshot(path="/tmp/tourismubd-mobile.png", full_page=True)
        browser.close()

    if errors:
        raise AssertionError(f"Browser console errors: {errors}")
    print("e2e checks passed")
    print("screenshots: /tmp/tourismubd-home.png /tmp/tourismubd-route.png /tmp/tourismubd-services.png /tmp/tourismubd-admin.png /tmp/tourismubd-mobile.png")


if __name__ == "__main__":
    Path("/tmp").mkdir(exist_ok=True)
    run()
