import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {mysteryCrewPortrait,crewCharacter,STARTER_CREW} from '../docs/mystery-crew-portrait.mjs';
const read=path=>readFileSync(fileURLToPath(new URL('../'+path,import.meta.url)),'utf8');

test('all six new starter characters are represented by one portrait renderer',()=>{
 const defaultPortrait=mysteryCrewPortrait(null);
 assert.match(defaultPortrait,/mystery-crew-portrait/);
 assert.match(defaultPortrait,/#f0b989/);
 assert.match(defaultPortrait,/#904b28/);
 assert.match(defaultPortrait,/#ef792f/);
 assert.equal(crewCharacter(null),STARTER_CREW);
});
test('creator profile image is never interpreted as executable HTML',()=>{
 const forged={active:'crew-1',crew:[{id:'crew-1',shirt:'red" onload="alert(1)',skin:'<script>',hair:'url(javascript:alert(1))'}]};
 const portrait=mysteryCrewPortrait(forged);
 assert.doesNotMatch(portrait,/<script|onload=|javascript:/);
 assert.match(portrait,/#f0b989/);
});
test('new profile renderer uses Mystery Crew portraits and not old character/photo data',()=>{
 const code=read('docs/community-profiles.mjs');
 assert.match(code,/if\(!ctx\.isPreview\)return mysteryCrewPortrait\(crewStates\.get/);
 assert.match(code,/community_mystery_crews/);
 assert.match(code,/await loadCrews\(unique\)/);
 assert.match(code,/await loadCrews\(\[p\.user_id\]\)/);
 assert.match(code,/crewStates\.clear\(\)/);
});
test('family auth config and own row RLS are required in cloud creator',()=>{
 const sync=read('docs/mystery-crew-sync.mjs');
 const app=read('docs/mystery-crew-creator.mjs');
 const html=read('docs/mystery-crew-creator.html');
 assert.match(sync,/mysteryAccount/);
 assert.match(sync,/community_members/);
 assert.match(sync,/status!=='approved'/);
 assert.match(sync,/community_mystery_crews/);
 assert.match(sync,/\.eq\('user_id',userId\)/);
 assert.match(html,/src="community-config\.js/);
 assert.match(app,/mysteryLoad\(\)\.then\(remote/);
 assert.match(app,/await mysterySave\(cloud\.client,cloud\.userId,draft\)/);
 assert.match(app,/const preview=isLocalDemo\(\)/);
 assert.match(app,/ready=preview/);
 assert.doesNotMatch(app,/no shared account sync yet|device-only workshop coins/);
});
test('database grants never allow changing server-owned approval status',()=>{
 const migration=read('supabase/migrations/20261118195000_mystery_crew_family_visibility.sql');
 const schema=read('supabase/migrations/20261118194500_mystery_crew_account_sync.sql');
 assert.match(schema,/alter table public\.community_mystery_crews enable row level security/);
 assert.match(schema,/user_id=\(select auth\.uid\(\)\)/);
 assert.match(migration,/grant insert\(user_id,state\),update\(state,updated_at\)/);
 assert.doesNotMatch(migration,/update\(.*approved/);
 assert.match(migration,/actor\.user_id=\(select auth\.uid\(\)\)/);
 assert.match(migration,/set approved=false/);
});
