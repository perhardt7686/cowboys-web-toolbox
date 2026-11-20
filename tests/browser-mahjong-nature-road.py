#!/usr/bin/env python3
"""Synthetic approved-member Mystery Road map fixture. No live account needed."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8765/community.html?preview=1&role=member'

async def main():
 async with async_playwright() as playwright:
  browser=await playwright.chromium.launch(headless=True)
  try:
   for width,height in ((375,667),(390,844),(430,932),(768,1024)):
    page=await browser.new_page(viewport={'width':width,'height':height},has_touch=True,device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto(URL,wait_until='domcontentloaded',timeout=30000)
    await page.evaluate("""async()=>{
      const old=document.getElementById('mahjong-root');if(old)old.remove();
      document.body.classList.remove('arcade-on','arcade-ready');
      const root=document.createElement('section');
      root.id='mahjong-root';root.className='mahjong-game';
      root.style.cssText='box-sizing:border-box;width:min(100%,930px);margin:12px auto;';
      const inside=document.createElement('div');inside.id='mahjong-inside';
      const campaign=document.createElement('section');campaign.className='mahjong-campaign';
      inside.append(campaign);root.append(inside);document.body.append(root);
      const {mountNatureRoad}=await import('/mahjong-nature-road.mjs?v=nature1');
      window.__roadClicks=0;
      window.__road=mountNatureRoad(campaign,{onPlay:()=>window.__roadClicks++});
      window.__road.update({level:1110,cleared:1109,streak:9,run:null});
    }""")
    root=page.locator('#mahjong-nature-road')
    await expect(root).to_be_visible()
    await expect(root.locator('.nature-road-region-button')).to_have_count(20)
    await expect(root.locator('.nature-road-node')).to_have_count(25)
    await expect(root.locator('.nature-road-node[data-state=current]')).to_have_count(1)
    await expect(root.locator('.nature-road-node[data-state=locked]')).to_have_count(15)
    await expect(root.locator('.nature-road-node[data-state=cleared]')).to_have_count(9)
    await expect(root.locator('#nature-road-region')).to_contain_text('Lavender Vale')
    await expect(root.locator('#nature-road-progress')).to_contain_text('1,109 / 5,000')
    assert await root.locator('#nature-road-play').is_enabled()
    await root.locator('#nature-road-play').tap()
    assert await page.evaluate('window.__roadClicks')==1
    await root.locator('.nature-road-region-button[data-index="15"]').tap()
    await expect(root.locator('#nature-road-region')).to_contain_text('Emerald Rainforest')
    assert await root.locator('#nature-road-play').is_disabled()
    await root.locator('#nature-road-home').tap()
    await expect(root.locator('#nature-road-region')).to_contain_text('Lavender Vale')
    await root.locator('#nature-road-next-page').tap()
    assert await root.locator('#nature-road-play').is_disabled()
    await root.locator('#nature-road-home').tap()
    await root.locator('#nature-road-play').tap()
    assert await page.evaluate('window.__roadClicks')==2
    bounds=await root.bounding_box()
    assert bounds and bounds['width']<=width+1,(width,bounds)
    assert await root.locator('#nature-road-regions').evaluate('(el)=>el.scrollWidth>el.clientWidth')
    assert await root.locator('#nature-road-trail-completed').get_attribute('d') is not None
    await expect(root.locator('#nature-road-region-select')).to_have_value('4')
    await page.evaluate("""()=>window.__road.update({level:5000,cleared:5000,streak:5000,run:null})""")
    await expect(root.locator('#nature-road-percent')).to_have_text('100.00%')
    await expect(root.locator('#nature-road-region')).to_contain_text('Evergreen Sanctuary')
    assert await root.locator('#nature-road-play').is_disabled()
    await page.evaluate("""()=>window.__road.update({level:1001,cleared:1000,streak:0,run:null})""")
    await expect(root.locator('#nature-road-percent')).to_have_text('20.00%')
    await page.evaluate("""()=>{
      document.body.classList.add('arcade-on');
      document.body.dataset.arcadeGame='mahjong';document.body.dataset.arcadeScene='levels';
      document.documentElement.classList.add('arcade-on');
      document.getElementById('mahjong-root').classList.add('arcade-game-active');
    }""")
    assert await root.is_visible(),'Full-screen arcade Levels view must expose journey map'
    assert await page.locator('.mahjong-campaign').evaluate('(el)=>getComputedStyle(el).overflowY')=='hidden'
    assert await root.locator('#nature-road-region-select').count()==1
    await root.locator('#nature-road-region-select').select_option('19')
    await expect(root.locator('#nature-road-region')).to_contain_text('Evergreen Sanctuary')
    assert await root.locator('#nature-road-region-select').input_value()=='19'
    await root.locator('#nature-road-home').click()
    await page.wait_for_timeout(80)
    sizes=await page.evaluate("""()=>{
      const box=sel=>{const n=document.querySelector(sel);const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,client:n.clientHeight,scroll:n.scrollHeight};};
      return {windowHeight:innerHeight,windowWidth:innerWidth,campaign:box('.mahjong-campaign'),road:box('#mahjong-nature-road'),map:box('.nature-road-landscape'),play:box('#nature-road-play')};
    }""")
    assert sizes['play']['bottom']<=sizes['windowHeight']+2,('Play button below visible screen',width,height,sizes)
    assert sizes['map']['right']<=sizes['windowWidth']+2,('Landscape exceeds screen width',width,height,sizes)
    assert sizes['road']['scroll']<=sizes['road']['client']+3,('Road has hidden vertical content',width,height,sizes)
    await page.emulate_media(reduced_motion='reduce')
    assert await root.locator('.nature-road-creature').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
    # The fullscreen compositor migrates the real game into its own shell.
    # This test fixture stays attached to body, so return to normal Commons
    # layout for accurate mobile-width visual proof instead of screenshotting
    # an artificial 921px offscreen Arcade host.
    await page.evaluate("""()=>{
      document.body.classList.remove('arcade-on');
      document.documentElement.classList.remove('arcade-on');
      delete document.body.dataset.arcadeGame;delete document.body.dataset.arcadeScene;
      document.getElementById('mahjong-root').classList.remove('arcade-game-active');
    }""")
    await expect(root).to_be_visible()
    box=await root.bounding_box()
    assert box and box['width']<=width+1,(width,box)
    (ROOT/'reports').mkdir(exist_ok=True)
    await root.screenshot(path=str(ROOT/'reports'/f'mahjong-nature-road-{width}.png'),animations='disabled')
    assert not [s for s in errors if 'nature' in s.lower()],(width,errors[:5])
    print('PASS botanical Mystery Road',width,'px, 20 regions, 5000 levels, 25-node map, milestone, locked stage, play, arcade, motion')
    await page.close()
  finally:
   await browser.close()
if __name__=='__main__':asyncio.run(main())
