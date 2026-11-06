const PAGE=24;
const sections=[
  ['all','All records'],['service','Service timeline'],['customers','Customers & properties'],
  ['documents','Documents'],['media','Media & notes'],['metadata','Photo metadata'],
  ['files','All files'],['personal','Personal'],['review','Needs review'],['sources','Sources'],['overview','Coverage']
];
const label=new Map(sections);
const num=n=>new Intl.NumberFormat('en-US').format(Number(n)||0);
const allowedArchiveKey=x=>typeof x==='string'&&/^[a-z0-9-]{1,60}$/.test(x);
const allowedRecordKey=x=>typeof x==='string'&&/^[a-z-]+-\d{1,6}$/.test(x);
const sourceLabel=key=>{
  const part=/^takeout-part-(\d+)$/.exec(key);
  return part?'Takeout part '+part[1]:key;
};
const hasDate=x=>!x||/^\d{4}-\d{2}-\d{2}$/.test(x);
const node=(tag,cls='',value)=>{
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(value!==undefined)e.textContent=String(value);
  return e;
};
const button=(text,fn,cls='ccore-btn')=>{
  const b=node('button',cls,text);
  b.type='button';
  b.addEventListener('click',fn);
  return b;
};
const link=(href,text)=>{
  try{
    const u=new URL(href);
    if(u.protocol!=='https:'||u.username||u.password)return null;
    const library=u.hostname==='chatgpt.com'&&u.pathname==='/library'&&/^libfile_[a-z0-9]+$/.test(u.searchParams.get('file_id')||'');
    const drive=u.hostname==='drive.google.com'&&/^\/(?:file\/d|drive\/folders)\//.test(u.pathname);
    if(!library&&!drive)return null;
    const a=node('a','ccore-source',text);
    a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';
    return a;
  }catch{return null;}
};
const field=(text,control)=>{
  const l=node('label','ccore-field');
  l.append(node('span','',text),control);
  return l;
};
const select=(options)=>{
  const s=node('select');
  for(const [v,t] of options){const o=node('option','',t);o.value=v;s.append(o);}
  return s;
};
const table=(header,rows)=>{
  const wrap=node('div','ccore-table');
  const t=node('table'), head=node('thead'), h=node('tr'), body=node('tbody');
  for(const cell of header){const th=node('th','',cell);th.scope='col';h.append(th);}
  head.append(h);
  for(const cells of rows){const tr=node('tr');for(const cell of cells)tr.append(node('td','',cell));body.append(tr);}
  t.append(head,body);wrap.append(t);wrap.tabIndex=0;return wrap;
};
const plain=s=>s.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\x60([^\x60]+)\x60/g,'$1');
const split=s=>s.trim().replace(/^\||\|$/g,'').replace(/\\\|/g,'\u001f').split('|').map(x=>plain(x.trim().replaceAll('\u001f','|')));
function reading(raw){
  const out=node('div','ccore-reading');
  const lines=String(raw).split('\n');
  for(let i=0;i<lines.length;){
    const x=lines[i].trim();
    if(!x){i++;continue;}
    if(x.startsWith('|')&&/^[|\s:-]+$/.test(lines[i+1]||'')&&(lines[i+1]||'').includes('|')){
      const h=split(x),rows=[];i+=2;
      while(i<lines.length&&lines[i].trim().startsWith('|'))rows.push(split(lines[i++]));
      out.append(table(h,rows));continue;
    }
    if(/^[-*] /.test(x)){
      const list=node('ul');
      while(i<lines.length&&/^[-*] /.test(lines[i].trim()))list.append(node('li','',plain(lines[i++].trim().slice(2))));
      out.append(list);continue;
    }
    out.append(node(x.startsWith('#')?'h5':'p','',plain(x.replace(/^#+\s*/,''))));i++;
  }
  return out;
}
function drawer(name,value,open=false){
  const d=node('details','ccore-fold');
  d.open=open;
  d.append(node('summary','',name),value);
  return d;
}
const formatRaw=value=>{
  if(typeof value!=='string')return JSON.stringify(value,null,2);
  try{return JSON.stringify(JSON.parse(value),null,2);}catch{return value;}
};

// An owner dashboard instance passes the same authenticated client that opened it.
// The database independently enforces the specific archive owner's Auth UID.
export function mountCowboysCore(host,{client,authorized}){
  let closed=false, generation=0, detailGen=0, offset=0, total=0, current='all', topicMap={}, counts={}, loaded=false;
  const valid=()=>!closed&&host.isConnected&&authorized();
  const destroy=()=>{
    closed=true;generation++;detailGen++;
    if(dialog.open)dialog.close();
    host.replaceChildren();
  };
  const page=node('section','ccore');
  const hero=node('header','ccore-hero');
  const heroWords=node('div');
  heroWords.append(node('p','ccore-kicker','PRIVATE WORKSPACE'),node('h3','','Cowboys Core'),
    node('p','ccore-lead','Search your tickets, source notes, and archived files in one library.'));
  const seal=node('div','ccore-seal');
  seal.append(node('span','ccore-crown','♛'),node('span','','OWNER ONLY'));
  seal.setAttribute('aria-hidden','true');
  hero.append(heroWords,seal);
  const metrics=node('div','ccore-metrics');
  const scope=node('p','ccore-scope','Checking access…');
  scope.setAttribute('role','status');
  const body=node('div','ccore-body');
  const categories=node('nav','ccore-categories');
  categories.setAttribute('aria-label','Cowboys Core categories');
  const form=node('form','ccore-form');
  const query=node('input');
  query.type='search';query.maxLength=180;query.autocomplete='off';query.spellcheck=false;
  query.placeholder='Name, address, product, amount or record ID';
  const action=node('button','ccore-btn ccore-primary','Search');action.type='submit';
  const searchbar=node('div','ccore-search');
  searchbar.append(field('Search library',query),action);
  const adv=node('details','ccore-advanced');
  adv.append(node('summary','','Search options'));
  const grid=node('div','ccore-filter-grid');
  const topics=select([['','All topics']]);
  const mode=select([['words','All search terms'],['phrase','Exact phrase'],['id','Exact record or source ID']]);
  const sort=select([['relevance','Best match'],['newest','Newest dated first'],['oldest','Oldest dated first'],['title','Title A–Z'],['recorded','Source order']]);
  const match=select([['','Any metadata status'],['matched','Matched media'],['unmatched','Unmatched metadata']]);
  const from=node('input'),to=node('input');from.type=to.type='date';
  const needs=node('input');needs.type='checkbox';
  const reviewLabel=node('label','ccore-check');reviewLabel.append(needs,node('span','','Only records flagged for review'));
  grid.append(field('Search mode',mode),field('Topic or record type',topics),field('Sort',sort),field('Metadata status',match),
    field('Source date from',from),field('Source date through',to));
  adv.append(grid,reviewLabel,node('p','ccore-help','Date filters use the date recorded for each item and leave out undated records.'));
  const shortcuts=node('div','ccore-shortcuts');
  const shortcut=(title,filter)=>button(title,()=>{
    form.reset();current=filter.category;setTopics();
    topics.value=filter.topic||'';match.value=filter.match||'';
    drawCategories();void run(0);
  },'ccore-chip');
  shortcuts.append(
    shortcut('Dated tickets',{category:'service'}),
    shortcut('Agreements',{category:'documents',topic:'Agreement'}),
    shortcut('Videos',{category:'files',topic:'Video'}),
    shortcut('Unmatched metadata',{category:'metadata',match:'unmatched'}),
    shortcut('Review queue',{category:'review'})
  );
  const clear=button('Clear filters',()=>{
    form.reset();current='all';setTopics();drawCategories();void run(0);
  },'ccore-plain');
  const resultStatus=node('p','ccore-status');resultStatus.setAttribute('role','status');
  const rows=node('div','ccore-rows');
  const paging=node('div','ccore-paging');
  const prev=button('← Previous',()=>void run(Math.max(0,offset-PAGE)));
  const next=button('Next →',()=>void run(offset+PAGE));
  paging.append(prev,next);paging.hidden=true;
  form.append(searchbar,shortcuts,adv,clear);
  const work=node('div','ccore-work');
  work.append(form,resultStatus,rows,paging);
  body.append(categories,work);
  body.hidden=true;
  const dialog=node('dialog','ccore-dialog');
  dialog.setAttribute('aria-labelledby','ccore-detail-title');
  const dhead=node('div','ccore-dialog-head');
  const dtitle=node('h4');dtitle.id='ccore-detail-title';
  const close=button('Close',()=>dialog.close());
  dhead.append(dtitle,close);
  const contents=node('div','ccore-dialog-body');
  dialog.append(dhead,contents);
  dialog.addEventListener('close',()=>{detailGen++;contents.replaceChildren();dtitle.textContent='';});
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  page.append(hero,scope,metrics,body,dialog);host.replaceChildren(page);

  function setTopics(){
    const keep=topics.value;
    topics.replaceChildren();
    const available=current==='all'?[]:topicMap[current]||[];
    for(const t of [['','All topics'],...available.map(x=>[x,x])]){
      const o=node('option','',t[1]);o.value=t[0];topics.append(o);
    }
    if(available.includes(keep))topics.value=keep;
    topics.disabled=current==='all'||!available.length;
  }
  function drawCategories(){
    categories.replaceChildren(node('p','ccore-nav-label','BROWSE'));
    for(const [key,title] of sections){
      const b=button('',()=>{
        current=key;setTopics();topics.value='';match.value='';
        drawCategories();void run(0);
      },'ccore-category');
      b.setAttribute('aria-pressed',String(key===current));
      b.append(node('span','',title),node('small','',key==='all'?num(Object.values(counts).reduce((x,v)=>x+Number(v),0)):num(counts[key])));
      categories.append(b);
    }
  }
  function drawOverview(data){
    const o=data.coverage?.overview||{};
    metrics.replaceChildren();
    for(const [title,n] of [['Archive entries',o['Archive entries']],['Dated tickets',o['Dated service tickets']],
      ['Document areas',o['Document areas read']],['Videos decoded',o['Videos decoded']]]){
      const m=node('div','ccore-metric');m.append(node('b','',num(n)),node('span','',title));metrics.append(m);
    }
    scope.replaceChildren(node('span','',num(data.coverage?.catalog_records)+' catalog records · '+
      num(data.coverage?.parts_reviewed)+' of '+num(data.coverage?.parts_reported)+' reported Takeout parts'));
    for(const source of data.coverage?.source_workbooks||[]){
      if(!allowedArchiveKey(source.archive_key))continue;
      const a=link(source.url,sourceLabel(source.archive_key)+' workbook ↗');
      if(a)scope.append(a);
    }
  }
  function showRows(items){
    rows.replaceChildren();
    if(!items.length){rows.append(node('p','ccore-empty','No records match these filters. Try a shorter search or clear the filters.'));return;}
    for(const item of items){
      if(!allowedArchiveKey(item.archive_key)||!allowedRecordKey(item.record_key))continue;
      const card=button('',()=>void showDetail(item.archive_key,item.record_key),'ccore-row');
      const desc=node('span','ccore-row-text'), meta=node('span','ccore-row-meta');
      desc.append(node('strong','',item.title),node('small','',item.summary||item.topic));
      meta.append(node('span','ccore-tag',label.get(item.category)||item.category));
      if(item.display_id)meta.append(node('span','ccore-id',item.display_id));
      meta.append(node('span','ccore-row-date',sourceLabel(item.archive_key)));
      if(item.record_date)meta.append(node('span','ccore-row-date',item.record_date));
      if(item.review_needed)meta.append(node('span','ccore-tag ccore-tag-review','Check source'));
      card.append(desc,meta);rows.append(card);
    }
  }
  async function run(start=0){
    if(!valid())return;
    if(!hasDate(from.value)||!hasDate(to.value)||from.value&&to.value&&from.value>to.value){
      resultStatus.textContent='Choose a start date before or on the end date.';return;
    }
    const runID=++generation;
    offset=start;action.disabled=true;prev.disabled=next.disabled=true;
    if(loaded)resultStatus.textContent='Searching…';
    try{
      const {data,error}=await client().rpc('toolbox_archive_search',{
        p_archive:null,p_query:query.value.trim(),p_category:current==='all'?null:current,
        p_topic:topics.value||null,p_from:from.value||null,p_to:to.value||null,p_review_only:needs.checked,
        p_metadata_status:match.value||null,p_match:mode.value,p_sort:sort.value,p_offset:start,p_limit:PAGE
      });
      if(!valid()||runID!==generation)return;
      if(error||!data||!Array.isArray(data.items))throw new Error(error?.code||'archive');
      total=Number(data.total)||0;
      if(!loaded){
        counts=data.categories||{};topicMap=data.topics||{};setTopics();drawCategories();drawOverview(data);
        loaded=true;body.hidden=false;
      }
      showRows(data.items);
      resultStatus.textContent=total?num(start+1)+'–'+num(start+data.items.length)+' of '+num(total)+' records':'0 matching records';
      prev.disabled=start===0;next.disabled=start+PAGE>=total;paging.hidden=total<=PAGE;
    }catch{
      if(!valid()||runID!==generation)return;
      if(dialog.open)dialog.close();
      rows.replaceChildren();
      paging.hidden=true;
      scope.textContent='Cowboys Core is unavailable. Open it again from your owner dashboard to retry.';
      metrics.replaceChildren();body.hidden=true;loaded=false;
    }finally{if(valid()&&runID===generation)action.disabled=false;}
  }
  async function showDetail(archiveKey,key){
    if(!valid()||!allowedArchiveKey(archiveKey)||!allowedRecordKey(key))return;
    const id=++detailGen;
    contents.replaceChildren(node('p','','Loading record…'));
    dtitle.textContent='Archive record';
    if(!dialog.open)dialog.showModal();
    try{
      const {data,error}=await client().from('toolbox_archive_records')
        .select('record_key,category,topic,display_id,source_id,title,record_date,date_basis,review_needed,metadata_status,related_ids,payload')
        .eq('archive_key',archiveKey).eq('record_key',key).maybeSingle();
      if(!valid()||id!==detailGen||!dialog.open)return;
      if(error||!data?.payload?.fields)throw new Error('record');
      dtitle.textContent=data.title;
      contents.replaceChildren();
      const details=node('p','ccore-detail-meta',[
        sourceLabel(archiveKey), data.display_id, data.topic, data.record_date&&(data.record_date+' · '+data.date_basis),
        data.payload.worksheet&&data.payload.worksheet+' · Row '+data.payload.row
      ].filter(Boolean).join('  /  '));
      contents.append(details);
      if(data.review_needed)contents.append(node('p','ccore-detail-review','Check the original source before relying on this reading.'));
      const flat=node('dl','ccore-values'), folds=[];
      for(const [title,value] of Object.entries(data.payload.fields)){
        if(value===null||value==='')continue;
        if(/^Exact |^(Preserved|Indexed) metadata JSON$/.test(title)&&title!=='Exact path in ZIP'){
          const isJSON=title.endsWith('JSON')||typeof value==='string'&&/^[{\[]/.test(value.trim());
          folds.push(drawer(title,isJSON?node('pre','ccore-pre',formatRaw(value)):reading(value),title==='Exact transcription'));
        }else{
          const dd=node('dd');
          const a=link(value,'Open private source ↗');
          if(a)dd.append(a);else dd.textContent=String(value);
          flat.append(node('dt','',title),dd);
        }
      }
      if(flat.childElementCount)contents.append(flat);
      for(const f of folds)contents.append(f);
      const rel=(data.related_ids||[]).filter(x=>/^P\d{3}-[A-Z0-9]{3,10}$/.test(x));
      if(rel.length){
        const target=node('div','ccore-related');
        target.append(node('p','ccore-kicker','RELATED SOURCE IDS'));
        const tags=node('div','ccore-shortcuts');
        for(const ref of rel)tags.append(button(ref,()=>{
          dialog.close();form.reset();query.value=ref;mode.value='id';current='all';
          setTopics();drawCategories();void run(0);query.focus();
        },'ccore-chip'));
        target.append(tags);contents.append(target);
      }
      contents.append(drawer('Raw source row',node('pre','ccore-pre',JSON.stringify(data.payload,null,2))));
      close.focus();
    }catch{
      if(valid()&&id===detailGen&&dialog.open)contents.replaceChildren(node('p','','The record could not be read. Close this panel and try again.'));
    }
  }
  form.addEventListener('submit',e=>{e.preventDefault();void run(0);});
  for(const input of [topics,mode,sort,match,from,to,needs])input.addEventListener('change',()=>void run(0));
  if(valid())void run(0);else destroy();
  return {destroy};
}
