# Renders scripts/link-card.html to assets/briopost-link-card.png (1200 x 630), the image shown when briopost.com is shared,
# and assets/apple-touch-icon.png (180 x 180) from the logo.
# Needs Python Playwright (pip install playwright; playwright install chromium). Run from the repo root.
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser = p.chromium.launch()
    try:
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        page.goto((root / "scripts" / "link-card.html").as_uri())
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(300)
        page.screenshot(path=str(root / "assets" / "briopost-link-card.png"))
        # Apple touch icon (180 px): the small square iMessage and iOS show beside a link.
        page.set_viewport_size({"width": 180, "height": 180})
        page.set_content('<body style="margin:0;background:#121433"><img src="' + (root / "assets" / "briopost-icon.svg").as_uri() + '" width="180" height="180" style="display:block"></body>')
        page.wait_for_timeout(200)
        page.screenshot(path=str(root / "assets" / "apple-touch-icon.png"))
    finally:
        browser.close()
print("Saved assets/briopost-link-card.png and assets/apple-touch-icon.png")
