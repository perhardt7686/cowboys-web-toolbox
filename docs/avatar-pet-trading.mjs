/* Private, consent-based pet swaps. The backend is the sole owner authority.
   This UI never modifies pet inventory, scores or achievements in the browser. */
import {el,button} from './family-board-core.mjs?v=family3';
export function createPetTradeUI({rpc,catalog,onChanged,isOpen}){
 let root=null,memberPets=new Map(),selectedPet='',state=null,pending=false,notice='';
 let recipient='',requested='',review=null,revision=0;
 const labelOf=id=>catalog().find(c=>c.id===id)?.name||id;
 const btn=(name,run,primary=false)=>{
   const b=button(name,run);b.className='avatar-reward-button'+(primary?' primary':'');
   b.disabled=pending;return b;
 };
 const paragraph=(text,cls='avatar-reward-copy')=>el('p',cls,text);
 const ownedOptions=()=>{
   return [...memberPets.values()].filter(pet=>catalog().some(c=>c.id===pet.cosmetic_id&&c.slot==='companion'));
 };
 const nameOf=id=>state?.family?.find(m=>m.id===id)?.name||'Family member';
 function selectElement(label,options,value,change){
   const wrap=el('label','avatar-pet-trade-field');
   wrap.append(el('span','',label));
   const select=el('select');select.disabled=pending;
   for(const [id,name] of options){
     const choice=el('option','',name);choice.value=id;select.append(choice);
   }
   if(options.some(x=>x[0]===value))select.value=value;
   else select.selectedIndex=0;
   select.addEventListener('change',()=>change(select.value));
   wrap.append(select);return wrap;
 }
 function resetReview(){review=null;}
 function refresh(){
   const stamp=++revision;
   return rpc('community_avatar_pet_trade_state').then(next=>{
     if(stamp!==revision)return;
     state=next;notice='';
     if(!state.family?.some(m=>m.id===recipient))recipient=state.family?.[0]?.id||'';
     render();
   }).catch(err=>{
     if(stamp!==revision)return;
     notice=err.message||'Trade inbox could not be loaded.';
     render();
   });
 }
 async function act(fn,args,success,changed=false){
   if(pending)return;
   pending=true;render();
   try{
     await rpc(fn,args);
     notice=success;review=null;
     await refresh();
     notice=success;
     if(changed)onChanged?.();
   }catch(err){notice=err.message||'Trade could not be completed.';}
   finally{pending=false;render();}
 }
 function tradeRow(offer){
   const row=el('article','avatar-pet-trade-offer');
   const who=offer.direction==='incoming'?'From '+offer.sender:'To '+offer.recipient;
   row.append(el('strong','',who),paragraph('Pet: '+labelOf(offer.offered_pet)+
     (offer.requested_pet?' · In return: '+labelOf(offer.requested_pet):' · Gift (nothing requested)')));
   row.append(el('small','avatar-pet-trade-meta',
     offer.status==='pending'?'Awaiting family decision · expires after 7 days':
     offer.status[0].toUpperCase()+offer.status.slice(1)));
   if(offer.status==='pending'){
     const actions=el('div','avatar-pet-trade-actions');
     if(offer.direction==='incoming'){
       actions.append(btn('Review trade',()=>{review={kind:'accept',trade:offer};render();},true),
         btn('Decline',()=>void act('community_avatar_pet_trade_action',
           {p_trade:offer.id,p_action:'decline'},'Trade declined.')));
     }else actions.append(btn('Cancel offer',()=>void act('community_avatar_pet_trade_action',
       {p_trade:offer.id,p_action:'cancel'},'Offer cancelled.')));
     row.append(actions);
   }
   return row;
 }
 function showReview(host){
   if(!review)return;
   const card=el('section','avatar-pet-trade-review');
   if(review.kind==='send'){
     const {pet,to,request}=review;
     card.append(el('h4','','Review your offer'),
       paragraph('You are offering '+pet.name+' ('+labelOf(pet.cosmetic_id)+') to '+nameOf(to)+'.'));
     card.append(paragraph(request?'In return, you are requesting '+labelOf(request)+'.':
       'This is a gift. You will receive NO pet in return.'));
     card.append(paragraph('Nothing transfers unless the recipient explicitly accepts. Your pet keeps its name and bond.','avatar-pet-trade-warning'));
     const buttons=el('div','avatar-pet-trade-actions');
     buttons.append(btn('Send this offer',()=>void act('community_avatar_pet_trade_offer',
       {p_to:to,p_pet:pet.cosmetic_id,p_request:request||null,p_revision:pet.revision},
       'Offer sent. The other family member can accept or decline in their Pet Studio.'),true),
       btn('Go back',()=>{resetReview();render();}));
     card.append(buttons);
   }else if(review.kind==='accept'){
     const o=review.trade;
     card.append(el('h4','','Confirm pet transfer'),
       paragraph(o.sender+' offers '+labelOf(o.offered_pet)+'.'));
     card.append(paragraph(o.requested_pet?
       'If you accept, you give them '+labelOf(o.requested_pet)+' in exchange.':
       'If you accept, you receive this pet as a gift. You do not give away a pet.'));
     card.append(paragraph('The trade is permanent unless both members agree on a future trade. Pet name and bond are preserved.','avatar-pet-trade-warning'));
     const buttons=el('div','avatar-pet-trade-actions');
     buttons.append(btn('Accept and transfer',()=>void act('community_avatar_pet_trade_action',
       {p_trade:o.id,p_action:'accept'},'Trade accepted. Your pet collection has been updated.',true),true),
       btn('Not now',()=>{resetReview();render();}));
     card.append(buttons);
   }
   host.append(card);
 }
 function render(){
   if(!root||!isOpen())return;
   const panel=el('section','avatar-pet-trades');
   panel.append(el('h3','','Family Pet Trading'),
     paragraph('Offer a pet to another approved family member. They must accept before any pet changes hands. Achievements always stay with the original winner.'));
   const refreshButton=btn('Refresh offers',()=>void refresh());
   panel.append(refreshButton);
   const owned=ownedOptions();
   if(!state){
     panel.append(paragraph(notice||'Checking your family trade inbox…'));
     root.replaceChildren(panel);return;
   }
   if(owned.length&&state.family?.length){
     const form=el('section','avatar-pet-trade-new');
     form.append(el('h4','','Make an offer'));
     const options=owned.map(p=>[p.cosmetic_id,p.name+' · '+labelOf(p.cosmetic_id)+' · Bond '+p.bond+'/12']);
     if(!owned.some(p=>p.cosmetic_id===selectedPet))selectedPet=owned[0].cosmetic_id;
     const field=selectElement('Your pet',options,selectedPet,val=>{selectedPet=val;review=null;});
     if(!recipient||!state.family.some(p=>p.id===recipient))recipient=state.family[0].id;
     const member=selectElement('Offer to',state.family.map(p=>[p.id,p.name]),recipient,val=>{
       recipient=val;requested='';resetReview();render();
     });
     const available=state.family_pets?.filter(p=>p.member_id===recipient&&p.cosmetic_id!==selectedPet)||[];
     const exchange=selectElement('Pet to receive in return',
       [['','None · give as a gift'],...available.map(p=>[p.cosmetic_id,p.name+' · '+labelOf(p.cosmetic_id)])],
       requested,val=>{requested=val;resetReview();});
     form.append(field,member,exchange);
     form.append(btn('Review offer',()=>{
       const chosen=owned.find(p=>p.cosmetic_id===selectedPet);
       if(!chosen||!recipient)return;
       review={kind:'send',pet:{...chosen},to:recipient,request:requested};
       render();
     },true));
     panel.append(form);
   }else if(!owned.length){
     panel.append(paragraph('Adopt an earned pet or receive one in a family trade to start offering pets.'));
   }else panel.append(paragraph('No other approved family members are available to trade with.'));
   if(state.offers?.length){
     const area=el('section','avatar-pet-trade-inbox');
     area.append(el('h4','','Your trade inbox'));
     for(const offer of state.offers)area.append(tradeRow(offer));
     panel.append(area);
   }else panel.append(paragraph('No offers yet. Trade offers will appear here.'));
   if(review)showReview(panel);
   if(notice){const n=paragraph(notice,'avatar-pet-trade-message');n.setAttribute('role','status');panel.append(n);}
   root.replaceChildren(panel);
 }
 return {
   mount(target,pets,selected){
     const newTarget=root!==target;
     root=target;memberPets=new Map(pets);selectedPet=selected||selectedPet;
     if(!state||newTarget)void refresh();
     else render();
   },
   refresh,
   clear(){revision++;root=null;state=null;pending=false;notice='';review=null;memberPets.clear();selectedPet='';recipient='';requested='';}
 };
}
