# Street r0d Reborn · source-to-game audit

**Scope:** Cowboy's Commons interactive Street r0d, rebuilt for phone-sized screens with a single 320 × 200 DOS-like room at a time.

## Primary research

Studied the free original DOS game from the rights-holder's [Street Rod downloads](https://www.streetrodonline.com/downloads/), the [original gameplay manual](https://www.freegameempire.com/games/Street-Rod/manual), and the reverse-engineered source and documentation of [kylofon/street-rod-sdl3](https://github.com/kylofon/street-rod-sdl3), an MIT-licensed C/SDL3 reimplementation (copyright 2026 Krzysztof Kania). The port is a game-specific engine that reads original `SR.EXE`, `LIB1`, `LIB2` and `HOT_DATA` at runtime. **Its MIT license covers the port's own code and documentation, not California Dreams' original executable, art, sound, or data.** This web rebuild contains no copied original game asset libraries, DOS binary, or original source code. The UI/game mechanics are implemented as independent browser code, with a named source credit for the research.

### Original file-to-feature map

| Primary original-port implementation | Original player-visible rule | Cowboy's current implementation |
|---|---|---|
| `srport/src/game/flow_main.c`, `flow_state.c` | Title/new/load game → newspaper for a new driver → central garage; end-of-summer checkpoint | New title/continue screen; existing saved campaign retained; original season calendar server |
| `srport/src/game/garage_main.c` | Garage scene has mouse/wrench hotspots; shop, hood, calendar, exit-to-street, customization | Rebuilt 320×200 garage with hotspot targets, direct destinations, native server actions |
| `srport/src/game/garage_shop.c` | Newspaper classifieds, browsing and negotiations, buy/sell/switch cars | One visible classified at a time; actual `buy_car`, `negotiate`, `switch`, `sell_car` pathways |
| `srport/src/game/garage_bay.c` | Engine, manifolds, carburetors and wiring are removed in an order; fasteners must be turned and restored | Existing revision-controlled seasonal workbench, `ss-season-bay`, opens from the rebuilt garage |
| `srport/src/game/race_bob.c` | Bob's Drive-In, arrival of opponents, challenge and wager dialogue; King is late boss | Single-rival presentation, original saved challenge form, final `cipher` backend opponent styled **The Mystery Machine** |
| `srport/src/game/race_drive.c`, `race_phys.c`, `race_road.c` | First-person drive, gear/RPM/steer/engine and road consequences | Existing signed-in race trace and server finish validation; rebuilt on-screen cockpit and steering/shifting controls |
| `srport/src/game/flow_save.c`, `flow_clock.c`, `flow_end.c` | Persistent save, calendar advancing to school, hall of fame and winner ending | Preserve existing Supabase save and final championship status; no new storage or duplicate game economy |

## Custom Cowboy features preserved

- **The Mystery Machine**: a hand-drawn turquoise, floral EGA van as final boss; original final-opponent *database identifier* remains `cipher` for save compatibility, with existing six-win and reputation unlock requirements.
- **Avatars**: personal drivers are read from the existing authorized Commons racer roster (`.srm-player` and `.srm-avatar`), never from a newly created photo database; family names have a fallback initials grid when the roster is unavailable.
- **Multiplayer and Junior**: remain distinct from the single-player summer campaign, retaining saved builds, medals, scoreboards, races, and child-safe no-stakes gameplay.
- **Existing bank and mechanics**: all mutations continue through existing `community_streetrod_season_action`, `...race_start`, `...race_finish` and revision-controlled `...workbench_action`; a click is not proof a server action succeeded.

## Files

- `docs/streetrod-reborn.mjs`: fresh presentation/room-state controller; replaces the old compiled stack of DOM scene patches
- `docs/streetrod-reborn.css`: fixed viewport responsive EGA monitor, cards, mobile controls and mechanical workbench overlay
- `docs/streetrod-reborn-config.js`: prevents old DOS boot handlers from running at the same time
- `docs/commons-streetrod-ega.mjs`: original independently-drawn 16-color sprite painting, including the custom Mystery Machine van
- `docs/commons-streetrod-summer.mjs` and `docs/commons-streetrod-season-bay.mjs`: existing **authoritative** server-backed mechanics/economy/racing interfaces
- `tests/streetrod-scene-flow.test.mjs`, `tests/browser-streetrod-reborn.py`: source-level and real Chromium phone viewport checks

The previous `commons-streetrod-scene-flow.*` files remain in the repository solely as a rollback reference and are no longer loaded on `community.html`.

## Remaining gaps versus exact original

This rebuild is **not** a byte-for-byte copy or a native/WASM execution of the original C engine. The original source port handles 22 rival records, more intricate gas/gear/heat/police events, original car-part layouts, a full save-slot/hall-of-fame sequence, and first-person road drawing backed by proprietary `LIB*` and `HOT_DATA` records. Cowboy's browser game retains its pre-existing smaller set of saved rivals, fictional car catalog, simplified season model and server-validated race calculations. Visuals are independently drawn, not the original sprites. Achieving exact mechanical equivalence would require another validated implementation of those simulation rules and more original-independent art, plus safe migration of live saved game data. Do not describe this rollout as a complete exact port or certified 100% until each subsystem is checked.

## Acceptance criteria

1. No separate scrollable browser-page section is needed to change garage, paper, diner, parts, calendar and road scenes.
2. A single 320×200 raster stays inside the visible viewport on portrait and short landscape phones.
3. Real car purchase/haggle, racer challenge and wrench operations reach the existing authenticated server rather than a fake local score.
4. The Mystery Machine is offered only by the existing end-boss gate, including win and reputation checks, with the correct final championship save.
5. Avatars and prior achievements remain accessible without creating parallel profile records or exposing private data.
6. Browser checks pass at 390×844, 375×667 and 844×390; a signed-in Safari session still requires hands-on verification.
