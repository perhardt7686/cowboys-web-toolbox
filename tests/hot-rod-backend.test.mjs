import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {makeHotRodHandler} from '../supabase/functions/hot-rod/handler.mjs';
import {CARS} from '../docs/hot-rod-catalog.mjs';
import {applyWorkshop,newCampaign} from '../docs/hot-rod-campaign.mjs';
import {INPUT,createRace,recordInput,stepRace,courseCurve} from '../docs/hot-rod-racing.mjs';

const migration = new URL('../supabase/migrations/20261114194518_hot_rod_classic_1963.sql', import.meta.url);
const origin = 'http://localhost';
const raceCommand = (kind, data) => ({type:kind, ...data, operation:crypto.randomUUID()});

function drive(contract, lag = 0) {
  const race = createRace(contract);
  const {player} = race;
  const {automatic, ratios, redline} = contract.player;
  const inputs = [];
  while (!race.result) {
    let mask = 0;
    if (race.tick + 1 >= race.greenAt + lag) {
      const curve = contract.kind === 'road' ? courseCurve(player.distance, contract.seed) : 0;
      const upcoming = contract.kind === 'road' ? courseCurve(player.distance + 25, contract.seed) : 0;
      const correction = curve * player.speed / 27 - player.offset * 1.2;
      const steer = correction > 0.46 ? INPUT.right : correction < -0.46 ? INPUT.left : 0;
      const cap = 47 - Math.max(Math.abs(curve), Math.abs(upcoming)) * 19;
      const pedal = player.speed > cap + 1 ? INPUT.brake : player.speed < cap ? INPUT.gas : 0;
      mask = steer | pedal;
      if (!automatic && (!player.gear || (player.shiftTime === 0 && player.gear < ratios.length && player.engine > redline * 0.83))) {
        mask = steer | INPUT.up;
      }
      if (!automatic && player.shiftTime === 0 && player.gear > 1 && player.engine < redline * 0.32) {
        mask = steer | INPUT.down | INPUT.clutch;
      }
    }
    recordInput(inputs,mask);
    stepRace(race,mask);
  }
  return {inputs, result:race.result, ticks:race.tick};
}

test('Hot Rod verifies private campaign and family racing updates through the database and Edge handler', async t => {
  const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema community_private;
    create function auth.uid() returns uuid language sql as $$
      select nullif(current_setting('test.uid',true),'')::uuid
    $$;
    create table public.community_members(user_id uuid primary key, display_name text, status text);
    create table public.community_profiles(
      user_id uuid primary key, avatar_mode text, avatar_path text, avatar_icon text,
      account_active boolean, published boolean
    );
    create table public.community_family_revisions(
      topic text primary key, revision integer default 0, changed_at timestamptz
    );
    insert into public.community_family_revisions(topic) values ('scores');
    grant usage on schema public,auth to anon,authenticated,service_role;`);
  await pg.exec(await readFile(migration,'utf8'));

  const named = {alpha:'approved',bravo:'approved',charlie:'approved',pending:'pending',suspended:'suspended',outsider:null};
  const ids = Object.fromEntries(Object.keys(named).map(name => [name,crypto.randomUUID()]));
  for (const [name,status] of Object.entries(named)) {
    if (status) await pg.query('insert into public.community_members values($1,$2,$3)',[ids[name],name,status]);
  }
  await pg.query(`insert into public.community_profiles values($1,'photo','test-private-photo',null,true,false)`, [ids.bravo]);
  let clock = Date.now();
  const auth = async name => ({data:{user:ids[name] ? {id:ids[name]} : null}});
  const rpc = async (name,args) => {
    await pg.exec('set role service_role');
    try {
      const fields = Object.keys(args).map((key,i) => key+' => $'+(i+1)).join(',');
      const {rows} = await pg.query('select public.'+name+'('+fields+') as data',Object.values(args));
      return {data:rows[0].data};
    } catch (error) { return {error}; }
    finally { await pg.exec('reset role'); }
  };
  const handle = makeHotRodHandler({auth,rpc,origins:[origin],now:()=>clock,seed:()=>3});
  const request = async (member,body,status = 200) => {
    const headers = {'Content-Type':'application/json',Origin:origin};
    if (member) headers.Authorization = 'Bearer '+member;
    const res = await handle(new Request(origin+'/hot-rod',{
      method:'POST',headers,body:JSON.stringify(body)
    }));
    const data = await res.json();
    assert.equal(res.status,status,JSON.stringify(data));
    return data;
  };
  const revision = async () => (await pg.query("select revision from public.community_family_revisions where topic='scores'")).rows[0].revision;
  const standings = async member => {
    await pg.query("select set_config('test.uid',$1,false)",[ids[member]]);
    await pg.exec('set role authenticated');
    try { return (await pg.query('select public.community_hot_rod_standings() as result')).rows[0].result; }
    finally { await pg.exec('reset role'); }
  };

  await t.test('approved family sees only approved member displays and public-facing garage fields', async () => {
    await request(null,{type:'crew'},401);
    for (const member of ['pending','suspended','outsider']) {
      await request(member,{type:'crew'},403);
      await assert.rejects(standings(member), error => error.code === '42501');
    }
    for (const member of ['alpha','bravo']) {
      const started = await request(member,raceCommand('new',{revision:0}));
      await request(member,raceCommand('buy-car',{revision:started.revision,id:'mystery66',offer:0}),422);
      await request(member,raceCommand('buy-part',{revision:started.revision,id:'motor-mystery66'}),422);
      const buy = raceCommand('buy-car',{revision:started.revision,id:'ford32',offer:325});
      const bought = await request(member,buy);
      assert.equal(bought.state.cash,425);
      assert.equal((await request(member,buy)).revision,bought.revision);
      await request(member,raceCommand('buy-car',{revision:0,id:'ford32',offer:325}),409);
    }
    const crew = await request('alpha',{type:'crew'});
    assert.equal(crew.members.length,3);
    const bravo = crew.members.find(member => member.id === ids.bravo);
    assert.equal(bravo.avatar_path,undefined);
    assert.equal(bravo.campaign,undefined);
    assert.equal(bravo.garage.selected,1);
    assert.equal(bravo.garage.cars[0].model,'ford32');
    assert.deepEqual(Object.keys(bravo.garage.cars[0]).sort(),
      ['color','condition','decal','front','gearbox','hp','model','number','rear','roof']);
    await pg.exec('set role authenticated');
    try {
      await assert.rejects(pg.query('select public.community_hot_rod_crew($1)',[ids.alpha]), error => error.code === '42501');
      await assert.rejects(pg.query('select * from community_private.hot_rod_duel'), error => error.code === '42501');
      await assert.rejects(pg.query('select public.community_hot_rod_read($1)',[ids.bravo]), error => error.code === '42501');
    } finally { await pg.exec('reset role'); }
  });

  await t.test('each family driver has one authenticated replay on a shared course and a verified result', async () => {
    const invite = raceCommand('invite',{memberId:ids.bravo,kind:'drag'});
    await request('alpha',{...invite,memberId:ids.alpha},422);
    await request('alpha',{...invite,memberId:ids.pending},403);
    const {challenge} = await request('alpha',invite);
    const challengeId = challenge.id;
    assert.equal((await request('alpha',invite)).challenge.id,challengeId);
    const reverse = await request('bravo',raceCommand('invite',{memberId:ids.alpha,kind:'drag'}));
    assert.equal(reverse.challenge.id,challengeId);
    assert.deepEqual((await request('charlie',{type:'crew'})).challenges,[]);
    await request('charlie',{type:'duel-start',challengeId},403);
    await request('alpha',{type:'duel-start',challengeId},422);
    await request('alpha',{type:'respond',challengeId,accept:true},403);
    const responded = await request('bravo',{type:'respond',challengeId,accept:true});
    assert.equal(responded.challenge.status,'accepted');

    const first = (await request('alpha',{type:'duel-start',challengeId})).race;
    const second = (await request('bravo',{type:'duel-start',challengeId})).race;
    assert.equal(first.seed,second.seed);
    assert.equal(first.kind,second.kind);
    assert.equal(first.timeTrial,true);
    assert.equal((await request('alpha',{type:'duel-start',challengeId})).race.id,first.id);
    const a = drive(first), b = drive(second,15);
    assert.equal(a.result.outcome,'finish');
    assert.equal(b.result.outcome,'finish');
    assert.ok(a.result.ms < b.result.ms);
    const finish = (race, inputs) => ({type:'duel-finish',challengeId,raceId:race.id,inputs});
    const before = await revision();
    await request('alpha',finish(second,a.inputs),422);
    await request('alpha',finish(first,a.inputs),422);
    clock += 150000;
    await request('alpha',finish(first,[[0,3]]),422);
    const waiting = (await request('alpha',finish(first,a.inputs))).challenge;
    assert.equal(waiting.status,'accepted');
    assert.equal(waiting.winner,null);
    assert.equal(waiting.finished,true);
    assert.equal(await revision(),before);
    const completed = (await request('bravo',finish(second,b.inputs))).challenge;
    assert.equal(completed.status,'completed');
    assert.equal(completed.winner,ids.alpha);
    assert.equal(completed.isTie,false);
    assert.equal((await request('bravo',finish(second,b.inputs))).challenge.status,'completed');
    assert.equal(await revision(),before+1);
    assert.equal((await request('alpha',{type:'load'})).state.cash,425);
    assert.equal((await request('alpha',{type:'load'})).state.wins,0);
    const table = await standings('alpha');
    assert.equal(table.entries[0].score,20);
    assert.equal(table.entries[0].duel_wins,1);
    assert.equal(table.entries[0].achievements,1);
    assert.equal(table.entries[1].duel_wins,0);
  });

  await t.test('identical clean times tie, declines stay closed and forfeits cannot become a win', async () => {
    const invite = async kind => (await request('alpha',raceCommand('invite',{memberId:ids.bravo,kind}))).challenge.id;
    const start = async (member,challengeId) => (await request(member,{type:'duel-start',challengeId})).race;
    const respond = async (challengeId,accept) => (await request('bravo',{type:'respond',challengeId,accept})).challenge;
    const forfeit = async (member,challengeId,race) =>
      (await request(member,{type:'duel-forfeit',challengeId,raceId:race.id})).challenge;
    const declined = await invite('road');
    assert.equal((await respond(declined,false)).status,'declined');
    await request('alpha',{type:'duel-start',challengeId:declined},422);

    const tied = await invite('drag');
    await respond(tied,true);
    const first = await start('alpha',tied), second = await start('bravo',tied);
    const clean = drive(first);
    clock += clean.ticks*50+100;
    const finish = async (member,race) =>
      (await request(member,{type:'duel-finish',challengeId:tied,raceId:race.id,inputs:clean.inputs})).challenge;
    await finish('alpha',first);
    const equal = await finish('bravo',second);
    assert.equal(equal.isTie,true);
    assert.equal(equal.winner,null);
    assert.equal(equal.status,'completed');

    const retired = await invite('drag');
    await respond(retired,true);
    await forfeit('alpha',retired,await start('alpha',retired));
    const both = await forfeit('bravo',retired,await start('bravo',retired));
    assert.equal(both.status,'completed');
    assert.equal(both.winner,null);
    assert.equal(both.isTie,false);
    const table = await standings('alpha');
    assert.equal(table.entries[0].score,20);
    assert.equal(table.entries[0].duels,3);
    assert.equal(table.entries[0].duel_draws,1);
  });

  await t.test('King and Mystery Machine races settle through server replay on an independent bonus car', async () => {
    let state = applyWorkshop({...newCampaign(),cash:10000},{type:'buy-car',id:'vette63',offer:CARS.vette63.price}).state;
    // Begin at the already-qualified garage to exercise the championship path.
    state = {...state,dragWins:5,roadWins:5,wins:10};
    await pg.query('insert into community_private.hot_rod_campaign(user_id,revision,campaign) values ($1,1,$2)',[ids.charlie,state]);
    const adoptRace = async (rival, stake) => {
      const saved = await request('charlie',{type:'load'});
      return request('charlie',raceCommand('challenge',{kind:'road',rival,stake,revision:saved.revision}));
    };
    await request('charlie',raceCommand('challenge',{kind:'road',rival:'mystery',stake:'kicks',revision:1}),422);
    const win = async (rival,stake) => {
      const saved = await adoptRace(rival,stake);
      const played = drive(saved.state.race);
      assert.equal(played.result.outcome,'win');
      clock += played.ticks*50+100;
      return request('charlie',raceCommand('finish',{
        raceId:saved.state.race.id,inputs:played.inputs,revision:saved.revision
      }));
    };
    const kingdom = (await win('king','pink')).state;
    assert.equal(kingdom.status,'champion');
    assert.equal(kingdom.bonus.unlocked,true);
    assert.equal(kingdom.cars.at(-1).model,'vette63');

    const started = await adoptRace('mystery','kicks');
    const retired = await request('charlie',raceCommand('forfeit',{raceId:started.state.race.id,revision:started.revision}));
    assert.equal(retired.state.bonus.attempts,1);
    assert.equal(retired.state.bonus.won,false);
    const victory = (await win('mystery','kicks')).state;
    assert.equal(victory.status,'champion');
    assert.equal(victory.bonus.won,true);
    assert.equal(victory.bonus.attempts,2);
    assert.equal(victory.points-kingdom.points,150);
    assert.equal(victory.cash,kingdom.cash);
    assert.deepEqual(victory.cars,kingdom.cars);
    const table = await standings('charlie');
    assert.equal(table.entries[0].crowns,1);
    assert.equal(table.entries[0].mystery_wins,1);
    assert.equal(table.entries[0].wins,1);
    assert.equal(table.entries[0].losses,0);
  });
});
