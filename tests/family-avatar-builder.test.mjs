import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeAvatarRecipe,isValidAvatarRecipe,DEFAULT_AVATAR_RECIPE,AVATAR_OPTIONS,randomAvatarRecipe,makeAvatarStudioHTML} from '../docs/family-avatar-builder.mjs';
test('avatar recipe is whitelisted, deterministic, and safe for children to customize',()=>{
 const recipe=normalizeAvatarRecipe({skin:'deep',eyes:'green',style:'curly',hair:'purple',shirt:'teal',background:'mint',accessory:'glasses'});
 assert.ok(isValidAvatarRecipe(recipe));
 assert.equal(recipe.skin,'deep');
 assert.deepEqual(normalizeAvatarRecipe({skin:'<script>',not_allowed:'abc'}).skin,DEFAULT_AVATAR_RECIPE.skin);
 assert.equal(isValidAvatarRecipe({...recipe,extra:'secret'}),false);
 assert.equal(isValidAvatarRecipe({...recipe,skin:'javascript:alert(1)'}),false);
 assert.equal(isValidAvatarRecipe({...recipe,eyes:42}),false);
 const html=makeAvatarStudioHTML(recipe);
 assert.match(html,/family-avatar-canvas/);
 for(const k of Object.keys(AVATAR_OPTIONS))assert.match(html,new RegExp('data-avatar-feature="'+k+'"'));
 assert.ok(isValidAvatarRecipe(randomAvatarRecipe(()=>0)));
 assert.ok(isValidAvatarRecipe(randomAvatarRecipe(()=>.9999)));
});
