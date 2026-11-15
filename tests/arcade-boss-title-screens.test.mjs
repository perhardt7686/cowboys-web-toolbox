import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {titleProfiles,titleMarkup,drawGameTitle} from '../docs/commons-arcade-titles.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const shell=read('docs/commons-arcade-shell.mjs');
const nav=read('docs/family-arcade-nav.mjs');
const dash=read('docs/commons-dash-forge.mjs');
const html=read('docs/community.html');
const styles=read('docs/commons-arcade-shell.css');
const bossSQL=read('supabase/migrations/20261115053001_dash_forge_shared_boss_archetypes_creator_worlds.sql');
const revisionSQL=read('supabase/migrations/20261115053002_dash_forge_boss_creator_exact_revision_playtest.sql');
const ascensionSQL=read('supabase/migrations/20261115053003_dash_forge_unique_ascended_boss_identities.sql');

test('Eleven family games have distinct functional starting menus, not one reused mockup',()=>{
 const expected=['skyboard','fleet','maze','streetrod','dashforge','mahjong','wordle','wordquest','plates','drawing','study'];
 assert.deepEqual(Object.keys(titleProfiles),expected);
 assert.equal(new Set(expected.map(id=>titleProfiles[id].name)).size,11);
 assert.equal(new Set(expected.map(id=>titleProfiles[id].scene)).size,11);
 for(const id of expected){
  const markup=titleMarkup(id);
  assert.match(markup,/data-arcade-action="title-start"/);
  assert.match(markup,/data-arcade-action="title-help"/);
  assert.match(markup,/data-arcade-action="title-settings"/);
  assert.match(markup,/data-arcade-action="title-back"/);
  assert.match(markup,/aria-label="Original /);
  assert.ok(titleProfiles[id].help.length>=90,id+' must have specific guidance');
  assert.ok(titleProfiles[id].first.length>=5,id+' needs meaningful start label');
 }
 const dashTitle=titleMarkup('dashforge');
 assert.match(dashTitle,/LEVEL CREATOR/);
 assert.match(dashTitle,/BOSS CREATOR/);
 assert.doesNotMatch(titleMarkup('mahjong'),/BOSS CREATOR/);
 assert.equal(typeof drawGameTitle,'function');
});
test('Arcade shell opens title before touching existing saved game controllers',()=>{
 const modulePaths=['docs/commons-arcade-shell.mjs','docs/commons-arcade-titles.mjs','docs/commons-dash-forge.mjs'];
 for(const path of modulePaths)
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',
   fileURLToPath(new URL('../'+path,import.meta.url))]));
 assert.match(shell,/mode='title'/);
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',
  fileURLToPath(new URL('../docs/family-arcade-nav.mjs',import.meta.url))]));
 assert.match(nav,/dashforge: \[text\('dash-forge-summary'\)/);
 assert.match(nav,/\}\[selected\]\|\|\[\]\)\.filter/);
 assert.match(shell,/function enterGame\(destination\)/);
 assert.match(shell,/const view=\$\('arcade-game-title-view'\)/);
 assert.match(shell,/titleMarkup\(g\.id\)/);
 assert.match(shell,/drawGameTitle\(view\.querySelector\('canvas'\)/);
 assert.match(shell,/if\(returnMode==='title'&&active\)/);
 assert.match(shell,/data-arcade-action/);
 assert.match(shell,/case 'title-boss-builder'/);
 assert.match(shell,/case 'title-start'/);
 assert.match(html,/commons-arcade-shell\.mjs\?v=retro4/);
 assert.match(html,/commons-arcade-shell\.css\?v=titles3/);
 assert.match(html,/commons-dash-forge\.mjs\?v=[\w-]+"/);
 assert.match(styles,/#arcade-game-title-view/);
});
test('Global level numbers and bosses are not player-seeded or client-writable',()=>{
 assert.match(bossSQL,/community_dash_boss_profile\(p_stage int\)/);
 assert.match(bossSQL,/p_stage%25<>0/);
 assert.match(bossSQL,/v_boss:=p_stage%25=0/);
 assert.match(bossSQL,/get_byte\(decode\(md5\('BOSS3:'/);
 assert.match(bossSQL,/v_phase:=least\(3,1\+\(v_i\*3\/v_length\)\)/);
 assert.match(bossSQL,/on conflict\(kind,stage\) do nothing/);
 assert.match(bossSQL,/when 'canopy' then array\['csf','wmp','slo'\]/);
 assert.match(bossSQL,/create or replace function public\.community_dash_ensure_stage/);
 assert.match(bossSQL,/community_dash_save_world/);
 assert.match(bossSQL,/kind='member' and not published/);
 assert.match(bossSQL,/revoke all on function public\.community_dash_boss_profile\(int\)/);
 const bosses=['Thorn Monarch','Chrono Colossus','Prism Serpent','Skybreaker Sentinel',
  'Solar Sandwyrm','Volt Leviathan','Abyssal Lantern','Magma Titan',
  'Glitch Sovereign','Moonbloom Guardian','Astral Devourer','Aurora Warden'];
 for(const boss of bosses){assert.ok(bossSQL.includes(boss),boss);assert.ok(dash.includes(boss),boss);}
 assert.match(ascensionSQL,/v_rank:=1\+\(\(p_stage\/25-1\)\/12\)/);
 assert.match(revisionSQL,/r\.level_revision=v\.revision/);
 assert.match(revisionSQL,/revision=revision\+1/);
 assert.match(revisionSQL,/level_revision\)/);
});
test('Boss Creator makes truly editable boss scenes, validated by server not by artwork',()=>{
 assert.match(dash,/CREATOR_WORLDS/);
 assert.match(dash,/BOSS_FORMS/);
 assert.match(dash,/id="dash-world"/);
 assert.match(dash,/id="dash-boss-style"/);
 assert.match(dash,/id="dash-creator-preview"/);
 assert.match(dash,/id="dash-phase-guide"/);
 assert.match(dash,/community_dash_save_world/);
 assert.match(dash,/p_boss_style:draft\.bossStyle/);
 assert.match(dash,/dashforge:creator-mode/);
 assert.match(dash,/function drawBoss/);
 assert.match(dash,/(?:run|data)\.bossStyle/);
 assert.match(dash,/Math\.min\(3,Math\.floor\(pos\/(?:run|data)\.pattern\.length\*3\)\+1\)/);
 assert.match(dash,/(?:run|data)\.pattern\[i\]!=='.'/);
 assert.match(dash,/community_dash_finish/);
 assert.match(dash,/server-validated pattern/);
});
