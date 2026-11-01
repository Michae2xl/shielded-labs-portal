# Projects, Code activity, Milestones and Team & community

Local implementation and browser review, 28 October 2026. No production publication.

## Changes

- Projects: fluid two- or three-column collection, consistent card footers and arrows, named project menu first. Project records use a full-width introduction and progress strip, balanced purpose/scope, and responsive resource, milestone and commit cards. Related milestones, commits and repositories open inside the portal.
- Code activity: contributors first, consistent avatar cards, visible repository cards (four across at wide desktop), responsive commit cards and a contained, horizontally scrollable heatmap. Contributor, repository and commit records now have direct internal URLs. Original source links and data boundaries remain available.
- Activity URLs retain period, view mode, repository, author, query and heatmap selection through detail navigation and reload. Filters use replace-state; opening a record uses push-state.
- Milestones: chronological cards with consistent dates, category/project labels and direct details.
- Team & community: aligned portrait/role cards, responsive related-work cards and internal community records. Returning from a record preserves its originating directory filter, including All.
- Narrow project and directory menus use aligned two-column options. Cards follow the available content width instead of fixed page margins.

## Verification

- Production build and TypeScript succeeded.
- Targeted ESLint: no warnings or errors.
- Development navigation and evidence tests: 2 suites, 8 tests passed.
- Browser review: 41 checks passed, recorded in `work-areas-browser-review.json`.
- Widths inspected: 1686, 1440, 1024, 390; project detail also checked at 320 CSS pixels. All checked pages stayed within the viewport. Heatmap scrolling is confined to its own region.
- Exercised all six project menu destinations, project FAQ/milestone/commit links, contributor and repository records, record reload, filter/cell restoration, community and team return paths, fork opt-in, and heatmap arrow-key movement.
- Checked adjacent governance overview. No browser console errors observed during the review.

## Scope of evidence

Activity counts remain bounded observations, not complete contribution or performance metrics. Commit records expose observed title, author, timestamp, hash and repositories; full file changes remain at the original GitHub source. Fork inheritance and unlinked identities remain explicit. Team and security attribution data were not rewritten.

## Visual evidence

- `work-areas-projects.png`
- `work-areas-project-detail.png`
- `work-areas-project-mobile.png`
- `work-areas-activity.png`
- `work-areas-milestones.png`
- `work-areas-team.png`
