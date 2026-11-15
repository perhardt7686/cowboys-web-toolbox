import {button, el, preference} from './family-board-core.mjs?v=family3';
import {BY_ID, CATALOG, GAME_LABELS, RARITIES, SHOWCASE, SLOT_LABELS} from './avatar-reward-catalog.mjs?v=turn1';
import {avatarSnapshot, normalizeLoadout, playCel, renderLoadout} from './avatar-reward-render.mjs?v=studio2';

import {prizeAction} from './avatar-prize-actions.mjs?v=turn1';
import {createPetStudio} from './avatar-studio-pets.mjs?v=studio2';

import {fitsBody} from './avatar-full-body.mjs?v=studio2';
import {mountTurntable} from './avatar-turntable-controls.mjs?v=studio2';
import {SHOWROOM_LOOKS} from './avatar-showroom-presets.mjs?v=studio2';
import {pickStudioPart,prepareStudioRenderer,releaseStudioArt,studioCharacter,studioLook,studioPrize} from './avatar-studio-preview.mjs?v=studio2';

const PAGE=18;
const labels=Object.entries(GAME_LABELS);
const gameEntries={mahjong:'mahjong-toggle',wordle:'letter-lock-toggle',wordquest:'word-game-toggle',plates:'plate-game-open',hotrod:'hot-rod-entry',fleet:'star-squadron-toggle',maze:'mystery-maze-toggle',dashforge:'dash-forge-toggle'};
const sections=[['avatar','My Avatar'],['collection','Unlockables'],['pets','Pets'],['achievements','Achievements']];
const num=value=>Number(value||0).toLocaleString();
const row=(...children)=>{const n=el('div','avatar-reward-row');n.append(...children);return n;};
const text=label=>el('p','avatar-reward-copy',label);
const asButton=(label,run,kind='')=>{const n=button(label,run);n.className=kind?'avatar-reward-button '+kind:'avatar-reward-button';return n;};

export const rewardById=id=>BY_ID.get(id);
export {avatarSnapshot,normalizeLoadout};

export function rewardRatio(achievement) {
  if(!achievement?.requirements?.length)return 0;
  if(achievement.earned_at)return 1;
  const values=achievement.requirements.map(goal=>Math.max(0,Math.min(1,Number(goal.current)/Math.max(1,Number(goal.target)))));
  return achievement.match==='any'?Math.max(...values):values.reduce((a,b)=>a+b,0)/values.length;
}

function meter(value,max=1,label='Progress'){
  const node=el('progress','avatar-reward-meter');
  node.max=max;node.value=Math.min(max,value);node.setAttribute('aria-label',label);
  return node;
}

function thumbnail(item,size=96){
  const node=el('canvas','avatar-reward-thumbnail');
  node.width=node.height=size;
  node.setAttribute('aria-hidden','true');
  studioPrize(node,item);
  releaseStudioArt(node);
  return node;
}

export function makeAvatarShowcase(open){
  const root=el('details','family-panel avatar-reward-showcase');
  root.open=preference('reward-showcase')!=='closed';
  root.addEventListener('toggle',()=>preference('reward-showcase',root.open?'open':'closed'));
  const summary=el('summary','','Awesome things to unlock');
  const items=el('div','avatar-showcase-items');
  let rendered=false;
  const render=()=>{
    if(!root.open||rendered)return;
    rendered=true;
    for(const id of SHOWCASE){
      const item=BY_ID.get(id);
      if(!item)continue;
      const card=asButton('',()=>open(id),'avatar-showcase-card');
      card.setAttribute('aria-label','See '+item.name);
      card.append(thumbnail(item,64),el('span','',item.name));
      items.append(card);
    }
  };
  root.append(summary,items);
  root.addEventListener('toggle',render);
  render();
  return root;
}

function combobox(label, options, selected, changed){
  const holder=el('label','avatar-reward-filter');
  holder.append(el('span','',label));
  const node=el('select');
  for(const [value,name] of options){const option=el('option','',name);option.value=value;node.append(option);}
  node.value=selected;
  node.addEventListener('change',()=>changed(node.value));
  holder.append(node);
  return holder;
}

function findPlayButton(game){
  const id=gameEntries[game];
  const target=id&&document.getElementById(id);
  return target&&!target.disabled&&target.isConnected&&!target.closest('[hidden]')?target:null;
}

export function openRewardGame(game,onReady,onFailure){
  if(!gameEntries[game])return;
  const target=findPlayButton(game);
  if(target){onReady(target);return;}
  const main=document.querySelector('#conversations .community-main');
  if(!main){onFailure();return;}
  let timer;
  const stop=()=>{observer.disconnect();clearTimeout(timer);};
  const observer=new MutationObserver(()=>{
    const ready=findPlayButton(game);
    if(!ready)return;
    stop();onReady(ready);
  });
  observer.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','hidden']});
  timer=setTimeout(()=>{stop();onFailure();},2500);
  return stop;
}

export function createRewardStudio({getLoadout,setLoadout,setStatus,playGame,rpc,checkAccess,onData,reduceMotion}){
  let root=null,editor=null,pane=null,tabs=null,filters=null,results=null;
  let data=null,achievements=new Map(),owned=new Map(),epoch=0,query='',section='avatar';
  let slot='all',filter='all',game='all',sort='catalog',limit=PAGE,detail=null,loading=false,loadError='';
  let pending=null,frame=0,lastFrame=0,stopDemo=()=>{},stopPreview=()=>{},turntable=null;
  let privateControls=null,layoutWatch=null,viewEvents=null;
  const pendingAcks=new Set();

  function getData(){return data;}
  function current(id){return achievements.get(id);}
  function have(id){return owned.has(id);}
  const contains=()=>root?.isConnected&&checkAccess();
  const catalog=()=>data?.catalog?.length?data.catalog.map(spec=>BY_ID.get(spec.id)).filter(Boolean):CATALOG;

  const reduceAnimation=()=>Boolean(reduceMotion?.()||document.body.classList.contains('forum-reduce-motion'));
  const pets=createPetStudio({
    rpc,catalog,have,unlocksKnown:()=>Boolean(data),checkError:()=>loadError,
    openReward:item=>setSection('collection',item.id),
    tryOn(item){tryOn(item);setSection('avatar');},
    reduceMotion:reduceAnimation,
    onInventoryChange:()=>void refresh(),
    isOpen:()=>contains()&&section==='pets'&&Boolean(pane?.getClientRects().length)
  });

  async function refresh(){
    if(!checkAccess())return null;
    if(pending)return pending;
    const stamp=epoch;
    loading=true;loadError='';
    const run=(async()=>{
      try{
        const fresh=await rpc('community_avatar_reward_state');
        if(stamp!==epoch||!checkAccess())return null;
        data=fresh;
        achievements=new Map((data.achievements||[]).map(item=>[item.id,item]));
        owned=new Map((data.earned||[]).map(item=>[item.id,item]));
        onData?.(data);
        return data;
      }catch(error){
        if(stamp===epoch&&checkAccess())loadError=error.message||'Couldn’t refresh achievements.';
        return null;
      }finally{
        if(stamp===epoch){pending=null;loading=false;if(contains())draw();}
      }
    })();
    pending=run;
    if(contains()&&section!=='avatar'&&!data)renderResults();
    return run;
  }

  function setSection(next, id=null){
    section=sections.some(([key])=>key===next)?next:'avatar';
    detail=id;
    if(section==='pets')pets.showPet(id);
    if(contains()){
      draw();
      if(section==='pets'&&detail){
        requestAnimationFrame(()=>{
          if(contains()&&section==='pets')results?.querySelector('select')?.focus({preventScroll:true});
        });
      }else if(detail)focusDetail();
    }
  }

  function focusDetail(){
    requestAnimationFrame(()=>{if(contains())results?.querySelector('[data-reward-detail-title]')?.focus({preventScroll:true});});
  }

  function tryOn(item){
    const draft=normalizeLoadout(getLoadout());
    if(!fitsBody(draft,item)){
      setStatus(item.name+' fits '+item.families.join(' or ')+' bodies.');
      return false;
    }
    draft.cosmetics[item.slot]=item.id;
    setLoadout(draft);
    setStatus(have(item.id)?item.name+' is ready to save.':item.name+' is on your preview. Earn it to save it.');
    drawEquipped();
    paintPreview();
    return true;
  }

  function forget(item){
    const draft=normalizeLoadout(getLoadout());
    delete draft.cosmetics[item.slot];
    setLoadout(draft);
    setStatus('Removed '+item.name+' from the preview.');
    drawEquipped();paintPreview();
  }

  function paintPreview(){
    if(!contains()||!turntable)return;
    stopPreview();cancelAnimationFrame(frame);
    turntable.draw();
    const draft=normalizeLoadout(getLoadout());
    const animate=Object.values(draft.cosmetics).some(id=>BY_ID.get(id)?.animated)&&!document.hidden&&
      !reduceAnimation()&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!animate)return;
    lastFrame=0;
    const loop=now=>{
      if(!contains()||!turntable?.canvas.getClientRects().length||document.hidden||
        !root.closest('dialog')?.open)return;
      if(now-lastFrame>105){lastFrame=now;turntable.draw(now/1000);}
      frame=requestAnimationFrame(loop);
    };
    frame=requestAnimationFrame(loop);
  }

  function activateEquipped(item){
    if(item.slot==='companion'){
      setSection('pets',item.id);
      return;
    }
    if(!turntable||!contains())return;
    cancelAnimationFrame(frame);turntable.stop();stopPreview();
    stopPreview=playCel(turntable.canvas,progress=>turntable.draw(0,{id:item.id,progress}),reduceAnimation);
    setStatus(prizeAction(item).description);
  }

  function drawEquipped(){
    const panel=root?.querySelector('#avatar-equipped');
    if(!panel)return;
    panel.replaceChildren();
    const worn=Object.values(normalizeLoadout(getLoadout()).cosmetics).map(id=>BY_ID.get(id));
    if(!worn.length)return;
    panel.append(el('h4','','On your character'));
    for(const item of worn){
      const fit=fitsBody(getLoadout(),item);
      const label=el('span','',item.name+(fit?'':' · Fits '+item.families.join(' or '))+(have(item.id)?'':' · Preview only'));
      const remove=asButton('Remove',()=>forget(item));
      remove.setAttribute('aria-label','Remove '+item.name);
      const activate=asButton(item.slot==='companion'?'Visit pet':'Activate',()=>activateEquipped(item));
      activate.disabled=!fit;
      activate.setAttribute('aria-label',(item.slot==='companion'?'Visit ':'Activate ')+item.name);
      panel.append(row(label,activate,remove));
    }
  }

  function drawOutfits(){
    const panel=root?.querySelector('#avatar-outfits');
    if(!panel)return;
    panel.replaceChildren(el('h4','','Saved outfits'));
    if(!data){panel.append(text(loading?'Loading your outfits…':loadError||'Connect to save outfits across devices.'));return;}
    const outfits=data.outfits||[];
    const list=el('div','avatar-reward-outfits');
    for(const outfit of outfits){
      const card=el('div','avatar-outfit');
      const load=asButton(outfit.name,()=>{
        setLoadout(normalizeLoadout(outfit.recipe));setStatus('Loaded '+outfit.name+'.');
        paintPreview();drawEquipped();
      });
      const manage=el('details','avatar-outfit-options');
      const summary=el('summary','','Manage');
      const input=el('input');input.type='text';input.maxLength=30;input.value=outfit.name;
      input.setAttribute('aria-label','Rename '+outfit.name);
      manage.append(summary,row(input,asButton('Rename',()=>void saveOutfit(outfit.slot,input.value,outfit.recipe)),
        asButton('Remove outfit',()=>void saveOutfit(outfit.slot,'',null))));
      card.append(load,manage);list.append(card);
    }
    panel.append(list);
    const free=Array.from({length:6},(_,i)=>i+1).find(n=>!outfits.some(o=>o.slot===n));
    if(free){
      const input=el('input');input.type='text';input.maxLength=30;input.placeholder='Outfit name';
      input.setAttribute('aria-label','Outfit name');
      const save=asButton('Save outfit',()=>{
        const name=input.value.trim();
        if(!name){input.focus();setStatus('Give this outfit a name.');return;}
        const draft=normalizeLoadout(getLoadout());
        if(Object.values(draft.cosmetics).some(id=>!fitsBody(draft,BY_ID.get(id)))){setStatus('Remove the items that do not fit this body before saving.');return;}
        if(Object.values(draft.cosmetics).some(id=>!have(id))){setStatus('Remove preview-only items before saving an outfit.');return;}
        void saveOutfit(free,name,draft);
      });
      panel.append(row(input,save));
    }
  }

  async function saveOutfit(slot,name,recipe){
    if(!checkAccess())return;
    try {
      await rpc('community_avatar_save_outfit',{p_slot:slot,p_name:name.trim(),p_recipe:recipe});
      setStatus(recipe?'Outfit saved.':'Outfit removed.');
      await refresh();
    } catch(error){setStatus(error.message||'Couldn’t save the outfit.');}
  }

  function requirements(achievement,withButtons=true){
    const box=el('div','avatar-reward-goals');
    if(!achievement){box.append(text(loading?'Loading verified requirements…':loadError||'Sign in to see your verified progress.'));return box;}
    if(achievement.match==='any')box.append(text('Complete either path.'));
    for(const req of achievement.requirements||[]){
      const n=el('div','avatar-reward-goal');
      const title=el('strong','',req.label);
      n.append(title,el('span','',num(req.current)+' / '+num(req.target)),
        meter(Number(req.current),Number(req.target),req.label));
      if(withButtons&&!achievement.earned_at&&gameEntries[req.game]&&req.current<req.target){
        if(req.game==='plates'&&data?.plate_access===false)n.append(text('This path is for players in the Plate match. Choose the other path.'));
        else n.append(asButton('Play '+GAME_LABELS[req.game]+' to unlock',()=>playGame(req.game),'primary'));
      }
      box.append(n);
    }
    return box;
  }

  function rewardCard(item){
    const card=el('article','avatar-reward-card');
    const achievement=current(item.achievement_id);
    const open=asButton('',()=>{
      detail=item.id;renderResults();focusDetail();
    },'avatar-item-open');
    open.setAttribute('aria-label','See '+item.name);
    open.append(thumbnail(item),el('strong','',item.name));
    const status=el('span','avatar-reward-tag',RARITIES[item.tier]+' · '+(have(item.id)?'Unlocked':'Locked'));
    const aim=el('small','avatar-reward-aim',achievement?.name||GAME_LABELS[item.group]);
    const tryButton=asButton('Try it on',()=>tryOn(item));
    tryButton.setAttribute('aria-label','Try on '+item.name);
    tryButton.disabled=!fitsBody(getLoadout(),item);
    if(tryButton.disabled)aim.textContent+=' · Fits '+item.families.join(' or ');
    card.dataset.rewardItem=item.id;
    card.dataset.owned=String(have(item.id));
    card.append(open,status,aim,meter(rewardRatio(achievement),1,item.name+' progress'),tryButton);
    if(!have(item.id)){
      const paths=[...new Set(achievement?.requirements.filter(req=>req.current<req.target&&
        gameEntries[req.game]&&(req.game!=='plates'||data?.plate_access!==false)).map(req=>req.game)||[])];
      const play=paths.length===1?asButton('Play to unlock',()=>playGame(paths[0]),'primary'):
        asButton('See unlock paths',()=>open.click());
      play.setAttribute('aria-label',paths.length===1?'Play '+GAME_LABELS[paths[0]]+' to unlock '+item.name:'See unlock paths for '+item.name);
      card.append(play);
    }
    return card;
  }

  function matches(item){
    const achievement=current(item.achievement_id),ratio=rewardRatio(achievement);
    if(slot!=='all'&&slot!==item.slot)return false;
    if(game!=='all'&&game!==item.group&&!(achievement?.requirements||[]).some(req=>req.game===game))return false;
    if(filter==='unlocked'&&!have(item.id)||filter==='locked'&&have(item.id)||
      filter==='almost'&&(have(item.id)||ratio<.65)||filter==='legendary'&&item.tier!=='legendary')return false;
    if(query){
      const body=[item.name,RARITIES[item.tier],GAME_LABELS[item.group],achievement?.name,
        ...(item.tags||[])].join(' ').toLowerCase();
      if(!query.toLowerCase().split(/\s+/u).every(word=>body.includes(word)))return false;
    }
    return true;
  }

  function listItems(itemArray){
    if(!itemArray.length){results.append(text('No rewards match these filters.'));return;}
    let grid=results.querySelector('.avatar-reward-grid');
    if(!grid){grid=el('div','avatar-reward-grid');results.append(grid);}
    for(const item of itemArray.slice(grid.children.length,limit))grid.append(rewardCard(item));
    results.querySelector('[data-reward-more]')?.remove();
    if(itemArray.length>limit){
      const more=asButton('Show '+Math.min(PAGE,itemArray.length-limit)+' more',()=>{
        limit+=PAGE;listItems(itemArray);
        grid.children[limit-PAGE]?.querySelector('button')?.focus({preventScroll:true});
      });
      more.dataset.rewardMore='';
      results.append(more);
    }
  }

  function renderDetail(item){
    const achievement=current(item.achievement_id);
    const title=el('h3','',item.name);title.tabIndex=-1;title.dataset.rewardDetailTitle='';
    const card=el('article','avatar-reward-detail');
    const header=row(asButton('Back to collection',()=>{detail=null;renderResults();}),el('span','avatar-reward-tag',
      RARITIES[item.tier]+' · '+(have(item.id)?'Unlocked':'Locked')));
    const stage=el('div','avatar-prize-stage');
    const art=thumbnail(item,224);
    art.classList.add('avatar-prize-art');
    const content=el('div','avatar-prize-copy');
    const action=prizeAction(item);
    const state=el('p','avatar-prize-caption',action.description);
    const handle=item.slot==='companion'?()=>setSection('pets',item.id):()=>{
      stopDemo();
      stopDemo=playCel(art,progress=>studioPrize(art,item,progress),reduceAnimation);
    };
    const fit=fitsBody(getLoadout(),item);
    const trial=asButton('Try it on',()=>tryOn(item));trial.disabled=!fit;
    content.append(title,state,row(asButton(action.label,handle,'primary'),trial));
    if(!fit)content.append(text('Fits '+item.families.join(' or ')+' bodies.'));
    stage.append(art,content);
    card.append(header,stage);
    if(achievement)card.append(el('h4','',achievement.name));
    card.append(requirements(achievement));
    if(have(item.id))card.append(text('Try it on, then save your avatar to keep it.'));
    results.append(card);
  }

  function renderAchievements(){
    const accomplishments=[...achievements.values()].filter(a=>game==='all'||a.group===game||(a.requirements||[]).some(req=>req.game===game));
    if(!accomplishments.length){results.append(text(loading?'Loading achievements…':loadError||'Achievements appear here after you sign in.'));return;}
    const ordered=accomplishments.sort((a,b)=>!!a.earned_at-!!b.earned_at||rewardRatio(b)-rewardRatio(a));
    const list=el('div','avatar-achievement-list');
    for(const achievement of ordered){
      const block=el('details','avatar-achievement');
      const summary=el('summary');
      const badge=el('span','avatar-reward-tag',RARITIES[achievement.tier]||achievement.tier);
      summary.append(el('strong','',achievement.name),badge,
        el('small','',achievement.earned_at?'Completed':Math.floor(rewardRatio(achievement)*100)+'% complete'));
      const all=catalog().filter(item=>item.achievement_id===achievement.id);
      block.append(summary,requirements(achievement),row(...all.map(item=>asButton(item.name,()=>setSection('collection',item.id)))));
      list.append(block);
    }
    results.append(el('h3','',accomplishments.filter(item=>item.earned_at).length+' / '+accomplishments.length+' achievements completed'),list);
  }

  function overview(){
    const node=el('div','avatar-collection-overview');
    const available=catalog();
    const count=available.filter(item=>have(item.id)).length;
    const total=available.length;
    node.append(el('h3','',count+' / '+total+' unlocked'),meter(count,total,'Collection progress'));
    if(loadError)node.append(row(text(loadError),asButton('Retry progress',refresh)));
    else if(loading&&!data)node.append(text('Checking your game progress…'));
    if(data){
      const building=available.filter(item=>!have(item.id)&&current(item.achievement_id)).sort((a,b)=>
        rewardRatio(current(b.achievement_id))-rewardRatio(current(a.achievement_id)));
      const next=building[0];
      const recent=[...owned.values()].sort((a,b)=>String(b.awarded_at).localeCompare(String(a.awarded_at))).map(x=>BY_ID.get(x.id)).filter(Boolean).slice(0,3);
      if(next)node.append(row(el('span','','Closest reward'),asButton(next.name,()=>{detail=next.id;renderResults();focusDetail();})));
      if(recent.length)node.append(row(el('span','','Recent unlocks'),...recent.map(item=>asButton(item.name,()=>{detail=item.id;renderResults();focusDetail();}))));
      const breakdown=el('details','avatar-reward-breakdown');
      const facts=el('div','avatar-collection-facts');
      const counts=(label,x)=>el('span','',label+' '+x.filter(item=>have(item.id)).length+' / '+x.length);
      facts.append(...labels.map(([key,name])=>counts(name,available.filter(item=>item.group===key))),
        ...Object.entries(RARITIES).map(([key,name])=>counts(name,available.filter(item=>item.tier===key))));
      breakdown.append(el('summary','','Progress by game and rarity'),facts);
      node.append(breakdown);
    }
    return node;
  }

  function renderResults(){
    if(!results)return;
    stopDemo();
    results.querySelectorAll('canvas').forEach(releaseStudioArt);
    results.replaceChildren();
    const selected=detail&&BY_ID.get(detail);
    if(section==='collection'&&selected){
      filters.hidden=true;
      renderDetail(selected);
    }else if(section==='collection'){
      filters.hidden=false;
      results.append(overview());
      let items=catalog().filter(matches);
      if(sort==='name')items=items.sort((a,b)=>a.name.localeCompare(b.name));
      if(sort==='closest')items=items.sort((a,b)=>rewardRatio(current(b.achievement_id))-rewardRatio(current(a.achievement_id)));
      const count=el('p','avatar-reward-count',items.length+' '+(items.length===1?'reward':'rewards'));
      count.setAttribute('aria-live','polite');results.append(count);listItems(items);
    }else if(section==='achievements'){
      filters.hidden=false;renderAchievements();
    }else if(section==='pets'){
      filters.hidden=true;
      pets.mount(results);
    }
  }

  function makeFilters(){
    const base=el('div','avatar-reward-filters');
    const gameSelect=combobox('Game',[['all','All games'],...labels],game,value=>{game=value;limit=PAGE;renderResults();});
    const search=el('input'); search.type='search';search.placeholder='Search rewards';search.value=query;
    search.setAttribute('aria-label','Search rewards');
    search.addEventListener('input',()=>{query=search.value.trim();limit=PAGE;renderResults();});
    if(section==='collection')base.append(search,
      combobox('Type',[['all','All types'],...Object.entries(SLOT_LABELS)],slot,value=>{slot=value;limit=PAGE;renderResults();}),
      combobox('Show',[['all','All rewards'],['unlocked','Unlocked'],['locked','Locked'],['almost','Almost earned'],['legendary','Legendary']],filter,
        value=>{filter=value;limit=PAGE;renderResults();}),
      gameSelect,combobox('Sort',[['catalog','Collection order'],['name','Name A–Z'],['closest','Closest to unlock']],sort,value=>{sort=value;limit=PAGE;renderResults();}));
    else if(section==='achievements')base.append(gameSelect,asButton('Refresh achievements',refresh));
    return base;
  }

  function draw(){
    if(!contains())return;
    editor.dataset.rewardView=section;
    editor.classList.toggle('reward-browsing',section!=='avatar');
    editor.querySelector('.family-avatar-fields').hidden=section!=='avatar';
    editor.querySelector('#avatar-outfits').hidden=section!=='avatar';
    for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.rewardSection===section));
    if(privateControls)privateControls.hidden=section!=='avatar';
    pane.hidden=section==='avatar';
    if(!pane.hidden){
      const built=makeFilters();
      filters.replaceChildren(...built.children);
      renderResults();
    }
    drawEquipped();
    if(section==='avatar')drawOutfits();
    paintPreview();
  }

  function releaseStage(){
    layoutWatch?.disconnect();layoutWatch=null;
    viewEvents?.abort();viewEvents=null;
    if(turntable){releaseStudioArt(turntable.canvas);turntable.destroy();turntable=null;}
  }

  function choosePart(part){
    for(const panel of editor.querySelectorAll('[data-studio-panel]'))
      panel.hidden=panel.dataset.studioPanel!==part;
    for(const button of editor.querySelectorAll('[data-studio-part]'))
      button.setAttribute('aria-pressed',String(button.dataset.studioPart===part));
  }

  function mount(nextRoot,{nextSection='avatar',item=null}={}){
    releaseStage();
    root=nextRoot;
    editor=root.querySelector('.family-character-editor');
    if(!editor)return;
    const stage=editor.querySelector('[data-avatar-turntable]');
    const canvas=stage.querySelector('canvas');
    const frame=canvas.parentElement;
    viewEvents=new AbortController();
    editor.addEventListener('click',event=>{
      const toggle=event.target.closest('[data-studio-part]');
      if(!toggle)return;
      choosePart(toggle.dataset.studioPart);
      if(toggle.dataset.studioPart==='face'||toggle.dataset.studioPart==='hair')turntable?.face();
      else stage.querySelector('[data-turn="body"]').click();
    },{signal:viewEvents.signal});
    turntable=mountTurntable(stage,(camera,t,activity)=>
      studioCharacter(canvas,getLoadout(),camera,t,activity),reduceAnimation,(x,y,view)=>{
        const part=pickStudioPart(canvas,x,y)||
          (canvas.dataset.renderer!=='3d'&&x>.20&&x<.79&&y>.13&&y<.71?(y<.34?'face':'clothes'):null);
        if(!part)return;
        setSection(part==='pets'?'pets':'avatar');
        if(part!=='pets')choosePart(part);
        if(part==='face'&&view.zoom<2)turntable?.face();
      });
    const resize=()=>{
      if(!frame.clientWidth||!frame.clientHeight||turntable?.canvas!==canvas)return;
      const detail=Math.min(window.devicePixelRatio||1,1.5);
      const width=Math.round(frame.clientWidth*detail),height=Math.round(frame.clientHeight*detail);
      if(width===canvas.width&&height===canvas.height)return;
      canvas.width=width;canvas.height=height;
      turntable.draw();
    };
    layoutWatch=new ResizeObserver(resize);layoutWatch.observe(frame);resize();
    for(const tile of editor.querySelectorAll('[data-look-preview]'))
      renderLoadout(tile,SHOWROOM_LOOKS[tile.dataset.lookPreview],0,null,{angle:18,crop:{size:198}});
    pane=el('section','avatar-reward-pane');
    filters=el('div','avatar-reward-filters');
    results=el('div','avatar-reward-results');
    tabs=el('nav','avatar-reward-tabs');
    tabs.setAttribute('aria-label','Avatar Studio sections');
    for(const [key,label] of sections){
      const next=asButton(label,()=>setSection(key));
      next.dataset.rewardSection=key;tabs.append(next);
    }
    editor.prepend(tabs);pane.append(filters,results);
    editor.querySelector('.studio-editor-panel').insertBefore(pane,editor.querySelector('#avatar-equipped'));
    privateControls=root.querySelector('.family-avatar-methods');
    section=nextSection;detail=item;
    if(section==='pets')pets.showPet(item);
    draw();
    void prepareStudioRenderer().then(renderer=>{
      if(!renderer||turntable?.canvas!==canvas||!contains())return;
      paintPreview();
      for(const tile of editor.querySelectorAll('[data-look-preview]'))
        studioLook(tile,tile.dataset.lookPreview);
      if(section!=='avatar')renderResults();
    });
    if(detail)focusDetail();
    void refresh();
  }

  function restore(next){setSection(next.section,next.detail);}
  function stateForReturn(){return {section,detail};}
  function clear(){
    epoch+=1;
    pending=null;loading=false;loadError='';data=null;achievements.clear();owned.clear();pendingAcks.clear();
    query='';section='avatar';slot=filter=game='all';sort='catalog';limit=PAGE;detail=null;
    root=editor=pane=results=filters=tabs=privateControls=null;
    cancelAnimationFrame(frame);
    stopDemo();
    stopPreview();
    releaseStage();
    pets.clear();
  }

  async function acknowledge(items){
    const fresh=items.filter(item=>!pendingAcks.has(item.id));
    if(!fresh.length)return;
    fresh.forEach(item=>pendingAcks.add(item.id));
    try{
      await rpc('community_avatar_reward_seen',{p_ids:fresh.map(item=>item.id)});
      if(!checkAccess())return;
      for(const item of fresh){if(owned.has(item.id))owned.get(item.id).seen=true;}
    }catch{
      for(const item of fresh)pendingAcks.delete(item.id);
    }
  }

  function recentUnseen(){
    if(!data)return [];
    return [...owned.values()].filter(item=>!item.seen&&!pendingAcks.has(item.id)&&BY_ID.has(item.id))
      .sort((a,b)=>String(a.awarded_at).localeCompare(String(b.awarded_at)));
  }

  return {mount,refresh,getData,have,tryOn,clear,paintPreview,drawEquipped,stateForReturn,
    restore,recentUnseen,acknowledge,warm:()=>void refresh()};
}


export function makeAvatarCelebration(fresh,data,{dismiss,studio,equip}){
  const item=BY_ID.get(fresh[0]?.id);
  if(!item)return null;
  const title=data.achievements.find(x=>x.id===item.achievement_id)?.name||'Achievement earned';
  const box=el('section','avatar-celebration');
  box.setAttribute('aria-label','New avatar rewards');
  const copy=el('div');
  const more=fresh.length>1?' · '+(fresh.length-1)+' more unlocked':'';
  copy.append(el('h3','',item.name),el('p','',title+' · '+RARITIES[item.tier]+more));
  box.append(thumbnail(item,72),copy,row(asButton('Equip now',()=>equip(item),'primary'),
    asButton('Back to Studio',()=>studio(item)),asButton('Continue playing',dismiss)));
  return box;
}
