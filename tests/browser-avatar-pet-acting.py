#!/usr/bin/env python3
"""Visual pet cel check using original artwork only, with no family-account access."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://127.0.0.1:8765'
HTML = """<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1">
<body style="margin:0;background:#212235;color:#fff4df;font:16px system-ui">
<main id="pet-contact" style="max-width:640px;margin:auto;padding:12px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"></main>
</body></html>"""


async def measure(page):
    return await page.evaluate("""async () => {
      const {PET_ART}=await import('/avatar-pet-art.mjs?v=pet-acting1');
      const host=document.getElementById('pet-contact');
      const results=[];
      for (const [id,name,draw,animated] of PET_ART) {
        const versions=[];
        for(const [pose,t] of [['resting',0],['acting',1.12]]) {
          const panel=document.createElement('section');
          panel.style='min-width:0;border:2px solid #cfac72;border-radius:14px;padding:5px;background:#33414b';
          const label=document.createElement('p');
          label.style='font:700 14px/1.4 system-ui;margin:3px 0 7px';
          label.textContent=name+' · '+pose;
          const canvas=document.createElement('canvas');
          canvas.width=canvas.height=200;
          canvas.style='display:block;width:100%;border-radius:9px;background:#e6d2ab';
          const ctx=canvas.getContext('2d');
          ctx.translate(100,106);ctx.scale(1.8,1.8);
          draw(ctx,t);
          panel.append(label,canvas);host.append(panel);
          versions.push(ctx.getImageData(0,0,200,200).data);
        }
        const before=versions[0],after=versions[1];
        let moved=0,inked=0;
        for(let i=0;i<before.length;i+=4) {
          if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+
             Math.abs(before[i+2]-after[i+2])>22) moved++;
          if(before[i+3]>160) inked++;
        }
        const mini=document.createElement('canvas');
        mini.width=mini.height=48;
        const miniCtx=mini.getContext('2d');
        miniCtx.drawImage(host.lastElementChild.querySelector('canvas'),0,0,48,48);
        const miniPixels=miniCtx.getImageData(0,0,48,48).data;
        let visible=0;
        for(let i=3;i<miniPixels.length;i+=4)if(miniPixels[i]>100) visible++;
        results.push({id,animated,moved,inked,visible});
      }
      return results;
    }""")


async def run(browser,width):
    page=await browser.new_page(viewport={'width':width,'height':760},
        reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    await page.route(BASE+'/__avatar_pet_art_test__',
        lambda route:route.fulfill(status=200,content_type='text/html',body=HTML))
    await page.goto(BASE+'/__avatar_pet_art_test__',wait_until='domcontentloaded')
    rows=await measure(page)
    assert len(rows)==2,rows
    for row in rows:
        assert row['animated'],row
        assert row['moved']>=50,('animation is imperceptible',width,row)
        assert row['inked']>=2500,('missing pet illustration',width,row)
        assert row['visible']>=250,('pet too small at 48px',width,row)
    assert not errors,(width,errors[:3])
    overflow=await page.evaluate('document.documentElement.scrollWidth-innerWidth')
    assert overflow<=2,('pet contact sheet overflows',width,overflow)
    (ROOT/'reports').mkdir(exist_ok=True)
    await page.screenshot(path=str(ROOT/'reports'/f'avatar-pet-original-acting-{browser.browser_type.name}-{width}.png'),
       animations='disabled',full_page=True)
    print(browser.browser_type.name,width,'pet frames and 48px scale PASS',rows)
    await page.close()


async def main():
    async with async_playwright() as p:
        for browser_type,widths in [(p.chromium,[390,1280]),(p.webkit,[375])]:
            browser=await browser_type.launch(headless=True)
            try:
                for width in widths: await run(browser,width)
            finally: await browser.close()


if __name__=='__main__':
    asyncio.run(main())
