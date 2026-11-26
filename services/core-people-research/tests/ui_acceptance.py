"""Real Chromium/WebKit checks on isolated integration components, using synthetic local data."""
import asyncio, functools, json, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.async_api import async_playwright

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*_): pass

async def main():
    root=Path(__file__).resolve().parents[3]
    server=ThreadingHTTPServer(("127.0.0.1",0),functools.partial(QuietHandler,directory=str(root)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    output=root/"reports"/"core-people";output.mkdir(parents=True,exist_ok=True)
    async with async_playwright() as playwright:
        for name in ("chromium","webkit"):
            browser=await getattr(playwright,name).launch()
            for width,height in ((375,667),(390,844),(1365,900)):
                context=await browser.new_context(viewport={"width":width,"height":height},reduced_motion="reduce")
                await context.route("**/*",lambda route: route.continue_() if route.request.url.startswith("http://127.0.0.1:") else route.abort())
                page=await context.new_page()
                errors=[];page.on("pageerror",lambda error:errors.append(str(error)))
                await page.goto(f"http://127.0.0.1:{server.server_port}/services/core-people-research/tests/ui-fixture.html")
                await page.wait_for_function("window.coreFixture?.ready")
                assert await page.evaluate("document.documentElement.scrollWidth <= innerWidth"),"Horizontal overflow"
                await page.get_by_role("button",name="Menu & search",exact=True).click()
                dialog=page.get_by_role("dialog",name="Core menu",exact=True)
                await page.get_by_role("searchbox",name="Find a section").fill("pest")
                assert await page.locator("[data-menu-section]").count()==1
                await page.get_by_role("button",name="Savage Pest Warfare",exact=True).click()
                assert await page.evaluate("window.lastRoute")=="savage"
                assert not await dialog.is_visible()
                await page.get_by_role("button",name="Menu & search",exact=True).click()
                await page.get_by_role("button",name="Quick receipt",exact=True).scroll_into_view_if_needed()
                box=await page.get_by_role("button",name="Quick receipt",exact=True).bounding_box()
                assert box["y"]>=0 and box["y"]+box["height"]<=height,"Menu action clipped"
                await page.get_by_role("button",name="Quick receipt",exact=True).click()
                assert await page.evaluate("window.lastAction")=="receipt"
                await page.get_by_role("button",name="+ New case",exact=True).click()
                await page.get_by_label("Case name",exact=True).fill("Synthetic research fixture")
                await page.get_by_label("Search clue",exact=True).fill("corefixture")
                await page.get_by_role("button",name="Save case",exact=True).click()
                await page.get_by_role("button",name="Search public profiles",exact=True).wait_for()
                await page.get_by_role("button",name="Search public profiles",exact=True).click()
                await page.get_by_text("Search finished",exact=False).first.wait_for(timeout=12000)
                assert await page.get_by_role("link",name="Synthetic source",exact=True).count()==1
                assert await page.evaluate("window.coreFixture.starts")==1,"Duplicate search start"
                await page.get_by_label("Review Synthetic source",exact=True).select_option("different_person")
                await page.wait_for_function("window.coreFixture.tables.cowboys_core_people_findings[0].review_state==='different_person'")
                await page.get_by_label("Case notes",exact=True).fill("A synthetic review note.")
                await page.get_by_role("button",name="Save notes",exact=True).click()
                await page.wait_for_function("window.coreFixture.tables.cowboys_core_people_cases[0].notes==='A synthetic review note.'")
                assert await page.evaluate("document.documentElement.scrollWidth <= innerWidth"),"Result layout overflow"
                await page.screenshot(path=str(output/f"{name}-{width}.png"),full_page=True)
                assert not errors,errors
                await page.get_by_role("button",name="Menu & search",exact=True).click()
                await page.keyboard.press("Escape")
                assert not await dialog.is_visible()
                await context.close()
            await browser.close()
    server.shutdown();server.server_close()
    print("Core integration: both browsers passed at all three viewport sizes.")

asyncio.run(main())
