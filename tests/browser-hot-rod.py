#!/usr/bin/env python3
"""Browser smoke for the actual Hot Rod launch, canvas, and controls.

An isolated family fixture supplies synthetic identities, records and an RPC
client. The client runs the shipped reducers, stores campaign state across
page loads, and replays browser driving inputs. No live account or API is used.
"""
import asyncio
import re
from pathlib import Path

from playwright.async_api import async_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
URL = 'http://127.0.0.1:8765/__hot_rod_smoke__/community.html'
HTML = """<!doctype html><html lang="en"><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/community.css">
<link rel="stylesheet" href="/purple-night.css">
<link rel="stylesheet" href="/family-board.css">
<link rel="stylesheet" href="/commons-family-fun.css">
<link rel="stylesheet" href="/hot-rod.css">
</head><body class="community-page"><main>
<section id="conversations" class="community-layout container" hidden>
<div id="family-overview" hidden></div>
<div id="family-updates"><div id="community-announcement" hidden></div></div>
<aside class="community-sidebar"></aside>
<div class="community-main">
<div id="family-conversations"><h2>Conversations</h2></div>
<div id="family-tools" hidden></div>
</div></section></main>
<script type="module">
import {createFamilyBoard} from '/family-board.mjs';
import {mountFamilyFun} from '/commons-family-fun.mjs';
import {createHotRodBoard} from '/hot-rod-board.mjs';
import {CARS} from '/hot-rod-catalog.mjs';
import {applyWorkshop, garageShowcase, makeCar, newCampaign, settleRace, startRace} from '/hot-rod-campaign.mjs';
import {replayRace} from '/hot-rod-racing.mjs';

const section = document.getElementById('conversations');
const game = createHotRodBoard();
const board = createFamilyBoard();
mountFamilyFun(null);
const viewer = '00000000-0000-4000-8000-000000000001';
const rival = '00000000-0000-4000-8000-000000000002';
const rivalState = newCampaign();
rivalState.cars = [makeCar(CARS.fairlane55, 1), makeCar(CARS.vette56, 2)];
rivalState.selected = 2;
const key = 'hot-rod-browser-fixture';
let saved = JSON.parse(sessionStorage.getItem(key)) || {state:null, revision:0};
let role = new URL(location).searchParams.get('role') || 'approved';
let failNext = '';
const operations = [];
const challenges = [];
let result = null;

function save(next) {
  saved = {state:next.state, revision:saved.revision + 1};
  sessionStorage.setItem(key, JSON.stringify(saved));
  return {...saved, message:next.message};
}
function answer(data) { return {data:structuredClone(data),error:null}; }
function error(message, status) {
  return {data:null,error:{context:{status,json:async()=>({error:message})}}};
}
const standings = () => ({
  players:saved.state?.races ? 2 : 1, achievements:0,
  entries:[
    {name:'Test driver',score:115,crowns:0,wins:8,losses:1,rank:1,progress:2},
    ...(saved.state?.races ? [{
      name:'Fixture member',mine:true,score:saved.state.points,crowns:0,
      wins:saved.state.wins,losses:saved.state.losses,rank:2,progress:saved.state.wins ? 1 : 0
    }] : [])
  ]
});
async function invoke(name, {body}) {
  if (name !== 'hot-rod') throw Error('Unexpected fixture function');
  if (role !== 'approved') return error('Approved family membership required.',403);
  operations.push(body);
  try {
    if (body.type===failNext) { failNext=''; return error('Synthetic save service interruption.',503); }
    if (body.type==='load') return answer(saved);
    if (body.type==='crew') return answer({
      members:[{id:rival,name:'Test driver',garage:garageShowcase(rivalState)}],
      challenges
    });
    if (body.type==='invite') {
      if (body.memberId!==rival || body.kind!=='road') throw Error('Wrong synthetic challenge.');
      challenges.push({
        id:body.operation,opponent:rival,kind:body.kind,you:viewer,challenged:rival,status:'pending'
      });
      return answer({challenge:challenges.at(-1),message:'Challenge sent.'});
    }
    if (body.revision!==saved.revision) return error('Fixture revision mismatch.',409);
    let next;
    if (body.type==='new') next = {state:newCampaign(),message:'You have $750 and a whole summer.'};
    else if (body.type==='challenge') next = startRace(saved.state,body, {
      id:'00000000-0000-4000-8000-000000000003',seed:17,now:Date.now()
    });
    else if (body.type==='finish') {
      if (body.raceId!==saved.state.race.id) throw Error('Wrong fixture race.');
      result = replayRace(saved.state.race,body.inputs).result;
      next = settleRace(saved.state,result);
    } else if (body.type==='forfeit') next = settleRace(saved.state,{
      outcome:'abandoned',ms:0,fuel:2,wear:0,reaction:0
    });
    else next = applyWorkshop(saved.state,body);
    return answer(save(next));
  } catch (e) { return error(e.message,422); }
}
async function rpc(name) {
  if (role !== 'approved') return {data:null,error:{code:'42501'}};
  if (name==='community_hot_rod_standings') return answer(standings());
  if (name==='community_family_fridge_state') return answer({items:[]});
  if (name==='community_family_calendar_feed') return answer({events:[]});
  if (name==='community_family_scoreboard') return answer({
    as_of:new Date().toISOString(),plate_access:false,quest_level:2,quest_xp:115,
    mahjong_level:4,wordle_today:0,wordle_attempts:0,
    games:{mahjong:{players:1,achievements:1,entries:[{rank:1,name:'Example teammate',score:117}]}}
  });
  throw Error('Unexpected fixture RPC: '+name);
}
const client = {
  functions:{invoke},rpc,
  channel:()=>({on:()=>{},subscribe:fn=>fn('SUBSCRIBED')}),
  removeChannel:async()=>{}
};
window.fixture = {
  ready:true,
  received:()=>operations,
  result:()=>result,
  interrupt:()=>{failNext='bolt';},
  access(status) {
    role=status;
    section.hidden=status!=='approved';
    const member = status==='visitor' ? null : {user_id:viewer,status};
    board.setAccess(client,member);
    game.setAccess(client,member);
  }
};
window.fixture.access(role);
</script></body></html>"""


async def open_game(page):
    await page.locator('#hot-rod-entry').click(timeout=15000)
    game = page.get_by_role('dialog', name='Hot Rod')
    await expect(game).to_be_visible()
    await expect(game.locator('.hot-rod-canvas')).to_have_attribute('width', '320')
    await expect(game.locator('.hot-rod-canvas')).to_have_attribute('height', '200')
    return game


async def scene(game, name):
    await expect(game).to_have_attribute('data-scene', name)


async def fit(page, game, *, driving=False):
    size = await game.evaluate("""(dialog, driving) => {
      const canvas = dialog.querySelector('canvas');
      const grid = canvas.getBoundingClientRect();
      const dlg = dialog.getBoundingClientRect();
      const header = dialog.querySelector('.hot-rod-header').getBoundingClientRect();
      const driver = dialog.querySelector('.hot-rod-driver').getBoundingClientRect();
      const portrait = innerHeight > innerWidth;
      const pads = [...dialog.querySelectorAll('[data-drive]')].map(el => {
        const r = el.getBoundingClientRect();
        return {label:el.textContent,min:r.width,height:r.height,left:r.left,
          right:r.right,top:r.top,bottom:r.bottom};
      });
      return {overflow: dialog.scrollWidth - dialog.clientWidth, width:grid.width, height:grid.height,
        layout:document.documentElement.scrollWidth-innerWidth, dlg:dlg.toJSON(),
        header:header.toJSON(), driver:driver.toJSON(), portrait,
        bounds:grid.toJSON(), pads, driving};
    }""", driving)
    assert size['overflow'] <= 2 and size['layout'] <= 2, size
    assert size['width'] >= 180 and size['height'] >= 112, size
    assert abs(size['width'] / size['height'] - (4 / 3)) <= 0.035, size  # 320x200 DOS pixels displayed at 4:3
    if not driving:  # Garage, engine bay and diner should never crop on short phones.
        assert size['bounds']['top'] >= size['dlg']['top'] - 2, size
        assert size['bounds']['bottom'] <= size['dlg']['bottom'] + 2, size
    if driving and size['portrait']:
        # No empty 170px letterbox strips inside the portrait racing modal.
        # The 4:3 picture follows the fixed header and the two-thumb deck
        # follows the canvas, with no fake stretched DOS pixels.
        assert size['bounds']['top'] - size['header']['bottom'] <= 12, size
        assert size['driver']['top'] - size['bounds']['bottom'] <= 12, size
        assert size['dlg']['height'] <= size['header']['height'] + size['bounds']['height'] + size['driver']['height'] + 16, size
        assert size['dlg']['top'] >= -2 and size['dlg']['bottom'] <= await page.evaluate('innerHeight') + 2, size
    if driving:
        for pad in size['pads']:
            assert pad['min'] >= 43 and pad['height'] >= 44, size
            assert pad['left'] >= size['dlg']['left'] - 2 and pad['right'] <= size['dlg']['right'] + 2, size
            assert pad['top'] >= size['dlg']['top'] - 2 and pad['bottom'] <= size['dlg']['bottom'] + 2, size
    assert await page.evaluate("getComputedStyle(document.documentElement).overflowY") == 'hidden', size


async def finger(locator, name, pointer):
    # Playwright has no cross-browser hold/release API for touch. Dispatch real
    # PointerEvents through the production input handlers and listen at the DOM.
    await locator.evaluate("""(pad, data) => {
      const [name, pointer] = data;
      pad.dispatchEvent(new PointerEvent(name,{bubbles:true,cancelable:true,
        pointerId:pointer,pointerType:'touch',isPrimary:pointer===1,button:0,buttons:name==='pointerdown'?1:0}));
    }""", [name,pointer])


async def access_flow(page):
    await page.goto(URL + '?role=visitor', wait_until='domcontentloaded')
    await page.wait_for_function('window.fixture?.ready')
    await expect(page.locator('#hot-rod-entry')).to_have_count(0)
    await page.evaluate("fixture.access('pending')")
    await expect(page.locator('#hot-rod-entry')).to_have_count(0)
    assert await page.evaluate('fixture.received()') == []
    await page.evaluate("fixture.access('approved')")
    await page.evaluate("history.replaceState(null, '', location.pathname)")
    await expect(page.locator('#hot-rod-entry')).to_be_visible()
    await expect(page.locator('#arcade-family-fun')).to_be_visible()
    assert await page.locator('#arcade-family-fun').evaluate("""node =>
      !!(node.compareDocumentPosition(document.querySelector('#hot-rod-entry')) & Node.DOCUMENT_POSITION_FOLLOWING)
    """)


async def campaign_flow(page, name, *, touch):
    await access_flow(page)
    game = await open_game(page)
    await game.get_by_role('button',name='Start Classic 1963').click()
    await scene(game,'paper')
    await expect(game.locator('.hot-rod-bank')).to_contain_text('$750')
    await expect(game.get_by_role('heading',name='Los Angeles News')).to_be_visible()
    await game.locator('.hot-rod-panel').get_by_role('button',name='Used cars').click()
    await game.locator('.hot-rod-panel').get_by_role('button',name=re.compile('1940 Chevrolet Coupe')).click()
    await expect(game.get_by_role('heading',name='1940 Chevrolet Coupe')).to_be_visible()
    await game.get_by_role('spinbutton',name='Your offer').fill('380')
    await game.get_by_role('button',name='Make offer').click()
    await scene(game,'garage')
    await expect(game.locator('.hot-rod-bank')).to_contain_text('$370')
    await fit(page,game)
    await game.screenshot(path=ROOT / 'reports' / f'hot-rod-{name}-garage.png')

    await game.get_by_role('button',name='Open the hood').click()
    await scene(game,'workbench')
    await expect(game.get_by_role('heading',name=re.compile('Carburetor|Carter',re.I))).to_be_visible()
    await game.screenshot(path=ROOT / 'reports' / f'hot-rod-{name}-engine.png')
    fasteners=game.locator('.hot-rod-fastener')
    await expect(fasteners).to_have_count(4)
    assert await game.locator('.hot-rod-panel').get_by_role('button',name='Loosen bolt 1').count() == 0
    await fasteners.first.click()
    await expect(game.get_by_role('button',name='Remove bolt 1',exact=True)).to_be_visible()
    assert await page.evaluate("fixture.received().filter(call=>call.type==='bolt').length") == 0
    await page.evaluate('fixture.interrupt()')
    await game.locator('.hot-rod-fastener').first.click()
    await expect(game.get_by_role('status')).to_contain_text('Synthetic save service interruption.')
    await game.get_by_role('button',name='Retry save').click()
    await expect(game.get_by_text('1 loose',exact=False)).to_be_visible()
    assert await page.evaluate("""() => {
      const bolts=fixture.received().filter(item=>item.type==='bolt');
      return bolts.length===2 && bolts[0].operation===bolts[1].operation &&
        bolts[1].slot==='carb' && bolts[1].index===0;
    }""")
    await game.get_by_role('button',name='Back to games').click()
    await expect(game).to_be_hidden()
    await expect(page.locator('#hot-rod-entry')).to_be_focused()

    await page.reload(wait_until='domcontentloaded')
    game = await open_game(page)
    await game.get_by_role('button',name='Continue Classic 1963').click()
    await scene(game,'garage')
    await expect(game.locator('.hot-rod-bank')).to_contain_text('$370')
    await game.get_by_role('button',name='Open the hood').click()
    await expect(game.get_by_text('1 loose',exact=False)).to_be_visible()
    await game.get_by_role('button',name='Seat bolt 1',exact=True).click()
    await game.get_by_role('button',name='Tighten bolt 1',exact=True).click()
    await game.get_by_role('button',name='Torque bolt 1',exact=True).click()
    await expect(game.get_by_text('0 loose',exact=False)).to_be_visible()
    # The reference card's number keys operate those same physical bolts.
    await page.keyboard.press('2')
    await expect(game.get_by_role('button',name='Remove bolt 2',exact=True)).to_be_visible()
    await page.keyboard.press('2')
    await expect(game.get_by_text('1 loose',exact=False)).to_be_visible()
    for name in ('Seat bolt 2','Tighten bolt 2','Torque bolt 2'):
        await game.get_by_role('button',name=name,exact=True).click()
    await expect(game.get_by_text('0 loose',exact=False)).to_be_visible()

    work=game.locator('.hot-rod-panel')
    await work.get_by_role('combobox',name='Work area').select_option('engine')
    await expect(work.get_by_text('Remove the carburetor and intake to reach the engine mounts.')).to_be_visible()
    await expect(game.locator('.hot-rod-fastener')).to_have_count(0)
    await work.get_by_role('combobox',name='Work area').select_option('carb')
    for bolt in range(1,5):
        await game.get_by_role('button',name=f'Loosen bolt {bolt}',exact=True).click()
        await game.get_by_role('button',name=f'Remove bolt {bolt}',exact=True).click()
    await expect(work.get_by_role('combobox',name='Work area')).to_have_value('manifold')
    if touch:
        for bolt in range(1,7):
            await game.get_by_role('button',name=f'Loosen bolt {bolt}',exact=True).click()
            await game.get_by_role('button',name=f'Remove bolt {bolt}',exact=True).click()
        await expect(work.get_by_role('combobox',name='Work area')).to_have_value('engine')
        for bolt in range(1,7):
            await game.get_by_role('button',name=f'Loosen bolt {bolt}',exact=True).click()
            await game.get_by_role('button',name=f'Remove bolt {bolt}',exact=True).click()
        await expect(work.get_by_text('Tap the ignition lead to disconnect it.')).to_be_visible()
        await game.get_by_role('button',name='Disconnect ignition lead',exact=True).click()
        await expect(work.get_by_text('Select PARTS on the engine display to fit a compatible spare.')).to_be_visible()
        for slot,length in [('engine',6),('manifold',6)]:
            await work.get_by_role('combobox',name='Work area').select_option(slot)
            await game.get_by_role('button',name='Open parts shelf',exact=True).click()
            await expect(game).to_have_attribute('data-bay-mode','shelf')
            await work.get_by_role('button',name='Change',exact=True).click()
            for bolt in range(1,length+1):
                await game.get_by_role('button',name=f'Tighten bolt {bolt}',exact=True).click()
                await game.get_by_role('button',name=f'Torque bolt {bolt}',exact=True).click()
            if slot=='engine':
                await game.get_by_role('button',name='Connect ignition lead',exact=True).click()
    await game.get_by_role('button',name='Open parts shelf',exact=True).click()
    await expect(work.get_by_role('combobox',name='Work area')).to_have_value('carb')
    await work.get_by_role('button',name='Change',exact=True).click()
    for bolt in range(1,5):
        await game.get_by_role('button',name=f'Tighten bolt {bolt}',exact=True).click()
        await game.get_by_role('button',name=f'Torque bolt {bolt}',exact=True).click()
    await game.get_by_role('button',name='Tune engine',exact=True).click()
    await expect(work.get_by_role('heading',name='Timing belt')).to_be_visible()
    await work.get_by_role('button',name='↓ Advance timing',exact=True).click()
    await work.get_by_role('button',name='Done',exact=True).click()
    await expect(game.get_by_role('status')).to_contain_text('Ignition timing set to 5°.')
    await game.get_by_role('button',name='Close the hood',exact=True).click()
    await scene(game,'garage')
    await game.get_by_role('button',name='Wall calendar').click()
    await scene(game,'calendar')
    await expect(work.get_by_role('heading',name='Summer calendar')).to_be_visible()
    await game.screenshot(path=ROOT / 'reports' / f'hot-rod-{name}-calendar.png')

    await game.get_by_role('navigation',name='Hot Rod rooms').get_by_role('button',name='Family garages').click()
    await game.get_by_role('button',name='Test driver',exact=True).click()
    await expect(game.get_by_role('heading',name='Test driver’s garage')).to_be_visible()
    await expect(game.get_by_text(re.compile('1956 Corvette · .* hp'))).to_be_visible()
    await game.get_by_role('combobox',name='Garage bay').select_option('1')
    await expect(game.get_by_text(re.compile('1955 Ford Fairlane Victoria · .* hp'))).to_be_visible()
    await game.get_by_role('combobox',name='Challenge course').select_option('road')
    await game.get_by_role('button',name='Send challenge').click()
    await expect(game.get_by_text('Status: pending')).to_be_visible()

    await game.get_by_role('navigation',name='Hot Rod rooms').get_by_role('button',name='Garage',exact=True).click()
    await game.locator('.hot-rod-panel').get_by_role('button',name='Hit the street').click()
    await scene(game,'diner')
    await game.get_by_role('button',name='Inspect rival engine',exact=True).click()
    await game.get_by_role('button',name='Done inspecting rival',exact=True).click()
    await game.get_by_role('button',name='Discuss a race with Earl',exact=True).click()
    await game.get_by_role('button',name='Drag race',exact=True).click()
    await game.screenshot(path=ROOT / 'reports' / f'hot-rod-{name}-drive-in.png')
    await game.get_by_role('button',name='For kicks',exact=True).click()
    await scene(game,'race')
    await game.get_by_role('button',name='Stage at the line').click()
    await fit(page,game,driving=True)
    if not touch:
        # Select first at the red light with the throttle released. Catch the
        # first green frame without pausing or taking a screenshot at launch.
        await page.keyboard.press('Space')  # Original DOS selector upshifts with no brake held
        await expect(game.locator('.hot-rod-meters')).to_contain_text('GEAR 1')
    await page.wait_for_function("""() =>
      !document.querySelector('.hot-rod-meters').textContent.includes('WAIT FOR GREEN')
    """, timeout=10000)
    if touch:
        await game.screenshot(path=ROOT / 'reports' / f'hot-rod-{name}-cockpit.png')
        await finger(game.locator('[data-drive="up"]'),'pointerdown',1)
        await finger(game.locator('[data-drive="gas"]'),'pointerdown',2)
        await expect(game.locator('.hot-rod-meters')).to_have_text(re.compile(r'[1-9]\d* MPH.*GEAR 1'))
        await finger(game.locator('[data-drive="gas"]'),'pointerup',2)
        await finger(game.locator('[data-drive="up"]'),'pointerup',1)
        await game.get_by_role('button',name='Pause',exact=True).click()
        await expect(game.get_by_text('Paused. Resume when you’re ready.')).to_be_visible()
        await game.get_by_role('button',name='Resume',exact=True).click()
        await game.get_by_role('button',name='Forfeit race',exact=True).click()
        await game.get_by_role('button',name='Confirm forfeit').click()
        await expect(game.get_by_role('heading',name='Forfeited')).to_be_visible()
    else:
        await page.keyboard.down('ArrowUp')
        for gear in [1,2]:
            await page.wait_for_function(r"""gear => {
              const text=document.querySelector('.hot-rod-meters').textContent;
              const rpm=text.match(/(\d+) RPM/);
              return rpm && Number(rpm[1]) >= 4250 && text.includes('GEAR ' + gear);
            }""", arg=gear, timeout=12000)
            await page.keyboard.up('ArrowUp')
            await page.keyboard.press('e')
            await page.wait_for_function("""gear =>
              document.querySelector('.hot-rod-meters').textContent.includes('GEAR ' + gear)
            """, arg=gear+1, timeout=4500)
            await page.keyboard.down('ArrowUp')
        await expect(game.get_by_role('heading',name='Victory')).to_be_visible(timeout=23000)
        await page.keyboard.up('ArrowUp')
        assert await page.evaluate("fixture.result()?.outcome") == 'win'
        await game.locator('.hot-rod-canvas').screenshot(path=ROOT / 'reports' / f'hot-rod-{name}-cockpit.png')
    await game.get_by_role('button',name='Continue',exact=True).click()
    await scene(game,'garage')
    await game.get_by_role('navigation',name='Hot Rod rooms').get_by_role('button',name='Hall of Fame').click()
    await expect(game.get_by_text('Test driver',exact=True)).to_be_visible()
    if not touch:
        await expect(game.get_by_text('First drag win',exact=True)).to_be_visible()

    await game.get_by_role('button',name='Back to games').click()
    # The single top FAMILY FUN marquee replaces the retired second scoreboard.
    # Detailed win/loss records remain available inside Hot Rod Hall of Fame.
    await page.get_by_role('combobox',name='Choose game to view family scores').select_option('streetrod')
    family = page.locator('#arcade-family-fun')
    mine = family.locator('.family-fun-podium .family-fun-row').filter(has_text='Fixture member (you)')
    await expect(mine).to_contain_text('Fixture member (you)')
    await expect(family).to_contain_text('Server verified')
    if not touch:
        await expect(mine).to_contain_text('13 career points')
    game = await open_game(page)
    await page.evaluate("fixture.access('suspended')")
    await expect(game).to_have_count(0)
    await expect(page.locator('#hot-rod-entry')).to_have_count(0)
    await expect(page.get_by_text('Test driver',exact=True)).to_have_count(0)


async def main():
    (ROOT / 'reports').mkdir(exist_ok=True)
    async with async_playwright() as p:
        for engine in ['chromium','webkit']:
            browser = await getattr(p,engine).launch(headless=True)
            try:
                for label, viewport, touch in [
                    ('portrait',{'width':390,'height':844},True),
                    ('landscape',{'width':844,'height':390},False)
                ]:
                    page = await browser.new_page(viewport=viewport,has_touch=touch,reduced_motion='reduce')
                    failures = []
                    page.on('pageerror',lambda error:failures.append(str(error)))
                    await page.route('**/__hot_rod_smoke__/community.html*',
                                     lambda route:route.fulfill(status=200,content_type='text/html',body=HTML))
                    await campaign_flow(page,engine+'-'+label,touch=touch)
                    assert not failures, (engine,label,failures)
                    await page.close()
                    print(f'Hot Rod {engine} {label} passed',flush=True)
            finally:
                await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
