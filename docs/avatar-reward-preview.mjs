import {CATALOG,GROUPS,GAME_LABELS} from './avatar-reward-catalog.mjs?v=workshop1';

import {STUDIO_EDITION} from './avatar-collection-edition.mjs';

export function makePreviewRewardRPC(){
  let loadout=null,active=false,revision=0;
  const outfits=new Map(),seen=new Set(),pets=new Map();
  const tiers=['starter','starter','bronze','bronze','silver','gold','legendary'];
  const completed=['mahjong-first-board','quest-first-clue','studio-welcome','studio-refit'];
  const achievements=Object.entries(GROUPS).flatMap(([group,ids])=>ids.map((id,index)=>{
    const name=id.replace(/(^|-)([a-z])/g,(_,space,letter)=>(space?' ':'')+letter.toUpperCase());
    const games=group==='cross'?['mahjong','hotrod']:group==='family'?['wordle','wordquest']:group==='plates'?['plates','mahjong']:[group];
    const targets=games.map(game=>({game,label:'Sample '+GAME_LABELS[game]+' objective',target:index+1,current:completed.includes(id)?index+1:0}));
    return {id,name,tier:group==='family'?'family':tiers[index],group,match:group==='plates'?'any':'all',requirements:targets,earned_at:completed.includes(id)?'2026-11-14T12:00:00Z':null};
  }));
  achievements.push(
    {id:'studio-welcome',name:'Open the Workshop',group:'family',tier:'starter',match:'all',
      requirements:[],earned_at:'2026-11-14T12:00:00Z'},
    {id:'studio-refit',name:'Backlot Detectives',group:'wordquest',tier:'starter',match:'all',
      requirements:[{game:'wordquest',label:'Days with a Word Quest clue',target:1,current:1}],
      earned_at:'2026-11-14T12:00:00Z'}
  );
  const owned=new Set(CATALOG.filter(item=>completed.includes(item.achievement_id)).map(item=>item.id));
  for(const item of CATALOG)if(item.id.startsWith('studio-'))seen.add(item.id);
  const validate=value=>{
    if (Object.values(value?.cosmetics||{}).some(id=>!owned.has(id)))throw new Error('Earn each cosmetic before saving.');
  };
  return async function rpc(name,args={}){
    if(name==='community_avatar_reward_state')return {
      loadout,active,revision,catalog_version:STUDIO_EDITION,outfits:[...outfits.values()],achievements,catalog:CATALOG,plate_access:false,
      earned:[...owned].map(id=>({id,awarded_at:'2026-11-14T12:00:00Z',seen:seen.has(id)}))
    };
    if(name==='community_avatar_pet_state')return [...pets.values()];
    if(name==='community_avatar_pet_action'){
      const id=args.p_cosmetic;
      const item=CATALOG.find(candidate=>candidate.id===id&&candidate.slot==='companion');
      if(!item||!owned.has(id))throw new Error('Earn this pet before adopting it');
      let pet=pets.get(id);
      if(args.p_action==='adopt'){
        pet ||= {cosmetic_id:id,name:item.name,bond:0,revision:1};
      }else{
        if(!pet||pet.revision!==args.p_revision)throw Object.assign(new Error('Pet changed.'),{code:'40001'});
        if(args.p_action==='trick'&&pet.bond<6)throw new Error('Build your bond to teach this trick');
        if(args.p_action==='rename'){
          if(!args.p_name?.trim()||args.p_name.length>30)throw new Error('Enter a pet name');
          pet={...pet,name:args.p_name.trim(),revision:pet.revision+1};
        }else{
          pet={...pet,bond:Math.min(12,pet.bond+(args.p_action==='play'?2:1)),revision:pet.revision+1};
        }
      }
      pets.set(id,pet);
      return pet;
    }
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
