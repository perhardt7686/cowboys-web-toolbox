#!/usr/bin/env python3
"""Read-only synthetic member UI: each of eight actual arcade entries must have
its own illustrated title screen and working Start, Help and Settings routes.
This test uses NO real family account, paid service, or member database.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL="http://127.0.0.1:8765/__titles__/community.html"
ROOTS=[
 ("streetrod","sr-toggle","STREET R0D"),
 ("dashforge","dash-forge-toggle","DASH FORGE"),
 ("mahjong","mahjong-toggle","MAHJONG"),
 ("wordle","letter-lock-toggle","W0RDLE"),
 ("wordquest","word-game-toggle","WORD QUEST"),
 ("plates","plate-game-open","LICENSE PLATES"),
 ("drawing","drawing-studio-toggle","DRAWING STUDIO"),
 ("study","vdacs-study-toggle","7A STUDY CARDS")
]
HTML="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-arcade-shell.css">
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true}</script></head><body class="community-page" style="margin:0;background:#15152e">
<section id="conversations"><div class="community-main" style="min-height:1800px">
<section id="streetrod-root"><button id="sr-toggle" aria-expanded="false">Street Rod</button>
<div id="sr-inside" hidden><div id="src-classic-hub"><div id="streetrod-summer"><div id="ss-tabs"></div></div></div></div></section>
<section id="dash-forge-root"><button id="dash-forge-toggle" aria-expanded="false">Dash Forge</button>
<div id="dash-forge-inside" hidden><section id="dash-pane-builder"><h3>Level Studio</h3></section></div></section>
<section id="mahjong-root"><button id="mahjong-toggle" aria-expanded="false">Mahjong</button><div id="mahjong-inside" hidden>Tiles</div></section>
<section id="letter-lock-root"><button id="letter-lock-toggle" aria-expanded="false">w0rdle</button><div id="letter-lock-content" hidden>Letters</div></section>
<section id="word-game-root"><button id="word-game-toggle" aria-expanded="false">Word Quest</button><div id="word-game-inside" hidden>Words</div></section>
<section id="plate-game-root"><button id="plate-game-open" aria-expanded="false">License Plates</button><div id="plate-game-content" hidden>Plates</div></section>
<section id="drawing-studio-game-root"><button id="drawing-studio-toggle" aria-expanded="false">Drawing Studio</button>
<div id="drawing-studio-inside" hidden><section id="commons-art"><div id="commons-drawing-root">
<div id="art-viewport"><canvas id="commons-art-canvas" width="1000" height="640"></canvas></div></div></section></div></section>
<section id="vdacs-study-root"><button id="vdacs-study-toggle" aria-expanded="false">7A Study</button>
<div id="vdacs-study-inside" hidden><div class="vdacs-inner"><div id="vdacs-study-card">Card</div></div></div></section>
</div></section>
<script>window.__creatorEvents=[];
window.addEventListener('dashforge:creator-mode',e=>window.__creatorEvents.push(e.detail.boss));
for(const [a,b] of [
 ['sr-toggle','sr-inside'],['dash-forge-toggle','dash-forge-inside'],
 ['mahjong-toggle','mahjong-inside'],['letter-lock-toggle','letter-lock-content'],
 ['word-game-toggle','word-game-inside'],['plate-game-open','plate-game-content'],
 ['drawing-studio-toggle','drawing-studio-inside'],['vdacs-study-toggle','vdacs-study-inside']]){
 document.getElementById(a).addEventListener('click',()=>{
  let btn=document.getElementById(a),el=document.getElementById(b);
  el.hidden=!el.hidden;btn.setAttribute('aria-expanded',String(!el.hidden));});
}
</script><script type="module" src="/commons-arcade-shell.mjs"></script></body></html>"""

async def run_size(browser,width,height):
 page=await browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1,
  reduced_motion="reduce")
 errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
 await page.route(URL,lambda route:route.fulfill(status=200,content_type="text/html",body=HTML))
 try:
  await page.goto(URL,wait_until="load")
  await page.locator("#arcade-program-grid").wait_for(timeout=15000)
  covers=[]
  for game,toggle,title in ROOTS:
   await page.locator("#"+toggle).click()
   cover=page.locator("#arcade-game-title-view")
   assert await cover.is_visible(),("Missing game title",game)
   assert title in await cover.locator("h2").inner_text(),game
   image=page.locator("#arcade-game-title-art")
   assert await image.is_visible()
   covers.append(await image.evaluate("c=>c.toDataURL()"))
   assert await cover.locator('[data-arcade-action="title-start"]').is_visible()
   await cover.locator('[data-arcade-action="title-help"]').click()
   assert await page.locator("#arcade-title-how").is_visible()
   assert len(await page.locator("#arcade-title-how").inner_text())>85
   await cover.locator('[data-arcade-action="title-settings"]').click()
   assert await page.locator("#arcade-options-view").is_visible()
   assert title in await page.locator("#arcade-display-title").inner_text()
   await page.locator('[data-arcade-action="options-back"]').click()
   assert await cover.is_visible(),("Settings didn't return to the same game's title",game)
   if game=="dashforge":
    assert await cover.locator('[data-arcade-action="title-builder"]').is_visible()
    assert await cover.locator('[data-arcade-action="title-boss-builder"]').is_visible()
    await cover.locator('[data-arcade-action="title-boss-builder"]').click()
    assert await page.locator("body").get_attribute("data-arcade-scene")=="builder"
    assert await page.evaluate("window.__creatorEvents.at(-1)===true")
   else:
    await cover.locator('[data-arcade-action="title-start"]').click()
   assert await page.locator("#"+('streetrod-root' if game=="streetrod" else
    'letter-lock-root' if game=="wordle" else
    'word-game-root' if game=="wordquest" else
    'plate-game-root' if game=="plates" else
    'drawing-studio-game-root' if game=="drawing" else
    'vdacs-study-root' if game=="study" else game+"-root")).evaluate(
     "e=>e.classList.contains('arcade-game-active')"),(game,"Start did not activate game")
   assert await page.locator("#arcade-game-title-view").is_hidden(),("Title obscures gameplay",game)
   await page.keyboard.press("Escape")
   assert not await page.evaluate("document.body.classList.contains('arcade-on')"),(game,"Can't exit")
  assert len(set(covers))==8,"Every game must have unique original artwork"
  if width==820:
   (ROOT/"reports").mkdir(parents=True,exist_ok=True)
   await page.locator("#dash-forge-toggle").click()
   await page.screenshot(path=str(ROOT/"reports"/"arcade-dash-title-tablet.png"),animations="disabled")
   await page.locator('[data-arcade-action="title-builder"]').click()
   assert await page.evaluate("window.__creatorEvents.at(-1)===false")
   await page.keyboard.press("Escape")
  assert not errors,"JS errors: "+"; ".join(errors)
  print("EIGHT unique functional game title screens PASS",width,height)
 finally:await page.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for w,h in [(390,844),(820,1180),(844,390)]:
    await run_size(browser,w,h)
  finally:await browser.close()
if __name__=="__main__":asyncio.run(main())
