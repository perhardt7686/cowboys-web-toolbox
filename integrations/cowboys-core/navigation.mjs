const tones = ["amber","blue","orange","violet","teal","rose"];
export function normalizeSections(sections) {
  const seen=new Set();
  return sections.filter(section=>section&&typeof section.id==="string"&&section.id&&!seen.has(section.id)&&seen.add(section.id))
    .map((section,index)=>({...section,label:String(section.label||section.id),group:String(section.group||"Your sections"),
      color:tones.includes(section.color)?section.color:tones[index%tones.length]}));
}
export function filterSections(sections,query) {
  const terms=String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return sections.filter(section=>terms.every(term=>(section.label+" "+section.group).toLocaleLowerCase().includes(term)));
}
function element(tag,options={},children=[]) {
  const node=document.createElement(tag);
  for(const [key,value]of Object.entries(options)){
    if(key==="text")node.textContent=value;
    else if(key==="class")node.className=value;
    else node.setAttribute(key,value);
  }
  node.append(...children);
  return node;
}
function safeRead(storage,key,fallback) {
  try {const value=JSON.parse(storage.getItem(key));return Array.isArray(value)?value.filter(v=>typeof v==="string"):fallback;}catch{return fallback;}
}
function safeWrite(storage,key,value){try{storage.setItem(key,JSON.stringify(value));}catch{}}

/** Mount inside the existing authenticated Core shell. All routes/actions are supplied by that shell. */
export function mountCoreNavigation({host,sections,onNavigate,actions=[],activeId,storage=globalThis.localStorage}) {
  const list=normalizeSections(sections),valid=new Set(list.map(s=>s.id));
  let active=valid.has(activeId)?activeId:list[0]?.id;
  let pinned=safeRead(storage,"core.navigation.pinned",[]).filter(id=>valid.has(id));
  let recent=safeRead(storage,"core.navigation.recent",[]).filter(id=>valid.has(id)).slice(0,5);
  let query="";
  if(!document.querySelector('link[data-core-navigation]')){
    document.head.append(element("link",{rel:"stylesheet",href:new URL("./navigation.css",import.meta.url).href,"data-core-navigation":""}));
  }
  const root=element("nav",{class:"core-nav","aria-label":"Core sections"});
  const brand=element("div",{class:"core-nav-brand"},[
    element("span",{class:"core-nav-mark","aria-hidden":"true",text:"C"}),
    element("div",{},[element("strong",{text:"Cowboy’s Core"}),element("span",{text:"A little more room to think."})])]);
  const tabs=element("div",{class:"core-nav-tabs",role:"tablist","aria-label":"Main sections"});
  const more=element("button",{class:"core-nav-more",type:"button","aria-haspopup":"dialog",text:"Menu & search"});
  const dialog=element("dialog",{class:"core-nav-dialog","aria-label":"Core menu"});
  const search=element("input",{type:"search",placeholder:"Find a section…","aria-label":"Find a section",autocomplete:"off"});
  const close=element("button",{type:"button",class:"core-nav-close","aria-label":"Close menu",text:"×"});
  const resultList=element("div",{class:"core-nav-results"});
  const menuHead=element("div",{class:"core-nav-menu-head"},[element("h2",{text:"Your Core"}),close]);
  dialog.append(menuHead,element("div",{class:"core-nav-search"},[search]),resultList);
  root.append(brand,tabs,more,dialog);
  host.replaceChildren(root);

  function select(id) {
    if(!valid.has(id))return;
    active=id;
    recent=[id,...recent.filter(value=>value!==id)].slice(0,5);
    safeWrite(storage,"core.navigation.recent",recent);
    renderTabs();
    if(dialog.open)dialog.close();
    onNavigate?.(id);
  }
  function tabButton(section) {
    const button=element("button",{type:"button",role:"tab",class:"core-nav-tab core-tone-"+section.color,
      "aria-selected":String(section.id===active),"data-section-id":section.id,text:section.label});
    button.addEventListener("click",()=>select(section.id));
    return button;
  }
  function renderTabs() {
    const primary=[...pinned.map(id=>list.find(s=>s.id===id)),...list.filter(s=>!pinned.includes(s.id))].slice(0,5);
    if(active&&!primary.some(s=>s.id===active)) primary[primary.length-1]=list.find(s=>s.id===active);
    tabs.replaceChildren(...primary.map(tabButton));
    tabs.querySelectorAll('[role="tab"]').forEach((button,index,buttons)=>{
      button.tabIndex=button.getAttribute("aria-selected")==="true"?0:-1;
      button.addEventListener("keydown",event=>{
        let next=index;
        if(event.key==="ArrowRight")next=(index+1)%buttons.length;
        else if(event.key==="ArrowLeft")next=(index+buttons.length-1)%buttons.length;
        else if(event.key==="Home")next=0;
        else if(event.key==="End")next=buttons.length-1;
        else return;
        event.preventDefault();
        buttons[next].focus();
        select(buttons[next].dataset.sectionId);
      });
    });
  }
  function menuRow(section) {
    const row=element("div",{class:"core-nav-menu-row"});
    const button=element("button",{type:"button",class:"core-nav-menu-link core-tone-"+section.color,
      "aria-current":section.id===active?"page":"false","data-menu-section":section.id},[
      element("i",{"aria-hidden":"true"}),element("span",{text:section.label})]);
    const pin=element("button",{type:"button",class:"core-nav-pin","aria-label":(pinned.includes(section.id)?"Unpin ":"Pin ")+section.label,
      "aria-pressed":String(pinned.includes(section.id)),text:pinned.includes(section.id)?"★":"☆"});
    button.addEventListener("click",()=>select(section.id));
    pin.addEventListener("click",()=>{
      pinned=pinned.includes(section.id)?pinned.filter(id=>id!==section.id):[...pinned,section.id].slice(-5);
      safeWrite(storage,"core.navigation.pinned",pinned);
      renderTabs();renderMenu();search.focus();
    });
    row.append(button,pin);
    return row;
  }
  function renderMenu() {
    const matches=filterSections(list,query);
    resultList.replaceChildren();
    if(!query&&recent.length) {
      resultList.append(element("h3",{text:"Recently opened"}),...recent.map(id=>menuRow(list.find(s=>s.id===id))));
    }
    const groups=[...new Set(matches.map(s=>s.group))];
    for(const group of groups){
      resultList.append(element("h3",{text:group}),...matches.filter(s=>s.group===group).map(menuRow));
    }
    if(!matches.length)resultList.append(element("p",{class:"core-nav-empty",text:"No sections match. Try another word."}));
    const enabled=actions.filter(action=>typeof action.run==="function"&&typeof action.label==="string");
    if(!query&&enabled.length){
      const actionsBox=element("div",{class:"core-nav-actions"});
      for(const action of enabled){
        const button=element("button",{type:"button",text:action.label});
        button.addEventListener("click",()=>{dialog.close();action.run();});
        actionsBox.append(button);
      }
      resultList.append(element("h3",{text:"Quick actions"}),actionsBox);
    }
  }
  function openMenu(){query="";search.value="";renderMenu();dialog.showModal();search.focus();}
  more.addEventListener("click",openMenu);
  close.addEventListener("click",()=>dialog.close());
  search.addEventListener("input",()=>{query=search.value;renderMenu();});
  dialog.addEventListener("click",event=>{if(event.target===dialog){
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
  }});
  dialog.addEventListener("close",()=>more.focus());
  const shortcut=event=>{
    if(event.key==="/"&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)
      &&!event.target.isContentEditable){event.preventDefault();if(!dialog.open)openMenu();}
  };
  document.addEventListener("keydown",shortcut);
  renderTabs();
  return {setActive(id){if(valid.has(id)){active=id;renderTabs();}},
    destroy(){document.removeEventListener("keydown",shortcut);dialog.remove();host.replaceChildren();}};
}
