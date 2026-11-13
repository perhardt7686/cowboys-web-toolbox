#!/usr/bin/env python3
"""Capture public website screenshots for each Toolbox card (no credentials).
A successful image represents a real PUBLIC homepage at its stated capture date.
Blocked, login-only, captcha or failed sites retain an explicitly illustrated card.
Run by a public GitHub Actions runner without any site credentials.
"""
import argparse
import asyncio
import ipaddress
import io
import json
import os
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'docs'/'site-shots'
CATALOG=ROOT/'docs'/'catalog.json'
MANIFEST=TARGET/'manifest.js'
ID_PATTERN=re.compile(r'^[a-z0-9][a-z0-9-]{0,79}$')
DENIED=('access denied','verify you are human','just a moment...','enable cookies to continue',
        'checking your browser','robot check','request blocked','captcha required')

def public_url(url):
    try:
        u=urlparse(url)
        if u.scheme not in ('https','http') or not u.hostname or u.username or u.password:
            return False
        host=u.hostname.lower().rstrip('.')
        if host=='localhost' or host.endswith(('.local','.internal','.localhost','.test','.invalid')):
            return False
        try:
            ip=ipaddress.ip_address(host)
            if not ip.is_global:
                return False
        except ValueError:
            pass
        return True
    except (TypeError,ValueError):
        return False

def existing_manifest():
    if not MANIFEST.exists():
        return {}
    raw=MANIFEST.read_text(encoding='utf-8')
    match=re.search(r'Object\.freeze\((\{.*\})\);',raw,re.DOTALL)
    if not match:
        return {}
    try:
        value=json.loads(match.group(1))
        return {k:v for k,v in value.items()
                if ID_PATTERN.fullmatch(k) and isinstance(v,dict)
                and (TARGET/(k+'.webp')).is_file()
                and re.fullmatch(r'\d{4}-\d{2}-\d{2}',str(v.get('captured','')))}
    except (TypeError,ValueError,json.JSONDecodeError):
        return {}

async def capture(browser,sem,site,results,force,prior):
    sid,url=site.get('id',''),site.get('url','')
    if not ID_PATTERN.fullmatch(sid) or not public_url(url):
        results.append((sid,'skipped: nonpublic URL or invalid id'))
        return
    final=TARGET/(sid+'.webp')
    if final.is_file() and not force:
        try:
            previous=date.fromisoformat(prior[sid]['captured'])
            age=(datetime.now(timezone.utc).date()-previous).days
        except (KeyError,TypeError,ValueError):
            age=999
        if 0<=age<30:
            results.append((sid,'already captured'))
            return
    async with sem:
        context=None
        try:
            context=await browser.new_context(
                viewport={'width':1280,'height':700},device_scale_factor=1,
                is_mobile=False,color_scheme='light',reduced_motion='reduce',
                accept_downloads=False,service_workers='block',
                locale='en-US',timezone_id='America/New_York',
            )
            async def route_guard(route):
                address=route.request.url
                if address.startswith(('data:','blob:','about:')):
                    await route.continue_()
                elif not public_url(address):
                    await route.abort()
                elif any(x in urlparse(address).hostname.lower() for x in
                         ('google-analytics.com','googletagmanager.com','doubleclick.net',
                          'facebook.net','hotjar.com','segment.io')):
                    await route.abort()
                else:
                    await route.continue_()
            await context.route('**/*',route_guard)
            page=await context.new_page()
            page.set_default_timeout(4500)
            response=await page.goto(url,wait_until='domcontentloaded',timeout=17000)
            if response is None or response.status>=400:
                raise RuntimeError('HTTP error or unavailable page')
            if not public_url(page.url):
                raise RuntimeError('Redirected to nonpublic page')
            await page.wait_for_timeout(1850)
            try:
                visible=(await page.locator('body').inner_text(timeout=4000))[:2000].strip()
            except Exception:
                # Heavy canvas/SVG/SPA pages may render while innerText stalls.
                visible=''
            low=visible.lower()
            if not visible and (await page.locator('canvas, img, video, svg').count())==0:
                raise RuntimeError('No visible page content')
            if len(low)<900 and any(marker in low for marker in DENIED):
                raise RuntimeError('Captcha or access interstitial')
            if ('sign in' in low or 'log in' in low) and len(low)<85:
                raise RuntimeError('Login wall')
            img=await page.screenshot(type='png',animations='disabled',full_page=False,
                                      caret='hide',timeout=10000)
            with Image.open(io.BytesIO(img)) as bitmap:
                bitmap=bitmap.convert('RGB').resize((640,350),Image.Resampling.LANCZOS)
                bitmap.save(final,format='WEBP',quality=78,method=5)
            results.append((sid,'captured'))
        except Exception as err:
            results.append((sid,'unavailable: '+str(err)[:115]))
            # A failed refresh does not overwrite a previously valid screenshot.
        finally:
            if context:
                try:
                    await context.close()
                except Exception:
                    pass

async def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--max-sites',type=int,default=0,
                        help='0 means every catalog site; otherwise first N')
    parser.add_argument('--workers',type=int,default=4)
    parser.add_argument('--browser',choices=['chromium','firefox'],default='chromium')
    parser.add_argument('--force',action='store_true')
    args=parser.parse_args()
    TARGET.mkdir(parents=True,exist_ok=True)
    sites=json.loads(CATALOG.read_text(encoding='utf-8'))['sites']
    if args.max_sites>0:
        sites=sites[:args.max_sites]
    before=existing_manifest()
    results=[]
    async with async_playwright() as playwright:
        browser=await getattr(playwright,args.browser).launch(headless=True)
        try:
            sem=asyncio.Semaphore(min(5,max(1,args.workers)))
            await asyncio.gather(*(capture(browser,sem,s,results,args.force,before) for s in sites))
        finally:
            await browser.close()
    today=datetime.now(timezone.utc).strftime('%Y-%m-%d')
    manifest={}
    for s in json.loads(CATALOG.read_text(encoding='utf-8'))['sites']:
        sid=s.get('id','')
        if not ID_PATTERN.fullmatch(sid) or not (TARGET/(sid+'.webp')).exists():
            continue
        status=next((result for key,result in results if key==sid),None)
        captured=today if status=='captured' else before.get(sid,{}).get('captured',today)
        manifest[sid]={'captured':captured}
    MANIFEST.write_text(
        '/* PUBLIC homepage screenshots captured automatically; no user cookies or logins. */\n'
        +'window.CowboySiteShots = Object.freeze('
        +json.dumps(manifest,sort_keys=True,separators=(',',':'))+');\n',
        encoding='utf-8')
    tally={}
    for _,value in results:
        key=value.split(':',1)[0]
        tally[key]=tally.get(key,0)+1
    print(json.dumps({'attempted':len(sites),'published':len(manifest),'results':tally}))
    for sid,status in results:
        if status.startswith('unavailable'):
            print(f'{sid}: {status}',file=sys.stderr)

if __name__=='__main__':
    asyncio.run(main())
