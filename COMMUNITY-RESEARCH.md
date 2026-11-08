# The Commons — classic forum upgrade

Reviewed November 8, 2026. The brief's “90/2000” is interpreted as the 1990s–2000s forum era. This is a review of documented forum patterns, not a claim to have audited 90 separate communities. Current official documentation grounds the feature choices.

| Primary source | Useful pattern | Toolbox implementation |
| --- | --- | --- |
| [phpBB features](https://www.phpbb.com/about/features/) | Avatars, signatures, board preferences, drafts, subscriptions | Extend Profile Studio with optional identity, private reading preferences, text draft recovery; retain existing saved/followed topics |
| [UBB.threads features](https://www.ubbcentral.com/features.php) | Quick quoting, dated posts, new-post indicators, watch lists, member moods | Referenced quotes, direct reply links, dated Eastern 24-hour times, unread markers, optional status lines |
| [MyBB user features](https://mybb.com/features/users/) | Visible contribution context and recognition | Public member activity counts and recent public contributions; retain existing genuine contribution badges |
| [XenForo discussion features](https://xenforo.com/features/discussion/) | Accepted answers, watched content, bookmarks, moderation tools | Accepted-answer jump navigation; preserve existing polls, helpful votes, account follows, bookmarks and owner review tools |
| [XenForo profile documentation](https://docs.xenforo.com/manual/users/user-profile) | Custom profile fields, titles, signatures and member privacy | Optional titles, craft/occupation, skills, favorites, signature; separate private authoring values from published profile extras |
| [Discourse features](https://www.discourse.org/features) | Draft autosave, context, mobile layouts and personal preferences | Browser draft recovery, reply context, readable post controls, compact/large-text/reduced-motion settings |

## Feature boundaries

- Existing email verification, owner posting approval, reports, suspensions, owner audit, discovery review, polls, recognition, weekly challenges and opt-in digests remain in place. No membership, role, email preference or profile visibility is changed as a side effect of the release.
- New replies use server-created timestamps. Time labels contain the date, 24-hour clock and EST/EDT, converted using America/New_York.
- Reply location is the member's current, explicitly opted-in public profile location. No device/IP location is requested or inferred. Location is not copied into post records; making a profile private withdraws it from current public rendering.
- Unshared forum extras and reader preferences live in an own-account RLS table; the publicly readable profile holds only the chosen public projection.
- Text drafts are browser-local, scoped by account and form, cleared after confirmed submission, and recoverable for 30 days. Preview mode does not write real accounts or production posts.
- Topic and reply search excludes held/hidden content even for owners. Public counts and last-reply activity retract when a reply is hidden.
- Conversations page through 50 published replies at a time. Direct reply links locate the correct page using server position, rather than a guessed page number.
- Formatting is an escaped subset: bold, italic BBCode, inline code, quoted lines and safe HTTPS links. It does not enable raw HTML or third-party embeds.
- No new private messaging service, unsolicited messages, notification subscription or paid service is activated by this release.

## Verification

The release uses the existing Postgres/RLS integration suite plus specific tests for private extras, reference validation, edit ownership, search visibility, count retraction, DST time labels and escaped formatting. Browser checks cover the actual profile editor and forum controls in an explicitly marked preview. Production deployment and live checks have separate receipts recorded at completion.
