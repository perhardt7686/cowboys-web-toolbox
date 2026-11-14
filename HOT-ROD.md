# Hot Rod on the Family Message Board

[Open the approved-family game](https://perhardt7686.github.io/cowboys-web-toolbox/community.html#hot-rod) and choose **Hot Rod**. **Classic 1963** is the default campaign. **Cowboy Remix** in the main menu opens the earlier version with its own saves, rivals, achievements, and member matches.

The player starts with $750 and an empty garage. Tap the newspaper for classified ads, the hood for the engine, the jack for individual wheels, the clipboard for condition and performance, and the driveway to reach Bob’s. On desktop, use the arrow keys to drive, E/Q to shift, and Shift for the clutch. Ease off the gas during shifts. Touch controls support holding gas or brake while steering or changing gears. Progress saves after confirmed actions. An unfinished race can be staged again from its saved starting line.

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
