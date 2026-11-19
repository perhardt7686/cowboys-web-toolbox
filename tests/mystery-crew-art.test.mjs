import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {CREW_OPTIONS,CREW_ANCHORS,crewHeadMarkup,crewHeadPreviewSVG,normalizeCrewArt} from '../docs/mystery-crew-art.mjs';
import {mysteryCrewPortraitSVG} from '../docs/mystery-crew-portrait.mjs';
const read=path=>readFileSync(fileURLToPath(new URL('../'+path,import.meta.url)),'utf8');

test('the approved reference anchors are diverse, reproducible, and share geometry across stage/portrait',()=>{
 assert.equal(CREW_ANCHORS.length,6);
 assert.equal(new Set(CREW_ANCHORS.map(x=>x.faceShape)).size,6);
 assert.equal(new Set(CREW_ANCHORS.map(x=>x.hairStyle)).size,6);
 const heads=CREW_ANCHORS.map(x=>crewHeadMarkup(x));
 assert.equal(new Set(heads).size,6);
 for(let i=0;i<heads.length;i++){
  assert.match(heads[i],/<path/);
  assert.match(crewHeadPreviewSVG(CREW_ANCHORS[i]),/viewBox="0 0 192 190"/);
  assert.ok(mysteryCrewPortraitSVG(CREW_ANCHORS[i]).includes(heads[i]),
    'Main head must match forum portrait head, not become a generic replacement');
 }
});

test('face, hair, eyes, expressions, detail controls render different original geometry',()=>{
 for(const [key,choices] of Object.entries(CREW_OPTIONS)){
  const variants=choices.map(value=>crewHeadMarkup({[key]:value}));
  assert.equal(new Set(variants).size,variants.length,key+' must produce genuinely different art');
 }
});

test('malformed colors and SVG/HTML injection are replaced by safe fallbacks',()=>{
 const injected=crewHeadMarkup({skin:'"><script>alert(1)</script>',hair:'url(https://evil)',
    faceShape:'<img onerror=alert(1)>',hairStyle:'onclick=',detail:'<script>'});
 assert.doesNotMatch(injected,/onclick|<script>|url\(/);
 assert.match(injected,/#f0b989/);
 assert.match(injected,/#904b28/);
 assert.deepEqual(normalizeCrewArt({}).faceShape,'oval');
 const portrait=mysteryCrewPortraitSVG({shirt:'<svg onclick="evil">',hair:'#aabbcc'});
 assert.doesNotMatch(portrait,/onclick|<svg onclick/);
 assert.match(portrait,/#ef792f/);
});

test('one-window source-fidelity workspace exposes all trait controls and paged gallery',()=>{
 const html=read('docs/mystery-crew-creator.html');
 const css=read('docs/mystery-crew-creator.css');
 const js=read('docs/mystery-crew-creator.mjs');
 const sql=read('supabase/migrations/20261119023000_mystery_crew_fidelity_traits.sql');
 for(const value of ['faces','haircuts','eyes','expressions','details'])
  assert.match(html,new RegExp('value="'+value+'"'));
 assert.match(html,/id="mc-fidelity-head"/);
 assert.match(html,/id="mc-page-prev"/);
 assert.match(html,/id="mc-page-next"/);
 assert.match(css,/height:100dvh/);
 assert.match(css,/overflow:hidden/);
 assert.match(css,/\.mc-pages/);
 assert.match(js,/traitCategories/);
 assert.match(js,/crewHeadMarkup/);
 assert.match(js,/community_mystery_crew_save/);
 assert.match(sql,/community_mystery_crew_save/);
 assert.match(sql,/coalesce\(item->>'faceShape','oval'\)/);
 assert.match(sql,/coalesce\(item->>'hairStyle','tousled'\)/);
 assert.match(sql,/coalesce\(item->>'eyeShape','bright'\)/);
 assert.match(sql,/coalesce\(item->>'detail','none'\)/);
 assert.match(sql,/p_expected is distinct from saved\.revision/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/revoke all on function public\.community_mystery_crew_save/);
 assert.doesNotMatch(sql,/drop table|delete from community_private/i);
});
