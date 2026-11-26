# Core people research

Authenticated SpiderFoot Account Finder for the existing private Core workspace.
This is an API service, not a public scanner or a replacement Core site.

## Contract

- Supabase validates every user token; Core's existing data-owner helper must authorize the account.
- Owner and existing shared editors retain the same data scope. Other Toolbox accounts are refused.
- Only a queued database run can start work. The worker obtains the actual target from the database.
- Supported inputs: full name, username, email. A name or email only derives possible usernames;
  it does not identify the owner of an account or provide comprehensive person records.
- One active scan; 3 starts/hour and 12/day per shared Core workspace. Cancelling/deleting a case does not reset limits.
- Exactly 12 pinned public-account site definitions, one request worker, 4-second site timeout,
  no username permutations, 90-second process-group deadline, at most 100 saved findings.
- No arbitrary URL/module inputs, admin UI, paid APIs, port scans or automated scheduled scans.
- Queries are passed over stdin and are not logged. JWTs and Supabase service credentials are never passed to the child engine.
- SQLite committed results and engine status decide completion. Exit zero alone is insufficient.
- Source links and observation times are evidence for possible matches. Review notes never turn a match into verified identity.

## Retention and free hosting

The Render manifest explicitly chooses plan free, no database, disk, paid add-on or automatic upgrade.
Free services sleep after inactivity and can take about a minute to wake. The first request can remain
queued while waking. Keep the research tab open until the run finishes: the Edge gateway polls the worker
and saves results into existing Supabase tables. Reopening shortly afterward can recover a retained job.
Render restarts lose local jobs, which are marked interrupted; saved database cases/findings remain.
No background persistence or monitoring is promised. Existing hosting quotas and workspace billing settings
still apply; do not approve any paid plan or overage.

Deploy only after both acceptance jobs pass and the actual Render Blueprint plan has been reviewed.
The migration starts disabled. Configure the exact deployed engine URL and enable only after health/auth checks pass.
Runtime settings: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (a public key, never service_role),
CORE_ALLOWED_ORIGINS (exact private Core origin), PORT supplied by Render.
The Edge gateway uses Supabase's built-in server environment; its service role never enters browser code.

## Provenance

SpiderFoot is pinned to smicallef/spiderfoot commit
0f815a203afebf05c98b605dba5cf0475a0ee5fd (MIT). The complete upstream license remains
at /opt/spiderfoot/LICENSE in the image. Python 3.11 is verified by the container acceptance job.

accounts-sites.json is a 12-record subset of WebBreacher/WhatsMyName commit
abcb19d6809f0e963e353819c571133b45b6a106 (2026-11-09).
The upstream project announced closure on 2026-11-09, so the definitions are frozen and individual sites
may block requests or change. No CAPTCHA or login bypass is attempted.
The subset retains original detection strings and credit, under Creative Commons Attribution-ShareAlike 4.0:
https://creativecommons.org/licenses/by-sa/4.0/
Copyright (C) 2015-2026 Micah Hoffman. Original authors are listed in accounts-sites.json.
The site-selection/subsetting is the local adaptation. Detection accuracy must be reviewed separately.

## Validation

The GitHub workflow runs real container imports/discovery, worker HTTP authorization tests,
an offline engine scan with synthetic responses and networking disabled, and real Postgres RLS tests.
No real-person target is searched by CI. The Postgres fixture mocks only existing Core membership,
not the new policies/functions under test.

The Public Suffix List is bundled at build time from publicsuffix/list commit 88b076a1fb2ae58cd2a6959d570f075e04d21867 (Mozilla Public License 2.0; original header retained). Scan startup loads this local file.
Core-only migrations live under this service because the Toolbox migration chain does not contain the private Core membership helper. Apply them only to the existing Core backend.
