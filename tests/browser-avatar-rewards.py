#!/usr/bin/env python3
"""Check the shipped Avatar Studio and real arcade navigation with local preview accounts."""
import asyncio
import base64
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
    await editor.locator('[data-studio-part="hair"]').click()
    await editor.locator('[data-avatar-feature=hair][data-avatar-value=purple]').click()
    canvas = editor.locator('#family-avatar-canvas')
    retro_before=await canvas.evaluate('n=>n.toDataURL()')
    await editor.locator('[data-studio-part="face"]').click()
    await editor.locator('summary').filter(has_text='Eyes & expressions').click()
    await editor.locator('[data-avatar-feature=eye_shape][data-avatar-value=dramatic]').click()
    retro_after=await canvas.evaluate('n=>n.toDataURL()')
    assert retro_before!=retro_after,'New eye shapes must visibly redraw the portrait'
    before = await canvas.evaluate('n=>n.toDataURL()')
    await editor.get_by_role('button', name='Save outfit', exact=True).wait_for()
    await editor.get_by_role('button', name='Unlockables', exact=True).click()
    await expect(editor.get_by_text('336 rewards')).to_be_visible()
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
        await expect(artwork).to_have_attribute('data-renderer', '3d', timeout=12000)
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
        await editor.get_by_role('button', name='Equip Giant Taco Hat').click()
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
        await expect(portrait).to_have_attribute('data-renderer', '3d')
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
          const {CATALOG}=await import('/avatar-reward-catalog.mjs?v=turn1');
          const {paintThumbnail,paintPrizeDemo,drawPetPortrait,renderLoadout}=await import('/avatar-reward-render.mjs?v=turn1');
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
            const model=item.families?.includes('robot')?'automaton':item.families?.includes('monster')?'armor':'detective';
            renderLoadout(test,{full_body:{model}}); const initial=test.toDataURL();
            renderLoadout(test,{full_body:{model},cosmetics:{[item.slot]:item.id}});
            if(initial===test.toDataURL())unchanged.push(item.id);
          }
          return [seen.size,unchanged,inert];
        }""")
        assert art == [336, [], []], art
        # Capture and pixel-check all eighteen previously missing garment icons.
        wardrobe_sheet = await page.evaluate("""async()=>{
          const ids=['cinder-trench','carburetor-jacket','vault-keeper-cape',
            'phantom-cloak','night-patrol-sweater','carnival-stripes',
            'copperline-flares','lantern-pleats','midnight-a-line',
            'switchyard-boots','moonlit-straps','watchtower-gloves',
            'casefile-utility-belt','dockmaster-ascot','night-dispatch-satchel',
            'telescope-backpack','carnival-visor-plate','moorland-heartplate'];
          const {BY_ID}=await import('/avatar-reward-catalog.mjs?v=finish5');
          const {paintThumbnail}=await import('/avatar-reward-render.mjs?v=finish5');
          const sheet=document.createElement('canvas');sheet.width=1080;sheet.height=660;
          const c=sheet.getContext('2d');
          c.fillStyle='#f4eee3';c.fillRect(0,0,sheet.width,sheet.height);
          const variants=new Set();
          for(const [i,id] of ids.entries()){
            const tile=document.createElement('canvas');tile.width=tile.height=160;
            const item=BY_ID.get(id);if(!item||typeof item.draw!=='function')throw Error('Missing art '+id);
            paintThumbnail(tile,item);
            const encoded=tile.toDataURL('image/png');
            if(encoded.length<1200)throw Error('Blank art '+id);
            variants.add(encoded);
            const x=i%6*180+10,y=Math.floor(i/6)*220+8;
            c.fillStyle='#ffffff';c.fillRect(x-2,y-2,164,194);
            c.drawImage(tile,x,y);
            c.fillStyle='#282239';c.font='bold 12px system-ui';
            c.fillText(item.name.slice(0,24),x,y+177,155);
          }
          if(variants.size!==18)throw Error('Wardrobe art silhouettes not unique');
          return sheet.toDataURL('image/png');
        }""")
        (ROOT/'reports'/'avatar-wardrobe-audit.png').write_bytes(
            base64.b64decode(wardrobe_sheet.split(',',1)[1]))
        face_sheet = await page.evaluate("""async()=>{
          const names=['detective','mechanic','sleuth','specter','armor','automaton','scout'];
          const {SHOWROOM_LOOKS}=await import('/avatar-showroom-presets.mjs?v=studio3');
          const {paintRoomAvatar,releaseStudioView}=await import('/avatar-dressing-room.mjs?v=finish5');
          const sheet=document.createElement('canvas');sheet.width=4*230;sheet.height=2*305;
          const c=sheet.getContext('2d');c.fillStyle='#f4eee4';c.fillRect(0,0,sheet.width,sheet.height);
          let unique=new Set();
          for(const [i,name] of names.entries()){
            const tile=document.createElement('canvas');tile.width=tile.height=230;
            const base=SHOWROOM_LOOKS[name];
            if(!base)throw Error('Missing model '+name);
            paintRoomAvatar(tile,base,{angle:18},0,null,'portrait');
            const encoded=tile.toDataURL('image/png');
            unique.add(encoded);
            const x=i%4*230,y=Math.floor(i/4)*305;
            c.drawImage(tile,x,y,220,264);
            c.fillStyle='#272039';c.font='bold 17px system-ui';
            c.fillText(name.toUpperCase(),x+9,y+283,205);
            releaseStudioView(tile);
          }
          if(unique.size!==names.length)throw Error('Several models render exactly the same');
          return sheet.toDataURL('image/png');
        }""")
        (ROOT/'reports'/'avatar-face-silhouettes.png').write_bytes(
            base64.b64decode(face_sheet.split(',',1)[1]))


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
