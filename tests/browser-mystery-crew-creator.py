#!/usr/bin/env python3
"""Source-locked Mystery Crew: true one-window visual and interaction acceptance."""
import asyncio
import re
from pathlib import Path
from playwright.async_api import async_playwright,expect

URL='http://127.0.0.1:8765/mystery-crew-creator.html?preview=1'
REPORTS=Path(__file__).resolve().parents[1]/'reports'

async def set_category(page,value):
    await page.locator('#mc-market-filter').select_option(value)
    await expect(page.locator('#mc-market-filter')).to_have_value(value)

async def verify(browser,width,height,label):
    page=await browser.new_page(viewport={'width':width,'height':height},
        is_mobile=width<700,has_touch=width<700,reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    await page.goto(URL,wait_until='domcontentloaded')
    await expect(page.locator('.mc-title-main')).to_contain_text('Mystery Crew')
    await expect(page.locator('#mc-scene')).to_be_visible()
    await expect(page.locator('.mc-portrait')).to_have_count(1)
    await expect(page.locator('#mc-fidelity-head path').first).to_be_visible()
    assert await page.get_by_text('Dressing room').count()==0

    # Five independently persisted, allowlisted face traits.
    for category,property_,value in [('faces','faceShape','round'),
                                     ('haircuts','hairStyle','bob'),
                                     ('eyes','eyeShape','almond'),
                                     ('expressions','expression','curious'),
                                     ('details','detail','glasses')]:
        await set_category(page,category)
        choice=page.locator(f'[data-style-kind="{property_}"][data-style-value="{value}"]')
        await choice.click()
        await expect(choice).to_have_attribute('aria-pressed','true')
    await expect(page.locator('#mc-fidelity-head circle')).to_have_count(4) # irises & highlights
    assert await page.locator('#mc-fidelity-head g').count()>0,'Face layers should be vector, not placeholders'

    # Wardrobe and palette remain real interactions, not decorative previews.
    await set_category(page,'outfits')
    await page.locator('.mc-card[data-item="explorer"]').click()
    await expect(page.locator('#mc-actor')).to_have_attribute('style',re.compile('.*--shirt.*#6c9354.*'))
    assert await page.locator('#mc-outfit-details path').count()>2
    await page.locator('#mc-color-layer').select_option('hair')
    await page.locator('#mc-swatches [data-color="#b8432a"]').click()
    await expect(page.locator('#mc-actor')).to_have_attribute('style',re.compile('.*--hair.*#b8432a.*'))
    await page.locator('#mc-color-layer').select_option('skin')
    await page.locator('#mc-swatches [data-color="#6e432e"]').click()
    await expect(page.locator('#mc-actor')).to_have_attribute('style',re.compile('.*--skin.*#6e432e.*'))
    await page.locator('#mc-rename').click()
    await page.locator('#mc-name-input').fill('Trailblazer')
    await page.locator('#mc-rename-form button[type="submit"]').click()
    await expect(page.locator('#mc-character-name')).to_have_text('Trailblazer')
    await page.locator('#mc-save').click()
    await expect(page.locator('#mc-status')).to_contain_text('Saved in the local test preview')
    await page.locator('#mc-add').click()
    await expect(page.locator('#mc-roster .mc-portrait')).to_have_count(2)
    await page.locator('#mc-save').click()
    await page.reload(wait_until='domcontentloaded')
    await expect(page.locator('#mc-roster .mc-portrait')).to_have_count(2)
    await page.locator('#mc-roster .mc-portrait').first.click()
    await expect(page.locator('#mc-character-name')).to_have_text('Trailblazer')
    for category,property_,value in [('faces','faceShape','round'),('haircuts','hairStyle','bob'),
                                     ('eyes','eyeShape','almond'),('expressions','expression','curious'),
                                     ('details','detail','glasses')]:
        await set_category(page,category)
        await expect(page.locator(f'[data-style-kind="{property_}"][data-style-value="{value}"]')).to_have_attribute('aria-pressed','true')

    await page.locator('[data-motion="wave"]').click()
    await expect(page.locator('#mc-app')).to_have_attribute('data-motion','wave')
    await set_category(page,'pets')
    await page.locator('.mc-card[data-item="cat"]').click()
    assert await page.locator('#mc-pet path').count()>=3
    await set_category(page,'hats')
    await page.locator('.mc-card[data-item="fedora"]').click()
    await expect(page.locator('#mc-hat')).to_be_visible()
    await set_category(page,'gear')
    await page.locator('.mc-card[data-item="binoculars"]').click()
    assert await page.locator('#mc-gear-detail circle').count()>=2
    await set_category(page,'outfits')
    await page.locator('#mc-turn-right').click()
    await expect(page.locator('#mc-view-side')).to_have_attribute('aria-pressed','true')
    await page.locator('#mc-fit').click()
    await expect(page.locator('#mc-view-front')).to_have_attribute('aria-pressed','true')

    # No document or internal gallery scrolling at reference, laptop, or iPhone.
    sizes=await page.evaluate("""() => ({
      iw:innerWidth,ih:innerHeight,sw:document.documentElement.scrollWidth,
      sh:document.documentElement.scrollHeight,bodyW:document.body.scrollWidth,
      pageY:window.scrollY,app:document.querySelector('.mc-app').getBoundingClientRect().toJSON(),
      cards:document.querySelector('.mc-cards').getBoundingClientRect().toJSON(),
      stage:document.querySelector('.mc-stage-frame').getBoundingClientRect().toJSON(),
      market:document.querySelector('.mc-market').getBoundingClientRect().toJSON(),
      footer:document.querySelector('.mc-footer').getBoundingClientRect().toJSON(),
      overflow:getComputedStyle(document.querySelector('.mc-cards')).overflowY
    })""")
    assert sizes['sw']<=width+2,f'horizontal overflow {label}: {sizes}'
    assert sizes['sh']<=height+2,f'vertical overflow {label}: {sizes}'
    assert sizes['pageY']==0,f'page scrolled {label}'
    assert sizes['overflow']!='scroll',f'gallery must page rather than scroll {label}'
    assert sizes['app']['height']<=height+2,f'workspace exceeds viewport {label}'
    assert sizes['market']['bottom']<=height+2,f'wardrobe clipped on {label}'
    assert sizes['stage']['height']>=75,f'character stage not visible on {label}'
    assert sizes['cards']['height']>=60,f'wardrobe cards too short on {label}'
    if width>=990:
        assert sizes['market']['x']>sizes['stage']['x']+sizes['stage']['width']-8,'side-by-side desktop gallery'
    else:
        assert sizes['market']['y']>=sizes['stage']['y']+sizes['stage']['height']-3,'mobile gallery below stage'
    await page.screenshot(path=str(REPORTS/f'mystery-crew-{label}.png'),full_page=False,animations='disabled')
    assert not errors,errors
    print(f'{label}: source-locked traits, account-shaped preview saves, real wardrobe, no scrolling PASS')
    await page.close()

async def main():
    REPORTS.mkdir(exist_ok=True)
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        try:
            for width,height,label in [(375,667,'iphone-375-short'),(390,844,'iphone-390'),
                                      (1365,900,'desktop'),(1672,941,'reference-desktop')]:
                await verify(browser,width,height,label)
        finally:
            await browser.close()

if __name__=='__main__':asyncio.run(main())
