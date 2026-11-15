#!/usr/bin/env python3
"""Real mobile browser smoke test with only local preview identities.
No real users, credentials, posts, or third-party TV streams are touched.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8765/community.html?preview=1&role=member'

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        try:
            for width in [375,390]:
                page=await browser.new_page(viewport={'width':width,'height':844},
                  reduced_motion='reduce',has_touch=True)
                errors=[]
                page.on('pageerror',lambda error: errors.append(str(error)))
                await page.goto(URL,wait_until='domcontentloaded',timeout=30000)
                quick=page.locator('#family-avatar-quick')
                await expect(quick).to_be_visible(timeout=25000)
                bounds=await quick.bounding_box()
                assert bounds and bounds['width']>=44 and bounds['height']>=44,(width,bounds)
                assert await quick.get_attribute('aria-label')=='Open my avatar studio'
                hamburger=await page.locator('#cowboy-site-nav .cowboy-nav-toggle').bounding_box()
                assert hamburger and 0<=hamburger['x']-bounds['x']<=120,(
                    width,'header avatar not next to menu',bounds,hamburger)
                await quick.click()
                await expect(page.locator('#content-dialog')).to_be_visible()
                await expect(page.locator('[data-profile-pane="avatar"]')).to_be_visible()
                canvas=page.locator('#family-avatar-canvas')
                await expect(canvas).to_be_visible()
                before=await canvas.evaluate('(el)=>el.toDataURL("image/png")')
                await page.locator('[data-avatar-feature="hair"][data-avatar-value="purple"]').click()
                after=await canvas.evaluate('(el)=>el.toDataURL("image/png")')
                assert before!=after,(width,'changing hair did not redraw character')
                save=page.locator('#profile-studio-form button[type="submit"]')
                await expect(save).to_be_visible()
                assert await save.is_enabled(),(width,'avatar save is disabled')
                assert 'Save' in (await save.inner_text()),(width,'missing save label')
                await page.keyboard.press('Escape')
                # Test external TV link using the same class+DOM location that
                # Drawing Studio injects during approved account mount.
                # A realistic synthetic drawing session: the existing
                # drawing manager mounts its game button from the real stage.
                await page.evaluate("""()=>{
                    if(document.getElementById('commons-family-zone'))return;
                    const main=document.querySelector('#conversations .community-main');
                    const zone=document.createElement('section');zone.id='commons-family-zone';
                    const drawingRoot=document.createElement('section');
                    drawingRoot.id='commons-drawing-root';drawingRoot.dataset.ready='true';
                    const stage=document.createElement('div');stage.id='commons-art';
                    drawingRoot.append(stage);zone.append(drawingRoot);main.append(zone);
                }""")
                await expect(page.locator('#drawing-studio-game-root')).to_be_visible(timeout=12000)
                link=page.locator('#spelunkr-game-link')
                await expect(link).to_be_visible(timeout=10000)
                assert await link.get_attribute('href')=='https://spelunkr.tv/?tv'
                assert await link.get_attribute('target')=='_blank'
                assert await link.get_attribute('rel')=='noopener noreferrer'
                print('RETRO TV ORDER',await page.evaluate("""()=>{
                    const a=document.getElementById('spelunkr-game-link');
                    const board=document.getElementById('conversations');
                    return {link:{parent:a?.parentElement?.id,prev:a?.previousElementSibling?.id,next:a?.nextElementSibling?.id,
                      visible:!!a?.getClientRects().length},
                      drawings:[...document.querySelectorAll('#drawing-studio-game-root')].map(n=>({
                        parent:n.parentElement?.id,prev:n.previousElementSibling?.id,
                        next:n.nextElementSibling?.id,inBoard:board?.contains(n)})),
                      main:[...document.querySelector('#conversations .community-main').children].map(n=>n.id)};
                }"""))
                await page.wait_for_function("""()=>{
                    const link=document.getElementById('spelunkr-game-link');
                    const drawing=document.getElementById('drawing-studio-game-root');
                    return link&&drawing&&drawing.nextElementSibling===link;
                }""",timeout=10000)
                # Clicking the original game button should open our own
                # mobile-readable guide, not Spelunkr's cramped external TV UI.
                await link.click()
                guide=page.locator('#family-retro-guide')
                await expect(guide).to_be_visible(timeout=15000)
                cards=guide.locator('.family-retro-channel')
                await expect(cards).to_have_count(35)
                assert await guide.get_attribute('aria-modal')=='true'
                guide_bounds=await guide.bounding_box()
                assert guide_bounds and guide_bounds['width']<=width+1,(
                    width,'Retro TV dialog overflows phone',guide_bounds)
                search=guide.locator('#family-retro-search')
                await search.fill('waku')
                await expect(cards).to_have_count(1)
                watch=cards.first.locator('a.family-retro-watch')
                assert await watch.get_attribute('href')=='https://spelunkr.tv/waku-waku'
                assert await watch.get_attribute('target')=='_blank'
                assert await watch.get_attribute('rel')=='noopener noreferrer'
                fav=cards.first.locator('.family-retro-fav')
                await fav.click()
                await guide.locator('[data-retro-group="favorites"]').click()
                await expect(cards).to_have_count(1)
                assert await guide.locator('.family-retro-count').inner_text()!=''
                await search.fill('')
                await guide.locator('[data-retro-group="kids"]').click()
                assert await cards.count()>=5,(width,'kids filter empty')
                await guide.locator('#family-retro-close').click()
                await expect(guide).to_be_hidden()
                await expect(link).to_be_visible()
                overflow=await page.evaluate('document.documentElement.scrollWidth-innerWidth')
                assert overflow<=2,(width,'horizontal overflow',overflow)
                assert not errors,(width,errors)
                (ROOT/'reports').mkdir(exist_ok=True)
                await page.screenshot(path=str(ROOT/'reports'/f'family-avatar-studio-{width}.png'),
                  full_page=False,animations='disabled')
                await page.close()
                print(f'Family avatar studio and Spelunkr button PASS at {width}px')
            visitor=await browser.new_page(viewport={'width':390,'height':844})
            await visitor.goto('http://127.0.0.1:8765/community.html?preview=1&role=visitor',
              wait_until='domcontentloaded')
            await expect(visitor.locator('#family-avatar-quick')).to_be_hidden(timeout=20000)
            assert await visitor.locator('#spelunkr-game-link').count()==0
            await visitor.close()
            print('Signed-out visitor avatar shortcut & games HIDDEN')
        finally:
            await browser.close()

if __name__=='__main__':
    asyncio.run(main())
