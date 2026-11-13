# Street r0d DOS/EGA Edition: release and verification record
**Date:** November 13, 2026
**Project:** Cowboy's Commons / Street r0d Racing
**Release classification:** Committed to the repository default branch; browser publication and signed-in iPhone Safari acceptance still unverified independently.

## Historical visual specification

The reference game is **Street Rod (DOS, 1989)**, set in summer 1963. Source screenshots and manual document a 320x200 raster, EGA/Tandy-compatible 16-color graphics, dark garage, printed-paper classifieds, night drive-in and dashboard view, grayscale engine diagram, and cursor-driven physical bolts.

Visual references (research only; no original assets copied):
- https://www.mobygames.com/game/434/street-rod/screenshots/dos/518406/
- https://www.mobygames.com/game/434/street-rod/screenshots/dos/518407/
- https://www.mobygames.com/game/434/street-rod/screenshots/dos/518403/
- https://www.streetrodonline.com/wp-content/uploads/2012/09/street_rod_manual.pdf

The published game does **not** include or distribute original artwork, ROMs, game binaries, music, protected dialogue, or original source. The palette and original-style layout are implemented independently.

## Implemented graphic changes

- **DOS boot:** on opening Street r0d, a simulated BIOS 286/640 KB memory check, EGA video-adapter test, DOS prompt and garage load appear. Enter or a visible Skip Boot button completes startup. The first launch takes the player to Summer Championship.
- **Immersive monitor:** Street r0d occupies the viewport after boot, with a persistent Exit DOS Display button and Escape-key support. This uses CSS on iPhone Safari rather than unsupported programmatic fullscreen.
- **Low-resolution scenes:** a standalone `commons-streetrod-ega.mjs` draws original 320 × 200 pixel artwork in the 16 canonical EGA colors for the garage, drive-in, newspaper, parts/engine, and gas station. Cars have stepped-window silhouettes, chrome/whitewall wheels and discrete body-color shading. Drawings scale with nearest-neighbor pixels, without smooth gradients.
- **Cockpit:** the shared first-person dashboard is downsampled to 320 × 200, then quantized through a fixed 16-color palette lookup; its visual update rate is reduced to roughly 10 frames/sec while the authoritative race logic and timing are unchanged.
- **Junior:** its car selection and road scene have the DOS pixels too, with low-resolution frame caching that does not change stars, badges, or scores.
- **Design shell:** era-appropriate monochrome/primary EGA window frames, square clickable controls, pixel-styled cars in the garage and car catalog. The pixel skin is scoped to `#streetrod-root`, not the message board or Family Calendar.
- **Performance:** scene mutation decoration is throttled to roughly 8 times per second.

## New mechanical details, server enforced

The saved summer-garage workbench has individual fasteners with two wrench turns per bolt. Additional checks now cover:
1. **Safety jack:** a wheel must be raised before its bolts can be loosened, the wheel removed, or a replacement installed. The jack cannot be lowered until every lug is torqued, and the car cannot race with the jack raised.
2. **Cross torque:** the four engine, gearbox and wheel mounting bolts must be tightened **1 → 3 → 2 → 4** at snug torque (stage 1) before repeating in the same pattern at final torque (stage 2). The server rejects an out-of-order torque pass.
3. **Disassembly dependencies:** remove carburetor before manifold; manifold before engine bolts. Disconnect gearbox linkage before releasing transmission bolts.
4. **Three engine services:** battery ground, coolant hose, and fuel line can be disconnected/reconnected individually. Battery ground must be removed before ignition leads can be serviced. Engine removal requires all those services plus ignition wiring to be disconnected.
5. **Roadworthy gate:** public helper `community_streetrod_season_parts_ready` combines the existing parts-ready check with jack-down, battery, fuel line and coolant connections. It is checked by the season workbench, upgrade certification and server-side race start.
6. **UI:** battery, coolant, fuel, jack and cross-pattern torque controls added to the physical engine workbench. The backend stores the relevant part state per seasonal car, not in the existing multiplayer garage.

## Verified technical tests

- GitHub commit receipts obtained for the new EGA JS/CSS, reworked cockpit, updated Summer/Classic/Junior modules and mechanical workbench.
- Source checks: eight relevant JS modules parsed, with expected local imports resolved; EGA and workbench CSS rules balanced. `community.html` referenced all current release assets.
- EGA scene simulation: five distinct 320 × 200 canvases initialized and drew without JavaScript exceptions.
- DOS-boot simulation: opening the racing game displayed the dialog, Skip Boot dismissed it, Street r0d and Summer Championship both opened once, fullscreen mode engaged and exited via its control.
- Transaction-rolled-back physical mechanic checks:
  - Wheel unbolting without jack is rejected, complete jack → loosen → remove → refit → two cross-pattern torque passes → lower jack yields roadworthy state.
  - Engine can be unbolted after carb/manifold removal, battery, ignition, coolant and fuel disconnection; after reverse-order reassembly the engine returns to roadworthy with all contacts and four bolts secured.
  - Race start while coolant line is disconnected fails with an explicit mechanical error.
  - A nonmember cannot access the private seasonal mechanical RPC.
- Access check: seasonal tables have RLS, anonymous access to privileged workbench actions is revoked.
- Multiplayer garage, original race tables, member profiles, junior scores and Family Calendar were not modified or reset by this rollout.

## Outstanding / not called 100%

- **Pixel-by-pixel recreation of the copyrighted original** is intentionally not provided. Original pixel artwork was independently drawn and remains a reinterpretation of the EGA presentation.
- The game's 60 modern and classic vehicle catalog entries do not each have a unique period-authentic pixel-accurate body model; some share silhouette archetypes.
- Signed-in live iPhone Safari interaction and exact published GitHub Pages rendering are **not independently verified**. The external page couldn't be read using the available verification channels.
- The new classic campaign is not a bit-exact copy of the original DOS game mechanics or physics; some features such as all original police sequences and original soundtrack are absent.
- Release acceptance on real devices should include: DOS boot, Skip, game-open, fullscreen exit, garage bolt steps, roadworthy guard, diner challenge, solo and junior races, switching between games, and member-only access.

**Source of truth:** GitHub repo `perhardt7686/cowboys-web-toolbox`, `docs/community.html`. Preserve working backup commits and review actual member sessions before calling the release 100% certified.
