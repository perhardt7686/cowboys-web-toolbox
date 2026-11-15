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
    nav = editor.get_by_role('navigation', name='Avatar Studio sections')
    await expect(nav.get_by_role('button',name='Create',exact=True)).to_be_visible()
    await editor.locator('[data-studio-part="hair"]').click()
    await editor.locator('[data-avatar-feature=hair][data-avatar-value=purple]').click()
    canvas = editor.locator('#family-avatar-canvas')
    await expect(canvas).to_have_attribute('data-renderer','3d',timeout=18000)
    await editor.locator('[data-studio-part="face"]').click()
    await editor.locator('summary').filter(has_text='Eyes & expressions').click()
    before = await canvas.evaluate('n=>n.toDataURL()')
    await editor.locator('[data-avatar-feature=eye_shape][data-avatar-value=dramatic]').click()
    assert before != await canvas.evaluate('n=>n.toDataURL()'), 'The face should visibly respond'
    await nav.get_by_role('button', name='Rewards', exact=True).click()
    await expect(editor.get_by_text('26 rewards',exact=True)).to_be_visible()
    await editor.locator('.studio-camera-presets').get_by_role('button',name='Fit',exact=True).click()

    no_crowding = await nav.get_by_role('button').evaluate_all('''buttons => buttons.every(node => {
      const label=document.createRange();label.selectNodeContents(node);
      const text=label.getBoundingClientRect(), button=node.getBoundingClientRect();
      return text.left>=button.left+2&&text.right<=button.right-2;
    })''')
    assert no_crowding, (width, 'Avatar Studio navigation labels must fit their buttons')
    for control in [nav.get_by_role('button',name='Companions'),
                    editor.get_by_role('searchbox',name='Search rewards')]:
        box = await control.bounding_box()
        assert box and box['width'] >= 44 and box['height'] >= 44, (width, box)
    filters = editor.get_by_role('button',name='Filters',exact=True)
    sheet = editor.get_by_role('dialog',name='Reward filters')
    await filters.click()
    await expect(sheet).to_be_in_viewport()
    await page.keyboard.press('Escape')
    await expect(sheet).to_be_hidden()
    await expect(filters).to_be_focused()
    await filters.click()
    await sheet.get_by_label('Type',exact=True).select_option('companion')
    await sheet.get_by_role('button',name='Apply').click()
    await expect(editor.get_by_text('5 rewards',exact=True)).to_be_visible()
    await editor.get_by_role('button',name='Filters (1)',exact=True).click()
    await sheet.get_by_role('button',name='Clear').click()
    await sheet.get_by_role('button',name='Apply').click()
    await expect(editor.get_by_text('26 rewards',exact=True)).to_be_visible()
    await editor.get_by_role('button',name='Fits my body').click()
    await expect(editor.get_by_text('24 rewards',exact=True)).to_be_visible()
    await editor.get_by_role('button',name='Fits my body').click()
    await editor.get_by_role('button',name='Owned',exact=True).click()
    await expect(editor.get_by_text('6 rewards',exact=True)).to_be_visible()
    await editor.get_by_role('button',name='All',exact=True).click()

    await editor.get_by_role('searchbox').fill('Brass Field Telescope')
    card = editor.locator('[data-reward-item=studio-observatory-telescope]')
    await expect(card).to_be_visible()
    before = await canvas.evaluate('n=>n.toDataURL()')
    await card.get_by_role('button', name='Try on Brass Field Telescope').click()
    assert before != await canvas.evaluate('n=>n.toDataURL()'), width
    await expect(editor.locator('#avatar-preview-status')).to_contain_text('Earn it to save it')
    assert await page.locator('#content-dialog').evaluate('n=>n.scrollWidth-n.clientWidth') <= 2
    if full:
        await editor.get_by_role('button', name='Save look').click()
        await expect(editor.get_by_text('Remove the preview-only items before saving your avatar.')).to_be_visible()
        await card.get_by_role('button', name='See Brass Field Telescope').click()
        artwork = editor.locator('.avatar-prize-art')
        await expect(artwork).to_have_attribute('data-renderer', '3d', timeout=12000)
        resting = await artwork.evaluate('node => node.toDataURL()')
        await editor.get_by_role('button', name='Extend the telescope').click()
        assert resting != await artwork.evaluate('node => node.toDataURL()')
        await nav.get_by_role('button',name='Wardrobe',exact=True).click()
        await expect(editor.get_by_text('Brass Field Telescope · Preview only')).to_be_visible()
        resting = await canvas.evaluate('node => node.toDataURL()')
        await editor.get_by_role('button', name='Activate Brass Field Telescope').click()
        assert resting != await canvas.evaluate('node => node.toDataURL()')
        await editor.get_by_role('button', name='Remove Brass Field Telescope').click()

        await nav.get_by_role('button',name='Rewards',exact=True).click()
        await editor.get_by_role('searchbox').fill('Clue-Seeker Compass')
        await editor.get_by_role('button', name='Equip Clue-Seeker Compass').click()
        await editor.get_by_role('button',name='Wardrobe',exact=True).click()
        await editor.get_by_role('textbox',name='Outfit name').fill('Backlot Night')
        await editor.get_by_role('button',name='Save outfit').click()
        await expect(editor.get_by_role('button',name='Backlot Night',exact=True)).to_be_visible()
        await editor.get_by_role('button', name='Save look').click()
        await expect(editor.locator('#profile-save-status')).to_have_text('Preview saved locally for this session.', timeout=15000)
        await page.locator('#content-dialog').evaluate('n=>n.close()')
        await expect(page.locator('#family-avatar-quick img')).to_be_visible()
        await page.locator('#family-avatar-quick').click()
        await expect(editor.locator('#avatar-equipped').get_by_text('Clue-Seeker Compass',exact=True)).to_be_visible()

        await nav.get_by_role('button',name='Companions',exact=True).click()
        await expect(canvas).to_be_visible()
        pet_picker = editor.get_by_role('combobox',name='Choose a pet')
        await pet_picker.select_option('studio-observatory-moth')
        await expect(editor.get_by_text('Game reward · Locked')).to_be_visible()
        await expect(editor.get_by_role('button',name='Adopt',exact=True)).to_have_count(0)
        portrait = editor.locator('.avatar-pet-portrait')
        await expect(portrait).to_have_attribute('data-renderer','3d')
        resting = await portrait.evaluate('node => node.toDataURL()')
        await editor.get_by_role('button',name='Preview pet',exact=True).click()
        assert resting != await portrait.evaluate('node => node.toDataURL()')
        await pet_picker.select_option('studio-attic-ghost')
        await editor.get_by_role('button',name='Adopt',exact=True).click()
        await expect(editor.get_by_text('Wick the Attic Ghost is home.')).to_be_visible()
        await expect(editor.get_by_role('button',name='Show trick')).to_be_disabled()
        for bond in [2,4,6]:
            await editor.get_by_role('button',name='Play',exact=True).click()
            await expect(editor.get_by_text(f'Bond {bond} / 12')).to_be_visible()
        await editor.get_by_role('button',name='Show trick').click()
        await expect(editor.get_by_text('Bond 7 / 12')).to_be_visible()
        await editor.get_by_text('Rename pet',exact=True).click()
        await editor.get_by_role('textbox',name='Pet name').fill('Wick')
        await editor.get_by_role('button',name='Save name').click()
        await expect(editor.get_by_role('heading',name='Wick',exact=True)).to_be_visible()
        await editor.get_by_role('button',name='Take along').click()
        await expect(nav.get_by_role('button',name='Create',exact=True)).to_have_attribute('aria-pressed','true')
        await expect(editor.locator('#avatar-equipped').get_by_text('Wick the Attic Ghost',exact=True)).to_be_visible()
        await editor.get_by_role('button',name='Save look').click()
        await expect(editor.locator('#profile-save-status')).to_have_text('Preview saved locally for this session.', timeout=15000)
        await page.locator('#content-dialog').evaluate('node => node.close()')
        await page.locator('#family-avatar-quick').click()
        await nav.get_by_role('button',name='Companions',exact=True).click()
        await pet_picker.select_option('studio-attic-ghost')
        await expect(editor.get_by_role('heading',name='Wick',exact=True)).to_be_visible()
        await expect(editor.get_by_text('Bond 7 / 12')).to_be_visible()
        await editor.locator('.studio-profile-settings summary').click()
        await editor.get_by_role('button',name='Use a photo',exact=True).click()
        await expect(editor.locator('#profile-photo')).to_be_visible()
        await editor.get_by_role('button',name='Character',exact=True).click()
        await page.keyboard.press('Escape')
        await expect(canvas).to_be_visible()
        art = await page.evaluate("""async()=>{
          const {LEGACY_CATALOG:CATALOG}=await import('/avatar-reward-catalog.mjs?v=workshop1');
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
          const {NEW_STUDIO_REWARDS:items}=await import('/avatar-collection-edition.mjs');
          const {paintRoomPrize,releaseStudioView}=await import('/avatar-dressing-room.mjs?v=workshop1');
          const ids=items.map(item=>item.id);
          const sheet=document.createElement('canvas');sheet.width=1080;sheet.height=1100;
          const c=sheet.getContext('2d');
          c.fillStyle='#f4eee3';c.fillRect(0,0,sheet.width,sheet.height);
          const variants=new Set();
          for(const [i,id] of ids.entries()){
            const tile=document.createElement('canvas');tile.width=tile.height=160;
            const item=items.find(entry=>entry.id===id);
            if(!paintRoomPrize(tile,item))throw Error('Missing art '+id);
            releaseStudioView(tile);
            const encoded=tile.toDataURL('image/png');
            if(encoded.length<1200)throw Error('Blank art '+id);
            variants.add(encoded);
            const x=i%6*180+10,y=Math.floor(i/6)*220+8;
            c.fillStyle='#ffffff';c.fillRect(x-2,y-2,164,194);
            c.drawImage(tile,x,y);
            c.fillStyle='#282239';c.font='bold 12px system-ui';
            c.fillText(item.name.slice(0,24),x,y+177,155);
          }
          if(variants.size!==ids.length)throw Error('Wardrobe art silhouettes not unique');
          return sheet.toDataURL('image/png');
        }""")
        (ROOT/'reports'/'avatar-wardrobe-audit.png').write_bytes(
            base64.b64decode(wardrobe_sheet.split(',',1)[1]))
        face_sheet = await page.evaluate("""async()=>{
          const names=['detective','mechanic','sleuth','specter','marsh','armor','automaton','radio','scout'];
          const {SHOWROOM_LOOKS}=await import('/avatar-showroom-presets.mjs?v=studio3');
          const {paintRoomAvatar,releaseStudioView}=await import('/avatar-dressing-room.mjs?v=finish5');
          const sheet=document.createElement('canvas');sheet.width=3*230;sheet.height=3*305;
          const c=sheet.getContext('2d');c.fillStyle='#f4eee4';c.fillRect(0,0,sheet.width,sheet.height);
          let unique=new Set();
          for(const [i,name] of names.entries()){
            const tile=document.createElement('canvas');tile.width=tile.height=230;
            const base=SHOWROOM_LOOKS[name];
            if(!base)throw Error('Missing model '+name);
            paintRoomAvatar(tile,base,{angle:18},0,null,'portrait');
            const encoded=tile.toDataURL('image/png');
            unique.add(encoded);
            const x=i%3*230,y=Math.floor(i/3)*305;
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
