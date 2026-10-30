"""Bounded public provider-page review; no account, price or workflow claims."""
from pathlib import Path
import argparse,concurrent.futures,datetime,ipaddress,json,re,socket,urllib.parse,urllib.request
def public_url(url):
 u=urllib.parse.urlsplit(url)
 if u.scheme!='https' or not u.hostname or u.username or u.password or u.port not in(None,443):raise ValueError('Only public HTTPS URLs without credentials')
 if any(not ipaddress.ip_address(r[4][0]).is_global for r in socket.getaddrinfo(u.hostname,443,type=socket.SOCK_STREAM)):raise ValueError('Non-public address')
 return url
class SafeRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):return super().redirect_request(req,fp,code,msg,headers,public_url(newurl))
def check(s):
 try:
  public_url(s['url']);req=urllib.request.Request(s['url'],headers={'User-Agent':'Cowboys-Toolbox-Link-Check/1.0'})
  with urllib.request.build_opener(SafeRedirect()).open(req,timeout=8)as r:body=r.read(65536).decode('utf-8',errors='ignore');final=r.url;code=r.status
  hold=bool(re.search(r'<title[^>]*>\s*(?:Site Unavailable|Access Denied|Just a moment)',body,re.I))
  return s['id'],{'status':'hold' if hold else 'redirect' if final.rstrip('/')!=s['url'].rstrip('/') else 'page_retrieved','httpStatus':code,'url':s['url'],'finalUrl':final,'scope':'Page retrieval only; not price, safety or workflow verification'}
 except Exception as ex:return s['id'],{'status':'hold','url':s['url'],'reason':type(ex).__name__,'scope':'Needs review; not proof of closure'}
def main():
 p=argparse.ArgumentParser();p.add_argument('--limit',type=int,default=32);p.add_argument('--output',default='reports/link-health.json');a=p.parse_args();limit=max(1,min(40,a.limit));sites=json.loads((Path(__file__).parent/'catalog.json').read_text())['sites'];start=datetime.date.today().isocalendar().week*24%len(sites);chosen={s['id']:s for s in sites if s['destinationCheck']['status']=='availability_unverified'};chosen=dict(list(chosen.items())[:min(8,limit)])
 for s in sites[start:]+sites[:start]:
  if len(chosen)>=limit:break
  chosen.setdefault(s['id'],s)
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:checks=dict(pool.map(check,chosen.values()))
 result={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checkedCount':len(checks),'scope':'Bounded page retrieval; no accounts, uploads, pricing or completed workflows','checks':checks};out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'checked':len(checks),'holds':sum(v['status']=='hold' for v in checks.values()),'output':str(out)}))
if __name__=='__main__':main()
