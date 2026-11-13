# Family Calendar · Commons member-only release
**2026-11-13, Eastern**

## Source and authorization
Cowboy expressly authorized clearing the existing Google Calendar named **Family**, which Google identifies as the account's **primary calendar**. The separate `Cowboy & Ana | Shared Commitments` calendar was not used for deletions or synchronization.

## Google cleanup receipt
- Original search: 321 expanded event instances across **59 unique events / recurring series**.
- Deleted those original event IDs and recurring-series master IDs, with per-event confirmation for the final 41 and a follow-up search verifying the earlier batch was absent.
- Final Google search: **0 events** and no additional pages.
- Future ten-year window: **0 events**.
- This clears the designated Family calendar. Google source remains privately controlled by Cowboy.

## Site delivery
- `docs/commons-family-calendar.mjs` now renders a real month/agenda view and event detail cards inside `community.html` above the approved-members message board.
- Uses the authenticated Supabase RPC `community_family_calendar_feed`, not a public Google iframe.
- Events returned include title, date/time, all-day status, location, full description, tentative status. No attendee email list or secret calendar URLs.
- Multiple-day events and fast mobile navigation supported.
- `docs/commons-family-calendar.css` provides purple/gold styling, mobile calendar grid, and clear focus targets.
- `docs/commons-family-calendar-config.js` deliberately contains no Gmail ID/secret tokens. The source Google calendar ID is used only by private automation instructions.
- Website content-security policy again blocks all iframe origins.

## Private database and access checks
- `public.community_family_calendar_events` + `community_family_calendar_sync` have row-level security enabled and no direct browser read access.
- `community_family_calendar_feed(p_from,p_until)` requires authenticated user membership with `community_members.status = 'approved'`.
- `anon` cannot call that RPC; `authenticated` may call it but fails the explicit approved-member check if not approved.
- `community_family_calendar_sync_snapshot(jsonb,timestamptz,timestamptz)` is restricted to server-side privileged SQL and inaccessible to ordinary signed-in users or anonymous clients.
- An approved-member simulated SQL test successfully returned an empty event array.
- Initial source sync is complete with **0 events**, matching Google's cleared state.

## Future updates
A sixth scheduled automation could not be created because the plan allows five active tasks. Instead the existing **Edward Hourly Core Sync** was updated **without removing its prior instructions** to also:
- Read only the Family Google calendar, never Cowboy & Ana's calendar.
- Fetch date-scoped, paginated Google events and preserve title, time, description, location.
- On a fully successful read, call the atomic Supabase snapshot routine to upsert existing and delete removed events.
- Skip writes on incomplete or failed Google reads.

The hourly sync is **configured** for every hour on the hour; first next run seen at **12:00 ET on November 13, 2026**. The first future automated run has **not yet been independently verified**. New Google Family events may be delayed by roughly one sync cycle.

## Practical warnings
The Family calendar is still the **primary Google calendar**, so any new event placed there may be shared to approved Commons members after sync. Put private appointments on `Cowboy & Ana | Shared Commitments` or another private calendar, not Family.
Being a member of the Commons grants **read visibility** on the website, not permission to edit Google's calendar. Site membership is the access gate. No event details are published to unauthenticated website visitors.
Live iPhone Safari rendering and first hourly sync need member-session verification before claiming full end-to-end acceptance.
