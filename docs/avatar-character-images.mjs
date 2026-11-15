// Only committed profile projections enter this image cache. Try-on canvases
// stay inside the editor and are never used for profile, game or score avatars.
const entries=new Map();
let draws=null;
let generation=0;

export function clearAvatarCharacters() {
  generation+=1;
  entries.clear();
}

export async function cacheAvatarCharacter(member,recipe) {
  if (!member||!recipe||typeof recipe!=='object') return null;
  const key=String(member),signature=JSON.stringify(recipe);
  const cached=entries.get(key);
  if(cached?.signature===signature)return cached.promise;
  const record={signature,promise:null};
  const epoch=generation;
  record.promise=(async()=>{
    try {
      draws||=import('./avatar-studio-preview.mjs?v=workshop1').catch(error=>{draws=null;throw error;});
      const {prepareStudioRenderer,studioPortrait,avatarSnapshot}=await draws;
      await prepareStudioRenderer();
      if(epoch!==generation||entries.get(key)!==record)return null;
      return studioPortrait(recipe,96)||avatarSnapshot(recipe,96);
    }catch{
      if(entries.get(key)===record)entries.delete(key);
      return null;
    }
  })();
  entries.set(key,record);
  return record.promise;
}

export function forgetAvatarCharacter(member) {
  if(member)entries.delete(String(member));
}

export async function avatarProjections(client, members) {
  const ids=[...new Set(members.filter(Boolean))].slice(0,100);
  if(!ids.length||typeof client?.rpc!=='function')return new Map();
  try{
    const result=await client.rpc('community_avatar_projections',{p_members:ids});
    if(!result.error&&Array.isArray(result.data))
      return new Map(result.data.map(profile=>[String(profile.user_id),profile.avatar_display]));
  }catch{/* A fixture or offline session may have no projection service. */}
  return new Map();
}
