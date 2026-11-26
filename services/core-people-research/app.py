"""Authenticated, bounded SpiderFoot worker."""
from __future__ import annotations
import json, os, re, signal, sqlite3, subprocess, sys, tempfile, threading, time, uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

BASE = Path(__file__).resolve().parent
ENGINE_REVISION = "0f815a203afebf05c98b605dba5cf0475a0ee5fd"
MAX_BODY, MAX_FINDINGS, SCAN_SECONDS, JOB_TTL_SECONDS = 8192, 100, 90, 3600
TERMINAL = frozenset({"finished", "partial", "failed", "timed_out", "cancelled", "interrupted"})
UUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")

class APIError(Exception):
    def __init__(self, status, code):
        self.status, self.code = status, code

def canonical_uuid(value):
    if not isinstance(value, str) or not UUID_RE.fullmatch(value):
        raise APIError(400, "invalid_id")
    return str(uuid.UUID(value))

def validate_target(kind, value):
    if not isinstance(value, str) or value != value.strip() or len(value) > 120:
        raise APIError(400, "invalid_target")
    if any(ord(c) < 32 or c in '"<>/\\' for c in value):
        raise APIError(400, "invalid_target")
    if kind == "username":
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{2,63}", value):
            raise APIError(400, "invalid_target")
    elif kind == "email":
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.+-]{0,63}@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}", value):
            raise APIError(400, "invalid_target")
    elif kind == "name":
        if len(value) < 3 or len(value.split()) < 2 or not all(c.isalpha() or c in " .'-" for c in value):
            raise APIError(400, "invalid_target")
    else:
        raise APIError(400, "invalid_kind")
    return value

def engine_target(kind, value):
    validate_target(kind, value)
    return value if kind == "email" else '"' + value + '"'

def utc_now():
    return datetime.now(timezone.utc).isoformat()

class SupabaseAuth:
    def __init__(self, url, public_key):
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or not parsed.hostname.endswith(".supabase.co") or parsed.path not in ("", "/"):
            raise ValueError("A Supabase project HTTPS URL is required")
        if not public_key:
            raise ValueError("A Supabase publishable key is required")
        self.url, self.key = url.rstrip("/"), public_key

    def request(self, path, token, data=None):
        headers = {"apikey": self.key, "Authorization": "Bearer " + token, "Content-Type": "application/json"}
        body = None if data is None else json.dumps(data).encode()
        request = Request(self.url + path, data=body, headers=headers, method="GET" if body is None else "POST")
        try:
            with urlopen(request, timeout=8) as response:
                raw = response.read(131073)
                if len(raw) > 131072:
                    raise APIError(502, "auth_response_too_large")
                return json.loads(raw)
        except HTTPError as exc:
            if exc.code in (401, 403):
                raise APIError(401, "sign_in_required") from None
            raise APIError(503, "core_access_unavailable") from None
        except (URLError, TimeoutError, ValueError):
            raise APIError(503, "core_access_unavailable") from None

    def owner(self, token):
        if not token or len(token) > 8192 or "\n" in token or "\r" in token:
            raise APIError(401, "sign_in_required")
        user = self.request("/auth/v1/user", token)
        if not isinstance(user, dict) or not user.get("id"):
            raise APIError(401, "sign_in_required")
        owner = self.request("/rest/v1/rpc/cowboys_core_data_owner", token, {})
        try:
            return canonical_uuid(owner)
        except APIError:
            raise APIError(403, "core_access_required") from None

    def payload(self, token, run_id):
        payload = self.request("/rest/v1/rpc/cowboys_core_people_scan_payload", token, {"p_run_id": run_id})
        if not isinstance(payload, dict) or not payload.get("owner_id"):
            raise APIError(404, "run_not_found")
        validate_target(payload.get("kind"), payload.get("query"))
        return payload

def read_results(database):
    """Exit zero is insufficient; use the engine's committed status and rows."""
    if not database.is_file():
        return "ERROR-NO-DATABASE", []
    try:
        conn = sqlite3.connect(database.as_uri() + "?mode=ro", uri=True, timeout=2)
        conn.row_factory = sqlite3.Row
        try:
            scan = conn.execute("SELECT guid,status FROM tbl_scan_instance ORDER BY created DESC LIMIT 1").fetchone()
            if not scan:
                return "ERROR-NO-SCAN", []
            rows = conn.execute(
                """SELECT r.type,r.data,r.generated FROM tbl_scan_results r
                WHERE r.scan_instance_id=? AND r.type IN
                ('ACCOUNT_EXTERNAL_OWNED','ACCOUNT_EXTERNAL_USER_SHARED','ACCOUNT_EXTERNAL_USER_SHARED_COMPROMISED')
                AND COALESCE(r.false_positive,0)=0 ORDER BY r.generated,r.rowid LIMIT ?""",
                (scan["guid"], MAX_FINDINGS * 2))
            findings, seen = [], set()
            for row in rows:
                match = re.search(r"<SFURL>(https://[^<]+)</SFURL>", str(row["data"]))
                if not match:
                    continue
                url = match.group(1)
                parsed = urlsplit(url)
                if len(url) > 2048 or not parsed.hostname or parsed.username or parsed.password or parsed.port not in (None, 443) or url in seen:
                    continue
                seen.add(url)
                label = re.sub(r"<[^>]+>", "", str(row["data"]).split("<SFURL>")[0]).strip(" :")[:160]
                findings.append({"event_type": row["type"], "source_url": url, "source_name": label or parsed.hostname,
                    "observed_at": datetime.fromtimestamp(float(row["generated"]), timezone.utc).isoformat(),
                    "association": "unverified", "module": "sfp_accounts"})
                if len(findings) >= MAX_FINDINGS:
                    break
            return str(scan["status"]), findings
        finally:
            conn.close()
    except (sqlite3.Error, ValueError, OverflowError):
        return "ERROR-READING-RESULTS", []

@dataclass
class Job:
    id: str
    owner: str
    created: float = field(default_factory=time.monotonic)
    status: str = "running"
    started_at: str = field(default_factory=utc_now)
    finished_at: str | None = None
    engine_status: str | None = None
    findings: list = field(default_factory=list)
    process: subprocess.Popen | None = None
    cancel: threading.Event = field(default_factory=threading.Event)

    def public(self):
        return {"id": self.id, "status": self.status, "started_at": self.started_at,
            "finished_at": self.finished_at, "engine_status": self.engine_status,
            "engine_revision": ENGINE_REVISION,
            "scope": {"sites": 12, "seconds": SCAN_SECONDS, "module": "sfp_accounts"},
            "findings": list(self.findings)}

class JobManager:
    def __init__(self, runner=None):
        self.jobs, self.lock = {}, threading.RLock()
        self.runner = runner or self._run

    def get(self, run_id, owner):
        with self.lock:
            self._prune()
            job = self.jobs.get(run_id)
            if not job or job.owner != owner:
                raise APIError(404, "run_not_found")
            return job

    def _prune(self):
        now = time.monotonic()
        for key in list(self.jobs):
            job = self.jobs[key]
            if job.status in TERMINAL and now - job.created > JOB_TTL_SECONDS:
                del self.jobs[key]

    def start(self, run_id, owner, kind, query):
        validate_target(kind, query)
        with self.lock:
            self._prune()
            if run_id in self.jobs:
                return self.get(run_id, owner)
            if any(j.status not in TERMINAL for j in self.jobs.values()):
                raise APIError(409, "worker_busy")
            if len(self.jobs) >= 24:
                raise APIError(429, "worker_capacity")
            job = Job(run_id, owner)
            self.jobs[run_id] = job
            threading.Thread(target=self.runner, args=(job, kind, query), daemon=True).start()
            return job

    def cancel(self, run_id, owner):
        with self.lock:
            job = self.get(run_id, owner)
            if job.status not in TERMINAL:
                job.cancel.set()
            return job

    @staticmethod
    def _stop(process):
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        process.wait(timeout=5)

    def _run(self, job, kind, query):
        try:
            with tempfile.TemporaryDirectory(prefix="core-research-") as temporary:
                work = Path(temporary)
                command = [sys.executable, str(BASE / "runner.py"), "--work", str(work), "--kind", kind]
                clean_env = {k: v for k, v in os.environ.items() if k in
                    ("PATH", "LANG", "LC_ALL", "PYTHONUNBUFFERED", "SSL_CERT_FILE")}
                with subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL, start_new_session=True, env=clean_env) as process:
                    job.process = process
                    process.stdin.write(query.encode("utf-8"))
                    process.stdin.close()
                    deadline, timed_out = time.monotonic() + SCAN_SECONDS, False
                    while process.poll() is None:
                        if job.cancel.is_set() or time.monotonic() >= deadline:
                            timed_out = not job.cancel.is_set()
                            self._stop(process)
                            break
                        time.sleep(0.2)
                    engine_status, findings = read_results(work / "data" / "spiderfoot.db")
                    with self.lock:
                        job.engine_status, job.findings = engine_status, findings
                        if job.cancel.is_set():
                            job.status = "cancelled"
                        elif timed_out:
                            job.status = "timed_out"
                        elif engine_status == "FINISHED":
                            job.status = "finished"
                        else:
                            job.status = "partial" if findings else "failed"
                        job.finished_at, job.process = utc_now(), None
        except Exception:
            with self.lock:
                job.status = "cancelled" if job.cancel.is_set() else "failed"
                job.finished_at, job.process = utc_now(), None

def make_handler(auth, manager, allowed_origins):
    class Handler(BaseHTTPRequestHandler):
        server_version = "CoreResearch/1"
        protocol_version = "HTTP/1.0"

        def log_message(self, *_):
            pass

        def send_json(self, status, data):
            body = b"" if status == 204 else json.dumps(data, ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
            origin = self.headers.get("Origin")
            if origin in allowed_origins:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
                self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self):
            if self.headers.get("Origin") not in allowed_origins:
                return self.send_json(403, {"error": "origin_not_allowed"})
            self.send_json(204, None)

        def dispatch(self):
            try:
                if self.headers.get("Origin") and self.headers["Origin"] not in allowed_origins:
                    raise APIError(403, "origin_not_allowed")
                if self.command == "GET" and self.path == "/healthz":
                    return self.send_json(200, {"status": "ready", "engine": "SpiderFoot", "revision": ENGINE_REVISION})
                header = self.headers.get("Authorization", "")
                token = header[7:] if header.startswith("Bearer ") else ""
                owner = auth.owner(token)
                if self.command == "POST" and self.path == "/v1/scans":
                    if self.headers.get("Transfer-Encoding"):
                        raise APIError(400, "content_length_required")
                    if self.headers.get_content_type() != "application/json":
                        raise APIError(415, "json_required")
                    try:
                        length = int(self.headers.get("Content-Length", "0"))
                        if not 0 < length <= MAX_BODY:
                            raise ValueError()
                        self.connection.settimeout(10)
                        data = json.loads(self.rfile.read(length))
                        if not isinstance(data, dict):
                            raise ValueError()
                    except (ValueError, UnicodeError, TimeoutError):
                        raise APIError(400, "invalid_body") from None
                    if not isinstance(data, dict) or set(data) != {"run_id"}:
                        raise APIError(400, "run_id_required")
                    run_id = canonical_uuid(data["run_id"])
                    try:
                        job = manager.get(run_id, owner)
                    except APIError:
                        payload = auth.payload(token, run_id)
                        if not isinstance(payload, dict) or payload.get("owner_id") != owner:
                            raise APIError(403, "core_access_required")
                        job = manager.start(run_id, owner, payload["kind"], payload["query"])
                    return self.send_json(202, job.public())
                match = re.fullmatch(r"/v1/scans/([0-9a-fA-F-]{36})", self.path)
                if match and self.command in ("GET", "DELETE"):
                    run_id = canonical_uuid(match.group(1))
                    job = manager.cancel(run_id, owner) if self.command == "DELETE" else manager.get(run_id, owner)
                    with manager.lock:
                        return self.send_json(200, job.public())
                raise APIError(404, "not_found")
            except APIError as exc:
                self.send_json(exc.status, {"error": exc.code})
            except Exception:
                self.send_json(500, {"error": "worker_error"})

        do_GET = do_POST = do_DELETE = dispatch

    return Handler

def main():
    auth = SupabaseAuth(os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_PUBLISHABLE_KEY", ""))
    origins = frozenset(o.strip() for o in os.environ.get("CORE_ALLOWED_ORIGINS", "").split(",") if o.strip())
    server = ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "10000"))),
        make_handler(auth, JobManager(), origins))
    server.daemon_threads = True
    server.serve_forever()

if __name__ == "__main__":
    main()
