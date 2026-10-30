from pathlib import Path
import json,base64,shutil,re,runpy,subprocess
r=Path(__file__).parent
d=json.loads((r/'docs/catalog.json').read_text())
s=json.dumps(d,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
extras=runpy.run_path(str(r/'discovery-build.py'))['setup'](d)
t=(r/'index.template.html').read_text().replace('__STARTER_PACKS__',extras['packs']).replace('__DISCOVERY_FILTERS__',extras['filters'])
assert t.count('__CATALOG_DATA__')==1
html=t.replace('__CATALOG_DATA__',s).replace('__SITE_TOTAL__',str(len(d['sites']))).replace('__SITE_TOTAL_PADDED__',str(len(d['sites'])).zfill(3)).replace('__COLLECTION_SCOPE__',d['scope'])
(r/'docs/index.html').write_text(html)
standalone=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(r/'docs/style.css').read_text()+'</style>')
standalone=re.sub(r'<script src="app\.js\?v=[^\"]+" defer></script>',lambda _:'<script>'+(r/'docs/app.js').read_text()+'</script>',standalone)
standalone=standalone.replace('<link rel="stylesheet" href="community-lab.css">','<style>'+(r/'docs/community-lab.css').read_text()+'</style>')
icon='data:image/svg+xml;base64,'+base64.b64encode((r/'docs/favicon.svg').read_bytes()).decode()
standalone=standalone.replace('<script src="community-config.js" defer></script>','<script>'+(r/'docs/community-config.js').read_text()+'</script>')
standalone=standalone.replace('href="favicon.svg"','href="'+icon+'"')
for name in ['discovery-core.js','discovery.js']:
    standalone=re.sub(r'<script src="'+re.escape(name)+r'(?:\?[^"]*)?" defer></script>',lambda _:'<script>'+(r/'docs'/name).read_text()+'</script>',standalone)
standalone=standalone.replace('<link rel="stylesheet" href="discovery.css">','<style>'+(r/'docs/discovery.css').read_text()+'</style>')
(r/'docs/Cowboys-Web-Toolbox-Preview.html').write_text(standalone)
edge=r/'supabase/functions/community-api'
edge.mkdir(parents=True,exist_ok=True)
shutil.copyfile(r/'docs/community-core.mjs',edge/'domain.mjs')
(edge/'profile-domain.mjs').write_text((r/'docs/profile-core.mjs').read_text().replace("'./community-core.mjs'","'./domain.mjs'"))
videos={v['number']:v for v in d['videos']}
edge_catalog={'sites':[{**{k:site[k] for k in ('id','name','url','category','description')},'origin':site.get('origin','video'),'destinationCheck':{'status':site['destinationCheck']['status']},'source_urls':[videos[n]['url'] for n in site['sources']]+site.get('evidenceUrls',[])} for site in d['sites']]}
(edge/'lab-domain.mjs').write_text((r/'docs/lab-core.mjs').read_text().replace("'./community-core.mjs'","'./domain.mjs'"))
(edge/'catalog.json').write_text(json.dumps(edge_catalog,ensure_ascii=False,indent=2)+'\n')
activity=r/'supabase/functions/website-activity'
activity.mkdir(parents=True,exist_ok=True)
shutil.copyfile(edge/'catalog.json',activity/'catalog.json')
(r/'supabase/catalog-seed.sql').write_text('insert into public.community_site_totals(site_id) values\n'+',\n'.join("('"+site['id']+"')" for site in d['sites'])+'\non conflict (site_id) do nothing;\n')
print(f"Built website, standalone preview and community assets: {len(d['sites'])} destinations / {len(d['videos'])} source videos / {len(d['tips'])} tips")

subprocess.run(['node',str(r/'docs/export-catalog.cjs')],check=True)
