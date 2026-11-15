import {button,el} from './family-board-core.mjs?v=family3';
import {petBehavior} from './avatar-prize-actions.mjs?v=turn1';
import {playCel} from './avatar-reward-render.mjs?v=studio2';
import {createPetTradeUI} from './avatar-pet-trading.mjs?v=toon3';

import {mountTurntable,turntableHTML} from './avatar-turntable-controls.mjs?v=studio2';
import {prepareStudioRenderer,releaseStudioArt,studioPet} from './avatar-studio-preview.mjs?v=studio2';

const BOND_MAX=12;
const TRICK_BOND=6;
const actionButton=(label,action,kind='')=>{
  const control=button(label,action);
  control.className='avatar-reward-button'+(kind?' '+kind:'');
  return control;
};

export function createPetStudio({rpc,catalog,have,unlocksKnown,checkError,openReward,tryOn,isOpen,reduceMotion,onInventoryChange}) {
  let root,selected='',state='idle',pets=new Map(),pending=false,message='',epoch=0,stop=()=>{},inspection=null;
  const trading=createPetTradeUI({rpc,catalog,onChanged:()=>{refresh();onInventoryChange?.();},isOpen});
  function showPet(id) {
    selected=id||selected;
    message='';
  }
  function refresh(){
    if(state==='loading')return;
    state='loading';
    const version=epoch;
    void rpc('community_avatar_pet_state').then(result=>{
      if(version!==epoch)return;
      pets=new Map(result.map(pet=>[pet.cosmetic_id,pet]));
      state='ready';
    }).catch(()=>{
      if(version===epoch)state='failed';
    }).finally(()=>{
      if(version===epoch&&isOpen())render();
    });
  }

  async function act(item,action,name=null){
    if(pending||state!=='ready')return;
    const version=epoch;
    const pet=pets.get(item.id);
    pending=true;
    const active=root?.querySelectorAll('[data-pet-action]');
    active?.forEach(control=>control.setAttribute('aria-disabled','true'));
    try{
      const updated=await rpc('community_avatar_pet_action',{
        p_cosmetic:item.id,p_action:action,p_name:name,p_revision:pet?.revision??null
      });
      if(version!==epoch)return;
      pets.set(item.id,updated);
      if(selected!==item.id)return;
      if(action==='adopt')message=updated.name+' is home.';
      else if(action==='rename')message='Name saved.';
      else {
        message=petBehavior(item,action).caption;
        if(pet.bond<TRICK_BOND&&updated.bond>=TRICK_BOND)
          message+=' Learned '+petBehavior(item,'trick').label+'.';
      }
    }catch(error){
      if(version!==epoch)return;
      message=error.message||'The pet action could not be saved.';
      if(error.code==='40001')refresh();
      action=null;
    }finally{
      if(version===epoch){
        pending=false;
        if(isOpen()&&selected===item.id){
          render(action);
          if(action==='adopt')root.querySelector('[data-pet-action=pet]')?.focus({preventScroll:true});
        }
      }
    }
  }

  function render(activity=null){
    if(!root||!isOpen())return;
    root.querySelectorAll('canvas').forEach(releaseStudioArt);
    stop();inspection?.destroy();inspection=null;
    const chosen=catalog().filter(item=>item.slot==='companion');
    const known=unlocksKnown();
    const earned=chosen.filter(item=>have(item.id)||pets.has(item.id));
    const waiting=chosen.filter(item=>!have(item.id)&&!pets.has(item.id));
    const item=chosen.find(entry=>entry.id===selected)||earned[0]||chosen.find(entry=>entry.id==='trail-husky');
    if(!item)return;
    selected=item.id;
    const pet=pets.get(item.id),owned=have(item.id)||Boolean(pet);
    const focus=document.activeElement?.dataset.petAction;
    const focusSelect=root.contains(document.activeElement)&&document.activeElement?.tagName==='SELECT';
    const selection=el('select');
    selection.setAttribute('aria-label','Choose a pet');
    for(const [title,items] of [['Earned pets',earned],['Pets to win',waiting]]){
      if(!items.length)continue;
      const group=el('optgroup');group.label=known?title:'Pets';
      for(const entry of items){
        const option=el('option','',pets.get(entry.id)?.name||entry.name);
        option.value=entry.id;
        group.append(option);
      }
      selection.append(group);
    }
    selection.value=selected;
    selection.addEventListener('change',()=>{
      showPet(selection.value);
      render();
      root.querySelector('select')?.focus({preventScroll:true});
    });
    const tab=el('div','avatar-pet-toolbar');
    const label=el('label','avatar-pet-select');
    label.append(el('span','','Choose a pet'),selection);
    tab.append(label,el('span','avatar-reward-tag',known?earned.length+' of '+chosen.length+' earned':chosen.length+' pets'));
    const card=el('article','avatar-pet-card');
    const canvas=el('canvas','avatar-pet-portrait');
    canvas.width=canvas.height=256;
    canvas.setAttribute('role','img');
    canvas.setAttribute('aria-label',item.name+' illustration');
    const details=el('div','avatar-pet-details');
    details.append(el('h3','',pet?.name||item.name));
    if(pet&&pet.name!==item.name)details.append(el('p','avatar-pet-species',item.name));
    if(!known)details.append(el('p','avatar-reward-copy',checkError()||'Checking which pets you’ve earned…'));
    else if(!owned){
      details.append(el('p','avatar-reward-copy','Game reward · Locked'),
        actionButton('See how to earn it',()=>openReward(item),'primary'));
    }else if(state==='loading'||state==='idle'){
      details.append(el('p','avatar-reward-copy','Loading your pet…'));
    }else if(state==='failed'){
      details.append(el('p','avatar-reward-copy','Pet progress could not be loaded.'),actionButton('Retry',()=>{
        refresh();render();
      }));
    }else if(!pet){
      const adopt=actionButton('Adopt',()=>void act(item,'adopt'),'primary');adopt.dataset.petAction='adopt';
      details.append(el('p','avatar-reward-copy','Earned in a game'),adopt);
    }else{
      const bar=el('progress','avatar-reward-meter');
      bar.max=BOND_MAX;bar.value=pet.bond;bar.setAttribute('aria-label','Pet bond');
      const commands=el('div','avatar-pet-actions');
      for(const [action,label] of [['pet','Pet'],['play','Play'],['trick','Show trick']]){
        const control=actionButton(label,()=>void act(item,action),action==='play'?'primary':'');
        control.dataset.petAction=action;
        control.disabled=action==='trick'&&pet.bond<TRICK_BOND;
        commands.append(control);
      }
      const newName=el('input');
      newName.type='text';newName.value=pet.name;newName.maxLength=30;newName.setAttribute('aria-label','Pet name');
      const rename=actionButton('Save name',()=>{
        const name=newName.value.trim();
        if(name)void act(item,'rename',name);
        else newName.focus();
      });
      rename.dataset.petAction='rename';
      const naming=el('details','avatar-pet-name');
      const nameRow=el('div','avatar-pet-name-form');
      nameRow.append(newName,rename);naming.append(el('summary','','Rename pet'),nameRow);
      if(focus==='rename')naming.open=true;
      details.append(el('span','avatar-pet-bond','Bond '+pet.bond+' / '+BOND_MAX),bar,commands,
        el('p','avatar-reward-copy',pet.bond>=TRICK_BOND?petBehavior(item,'trick').label+' learned':'Learn a trick at bond '+TRICK_BOND+'.'),
        actionButton('Take along',()=>tryOn(item)),naming);
    }
    // Locked pets can be previewed with a local animation. Adopting and
    // building a bond require the server-verified reward.
    if(!owned&&known){
      details.append(actionButton('Preview pet',()=>{
        stop();stop=playCel(canvas,p=>studioPet(canvas,item,'play',p),reduceMotion);
        status.textContent=petBehavior(item,'play').caption;
      }));
    }
    {
      const closeUp=el('details','avatar-pet-inspection');
      closeUp.append(el('summary','','Inspect pet'));
      closeUp.insertAdjacentHTML('beforeend',turntableHTML());
      closeUp.addEventListener('toggle',()=>{
        if(!closeUp.open){inspection?.stop();return;}
        if(inspection){inspection.draw();return;}
        const stage=closeUp.querySelector('[data-avatar-turntable]');
        inspection=mountTurntable(stage,(camera)=>studioPet(stage.querySelector('canvas'),item,null,0,camera),reduceMotion);
      });
      details.append(closeUp);
    }
    const status=el('p','avatar-pet-status');status.setAttribute('role','status');
    details.append(status);
    card.append(canvas,details);
    const tradeHost=el('div','avatar-pet-trade-host');
    root.replaceChildren(tab,card,tradeHost);
    trading.mount(tradeHost,pets,selected);
    studioPet(canvas,item);
    void prepareStudioRenderer().then(renderer=>{
      if(renderer&&isOpen()&&canvas.isConnected&&!activity)studioPet(canvas,item);
    });
    if(message)status.textContent=message;
    if(activity==='pet'||activity==='play'||activity==='trick')
      stop=playCel(canvas,p=>studioPet(canvas,item,activity,p),reduceMotion);
    if(focus)root.querySelector('[data-pet-action="'+focus+'"]')?.focus({preventScroll:true});
    else if(focusSelect)selection.focus({preventScroll:true});
  }

  return {
    showPet,
    mount(target){
      const moved=root!==target;
      root=target;
      if(state==='idle'||moved)refresh();
      render();
    },
    clear(){
      root?.querySelectorAll('canvas').forEach(releaseStudioArt);
      stop();inspection?.destroy();inspection=null;epoch++;trading.clear();root=null;selected='';state='idle';pets.clear();pending=false;message='';
    }
  };
}
