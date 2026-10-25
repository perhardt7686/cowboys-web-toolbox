# Cowboy’s Web Toolbox

A public directory of 69 useful websites, 28 tips and 85 source videos, with original illustrated previews and browser-local favorites. The creator archive is still being cataloged. Sources are credited to Matty McTech; this is an independent collection.

GitHub Pages publishes `/docs` from `main` at https://perhardt7686.github.io/cowboys-web-toolbox/.

## The Commons

The account and message-board design lives at `docs/community.html`. Each catalog card links to conversations about that website. Add `?preview=1` to explore fictional visitor, pending-member, approved-member and owner states. Preview posts exist only in page memory. It never collects credentials or sends email.

**Registration is open.** `docs/community-config.js` enables native email accounts, with email verification and owner approval required before posting. The Supabase database and authenticated API are deployed. Both the Edge owner sender and Auth invitation sender have delivered real mail to the owner inbox. The first owner invitation awaits private email verification and password setup; live owner/member, recovery and moderation checks remain to be completed. The catalog and published discussions are freely browsable.

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


The Commons message boards now include optional member profiles with photo crops, themes, covers, bios and links; a private owner control room for members, moderation, announcements, audit and CSV exports; and aggregate click counters for all 69 catalog websites. Email verification and Cowboy's owner approval are required before posting. See COMMUNITY.md for authorization, privacy, deployment and testing details. Interactive preview mode uses explicitly labeled sample data and changes no live account or counters.
