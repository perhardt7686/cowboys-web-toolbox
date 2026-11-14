import {CATALOG,GROUPS,GAME_LABELS} from './avatar-reward-catalog.mjs?v=reward1';

export function makePreviewRewardRPC(){
  let loadout=null,active=false,revision=0;
  const outfits=new Map(),seen=new Set();
  const tiers=['starter','starter','bronze','bronze','silver','gold','legendary'];
  const completed=['mahjong-first-board','quest-first-clue'];
  const achievements=Object.entries(GROUPS).flatMap(([group,ids])=>ids.map((id,index)=>{
    const name=id.replace(/(^|-)([a-z])/g,(_,space,letter)=>(space?' ':'')+letter.toUpperCase());
    const games=group==='cross'?['mahjong','hotrod']:group==='family'?['wordle','wordquest']:group==='plates'?['plates','mahjong']:[group];
    const targets=games.map(game=>({game,label:'Sample '+GAME_LABELS[game]+' objective',target:index+1,current:completed.includes(id)?index+1:0}));
    return {id,name,tier:group==='family'?'family':tiers[index],group,match:group==='plates'?'any':'all',requirements:targets,earned_at:completed.includes(id)?'2026-11-14T12:00:00Z':null};
  }));
  const owned=new Set(CATALOG.filter(item=>completed.includes(item.achievement_id)).map(item=>item.id));
  const validate=value=>{
    if (Object.values(value?.cosmetics||{}).some(id=>!owned.has(id)))throw new Error('Earn each cosmetic before saving.');
  };
  return async function rpc(name,args={}){
    if(name==='community_avatar_reward_state')return {
      loadout,active,revision,outfits:[...outfits.values()],achievements,catalog:CATALOG,plate_access:false,
      earned:[...owned].map(id=>({id,awarded_at:'2026-11-14T12:00:00Z',seen:seen.has(id)}))
    };
    if(name==='community_avatar_reward_seen'){
      args.p_ids.forEach(id=>seen.add(id));
      return true;
    }
    if(name==='community_avatar_save_outfit'){
      validate(args.p_recipe);
      if(args.p_recipe)outfits.set(args.p_slot,{slot:args.p_slot,name:args.p_name,recipe:args.p_recipe});
      else outfits.delete(args.p_slot);
      return [...outfits.values()];
    }
    if(name==='community_avatar_equip'){
      validate(args.p_recipe);
      loadout=args.p_recipe||loadout||args.p_fallback;
      active=Boolean(args.p_recipe);revision++;
      return {loadout,active,revision,profile:{avatar_display:active?loadout:null}};
    }
    throw new Error('This action is unavailable in the design preview.');
  };
}
