import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const modulePath='docs/commons-dash-forge.mjs';
const src=read(modulePath),css=read('docs/commons-dash-forge.css');
const html=read('docs/community.html'),shell=read('docs/commons-arcade-shell.mjs');
const migration=read('supabase/migrations/20261115050001_family_dash_forge_member_levels_and_verified_awards.sql');
const authFix=read('supabase/migrations/20261115050002_dash_forge_independent_approved_member_guard.sql');
test('Original Dash Forge modules parse and load only within the private member board',()=>{
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',fileURLToPath(new URL('../'+modulePath,import.meta.url))]));
 assert.match(html,/commons-dash-forge\.mjs\?v=dash4/);
 assert.match(html,/commons-dash-forge\.css\?v=dash4/);
 assert.match(shell,/id:'dashforge',root:'dash-forge-root',toggle:'dash-forge-toggle'/);
 assert.match(shell,/GEOMETRY-DASH STYLE/);
 assert.match(src,/member\?\.status!=='approved'/);
 assert.match(src,/board\.hidden/);
 assert.match(css,/data-arcade-game=dashforge/);
 assert.doesNotMatch(html,/dash-forge\.(mjs|css)[\s\S]*https?:\/\/[^"']+\.mp3/);
});
test('Six fixed campaign tracks are solvable and stage-gated',()=>{
 const rows=[...migration.matchAll(/\('campaign',(\d+),'[^']+',(\d+),'([.sbg]+)',true\)/g)];
 assert.equal(rows.length,6);
 for(let j=0;j<rows.length;j++){
  const [_,stage,difficulty,pattern]=rows[j];
  assert.equal(Number(stage),j+1);assert.equal(Number(difficulty),j+1);
  assert.ok(pattern.length>=24&&pattern.length<=90);
  assert.equal(pattern.slice(0,4),'....');assert.equal(pattern.slice(-4),'....');
  let last=-5;const jumps=[];
  for(let i=0;i<pattern.length;i++){
   if(pattern[i]==='.'||i-last>=1&&i-last<=3)continue;
   const jump=i-1;
   assert.equal(pattern[jump],'.');
   assert.ok(jump-last>=4,'Jump recharges before next obstacle');
   jumps.push(jump);last=jump;
  }
  assert.ok(jumps.length>=3,'Each stage has at least three skill jumps');
 }
 assert.match(migration,/Finish the previous campaign stage to unlock this level/);
 assert.match(src,/campaign_current/);
 assert.match(src,/chapter\(\)/);
});
test('Players and designers have isolated rewards verified only by privileged server replay',()=>{
 for(const fn of ['community_dash_state','community_dash_save','community_dash_publish','community_dash_start','community_dash_finish'])assert.match(migration,new RegExp('function public\\.'+fn+'\\('));
 assert.match(migration,/create or replace function public\.community_dash_replay/);
 assert.match(migration,/clock_timestamp\(\)-v\.started_at/);
 assert.match(migration,/Run finished faster than the validated tile clock/);
 assert.match(migration,/Playtest and beat this exact draft before publishing/);
 assert.match(migration,/v_level\.kind='member' and v_level\.published and v_level\.creator<>v_owner/);
 assert.match(migration,/award_type.*designer/);
 assert.match(migration,/v_designer_ms>=90000/);
 assert.match(migration,/on conflict do nothing/);
 assert.doesNotMatch(migration,/community_dash_like|community_dash_view_reward/i);
 assert.match(src,/community_dash_finish/);
 assert.match(src,/data-dash-cell/);
 assert.match(src,/pointerdown/);
 assert.match(src,/e\.code==='Space'/);
});
test('New tables deny direct API access; only approved members can invoke RPC',()=>{
 for(const table of ['levels','runs','progress','profiles','awards']){
  assert.match(migration,new RegExp('alter table public\\.community_dash_'+table+' enable row level security'));
 }
 assert.match(migration,/revoke all on table public\.community_dash_levels/);
 assert.match(migration,/from PUBLIC,anon,authenticated/);
 assert.match(migration,/to authenticated/);
 assert.match(migration,/m\.user_id=auth\.uid\(\) and m\.status='approved'/);
 assert.doesNotMatch(migration,/community_mahjong_allowed/);
 assert.match(authFix,/m\.status='approved'/);
});

test('Billion-stage family campaign regenerates deterministic worlds and safeguards rewards',()=>{
 const world=read('supabase/migrations/20261115050004_dash_forge_billion_stage_world_campaign.sql');
 const pattern=read('supabase/migrations/20261115050005_dash_forge_world_obstacle_pattern_validation.sql');
 assert.match(world,/p_stage not between 1 and 1000000000/);
 assert.match(world,/community_dash_ensure_stage/);
 assert.match(world,/v_current\+12/);
 assert.match(world,/v_stage in v_from\.\.v_to/);
 assert.match(world,/perform public\.community_dash_ensure_stage\(v_stage\)/);
 assert.match(world,/v_worlds text\[\]/);
 for(const biome of ['Neon Canopy','Clockwork Harbor','Crystal Hollow','Skyglass City','Solar Dunes','Thunder Rails',
  'Abyssal Reef','Volcanic Foundry','Pixel Metropolis','Moonlit Gardens','Starfall Observatory','Endless Aurora'])
   assert.ok(world.includes(biome),biome);
 assert.match(world,/v_boss:=p_stage%25=0/);
 assert.match(world,/v_pace:=greatest\(125,/);
 assert.match(world,/v_expected:=\(v_sim->>'tiles'\)::int\*v_level\.pace_ms/);
 assert.match(world,/100\+least\(300,v_level\.stage\)\*40/);
 assert.match(pattern,/\^\[\.sbglwcpfrmodh\]\+\$/);
 assert.match(src,/Math\.floor\(run\.elapsed\/\(run\.pace\|\|210\)\)/);
 assert.match(src,/renderHazard/);
 assert.match(src,/backdrop\(g,cam,ground\)/);
 assert.match(src,/THEMES=\[/);
 assert.match(src,/ONE BILLION NUMBERED STAGES/);
 assert.match(src,/function originalBeat\(/);
 assert.match(src,/id=\\"dash-sound\\"|id="dash-sound"/);
 assert.match(src,/THUNDER|Thunder Rails/);
 assert.match(src,/renderHazard\(g,run\.pattern\[i\]/);
});
