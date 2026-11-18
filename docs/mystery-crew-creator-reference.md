# Mystery Crew Creator | Approved visual reference (November 18, 2026)

**Source:** Cowboy's uploaded image `IMG_0907.png` / `a_vibrant_fully_redesigned_avatar_studio_v8_int.png` in this project conversation. Original screenshot: **1672 × 941 px**. SHA-256 (original bytes): `4ad4fd88ddb53e5e7d9fd94aaa8739951b7fc393b5bbd62494b8385873bf8f7d`. A byte-for-byte downloadable copy is available in the conversation as `Mystery_Crew_Creator_Visual_Reference.png`. This document preserves the design specification; the image itself is kept as the conversation attachment and was **not** uploaded into GitHub by this text-file workflow.

## This image is the specification, not inspiration for another old-theme recolor

- **Product name:** Mystery Crew Creator, not Avatar Studio or V8. Show it in the masthead and launcher.
- **Canvas:** Wide, landscape, illustrated forest workshop and orange/blue mystery van with a prominent customizable full-body cartoon character and companion, not a robot posing in an attic.
- **Top:** Cartoon wordmark, conspicuous creator title, progression badges (only when genuinely earned), dark blue/navy toolbar and bright gold active tab.
- **Left:** My Crew vertical portrait roster, add-character control.
- **Center:** Main stage with figure, playful facial expressions and motion controls; directly editable color swatches, camera rotation, zoom, play/stop; save creator state.
- **Right:** Warm cream collectible wardrobe gallery with large illustrated clothing cards and visible Equipped, Equip, Locked or Unlock states. All displayed currencies, progress and item states must be truthful; never fabricate shared/online rewards.
- **Bottom:** Big illustrated category launchers for Outfits, Hats, Gear, Pets, Vehicles and Collections; generous 44px touch targets.
- **Small-screen:** One real responsive creator, not a tiny legacy form: horizontally scrolling category navigation, stage first, roster and item gallery below, actions sticky or easily reachable, no clipping or horizontal page overflow.
- **Data migration:** Cowboy explicitly allows abandoning previous characters and unlockables. Do not delete old backend records. New creator should not pretend that local demo progress is backed by server accounts. Account-scoped remote persistence can be added separately after safe rollout.

## Acceptance criteria

1. Open the actual family-board avatar launcher and arrive at **Mystery Crew Creator**, not the old Dressing room.
2. Screenshot desktop, 390px iPhone and 375px iPhone. Compare composition to uploaded reference: blue/gold banner, character stage, roster, illustrated equipment grid, bottom cards.
3. Create and switch between characters; modify outfit, face/color and pet. Verify that animations and rotation work and changes survive reload in the same browser.
4. Ensure unlocks have explicit rules, no fake online/verified currency and no privileged backend writes.
5. Verify existing family message board and games are unaffected. No Classic switch or embedded old avatar panel.
6. Do not claim full original image fidelity until approved by Cowboy with side-by-side screenshots.
