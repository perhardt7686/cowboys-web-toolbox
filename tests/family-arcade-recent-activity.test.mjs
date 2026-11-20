import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {timestampMs,sortGamesByRecent,mostRecentGame,formatEasternStamp,readGameActivity}
 from '../docs/family-arcade-activity.mjs';
const read=path=>readFileSync(new URL('../docs/'+path,import.meta.url),'utf8');
const games=[{id:'streetrod'},{id:'mahjong'},{id:'skyboard'},{id:'drawing'}];
test('most recently played game moves to first slot, stable tie and untracked go last',()=>{
 const activity={streetrod:{lastPlayedAt:'2026-11-20T10:20:00Z'},
  mahjong:{lastPlayedAt:'2026-11-20T12:11:00Z'},
  skyboard:{lastPlayedAt:'2026-11-20T11:01:00Z'}};
 assert.deepEqual(sortGamesByRecent(games,activity).map(g=>g.id),
  ['mahjong','skyboard','streetrod','drawing']);
 assert.equal(mostRecentGame(games,activity)?.id,'mahjong');
 assert.deepEqual(sortGamesByRecent(games).map(g=>g.id),games.map(g=>g.id));
 assert.equal(mostRecentGame(games),null);
 assert.deepEqual(sortGamesByRecent(games,{streetrod:{lastPlayedAt:'2026-11-20T12:11:00Z'},
 mahjong:{lastPlayedAt:'2026-11-20T12:11:00Z'}}).map(g=>g.id),
 ['streetrod','mahjong','skyboard','drawing']);
});
test('Eastern timestamps use 24-hour clock and correct DST offset',()=>{
 assert.equal(formatEasternStamp('2026-11-20T21:05:00Z').includes('16:05'),true);
 assert.match(formatEasternStamp('2026-11-20T21:05:00Z'),/EST/);
 assert.equal(formatEasternStamp('2026-07-20T21:05:00Z').includes('17:05'),true);
 assert.equal(formatEasternStamp(null),'No saved play recorded');
 assert.equal(timestampMs('2026-11-20T11:00:00Z')>0,true);
 assert.equal(timestampMs('not a real timestamp'),0);
});
test('untrusted activity names and metrics are constrained to known supported games',()=>{
 const result=readGameActivity({games:{
  mahjong:{lastPlayedAt:'2026-11-20T21:05:00Z',lastPlayer:'A'.repeat(100),
   actionsToday:3.9,yourActionsToday:-10,yourLastPlayedAt:'garbage'},
  study:{lastPlayedAt:'2026-11-20T23:00:00Z'},
  mystery:{lastPlayedAt:'2026-11-20T22:00:00Z'}
 }});
 assert.equal(result.mahjong.lastPlayer.length,48);
 assert.equal(result.mahjong.actionsToday,3);
 assert.equal(result.mahjong.yourActionsToday,0);
 assert.equal(result.mahjong.yourLastPlayedAt,null);
 assert.equal(result.study,undefined);
 assert.equal(result.mystery,undefined);
});
test('Family Fun uses verified activity events, no fake scores, and Eastern time',()=>{
 const board=read('commons-family-fun.mjs');
 const sender=read('family-board.mjs');
 const css=read('family-marquee-neon.css');
 assert.match(board,/sortGamesByRecent\(FAMILY_FUN_GAMES,activity\)/);
 assert.match(board,/family-arcade-recent-activity/);
 assert.match(board,/LATEST PLAY/);
 assert.match(board,/family-fun-chip-time/);
 assert.match(board,/yourLastPlayedAt/);
 assert.match(board,/activityAt\?/);
 assert.match(board,/family-unified-scoreboard-clear/);
 assert.match(board,/recent\?\.lastPlayedAt/);
 assert.match(sender,/client\.rpc\('community_family_arcade_activity'\)/);
 assert.match(sender,/if\(!active\(\)\|\|error\|\|!activity\?\.games\)return/);
 assert.match(css,/\.family-fun-game-chip\.is-most-recent/);
 assert.doesNotMatch(board,/localStorage|setItem\(/);
});
test('Reading Comfort is a collapsed dropdown in conversation search/sort toolbar',()=>{
 const board=read('community-board-accessibility.mjs');
 const style=read('community-readable.css');
 const html=read('community.html');
 assert.match(board,/document\.createElement\('details'\)/);
 assert.match(board,/has-reading-dropdown/);
 assert.match(board,/tools\.append\(reading\)/);
 assert.doesNotMatch(board,/main\.prepend\(reading\)/);
 assert.match(board,/family-reading-panel/);
 assert.match(board,/family-read-toggle/);
 assert.match(board,/localStorage\.setItem\(key/);
 assert.match(board,/event\.key==='Escape'/);
 assert.match(style,/community-tools\.has-reading-dropdown/);
 assert.match(style,/\.family-reading-panel/);
 assert.match(style,/prefers-reduced-motion:reduce/);
 assert.match(html,/community-board-accessibility\.mjs\?v=board-access5/);
 assert.match(html,/family-marquee-neon\.css\?v=neon2/);
});
test('Activity backend requires approved family login, retrieves only saved play events, and never updates scores',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261120071400_family_arcade_recent_activity.sql',import.meta.url),'utf8');
 assert.match(sql,/security definer/);
 assert.match(sql,/set search_path to ''/);
 assert.match(sql,/m\.status='approved'/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/community_retro_runs/);
 assert.match(sql,/community_wordle_guesses/);
 assert.match(sql,/community_mahjong_runs/);
 assert.match(sql,/America\/New_York/);
 assert.match(sql,/revoke all on function .* from public,anon/);
 assert.match(sql,/grant execute on function .* to authenticated/);
 assert.doesNotMatch(sql,/\b(delete|truncate|update|insert|drop table)\b/i);
});
