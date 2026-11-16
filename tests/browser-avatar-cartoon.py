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
      const {figureAt}=await import('/avatar-turnaround-figure.mjs?v=workshop1');
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
      // The camera toggle must preserve the side of the face in both renderers.
      const turning=makeCanvas(435,482),tc=turning.getContext('2d');
      tc.fillStyle='#f7efdf';tc.fillRect(0,0,turning.width,turning.height);
      const turnSample={...SHOWROOM_LOOKS.detective,background:'ocean',hair:'black',style:'short',
        beard:'none',glasses:'none',hat:'none',skin:'tan',nose:'pointed',pose:'center',shirt:'teal'};
      const turnTile=makeCanvas(200,200),direction=[];
      tc.fillStyle='#34283d';tc.font='bold 18px system-ui';
      tc.fillText('Same turns in 3D and layered cel',16,26);
      tc.font='14px system-ui';tc.fillText('3D',16,48);tc.fillText('Layered cel',218,48);
      for(const [row,angle] of [45,315].entries()){
        const head=figureAt(turnSample,angle);
        const centers=[];
        for(const [column,isCel] of [false,true].entries()){
          if(isCel)renderLoadout(turnTile,turnSample,0,null,{angle,crop:{
            x:head.head.x,y:head.head.y+41*head.design.scale,size:175}});
          else if(!paintRoomAvatar(turnTile,turnSample,{angle},0,null,'portrait'))
            throw Error('No 3D turn sample');
          // Warm cheek pixels in the center band track the turn; the cool
          // scenery, dark hair and teal wardrobe sit outside this color range.
          const {data}=turnTile.getContext('2d').getImageData(44,58,112,80);
          let sum=0,count=0;
          for(let pixel=0;pixel<data.length;pixel+=4){
            const r=data[pixel],g=data[pixel+1],b=data[pixel+2];
            if(g>68&&r>g+18&&g>b+12){sum+=(pixel/4)%112;count++;}
          }
          if(count<100)throw Error('Could not measure cheek position at '+angle);
          centers.push(sum/count);
          tc.drawImage(turnTile,16+column*202,56+row*205);
        }
        direction.push(centers);
      }
      if(direction[0].some((center,i)=>center-direction[1][i]<3))
        throw Error('3D and layered cel turn in different directions: '+JSON.stringify(direction));
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
      const fingerprints={three:new Map(),cel:new Map()},duplicates={three:[],cel:[]};
      for(let k=0;k<columns.length;k++)ec.fillText(columns[k][0],135+k*181,65);
      for(const [i,mood] of moods.entries()){
        const recipe={...SHOWROOM_LOOKS.detective,beard:'none',glasses:'none',
          expression:mood,hat:'none',style:'short'};
        const y=82+i*210;
        ec.font='bold 15px system-ui';ec.fillStyle='#30243a';
        ec.fillText(mood.toUpperCase(),8,y+94);
        for(const [j,[label,angle,isCel]] of columns.entries()){
          const target=isCel?celTile:faceTile;
          const head=figureAt(recipe,angle);
          const camera=isCel?{angle,crop:{x:head.head.x,
            y:head.head.y+41*head.design.scale,size:180}}:
            {angle,zoom:2.45,y:166};
          if(isCel)renderLoadout(target,recipe,0,null,camera);
          else if(!paintRoomAvatar(target,recipe,camera,0,null,'body'))throw Error('No 3D art '+mood);
          if(angle===0){
            const kind=isCel?'cel':'three',fingerprint=target.toDataURL('image/png');
            const match=fingerprints[kind].get(fingerprint);
            if(match)duplicates[kind].push(match+' = '+mood);
            else fingerprints[kind].set(fingerprint,mood);
          }
          ec.drawImage(target,129+j*181,y,176,177);
        }
      }
      // The actual small UI sizes, not enlarged artwork, are the art-direction gate.
      const small=makeCanvas(600,440),sc=small.getContext('2d');
      sc.fillStyle='#f7efdf';sc.fillRect(0,0,600,440);
      sc.fillStyle='#34283d';sc.font='bold 20px system-ui';
      sc.fillText('Smile / grin / smirk · 48px and 64px',18,30);
      const smallTypes=[['3D 48',false,48],['Cel 48',true,48],
        ['3D 64',false,64],['Cel 64',true,64]];
      const smallFingerprints={};
      for(const [j,[label,isCel,size]] of smallTypes.entries()){
        sc.fillText(label,115+j*120,62);
        smallFingerprints[label]=new Set();
        for(const [i,mood] of ['smile','grin','smirk'].entries()){
          const recipe={...SHOWROOM_LOOKS.detective,beard:'none',
            glasses:'none',hat:'none',style:'short',expression:mood};
          const target=isCel?celTile:faceTile;
          const head=figureAt(recipe,0);
          const camera=isCel?{angle:0,crop:{x:head.head.x,
            y:head.head.y+41*head.design.scale,size:180}}:
            {angle:0,zoom:2.45,y:166};
          if(isCel)renderLoadout(target,recipe,0,null,camera);
          else if(!paintRoomAvatar(target,recipe,camera,0,null,'body'))
            throw Error('No small avatar for '+mood);
          const x=123+j*120,y=95+i*109;
          // Copy at exact pixel size: canvas resampling, then view as a phone icon.
          const thumbnail=makeCanvas(size,size);
          thumbnail.getContext('2d').drawImage(target,0,0,size,size);
          smallFingerprints[label].add(thumbnail.toDataURL('image/png'));
          sc.drawImage(thumbnail,x,y,size,size);
          sc.font='bold 14px system-ui';sc.fillStyle='#34283d';
          if(j===0)sc.fillText(mood,9,y+size*.65);
        }
      }
      for(const [label,views] of Object.entries(smallFingerprints))
        if(views.size!==3)throw Error('Small icon face shapes repeated: '+label);
      // Contact sheet of six fitted jaw masks in three directions, side by
      // side against existing direction-specific 2D facial hair. Synthetic only.
      const beardSheet=makeCanvas(1040,1270),bc=beardSheet.getContext('2d');
      bc.fillStyle='#f7efdf';bc.fillRect(0,0,1040,1270);
      bc.fillStyle='#34283d';bc.font='bold 22px system-ui';
      bc.fillText('Painted beard mask · six head shapes · 3D / 2D × 0° 45° 90°',18,28);
      const beardFaces=['oval','round','square','heart','long','angular'];
      const beardAngles=[0,45,90], beardTarget=makeCanvas(200,200);
      for(const [i,face] of beardFaces.entries()){
        const y=59+i*198;
        bc.fillStyle='#34283d';bc.font='bold 16px system-ui';
        bc.fillText(face.toUpperCase(),6,y+62);
        for(const [k,angle] of beardAngles.entries()){
          const recipe={...SHOWROOM_LOOKS.mechanic,face,beard:'beard',
            hat:'none',glasses:'none',expression:'smile'};
          const head=figureAt(recipe,angle);
          for(const [j,isCel] of [false,true].entries()){
            const camera=isCel?{angle,crop:{x:head.head.x,
              y:head.head.y+41*head.design.scale,size:175}}:
              {angle,zoom:2.3,y:166};
            if(isCel)renderLoadout(beardTarget,recipe,0,null,camera);
            else if(!paintRoomAvatar(beardTarget,recipe,camera,0,null,'body'))
              throw Error('Beard actor unavailable: '+face+' / '+angle);
            const x=118+k*300+j*149;
            bc.drawImage(beardTarget,x,y,144,163);
          }
          bc.font='13px system-ui';
          bc.fillText('3D',118+k*300,y+180);
          bc.fillText('2D',118+k*300+149,y+180);
        }
      }
      // Explicit beard/lip contact sheet: wide grin and raised smirk must
      // remain readable through the jaw mask at each viewing direction.
      const beardMouth=makeCanvas(1100,590),bmc=beardMouth.getContext('2d');
      bmc.fillStyle='#f7efdf';bmc.fillRect(0,0,1100,590);
      bmc.fillStyle='#34283d';bmc.font='bold 21px system-ui';
      bmc.fillText('Beard + smile / grin / smirk · 3D and layered cel',18,30);
      const lipMoods=['smile','grin','smirk'],angles=[0,45,90];
      for(const [i,mood] of lipMoods.entries()){
        const y=62+i*172; bmc.font='bold 16px system-ui';
        bmc.fillText(mood.toUpperCase(),7,y+65);
        for(const [k,angle] of angles.entries()){
          const recipe={...SHOWROOM_LOOKS.mechanic,beard:'beard',
            hat:'none',glasses:'none',face:'square',expression:mood};
          const h=figureAt(recipe,angle);
          for(const [j,isCel] of [false,true].entries()){
            const cam=isCel?{angle,crop:{x:h.head.x,
              y:h.head.y+41*h.design.scale,size:175}}:
              {angle,zoom:2.3,y:166};
            if(isCel)renderLoadout(beardTarget,recipe,0,null,cam);
            else if(!paintRoomAvatar(beardTarget,recipe,cam,0,null,'body'))
              throw Error('Bearded mouth view missing '+mood+'/'+angle);
            bmc.drawImage(beardTarget,112+k*320+j*157,y,148,148);
          }
          bmc.font='12px system-ui';
          bmc.fillText('3D / 2D',112+k*320,y+164);
        }
      }
      const expressionQA={three:fingerprints.three.size,cel:fingerprints.cel.size,duplicates};
      for(const canvas of [tile,shadows,portrait,faceTile,beardTarget,turnTile])releaseStudioView(canvas);
      return {images:[sheet,comparison,close,expressions,small,beardSheet,beardMouth,turning].map(node=>node.toDataURL('image/png').split(',')[1]),expressionQA};
    }""")
    for name, data in zip(['avatar-workshop-turnaround.png','avatar-workshop-rendering-comparison.png',
                           'avatar-workshop-face-angles.png','avatar-workshop-expression-model-sheet.png',
                           'avatar-workshop-mouth-legibility.png','avatar-workshop-beard-masks.png',
                           'avatar-workshop-beard-mouth-compatibility.png',
                           'avatar-workshop-turn-direction.png'], sheets['images']):
        (REPORTS/name).write_bytes(base64.b64decode(data))
    assert sheets['expressionQA']['three'] == 8 and sheets['expressionQA']['cel'] == 8, sheets['expressionQA']
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
    beards = await page.evaluate("""async () => {
      const {paintRoomAvatar,releaseStudioView}=await import('/avatar-dressing-room.mjs?v=workshop1');
      const {SHOWROOM_LOOKS}=await import('/avatar-showroom-presets.mjs?v=workshop1');
      const portrait=Object.assign(document.createElement('canvas'),{width:200,height:200});
      const sheet=Object.assign(document.createElement('canvas'),{width:600,height:200});
      const ctx=sheet.getContext('2d');
      const jaw=[];
      for(const [index,hair] of ['brown','auburn','silver'].entries()){
        const recipe={...SHOWROOM_LOOKS.mechanic,hat:'none',hair};
        if(!paintRoomAvatar(portrait,recipe,{angle:0},0,null,'portrait')||portrait.dataset.backend!=='canvas')
          throw Error('Portrait did not use the software renderer');
        // This point sits inside the synthetic actor's jaw mask, below the lips.
        jaw.push([...portrait.getContext('2d').getImageData(100,139,1,1).data].slice(0,3));
        ctx.drawImage(portrait,index*200,0);
      }
      releaseStudioView(portrait);
      return {jaw,art:sheet.toDataURL('image/png').split(',')[1]};
    }""")
    brown, auburn, silver = beards['jaw']
    assert brown[0] > brown[1] > brown[2] and auburn[0] > brown[0] + 25, beards['jaw']
    assert silver[2] > silver[0] and silver[0] > auburn[0], beards['jaw']
    (REPORTS/'avatar-workshop-software-beards.png').write_bytes(base64.b64decode(beards['art']))
    await browser.close()
    print('Canvas fallback preserves the visual interaction and painted beard colors PASS')


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
