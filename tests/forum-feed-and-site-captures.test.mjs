import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const [feedCss,boardHtml,app,home,template,shots,previewCss,build,workflow]=await Promise.all([
 read('docs/commons-feed-legibility.css'),
 read('docs/community.html'),
 read('docs/app.js'),
 read('docs/index.html'),
 read('index.template.html'),
 read('docs/site-shots/manifest.js'),
 read('docs/site-preview-capture.css'),
 read('build.py'),
 read('.github/workflows/capture-site-previews.yml')
]);
const luminance=h=>{
 const v=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255);
 const c=v.map(x=>x<=0.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*c[0]+.7152*c[1]+.0722*c[2];
};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('The light Commons thread cards use readable text in all metadata slots',()=>{
 for(const selector of ['#conversations #community-feed .thread-card',
  '.thread-card .thread-age','.thread-card .thread-count',
  '.lab-helpful-count','.thread-card .forum-last-reply',
  'button[data-forum-latest]','.member-author']){
   assert.ok(feedCss.includes(selector), selector+' missing contrast fix');
 }
 for(const [label,fg,bg] of [
  ['name','#452056','#fffaf2'],
  ['activity','#51405c','#fffaf2'],
  ['last reply','#51405c','#f2e8f3'],
  ['latest action','#fff9f1','#53266a'],
  ['preview cue','#fffaf2','#126872']
 ]){
   assert.ok(contrast(fg,bg)>=4.5,label+': '+contrast(fg,bg).toFixed(2));
 }
 const current='commons-feed-legibility.css?v=feed3';
 assert.ok(boardHtml.includes(current));
 assert.ok(boardHtml.indexOf(current)>boardHtml.indexOf('commons-message-board-contrast.css?v=contrast1'),
  'Feed fix must come last');
 assert.ok(feedCss.includes('prefers-reduced-motion'));
});
test('Website cards use verified local captures and honest illustrated fallback',()=>{
 assert.ok(app.includes('window.CowboySiteShots'), 'Capture manifest must be used');
 assert.ok(app.includes('data-preview-source='), 'Capture status visible on card');
 assert.ok(app.includes('SITE CAPTURE'), 'Captured imagery clearly labeled');
 assert.ok(app.includes('ILLUSTRATED'), 'Fallback honestly labeled');
 assert.ok(app.includes('image') || app.includes('<img'), 'Screenshots rendered as images');
 assert.ok(app.includes('loading="lazy"'), 'Only visible images should be fetched');
 assert.ok(app.includes("document.addEventListener('error'"), 'Missing captures need a fallback');
 assert.ok(previewCss.includes('.preview-capture'));
 assert.ok(previewCss.includes('prefers-reduced-motion'));
});
test('Production and generated Toolbox both load the manifest before previews',()=>{
 for(const [label,html] of [['template',template],['homepage',home]]){
  assert.equal(html.split('site-shots/manifest.js?v=preview2').length-1,1,label+' screenshot manifest reference');
  assert.equal(html.split('site-preview-capture.css?v=preview2').length-1,1,label+' CSS');
  assert.ok(html.indexOf('site-shots/manifest.js?v=preview2')<html.indexOf('app.js?v=20261113-preview2'));
 }
 assert.ok(build.includes('docs/site-shots/manifest.js'));
 assert.ok(build.includes('docs/site-preview-capture.css'));
 assert.ok(shots.includes('Object.freeze('));
});
test('Public-site capture action is bounded and preserves member privacy',()=>{
 assert.ok(workflow.includes('scripts/capture-site-previews.py'));
 assert.ok(workflow.includes('contents: write'));
 assert.ok(workflow.includes('timeout-minutes: 90'));
 assert.ok(!workflow.includes('SUPABASE_SERVICE_ROLE_KEY'));
 assert.ok(!workflow.includes('SMTP_PASSWORD'));
});
