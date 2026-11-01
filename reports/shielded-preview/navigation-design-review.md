# Navigation design review — 28 October 2026

Scope: the shared portal navigation and removal of demo-facing copy. Applied
`frontend-design` and the visual-audit mode of `design-system` to the existing
monochrome design. Scores below are qualitative design judgments, not automated
accessibility certification.

| Dimension | Score / 10 | Applied change and evidence |
| --- | --- | --- |
| Color consistency | 9 | Existing black, charcoal and silver palette; selected row has one restrained surface. `src/app/shielded-preview/portal-navigation.module.css:18` |
| Typography | 8 | Primary links use 14px text, distinct from small group labels; original wordmark retained. `src/app/shielded-preview/portal-navigation.module.css:10` |
| Spacing | 8 | Shared 12px link padding, 24px group separation and aligned icon/text columns. `src/app/shielded-preview/portal-navigation.module.css:13` |
| Component consistency | 9 | One link renderer and one 20px SVG family for all seven destinations. `src/app/shielded-preview/portal-navigation.tsx:64` |
| Responsive behavior | 9 | Labeled menu replaces the former icon rail and horizontal strip below 901px. `src/app/shielded-preview/portal-navigation.module.css:24` |
| Dark treatment | 9 | Intentionally monochrome navigation, matching the portal's fixed dark presentation. `src/app/shielded-preview/portal-navigation.module.css:1` |
| Motion | 8 | Short color/surface transitions only; reduced-motion preference disables them. `src/app/shielded-preview/portal-navigation.module.css:35` |
| Accessibility | 8 | Real links, current-page state, expanded state, keyboard focus, Escape and focus return. Screen-reader end-to-end audit remains a separate check. `src/app/shielded-preview/portal-navigation.tsx:38` |
| Information density | 9 | Ecosystem governance and organizational work are grouped separately; repeated status decorations and demo branding removed. `src/app/shielded-preview/portal-navigation.tsx:80` |
| Interaction polish | 8 | Selection closes the compact menu and moves focus to content; outside clicks also close it. Search recognizes the former Development/People labels. `src/app/shielded-preview/portal-navigation.tsx:56` |

## Existing elements reused

- Original shield and wordmark, without additional decorative art.
- Native SVG icons with the same stroke and sizing; ballot, folder, commit
  branch, timeline and people shapes reflect the destinations.
- Existing project filters, full record pages, source context, contributor
  avatars and development heatmap remain available through direct navigation.
- Existing content type and charcoal selected states informed the new menu;
  no new font, UI library or animation dependency was added.

## Copy cleanup

Removed Built on OpenZcash, Internal preview, Internal design preview, and the
demo notice in Sources. The browser title is now Shielded Labs · Governance &
Research. Website suggestions use Available here, Related pages and Planned
integrations. Genuine research/prototype states, proposed work, dates and source
attribution retain their meaning. Runtime gating and publication settings were
not changed by this visual cleanup.

## Verification

- All seven destinations, active links, direct Crosslink details and browser
  Back were exercised. The Development search alias opened Code activity.
- Tested 1440, 1024, 768, 390 and 320px widths without horizontal document
  overflow. The last navigation entry remained visible at 1440 × 600.
- Compact-menu selection, outside click and Escape close behavior were checked;
  Escape restored focus to Menu. Labels remain visible when the menu is open.
- Checked the Sources dialog and both a website suggestion and delivery details
  for stale demo copy. Proposed integrations remain identified as planned.
- Focused ESLint, TypeScript and the optimized build passed. Screenshots:
  `navigation-desktop.png` and `navigation-mobile-320.png`.
