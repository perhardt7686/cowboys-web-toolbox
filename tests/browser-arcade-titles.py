#!/usr/bin/env python3
"""Read-only synthetic member UI: each of eleven actual arcade entries must have
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
 ("skyboard","skyboard-toggle","SKYBOARD SPRINT"),
 ("fleet","star-squadron-toggle","STAR SQUADRON"),
 ("maze","mystery-maze-toggle","MYSTERY MAZE"),
 ("mahjong","mahjong-toggle","MAHJONG"),
 ("wordle","letter-lock-toggle","W0RDLE"),
 ("wordquest","word-game-toggle","WORD QUEST"),
 ("plates","plate-game-open","LICENSE PLATES"),
 ("drawing","drawing-studio-toggle","DRAWING STUDIO"),
 ("study","vdacs-study-toggle","7A STUDY CARDS")
]
HTML="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-arcade-shell.css">\n<link rel="stylesheet" href="/commons-retro-arcade.css">
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true}</script></head><body class="community-page" style="margin:0;background:#15152e">
<section id="conversations"><div class="community-main" style="min-height:1800px">
<section id="streetrod-root"><button id="sr-toggle" aria-expanded="false">Street Rod</button>
<div id="sr-inside" hidden><div id="src-classic-hub"><div id="streetrod-summer"><div id="ss-tabs"></div></div></div></div></section>
<section id="dash-forge-root"><button id="dash-forge-toggle" aria-expanded="false">Dash Forge</button>
<div id="dash-forge-inside" hidden><section id="dash-pane-builder"><h3>Level Studio</h3></section></div></section>
<section id="skyboard-root"><button id="skyboard-toggle" aria-expanded="false">Skyboard Sprint</button><div id="skyboard-inside" hidden>Race</div></section>
<section id="star-squadron-root" class="retro-game-root"><button class="retro-entry" id="star-squadron-toggle" aria-expanded="false">Star Squadron</button>
<div id="star-squadron-inside" class="retro-inside" hidden>
<header class="retro-head"><h2>Star Squadron</h2><p>Playable original family arcade stage.</p></header>
<div class="retro-statbar"><span class="retro-stat">BEST 0</span></div>
<div class="retro-display"><div class="retro-live">
<canvas class="retro-canvas" width="540" height="540" aria-label="Star Squadron live gameplay"></canvas>
<div class="retro-live-readout">SCORE 0 · LIVES 3</div>
<div class="retro-controls"><button class="retro-button retro-control" data-control="L">MOVE</button><button class="retro-button retro-control" data-control="F">ACTION</button></div>
<div class="retro-actions"><button class="retro-button retro-begin">Start round</button><button class="retro-button retro-end">Leave round</button></div>
<p class="retro-status">Ready for an approved family round.</p></div>
<div class="retro-trophies retro-panel-view" hidden>Trophies</div>
<div class="retro-leaders retro-panel-view" hidden>Family scores</div></div></div></section>
<section id="mystery-maze-root" class="retro-game-root"><button class="retro-entry" id="mystery-maze-toggle" aria-expanded="false">Mystery Maze</button>
<div id="mystery-maze-inside" class="retro-inside" hidden>
<header class="retro-head"><h2>Mystery Maze</h2><p>Playable original family arcade stage.</p></header>
<div class="retro-statbar"><span class="retro-stat">BEST 0</span></div>
<div class="retro-display"><div class="retro-live">
<canvas class="retro-canvas" width="540" height="540" aria-label="Mystery Maze live gameplay"></canvas>
<div class="retro-live-readout">SCORE 0 · LIVES 3</div>
<div class="retro-controls"><button class="retro-button retro-control" data-control="R">MOVE</button><button class="retro-button retro-control" data-control="F">ACTION</button></div>
<div class="retro-actions"><button class="retro-button retro-begin">Start round</button><button class="retro-button retro-end">Leave round</button></div>
<p class="retro-status">Ready for an approved family round.</p></div>
<div class="retro-trophies retro-panel-view" hidden>Trophies</div>
<div class="retro-leaders retro-panel-view" hidden>Family scores</div></div></div></section>
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
 ['sr-toggle','sr-inside'],['dash-forge-toggle','dash-forge-inside'],['skyboard-toggle','skyboard-inside'],
 ['star-squadron-toggle','star-squadron-inside'],['mystery-maze-toggle','mystery-maze-inside'],
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
  # Exercise the real browser-imported input buffer: a touch shorter than one
  # simulation step, followed by a keyboard/assistive click. No member login.
  tap_result=await page.evaluate("""async () => {
    const {createRetroInput}=await import('/retro-arcade-input.mjs?v=taps1');
    const pad=createRetroInput();
    const fire=document.createElement('button');
    fire.addEventListener('pointerdown',()=>pad.press('fleet','F'));
    fire.addEventListener('pointerup',()=>pad.release('F'));
    fire.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1}));
    fire.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}));
    const first=pad.action('fleet'),second=pad.action('fleet');
    const right=document.createElement('button');
    right.addEventListener('click',e=>{if(e.detail===0)pad.tap('fleet','R')});
    right.click();
    return [first,second,pad.action('fleet'),pad.action('fleet')];
  }""")
  assert tap_result==["F","N","R","N"],("Retro touch buffer or keyboard click failed",tap_result)
  # Exercise the actual browser-imported async cancellation guard, without
  # creating a real member session or calling production score RPCs.
  late_reply=await page.evaluate("""async () => {
    const {createRetroLifecycle}=await import('/retro-arcade-lifecycle.mjs?v=guard1');
    const guard=createRetroLifecycle();
    const old=guard.begin('fleet');
    guard.invalidate(); // Back to Games before network response.
    const newer=guard.begin('maze');
    const oldAccepted=await Promise.resolve().then(()=>guard.matches(old));
    return [oldAccepted,guard.matches(newer),guard.pendingGame()];
  }""")
  assert late_reply==[False,True,"maze"],("Canceled arcade start was accepted",late_reply)
  await page.locator("#arcade-program-grid").wait_for(state="attached",timeout=15000)
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
    'dash-forge-root' if game=="dashforge" else
    'star-squadron-root' if game=="fleet" else
    'mystery-maze-root' if game=="maze" else
    'letter-lock-root' if game=="wordle" else
    'word-game-root' if game=="wordquest" else
    'plate-game-root' if game=="plates" else
    'drawing-studio-game-root' if game=="drawing" else
    'vdacs-study-root' if game=="study" else game+"-root")).evaluate(
     "e=>e.classList.contains('arcade-game-active')"),(game,"Start did not activate game")
   assert await page.locator("#arcade-game-title-view").is_hidden(),("Title obscures gameplay",game)
   if game in ("fleet","maze"):
    root_id="star-squadron" if game=="fleet" else "mystery-maze"
    stage=page.locator("#"+root_id+"-root")
    assert await stage.is_visible(),(game,"The gameplay root is invisible despite an active title")
    assert await stage.evaluate("el=>getComputedStyle(el).position")=="fixed",(game,"Game did not enter fullscreen")
    rect=await stage.bounding_box()
    assert rect and rect["y"]>=0 and rect["height"]>90 and rect["y"]+rect["height"]<=height+2,(game,rect,width,height)
    assert await stage.locator(".retro-entry").is_hidden(),(game,"Duplicate inline launcher obscures stage")
    canvas=stage.locator(".retro-canvas")
    assert await canvas.is_visible(),(game,"Gameplay canvas hidden")
    assert await canvas.evaluate("el=>el.width>0&&el.height>0"),(game,"Canvas has zero resolution")
    display=stage.locator(".retro-display")
    assert await display.evaluate("el=>getComputedStyle(el).overflowY==='auto'"),(game,"Long stage must scroll inside fullscreen")
    control=stage.locator(".retro-control").first
    await control.scroll_into_view_if_needed()
    assert await control.is_visible(),(game,"Touch controls inaccessible")
    await control.click(timeout=3000)
    assert await stage.locator(".retro-live-readout").is_visible(),(game,"Score and lives must remain visible")
   await page.keyboard.press("Escape")
   assert not await page.evaluate("document.body.classList.contains('arcade-on')"),(game,"Can't exit")
  assert len(set(covers))==11,"Every game must have unique original artwork"
  if width==820:
   (ROOT/"reports").mkdir(parents=True,exist_ok=True)
   await page.locator("#dash-forge-toggle").click()
   await page.screenshot(path=str(ROOT/"reports"/"arcade-dash-title-tablet.png"),animations="disabled")
   await page.locator('[data-arcade-action="title-builder"]').click()
   assert await page.evaluate("window.__creatorEvents.at(-1)===false")
   await page.keyboard.press("Escape")
  assert not errors,"JS errors: "+"; ".join(errors)
  print("ELEVEN unique functional game title screens PASS",width,height)
 finally:await page.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for w,h in [(390,844),(820,1180),(844,390)]:
    await run_size(browser,w,h)
  finally:await browser.close()
if __name__=="__main__":asyncio.run(main())
