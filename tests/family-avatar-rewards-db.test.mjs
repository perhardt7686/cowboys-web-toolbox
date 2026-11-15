import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {installUpgradeSchema} from './helpers/community-db.mjs';
import {CATALOG,GROUPS,SHOWCASE} from '../docs/avatar-reward-catalog.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {FREE_OPTION_COUNT} from '../docs/family-avatar-builder.mjs';

test('free choices and complete, distinct cosmetic IDs',()=>{
  assert.equal(FREE_OPTION_COUNT,120);
  const counts={hat:50,eyewear:35,hair:41,eyes:30,prop:40,companion:41,background:31,effect:21};
  assert.equal(CATALOG.length,289);
  assert.deepEqual({...Object.fromEntries(Object.entries(Object.groupBy(CATALOG,item=>item.slot))
    .map(([slot,items])=>[slot,items.length]))},counts);
  assert.equal(new Set(CATALOG.map(item=>item.id)).size,CATALOG.length);
  assert.equal(new Set(CATALOG.map(item=>item.achievement_id)).size,Object.values(GROUPS).flat().length);
  for(const id of SHOWCASE)assert.ok(CATALOG.some(item=>item.id===id));
});

test('approved family avatars derive rewards and restrict persistence and sharing',async t=>{
  const pg=new PGlite();
  t.after(()=>pg.close());
  const ids=['member','other','pending','suspended','none'].map((_,i)=>'00000000-0000-4000-8000-00000000000'+(i+1));
  const [member,other,pending,suspended,outsider]=ids;
  const switchRole=async(id,role='authenticated')=>{
    await pg.exec('reset role');
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);
    if(role!=='system')await pg.exec('set role '+role);
  };
  const sql=(query,parameters)=>pg.query(query,parameters);
  const result=async(query,params)=> (await sql(query,params)).rows[0].value;
  const state=()=>result('select public.community_avatar_reward_state() as value');
  const equip=(recipe,expected=0,fallback=null)=>result('select public.community_avatar_equip($1,null,$2,$3) as value',[recipe,expected,fallback]);
  const outfit=(name,recipe)=>result('select public.community_avatar_save_outfit(1,$1,$2) as value',[name,recipe]);
  const petState=()=>result('select public.community_avatar_pet_state() as value');
  const petAction=(id,action,revision=null,name=null)=>result(
    'select public.community_avatar_pet_action($1,$2,$3,$4) as value',[id,action,revision,name]);
  const show=async(...ids)=>(await sql('select * from public.community_avatar_projections($1::uuid[])',[ids])).rows;
  const refused=(promise,code='42501')=>assert.rejects(promise,error=>error.code===code);
  const get=(state,id)=>state.achievements.find(item=>item.id===id);

  await pg.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$; grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;`);
  for(const id of ids)await sql('insert into auth.users values($1)',[id]);
  const dir=new URL('../supabase/migrations/',import.meta.url);
  const files=await readdir(dir);
  await pg.exec(await readFile(new URL(files.find(f=>f.endsWith('_community.sql')),dir),'utf8'));
  await installUpgradeSchema(pg);
  for(const [i,id] of ids.slice(0,4).entries())await sql(`insert into public.community_members
    (user_id,display_name,role,status,rules_version) values($1,$2,'member',$3,'2026-10-23')`,
  [id,'Test player '+(i+1),['approved','approved','pending','suspended'][i]]);

  await switchRole(null,'anon');
  await refused(state());await refused(show(member));await refused(equip(normalizeLoadout({})));
  await refused(petState());await refused(petAction('trail-husky','adopt'));
  for(const id of [pending,suspended,outsider]){
    await switchRole(id);await refused(state());await refused(show(member));await refused(outfit('Test',normalizeLoadout({})));
    await refused(petState());await refused(petAction('trail-husky','adopt'));
  }

  await switchRole(member);
  const fresh=await state();
  assert.deepEqual(await petState(),[]);
  await refused(petAction('trail-husky','adopt'));
  await refused(petAction('giant-taco-hat','adopt'));
  assert.deepEqual(fresh.catalog,CATALOG.map(({id,slot,achievement_id,name,tags})=>({id,slot,achievement_id,name,tags})));
  assert.equal(fresh.achievements.length,49);
  assert.equal(fresh.earned.length,0);
  const first=normalizeLoadout({hair:'purple',style:'bun',shirt:'navy'});
  const locked=normalizeLoadout({...first,cosmetics:{hat:'dragon-crown'}});
  await refused(equip(locked));await refused(outfit('Locked look',locked));
  await refused(equip({...first,extra:'invalid'}), '22023');
  assert.equal((await equip(first)).revision,1);
  assert.equal((await equip(first)).revision,1);
  assert.deepEqual((await show(member))[0].avatar_display,first);
  assert.equal((await outfit('Purple and navy',first))[0].name,'Purple and navy');
  await refused(equip({...first,hair:'pale'},0),'40001');

  await switchRole(other);
  assert.deepEqual(await show(member),[]);
  assert.deepEqual((await state()).outfits,[]);
  await refused(sql('select * from community_private.avatar_reward_current'));
  await switchRole(null,'system');
  await sql("update public.community_profiles set published=true,avatar_mode='photo',avatar_path=$1 where user_id=$2",[member+'/avatar.png',member]);
  await switchRole(other);
  assert.deepEqual((await show(member))[0].avatar_display,first);

  await switchRole(null,'system');
  await sql(`insert into public.community_mahjong_stats(user_id,wins,total_pairs,best_score)
    values($1,1,36,5000),($2,1,36,400)`,[member,other]);
  await sql(`insert into public.community_wordle_scores(user_id,total_points,games_played,solves)
    values($1,99999,100,99)`,[member]);
  await switchRole(member);
  const awarded=await state();
  assert.ok(get(awarded,'mahjong-first-board').earned_at);
  assert.ok(get(awarded,'mahjong-tilesmith').earned_at);
  assert.equal(get(awarded,'wordle-score-75').earned_at,null);
  assert.equal(get(awarded,'cross-double-play').earned_at,null);
  assert.equal(awarded.plate_access,false);
  assert.ok(awarded.earned.some(i=>i.id==='giant-taco-hat'));
  assert.deepEqual((await state()).earned,awarded.earned);
  const earnedLook=normalizeLoadout({...first,cosmetics:{hat:'giant-taco-hat'}});
  assert.equal((await equip(earnedLook,1)).revision,2);
  assert.deepEqual((await outfit('Taco night',earnedLook))[0].recipe,earnedLook);
  await result('select public.community_avatar_reward_seen($1::text[]) as value',[['giant-taco-hat']]);
  assert.ok((await state()).earned.find(i=>i.id==='giant-taco-hat').seen);
  await switchRole(other);
  assert.equal((await state()).earned.some(i=>i.id==='giant-taco-hat'&&i.seen),false);
  assert.deepEqual((await show(member))[0].avatar_display,earnedLook);

  await switchRole(null,'system');
  await sql("insert into community_private.avatar_reward_earned(member_id,achievement_id) values($1,'quest-first-clue')",[member]);
  await switchRole(member);
  await refused(petAction('lantern-raccoon','adopt'));
  await refused(petAction('trail-husky','pet',1),'22023');
  const adopted=await petAction('trail-husky','adopt');
  assert.deepEqual(adopted,{cosmetic_id:'trail-husky',name:'Trail Husky',bond:0,revision:1});
  assert.deepEqual(await petAction('trail-husky','adopt'),adopted);
  await refused(petAction('trail-husky','trick',1),'22023');
  assert.equal((await petAction('trail-husky','pet',1)).bond,1);
  assert.equal((await petAction('trail-husky','play',2)).bond,3);
  await refused(petAction('trail-husky','play',2),'40001');
  assert.equal((await petAction('trail-husky','play',3)).bond,5);
  assert.equal((await petAction('trail-husky','pet',4)).bond,6);
  assert.equal((await petAction('trail-husky','trick',5)).bond,7);
  await refused(petAction('trail-husky','rename',6,' '),'22023');
  const named=await petAction('trail-husky','rename',6,'  Scout  ');
  assert.equal(named.name,'Scout');
  assert.equal(named.bond,7);
  await refused(sql('select * from community_private.avatar_pet'));
  await switchRole(other);
  assert.deepEqual(await petState(),[]);
  await refused(petAction('trail-husky','pet',named.revision));
  await switchRole(member);
  assert.deepEqual(await petState(),[named]);
  await equip(null,2);
  const inactive=await state();
  assert.equal(inactive.active,false);
  assert.deepEqual(inactive.loadout,earnedLook);
  assert.deepEqual(await show(member),[]);
  await switchRole(null,'system');
  const profile=(await sql('select avatar_mode,avatar_path,published from public.community_profiles where user_id=$1',[member])).rows[0];
  assert.deepEqual(profile,{avatar_mode:'photo',avatar_path:member+'/avatar.png',published:true});
  await sql("update public.community_members set status='suspended' where user_id=$1",[member]);
  await switchRole(member);
  await refused(state());
});
