#!/usr/bin/env python3
"""Real visual and interaction acceptance for the independently named creator."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect

URL='http://127.0.0.1:8765/mystery-crew-creator.html?preview=1'
REPORTS=Path(__file__).resolve().parents[1]/'reports'

async def verify(browser,width,label):
    page=await browser.new_page(viewport={'width':width,'height':900},is_mobile=width<700,has_touch=width<700,reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    await page.goto(URL,wait_until='domcontentloaded')
    await expect(page.get_by_role('heading',name='My Crew')).to_be_visible()
    await expect(page.locator('.mc-title-main')).to_contain_text('Mystery Crew')
    assert await page.get_by_text('Dressing room').count()==0
    assert await page.get_by_text('Classic layout').count()==0
    await expect(page.locator('#mc-scene')).to_be_visible()
    await expect(page.locator('.mc-card')).to_have_count(8)
    await page.locator('.mc-card[data-item="explorer"]').click()
    await expect(page.locator('#mc-actor')).to_have_attribute('style',__import__('re').compile('.*--shirt.*#6c9354.*'))
    assert await page.locator('#mc-outfit-details path').count()>2,'Outfit should change the character drawing'
    await page.locator('#mc-color-layer').select_option('hair')
    await page.locator('#mc-swatches [data-color="#ab4232"]').click()
    await expect(page.locator('#mc-actor')).to_have_attribute('style',__import__('re').compile('.*--hair.*#ab4232.*'))
    await page.locator('#mc-color-layer').select_option('skin')
    await page.locator('#mc-swatches [data-color="#6e432e"]').click()
    await expect(page.locator('#mc-actor')).to_have_attribute('style',__import__('re').compile('.*--skin.*#6e432e.*'))
    await page.locator('#mc-rename').click()
    await page.locator('#mc-name-input').fill('Trailblazer')
    await page.locator('#mc-rename-form button[type="submit"]').click()
    await expect(page.locator('#mc-character-name')).to_have_text('Trailblazer')
    await page.get_by_role('button',name='Save Crew').first.click()
    await expect(page.locator('#mc-status')).to_contain_text('Saved in local test preview')
    await page.locator('#mc-add').click()
    await expect(page.locator('#mc-roster .mc-portrait')).to_have_count(2)
    await page.get_by_role('button',name='Save Crew').first.click()
    await page.reload(wait_until='domcontentloaded')
    await expect(page.locator('#mc-roster .mc-portrait')).to_have_count(2)
    await page.locator('#mc-roster .mc-portrait').first.click()
    await expect(page.locator('#mc-character-name')).to_have_text('Trailblazer')
    await page.locator('[data-motion="wave"]').click()
    await expect(page.locator('#mc-app')).to_have_attribute('data-motion','wave')
    await page.locator('[data-jump="pets"]').click()
    await expect(page.locator('#mc-market-title')).to_have_text('Pets')
    await page.locator('.mc-card[data-item="cat"]').click()
    await expect(page.locator('#mc-pet')).to_have_attribute('style',__import__('re').compile('.*--pet.*#8b879a.*'))
    assert await page.locator('#mc-pet path').count()>=3,'Cat must have its own silhouette'
    await page.locator('[data-jump="hats"]').click()
    await page.locator('.mc-card[data-item="fedora"]').click()
    await expect(page.locator('#mc-hat')).to_be_visible()
    await page.locator('[data-jump="gear"]').click()
    await page.locator('.mc-card[data-item="binoculars"]').click()
    assert await page.locator('#mc-gear-detail circle').count()>=2,'Equipped binoculars should render'
    await page.locator('[data-jump="outfits"]').click()
    await page.locator('#mc-zoom-in').click()
    await page.locator('#mc-turn-right').click()
    await expect(page.locator('#mc-view-side')).to_have_attribute('aria-pressed','true')
    await page.locator('#mc-fit').click()
    await expect(page.locator('#mc-view-front')).to_have_attribute('aria-pressed','true')
    assert await page.locator('.mc-roster').is_visible()
    assert await page.locator('.mc-market').is_visible()
    assert await page.locator('.mc-bottom').is_visible()
    assert await page.locator('body').evaluate('n=>n.scrollWidth-n.clientWidth')<=2,'Document horizontal overflow'
    if width>=900:
        pos=await page.locator('.mc-market').bounding_box()
        stage=await page.locator('.mc-stage-frame').bounding_box()
        assert pos and stage and pos['x']>stage['x']+stage['width']-8,'Market should be beside stage'
    else:
        pos=await page.locator('.mc-market').bounding_box()
        stage=await page.locator('.mc-stage-frame').bounding_box()
        assert pos and stage and pos['y']>stage['y']+stage['height'],'Market should stack below stage'
    await page.screenshot(path=str(REPORTS/f'mystery-crew-{label}.png'),full_page=True,animations='disabled')
    assert await page.locator('script[src^="community-config.js"]').count()==1
    assert not errors,errors
    print(f'Mystery Crew Creator {label}: working roster, outfits, pet, animation, rotation, local persistence, responsive UI PASS')
    await page.close()

async def main():
    REPORTS.mkdir(exist_ok=True)
    async with async_playwright() as p:
        chromium=await p.chromium.launch(headless=True)
        try:
            for w,name in [(390,'iphone-390'),(375,'iphone-375'),(1365,'desktop'),(1672,'reference-desktop')]:
                await verify(chromium,w,name)
        finally:await chromium.close()

if __name__=='__main__':asyncio.run(main())
