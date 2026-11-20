/* Edward: AI-labeled, localhost-only, in-memory test persona.
 * NOT a Supabase Auth user, owner or real moderator. Never grants permissions.
 * For verifying sample forum controls, game artwork and fair-play rules safely.
 */
export const EDWARD_PREVIEW_ID='edededed-eded-4ded-8ded-edededededed';
export const EDWARD_PREVIEW_NAME='Edward (AI Test)';
export const EDWARD_PREVIEW_EMAIL_NOTE='No mailbox, password or live credentials';
export const EDWARD_PREVIEW_SCOPES=Object.freeze(['feedback']);
export const EDWARD_FAIR_PLAY=Object.freeze({
  game:'Mahjong',
  useOnlyVisibleFreePairs:true,
  noDirectDatabaseMoves:true,
  noFreeCurrencyOrUnlocks:true,
  noFalsifiedWins:true,
  leaderboardInProduction:false,
  discloseAutomation:true
});
export function isEdwardTestPreview({hostname='',search=''}={}){
  if(!['localhost','127.0.0.1'].includes(String(hostname).toLowerCase()))return false;
  const params=new URLSearchParams(search);
  return params.get('preview')==='1'&&params.get('role')==='edward';
}
export function edwardTestMember(){
  return {user_id:EDWARD_PREVIEW_ID,display_name:EDWARD_PREVIEW_NAME,
    role:'member',status:'approved',test_persona:true,automated:true};
}
export function edwardTestRank(){
  return {role_id:'moderator',scopes:[...EDWARD_PREVIEW_SCOPES],
    revision:1,expires_at:null,test_preview_only:true};
}
