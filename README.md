# Cowboy’s Web Toolbox

A public directory of 415 useful websites: 69 video discoveries and 346 independently researched web finds, plus 28 tips and 85 source videos. Original illustrated previews, source labels, access notes and browser-local favorites make it easy to explore. Matty McTech’s video discoveries retain their attribution; community additions have their own source threads.

GitHub Pages publishes `/docs` from `main` at https://perhardt7686.github.io/cowboys-web-toolbox/.

## The Commons

The account and message-board design lives at `docs/community.html`. Each catalog card links to conversations about that website. Add `?preview=1` to explore fictional visitor, pending-member, approved-member and owner states. Preview posts exist only in page memory. It never collects credentials or sends email.

**Registration is open.** `docs/community-config.js` enables native email accounts, with email verification and owner approval required before posting. The Supabase database and authenticated API are deployed. Both the Edge owner sender and Auth invitation sender have delivered real mail to the owner inbox. Private production owner/member sign-in and recovery walkthroughs remain unverified in this release. The catalog and published discussions are freely browsable.

The optional backend uses Supabase Auth, Postgres with row-level security and a JWT-verifying Edge Function. Verified members await owner approval before posting. Single-use email review links require the verified owner account and a confirmed POST. The board includes categories, full-text search, website-specific discussions, replies, private reports, held-content review, thread closure, membership suspension and account deletion requests.

Edward is explicitly identified as an **automated moderator**. He gives fixed, catalog-based suggestions and original source links. This is a separate website program, not a persistent connection to the author's ChatGPT conversation. It has no access to private chats or inboxes. Owner decisions are not delegated to him.

See [COMMUNITY.md](COMMUNITY.md) for the research, setup, security boundaries and launch checks.

## Development

The public catalog has no build-time dependencies. Run `python3 build.py` after changing `index.template.html`, catalog data or the shared community module. This rebuilds `docs/index.html`, the standalone catalog preview and the server's public catalog/validation copies.

For backend verification, use Node 22+ and `npm ci`, then:

```sh
npm test
npm run check:edge
```

The tests run actual Postgres constraints, policies and transaction functions in PGlite, with injected authentication and mail transports. They do not claim to verify a live Supabase project or SMTP delivery. Package versions and the npm dependency lockfile are committed. Runtime secrets are never committed or placed in `/docs`.


The Commons message boards now include optional member profiles with photo crops, themes, covers, bios and links; a private owner control room for members, moderation, announcements, audit and CSV exports; and aggregate click counters for all 415 base catalog websites and approved dynamic community finds. Email verification and Cowboy's owner approval are required before posting. See COMMUNITY.md for authorization, privacy, deployment and testing details. Interactive preview mode uses explicitly labeled sample data and changes no live account or counters.

## Community Lab

The board includes guided tool requests and unanswered/solved views, author/owner accepted answers, member experience reports, project posts, one-choice polls, helpful votes, private saved/followed threads and an in-site reply inbox. Cosmetic recognition is derived from accepted answers, owner-featured projects and credited discoveries; it never grants staff permissions. New conversations are followed automatically within the per-member saved/followed limit.

The private owner Community desk reviews discoveries and listing reports, features projects, publishes a 14-prompt editorial backlog, and shows digest status counts. A confirmed discovery decision can add a dynamic public catalog entry and click counter. Existing domains link to the existing listing. Reversing that decision withdraws its dynamic listing; badge withdrawal preserves the audit history.

Weekly challenges and an optional public-thread email digest run through `community-programs` and an expiring one-use database dispatcher. The existing six-hour Email & Website Monitor checks for a missing current-week challenge or retryable digest work, so the weekly prompt normally appears at the first Monday check, with catch-up after missed checks. No extra scheduled task slot or paid service is used. Digests are off by default, require an explicit member preference, recheck approval and verified account email before sending, and include a confirmation-based unsubscribe link. A cohort is limited to20 subscribers per week, prioritized by oldest successful send; five are handled per invocation with bounded retries. Sender acceptance is not proof of inbox delivery. Gmail monitoring remains read/alert only.

`npm test` covers the real Postgres migration chain, permissions, RLS, accepted-answer boundaries, vote idempotency, hidden-content statistics, discovery publishing/withdrawal, private reports, program deduplication and opt-in digest behavior. The hosted dispatcher returned HTTP200 with a challenge created and zero digest sends because no members had opted in. Live private account, avatar-upload and subscribed-recipient inbox walkthroughs are not claimed.


## October 30 catalog expansion

Merged the 97 approved research entries into the existing 94-entry catalog. Original IDs, source videos, tips and browser-local favorite keys remain intact. The public catalog, embedded page, standalone preview, CSV and both server catalog copies are rebuilt together. Access limitations and original provider sources remain attached to every new entry. `supabase/catalog-seed.sql` adds missing click-counter rows without resetting existing totals. All 41 automated checks pass. Provider-source review is not a full workflow or security test of each linked service.

## General-audience expansion, October 30

A second sweep reviewed 235 candidates across 46 research topics: 224 passed editorial inclusion, one was a duplicate, two proposed destinations were obsolete and eight remain on verification hold. The 224 passing entries bring the base catalog to 415. A specific-interest selector, searchable research topics and visible topic labels make the broader collection navigable. All original IDs, 85 source videos, 28 tips, favorites keys, Most clicked default, community links and existing counters are retained. Source review includes provider metadata and explicitly identified official indexed content where dynamic pages were unavailable; full candidate workflows remain untested.

## October 30 discovery upgrade

The next release preserves all 415 catalog IDs, 85 source videos, 28 tips, the favorites key and Most clicked default. It adds task aliases and spelling tolerance, 12 purpose groups, structured filters with explicit unknown states, 24-result batches, shareable filter URLs, private folders and notes, backup/restore and reviewed tool-ID sharing, comparisons, six starter packs and thirteen permanent guides. Main navigation and search prompts have an optional Spanish translation; this is not a full content translation.

`docs/discovery-core.js` is shared by browser filtering, CSV export and tests. `discovery-build.py` produces guides, trust pages and sitemap. All CSV routes use the same 23-column writer. Run `python3 build.py`, `npm test`, `npm run check:edge` and `node docs/check-release.cjs`. The release check verifies preserved IDs/URLs, original video links/tips, embedded JSON, standalone scripts and export/server-catalog parity.

A weekly GitHub Actions job checks at most 32 public pages on Monday at 11:30 UTC and saves a 30-day report artifact. The schedule can be delayed or disabled by GitHub; a configured schedule is not evidence of a successful run. It never silently removes listings or treats a blocked request as closure. The public review queue also calculates review ages (30 days for volatile/unknown access; 90 days for stable free references). Owner listing reports remain private in the Community desk.

Optional discovery measurements are off by default. Fixed result, duration and yes/no buckets use private RLS tables, service-only RPCs, UUID deduplication, a 20,000-event daily cap, 24-hour event-ID retention and 90-day aggregate retention. The owner-only Discovery health tab reads the latest 30 New York calendar days. No raw queries, notes, folder names, member IDs or persistent visitor identifiers enter these events. Test/offline mode sends no events. Historical click totals are not reset and can include earlier controlled verification traffic.

Actual desktop Chrome sample tasks were completed in CyberChef (Base64 round trip), Desmos (quadratic graph) and WebAIM (parameterized 21:1 contrast calculation). Their exact scopes are recorded in the catalog. This is not testing all third-party workflows. Real iPhone/Android hardware, screen-reader sessions, production member verification/recovery/deletion walkthroughs and recruitment of willing human testers remain separate acceptance work. No domain, subscription, account or paid service was purchased. A custom domain requires Cowboy's name and budget choice.

Rollback reference: the preceding known-good public main commit is `daea0a154ac71890f56eb3b0cd58b639eefc36ae`. Revert the new release merge to restore its website files; do not reset existing click totals or drop private statistics as part of a website rollback.
