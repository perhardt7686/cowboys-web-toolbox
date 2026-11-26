"""Offline fixture scan through upstream CLI; Docker denies all external networking."""
import json, os, runpy, sys, tempfile
from pathlib import Path
sys.path.insert(0,"/app")
from runner import SF, configure, install_adapter
from app import read_results

with tempfile.TemporaryDirectory() as tmp:
    work=Path(tmp)
    configure(work)
    module,bounded=install_adapter()
    from sflib import SpiderFoot
    from spiderfoot import SpiderFootDb
    def fake_fetch(self,url,**kwargs):
        sites=json.loads(Path("/app/accounts-sites.json").read_text())["sites"]
        site=next((s for s in sites if url.startswith(s["uri_check"].split("{account}")[0])),None)
        if not site:
            return {"code":"404","content":"","headers":{},"realurl":url}
        present="corefixture" in url
        return {"code":str(site["e_code"] if present else site["m_code"]),
            "content":("corefixture "+site["e_string"]) if present else site["m_string"],
            "headers":{},"realurl":url}
    SpiderFoot.fetchUrl=fake_fetch
    class FakeSF:
        def __init__(self): self.cache={}
        def cachePut(self,key,value): self.cache[key]=value
        def cacheGet(self,key,_): return self.cache.get(key)
        def fetchUrl(self,url,**kwargs): return fake_fetch(self,url,**kwargs)
    probe=module.sfp_accounts()
    probe.setup(FakeSF(),{"_useragent":"fixture"})
    probe.checkSite("corefixture",probe.sites[0])
    assert any(probe.siteResults.values()),"Direct detection probe failed"
    print("Direct account matcher passed.")
    db=SpiderFootDb({"__database":str(work/"data"/"spiderfoot.db")})
    db.configSet({"_fetchtimeout":"4","_maxthreads":"1","sfp_accounts:permutate":"0","_internettlds":"@/opt/spiderfoot/public_suffix_list.dat"})
    db.conn.close()
    sys.argv=[str(SF/"sf.py"),"-s",'"corefixture"',"-m","sfp_accounts","-o","json","-d","-max-threads","1"]
    try:
        runpy.run_path(str(SF/"sf.py"),run_name="__main__")
    except SystemExit as exc:
        assert exc.code in (None,0), "CLI did not exit successfully"
    status,findings=read_results(work/"data"/"spiderfoot.db")
    assert status=="FINISHED",status
    if not findings:
        import sqlite3
        connection=sqlite3.connect(work/"data"/"spiderfoot.db")
        try:
            print("Synthetic fixture events:",connection.execute("SELECT type,module,data FROM tbl_scan_results LIMIT 20").fetchall())
            print("Synthetic fixture logs:",connection.execute("SELECT * FROM tbl_scan_log ORDER BY rowid DESC LIMIT 30").fetchall())
        finally:
            connection.close()
    assert findings, "Fixture scan should produce committed public-profile events"
    assert len(findings)<=12,len(findings)
    assert all(row["association"]=="unverified" for row in findings)
    print("Offline engine smoke passed:",len(findings),"possible profile fixtures.")
