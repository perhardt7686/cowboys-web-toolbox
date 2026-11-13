# Cowboy's Commons DOS Arcade · one-screen navigation rollout

## Revision · Individual launch buttons (latest user direction)

The shared **THE COMMONS ARCADE** selection launcher has been retired from the visible board. The original **separate Commons game buttons** are visible again for Street r0d, Mahjong, w0rdle, Daily Word Quest, License Plates, and 7A Study Cards. Drawing Studio receives its own standalone launch button alongside those cards.

Clicking a game's own button now opens **that game's dedicated full-viewport monitor directly**. No shared selection screen is required. Street r0d retains Garage/Tune/Classifieds/Parts/Diner/Road/Calendar/Junior internal scenes. Mahjong retains Play/Levels/Scores/Awards/History. Other games retain their own scene tabs, settings, scoreboards, and save pipelines. The HUD returns to the original individual buttons with **GAMES** or **EXIT**, while **SETUP** changes only display preferences. Closing uses each game's original button handler to keep in-memory expanded state synchronized.

Styling was made more compact for phone portrait and short landscape layouts. The Wordle 12-row board, keyboard, and form were checked at 390×844 and 375×667 in synthetic Chromium QA. The same browser test also covers all seven buttons and game screen transitions at 844×390 landscape. Long photographic records and large catalogs retain bounded scrolling *inside* the game window instead of scrolling the entire Commons page.

Assets are versioned in `docs/community.html` as `commons-arcade-shell.css?v=dos-screen3` and `commons-arcade-shell.mjs?v=dos-screen3` to refresh iPhone Safari caches. The original member-only server-backed state, awards, game credits, race history, and plate photos are preserved, not migrated or reset.

**Acceptance limit:** Synthetic browser checks and GitHub Pages publication do not replace a signed-in Safari walk-through. No claim of complete cross-account or all-game backend acceptance without live credentials.

---



**Date:** November 13, 2026  
**Repository:** `perhardt7686/cowboys-web-toolbox` (`main`)  
**Scope:** Commons game presentation, streetrod garage mechanics, and browser regression tests  
**Publication:** GitHub Pages in `docs/`.

## Product direction
A fixed full-screen DOS-inspired arcade with one active scene per game, rather than one vertically scrolling board of expandable game panels. Approved Commons members open **THE COMMONS ARCADE**, choose a program, and navigate between scenes using the on-screen scene selector and Previous/Next arrows on small screens.

The launcher contains original 320×200 EGA-style artwork. **F2 / SETUP** changes the arcade palette, text size and reduced-motion preference. **MENU** returns to program selection; **EXIT** restores the board.

Program entries: Street r0d; Mahjong; w0rdle; Daily Word Quest; License Plates; Drawing Studio; VDACS/Category 7A study cards. Street r0d includes Garage, Tune, Classifieds, Parts, Drive-In, Road, Calendar and Junior screens. Mahjong includes Play, Levels, Scores, Awards and History.

Long historical archives or full editing forms may have a **bounded internal scroll** on compact phones, but movement between games or locations no longer requires scrolling down the webpage. All existing mount nodes, account restrictions, event handlers and server-side race/score/save mechanisms remain intact. We did not replace or reset live profile data, cars, credits, awards, or the Family Calendar.

## Implementation
- `docs/commons-arcade-shell.mjs`: shared scene controller, original menu art, settings, tab navigation, overlay lifecycle, per-game selection.
- `docs/commons-arcade-shell.css`: fixed viewport DOS frame with responsive mobile controls; detailed screen layouts for all programs.
- `docs/community.html`: versioned arcade asset imports and updated streetrod mechanics/tuning assets.
- `docs/commons-streetrod-season-bay.mjs` and `.css`: manual drag-to-turn fastener gestures; right for tightening and left for loosening; fallback tap for accessibility; the original mechanical server validates changes and torque sequence.
- `docs/commons-streetrod-summer.mjs` and `.css`: illustrated, stepwise distributor timing control replacing a bare confusing select with more legible feedback. Timing remains a simplified seven-setting game model, not calibrated real-world ignition degrees.
- `tests/browser-arcade-shell.py`: Playwright synthetic iPhone-size monitor test verifying launcher, games, mobile scene arrows, settings, single-card license review and exit.
- `tests/streetrod-workshop-ui.test.mjs`: Node assertions for existing garage RPC, controls and asset integration.

## Verified and not verified
- GitHub Actions `Commons mobile readability browser check` **success** at commit `98911781` (Chromium synthetic member fixture, width 390 px).
- GitHub Actions `Toolbox release and weekly review` **success** at commit `778f6ecf`, with new source-level workshop tests.
- GitHub Pages deployment **success** at commit `778f6ecf`.
- The public Commons URL and deployed `commons-arcade-shell.mjs?v=dos-screen2` were retrieved successfully.
- These are source, deployment, and synthetic browser checks, **not** a verified signed-in iPhone Safari acceptance test. Actual member sessions, backend race completion, full phone landscape/portrait acceptance, other connected accounts, and exhaustive in-game saves require live tests before any claim of 100% completion.

## Follow-on engineering targets
1. Verify genuine member-authenticated iPhone Safari garage to diner to race flows, and all game transitions.
2. Tighten Street r0d one-screen game content density and period-specific vehicle artistry without stretching the 320x200 pixels.
3. Expand interactive engine assembly and tuning realism, while preserving server-authoritative readiness checks and safe state recovery.
4. Validate saved Mahjong/word/plate progress after switching between games and under interrupted network conditions.
