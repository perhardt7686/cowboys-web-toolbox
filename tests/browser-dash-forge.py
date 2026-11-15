#!/usr/bin/env python3
"""Tablet/mobile Dash Forge UI smoke with simulated approved membership.
All game RPCs are intercepted: NO real family accounts or writes.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8765/__dash_forge_smoke__.html'
HTML="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/commons-dash-forge.css">
<script>window.COWBOY_COMMUNITY_CONFIG={enabled:true,supabaseUrl:'https://mock.supabase.co',publishableKey:'test-publishable'}</script>
<script type="module" src="/commons-dash-forge.mjs"></script>
</head><body class="community-page"><section id="conversations"><div class="community-main"></div></section></body></html>"""
SUPABASE_STUB="""const uid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const levels=[
 ...[
 ['First Flight',34],['Prism Parade',43],['Neon Labyrinth',52],
 ['Lightning Alley',58],['Crystal Pulse',65],['The Last Leap',75],
  ['Neon Canopy 7',81],['Neon Canopy 8',55],['Neon Canopy 9',72],['Neon Canopy 10',89]
 ].map(([title,n],i)=>({id:i+1,title,kind:'campaign',stage:i+1,difficulty:Math.min(6,i+1),
  world:i<6?'Origin Circuit':'Neon Canopy',pace_ms:i<6?210:205,boss:false,
 pattern:'.'.repeat(6)+'s'+'.'.repeat(n-7),published:true,creator:null,verified_solves:0}))
];
const mock=window.__dashMock={calls:[],levels,progress:[],awards:[]};
export function createClient(){
 return {
  auth:{getSession:async()=>({data:{session:{user:{id:uid}}}}),
   onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
  from:(table)=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{status:'approved'},error:null})})})}),
  rpc:async(name,args={})=>{
   mock.calls.push({name,args});
   if(name==='community_dash_state')return {data:{
    user_id:uid,levels,progress:mock.progress,awards:mock.awards,leaders:[],
    campaign_current:1,campaign_max:1000000000,
    mine:{player_points:0,designer_points:0,clears:0,published:0}},error:null};
   if(name==='community_dash_save_world'){
    const id=args.p_level_id||100;
    const existing=levels.find(x=>x.id===id);
    if(existing){existing.title=args.p_title;existing.pattern=args.p_pattern;existing.world=args.p_world;existing.boss_style=args.p_boss_style;existing.boss=args.p_boss_style!=='none';}
    else levels.push({id,title:args.p_title,pattern:args.p_pattern,difficulty:args.p_difficulty,
     kind:'member',stage:null,creator:uid,creator_name:'Test Member',published:false,verified_solves:0,
     world:args.p_world,boss_style:args.p_boss_style,boss:args.p_boss_style!=='none',
     boss_name:args.p_boss_style==='volcanic'?'Magma Titan':null});
    return {data:{id,status:'draft'},error:null};}
   if(name==='community_dash_start'){
    const item=levels.find(x=>x.id===args.p_level_id);
    return {data:{run_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',title:item.title,
      level_id:item.id,pattern:item.pattern,pace_ms:item.pace_ms||210,world:item.world,
      boss:item.boss,boss_style:item.boss_style,boss_name:item.boss_name},error:null};}
   if(name==='community_dash_finish')return {data:{won:false,death_tile:6,elapsed_ms:1550,server_verified:true},error:null};
   if(name==='community_dash_publish')return {data:null,error:{message:'Beat the draft before publishing.'}};
   return {data:null,error:{message:'Unknown simulated RPC '+name}};
  }
 };
}"""

async def run_one(browser,width,height):
 page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,
  is_mobile=width<=820,has_touch=True)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  await page.route(URL,lambda route:route.fulfill(body=HTML,content_type='text/html'))
  await page.route('https://cdn.jsdelivr.net/**',lambda route:route.fulfill(body=SUPABASE_STUB,
    content_type='application/javascript',headers={'access-control-allow-origin':'*'}))
  await page.goto(URL,wait_until='domcontentloaded')
  await page.locator('#dash-forge-root').wait_for(timeout=15000)
  assert await page.locator('#dash-forge-toggle').is_visible()
  await page.locator('#dash-forge-toggle').click()
  await page.locator('#dash-campaign-list .dash-level').first.wait_for(timeout=12000)
  assert await page.locator('#dash-campaign-list .dash-level').count()==10, 'Expanded on-demand campaign window'
  assert await page.locator('#dash-campaign-list').get_by_text('Neon Canopy',exact=False).count()>=1
  assert 'ONE BILLION NUMBERED STAGES' in await page.locator('.dash-forever-counter').inner_text()
  assert await page.locator('[data-dash-play="2"]').is_disabled(), 'Next campaign stage locked'
  await page.locator('#dash-forge-root [data-dash-tab="builder"]').click()
  await page.locator('#dash-world').select_option('Volcanic Foundry')
  await page.locator('#dash-boss-style').select_option('volcanic')
  assert await page.locator('#dash-phase-guide').is_visible(), 'Boss Creator must expose three attack phases'
  assert await page.locator('#dash-creator-preview').is_visible(), 'Creator must preview chosen world'
  await page.locator('#dash-editor-grid [data-dash-cell="9"]').click()
  assert (await page.locator('#dash-editor-grid [data-dash-cell="9"]').inner_text()).endswith('▲')
  assert await page.locator('#dash-creator-preview').evaluate('c=>c.width===960&&c.height===360')
  assert await page.locator('#dash-editor-grid .dash-cell').count()==24
  assert await page.locator('#dash-editor-overview .dash-overview-tile').count()==48
  await page.locator('#dash-undo').click()
  assert (await page.locator('#dash-editor-grid [data-dash-cell="9"]').inner_text()).endswith('·')
  await page.locator('#dash-redo').click()
  assert (await page.locator('#dash-editor-grid [data-dash-cell="9"]').inner_text()).endswith('▲')
  await page.locator('#dash-editor-next').click()
  assert await page.locator('#dash-editor-grid [data-dash-cell="24"]').is_visible()
  await page.locator('#dash-editor-prev').click()
  assert await page.locator('#dash-editor-grid [data-dash-cell="9"]').is_visible()
  assert await page.locator('#dash-creator-preview').evaluate('c=>c.getContext("2d").getImageData(120,100,1,1).data[3]===255')
  await page.locator('#dash-forge-root [data-dash-action="save"]').click()
  await page.wait_for_function("window.__dashMock.calls.some(x=>x.name==='community_dash_save_world')")
  assert 'Volcanic Foundry' in await page.locator('#dash-builder-help').inner_text()
  assert await page.evaluate("window.__dashMock.calls.some(x=>x.name==='community_dash_save_world' && x.args.p_world==='Volcanic Foundry' && x.args.p_boss_style==='volcanic')")
  await page.wait_for_function("document.querySelector('#dash-editor-save-state')?.textContent.includes('DRAFT SAVED')",timeout=10000)
  # The family arcade owns the fullscreen active-game state before any real playtest.
  await page.evaluate("""() => {document.body.classList.add('arcade-on');
    document.body.dataset.arcadeGame='dashforge';document.body.dataset.arcadeScene='builder';
    document.querySelector('#dash-forge-root').classList.add('arcade-game-active');}""")
  # A one-tap playtest saves current edits first, starts the exact draft and returns to editor.
  await page.locator('#dash-editor-grid [data-dash-cell="10"]').click()
  await page.locator('[data-dash-action="test"]').click()
  await page.wait_for_function("window.__dashMock.calls.filter(x=>x.name==='community_dash_save_world').length>=2")
  await page.wait_for_function("window.__dashMock.calls.some(x=>x.name==='community_dash_start' && x.args.p_level_id===100)",timeout=10000)
  await page.locator('#dash-play-overlay').wait_for(state='visible',timeout=10000)
  assert await page.evaluate("window.__dashMock.calls.some(x=>x.name==='community_dash_start' && x.args.p_level_id===100)")
  assert 'BACK TO LEVEL CREATOR' in await page.locator('[data-dash-action="leave"]').inner_text()
  await page.locator('[data-dash-action="leave"]').click()
  assert await page.locator('#dash-pane-builder').is_visible()
  assert await page.locator('#dash-play-overlay').is_hidden()
  # Leave the synthetic fullscreen monitor to exercise existing inline list tabs.
  await page.evaluate("""() => {document.body.classList.remove('arcade-on');
    document.body.dataset.arcadeGame='';document.body.dataset.arcadeScene='';
    document.querySelector('#dash-forge-root').classList.remove('arcade-game-active');}""")
  await page.locator('#dash-forge-root [data-dash-tab="community"]').click()
  assert await page.locator('#dash-community-list .dash-level').count()==1, 'Draft visible to author'
  await page.locator('#dash-forge-root [data-dash-tab="campaign"]').click()
  # Synthetic arcade mode uses the actual fixed tablet frame and no altered game controls.
  await page.evaluate("""() => { document.body.classList.add('arcade-on');
    document.body.dataset.arcadeGame='dashforge';document.body.dataset.arcadeScene='campaign';
    document.querySelector('#dash-forge-root').classList.add('arcade-game-active'); }""")
  await page.locator('[data-dash-play="1"]').click()
  await page.locator('#dash-canvas').wait_for()
  assert await page.locator('#dash-play-overlay').is_visible()
  assert await page.locator('#dash-canvas').evaluate('c=>c.width===960 && c.height===360')
  box=await page.locator('#dash-forge-root').bounding_box()
  assert box and box['x']>=-2 and box['x']+box['width']<=width+3, ('Horizontal overflow',width,box)
  assert box['height']>145,('Game collapsed vertically',height,box)
  await page.locator('#dash-jump').tap()
  assert await page.locator('#dash-jump').is_visible()
  assert await page.locator('#dash-sound').is_visible()
  assert 'SOUND OFF' in await page.locator('#dash-sound').inner_text()
  if width==820:
   (ROOT/'reports').mkdir(parents=True,exist_ok=True)
   await page.screenshot(path=str(ROOT/'reports'/'dash-forge-tablet.png'))
  await page.locator('[data-dash-action="leave"]').click()
  assert await page.locator('#dash-play-overlay').is_hidden()
  assert not errors,'Browser JavaScript errors: '+'; '.join(errors)
  print('Dash Forge tablet/phone authentic canvas, editor and campaign PASS',width,height)
 finally:
  await page.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for w,h in [(820,1180),(390,844),(1024,768),(844,390)]:
    await run_one(browser,w,h)
  finally:await browser.close()

if __name__=='__main__':asyncio.run(main())
