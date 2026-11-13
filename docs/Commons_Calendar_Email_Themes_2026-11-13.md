# Commons calendar email and seasonal UI release
Date: 2026-11-13 · America/New_York

## Notification behavior
- The existing Supabase `community-game-mailer` now delivers responsive HTML and plain-text fallback for the existing Commons conversation/reply, license plate, word-guess, and Mahjong score/achievement events. It also supports `calendar_new`, `calendar_week`, and `calendar_day`.
- Calendar email source: private owner Core calendar snapshot (primary Family + Cowboy & Ana shared, currently checked over a rolling ~30-day window), plus the members-only Family calendar mirror. The Family mirror provides full descriptions/locations for its events. No calendar data is added to public pages or sent to other members.
- The database job `commons-calendar-owner-mail` runs at minute 25 hourly via pg_cron. A private seen ledger baselines previously known events and separate idempotent outbox keys control each new/7-day/1-day alert. "Week before" and "day before" mean 7 and 1 calendar days before the event in America/New_York. Calendars are read through existing scheduled synchronization, not a live Google change webhook.
- The primary SMTP sender remains server-side and owner-only. The existing hourly Message Board Email Backup task was extended for styled HTML and calendar event types, without altering its atomic claim/finish and retry rules.
- Other website pushes: `community-api` administrative owner email and `community-programs` opt-in weekly digest now use styled HTML with a text fallback and original links.
- Email artwork is self-contained, email-safe HTML (no external tracking pixels): seasonal calendar header, license plate road motif, word tiles, Mahjong tiles, Commons message-board theme. Month-specific calendar emails use Thanksgiving in November and Christmas in December.
- Sensitive source values and SMTP credentials remain server-side; no secrets are committed.

## Verified receipts
- Updated active Edge Functions: `community-game-mailer` v2, `community-api` v16, `community-programs` v2.
- Active private cron job: `commons-calendar-owner-mail`, `25 * * * *`.
- Successfully loaded two Family events and 15 Cowboy & Ana shared events into the private owner calendar source; full details were retained.
- Manual reminder queue check: 17 entries scanned, five messages queued. All five were marked sent with one attempt each (four next-day alerts, one seven-day alert). Gmail search located the Family Saturday reminder; reading its MIME confirmed a multipart message with HTML and inline styling. SMTP acceptance is not proof that every recipient's inbox rendered it as intended.
- A visual email preview was also marked sent and found in Gmail.
- Existing Commons members-only Family feed now contains Saturday and Sunday family plans.

## Season-aware calendar
- `docs/commons-family-calendar.mjs` selects a monthly theme whenever the family calendar loads or navigates to a different month; the collapsed header and expanded calendar share that theme.
- Twelve month themes are present: January winter, February hearts, March/April/May spring flowers, June/July/August summer, September autumn, October pumpkins, November Thanksgiving, December Christmas.
- The fourth Thursday in November is computed dynamically, and the Thanksgiving day tile receives a turkey marker. In 2026 it falls on November 26. Other static seasonal markers include New Year's Day, Valentine's Day, US Independence Day, Halloween and Christmas.
- CSS uses accessible contrast and small-screen placement; it changes decoration only, never Google events or board permissions.
- `docs/community.html` has new cache-version references for the script and CSS.

## Known limitations and next checks
- Calendar source refresh and mail queuing are hourly eventual-consistency, not immediate webhook delivery. The Cowboy & Ana source currently covers a rolling ~30-day snapshot; an event added further ahead can be first noticed when it enters that snapshot. The Family source covers the configured broader synchronization window.
- New events without a prior baseline may be classified as new to the mirrored feed rather than newly created at Google.
- Duplicate calendar copies or distinct related events may each generate separate notifications. This is intentional per-event behavior, not duplicate sends of the same event key.
- Existing Commons accounts must be approved to view the Family calendar. The feed and repo code are verified, but live iPhone Safari member-session rendering and first future unattended cron/sync executions have not yet been independently verified.
