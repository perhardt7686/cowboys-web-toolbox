# Street r0d: Original-Gameplay Implementation Blueprint
**Baseline: Street Rod (DOS / Commodore 64, 1989), set in summer 1963**  
**Project:** Cowboy's Web Toolbox · Street r0d Racing  
**Prepared:** November 13, 2026  
**Status:** Engineering reference + first garage-flow repair committed; remaining requirements are not claims of completion.

## Design principle

Rebuild the 1989 game's *interactive contract*: the garage is the menu; the paper is the marketplace; engine work requires real disassembly; the diner is the rival selector; two race modes have distinct steering, transmission, traffic and consequence models; time and money govern the campaign. Use **original** car designs, original mechanic diagrams and original game text and UI decoration rather than reproducing historic proprietary screens/assets. Add modern accessible controls and authenticated asynchronous competition without breaking the single-player campaign.

### Original source references
- Official original manual: https://www.streetrodonline.com/wp-content/uploads/2012/09/street_rod_manual.pdf
- Original DOS release details and versions: https://www.mobygames.com/game/434/street-rod/
- Original manual table of contents: Garage, pop hood, tune, transmission, tires, new paint, gas, drive-in, driving, winning.
- Source screenshots are **visual reference only**; never ship the screenshots or original code as app resources.

## System architecture and non-negotiable invariants

1. **Authoritative persistence:** Supabase functions validate ownership, purchases, car integrity, race credits, wagers, XP/awards and results. Browser code may render and submit user intent; it may not award a car, winnings, credits, championships or achievements on its own.
2. **Old saves survive:** Existing catalog keys, 49 purchasable adult cars, Cipher Van X boss, 10 junior concepts, garage ownership/upgrades, individual high scores, avatar permissions and asynchronous challenges remain compatible. Migrate by adding fields, not replacing records.
3. **One active repair per owned car:** Per-car assembly state tracks engine, carburetor, manifold, wiring, bolts, transmission, wheels and service plan. Prevent races with loose bolts, detached parts or incomplete work.
4. **Game economy only:** Fictional earned credits and virtual pink-slip ownership only, never actual-money stakes.
5. **Member privacy:** Public-facing racetrack/drive-in shows only approved members' published avatar and publicly shared car/build data; never personal appointments, unpublished photos, secret user IDs in text, or member financial information.
6. **Failure recovery:** All mutations are idempotent or revision-checked. A refresh during a repair, purchase or race recovers the correct saved state without duplicate deductions.
7. **Mode separation:** Classic Campaign (summer 1963) has a consistent start/end, wear and virtual wagers; Multiplayer/Racer Club uses shared member cars, asynchronous duels and ranked records; Junior mode is non-wagering and cannot lose real progress.

---

## 1. Main Garage: environmental interface

### Reference behavior
The garage is the actual control surface, not merely a lobby over separate menus. A wrench cursor highlights actionable room objects; a concise action prompt changes based on the selected object. Cars remain visible and can be swapped; the calendar imposes a seasonal deadline.

### Render and hit targets
| Room object | User action | Required result |
|---|---|---|
| Car hood | Pop hood / close hood | Hood lifts visibly and engine bay + real part controls appear at the car, no scrolling to an unrelated screen |
| Carburetor / intake / engine | Inspect or select part | Individual visual part + its fasteners + physical installation state, with focused detail |
| Wall strip with car name | Cars | Owned-car picker; switch out selected car; no car switch while disassembled |
| Desk clipboard | Car Info | Installed parts, condition, wear, fuel, HP, weight, handling, speed, tuning and current safety status |
| Wall parts clipboard | Spare Parts | Inventory of unused components with compatible makes, condition, resale value and currently installed state |
| Newspaper on floor | Newspaper | Opening spread: Used Cars and Auto Parts; real front/left/right page turns |
| Wall radio | Tune / silence | Original licensed/permitted audio only; never embed copyrighted music |
| Clock | Save / pause / exit | Clear session/sync status and safe return to message board; protected current work |
| Date calendar | Summer calendar | July–Sept 1963 simulation with remaining days and time cost of every action |
| Exterior door | Hit the street | Only if all parts fitted, bolts torqued, adequate fuel and the campaign is not over |
| Jack under wheel | Tires | Lift points, wheel removal and lug tightening flow |
| Underbody / gearbox | Transmission | Support, disconnect linkage, loosen mounting points, replace and reattach |
| Front/rear bumper | Bumpers | Supported cars permit removing/restoring; affects weight and crash risk |
| Roof | Chop / restore | Compatible bodies only; takes more time, changes mass/drag/appearance |
| Spray can | Paint | Preview colors on the actual vehicle; commit cosmetic change and time/credits; stickers reset where applicable |
| Sticker sheet | Decals | Preview/fit or remove compatible original designs |
| Fuel can / pump | Fuel station | Roadside travel, pump nozzle interaction, refill quantity/price |

### Interaction details
- Desktop: accessible pointer/wrench hotspot with focused label and contextual bottom-of-scene command strip; Enter/Space activate.
- Touch: visible, minimum 44px hotspots and explicit command buttons. Do not require hover or tiny pixels.
- Always show the selected **car body itself**, including its shape and orientation, not just a reused stock coupe.
- On POP HOOD the visual car's hood physically lifts or switches to a companion open-hood render, exposing the mechanical bay.
- The engine diagram and part buttons must be in the same spatial game scene; keep the current server-backed workbench and move/reveal it beneath the garage car rather than delegating to an unrelated section.
- A service action has immediately visible feedback, saved revision and a mechanically plausible reason if blocked. Example: 'Remove both carb bolts before lifting carburetor.'
- Show pending, saving, saved and failed states distinctly. On failed network save, reload state, never fabricate a successful repair.

### Acceptance
Given an owned car selected on an approved account, **Garage → Pop Hood** must show an expanded engine bay with bolts and engine/manifold/carburetor controls on iPhone Safari **without hunting for a hidden section**. Loosen a bolt once, refresh, and the exact bolt state must persist. Close while disassembled: next open recovers the unfinished work. Trying to race gives a precise repair warning.

**Current implementation:** The server-backed \`commons-streetrod-mechanics.mjs\` already supports part inventory, individual bolts, wires, linkages and revision checks. The Classic scene routing was changed in the 2026-11-13 rollout to display that bench directly below the car scene; authenticated Safari verification remains pending.

---

## 2. Physical hood, parts and tuning system

### Original assembly dependency graph
\`\`\`
Carburetor (2 bolts)
   ↓ must be removed to access
Intake manifold (4 bolts)
   ↓ must be removed to access
Engine block (4 bolts + wiring)
\`\`\`
Reverse this order for reassembly, including wiring. Transmission has its own four mounts and linkage. Wheels need four lugs and a jack. Retaining bolts in the parts tray rather than hiding them behind a generic 'Upgrade' button is essential.

### Persisted part schema
- Each installed part: \`component_key, mounted, bolts[], wiring/link_state, compatible_family, quality, wear_pct, purchased_price, installed_by, updated_at\`.
- Wrench action: each click increments tightening state or removes one turn; backend verifies valid limits and correct dependency prerequisites.
- Removing a part places it in real, per-car inventory/tray; installing requires owned compatible item. No destructive replacement without a valid transaction and replay protection.
- Upgrade commit: reserve/charge credits **only at successful assembled completion**; a cancellation preserves credits and original component if stock item can be restored.
- Abort/reset: explicit confirmation; cannot mint spare parts through repeated detach/reattach.
- No race while \`drive_ready=false\`.

### Tuning
- Engine timing slider with advanced/retarded and a visual physical adjustment point.
- Drag tuning rewards low-gear acceleration; road tuning rewards top-gear response.
- Backend engine simulation must incorporate the tuned state; UI alone is insufficient.
- Tachometer redline and overrev hazards must use the same tuned physics as race results.
- Reset and compare baseline tune; tuning choices stay associated with the selected car.

### Visual requirements
- Hood panel folds back; engine bay moves to the forefront.
- Separate engine block, carb, manifold, wires, bolts, linkages, belts with unique masks and accessible hotspot maps.
- Zoom in/out and pan without accidental clicks or page scrolling; labels and torque guide on mobile.
- Realistic part textures, chrome, cast iron, hoses, fastener heads, shadowing and highlights.
- If only six original body photos exist, do **not** promise unique modeling for 60 cars. Produce model-specific body design assets in a tracked asset-production queue.

### Tests
- Carb cannot be lifted while bolts remain.
- Manifold cannot come off with carb mounted.
- Engine cannot be removed without wiring disconnected.
- Tightening wrong part order is blocked.
- Network interruptions do not create part duplication or double deductions.
- Races refuse unassembled car even if UI manipulates a button.
- Two tabs editing the same work order force a revision reload.

---

## 3. Newspaper classifieds and vehicle market

### Navigation
Front page → Used Cars OR Auto Parts. One spread shows period-styled newspaper columns, priced listings and identifiable images. Right and left sides advance or reverse. Dedicated button returns to the garage. On purchase, return to garage automatically and show the purchased car.

### Used-car inspect
- Model, body photo/turntable, performance, mileage/condition/wear, year, stock engine, transmission, price and bank balance.
- Inspect without purchase; explicit Buy option, and always clear 'cannot afford' state.
- Purchased cars are saved with their own wear, tuning and inventory.
- Support a bounded fictional negotiation based on seller reserve, deterministic RNG/seed, time passing and wallet affordability. The server validates the final offer.
- **Car selling** must settle atomically: transfer ownership to the market, add proceeds, clear selected vehicle only after assigning another safe car or making garage empty.

### Auto Parts
- Newspaper parts section includes new/used engine, carb, manifold, gearbox, tires and other compatible components.
- Each has an illustration, wear/condition, supported engine/body family and price.
- Purchase places physical stock in inventory; only installation in the garage affects race performance.
- Suppress incompatible choices with an explanation, never silent purchase failure.

### Acceptance
A player can buy a used car and return to garage with that exact car selected, inspect parts before buying, haggle at least one counteroffer, and see all credits/saves survive reload.

**Current:** Existing catalog is server-priced and purchasable; newspaper-style listing paging exists. Parts are currently offered mostly as upgrades rather than fully inventory-backed new/used items. Full haggling and vehicle resale need new server functions.

---

## 4. Diner / Drive-In

### Core presentation
A physical night drive-in scene with a visible parking row of other racers' original cars and published driver portraits. Cars cruise past or arrive while the player waits; selecting a car opens that rival's verified public build. A call roster can summon a known rival. Arrows scroll one racer or one page.

### Challenge sequence (server-issued)
1. Choose an available rival (AI campaign rival or approved real member).
2. Inspect their car, power, condition, handling and published upgrades.
3. Select **quarter-mile drag** or **2.5-mile winding road**.
4. Choose practice, virtual cash stake or (campaign/eligible opt-in only) virtual car-title stake.
5. Rival acceptance, decline or counteroffer based on documented deterministic rules.
6. Stage course only after both valid cars are ready and wager/ownership reserves are locked.
7. Race, return to diner/garage, settle outcome atomically and show leaderboards/achievements.

### Multiplayer
- Approved member avatars and selected car builds visible to other approved racers as authorized by existing Commons profiles.
- Asynchronous time-trial challenge is an honest mode label. Do **not** call two separate timed attempts 'simultaneous real-time racing'.
- If true real-time rooms are later implemented, use a server-authoritative clock, reconciliation and reconnection.
- Display challenge open/accepted/complete/expired; winner, lap/finish, car ownership and achievements.
- Optional safe social gestures/emotes; no unmoderated chat or exposure of private member profile fields.

### Acceptance
Two test accounts can challenge, accept, complete, settle once and inspect each other's car/avatar/award after refresh. The completed result and wallet match in both accounts. Double submission never doubles rewards.

**Current:** Approved racer list, public build details and targeted asynchronous challenge functions exist; original scrolling drive-in scene is present. AI rival bargaining, pink slips and true real-time races remain unimplemented.

---

## 5. Driving: two separate modes with cockpit consequences

### Drag race (~0.25 mi)
- First-person dashboard and opponent car in scene.
- Countdown green/red, legal false-start detection and cancelled race.
- Throttle and brake, RPM and torque curve, launch traction, gear shifting, clutch or automatic, rev limit, speed, distance, opponent overtake.
- Engine overrev and unsafe power shifts accumulate risk; broken engine/gearbox means forfeit or service.
- Clock, finishing position, top speed, reactions, scoreboard, rewards handled by server.

### Road race (~2.5 mi)
- Distinct winding roadway with visible steering effect and camera displacement, not the drag race with a different banner.
- Steering, corner speed, brakes, downshift, off-road drag, tire grip, damage; opponent and rearview mirror logic.
- Police pursuit and citations modeled as original **fictional** game economy and campaign time consequences.
- Finish can mean win, loss, crash, arrested/abandoned, engine failure.
- Road race must have its own server-scored results before offering it as ranked/for virtual stakes.

### Visual standards
- Dedicated cockpit per body family, dashboards/steering wheel visually aligned to perspective and gear.
- Opponent vehicle grows and moves according to distance, with headlights, wheel motion and lane position.
- High-resolution daylight or evening road textures, appropriate fog and depth, animated suspension, realistic speed parallax.
- A complete vehicle illustration is not a flat quadrilateral; if per-model geometry unavailable, be clear it is a concept asset.

### Controls
- Mouse/keyboard (Up/Down/Left/Right, shift, gear) and iPhone touch equivalents with held input, pointer release on blur and responsive hit targets.
- Feature-detect device performance and lower visual detail without changing physics.
- Respect reduced-motion where possible without removing required game information.
- Pause is solo/practice only; real member racing pause/quit cannot alter the authoritative race clock.

**Current:** Quarter-mile ranked engine and first-person cockpit exist. A playable 2.5-mile road **practice** mode has steering, gas, brake, gears, off-road damage and failure conditions; it does not award ranked winnings. A new road-race backend is necessary before challenge stakes.

---

## 6. 12-week summer campaign and final rival

- Summer starts in 1963 with finite days and fictional bank roll. Work hours, purchase travel, installations, tune, practice and races consume campaign time.
- The original gameplay treats the September 15 school-start deadline as victory limit. Use that season in Classic Campaign and an endless sandbox mode for persistent Commons multiplayer.
- Progress: starter car, early easy rivals, mid-tier parts and reputation, title wagers, elite rivals, Cipher Van X championship.
- Champion entry requires wins, race-safe car and race-tier fitness.
- Outcomes unlock badges, record boards and cosmetic awards; replay from a new campaign without deleting persistent multiplayer collection.
- Visual calendar, workshop clock and newspaper issue reflect the current campaign day.
- Saved campaign facts must be a separate database table to prevent summer restart from resetting actual saved garage ownership and points.

### Acceptance
A complete player run can finish in victory, seasonal deadline failure or voluntarily restarted Classic Campaign; a restart never removes multiplayer achievements/earned garage assets unless expressly selected and confirmed.

---

## 7. Test plan, blockers and release gates

| Gate | Test | Pass condition |
|---|---|---|
| A. Garage repair | Garage → hood → carb bolts → part removal → refit | In-scene functional diagram, correct dependency rules, persisted state after refresh |
| B. Garage safety | Attempt race while engine missing | Server rejects, no credits/score assigned |
| C. Newspaper | Inspect, haggle, buy and return | Correct car in garage, one debit, one ownership record |
| D. Diner | Inspect rival, negotiate, challenge | Both players see exactly one outcome, correct rewards |
| E. Road scoring | 2.5-mile course + police + crash | Correct authoritative finish/repair/wear; not just local simulation |
| F. Campaign | Finish or fail by September 15 | Deterministic date/credits, championship badge |
| G. Privacy | Anonymous, unapproved and approved sessions | No garage/member info exposed to unauthorized session |
| H. Mobile | iPhone Safari 320–430px, touch, portrait/landscape | No clipped controls, no runaway page scroll, bolts touchable |
| I. Regression | Existing records, junior mode, Racer Club | No loss of points, cars, ranks or saved characters |
| J. Fault tolerance | Offline mid-service, duplicate taps, replays | One settlement maximum, retry/reload truth matches server |

### Priority delivery sequence
**P0 completed in source:** Move the functioning saved workbench under the Classic garage car so POP HOOD reveals real bolts and parts instead of navigating to a separate section; improve feedback and keep the original mechanical RPC. Requires real-device acceptance.

**P1 next:** Finish truly animated hood-opening vehicle geometry and part-specific layered original artwork; add entire garage object-map/hotspots and Car Info/part inventory.

**P2:** New/used spare part catalog, part compatibility, resale and dealer haggling with authoritative single-settlement logic.

**P3:** Drive-In negotiation and rival types; road race server-authoritative simulation, damage/police and winnings.

**P4:** Summer 1963 calendar, fuel/gas station, wear/time costs, deadline, championship and game restart isolation.

**P5:** Bespoke vehicle art per model, proper body-specific garage/cockpit geometry, performance and full iPhone test matrix.

### Release notes convention
For each release, log: files changed, schema migrations, verified test receipts, remaining gaps, rollback commit and live-browser acceptance status. Never call untested gameplay 'verified' based only on source-code syntax.

