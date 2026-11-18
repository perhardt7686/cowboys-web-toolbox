import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classicFaceForTile} from '../docs/mahjong-classic-tiles.mjs';

const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('classic tile artwork is deterministic and preserves 18 server match kinds',()=>{
  const first=Array.from({length:18},(_,i)=>classicFaceForTile(i+1));
  const second=Array.from({length:18},(_,i)=>classicFaceForTile(i+19));
  assert.equal(new Set(first.map(face=>face.code)).size,18);
  assert.deepEqual(first.map(face=>face.kind),[
    ...Array(6).fill('characters'),...Array(6).fill('dots'),...Array(6).fill('bamboo')
  ]);
  for(let i=0;i<18;i++){
    assert.equal(first[i].value,i%6+1);
    assert.equal(first[i].variant,'flower');
    assert.equal(second[i].variant,'sun');
    assert.equal(second[i].code,first[i].code,'sun/flower matching distinction must not be erased');
    assert.equal(second[i].name,first[i].name);
  }
});
test('classic artwork is visual only and has no move or remote data authority',()=>{
  const module=text('docs/mahjong-classic-tiles.mjs');
  assert.match(module,/document\.createElement\('span'\)/);
  assert.match(module,/aria-hidden/);
  assert.doesNotMatch(module,/\.rpc\(|fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/);
  assert.match(module,/if\(!enabled\|\|typeof window==='undefined'\)return/,'no autoplay when sound is off');
});
test('classic, family, sound and free-tile preferences are local and accessible',()=>{
  const game=text('docs/commons-mahjong.mjs');
  const html=text('docs/community.html');
  const css=text('docs/mahjong-classic.css');
  for(const id of ['mahjong-tileset','mahjong-sound','mahjong-show-free',
   'mahjong-free-count','mahjong-session-time'])
    assert.ok(game.includes(id),id);
  for(const control of ["h:'mahjong-hint'","u:'mahjong-undo'","s:'mahjong-shuffle'","p:'mahjong-pause'"])
    assert.ok(game.includes(control),control);
  assert.match(game,/showPrefs\(\)/);
  assert.match(game,/JSON\.parse\(window\.localStorage/);
  assert.match(game,/aria-pressed/);
  assert.match(game,/addClassicTileArtwork\(b,t\.s\)/);
  assert.match(game,/countLegalPairs\(runState\.tiles\|\|\[\]\)/);
  assert.match(game,/syncSessionClock\(\)/);
  assert.match(game,/clockTimer=setInterval/);
  assert.match(game,/clearInterval\(clockTimer\)/);
  assert.match(css,/data-tileset="classic"/);
  assert.match(css,/data-highlight-free="true"/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/min-height:44px/);
  assert.match(html,/mahjong-classic\.css\?v=classic1/);
  assert.match(html,/commons-mahjong\.mjs\?v=keyboard1-classic1/);
});
test('Mahjong score, accounts and campaign remain under server validation',()=>{
  const game=text('docs/commons-mahjong.mjs');
  for(const rpc of ['community_mahjong_start','community_mahjong_state','community_mahjong_pair',
    'community_mahjong_hint','community_mahjong_shuffle','community_mahjong_undo','community_mahjong_pause'])
      assert.ok(game.includes(rpc),rpc);
  assert.match(game,/if\(result\)celebratePair\(point\)/);
  assert.match(game,/const canPlay=t=>/);
  assert.match(game,/if\(!canPlay\(t\)\)/);
  assert.match(game,/if\(first\.s!==t\.s\)/);
  assert.match(game,/This version keeps its existing 72-tile/);
});
