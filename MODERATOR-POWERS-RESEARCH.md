# The Commons: owner-controlled powers

Reviewed November 8, 2026. This extends the classic-forum profile and discussion upgrade. The research is a comparison of documented forum patterns, not a claim that 90 communities were audited.

| Primary source | Useful pattern | Implemented in the Toolbox |
| --- | --- | --- |
| [XenForo: staff](https://docs.xenforo.com/manual/access-privileges/staff) | Separate administrative authority from moderation; moderators may be global or forum-specific; a staff display flag alone conveys no rights. | Cowboy is the fixed owner. Delegated powers use explicit capabilities and optional board scopes. Cosmetic honors are separate from authorization. |
| [XenForo: permissions](https://docs.xenforo.com/manual/access-privileges/permissions) | Configure individual permissions and inspect effective permissions. | Each rank chooses from 16 capabilities. My powers displays effective capabilities, level, board scope and expiry. |
| [Discourse: managing content](https://meta.discourse.org/t/discourse-moderation-guide-part-3-managing-content/406266) | Correct titles/categories, move selected posts into existing or new topics, add staff notices, pause conversations. | Topic organization, selected-reply moves and splits, editor notes, topic pause/reopen. Creation time and original authorship are preserved. Existing reply URLs follow the reply to its new topic. |
| [MyBB: moderation](https://mybb.com/features/moderation/) | Contextual and inline moderation, forum-specific tools, a moderator control panel and action logs. | Contextual Topic powers/Post powers, select up to 20 replies, a central Power House and recorded action receipts. Confirmation shows the exact action before applying it. |
| [Discourse: badges](https://meta.discourse.org/t/badges-reference-guide/310717) | Recognition can encourage useful community contributions. | Custom member honors and ribbons, accent colors and static halo/sparkle treatments. Members can hide awarded flair without changing their actual permissions. |
| [MyBB: permissions](https://docs.mybb.com/1.8/development/permissions/) | User groups and moderator permissions model different kinds of authority. | Rank level and capabilities are independent: a higher number protects against lower ranks but does not silently add permissions. |

## Delivered powers

1. Edit post words, preserving original authorship and adding staff attribution.
2. Add or remove an editor note.
3. Apply a post accent, outline or gentle glow.
4. Add or remove a public ribbon.
5. Rename or recategorize a topic.
6. Pin or unpin a topic.
7. Pause or reopen replies.
8. Spotlight or unfeature a topic.
9. Move selected replies to an existing topic.
10. Split selected replies into a new, attributed topic.
11. Choose or clear the accepted answer on a tool request.
12. Hold public content for owner review.
13. Award a cosmetic member title and honor.
14. Award a member accent and optional static flourish.
15. Undo eligible changes with current permissions and revision checks.
16. Delegate lower ranks, bounded by the grantor's powers, scope and expiry.

## Hierarchy and limits

Cowboy has fixed level 1000 and all 16 powers through the existing verified owner account. Default, unassigned templates are Guide (100, three powers), Curator (300, nine), Moderator (500, fifteen) and Steward (750, sixteen). Only Cowboy can create or edit rank definitions, with levels 1–900 and up to 24 rank definitions. Ranks do not inherit capabilities from their number. Grants may cover all boards or selected boards and may expire after 1–2160 hours; 0 means no expiry.

No migration assigns a rank to another member. A delegate cannot promote themselves, assign equal/higher ranks, affect equal/higher members, give capabilities they lack, broaden a board scope or outlast their own grant. Inactive ranks, revoked grants, expired grants and unavailable membership lose powers on the next server request. Member-wide honors require all-board scope. Only the owner releases held content, including via undo.

All actual mutations authenticate the current Supabase user and check current database permissions. Raw browser writes are denied. Grant/rank changes enter the existing owner audit log; post/member enhancement receipts include a reason, actor, Eastern 24-hour timestamp and guarded undo. Owner-only comparison provides saved before/after values. Undo refuses to overwrite later author or staff work.

This design deliberately favors improving public contributions and recognizing people. It adds no access to private email, account credentials, private profile settings, owner Core, hosting, or database administration. It does not add automatic promotion, forced name/avatar changes, punishment points, bulk deletion or private messaging. No moderation package or paid service is required.

## Validation scope

Real Postgres tests exercise authorization and transaction behavior using fictional identities, plus injected Auth/mail boundaries. Browser previews exercise fictional rank creation, grants, cosmetics, post changes and history without modifying real members or contributions. Production deployment receipts belong in the release record; a fictional browser preview is not evidence of a successful private production owner login.
