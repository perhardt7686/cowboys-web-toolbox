#!/usr/bin/env python3
"""Verify stage interactions through the private board's approved-member preview."""
import asyncio
import base64
from pathlib import Path

from playwright.async_api import async_playwright, expect

REPORTS = Path(__file__).resolve().parents[1] / 'reports'
URL = 'http://127.0.0.1:8765/community.html?preview=1&role=member'


async def studio(page):
    await page.goto(URL, wait_until='domcontentloaded')
    await page.locator('#family-avatar-quick').click()
    form = page.locator('#profile-studio-form')
    award = form.get_by_role('button', name='Back to Studio', exact=True)
    if await award.is_visible():
        await award.click()
    canvas = form.locator('#family-avatar-canvas')
    await expect(canvas).to_have_attribute('data-renderer', '3d', timeout=20000)
    await form.get_by_role('button', name='Rewards', exact=True).click()
    await form.get_by_role('heading', name='Collections').wait_for()
    return form, canvas


async def pixels(canvas):
    return await canvas.evaluate('canvas => canvas.toDataURL()')


async def reduce_motion_walk(browser):
    page = await browser.new_page(
        viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True,
        reduced_motion='reduce',
    )
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    form, canvas = await studio(page)
    stage = form.locator('.studio-stage')
    note = stage.locator('.avatar-stage-preview-note')
    for look, action, reward, reaction in [
        ('After Hours Observatory', 'Extend the telescope', 'studio-observatory-telescope', 'perch'),
        ('Raincoat Revenants', 'Light the lantern', 'studio-rain-lantern', 'sniff'),
        ('Midnight Carnival Workshop', 'Sweep the visor', 'studio-workshop-visor', 'scan'),
    ]:
        await form.get_by_role('button', name='Preview '+look+' look').click()
        await expect(note).to_contain_text(look+' preview')
        resting = await pixels(canvas)
        await note.get_by_role('button', name=action).click()
        await expect(canvas).to_have_attribute('data-studio-action', reward)
        await expect(canvas).to_have_attribute('data-studio-reaction', reaction)
        assert resting != await pixels(canvas)
        if look == 'After Hours Observatory':
            await stage.evaluate("element => element.scrollIntoView({block:'start'})")
            await expect(canvas).to_be_in_viewport(ratio=.96)
            assert await canvas.evaluate("node => node.clientWidth >= node.closest('.studio-stage').clientWidth * .91")
            await expect(stage.get_by_role('button', name='Face', exact=True)).to_be_in_viewport()
            await expect(note.get_by_role('button', name=action)).to_be_in_viewport()
            await page.screenshot(path=str(REPORTS/'avatar-cartoon-iphone.png'), animations='disabled')
        await note.get_by_role('button', name='My character', exact=True).click()
        await expect(canvas).to_have_attribute('data-studio-action', '')
        await expect(note).to_be_hidden()
    await expect(form.locator('#avatar-equipped').get_by_text('Museum Lantern')).to_have_count(0)

    await form.get_by_role('searchbox', name='Search rewards').fill('Brass Field Telescope')
    await form.get_by_role('button', name='See Brass Field Telescope').click()
    preview = form.locator('.avatar-prize-art')
    await expect(form.get_by_role('heading', name='Brass Field Telescope')).to_be_visible()
    before = await pixels(preview)
    await form.get_by_role('button', name='Extend the telescope', exact=True).click()
    await expect(preview).to_have_attribute('data-studio-action', 'studio-observatory-telescope')
    assert before != await pixels(preview)
    await expect(form.get_by_role('button', name='Play Star Squadron to unlock')).to_be_visible()
    await form.get_by_role('button', name='Try it on', exact=True).click()
    await form.get_by_role('button', name='Save look').click()
    await expect(form.get_by_text('Remove the preview-only items before saving your avatar.')).to_be_visible()
    await page.set_viewport_size({'width': 844, 'height': 390})
    assert await page.locator('#content-dialog').evaluate('n => n.scrollWidth <= n.clientWidth + 2')
    assert not errors, errors
    print('iPhone-sized WebKit cartoon interactions PASS, including locked action and reduced motion')
    await page.close()


async def record_interaction(browser):
    context = await browser.new_context(viewport={'width': 864, 'height': 810},
        record_video_dir=REPORTS/'cartoon-recordings', record_video_size={'width': 864, 'height': 810})
    page = await context.new_page()
    video = page.video
    form, canvas = await studio(page)
    note = form.locator('.avatar-stage-preview-note')
    await form.get_by_role('button', name='Preview After Hours Observatory look').click()
    await form.locator('.studio-stage').evaluate("element => element.scrollIntoView({block:'start'})")
    await expect(canvas).to_be_in_viewport(ratio=.96)
    await expect(canvas).to_have_attribute('data-backend', 'webgl')
    await form.get_by_role('button', name='Rotate right', exact=True).click()
    await expect(canvas).to_have_attribute('data-angle', '45')
    paused = await pixels(canvas)
    await note.get_by_role('button', name='Extend the telescope', exact=True).click()
    await expect(canvas).to_have_attribute('data-studio-reaction', 'perch')
    assert paused != await pixels(canvas)
    await expect(canvas).to_have_attribute('data-studio-action', '', timeout=6000)
    await note.get_by_role('button', name='Extend the telescope', exact=True).click()
    await expect(canvas).to_have_attribute('data-studio-action', '', timeout=6000)
    await context.close()
    await video.save_as(REPORTS/'avatar-cartoon-interaction.webm')
    print('Desktop Chromium telescope and moth landing PASS')


async def review_angles(browser):
    page = await browser.new_page(viewport={'width': 1280, 'height': 900})
    await page.goto(URL, wait_until='domcontentloaded')
    sheets = await page.evaluate("""async()=>{
      const {paintRoomAvatar,paintRoomPet,releaseStudioView}=await import('/avatar-dressing-room.mjs?v=workshop1');
      const {renderLoadout,drawPetPortrait}=await import('/avatar-reward-render.mjs?v=workshop1');
      const {SHOWROOM_LOOKS}=await import('/avatar-showroom-presets.mjs?v=workshop1');
      const {BY_ID}=await import('/avatar-reward-catalog.mjs?v=workshop1');
      const samples=[
        ['Astronomer', {...SHOWROOM_LOOKS.mechanic,cosmetics:{prop:'studio-observatory-telescope',
            back:'studio-observatory-pack',outerwear:'studio-observatory-coat',companion:'studio-observatory-moth',
            background:'studio-observatory-scene'}}],
        ['Marsh watchkeeper', {...SHOWROOM_LOOKS.marsh,cosmetics:{outerwear:'studio-rain-cape',
            companion:'studio-rain-hound',background:'studio-rain-scene'}}],
        ['Midway automaton', {...SHOWROOM_LOOKS.automaton,cosmetics:{bodypart:'studio-workshop-visor',
            hands:'studio-workshop-gloves',companion:'studio-workshop-gremlin',background:'studio-workshop-scene'}}],
        ['Slatewing gargoyle', BY_ID.get('studio-tower-gargoyle')]
      ];
      const split=['Front','Front right','Right','Back right','Back','Back left','Left','Front left'];
      const makeCanvas=(width,height)=>Object.assign(document.createElement('canvas'),{width,height});
      const sheet=makeCanvas(1440,1080), comparison=makeCanvas(1120,615);
      const close=makeCanvas(1104,676);
      for(const [canvas,title] of [[sheet,'Avatar Studio · eight viewpoints'],
        [comparison,'Toon models and layered cels at identical size'],[close,'Face details · front, three-quarter and profile']]){
        const ctx=canvas.getContext('2d');ctx.fillStyle='#f5ead7';ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='#362238';ctx.font='bold 24px system-ui';ctx.fillText(title,20,31);
      }
      const overview=sheet.getContext('2d');
      overview.fillStyle='#423047';overview.font='bold 13px system-ui';
      split.forEach((label,i)=>overview.fillText(label,156+i*159,57));
      const tile=makeCanvas(156,234), shadows=makeCanvas(135,225), portrait=makeCanvas(210,210);
      // Give the production stage's painted scene images a chance to decode before the contact sheets.
      for(const [,recipe] of samples){
        if(recipe.slot==='companion')paintRoomPet(tile,recipe,{angle:0});
        else paintRoomAvatar(tile,recipe,{angle:0});
      }
      await Promise.all(['attic','observatory','rain','workshop','tower','backlot'].map(async id=>{
        const img=new Image();
        img.src='/avatar-scenes/'+id+'.webp?v=paint1';
        await img.decode();
      }));
      const profile=close.getContext('2d'), side=comparison.getContext('2d');
      for(let r=0;r<samples.length;r++){
        const [name,recipe]=samples[r], isPet=recipe.slot==='companion';
        const render=(target,angle)=>isPet?paintRoomPet(target,recipe,{angle}):paintRoomAvatar(target,recipe,{angle});
        const keys=new Set();
        overview.fillText(name,15,112+r*246,130);
        for(let col=0;col<8;col++){
          if(!render(tile,col*45))throw new Error('No stage art for '+name);
          keys.add(tile.toDataURL('image/png'));
          overview.drawImage(tile,156+col*159,68+r*246);
        }
        if(keys.size!==8)throw new Error('The angles repeat for '+name);
        const x=12+276*r;
        side.fillStyle='#403043';side.font='bold 15px system-ui';side.fillText(name,x,64,270);
        for(const [i,angle] of [45,135].entries()){
          render(shadows,angle);
          side.drawImage(shadows,x,91+i*256);
          if(isPet)drawPetPortrait(shadows,recipe,null,0,{angle});
          else renderLoadout(shadows,recipe,0,null,{angle});
          side.drawImage(shadows,x+137,91+i*256);
        }
        side.font='12px system-ui';
        side.fillText('Toon 3D',x,84);side.fillText('Layered 2D',x+137,84);
      }
      for(const [row,name] of ['detective','mechanic','marsh'].entries()){
        profile.fillStyle='#403043';profile.font='bold 16px system-ui';profile.fillText(name,14,108+row*205);
        for(const [column,angle] of [0,45,90].entries()){
          if(!paintRoomAvatar(portrait,SHOWROOM_LOOKS[name],{angle},0,null,'portrait'))throw Error(name);
          profile.drawImage(portrait,157+column*302,48+row*205,204,204);
        }
      }
      // Original model sheet: identical recipe/camera in both pipelines.
      // This is a visual review artifact, not just a "canvas is nonblank" check.
      const moods=['smile','grin','calm','wink','curious','smirk','laugh','determined'];
      const expressions=makeCanvas(864,1770),ec=expressions.getContext('2d');
      ec.fillStyle='#f7efdf';ec.fillRect(0,0,864,1770);
      ec.fillStyle='#30243a';ec.font='bold 23px system-ui';
      ec.fillText('Original faces · 3D and layered-cel · eight expressions',20,30);
      const columns=[['3D front',0,false],['Cel front',0,true],
        ['3D profile',90,false],['Cel profile',90,true]];
      const faceTile=makeCanvas(220,250),celTile=makeCanvas(220,250);
      const fingerprints={three:new Set(),cel:new Set()};
      for(let k=0;k<columns.length;k++)ec.fillText(columns[k][0],135+k*181,65);
      for(const [i,mood] of moods.entries()){
        const recipe={...SHOWROOM_LOOKS.detective,beard:'none',glasses:'none',
          expression:mood,hat:'none',style:'short'};
        const y=82+i*210;
        ec.font='bold 15px system-ui';ec.fillStyle='#30243a';
        ec.fillText(mood.toUpperCase(),8,y+94);
        for(const [j,angle,isCel] of columns.entries()){
          const target=isCel?celTile:faceTile;
          const camera={angle,zoom:2.45,y:166};
          if(isCel)renderLoadout(target,recipe,0,null,camera);
          else if(!paintRoomAvatar(target,recipe,camera,0,null,'body'))throw Error('No 3D art '+mood);
          if(angle===0)fingerprints[isCel?'cel':'three'].add(target.toDataURL('image/png'));
          ec.drawImage(target,129+j*181,y,176,177);
        }
      }
      if(fingerprints.three.size!==moods.length||fingerprints.cel.size!==moods.length)
        throw Error('The facial expression model sheet contains repeated views');
      for(const canvas of [tile,shadows,portrait,faceTile])releaseStudioView(canvas);
      return [sheet,comparison,close,expressions].map(node=>node.toDataURL('image/png').split(',')[1]);
    }""")
    for name, data in zip(['avatar-workshop-turnaround.png','avatar-workshop-rendering-comparison.png',
                           'avatar-workshop-face-angles.png','avatar-workshop-expression-model-sheet.png'], sheets):
        (REPORTS/name).write_bytes(base64.b64decode(data))
    await page.close()


async def software_preview(chromium):
    browser = await chromium.launch(args=['--disable-webgl', '--disable-webgl2'])
    page = await browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    form, canvas = await studio(page)
    await expect(canvas).to_have_attribute('data-backend', 'canvas')
    await form.get_by_role('button', name='Preview Midnight Carnival Workshop look').click()
    before = await pixels(canvas)
    await form.locator('.avatar-stage-preview-note').get_by_role('button', name='Sweep the visor').click()
    await expect(canvas).to_have_attribute('data-studio-reaction', 'scan')
    assert before != await pixels(canvas)
    await browser.close()
    print('Canvas fallback preserves the visual interaction PASS')


async def main():
    REPORTS.mkdir(exist_ok=True)
    async with async_playwright() as playwright:
        webkit = await playwright.webkit.launch()
        await reduce_motion_walk(webkit)
        await webkit.close()
        chromium = await playwright.chromium.launch(args=['--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        await review_angles(chromium)
        await record_interaction(chromium)
        await chromium.close()
        await software_preview(playwright.chromium)


if __name__ == '__main__':
    asyncio.run(main())
