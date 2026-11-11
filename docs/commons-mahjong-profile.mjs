/* Adds server-backed Mahjong achievements to existing Commons profile dialogs. */
const MEDALS=[
 ['first_pair','First Match','Clear your first pair','✦'],
 ['ten_pairs','Quick Fingers','Clear 10 pairs','⚡'],
 ['fifty_pairs','Tile Tracker','Clear 50 pairs','✿'],
 ['century','Century Club','Clear 100 pairs','♛'],
 ['first_win','First Victory','Win a Mahjong game','🏆'],
 ['triple_crown','Triple Crown','Win three games','♕'],
 ['ten_wins','Grand Master','Win ten games','✧'],
 ['unassisted','Sharp Eyes','Win without using help','👁'],
 ['speedster','Lightning Round','Win in less than 3 minutes','⚡'],
 ['five_thousand','High Roller','Score 5,000 in a game','★']
];
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const stat=x=>Number(x||0).toLocaleString('en-US');
export async function showAchievements(ctx,userId){
 if(ctx.isPreview||!ctx.client()||!userId)return;
 const content=document.getElementById('dialog-content');if(!content)return;
 content.dataset.mahjongProfileRequest=userId;
 const {data,error}=await ctx.client().rpc('community_mahjong_profile',{p_user_id:userId});
 if(error||!data||!content.isConnected||content.dataset.mahjongProfileRequest!==userId||!document.getElementById('content-dialog')?.open)return;
 // Don't attach one member's awards to a dialog that was replaced during the request.
 const current=content.querySelector('.member-card,.profile-studio');if(!current)return;
 content.querySelectorAll('.mahjong-profile-achievements').forEach(x=>x.remove());
 const section=el('section','mahjong-profile-achievements');section.id='mahjong-profile-achievements';
 section.append(el('h3','','🀄 Mystery Machine Mahjong'));
 section.append(el('p','','Achievements earned in The Commons. Badges are unlocked automatically as you play.'));
 const numbers=el('div','mahjong-profile-numbers');
 for(const [name,v] of [['Best game',data.best_score],['All-time points',data.all_time_points],['Wins',data.wins]])numbers.append(el('span','',name+': '+stat(v)));
 section.append(numbers);
 const unlocked=new Set((data.badges||[]).map(b=>b.code));
 const grid=el('div','mahjong-profile-grid');
 for(const [code,name,detail,icon] of MEDALS){const box=el('div','mahjong-badge '+(unlocked.has(code)?'earned':'locked'));
 box.append(el('span','mahjong-badge-symbol',unlocked.has(code)?icon:'♙'));
 const copy=el('span','mahjong-badge-copy');copy.append(el('strong','',name),el('small','',unlocked.has(code)?'Unlocked · '+detail:'Locked · '+detail));box.append(copy);grid.append(box);}
 section.append(grid);
 if(current.classList.contains('profile-studio')){const aside=current.querySelector('.studio-preview');if(aside)aside.append(section);else content.append(section);}
 else content.append(section);
}
