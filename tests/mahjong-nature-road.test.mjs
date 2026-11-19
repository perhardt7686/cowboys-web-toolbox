import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MYSTERY_ROAD_TOTAL,ROAD_REGION_SIZE,ROAD_REGIONS,ROAD_ENCOUNTERS,
 clampRoadLevel,roadRegion,roadRegionIndex,roadEncounter,roadProgress,roadWindow}
 from '../docs/mahjong-nature-road.mjs';
const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function luminance(hex){const v=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));return v[0]*.2126+v[1]*.7152+v[2]*.0722;}
function contrast(a,b){const [h,l]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (h+.05)/(l+.05);}

test('exactly 5,000 stages form twenty uniquely named botanically contrasting regions',()=>{
 assert.equal(MYSTERY_ROAD_TOTAL,5000);
 assert.equal(ROAD_REGION_SIZE,250);
 assert.equal(ROAD_REGIONS.length,20);
 assert.equal(new Set(ROAD_REGIONS.map(x=>x.name)).size,20);
 assert.equal(new Set(ROAD_REGIONS.map(x=>x.sky+'-'+x.land)).size,20);
 assert.equal(new Set(ROAD_REGIONS.map(x=>x.flora)).size,20);
 assert.ok(ROAD_REGIONS.every(x=>x.fauna&&x.flora&&x.icon&&x.flower));
 assert.equal(roadRegion(1).name,'Daisy Lane');
 assert.equal(roadRegion(250).name,'Daisy Lane');
 assert.equal(roadRegion(251).name,'Buttercup Fields');
 assert.equal(roadRegion(1001).name,'Lavender Vale');
 assert.equal(roadRegion(5000).name,'Evergreen Sanctuary');
 assert.equal(roadRegionIndex(5000),19);
 assert.equal(clampRoadLevel(0),1);
 assert.equal(clampRoadLevel(5001),5000);
 for(const region of ROAD_REGIONS)
  assert.ok(contrast(region.sky,region.ink)>=4.5,region.name+' header contrast');
});

test('garden paths, chapters, milestones, crown, speed and quiet phases vary',()=>{
 assert.equal(roadProgress(0).percent,0);
 assert.equal(roadProgress(1000).percent,20);
 assert.equal(roadProgress(2500).percent,50);
 assert.equal(roadProgress(5000).percent,100);
 assert.equal(roadProgress(5000).nextGate,5000);
 assert.equal(roadWindow(1).length,25);
 assert.deepEqual([roadWindow(1)[0],roadWindow(1).at(-1)],[1,25]);
 assert.deepEqual([roadWindow(5000)[0],roadWindow(5000).at(-1)],[4976,5000]);
 assert.equal(roadEncounter(25).kind,'milestone');
 assert.equal(roadEncounter(50).kind,'milestone');
 assert.equal(roadEncounter(250).kind,'gate');
 assert.equal(roadEncounter(5000).kind,'crown');
 assert.ok(new Set(Array.from({length:120},(_,i)=>roadEncounter(1001+i).kind)).size>=8);
 assert.equal(ROAD_ENCOUNTERS.length,8);
});

test('map shows only server-authoritative current playable stage and keeps locked previews read-only',()=>{
 const source=src('docs/mahjong-nature-road.mjs');
 const page=src('docs/commons-mahjong.mjs');
 assert.match(source,/focusLevel!==snapshot.level/);
 assert.match(source,/play.disabled=!isCurrent/);
 assert.match(source,/Preview only: finish earlier levels first/);
 assert.doesNotMatch(source,/\.rpc\(|localStorage|sessionStorage|fetch\(/);
 assert.match(page,/natureRoad\?\.update\(\{level:stage,cleared:cp.cleared,streak:cp.streak,run:runState\}\)/);
 assert.match(page,/mountNatureRoad\(/);
 assert.match(page,/MYSTERY_ROAD_TOTAL/);
 assert.match(page,/max="5000"/);
 assert.match(page,/onPlay:\(\)=>\{/);
});

test('safe additive database migration extends level constraints, reward milestones and existing security guard',()=>{
 const sql=src('supabase/migrations/20261119214423_mahjong_mystery_road_5000.sql');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public.community_mahjong_level_rules/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public.community_mahjong_advance/);
 assert.match(sql,/least\(5000,greatest\(1,coalesce\(p_level,1\)\)\)/);
 assert.match(sql,/'total_levels',5000/);
 assert.match(sql,/level between 1 and 5000/);
 assert.match(sql,/levels_cleared between 0 and 5000/);
 assert.match(sql,/campaign_5000/);
 assert.match(sql,/community_mahjong_allowed\(\)/);
 assert.match(sql,/auth\.uid\(\) is distinct from p_user/);
 assert.match(sql,/if c.level=5000 and c.levels_cleared>=5000/);
 assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE TABLE|DELETE FROM public\.community_mahjong|CREATE POLICY/);
 assert.doesNotMatch(sql,/service_role|auth\.jwt\(\)\s*->\s*'user_metadata'/i);
});

test('mobile-first map has accessible colors, no art dependency or forced motion',()=>{
 const css=src('docs/mahjong-nature-road.css');
 const html=src('docs/community.html');
 const profile=src('docs/commons-mahjong-profile.mjs');
 for(const str of ['prefers-reduced-motion:reduce','data-state=current','nature-road-node','aria-pressed'])
  assert.ok((css+src('docs/mahjong-nature-road.mjs')).includes(str),str);
 assert.match(css,/nature-current-pulse/);
 assert.match(css,/\.nature-road-region-button/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/max-height:100%!important/);
 assert.match(html,/mahjong-nature-road\.css\?v=nature1/);
 assert.match(profile,/progress\.max=5000/);
 assert.match(profile,/campaign_5000/);
});
