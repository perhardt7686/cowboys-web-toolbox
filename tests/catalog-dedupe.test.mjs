import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const catalog=JSON.parse(readFileSync(new URL('../docs/catalog.json',import.meta.url),'utf8'));
const canonical=url=>{
  const parsed=new URL(url);
  return (parsed.hostname.toLowerCase().replace(/^www\./,'')+parsed.pathname.replace(/\/+$/,'').toLowerCase())||parsed.hostname;
};

test('public catalog maintains unique stable IDs and normalized destination paths',()=>{
  const byId=new Set(),byDestination=new Map();
  for(const item of catalog.sites){
    assert.ok(item.id&&item.url&&item.name,'Each site must have an ID, name and destination');
    assert.ok(!byId.has(item.id),'Duplicate catalog ID: '+item.id);
    byId.add(item.id);
    const destination=canonical(item.url);
    assert.ok(!byDestination.has(destination),
      `Duplicate normalized destination ${destination}: ${byDestination.get(destination)} / ${item.id}`);
    byDestination.set(destination,item.id);
  }
  assert.equal(catalog.coverage.destinationLinks,catalog.sites.length);
  assert.equal(catalog.coverage.independentWebFinds+catalog.coverage.videoDestinationLinks,catalog.sites.length);
});

test('Blacklight entry credits its public sources and explains scanning limitations',()=>{
  const entry=catalog.sites.find(s=>s.id==='blacklight');
  assert.ok(entry,'The privacy inspector must remain discoverable');
  assert.equal(entry.url,'https://themarkup.org/blacklight');
  assert.equal(entry.category,'Utilities');
  assert.equal(entry.group,'Technology & privacy');
  assert.equal(entry.role,'researched');
  assert.equal(entry.verification,'official');
  assert.deepEqual(entry.sources,[],'A newsletter link is not a verified creator video');
  assert.ok(entry.evidenceUrls.includes('https://www.mattymctech.com/p/powerful-websites-296-301'));
  assert.ok(entry.evidenceUrls.includes('https://themarkup.org/blacklight'));
  assert.equal(entry.destinationCheck.status,'official_source_checked_workflow_untested');
  assert.match(entry.privacyNote,/automated findings are not definitive/i);
  assert.match(entry.privacyNote,/cach(?:es|ed) reports/i);
  assert.equal(entry.uploadTool,false);
});

test('SpiderFoot has its own OSINT investigation category and transparent local-install boundaries',()=>{
  const entry=catalog.sites.find(s=>s.id==='spiderfoot');
  assert.ok(entry,'SpiderFoot must be discoverable');
  assert.equal(entry.url,'https://github.com/smicallef/spiderfoot');
  assert.equal(entry.group,'OSINT & Investigations');
  assert.equal(entry.verification,'official');
  assert.deepEqual(entry.sources,[],'User screenshot is not a verified public source-video link');
  assert.match(entry.accessLabel,/local installation required/i);
  assert.match(entry.privacyNote,/authorized|own/i);
  assert.equal(entry.destinationCheck.status,'official_documentation_checked_workflow_untested');
  assert.equal(entry.uploadTool,false);
});
