#!/usr/bin/env python3
"""Mobile-width DOM and layout regression test for shared navigation.
Uses local GitHub Pages files and no credentials, accounts, or real posts.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:8765/'
CASES=[
    ('Toolbox','index.html','Toolbox','community.html#open-mahjong'),
    ('Commons','community.html?preview=1&role=visitor','Message Board',None)
]

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        try:
            for name,path,title,game_link in CASES:
                page=await browser.new_page(viewport={'width':390,'height':844},
                  device_scale_factor=1,is_mobile=True,has_touch=True,
                  reduced_motion='reduce')
                try:
                    await page.goto(BASE+path,wait_until='domcontentloaded',timeout=30000)
                    nav=page.locator('#cowboy-site-nav')
                    await nav.wait_for(timeout=20000)
                    heading=page.locator('.cowboy-nav-heading strong')
                    assert await heading.inner_text()==title,(name,'title',await heading.inner_text())
                    toggle=nav.locator('button.cowboy-nav-toggle')
                    box=await toggle.bounding_box()
                    assert box and box['width']>=44 and box['height']>=44,(name,'toggle size',box)
                    assert await toggle.get_attribute('aria-expanded')=='false'
                    await toggle.click()
                    panel=page.locator('#cowboy-nav-panel')
                    assert await panel.is_visible(),(name,'dropdown hidden')
                    assert await toggle.get_attribute('aria-expanded')=='true'
                    size=await panel.evaluate("""el=>{
                       const b=el.getBoundingClientRect(),s=getComputedStyle(el);
                       const items=[...el.querySelectorAll('.cowboy-nav-item')].slice(0,4)
                         .map(x=>x.getBoundingClientRect().top);
                       return {left:b.left,right:b.right,width:b.width,
                               scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
                               display:s.display,positions:items};
                    }""")
                    assert size['display']=='block',(name,'inherited flex',size)
                    assert size['left']>=-1 and size['right']<=391,(name,'panel outside viewport',size)
                    assert size['scrollWidth']<=size['clientWidth']+3,(name,'horizontal scrolling',size)
                    assert all(b>a+25 for a,b in zip(size['positions'],size['positions'][1:])),(name,'menu not vertically stacked',size)
                    labels=await panel.locator('.cowboy-nav-item').all_text_contents()
                    assert 'Mahjong' in labels and 'w0rdle' in labels and 'Plate Challenge' in labels,labels
                    if game_link:
                        assert await panel.locator(f'a[href="{game_link}"]').count()==1
                    (ROOT/'reports').mkdir(parents=True,exist_ok=True)
                    await page.screenshot(path=str(ROOT/'reports'/('shared-nav-'+name.lower()+'-mobile.png')),
                      full_page=False,animations='disabled')
                    await page.keyboard.press('Escape')
                    assert not await panel.is_visible(),(name,'escape did not close')
                    assert await toggle.get_attribute('aria-expanded')=='false'
                    await toggle.click()
                    assert await panel.is_visible()
                    await toggle.click()
                    assert not await panel.is_visible(),(name,'toggle did not close')
                    print(name+' shared dropdown PASS: mobile 390px, no clipping, vertical links, keyboard escape, repeat toggle')
                finally:
                    await page.close()
        finally:
            await browser.close()

if __name__=='__main__':
    asyncio.run(main())
