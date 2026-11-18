# V8 Avatar Studio replacement: original-cartoon pilot
**November 18, 2026. Owner review required for visual fidelity.**
**Scope:** isolated, static, read-only engineering pilot under docs/avatar-v8-pilot.html.

## Why this exists
The previous studio accumulated multiple 3D/geometric renderers and extensive responsive overrides. User feedback: avatars, controls, pets and unlockable artwork feel clunky. Rather than making another corrective layer, this pilot tests whether original authored 2D/2.5D vector art, one common stage and one editing surface produce a visibly better feel.

## Demonstrated and NOT demonstrated
**Implemented in this pilot:** original SVG human/machine characters; face/hair/palette options; front/profile/back modes; two species-specific illustrated companions; local hello/play motion; twelve established reward IDs with original drawn icon illustrations; compatible try-on and single-slot replacement; outfit/character/pets/rewards sections; phone/desktop layout; undo/redo/reset; export of explicitly demo-only JSON; input and keyboard semantics; reduced motion support; no external font/script; one-click removal of preview outfit.

**Not yet implemented:** full artwork for every established prize, complete 1969–70 model-sheet fidelity, authentic 360-degree turnaround, finished pet/trade/bond experience, authoritative account-dependent owned/locked status, existing profile recipe import, persistent outfits, server-side saved profile edits, an authenticated family-member acceptance test, or rollout to the current member Studio. Three camera modes here are authored views, not a proven multi-angle rig.

This pilot has **no imported TV art**, no third-party font or remote script, no personal profile or child data, no Supabase RPC and no persistent write. The public path must remain a demo until a separate approved-member adapter passes its own security review. Item IDs represent known existing catalog entries; illustrated labels/art are prototype illustrations, not claims of perfect historical award reproductions.

## Open-source model decision
Candidate | Benefit | Constraint / current decision
---|---|---
[Character Creator](https://github.com/jamangi/Character_Creator) | MIT modular slots, recipes, layered sprite engine and UI; CC0 starter pack | 0.1 Studio iframe has no documented cross-origin recipe sync. Native package integration needs import adapter, schema validation, assets and possibly CSP restrictions. Adopt its **versioned recipe/slot architecture** as the direction; no dependency imported into this pilot.
[OpenBone](https://github.com/UXCentury/open-bone) | MIT skeletal 2D animation with state machines and pet motion | Larger runtime and new art rigging effort. Do not add until measured on iPhone with a species-specific pet.
[PixiJS](https://pixijs.com/) | Stable renderer for layered sprites and effects | Not a creator; adds weight without solving missing art. Defer pending rendering performance proof.
Current production renderer | Known save paths, owned items, member history | Preserve as the fallback and source of existing recipes, NOT the permanent visual target.

## Pilot inventory
- Character families: human mystery sleuth, midnight automaton
- Pets: studio-rain-hound, studio-tower-gargoyle
- Twelve authentic catalog identifiers, including: viking-battle-helmet, studio-observatory-coat, studio-observatory-telescope, studio-rain-cape, studio-rain-boots, studio-workshop-visor, studio-workshop-gloves, studio-tower-cape, studio-backlot-glasses, studio-backlot-flashlight, studio-rain-hound, studio-tower-gargoyle
- **Catalog entitlement is never implied by inclusion.** These IDs are for safe artwork and compatibility demonstrations, and not unlock grants.

## Rollout gate and next implementation work
1. **Green technical gates:** Node state tests; Chromium phone and desktop render, interaction, no horizontal scroll; screenshot artifacts; no runtime exceptions; accessibility and reduced motion checks. Re-run on latest branch head and post-merge main. Never bypass a canceled or red required check.
2. **Art quality:** Compare 48/64 px portraits, full body, 3 authored angles and action clips with owner's eight actual reference plates when available. Improve ink line hierarchy, jaw/hair signatures and emotional acting without copying protected characters.
3. **Fitting quality:** Build a versioned asset manifest and named sockets for every existing reward: head, eyes, neck, shoulders, chest, arm, hands, hips, legs, feet, back and companion space. Validate all body families and angles with rendered contact sheets. No floating, intersecting or clipped pieces.
4. **Pet quality:** Animate species-specific walk, play, idle and affection; add bond UI that reads authoritative server state only in private member integration. No local fake achievements. Integrate trade under existing row-level security, do not rewrite ownership.
5. **Rewards:** Reillustrate all established items through a prioritized asset pipeline while preserving exact IDs, required achievements, ownership and incompatible states. Showcase each reward on a real equipped character and in an isolated collection card.
6. **Account adapter:** Implement read-only normalized legacy recipe mapping first. Only later wire server saves through existing authorized session and RLS, with explicit Saving/Saved/Error and rollback. Test with synthetic accounts; never silently migrate production records.
7. **Family acceptance:** Compare existing and new editors on real iPhones with Emma and Elliot. Record tap counts and completion rate for make character, preview award, find pet, remove item, save. Require that V8 wins clarity and artistic quality, not just unit tests, before switching the public family member entry.

## CI and rollback
- PR workflow: .github/workflows/avatar-v8-pilot.yml.
- Browser evidence: reports/avatar-v8-iphone.png and reports/avatar-v8-desktop.png, uploaded as workflow artifact.
- Current production pages and family member state remain untouched by this branch.
- Rollback: remove demo files and workflow, or leave pilot unlinked. No DB rollback required.
- Budget: $0 new services and no purchase authorized.

**Acceptance state:** engineering pilot submitted for review, NOT a completed full V8 conversion or proof of live-user fidelity.
