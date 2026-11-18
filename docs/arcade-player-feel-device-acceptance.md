# Family Arcade game-feel acceptance, Elliot + Emma

**Status:** Developer checklist for authentic in-hand testing, not proof of a passed device test.

This upgrade keeps the 120 Hz authoritative physics and score replay intact.
Control settings are **per signed-in member and per browser/device**, not synced
between devices, not written to family rankings and not transmitted to Realtime.

## Elliot: Dash Forge, 5 minutes

- Sign in as Elliot (approved member) and start an early-stage practice round.
- Alternate 10 rapid taps with five holds on the playfield, then the separate A button.
  Cube mode must jump on tap; ship/wave respond to hold and release.
- Tap with one finger while lifting another. The first finger's hold must stay active.
- Open **CONTROL SIZE**, choose Extra large, confirm A visibly grows, exit and reopen.
  Restart browser to confirm member-specific local persistence. Press **Reset** and
  confirm Standard returns. Tap-anywhere timing must **not** change.
- If another approved member signs in on the same device, their button size should
  remain their own choice, not inherit Elliot's setting.

## Emma: Skyboard Sprint, 5 minutes

- Start a practice stage using the left thumb on the stick and right thumb on A Jump.
  While steering, press B Drift or C Brake. Steering must remain active.
- Compare **STEERING FEEL** presets: Quick should engage with a shorter thumb movement,
  Balanced is the default, and Steady reduces center jitter. The course, top speed,
  jump arc and awards must remain identical.
- Release one of two fingers while holding another button; other inputs must persist.
- Slide the thumb within the stick's outer circle, then release; it should return
  to neutral without stuck steering. Test rapid side reversals and drifting.
- Restart the browser, then test Emma vs a second approved member on the same device.
  The sensitivity preference should be isolated by account and retained locally.
- Press **Reset** and confirm Balanced returns. Do not claim a synchronized preference
  between separate phones or tablets.

## Reliability checklist

- iPhone Safari or Chrome (both use WebKit on iOS), landscape and portrait.
- Tablet browser landscape; gamepad and keyboard still work when connected.
- 30 Hz/60 Hz rendering under load should produce the **same deterministic replay**
  for the same recorded control masks.
- Verify no toolbar, notch, zoom or safe-area overlay obscures the stick or A/B/C.
- Enable reduced motion: touch feedback remains visible without gratuitous animation.
- Check after tab switching, pause, lost touch, device rotation and app backgrounding.
- No offline/practice win is ever presented as a server-authorized leaderboard result.

## Evidence

Record: device, viewport, browser, signed-in *display-name only*, deployed build SHA,
course/stage, each test's pass/fail, one reproduced failure and Elliot/Emma's own
feedback. Do not collect or publish their private emails, photos, student details,
account IDs or other sensitive information.

**Release gate:** A green CI alone is insufficient to say the controls feel like the
original games; both children should verify on their actual devices before a gameplay
parity claim.
