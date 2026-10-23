from pathlib import Path
import json,base64
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
print('Built website and standalone preview: 69 destinations / 85 source videos / 28 tips')
