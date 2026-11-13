/* The Commons · family refrigerator note, shared by approved members only.
 * Grocery and household lists live in Supabase; calendar and note share one foldout.
 * Safe textContent rendering: member-entered text is never injected as HTML.
 */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const fridgeBoard=document.getElementById('conversations');
const fridgeConfig=window.COWBOY_COMMUNITY_CONFIG;
if(fridgeBoard&&fridgeConfig?.enabled&&location.pathname.endsWith('community.html')){
 const make=(tag,cls,text)=>{
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=String(text);
  return e;
 };
 const categories=[
  {key:'groceries',title:'Groceries',icon:'🛒',hint:'Food, drinks, and things for the pantry',placeholder:'Eggs, cheese, coffee…'},
  {key:'household',title:'Household',icon:'🧽',hint:'Cleaning, paper goods, and home essentials',placeholder:'Laundry pods, dish soap…'}
 ];
 const state={items:[],client:null,connectPromise:null,loading:false,busy:false,mounted:false,refreshTimer:null};
 let fridge=null,fold=null;
 function status(message,isError=false){
  const output=fridge?.querySelector('#family-fridge-status');if(!output)return;
  output.textContent=message;output.classList.toggle('is-error',isError);
 }
 const findItem=id=>state.items.find(x=>String(x.id)===String(id));
 function renderItems(){
  if(!fridge)return;
  const open=state.items.filter(x=>!x.done).length,done=state.items.length-open;
  fridge.querySelector('#family-fridge-summary').textContent=open+' to pick up · '+done+' picked up';
  const clear=fridge.querySelector('#family-fridge-clear');
  clear.disabled=state.busy||done===0;
  for(const category of categories){
   const list=fridge.querySelector('[data-fridge-items="'+category.key+'"]');
   const count=fridge.querySelector('[data-fridge-count="'+category.key+'"]');
   const items=state.items.filter(item=>item.category===category.key)
     .sort((a,b)=>Number(a.done)-Number(b.done)||new Date(a.added_at)-new Date(b.added_at));
   count.textContent=items.filter(x=>!x.done).length+' needed';
   list.replaceChildren();
   if(!items.length){
    list.append(make('li','family-fridge-empty','Nothing on this part of the note yet.'));
    continue;
   }
   for(const item of items){
    const li=make('li','family-fridge-item'+(item.done?' is-done':''));
    li.dataset.fridgeId=item.id;
    const label=make('label','family-fridge-item-label');
    const check=make('input');check.type='checkbox';check.checked=Boolean(item.done);
    check.dataset.fridgeCheck=String(item.id);
    check.disabled=state.busy;
    check.setAttribute('aria-label',(item.done?'Mark needed again: ':'Mark picked up: ')+item.name);
    const caption=make('span','family-fridge-item-name',item.name);
    label.append(check,caption);
    if(item.quantity)li.append(label,make('span','family-fridge-qty',item.quantity));
    else li.append(label);
    const tools=make('div','family-fridge-item-tools');
    const edit=make('button','','Edit');
    edit.type='button';edit.dataset.fridgeAction='edit';edit.disabled=state.busy;
    edit.setAttribute('aria-label','Edit '+item.name);
    const remove=make('button','family-fridge-remove','×');
    remove.type='button';remove.dataset.fridgeAction='remove';remove.disabled=state.busy;
    remove.setAttribute('aria-label','Remove '+item.name);
    tools.append(edit,remove);li.append(tools);list.append(li);
   }
  }
 }
 function makeAddForm(category){
  const form=make('form','family-fridge-add');
  form.dataset.fridgeCategory=category.key;
  const fields=make('div','family-fridge-fields');
  const name=make('label','family-fridge-field');
  name.append(make('span','','Add an item'));
  const input=make('input');input.type='text';input.maxLength=100;input.required=true;
  input.name='item';input.autocomplete='off';input.placeholder=category.placeholder;
  name.append(input);
  const quantityLabel=make('label','family-fridge-field family-fridge-quantity');
  quantityLabel.append(make('span','','Quantity (optional)'));
  const quantity=make('input');quantity.type='text';quantity.name='quantity';quantity.maxLength=40;
  quantity.autocomplete='off';quantity.placeholder='2 / 1 box';
  quantityLabel.append(quantity);
  const button=make('button','family-fridge-add-button','+ Add');
  button.type='submit';button.setAttribute('aria-label','Add to '+category.title);
  fields.append(name,quantityLabel,button);form.append(fields);
  return form;
 }
 function build(){
  const panel=document.getElementById('family-calendar-panel');
  const inner=panel?.querySelector('.family-calendar-inner');
  const content=panel?.querySelector('#family-calendar-content');
  if(!inner||!content)return false;
  if(document.getElementById('family-fridge-note'))return true;
  fold=panel.querySelector('#family-calendar-fold');
  fridge=make('section','family-fridge');
  fridge.id='family-fridge-note';
  fridge.setAttribute('aria-label','Shared refrigerator groceries and household shopping note');
  const magnet=make('div','family-fridge-magnet');magnet.setAttribute('aria-hidden','true');
  const head=make('div','family-fridge-heading');
  const title=make('div','family-fridge-title');
  title.append(make('p','family-fridge-eyebrow','THE FAMILY FRIDGE · SHARED NOTE'));
  title.append(make('h3','','Things we need'));
  title.append(make('p','family-fridge-subtitle','Add it here. Anyone in the family can pick it up and check it off.'));
  const meta=make('div','family-fridge-meta');
  const summary=make('strong','','Loading list…');summary.id='family-fridge-summary';
  const refresh=make('button','family-fridge-refresh','Refresh ↻');
  refresh.id='family-fridge-refresh';refresh.type='button';
  meta.append(summary,refresh);head.append(title,meta);
  const cols=make('div','family-fridge-columns');
  for(const category of categories){
   const column=make('section','family-fridge-column is-'+category.key);
   column.setAttribute('aria-label',category.title+' items');
   const heading=make('div','family-fridge-column-head');
   const headingText=make('div','family-fridge-column-title');
   headingText.append(make('span','family-fridge-icon',category.icon),make('h4','',category.title));
   const count=make('small','family-fridge-count','0 needed');count.dataset.fridgeCount=category.key;
   heading.append(headingText,count);
   const hint=make('p','family-fridge-hint',category.hint);
   const items=make('ul','family-fridge-items');
   items.dataset.fridgeItems=category.key;
   column.append(heading,hint,items,makeAddForm(category));
   cols.append(column);
  }
  const footer=make('div','family-fridge-footer');
  const live=make('p','family-fridge-status','Open the family calendar to load the shared note.');
  live.id='family-fridge-status';live.setAttribute('role','status');live.setAttribute('aria-live','polite');
  const clear=make('button','family-fridge-clear','Clear picked-up items');
  clear.type='button';clear.id='family-fridge-clear';clear.disabled=true;
  footer.append(live,clear);
  fridge.append(magnet,head,cols,footer);
  inner.insertBefore(fridge,content);
  fridge.querySelector('#family-fridge-refresh').addEventListener('click',()=>{void refresh(true)});
  fridge.querySelector('#family-fridge-clear').addEventListener('click',()=>{
   if(state.busy||!state.items.some(x=>x.done))return;
   if(window.confirm('Remove all picked-up items from the shared note?'))void change('clear_done',{},'Picked-up items cleared.');
  });
  fridge.addEventListener('submit',onSubmit);
  fridge.addEventListener('change',onChange);
  fridge.addEventListener('click',onClick);
  fold.addEventListener('toggle',()=>{if(fold.open)void refresh(true);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&fold.open&&!panel.hidden)void refresh(false);});
  new MutationObserver(()=>{
   if(panel.hidden){state.items=[];renderItems();status('Sign in to view the family note.');}
   else if(fold.open)void refresh(false);
  }).observe(panel,{attributes:true,attributeFilter:['hidden']});
  state.refreshTimer=window.setInterval(()=>{
   if(!document.hidden&&fold.open&&!panel.hidden&&!state.busy&&!fridge.querySelector('.family-fridge-edit'))void refresh(false);
  },30000);
  state.mounted=true;
  renderItems();if(fold.open&&!panel.hidden)void refresh(true);
  return true;
 }
 async function connect(){
  if(state.client)return state.client;
  if(state.connectPromise)return state.connectPromise;
  state.connectPromise=(async()=>{
   const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
   const local=window.localStorage,session=window.sessionStorage;
   const storage=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
   const key='sb-'+new URL(fridgeConfig.supabaseUrl).hostname.split('.')[0]+'-auth-token';
   const client=createClient(fridgeConfig.supabaseUrl,fridgeConfig.publishableKey,{
    auth:{storageKey:key,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage}
   });
   client.auth.onAuthStateChange(event=>{
    if(event==='SIGNED_OUT'){state.items=[];renderItems();status('Sign in to see the refrigerator note.');}
   });
   state.client=client;return client;
  })();
  try{return await state.connectPromise;}finally{state.connectPromise=null;}
 }
 async function fetchServer(){
  const client=await connect();
  const {data,error}=await client.rpc('community_family_fridge_state');
  if(error)throw error;
  return Array.isArray(data?.items)?data.items:[];
 }
 async function refresh(showStatus=false){
  if(!fridge||!fold?.open||document.getElementById('family-calendar-panel')?.hidden||state.loading||state.busy)return;
  if(fridge.querySelector('.family-fridge-edit'))return;
  state.loading=true;
  if(showStatus)status('Checking the family fridge…');
  try{
   state.items=await fetchServer();
   renderItems();
   if(showStatus)status('Up to date. Changes are shared with approved family members.');
  }catch(error){
   if(showStatus)status('Could not load the shared note: '+String(error.message||'Try again.').slice(0,125),true);
  }finally{state.loading=false;}
 }
 async function change(action,params,message){
  if(state.busy||!fridge)return false;
  state.busy=true;
  fridge.querySelectorAll('button,input').forEach(e=>e.disabled=true);
  status('Saving to the family fridge…');
  try{
   const client=await connect();
   const {data,error}=await client.rpc('community_family_fridge_change',Object.assign({p_action:action},params));
   if(error)throw error;
   state.items=Array.isArray(data?.items)?data.items:[];
   renderItems();
   status(message||'Shared list updated.');
   return true;
  }catch(error){
   status('Not saved: '+String(error.message||'Please try again.').slice(0,160),true);
   renderItems();
   return false;
  }finally{
   state.busy=false;
   fridge.querySelectorAll('button,input').forEach(e=>e.disabled=false);
   renderItems();
  }
 }
 async function onSubmit(event){
  const form=event.target;if(!(form instanceof HTMLFormElement))return;
  if(!form.matches('.family-fridge-add,.family-fridge-edit'))return;
  event.preventDefault();
  if(state.busy)return;
  const name=form.elements.namedItem('item')?.value.trim();
  const qty=form.elements.namedItem('quantity')?.value.trim()||'';
  if(!name){status('Enter an item name.',true);return;}
  const edit=form.matches('.family-fridge-edit');
  const category=edit?form.dataset.category:form.dataset.fridgeCategory;
  const params={p_category:category,p_name:name,p_quantity:qty};
  if(edit)params.p_id=Number(form.dataset.id);
  const ok=await change(edit?'edit':'add',params,edit?'Item updated for everyone.':'Added to the family note.');
  if(ok&&!edit){
   form.reset();
   form.elements.namedItem('item')?.focus();
  }
 }
 async function onChange(event){
  const checkbox=event.target;
  if(!checkbox.matches('input[data-fridge-check]')||state.busy)return;
  const id=Number(checkbox.dataset.fridgeCheck);
  const done=Boolean(checkbox.checked);
  await change('check',{p_id:id,p_done:done},done?'Marked picked up.':'Back on the shopping list.');
 }
 function editRow(item,row){
  const form=make('form','family-fridge-edit');
  form.dataset.id=item.id;form.dataset.category=item.category;
  const name=make('label','family-fridge-edit-field');name.append(make('span','','Item'));
  const input=make('input');input.type='text';input.name='item';input.value=item.name;input.maxLength=100;input.required=true;
  name.append(input);
  const qty=make('label','family-fridge-edit-field');qty.append(make('span','','Quantity'));
  const amount=make('input');amount.type='text';amount.name='quantity';amount.value=item.quantity||'';amount.maxLength=40;
  qty.append(amount);
  const actions=make('div','family-fridge-edit-tools');
  const save=make('button','family-fridge-save','Save');save.type='submit';
  const cancel=make('button','family-fridge-cancel','Cancel');cancel.type='button';
  cancel.dataset.fridgeAction='cancel';
  actions.append(save,cancel);form.append(name,qty,actions);
  row.replaceChildren(form);input.focus();input.select();
 }
 async function onClick(event){
  const target=event.target.closest('button[data-fridge-action]');
  if(!target||state.busy)return;
  const li=target.closest('li[data-fridge-id]'),id=Number(li?.dataset.fridgeId);
  const item=findItem(id);
  if(!item)return;
  if(target.dataset.fridgeAction==='edit')editRow(item,li);
  else if(target.dataset.fridgeAction==='cancel')renderItems();
  else if(target.dataset.fridgeAction==='remove'){
   if(window.confirm('Remove '+item.name+' from the shared family note?')){
    await change('remove',{p_id:id},'Removed from the family note.');
   }
  }
 }
 const observer=new MutationObserver(()=>{if(build())observer.disconnect()});
 if(!build())observer.observe(fridgeBoard.parentElement||document.body,{subtree:true,childList:true});
}
