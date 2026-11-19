#!/usr/bin/env python3
"""Browser-rendered, no-account visual regression test of Mahjong colors and motion."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
URL="http://127.0.0.1:8765/community.html?preview=1&role=member"

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  try:
   for width in [375,390,430]:
    page=await browser.new_page(viewport={"width":width,"height":844},has_touch=True,reduced_motion="no-preference")
    errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    await page.goto(URL,wait_until="domcontentloaded",timeout=30000)
    await page.wait_for_load_state("domcontentloaded")
    await page.evaluate("""async()=>{
      // The sample tiles must be outside whichever family Arcade scene is
      // currently hidden. This fixture tests colors, not logged-in navigation.
      document.body.classList.remove('arcade-ready','arcade-on');
      document.documentElement.classList.remove('arcade-on');
      const {MAHJONG_VISUALS,visualForTile}=await import('/mahjong-kids-palette.mjs?v=kid7');
      const holder=document.createElement('section');
      holder.id='mahjong-kid-visual-fixture';
      holder.className='mahjong-game-zone';
      holder.style.cssText='margin:20px auto;max-width:360px;padding:12px;';
      const board=document.createElement('div');
      board.className='mahjong-board';
      board.id='mahjong-kid-test-board';
      board.style.cssText='position:relative;min-width:0;width:100%;height:245px;--mahjong-size:44px;';
      const glyphs=['龍','❀','竹','東','發','中','🐉','✿','🌊','南','☯','🌸','🐟','北','❈','西','☘','★'];
      for(let i=0;i<18;i++){
        const v=visualForTile(i+1);
        const tile=document.createElement('button');
        tile.type='button';
        tile.className='mahjong-tile mahjong-kids-tile mahjong-free mahjong-variant-'+(i%3===0?'sun':'flower');
        tile.dataset.testTile=String(i+1);
        tile.style.cssText='width:44px;height:50px;left:'+(8+(i%6)*53)+'px;top:'+(10+Math.floor(i/6)*70)+'px;';
        tile.style.setProperty('--tile-face',v.face);
        tile.style.setProperty('--tile-ink',v.ink);
        tile.style.setProperty('--tile-edge',v.edge);
        const g=document.createElement('span');g.className='mahjong-glyph';g.textContent=glyphs[i];
        const code=document.createElement('span');code.className='mahjong-match-code';code.textContent=v.code;
        const mark=document.createElement('span');mark.className='mahjong-mini';mark.textContent=i%3===0?'☀':'✿';
        tile.append(g,mark,code);
        board.append(tile);
      }
      holder.append(board);
      document.body.append(holder);
    }""")
    tiles=page.locator('#mahjong-kid-test-board .mahjong-kids-tile')
    await expect(tiles).to_have_count(18)
    values=await tiles.evaluate_all("""nodes=>nodes.map(el=>({
      face:getComputedStyle(el).backgroundColor, ink:getComputedStyle(el.querySelector('.mahjong-glyph')).color,
      tag:el.querySelector('.mahjong-match-code').textContent,
      codeVisible:el.querySelector('.mahjong-match-code').getBoundingClientRect().width>=12
    }))""")
    assert len({v['face'] for v in values})==18,(width,'tiles not uniquely colored',values)
    assert len({v['tag'] for v in values})==18,(width,'codes are not unique')
    assert all(v['codeVisible'] for v in values),(width,'tiny/hidden codes',values)
    await tiles.first.evaluate("(node)=>node.classList.add('mahjong-selected')")
    animation=await tiles.first.evaluate("(node)=>getComputedStyle(node).animationName")
    assert 'mahjong-kid-pop' in animation,(width,'selection has no motion',animation)
    await tiles.nth(1).evaluate("(node)=>node.classList.add('mahjong-hinted')")
    hinted=await tiles.nth(1).evaluate("(node)=>getComputedStyle(node).animationName")
    assert 'mahjong-kid-hint' in hinted,(width,'hint has no motion',hinted)
    await page.emulate_media(reduced_motion='reduce')
    no_motion=await tiles.first.evaluate("(node)=>getComputedStyle(node).animationName")
    assert no_motion=='none',(width,'reduced motion not honored',no_motion)
    bounds=await page.locator('#mahjong-kid-test-board').bounding_box()
    assert bounds and bounds['width']<=width,(width,'board overflows')
    assert not errors,(width,'page errors',errors[:3])
    (ROOT/'reports').mkdir(exist_ok=True)
    await page.screenshot(path=str(ROOT/'reports'/('mahjong-kid-colors-'+str(width)+'.png')),
      animations="disabled",full_page=False)
    print('Mahjong color, code and motion PASS at '+str(width)+'px')
    await page.close()
  finally:
   await browser.close()

if __name__=="__main__":
 asyncio.run(main())
