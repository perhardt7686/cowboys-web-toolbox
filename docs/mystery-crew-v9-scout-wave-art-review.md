# Scout V9 Wave: source-locked art review (2026-11-19)

**Status:** experimental, NOT published or wired into Mystery Crew Creator. Existing V5 remains the published baseline. Draft PR #112 remains the ongoing branch. Issue #106 remains the art-quality backlog.

## Deliverable created in Cowboy's ChatGPT work session

A source-preserving V9 Scout Wave prototype was generated from the original transparent `crew-0-detective.png` and eight V8 hybrid frames. The user-facing downloadable project bundle in the conversation is `Mystery_Crew_Scout_V9_Source_and_Review.zip`; GitHub does **not** yet contain those rendered V9 PNG frames. The bundle includes a source-specific Python repair recipe, 8 PNG frames (430×574), a lossless animated WebP, side-by-side HTML review, contact sheet, V8-versus-V9 seam proof, metrics and local browser acceptance evidence.

The V9 repair targets the separate orange cuff remnant under the raised right arm in frame 5 and the thin original resting-arm contour in frames 3–7. It changes only a small bounded region near the viewer-right underarm/waist. It does not globally generate replacement characters, repaint faces, or replace the existing 48 outfit sprite pack.

## Measured invariants

- 8 RGBA frames, each 430×574.
- Source PNG frame 1 and frame 8 match original V5 Scout **pixel for pixel**. Lossless animated WebP encoding is a display derivative, not the source-pixel identity proof.
- Relative to V8, outside the bounded x264–341 / y235–336 repair area, pixel values remain unchanged.
- Compared with V8, the inspected face/hair, left arm/backpack, and lower legs/shoes regions are 100% unchanged in all eight PNGs. This does **not** establish every pixel in every frame is unchanged.
- Per-frame changed pixel counts compared to V8: 0, 0, 670, 812, 1191, 757, 749, 0.
- Local Chromium `page.set_content` preview checks passed at 375×667, 390×844, 1365×900: decoded both illustrations, operated step/scrub/play/backdrop controls, detected no JS errors or horizontal scrolling. Reduced-motion test verified autoplay disabled. Browser navigation to file:// and 127.0.0.1 was blocked by the execution environment; a separately served-page or real physical iPhone test was **not** performed.

## Remaining release blockers

The original-reference art still requires a final visual review in its full scene and approval of natural sleeve-to-torso continuity. This single Scout/detective prototype cannot establish fidelity for the other five characters and remaining 47 outfits. The existing `painted-shoulder-continuity-MUST-PASS-BEFORE-MERGE` CI gate has been failing on **all 48** old synthetic arm-rotation cases. Do not weaken that check simply to make CI green. V9's new PNG artwork was **not** installed into the production runtime, so it does not cure the old V6 rig failure by itself.

## Next production milestone

After single-character visual approval, incorporate each authored V9 pose as a source-managed asset on the development branch, add a Scout-specific action playback test in actual Creator page contexts, validate complete scene/mobile controls, then expand quality-controlled painted poses to six characters and all eight costumes. Only merge after the exact current HEAD passes all release gates and art review. Preserve account progress, pets, and unlockables.
