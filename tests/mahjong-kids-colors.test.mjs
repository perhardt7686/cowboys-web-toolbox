import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAHJONG_VISUALS,visualForTile} from '../docs/mahjong-kids-palette.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const luminance=h=>{
 const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255)
  .map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
 return .2126*v[0]+.7152*v[1]+.0722*v[2];
};
const contrast=(a,b)=>{
 const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);
 return (hi+.05)/(lo+.05);
};
test('all 18 Mahjong pictures have distinct backgrounds, match codes and readable ink',()=>{
 assert.equal(MAHJONG_VISUALS.length,18);
 assert.equal(new Set(MAHJONG_VISUALS.map(x=>x.face)).size,18);
 assert.equal(new Set(MAHJONG_VISUALS.map(x=>x.code)).size,18);
 for(const v of MAHJONG_VISUALS){
  assert.match(v.code,/^[A-Z]{2}$/);
  for(const f of ['face','edge','ink'])assert.match(v[f],/^#[a-f0-9]{6}$/i);
  assert.ok(contrast(v.face,v.ink)>=4.5,v.code+' contrast '+contrast(v.face,v.ink));
 }
});
test('sun and flower variants retain tile identity but have distinct corner marks',()=>{
 for(let i=1;i<=18;i++){
  const flower=visualForTile(i),sun=visualForTile(i+18);
  assert.equal(flower.code,sun.code);
  assert.equal(flower.face,sun.face);
  assert.equal(flower.variant,'flower');
  assert.equal(sun.variant,'sun');
  assert.notEqual(flower.marker,sun.marker);
 }
});
test('server-side matching remains in control and codes are announced to users',()=>{
 const m=read('docs/commons-mahjong.mjs');
 const h=read('docs/community.html');
 assert.match(m,/visualForTile\(t\.s\)/);
 assert.match(m,/mahjong-match-code/);
 assert.match(m,/mahjong-variant-/);
 assert.match(m,/code '\+visual\.code/);
 assert.match(m,/community_mahjong_pair/);
 assert.match(m,/\.then\(result=>\{if\(result\)celebratePair\(point\);\}\)/);
 assert.match(h,/mahjong-kids-colors\.css\?v=kid7/);
 assert.match(h,/commons-mahjong\.mjs\?v=kid7/);
});
test('motion follows interactions only and honors reduced-motion settings',()=>{
 const c=read('docs/mahjong-kids-colors.css');
 for(const word of ['mahjong-kid-pop','mahjong-kid-glint','mahjong-kid-hint',
 'mahjong-kid-match','mahjong-blocked','mahjong-match-code',
 'prefers-reduced-motion','animation:none!important']){
   assert.ok(c.includes(word),word);
 }
});
