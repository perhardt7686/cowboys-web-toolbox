#!/usr/bin/env python3
"""Render the production plates UI with synthetic photos, guesses and votes."""
import asyncio
import json
import re
from pathlib import Path

from playwright.async_api import async_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://127.0.0.1:8765'
URL = BASE + '/community.html?plate-fixture'
PENDING_GUESS = 'It means night owl.\nThe word describes someone who stays up late.'
SAVED_GUESS = 'I read it as “weekend getaway.”'
REVISED_GUESS = 'The letters spell a nickname.\nThe number is part of the nickname.'
DOC = (ROOT / 'docs/community.html').read_text()
SCRIPTS = re.findall(r'<script[^>]+src="(?:commons-plates|commons-arcade-shell)\.mjs[^"]*"[^>]*></script>', DOC)
HTML = re.sub(r'<script\b[^>]*>.*?</script>', '', DOC, flags=re.S).replace(
    '</body>', '<script src="__plate_fixture.js"></script>' + ''.join(SCRIPTS) + '</body>'
)
CONFIG = """window.COWBOY_COMMUNITY_CONFIG={
  enabled:true,supabaseUrl:'https://example.invalid',publishableKey:'synthetic'
};
document.getElementById('conversations').hidden=false;"""
CLIENT = """
const pixel=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='), c=>c.charCodeAt(0));
const photo=new Blob([pixel],{type:'image/png'});
const stamp='2026-11-13T15:06:00Z';
const players=[{name:'Test member',seat:'cowboy',total:1},{name:'Other member',seat:'ana',total:1}];
const entries=[
  {id:3,seat:'ana',plate:'NITEOWL',region:'Virginia',guess:PENDING,status:'pending',photo_path:'test/pending.png',created_at:stamp},
  {id:2,seat:'cowboy',plate:'GTAWAY',region:'Virginia',guess:SAVED,status:'approved',photo_path:'test/saved.png',created_at:stamp,history:[{decision:'up'}]},
  {id:1,seat:'cowboy',plate:'NICK1',region:'Maryland',guess:REVISED,status:'approved',photo_path:'test/revised.png',created_at:stamp,discussion:[{guess:'Earlier submitted text.'}]}
];
window.fixtureVotes=[];
export function createClient(){
  return {
    auth:{getSession:async()=>({data:{session:{user:{id:'test-member'}}}}),onAuthStateChange:()=>{}},
    storage:{from:()=>({download:async()=>({data:photo})})},
    async rpc(name,args){
      if(name==='community_plate_browse'){
        const filtered=entries.filter(row=>args.p_scope!=='pending'||row.status==='pending');
        return {data:{seat:'cowboy',players,entries:filtered,total:filtered.length,offset:0}};
      }
      if(name==='community_plate_vote'){
        window.fixtureVotes.push(args);
        const row=entries.find(entry=>entry.id===args.p_id);
        if(!row||row.status!=='pending')return {error:{message:'Invalid fixture vote'}};
        row.status=args.p_up?'approved':'needs_revision';
        if(args.p_up)players[1].total+=1;
        return {data:{}};
      }
      return {error:{message:'Unexpected fixture action '+name}};
    }
  };
}
""".replace('PENDING', json.dumps(PENDING_GUESS)).replace('SAVED', json.dumps(SAVED_GUESS)).replace('REVISED', json.dumps(REVISED_GUESS))


def luminance(color):
    values = [int(value) / 255 for value in re.findall(r'\d+', color)[:3]]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in values]
    return sum(c * weight for c, weight in zip(linear, [.2126, .7152, .0722], strict=True))


async def check_readable(locator):
    await expect(locator).to_be_visible()
    colors = await locator.evaluate("""el=>{
      const styles=getComputedStyle(el);
      const surface=el.closest('.plate-card,#plate-game-content');
      const panel=el.closest('.plate-card-info');
      const background=panel?getComputedStyle(panel).backgroundColor:getComputedStyle(el.matches('.plate-done')?el:surface).backgroundColor;
      return [styles.webkitTextFillColor || styles.color,background];
    }""")
    fg, bg = map(luminance, colors)
    assert (max(fg, bg) + .05) / (min(fg, bg) + .05) >= 4.5, colors


async def check_guess(card, guess, plate, photo_selector):
    submitted = card.locator('.plate-guess')
    await expect(submitted).to_have_text(guess)
    assert await submitted.text_content() == guess
    await expect(card.get_by_text('Submitted guess', exact=True)).to_be_visible()
    await expect(card.get_by_text(plate, exact=True)).to_be_visible()
    await check_readable(submitted)
    assert await card.evaluate("""(el,selector)=>{
      const guess=el.querySelector('.plate-guess').getBoundingClientRect();
      const image=el.querySelector(selector).getBoundingClientRect();
      return guess.top>=0 && guess.bottom<=innerHeight && guess.bottom<=image.top;
    }""", photo_selector), 'The guess must be visible above the photo before scrolling'


async def run(browser, width):
    page = await browser.new_page(viewport={'width': width, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
    await page.route(URL, lambda route: route.fulfill(content_type='text/html', body=HTML))
    await page.route('**/__plate_fixture.js', lambda route: route.fulfill(content_type='application/javascript', body=CONFIG))
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm',
                     lambda route: route.fulfill(content_type='application/javascript', body=CLIENT, headers={'Access-Control-Allow-Origin': '*'}))
    try:
        await page.goto(URL, wait_until='domcontentloaded')
        await page.locator('#plate-game-open').click()
        await page.get_by_role('button', name='Review Plates', exact=True).click()
        card=page.locator('.plate-card.arcade-current-card')
        await check_guess(card, PENDING_GUESS, 'NITEOWL · Virginia', '.plate-preview')
        vote=card.get_by_role('button', name=re.compile('Agree'))
        await expect(vote).to_be_enabled()
        await vote.click()
        await expect(page.locator('#plate-status')).to_have_text('Saved.')
        assert await page.evaluate('fixtureVotes') == [{'p_id':3,'p_up':True,'p_reason':''}]
        for label, guess, plate in [
            ('NICK1', REVISED_GUESS, 'NICK1 · Maryland'),
            ('GTAWAY', SAVED_GUESS, 'GTAWAY · Virginia'),
        ]:
            await page.get_by_role('button', name='Photo Gallery', exact=True).click()
            await check_readable(page.locator('#plate-gallery-count'))
            await page.get_by_role('button', name=re.compile('Open plate '+label)).click()
            await check_guess(card, guess, plate, '.plate-preview')
            await check_readable(card.locator('.plate-done'))
            assert await card.get_by_role('button', name=re.compile('Agree')).count() == 0
        await card.get_by_role('button', name=re.compile('Review full-size photo')).click()
        dialog=page.get_by_role('dialog', name='Full-size license plate photograph')
        await check_guess(dialog, SAVED_GUESS, 'GTAWAY · Virginia', '.plate-photo-full')
        await dialog.get_by_role('button', name=re.compile('Close photo')).click()
        await expect(dialog).to_have_count(0)
        print(f'{browser.browser_type.name} {width}px: pending guess, one approval, both saved guesses, and enlarged photo passed')
    finally:
        await page.close()


async def main():
    async with async_playwright() as playwright:
        for engine, widths in [(playwright.chromium, (320, 390)), (playwright.webkit, (390,))]:
            browser=await engine.launch()
            try:
                for width in widths:
                    await run(browser, width)
            finally:
                await browser.close()


if __name__=='__main__':
    asyncio.run(main())
