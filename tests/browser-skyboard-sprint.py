#!/usr/bin/env python3
"""Play actual Skyboard controls against a synthetic approved-member session."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL="http://127.0.0.1:8765/__skyboard__/community.html"
HTML="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-board-rush.css">
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true,supabaseUrl:'https://demo.supabase.co',publishableKey:'test'};</script>
</head><body class="community-page" style="margin:0;background:#171334;--arcade-top:0px;--arcade-bottom:0px">
<section id="conversations"><div class="community-main"><div id="dash-forge-root"></div></div></section>
<script type="module" src="/commons-board-rush.mjs"></script></body></html>"""
MOCK="""const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const createClient=()=>({
 auth:{getSession:async()=>({data:{session:{user:{id},access_token:'test-token'}}}),
  onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
 from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{status:'approved'},error:null})})})}),
 rpc:async(name,args={})=>{
  if(name==='community_avatar_projections')return {data:[{user_id:id,avatar_display:{skin:'tan',shirt:'teal',hair:'red',garment:'denim'}}],error:null};
  if(name==='community_boardride_state')return {data:{
   mine:{user_id:id,stage:1,points:0,coins:0,clears:0,runs:0},badges:[],leaders:[]},error:null};
  if(name==='community_boardride_start_v3')return {data:{
   run_id:'11111111-1111-4111-9111-111111111111',seed:212561^196930,stage:1,board:args.p_board,edition:2,
   ghost:{name:'QA ghost',frames:[[12,142,0,50],[24,284,0,50]],time_ms:10000}},error:null};
  return {data:null,error:{message:'Unexpected request '+name}}
 }
});
const fetchOriginal=window.fetch.bind(window);
window.fetch=async (url,options)=>{
  if(!String(url).endsWith('/functions/v1/family-arcade'))return fetchOriginal(url,options);
  const {replaySky}=await import(new URL('/skyboard-physics.mjs',window.location.origin).href);
  const body=JSON.parse(options.body),result=replaySky(1,212561^196930,'sunny',body.trace,{edition:2});
  window.replayChecked={...result,game:body.game,token:options.headers.Authorization};
  return Response.json({...result,saved:result.won,points:240,new_badges:['first','ball-survivor']});
};"""

async def capture_worlds(page):
 color_count=await page.evaluate("""async()=>{
  const [{createSkyScene},{buildSkyCourse,createSkyRide,skyTrack},{SKY_COLORS}]=await Promise.all([
   import('/skyboard-scene.mjs?v=courses2'),import('/skyboard-physics.mjs?v=courses2'),import('/skyboard-courses.mjs')
  ]);
  const sheet=document.createElement('canvas');sheet.width=960;sheet.height=420;sheet.id='sky-course-sheet';
  sheet.style.cssText='display:block;width:100%;height:auto;position:fixed;inset:0;z-index:999999999';
  document.body.append(sheet);
  const g=sheet.getContext('2d'),view=document.createElement('canvas');
  view.width=320;view.height=180;
  const scene=createSkyScene(320,180),board={id:'sunny',color:'#ffb95b',trail:'#ffed8a'};
  const sample=new Set();
  for(let i=0;i<SKY_COLORS.length;i++){
   const stage=1+i*5,course=buildSkyCourse(stage,stage*212561^196930,2),ride=createSkyRide(course);
   ride.progress=17;ride.y=skyTrack(course,17).y;
   const context=view.getContext('2d');
   scene.draw(context,ride,SKY_COLORS[i],board,null);
   sample.add(Array.from(context.getImageData(230,13,1,1).data).join(','));
   const x=i%3*320,y=Math.floor(i/3)*210;
   g.drawImage(view,x,y);
   g.fillStyle='#18233e';g.fillRect(x,y+180,320,30);
   g.font='600 14px system-ui';g.fillStyle='#fff4dc';
   g.fillText(course.info.world,x+10,y+200);
  }
  return sample.size;
 }""")
 assert color_count>=5, 'Scenery render should visibly separate the six worlds'
 # Export the canvas at native resolution rather than scaling to the test phone.
 png=await page.locator('#sky-course-sheet').evaluate("canvas=>canvas.toDataURL('image/png')")
 from base64 import b64decode
 (ROOT/'reports'/'skyboard-course-worlds.png').write_bytes(b64decode(png.partition(',')[2]))
 await page.locator('#sky-course-sheet').evaluate('canvas=>canvas.remove()')

async def verify(browser,size,full_race=False):
 width,height=size
 page=await browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1,has_touch=True)
 errors=[]
 page.on("pageerror",lambda err:errors.append(str(err)))
 await page.route(URL,lambda route:route.fulfill(status=200,content_type="text/html",body=HTML))
 await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm",lambda route:route.fulfill(
  status=200,content_type="text/javascript",headers={"access-control-allow-origin":"*"},body=MOCK))
 try:
  await page.goto(URL,wait_until="load")
  await page.locator("#skyboard-toggle").click(timeout=15000)
  await page.evaluate("""document.body.classList.add("arcade-on");
  document.body.dataset.arcadeGame="skyboard";document.body.dataset.arcadeScene="play";
  document.getElementById("skyboard-root").classList.add("arcade-game-active");""")
  assert await page.locator("#skyboard-inside").is_visible()
  assert await page.locator("#skyboard-board-list [data-sky-board]").count()==6
  assert await page.locator("#skyboard-badge-list .skyboard-badge").count()==8
  assert not await page.locator("[data-sky-board='star']").is_enabled()
  assert await page.locator("#skyboard-world").inner_text()=="Cloudline Cruise"
  await page.locator("#skyboard-courses summary").click()
  assert await page.locator("#skyboard-course-map button").count()==30
  assert await page.locator('[data-sky-practice="2"]').is_disabled()
  await page.locator('[data-sky-practice="shuffle"]').click()
  assert "PRACTICE" in await page.locator("#skyboard-start").inner_text()
  await page.locator("#skyboard-courses summary").click()
  await page.locator('[data-sky-practice="clear"]').click()
  await page.locator("#skyboard-start").click()
  canvas=page.locator("#skyboard-canvas")
  await page.wait_for_function("Number(document.querySelector('#skyboard-canvas').dataset.distance)>2",timeout=14000)
  assert "Asynchronous ghost" in await page.locator("#skyboard-status").inner_text()
  assert await page.locator("[data-sky-hold='left']").is_visible()
  assert await page.locator("[data-sky-action='jump']").is_visible()
  assert await canvas.evaluate("c=>c.getContext('2d').getImageData(480,270,1,1).data[3]===255")
  assert await page.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),size
  if full_race:
   assert await canvas.get_attribute('data-renderer')=='webgl'
   await page.evaluate("""() => {
    const canvas=document.querySelector('#skyboard-canvas');
    const seen=window.skyTimeline=[];
    new MutationObserver(()=>{
     const d=canvas.dataset;
     seen.push([d.raceState,Number(d.distance),Number(d.multiplier),Number(d.ballHits)]);
    }).observe(canvas,{attributes:true,attributeFilter:['data-distance']});
   }""")
   (ROOT/'reports').mkdir(parents=True,exist_ok=True)
   await page.screenshot(path=str(ROOT/'reports'/'skyboard-sprint-iphone.png'))
   await page.wait_for_function("window.skyTimeline.some(x=>x[0]==='boost'&&x[2]===10)",timeout=14000)
   await page.wait_for_function("window.skyTimeline.some((x,i,a)=>i>1&&x[0]==='hit'&&x[1]<a[i-1][1]-.03&&x[3]>0)",timeout=14000)
   await page.wait_for_function("window.skyTimeline.some((x,i,a)=>x[0]==='ride'&&x[3]>0&&x[1]>a.find(y=>y[3]>0)[1])",timeout=14000)
   await page.wait_for_function("window.replayChecked?.won&&window.replayChecked.ball_hits>0",timeout=45000)
   assert await page.evaluate("window.replayChecked.token==='Bearer test-token'")
   await page.locator("#skyboard-message").get_by_text("STAGE 1 CLEAR!").wait_for(timeout=10000)
   await capture_worlds(page)
  else:
   await page.locator("[data-sky-scene='boards']").click()
   assert await page.locator("#skyboard-boards").is_visible()
   await page.locator("[data-sky-scene='play']").click()
   assert await page.locator("#skyboard-pause").inner_text()=="RESUME"
   await page.locator("#skyboard-pause").click()
   await page.locator("[data-sky-action='jump']").tap()
   await page.keyboard.down("ArrowRight")
   await page.wait_for_timeout(150)
   await page.keyboard.up("ArrowRight")
   await page.locator("#skyboard-retry").click()
   assert await page.locator("#skyboard-message").is_hidden()
  assert not errors,("JS console errors",errors,size)
  print("Skyboard controls and geometry PASS",width,height,"full replay" if full_race else "surface")
 finally:await page.close()

async def main():
 async with async_playwright() as engine:
  chromium=await engine.chromium.launch(headless=True,args=['--enable-unsafe-swiftshader','--use-angle=swiftshader'])
  try:
   await verify(chromium,(390,844),True)
   await verify(chromium,(1160,810))
  finally:await chromium.close()
  webkit=await engine.webkit.launch(headless=True)
  try:
   await verify(webkit,(390,844))
   await verify(webkit,(844,390))
  finally:await webkit.close()
if __name__=="__main__":asyncio.run(main())
