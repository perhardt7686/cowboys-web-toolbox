# Skyboard Sprint — Private Family Live Race (proposed)

**Status: engineering foundation only, NOT playable multiplayer, NOT deployed.**
**Owner:** Cowboy. **Release dependency:** PR #79 must pass all four required CI/mobile gates and merge before integration.

## Goal

Add **real simultaneous racing for 2–4 approved family members** in Emma's Skyboard Sprint, without changing existing solo courses, verified single-player progress, member identities, coins, board unlocks, or asynchronous ghosts. The current live game must never suggest that a ghost is a connected human.

## Sequenced work (no premature launch)

1. **This branch: protocol foundation.** Implement a bounded, versioned visual frame shape for remote riders, a 2–4-player ready-room contract, monotonic frames, 100 ms visual telemetry and no-extrapolation interpolation. Test invalid, forged, duplicate and stale frames. Do not add a lobby button or open any channel yet.
2. **Backend authorization, separate review.** Design server-owned room and participant membership (approved member IDs, invite/acceptance, owner/host, stage, board availability, course edition, seed, room expiry). Only a server-authorized participant can read/write that room's **private** Realtime topic. Use membership-scoped RLS on `realtime.messages`, not an obscured room code or a merely authenticated channel. Limit to four slots, reject extra/late joins, expire abandoned rooms, and keep private membership data out of public catalog/GitHub. Verify absence of BOLA/IDOR, anonymous access and cross-room eavesdropping in a test environment before production changes.
3. **Simultaneous race integration.** Server returns one stage/seed/edition and a future start timestamp. Each authorized device runs its **own** deterministic `createSkyRide` / `stepSky`; one local player remains authoritative for their display, and peers are visual-only riders (never rendered as asynchronous ghosts). Start at a measured server-time offset; show countdown, connection quality, and 2–4 clearly different racers. Cap broadcast to 10 Hz, interpolate *between received* frames only, show disconnect and reconnect appropriately, and never hide dropouts behind invented movement.
4. **Fair finishing.** Do not accept room broadcasts as proof of victory. Independently verify finish replay on server with the same course and original anti-cheat rules. Only display an **official** shared ranking after all claimed finish results have server validation. A disconnection, time skew, abandoned replay, or duplicate finish remains provisional and never grants a board, award or points. Keep any official solo progression pathway unchanged unless a separate, tested decision explicitly changes it.
5. **Family acceptance.** Test two, three, four concurrent signed-in approved members on real iPhones and tablets, Wi-Fi + cellular, 150–300 ms simulated latency, reconnect, slow device, private-room invite and rejected outsider. Check sight lines, taps, camera/controls, and race fairness. Use real screenshot/motion evidence before claiming original-game resemblance.

## Security and release checklist

- All public UI hidden until authenticated room backend, private-channel membership RLS, and join/read/write negative tests are verified.
- No `service_role`, secret key, student record, home address, email address, DOB or private family photo in frontend/realtime messages.
- Never use user-editable `user_metadata` for membership authorization. Confirm approval from authoritative `community_members` and room memberships in the database. A UUID is not access control.
- Enforce capacity and room ownership at the server, not merely in browser JavaScript. Reject stale JWT access where possible and revoke expired membership on room changes.
- Realtime authorization is checked on channel subscribe and message permissions. The transport alone is not a substitute for validating submitted replay and race results.
- Preserve all preexisting entitlement, score, badge and family-calendar data. Do not create public multiplayer until release/permissions testing has passed.
- Respect limited service quota; no paid infrastructure or new subscription without authorization.

## Source guidance

- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Broadcast and private channels](https://supabase.com/docs/guides/realtime/broadcast)

## Current acceptance status

- [x] Pure protocol, bounds and sanitization authored.
- [x] Tests added for valid/invalid room shapes, monotonic visual frames, and no extrapolation.
- [ ] Test workflow green on this branch.
- [ ] Backend room persistence + membership RLS proven.
- [ ] Private Realtime integration, visible opponents and synchronized start.
- [ ] Server-verified multi-member race rankings.
- [ ] Real-family-device 2–4-player acceptance.
- [ ] Feature enabled for approved family members.

No items below the first two may be presented as complete without execution receipts.
