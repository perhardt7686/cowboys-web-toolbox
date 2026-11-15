import {WEARABLES} from './avatar-cosmetic-wearables.mjs?v=cel1';
import {WORLDS} from './avatar-cosmetic-worlds.mjs?v=cel1';
import {MYSTERY_EXTRAS} from './avatar-mystery-extras.mjs?v=mystery2';
import {ARCADE_REWARDS} from './avatar-arcade-rewards.mjs?v=arcade6';

export const GAME_LABELS=Object.freeze({
  mahjong:'Mahjong',wordle:'w0rdle',wordquest:'Word Quest',plates:'License Plates',hotrod:'Hot Rod',
  fleet:'Star Squadron',maze:'Mystery Maze',dashforge:'Dash Forge',
  cross:'Across games',family:'Family Specials'
});
export const GROUPS=Object.freeze({
  fleet:['fleet-first-flight','fleet-scout','fleet-ace','fleet-regular','fleet-gunner','fleet-veteran','fleet-command'],
  maze:['maze-first-clue','maze-sleuth','maze-tracker','maze-explorer','maze-shadow','maze-labyrinth','maze-master'],
  dashforge:['dash-first-clear','dash-five-levels','dash-twentyfive','dash-first-boss','dash-first-designer','dash-century','dash-legend'],
  mahjong:['mahjong-first-board','mahjong-level-three','mahjong-five-wins','mahjong-tilesmith','mahjong-five-stages','mahjong-ten-stages','mahjong-stargazer'],
  wordle:['wordle-first-clue','wordle-score-25','wordle-first-solve','wordle-three-days','wordle-score-75','wordle-team-three','wordle-streak-four'],
  wordquest:['quest-first-clue','quest-xp-50','quest-first-solve','quest-three-team-days','quest-xp-200','quest-xp-400','quest-master'],
  plates:['plates-first-approval','plates-two-approvals','plates-three-approvals','plates-four-approvals','plates-five-approvals','plates-seven-approvals','plates-ten-approvals'],
  hotrod:['hotrod-first-run','hotrod-first-drag','hotrod-first-road','hotrod-points-25','hotrod-five-wins','hotrod-classic-crown','hotrod-mystery-trophy'],
  cross:['cross-double-play','cross-shop-class','cross-letter-circuit','cross-three-games','cross-track-and-tiles','cross-game-room','cross-arcade-legend'],
  family:['family-first-word','family-quest-crew','family-friendly-run','family-two-word-games','family-puzzle-party','family-garage-rivals','family-all-star-crew']
});
export const SLOT_LABELS=Object.freeze({hat:'Hats',eyewear:'Glasses & masks',hair:'Hair',eyes:'Eyes & face',
  prop:'Props',companion:'Pets',background:'Backgrounds',effect:'Effects'});
export const RARITIES=Object.freeze({starter:'Starter',bronze:'Bronze',silver:'Silver',gold:'Gold',legendary:'Legendary',family:'Family Special'});
const special={
  'dragon-crown':'mahjong-ten-stages','giant-taco-hat':'mahjong-first-board','rubber-chicken-helmet':'quest-first-clue',
  'viking-battle-helmet':'hotrod-first-drag','golden-crocodile-crown':'family-all-star-crew',
  'aurora-crown':'cross-arcade-legend','rainbow-lightning-hair':'wordle-first-clue','galaxy-eyes':'wordle-score-75',
  'floating-crocodile':'family-first-word','mini-dragon':'quest-xp-50','galaxy-portal':'cross-track-and-tiles',
  'victory-wings':'hotrod-classic-crown','rainbow-flames':'plates-three-approvals','celestial-armor':'hotrod-mystery-trophy',
  'trail-husky':'quest-first-clue','lantern-raccoon':'hotrod-first-drag'
};
const routes=Object.entries(GROUPS);
const tierNames=['starter','starter','bronze','bronze','silver','gold','legendary'];
const rank=new Map(routes.flatMap(([group,ids])=>ids.map((id,step)=>[id,{group,tier:group==='family'?'family':tierNames[step]}])));
const countBySlot=new Map();

export const CATALOG=Object.freeze([...WEARABLES,...WORLDS,...MYSTERY_EXTRAS,...ARCADE_REWARDS].map(item=>{
  const slotIndex=countBySlot.get(item.slot)||0;
  countBySlot.set(item.slot,slotIndex+1);
  const slotOrdinal=Object.keys(SLOT_LABELS).indexOf(item.slot);
  const [,track]=routes[(slotOrdinal*2+slotIndex)%routes.length];
  const round=Math.floor(slotIndex/routes.length);
  const id=item.achievement_id||special[item.id]||track[(round+(slotIndex%routes.length)*3+slotOrdinal)%track.length];
  return Object.freeze({...item,achievement_id:id,...rank.get(id),tags:Object.freeze(item.tags||[])});
}));
export const BY_ID=new Map(CATALOG.map(item=>[item.id,item]));
export const SHOWCASE=Object.freeze(['dragon-crown','rainbow-lightning-hair','floating-crocodile','rubber-chicken-helmet','galaxy-eyes','boss-dragonlet','wisp-pup']);
