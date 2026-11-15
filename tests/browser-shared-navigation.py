#!/usr/bin/env python3
"""Mobile-width DOM and layout regression test for shared navigation.
Uses local GitHub Pages files and no credentials, accounts, or real posts.
"""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:8765/'
CASES=[
    ('Toolbox','index.html','Toolbox','community.html'),
    ('Commons','community.html?preview=1&role=visitor','Family Message Board',None)
]

async def check_account_menu(browser, engine):
    for width,height in [(320,568),(390,844),(844,390)]:
        page=await browser.new_page(viewport={'width':width,'height':height},
                                    is_mobile=True,has_touch=True,reduced_motion='reduce')
        try:
            await page.goto(BASE+'community.html?preview=1&role=owner',wait_until='domcontentloaded')
            panel=page.locator('#cowboy-nav-panel')
            await page.locator('.cowboy-nav-toggle').click()
            account=panel.locator('details.account-menu')
            await account.locator('summary').click()
            actions=account.locator('.account-dropdown')
            await expect(account).to_have_attribute('open','')
            await expect(actions.get_by_role('button',name='Power House')).to_be_visible()
            await expect(actions.get_by_role('button',name='Owner dashboard')).to_be_visible()
            await expect(actions.get_by_role('button',name='Edit family profile')).to_be_visible()

            if height>390:
                await page.wait_for_function("""()=>{
                  const panel=document.querySelector('#cowboy-nav-panel').getBoundingClientRect();
                  const actions=document.querySelector('#cowboy-nav-panel .account-dropdown').getBoundingClientRect();
                  return actions.top>=panel.top && actions.bottom<=panel.bottom+1;
                }""")
            bounds=await actions.evaluate("""actions=>{
                const panel=actions.closest('nav');
                const a=actions.getBoundingClientRect(),p=panel.getBoundingClientRect();
                return {a:[a.left,a.right],p:[p.left,p.right],
                        horizontalOverflow:panel.scrollWidth-panel.clientWidth};
            }""")
            assert bounds['a'][0]>=bounds['p'][0] and bounds['a'][1]<=bounds['p'][1], (
                engine,width,height,'clipped account actions',bounds)
            assert bounds['horizontalOverflow']<=2,(engine,width,height,bounds)

            logout=actions.get_by_role('button',name='Log out')
            await logout.scroll_into_view_if_needed()
            assert await logout.evaluate("""button=>{
              const r=button.getBoundingClientRect();
              return r.height>=44 && button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
            }"""),(engine,width,height,'unreachable account action')
            await actions.get_by_role('button',name='Edit family profile').click()
            await expect(page.locator('#profile-studio-form')).to_be_visible()
            print(f'Family account menu PASS {engine} at {width}x{height}')
        finally:
            await page.close()


async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True, executable_path=os.environ.get("CHROMIUM_PATH"))
        try:
            for name,path,title,game_link in CASES:
                page=await browser.new_page(viewport={'width':390,'height':844},
                  device_scale_factor=1,is_mobile=True,has_touch=True,
                  reduced_motion='reduce')
                try:
                    await page.goto(BASE+path,wait_until='domcontentloaded',timeout=30000)
                    if name == 'Commons':
                        await page.get_by_role('heading', name='Good company. Members only.').wait_for()
                        assert not await page.locator('#lab-intro').is_visible()
                        assert not await page.locator('#conversations').is_visible()
                    nav=page.locator('#cowboy-site-nav')
                    await nav.wait_for(timeout=20000)
                    heading=page.locator('.cowboy-nav-heading strong')
                    assert await heading.inner_text()==title,(name,'title',await heading.inner_text())
                    toggle=nav.locator('button.cowboy-nav-toggle')
                    if name == 'Toolbox':
                        entry=page.locator('header a.family-board-entry')
                        assert await entry.get_attribute('href') == 'community.html'
                        for width in [320, 375, 390, 768, 1280]:
                            await page.set_viewport_size({'width':width,'height':844})
                            box=await entry.bounding_box()
                            assert box and box['height']>=44 and box['width']>=44, (width, box)
                            toggle_box=await toggle.bounding_box()
                            assert box['x']>=0 and box['x']+box['width']<=width+1, (width, box)
                            assert toggle_box and box['x']+box['width']<=toggle_box['x']+1, (width, box, toggle_box)
                            assert abs(box['y']-toggle_box['y'])<=10, (width, box, toggle_box)
                            arrows=await page.locator('.toolbox-map-card .toolbox-route-arrow').evaluate_all("""arrows=>arrows.map(el=>[
                                el.closest('a').hash, el.textContent, el.getBoundingClientRect().width,
                                getComputedStyle(el,'::after').borderBottomStyle])""")
                            assert arrows==[['#explore','',16,'solid'],['#starter-packs','',16,'solid']], (width,arrows)
                        await page.set_viewport_size({'width':390,'height':844})
                        assert await entry.inner_text() == 'Family Message Board'
                        assert await entry.locator('.family-board-stars i').count() == 3
                        assert await entry.evaluate("el=>getComputedStyle(el,'::after').animationName") == 'none'
                        await page.emulate_media(reduced_motion='no-preference')
                        motion=await entry.evaluate('''el=>{
                           const star=el.querySelector('.family-board-stars i');
                           const animation=star.getAnimations()[0];
                           animation.pause();
                           animation.currentTime=0;
                           const before=getComputedStyle(star).transform;
                           animation.currentTime=1568;
                           return [before,getComputedStyle(star).transform,getComputedStyle(el,'::after').animationName];
                        }''')
                        assert motion[0]!=motion[1] and motion[2]=='family-board-shimmer', motion
                        await page.emulate_media(reduced_motion='reduce')
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
                    assert 'Family Message Board' in labels and not any(label in labels for label in ['Mahjong','w0rdle','Plate Challenge','Family games']),labels
                    if game_link:
                        assert await panel.locator(f'a[href="{game_link}"]').count()==1
                        language=panel.get_by_label('Navigation language')
                        await language.select_option('es')
                        assert await entry.inner_text()=='Tablón familiar'
                        assert await entry.locator('.family-board-stars i').count()==3
                        await language.select_option('en')
                        assert await entry.inner_text()=='Family Message Board'
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
            await check_account_menu(browser,'Chromium')
        finally:
            await browser.close()
        webkit=await p.webkit.launch(headless=True)
        try:
            await check_account_menu(webkit,'WebKit')
        finally:
            await webkit.close()

if __name__=='__main__':
    asyncio.run(main())
