from pathlib import Path
import json,base64,shutil
r=Path(__file__).parent
d=json.loads((r/'docs/catalog.json').read_text())
s=json.dumps(d,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
t=(r/'index.template.html').read_text()
assert t.count('__CATALOG_DATA__')==1
html=t.replace('__CATALOG_DATA__',s)
(r/'docs/index.html').write_text(html)
standalone=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(r/'docs/style.css').read_text()+'</style>').replace('<script src="app.js" defer></script>','<script>'+(r/'docs/app.js').read_text()+'</script>')
icon='data:image/svg+xml;base64,'+base64.b64encode((r/'docs/favicon.svg').read_bytes()).decode()
standalone=standalone.replace('href="favicon.svg"','href="'+icon+'"')
(r/'docs/Cowboys-Web-Toolbox-Preview.html').write_text(standalone)
edge=r/'supabase/functions/community-api'
edge.mkdir(parents=True,exist_ok=True)
shutil.copyfile(r/'docs/community-core.mjs',edge/'domain.mjs')
videos={v['number']:v for v in d['videos']}
edge_catalog={'sites':[{**site,'source_urls':[videos[n]['url'] for n in site['sources']]} for site in d['sites']]}
(edge/'catalog.json').write_text(json.dumps(edge_catalog,ensure_ascii=False,indent=2)+'\n')
print(f"Built website, standalone preview and community assets: {len(d['sites'])} destinations / {len(d['videos'])} source videos / {len(d['tips'])} tips")
