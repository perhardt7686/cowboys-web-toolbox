# Shared three-line navigation, 14 November 2026

Scope: Cowboy's Toolbox (\`docs/index.html\`) and the Commons/Message Board (\`docs/community.html\`). Street Rod remains untouched.

- Both pages load \`unified-nav.css\` and \`unified-nav.js\` and present the same large three-line menu, readable page title, purple/cream dropdown, and touch targets.
- Toolbox menu navigates to its collection, starter guides, Commons, and member-only game deep links.
- Commons menu offers real post creation, Toolbox navigation, and the already-existing games. No duplicated gameplay or scorekeeping is introduced.
- The original header links remain present as a no-JavaScript fallback. Existing account actions and language switcher are *moved*, not cloned, into the dropdown, preserving event listeners and IDs.
- Community authorization and board visibility are checked before launching any game; member-only content is never exposed by navigation.
- The \`#open-<game>\` deep link stops checking after eight seconds and launches only an approved, available game. It never bypasses authentication.
- Do not put fabricated counters in the UI. Real scoreboards remain inside their games.
- GitHub Pages deploys from \`docs/\`. \`index.template.html\` is the source for regenerated \`docs/index.html\`; \`build.py\` inlines the assets into the offline preview.
- Test on iPhone Safari in signed-out and approved-member states after GitHub checks complete.
