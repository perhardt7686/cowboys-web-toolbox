import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {displayName,validatePost,reviewContent,renderBody,safeHttps,edwardReply,canPost} from '../docs/community-core.mjs';
const catalog=JSON.parse(await readFile(new URL('../supabase/functions/community-api/catalog.json',import.meta.url)));

test('plain-text posts escape markup and only link safe HTTPS destinations',()=>{
  const html=renderBody('<img src=x onerror=alert(1)>\nhttps://example.com/?x=" onclick="evil() javascript:alert(1)');
  assert.ok(html.startsWith('&lt;img'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('rel="nofollow ugc noopener noreferrer"'));
  assert.equal(safeHttps('https://user:pass@example.com'),null);
  assert.equal(safeHttps('data:text/html,hello'),null);
  assert.equal(safeHttps('http://example.com'),null);
});

test('member names cannot impersonate reserved staff; personal names remain possible',()=>{
  for(const name of ['Edward','Cowboy','admin','Edward-moderator','Cowboy owner'])assert.throws(()=>displayName(name));
  assert.equal(displayName('Edward Smith'),'Edward Smith');
  assert.equal(displayName('  Ada  '),'Ada');
  assert.throws(()=>displayName('Ada\u0000'));
});

test('posts use known categories and catalog references; pending members cannot post',()=>{
  const post={title:'A useful discovery',body:'This has enough detail to start a conversation.',category:'help',siteId:catalog.sites[0].id};
  assert.equal(validatePost(post,catalog.sites).site_id,post.siteId);
  assert.throws(()=>validatePost({...post,siteId:'made-up'},catalog.sites));
  assert.throws(()=>validatePost({...post,category:'admin'},catalog.sites));
  for(const status of ['pending','declined','suspended'])assert.equal(canPost({status,role:'member'}),false);
  assert.equal(canPost({status:'approved',role:'member'}),true);
});

test('obvious private credentials and link floods are held, ordinary text stays public',()=>{
  assert.equal(reviewContent('-----BEGIN PRIVATE KEY----- secret').status,'held');
  assert.equal(reviewContent('sb_secret_abcdefghijklmnop').status,'held');
  assert.equal(reviewContent('https://a.co '.repeat(5)).status,'held');
  assert.equal(reviewContent('A useful tool: https://example.com').status,'published');
});

test('Edward identifies automation, limits replies to recorded evidence, and links original sources',()=>{
  assert.match(edwardReply({body:'Edward, are you human?'},catalog.sites),/automated moderator/);
  assert.equal(edwardReply({body:'Thanks for sharing.'},catalog.sites),null);
  const site=catalog.sites.find(s=>s.name==='Car-Part.com');
  const answer=edwardReply({title:'@Edward help me find used auto parts',body:'recycled auto parts',site_id:site.id},catalog.sites);
  assert.ok(answer.includes(site.url));
  assert.ok(answer.includes(site.source_urls[0]));
  assert.ok(answer.includes('haven’t independently tested'));
  assert.ok(answer.includes('automated moderator'));
});
