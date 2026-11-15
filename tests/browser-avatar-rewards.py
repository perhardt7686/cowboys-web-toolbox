#!/usr/bin/env python3
"""Check the shipped Avatar Studio and real arcade navigation with local preview accounts."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
URL = 'http://127.0.0.1:8765/community.html?preview=1&role=member'


async def visit(browser, width, full=False):
    page = await browser.new_page(viewport={'width': width, 'height': 850}, reduced_motion='reduce',
                                  has_touch=width < 800)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    await page.goto(URL, wait_until='domcontentloaded')
    await page.locator('#family-avatar-quick').click()
    editor = page.locator('#profile-studio-form')
    await expect(editor.get_by_role('button', name='My Avatar', exact=True)).to_be_visible()
    await editor.locator('summary').filter(has_text='Hair & facial hair').click()
    await editor.locator('[data-avatar-feature=hair][data-avatar-value=purple]').click()
    canvas = editor.locator('#family-avatar-canvas')
    retro_before=await canvas.evaluate('n=>n.toDataURL()')
    await editor.locator('summary').filter(has_text='Eyes & expressions').click()
    await editor.locator('[data-avatar-feature=eye_shape][data-avatar-value=dramatic]').click()
    retro_after=await canvas.evaluate('n=>n.toDataURL()')
    assert retro_before!=retro_after,'New eye shapes must visibly redraw the portrait'
    before = await canvas.evaluate('n=>n.toDataURL()')
    await editor.get_by_role('button', name='Save outfit', exact=True).wait_for()
    await editor.get_by_role('button', name='Unlockables', exact=True).click()
    await expect(editor.get_by_text('310 rewards')).to_be_visible()
    achievement_tab=editor.get_by_role('button',name='Achievements',exact=True)
    assert await achievement_tab.evaluate("""node => {
      const text=document.createRange();
      text.selectNodeContents(node);
      return text.getClientRects().length===1;
    }"""), width
    for node in [editor.get_by_role('button', name='Unlockables', exact=True),
                 editor.get_by_role('searchbox', name='Search rewards')]:
        box = await node.bounding_box()
        assert box and box['width'] >= 44 and box['height'] >= 44, (width, box)
    await editor.get_by_role('searchbox').fill('Dragon Crown')
    card = editor.locator('[data-reward-item=dragon-crown]')
    await expect(card).to_be_visible()
    await card.get_by_role('button', name='Try on Dragon Crown').click()
    assert before != await canvas.evaluate('n=>n.toDataURL()'), width
    await expect(editor.get_by_text('Dragon Crown · Preview only')).to_be_visible()
    assert await page.locator('#content-dialog').evaluate('n=>n.scrollWidth-n.clientWidth') <= 2
    if full:
        await editor.get_by_role('button', name='Save my avatar').click()
        await expect(editor.get_by_text('Remove the preview-only items before saving your avatar.')).to_be_visible()
        await card.get_by_role('button', name='See Dragon Crown').click()
        artwork = editor.locator('.avatar-prize-art')
        resting = await artwork.evaluate('node => node.toDataURL()')
        await editor.get_by_role('button', name='Wake the dragon').click()
        assert resting != await artwork.evaluate('node => node.toDataURL()'), 'Dragon embers'
        resting = await canvas.evaluate('node => node.toDataURL()')
        await editor.get_by_role('button', name='Activate Dragon Crown').click()
        assert resting != await canvas.evaluate('node => node.toDataURL()'), 'Equipped dragon embers'
        await page.evaluate("""()=>{
          const root=document.createElement('section'); root.id='mahjong-root';
          root.innerHTML='<button id="mahjong-toggle" type="button" aria-expanded="false">Fixture Mahjong</button><div id="mahjong-play">Fixture game</div>';
          root.querySelector('button').addEventListener('click',event=>{
            event.target.setAttribute('aria-expanded',String(event.target.getAttribute('aria-expanded')!=='true'));
          });
          document.querySelector('#conversations .community-main').append(root);
        }""")
        await editor.get_by_role('button', name='Play Mahjong to unlock').click()
        back = page.get_by_role('button', name='Back to Avatar Studio', exact=True)
        await expect(back).to_be_visible()
        assert await page.locator('body').get_attribute('data-arcade-game') == 'mahjong'
        await back.click()
        await expect(editor.get_by_role('heading', name='Dragon Crown')).to_be_visible()
        await expect(editor.get_by_text('Dragon Crown · Preview only')).to_be_visible()
        await editor.get_by_role('button', name='Remove Dragon Crown').click()
        await editor.get_by_role('button', name='Back to collection').click()
        await editor.get_by_role('searchbox').fill('Giant Taco Hat')
        await editor.get_by_role('button', name='Try on Giant Taco Hat').click()
        await editor.get_by_role('button', name='Save my avatar').click()
        await expect(editor.get_by_text('Preview saved locally for this session.')).to_be_visible()
        await page.locator('#content-dialog').evaluate('n=>n.close()')
        await expect(page.locator('#family-avatar-quick img')).to_be_visible()
        await page.locator('#family-avatar-quick').click()
        await expect(editor.locator('#avatar-equipped').get_by_text('Giant Taco Hat', exact=True)).to_be_visible()
        await editor.get_by_role('textbox', name='Outfit name').fill('Taco night')
        await editor.get_by_role('button', name='Save outfit', exact=True).click()
        await expect(editor.get_by_role('button', name='Taco night', exact=True)).to_be_visible()
        await editor.get_by_role('button', name='Pets', exact=True).click()
        pet_picker = editor.get_by_role('combobox', name='Choose a pet')
        await pet_picker.select_option('lantern-raccoon')
        await expect(editor.get_by_text('Game reward · Locked')).to_be_visible()
        await expect(editor.get_by_role('button', name='Adopt', exact=True)).to_have_count(0)
        portrait = editor.locator('.avatar-pet-portrait')
        resting = await portrait.evaluate('node => node.toDataURL()')
        await editor.get_by_role('button', name='Preview pet', exact=True).click()
        assert resting != await portrait.evaluate('node => node.toDataURL()'), 'Locked pet preview'
        await editor.get_by_role('button', name='See how to earn it').click()
        await expect(editor.get_by_role('heading', name='Lantern Raccoon')).to_be_visible()
        await expect(editor.get_by_role('button', name='Play Hot Rod to unlock')).to_be_visible()
        await editor.get_by_role('button', name='Pets', exact=True).click()
        await pet_picker.select_option('trail-husky')
        await editor.get_by_role('button', name='Adopt', exact=True).click()
        await expect(editor.get_by_text('Trail Husky is home.')).to_be_visible()
        await expect(editor.get_by_role('button', name='Show trick')).to_be_disabled()
        for bond in [2,4,6]:
            await editor.get_by_role('button', name='Play', exact=True).click()
            await expect(editor.get_by_text(f'Bond {bond} / 12')).to_be_visible()
        await editor.get_by_role('button', name='Show trick').click()
        await expect(editor.get_by_text('Bond 7 / 12')).to_be_visible()
        await expect(editor.get_by_text('Does a double hop with a trail of stars.')).to_be_visible()
        await editor.get_by_text('Rename pet', exact=True).click()
        await editor.get_by_role('textbox', name='Pet name').fill('Scout')
        await editor.get_by_role('button', name='Save name').click()
        await expect(editor.get_by_role('heading', name='Scout')).to_be_visible()
        await expect(editor.get_by_role('button',name='Save my avatar')).to_be_hidden()
        await editor.get_by_role('button', name='Take along').click()
        await expect(editor.get_by_role('button',name='My Avatar',exact=True)).to_have_attribute('aria-pressed','true')
        await expect(editor.locator('#avatar-equipped').get_by_text('Trail Husky', exact=True)).to_be_visible()
        await editor.get_by_role('button', name='Save my avatar').click()
        await expect(editor.get_by_text('Preview saved locally for this session.')).to_be_visible()
        await page.locator('#content-dialog').evaluate('node => node.close()')
        await page.locator('#family-avatar-quick').click()
        await editor.get_by_role('button', name='Pets', exact=True).click()
        await pet_picker.select_option('trail-husky')
        await expect(editor.get_by_role('heading', name='Scout')).to_be_visible()
        await expect(editor.get_by_text('Bond 7 / 12')).to_be_visible()
        await portrait.scroll_into_view_if_needed()
        await expect(portrait).to_be_in_viewport(ratio=.8)
        assert await page.locator('#content-dialog').evaluate('n=>n.scrollWidth-n.clientWidth') <= 2
        art = await page.evaluate("""async()=>{
          const {CATALOG}=await import('/avatar-reward-catalog.mjs?v=cel1');
          const {paintThumbnail,paintPrizeDemo,drawPetPortrait,renderLoadout}=await import('/avatar-reward-render.mjs?v=toon3');
          const seen=new Set(), unchanged=[], inert=[];
          for(const item of CATALOG){
            const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
            paintThumbnail(canvas,item); seen.add(canvas.toDataURL());
            if(item.slot==='companion')drawPetPortrait(canvas,item);
            const idle=canvas.toDataURL();
            if(item.slot==='companion')drawPetPortrait(canvas,item,'trick',.43);
            else paintPrizeDemo(canvas,item,.43);
            if(idle===canvas.toDataURL())inert.push(item.id);
            const test=document.createElement('canvas');test.width=test.height=128;
            renderLoadout(test,{}); const initial=test.toDataURL();
            renderLoadout(test,{cosmetics:{[item.slot]:item.id}});
            if(initial===test.toDataURL())unchanged.push(item.id);
          }
          return [seen.size,unchanged,inert];
        }""")
        assert art == [310, [], []], art
    assert not errors, (width, errors)
    (ROOT/'reports').mkdir(exist_ok=True)
    if width in (390,1280):
        await page.screenshot(path=str(ROOT/'reports'/f'avatar-rewards-{width}.png'),animations='disabled')
    await page.close()
    print(f'Avatar rewards PASS at {width}px')


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width in [320,375,390,430,768,1280]:
            await visit(browser, width, full=width == 390)
        await browser.close()
        safari = await p.webkit.launch()
        await visit(safari,390,full=True)
        await safari.close()


if __name__ == '__main__':
    asyncio.run(main())
