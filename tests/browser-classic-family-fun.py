#!/usr/bin/env python3
"""Synthetic approved-member acceptance of PRIVATE classic loader and FAMILY FUN.
No real member auth, production DB writes, or commercial game ROMs are used.
Tests the real DOM modules in Chromium; mock emulator only proves local transfer,
not authentic commercial-game boot compatibility.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL="http://127.0.0.1:8765/__classic__/community.html"
HTML="""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-arcade-shell.css">
<link rel="stylesheet" href="/commons-classic-arcade.css">
<link rel="stylesheet" href="/commons-family-fun.css">
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true,supabaseUrl:'https://fake.supabase.co',
publishableKey:'test-publishable'};</script>
</head><body class="community-page" style="margin:0;background:#0e1430;color:#fff">
<section id="conversations"><div class="community-main" style="max-width:960px;margin:auto">
<section id="dash-forge-root"><button id="dash-forge-toggle" aria-expanded="false">Dash Forge</button><div id="dash-forge-inside" hidden>Campaign</div></section>
</div></section>
<script type="module" src="/commons-classic-arcade.mjs"></script>
<script type="module" src="/commons-arcade-shell.mjs"></script>
</body></html>"""
MOCK="""const uid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const mock=window.__classicMock={reports:[
 {user_id:uid,game:'centipede',points:1400,created_at:'2026-11-16T13:00:00Z'}],inserts:[],readCount:0};
function createQuery(table){
 const q={
  select(){return q;},eq(){return q;},order(){return q;},
  limit:async()=>({data:table==='community_classic_reports'?[...mock.reports].sort((a,b)=>b.points-a.points):[],error:null}),
  maybeSingle:async()=>({data:{status:'approved'},error:null}),
  insert:async row=>{mock.inserts.push(row);mock.reports.push({...row,created_at:new Date().toISOString()});return {data:row,error:null};},
  then(resolve,reject){return Promise.resolve({data:table==='community_profiles'?
   [{user_id:uid,display_name:'Test Family Player'}]:[],error:null}).then(resolve,reject);}
 };
 return q;
}
export function createClient(){
 return {auth:{
  getSession:async()=>({data:{session:{user:{id:uid},access_token:'synthetic-token'}}}),
  onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
 },from:createQuery,rpc:async(name)=>{
  mock.readCount++;
  if(name==='community_retro_state')return {data:{mine:[{game:'fleet',best:210}],
    leaders:[],trophies:[]},error:null};
  return {data:null,error:{message:'Unexpected mock RPC '+name}};
 }};
}"""
LOADER="""window.__classicInputs=[];
window.EJS_emulator={gameManager:{simulateInput:(player,button,pressed)=>{
 window.__classicInputs.push([player,button,pressed]);
}}};
document.getElementById('game').textContent='SYNTHETIC CORE HANDSHAKE';
window.EJS_ready?.();
window.EJS_onGameStart?.();"""

async def run(browser,w,h):
 page=await browser.new_page(viewport={"width":w,"height":h},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 await page.route(URL,lambda route:route.fulfill(status=200,content_type='text/html',body=HTML))
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm',
  lambda route:route.fulfill(status=200,content_type='text/javascript',
   headers={'access-control-allow-origin':'*'},body=MOCK))
 await page.route('https://cdn.emulatorjs.org/stable/data/loader.js',
  lambda route:route.fulfill(status=200,content_type='text/javascript',
   headers={'access-control-allow-origin':'*'},body=LOADER))
 try:
  await page.goto(URL,wait_until='load')
  await page.locator('#classic-centipede-toggle').wait_for(timeout=10000)
  await page.wait_for_function("""()=>{
   const el=document.getElementById('arcade-family-fun');
   return el&&el.textContent.includes('FAMILY FUN');
  }""")
  assert await page.locator('#arcade-family-fun').is_visible(), 'Marquee must be on visible board'
  assert await page.locator('#arcade-family-fun .family-fun-marquee').inner_text()=='FAMILY FUN'
  assert await page.locator('#classic-galaga-root [data-classic-file]').is_disabled(), 'Unsupported MSX cassette must not claim to boot'
  await page.locator('#arcade-family-fun [data-family-fun-game=centipede]').click()
  await page.wait_for_function("document.querySelector('#arcade-family-fun .family-fun-leaders').textContent.includes('1,400')",timeout=5000)
  assert 'REPORTED' in await page.locator('#arcade-family-fun').inner_text()
  assert await page.locator('#arcade-family-fun [data-family-fun-game]').count()==4
  assert await page.locator('#classic-pacman-toggle').count()==1
  assert await page.locator('#classic-topgear-toggle').count()==1
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),'Board horizontal overflow'
  if w==390:
   (ROOT/'reports').mkdir(exist_ok=True,parents=True)
   await page.screenshot(path=str(ROOT/'reports'/'family-fun-arcade-390.png'),animations='disabled')
  await page.locator('#classic-centipede-toggle').click()
  assert await page.locator('#arcade-game-title-view').is_visible()
  assert 'CENTIPEDE' in await page.locator('#arcade-game-title-view h2').inner_text()
  await page.locator('[data-arcade-action=title-start]').click()
  stage=page.locator('#classic-centipede-root')
  assert await stage.is_visible()
  assert await stage.evaluate('node=>getComputedStyle(node).position')=='fixed'
  assert await stage.locator('.classic-key').count()>=6
  assert 'FIRE' in await stage.locator('.classic-control-deck').inner_text()
  chooser=stage.locator('[data-classic-file=centipede]')
  await chooser.set_input_files({'name':'my-authorized-example.bin','mimeType':'application/octet-stream','buffer':bytes(4096)})
  await page.wait_for_function("document.querySelector('#classic-centipede-root .classic-status').textContent.includes('Emulator')",timeout=8000)
  frame=page.frame_locator('#classic-centipede-root .classic-frame')
  await frame.locator('#game').get_by_text('SYNTHETIC CORE HANDSHAKE').wait_for(timeout=12000)
  assert 'Emulator started' in await stage.locator('.classic-status').inner_text()
  button=stage.locator('[data-classic-control=fire]')
  await button.dispatch_event('pointerdown',{'pointerId':1,'bubbles':True})
  await button.dispatch_event('pointerup',{'pointerId':1,'bubbles':True})
  await page.wait_for_timeout(170)
  inputs=await frame.locator('#game').evaluate('el=>window.__classicInputs')
  assert any(i[1]==0 and i[2]==1 for i in inputs),('Fire input not reaching sandbox',inputs)
  await stage.locator('[data-classic-scene=scores]').click()
  await stage.locator('input[type=number]').fill('2300')
  await stage.locator('.classic-report').click()
  await page.wait_for_function("document.querySelector('#classic-centipede-root .classic-status').textContent.includes('saved')",timeout=7000)
  assert await page.evaluate('window.__classicMock.inserts.length')==1
  assert await page.evaluate("window.__classicMock.inserts[0].game")=='centipede'
  assert 'UNVERIFIED' in await stage.locator('.classic-pane[data-classic-pane=scores]').inner_text()
  assert not errors,('Browser JavaScript errors',errors)
  print('FAMILY FUN scoreboard and classic private loader PASS',w,h)
 finally: await page.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for w,h in [(390,844),(820,1180)]:
    await run(browser,w,h)
  finally:await browser.close()
if __name__=='__main__':asyncio.run(main())
