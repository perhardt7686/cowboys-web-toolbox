#!/usr/bin/env python3
"""Synthetic responsive QA for independently launched Commons arcade games.

No real accounts, member records, credits, scores, purchases or backend APIs.
Tests the actual CSS and navigation with stand-in game DOM nodes on 3 devices.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL="http://127.0.0.1:8765/__arcade_smoke__/community.html"
HTML="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{background:#261f31;color:#fff;margin:0}.community-main{max-width:1000px;margin:auto}#conversations{min-height:1400px}</style>
<link rel="stylesheet" href="/commons-mahjong.css">
<link rel="stylesheet" href="/commons-family.css">
<link rel="stylesheet" href="/commons-letter-lock.css">
<link rel="stylesheet" href="/commons-plates.css">
<link rel="stylesheet" href="/commons-vdacs-study.css">
<link rel="stylesheet" href="/commons-streetrod-summer.css">
<link rel="stylesheet" href="/commons-arcade-shell.css">
<link rel="stylesheet" href="/commons-compact-ui.css">
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true}</script></head>
<body class="community-page"><section id="conversations">
<div class="community-main">
<div id="coco-cast-strip">Old avatar portrait strip</div>
<section class="family-room" id="legacy-family-room"><h2 id="family-room-title">More moments together.</h2><button>Question of the week</button></section>
<div id="community-feed"><article class="thread-card"><h3><button class="thread-title">Discussion 1</button></h3><p class="thread-excerpt">Short preview 1</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 2</button></h3><p class="thread-excerpt">Short preview 2</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 3</button></h3><p class="thread-excerpt">Short preview 3</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 4</button></h3><p class="thread-excerpt">Short preview 4</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 5</button></h3><p class="thread-excerpt">Short preview 5</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 6</button></h3><p class="thread-excerpt">Short preview 6</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 7</button></h3><p class="thread-excerpt">Short preview 7</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 8</button></h3><p class="thread-excerpt">Short preview 8</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 9</button></h3><p class="thread-excerpt">Short preview 9</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 10</button></h3><p class="thread-excerpt">Short preview 10</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 11</button></h3><p class="thread-excerpt">Short preview 11</p></article><article class="thread-card"><h3><button class="thread-title">Discussion 12</button></h3><p class="thread-excerpt">Short preview 12</p></article></div>
<button id="load-more" hidden>More</button>
<section id="mahjong-root" class="mahjong-game">
<button class="mahjong-entry-button" id="mahjong-toggle" aria-expanded="false">MAHJONG</button>
<div id="mahjong-inside" hidden><div class="mahjong-stats">RUN STATS</div>
<section class="mahjong-game-zone">
<div class="mahjong-hud">MATCHES: 72</div><div class="mahjong-view-tools"><button>FIT</button><button>ZOOM</button></div>
<div id="mahjong-board-wrap"><div id="mahjong-board" style="height:350px">TILE BOARD</div></div>
<div class="mahjong-actions"><button>NEW</button><button>PAUSE</button><button>HINT</button><button>SHUFFLE</button><button>UNDO</button></div>
<p class="mahjong-status">READY</p></section>
<section class="mahjong-campaign">LEVELS</section>
<section class="mahjong-bottom"><section class="mahjong-leaders">SCORES</section><section class="mahjong-badges">BADGES</section></section>
<section class="mahjong-history">HISTORY</section></div></section>
<section id="plate-game-root" class="plate-game"><button class="plate-entry-button" id="plate-game-open" aria-expanded="false">PLATES</button>
<div id="plate-game-content" hidden><form id="plate-new">POST PHOTO<input type="file"><input placeholder="PLATE"><textarea placeholder="GUESS"></textarea></form>
<div id="plate-list"><article class="plate-card" data-plate-id="a">ONE</article><article class="plate-card" data-plate-id="b">TWO</article><article class="plate-card" data-plate-id="c">THREE</article></div>
<section id="plate-gallery"><header class="plate-gallery-head">Saved photos</header><div id="plate-gallery-grid" class="plate-gallery-grid"><button class="plate-gallery-tile" data-plate-id="a">ONE</button><button class="plate-gallery-tile" data-plate-id="b">TWO</button></div><nav class="plate-gallery-pages"><button>Earlier</button><span>1 / 1</span><button>Later</button></nav></section>
<section class="commons-score-ribbon">SCORE</section><section class="plate-heading">LEADERS</section></div></section>
<section id="letter-lock-root" class="mahjong-game"><button class="mahjong-entry-button" id="letter-lock-toggle" aria-expanded="false">W0RDLE</button>
<div id="letter-lock-content" hidden><div class="letter-lock-inner"><div class="letter-lock-layout">
<section class="letter-lock-panel"><div id="letter-lock-statline" class="arcade-game-metrics">
<div class="arcade-metric"><small>DAY</small><strong>26</strong></div>
<div class="arcade-metric"><small>POINTS</small><strong>170</strong></div>
<div class="arcade-metric"><small>GUESSES</small><strong>5 / 12</strong></div></div>
<div id="letter-lock-grid" class="letter-lock-grid"></div>
<form id="letter-lock-form" class="letter-lock-form"><input aria-label="guess"><button>GUESS</button><button>REFRESH</button></form>
<div id="letter-lock-keyboard" class="letter-lock-keyboard"></div>
<p id="letter-lock-status" class="letter-lock-message">SAVED</p></section>
<section class="letter-lock-aside"><ol id="letter-lock-leaders">SCORES</ol><div id="letter-lock-awards">AWARDS</div></section>
</div></div></div></section>
<section id="word-game-root" class="mahjong-game"><button class="mahjong-entry-button" id="word-game-toggle" aria-expanded="false">WORD QUEST</button>
<div id="word-game-inside" hidden><section id="commons-word" class="family-stage">
<div class="word-layout"><div class="word-panel">
<p class="word-clue">Find the hidden word</p>
<div class="word-stats"><span class="family-pill">WINS 3</span><span class="family-pill">SCORE 25</span></div>
<div id="commons-word-moves">GUESS HISTORY</div><form class="word-guess-form"><input aria-label="guess"><button>GUESS</button></form>
</div><div class="word-leaderboard">TEAM SCORES</div></div></section></div></section>
<section id="streetrod-root"><button class="mahjong-entry-button" id="sr-toggle" aria-expanded="false">STREET R0D</button><div id="sr-inside" hidden>
<div id="src-classic-hub"><div id="streetrod-summer"><div id="ss-tabs">
<button data-ss-tab="garage" aria-pressed="true">Garage</button>
<button data-ss-tab="paper" aria-pressed="false">Paper</button>
<button data-ss-tab="parts" aria-pressed="false">Parts</button>
<button data-ss-tab="diner" aria-pressed="false">Diner</button>
</div><div id="ss-scene"><div class="ss-scene-head">GARAGE</div></div><p id="ss-status">Ready</p></div></div>
<section id="srj-junior"><details><summary>Junior</summary><div class="srj-inside">Stars</div></details></section>
</div></section>
<section id="vdacs-study-root" class="mahjong-game"><button class="mahjong-entry-button" id="vdacs-study-toggle" aria-expanded="false">7A STUDY</button>
<div id="vdacs-study-inside" hidden><div class="vdacs-inner"><div class="vdacs-controls">TOPICS</div>
<div id="vdacs-study-card" class="vdacs-card">WHAT IS THE ANSWER?</div><div class="vdacs-actions"><button>PREVIOUS</button><button>REVEAL</button><button>NEXT</button></div>
<div class="vdacs-badges">MILESTONES</div></div></div></section>
<div id="commons-family-zone" class="community-play-zone"></div>
<section id="drawing-studio-game-root" class="mahjong-game drawing-studio-game">
<button id="drawing-studio-toggle" aria-expanded="false" class="mahjong-entry-button">DRAWING STUDIO</button>
<div id="drawing-studio-inside" hidden><section id="commons-art" class="family-stage">
<div id="commons-drawing-root"><div class="art-tools" id="art-toolbox"><button>PEN</button><button>ERASER</button></div><div class="art-actions"><button>Save PNG</button></div><div id="art-viewport"><canvas id="commons-art-canvas" width="1000" height="640"></canvas></div><select id="art-zoom"><option value="1" selected>Fit</option></select></div></section></div></section>
</div></section>
<script>
for (const [btn,inside] of [['mahjong-toggle','mahjong-inside'],['plate-game-open','plate-game-content'],['letter-lock-toggle','letter-lock-content'],['word-game-toggle','word-game-inside'],['sr-toggle','sr-inside'],['vdacs-study-toggle','vdacs-study-inside'],['drawing-studio-toggle','drawing-studio-inside']]) {
 document.getElementById(btn).addEventListener('click',()=>{
  const el=document.getElementById(inside),b=document.getElementById(btn);
  el.hidden=!el.hidden;b.setAttribute('aria-expanded',String(!el.hidden));
 });
}
document.getElementById('ss-tabs').addEventListener('click',event=>{
 const b=event.target.closest('[data-ss-tab]');if(!b)return;
 document.querySelectorAll('#ss-tabs [data-ss-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));
});
for(let i=0;i<12;i++){
 const row=document.createElement('div');row.className='letter-lock-grid-row';
 for(let j=0;j<5;j++){const tile=document.createElement('span');tile.className='letter-lock-tile';tile.textContent='A';row.append(tile)}
 document.getElementById('letter-lock-grid').append(row);
}
for(const word of ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']){
 const row=document.createElement('div');row.className='letter-lock-keyboard-row';
 for(const letter of word){const b=document.createElement('button');b.className='letter-lock-key';b.textContent=letter;row.append(b)}
 document.getElementById('letter-lock-keyboard').append(row);
}
</script><script type="module" src="/commons-arcade-shell.mjs"></script>
<script type="module" src="/commons-board-compact.mjs"></script>
<script type="module" src="/community-board-accessibility.mjs"></script>
</body></html>"""

async def check_one(page, id, root):
 await page.locator(id).click()
 assert await page.locator("body").get_attribute("data-arcade-game")==root
 assert await page.evaluate("document.body.classList.contains('arcade-on')")
 assert await page.evaluate("getComputedStyle(document.body).overflow")=="hidden"
 bbox=await page.locator({
  "mahjong":"#mahjong-root","wordle":"#letter-lock-root","wordquest":"#word-game-root",
  "plates":"#plate-game-root","streetrod":"#streetrod-root","study":"#vdacs-study-root",
  "drawing":"#drawing-studio-game-root"
 }[root]).bounding_box()
 dims=page.viewport_size
 assert bbox and bbox["x"]>=-2 and bbox["y"]>=0 and bbox["y"]+bbox["height"]<=dims["height"]+2, (root,bbox,dims)
 await page.locator('#arcade-hud [data-arcade-action="exit"]').click()
 assert not await page.evaluate("document.body.classList.contains('arcade-on')")
 assert await page.locator("body").get_attribute("data-arcade-game")==""

async def run_device(browser,width,height):
 page=await browser.new_page(viewport={"width":width,"height":height},
  device_scale_factor=1,reduced_motion="reduce")
 errors=[]
 page.on("pageerror",lambda e:errors.append(str(e)))
 await page.route(URL,lambda route:route.fulfill(status=200,content_type="text/html",body=HTML))
 try:
  await page.goto(URL,wait_until="load")
  await page.locator("#drawing-studio-game-root").wait_for(timeout=8000)
  assert await page.locator("#arcade-launch").count()==0, "The old shared launcher must be gone"
  assert await page.locator("#arcade-program-grid").count()==1, "The old hidden markup may remain for settings but must not appear"
  assert await page.locator("#arcade-program-grid").is_hidden()
  assert await page.locator("#coco-cast-strip").is_hidden(),"Portrait strip should not appear"
  assert await page.locator("#legacy-family-room").count()==0,"Legacy family panel must be removed"
  assert await page.locator(".family-reading-bar #family-read-toggle").is_visible(),"Reading comfort should survive"
  await page.evaluate("""() => {
    const obsolete=document.createElement('section');
    obsolete.className='family-room';obsolete.id='reinserted-family-room';
    obsolete.textContent="Coco's Family Corner";
    document.querySelector('#conversations .community-main').append(obsolete);
  }""")
  await page.wait_for_function("!document.getElementById('reinserted-family-room')",timeout=3000)

  assert await page.locator("#community-feed .thread-card:visible").count()==6,"Initially show six conversations"
  await page.locator("#compact-feed-more").click()
  assert await page.locator("#community-feed .thread-card:visible").count()==12,"Reveal another six"
  assert await page.locator("#arcade-drawing-entry").count()==0,"Duplicate drawing button must not exist"
  assert await page.locator("#drawing-studio-toggle").count()==1,"Keep only original Drawing Studio button"
  for selector in ["#mahjong-toggle","#letter-lock-toggle","#word-game-toggle",
    "#plate-game-open","#sr-toggle","#vdacs-study-toggle","#drawing-studio-toggle"]:
   assert await page.locator(selector).is_visible(),selector
  await check_one(page,"#mahjong-toggle","mahjong")
  await page.locator("#mahjong-toggle").click()
  assert await page.locator("#mahjong-board-wrap").evaluate("el=>getComputedStyle(el).overflow==='hidden'"),"Board must never scroll"
  assert await page.locator(".mahjong-game-zone .mahjong-actions").evaluate("el=>getComputedStyle(el).gridTemplateColumns.split(' ').length===5"),"Mahjong actions must be in one row"
  await page.locator('#arcade-hud [data-arcade-action="exit"]').click()
  await page.locator("#mahjong-toggle").click()
  await page.locator('#arcade-hud [data-arcade-action="scene-next"]').click()
  assert await page.locator("body").get_attribute("data-arcade-scene")=="levels"
  await page.locator('#arcade-hud [data-arcade-action="options"]').click()
  assert await page.locator('#arcade-options-view').is_visible()
  await page.locator('#arcade-options-form input[name="contrast"][value="bright"]').check()
  assert await page.locator("body").get_attribute("data-arcade-contrast")=="bright"
  await page.locator('#arcade-options-view [data-arcade-action="options-back"]').click()
  assert await page.locator("body").get_attribute("data-arcade-game")=="mahjong"
  await page.keyboard.press("Escape")
  assert not await page.evaluate("document.body.classList.contains('arcade-on')")
  await check_one(page,"#letter-lock-toggle","wordle")
  await check_one(page,"#word-game-toggle","wordquest")
  await check_one(page,"#plate-game-open","plates")
  await page.locator('#plate-game-open').click()
  await page.locator('#arcade-hud [data-arcade-action="scene-next"]').click()
  assert await page.locator(".arcade-current-card").count()==1
  await page.locator('#arcade-hud [data-arcade-action="next"]').click()
  assert await page.locator("#arcade-hud-pagecount").inner_text()=="2 / 3"
  await page.locator('#arcade-hud [data-arcade-action="scene-next"]').click()
  assert await page.locator("body").get_attribute("data-arcade-scene")=="history"
  assert await page.locator("#plate-gallery").is_visible(),"Saved photo gallery must show"
  await page.locator('#arcade-hud [data-arcade-action="exit"]').click()
  await page.locator('#sr-toggle').click()
  for _ in range(4):await page.locator('#arcade-hud [data-arcade-action="scene-next"]').click()
  assert await page.locator('#ss-tabs [data-ss-tab="diner"]').get_attribute("aria-pressed")=="true"
  for _ in range(3):await page.locator('#arcade-hud [data-arcade-action="scene-next"]').click()
  assert await page.locator("#srj-junior details").evaluate("el=>el.open")
  await page.locator('#arcade-hud [data-arcade-action="exit"]').click()
  await check_one(page,"#vdacs-study-toggle","study")
  await check_one(page,"#drawing-studio-toggle","drawing")
  await page.locator("#drawing-studio-toggle").click()
  assert await page.locator("#drawing-studio-inside").evaluate("el=>!el.hidden")
  assert await page.locator("#commons-drawing-root canvas").count()==1,"Original canvas must survive fullscreen navigation"
  assert await page.locator("#art-viewport").is_visible(),"Actual canvas viewport is visible"
  assert await page.locator("#art-tools-toggle").is_visible(),"Tools drawer control is visible"
  await page.locator("#art-tools-toggle").click()
  assert await page.locator("#art-drawer").is_visible(),"Advanced tools can be opened"
  await page.locator("#art-tools-toggle").click()
  assert await page.locator("#art-drawer").is_hidden(),"Advanced tools can close"
  await page.locator('#arcade-hud [data-arcade-action="exit"]').click()
  await page.locator("#letter-lock-toggle").click()
  if height>=650:
   panel=await page.locator(".letter-lock-panel").bounding_box()
   keyboard=await page.locator("#letter-lock-keyboard").bounding_box()
   grid=await page.locator("#letter-lock-grid").bounding_box()
   last=await page.locator("#letter-lock-grid .letter-lock-grid-row:last-child").bounding_box()
   assert panel and keyboard and keyboard["y"]+keyboard["height"]<=panel["y"]+panel["height"]+2, (
    "Keyboard extends below game screen",width,height,panel,keyboard)
   assert grid and last and last["y"]+last["height"]<=grid["y"]+grid["height"]+3,(
    "Word puzzle rows are cropped",width,height,grid,last)
  (ROOT/"reports").mkdir(exist_ok=True,parents=True)
  if width==390:
   await page.screenshot(path=str(ROOT/"reports"/"arcade-one-screen-iphone-sample.png"),
    full_page=False,animations="disabled")
  await page.locator('#arcade-hud [data-arcade-action="exit"]').click()
  assert not errors,"Browser JS errors: "+"; ".join(errors)
  print(f"Standalone arcade buttons and fullscreen scenes PASS at {width}x{height}")
 finally:await page.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for width,height in [(390,844),(375,667),(844,390)]:
    await run_device(browser,width,height)
  finally:await browser.close()

if __name__=="__main__":asyncio.run(main())
