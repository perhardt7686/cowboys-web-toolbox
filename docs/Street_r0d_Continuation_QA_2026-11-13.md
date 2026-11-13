# Street r0d Racing · continuation after original chat limit

**Date:** 2026-11-13 (America/New_York)
**Repo:** `perhardt7686/cowboys-web-toolbox`
**Main source:** `docs/community.html` and `docs/commons-streetrod-*.mjs`

## Purpose and preservation
Continue Cowboy's independently drawn Street Rod (DOS, 1989; summer 1963) homage with original 320×200 EGA artwork, a functional saved garage and mechanics, summer campaign, junior mode, multiplayer and reliable browser operation. Do **not** reset the shared Commons racer records, credits, achievements, vehicles, family calendar or other games. Public IP material and original binaries are not distributed.

## Continuation commits
- `14f91447`: correct the game's 320×200 image geometry from erroneous 4:3 to **8:5**.
- `3a01872e`: improve procedurally drawn period car roof, wheel, door, belt, grille, and trim geometry across six body families.
- `68281d64`: classify the actual selected vehicle before painting the garage canvas and each catalog/card car.
- `a6e438fa`: cache-bust EGA JS and CSS from `community.html` for iPhone Safari.
- `45d26c62`: Node regression tests cover EGA palette, script syntax, unique silhouettes, scene ratio and preserved game references.
- `22f836a3`: local headless-browser smoke tests for 390px layout, correct ratio, changing car artwork, DOS boot and monitor exit.
- `8270a17a`: wire browser smoke test into GitHub Actions and save a test-only screenshot artifact.

## Confirmed verification
- GitHub Actions **Toolbox release and weekly review**: success for head `8270a17a`.
- GitHub Actions **Commons mobile readability browser check**: success for head `8270a17a`; the new local Chromium Street r0d boot/render smoke checks passed in the job.
- GitHub Actions **pages build and deployment**: success for head `8270a17a`.
- Public Commons page and `commons-streetrod-ega.mjs?v=dos6` were fetched successfully from GitHub Pages after the deployment. Source and deployment checks are **not** proof of signed-in race acceptance.

## Still open, do not claim 100% complete
- Actual member-authenticated iPhone Safari walkthrough of full summer garage, individual bolts/torque, diner selection, driving controls, saved credits, and races.
- Two approved-account challenge completion, ranking/awards verification, and graceful recovery after interrupted network requests.
- Full 60-vehicle silhouette uniqueness and per-model vintage-accurate geometry; the new renderer uses six body families plus key-based variation.
- Original police encounter sequences, every original gameplay branch, full vehicle physics coupling, and any pixel-for-pixel reconstruction of protected assets are outside this verified implementation.

**Release position:** Latest static assets are live on GitHub Pages; standard repository and synthetic browser tests pass. The full signed-in experience remains unverified, so this is not 100% live acceptance.
