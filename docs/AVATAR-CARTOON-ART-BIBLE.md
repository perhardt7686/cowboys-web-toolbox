# Avatar Studio: mystery-cartoon art and interaction guide

**Owner:** Cowboy | **Repository:** `perhardt7686/cowboys-web-toolbox` | **Design revision:** November 15, 2026

## North star

The Family Message Board is an original, warm, slightly eerie late-1960s mystery-cartoon world. Cowboy's user-provided screenshots of the original *Scooby-Doo, Where Are You!* series are a visual study reference, **not artwork to reproduce**. Do not copy its characters, logos, distinctive character designs, scene paintings, or licensed assets.

The result must feel like a single art department designed the characters, outfits, creatures, collectibles, scenes, and reactions.

## Non-negotiable character language

- Inked dark exterior contours and restrained smaller interior lines; no raw unshaded primitives in finished artwork.
- Clearly different human, robot, and monster silhouettes that stay recognizable from the front, back, and at profile-thumbnail size.
- Controlled flat or two-tone cel colors; warm lights and cool shadows; minimal metallic sheen except for purposeful robot hardware.
- Expressive eyelids, eyebrows, jaw silhouettes, hands, posture, and foot contact. Faces must work in close-up.
- Costume attachment with correct 3D mounts and scale variants for horns, capes, tails, mechanical hands, shoes, and glasses.
- Pets are full members of the cartoon cast, not detached particle effects. They follow the same ink, lighting, timing, and stage rules.

## Seven original scene families

`avatar-mystery-backdrops.mjs` paints canvas textures on demand, cached by the dressing-room renderer:

1. **Manor:** crooked towers, moon, lit windows, bare branches, low mist.
2. **Forest:** irregular trees, silhouettes, muted fog and distant moon.
3. **Workshop:** cabinets, analog dials, illustrated pipework and mechanical props.
4. **Carnival:** striped pavilion, ferris wheel, bunting and faded storybook color.
5. **Observatory:** planets, stars, observatory dome, telescopic silhouettes.
6. **Arcade:** dramatic depth, illustrated machines, graphic geometry.
7. **Library:** bookcases, arched window and theatrical staging.

The theme selection derives from the user's selected background reward or free palette. It is decorative and never changes saved avatar recipes, unlock state, or account authorization.

## Interaction rhythm

A meaningful interaction has **prepare, action, reaction, settle** phases. Pets notice nearby items; lanterns light their surroundings; tools stay attached to real hand joints; capes hang from shoulder clasps; robot scans come from the lenses. Resting characters have only restrained acting so the editor stays legible.

Reduced-motion users get a meaningful stationary frame and readable text instead of motion where a preview supports it. Nothing runs unseen in the background.

## Keep family data safe

- Every member starts with enough free body, face, hair, skin, clothing, and expression choices to make a complete character.
- Keep earned reward IDs, achievement requirements, character recipes, photo portraits, pet names, bond/tricks, offers, and ownership history.
- Locked try-ons are visual only. The server owns unlock and trade authority.
- No new login requirement, tracking, payments, account resets, or duplicate Supabase project.
- Preserve the board's existing approved-member access and account separation.

## Quality gates

1. Screenshot representative human, robot, monster, pet, equipment, and a background in the same camera and color treatment.
2. Verify front, quarter, side, rear, close-up, and phone-sized crops.
3. Run `npm test`, the avatar WebKit/Chromium previews, and the repository's publishing checks.
4. Inspect game return links and earned/locked item flows with approved test accounts.
5. Verify the actual release commit and loaded live entry point, not merely a successful source update.
6. Classify each requested deliverable as **implemented**, **tested**, **published**, **verified**, or **pending**.

## Change log, this pass

- Added original painted scene families and restrained character/pet idle acting.
- Restyled the in-board Studio with the same ink, parchment, violet, and warm-gold visual language.
- Added pure scene and acting regression tests.
- No backend schema or family content modifications in this pass.

This is an art direction reference and implementation record, **not** a substitute for visual approval on real devices.

## Profile eye-fitting iteration | November 15, 2026 | PR #36

- **Observed before:** the 3D eye meshes had multiple rounded, forward-offset layers that looked detached in profile, and eyewear hovered noticeably ahead of the face. This comes from the face renderer's sphere scales and mounted depth, not a subjective claim about CI.
- **Code change:** seat flattened cel-ink, sclera, iris, pupil, highlight and wink layers nearer the head; move lenses, bridge and ear stems nearer the corresponding eye plane. No appearance recipes, unlock IDs or user data change.
- **Verification contract:** `tests/avatar-cel-eye-depth.test.mjs` tests human body/expression combinations plus supported fitting-frame examples. The existing GitHub Actions synthetic member preview captures front, three-quarter and profile faces; compare the new screenshot with the previous release from identical fixtures. Technical CI status belongs to the actual PR SHA, not this note.
- **Remaining art work:** the head, beard silhouette, body/pose shapes, costume joints and pet performances still require artistic review. A geometry fix and a green screenshot-generation test alone are **not** final style approval. Compare a direction-specific hand-painted 2D/2.5D alternative to the current WebGL body rig before a much larger renderer rewrite.
- **Privacy and publication:** previews use synthetic members only. Real logged-in cross-member saves and trading remain separate acceptance requirements; do not imply they occurred.

## Artist comparison gate | November 15, 2026 | PR #38

- Existing Chromium/WebKit contact sheets compare the same actor at 0°, 45°, 90° and rear views. The 3D rig retains better fitted clothes, props, painted sets and live pet actions; the current authored 2D fallback uses simpler linework and direction-specific shapes but less detailed scenery. Neither is judged universally better without the same-view pixel evidence.
- The in-Studio **Camera → Layered 2D** control is a **preview-only experiment**. It must never change the saved recipe, member ownership, reward grant, pet bond, game progress, or server data. Default remains the original 3D view. Switching keeps camera angle and zoom.
- Source art for future original cartoon figures should emphasize expressive brow/eyelid shape, clear negative space around mouth/chin, sharp but restrained ink contours, and separately authored front/three-quarter/profile face silhouettes. The late-1960s limited-animation reference uses segmented cels and consistent model sheets; do not import unlicensed characters or images.
- **Next decision gate:** compare six expressions across representative original human, robot, monster and pet designs, including glasses/beards/clothes at 64 px and face crop, iPhone and desktop, before considering a hybrid 2.5D head/body renderer. Do not replace existing 3D mounts until all wearable/reward/action tests pass.
- Visual review and real signed-in family-user persistence remain distinct acceptance gates; a passing synthetic test is not either approval or live-user proof.

## Direction-specific facial acting experiment | November 15, 2026 | PR #39

- **Observed defect:** several saved expression choices changed little besides the mouth in the direction-specific 2D fallback, while 3D laughing eyes still used flattened oval spheres. The first 32-view QA failed because the new contact-sheet loop destructured `columns.entries()` incorrectly and handed the renderer an entire column tuple in place of its numeric angle. Browser diagnostics confirmed zero valid front-view fingerprints. The loop now correctly unpacks each `[label, angle, renderer]` tuple and computes 2D crops from each projected head, with repeated-expression diagnostics retained; the corrected result still requires visual inspection.
- **Implemented:** `avatar-expression-acting.mjs` defines distinct eye openness, asymmetric brows, gaze and brow-end cues for all eight **existing** expression IDs. The 3D face, 2D turnaround head and original 2D portrait renderer share these pure acting poses. Laughter uses intentional ink crescents, not small pupils. Neither stored recipes nor member rewards change.
- **Visual evidence:** the Chromium browser QA now captures `avatar-workshop-expression-model-sheet.png`, showing eight expressions in both 3D and 2D at front and profile. The 2D camera uses its native head crop, while 3D uses the existing high-zoom face framing. The test reports exact repeated-expression groups and preserves the image artifact on failure.
- **External art reference:** contemporary production-cel listings show hand-painted character layers and separately painted paper backgrounds. Study the period division of bold outer shapes, minimal fill shading, small controlled pupils and raised brows for acting reference only. All production character geometry in this repository remains original; no external cel/sprite was imported.
- **Required acceptance:** unit and release checks, Chromium and iPhone WebKit fixture checks, six face shapes with full/sleepy/laugh/wink expressions, pet/gear compatibility and manual comparison at both face crop and 48–64 px. Passing CI does not by itself confer artistic approval; if the new sheet is visually weaker, keep this PR unmerged as `ART PENDING`.
- **Explicitly excluded:** rejected PR #37 beard geometry, new expression schema values, Supabase changes, family account writes, copyrighted original assets and all paid dependencies.

## Mouth acting at message-board size | November 15, 2026 | PR #40

- **Problem:** the original 3D and layered-cel `smile`, `grin` and `smirk` differ at face-crop scale but can collapse into similar expressions at 48 px. That weakens the eight-pose Studio update from PR #39.
- **Implemented in branch:** original mouth shapes with three genuinely different visual signals: *smile* is a closed rising curved line, *grin* is a wide open shape with a bright tooth strip, and *smirk* lifts just one corner and one cheek. 3D cheek shading is fitted to the existing face plane; 2D front, profile and portrait mouths get matching direction-aware shapes.
- **Regression evidence:** the synthetic Chromium image collector captures `avatar-workshop-mouth-legibility.png` at **actual 48 px and 64 px**, with side-by-side 3D and 2D previews, and rejects exact duplicate thumbnails. All existing reward IDs, family permissions and saved avatar recipes are untouched.
- **Honest gate:** exact pixel uniqueness is a minimum, not artistic approval. Reject if any mouth floats off the face, appears as a pasted sticker, overlaps glasses/beard, or remains unreadable when viewed at normal icon scale. Preserve the older baseline until CI and visual comparison are good.
- **Next isolated action:** prototype a painted, jaw-fitted beard mask in a separate branch, not PR #37's floating cheek strokes; do not merge old PR #37 without replacing its rejected geometry.

## Painted full-beard mask | November 15, 2026 | clean release PR #42

- **Observed:** the unmerged PR #37's explicit beard ink tubes extend onto bare cheek in the side and quarter views, producing pale disconnected slashes. Unit coverage alone previously missed that artistic regression. Preserve PR #37 as rejected/draft historical evidence.
- **Redesign:** replace the 3D full-beard contour tubes with **one continuous fitted jaw shell**. All shadow, edge ink and reflected hair colors are interpolated as vertex paint *on the same surface*. This removes the possibility of raised detail strokes floating in front of skin. The upper center edge is indented below the lip and its six rings remain non-crossing through the full 3D turn.
- **3D release tests:** `tests/avatar-painted-beard-mask.test.mjs` tests six supported human face shapes, smile/grin/smirk, vertex color completeness, six ordered rings, no `studioPart` selection hijack, and preservation of stubble, goatee, moustache and clean-shaven variants.
- **Visual proof:** the browser contact sheet `avatar-workshop-beard-masks.png` must display six faces × three turns with 3D/2D comparisons. The second sheet `avatar-workshop-beard-mouth-compatibility.png` compares a bearded smile, broad toothy grin and one-sided smirk at front, 45° and profile to detect lip occlusion. Compare directly against both the successful released beard from PR #36 and the rejected PR #37. Judge the *connected silhouette* and lip/cheek transitions, not just the presence of dark geometry.
- **Publication boundary:** After PR #40 passed CI and visual review and was squash-merged, the painted beard change was re-applied to a fresh branch from the exact released `main` commit. The earlier stacked PR #41 is superseded by the clean release PR #42. Do not affect any family saves, reward IDs, pet rights or Supabase data.

## Beard colors when WebGL is unavailable | November 15, 2026

- The beard mask uses a white base material tinted by vertex colors. The software renderer skipped those colors and drew the whole mask in light gray, even when the selected hair color was brown or auburn.
- The software renderer now blends adjacent vertex pigments in linear color space before applying cel lighting and converting to sRGB. The same jaw contour, mouth opening and beard color selection apply in both rendering modes.
- The regression test checks tinting and interpolation on the software renderer. The browser test disables WebGL and samples the painted jaw on brown, auburn and silver beards. Its comparison is saved as `avatar-workshop-software-beards.png`.
