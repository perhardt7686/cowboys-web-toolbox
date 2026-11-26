import io, json, sqlite3, tempfile, threading, time, unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from app import APIError, Job, JobManager, SupabaseAuth, engine_target, make_handler, read_results, validate_target

OWNER="11111111-1111-4111-8111-111111111111"
OTHER="22222222-2222-4222-8222-222222222222"
RUN="33333333-3333-4333-8333-333333333333"
ORIGIN="https://core.example"

class FakeAuth:
    def owner(self, token):
        if token=="owner-token": return OWNER
        if token=="other-token": return OTHER
        raise APIError(401,"sign_in_required")
    def payload(self, token, run_id):
        if token!="owner-token": raise APIError(403,"core_access_required")
        return {"owner_id":OWNER,"kind":"username","query":"core_fixture"}

class ValidationTests(unittest.TestCase):
    def test_supported_targets_and_cli_quoting(self):
        self.assertEqual(engine_target("username","jane.doe"),'"jane.doe"')
        self.assertEqual(engine_target("name","Jane Doe"),'"Jane Doe"')
        self.assertEqual(engine_target("email","jane@example.com"),"jane@example.com")
    def test_reject_control_shell_url_and_unsupported_targets(self):
        for kind,target in [("username","-m sfp_portscan"),("username","a;curl x"),("email",'a"@example.com'),
            ("name","Jane\nDoe"),("username","https://internal"),("phone","+12025550123"),("username","x"*65)]:
            with self.subTest(kind=kind,target=target),self.assertRaises(APIError):
                validate_target(kind,target)
    def test_valid_project_jwt_alone_is_insufficient(self):
        auth=SupabaseAuth("https://example.supabase.co","public-key")
        auth.request=lambda path,token,data=None: {"id":OTHER} if path=="/auth/v1/user" else None
        with self.assertRaises(APIError) as ctx: auth.owner("valid-project-jwt")
        self.assertEqual(ctx.exception.status,403)
    def test_shared_editor_maps_to_data_owner(self):
        auth=SupabaseAuth("https://example.supabase.co","public-key")
        auth.request=lambda path,token,data=None: {"id":OTHER} if path=="/auth/v1/user" else OWNER
        self.assertEqual(auth.owner("editor-jwt"),OWNER)

def fixture_db(path,status="ERROR-FAILED"):
    path.parent.mkdir(parents=True,exist_ok=True)
    conn=sqlite3.connect(path)
    conn.executescript("""
        CREATE TABLE tbl_scan_instance(guid TEXT,status TEXT,created INTEGER);
        INSERT INTO tbl_scan_instance VALUES('scan','ERROR-FAILED',1);
        CREATE TABLE tbl_scan_results(scan_instance_id TEXT,type TEXT,data TEXT,generated INTEGER,false_positive INTEGER);
    """)
    conn.execute("UPDATE tbl_scan_instance SET status=?",(status,))
    conn.executemany("INSERT INTO tbl_scan_results VALUES('scan','ACCOUNT_EXTERNAL_OWNED',?,1700000000,0)",[
        ("GitLab: <SFURL>https://gitlab.com/core_fixture</SFURL>",),
        ("Duplicate: <SFURL>https://gitlab.com/core_fixture</SFURL>",),
        ("Bad: <SFURL>javascript:alert(1)</SFURL>",)])
    conn.commit()
    conn.close()

class WorkerTests(unittest.TestCase):
    def test_concurrency_idempotency_and_owner_isolation(self):
        manager=JobManager(runner=lambda *_:None)
        job=manager.start(RUN,OWNER,"username","core_fixture")
        self.assertIs(manager.start(RUN,OWNER,"username","core_fixture"),job)
        with self.assertRaises(APIError) as ctx: manager.start(OTHER,OWNER,"username","another_fixture")
        self.assertEqual(ctx.exception.status,409)
        with self.assertRaises(APIError): manager.get(RUN,OTHER)
    def test_partial_sqlite_recovery_and_safe_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"spiderfoot.db"
            fixture_db(path)
            status,results=read_results(path)
            self.assertEqual(status,"ERROR-FAILED")
            self.assertEqual(len(results),1)
            self.assertEqual(results[0]["association"],"unverified")
            self.assertEqual(results[0]["source_url"],"https://gitlab.com/core_fixture")
    def test_zero_exit_does_not_report_failed_engine_as_finished(self):
        class ExitedZero:
            def __init__(self,command,**kwargs):
                self.stdin=io.BytesIO()
                work=Path(command[command.index("--work")+1])
                fixture_db(work/"data"/"spiderfoot.db")
            def poll(self): return 0
            def __enter__(self): return self
            def __exit__(self,*_): return None
        job=Job(RUN,OWNER)
        with patch("app.subprocess.Popen",ExitedZero):
            JobManager()._run(job,"username","core_fixture")
        self.assertEqual(job.status,"partial")
        self.assertNotEqual(job.status,"finished")
    def test_job_response_never_contains_target_or_token(self):
        raw=json.dumps(Job(RUN,OWNER).public())
        self.assertNotIn(OWNER,raw)
        self.assertNotIn("query",raw)
        self.assertNotIn("token",raw)

class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manager=JobManager(runner=lambda *_:None)
        cls.server=ThreadingHTTPServer(("127.0.0.1",0),make_handler(FakeAuth(),cls.manager,{ORIGIN}))
        cls.server.daemon_threads=True
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.url="http://127.0.0.1:"+str(cls.server.server_port)
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
    def request(self,path,method="GET",token=None,body=None,origin=None):
        headers={"Content-Type":"application/json"}
        if token: headers["Authorization"]="Bearer "+token
        if origin: headers["Origin"]=origin
        payload=None if body is None else json.dumps(body).encode()
        try:
            response=urlopen(Request(self.url+path,data=payload,method=method,headers=headers),timeout=3)
        except HTTPError as error:
            response=error
        with response:
            return response.status,dict(response.headers),response.read()
    def test_health_has_no_private_data(self):
        status,_,raw=self.request("/healthz")
        self.assertEqual(status,200)
        self.assertNotIn(b"owner",raw)
    def test_unauthenticated_and_unapproved_origin_blocked(self):
        self.assertEqual(self.request("/v1/scans",method="POST",body={"run_id":RUN})[0],401)
        self.assertEqual(self.request("/v1/scans",method="POST",token="owner-token",
            body={"run_id":RUN},origin="https://evil.example")[0],403)
    def test_registered_run_required_and_idempotent_start(self):
        self.assertEqual(self.request("/v1/scans",method="POST",token="owner-token",
            body={"query":"someone","module":"anything"})[0],400)
        for _ in range(2):
            status,headers,raw=self.request("/v1/scans",method="POST",token="owner-token",body={"run_id":RUN},origin=ORIGIN)
            self.assertEqual(status,202)
            self.assertEqual(headers["Access-Control-Allow-Origin"],ORIGIN)
        self.assertNotIn(b"core_fixture",raw)
    def test_cross_owner_results_hidden(self):
        self.manager.start(RUN,OWNER,"username","core_fixture")
        self.assertEqual(self.request("/v1/scans/"+RUN,token="other-token")[0],404)

if __name__=="__main__":
    unittest.main()
