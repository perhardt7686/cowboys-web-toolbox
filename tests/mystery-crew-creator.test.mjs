import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const read=name=>readFileSync(fileURLToPath(new URL('../docs/'+name,import.meta.url)),'utf8');
test('approved reference and exact name are immutable source requirements',()=>{
 const html=read('mystery-crew-creator.html'),doc=read('mystery-crew-creator-reference.md');
 assert.match(html,/<title>Mystery Crew Creator/);
 assert.match(html,/id="mc-roster"/);
 assert.match(html,/id="mc-scene"/);
 assert.match(html,/id="mc-cards"/);
 assert.match(html,/id="mc-swatch/);
 assert.match(html,/data-view="collections"/);
 assert.match(doc,/1672 × 941/);
 assert.match(doc,/4ad4fd88ddb53e5e7d9fd94aaa8739951b7fc393b5bbd62494b8385873bf8f7d/);
 assert.doesNotMatch(html,/<h3[^>]*>Dressing room|data-v8-mode|avatar-reward-tabs/);
});
test('real member launcher is redirected without rewriting the family-account API',()=>{
 const src=read('community-profiles.mjs');
 assert.match(src,/if\(requested==='avatar'&&!ctx\.isPreview&&approved\(\)\)/);
 assert.match(src,/if\(b\.dataset\.profileTab==='avatar'&&!ctx\.isPreview&&approved\(\)\)/);
 assert.match(src,/mystery-crew-creator\.html/);
 assert.match(src,/if\(!approved\(\)\)throw new Error/);
});
test('live creator uses server-synced family records, with local-only test fixtures',()=>{
 const src=read('mystery-crew-creator.mjs');
 assert.match(src,/localStorage\.getItem\(KEY\)/);
 assert.match(src,/localStorage\.setItem\(KEY,/);
 assert.match(src,/coins:\s*60/);
 assert.match(src,/draft\.coins-=item\.cost/);
 assert.match(src,/document\.addEventListener\('click'/);
 assert.match(src,/case 'mc-save'/);
 assert.match(src,/app\.dataset\.motion/);
 assert.match(src,/connectMysteryCrew/);
 assert.match(src,/if\(!isPreview\)return fresh\(\)/);
 assert.match(src,/community_mystery_crew_save/);
 assert.match(src,/community_mystery_crew_unlock/);
 assert.match(src,/community_mystery_crew_motion/);
 assert.match(read('mystery-crew-sync.mjs'),/auth:\{/);
 assert.match(read('mystery-crew-sync.mjs'),/createAuthStorage/);
 assert.match(read('mystery-crew-sync.mjs'),/community_mystery_crew_state/);
 assert.doesNotMatch(src,/\bindexedDB\b/);
});
test('responsive and reduced-motion rules keep original creator standalone',()=>{
 const css=read('mystery-crew-creator.css');
 assert.match(css,/max-width:650px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.mc-layout/);
 assert.match(css,/\.mc-card-art/);
 assert.doesNotMatch(css,/avatar-dressing-studio|studio-workspace-dialog/);
});

test('every approved family member gets the new basic character through a protected backend migration',()=>{
 const sql=readFileSync(fileURLToPath(new URL('../supabase/migrations/20261119000712_mystery_crew_creator_accounts.sql',import.meta.url)),'utf8');
 assert.match(sql,/create table if not exists community_private\.mystery_crew_state/);
 assert.match(sql,/insert into community_private\.mystery_crew_state\(member_id\)\s+select user_id from public\.community_members where status='approved'/);
 assert.match(sql,/create trigger mystery_crew_member_bootstrap/);
 assert.match(sql,/returns table \(user_id uuid, crew_character jsonb\)/);
 assert.match(sql,/function public\.community_mystery_crew_save/);
 assert.match(sql,/function public\.community_mystery_crew_unlock/);
 assert.match(sql,/function public\.community_mystery_crew_motion/);
 assert.match(sql,/p_expected is distinct from saved\.revision/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/revoke all on community_private\.mystery_crew_state from anon,authenticated,public/);
 assert.doesNotMatch(sql,/drop table .*avatar|delete from .*avatar_reward/);
});
test('new portraits replace old forum profile pictures without trusting user SVG',async()=>{
 const {mysteryCrewPortraitSVG}=await import('../docs/mystery-crew-portrait.mjs');
 const image=mysteryCrewPortraitSVG({shirt:'<svg onclick="evil">',hair:'#aabbcc'});
 assert.match(image,/<svg xmlns=/);
 assert.doesNotMatch(image,/onclick|<svg onclick/);
 assert.match(image,/#ef792f/);
 const profile=read('community-profiles.mjs');
 assert.match(profile,/mysteryCrewPortraitSVG/);
 assert.match(profile,/community_mystery_crew_portraits/);
 assert.doesNotMatch(profile,/const inspect=p\.avatar_display/);
});
test('new creator page loads same family login and advertises real sync',()=>{
 const html=read('mystery-crew-creator.html');
 assert.match(html,/community-config\.js/);
 assert.match(html,/FAMILY ACCOUNT/);
 assert.match(html,/synced to your approved family account/);
 assert.doesNotMatch(html,/MY DEVICE|● LOCAL|stored only in this browser/);
 const board=read('community.html');
 assert.match(board,/mystery-crew-account\.css/);
});
