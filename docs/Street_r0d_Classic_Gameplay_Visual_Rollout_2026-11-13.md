# Street r0d · Classic gameplay visual rollout
**Date:** 2026-11-13, America/New_York
**Branch:** main · GitHub Pages source in `docs/`

## Visual research
Studied authentic Street Rod (DOS, **1989**, game set summer **1963**) gameplay screenshots and manual covering the original garage, engine/parts popup, newspaper used-car classifieds, Bob's Drive-In and first-person dashboard/races. Reference archives:
- https://www.mobygames.com/game/434/street-rod/screenshots/
- https://bestdosgames.com/games/street-rod
- https://www.drivingline.com/articles/back-to-89-before-there-was-forza-gran-turismo-there-was-street-rod/
- https://www.freegameempire.com/games/Street-Rod/manual

Art direction: adapt the layout and interaction metaphors without reusing vintage pixel assets, copyrighted screenshots, company logos or original game code. All displayed cars are generated original concept artwork (six foundational body types).

## Implemented and committed
1. `streetrod-photo-sprites.mjs` ~157KB includes six transparent original high-detail vehicle images (coupe, hardtop, muscle/fastback, wagon, pickup, van). Shared via one cached ES module. Browser image URLs are local `blob:` resources, permitted by the existing CSP.
2. `commons-streetrod.mjs`: uses photo sprites for racing side view and all garage car cards; defaults to a new first-person cockpit while retaining a side-view toggle. Server race timings, win logic, balances and multiplayer records untouched.
3. `streetrod-classic-cockpit.mjs`: original analog dashboard, steering wheel, night-road perspective, lane markers, horizon and period-styled racing scene. The original's composition was researched, but no copyrighted artwork copied.
4. `commons-streetrod-garage-v3.mjs`: high-detail car sprite inside mechanical workshop. Existing interactive lift, hood, engine, wheel, transmission, and tuning flow preserved.
5. `commons-streetrod-collection.mjs`: photorealistic body templates for all 60 cards and vehicle details, including Cipher Van X. Six shared archetypes with modest visual tint variation; **not yet 60 unique licensed or photo-accurate vehicle models**.
6. `commons-streetrod-junior.mjs`: richer car sprites for junior race scene and car-choice cards. No change to scores, child-facing safety rules, or purchases.
7. `commons-streetrod-classic.mjs` and `.css`: new responsive scene navigator styled after original gameplay's garage wall, illustrated vehicle, printed classifieds, auto-parts cabinet, neon drive-in diner and cockpit. Cars and garage prices are read from the existing server-backed UI; classifieds paginate seven listings per page, inspect launches the existing Motor Vault; parts link to existing service bay; drive-in buttons launch solo/multiplayer/boss sessions.
8. `community.html`: script/style additions and cache revisions to load the Classic Edition assets.

## Quality control evidence
- Source syntax parsed successfully for 7/7 updated JavaScript modules.
- All local module imports resolved; new images and CSS linked in `community.html`.
- CSS blocks balanced.
- Local Chromium UI smoke test at 1100px and 390px: classic hub mounted, hero photo decoded, garage/classifieds/diner/road scenes navigated with no JavaScript runtime errors. Desktop test showed no horizontal overflow. 390px test used a minimal harness without the original page's responsive race-canvas CSS, so cannot establish full-page mobile overflow status.
- GitHub commit receipts obtained for all asset updates.
- Original game page is not independently reachable through the website-checking tool and full authenticated iPhone gameplay is **not yet verified**.

## Boundaries and remaining development
- The original 1989 gameplay is not copied 1:1. The current engine still has server-authoritative quarter-mile racing, fictional credits, no real-money wagering, and asynchronous member duels.
- Not implemented: turn-key 3D models for every vehicle; true hardware-like bolt-by-bolt mechanics, original haggling, police patrols, fuel-system wear, pink slip ownership transfers, or first-person physics steering. These need separate backend/game design and safety checks.
- Side-view car templates are photorealistic original art, but reused across model families. Full per-model uniqueness and correct era-by-era body geometry remain a further artwork-production milestone.
- Existing profiles, credits, saved cars, upgrades, junior stars and multiplayer achievements were not reset or migrated.

## Acceptance test on real members' devices
Expand Street r0d Racing on iPhone Safari; use the five scene tabs; inspect/buy via newspaper into Motor Vault; drive into workshop and operate hood; switch cockpit/side-view; complete one race and inspect profile scores; challenge another member; check animation, responsive layout and cache. Full completion should only be declared after these pass.
