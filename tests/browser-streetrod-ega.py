#!/usr/bin/env python3
"""Local synthetic Street r0d DOS scene and boot smoke test.

This tests the published static source in a browser, not private Commons
accounts, gameplay RPCs or live authenticated multiplayer.
"""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:8765"
FIXTURE = BASE + "/__streetrod_ega_smoke__"
HTML = """<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-streetrod-ega.css">
<style>body{margin:0;background:#151515;color:white}.src-garage-stage{max-width:740px;margin:12px auto}
#streetrod-root{margin:12px auto;max-width:800px;padding:8px}</style></head>
<body class="community-page">
<section id="streetrod-root"><div id="sr-inside">
<button id="sr-toggle" type="button">Open Street r0d</button>
<div class="src-garage-stage">
<span id="src-current-ride">Cipher Van X</span>
<div class="src-stage-car"><img class="src-car-photo" alt=""></div>
<div class="src-garage-hotspots"><button type="button">POP HOOD</button></div>
</div></div></section>
<script type="module" src="/commons-streetrod-ega.mjs"></script>
</body></html>"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(
            viewport={"width": 390, "height": 844},
            device_scale_factor=1,
            reduced_motion="reduce",
        )
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        async def fixture(route):
            await route.fulfill(status=200, content_type="text/html", body=HTML)
        await page.route(FIXTURE, fixture)
        try:
            await page.goto(FIXTURE, wait_until="load", timeout=20000)
            scene = page.locator(".src-garage-stage > canvas.sr-ega-scene")
            await scene.wait_for(timeout=8000)
            layout = await scene.evaluate("""el=>{
              const b=el.getBoundingClientRect();
              return {nativeW:el.width,nativeH:el.height,ratio:b.width/b.height};
            }""")
            assert layout["nativeW"] == 320 and layout["nativeH"] == 200, layout
            assert abs(layout["ratio"] - 1.6) < .03, layout
            original = await scene.evaluate("el=>el.toDataURL()")
            await page.evaluate("""()=>{
              document.querySelector('#src-current-ride').textContent='Rattler Coupe';
              document.querySelector('.src-garage-stage canvas.sr-ega-scene').remove();
            }""")
            await page.wait_for_function(
                """old=>{
                  const el=document.querySelector('.src-garage-stage canvas.sr-ega-scene');
                  return !!el && el.toDataURL()!==old;
                }""",
                arg=original,
                timeout=8000,
            )
            await page.locator("#sr-toggle").click()
            await page.locator(".sr-dos-overlay .sr-dos-skip").click()
            assert await page.locator("#streetrod-root").evaluate(
                "el=>el.classList.contains('sr-dos-fullscreen')")
            assert await page.locator("#sr-dos-maximize").count() == 1
            (ROOT / "reports").mkdir(parents=True, exist_ok=True)
            await page.screenshot(
                path=str(ROOT / "reports" / "streetrod-ega-iphone-sample.png"),
                full_page=False,
                animations="disabled",
            )
            await page.locator("#sr-dos-maximize").click()
            assert not await page.locator("#streetrod-root").evaluate(
                "el=>el.classList.contains('sr-dos-fullscreen')")
            assert not errors, "Browser JavaScript errors: " + "; ".join(errors)
            print("Street r0d local iPhone-size smoke: ratio, unique shapes, boot and exit passed")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
