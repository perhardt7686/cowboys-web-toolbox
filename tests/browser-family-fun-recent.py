#!/usr/bin/env python3
"""Synthetic, no-account activity and reading dropdown visual regression."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8765/community.html?preview=1&role=member'

async def main():
 async with async_playwright() as playwright:
  browser=await playwright.chromium.launch(headless=True)
  try:
   for width in (375,430,768):
    page=await browser.new_page(viewport={'width':width,'height':844},has_touch=True,device_scale_factor=1)
    await page.goto(URL,wait_until='domcontentloaded',timeout=30000)
    await expect(page.locator('#family-reading-menu')).to_have_count(1)
    await page.evaluate("""async()=>{
      document.getElementById('conversations').hidden=false;
      const backdrop=document.createElement('section');
      backdrop.id='arcade-test-menu';backdrop.style.cssText='max-width:850px;width:100%;margin:12px auto';
      const view=document.createElement('div');view.id='arcade-menu-view';
      view.style.cssText='display:flex;flex-direction:column;max-width:100%;';
      backdrop.append(view);document.body.append(backdrop);
      const {mountFamilyFun}=await import('/commons-family-fun.mjs?v=marquee7-activity1');
      mountFamilyFun(backdrop);
      const member='00000000-0000-4000-8000-000000000001';
      const scores={mahjong:{entries:[{rank:1,name:'Ana',score:2470,mine:false}]},
        hotrod:{entries:[{rank:1,name:'Cowboy',score:1900,mine:true}]},
        wordle:{entries:[{rank:1,name:'Tyler',score:180,mine:false}]}};
      window.dispatchEvent(new CustomEvent('family-unified-scoreboard',
        {detail:{member,games:scores,plateAccess:false,asOf:'2026-11-20T12:05:00Z'}}));
      window.dispatchEvent(new CustomEvent('family-arcade-recent-activity',
        {detail:{member,asOf:'2026-11-20T12:05:00Z',games:{
          mahjong:{lastPlayedAt:'2026-11-20T12:02:00Z',lastPlayer:'Ana',actionsToday:3,yourActionsToday:0},
          streetrod:{lastPlayedAt:'2026-11-20T10:20:00Z',lastPlayer:'Cowboy',actionsToday:2,yourActionsToday:2},
          wordle:{lastPlayedAt:'2026-11-19T18:00:00Z',lastPlayer:'Tyler',actionsToday:0,yourActionsToday:0}
        }}}));
    }""")
    board=page.locator('#arcade-family-fun')
    await expect(board).to_be_visible()
    cards=board.locator('.family-fun-game-chip')
    await expect(cards).to_have_count(11)
    assert await cards.first.get_attribute('data-family-fun-game')=='mahjong'
    assert await cards.first.get_attribute('data-most-recent')=='true'
    await expect(cards.first.locator('.family-fun-chip-time')).to_contain_text('07:02')
    await expect(cards.first.locator('.family-fun-chip-activity')).to_contain_text('Ana')
    assert await cards.first.locator('.family-fun-chip-leader').count()==1
    assert await board.evaluate('(el)=>el.scrollWidth<=window.innerWidth+1')
    reading=page.locator('#family-reading-menu')
    await expect(reading).to_be_visible()
    assert await reading.get_attribute('open') is None
    await reading.locator('summary').click()
    assert await reading.get_attribute('open') is not None
    await expect(reading.locator('#family-read-toggle')).to_be_visible()
    await reading.locator('#family-read-toggle').click()
    assert await page.locator('body').evaluate("(el)=>el.classList.contains('family-easy-read')")
    await reading.press('Escape')
    assert await reading.get_attribute('open') is None
    await reading.locator('summary').click()
    await expect(reading.locator('.family-reading-current')).to_have_text('Large')
    await reading.locator('#family-read-toggle').click()
    await reading.locator('summary').click()
    await page.evaluate("""()=>{
      const member='00000000-0000-4000-8000-000000000001';
      window.dispatchEvent(new CustomEvent('family-arcade-recent-activity',
        {detail:{member,asOf:'2026-11-20T12:08:00Z',games:{
          mahjong:{lastPlayedAt:'2026-11-20T12:02:00Z',lastPlayer:'Ana',actionsToday:3},
          wordle:{lastPlayedAt:'2026-11-20T12:07:00Z',lastPlayer:'Tyler',actionsToday:1}
        }}}));
    }""")
    assert await cards.first.get_attribute('data-family-fun-game')=='wordle'
    await cards.first.click()
    await expect(board.locator('.family-fun-game-activity')).to_contain_text('Tyler')
    await expect(board.locator('.family-fun-game-activity')).to_contain_text('07:07')
    await board.locator('.family-fun-home').click()
    assert await cards.first.get_attribute('data-family-fun-game')=='wordle'
    (ROOT/'reports').mkdir(exist_ok=True)
    await board.screenshot(path=str(ROOT/'reports'/f'family-fun-recent-{width}.png'),animations='disabled')
    await reading.locator('summary').click()
    await reading.screenshot(path=str(ROOT/'reports'/f'reading-dropdown-{width}.png'),animations='disabled')
    window=await reading.bounding_box()
    assert window and window['x']>=0 and window['x']+window['width']<=width+1
    await page.evaluate("window.dispatchEvent(new Event('family-unified-scoreboard-clear'))")
    await expect(board.locator('.family-fun-status')).to_contain_text('Member-only')
    assert await cards.first.get_attribute('data-family-fun-game')=='streetrod'
    print('PASS',width,'px recency, player, Eastern 24-hour, approved-member reset, reading dropdown')
    await page.close()
  finally:
   await browser.close()
if __name__=='__main__':asyncio.run(main())
