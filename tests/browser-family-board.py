#!/usr/bin/env python3
"""Real CSS and browser interactions with synthetic family members and records."""
import asyncio
from playwright.async_api import async_playwright, expect

URL = 'http://127.0.0.1:8765/__family_test__/community.html'
HTML = """<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/community.css">
<link rel="stylesheet" href="/purple-night.css"><link rel="stylesheet" href="/commons-compact-ui.css">
<link rel="stylesheet" href="/family-board.css"></head>
<body class="community-page"><main>
<section id="conversations" class="community-layout container" hidden>
<div id="family-overview" hidden></div><div id="family-updates"><div id="community-announcement" hidden></div></div>
<aside class="community-sidebar"></aside><div class="community-main"><div id="mahjong-root"><button id="mahjong-toggle">Mahjong</button></div>
<div class="community-heading" id="family-conversations"><h2>Conversations</h2></div>
<div id="family-tools" hidden></div></div></section>
</main><script type="module">
import {createFamilyBoard} from '/family-board.mjs';
const app = createFamilyBoard();
const me = new URL(location).searchParams.get('id') || 'First member';
const today = new Date().toISOString();
let rows = [], events = [], sequential = 0, pendingError = false, handler;
const sync = new BroadcastChannel('fixture-family');
const rpc = async (name, values) => {
  if(name==='community_family_scoreboard') {
    return {data:{as_of:today, plate_access:false, mahjong_level:4, quest_level:2, quest_xp:147,
      wordle_today:12,wordle_attempts:4,games:{mahjong:{players:4,achievements:3,entries:[
        {rank:1, name:'First member', score:500, mine:me==='First member'},
        {rank:2, name:'Fixture teammate', score:400},
        {rank:3, name:'Fixture teammate two', score:300},
        {rank:4, name:'Second member', score:200, mine:me==='Second member'}
      ]}}}};
  }
  if(name==='community_family_fridge_state') return {data:{items:structuredClone(rows)}};
  if(name==='community_family_fridge_update'){
    if(pendingError){pendingError=false;return {error:{code:'TEST'}};}
    if(values.p_action==='add') rows.push({id:++sequential,category:values.p_category,name:values.p_name,
      quantity:values.p_quantity,notes:values.p_notes,done:false,updated_at:today});
    if(values.p_action==='check') rows.find(x=>x.id===values.p_id).done=values.p_done;
    sync.postMessage(rows); return {data:{items:structuredClone(rows)}};
  }
  if(name==='community_family_calendar_feed') return {data:{events,last_synced:today}};
  if(name==='community_family_calendar_change'){
    const value=values.p_event;
    if(values.p_action==='add')events.push({id:values.p_id,title:value.title,start:value.start+'-05:00',end:value.end+'-05:00',
      description:value.description,location:value.location,category:value.category,source:'board',editable:true,updated_at:today});
    if(values.p_action==='remove')events=events.filter(x=>x.id!==values.p_id);
    return {data:{id:values.p_id}};
  }
  throw Error('Unexpected fixture call');
};
const client={
  rpc,
  channel:()=>({on:(type,event,callback)=>{handler=callback;},subscribe:callback=>callback('SUBSCRIBED')}),
  removeChannel:async()=>{}
};
sync.onmessage=event=>{rows=event.data;handler?.({payload:{topic:'fridge'}});};
window.fixtureReject=()=>{pendingError=true;};
window.fixtureLogout=()=>{document.querySelector('#conversations').hidden=true;app.setAccess(null,null);};
if(me!=='Visitor'){document.querySelector('#conversations').hidden=false;app.setAccess(client,{user_id:me,status:'approved'});}
</script></body></html>"""


async def layout(page, width):
    await page.goto(URL, wait_until='load')
    await expect(page.get_by_text('Live updates connected', exact=False)).to_be_visible()
    await expect(page.get_by_role('heading', name='Family Scoreboard')).to_be_visible()
    assert await page.locator('#family-games').evaluate(
        "el=>Boolean(el.compareDocumentPosition(document.getElementById('mahjong-toggle')) & Node.DOCUMENT_POSITION_FOLLOWING)"
    )
    await page.get_by_role('combobox', name='Standings by game').select_option('mahjong')
    await expect(page.get_by_text('First member (you)')).to_be_visible()
    await page.get_by_role('button', name='View All Standings').click()
    await expect(page.get_by_text('Second member', exact=True)).to_be_visible()
    await page.get_by_role('button', name='Close', exact=True).click()
    await page.get_by_role('link', name='Calendar', exact=True).click()
    await expect(page.get_by_text('Eastern time · 24-hour clock')).to_be_visible()
    await page.get_by_role('button', name='Week', exact=True).click()
    await expect(page.locator('.family-date-grid button')).to_have_count(7)
    await page.locator('.family-date-grid button').first.click()
    await expect(page.locator('.family-date-grid button').first).to_have_attribute('aria-pressed', 'true')
    await page.get_by_role('button', name='Today', exact=True).click()
    await page.get_by_role('button', name='Month', exact=True).click()
    await expect(page.locator('.family-date-grid button[aria-current=date]')).to_have_attribute('aria-pressed', 'true')
    overflow = await page.evaluate('document.documentElement.scrollWidth - innerWidth')
    assert overflow <= 2, (width, overflow)


async def shared_flow(first, second):
    for page in [first, second]:
        await page.get_by_role('link', name='Fridge', exact=True).click()
        await expect(page.get_by_role('button', name='Add an item')).to_be_enabled()
    await first.get_by_role('button', name='Add an item').click()
    await first.get_by_label('Item', exact=True).fill('Fixture milk')
    await first.get_by_label('Quantity', exact=True).fill('2')
    await first.get_by_label('Notes', exact=True).fill('Oat')
    await first.get_by_role('button', name='Add to fridge').click()
    await expect(second.get_by_text('Fixture milk · 2')).to_be_visible()
    await second.get_by_role('checkbox', name='Fixture milk · 2').check()
    await expect(first.get_by_role('checkbox', name='Fixture milk · 2')).to_be_checked()
    await first.evaluate('fixtureReject()')
    await first.get_by_role('checkbox', name='Fixture milk · 2').click()
    await expect(first.get_by_text('Your previous list was restored', exact=False)).to_be_visible()
    await expect(first.get_by_role('checkbox', name='Fixture milk · 2')).to_be_checked()
    await first.get_by_role('button', name='Add event', exact=True).click()
    await first.get_by_label('Event title').fill('Fixture birthday')
    await first.get_by_label('Location', exact=True).fill('Fixture place')
    await first.get_by_role('button', name='Add to calendar').click()
    await expect(first.get_by_text('Event saved.', exact=True)).to_be_visible()
    await first.get_by_text('Fixture birthday', exact=True).click()
    await expect(first.get_by_text('Fixture place')).to_be_visible()
    await first.evaluate('fixtureLogout()')
    await expect(first.get_by_text('Fixture milk', exact=False)).to_have_count(0)
    await expect(first.get_by_text('Fixture place', exact=True)).to_have_count(0)


async def run(browser, widths):
    for width in widths:
        context = await browser.new_context(viewport={'width': width, 'height': 850}, has_touch=width < 768)
        await context.route(URL + '*', lambda route: route.fulfill(status=200, content_type='text/html', body=HTML))
        first = await context.new_page()
        await layout(first, width)
        if width == 390:
            second = await context.new_page()
            await second.goto(URL + '?id=Second%20member', wait_until='load')
            await second.get_by_role('combobox', name='Standings by game').select_option('mahjong')
            await expect(second.get_by_text('Second member (you)')).to_be_visible()
            await shared_flow(first, second)
            await second.goto(URL + '?id=Visitor', wait_until='load')
            await expect(second.get_by_role('heading', name='Family Scoreboard')).to_have_count(0)
        await context.close()
        print(f'{browser.browser_type.name} family board layout and controls passed at {width}px')


async def main():
    async with async_playwright() as p:
        chromium = await p.chromium.launch(headless=True)
        try:
            await run(chromium, [320, 375, 390, 430, 768, 1280])
        finally:
            await chromium.close()
        webkit = await p.webkit.launch(headless=True)
        try:
            await run(webkit, [390])
        finally:
            await webkit.close()


if __name__ == '__main__':
    asyncio.run(main())
