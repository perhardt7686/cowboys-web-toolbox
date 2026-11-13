#!/usr/bin/env python3
"""Unauthenticated synthetic browser QA for the shared Commons DOS arcade.
Fixture never loads real member content, sessions, scores or backend endpoints.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL="http://127.0.0.1:8765/__arcade_smoke__/community.html"
HTML="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-arcade-shell.css">
<style>body{background:#261f31;color:#fff;margin:0}.community-main{max-width:1000px;margin:auto}</style>
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true}</script></head>
<body class="community-page"><section id="conversations">
<div class="community-main">
<section id="mahjong-root"><button id="mahjong-toggle" aria-expanded="false">MAHJONG</button>
<div id="mahjong-inside" hidden><section class="mahjong-game-zone"><div class="mahjong-hud">Tiles</div><div id="mahjong-board-wrap"><div id="mahjong-board">GAME</div></div></section>
<section class="mahjong-campaign">LEVELS</section><section class="mahjong-bottom"><section class="mahjong-leaders">SCORES</section><section class="mahjong-badges">BADGES</section></section><section class="mahjong-history">HISTORY</section></div></section>
<section id="plate-game-root"><button id="plate-game-open" aria-expanded="false">PLATES</button>
<div id="plate-game-content" hidden><form id="plate-new">POST PHOTO</form>
<div id="plate-list"><article class="plate-card">ONE</article><article class="plate-card">TWO</article><article class="plate-card">THREE</article></div><section class="commons-score-ribbon">SCORE</section><section class="plate-heading">LEADERS</section></div></section>
<section id="letter-lock-root"><button id="letter-lock-toggle" aria-expanded="false">WORDLE</button><div id="letter-lock-content" hidden><div class="letter-lock-inner"><div class="letter-lock-layout"><section class="letter-lock-panel">LETTERS</section><section class="letter-lock-aside">SCORES</section></div></div></div></section>
<section id="word-game-root"><button id="word-game-toggle" aria-expanded="false">WORD QUEST</button><div id="word-game-inside" hidden><section id="commons-word"><div class="word-layout"><div class="word-panel">WORD FORM</div><div class="word-leaderboard">TEAM SCORES</div></div></section></div></section>
<section id="streetrod-root"><button id="sr-toggle" aria-expanded="false">STREET</button><div id="sr-inside" hidden>
<div id="src-classic-hub"><div id="streetrod-summer"><div id="ss-tabs">
<button data-ss-tab="garage" aria-pressed="true">Garage</button>
<button data-ss-tab="paper" aria-pressed="false">Paper</button>
<button data-ss-tab="parts" aria-pressed="false">Parts</button>
<button data-ss-tab="diner" aria-pressed="false">Diner</button>
</div><div id="ss-scene"><div class="ss-scene-head">GARAGE</div></div><p id="ss-status">Ready</p></div></div>
<section id="srj-junior"><details><summary>Junior</summary><div class="srj-inside">Stars</div></details></section>
</div></section>
</div></section>
<script>
for (const [btn,inside] of [['mahjong-toggle','mahjong-inside'],['plate-game-open','plate-game-content'],['letter-lock-toggle','letter-lock-content'],['word-game-toggle','word-game-inside'],['sr-toggle','sr-inside']]) {
 document.getElementById(btn).addEventListener('click',()=>{
  const el=document.getElementById(inside),b=document.getElementById(btn);
  el.hidden=!el.hidden;b.setAttribute('aria-expanded',String(!el.hidden));
 });
}
document.getElementById('ss-tabs').addEventListener('click',event=>{
 const b=event.target.closest('[data-ss-tab]');if(!b)return;
 document.querySelectorAll('#ss-tabs [data-ss-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));
});
</script>
<script type="module" src="/commons-arcade-shell.mjs"></script>
</body></html>"""

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  page=await browser.new_page(viewport={"width":390,"height":844},device_scale_factor=1,reduced_motion="reduce")
  errors=[]
  page.on("pageerror",lambda e:errors.append(str(e)))
  await page.route(URL,lambda route:route.fulfill(status=200,content_type="text/html",body=HTML))
  try:
   await page.goto(URL,wait_until="load")
   await page.locator("#arcade-launch").wait_for()
   await page.locator("#arcade-launch").click()
   assert await page.locator("#arcade-program-grid [data-arcade-game]").count()==7
   assert await page.evaluate("document.body.classList.contains('arcade-on')")
   assert await page.evaluate("getComputedStyle(document.body).overflow")=="hidden"
   await page.locator('#arcade-program-grid [data-arcade-game="mahjong"]').click()
   assert await page.locator("#mahjong-inside").evaluate("el=>!el.hidden")
   await page.locator('#arcade-hud-scenes [data-arcade-scene="levels"]').click()
   assert await page.locator("body").get_attribute("data-arcade-scene")=="levels"
   dims=await page.locator("#mahjong-root").bounding_box()
   assert dims and dims["y"]>=84 and dims["height"]<=844, dims
   await page.locator('#arcade-hud [data-arcade-action="options"]').click()
   await page.locator('#arcade-options-form input[name="contrast"][value="bright"]').check()
   assert await page.locator("body").get_attribute("data-arcade-contrast")=="bright"
   await page.locator('#arcade-options-view [data-arcade-action="options-back"]').click()
   assert await page.locator("body").get_attribute("data-arcade-game")=="mahjong"
   await page.locator('#arcade-hud [data-arcade-action="home"]').click()
   await page.locator('#arcade-program-grid [data-arcade-game="plates"]').click()
   await page.locator('#arcade-hud-scenes [data-arcade-scene="vote"]').click()
   assert await page.locator(".arcade-current-card").count()==1
   await page.locator('#arcade-hud [data-arcade-action="next"]').click()
   assert await page.locator("#arcade-hud-pagecount").inner_text()=="2 / 3"
   assert await page.locator("#plate-list .arcade-current-card").inner_text()=="TWO"
   await page.keyboard.press("Escape")
   assert await page.locator("body").get_attribute("data-arcade-game")==""
   await page.locator('#arcade-program-grid [data-arcade-game="streetrod"]').click()
   await page.locator('#arcade-hud-scenes [data-arcade-scene="diner"]').click()
   assert await page.locator('#ss-tabs [data-ss-tab="diner"]').get_attribute("aria-pressed")=="true"
   await page.locator('#arcade-hud-scenes [data-arcade-scene="junior"]').click()
   assert await page.locator("#srj-junior details").evaluate("el=>el.open")
   (ROOT/"reports").mkdir(exist_ok=True,parents=True)
   await page.screenshot(path=str(ROOT/"reports"/"arcade-one-screen-iphone-sample.png"),full_page=False,animations="disabled")
   await page.locator('#arcade-hud [data-arcade-action="exit"]').click()
   assert not await page.evaluate("document.body.classList.contains('arcade-on')")
   assert not errors, "Browser errors: "+"; ".join(errors)
   print("Arcade phone smoke PASS: launcher, 7 programs, scene swaps, settings, plate pagination, racing, junior and exit.")
  finally:
   await browser.close()
if __name__=="__main__":
 asyncio.run(main())
