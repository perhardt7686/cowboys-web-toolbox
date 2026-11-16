import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {installUpgradeSchema} from './helpers/community-db.mjs';
import {CATALOG,LEGACY_CATALOG,GROUPS,SHOWCASE} from '../docs/avatar-reward-catalog.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {FREE_OPTION_COUNT} from '../docs/family-avatar-builder.mjs';

test('free choices and complete, distinct cosmetic IDs',()=>{
  assert.equal(FREE_OPTION_COUNT,154);
  const counts={hat:51,eyewear:38,hair:41,eyes:30,prop:46,companion:51,background:35,effect:24,
    outerwear:4,top:2,bottoms:3,footwear:2,hands:1,waist:1,neckwear:1,back:2,bodypart:2,offhand:2};
  assert.equal(LEGACY_CATALOG.length,336);
  assert.equal(CATALOG.length,362);
  assert.deepEqual({...Object.fromEntries(Object.entries(Object.groupBy(LEGACY_CATALOG,item=>item.slot))
    .map(([slot,items])=>[slot,items.length]))},counts);
  assert.equal(new Set(CATALOG.map(item=>item.id)).size,CATALOG.length);
  assert.equal(new Set(LEGACY_CATALOG.map(item=>item.achievement_id)).size,Object.values(GROUPS).flat().length);
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
  const tradeState=()=>result('select public.community_avatar_pet_trade_state() as value');
  const tradeOffer=(to,pet,request=null,rev=null)=>result(
    'select public.community_avatar_pet_trade_offer($1,$2,$3,$4) as value',[to,pet,request,rev]);
  const tradeAction=(id,action)=>result(
    'select public.community_avatar_pet_trade_action($1,$2) as value',[id,action]);
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
  assert.equal(fresh.achievements.length,72);
  assert.equal(fresh.catalog_version,2);
  assert.deepEqual(fresh.earned.map(i=>i.id),['studio-attic-ghost']);
  assert.deepEqual((await state()).earned,fresh.earned);
  await refused(sql('select * from community_private.avatar_studio_release_receipt'));
  await refused(outfit('Preview gear',normalizeLoadout({full_body:{model:'radio'},cosmetics:{bodypart:'studio-workshop-visor'}})));
  for(const model of ['marsh','radio']){
    const newBody=normalizeLoadout({full_body:{model}});
    assert.deepEqual((await outfit('New starter',newBody))[0].recipe,newBody);
  }
  await outfit('',null);
  const first=normalizeLoadout({hair:'purple',style:'bun',shirt:'navy'});
  const locked=normalizeLoadout({...first,cosmetics:{hat:'dragon-crown'}});
  await refused(equip(locked));await refused(outfit('Locked look',locked));
  await refused(equip({...first,extra:'invalid'}), '22023');
  await refused(equip({...first,full_body:{model:'made-up'}}),'22023');
  await refused(equip({...first,full_body:{model:'detective',footwear:52}}),'22023');
  await refused(equip({...first,full_body:{model:'detective',height:'19'}}),'22023');
  await refused(equip({...first,full_body:{model:'detective',jaw:1}}),'22023');
  await refused(equip({...first,full_body:['armor']}),'22023');
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
  assert.equal(typeof adopted.acquired_at,'string');
  assert.deepEqual({cosmetic_id:adopted.cosmetic_id,name:adopted.name,bond:adopted.bond,revision:adopted.revision},
    {cosmetic_id:'trail-husky',name:'Trail Husky',bond:0,revision:1});
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
  await refused(petAction('trail-husky','pet',named.revision),'22023');
  await switchRole(member);
  assert.deepEqual(await petState(),[named]);
  await equip(null,2);
  const inactive=await state();
  assert.equal(inactive.active,false);
  assert.deepEqual(inactive.loadout,earnedLook);
  assert.deepEqual(await show(member),[]);

  // A family gift needs an actual offer and the recipient's approval.
  // The pet moves exactly once, retaining its name/bond; the earning
  // achievement remains with its original player.
  const offering=await tradeOffer(other,'trail-husky',null,named.revision);
  assert.equal(offering.status,'pending');
  assert.equal((await tradeState()).offers[0].direction,'outgoing');
  await refused(tradeAction(offering.id,'accept'));
  await switchRole(other);
  assert.equal((await tradeState()).offers[0].direction,'incoming');
  assert.equal((await petState()).length,0);
  const received=await tradeAction(offering.id,'accept');
  assert.equal(received.status,'accepted');
  assert.equal((await petState())[0].name,'Scout');
  assert.equal((await petState())[0].bond,7);
  assert.ok((await state()).earned.some(i=>i.id==='trail-husky'));
  const newlyOwned=normalizeLoadout({full_body:{model:'sleuth',bottoms:'dress',footwear:'boots',height:'2',jaw:'-1',eye_spacing:'1'},
    cosmetics:{companion:'trail-husky'}});
  assert.ok((await equip(newlyOwned)).active);
  assert.deepEqual((await outfit('Full-body draft',newlyOwned))[0].recipe,newlyOwned);
  await refused(tradeAction(offering.id,'accept'),'22023');
  await switchRole(member);
  assert.equal((await petState()).length,0);
  await refused(petAction('trail-husky','adopt'));
  assert.equal((await state()).earned.some(i=>i.id==='trail-husky'),false);
  assert.ok(get(await state(),'quest-first-clue').earned_at);

  // A later TWO-WAY family swap is atomic and preserves the pets' own
  // identities, while clearing the previous owner's equipped companion.
  await switchRole(null,'system');
  await sql("update community_private.avatar_pet_trade set created_at=now()-interval '2 minutes' where id=$1",[offering.id]);
  await sql("insert into community_private.avatar_reward_earned(member_id,achievement_id) values($1,'hotrod-first-drag') on conflict do nothing",[member]);
  await switchRole(member);
  const raccoon=await petAction('lantern-raccoon','adopt');
  const swap=await tradeOffer(other,'lantern-raccoon','trail-husky',raccoon.revision);
  assert.equal(swap.requested_pet,'trail-husky');
  await switchRole(other);
  assert.equal((await tradeAction(swap.id,'accept')).status,'accepted');
  assert.ok((await petState()).some(p=>p.cosmetic_id==='lantern-raccoon'));
  assert.ok(!(await petState()).some(p=>p.cosmetic_id==='trail-husky'));
  assert.equal((await state()).loadout.cosmetics?.companion,undefined);
  assert.deepEqual((await state()).loadout.full_body,newlyOwned.full_body);
  assert.deepEqual((await state()).outfits[0].recipe.full_body,newlyOwned.full_body);
  assert.equal((await state()).outfits[0].recipe.cosmetics?.companion,undefined);
  await switchRole(member);
  const returned=(await petState()).find(p=>p.cosmetic_id==='trail-husky');
  assert.equal(returned.name,'Scout');
  assert.equal(returned.bond,7);
  assert.ok((await state()).earned.some(i=>i.id==='trail-husky'));

  await switchRole(null,'system');
  await sql("insert into community_private.avatar_reward_earned(member_id,achievement_id) values($1,'fleet-gunner'),($1,'dash-first-boss') on conflict do nothing",[member]);
  await switchRole(member);
  const buildWith=(model,cosmetics)=>normalizeLoadout({full_body:{model},cosmetics});
  await refused(outfit('Wrong fit',buildWith('marsh',{hands:'studio-workshop-gloves'})));
  for(const item of [{bodypart:'studio-workshop-visor'},{hands:'studio-workshop-gloves'}]){
    const fitted=buildWith('radio',item);
    assert.deepEqual((await outfit('Workshop fit',fitted))[0].recipe,fitted);
  }
  const withPlate=normalizeLoadout({full_body:{model:'automaton',neckwear:'ascot'},
    cosmetics:{bodypart:'carnival-visor-plate',prop:'spectral-case-sword',outerwear:'phantom-cloak',offhand:'museum-lantern'}});
  await refused(equip({...withPlate,full_body:{...withPlate.full_body,model:'detective'}},3));
  const wardrobe=await equip(withPlate,3);
  assert.deepEqual(wardrobe.loadout,withPlate);
  assert.deepEqual((await outfit('Clockwork dusk',withPlate))[0].recipe,withPlate);
  await switchRole(other);
  assert.deepEqual((await show(member))[0].avatar_display,withPlate);
  await refused(equip(withPlate,2));

  assert.equal(get(await state(),'studio-refit').earned_at,null);
  await switchRole(null,'system');
  // The production daily-word guard requires a real dictionary entry.
  // This synthetic award fixture previously referenced an absent word_id.
  await sql("insert into public.community_word_bank(id,answer,clue,difficulty) values(1,'ALPHA','Fixture-only clue','easy')");
  await sql("insert into public.community_word_days(game_date,word_id) values('2026-11-14',1)");
  await sql(`insert into public.community_word_guesses(game_date,user_id,guess,feedback,points)
    values('2026-11-14',$1,'CLUES',array['correct','present','absent','absent','absent'],5)`,[other]);
  await switchRole(other);
  const afterClue=await state();
  assert.ok(get(afterClue,'studio-refit').earned_at);
  assert.ok(get(afterClue,'quest-first-clue').earned_at);
  assert.equal(afterClue.earned.filter(i=>i.id.startsWith('studio-backlot-')).length,5);
  assert.deepEqual((await state()).earned,afterClue.earned);

  // An offered starter pet is still owned by its sender after an explicit decline.
  const starter=await petAction('studio-attic-ghost','adopt');
  const gift=await tradeOffer(member,'studio-attic-ghost',null,starter.revision);
  await switchRole(member);
  assert.equal((await tradeAction(gift.id,'decline')).status,'declined');
  assert.ok(!(await petState()).some(p=>p.cosmetic_id==='studio-attic-ghost'));

  // Reapply rollout over legacy inventories and compare the recoverable state.
  await switchRole(null,'system');
  const migration=await readFile(new URL(files.find(f=>f.endsWith('_avatar_studio_workshop.sql')),dir),'utf8');
  await pg.exec(migration);
  const receipt=()=>sql(`select member_id,saved_character,saved_outfits,converted_at
    from community_private.avatar_studio_release_receipt where edition=2 order by member_id`);
  const captured=await receipt();
  assert.equal(captured.rows.length,2);
  assert.deepEqual(captured.rows[0].saved_character.recipe,withPlate);
  assert.deepEqual(captured.rows[0].saved_outfits[0].recipe,withPlate);
  await pg.exec(migration);
  assert.deepEqual((await receipt()).rows,captured.rows);
  await switchRole(other);
  assert.ok((await petState()).some(p=>p.cosmetic_id==='studio-attic-ghost'));
  await switchRole(null,'system');
  const profile=(await sql('select avatar_mode,avatar_path,published from public.community_profiles where user_id=$1',[member])).rows[0];
  assert.deepEqual(profile,{avatar_mode:'photo',avatar_path:member+'/avatar.png',published:true});
  await sql("update public.community_members set status='suspended' where user_id=$1",[member]);
  await switchRole(member);
  await refused(state());
});
