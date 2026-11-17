#!/usr/bin/env python3
"""Read-only synthetic member UI: each of thirteen active arcade entries must have
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
 ("galaga","classic-galaga-toggle","GALAGA"),
 ("pacman","classic-pacman-toggle","PAC-MAN"),
 ("centipede","classic-centipede-toggle","CENTIPEDE"),
 ("topgear","classic-topgear-toggle","TOP GEAR"),
 ("mahjong","mahjong-toggle","MAHJONG"),
 ("wordle","letter-lock-toggle","W0RDLE"),
 ("wordquest","word-game-toggle","WORD QUEST"),
 ("plates","plate-game-open","LICENSE PLATES"),
 ("drawing","drawing-studio-toggle","DRAWING STUDIO"),
 ("study","vdacs-study-toggle","7A STUDY CARDS")
]
HTML="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-arcade-shell.css">\n<link rel="stylesheet" href="/commons-retro-arcade.css">
<link rel="stylesheet" href="/commons-classic-arcade.css">
<link rel="stylesheet" href="/commons-family-fun.css">
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true}</script></head><body class="community-page" style="margin:0;background:#15152e">
<section id="conversations"><div class="community-main" style="min-height:1800px">
<section id="streetrod-root"><button id="sr-toggle" aria-expanded="false">Street Rod</button>
<div id="sr-inside" hidden><div id="src-classic-hub"><div id="streetrod-summer"><div id="ss-tabs"></div></div></div></div></section>
<section id="dash-forge-root"><button id="dash-forge-toggle" aria-expanded="false">Dash Forge</button>
<div id="dash-forge-inside" hidden><section id="dash-pane-builder"><h3>Level Studio</h3></section></div></section>
<section id="skyboard-root"><button id="skyboard-toggle" aria-expanded="false">Skyboard Sprint</button><div id="skyboard-inside" hidden>Race</div></section>
<section id="classic-galaga-root" class="classic-root">
<button class="classic-launch" id="classic-galaga-toggle" aria-expanded="false"> GALAGA </button>
<div id="classic-galaga-inside" class="classic-inside" hidden>
<h2>GALAGA</h2><div class="classic-control-deck"><button class="classic-key" aria-label="Arcade control">A</button></div>
<section class="classic-pane" data-classic-pane="play"><div class="classic-screen">PRIVATE FILE REQUIRED</div></section>
<section class="classic-pane" data-classic-pane="achievements" hidden>Goals</section>
<section class="classic-pane" data-classic-pane="scores" hidden>Reported Scores</section>
</div></section>
<section id="classic-pacman-root" class="classic-root">
<button class="classic-launch" id="classic-pacman-toggle" aria-expanded="false"> PACMAN </button>
<div id="classic-pacman-inside" class="classic-inside" hidden>
<h2>PACMAN</h2><div class="classic-control-deck"><button class="classic-key" aria-label="Arcade control">A</button></div>
<section class="classic-pane" data-classic-pane="play"><div class="classic-screen">PRIVATE FILE REQUIRED</div></section>
<section class="classic-pane" data-classic-pane="achievements" hidden>Goals</section>
<section class="classic-pane" data-classic-pane="scores" hidden>Reported Scores</section>
</div></section>
<section id="classic-centipede-root" class="classic-root">
<button class="classic-launch" id="classic-centipede-toggle" aria-expanded="false"> CENTIPEDE </button>
<div id="classic-centipede-inside" class="classic-inside" hidden>
<h2>CENTIPEDE</h2><div class="classic-control-deck"><button class="classic-key" aria-label="Arcade control">A</button></div>
<section class="classic-pane" data-classic-pane="play"><div class="classic-screen">PRIVATE FILE REQUIRED</div></section>
<section class="classic-pane" data-classic-pane="achievements" hidden>Goals</section>
<section class="classic-pane" data-classic-pane="scores" hidden>Reported Scores</section>
</div></section>
<section id="classic-topgear-root" class="classic-root">
<button class="classic-launch" id="classic-topgear-toggle" aria-expanded="false"> TOPGEAR </button>
<div id="classic-topgear-inside" class="classic-inside" hidden>
<h2>TOPGEAR</h2><div class="classic-control-deck"><button class="classic-key" aria-label="Arcade control">A</button></div>
<section class="classic-pane" data-classic-pane="play"><div class="classic-screen">PRIVATE FILE REQUIRED</div></section>
<section class="classic-pane" data-classic-pane="achievements" hidden>Goals</section>
<section class="classic-pane" data-classic-pane="scores" hidden>Reported Scores</section>
</div></section>
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
 ['classic-galaga-toggle','classic-galaga-inside'],['classic-pacman-toggle','classic-pacman-inside'],
 ['classic-centipede-toggle','classic-centipede-inside'],['classic-topgear-toggle','classic-topgear-inside'],
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
   root_id=('classic-'+game+'-root' if game in ('galaga','pacman','centipede','topgear') else
    'streetrod-root' if game=='streetrod' else 'dash-forge-root' if game=='dashforge' else
    'letter-lock-root' if game=='wordle' else 'word-game-root' if game=='wordquest' else
    'plate-game-root' if game=='plates' else 'drawing-studio-game-root' if game=='drawing' else
    'vdacs-study-root' if game=='study' else game+'-root')
   stage=page.locator('#'+root_id)
   assert await stage.evaluate("e=>e.classList.contains('arcade-game-active')"),(game,'Launch failed')
   assert await page.locator('#arcade-game-title-view').is_hidden(),(game,'Title still covering stage')
   if game in ('galaga','pacman','centipede','topgear'):
    assert await stage.is_visible(),(game,'Classic game hidden')
    assert await stage.evaluate('el=>getComputedStyle(el).position')=='fixed',(game,'Cabinet not fullscreen')
    rect=await stage.bounding_box()
    assert rect and rect['y']>=0 and rect['height']>90 and rect['y']+rect['height']<=height+2,(game,rect,width,height)
    assert await stage.locator('.classic-launch').is_hidden(),(game,'Duplicate button covers gameplay')
    assert await stage.locator('.classic-inside').is_visible(),(game,'Classic cabinet content missing')
    control=stage.locator('.classic-key').first
    await control.scroll_into_view_if_needed()
    assert await control.is_visible(),(game,'Touch controls unreachable')
    await control.click(timeout=3000)
   await page.keyboard.press("Escape")
   assert not await page.evaluate("document.body.classList.contains('arcade-on')"),(game,"Can't exit")
  assert len(set(covers))==13,"Every game must have unique original artwork"
  if width==820:
   (ROOT/"reports").mkdir(parents=True,exist_ok=True)
   await page.locator("#dash-forge-toggle").click()
   await page.screenshot(path=str(ROOT/"reports"/"arcade-dash-title-tablet.png"),animations="disabled")
   await page.locator('[data-arcade-action="title-builder"]').click()
   assert await page.evaluate("window.__creatorEvents.at(-1)===false")
   await page.keyboard.press("Escape")
  assert not errors,"JS errors: "+"; ".join(errors)
  print("THIRTEEN unique functional game title screens PASS",width,height)
 finally:await page.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for w,h in [(390,844),(820,1180),(844,390)]:
    await run_size(browser,w,h)
  finally:await browser.close()
if __name__=="__main__":asyncio.run(main())
