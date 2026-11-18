#!/usr/bin/env python3
"""V8 real member-editor visual cutover gate with synthetic preview accounts."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect

REPORTS=Path(__file__).resolve().parents[1]/'reports'
URL='http://127.0.0.1:8765/community.html?preview=1&role=member'

async def run():
    REPORTS.mkdir(exist_ok=True)
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        try:
            for width,label in [(390,'iphone'),(1365,'desktop')]:
                page=await browser.new_page(viewport={'width':width,'height':850},
                    has_touch=width<700,is_mobile=width<700,reduced_motion='reduce')
                errors=[]
                page.on('pageerror',lambda e: errors.append(str(e)))
                await page.goto(URL,wait_until='domcontentloaded')
                await page.locator('#family-avatar-quick').click()
                editor=page.locator('#profile-studio-form .avatar-dressing-studio')
                await expect(editor).to_have_attribute('data-v8-mode','modern')
                await expect(editor.get_by_role('heading',name='Make your mystery character')).to_be_visible()
                canvas=editor.locator('#family-avatar-canvas')
                await expect(canvas).to_have_attribute('data-backend','v8-original-cel',timeout=18000)
                initial=await canvas.evaluate('n=>n.toDataURL()')
                await editor.locator('[data-studio-part="hair"]').click()
                await editor.locator('[data-avatar-feature="hair"][data-avatar-value="purple"]').first.click()
                assert await canvas.evaluate('n=>n.toDataURL()')!=initial,'V8 hair color invisible'
                await page.screenshot(path=str(REPORTS/f'v8-live-character-{label}.png'),full_page=True)
                await editor.locator('.avatar-v8-classic-toggle').click()
                await expect(editor).to_have_attribute('data-v8-mode','classic')
                await expect(canvas).to_have_attribute('data-renderer','3d',timeout=18000)
                await editor.locator('.avatar-v8-classic-toggle').click()
                await expect(editor).to_have_attribute('data-v8-mode','modern')
                await expect(canvas).to_have_attribute('data-backend','v8-original-cel',timeout=18000)
                # The existing server-backed pet inventory is still the source of truth.
                nav=editor.get_by_role('navigation',name='Avatar Studio sections')
                await nav.get_by_role('button',name='Companions').click()
                gallery=editor.locator('.avatar-v8-pet-gallery')
                await expect(gallery).to_be_visible()
                assert await gallery.locator('.avatar-v8-pet-pick').count()>=2
                await expect(editor.get_by_role('combobox',name='Choose a pet')).to_be_visible()
                await page.screenshot(path=str(REPORTS/f'v8-live-pets-{label}.png'),full_page=True)
                await nav.get_by_role('button',name='Rewards').click()
                card=editor.locator('[data-reward-item="studio-observatory-telescope"]')
                await card.scroll_into_view_if_needed()
                await expect(card).to_be_visible()
                await expect(card.locator('canvas.avatar-reward-thumbnail')).to_have_attribute('data-art-pack','v8-ink',timeout=18000)
                await page.screenshot(path=str(REPORTS/f'v8-live-rewards-{label}.png'),full_page=True)
                assert await page.locator('#content-dialog').evaluate('n=>n.scrollWidth-n.clientWidth')<=2,'Dialog overflow'
                assert not errors,(label,errors)
                print('V8 member '+label+': new character art, live fallback, pets gallery, reward cels, layout PASS')
                await page.close()
        finally:
            await browser.close()
if __name__=='__main__':
    asyncio.run(run())
