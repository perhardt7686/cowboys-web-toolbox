import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {titleProfiles} from '../docs/commons-arcade-titles.mjs';
const read=name=>readFileSync(new URL('../docs/'+name,import.meta.url),'utf8');
const html=read('community.html'),shell=read('commons-arcade-shell.mjs');
const nav=read('family-arcade-nav.mjs'),retro=read('commons-retro-arcade.mjs');
const fun=read('commons-family-fun.mjs'),funCSS=read('commons-family-fun.css');
const old=['galaga','pacman','centipede','topgear'];

test('four newly added commercial classics are removed from all launchers and public dependencies',()=>{
 for(const id of old){
  assert.ok(!shell.includes("id:'"+id+"'"),'Unexpected active arcade game '+id);
  assert.ok(!Object.hasOwn(titleProfiles,id),'Unexpected title card '+id);
  assert.ok(!nav.includes('  '+id+':'),'Unexpected navigation '+id);
  assert.ok(!fun.includes("id:'"+id+"'"),'Unexpected FAMILY FUN scoreboard tab '+id);
 }
 for(const file of ['commons-classic-arcade.mjs','commons-classic-arcade.css','classic-arcade-catalog.mjs',
   'classic-arcade-player.mjs','classic-arcade-player.html']){
  assert.equal(existsSync(fileURLToPath(new URL('../docs/'+file,import.meta.url))),false,
   'Retired file still published: '+file);
  assert.ok(!html.includes(file),'Retired file still loaded: '+file);
 }
 assert.ok(!shell.includes("family-classic-menu-open"));
 assert.equal(Object.keys(titleProfiles).length,11);
});

test('original family arcade games remain playable, with score backend intact',()=>{
 for(const [id,root] of [['fleet','star-squadron-root'],['maze','mystery-maze-root']]){
  assert.match(shell,new RegExp("id:'"+id+"',root:'"+root+"'"));
  assert.ok(Object.hasOwn(titleProfiles,id));
  assert.match(nav,new RegExp('  '+id+':'));
 }
 assert.match(html,/commons-retro-arcade\.mjs\?v=retro9/);
 assert.match(retro,/community_retro_start/);
 assert.match(retro,/community_retro_finish/);
 assert.match(retro,/community_retro_state/);
 assert.ok(!html.includes('commons-classic-arcade.css'));
});

test('FAMILY FUN is retained but only shows approved verified original-game scores',()=>{
 assert.match(fun,/FAMILY FUN/);
 assert.match(fun,/VERIFIED HIGH SCORES/);
 assert.match(fun,/SCORES FROM SERVER-VERIFIED ORIGINAL GAME ROUNDS/);
 assert.match(fun,/family-fun-in-menu/);
 assert.match(fun,/arcade-family-fun/);
 assert.match(fun,/family-retro-scoreboard-clear/);
 assert.match(retro,/shareVerifiedScores\(\)/);
 assert.match(retro,/if\(!mounted\|\|user!==owner\|\|board.hidden\)return/);
 assert.match(retro,/new CustomEvent\('family-retro-scoreboard'/);
 assert.match(retro,/clearSharedScores\(\)/);
 assert.match(html,/commons-family-fun\.css\?v=marquee4/);
 assert.match(funCSS,/family-fun-scoreboard/);
 assert.match(shell,/mountFamilyFun\(menu\)/);
});
