# Renders scripts/link-card.html to assets/briopost-link-card.png (1200 x 630), the image shown when briopost.com is shared,
# assets/apple-touch-icon.png (180 x 180) from the logo, and the web-app icons named in site.webmanifest
# (assets/icon-192.png, assets/icon-512.png, and assets/icon-maskable-512.png with a safe margin for round masks).
# Needs Python Playwright (pip install playwright; playwright install chromium). Run from the repo root.
import base64
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
        # Web-app icons for site.webmanifest.
        icon = "data:image/svg+xml;base64," + base64.b64encode((root / "assets" / "briopost-icon.svg").read_bytes()).decode()
        for size, name, inner in ((192, "icon-192.png", 192), (512, "icon-512.png", 512), (512, "icon-maskable-512.png", 400)):
            page.set_viewport_size({"width": size, "height": size})
            pad = (size - inner) // 2
            background = "#121433" if inner < size else "transparent"  # the maskable icon fills its square
            page.set_content('<body style="margin:0;background:' + background + '"><img src="' + icon + '" width="' + str(inner) + '" height="' + str(inner) + '" style="display:block;margin:' + str(pad) + 'px"></body>')
            page.wait_for_timeout(200)
            page.screenshot(path=str(root / "assets" / name), omit_background=True)
    finally:
        browser.close()
print("Saved assets/briopost-link-card.png, assets/apple-touch-icon.png and the web-app icons")
