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
    db=SpiderFootDb({"__database":str(work/"data"/"spiderfoot.db")})
    db.configSet({"_fetchtimeout":"4","_maxthreads":"1","sfp_accounts:permutate":"0","_internettlds":"@/opt/spiderfoot/public_suffix_list.dat"})
    db.conn.close()
    sys.argv=[str(SF/"sf.py"),"-s",'"corefixture"',"-m","sfp_accounts","-o","json","-q","-max-threads","1"]
    try:
        runpy.run_path(str(SF/"sf.py"),run_name="__main__")
    except SystemExit as exc:
        assert exc.code in (None,0), "CLI did not exit successfully"
    status,findings=read_results(work/"data"/"spiderfoot.db")
    assert status=="FINISHED",status
    assert findings, "Fixture scan should produce committed public-profile events"
    assert len(findings)<=12,len(findings)
    assert all(row["association"]=="unverified" for row in findings)
    print("Offline engine smoke passed:",len(findings),"possible profile fixtures.")
