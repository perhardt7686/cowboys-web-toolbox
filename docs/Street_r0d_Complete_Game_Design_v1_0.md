# STREET r0d RACING
## Garage World Reimagining | Complete Game Design Document

**Version:** 1.0 | **Date:** November 13, 2026 | **Owner:** Cowboy | **Prepared by:** Edward  
**Status:** APPROVED CREATIVE DIRECTION / IMPLEMENTATION BLUEPRINT; not a claim that the new gameplay is deployed  
**Working product title:** Street r0d Racing (existing code name). **Release naming decision:** choose a materially different original title after trademark clearance. “Blacktop & Bolts” is a proposal, not an adopted name.  
**Build target:** Cowboy's Web Toolbox, The Commons | Existing five-car Supabase-backed game  
**Genre:** Garage-life, mechanical restoration, driving and racing career  
**Core promise:** *Drive it in. Wrench on it. Feel the difference on the road.*

---

# 0. Executive decision record

This document **reimagines the experience and game mechanics** of the 1989 *Street Rod*, especially its garage-first structure, used-car classifieds, hands-on repairs, tuning, town hangout, rivals, vehicle condition, drag racing and road racing. It **does not reproduce protected code, screen compositions, art, dialogue, sound, logos, or characters**. The original used a garage as its navigation hub; this game advances that idea with an actual drive-in garage, interactive service operations, original realistic vehicles and a career that works on iPhone.

**Locked decisions**

1. **A place, not a menu.** The garage is an explorable and visually coherent 3D environment. Every owned car can drive through its door, park in the service bay and leave under its own power if mechanically sound.
2. **Five original cars remain.** Preserve server keys `rattler`, `comet`, `nomad`, `meteor`, `phantom`, plus purchases, credits, upgrades, badges, leaderboards and races. Remodel each as a distinct, mechanically plausible fictional vehicle.
3. **Mechanical consequences are real within the simulation.** Parts occupy slots, have fitment, condition, removal steps, install dependencies and effects on torque, power, gearing, grip, reliability, weight and appearance.
4. **Two driving disciplines.** Quarter-mile drag racing launches first; a fully steerable closed-course road-race mode becomes mandatory for the full classic-style career, not an optional someday feature.
5. **Accessible realism.** Mobile players can perform meaningful hands-on service tasks using touch targets and optional assists. No tiny screw hunting on a phone.
6. **Protect existing progress.** Schema changes are additive. Old results remain labeled `arcade-v1`; engineered results use `engineered-v2`; future career events have their own version and mode.
7. **No real-money gambling or pay-to-win.** All stakes, credits, wagers, part sales and pink slips are fictional in-game assets. No financial conversion, withdrawal or purchases.
8. **Release originality.** Original title/branding, locations, cars, characters, artwork, music, words and source. Any look-alike review is a launch gate, not a later enhancement.

**Verified baseline vs. planned features**

| System | Current, verified foundation | This GDD adds (not yet verified live) |
|---|---|---|
| Cars | Five fictional keys, purchased/selected, upgrade levels 0–5 | Unique high-detail 3D bodies, interiors, engine bays and visible modifications |
| Backend | Supabase garage, solo/async duels, credits, badges and history | Inventory, per-part condition, service jobs, career, inspections and new physics modes |
| Physics | Engineering V2 longitudinal quarter-mile simulator | RPM-driven shifts, tuning causality, reliability, road-race lateral dynamics |
| Scenes | Existing racing arcade and simple illustrated vehicles | Drive-in garage, mechanic camera, dealership, salvage, diner, fuel station, track |
| Frontend status | Existing Commons mini-game is live; previous uploaded ZIP was not itself an installed interface | New application shell, original art assets and migrated UI |

# 1. Historical mechanical reference and originality matrix

The source game is useful as a **mechanics reference**, never as an asset library. Its garage, classified listings, physical fastener/part installation, fueling, tuning, diner challenges, drag and road races, wear, bargaining, stakes and champion objective are documented in the original manual/reference card and historical game catalogues. Our reinterpretations are below.

| Historical mechanic | Original functional idea | Original implementation in this project |
|---|---|---|
| Garage hub | Work on the car, inspect it, plan the next race | Fully rendered workshop and physically driven bay-entry transition |
| Classifieds | Buy used vehicles and parts, sometimes negotiate | Rotating illustrated “County Market” listings with condition reports and offers |
| Hands-on service | Disconnect and refasten components in correct order | Tactile 3-step to 7-step service jobs with independent animations, parts fitment and validation |
| Engine timing | Tune engine before racing | Timing, fuel mix and ignition safely modeled as fictional performance parameters with reliability tradeoffs |
| Tires and transmission | Install components with tools | Hub lifts, wheel removal, transmission jack and service-bay interaction |
| Diner challenge | Meet NPC rivals, inspect and challenge | “Copper Lantern” late-night gathering with independent characters, procedurally presented rivals |
| Drag and road racing | Straight sprint and steerable race | Closed-course quarter-mile and timed backroad circuit with distinct control models |
| Stakes | Win fictional cash or cars | In-game credits or optional title-match car stakes, with anti-softlock protections |
| Progression | Earn respect to challenge final driver | Two discipline-specific reputation ladders and an original local champion |

**IP rules:** no reusing the historical game's copyrighted text, illustrated newspaper layout, UI positions, garage composition, art, car sprites, audio, rival names, nicknames or climactic scene. The current title is also uncomfortably close to the earlier title, so use it only as an internal compatibility label pending release-name review. Do not copy or port its original source or ROM. See §24 for the release checklist.

# 2. Creative direction and player fantasy

**Player fantasy:** You own an imperfect late-1950s / early-1960s-style workshop, start with a humble coupe, and become the region's best mechanical builder and driver through skill, judgment and risk. A great build should feel earned: buying a cam that makes the idle rougher, forgetting to tighten an air cleaner and failing inspection, or switching to a shorter final drive and feeling stronger launch but less top-end. A fast car with poor tires is not automatically a winning car.

**World:** A fictional rural American county, **Copper Vale**, in an original alternate 1960s-inspired setting. It borrows authentic material culture (steel tools, painted cinderblock, chrome, radio dials, period clothing) without recreating a specific licensed location. Year and setting are fictionalized to permit mechanically plausible modifications, including modernized end-game pro-street builds.

**Four design pillars**

- **Automotive truth:** plausible physics, strong cause and effect, mechanical constraints; publicly label engineering assumptions rather than calling fictional car stats factory data.
- **Physical garage:** entrance, tools, workpieces, engine bay, wheels, inspection, repair and drive-out transitions are central to every session.
- **Meaningful risk:** loss of traction, engine heat, poor setup, part wear and cash pressure matter; no surprise irreversible destruction of the only starter vehicle.
- **Personal rivalry:** NPCs have habits, confidence, cars, strengths, weaknesses and evolving reactions. Friend duels exist alongside solo career.

**Non-goals for first release:** open-world traffic simulation, unrestricted highway driving, photoreal VR, hundreds of cars, real manufacturer trademarks, licensed music, real-world illegal race instructions, live synchronous multiplayer and unrestricted public user-created asset uploads.

# 3. Audience, sessions, controls and platforms

- **Primary:** iPhone Safari inside Commons, portrait access for garage and setup; landscape prompt for steerable road races; no app installation.
- **Secondary:** desktop Chrome, Edge, Safari and Firefox with keyboard, mouse, gamepad where supported.
- **Typical session:** 6–15 minutes, 1 service operation plus 1–2 races, or 1 market visit and garage session.
- **Accessibility:** captions, reduced motion, color-blind-safe cues, readable 16px body text, 44px minimum touch targets, adjustable service-tap tolerance, input remapping, keyboard alternatives and no essential audio-only signals.
- **Assists:** “Mechanic Assist” guides tool positions and optional step completion at modest fictional labor cost; “Driving Assist” offers automatic clutch/shift but does not rank against unassisted manual runs in pure-skill leaderboards.
- **Save behavior:** auto-save after every committed purchase, sale, part install, tune, service and finished race. A canceled action never consumes inventory or credits.

# 4. Complete minute-to-minute player loop

**Core loop:** Inspect → buy/repair → install → tune → drive out → meet rival → race → earn/lose → return → diagnose → improve.

**Opening 12-minute playable sequence**

| Minute | Player action | Game response / learning |
|---|---|---|
| 0:00–0:45 | Create driver nickname, see workshop door | Short original cinematic; garage identified as home |
| 0:45–2:00 | Inspect owned Rattler 48 from inside garage | Paper inspection report shows engine, tires, gearbox, fuel |
| 2:00–3:30 | Open hood and remove worn air filter | 3 highlighted fasteners, remove and inspect reusable part |
| 3:30–4:30 | Install new compatible air filter | Snap into valid slot, fasten and hear engine idle change |
| 4:30–5:30 | Adjust launch setting and tire pressure | Projected launch and grip preview; changes saved |
| 5:30–6:30 | Lower hood, start motor, drive out | Drive-out animation and garage-to-county transition |
| 6:30–7:30 | Visit Copper Lantern, review rivals | First approachable challenge and wager-free practice |
| 7:30–9:00 | Stage and run quarter-mile | Manual launch and shifts, readable slip and one clear coaching note |
| 9:00–10:30 | Return to shop and compare timing slips | 60-ft, ET, trap and cause-effect notes with confidence labels |
| 10:30–12:00 | Try tire or final-drive adjustment | One-tap rematch and visible progression toward a personal best |

A player can exit after minute 4 and return to the same intact car, service state and credit balance.

# 5. World and navigable destinations

All destinations are original. The first five are physically represented; menus never masquerade as places.

| Destination | Signature appearance | Interaction | Unlock |
|---|---|---|---|
| **The Lantern Garage** | Two-bay brick workshop, fluorescent work lights, steel rolling door | Park, service, tune, store cars, diagnose, repaint | Immediately |
| **County Market** | Photographed-style classifieds on a corkboard/kiosk, used vehicle turntable | Browse cars/parts, negotiate, buy and sell | Immediately |
| **Copper Lantern** | Neon diner parking lot, NPC cars arriving, animated patrons | Inspect rivals, accept challenges, career story | First drive-out |
| **Riverbend Quarter-Mile** | Closed track, tree lights, return road and timing booth | Practice, drag events, personal records | Immediately |
| **Ridgeback Circuit** | Closed rural circuit with elevation and corners | 2–4 km road race, steering and braking | 2 career reputation points |
| **Iron Spur Salvage** | Independent parts yard, dirty shelves, rolling inventory | Used parts, core returns, risks, rare discoveries | 1 career win |
| **Vale Fuel & Service** | Period pumps and small maintenance bay | Fuel, consumables and emergency repair | Immediately |

**World map:** stylized 3D county overview with six spatially distinct nodes; selecting a node plays a short driving transition. Map access is always available from garage lot and results screens. No roaming public traffic is needed to fulfill the driving fantasy.

**Garage floor plan (world-space, indicative meters):** 11 m wide × 9 m deep, door center at south, car enters along positive Z into main service bay. Left zone: parts shelf, tool chest and assembly bench. Right zone: tire changer, lift controls and paint booth entrance. Rear wall: dyno notebook, service manual and county board. A 1.1 m clear circulation strip is maintained around a parked car model. Camera must never clip into solid shelves.

# 6. The garage: exactly how it plays

## 6.1 Scene and car entry state machine

`OUTSIDE_LOT → DOOR_OPENING → DRIVE_IN → PARK_ALIGN → IGNITION_OFF → GARAGE_IDLE → INSPECT / WORK / TUNE → CLOSE_UP → START_ENGINE → DRIVE_OUT → WORLD_MAP`

| Transition | Trigger | Expected behavior | Fail / assist path |
|---|---|---|---|
| Door opening | Tap “Enter Garage” while outside | Roller lifts, warm lighting blooms, car engine idles | Reduced-motion 0.4 s crossfade |
| Drive-in | Hold throttle or tap guided “Pull In” | Camera follows actual vehicle along short lane | Guided autopark for touch users |
| Park align | Stop between floor marks | Handbrake engages, ignition shuts down, tool hotspots unlock | Snap-to-mark if position error under threshold |
| Open hood | Tap hood latch | Hinged model hood moves and engine bay becomes accessible | Static engine camera fallback |
| Lift | Select lift point, fit jack and stands | Wheel/underbody hotspots unlock | Safe guided lift with explanatory animation |
| Service | Choose job from valid part slot | Disassembly/install steps and inventory change | No credits spent until commit |
| Start engine | All required connections secured | Startup audio and diagnostic panel | Explain invalid assembly; don't permit driving |
| Drive-out | Exit from garage, engine safe | Door opens; player reverses/drives out | “Auto Exit” if reversing is awkward on mobile |

**Timings:** entry animation 2.5–4.0 s; skip available after first visit. Motor ignition 0.7–1.2 s; hood 0.8–1.1 s; transition to work camera under 0.5 s. Actual duration may be reduced to maintain usability.

## 6.2 Garage camera and scene interaction

- **Bay camera:** 3/4 front view showing car and garage, mouse drag/swipe orbit constrained to the physical bay.
- **Inspect camera:** 360° orbit with focused, labeled hotspots. Pinch-zoom wheel, hood, body, exhaust, cockpit, underside.
- **Wrench camera:** near-orthographic service view focused on one part. Render fastener hotspots at minimum 44px on mobile; part names and torque status appear in a slide-up tray.
- **Test/diagnostics camera:** hood closed or partially open, rev/idle/temperature/engine-health gauges. No interactive repair during an active race.

**Hotspot list:** left/right wheel assemblies, underhood intake, carburetor/fuel, ignition, exhaust, cooling, gearbox, differential, suspension, fuel tank, bodywork/paint, inspection clipboard, tool chest, parts shelf and garage exit. Locked hotspots explain their prerequisite instead of doing nothing.

## 6.3 Exact mechanic-job choreography

Every job is a **transactional service state machine**: `AVAILABLE → SELECTED → SAFETY_PREP → REMOVE_FASTENERS → DETACH → PART_OUT → FIT_REPLACEMENT → FASTEN → VERIFY → COMMIT` (or `CANCEL/ROLLBACK`). A non-running, cooled engine is required for engine service. Player can inspect without starting a paid job.

**Example job A: replace carburetor (6 steps)**

1. Choose compatible unit and preview size, price and expected torque-curve shift.
2. Turn engine off and confirm bay is parked; unlatch and open hood.
3. Disconnect air-cleaner assembly and labeled fuel/throttle linkages (accessible touch operations).
4. Select four fasteners using an original tool animation; remove old carburetor to inventory.
5. Position new unit; secure fasteners and reconnect linkages.
6. Run idle check; if secure, commit part installation, recalculate spec and offer tune adjustment.

**Example job B: replace tires (5 steps)**

1. Verify tire diameter and wheel fitment; lift vehicle on labeled points.
2. Loosen wheel fasteners using an original lug-tool interaction.
3. Remove the wheel; inspect worn tire and select replacement.
4. Refit wheel and complete a short fastener sequence.
5. Lower vehicle, update traction/speedometer/visual tread and commit.

**Example job C: change gearbox (7 steps)**

Prepare vehicle → safely support underbody → disconnect driveshaft → unplug shift linkage → unbolt mounts/bellhousing → remove/install compatible transmission using floor jack → reconnect, test gear selection and commit. Underbody work must never be depicted without safe stands/support.

**Soft-failure behavior:** missing hose, unlatched hood, unsecured wheel or incorrect bolt torque produces a readable **“Not road-ready”** diagnostic, never a silent random crash. The player can fix the same problem without buying the part twice. All damage remains game fiction; no real-world procedural repair advice is implied.

# 7. Car lineup and mechanical identity

These vehicles are **fictional**, with period-inspired forms and explicit modeling assumptions. Dimensions, power and ET estimates below are **game calibration data**, not real-world factory specifications. Maintain stable database keys and upgrade ownership.

| Key | In-world name | Body identity and authentic visual cues | Stock engine / mass | Stock quarter-mile simulation* | Gameplay role |
|---|---|---|---|---|---|
| `rattler` | **Rattler 48** | Compact late-1940s coupe; separate fenders, tall cabin, slim chrome trim, narrow wheels | 175 hp / 1,280 kg | 16.40 s / 85.1 mph | Starter, forgiving maintenance, limited power |
| `comet` | **Comet 55** | Mid-1950s low hardtop; sweeping original side crease, wide grille, airy glass | 225 hp / 1,160 kg | 14.84 s / 97.4 mph | Light and agile, traction-sensitive |
| `nomad` | **Nomad 63** | Early-1960s sleeper wagon; boxy roof, long rear deck, subdued trim | 305 hp / 1,335 kg | 14.40 s / 99.4 mph | Broad torque, practical sleeper build |
| `meteor` | **Meteor 67** | Late-1960s muscle fastback; long hood, strong shoulders, deep rear tires | 425 hp / 1,450 kg | 13.20 s / 110.7 mph | Heavy power, gearing and grip balance |
| `phantom` | **Phantom X** | Purpose-built original pro-street coupe; cowl induction, wide tubs, integrated aero | 575 hp / 1,360 kg | 11.88 s / 126.1 mph | Endgame power, peak tuning challenge |

\*Reference outputs from the current V2 server simulation for stock cars on a common test seed and shift schedule; measured ET excludes reaction time. Tire, gearbox and engine upgrade levels remain 0–5. Model performance changes when parts, tuning, conditions and physics version change.

**Core vehicle identity objects** (all five require distinct models):

- **Rattler:** inline-inspired engine geometry, simple carburetion, rounded fenders, drum-inspired wheel styling; narrow track and gently rolled pitch.
- **Comet:** lighter V8-inspired bay, lower belt line, wide windows, quicker steering, more weight transfer on launch.
- **Nomad:** engine under a long hood, long-wheelbase platform, visible cargo space, high torque, larger rear overhang.
- **Meteor:** performance V8, dual-exhaust paths, strong longitudinal pitch, broad rear axle, heat management required at peak tune.
- **Phantom:** custom high-output engine with power-adder options, distinct roll structure, original pro-street body, extreme rear contact patch and cooling demands.

**Art constraint:** each has a unique front clip, roofline, wheelbase, wheel-arch profile, cabin proportions, hood and rear treatment; recoloring a shared silhouette is unacceptable. Use original fictional badges and trim. Do not trace an identifiable copyrighted game sprite or use real automaker emblems without permission.

# 8. Garage parts catalog and compatibility

## 8.1 Durable inventory architecture

Each instance of a part has `part_instance_id`, `part_type`, `family`, `fitment_tags`, `tier`, `condition_0_100`, `cost_paid`, `listed_value`, `installed_vehicle_id`, `slot_key`, `installed_at`, and cosmetic/functional variants. **Owning** a part is different from **installing** it. A vehicle may have at most one installed part per exclusive slot (unless slot config explicitly allows a pair). Removed parts return to inventory if salvageable.

Fitment uses named fictional families `prewar-6`, `small-v8`, `large-v8`, `competition`, plus vehicle-specific tire/wheel/gearbox constraints. Never offer an incompatible part as directly installable. The market can offer it with a clear compatibility warning.

## 8.2 Launch parts inventory (numbers are design targets, not live prices)

| Part family | Suggested credit price (tier 1) | Primary benefit | Tradeoff / install station |
|---|---:|---|---|
| Clean air filter | 90 | Restore airflow / consistency | Minimal; hood, 3 steps |
| Ignition kit | 180 | Combustion consistency / rev reliability | Timing required; hood |
| Carburetor | 320 | More mid/high-RPM torque | Fuel draw, tuning; hood |
| Intake manifold | 440 | Upper-RPM airflow | Low-RPM loss possible; hood |
| Performance camshaft | 650 | Peak power | Idle quality, heat; hood |
| Cylinder heads | 920 | Airflow/power | Engine-family fitment; lift / hood |
| Exhaust headers | 380 | Reduced exhaust restriction | Noise/heat; hood and underside |
| Cooling kit | 260 | Lower overheat probability | Slight weight; front bay |
| Clutch or converter | 310 | Faster, more consistent engagement | Wear if mishandled; underbody |
| Close-ratio gearbox | 780 | Better RPM retention | Shift timing sensitivity; underbody |
| Final-drive gearset | 490 | Acceleration/top-speed tradeoff | Rear service |
| Differential upgrade | 620 | Better power delivery | Handling changes; rear service |
| Street radial set | 240 | Daily grip and road stability | Less launch grip than slicks; wheel bay |
| Drag slick set | 510 | Straight-line traction | Worse wet-road response; wheel bay |
| Shock/spring kit | 420 | Ride and weight transfer tuning | Handling comfort tradeoff; lift |
| Traction-control bars | 340 | Reduced wheel hop | More mass; underbody |
| Lightweight hood | 400 | Lower mass | Less cooling insulation; body |
| Steel safety upgrade | 580 | Better raceworthiness | Adds mass; chassis |
| Nitrous system | 950 | Temporary power surge | Bottle costs, heat and wear; hood + cabin |
| Paint/livery | 180 | Unique visual identity | Cosmetic only; paint bay |

Full release target is 35–50 distinct *original* part variants spanning these families; **vertical slice uses 8 real installable examples**. Prices and effects are independently balanced with the existing credit economy, not copied from another game. No item is sold for real currency.

## 8.3 Installation rule examples

- A cam and head package changes the *shape* of the torque curve, not just a single generic “power +2” value.
- Taller tires change effective final gearing and speedometer scale; they can fit only when wheel wells and offsets permit.
- A short final drive strengthens launch but can force an extra shift before the quarter-mile finish.
- Nitrous requires an installed kit and available simulated consumable. Activation increases heat and wear; activation timing is a strategic choice.
- Mass-reduction effects appear in the vehicle model and in mass distribution. No free unrealistic power gains.
- Service failure state cannot be bypassed by leaving the garage or restarting the app.

# 9. Tuning interface: the setup sheet

Players can save **three named setups per car** (`Street`, `Strip`, `Circuit`) and one uncommitted scratch setup. The active setup is visible on the garage clipboard and loaded into the sim only when a race starts.

| Parameter | Range / step | Gameplay feedback | Current V2 alignment |
|---|---|---|---|
| Launch RPM | 1,600 to vehicle redline − 500 / 100 rpm | Launch torque vs wheelspin and bog | Persisted today |
| Final drive multiplier | 0.84–1.18 / 0.01 | Wheel torque, speed/gear, shift frequency | Persisted today |
| Cold tire pressure | 20–42 psi / 1 psi | Contact-patch estimate vs heat/wear | Persisted today |
| Shift target RPM | 65% of redline to redline / 100 rpm | Shift light and ideal gear transitions | Target saved; model to use it explicitly |
| Ignition timing bias | −6 to +6 modeled degrees / 1 | Torque/knock-risk tradeoff | New |
| Fuel-mixture bias | −5 to +5 arbitrary calibrated units / 1 | Power/heat/fuel use | New |
| Front/rear rebound | 1–10 / 1 | Weight transfer and corner behavior | New |
| Brake balance | 55–75% front / 1% | Circuit stopping stability | New |
| Nitro activation | Manual within valid race window | Launch traction vs top-end boost | Existing burst; extend |

**UI requirement:** Show immediate predicted metrics as **ESTIMATES**, not promises: engine horsepower range, wheel torque band, launch traction margin, max theoretical gear speed, and overheating probability. After a real game run, show **MEASURED IN SIMULATION** results alongside predictions. Projected outcomes must use the exact same model revision that scores the next run.

**Recommendation engine:** one short engineering note derived from telemetry, e.g., “The first 60 feet were traction-limited; try less launch RPM or another tire” or “Your last shift triggered the limiter before the finish.” Always reference observable telemetry, not invented causes.

# 10. Physics and race engineering

## 10.1 Quarter-mile solver

Use deterministic fixed-step longitudinal integration, initially 40 ms or finer. The existing `engineered-v2` function is the baseline, and new versions are labeled when changing assumptions. At each step:

`wheel_torque = engine_torque(rpm, temperature, wear, tune) × selected_gear × final_drive × drivetrain_efficiency`

`drive_force = min(wheel_torque / tire_radius, tire_grip_coefficient × dynamic_normal_load)`

`net_force = drive_force − aerodynamic_drag − rolling_resistance − grade_force`

`acceleration = net_force / effective_mass; speed += acceleration × dt; distance += speed × dt`

Include launch bog/wheelspin, clutch/shift torque interruption, RPM floor/redline/cut, engine temperature, consumables, drag area, drive-wheel load, aero drag, rolling resistance, optional track conditions, and nitrous. Physics assumptions are published in-game as a vehicle engineering card.

**Times:** 60 ft (18.288 m), 330 ft (100.584 m), 1/8 mile (201.168 m), 1,000 ft (304.800 m), 1/4 mile (402.336 m), trap speed, total shift cuts, reaction time and ET. **ET excludes reaction time**; the duel winner is determined by total run time (reaction + ET) when running from a shared starting-light event. Leaderboards distinguish ET-only and overall result; they do not rank legacy arcade times with V2 physics times.

**Tuning realism:** current time-indexed three-shift input is a transitional mechanic. Upgrade to calculating the actual engine RPM from speed, gearing and clutch, then sample user shift events, apply a shift duration and track whether shift target was met. A shift-RPM setting that does not affect scoring is not an acceptable final design.

## 10.2 Road-race model

A separate, documented 2D vehicle-handling model drives a closed 2–4 km fictional track with curvature, throttle, braking and steering. Minimum systems: bicycle-model yaw response, lateral tire limit, longitudinal-lateral grip circle, braking distance, weight transfer, surface grip, collision/failure state and engine/gearbox condition. Arcade driving aids may smooth steering but must not change the server's ranked rules silently.

**Road race controls:** throttle, brake, steer left/right, clutch (manual mode), up/downshift and optional nitrous where legal in fictional game mode. Road races use checkpoints and total time, not a visually scrolling background with arbitrary scripted outcomes. Crashes are recoverable within the game's economy but cannot be submitted as a completed finish if the vehicle fails inspection afterward.

## 10.3 Fairness, reproducibility and anti-cheat

- Server issues `run_id`, vehicle configuration hash, track seed, race mode, rules version, server timestamp and short expiry.
- Client submits timestamped input event log; server checks monotonic order, legal shift/clutch states, reasonable minimum/maximum intervals and a start-time window.
- Server independently computes finishing time and signs the result. Never trust client-supplied ET, credits, speed, position or award.
- Record `physics_version`, `vehicle_snapshot`, `tune_snapshot`, `track_seed`, `event_digest`, `telemetry` and `result_revision` for replay and disputes.
- Rate-limit starts, finish requests, tuning saves and reward grants. A run ID can be settled once; repeat finish calls return an idempotent saved result.
- Prevent ranking if input trace validation is absent or a model is not deterministic across the supported backends.

# 11. Exact race modes and rules

## 11.1 Drag sprint

**Pre-race:** choose car → inspection gate → setup review → opposing lane reveal → burnout visual (optional, purely game-visible heat/tire mechanic) → staging tree → launch → shifts / optional boost → finish → timing slip → return. False starts result in a penalty rather than silently resetting a player’s earned attempt; assists and countdown settings are disclosed.

**Touch controls:** left thumb **CLUTCH / BRAKE** (context-dependent); right thumb **THROTTLE**; oversized `SHIFT +` and `SHIFT −`; a clearly separated `NITRO` button. Beginners can enable **tap-to-launch** and auto-clutch. Speed, tachometer, gear, temperature and shift light are visible without obscuring the car.

**Race objectives:** Beat AI, set best ET, win specific club brackets, avoid wear and improve setup. Train players to compare ET and reaction separately.

## 11.2 Road circuit

**Pre-race:** select route and opponent(s), read surface/turn profile and prep brakes and cooling. **Driving:** steering, throttle modulation, braking, acceleration out of corners, shift/engine discipline and safe track boundaries. Finish after 1–3 laps or sprint checkpoint course. Cars with poor tires and cooling should lose on a road course even when their straight-line horsepower is high.

**Release gate:** no champion conclusion without at least one fully playable, steerable road circuit and an independent drag sprint; this is essential to the intended classic garage-racing experience.

## 11.3 Wagers and vehicle stakes

- **Practice:** no entry cost, no loss, normal record but reduced credits.
- **Club race:** fictional credits entered and paid out by deterministic server rule; no conversion to real money.
- **Title stakes:** optional high-risk ownership transfer inside a story mode only; clear confirmation before race. Starter-car lock prevents a zero-vehicle state. An offline-friendly recovery contract grants a worn backup car if all other assets are lost.
- **Friend duel:** asynchronous same-seed challenge preserves the current existing Commons implementation; no real-money wagers or transfer outside game.

# 12. Rival characters and career structure

**Career objective:** become **Copper Vale Champion** by building credibility in *both* drag and road races. A rival's stated strength is a real parameter of their car build and driving policy. No character, phrasing, location or silhouette is copied from the historical game.

| Order | Rival | Personality / scene | Mechanical specialty | Qualification |
|---|---|---|---|---|
| 1 | **Ellis “Sparks” Vale** | Cheerful welder, friendly opening mentor | Launch timing; stock coupe | Complete tutorial practice |
| 2 | **June Calder** | Calm service-bay machinist | Transmission consistency | First drag win |
| 3 | **Wade Mercer** | Junkyard scavenger | Used parts / surprise fitment | One successful salvage job |
| 4 | **Nora Pike** | Precision-focused circuit driver | Braking and tire management | First road finish |
| 5 | **Theo Rusk** | Aggressive strip regular | Top-end speed / nitrous | Three drag wins |
| 6 | **Kit Rowan** | Technical builder and negotiator | Balanced mixed-discipline setup | Two road wins and one negotiation |
| 7 | **Mara Voss** | Quiet championship contender | High-power reliability | Rep tier 3 in both modes |
| Final | **Ash Calder** | The independent Vale Champion | Fully optimized mixed-event build | Four major wins in each discipline + safe vehicle |

**Career chapters:** (1) Keys to the Shop → (2) Known Around Town → (3) The Parts Circuit → (4) Night Meet Regular → (5) Two-Discipline Builder → (6) Copper Vale Trials → (7) Champion Challenge. Each chapter introduces one mechanical system, one race strategy and one visual upgrade to the garage.

**Rival behavior:** stable preferences seeded per driver; adaptive setup within bounded rules, not secret “rubber-band” speed boosts. Rival car specs may be inspected at a cost or through dialogue. Dialog must be original, concise and appropriate to the world.

# 13. Economy and progression

**Existing compatibility anchors:** an existing garage begins with 1,200 game credits; five vehicle unlock keys and current list prices are `rattler` 0, `comet` 1,600, `nomad` 3,900, `meteor` 7,800, `phantom` 17,500. These values are not user real-world spending and must remain compatible with the live game until an explicit economy migration is versioned.

**New design economy model:** earned credits = base participation reward + skill/finish bonus + career objective award − optional entry fee − replacement/fuel cost. Publish the reward formula; no hidden randomized charges. NPC car markets fluctuate within bounded bands according to condition, mileage and rarity. Purchase prices cannot underflow available credits.

**Example early costs and outcomes (proposed):** starter inspection free; replacement air filter 90; first timing adjustment free; ordinary practice reward 70–120; beginner club win 200–350; basic wheel service 80 in-game credits if mechanic assist chosen. Pricing is provisional pending simulation and 50-run balance test.

**Negotiation:** three offers maximum per listing; negotiation has a visible `seller_patience` meter. Accepted offer transfers a uniquely tracked item; rejected offer does not withdraw credits. Classifieds refresh after a career day tick, not every browser reload. No user-to-user marketplace at MVP.

**Wear and repair:** condition 0–100 per major system. Wear depends on race duration, RPM abuse, heat, collision, tire compound and upgrade stress. Below a safety threshold a car is labeled **NOT ROAD READY** until repaired; it is never secretly deleted.

**Anti-softlock:** free home inspection, a repeatable non-wager practice event, recoverable starter vehicle, occasional low-cost used parts and a repair credit mechanism to avoid forced restarts or real-money purchases.

# 14. Visual art bible: realistic cars and places

## 14.1 Appearance target

**High-end real-time automotive realism adapted to Safari:** recognizable metal thickness, believable tire sidewalls, dark rubber roughness, chrome reflection, glass transparency, correct wheelbase-to-body proportions, natural materials and strong local lighting. Avoid repeating the same generic vector car across five models. Scene lighting emphasizes metal, paint curvature, workshop dust and brushed metal surfaces.

**Rendering pipeline:** authored original 3D geometry exported as glTF/GLB; compressed mesh and KTX2 texture variants; physically based metallic-roughness materials; baked ambient occlusion; three vehicle LOD levels; adaptive shadow and reflection quality; performance-selected HDR-like probes. Default camera is 3/4 automotive editorial, changing to genuine hood, wheel and underside views during work.

## 14.2 Per-vehicle asset deliverables

Each of five cars receives: exterior body model, cabin glass/interior, rotating wheels, independent door/hood/trunk pivots, original wheel geometry, engine-bay assembly, component fastener targets, underside gearbox/differential view, collision and center-of-mass proxy, damage/condition textures, 12 original paint options, three wheel options and at least three meaningful modification states (stock, street, race).

**Minimum fidelity check:** screenshot each car in the identical camera angle and grayscale. All five must remain distinguishable by silhouette; all five need correct tire contact, no floating parts, physically plausible hood pivot and visible difference after tires, exhaust and power-adder upgrades.

## 14.3 Garage art direction

- **Architecture:** weathered brick, concrete slab, exposed ducting, painted tool shadow-board, non-branded parts tins, shelves, welding bench, lit inspection pit and rolling door.
- **Lighting:** warm 3200 K work lights against cool twilight through the door; controlled specular highlights, not neon everywhere.
- **Interactive clues:** selected fasteners glow subtly when assist mode is on; otherwise physically legible highlights and cursor labels.
- **Style:** believable mid-century atmosphere, but not a traced visual recreation of the 1989 game garage.
- **Performance:** preload garage shell first, stream selected-car high-resolution assets next, then optional reflections/decals.

## 14.4 Animation and camera direction

At garage entrance, dolly behind front quarter; follow car on real wheel rotation and steering, brake lamps illuminate, engine settles; work camera moves to the chosen assembly rather than dissolving to a generic parts list. Small operations use original character hand/tool animation only if the interaction remains readable; a floating cursor and bolt glyph is the fallback. Garage door and hood animations must have reduced-motion alternatives.

**Unacceptable shortcuts:** same silhouette with recolors, generic wrench icon replacing all service work, race background scrolling at fixed speed unrelated to simulation, false photoreal claims from a static background, or engine parts that never visually change.

# 15. Sound and feedback

Original procedurally tuned engine layers: cranking, idle, low/mid/high throttle under load, gear whine, lift-off, tire slip, shifter detent, shop door, socket clicks, hydraulic jack and outdoor ambiance. No reused game samples, ripped car recordings or copyrighted commercial songs without rights. Radio plays originally composed loopable tracks or license-cleared content; mute and reduced-sound options are prominent.

**Important accessibility:** race tree also lights visually and provides countdown vibration where supported; every diagnostic error is readable in text; color is never the only outcome indicator.

# 16. UI/UX, navigation and save surfaces

**Garage HUD:** left = Back / World, center = car name / condition, right = credits / current job. Bottom = context tools `Inspect`, `Hood`, `Lift`, `Parts`, `Tune`, `Start/Exit`. Tap the actual car for the context view; the visible buttons provide full parity.

**Bay view composition:** car occupies about 55–70% of stage width; tool tray never occludes 60%+ of wheel/engine task area. The floor marks and garage door are visible during drive-in. **Tune desk:** two-tab setup sheet `LIVE EFFECTS` and `SAVED SETUPS`, with exact ranges, “Reset to baseline” and an explicit `SAVE SETUP` commit.

**Race HUD:** tachometer, speed, gear, heat, shift target, reaction indicator; no obscuring screen-edge control overlays. **Timing slip:** car / setup ID, date, course/seed, reaction time, 60 ft, 330 ft, eighth-mile, 1,000 ft, ET, trap speed, traction limit percentage, penalties and opponent.

**Privacy and saves:** only approved Commons members can access personal profile. All permanent garage mutation flows use existing server auth and row ownership checks. Another player's private inventory, tune, location or service history must not leak via public leaderboards.

# 17. Architecture and data contracts

**Existing runtime:** GitHub Pages serves the Toolbox front end; Supabase stores authenticated game state and authoritative simulation RPCs. Main Commons page is `docs/community.html`; existing game modules include `docs/commons-streetrod.mjs` and `docs/commons-streetrod.css`.

**Proposed new modules (non-destructive additions):**

| Proposed file | Responsibility |
|---|---|
| `docs/streetrod-world.mjs` | Scene router, destination map, travel transitions, world saves |
| `docs/streetrod-garage.mjs` | Garage state machine, door/hood/lift, camera and hotspots |
| `docs/streetrod-vehicle-3d.mjs` | GLB loading, material variants, wheel/hood/part animation and LOD |
| `docs/streetrod-service.mjs` | Service job steps, commit/rollback, part previews and validation |
| `docs/streetrod-tuning.mjs` | Saved setup sheet, editable ranges, effect labels and RPC bridge |
| `docs/streetrod-market.mjs` | Cars, parts inventory, inspections, bidding, purchases and sales |
| `docs/streetrod-racing.mjs` | Drag controls, road controls, telemetry, replay and timing slip |
| `docs/streetrod-career.mjs` | Rival graph, progression unlocks, records and chapter prompts |
| `docs/streetrod-world.css` | Mobile-first scene layout, overlay readability and inputs |
| `docs/assets/streetrod/` | Original compressed vehicle/garage/track/character/audio assets |
| `supabase/migrations/<date>_streetrod_garage_world.sql` | Additive data model, RPCs, grants, owner checks and indexes |

**Proposed server tables** (names illustrative until migration review):

- `community_streetrod_vehicle_instances`: one owned vehicle instance with `owner_id`, `car_key`, paint, mileage, fuel, odometer, condition and active setup.
- `community_streetrod_part_instances`: every owned part instance with fitment, condition and installed slot or inventory location.
- `community_streetrod_service_jobs`: job ID, vehicle, owner, part, step state, reserved resources, completed/rolled-back timestamps.
- `community_streetrod_setup_presets`: three per vehicle, versioned tunings and `engine_model_version`.
- `community_streetrod_career`: owner progress, chapter, rival state and independent drag/road reputation.
- `community_streetrod_market_listings`: server-controlled rotating listings and bounded pricing rules.
- `community_streetrod_race_events`: input event log digest and run revision linked to existing runs.

**Migration safety:** no DROP/RENAME of current garage/cars/runs/badges columns; preserve one selected car and user ownership; populate vehicle instances for already-owned cars idempotently; do not double-credit or double-award. Keep `community_streetrod_state` as a compatible read facade through migration. Test existing users before enabling new UI.

**Example part instance contract**

```json
{
  "part_instance_id": "uuid",
  "part_type": "carburetor",
  "family": "small-v8",
  "tier": 1,
  "condition_0_100": 86,
  "fitment_tags": ["comet", "nomad"],
  "location": "installed",
  "installed_vehicle_id": "owned-vehicle-uuid",
  "slot_key": "intake.carburetor",
  "effects_version": "parts-v1"
}
```

**Example tool interaction event (client intent, not trusted outcome)**

```json
{
  "job_id": "uuid",
  "action": "secure_fastener",
  "target": "carb.fastener.03",
  "client_sequence": 7,
  "job_revision_seen": 6
}
```

Server checks authenticated owner, active job, valid predecessor steps, compatible reserved part, nonduplicate sequence and expected revision. Server returns authoritative new job state. No local bypass or direct client update of protected tables.

# 18. Performance, technical boundaries and deployment

**Browser performance targets (design goals):** steady ~45–60 fps on a recent iPhone in garage and drag view, with graceful 30 fps fallback on older supported hardware. First interactive shell under ~5 seconds on typical broadband where feasible; total initial mandatory data under 12 MB, stream high-detail assets by selected car rather than all five; per-car progressive asset group target 4–8 MB compressed; memory use capped through unloading unused models and texture LODs. Measure and revise targets with actual Safari remote debugging.

**Graphics fallback:** WebGL2 or comparable supported browser rendering; if unavailable, use a high-quality original 2.5D sprite/illustrated bay with the same mechanics and save system. Never block a player with a black canvas. Offline full racing not promised: authoritative scores require network; local garage preview may read cached immutable assets but does not mint rewards.

**Security:** all gameplay writes through authenticated RPCs and server validation; secrets never in `docs/` or the browser; Data API grants restricted; RLS or carefully reviewed scoped `SECURITY DEFINER` functions; verify ownership server-side rather than relying on user-editable metadata.

**Asset provenance:** source files, permissions and license notes stored in private development manifest. Original artwork, original sound and properly licensed tools only. Do not fetch and redistribute historic game sprites or manual pages as frontend assets.

# 19. Implementation sequence and developer tickets

## Phase 0: protect and instrument baseline

**Goal:** snapshot current production code and database definitions, verify all migrations already applied, enumerate existing `arcade-v1` versus `engineered-v2` leaderboard behavior, confirm the prior GitHub ZIP is not mistakenly treated as installed source. **Deliverable:** tests and release checklist. **Gate:** existing game opens and all current profiles render.

## Phase 1: true garage vertical slice

Build one real garage scene, fully original 3D Rattler model, actual drive-in/out animation, inspect/orbit, hood, wheel lift, 3 usable parts, service transactions and a saved tune. Integrate a single drag race and timing slip. **Gate:** on iPhone, a user can drive in, replace a part, save, reload, drive out and demonstrate changed measured simulation results.

## Phase 2: full five-car lineup and service economy

Unique models for Comet, Nomad, Meteor and Phantom; fill out compatible parts and visual modifications, marketplace and vehicle condition. **Gate:** five silhouettes distinguishable and part instance inventory persists across devices.

## Phase 3: county world and road-race driving

Build world map, diner, fuel station, salvage, car lot, closed-road 2–4 km circuit with steering/braking/gear changes and verified finish conditions. **Gate:** novice can enter both race disciplines, and the same car handles them differently.

## Phase 4: rivals and game completion

Eight original rivals, dual-reputation requirements, chapter presentation, champion event, garage evolution, save slots and non-destructive ending; maintain existing friend duels. **Gate:** beginning-to-champion playthrough with no softlock and no real payments.

## Phase 5: polish, originality review and production

Car audio, day/night, conditions, high/low-end rendering, accessibility, records, mobile input QA, source/license audit, trademark clearance and performance hardening. **Gate:** pass the release acceptance matrix below.

**Relative effort (planning estimates, not promises):** experienced small team with original asset production may need 3–6 weeks for one high-quality garage/race vertical slice and multiple months for a polished full garage world. A solo builder may take materially longer, chiefly due to original 3D art and cross-device testing. Hosting can continue on the existing public Pages + Supabase configuration within its applicable limits; new paid services, outsourced modeling or storage should not be bought without a scoped quote and explicit approval.

**Strict priority for the next code pass:** `GARAGE ENTRY → CAR INSPECTION → ONE REAL PART SWAP → PERSISTENCE → TUNING EFFECT → DRAG RESULT`. Do not spend the first sprint on cinematic menus, radio, map decoration or 35 unimplemented parts.

# 20. Acceptance and QA matrix

| ID | Test | Pass criterion |
|---|---|---|
| G-01 | Open Commons, expand game, enter garage | Garage visible with scene and owned car on iPhone and desktop |
| G-02 | Drive-in | Garage door opens, car wheels turn, car aligns on floor marks, engine shuts off |
| G-03 | Visual distinction | All five models have different silhouettes and recognizable body/cabin/engine geometry |
| G-04 | Hood and wheels | Hood pivots; lift/underbody views reveal actual model geometry, not static cards |
| G-05 | Part removal/install | Correct ordered actions, inventory changes once, visible vehicle changes |
| G-06 | Cancel/refresh during work | No lost credits or duplicated part; safe resume/rollback works |
| G-07 | Fitment | Wrong part rejected with meaningful explanation and no charge |
| G-08 | Tuning | Saved launch RPM, pressure, gearing and shift target affect relevant modeled results |
| G-09 | Quarter-mile | Server computes ET, reaction, 60-ft, trap speed; same input/config yields same results |
| G-10 | Road circuit | Steering and braking influence path, checkpoints and actual finish time |
| G-11 | Ownership | Another member cannot read/write private garage details via API |
| G-12 | Duels | Existing async same-seed player challenges still work with versioned times |
| G-13 | Legacy history | Old badges/credits/cars remain; arcade-v1 and engineered-v2 results remain separate |
| G-14 | Originality | No original game's artwork/text/music/code/rivals/brand in shipping assets or page UI |
| G-15 | Accessibility | Touch, keyboard, reduced motion, readable diagnostics and alternatives are operational |
| G-16 | Low-end rendering | Falls back gracefully; no invisible game or lost input during frame drops |
| G-17 | Economy | 50 simulated novice runs do not create unavoidable permanent bankrupt state |
| G-18 | Mobile lifecycle | Switching apps mid-service or reconnecting preserves committed vehicle state |
| G-19 | Race exploit | Repeated finish calls, forged times, invalid gear logs and replayed events do not award twice |
| G-20 | Garage experience | User can complete the core loop without leaving the game for a raw settings page |

**Launch blockers:** Any failure of G-03, G-05–G-06, G-08–G-14, G-18 or G-19 blocks production rollout; cosmetic refinements may ship later behind optional settings.

# 21. Risks, decisions and deliberate tradeoffs

| Risk / choice | Default decision | Rationale / mitigation |
|---|---|---|
| Realism vs iPhone frame rate | Original 3D with streaming LODs and 2.5D fallback | Visual authenticity without unusable mobile performance |
| Close mechanical inspiration vs IP exposure | Preserve concepts only; redesign every expressive element | Familiar mechanics do not require copying art and text |
| Current game name resemblance | Keep as internal key, rebrand before public campaign | Work through trademark search and qualified legal review |
| Complex mechanical jobs vs tedious tapping | Interactive core steps, optional mechanic assist | Hands-on feeling without mandatory micro-target frustration |
| High-stakes car loss vs player softlock | Optional story title race + protected recovery vehicle | Stakes remain meaningful without forced reset |
| Race fairness vs immediate responsiveness | Client presentation; server settles signed result | Avoid trusting self-reported time and client rewards |
| Too many systems at once | Garage vertical slice before world/rival expansion | Faster verification and better cost control |
| “Historical accuracy” of invented cars | Explicit fictional specs with plausible mechanics | Avoid claiming factory provenance for made-up numbers |
| Browser-hosted code and public assets | Public code/assets, private user data, restricted RPCs | Do not treat frontend obfuscation as security |

# 22. Definition of done and handoff

This GDD is ready for an engineering/art team when they can answer without new product decisions: **what scene loads, where the player can click, what car they see, which saved server state changes, what they can buy/remove/repair/tune, what happens on race day and how the result is verified.** A feature is not complete when it only has a pretty menu or client-side animation. It is complete when the full interaction survives a reload, updates physical and statistical state, enforces ownership and passes its explicit tests.

**Next authorized implementation packet to prepare:** Garage Phase 1 only. Include source files, original model/scene assets, additive migration, a 15-minute automated and manual iPhone acceptance checklist, and a rollback plan. Work from the verified repository head; do not overwrite unrelated games or merge untested changes.

# 23. Historical references and technical basis

This document draws on historical descriptions for functional mechanics, not text or art reproduction:

1. *1989 Street Rod Manual* (historical document): https://pexy.io/wp-content/uploads/2025/06/street-rod-manual.pdf — garage, paper, tune, tires, transmission, drive-in, road and drag racing sections. Historical copyrighted material; do not reuse assets.
2. *Street Rod Reference Card* (historical document): https://www.streetrodonline.com/wp-content/uploads/2012/09/street_rod_reference_card.pdf — interaction commands and part service categories; cited only as a research reference.
3. MobyGames, *Street Rod (1989)*: https://www.mobygames.com/game/434/street-rod/ — historical overview of garage-first mechanics, classifieds, diner and car stakes.
4. U.S. Copyright Office, *Games*: https://www.copyright.gov/register/tx-games.html — distinguishes uncopyrightable game methods/ideas from protectable textual and pictorial expression.
5. Existing source baseline: https://github.com/perhardt7686/cowboys-web-toolbox/tree/main/docs — `community.html`, `commons-streetrod.mjs`, and `commons-streetrod.css`.
6. Existing hosted experience: https://perhardt7686.github.io/cowboys-web-toolbox/community.html — current browser entry point, not evidence that this GDD's new gameplay is live.

**Notice:** This is an original product and technical design document, not legal advice or permission to copy any game. Commission a trademark/title search and legal review before the final public identity or promotional claims.

---

**END OF GDD v1.0**  
**Release principle:** The car is not an icon. The garage is not a menu. The wrenching must change the race.
