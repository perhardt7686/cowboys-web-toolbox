#!/usr/bin/env python3
"""Browser-only joystick and two-button mobile check. No real user login, scores or writes."""
import asyncio
from playwright.async_api import async_playwright

HOST="http://127.0.0.1:8765"

async def check(page,game):
    await page.goto(HOST+"/test-with-us.html",wait_until="domcontentloaded")
    await page.set_content("""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body class="community-page" style="margin:0;background:#080d1c;color:white">
      <section class="retro-game-root" style="padding:6px;width:100%;box-sizing:border-box">
        <div class="retro-inside"><div class="retro-live"><canvas class="retro-canvas" width="450" height="450"></canvas><div id="deck"></div></div></div>
      </section>
    </body></html>""")
    await page.add_style_tag(url=HOST+"/commons-retro-arcade.css")
    await page.evaluate("""async (game)=>{
      const {createRetroCabinet}=await import('/retro-arcade-cabinet-ui.mjs?v=cabinet1');
      window.arcadeEvents=[];window.arcadePauseCount=0;
      const input={
        press:(g,c)=>window.arcadeEvents.push('press:'+g+':'+c),
        release:c=>window.arcadeEvents.push('release:'+c),
        tap:(g,c)=>window.arcadeEvents.push('tap:'+g+':'+c)
      };
      const deck=createRetroCabinet({game,input,isLive:()=>true,
        onPause:()=>{window.arcadePauseCount++}});
      document.getElementById('deck').append(deck);
      deck.querySelector('[data-retro-pause]').disabled=false;
    }""",game)
    width=page.viewport_size["width"]
    dims=await page.evaluate("""()=>{
      const deck=document.querySelector('.retro-cabinet-controls').getBoundingClientRect();
      const buttons=[...document.querySelectorAll('.retro-cabinet-action')].map(x=>x.getBoundingClientRect().width);
      return {deckLeft:deck.left,deckRight:deck.right,scroll:document.documentElement.scrollWidth,buttons};
    }""")
    assert dims["deckLeft"]>=0,dims
    assert dims["deckRight"]<=width+1,dims
    assert dims["scroll"]<=width+1,dims
    assert all(w>=44 for w in dims["buttons"]),dims
    stick=page.locator('[data-retro-joystick]')
    rect=await stick.bounding_box()
    cx=rect["x"]+rect["width"]/2
    cy=rect["y"]+rect["height"]/2
    await page.mouse.move(cx-30,cy)
    await page.mouse.down()
    await page.mouse.move(cx+30,cy,steps=4)
    await page.mouse.up()
    await page.locator('[data-retro-action]').focus()
    await page.keyboard.press("Enter")
    await page.locator('[data-retro-pause]').click()
    events=await page.evaluate("window.arcadeEvents")
    assert 'press:'+game+':L' in events,events
    assert 'press:'+game+':R' in events,events
    assert 'release:L' in events,events
    assert 'release:R' in events,events
    assert 'tap:'+game+':'+('F' if game=='fleet' else 'B') in events,events
    assert await page.evaluate("window.arcadePauseCount")==1
    if game=='maze':
      await page.mouse.move(cx,cy-30)
      await page.mouse.down();await page.mouse.up()
      events=await page.evaluate("window.arcadeEvents")
      assert 'press:maze:U' in events,events
    else:
      events=await page.evaluate("window.arcadeEvents")
      assert not any(e.startswith('press:fleet:U') for e in events),events

async def main():
    async with async_playwright() as pw:
      browser=await pw.chromium.launch()
      for width,height in [(320,620),(390,844),(768,768)]:
        page=await browser.new_page(viewport={"width":width,"height":height})
        for game in ("maze","fleet"):
          await check(page,game)
        await page.close()
      await browser.close()
    print("PASS: 2-game joystick, A/B buttons, keyboard, pointer capture and 320/390/768 sizing")

if __name__=="__main__":
    asyncio.run(main())
