# The Commons: accounts and community

## Delivery status

The responsive account screens, integrated forum, database migration, authenticated API and automated Edward catalog replies are implemented. The public configuration defaults to **registration closed**. The interactive design at `community.html?preview=1` uses clearly labeled fictional samples and makes no backend or mail requests.

On October 23, 2026, the user approved project creation. Supabase project `twecuqwetzfweljoxbty` (`cowboys-web-toolbox-community`) is active in US East on the connected organization’s Free plan. The community migration is applied. Public REST reads succeed; anonymous access to approvals and reports is denied. All eight tables have RLS, browser writes are revoked, and privileged functions are service-role-only. No paid plan, mail subscription or real member account has been created. Dashboard authentication, Auth email delivery, function secrets/deployment and live owner/member verification remain before activation.

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
3. Verify the member's own email in the same browser used to sign up. Public signup is closed until mail delivery works.
4. The API creates a pending member, and emails a review link to the configured owner mailbox.
5. The owner signs in with the verified owner email. Opening the link changes nothing. An explicit approve/decline action consumes the single-use link. Links expire after 48 hours; the private owner queue remains available.
6. Approved members post or reply. Obvious private credentials and link floods are held for review. This heuristic is not comprehensive content or credential detection.
7. Mention Edward with a task or tool name to receive a clearly labeled catalog-based reply. No paid model API is used.

Password recovery sends a generic response and a link to the member's own inbox. Successful recovery signs out all sessions through Supabase before another login. Existing access JWTs can remain usable until their configured expiry; use a short server-side JWT lifetime. Session storage is temporary by default, with browser-local persistence only when “Remember this device” is selected. Favorites remain separate.

## Backend setup

Project creation and the initial migration are complete. The project reference returned by Supabase is `twecuqwetzfweljoxbty`. The frontend has its real URL and active publishable key, with `enabled: false` preserved. Server credentials remain private.

1. Inspect existing tables, then apply the reviewed migration in `supabase/migrations/`. Run security and performance advisors and resolve relevant findings. Do not apply this schema over an unrelated existing application.
2. In Auth, enable email/password signup with email confirmation; set a minimum password length of 15 and a short JWT lifetime. Keep email-change confirmation enabled. Disable anonymous sign-ins and unused providers. Configure rate limits appropriate to the mail sender. Configure supported CAPTCHA protection if needed before attracting public signup traffic; add its public site key and token handling to the UI when enabled.
3. Set the Site URL and exact redirect allowlist entry to:
   `https://perhardt7686.github.io/cowboys-web-toolbox/community.html`
4. Configure **Auth custom SMTP**. Use a sender the user controls. Configure equivalent sender credentials separately for the Edge Function's owner notices. Never publish SMTP credentials or the service-role key. Paid providers require the user's agreement to their actual plan; none is selected automatically.
5. Set Edge Function secrets from `.env.example` through secure Supabase settings. `OWNER_EMAIL` is the user's verified private mailbox. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are platform-provided server secrets. `ALLOWED_ORIGINS` is exactly `https://perhardt7686.github.io`. `COMMUNITY_URL` is the HTTPS board URL above. The Edge notification transport requires port **465** with certificate validation enabled.
6. Run `python3 build.py` to refresh `domain.mjs` and the server's public catalog, then deploy the full `supabase/functions/community-api` directory. `verify_jwt=false` at the gateway is deliberate: the handler validates every mutation's user JWT via `auth.getUser`. A publishable key alone never authorizes writes.
7. Retrieve the real project URL and active publishable key. Set them in `docs/community-config.js`; never add server credentials. Keep `enabled: false` while completing the launch checks.
8. The owner creates their own account and chooses their own password directly. The server compares the Auth-verified email with `OWNER_EMAIL`; metadata or a client role selector cannot make an owner.

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

Before enabling registration, test a real owner plus a separately verified member: confirmation, pending status, owner email receipt, decline/approve, token reuse, posting, Edward, private reports, recovery, signout, suspension and unauthorized direct API requests. Check hosted RLS/advisors, SMTP receipt and delivery failures. Use test identities controlled by the user, with their passwords entered by them. Only then set `enabled: true`, deploy and confirm the public flow.

Hosted audit: Supabase’s security advisor reports informational notices for the five intentionally private, default-deny RLS tables. They have no browser grants or policies by design. Its performance advisor reports unused indexes on this new empty database. No warning/error-level findings were returned. Remediation references: [default-deny RLS tables](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). Do not open private tables to silence the informational notices.
