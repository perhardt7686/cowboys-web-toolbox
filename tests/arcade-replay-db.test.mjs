import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {test} from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {replayDash} from '../docs/dash-physics.mjs';
import {replaySky,buildSkyCourse,createSkyRide,stepSky} from '../docs/skyboard-physics.mjs';

const author='11111111-1111-4111-9111-111111111111',solver='22222222-2222-4222-9222-222222222222',
  pending='33333333-3333-4333-9333-333333333333';
const root=new URL('../supabase/migrations/',import.meta.url);

test('real PostgreSQL roles preserve old rows, verify exact drafts and privately share opt-in ghosts',async()=>{
  const db=new PGlite();
  const query=async(sql,params=[])=>await db.query(sql,params);
  const one=async(sql,params=[])=>Object.values((await query(sql,params)).rows[0])[0];
  async function role(next,id,work){
    await query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);
    await db.exec('set role '+next);
    try{return await work();}finally{await db.exec('reset role');}
  }
  function member(id,work){return role('authenticated',id,work);}
  function service(work){return role('service_role',null,work);}
  try{
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable
        as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create table public.community_members(user_id uuid primary key,status text,display_name text);
      grant usage on schema auth to authenticated;
    `);
    const names=readdirSync(root).filter(name=>name.startsWith('2026111505')&&name.includes('dash_forge'));
    const baseline=[...names,'20261115162000_emma_skyboard_sprint.sql'];
    for(const file of baseline)await db.exec(readFileSync(new URL(file,root),'utf8'));
    for(const [id,status,name] of [[author,'approved','QA Author'],[solver,'approved','QA Solver'],[pending,'pending','QA Pending']]){
      await query('insert into auth.users values ($1)',[id]);
      await query('insert into community_members values ($1,$2,$3)',[id,status,name]);
    }
    const empty='.'.repeat(24);
    const oldDraft=await member(author,()=>one('select community_dash_save_world($1,$2,2,null,$3,$4)',['Saved old draft',empty,'Maker Studio','none']));
    const oldRun=await member(author,()=>one('select community_dash_start($1)',[oldDraft.id]));
    await query("update community_dash_runs set started_at=now()-interval '6 seconds' where id=$1",[oldRun.run_id]);
    const oldSky=await member(author,()=>one("select community_boardride_start('sunny')"));
    await query("update community_boardride_runs set started_at=now()-interval '12 seconds' where id=$1",[oldSky.run_id]);
    const migration=readdirSync(root).find(file=>file.endsWith('_family_arcade_verified_physics.sql'));
    await db.exec(readFileSync(new URL(migration,root),'utf8'));
    assert.ok((await member(author,()=>one("select community_dash_finish($1,'[]')",[oldRun.run_id]))).won);
    assert.ok((await member(author,()=>one('select community_boardride_finish($1,9000,0)',[oldSky.run_id]))).saved);
    for(const start of [
      "select community_boardride_start_v2('sunny',false)",
      'select community_dash_start_v2(1)',
      'select community_dash_state()'
    ])await assert.rejects(member(pending,()=>one(start)),/approved/i);
    await assert.rejects(role('anon',null,()=>one('select community_dash_start_v2(1)')),/permission denied/);
    const create=(layout,pattern=empty,id=null)=>member(author,()=>one(
      'select community_dash_save_layout($1,$2,2,$3,$4,$5,$6)',
      ['Verifier training',pattern,id,'Maker Studio','none',JSON.stringify(layout)]
    ));
    const pattern='....K.......E...........';
    await assert.rejects(create([[4,2,3,1,0]],pattern),/cannot use/);
    const draft=await create([[6,0,2,0,1]],pattern);
    const open=id=>member(id,()=>one('select community_dash_start_v2($1)',[draft.id]));
    let run=await open(author);
    assert.equal(run.pattern,pattern);assert.deepEqual(run.layout,[[6,0,2,0,1]]);
    await assert.rejects(member(author,()=>one("select community_dash_finish($1,'[]')",[run.run_id])),/matching replay verifier/);
    await assert.rejects(member(author,()=>one("select community_dash_commit_v2($1,$2,'[]','{}')",[author,run.run_id])),/permission denied/);
    await assert.rejects(service(()=>one("select community_arcade_replay_input($1,'dash',$2)",[solver,run.run_id])),/fresh run/);
    await assert.rejects(member(author,()=>one('select community_dash_publish($1)',[draft.id])),/exact draft/);
    async function verifyDash(user,active){
      const stored=await service(()=>one("select community_arcade_replay_input($1,'dash',$2)",[user,active.run_id]));
      const verified=replayDash(stored.pattern,stored.rules.pace,stored.rules,[]);
      assert.ok(verified.won);
      await query("update community_dash_runs set started_at=now()-interval '10 seconds' where id=$1",[active.run_id]);
      return service(()=>one("select community_dash_commit_v2($1,$2,'[]',$3)",[user,active.run_id,JSON.stringify(verified)]));
    }
    assert.ok((await verifyDash(author,run)).won);
    await create([[6,0,2,0,2]],pattern,draft.id);
    await assert.rejects(member(author,()=>one('select community_dash_publish($1)',[draft.id])),/exact draft/);
    run=await open(author);assert.ok((await verifyDash(author,run)).won);
    assert.equal((await member(author,()=>one('select community_dash_publish($1)',[draft.id]))).status,'published');
    assert.equal(await one('select count(*)::int from community_dash_awards where level_id=$1',[draft.id]),0);
    const solved=await open(solver);
    assert.ok((await verifyDash(solver,solved)).won);
    await assert.rejects(verifyDash(solver,solved),/fresh run/);
    assert.equal(await one("select count(*)::int from community_dash_awards where user_id=$1 and level_id=$2 and award_type='designer'",[author,draft.id]),1);
    assert.equal(await one("select count(*)::int from community_dash_awards where user_id=$1 and level_id=$2 and award_type='player'",[solver,draft.id]),1);

    // The first approved member clears the same seeded track for a private and then an opt-in replay.
    async function openSky(id,share){return member(id,()=>one("select community_boardride_start_v2('sunny',$1)",[share]));}
    async function verifySky(id,active){
      const input=await service(()=>one("select community_arcade_replay_input($1,'skyboard',$2)",[id,active.run_id]));
      const trace=[];
      if(input.edition===2){
        const ride=createSkyRide(buildSkyCourse(input.stage,input.seed,input.edition),input.board);
        while(!ride.done){
          const gap=ride.course.things.find(o=>o.kind==='gap'&&o.z+o.span*.5>ride.progress);
          const edge=gap?gap.z-gap.span*.5-ride.progress:Infinity;
          const target=ride.speed>30?Math.min(9,ride.speed*.12):3.8;
          const mask=ride.grounded&&edge>0&&edge<target&&!(ride.mask&4)?4:0;
          if(ride.mask!==mask)trace.push([ride.tick,mask]);
          stepSky(ride,mask);
        }
      }
      const result=replaySky(input.stage,input.seed,input.board,trace,{sample:input.sample,edition:input.edition});
      assert.ok(result.won);
      await query("update community_boardride_runs set started_at=now()-interval '32 seconds' where id=$1",[active.run_id]);
      return service(()=>one('select community_boardride_commit_v2($1,$2,$3)',[id,active.run_id,JSON.stringify(result)]));
    }
    const privateRun=await openSky(solver,false);
    await assert.rejects(member(solver,()=>one('select community_boardride_finish($1,9000,80)',[privateRun.run_id])),/not owned/);
    assert.ok((await verifySky(solver,privateRun)).saved);
    assert.equal(await one('select replay_frames from community_boardride_runs where id=$1',[privateRun.run_id]),null);
    const authorSky=await openSky(author,true);
    assert.equal(authorSky.stage,2);
    const earned=await verifySky(author,authorSky);
    assert.ok(earned.new_badges.includes('ball-survivor'));
    assert.ok(earned.new_badges.includes('boost-master'));
    const match=await openSky(solver,false);
    assert.equal(match.seed,authorSky.seed);
    assert.equal(match.ghost.name,'QA Author');
    assert.ok(match.ghost.frames.length>30);
    assert.deepEqual(Object.keys(match.ghost).sort(),['board','frames','name','time_ms']);
    await member(author,()=>one('select community_boardride_unshare_replays()'));
    assert.equal((await openSky(solver,false)).ghost,null);
    assert.equal(await one('select count(*)::int from community_boardride_runs where status=$1',['finished']),3);

    // Upgrade while both games have open edition-one replays.
    const previousDash=await open(author),previousSky=await openSky(solver,false);
    const expansion=readdirSync(root).find(file=>file.endsWith('_family_arcade_course_expansion.sql'));
    await db.exec(readFileSync(new URL(expansion,root),'utf8'));
    assert.ok((await verifyDash(author,previousDash)).won);
    assert.ok((await verifySky(solver,previousSky)).saved);
    assert.equal(await one('select soundtrack from community_dash_levels where id=$1',[draft.id]),'pulse');

    const createLayers=(layout,song='circuit',id=null)=>member(author,()=>one(
      'select community_dash_save_v3($1,$2,2,$3,$4,$5,$6,$7)',
      ['Three layer course','....A...N...............',id,'Maker Studio','none',JSON.stringify(layout),song]
    ));
    const layered=[[12,0,2,0,1,'s','Q']];
    await assert.rejects(createLayers(layered,'unknown'),/soundtrack/);
    await assert.rejects(createLayers([[12,0,2,0,1,'g','Q']]),/invalid tile transform/i);
    const newDraft=await createLayers(layered);
    await assert.rejects(member(author,()=>one('select community_dash_start_v2($1)',[newDraft.id])),/refresh/i);
    await assert.rejects(member(solver,()=>one('select community_dash_start_v3($1)',[newDraft.id])),/unavailable/i);
    await assert.rejects(member(pending,()=>one("select community_boardride_start_v3('sunny',false)")),/approved/i);
    const v3Dash=()=>member(author,()=>one('select community_dash_start_v3($1)',[newDraft.id]));
    const expandedRun=await v3Dash();
    assert.deepEqual(expandedRun.layout,layered);
    assert.equal(expandedRun.edition,2);
    assert.equal(expandedRun.soundtrack,'circuit');
    const snapshot=await service(()=>one("select community_arcade_replay_input($1,'dash',$2)",[author,expandedRun.run_id]));
    assert.equal(snapshot.rules.edition,expandedRun.edition);
    assert.deepEqual(snapshot.rules.layout,layered);
    assert.ok((await verifyDash(author,expandedRun)).won);
    await createLayers(layered,'tide',newDraft.id);
    await assert.rejects(member(author,()=>one('select community_dash_publish($1)',[newDraft.id])),/exact draft/);
    const updated=await member(author,()=>one('select community_dash_state()'));
    assert.equal(updated.levels.find(level=>level.id===newDraft.id).soundtrack,'tide');
    assert.ok((await verifyDash(author,await v3Dash())).won);
    assert.equal((await member(author,()=>one('select community_dash_publish($1)',[newDraft.id]))).status,'published');

    const v3Sky=(id,share)=>member(id,()=>one("select community_boardride_start_v3('sunny',$1)",[share]));
    const expandedSky=await v3Sky(author,true);
    assert.equal(expandedSky.stage,3);
    assert.equal(expandedSky.edition,2);
    assert.ok((await verifySky(author,expandedSky)).saved);
    assert.equal((await openSky(solver,false)).ghost,null,'Edition-one readers keep their original track');
    const shared=await v3Sky(solver,false);
    assert.equal(shared.ghost.name,'QA Author');
    assert.equal(shared.edition,2);
    const skySnapshot=await service(()=>one("select community_arcade_replay_input($1,'skyboard',$2)",[solver,shared.run_id]));
    assert.equal(skySnapshot.edition,shared.edition);
    await member(author,()=>one('select community_boardride_unshare_replays()'));
    assert.equal((await v3Sky(solver,false)).ghost,null);

  }finally{await db.close();}
});
