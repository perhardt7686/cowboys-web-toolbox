# Sacred Three UX and contrast audit
Date: 2026-11-13 · Scope: Cowboy's Web Toolbox (public), Commons message board (approved members), Cowboy's Core (private, separate deployment).

## What was inspected
- User-provided iPhone screenshots of the Commons reply cards and forum index/filter chips.
- Live GitHub source on `perhardt7686/cowboys-web-toolbox`: HTML, canonical Toolbox page template, `build.py`, CSS cascade, game stylesheets, forum filter creation, actual selected-state attributes, README/tests, and CI/deployment configuration.
- Current 2026 UX and accessibility reference material (see links below).
- The Core site is NOT in the Toolbox repository; access to Core's authenticated front-end/source was unavailable. No private Core records, member access, account permissions, or Supabase policies were changed.

## Conclusions and design direction
**Keep the established Cocodrilo black/plum/violet identity.** Emulate familiar usability patterns, not proprietary pixel-for-pixel templates. A layered, task-first navigation structure best fits a diverse catalog plus community plus private working dashboard:
1. **Toolbox:** large search field; three obvious entry routes; compact cost/device/account filters; comprehensible result counts and sortable cards; readable metadata; clear primary 'Open' actions.
2. **Commons:** familiar search + sort; visible filter chips with explicit pressed state; near-result counts; cards with high-signal titles; dependable mobile touch targets; responsive action toolbar; a coherent thread reader.
3. **Core:** high-priority 'Today'; library/search; upcoming calendar and priorities; activity/notes, private provenance and freshness cues. This is a recommendation for the separate authenticated Core app, **not** a deployed Core change.

The implementation uses existing semantic controls and native HTML/CSS. A full conversion to React, Tailwind or shadcn would introduce dependency/cost/maintenance risks without addressing the observed cascade conflict. shadcn/ui's July 2026 announcement explicitly supports keeping existing mature Radix installations; its default for new projects is Base UI. No new dependency was added.

## Shipped source changes
### Commons (GitHub Pages)
- `docs/commons-message-board-contrast.css` loaded LAST by `docs/community.html`, version `contrast1`.
- Fixed the screenshot's pale-on-light filter bubbles in `#lab-filters`: ivory buttons/plum text; selected plum/white buttons with check glyph; pressed-state semantics preserved; 46 px minimum touch height.
- Repaired `#forum-toolbar` quick actions, including Power House, Member Directory, unread topics and read-marking, with visible light buttons/dark labels, selected states, and two-column mobile layout.
- Fixed `#feed-count` and refresh control color; increased contrast for category navigation and thread badges.
- Preserved prior reply-card/metadata repairs, permission checks, game interfaces, calendars, and owner-only controls.

### Toolbox (GitHub Pages)
- Added `docs/toolbox-clarity.css`, linked AFTER `toolbox-depth.css` on homepage.
- The same link is in canonical `index.template.html` so future `python3 build.py` releases do not wipe it.
- `build.py` inlines the sheet into the standalone HTML preview.
- Repaired search text/placeholder, map and starter cards, chip states, tabs, result labels, card descriptions, metadata, outbound buttons and favorites; scoped to `body.toolbox-page`.
- No catalog items, saved favorites, pricing, search logic, user accounts or images were changed.

## Contrast calculations (static, fixed color pair examples)
WCAG 2.2 AA text minimum is generally 4.5:1, non-text UI component contrast 3:1. Some measured examples:
| Pair | Ratio |
| --- | ---: |
| Commons default filter #392449 on #fffaf2 | 13.27:1 |
| Commons selected filter #fffaf2 on #502568 | 11.19:1 |
| Commons toolbar text #452458 on #fff7eb | 12.00:1 |
| Commons result count #442852 on #e8f4e6 | 11.08:1 |
| Toolbox card description #f0e5f4 on #291c36 | 13.11:1 |
| Toolbox default category chip #fff5fa on #3b284a | 12.40:1 |
| Toolbox selected chip #25192f on #f2cf8f | 11.20:1 |

These are **static CSS pair checks, not proof of complete WCAG conformance**, because gradients, user-defined profiles, browser zoom, actual fonts, overlays, and keyboard operation need rendered-page testing.

## Test and production verification
- `tests/sacred-three-ui.test.mjs`: checks filter/toolbar states and ratios; Toolbox card/tag/tab ratios; source template and HTML link persistence; scoped selectors; motion/forced-color rules and stylesheet block balance. Existing `tests/commons-contrast.test.mjs` covers prior thread-reader checks.
- GitHub workflow `Toolbox release and weekly review` automatically runs `python3 build.py`, `npm test`, Edge checks and release verification on main; check the latest run before asserting overall pass.
- GitHub Pages deploy has its own build workflow; a source commit does NOT alone prove live Safari display.
- Authenticated member flow, browser zoom at 200–400%, VoiceOver, actual filters in Safari and game controls are outstanding manual/browser checks.
- Core: no authorized site source/editor was located in the accessible GitHub owner repos or the Replit listing. Private sign-in not attempted and the Core app is untouched. A future Core upgrade requires its actual source/editor or access in Work mode.

## Current standards and releases researched
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C understanding of minimum contrast: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- UK Department for Work and Pensions filter research, updated 2026: https://design-system.dwp.gov.uk/contribute/filters/summary
- Department for Education filter pattern for desktop vs. mobile: https://design.education.gov.uk/design-system/components/filter
- GOV.UK Design System, including its Oct 2026 v6.6.0 release notice: https://design-system.service.gov.uk/
- Nielsen Norman Group mobile usability report: https://www.nngroup.com/reports/mobile-website-and-application-usability/
- shadcn/ui July 2026 Base UI default and explicit no-migration guidance: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default

## Remaining follow-through
1. Verify the latest Github Actions test run and Pages deployment for the shipped commit.
2. View the Commons selected and unselected filters + board toolbar on an approved member's iPhone, preferably after a true reload; check no CSS cache issue.
3. Validate Toolbox filter, tab, navigation, and search at small widths, landscape, zoom and keyboard navigation.
4. Only after Core editor/source access: audit Today/Library/Ahead/Notes, owner-only provenance/timestamps, cards/chips/empty/error states, responsive layout, accessibility and private visibility.
