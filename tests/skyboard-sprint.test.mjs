import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('docs/commons-board-rush.mjs'),css=read('docs/commons-board-rush.css');
const shell=read('docs/commons-arcade-shell.mjs'),titles=read('docs/commons-arcade-titles.mjs');
const nav=read('docs/family-arcade-nav.mjs'),html=read('docs/community.html');
const sql=read('supabase/migrations/20261115162000_emma_skyboard_sprint.sql');
test('Skyboard ships with independently executable and accessible board source',()=>{
 for(const path of ['docs/commons-board-rush.mjs','docs/commons-arcade-shell.mjs',
   'docs/commons-arcade-titles.mjs','docs/family-arcade-nav.mjs']){
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',
   fileURLToPath(new URL('../'+path,import.meta.url))]));
 }
 assert.match(html,/commons-board-rush\.mjs\?v=emma1/);
 assert.match(html,/commons-board-rush\.css\?v=emma1/);
 assert.match(shell,/id:'skyboard',root:'skyboard-root',toggle:'skyboard-toggle'/);
 assert.match(nav,/skyboard:\[sceneAction\('Ride current stage'/);
 assert.match(nav,/skyboard:'Steer with left and right/);
 assert.match(titles,/skyboard:\{/);
 assert.match(titles,/id==='skyboard'/);
 assert.match(game,/aria-label="Third-person board race/);
 assert.match(game,/data-sky-hold="left"/);
 assert.match(game,/data-sky-hold="right"/);
 assert.match(game,/data-sky-action="jump"/);
 assert.match(game,/data-sky-hold="drift"/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/@media\(max-height:620px\)/);
});
test('All thirty stages have reproducible seeded original obstacle courses',()=>{
 const from=game.indexOf('function rand(seed){');
 const to=game.indexOf('function build(){');
 assert.ok(from>0&&to>from);
 const code=game.slice(from,to)+'\nreturn {buildCourse,palette};';
 const {buildCourse,palette}=new Function('WORLDS',code)([
  {name:'Sunshine Skyway'},{name:'Candy Canyon'},{name:'Crystal Coast'},
  {name:'Glacier Glow'},{name:'Moonlight Metro'},{name:'Rainbow Rapids'}
 ]);
 const environments=new Set(),hazards=new Set();
 for(let stage=1;stage<=30;stage++){
  let course=buildCourse(stage,12345678);
  const copy=buildCourse(stage,12345678);
  assert.equal(JSON.stringify(course),JSON.stringify(copy),'seeded stage '+stage);
  assert.ok(course.length>=300&&course.length<=405,'playable length');
  assert.ok(course.things.length>5&&course.things.length<65,'bounded obstacles');
  assert.ok(course.things.every(o=>Number.isFinite(o.z)&&o.z>20&&o.z<course.length));
  for(const o of course.things)hazards.add(o.kind);
  environments.add(palette(stage).name);
 }
 assert.equal(environments.size,6);
 for(const hazard of ['bar','spikes','gap','gate','coin','boost'])assert.ok(hazards.has(hazard),hazard);
});
test('Skyboard starts only with an approved family member, and saves under owner identity',()=>{
 assert.match(game,/member\?\.status!=='approved'/);
 assert.match(game,/community_boardride_start/);
 assert.match(game,/community_boardride_finish/);
 assert.match(game,/snapshot\.practice/);
 assert.match(game,/Your result was not added to the family leaderboard/);
 assert.match(sql,/user_id uuid primary key references auth\.users/);
 assert.match(sql,/alter table public\.community_boardride_profiles enable row level security/);
 assert.match(sql,/alter table public\.community_boardride_runs enable row level security/);
 assert.match(sql,/alter table public\.community_boardride_badges enable row level security/);
 assert.match(sql,/v_user:=public\.community_boardride_allowed\(\)/);
 assert.match(sql,/where id=p_run_id and user_id=v_user and status='active'/);
 assert.match(sql,/grant execute on function public\.community_boardride_state\(\) to authenticated/);
 assert.match(sql,/revoke all on public\.community_boardride_profiles/);
 assert.doesNotMatch(sql,/grant (?:select|insert|update|delete) on public\.community_boardride_(?:profiles|runs|badges) to anon/i);
});
