#!/usr/bin/env python3
"""V10 true-frame-six evidence in the actual Creator, not isolated image DOM."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/'reports'
URL='http://127.0.0.1:8765/mystery-crew-creator.html?preview=1&artLab=scoutV9'
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for w,h,label in [(375,667,'iphone-short'),(390,844,'iphone'),(1672,941,'desktop')]:
   page=await browser.new_page(viewport={'width':w,'height':h},is_mobile=w<700,has_touch=w<700,reduced_motion='reduce')
   errors=[]
   page.on('pageerror',lambda x:errors.append(str(x)))
   await page.goto(URL,wait_until='domcontentloaded')
   await expect(page.locator('#mc-scene')).to_have_attribute('data-v9-lab','ready',timeout=20000)
   await page.locator('.mc-performance [data-motion="wave"]').click()
   await expect(page.locator('#mc-scene')).to_have_attribute('data-v9-wave','reduced')
   # Force the sixth SOURCE IMAGE only for a review screenshot.  Do not change
   # the production wave playback algorithm or account state.
   img=page.locator('#mc-v9-scout-wave-image')
   await img.evaluate("""el=>{
      const file='scout-v9-frame-06.png';
      const current=el.getAttribute('href');
      const corrected=current.replace(/scout-v9-frame-\d+\.png$/,file);
      el.setAttribute('href',corrected);el.dataset.v9Frame='5';
   }""")
   await expect(img).to_have_attribute('data-v9-frame','5')
   image=await img.evaluate("""async el=>{
      const probe=new Image();probe.src=el.getAttribute('href');await probe.decode();
      return {width:probe.naturalWidth,height:probe.naturalHeight,url:probe.src};
   }""")
   assert image['width']==430 and image['height']==574,image
   await expect(page.locator('#mc-v4-complete-van')).to_be_visible()
   await expect(page.locator('#mc-painted-hound')).to_be_visible()
   await page.screenshot(path=str(REPORT/f'scout-v10-real-scene-frame06-{label}.png'),full_page=False,animations='disabled')
   await page.locator('#mc-scene').screenshot(path=str(REPORT/f'scout-v10-stage-frame06-{label}.png'),animations='disabled')
   assert await page.evaluate('document.documentElement.scrollWidth-innerWidth')<=1
   assert not errors,(label,errors)
   await page.close()
   print('PASS full-scene frame-six art screenshot',label,image,flush=True)
  await browser.close()
if __name__=='__main__':
 asyncio.run(main())
