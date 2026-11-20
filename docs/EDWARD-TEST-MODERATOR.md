# Edward (AI Test Moderator)

This is a **local, in-memory test persona**, not a member of the production database.

## Access for development testing

Start a local static web server serving `docs/` and open:

`http://127.0.0.1:8765/community.html?preview=1&role=edward&panel=powers`

The demo profile is clearly labeled **Edward (AI Test)**. Its Power House uses a fictional Moderator rank limited to the sample **Feedback** board. It cannot sign in to the live website, read private members-only production data, assign actual moderator permissions, or post real content.

The preview is permitted only on `localhost` or `127.0.0.1`. The published public website does not accept `preview=1&role=edward` as a login or moderator grant. A genuine member/moderator login requires a verified email, normal Supabase authentication, owner approval, and a deliberately reviewed staff grant. Never insert directly into `auth.users` to bypass this process.

## Fair-play testing policy

- Mahjong testing must use regular free matching tile pairs. Never remove tiles by database update, alter scores, grant achievements, add credits, or simulate a live ranked victory.
- Test boards and preview forum actions are strictly local or explicitly marked as synthetic. Automated tests must disclose that they are automated.
- Avoid exposing secrets, real family records, and private threads to a bot account.
- A 72-tile local legal-pair clearing test validates interaction rules without reporting a production win.
- No continuous playing, polling, or logged-in automation is implied. Test runs happen only when an authorized user invokes them or configures a specific automation.

**Status:** fixture and unit/browser test suite only. Not an activated real account. Do not call this a production account in release notes.
