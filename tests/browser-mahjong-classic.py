#!/usr/bin/env python3
"""No-account Classic Mahjong tile and mobile layout smoke test.

Fixture renders the real artwork module and CSS at iPhone widths. This does
not pretend to verify live Supabase RPCs or authenticated member gameplay.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
URL="http://127.0.0.1:8765/community.html?preview=1&role=member"

async def run():
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch(headless=True)
        try:
            for width in (375,390,430,768):
                page=await browser.new_page(viewport={"width":width,"height":844},has_touch=True)
                errors=[]
                page.on("pageerror",lambda error:errors.append(str(error)))
                await page.goto(URL,wait_until="domcontentloaded",timeout=30000)
                await page.evaluate("""async()=>{
                    const {addClassicTileArtwork}=await import('/mahjong-classic-tiles.mjs?v=classic1');
                    const root=document.createElement('section');root.id='mahjong-root';
                    root.className='mahjong-game';
                    root.dataset.tileset='classic';root.dataset.highlightFree='false';
                    root.style.cssText='width:min(100%,360px);margin:16px auto;';
                    const zone=document.createElement('div');zone.className='mahjong-game-zone';
                    const board=document.createElement('div');board.id='classic-test-board';board.className='mahjong-board';
                    board.style.cssText='position:relative;width:100%;height:220px;--mahjong-size:46px;';
                    for(let i=0;i<18;i++){
                        const tile=document.createElement('button');tile.type='button';
                        tile.className='mahjong-tile mahjong-kids-tile mahjong-free mahjong-variant-flower';
                        tile.style.cssText='width:46px;height:53px;left:'+(7+(i%6)*51)+'px;top:'+(7+Math.floor(i/6)*65)+'px;';
                        tile.setAttribute('aria-label','Tile '+(i+1));
                        tile.style.setProperty('--tile-face','#fff7eb');
                        tile.style.setProperty('--tile-ink','#213f33');
                        tile.style.setProperty('--tile-edge','#407d62');
                        const glyph=document.createElement('span');glyph.className='mahjong-glyph';glyph.textContent='✦';
                        const code=document.createElement('span');code.className='mahjong-match-code';code.textContent='ZZ';
                        const mark=document.createElement('span');mark.className='mahjong-mini';mark.textContent='✿';
                        tile.append(glyph,mark,code);
                        addClassicTileArtwork(tile,i+1);
                        board.append(tile);
                    }
                    zone.append(board);root.append(zone);document.body.append(root);
                }""")
                tiles=page.locator('#classic-test-board .mahjong-tile')
                await expect(tiles).to_have_count(18)
                assert await tiles.first.locator('.mahjong-classic-code').inner_text()=='C1'
                assert await tiles.nth(6).locator('.mahjong-classic-code').inner_text()=='D1'
                assert await tiles.nth(12).locator('.mahjong-classic-code').inner_text()=='B1'
                style=await tiles.first.locator('.mahjong-classic-face').evaluate('(el)=>getComputedStyle(el).display')
                assert style=='grid',(width,style)
                await tiles.first.tap()
                bounds=await page.locator('#mahjong-root').bounding_box()
                assert bounds and bounds['width']<=width,(width,bounds)
                await page.locator('#mahjong-root').evaluate('(el)=>el.dataset.tileset="family"')
                hidden=await tiles.first.locator('.mahjong-classic-face').evaluate('(el)=>getComputedStyle(el).display')
                assert hidden=='none',(width,hidden)
                await page.locator('#mahjong-root').evaluate('(el)=>{el.dataset.tileset="classic";el.dataset.highlightFree="true";}')
                await page.emulate_media(reduced_motion='reduce')
                motion=await tiles.first.evaluate('(el)=>getComputedStyle(el).animationName')
                assert motion=='none',(width,motion)
                assert not errors,(width,errors)
                (ROOT/'reports').mkdir(exist_ok=True)
                await page.screenshot(path=str(ROOT/'reports'/f'mahjong-classic-{width}.png'),animations='disabled')
                print(f'Mahjong classic visual/mobile PASS at {width}px')
                await page.close()
        finally:
            await browser.close()

if __name__=='__main__':
    asyncio.run(run())
