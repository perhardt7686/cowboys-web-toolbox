import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REGION_MAP_MOTIFS} from '../docs/mahjong-region-picture.mjs';
import {ROAD_REGIONS,roadTrailKeepsake,roadKeepsakes} from '../docs/mahjong-nature-road.mjs';
import {roadVisitDue,roadVictoryMessage} from '../docs/mahjong-road-invitations.mjs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('20 independent pictured gardens and coherent contrasting botanical themes',()=>{
 assert.equal(REGION_MAP_MOTIFS.length,20);
 assert.equal(new Set(REGION_MAP_MOTIFS.map(x=>x.join(' | '))).size,20);
 assert.equal(ROAD_REGIONS.length,20);
 assert(REGION_MAP_MOTIFS.every(x=>x.length===4&&x.every(Boolean)));
 const picture=src('docs/mahjong-region-picture.mjs');
 assert.match(picture,/illustratedRegionMap\(index,region\)/);
 assert.match(picture,/aria-label.*illustrated area map/);
 assert.match(picture,/nature-region-illustration/);
 assert.doesNotMatch(picture,/fetch\(|XMLHttpRequest|localStorage|supabase|indexedDB/);
});
test('glowing server-authoritative trail earns visual keepsakes but no invented currency',()=>{
 assert.deepEqual(roadTrailKeepsake(5),{icon:'✦',name:'Trail Star',description:'Complete five garden steps'});
 assert.equal(roadTrailKeepsake(25).name,'Bloom Arch');
 assert.equal(roadTrailKeepsake(50).name,'Golden Bloom');
 assert.equal(roadTrailKeepsake(250).name,'Garden Gate');
 assert.equal(roadKeepsakes(0).earned,0);
 assert.equal(roadKeepsakes(4).next.level,5);
 assert.equal(roadKeepsakes(5).earned,1);
 assert.equal(roadKeepsakes(25).last.name,'Bloom Arch');
 assert.equal(roadKeepsakes(5000).earned,1000);
 assert.equal(roadKeepsakes(5000).next,null);
 const srcMap=src('docs/mahjong-nature-road.mjs');
 for(const fragment of ['#nature-road-trail-lit','#nature-road-picture-host',
      '#nature-road-area-select','data-picture','roadKeepsakes(progress.cleared)'])
  assert(srcMap.includes(fragment),fragment);
 assert.match(srcMap,/glowing=points\.filter\(p=>p\.n<=snapshot\.cleared\|\|p\.n===snapshot\.level\)/);
 assert.doesNotMatch(srcMap,/\.rpc\(|localStorage|sessionStorage|fetch\(/);
});
test('route invitations only after successful server-cleared milestones, never during a board',()=>{
 const win=n=>({event:'won',campaign_event:'advanced',completed_level:n,
  campaign_bonus_earned:250});
 assert.equal(roadVisitDue(win(1)),true);
 assert.equal(roadVisitDue(win(2)),false);
 assert.equal(roadVisitDue(win(4)),false);
 assert.equal(roadVisitDue(win(5)),true);
 assert.equal(roadVisitDue(win(25)),true);
 assert.equal(roadVisitDue(win(250)),true);
 assert.equal(roadVisitDue({...win(5),campaign_event:'retry'}),false);
 assert.equal(roadVisitDue({...win(5),event:'pair'}),false);
 assert.equal(roadVisitDue({...win(5),completed_level:0}),false);
 assert.equal(roadVisitDue({...win(5),completed_level:'invalid'}),false);
 assert.match(roadVictoryMessage(win(5)),/\+250 campaign points/);
 assert.equal(roadVictoryMessage({...win(5),campaign_event:'retry'}),'');
 const game=src('docs/commons-mahjong.mjs');
 assert.match(game,/if\(roadVisitDue\(data\)\)inviteToMysteryRoad\(data\)/);
 assert.match(game,/if\(document\.hidden\|\|!mounted\|\|busy\|\|!expanded/);
 assert.match(game,/dataset\.mahjongMode==='turtle'\|\|state\?\.run/);
 assert.match(game,/arcadeMahjongNavigate\('levels'\)/);
 assert.match(game,/id="mahjong-journey-mini-map" class="mahjong-map-hero-button"/);
});
test('compact fixed arcade map and visible Mystery Road buttons support reduced motion',()=>{
 const css=src('docs/mahjong-nature-road.css');
 assert.match(css,/\.nature-road-picture/);
 assert.match(css,/#nature-road-trail-lit/);
 assert.match(css,/arcade-on\[data-arcade-game=mahjong\]\[data-arcade-scene=levels\]/);
 assert.match(css,/overflow:hidden!important/);
 assert.match(css,/road-map-beacon/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 const tabs=src('docs/mahjong-turtle-ui.mjs');
 assert.match(tabs,/mystery-road-glow-tab/);
});
