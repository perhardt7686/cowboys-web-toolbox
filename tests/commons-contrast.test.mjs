import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../docs/community.html',import.meta.url),'utf8');
const css=await readFile(new URL('../docs/commons-message-board-contrast.css',import.meta.url),'utf8');
const tokens=Object.fromEntries([...css.matchAll(/--cb-([a-z-]+):\s*(#[0-9a-f]{6})\b/gi)].map(([,k,v])=>[k,v]));

const luminance=hex=>{
 const n=hex.replace('#','').match(/.{2}/g).map(pair=>parseInt(pair,16)/255)
  .map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
 return n[0]*0.2126+n[1]*0.7152+n[2]*0.0722;
};
const contrast=(foreground,background)=>{
 const a=luminance(foreground),b=luminance(background);
 return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
};

test('Commons contrast CSS is last and loaded only once with a versioned URL',()=>{
 const needle='href="commons-message-board-contrast.css?v=contrast1"';
 assert.equal(html.split(needle).length-1,1);
 assert.ok(html.indexOf(needle)>html.indexOf('href="commons-games-polish.css'));
 assert.match(html,/class="community-page"/);
});

test('Main reading surfaces and action colors exceed WCAG AA 4.5:1',()=>{
 for(const [name,fg,bg] of [
  ['Reply body',tokens.ink,tokens.paper],
  ['Muted metadata',tokens.muted,tokens.paper],
  ['Lavender metadata',tokens.muted,tokens.lavender],
  ['Purple actions','#fffaf2',tokens.plum],
  ['Golden hover actions',tokens.ink,tokens.harvest],
  ['Teal keyboard focus',tokens.teal,'#fffaf2']
 ]){
  assert.ok(contrast(fg,bg)>=4.5, name+' contrast ratio '+contrast(fg,bg).toFixed(2)+' is below AA');
 }
});

test('Forum reply styles cover author, dates, reply body, controls and focus',()=>{
 for(const selector of ['#thread-replies .forum-post','.forum-post-context','.member-author','.profile-badge',
  '.forum-post-number','.forum-post-actions','.reply-body','.thread-detail-body',
  '.forum-quote','.forum-signature','focus-visible','prefers-reduced-motion','forced-colors']){
  assert.ok(css.includes(selector),selector+' contrast state missing');
 }
 assert.ok(css.includes('#content-dialog.content-dialog:has(#thread-replies)'),
  'Thread popup must not restyle profile/owner dialogs');
 assert.ok(!css.includes('.toolbox-page')&&!css.includes('.ccore')&&!css.includes('#family-calendar'),
  'Do not recolor Toolbox, Cowboy Core, or family calendar');
});

test('Stylesheet brackets are syntactically balanced',()=>{
 let depth=0;
 const stripped=css.replace(/\/\*[\s\S]*?\*\//g,'');
 for(const char of stripped){
  if(char==='{')depth++;
  if(char==='}')depth--;
  assert.ok(depth>=0,'Unexpected closing CSS block');
 }
 assert.equal(depth,0);
});
