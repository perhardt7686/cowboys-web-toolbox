#!/usr/bin/env python3
"""Real served Mystery Crew scene acceptance, local fixture with V9 Wave asset pack."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright,expect
URL='http://127.0.0.1:8765/mystery-crew-creator.html?preview=1&artLab=scoutV9'
NORMAL='http://127.0.0.1:8765/mystery-crew-creator.html?preview=1'
REPORTS=Path(__file__).resolve().parents[1]/'reports'
REPORTS.mkdir(exist_ok=True)

async def test_scene(browser,w,h,name):
 page=await browser.new_page(viewport={'width':w,'height':h},has_touch=w<700,is_mobile=w<700,
                               reduced_motion='no-preference')
 errors=[]
 page.on('pageerror',lambda err:errors.append(str(err)))
 await page.goto(URL,wait_until='domcontentloaded')
 await expect(page.locator('#mc-scene')).to_have_attribute('data-v9-lab','ready',timeout=20000)
 await expect(page.locator('#mc-v5-illustrated-actor')).to_be_visible()
 await expect(page.locator('#mc-v9-scout-wave-image')).to_be_hidden()
 await expect(page.locator('#mc-v6-painted-rig')).to_be_visible()
 await page.locator('.mc-performance [data-motion="wave"]').click()
 await expect(page.locator('#mc-scene')).to_have_attribute('data-v9-wave','active')
 await expect(page.locator('#mc-v9-scout-wave-image')).to_be_visible()
 await expect(page.locator('#mc-v6-painted-rig')).to_be_hidden()
 await expect(page.locator('#mc-scene')).to_have_attribute('data-crew-art','painted')
 await page.wait_for_function("document.querySelector('#mc-v9-scout-wave-image').dataset.v9Frame !== '0'",timeout=5000)
 details=await page.locator('#mc-v9-scout-wave-image').evaluate("""async node=>{
   let url=node.getAttribute('href'),img=new Image();img.src=url;await img.decode();
   return {href:url,width:img.naturalWidth,height:img.naturalHeight,
           frame:node.dataset.v9Frame,visible:getComputedStyle(node).display};
 }""")
 assert details['width']==430 and details['height']==574,details
 assert 'scout-v9-frame-' in details['href']
 await page.screenshot(path=str(REPORTS/f'mystery-crew-v9-wave-scene-{name}.png'),
                       full_page=False,animations='allow')
 await page.locator('.mc-performance [data-motion="idle"]').click()
 await expect(page.locator('#mc-v9-scout-wave-image')).to_be_hidden()
 await expect(page.locator('#mc-v6-painted-rig')).to_be_visible()
 await page.locator('.mc-performance [data-motion="wave"]').click()
 await page.locator('#mc-market-filter').select_option('outfits')
 await page.locator('.mc-card[data-item="explorer"]').click()
 await expect(page.locator('#mc-v9-scout-wave-image')).to_be_hidden()
 await expect(page.locator('#mc-v6-painted-rig')).to_be_visible()
 await expect(page.locator('#mc-v5-illustrated-actor')).to_have_attribute('data-outfit','explorer')
 await page.locator('.mc-card[data-item="detective"]').click()
 await expect(page.locator('#mc-v9-scout-wave-image')).to_be_visible()
 await page.emulate_media(reduced_motion='reduce')
 await page.locator('.mc-performance [data-motion="idle"]').click()
 await page.locator('.mc-performance [data-motion="wave"]').click()
 await expect(page.locator('#mc-scene')).to_have_attribute('data-v9-wave','reduced')
 await expect(page.locator('#mc-v9-scout-wave-image')).to_have_attribute('data-v9-frame','4')
 await page.wait_for_timeout(370)
 await expect(page.locator('#mc-v9-scout-wave-image')).to_have_attribute('data-v9-frame','4')
 await page.locator('#mc-market-filter').select_option('presets')
 await page.locator('#mc-cards [data-reference-look="juniper"]').click()
 await expect(page.locator('#mc-v9-scout-wave-image')).to_be_hidden()
 await expect(page.locator('#mc-v6-painted-rig')).to_be_visible()
 horizontal=await page.evaluate('document.documentElement.scrollWidth - innerWidth')
 assert horizontal<=1,(name,horizontal)
 assert not errors,(name,errors)
 await page.close()
 print('V9 in actual Mystery Crew scene PASS',name,details,flush=True)

async def verify_fail_safe(browser):
 page=await browser.new_page(viewport={'width':390,'height':844})
 await page.goto(NORMAL,wait_until='domcontentloaded')
 await expect(page.locator('#mc-scene')).to_have_attribute('data-crew-art-pack','ready',timeout=20000)
 assert await page.locator('#mc-v9-scout-wave-image').count()==0,'Default creator should not mount V9'
 await page.close()
 page=await browser.new_page(viewport={'width':390,'height':844})
 async def fail_v9(route):
  await route.fulfill(status=404,body='Not found')
 await page.route('**/mystery-crew-v9-scout/*.png',fail_v9)
 await page.goto(URL,wait_until='domcontentloaded')
 await expect(page.locator('#mc-scene')).to_have_attribute('data-v9-lab','fallback',timeout=20000)
 await page.locator('.mc-performance [data-motion="wave"]').click()
 await expect(page.locator('#mc-v5-illustrated-actor')).to_be_visible()
 await expect(page.locator('#mc-v6-painted-rig')).to_be_visible()
 assert await page.locator('#mc-v9-scout-wave-image').count()==0
 await page.close()
 print('V9 default absence and missing-frame fallback PASS',flush=True)

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for w,h,name in [(375,667,'iphone-short'),(390,844,'iphone'),(1365,900,'desktop'),(1672,941,'reference-desktop')]:
   await test_scene(browser,w,h,name)
  await verify_fail_safe(browser)
  await browser.close()
if __name__=='__main__':asyncio.run(main())
