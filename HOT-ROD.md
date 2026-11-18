# Hot Rod on the Family Message Board

[Open the approved-family game](https://perhardt7686.github.io/cowboys-web-toolbox/community.html#hot-rod) and choose **Hot Rod**. **Classic 1963** is the default campaign. **Cowboy Remix** in the main menu opens the earlier version with its own saves, rivals, achievements, and member matches.

The player starts with $750 and an empty garage. Tap the newspaper for classified ads, the hood for the engine, the jack for individual wheels, the clipboard for condition and performance, and the driveway to reach Bob’s. On desktop, use the arrow keys to drive and the original-style Space selector to upshift while accelerating or downshift while braking. E/Q remain optional separate shift keys, and Shift is an optional clutch. Ease off the gas during shifts to protect the transmission. Tap the nameplate in the garage to select between owned cars. Touch controls support holding gas or brake while steering or changing gears. Progress saves after confirmed actions. An unfinished race can be staged again from its saved starting line.

## Comparison with the 1989 DOS release

The manual and reference card describe the baseline mechanics. The longplay and documented DOS screenshots establish the visual reference. Photos of the green 1966 Galaxie and the Aqueduct Race menu show the sequel. [Official manual](https://www.streetrodonline.com/wp-content/uploads/2012/09/street_rod_manual.pdf) · [Reference card](https://www.streetrodonline.com/wp-content/uploads/2012/09/street_rod_reference_card.pdf) · [1989 DOS longplay](https://www.youtube.com/watch?v=ALxta1vF2ik) · [Bob’s Drive-In DOS screenshot](https://www.mobygames.com/game/434/street-rod/screenshots/dos/518403/) · [Contemporary review of the sequel](https://www.cgwmuseum.org/galleries/issues/cgw_86.pdf)

| Area | 1989 DOS original | Previous family build | Hot Rod |
| --- | --- | --- | --- |
| Start and art | Period titles and copy-protection check, 320×200 DOS scenes | EGA-inspired presentation and Reborn overlay over the older racing modules | Original DOS-style opening and 16-color pixel scenes at 320×200, scaled for touch and keyboard. The historical copy-protection step is omitted. |
| Garage and paper | Physical tools, used-car listings, parts and vehicle inspection | Existing workshop, classifieds, and campaign menus | Clickable garage props, 25 period listings, inspection and offers, compatible parts purchases, resale and scrap. Advertised prices, conditions, and some specs are calibrated for this implementation. |
| Mechanics | Individual fasteners, engine assembly, ignition timing, tires, paint and bodywork | Server-persisted workshop and timing controls | Independent engine, intake, carburetor, transmission and four-wheel assembly. Fasteners, electrical connection, jack position, wear, tuning and modifications affect eligibility and performance. |
| Drive-in and race | Bob’s, ¼-mile drag and 2½-mile road races, cash and title wagers | The existing family campaign roster and timed race trace | Independently authored opponents and negotiation, racing line and cockpit, drag and curves, revs, wheelspin, clutch and gear ratios, AI, fuel, damage, patrols and forfeits. Opponent behavior, unlock counts and vehicle damage are calibrated for browser play. |
| Campaign | $750 starting bankroll, a September 15 deadline, The King, and a hall of fame | 22 family rivals and Mystery Machine finale | Separate $750 summer with fictional cash, title ownership, condition, fuel and elapsed time. The King closes Classic. The Mystery Machine is an optional final boss that awards a separate trophy without altering the Classic outcome. |
| Family play | Single-player original | Preserved family roster, garage data and remixes | Approved-family car showcases, asynchronous timed challenges, and a live Family Scoreboard entry. |

The publisher supplies the original DOS downloads and documents. Hot Rod uses independently authored code, pixel art, and synthesized audio. [Official downloads](https://www.streetrodonline.com/downloads/)

## Rules for family results

- A drag win earns **8 points** and a road win earns **12**. A first win against a rival in the campaign adds **5 + twice the rival’s tier**. The King adds **100**. Defeating the Mystery Machine earns **150** once per campaign.
- Accepted member challenges give both members the same course and seed. Each member uses their own saved car. A clean finish beats an unfinished run, and the faster clean finish earns **20 career points**. Equal finish times share a draw, and two unsuccessful runs award no win.
- The Hall of Fame sorts by Mystery Machine wins, then Classic crowns, career points, quickest crown in game hours, and wins. Exact ties share a rank. Milestones include the first drag, road, and member challenge wins plus Classic crowns and Mystery Machine trophies.
- The server replays recorded driving inputs before awarding points. The member-facing garage view shows vehicle appearance and basic specs. Full saves, inventories, and race mutation functions are restricted to the game backend. Profile photos follow the board’s existing visibility settings.

## Release and recovery

The site is deployed via GitHub Pages. Hot Rod also uses the existing Supabase project with the additive `hot_rod_classic_1963` migration and `hot-rod` Edge Function. Deploy those before exposing the new game in the board. The game’s private tables have no direct family-client access, and authenticated users see standings only after the approved-member check.

The baseline is recoverable on [the pre-Hot-Rod archive branch](https://github.com/perhardt7686/cowboys-web-toolbox/tree/archive/streetrod-reborn-before-hot-rod-1989). To roll back the board, revert the Hot Rod launch, stylesheet link, scoreboard integration, and Remix adapter on the current main branch. Retain the additive migration, the backend function source, both generations of saved data, and unrelated family board changes. The old launch remains available in the existing source.

Run `npm test`, `npm run check:edge`, and `node docs/check-release.cjs`. The browser workflow exercises the game in Chromium and WebKit using fixture members. Isolated tests cover a full $750 campaign, mechanical dependencies, race replays, both bosses, permission boundaries, invitation and result validation, and recovery from interrupted saves. A fixture result does not count as a family account’s result.

## DOS garage and engine comparison

The 1989 DOS manual and screenshots are the reference for this revision. The user screenshots include screens from the Amiga, Commodore 64 and the sequel. The DOS engine close-up, 1940 Chevrolet Coupe, 1956 Corvette, and Bob’s Drive-In set the look of the Classic rooms. The saved June start date, browser driving model, and family-specific rules continue to use the existing Classic campaign.

| Area | Changes after the first comparison | Changes after checking the redrawn screens |
| --- | --- | --- |
| Car artwork | Draw separate side contours, windows, wheel arches and brightwork for every model, including the van. Render the same vehicle through classifieds, garage, filling station, diner and the member garage. | Scale the garage car across the floor and add wall texture, garage props and chrome. Verify roof chop, bumpers, decals, paint and a raised or removed wheel redraw the actual car. |
| Engine | Show the complete assembly in a black-and-chrome pop-up over the garage. Place Tune, Parts and Done below the engine. Use two turns to remove a fastener, press a bare hole to seat it, then turn twice to torque it. | Add contrasting stud, seat and wrench positions, the actual valve cover, cast intake, carburetor barrels, and the ignition lead. Try the full carburetor, intake and block removal, then rebuild from the Parts shelf. |
| Timing | Use the original up-retards and down-advances direction with a red reference mark. | Keep the timing adjustment in view until Done saves the selected value. Disable tuning while the assembly is incomplete. |
| Paper and calendar | Start with the newspaper front page. Open actual classifieds, page through listings and inspect model-specific art. Overlay the current and next months over the garage. | Verify the date and starting bankroll come from the save, item selection previews the car, and the calendar marks the current day and school-start date. |
| Drive-in and cockpit | Draw the period sign, parked cars and rival replies. Attach driver calls and race offers to the canvas, and show the rival engine in a read-only panel. | Compare the roadside perspective and silver dashboard again, enlarge the wheel, and add a ticket when the verified race outcome reports a patrol stop. |

The engine panel uses the existing revisioned save operations. A first wrench turn belongs to the open workshop. A completed fastener change survives reload. When the last mounting fastener is out, the part lifts automatically once its dependencies and electrical connection allow it. If that second save is interrupted, Retry or Lift off completes it from the stored state. Phone users have separate numbered targets and can perform the full procedure without the canvas hotspots.

## November 18, 2026: original DOS display and controls fidelity

The original 320×200 EGA art remains unchanged in pixel data, but the display now uses a 4:3 CRT-style aspect ratio (historically non-square DOS pixels), including the landscape driving cockpit. The artwork, clickable prop hotspots, and 320×200 coordinate system scale together; the racing screen is height-constrained on narrow devices. The garage nameplate now leads to the existing owned-car selector, following the original manual. The race instructions surface the already-implemented Space selector shifting and retain accessible separate keys and phone buttons. This is a **presentation and interaction-only** pass: it changes no physics, Supabase data, server replays, saves, achievements, accounts, or membership rules. The original game's exact 1989 appearance and physics have *not* been verified as identical; screenshot and physical-phone comparisons remain release checkpoints.

## November 18: Fidelity Pass 1, model silhouettes and cockpit

**Primary reference:** The 1989 DOS EGA version, not the Amiga layout or the 1991 Street Rod 2 VGA artwork. Compare against the [1989 manual](https://www.streetrodonline.com/wp-content/uploads/2012/09/street_rod_manual.pdf), [DOS screenshot gallery](https://www.mobygames.com/game/434/street-rod/screenshots/dos/), [DOS driving frame](https://www.mobygames.com/game/434/street-rod/screenshots/dos/10137/), and [period garage examples](https://www.drivingline.com/articles/back-to-89-before-there-was-forza-gran-turismo-there-was-street-rod/). Reference frames are not bundled, sampled as game sprites, or published to GitHub.

**Implemented on the branch:**
- All 25 period classified models plus the optional Mystery Machine retain separate independently drawn profiles, now with additional period styling: early hood louvers, chrome glass framing, rocker seams, 1950s fin treatments, Corvette cove lips and Sting Ray vents, windshield rails, and unchanged family van flower artwork.
- The driving cockpit gains chrome instrument framing, redline tick clarity, gauge-glass reflections, steering-wheel response, analog radio/switches, and projected roadside poles.
- The core is still native 320x200 EGA color, displayed at the intended 4:3 CRT proportions. Hotspots scale with the art.
- Visual changes do not edit game state, driving physics, server replays, persistence, account permissions, scores, or family challenges.

**Side-by-side review checkpoints:**

| DOS source feature | Hot Rod target | Acceptance |
| --- | --- | --- |
| Broadside garage car | 26 vehicle side profiles (25 classifieds plus finale) | Recognizable roof, tail, wheelbase and whitewalls at 320x200 |
| 1957 Fairlane's raised fin | Fairlane side profile | Rear point, chrome spear and correct body balance |
| 1956 Corvette silver side cove | Corvette 56 | Cove, windshield and tire shape visible |
| 1963 Corvette low roof and vents | Corvette 63 | Distinct from earlier Corvettes |
| 1989 wheel, analog gauges and road | 320x200 cockpit | RPM, speed, gear, steering, redline and road depth legible |
| CRT screen plus touchscreen | 4:3 canvas and normalized prop hotspots | No stretching, overflow or accidental prop activation |

**Still pending:** direct human screenshot-by-screenshot acceptance, original-game handling parity, physical iPhone landscape playtest, desktop family-member playtest, and any visual cleanup revealed by browser artifacts. GitHub CI exercises Chromium/WebKit with synthetic accounts only. Run required checks before merge. **Next separate phase:** physical engine assembly interactions, then Bob's Drive-In art and rival staging.
