# Cowboy's Commons: Games, Messaging and Family Calendar QA
**Date:** 2026-11-13 (America/New_York)
**Scope:** Remaining Commons games, message-board messaging UX, member privacy, new family-calendar foldout.
**Release state:** Frontend fixes deployed to repository. Google Calendar creation/link pending one Google-side step. Actual two-person live play remains unverified.

## Audit and test evidence
- Checked JavaScript source syntax for 18 game/community modules, including Mahjong, Word Quest, w0rdle, license plates, drawing studio, shared guesses, forum UI, study game, and core Commons. **18 passed** after accounting for top-level await in ECMAScript modules.
- Scanned relative imports: **0 missing local module dependencies** in this set.
- Checked the current message-board HTML: **18 local script references and 27 stylesheet references**, 45/45 files exist in the repository. **0 duplicate static HTML IDs.**
- Checked new CSS structure (forum polish, game polish, calendar polish): balanced braces.
- Checked 30 Word/Wordle/Mahjong/Plates database functions and role grants: no anonymous access to game submission functions.
- Verified Word Quest and w0rdle resolve daily rounds from the same `community_word_days` table.
- Verified Mahjong's pause RPC uses approved-member authorization and writes pause time to the member's run.
- Verified forum location labels require both a published active profile and explicit member opt-in.
- The drawing studio saves locally unless the player chooses to export files; server-backed features remain separate.

## Repairs committed
1. **Forum unread/reply duplication:** Repeated feed decoration no longer appends duplicate unread badges or latest-reply rows. The reply composer is now guarded against multiple enhancement mounts.
2. **License-plate scoreboard:** Removed hard-coded 33/19 placeholder score values when server player totals are absent. Missing records now display a dash instead of misleading invented results.
3. **Message-board design:** New `commons-forum-polish.css` follows dark violet / gold identity with clearer thread contrast, improved hierarchy, system-body font, editorial serif headings, readable message measure, mobile wrapping, accessible focus targets.
4. **Game polish:** New `commons-games-polish.css` improves game launch controls, visual consistency and touch-button sizing without changing Mahjong tile geometry, word scoring or backend game records.
5. **Safari delivery:** Cache revisions updated on `community.js`, `commons-plates.mjs`; forum imported with updated cache key.
6. **Calendar shell:** `commons-family-calendar.mjs` and CSS add a collapsible panel before the approved-members board, lazy-loading Google Calendar and offering Agenda/Month controls after configuration.
7. **Calendar CSP:** `community.html` allows only `https://calendar.google.com` as a frame source. Other origins remain blocked.

## Family Google Calendar: exact blocker
- Google Calendar connector currently has calendar listing and event operations but **no create-new-calendar action**. The existing connected calendar list has a primary calendar, `Cowboy & Ana | Shared Commitments`, and U.S. holidays. **None was modified or published.**
- The new Family Calendar foldout is installed and deliberately has a blank calendar ID. In this state it shows a clearly labeled setup notice, **not real events**.
- After a genuinely new Family calendar is created in Google, set its ID in `docs/commons-family-calendar-config.js`. Its events can then appear in the board foldout.
- **Privacy caveat:** A Google calendar made public so anyone can view it may also be discoverable outside the approved-member board. Use it only for shareable event titles/times, not children's private locations, medical appointments, home addresses or sensitive schedules. A members-only integration would need a separate authenticated synchronization service, not a public iframe.
- To create it, use Google Calendar from a desktop browser (or Safari requesting desktop site): create a new calendar named **Family | The Commons**. Google help: https://support.google.com/calendar/answer/37095
- Integration guidance: https://support.google.com/calendar/answer/41207

## Remaining verification, not claimed complete
1. **iPhone Safari live:** Login; confirm the family foldout appears only to approved members. Expand, close, and test at 320px and 390px.
2. **Messaging real member:** Post a topic, reply, refresh and confirm one unread badge, one last-reply item, one reply editor; test quote, edit, newest-reply jump, member directory, reporting, and keyboard navigation.
3. **Mahjong:** New campaign run, pause/resume and zoom/pan; confirm saved match count and award.
4. **Word Quest + w0rdle:** Use two separate approved accounts on same day, compare answer/guesses, team scoring and personal credit allocation.
5. **License plates:** Upload/crop a photo, close and reopen viewer, cast vote, verify server totals; test image access with an unauthorized account.
6. **Drawing studio:** Undo, redo, local persistence, layer editing and export.
7. **Family calendar:** Verify newly created Google calendar sharing, agenda/month embed, and private event exclusions with two distinct viewer accounts.

## Audit conclusion
Source-level design and defect fixes are committed. A full real-user integration and accessibility audit is **not** complete until the hands-on checks above pass. This distinction is intentional.

## Final calendar identity check (important)
A later `list_calendars` check showed a Google calendar **named “Family”** but with `primary: true` and the same ID as the account's primary Google Calendar. This is **not** the requested new secondary Family calendar. To avoid accidentally exposing personal appointments, `commons-family-calendar-config.js` is intentionally blank and no primary calendar ID was written. The user must create a genuinely separate calendar using Google Calendar **Other calendars > + > Create new calendar**, not rename the primary. Do not make the primary calendar public.
