# Street r0d Racing | Rollout QA and Audit
Date: 2026-11-13
Scope: Cowboy's Toolbox racing game (garage, vehicle catalog, multiplayer racer club, boss showdown, junior mode).
Status: SOURCE AND DATABASE AUDIT PASSED WITH OPEN LIVE-PLAY TESTS.

## Production components
- `commons-streetrod.mjs`: original races, member challenges, Cipher Van X boss, rival/driver portraits.
- `commons-streetrod-garage-v3.mjs`: animated garage and original three upgrade jobs, tuning.
- `commons-streetrod-collection.mjs`: sixty original composite concepts; forty-nine adult vehicles available in server catalog, ten junior vehicles, one final rival.
- `commons-streetrod-multiplayer.mjs`: approved racer roster, currently selected car, owned builds, awards, points, targeted asynchronous challenges.
- `commons-streetrod-junior.mjs`: family-friendly 3-star driving mini-game.
- All matching CSS and scripts referenced from `community.html`.

## Tests performed
1. Syntax-checked the five racing JavaScript modules (all passed).
2. Parsed public game catalog: 49 purchasable vehicles. Server physics specs: 50 entries (49 + boss).
3. Ran server simulation for all 49 purchasable cars at stock and fully upgraded levels using identical control inputs and seed; 49/49 completed; 49/49 improved at maximum upgrade; zero performance regressions for this scenario.
4. Verified garage tables use row-level security, and game member RPCs reject `anon` EXECUTE; private simulation/spec functions are not executable directly by authenticated users.
5. Checked `community_streetrod_state` supports targeted invitation visibility and `community_streetrod_showroom` only exposes avatar paths for published active profiles.
6. Confirmed new car collection, driver portraits, boss mode, and junior mode are referenced from the shared page.
7. Fixed racing track player portrait so both sides of the track can show their Toolbox character.
8. Fixed multiplayer roster rendering to preserve expanded build/achievement views across refreshes.
9. Bumped race and racer-club module cache query strings so stale browsers reload the fixes.

## Explicit limits and open risks
- No end-to-end authenticated real-user race was run during this audit. Database has 0 historical racing runs and 0 duels, so two-user challenge completion and trophy awarding require live QA.
- The live GitHub Pages experience was not independently accessible via the public checking tool; GitHub repository source verification is not the same as confirming the published browser UI.
- Server-authoritative race results and upgrade transactions are present, but the physical garage uses 2.5D illustrations and guided simulated service, not fully simulated 3D assembly.
- The 10 junior vehicles are a separate family star-drive game, not the adult credit-based racing system.
- Shared racing shows approved Commons player avatars/builds only. Avatar photos from unpublished profiles are not sent by showroom.
- Multplayer is **asynchronous** (same-seed challenges and independent timed runs). This is **not** simultaneous real-time driving or a synchronized physical race replay.
- The 49-car physics sweep checks one common launch/shift/seed configuration, not every possible tuning setup or device.
- Supabase security advisor reports information notices for tables with RLS but no policies (RPC-only design) and warnings for callable SECURITY DEFINER functions; do not globally relax permissions. Audit the broader app separately before modifying its security model.
- Supabase performance advisor flagged missing foreign-key indexes (including some racing tables). These are scale/optimization follow-ups, not evidence of a current service outage.
- Character/vehicle artwork is an original composite direction; a manual trademark/trade-dress/IP release check is still required before branding/commercial release.

## Manual acceptance checks to finish
- Login as approved member on iPhone Safari; expand racing and Motor Vault.
- Drive into garage; inspect hood/tires/transmission; cancel an upgrade; confirm unchanged credits; complete one upgrade and verify saved level.
- Buy and select one of the new catalog cars; confirm it appears in the original garage and can complete a server-scored drag race.
- Complete a junior star drive and verify persistence after refresh.
- As two separate approved accounts, issue a direct challenge, receive targeted invitation, race both builds, and verify winner, awards, profile avatars and no duplicate credits.
- Race the Cipher Van X; verify boss trophy and first-win bonus are credited at most once.
- Check 320px and 390px Safari widths, desktop keyboard, reduced motion, and session expiry.
- Check network failures during save/finish for clear retry and intact progress.

## Definition of done
Gameplay smoke tests above must pass with real authenticated sessions before considering live multiplayer and progression independently verified. No finished-live-play claim is made by this audit.
