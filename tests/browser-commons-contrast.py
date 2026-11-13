#!/usr/bin/env python3
"""Browser-based contrast smoke test using local SAMPLE member content only.
Never accesses the authenticated Commons or private Supabase data.
"""
import asyncio
import math
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8765/community.html?preview=1&role=member'

def channel(x):
    x=x/255.0
    return x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4

def color(raw):
    part=raw.split('(')[1].split(')')[0].replace(',',' ').split('/')
    values=[float(t) for t in part[0].split()[:3]]
    return [channel(x) for x in values]

def contrast(fg,bg):
    a=sum(x*w for x,w in zip(color(fg),(.2126,.7152,.0722)))
    b=sum(x*w for x,w in zip(color(bg),(.2126,.7152,.0722)))
    return (max(a,b)+.05)/(min(a,b)+.05)

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        page=await browser.new_page(viewport={'width':390,'height':844},
                                   device_scale_factor=1,
                                   reduced_motion='reduce')
        try:
            await page.goto(URL,wait_until='domcontentloaded',timeout=25000)
            await page.locator('#community-feed .thread-card').first.wait_for(timeout=20000)
            findings=[]
            for label,selector in [
                ('thread title','.thread-card .thread-title'),
                ('thread excerpt','.thread-card .thread-excerpt'),
                ('author','.thread-card .member-author>span:not(.profile-badge):not(.avatar)'),
                ('date','.thread-card .thread-age'),
                ('helpful','.thread-card .lab-helpful-count'),
            ]:
                element=page.locator('#community-feed '+selector).first
                if await element.count()==0:
                    raise AssertionError('Required contrast element missing: '+label)
                computed=await element.evaluate("""el=>{
                    const sty=getComputedStyle(el);
                    const card=el.closest('.thread-card');
                    return {fg:sty.color,paint:sty.webkitTextFillColor,
                            bg:getComputedStyle(card).backgroundColor};
                }""")
                value=contrast(computed['fg'],computed['bg'])
                assert value>=4.5,(label,computed,value)
                if computed['paint'].startswith('rgb'):
                    painted=contrast(computed['paint'],computed['bg'])
                    assert painted>=4.5,(label,'text fill color',painted)
                findings.append((label,round(value,2)))
            last=page.locator('#community-feed .thread-card .forum-last-reply').first
            if await last.count():
                latest=page.locator('#community-feed .thread-card .forum-last-reply button[data-forum-latest]').first
                assert await latest.count()
                findings.append(('latest button exists',True))
            (ROOT/'reports').mkdir(parents=True,exist_ok=True)
            await page.screenshot(path=str(ROOT/'reports'/'commons-mobile-legibility.png'),
                                  full_page=False,animations='disabled')
            print('Mobile sample-feed computed contrast checks:',findings)
        finally:
            await browser.close()

if __name__=='__main__':
    asyncio.run(main())
