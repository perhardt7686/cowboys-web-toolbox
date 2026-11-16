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

## Matching turn direction in 3D and layered cel | November 15, 2026

- At the same three-quarter or profile angle, the 3D character faced the opposite way from the layered-cel drawing. The turntable's angle label and zoom were correct, but switching modes reversed the visible pose.
- Avatar and companion 3D stages now use the same rotation direction as the layered artwork. The browser test checks the visible cheek position on right and left turns and saves `avatar-workshop-turn-direction.png` for review.

## Curious and Wink across both previews | November 15, 2026

- Curious showed a closed smile in 3D and a rounded gasp in layered cel. Both modes now share a slightly parted mouth contour. The 3D contour follows the same cross-sections as the head surface, and the raised brow follows the cel's left-to-right pose.
- Layered cel closed the opposite eye in profile because it used the turn direction as the visible eye's side. The right and left profiles now use the eye that is actually visible from that direction.
- The browser test measures the open mouth in a 3D close-up and checks the visible open/closed eye at both profile angles. Its comparison is `avatar-workshop-expression-continuity.png`.

## Painted beard transition cleanup | November 16, 2026

- **Observed:** The single vertex-painted beard mask compressed its final two jaw rows to 0.008 model units at the front mouth notch. At small portrait sizes, the transition could become a hairline even though the geometry did not technically intersect.
- **Scoped repair:** Move only the second-highest beard row down by 0.012 units, leaving the mouth notch, colored mask, six head families, legacy beard option IDs and other facial hair untouched.
- **Verification gate:** The existing 6-face × 3-expression × 41-angle ring test now demands a minimum 0.012-unit space. Inspect `avatar-workshop-beard-masks.png` and `avatar-workshop-beard-mouth-compatibility.png` from the member preview for lip visibility and smooth chin shape. These snapshots are test evidence, **not owner art approval**.
- **Branch hygiene:** PR #37 contains an obsolete floating cheek-stroke treatment and conflicts with later vertex-painted face work. Do not merge that PR onto current main as-is. Retain it only as historical evidence of the original complaint; improvements must preserve the single fitted painted mask.
- **Next ranked art work:** (1) face/expression silhouette quality at 48/64 px with Cowboy's feedback, (2) extreme body/wardrobe socket fitting across every view, and (3) non-generic pet motion matched to species and accessories. All must preserve historical recipes, rewards, ownership and protected family data.
- **Release gate:** This note documents PR #51 work in progress; final merge/deployment and real signed-in acceptance must be established from GitHub Actions and an authorized session, not asserted from this document.

## Robot silhouette distinction | November 16, 2026

- **Observed baseline:** the nine-starter synthetic `avatar-face-silhouettes.png` sheet from successful main run `43867078519` shows the automaton, radio courier and scout sharing similarly proportioned rectangular face screens, paired round eyes and grill mouths. Colors and antennas help, but they do not read as three confidently separate original cartoon designs at message-board size.
- **Implemented in branch:** all three retain their established recipe/model IDs, face data, rewards and equipment. Radio receives broad tuning wings and twin aerials; scout receives raised survey scope fins; automaton receives a compact pressure-gauge roof and bolt pattern. Features are modeled as child geometry in the 3D head with **no** editor/gear-selection ID, and painted as direction-aware original shapes in layered cel.
- **Visual evidence gate:** Chromium sheet `avatar-workshop-robot-silhouettes.png` renders front and 90° profile in both engines, plus true 48/64 px portraits. The companion `avatar-workshop-robot-hat-fit.png` compares ordinary fitted caps over all three heads in both renderers, at front and profile. Compare at the same crop with main. Reject if fins clip the hair/hat or stage, reverse sides, cover eyes or become featureless blobs at small size. Passing geometry tests alone is not artistic approval.
- **Node test:** `tests/avatar-machine-head-signature.test.mjs` checks all three signature rigs, distinct geometry widths, original saved recipes unchanged, and the absence of mechanical accents on people, monsters and armor.

### Edward recommendations loop after the robot silhouette pass

1. **Most valuable and implemented:** stronger distinct robot head silhouettes in every renderer, supported by near-identical initial profiles. Benefit: children can identify the three starter robots without relying on costume color. Effort: small/moderate, cost $0, limited art-fit risk. Verify with 3D/2D contact sheets and automated silhouette bounding boxes.
2. **Next:** reconcile human and monster head-to-body proportions in 0°, 45°, 90° and back, especially the detective's unusually narrow face and stiff shoulder/arm acting. Benefit: characters look less primitive and more hand-drawn. Effort: high, $0 service cost, substantial wardrobe and eyewear collision risk. Verify on all nine starters with 48/64 px, glasses, beard, hair and cape model sheets.
3. **Then:** expand automated wardrobe/pet socket contact sheets across extreme builds and poses, protecting older earned attachments. Benefit: fewer clipped outfits, detached props and inaccessible unlockables. Effort: moderate, $0 service cost, CI run time and false-positive risk. Verify in Chromium/WebKit with saved recipe replay and selective manual art signoff.

- **Contact-sheet regression and correction (November 16):** the first 3D/2D cap-fit sheet showed radio antenna rods and scout survey fins piercing a plain cap, even though the unit and initial browser suites passed. Hat presence now suppresses/retracts the high accents on both engines, replacing them with low, fitted side/gauge markings so the robot still reads in a hat. The logic uses the current selected recipe/equipped-hat state; no saved values or catalog IDs change. A dedicated cap/no-cap bounding-extent test now guards the 3D signature rigs.
- **Release decision:** review the new `avatar-workshop-robot-hat-fit.png` from the corrected commit before merging. An unrelated family-avatar Hair-tab click check intermittently timed out during the same CI sweep; retain that failure in the audit and do not erase or weaken the existing UI test. Repeat failure requires a separately evidenced UI repair. Only passing relevant checks and acceptable visual pixels allow publication.
- **Acceptance boundary:** this is a synthetic art/geometry pass, not evidence of real signed-in avatar save or cross-member sync. Preserve protected family records, game state, pet ownership and rewards. The previously rejected PR #37 remains out of production.

## Human and monster proportions | November 16, 2026 | post-robot head silhouettes

- **Observed visual baseline:** the successful synthetic nine-starter portrait sheet showed the detective's long, extremely narrow head disproportionate to the neck and upper torso, even after the eye and mouth improvement. Head-tilt posing changed the head angle but left the two arms in near-static positions; this does not read as a coherent character pose.
- **Human head correction:** narrow the mismatch conservatively. The saved `long` face choice remains the same ID, but the original 3D face rings widen from `.91` to `.97` scale and reduce head height from `1.13` to `1.055`; the layered-cel face changes its width/jaw/ending values from `[30,16,88]` to `[32,22,82]`. Detective-specific 3D head scaling is reduced to `.99 × 1.015 × 1.00` from `.93 × 1.055 × .98`. This affects rendering only, never saved loadout or entitlement schemas.
- **Pose correction:** head tilt now also produces a small asymmetrical elbow and hand gesture for unencumbered human/monster arms in 3D and layered-cel turnarounds. Preserve props and their hands first, plus all mechanical robots/armor and the existing wave pose. Use the same pose names and no added user-data fields.
- **Review gates:** test the original detective at angles 0°, 45°, 90° and back, normal round glasses, exposed eyes/hair, necklace, cap and profile; compare 48/64 px facial legibility. Inspect the brand-new `avatar-workshop-human-proportions.png` and `avatar-workshop-human-poses.png` contact sheets. Reject if the head loses deliberate stylization, collides with glasses/hair, the arm intersects the torso, or two-dimensional poses conflict with 3D.
- **Unit protections:** `tests/avatar-human-proportions-and-pose.test.mjs` checks head scale, 3D hand shift bounds, projected 2D tilt across four angles, saved recipe immutability and unmoved mechanical limbs. This is synthetic QA, not a claim of family-account session signoff.
- **Next three recommendations:** (1) implement subtle eye-level compensation for extreme eyewear and side-angle noses if the contact sheet shows overlap; (2) extend the collision review matrix to hats, rare hair unlockables and broad outerwear on all six human face shapes; (3) review coherent shoulder/hip gesture staging in the 2D and 3D renders rather than adding more face decorations. Each is cost $0 but raises collision and ongoing test-maintenance risks; require before/after contact sheets and mobile-browser checks before any change.
