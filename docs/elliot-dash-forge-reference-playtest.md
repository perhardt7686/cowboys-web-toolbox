# Elliot's Dash Forge — original-feel timing and hitbox acceptance sheet

**Status:** prepared for a real side-by-side playtest. No member-device test has yet occurred.
**Purpose:** compare the *feel* of Dash Forge with Geometry Dash without importing protected levels, artwork, code, or licensed music.

## Preparation

Use an approved family-member account and a current iPhone/tablet, preferably with a second device playing Geometry Dash. Ensure the existing PR #79 release has passed all gates and its served build is verified. Use a new practice draft or early campaign stage; do not publish unverified results. Protect Elliot's account and do not upload recordings containing private family identifiers.

## Five short playtests with Elliot

| Test | What to compare | Evidence and pass criterion |
|---|---|---|
| 1. Cube: a run of spaced spikes | How quickly a tap becomes a jump, how landing feels, and whether edge grazing is fair | 10 jumps; record unexpected non-responses, apparently invisible collisions and late reactions; every collision should correspond to visible geometry |
| 2. Hold-to-jump | Whether holding the A button or screen creates expected repeat behavior and whether accidental double input happens | 10 attempts, compare held/tapped input; no phantom jumps and no lost button release |
| 3. Ship and wave | Continuous thrust/climb control and release-to-descend at low and fast speed | 5 runs each; compare directional responsiveness; no control reversal or stuck input on device rotation |
| 4. Practice/checkpoint | Restart position, reset speed and ability to recover quickly after a mistake | 5 intentional failures; return to expected selected tile, no fake ranked win or persisted score |
| 5. Visual readability | Cube silhouette, spike corners, portals, beat timing and camera rhythm in portrait and landscape | 375/390px phone and tablet; no obscured hazards; player visible while moving; no UI buttons smaller than accessible touch targets |

## Technical diagnostics

- Validate 120 Hz fixed-step replay reproducibility with identical inputs at 30/60/120 fps rendering schedules.
- Check tap/hold transition, first-frame response, collision contact, gravity inversion and mode switch timing; compare the *recorded* trace against server replay.
- Record input latency separately from animation scheduling and device refresh rate. Do not invent a millisecond parity number without measuring both games.
- Keep the original art/sound independent. Match the game's affordances and challenge structure rather than trying to copy proprietary assets.
- **A test only passes when Elliot actually verifies it on the intended device and a repeatable technical receipt supports the result.** A green CI workflow alone is not Elliot's acceptance.

## Report template

Device / browser / build SHA: ______

Test stages and original game mode observed: ______

Jump response: ______   Hitbox surprises: ______

Ship/wave feel: ______   Retry frustration: ______

Elliot's preferred adjustment: ______

Proof captured: ______   Remaining blocker: ______

## Release criterion

Do not promote “exactly like Geometry Dash” based on static code inspection or synthetic screenshots. Prioritize the one game-feel mismatch Elliot notices most, adjust only the required mechanics, and repeat deterministic replay + mobile acceptance checks.
