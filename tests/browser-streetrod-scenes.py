#!/usr/bin/env python3
"""Synthetic DOS-era Street r0d room navigation QA, no account or RPC writes.

Tests real EGA canvas, interactive objects, one-card-at-a-time
classifieds and rivals, saved-mechanic page UI, scene transitions, and fit.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8765/__streetrod_scene_smoke__/community.html'
HTML="""<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-streetrod-summer.css">
<link rel="stylesheet" href="/commons-streetrod-season-bay.css">
<link rel="stylesheet" href="/commons-streetrod-ega.css">
<link rel="stylesheet" href="/commons-arcade-shell.css">
<link rel="stylesheet" href="/commons-compact-ui.css">
<link rel="stylesheet" href="/commons-streetrod-scene-flow.css">
<style>
body{margin:0;background:#080808}
#streetrod-root{position:fixed!important;inset:var(--arcade-top) 0 0!important;
height:calc(100dvh - var(--arcade-top))!important;width:100%!important;
max-width:100%!important;overflow:hidden!important;background:#000!important}
#streetrod-summer{height:100%;position:relative}
#ss-season-bay[hidden]{display:none}
</style>
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true}</script></head>
<body class="community-page arcade-on" data-arcade-game="streetrod" data-arcade-scene="garage">
<section id="streetrod-root" class="sr-ega-mode sr-dos-fullscreen arcade-game-active">
<div id="sr-inside"><div id="src-classic-hub"><section id="streetrod-summer">
<div id="ss-metrics" class="ss-metrics"><div><small>WALLET</small><strong>$2,250</strong></div>
<div><small>CAR</small><strong>Rattler Coupe</strong></div></div>
<nav id="ss-tabs" class="ss-tabs">
<button data-ss-tab="garage" aria-pressed="true">Garage</button>
<button data-ss-tab="paper" aria-pressed="false">Newspaper</button>
<button data-ss-tab="parts" aria-pressed="false">Parts</button>
<button data-ss-tab="diner" aria-pressed="false">Diner</button>
<button data-ss-tab="drive" aria-pressed="false">Drive</button>
<button data-ss-tab="calendar" aria-pressed="false">Calendar</button></nav>
<div id="ss-scene"></div>
<section id="ss-season-bay" class="ssb-workbench" hidden>
<div class="ssb-body"><div class="ssb-title-row"><div><h4>Under the hood</h4></div></div>
<div class="ssb-wrench-switch"><strong>WRENCH</strong>
<button>Loosen</button><button>Tighten</button></div>
<div class="ssb-components">
<article class="ssb-component"><header><strong>Carburetor</strong></header><p>Inspect fasteners</p><div class="ssb-bolts"><button data-ssb="bolt">BOLT 1</button><button>BOLT 2</button><button>BOLT 3</button><button>BOLT 4</button></div></article>
<article class="ssb-component"><header><strong>Intake Manifold</strong></header><div class="ssb-bolts"><button data-ssb="bolt">BOLT 1</button></div></article>
<article class="ssb-component"><header><strong>Engine Block</strong></header><div class="ssb-bolts"><button data-ssb="bolt">BOLT 1</button></div></article>
</div><div class="ssb-bottom"><button>Lower hood</button></div></div>
<p class="ssb-status">Parts are saved with your garage.</p></section>
<p id="ss-status">Ready · all game changes backed by existing server operations.</p>
</section></div></div></section>
<script>
const elem=id=>document.getElementById(id);
function roomHtml(room){
 if(room==='garage')return '<div class="ss-scene-head"><h4>Garage</h4></div>'+
  '<div class="ss-garage-stage"><div class="ss-garage-overlay"><span>Rattler Coupe</span></div></div>'+
  '<div class="ss-actions"><button data-ss-action="workshop">Pop hood</button>'+
  '<button data-ss-action="refuel">Fuel</button><button data-ss-action="repair">Repair</button>'+
  '<button data-ss-action="bumpers">Bumpers</button></div>'+
  '<div class="ss-timing-bench"><div class="ss-timing-controls">'+
  '<div class="ss-distributor">TUNE</div><div class="ss-timing-steps">'+
  '<button data-ss-timing-step="-1">Retard</button><button data-ss-timing-step="1">Advance</button>'+
  '</div></div></div><form data-ss-form="tune"><select name="setting"><option>0</option></select>'+
  '<button>Save timing</button></form>';
 if(room==='paper')return '<div class="ss-scene-head">Newspaper</div><div class="ss-ads">'+
  ['1940 Coupe','1955 Wagon','1960 Rattler'].map((n,i)=>
  '<article class="ss-ad"><div class="ss-ad-main"><strong>'+n+'</strong>'+
  '<small>Used car · $'+(450+i*150)+'</small><div class="ss-ad-actions">'+
  '<button data-ss-action="buy_car" data-car="car'+i+'">Buy now</button>'+
  '<form data-ss-form="offer" data-car="car'+i+'"><input name="offer" value="380">'+
  '<button type="submit">Haggle</button></form></div></div></article>').join('')+'</div>';
 if(room==='parts')return '<div class="ss-parts-counter">'+['Engine','Wheels','Gearbox'].map((n,i)=>
  '<article><strong>'+n+'</strong><button data-ss-action="buy_part" data-kind="'+n.toLowerCase()+'">Buy used</button></article>').join('')+'</div>';
 if(room==='diner')return '<div class="ss-rivals">'+['The Rookie','Blackjack','The King'].map((n,i)=>
  '<article class="ss-rival"><strong>'+n+'</strong><button data-ss-action="choose_rival" data-rival="r'+i+'">Call out</button></article>').join('')+'</div>';
 if(room==='drive')return '<div class="ss-cockpit"><canvas width="960" height="340" id="ss-race-canvas"></canvas><div id="ss-start-lights">GREEN</div></div>'+
 '<div class="ss-drive-metrics"><div><strong id="ss-speed">64 mph</strong></div><div><strong id="ss-rpm">3400</strong></div><div><strong id="ss-gear">3</strong></div><div><strong id="ss-distance">25%</strong></div></div>'+
 '<div class="ss-drive-controls"><button data-ss-hold="left">STEER LEFT</button><button data-ss-hold="right">STEER RIGHT</button><button data-ss-hold="gas">GAS</button><button data-ss-hold="brake">BRAKE</button><button data-ss-action="shift">SHIFT UP</button><button data-ss-action="downshift">SHIFT DOWN</button></div>'+
 '<div class="ss-actions"><button data-ss-action="abandon">Abandon</button></div>';
 return '<div class="ss-scene-head">'+room.toUpperCase()+'</div>';
}
function applyRoom(room){
 elem('ss-scene').innerHTML=roomHtml(room);
 document.body.dataset.arcadeScene=room;
 for(const btn of elem('ss-tabs').querySelectorAll('button'))btn.setAttribute('aria-pressed',String(btn.dataset.ssTab===room));
}
elem('ss-tabs').addEventListener('click',e=>{
 const b=e.target.closest('[data-ss-tab]');if(b)applyRoom(b.dataset.ssTab);
});
elem('streetrod-summer').addEventListener('click',e=>{
 const b=e.target.closest('button[data-ss-action]');if(!b)return;
 if(b.dataset.ssAction==='workshop'){
  elem('ss-season-bay').hidden=false;return;
 }
 if(b.dataset.ssAction==='choose_rival'){
  const form=document.createElement('form');form.className='ss-challenge-form';
  form.innerHTML='<h5>Race offer</h5><label>Race <select name="type"><option>Drag</option></select></label><button type="submit">Start race</button>';
  elem('ss-scene').append(form);return;
 }
 elem('ss-status').textContent='Selected '+b.dataset.ssAction;
});
elem('streetrod-summer').addEventListener('submit',e=>{e.preventDefault();elem('ss-status').textContent='Submitted '+e.target.dataset.ssForm;});
applyRoom('garage');
</script>
<script type="module" src="/commons-streetrod-ega.mjs?v=dos7"></script>
<script type="module" src="/commons-streetrod-scene-flow.mjs?v=flow1"></script>
</body></html>"""

async def run_one(browser,width,height):
 p=await browser.new_page(viewport={'width':width,'height':height},
  device_scale_factor=1,reduced_motion='reduce')
 errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 await p.route(URL,lambda route:route.fulfill(status=200,content_type='text/html',body=HTML))
 try:
  await p.goto(URL,wait_until='load')
  await p.locator('#ss-dos-stage').wait_for(timeout=9000)
  assert await p.locator('#ss-dos-canvas').evaluate('el=>el.width===320&&el.height===200')
  assert await p.locator('#ss-dos-cover').count()==0
  assert await p.locator('#ss-dos-canvas').is_visible()
  assert await p.locator('.ss-dos-hotspot[data-sr-room="hood"]').count()==1
  assert await p.locator('#ss-dos-stage').evaluate('el=>getComputedStyle(el).overflow==="hidden"')
  bounds=await p.locator('#ss-dos-stage').bounding_box()
  assert bounds and bounds['y']>=0 and bounds['y']+bounds['height']<=height+3,(width,height,bounds)
  assert await p.locator('#ss-dos-canvas').evaluate('el=>{let d=el.getContext("2d").getImageData(120,90,1,1).data;return d[3]===255}'),"EGA painter should fill scene"
  await p.locator('.ss-dos-room-nav [data-sr-room="paper"]').click()
  await p.locator('.ss-dos-record-head').wait_for()
  assert '1 / 3' in await p.locator('.ss-dos-record-head').inner_text()
  await p.locator('.ss-dos-record-head [data-sr-room="next"]').click()
  assert '2 / 3' in await p.locator('.ss-dos-record-head').inner_text()
  assert '1955 Wagon' in await p.locator('#ss-dos-pocket').inner_text()
  await p.locator('.ss-dos-record [data-ss-action="buy_car"]').click()
  assert 'Selected buy_car' in await p.locator('#ss-status').inner_text()
  await p.locator('.ss-dos-room-nav [data-sr-room="garage"]').click()
  await p.locator('.ss-dos-room-nav [data-sr-room="diner"]').click()
  await p.locator('.ss-dos-record-head').wait_for()
  assert await p.locator('body').get_attribute('data-arcade-scene')=='diner'
  await p.locator('.ss-dos-record-head [data-sr-room="next"]').click()
  assert 'Blackjack' in await p.locator('#ss-dos-pocket').inner_text()
  await p.locator('#ss-dos-pocket [data-ss-action="choose_rival"]').click()
  await p.locator('#ss-dos-pocket .ss-challenge-form').wait_for()
  assert await p.locator('#ss-dos-pocket .ss-challenge-form button').is_visible()
  await p.evaluate("applyRoom('drive')")
  await p.locator('#ss-dos-telemetry').wait_for()
  await p.wait_for_function("document.querySelector('#ss-dos-telemetry')?.textContent?.includes('64 MPH')",timeout=4000)
  assert '3400 RPM' in await p.locator('#ss-dos-telemetry').inner_text()
  assert await p.locator('#ss-dos-pocket .ss-dos-drive-controls button').count()==6
  await p.locator('#ss-dos-pocket [data-ss-action="shift"]').click()
  assert 'Selected shift' in await p.locator('#ss-status').inner_text()
  await p.locator('.ss-dos-room-nav [data-sr-room="garage"]').click()
  await p.locator('.ss-dos-hotspots [data-sr-room="hood"]').click()
  await p.locator('#ss-season-bay:not([hidden])').wait_for()
  assert await p.locator('.ssb-component:visible').count()==1
  await p.locator('.ssb-pager [data-ssb-page="1"]').click()
  assert 'Intake Manifold' in await p.locator('.ssb-pager-label').inner_text()
  assert await p.locator('.ssb-component:visible').count()==1
  (ROOT/'reports').mkdir(exist_ok=True,parents=True)
  if width==390:
   await p.locator('#ss-season-bay').evaluate('el=>el.hidden=true')
   await p.screenshot(path=str(ROOT/'reports'/'streetrod-room-garage-mobile.png'),full_page=False)
  assert not errors,'Browser JS exceptions: '+'; '.join(errors)
  print('Street r0d native EGA room flow PASS',width,height)
 finally:await p.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for shape in [(390,844),(375,667),(844,390)]:
    await run_one(browser,*shape)
  finally:await browser.close()

if __name__=='__main__':asyncio.run(main())
