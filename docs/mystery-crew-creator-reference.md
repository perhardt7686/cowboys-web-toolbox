# Mystery Crew Creator | Approved visual reference (November 18, 2026)

**Source:** Cowboy's uploaded image `IMG_0907.png` / `a_vibrant_fully_redesigned_avatar_studio_v8_int.png` in this project conversation. Original screenshot: **1672 × 941 px**. SHA-256 (original bytes): `4ad4fd88ddb53e5e7d9fd94aaa8739951b7fc393b5bbd62494b8385873bf8f7d`. A byte-for-byte downloadable copy is available in the conversation as `Mystery_Crew_Creator_Visual_Reference.png`. **The exact original PNG is now saved in Cowboy's connected Google Drive as [Mystery Crew Creator - Approved Visual Reference.png](https://drive.google.com/file/d/1tduoda42qTMDO-0YhdLASNpVo6BBmF6P/view?usp=drivesdk)** (verified uploaded metadata: PNG, 2,866,734 bytes). This is a private project reference, not a publicly hosted site asset. The original binary is also available as this conversation attachment, but is not committed to GitHub, whose configured file-write action handles text only.

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

## Fidelity Pass 2 | Source-specific visual comparison (November 19, 2026)

**The approved 1672 × 941 PNG remains the single visual target.** Its exact
original bytes stay private in the approved Google Drive attachment. No copy
or crop of that private image is published through GitHub Pages.

Reference composition to compare in every desktop screenshot:
- Header: illustrated blue woodland banner, wood-plank Cowboy's sign,
  yellow/blue ink-outlined creator masthead, truthful player progression
- Navigation: navy lacquer with bright gold Character active tab
- Left rail: five distinct illustrated face portraits, cream frame;
  drafts/presets clearly marked as UNSAVED rather than misrepresented as users
- Center: tall, expressive adventurer with orange adventure clothing,
  cargo pants, shoes and gear, next to a **sitting white-and-brown hound**
- Behind the characters: dimensional blue-and-orange adventure van,
  magnifying glass badge, four roof lights, shadowed pine forest,
  barn with glowing interior work light and cluttered shelves
- Right: cream gallery with eight individually illustrated outfits
  in a 4-column × 2-row grid; accurate equip/unlock states
- Bottom: fixed action/color toolbar and category launchers
- Viewports: all visible in a single window at desktop and at both small
  phone sizes, never a disguised vertically scrolling document

Current improvement commits: native vector layers in
`mystery-crew-stage-art.mjs`, shared facial contours in
`mystery-crew-art.mjs`, full-bodied companion, five-portrait rail with
clearly identified optional previews, and one-window styling. These changes
are **artistic improvements, not evidence of pixel-for-pixel identity**.

### Acceptance gate

The visual reviewer must look at a **fresh-load screenshot** against the
approved image, *not only after tests recolor the character and equip gear*.
Confirm the environment, human and companion proportions, illustrated
equipment and touch controls. Browser CI must also pass genuine 375 × 667,
390 × 844, desktop and original 1672 × 941 viewport checks, including
zero document overflow, item/trait changes, saves and account isolation.
Never claim source equivalence or real-device iPhone verification solely
because Playwright passed.

## V4 continuity note | November 19, 2026

Reference lock remains the original privately held 1672 × 941 illustration. Do not upload those original pixels to public Pages.

**New independently replaceable scenery:** mystery-workshop-v4.webp (generated painterly forest and workshop, 820 × 550, about 72 KB), with the inspectable mystery-workshop-v4.svg scenic source study. mystery-van-v4.svg is a separate complete 760 × 465 vehicle with wheels, windows, four roof lights, orange stripes and magnifier emblem. The old cropped/occluded van and workshop picture patches no longer show while V4 is active. Both new files must decode before the art swap, and V3 is the fallback.

**Original-art benchmark:** The approved image remains richer than the shipped title, facial acting, outfit-on-body variants and van painting. Do not report pixel-perfect parity. Compare fresh 1672 × 941 desktop and 375 × 667 and 390 × 844 phone captures, and require one visible van, no broken images and no document/internal gallery scrolling.

**Live data:** No database migration or changes to family accounts, rewards, saved crew identities, pet IDs or outfit IDs.

**Next pass after V4:** Full painted outfit-on-actor variations and five remaining distinguishable crew anchors; see Issue #106. Verify pose, hat and gear combinations visibly change character artwork rather than silently returning to generic anchor art.
