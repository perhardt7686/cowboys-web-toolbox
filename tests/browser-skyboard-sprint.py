#!/usr/bin/env python3
"""Smoke-test Emma's playable Skyboard controls on a synthetic, approved member.
No real family credentials, scores, member records or database writes are used.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL="http://127.0.0.1:8765/__skyboard__/community.html"
HTML="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-board-rush.css">
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true,supabaseUrl:'https://demo.supabase.co',publishableKey:'test'};</script>
</head><body class="community-page" style="margin:0;background:#171334">
<section id="conversations"><div class="community-main"><div id="dash-forge-root"></div></div></section>
<script type="module" src="/commons-board-rush.mjs"></script>
</body></html>"""
MOCK="""export const createClient=()=>({
 auth:{
  getSession:async()=>({data:{session:{user:{id:'test-member'}}}}),
  onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
 },
 from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{status:'approved'},error:null})})})}),
 rpc:async(name,args={})=>{
  if(name==='community_boardride_state')return {data:{
   mine:{user_id:'test-member',stage:1,points:0,coins:0,clears:0,runs:0},
   badges:[],leaders:[]},error:null};
  if(name==='community_boardride_start')return {data:{run_id:'test-run',seed:12345678,stage:1,board:args.p_board},error:null};
  if(name==='community_boardride_finish')return {data:{saved:true,points:240,new_badges:['first']},error:null};
  return {data:null,error:{message:'Unexpected request '+name}}
 }
});"""

async def verify(browser,size):
 width,height=size
 page=await browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
 errors=[]
 page.on("pageerror",lambda err:errors.append(str(err)))
 await page.route(URL,lambda route:route.fulfill(status=200,content_type="text/html",body=HTML))
 await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm",lambda route:route.fulfill(
  status=200,content_type="text/javascript",headers={"access-control-allow-origin":"*"},body=MOCK))
 try:
  await page.goto(URL,wait_until="load")
  await page.locator("#skyboard-root").wait_for(state="attached",timeout=15000)
  await page.locator("#skyboard-toggle").click()
  await page.evaluate("""document.body.classList.add("arcade-on");document.documentElement.classList.add("arcade-on");
  document.body.dataset.arcadeGame="skyboard";document.body.dataset.arcadeScene="play";
  document.getElementById("skyboard-root").classList.add("arcade-game-active");""")
  assert await page.locator("#skyboard-inside").is_visible()
  assert await page.locator("#skyboard-board-list [data-sky-board]").count()==6
  assert await page.locator("#skyboard-badge-list .skyboard-badge").count()==6
  assert not await page.locator("[data-sky-board='star']").is_enabled()
  await page.locator("#skyboard-start").click()
  await page.locator("#skyboard-message").wait_for(state="hidden",timeout=8000)
  await page.wait_for_timeout(450)
  assert await page.locator("#skyboard-live-distance").inner_text()!="0%"
  assert await page.locator("[data-sky-hold='left']").is_visible()
  assert await page.locator("[data-sky-action='jump']").is_visible()
  data=await page.locator("#skyboard-canvas").evaluate(
   "canvas=>{let c=canvas.getContext('2d');let p=c.getImageData(480,270,1,1).data;return [...p]}")
  assert data[3]>0,("Game scene did not paint",size,data)
  await page.locator("[data-sky-scene='boards']").click()
  assert await page.locator("#skyboard-boards").is_visible()
  await page.locator("[data-sky-scene='play']").click()
  assert await page.locator("#skyboard-pause").inner_text()=="RESUME"
  await page.locator("#skyboard-pause").click()
  await page.locator("[data-sky-action='jump']").click()
  await page.keyboard.press("ArrowRight")
  await page.locator("#skyboard-retry").click()
  assert await page.locator("#skyboard-message").is_hidden()
  assert not errors,("JS console errors",errors,size)
  print("SKYBOARD actual playable controls PASS",width,height)
 finally:await page.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for size in [(390,844),(820,1180)]:
    await verify(browser,size)
  finally:await browser.close()
if __name__=="__main__":asyncio.run(main())
