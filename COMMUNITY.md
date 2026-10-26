# The Commons: accounts and community

## Community Lab release

The catalog now has94 base destinations, with25 independent web finds clearly distinguished from69 video discoveries. Official source and access/check notes remain visible; product workflows were not comprehensively tested. Runtime owner-approved community discoveries can extend the collection, including source threads and counters.

The board adds guided requests, unanswered/solved filters, accepted member answers, experience notes, project posts, polls, helpful votes, private bookmarks/follows/notifications, cosmetic badges and an owner community review/editorial desk. Public counts are stored aggregates of real actions, not fabricated activity. Private report and worker tables intentionally have RLS and no browser policies. Authenticated self-read tables expose only the member’s own choices and inbox; unsubscribe tokens are not browser-readable. All mutations pass verified Auth through the Edge API, with a server-side verified owner-email check for administrative actions and service-role-only SQL functions.

The additive hosted migration chain and local files have matching timestamps. community-api v7, website-activity v2 and community-programs v1 are active. The worker dispatcher was checked live: HTTP200, one challenge created, zero emails submitted with zero opt-ins. Three explicitly authored Cowboy welcome prompts were published; the other11 remain in the editorial shelf.41 automated checks pass against the complete Postgres-backed migration chain. All3 Edge entrypoints pass Deno checks. These checks do not establish a private production owner/member login, avatar upload or subscribed-recipient inbox walkthrough.

The5 scheduled-task slots were already full. The existing enabled six-hour Email & Website Monitor now also dispatches the weekly program at a new week’s first check and catches pending eligible work. It preserves the complete Gmail read/alert-only and disclosed automated-moderator instructions. It does not run continuously or promise a particular Monday clock time. Weekly digests require explicit consent, approved posting access and a verified email; the worker uses the private account email internally and never exposes it in public content or status responses. One cohort of at most20 subscribers is selected per New York week; recipients with the oldest successful send are prioritized. Each invocation handles at most5, with2 attempts per job and a bounded dispatcher. Sender acceptance is distinguished from inbox delivery.

The pre-existing Free-project leaked-password-protection warning remains; no paid upgrade was made. Private default-deny RLS advisory information is intentional. Historical setup notes below are retained for context and do not replace this release status.

## Historical delivery status

The responsive account screens, integrated forum, database migration, authenticated API and automated Edward catalog replies are published. Registration is open with email verification and owner approval required before posting. The interactive design at `community.html?preview=1` uses clearly labeled fictional samples and makes no backend or mail requests.

On October 23, 2026, the user approved project creation. Supabase project `twecuqwetzfweljoxbty` (`cowboys-web-toolbox-community`) is active in US East on the connected organization’s Free plan. The community migration is applied. Public REST reads succeed; anonymous access to approvals and reports is denied. All eight tables have RLS, browser writes are revoked, and privileged functions are service-role-only. No paid plan or mail subscription was added. The first owner account has been invited; private email verification and site-password setup are still pending. Dashboard authentication succeeded. The authenticated Edge Function is deployed and its live rejection/preflight checks pass. Private owner settings and the non-password SMTP values are stored in Supabase. On October 24, the Edge owner sender authenticated to Gmail, its test message was accepted without rejection, and receipt in the owner inbox was verified. Auth SMTP also delivered the owner invitation on October 24; inbox receipt is verified. The owner must accept that invitation and choose a private site password. Interactive owner/member verification, recovery and moderation are not yet verified live.

## Research and choice

| Option | Fit for this website | Constraint |
| --- | --- | --- |
| Supabase Auth + Postgres | Native email accounts, shared discussions, row-level privacy and owner approvals | Needs a project and a production mail sender |
| Firebase Authentication | Managed email authentication | A separate database and trusted service are still needed for owner approval mail and moderation |
| giscus | Free GitHub Discussions embedded on a static site | Members need GitHub authorization; it does not provide this native email-registration experience |

Supabase was chosen to keep authentication, community storage and access policies together. The frontend uses a publishable key only. An Edge Function verifies user JWTs through Auth and applies all writes. Public reads are constrained by database privileges and RLS, independent of the interface.

Primary sources consulted:

- [Supabase Auth custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp): its built-in mail service is for limited testing and normally sends only to authorized team addresses. Configure custom SMTP before public registration.
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits): the built-in provider is limited to two emails per hour. Custom mail has its own limits.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): exposed tables need row-level security and explicit grants.
- [Supabase Edge Function limits](https://supabase.com/docs/guides/functions/limits): outgoing ports 25 and 587 are blocked. The owner's notification transport uses TLS on port 465.
- [Supabase SMTP example](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/send-email-smtp): official Nodemailer integration.
- [Supabase Auth redirects](https://supabase.com/docs/guides/auth/redirect-urls): explicitly allow only the intended callback URL.
- [Supabase password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail): PKCE recovery and password-update flow.
- [Supabase pricing](https://supabase.com/pricing): Free currently includes 50,000 monthly active users and 500 MB database storage; projects can pause after a week of inactivity. Check the actual organization quote before creating anything. Free hosting is not a promise of uninterrupted service.
- [Firebase limits](https://firebase.google.com/docs/auth/limits), [giscus](https://giscus.app/), and [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
- [Google app passwords](https://support.google.com/accounts/answer/185833): a Gmail sender may require two-step verification and a dedicated app password. The user enters credentials directly into provider settings, never chat or public code.
- [Supabase changelog](https://supabase.com/changelog): scanned relevant Auth and Edge changes, including Free-plan mail-template restrictions and supported JavaScript runtime versions.

## Member journey

1. Browse the public catalog and conversations without an account.
2. Choose a display name, email and a passphrase of 15–128 characters, and accept the current guidelines.
3. Verify the member's own email in the same browser used to sign up. Posting remains unavailable until the owner approves the request.
4. The API creates a pending member, and emails a review link to the configured owner mailbox.
5. The owner signs in with the verified owner email. Opening the link changes nothing. An explicit approve/decline action consumes the single-use link. Links expire after 48 hours; the private owner queue remains available.
6. Approved members post or reply. Obvious private credentials and link floods are held for review. This heuristic is not comprehensive content or credential detection.
7. Mention Edward with a task or tool name to receive a clearly labeled catalog-based reply. No paid model API is used.

Password recovery sends a generic response and a link to the member's own inbox. Successful recovery signs out all sessions through Supabase before another login. Existing access JWTs can remain usable until their configured expiry; use a short server-side JWT lifetime. Session storage is temporary by default, with browser-local persistence only when “Remember this device” is selected. Favorites remain separate.

## Backend setup

Project creation and the initial migration are complete. The project reference returned by Supabase is `twecuqwetzfweljoxbty`. The frontend has its real URL and active publishable key, with `enabled: true` and `registrationOpen: true`. Server new-user signup is enabled with email confirmation required. Server credentials remain private.

1. Inspect existing tables, then apply the reviewed migration in `supabase/migrations/`. Run security and performance advisors and resolve relevant findings. Do not apply this schema over an unrelated existing application.
2. In Auth, enable email/password signup with email confirmation; set a minimum password length of 15 and a short JWT lifetime (900 seconds configured). Keep email-change confirmation enabled. Disable anonymous sign-ins and unused providers. Configure rate limits appropriate to the mail sender. Configure supported CAPTCHA protection if needed before attracting public signup traffic; add its public site key and token handling to the UI when enabled.
3. Set the Site URL and exact redirect allowlist entry to:
   `https://perhardt7686.github.io/cowboys-web-toolbox/community.html`
4. Configure **Auth custom SMTP**. Use a sender the user controls. Configure equivalent sender credentials separately for the Edge Function's owner notices. Never publish SMTP credentials or the service-role key. Paid providers require the user's agreement to their actual plan; none is selected automatically.
5. Set Edge Function secrets from `.env.example` through secure Supabase settings. `OWNER_EMAIL` is the user's verified private mailbox. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are platform-provided server secrets. `ALLOWED_ORIGINS` is exactly `https://perhardt7686.github.io`. `COMMUNITY_URL` is the HTTPS board URL above. The Edge notification transport requires port **465** with certificate validation enabled.
6. Run `python3 build.py` to refresh `domain.mjs` and the server's public catalog, then deploy the full `supabase/functions/community-api` directory. `verify_jwt=false` at the gateway is deliberate: the handler validates every mutation's user JWT via `auth.getUser`. A publishable key alone never authorizes writes.
7. Retrieve the real project URL and active publishable key. Set them in `docs/community-config.js`; never add server credentials. Enable the client with `registrationOpen: true` after mail delivery is verified. To close registration, set that flag to false and disable server new-user signup; sign-in can remain enabled.
8. The owner accepts their email invitation and chooses their own password directly. The server compares the Auth-verified email with `OWNER_EMAIL`; metadata or a client role selector cannot make an owner.

## Data and authorization

- All exposed tables enable RLS. Anonymous/authenticated browser clients have no insert/update/delete grants.
- Only published conversations and published replies under published parents are public. Members can read only their own membership status. Reports, approval hashes, audit events, rate limits and deletion requests remain private.
- Server-only SQL functions use `SECURITY INVOKER`, a fixed empty search path, explicit grants to service_role and revoked execution for PUBLIC/anon/authenticated.
- Approval tokens contain 256 bits of random data. Only SHA-256 hashes are stored. Email links carry the token in a fragment, use a no-referrer page and clear it from browser history into page memory. An owner login and confirmed POST are still required.
- Mutations accept JSON POSTs only, with a bounded 20 KB streaming body reader, exact allowed origins, per-account posting/reporting limits, sanitized errors and no credential logging.
- User posts render as escaped plain text. Only HTTPS links without embedded credentials become links, with nofollow/ugc/noopener/noreferrer. No HTML or upload execution is supported.
- Owner moderation includes publishing or hiding held content, closing replies, suspending/restoring posting and privately reviewing reports. Reports do not automatically ban a member. Review queues display at most 50 records per group; advance the queue as decisions are made.
- Account deletion is a **request** requiring owner completion through Supabase, not a misleading immediate-delete button. Before removing a user, anonymize their author-name snapshots or remove their public contributions as appropriate, then delete the Auth account and verify the result. Posts retain name snapshots after a bare Auth deletion, so that alone is not full anonymization. Do not mark completion until verified. No retention period is promised by this version.
- The forum is public and may be indexed or copied by third parties. There is no private messaging, attachment upload or subscription billing in this version.

## Verification and launch gate

`npm test` checks input rendering, reserved names, catalog references, disclosure and source links, plus actual Postgres role privileges, RLS, hashed tokens, confirmation, replay/expiry, owner authorization, moderation and atomic rate limiting. PGlite supplies the database; injected Auth and SMTP services make these deterministic integration tests. `npm run check:edge` checks the production entrypoint with the exact locally installed packages. The initial Deno registry request was unavailable in this environment, so the check uses the supported manual node_modules mode and committed npm lockfile.

Browser QA covers desktop and narrow layouts, empty/disabled launch states, account tabs, guidelines/privacy dialogs, categories, search, website links, sample posting and replies, and owner confirmations. These preview checks cannot verify live authentication or real email delivery.

The October 24 launch opens registration after hosted privacy checks, 16 deterministic integration checks and successful real delivery through both SMTP paths. New members still cannot post until the verified owner approves them. The owner invitation is delivered but not yet accepted. Complete a real owner plus a separately verified member walkthrough: confirmation, pending status, owner email receipt, decline/approve, token reuse, posting, Edward, private reports, recovery, signout and suspension. These interactive checks remain pending and must not be described as passed. Use identities controlled by the user, with their passwords entered privately by them. Invitations open a password-setup form only after a verified Supabase session is available.

Hosted audit: Supabase’s security advisor reports informational notices for the five intentionally private, default-deny RLS tables. They have no browser grants or policies by design. Its performance advisor reports unused indexes on this new empty database. No warning/error-level findings were returned. Remediation references: [default-deny RLS tables](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). Do not open private tables to silence the informational notices.

Live API checks after deployment: missing user JWT → 401; a publishable key used as a user token → 401; an unrelated Origin → 403; GET mutation → 405; correct-origin preflight → 204. Public feed reads return 200. The Edge sender’s real Gmail authentication, message acceptance and owner-inbox receipt are verified as of October 24. Auth SMTP invitation delivery and owner inbox receipt are also verified. The owner has not yet accepted the invitation, so authenticated-user and live moderation success remain pending. Mail transport is initialized only when sending, so unavailable SMTP preserves pending requests and returns a truthful delivery-failed status. A dedicated test covers this failure path; all 16 automated checks pass.


## Member profiles and owner control room — October 25, 2026

Member Profile Studio offers a display name, unique optional handle, headline, biography, optional location, eight interests, a website and three HTTPS links. Six color themes, six CSS cover patterns, eleven icon choices and a centered, zoomable picture crop are available. JPEG/PNG/WebP originals are decoded locally and a 256-pixel WebP/PNG crop no larger than 128 KB is uploaded to the private `community-avatars` bucket. Profiles start private. Shared profiles and their pictures become publicly readable only while membership is approved; membership changes update profile visibility in the same transaction. Existing signed image URLs may remain usable for up to five minutes. Email is never in a public profile. Badges and account status come from authoritative membership, not editable metadata.

The private owner control room adds totals, member name search/status filters and 25-row pages, confirmed changes for up to 20 members, the existing oldest-50 moderation queues, thread pin/close/hide controls, a public text announcement, a fixed-recipient test email, the latest 40 private audit records, 14 calendar days of click aggregates in America/New_York, top websites, and CSV exports of the displayed member/audit page or all website totals. Exports quote values and neutralize spreadsheet formula prefixes. Owner status still requires the verified Auth email on every API request; browser role display is never authorization. Owner accounts cannot be suspended or bulk-edited. Account deletion remains a request requiring separately verified provider completion.

All 69 catalog destinations have public aggregate click counters. Only destination title/Visit website links count, including middle clicks. Source-video and discussion links do not. The browser uses a 30-second per-website cooldown and navigation does not wait for counting. The separate public `website-activity` endpoint validates the exact allowed Origin, JSON size, known catalog ID and a random version-4 event UUID. The server allows up to 240 accepted events per minute, serializes aggregate updates, and deduplicates replayed events in a rolling ten-minute window. Ten reusable private minute slots hold at most 2,400 random event IDs; slots are replaced as counting proceeds. No clicker email, account ID or IP address is stored. The private `community_click_events` table created during staged setup stays empty and unused. Counts can include automated traffic and are not unique visitors or proof of engagement. Counts start at this feature's launch; there is no invented historical traffic.

Apply committed migrations in timestamp order, including the scheduled moderator, profiles, owner controls, click schema, owner overview and bounded-click recorder. All SQL functions are SECURITY INVOKER with an empty search_path; only service_role can execute mutations/admin RPCs. Public tables have read-only RLS; private queues, audit and click windows intentionally use default-deny RLS. Deploy the complete community-api directory (including profile-domain.mjs) and the website-activity directory with explicit deno.json import maps. The counter endpoint is intentionally anonymous; membership mutations still validate user JWTs via auth.getUser.

Edward's existing email monitor also checks the public board every six hours. Public replies are disclosed as Edward / Automated moderator, use public context, skip closed or already answered questions, and are limited to three new scheduled replies per six-hour window. Receipt and audit writes are atomic. The schedule does not grant authority to approve/suspend members, hide/delete posts, disclose private mailbox information or send email replies. Gmail monitoring remains read/alert only. A zero scheduled-reply count is not proof the latest scheduler run succeeded.

Validation: 28 deterministic tests pass using actual Postgres constraints/RLS/roles in PGlite and injected Auth/mail services. They cover cross-user profile/avatar privacy, membership-trigger visibility, field whitelists, handle-conflict transaction rollback, verified owner checks and confirmation, safe CSV values, counters/replay/concurrent requests/rate caps/slot replacement, and moderator receipts. Both production Edge entrypoints pass Deno checks. These checks and browser previews do not establish successful private owner login, password recovery, or an authenticated production upload. Verify those using the member's own private credentials.

The security advisor's private-table “RLS enabled, no policy” information is intentional default-deny behavior. Supabase also reports the pre-existing leaked-password-protection warning; this feature is not enabled in the current Free configuration. No paid plan change was made. Provider guidance: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
