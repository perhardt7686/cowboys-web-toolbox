#!/usr/bin/env python3
"""Chromium iPhone-sized visual / interaction checks for Classic Turtle.

Runs a synthetic approved-member fixture in the real Commons page so no user
account or live Supabase data is needed. Not a real-device or production login test.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8765/community.html?preview=1&role=member'

async def install_fixture(page):
    await page.goto(URL,wait_until='domcontentloaded',timeout=30000)
    await page.evaluate("""async()=>{
      const old=document.getElementById('mahjong-root'); if(old)old.remove();
      const root=document.createElement('section'); root.id='mahjong-root'; root.className='mahjong-game';
      root.style.cssText='box-sizing:border-box;width:min(100%,950px);max-width:100%;padding:10px;margin:10px auto;background:#fffaf1;';
      const inside=document.createElement('div');inside.id='mahjong-inside';inside.hidden=false;
      root.append(inside);document.body.append(root);
      const {mountClassicTurtle}=await import('/mahjong-turtle-ui.mjs?v=turtle1');
      window.__turtleUnmount=mountClassicTurtle(root,{userId:'synthetic-turtle-test'});
    }""")
    await expect(page.locator('#mahjong-classic-root .turtle-tile')).to_have_count(144)

async def witness_pair(page,kind='free'):
    return await page.evaluate("""async kind=>{
      const {buildTurtleDeal}=await import('/mahjong-turtle-engine.mjs');
      const store=JSON.parse(localStorage.getItem('cowboy-mahjong-turtle-v1:synthetic-turtle-test'));
      const session=kind==='daily'?store.dailies[new Date().toISOString().slice(0,10)]:store.free;
      const deal=buildTurtleDeal(session.layout,session.seed);
      return deal.witness[session.moves.length];
    }""",kind)

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for width in (375,390,430,768):
    page=await browser.new_page(viewport={'width':width,'height':844},has_touch=True,device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    await install_fixture(page)
    await expect(page.locator('#mahjong-root')).to_have_attribute('data-mahjong-mode','turtle')
    await expect(page.locator('.turtle-tile')).to_have_count(144)
    assert await page.locator('#turtle-remaining').inner_text()=='144 tiles remain'
    assert await page.locator('#turtle-zoom-in').is_visible()
    assert await page.locator('#turtle-hint').is_visible()
    assert await page.locator('#turtle-board-scroll').evaluate('(el)=>el.scrollWidth>el.clientWidth'),'zoom should allow pan'
    # The default board is 144 tiles, built from all five vertical levels.
    layers=await page.locator('.turtle-tile').evaluate_all('els=>[...new Set(els.map(e=>Number(e.getAttribute("aria-label").match(/layer (\\d+)/)[1])))].sort()')
    assert layers==[1,2,3,4,5],(width,layers)
    pair=await witness_pair(page)
    await page.locator(f'.turtle-tile[data-tile-id="{pair[0]}"]').tap()
    await expect(page.locator('.turtle-tile.is-selected')).to_have_count(1)
    await page.locator(f'.turtle-tile[data-tile-id="{pair[1]}"]').tap()
    await expect(page.locator('.turtle-tile')).to_have_count(142)
    await page.locator('#turtle-pause').tap()
    await expect(page.locator('#turtle-pause-screen')).to_be_visible()
    await page.reload(wait_until='domcontentloaded')
    await page.evaluate("""async()=>{
      const old=document.getElementById('mahjong-root');if(old)old.remove();
      const root=document.createElement('section');root.id='mahjong-root';root.className='mahjong-game';
      root.style.cssText='width:min(100%,950px);padding:10px;margin:10px auto;background:#fffaf1;';
      const inside=document.createElement('div');inside.id='mahjong-inside';root.append(inside);document.body.append(root);
      const {mountClassicTurtle}=await import('/mahjong-turtle-ui.mjs?v=turtle1');
      window.__turtleUnmount=mountClassicTurtle(root,{userId:'synthetic-turtle-test'});
    }""")
    await expect(page.locator('.turtle-tile')).to_have_count(142)
    await expect(page.locator('#turtle-pause-screen')).to_be_visible()
    await page.locator('#turtle-resume').tap()
    await expect(page.locator('#turtle-pause-screen')).to_be_hidden()
    await page.locator('#turtle-undo').tap()
    await expect(page.locator('.turtle-tile')).to_have_count(144)
    await page.locator('#turtle-hint').tap()
    await expect(page.locator('.turtle-tile.is-hinted')).to_have_count(2)
    await page.locator('button[data-kind="daily"]').tap()
    await expect(page.locator('#turtle-daily-banner')).to_be_visible()
    assert await page.locator('#turtle-layout').is_disabled()
    assert await page.locator('#turtle-new').is_disabled()
    assert await page.locator('#mahjong-classic-root').locator('button',has_text='Shuffle').count()==0
    await page.locator('button[data-kind="free"]').tap()
    await page.locator('#turtle-layout').select_option('temple')
    await expect(page.locator('.turtle-tile')).to_have_count(144)
    assert await page.locator('.turtle-tile[aria-label*="layer 4"]').count()==0
    await page.locator('#turtle-layout').select_option('garden')
    await expect(page.locator('.turtle-tile')).to_have_count(144)
    assert await page.locator('.turtle-tile[aria-label*="layer 2"]').count()==0
    if width==390:
     # Complete a full 144-tile board through real click handlers, not direct state edits.
     completed=await page.evaluate("""async()=>{
       const {buildTurtleDeal}=await import('/mahjong-turtle-engine.mjs');
       const store=JSON.parse(localStorage.getItem('cowboy-mahjong-turtle-v1:synthetic-turtle-test'));
       const deal=buildTurtleDeal(store.free.layout,store.free.seed);
       for(const [a,b] of deal.witness){
         document.querySelector('[data-tile-id="'+a+'"]')?.click();
         document.querySelector('[data-tile-id="'+b+'"]')?.click();
       }
       const now=JSON.parse(localStorage.getItem('cowboy-mahjong-turtle-v1:synthetic-turtle-test'));
       return {cleared:now.free.moves.length,won:Boolean(now.free.completedAt),history:now.history.length,remain:document.querySelectorAll('.turtle-tile').length};
     }""")
     assert completed['cleared']==72 and completed['won'] and completed['remain']==0 and completed['history']>0,completed
     await page.locator('button[data-kind="daily"]').tap()
     await expect(page.locator('.turtle-tile')).to_have_count(144)
     await page.locator('button[data-kind="free"]').tap()
     await expect(page.locator('.turtle-tile')).to_have_count(0)
     await page.locator('#turtle-new').tap()
     await expect(page.locator('.turtle-tile')).to_have_count(144)
    # Switch to original Mystery Road without overwriting its DOM (it remains outside fixture).
    await page.locator('button[data-mode="road"]').tap()
    await expect(page.locator('#mahjong-root')).to_have_attribute('data-mahjong-mode','road')
    await page.locator('button[data-mode="turtle"]').tap()
    await expect(page.locator('.turtle-tile')).to_have_count(144)
    (ROOT/'reports').mkdir(exist_ok=True)
    await page.locator('#mahjong-root').screenshot(path=str(ROOT/'reports'/f'mahjong-turtle-{width}.png'),animations='disabled')
    assert not [e for e in errors if 'turtle' in e.lower()],(width,errors[:4])
    print('PASS classic turtle',width,'px, 144 tiles, touch match, pause/reload, undo, hint, daily, layouts')
    await page.close()
  finally:
   await browser.close()
if __name__=='__main__':asyncio.run(main())