import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLASSIC_TITLES,CLASSIC_IDS,acceptClassicFile,classicProgress} from '../docs/classic-arcade-catalog.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('docs/community.html'),shell=read('docs/commons-arcade-shell.mjs'),
 titles=read('docs/commons-arcade-titles.mjs'),nav=read('docs/family-arcade-nav.mjs'),
 score=read('docs/commons-family-fun.mjs'),controller=read('docs/commons-classic-arcade.mjs'),
 iframe=read('docs/classic-arcade-player.html'),player=read('docs/classic-arcade-player.mjs'),
 css=read('docs/commons-classic-arcade.css'),marqueeCSS=read('docs/commons-family-fun.css'),
 sql=read('supabase/migrations/20261116234500_classic_member_reported_scores.sql');

test('four classic-system launchers replace old active game buttons, preserving original histories',()=>{
 assert.deepEqual(CLASSIC_IDS,['galaga','pacman','centipede','topgear']);
 assert.equal(new Set(CLASSIC_TITLES.map(g=>g.core)).size,4);
 for(const g of CLASSIC_TITLES){
  assert.ok(shell.includes("id:'"+g.id+"',root:'classic-"+g.id+"-root'"),g.id);
  assert.ok(titles.includes(" "+g.id+":{"),g.id);
  assert.ok(nav.includes("  "+g.id+":{"),g.id);
  assert.ok(nav.includes("  "+g.id+":["),g.id);
  assert.ok(g.controls.length>=3);
  assert.ok(g.controls.every(c=>Number.isInteger(c.index)&&c.label&&c.key),g.id);
  assert.ok(g.controls.some(c=>c.id==='start'),g.id);
 }
 for(const old of ["id:'fleet',root:'star-squadron-root'","id:'maze',root:'mystery-maze-root'"])
  assert.ok(!shell.includes(old),'Old active entry remains: '+old);
 assert.match(controller,/community_retro_state/);
 assert.match(controller,/Historic original-game records remain stored under their original IDs/);
 assert.match(css,/classic-arcade-ready #star-squadron-root,body\.community-page\.classic-arcade-ready #mystery-maze-root\{display:none!important\}/);
});

test('local game media is never sent to Supabase or GitHub by the game launcher',()=>{
 assert.match(html,/commons-classic-arcade\.mjs\?v=classic1/);
 assert.match(html,/commons-classic-arcade\.css\?v=classic1/);
 assert.match(html,/frame-src 'self'/);
 assert.match(controller,/file\.arrayBuffer\(\)/);
 assert.match(controller,/\[buffer\]/);
 assert.match(controller,/frame\.sandbox=/);
 assert.match(controller,/community_classic_reports/);
 assert.match(controller,/UNVERIFIED \/ MEMBER-REPORTED/);
 assert.match(iframe,/content="default-src 'none'/);
 assert.match(iframe,/<script defer src="classic-arcade-player\.mjs/);
 assert.match(player,/EJS_core=data\.core/);
 assert.match(player,/window\.EJS_gameUrl=mediaUrl/);
 assert.match(player,/EJS_disableLocalStorage=true/);
 assert.match(player,/event\.source!==window\.parent/);
 assert.ok(!/file.*(?:supabase\.storage|\.upload\(|\.functions\.invoke\()/.test(controller));
});

test('supported file types and 25MB hard cap reject invalid local game media',()=>{
 for(const id of ['centipede','topgear','pacman']){
  const g=CLASSIC_TITLES.find(g=>g.id===id),ext=({centipede:'bin',topgear:'sfc',pacman:'zip'})[id];
  assert.equal(acceptClassicFile(g,{name:'Authorized local game.'+ext,size:4096}),true);
  assert.equal(acceptClassicFile(g,{name:'fake.png',size:4096}),false);
  assert.equal(acceptClassicFile(g,{name:'huge.'+ext,size:26*1024*1024}),false);
  assert.equal(acceptClassicFile(g,{name:'empty.'+ext,size:0}),false);
 }
 const galaga=CLASSIC_TITLES[0];
 assert.equal(galaga.core,null);
 assert.match(galaga.hint,/pending|awaiting/i);
 assert.match(controller,/input.disabled=!g.core/);
});

test('reported achievements do not fabricate emulator-verified trophies',()=>{
 const g=CLASSIC_TITLES[2];
 assert.equal(classicProgress(g,500,0).some(a=>a.achieved&&a.title==='Garden defender'),false);
 assert.equal(classicProgress(g,10000,1).filter(a=>a.achieved).length,3);
 assert.match(controller,/original tables|original IDs/);
 assert.match(controller,/unverified|UNVERIFIED/i);
 assert.match(sql,/source text not null default 'member_reported'/);
 assert.doesNotMatch(sql,/community_retro_trophies|community_mahjong_badges|community_dash_awards/);
});

test('new FAMILY FUN marquee replaces dull arcade menu artwork without losing other games',()=>{
 assert.match(shell,/mountFamilyFun\(menu\)/);
 assert.match(html,/commons-family-fun\.css\?v=marquee1/);
 assert.match(marqueeCSS,/#arcade-title-art\{display:none!important\}/);
 assert.match(marqueeCSS,/family-fun-scoreboard/);
 assert.match(score,/FAMILY FUN/);\n assert.match(score,/family-fun-in-menu/);\n assert.match(score,/arcade-family-fun/);
 assert.match(score,/ARCADE HIGH SCORES/);
 assert.match(score,/FAMILY-REPORTED/);
 assert.match(score,/aria-pressed/);
 assert.match(score,/family-classic-scores-clear/);
 assert.match(controller,/new CustomEvent\('family-classic-scores'/);
 assert.match(controller,/family-classic-scores-clear/);
 for(const id of CLASSIC_IDS)assert.ok(score.includes("CLASSIC_TITLES.find")&&controller.includes("g.id"),id);
 assert.match(css,/\.classic-root\.arcade-game-active/);
});

test('RLS restricts score read and submit to approved member own account',()=>{
 assert.match(sql,/enable row level security/);
 assert.match(sql,/grant select,insert on public\.community_classic_reports to authenticated/);
 assert.match(sql,/source='member_reported'/);
 assert.match(sql,/user_id=\(select auth\.uid\(\)\)/);
 assert.match(sql,/m.status='approved'/);
 assert.doesNotMatch(sql,/grant all on public\.community_classic_reports to anon/);
 assert.doesNotMatch(sql,/for update|for delete/);
});
