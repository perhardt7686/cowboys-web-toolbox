import {
  TABS,BODIES,EXPRESSIONS,HAIR_STYLES,SKIN_TONES,COAT_TONES,
  REWARDS,REWARD_BY_ID,newDemoState,compatible,updateDemoState,visibleRewards
} from './avatar-v8-core.mjs';

const root=document.getElementById('app');
let state=newDemoState(),undo=[],redo=[],notice='Choose a detail to see it instantly. Nothing saves to a family account.';
const ink='#2b2835';
const line=' stroke="'+ink+'" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
const selected=(a,b)=>a===b?' aria-pressed="true"':' aria-pressed="false"';
const safeName=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fill=(c)=>' fill="'+c+'"';
function piece(path,color,stroke=true){return '<path d="'+path+'"'+fill(color)+(stroke?line:'')+'/>';}
function ellipse(cx,cy,rx,ry,color){return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"'+fill(color)+line+'/>';}
function circle(cx,cy,r,color){return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'"'+fill(color)+line+'/>';}
function bodyArt(){
  const coat=state.coat,skin=state.skin;
  const outer=state.equipped.outerwear||'';
  const hat=state.equipped.hat||'';
  const glasses=state.equipped.eyewear||'';
  const boots=state.equipped.footwear||'';
  const prop=state.equipped.prop||'';
  const claws=state.equipped.hands||'';
  const scanner=state.equipped.bodypart||'';
  const back=state.angle==='back',profile=state.angle==='profile';
  let bits='';
  if(outer==='studio-rain-cape'||outer==='studio-tower-cape'){
    bits+=piece('M111 165 Q170 142 233 165 L270 380 Q176 414 90 375 Z',
      outer==='studio-rain-cape'?'#4d777a':'#827099');
    bits+=piece('M115 179 Q164 163 223 180','none').replace(' fill="none"',' fill="none"');
  }
  if(state.body==='human'){
    bits+=piece('M126 301 L162 307 157 420 115 421 Z','#303c50');
    bits+=piece('M184 306 L225 298 239 418 196 421 Z','#354153');
    if(boots){bits+=piece('M114 383 L156 384 156 426 106 430 104 410 Z','#796344');
      bits+=piece('M194 383 L239 384 249 426 197 430 Z','#796344');}
    else{bits+=piece('M113 414 L159 414 166 433 105 434 Z','#3a2c3a');
      bits+=piece('M194 414 L240 412 250 433 190 434 Z','#3a2c3a');}
    bits+=piece('M124 172 Q98 183 80 279 L99 295 Q128 259 142 207 Z',coat);
    bits+=piece('M224 170 Q250 174 267 272 L246 290 205 210 Z',coat);
    bits+=ellipse(94,291,16,20,skin)+ellipse(254,291,16,20,skin);
    bits+=piece('M124 169 Q176 145 226 170 L231 322 116 323 Z',outer==='studio-observatory-coat'?'#324f6d':coat);
    bits+=piece('M164 167 L187 167 197 318 157 318 Z','#ecd9b0');
    bits+=piece('M157 176 L179 216 195 180','#eac8a0');
    bits+=piece('M147 321 Q178 332 206 321','none');
    bits+=piece('M153 151 L151 174 196 174 192 150 Z',skin);
    if(!back){
      bits+=piece(profile?
        'M146 65 Q200 38 222 96 L226 132 Q210 166 162 162 Q142 140 141 102 Z':
        'M126 76 Q143 47 179 49 Q221 50 228 86 L224 143 Q204 178 164 169 Q130 161 121 120 Z',skin);
      bits+=ellipse(profile?211:132,111,11,20,skin);
      const hairpaths={
        swoop:'M119 105 Q101 53 150 36 Q211 14 233 77 Q211 64 191 81 Q155 70 119 105 Z',
        shag:'M119 109 Q97 63 135 37 Q184 8 222 55 L238 100 220 90 206 113 191 91 170 115 145 87 Z',
        bob:'M126 85 Q115 38 179 32 Q233 36 235 83 L229 154 212 160 204 83 Q160 94 128 95 Z',
        short:'M118 96 Q111 44 171 38 Q221 37 231 83 L210 74 Q184 55 155 80 Z'
      };
      bits+=piece(hairpaths[state.hair],state.hair==='shag'?'#352c37':'#3d303b');
      if(profile){
        bits+=piece('M196 105 Q205 97 216 104','none');
        bits+=ellipse(207,111,3,5,ink);
        bits+=piece('M217 112 L235 125 222 131',skin);
      }else{
        bits+=piece('M146 103 Q156 95 168 102','none')+piece('M187 101 Q201 95 212 102','none');
        bits+=ellipse(158,113,6,8,'#fff3df')+ellipse(202,112,6,8,'#fff3df');
        bits+=ellipse(160,114,3,5,ink)+ellipse(199,114,3,5,ink);
        bits+=piece('M179 112 L172 130 187 132','none');
      }
      if(state.expression==='smile')bits+=piece('M158 146 Q177 161 199 146','none');
      else if(state.expression==='brave')bits+=piece('M163 148 L197 147','none');
      else if(state.expression==='surprised')bits+=ellipse(179,150,7,10,'#482d3b');
      else bits+=piece('M159 148 Q171 155 187 149','none');
    }else{
      bits+=piece('M127 81 Q139 48 178 45 Q222 48 226 89 L226 149 Q195 178 145 163 Z',skin);
      bits+=piece('M121 104 Q107 48 163 33 Q221 15 239 85 L230 151 Q217 170 208 160 L210 99 Q169 122 121 104 Z','#372d38');
    }
    if(outer==='studio-observatory-coat')bits+=piece('M120 177 L144 186 134 301 164 321 122 322 Z','#253e5b')+
       piece('M228 177 L205 188 218 300 192 323 231 322 Z','#253e5b');
    if(glasses&&!back)bits+=piece('M138 104 Q155 97 170 103 L174 118 Q155 128 143 118 Z','#eac5a3')+
      piece('M187 103 Q204 97 219 104 L214 119 Q198 127 185 118 Z','#eac5a3')+
      piece('M174 108 L186 108','none');
  }else{
    bits+=piece('M128 303 L164 306 160 420 119 422 Z','#68717a')+piece('M190 306 L226 303 236 422 195 422 Z','#68717a');
    bits+=piece('M112 419 L163 416 168 434 108 434 Z','#394953')+piece('M190 417 L238 416 246 434 187 434 Z','#394953');
    bits+=piece('M128 166 Q100 172 86 275 L108 285 150 206 Z','#c58865');
    bits+=piece('M218 168 Q247 174 259 275 L238 285 201 203 Z','#c58865');
    bits+=ellipse(94,282,17,18,'#e8bb80')+ellipse(249,283,17,18,'#e8bb80');
    bits+=piece('M122 168 L226 168 236 306 113 306 Z',coat);
    bits+=piece('M143 198 L204 198 209 269 141 269 Z','#d5bc96');
    bits+=piece('M164 203 L190 203 192 265 162 265 Z','#577a7d');
    bits+=circle(155,289,7,'#d2a569')+circle(191,288,7,'#d2a569');
    bits+=piece('M142 81 Q144 53 175 50 Q219 49 224 80 L225 151 Q194 169 143 153 Z','#bd836d');
    bits+=piece('M149 69 L212 69 215 128 147 128 Z','#d8b598');
    if(!back){
      bits+=piece('M158 96 L171 96 171 109 157 109 Z','#8be3ca');
      bits+=piece('M189 96 L202 96 202 109 189 109 Z','#8be3ca');
      bits+=piece(state.expression==='surprised'?'M168 130 Q181 122 193 130':'M163 130 L198 130','none');
    }else bits+=piece('M164 98 L201 98 202 134 163 134 Z','#806a73');
    bits+=circle(142,77,6,'#d4bc85')+circle(224,76,6,'#d4bc85');
    if(scanner)bits+=piece('M142 82 L222 82 222 117 142 117 Z','#a7daca')+piece('M161 95 L205 95','none');
    if(claws)bits+=piece('M77 269 L94 268 107 309 95 299 81 318 Z','#d0a267')+
      piece('M236 270 L254 268 266 318 250 299 239 308 Z','#d0a267');
  }
  if(hat)bits+=piece('M130 70 L132 40 Q179 23 223 45 L225 69 Q176 91 130 70 Z','#7f748b')+
    piece('M136 45 Q116 25 123 7 Q141 25 153 39 Z','#c7ae80')+
    piece('M201 38 Q227 25 232 7 Q240 25 220 48 Z','#c7ae80')+
    circle(177,58,9,'#e5c586');
  if(prop==='studio-backlot-flashlight')bits+=piece('M249 288 L268 306 293 283 274 266 Z','#d4ad65')+
    piece('M285 275 L309 265 315 284 295 291 Z','#f4d797');
  if(prop==='studio-observatory-telescope')bits+=piece('M252 278 L308 228 320 245 269 297 Z','#b38b62')+
    piece('M303 224 L323 213 339 231 318 250 Z','#e7c79b');
  if(profile)bits='<g transform="translate(24 0) scale(.88 1)">'+bits+'</g>';
  return bits;
}
function petArt(){
  const hound=state.pet==='studio-rain-hound';
  if(hound)return '<g class="pet-bob">'+
    piece('M65 125 Q48 93 58 72 Q81 48 107 72 L132 111 134 145 71 147 Z','#738f8a')+
    '<g class="pet-tail">'+piece('M60 104 Q25 75 22 43 Q13 31 4 45 Q5 91 47 125 Z','#8fa69c')+'</g>'+
    piece('M80 133 L85 174 104 176 109 144 Z','#6e8784')+
    piece('M122 137 L131 176 149 175 145 137 Z','#7d9890')+
    piece('M102 59 Q125 36 151 50 Q174 70 165 99 L154 131 Q126 150 107 122 Z','#a5b0a1')+
    piece('M109 65 Q96 47 108 24 Q130 36 132 55 Z','#516b73')+
    piece('M146 59 Q155 24 178 28 Q184 55 165 72 Z','#516b73')+
    ellipse(141,89,5,6,'#1f2d37')+
    ellipse(158,116,11,8,'#2c3540')+
    piece('M151 129 Q138 141 126 126','none')+
    '<path d="M77 153 L150 153" stroke="#c7b27c" stroke-width="8" stroke-linecap="round"/>'+
    circle(121,154,7,'#f1d79e')+'</g>';
  return '<g class="pet-bob">'+
    piece('M54 99 Q6 79 12 28 Q59 41 88 91 Z','#788b99')+
    piece('M113 96 Q164 36 177 26 Q185 85 133 107 Z','#788b99')+
    piece('M57 94 Q86 58 119 81 L139 155 Q116 175 77 164 Z','#82959b')+
    piece('M71 135 L65 177 87 178 100 143 Z','#657c8b')+
    piece('M115 135 L124 177 143 177 132 136 Z','#657c8b')+
    piece('M66 88 L65 45 91 68 113 66 139 41 136 90 Q149 114 125 128 L82 128 Q56 116 66 88 Z','#a2aab0')+
    piece('M77 91 L90 91 85 101 Z','#e9ca94')+
    piece('M110 90 L124 90 116 101 Z','#e9ca94')+
    ellipse(89,93,4,4,'#252b37')+ellipse(115,94,4,4,'#252b37')+
    piece('M90 111 Q102 118 115 110','none')+
    '<g class="pet-tail">'+piece('M136 149 Q178 148 179 116','none')+'</g>'+'</g>';
}
function stageSvg(){
  return '<svg viewBox="0 0 560 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Original '+safeName(state.body)+' cartoon character in '+safeName(state.angle)+' view, with '+safeName(REWARD_BY_ID.get(state.pet)?.name||'pet')+'">'+
    '<defs><linearGradient id="floor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#43364b"/><stop offset="1" stop-color="#2d3444"/></linearGradient></defs>'+
    '<circle cx="467" cy="89" r="61" fill="#f2dfb1" opacity=".24"/>'+
    '<path d="M0 422 Q270 390 560 420 L560 520 0 520 Z" fill="url(#floor)"/>'+
    '<path d="M18 420 L542 420" stroke="#e7cfad" stroke-opacity=".3" stroke-width="3"/>'+
    '<ellipse cx="275" cy="453" rx="215" ry="26" fill="#241c2d" opacity=".35"/>'+
    '<g class="'+(state.gesture==='show'?'char-show':'')+'" transform="translate(67 7)">'+bodyArt()+'</g>'+
    '<g class="pet-'+(state.gesture==='play'?'play':state.gesture==='hello'?'hello':'idle')+'" transform="translate(365 260) scale(.95)">'+petArt()+'</g>'+
    '<text x="22" y="35" font-size="14" font-weight="800" fill="#fff4db" letter-spacing="2">THE MIDNIGHT STUDIO</text>'+
    '<text x="540" y="497" text-anchor="end" font-size="13" font-weight="700" fill="#e9dabb">ORIGINAL ART · V8 PILOT</text>'+
    '</svg>';
}
function itemArt(item){
  const base='stroke="#302b3d" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const p=(d,c)=>'<path d="'+d+'" fill="'+c+'" '+base+'/>';
  let art='';
  switch(item.art){
    case 'helm':art=p('M43 76 L49 43 Q87 22 132 44 L138 76 Q89 98 43 76','#7e7897')+p('M50 53 Q25 25 40 10 Q48 31 67 46','#e8c58f')+p('M111 46 Q132 28 140 10 Q154 29 133 59','#e8c58f');break;
    case 'coat':art=p('M73 21 L111 21 133 46 153 111 111 113 100 70 83 113 33 112 53 46','#375777')+p('M86 29 L98 29 109 98 77 98','#e9d1b0');break;
    case 'telescope':art=p('M36 81 L124 24 143 49 53 105','#b69a70')+p('M125 21 L148 14 164 39 140 54','#e6c58e');break;
    case 'cape':art=p('M73 25 L107 23 148 106 Q91 118 32 107','#4c8585')+p('M77 27 L103 28 92 44','#efc99a');break;
    case 'boots':art=p('M48 20 L79 20 77 88 97 106 35 111 40 82','#92724c')+p('M104 20 L132 20 134 87 151 105 96 111 99 83','#92724c');break;
    case 'visor':art=p('M35 37 Q85 15 143 36 L142 78 Q83 99 37 77','#ba8e69')+p('M45 46 L134 45 129 67 48 66','#95d8cc');break;
    case 'claws':art=p('M43 89 L52 31 70 51 81 23 89 62 108 34 107 91','#cf9f68')+p('M110 94 L119 44 128 65 143 32 148 93','#cf9f68');break;
    case 'mantle':art=p('M71 19 L113 19 152 108 Q93 120 31 108','#81729f')+p('M72 30 L105 30 88 54','#d7b78d');break;
    case 'glasses':art=p('M22 44 Q55 29 74 44 L74 69 Q44 87 27 63 Z','#d6b5ac')+p('M105 44 Q131 29 158 45 L153 64 Q130 83 109 67 Z','#d6b5ac')+p('M74 49 Q88 41 105 49','none');break;
    case 'flashlight':art=p('M61 95 L104 46 126 70 82 109','#b89565')+p('M109 40 L135 26 155 49 129 76','#f2d6a5');break;
    case 'hound':art=p('M48 75 Q51 36 96 47 L132 64 145 105 49 105','#849d97')+p('M95 55 L95 25 119 42 137 25 141 70','#5f8387')+circle(116,77,6,'#302b3d');break;
    case 'gargoyle':art=p('M52 83 L21 29 81 49 127 48 160 28 134 91','#748b9b')+p('M65 49 L65 15 86 35 110 35 133 15 133 51 128 99 70 99','#a0a9b0');break;
  }
  return '<svg viewBox="0 0 180 120" role="img" aria-label="'+safeName(item.name)+' original item illustration">'+
    '<circle cx="90" cy="62" r="53" fill="#efdfbf" opacity=".85"/>'+art+'</svg>';
}
function button(action,value,label,current){
  return '<button type="button" data-action="'+action+'" data-value="'+safeName(value)+'"'+
    (current===undefined?'':selected(current,value))+'>'+safeName(label)+'</button>';
}
function choices(title,action,values,current,labeler){
  return '<div class="field"><h3>'+title+'</h3><div class="choice-row">'+values.map(value=>
    button(action,value,labeler?labeler(value):value,current)).join('')+'</div></div>';
}
function swatches(title,key,values){
  return '<div class="field"><h3>'+title+'</h3><div class="color-row">'+values.map((value,i)=>
    '<button class="swatch" type="button" style="background:'+value+'" data-action="'+key+
    '" data-value="'+value+'" aria-label="'+title+' color '+(i+1)+'"'+selected(value,state[key])+'></button>').join('')+'</div></div>';
}
function rewardCard(item){
  const isPet=item.slot==='companion';
  const chosen=isPet?state.pet===item.id:state.equipped[item.slot]===item.id;
  const fit=compatible(state.body,item);
  return '<article class="reward-card'+(chosen?' is-selected':'')+'">'+
    '<div class="art">'+itemArt(item)+'</div>'+
    '<span class="mini-pill">'+safeName(item.tier)+' · Demo preview</span>'+
    '<strong>'+safeName(item.name)+'</strong>'+
    '<small>'+safeName(isPet?'Companion':item.slot)+' · '+(fit?'Compatible':'Requires '+item.family)+'</small>'+
    '<button type="button" data-action="preview" data-value="'+item.id+'" aria-pressed="'+String(chosen)+
    '"'+(fit?'':' disabled')+'>'+(chosen?'Previewing':fit?'Try on':'Not compatible')+'</button>'+
    '</article>';
}
function panel(){
  const top='<div class="panel"><div><h2>';
  const note='<p class="reward-note">Preview mode only. No unlocks, purchases, pet bonds, scores, family accounts or saved wardrobes are changed.</p>';
  if(state.tab==='character')return top+'Meet your character</h2><p>Two original silhouettes. Make a face, choose your colors, and watch the stage respond.</p></div>'+
    choices('Body family','body',BODIES.map(a=>a.id),state.body,id=>BODIES.find(x=>x.id===id).name)+
    (state.body==='human'?choices('Hair shape','hair',HAIR_STYLES,state.hair)+swatches('Skin tone','skin',SKIN_TONES):'')+
    choices('Expression','expression',EXPRESSIONS,state.expression)+swatches('Outfit color','coat',COAT_TONES)+note+'</div>';
  if(state.tab==='outfits')return top+'The dressing room</h2><p>Each piece previews on the full character. Incompatible pieces stay visible but cannot be applied.</p></div>'+
    '<div class="selection-list">'+REWARDS.filter(x=>!['companion'].includes(x.slot)).map(rewardCard).join('')+'</div>'+
    '<div class="choice-row"><button type="button" data-action="clear">Remove preview outfit</button></div>'+note+'</div>';
  if(state.tab==='pets'){
    const pet=REWARD_BY_ID.get(state.pet);
    return top+'Living companions</h2><p>Choose a pet with pictures, not a dropdown. Give each species its own stance and response.</p></div>'+
      '<div class="selection-list">'+REWARDS.filter(x=>x.slot==='companion').map(rewardCard).join('')+'</div>'+
      '<div class="pet-feature"><strong>'+safeName(pet?.name||'Companion')+'</strong>'+
      '<p>With your character on the stage. Animations are local demonstrations, not recorded pet actions.</p>'+
      '<div class="pet-actions"><button type="button" data-action="pet-hello">Say hello</button><button type="button" data-action="pet-play">Play together</button></div></div>'+
      '<span class="pill-summary">Distinct species silhouettes · Reduced-motion friendly</span>'+note+'</div>';
  }
  return top+'The prize gallery</h2><p>A curated showroom, not a spreadsheet. See the art, inspect compatibility, and try each reward safely.</p></div>'+
    '<div class="filter-row">'+[['all','All twelve'],['wearable','Wearables'],['companion','Pets']].map(p=>
      button('filter',p[0],p[1],state.filter)).join('')+'</div>'+
    '<div class="reward-grid">'+visibleRewards(state).map(rewardCard).join('')+'</div>'+
    note+'</div>';
}
function render(focus=null){
  root.innerHTML='<div class="workspace">'+
    '<div class="intro"><div><h1>Meet your next character.</h1>'+
    '<p>A cleaner, hand-inked direction for the family board. Two characters, two original pets and twelve compatible reward demonstrations.</p></div>'+
    '<span class="no-save">Safe, read-only demo</span></div>'+
    '<section class="stage-card" aria-label="Live original cartoon preview"><div class="stage-top">'+
      '<div class="stage-title"><strong>Character stage</strong><span>Clothing and companion share one scene</span></div>'+
      '<div class="text-tools"><button class="icon-action" type="button" data-action="undo"'+(undo.length?'':' disabled')+' aria-label="Undo last change">Undo</button>'+
      '<button class="icon-action" type="button" data-action="redo"'+(redo.length?'':' disabled')+' aria-label="Redo last change">Redo</button></div></div>'+
    '<div class="art-stage">'+stageSvg()+'</div>'+
    '<div class="stage-bottom"><div class="angle-picker" role="group" aria-label="Character view">'+
      [['front','Front view'],['profile','Side view'],['back','Rear view']].map(p=>button('angle',p[0],p[1],state.angle)).join('')+'</div>'+
      '<div class="stage-actions"><span>Live preview · no account writes</span>'+
      '<button class="action-link" type="button" data-action="download">Download demo recipe</button>'+
      '<button class="action-link" type="button" data-action="reset">Start over</button></div>'+
      '<div class="status" role="status" aria-live="polite">'+safeName(notice)+'</div></div></section>'+
    '<section class="side-card" aria-label="Creator controls">'+
      '<nav class="tabs" role="tablist" aria-label="Studio areas">'+
      TABS.map(pair=>'<button type="button" role="tab" aria-selected="'+String(state.tab===pair[0])+
        '" data-action="tab" data-value="'+pair[0]+'">'+pair[1]+'</button>').join('')+
      '</nav><div role="tabpanel" aria-label="'+safeName(TABS.find(p=>p[0]===state.tab)[1])+'">'+panel()+'</div></section></div>';
  if(focus){
    const target=[...root.querySelectorAll('[data-action]')].find(node=>node.dataset.action===focus.action&&
      (focus.value===undefined||node.dataset.value===focus.value));
    target?.focus({preventScroll:true});
  }
}
function dispatch(action,focus){
  const next=updateDemoState(state,action);
  if(next===state)return;
  if(action.type!=='tab'&&action.type!=='angle'&&action.type!=='filter'){
    undo.push(state);if(undo.length>40)undo.shift();redo=[];
  }
  state=next;
  notice=action.type==='preview'?'Preview only. Your real collection remains unchanged.':
    action.type==='body'?'Updated body family. Incompatible preview items were cleared.':
    action.type==='pet-play'?'Your companion is playing in the preview.':
    action.type==='pet-hello'?'Your companion says hello.':'Changes are visible on the stage.';
  render(focus);
}
root.addEventListener('click',event=>{
  const control=event.target.closest('button[data-action]');
  if(!control||!root.contains(control)||control.disabled)return;
  const type=control.dataset.action,value=control.dataset.value;
  const focus={action:type,value};
  if(type==='undo'&&undo.length){redo.push(state);state=undo.pop();notice='Preview edit undone.';render(focus);return;}
  if(type==='redo'&&redo.length){undo.push(state);state=redo.pop();notice='Preview edit redone.';render(focus);return;}
  if(type==='reset'){undo.push(state);redo=[];state=newDemoState();notice='Restored the original demo character.';render(focus);return;}
  if(type==='download'){
    const blob=new Blob([JSON.stringify({schema:'cowboy-v8-preview-1',demo_only:true,
      design:{body:state.body,angle:state.angle,expression:state.expression,hair:state.hair,
        skin:state.skin,coat:state.coat,pet:state.pet,equipped:state.equipped}},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download='cowboy-v8-demo-recipe.json';anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    notice='Demo recipe downloaded. It does not unlock items or save to the board.';render(focus);return;
  }
  dispatch({type,value},focus);
});
root.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('input,select,textarea'))return;
  if(event.target.closest('.angle-picker')){
    event.preventDefault();const views=['front','profile','back'];
    dispatch({type:'angle',value:views[(views.indexOf(state.angle)+(event.key==='ArrowRight'?1:2))%3]},null);
    root.querySelector('.angle-picker button[aria-pressed=true]')?.focus();
  }
});
render();
