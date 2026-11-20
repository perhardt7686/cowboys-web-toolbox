#!/usr/bin/env python3
"""Edward local preview persona: not a live account, no server writes."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright,expect

BASE='http://127.0.0.1:8765/community.html'
OUT=Path(__file__).resolve().parents[1]/'reports'
OUT.mkdir(exist_ok=True)

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for width,height in ((375,667),(390,844),(1365,900)):
   page=await browser.new_page(viewport={'width':width,'height':height})
   errors=[]
   requests=[]
   page.on('pageerror',lambda err:errors.append(str(err)))
   page.on('request',lambda req:requests.append(req.url))
   await page.goto(BASE+'?preview=1&role=edward&panel=powers',wait_until='domcontentloaded')
   await expect(page.locator('#preview-role')).to_have_value('edward',timeout=25000)
   await expect(page.locator('body')).to_have_attribute('data-edward-test-preview','true',timeout=15000)
   await expect(page.locator('#preview-banner')).to_be_visible()
   await expect(page.locator('.community-layout')).to_be_visible()
   await expect(page.locator('#owner-dashboard')).to_be_hidden()
   await expect(page.locator('#content-dialog')).to_be_visible(timeout=10000)
   await expect(page.locator('#content-dialog')).to_contain_text('Moderator')
   assert await page.evaluate('document.documentElement.scrollWidth-innerWidth')<=1,(width,'horizontal overflow')
   # The demo must never attempt a login, game RPC or real posting side effect.
   unexpected=[u for u in requests if '/auth/v1/' in u or '/functions/v1/community-api' in u]
   assert not unexpected,(width,unexpected)
   assert not errors,(width,errors)
   await page.screenshot(path=str(OUT/f'edward-ai-test-moderator-{width}.png'),full_page=False)
   await page.close()
  # On an actual hosted page, a role URL alone must never activate testing.
  # This localhost negative case has no preview=1.
  page=await browser.new_page(viewport={'width':390,'height':844})
  await page.goto(BASE+'?role=edward',wait_until='domcontentloaded')
  await expect(page.locator('#preview-banner')).to_be_hidden(timeout=15000)
  assert await page.locator('body').get_attribute('data-edward-test-preview')!='true'
  await page.close()
  await browser.close()
  print('Edward (AI Test) PASS: 3 viewport layouts, sample moderator, no Supabase Auth / API writes, no URL-only privilege')
if __name__=='__main__':
 asyncio.run(main())
