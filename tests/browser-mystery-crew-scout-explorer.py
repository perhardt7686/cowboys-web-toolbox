#!/usr/bin/env python3
"""Scout Explorer costume Wave in the real Creator, not an isolated sprite viewer.

Only runs on localhost with explicit preview=1&artLab=scoutV9.
The Explorer images are generated and staged in the ephemeral CI workspace.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright,expect
URL='http://127.0.0.1:8765/mystery-crew-creator.html?preview=1&artLab=scoutV9'
REPORT=Path(__file__).resolve().parents[1]/'reports'
REPORT.mkdir(exist_ok=True)

async def run(browser,w,h,label):
 page=await browser.new_page(viewport={'width':w,'height':h},has_touch=w<700,
                              is_mobile=w<700,reduced_motion='no-preference')
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 await page.goto(URL,wait_until='domcontentloaded')
 scene=page.locator('#mc-scene')
 await expect(scene).to_have_attribute('data-v9-lab','ready',timeout=20000)
 await expect(scene).to_have_attribute('data-v9-explorer','ready',timeout=20000)
 await expect(page.locator('#mc-v5-illustrated-actor')).to_be_visible()
 await page.locator('.mc-card[data-item="explorer"]').click()
 await expect(page.locator('#mc-v5-illustrated-actor')).to_have_attribute('data-outfit','explorer')
 await page.locator('.mc-performance [data-motion="wave"]').click()
 await expect(scene).to_have_attribute('data-v9-wave','active')
 await expect(scene).to_have_attribute('data-v9-costume','explorer')
 await expect(scene).to_have_attribute('data-crew-art','painted')
 asset=page.locator('#mc-v9-scout-wave-image')
 await expect(asset).to_be_visible()
 await expect(asset).to_have_attribute('href',__import__('re').compile(r'.*/mystery-crew-v9-scout-explorer/scout-explorer-wave-\d\d\.png'))
 await expect(asset).not_to_have_attribute('data-v9-frame','0',timeout=6000)
 details=await asset.evaluate("""async node=>{
    const picture=new Image();picture.src=node.getAttribute('href');await picture.decode();
    return {w:picture.naturalWidth,h:picture.naturalHeight,source:picture.src};
 }""")
 assert details['w']==430 and details['h']==574,details
 await page.emulate_media(reduced_motion='reduce')
 await page.locator('.mc-performance [data-motion="idle"]').click()
 await page.locator('.mc-performance [data-motion="wave"]').click()
 await expect(scene).to_have_attribute('data-v9-wave','reduced')
 await expect(asset).to_have_attribute('data-v9-frame','4')
 await page.wait_for_timeout(400)
 await expect(asset).to_have_attribute('data-v9-frame','4')
 await page.screenshot(path=str(REPORT/f'scout-explorer-in-scene-{label}.png'),full_page=False,animations='disabled')
 await scene.screenshot(path=str(REPORT/f'scout-explorer-in-stage-{label}.png'),animations='disabled')
 # No cosmetic change may replace the unrelated detective pose or unlock state.
 await page.locator('.mc-card[data-item="detective"]').click()
 await expect(scene).to_have_attribute('data-v9-costume','detective')
 await expect(asset).to_have_attribute('href',__import__('re').compile(r'.*/mystery-crew-v9-scout/scout-v9-frame-\d\d\.png'))
 await page.locator('#mc-market-filter').select_option('presets')
 await page.locator('#mc-cards [data-reference-look="juniper"]').click()
 await expect(asset).to_be_hidden()
 await expect(page.locator('#mc-v6-painted-rig')).to_be_visible()
 assert await page.evaluate('document.documentElement.scrollWidth-innerWidth')<=1,label
 assert not errors,(label,errors)
 print('PASS source-authored Explorer Wave in actual Creator scene',label,details,flush=True)
 await page.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for w,h,label in [(375,667,'iphone-short'),(390,844,'iphone'),(1365,900,'desktop'),(1672,941,'reference')]:
   await run(browser,w,h,label)
  await browser.close()
if __name__=='__main__':asyncio.run(main())
