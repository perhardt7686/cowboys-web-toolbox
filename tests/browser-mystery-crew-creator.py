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
    await expect(page.locator('#mc-scene')).to_have_attribute('data-painterly','ready',timeout=20000)
    await expect(page.locator('#mc-painted-hero')).to_be_visible()
    await expect(page.locator('#mc-painted-hound')).to_be_visible()
    await expect(page.locator('#mc-painted-van')).to_be_visible()
    assert await page.locator('#mc-painted-hero image').count()==6,'Hero must have six independent painted parts'
    assert await page.locator('#mc-cards .mc-painted-outfit').count()>0,'Working gallery must display actual painted outfits'
    assert await page.locator('#mc-painted-workshop image').count()==1
    # Validate actual browser decoding, not merely the presence of SVG <image>
    # elements or gallery <img> tags. A CSP-blocked Blob can pass those tests
    # while leaving giant broken-image placeholders over the characters.
    painted=await page.evaluate("""async () => {
      const elements=[
        ...document.querySelectorAll('#mc-painted-hero image'),
        ...document.querySelectorAll('#mc-painted-hound image'),
        ...document.querySelectorAll('#mc-painted-van image'),
        ...document.querySelectorAll('#mc-painted-workshop image'),
        ...document.querySelectorAll('#mc-cards .mc-painted-outfit')
      ];
      const checks=await Promise.all(elements.map(async el=>{
        const src=el.getAttribute('href')||el.getAttribute('src');
        try{
          const probe=new Image();
          probe.src=src;
          await probe.decode();
          return {src:src?.slice(0,18),ok:probe.naturalWidth>0&&probe.naturalHeight>0};
        }catch(error){return {src:src?.slice(0,18),ok:false,error:String(error)}}
      }));
      return {count:elements.length,checks};
    }""")
    assert painted['count']>=17,painted
    assert all(x['ok'] for x in painted['checks']),'Painterly image missing/corrupted/CSP blocked: '+str(painted)
    await page.screenshot(path=str(REPORTS/f'mystery-crew-painted-fresh-{label}.png'),
                          full_page=False,animations='disabled')
    await expect(page.locator('.mc-portrait[data-crew-id]')).to_have_count(1)
    await expect(page.locator('.mc-reference-portrait')).to_have_count(4)
    await expect(page.locator('#mc-fidelity-head path').first).to_be_visible()
    assert await page.get_by_text('Dressing room').count()==0
    # Source-reference artwork is real vector layers, not a static screenshot.
    await expect(page.locator('#mc-woods-detail')).to_be_attached()
    await expect(page.locator('#mc-ground-fidelity')).to_be_attached()
    assert await page.locator('#mc-barn path').count()>=12
    assert await page.locator('#mc-vehicle path').count()>=9
    assert await page.locator('#mc-pet path').count()>=9,'Starter dog must have body, paws and expression'
    await expect(page.locator('#mc-market-title')).to_have_text('Outfits')
    await page.screenshot(path=str(REPORTS/f'mystery-crew-fresh-reference-{label}.png'),
                          full_page=False,animations='disabled')
    await set_category(page,'presets')
    await expect(page.locator('#mc-cards [data-reference-look="juniper"]')).to_be_visible()
    await page.locator('#mc-cards [data-reference-look="juniper"]').click()
    await expect(page.locator('#mc-cards [data-reference-look="juniper"]')).to_have_attribute('aria-pressed','true')
    assert '#b8432a' in await page.locator('#mc-fidelity-head').inner_html()

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
        if property_=='faceShape':
            await expect(page.locator('#mc-painted-hero')).to_be_hidden()
            assert await page.locator('#mc-actor').evaluate('el=>el.style.opacity')=='1','Changed face should show actual custom actor'
    assert await page.locator('#mc-fidelity-head circle').count()>=4 # irises, highlights and optional glasses
    assert await page.locator('#mc-fidelity-head g').count()>0,'Face layers should be vector, not placeholders'

    # Wardrobe and palette remain real interactions, not decorative previews.
    await set_category(page,'outfits')
    artwork=await page.locator('.mc-card-art svg').evaluate_all('(nodes)=>nodes.map(el=>el.innerHTML)')
    assert len(set(artwork))==len(artwork),'Outfit cards must have distinct illustrated silhouettes'
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
    await expect(page.locator('#mc-roster .mc-portrait[data-crew-id]')).to_have_count(2)
    await page.locator('#mc-save').click()
    await page.reload(wait_until='domcontentloaded')
    await expect(page.locator('#mc-roster .mc-portrait[data-crew-id]')).to_have_count(2)
    geometry=await page.evaluate("""() => Object.fromEntries(
      ['.mc-layout','.mc-roster','.mc-market','.mc-cards','.mc-pages','.mc-theater','.mc-tools']
      .map(k=>[k,document.querySelector(k).getBoundingClientRect().toJSON()]))""")
    print('Layout after reload',label,geometry,flush=True)
    await page.screenshot(path=str(REPORTS/f'mystery-crew-before-roster-{label}.png'),full_page=False)
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
    pet_art=await page.locator('.mc-card-art svg').evaluate_all('(nodes)=>nodes.map(el=>el.innerHTML)')
    assert len(set(pet_art))==len(pet_art),'Pet choices must have distinct species silhouettes'
    await page.locator('.mc-card[data-item="cat"]').click()
    assert await page.locator('#mc-pet path').count()>=3
    await set_category(page,'hats')
    await page.locator('.mc-card[data-item="fedora"]').click()
    await expect(page.locator('#mc-hat')).to_be_visible()
    await set_category(page,'gear')
    await page.locator('.mc-card[data-item="binoculars"]').click()
    assert await page.locator('#mc-gear-detail circle').count()>=2
    await set_category(page,'outfits')
    rotate=page.locator('#mc-scene-turn-right' if width<700 else '#mc-turn-right')
    await expect(rotate).to_be_visible()
    await rotate.click()
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
