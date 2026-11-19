# Laguna Gold — smoke test + screenshot maker.
# Serves app/, opens it in headless Chromium, checks for console errors,
# clicks a real Export button, then exports covers via the app's own
# __exportCover hook and saves the 4 gate-sized screenshots.
import base64
import io
import json
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
SHOTS = ROOT / "screenshots"
SHOTS.mkdir(exist_ok=True)

server = subprocess.Popen(
    [sys.executable, "-m", "http.server", "8123", "--directory", str(APP)],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)
time.sleep(1.0)

errors = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/home/hatch/.cache/ms-playwright/chromium-1148/chrome-linux/chrome")
        page = browser.new_page(viewport={"width": 1280, "height": 960})
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto("http://localhost:8123/index.html")
        page.wait_for_function("window.__ready === true", timeout=30000)
        time.sleep(0.8)

        # 2-editor.jpg: the app in the browser with photos loaded.
        page.screenshot(path=str(SHOTS / "2-editor.jpg"), type="jpeg", quality=85)

        # Real export button must produce a download.
        with page.expect_download(timeout=15000) as dl:
            page.click('[data-export="1080x1080"]')
        download = dl.value
        print("export download:", download.suggested_filename)

        def save_cover(name, w, h, grade=None):
            data_url = page.evaluate(
                "([w,h,g]) => window.__exportCover(w, h, g)",
                [w, h, grade],
            )
            raw = base64.b64decode(data_url.split(",", 1)[1])
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            # Gate: long side <= 1280, short side >= 480.
            long_side = 1024 if w == h else 1280
            if w >= h:
                target = (long_side, round(h * long_side / w))
            else:
                target = (round(w * long_side / h), long_side)
            img = img.resize(target, Image.LANCZOS)
            out = SHOTS / name
            for quality in (88, 80, 72, 64):
                img.save(out, "JPEG", quality=quality, optimize=True)
                if out.stat().st_size <= 262144:
                    break
            print(name, img.size, out.stat().st_size, "bytes")
            return out

        # 1-cover.jpg: strongest cover — hero layout, golden hour, square.
        save_cover("1-cover.jpg", 1080, 1080)
        # 3-cover-halftone.jpg: the pop-art variant.
        save_cover("3-cover-halftone.jpg", 1080, 1080, grade="halftone")
        # 4-cover-portrait.jpg: portrait export.
        save_cover("4-cover-portrait.jpg", 1080, 1350)
        browser.close()
finally:
    server.terminate()

print("console errors:", json.dumps(errors, indent=2) if errors else "none")
for f in sorted(SHOTS.glob("*")):
    print(f.name, f.stat().st_size)
