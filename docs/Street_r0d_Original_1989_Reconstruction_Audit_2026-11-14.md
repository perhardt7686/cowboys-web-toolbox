# Street r0d · Original 1989 DOS reconstruction · evidence audit

**Date:** 2026-11-14  
**Scope:** Members-only single-player Summer 1963 game in Cowboy's Commons  
**Status:** Independently authored classic-game interaction overhaul committed; source tests, browser CI, and production deployment must be verified separately. **NOT 100% original gameplay equivalence or full authenticated championship acceptance.**

## Evidence hierarchy

1. **Primary historical specification:** copyright holder's 1989 manual, https://www.streetrodonline.com/wp-content/uploads/2012/09/street_rod_manual.pdf, specifically pp. 3–22. Observed workflows, navigation, mechanical dependencies, driving controls, race stakes, police, injuries, calendar and championship.
2. **Historical visual references:** MobyGames original DOS EGA screens for garage, newspaper, drive-in, tuning and gas; DrivingLine original screenshots. Research references only; no copyrighted screenshots embedded in game.
3. **Implementation research:** MIT-licensed reverse-engineered C/SDL3 source https://github.com/kylofon/street-rod-sdl3. The port's license does not convey rights to original DOS art, audio or data archives.
4. **Actual product source:** docs/community.html, docs/streetrod-reborn.mjs, docs/commons-streetrod-ega.mjs, docs/streetrod-race-physics.mjs, docs/commons-streetrod-summer.mjs, docs/commons-streetrod-season-bay.mjs and existing Supabase migrations. Source state is not itself live acceptance.
5. **Verification:** GitHub Actions toolbox-checks, commons-ui-smoke and Pages deployment; synthetic Chromium 390×844, 375×667 and 844×390. Cannot prove authenticated real-member purchase/repair/racing until genuine end-to-end tests pass.

## Subsystem comparison

| Original-player behavior | Independent classic-game implementation | Evidence / limitation |
|---|---|---|
| DOS-era startup and title | Simulated XT memory/320×200 EGA text startup, skip control, original-style title menu | Presentation only; not real BIOS/DOS execution |
| Name / driver licence | Existing Commons member profile is displayed in license frame | Account bound rather than DOS save-slot name |
| Newspaper cover with USED CARS and AUTO PARTS | New period-style cover, one saved classified per screen, pager/keyboard/swipe | Cars come from Commons fictional car catalog |
| Look at a used car before purchase | New independent 16-colour close-up, native buy/haggle actions | Procedural car families, not copyrighted original car sprites |
| Buying a car returns player to garage | Only the confirmed successful Supabase campaign-action notification triggers navigation | Must test on signed-in member account |
| Physical garage cursor and object hot spots | Hover/focus cues, clickable room hotspots, clipboard/info, newspaper, gas, shop and drive-in | Layout is an approximation, not pixel-by-pixel |
| Hood: TUNE/PARTS/DONE and loose fasteners | Separate engine room with tune, saved bolt workbench and lower hood; existing server validates fasteners | Current upgrade model includes engine, gearbox, tires; not the original's exhaustive carb/manifold aftermarket catalogs |
| Opponent appears at drive-in, player inspects and calls out | Rivals paged individually; visible independent car sprite changes per selected rival; native authentic challenge RPC retained | Original arrival/leave AI and engine inspection details differ |
| Drag and road course, shifts, road grip and wear | Existing real-world-inspired powertrain inputs and server validation, with automatic/manual gearing | Not deterministic bit-perfect original DOS simulation |
| Money/pink slips, damage, tickets and time | Saved campaign and server-authoritative transactions/patrol/breakdown | Particular source thresholds and all police/crash sequences differ |
| School deadline and champion | Existing summer calendar, 22 original fictional rivals, custom Mystery Machine boss, unique winner award | Original King confrontation is not yet reimplemented in full |
| Existing family avatars and multiplayer | Explicitly preserved; separate from 1963 single-player campaign | No duplicate database or public avatar copying |

## Release and regression checklist

- [x] No proprietary DOS artwork/sprite/audio/data files added.
- [x] Real owner game state remains in its original tables and authenticated RPCs.
- [x] Original-style paper front, catalog look-at-car, hood menu and car clipboard exposed in a single viewport.
- [x] New pixel car inspection scene and dynamic rival car art are generated locally.
- [x] Authenticated success hook is separate from optimistic click messages.
- [x] Original-feature regression source tests added.
- [x] Mobile Chromium browser navigation, pixel canvas, keyboard paging, challenge, workshops and core actions represented by synthetic fixtures.
- [ ] Entire original vehicle/parts market reproduced with historical fitment and part grades.
- [ ] Full original diner rival arrival/leave behavior, accepted-bet negotiation and two-stage final challenge.
- [ ] Exact original game collision physics, police pursuit, warning, transmission damage, weather and save-slot sequence.
- [ ] Independently validated parity for every original garage, diner, car and road screenshot.
- [ ] Real signed-in iPhone Safari purchase → mechanical repair → fuel → wager → validated racing → championship, including save reload and post-release cache verification.

## Preservation / release policy

Existing profiles, player cars, multiplayer, junior, message board, calendar, and saved single-player seasons remain untouched by this presentation rollout. No paid services or extra account tables are needed. Never call 100% complete based on synthetic tests or GitHub Pages publication. A real authenticated end-to-end completion with source-side checks is required for an unqualified gameplay certification.
