import {readDraft,saveDraft} from './forum-core.mjs';
export function attachDraft(form,key,{preview=false,onRestore,exclude=[]}={}){
  if(!form||preview)return;
  let storage;try{storage=window.localStorage;}catch{return;}
  const note=document.createElement('div');note.className='forum-draft';note.setAttribute('role','status');
  note.innerHTML='<span>Text drafts stay on this browser for 30 days.</span><button type="button" class="text-button" data-draft-clear>Discard draft</button>';
  form.prepend(note);
  const collect=()=>Object.fromEntries([...new Set([...form.elements].filter(e=>e.name&&!exclude.includes(e.name)&&e.type!=='file'&&e.type!=='password').map(e=>e.name))].map(name=>{
    const e=form.elements.namedItem(name);return [name,e.type==='checkbox'?e.checked:e.multiple?[...e.selectedOptions].map(x=>x.value):e.value];
  }));
  const existing=readDraft(storage,key);
  if(existing){for(const [name,value] of Object.entries(existing.values||{})){const e=form.elements.namedItem(name);if(!e||e.type==='file'||e.type==='password')continue;if(e.type==='checkbox')e.checked=value===true;else if(e.multiple){for(const o of e.options)o.selected=Array.isArray(value)&&value.includes(o.value);}else e.value=String(value??'');}note.firstElementChild.textContent='Restored your unsent text draft from this browser.';onRestore?.();}
  const save=()=>{const ok=saveDraft(storage,key,collect());note.firstElementChild.textContent=ok?'Draft saved on this browser. Clear it on shared devices.':'Browser storage is unavailable. Keep this page open to retain your draft.';};
  form.addEventListener('input',save);form.addEventListener('change',save);
  note.querySelector('button').addEventListener('click',()=>{try{storage.removeItem(key);}catch{}form.reset();note.firstElementChild.textContent='Draft discarded. Nothing was posted.';onRestore?.();});
  return {destroy(){form.removeEventListener('input',save);form.removeEventListener('change',save);note.remove();},clear(){try{storage.removeItem(key);}catch{}},save};
}
