# Internal preview validation — 25 October 2026

Preview: http://127.0.0.1:4246/shielded-preview

## Automated checks

- Full suite: 275 passed, 9 skipped (database integration prerequisites absent).
- Optimized build and TypeScript: passed.
- ESLint on added files and changed shared files: passed.
- Disabled page and API: both HTTP 404, checked against a separate local process.
- Enabled API: HTTP 200; 218 OpenZcash grant records retrieved.
- GitHub direct API: timeout on this host; all six repository samples correctly
  retained as connector-captured snapshots from 25 October 2026.
- Production scheduler: disabled in the final preview, covered by startup tests.

## Browser checks

- All seven views navigate successfully at desktop and 390 × 844 mobile dimensions.
- No horizontal document overflow across the seven mobile views.
- Project detail dialog: correct purpose, scope, stage, source and target limitations.
- Escape dismisses the dialog and restores page access.
- Search for Epoch returns its project and opens the detail dialog.
- Cryptography filter shows only Ulrich Haböck, Luke Edwards and Suyash Bagad.
- Coinholder filter shows only Coinholder rows in the grant table.
- Selecting sl-orchard reveals the inherited-fork-history warning.
- Source dialog distinguishes observations, grant retrieval and editorial review.
- Source links, commit hashes and grant records point to their primary destinations.

## Screenshots

- `overview.png`: original desktop concept; superseded visually by `overview-v2.png`.
- `mobile.png`: responsive overview, 390 CSS pixels at device scale 2.
- `governance.png`: governance pathways and OpenZcash grants integration.
- `impact.png`: preventive research and shared response attribution.
- `website-evolution.png`: recommended information architecture and improvements.

## Scope

No deployment, commit, push or message to Shielded Labs was performed. Final server
is loopback-only. The preview feature is opt-in and excluded from navigation in the
existing application. Existing OpenZcash pages are linked; they are not all redesigned.
Polling occurs only while the page is open and visible. No scheduled automation or
publishing workflow was created.

The first optimized-server checks triggered the application's existing background
imports against its configured local database. Those processes were stopped; the
final version has an explicit preview guard and disable flag. This is documented
in `docs/shielded-labs-preview.md`. No remote database configuration was used.

## Monochrome revision — local repository-film reference

- Inspected `shielded-labs-light.mp4` at 3, 13 and 22 seconds. Used its black,
  silver and white materials without reusing video statistics as live portal data.
- Replaced the globe with a tiled SVG shield, metallic reflection and animated rim.
- Verified all three animation tracks run, pause and resume through the visible control.
- Verified reduced-motion preference removes animation and hides the redundant pause control.
- Checked all seven views at 390 CSS pixels: no horizontal document overflow.
- Mobile navigation retains visible labels; project search, Escape dismissal and
  Cryptography team filter passed again.
- Full suite: 275 passed, 9 integration tests skipped. Focused lint and TypeScript passed.
- Revised captures: `overview-v2.png`, `mobile-v2.png`, `governance-v2.png`.
- Final optimized build passed after the narrow-screen typography adjustment.
- At 320 CSS pixels, heading client width and scroll width both equal 276px.
- Final Coinholder filter rendered ten Coinholder rows after the source loaded.
- Fork-history warning remains visible when selecting `sl-orchard`.
- Final preview remains bound to loopback with both background-refresh guards enabled.

## Original shield and reading scale

- Replaced the tiled interpretation with the existing original shield asset.
- Hero shield: 190px on the checked desktop viewport, 124px on mobile.
- Reduced animation to a 4px float, retaining pause and reduced-motion handling.
- Increased body copy to 15–17px, desktop controls to 14px, supporting labels to 11–14px.
- Increased contrast and line spacing; mobile search has its own row.
- Optimized build and TypeScript passed; shield component lint passed.
- All seven views checked at 390px with no horizontal document overflow.
- Captures: `overview-original-shield.png`, `governance-readable.png`, `mobile-readable.png`.

## Dedicated project pages

- Removed project modals. Cards are links with directly addressable query URLs.
- Server renders the selected view/project on direct load; browser back/forward
  synchronizes the workspace and selected project.
- Redesigned detail pages with a project masthead, status strip, section navigation,
  source-linked timeline, next step, relevant repository activity and source sidebar.
- All six project pages checked at 390px: no document overflow and no open dialog.
- Crosslink direct reload, next-project navigation, browser back/forward, return to
  the project list, global search and Progress anchor passed in browser checks.
- Production build, TypeScript and focused ESLint passed.
- Screenshots: `project-crosslink.png` and `project-mobile.png`.

## Embedded governance workspace

- Seven internal sections: Overview, Proposals, Voting, Grants, ZCAP, Insights,
  Results. Records open as full internal pages with query URLs and browser history.
- Source refresh verified: 753 local published proposal records, 24 public review
  entries, 218 grants, 913 grant-program payment rows, 202 public ZCAP names,
  and 37 Q3 ballot results. Public datasets fetched successfully; proposal history
  explicitly remains a local mirror rather than a claimed live public queue.
- Browser interactions checked: grant program/search, exact-name milestone detail,
  record reload, result outcome filtering, result-to-application navigation and
  browser back, committee election detail, proposal history/status filters,
  ZCAP member search, abstention denominator change, network-upgrade detail.
- All seven sections checked at 390px: document width remains 390px, no open
  dialogs. Wide record tables scroll inside their containers.
- Exact-integer comparison arithmetic, strict quorum/majority rules, stable ballot
  IDs, paid-only aggregation, missing values, schema validation, source failures,
  refresh coalescing, partial-ledger rejection and disabled routes covered by tests.
- Full suite: 285 passed, 9 database integration tests skipped. Focused ESLint,
  TypeScript and optimized production build passed. A later missing-ZEC annotation
  change also passed focused metrics tests; final build rechecked TypeScript.
- Missing source amounts are explicit: four paid entries lack ZEC values and are
  excluded from the known-ZEC total. Paid USD is recorded budget value.
- Local preview only; background import guards remained enabled. No deployment,
  vote submission, import or database mutation was performed in this iteration.
- Final build passed. ZCAP also checked at 320px without document overflow.
  Adjacent Projects navigation remained functional; browser error log was empty.
- Final captures: `governance-workspace.png`, `governance-comparison.png`,
  `governance-mobile.png`. The browser is left on the governance overview.

## Continuous reading, original shield without playback controls

- Removed the shield's play/pause UI and state. The original asset now has a single
  four-second decorative float; reduced-motion emulation confirms `animation: none`.
- Removed the separate top preview bar, the home metric strip and the project's
  isolated emblem/metadata columns. Internal-preview identification remains visible.
- Softened section framing throughout the portal; data-table row separators remain.
- Added direct introductory routes and plain-language explanations for all six
  projects. Technical context and terms expand in place; evidence remains available.
- Added an optional governance primer with internal proposal/voting/results links.
  Global search now opens governance subsections; sidebar Governance resets to its
  overview, even when already inside a subsection.
- Browser verified: home-to-results shortcut, search-to-Grants, governance primer,
  project technical disclosure, breadcrumb Home, next-project link and browser back.
- All seven main views and all six project pages checked at 390px with no document
  overflow. At 320px the shield does not overlap the heading; no playback controls
  remain. Browser error log is empty.
- Focused ESLint, TypeScript and optimized production build passed. This was a
  presentation/navigation change; data calculations were unchanged.
- Captures: `flow-home.png`, `flow-epoch.png`, `flow-mobile.png`.


## Development avatars and heatmaps

- Replaced the earlier sparkline and repository sidebar with contributor filters,
  repository cards, a day-by-repository heatmap and a contributor-by-repository
  matrix. Cell selection filters the commit list inside the page.
- Refreshed the saved public GitHub observation at 2026-10-25T22:56:48Z: 548
  repository records before deduplication, bounded to the latest 100 per default
  branch. The 35-day non-fork sample contains 296 unique commits and six linked
  non-automation profiles; the 84-day view contains 348 commits.
- Downloaded 31 public linked-profile avatars as local assets. Visible avatars
  loaded successfully. Unlinked Git author names retain initials and are not
  merged into same-name GitHub accounts; automation remains identified.
- GitHub refresh retains the dated saved observation when the direct API is
  unavailable. The visible state says saved observations, without claiming live
  coverage. Fork history is excluded by default and has an attribution note.
- Automated checks: 24 focused tests passed, covering hash deduplication with
  source retention, fork boundaries, UTC windows, invalid dates, separate account
  and unlinked identities, intersecting filters, fixed heat thresholds, preserved
  public profile metadata and existing provider/access/background-refresh rules.
  TypeScript, focused ESLint and the final optimized build passed.
- Browser checks passed: profile filters, repository cards, combined filters with
  a zero-result state, text search, 35/84-day selection, fork inclusion, incremental
  loading, cell drill-down, arrow-key movement and Escape clearing. The selected
  cell's summary remains aligned with its commit list while focus moves elsewhere.
- Development and both maps fit 320px and 390px viewports without document
  overflow. Wide maps scroll internally and keep row labels fixed. Corrected
  absolute accessibility text escaping the scroll area and the long load-more
  button exceeding 320px.
- Adjacent Home, Crosslink and Governance were checked at 320px. The original
  shield has no playback controls, project updates include contributor avatars,
  and the browser error log is empty.
- Captures: development-heatmap.png, development-contributors.png,
  development-mobile.png. Device emulation was cleared after checks.
- Internal loopback preview only. Both background-refresh guards stayed enabled;
  no database import, deployment, commit, push or external message was performed.

## Alignment and hierarchy checkup

- Centered the header and reading area within the same 1200px maximum width.
  At a 1920px viewport both measured exactly 1200px with matching left/right edges.
- Development summary uses three equal centered columns. Contributor rows are
  balanced; filters share one group; repositories use a compact expandable list.
  All four repository opening actions measured 36×36px in the same x column.
- Removed repeated section labels, instructional paragraphs and duplicate commit
  links. Source limitations and identity distinctions remain under disclosures.
  Shared SVG chevrons rotate for expansion; selects have visible boundaries.
- Governance tabs and figures use even columns. Its primer expands correctly;
  Grants opens a full internal record with the expected URL and no dialog.
- All seven portal areas checked at 390px without document overflow. Development
  also checked at 320px. The final narrow-screen selectors retain their full labels;
  active mobile navigation centers on selection and on entering mobile layout.
  A Projects selection measured less than 0.3px from the navigation center.
- Development interactions verified: linked and unlinked author filters, repository
  filtering, text search, incremental loading, period changes, matrix cell selection,
  arrow-key movement and Escape clearing. Andrew Reece × Crosslink yields 31
  sampled commits; Escape restores 296. The 84-day selection yields 348.
  Searching “pigeon” yields 101; loading more displays 36 of 296 commit rows.
- Automated checks: 24 focused tests passed in six files. TypeScript, focused
  ESLint and optimized production build passed. The final navigation adjustment
  was checked again with ESLint, production build/typecheck and browser interaction.
  Final browser error log was empty.
- Captures: `checkup-development.png`, `checkup-governance.png`,
  `checkup-mobile.png`. Device emulation cleared and Development left open.
- No changes to source records or counting logic. Internal loopback preview only;
  background imports stayed disabled. No deployment, commit, push or message sent.

## Contributor matrix alignment follow-up

- Removed the contributor-only 870px width cap and auto margins. Before the fix,
  the matrix started 71px to the right of its section at the reviewed viewport;
  afterward both start at x=264. The existing 3px scroll/focus gutter remains.
- All four column-header centers match their data-cell centers. Selecting
  Andrew Reece × Crosslink opens the corresponding 31-commit list; Escape resets.
- At 320px, the page remains 320px wide and the 630px matrix scrolls inside its
  276px container. Production build/typecheck passed; no counting logic changed.
- Screenshot: `contributor-alignment.png`. Device emulation cleared and the
  contributor view left open in the local preview.

## Contributors first

- Removed the summary-number strip and its unused styles. Contributors is now
  the first section after the Development heading, followed by Activity and Commits.
- Verified the order in the rendered desktop and 320px mobile views; no mobile
  document overflow. Production build/typecheck passed. Screenshot:
  `contributors-first.png`. Internal local preview only.

## Remove duplicate page introductions

- Removed the visible Development title and its introductory sentence. Contributors
  is now the page heading, with source date and refresh grouped on the same row.
- Projects keeps its page name in the breadcrumb. Its category menu is the first
  visible content block, followed directly by the projects; the repeated title,
  research kicker and description are removed. An off-screen h1 retains semantics.
- Verified Cryptography filters to Epoch and opens its internal full-page detail
  without a dialog. Sustainability filters to NSM; All projects restores the list.
- Development and Projects both remain within 320px without document overflow.
  The mobile category menu scrolls within its own container. Production build,
  TypeScript and focused ESLint passed; no source data or counting logic changed.
- Captures: `projects-menu-first.png`, `development-without-duplicate-title.png`.
  Emulation cleared; Projects left open in the internal localhost preview.

## Direct project selection

- Category buttons now open their corresponding full project immediately, instead
  of filtering the catalog to a card that requires another click. The menu remains
  above each project. All projects restores the six-card overview.
- Removed the redundant back/index row above project headers and aligned project
  content to the persistent menu. The selected category derives from the open
  project, including direct URLs and browser history; no separate filter state.
- Verified all six category-to-project mappings in the browser. Every selection
  renders its progress section without a disclosure or dialog. Verified Back,
  reload, All projects and switching directly between project details.
- At 320px, Epoch opens directly, progress remains present and the selected menu
  item is visible. Document width remains 320px. Production build, TypeScript and
  focused ESLint passed; final browser error log was empty.
- Captures: `project-direct-epoch.png`, `project-direct-mobile.png`. Emulation
  cleared; Epoch left open in the internal preview. Source content unchanged.

## Project names and balanced reading layout

- The persistent menu now shows Crosslink, Epoch, NSM, Ironwood, Zero and Dynamic
  Fees in the requested order, plus All projects. Each entry still opens directly.
  At 1440px, all seven menu controls measured the same width (156px rounded).
- Rebuilt project details with a dedicated stylesheet: introduction and current
  stage/next step share the first row; purpose, scope, milestones and code share
  the reading column with contextual references beside them. Progress remains
  expanded, and technical terms remain a keyboard-accessible disclosure.
- Main introductions measured 20px on desktop and 17px on mobile. The layout
  stacks at narrower widths; all six projects fit the 320px document without
  horizontal overflow. Also checked the 1024px tablet layout and its equal-width
  current-stage/next-step columns.
- Verified direct selection for all six projects, keyboard activation, All
  projects restoring six cards, five Crosslink milestones and five displayed
  commits, technical terms expansion, and milestone/source anchor positions.
  The anchors land 24px below the desktop viewport top; source links remain
  accessible beside the relevant project information.
- Focused ESLint, optimized build and TypeScript passed. Final browser error log
  was empty. Source records, sampled counts and project-status boundaries were
  retained; this was an internal preview design change.
- Captures: `project-layout-nsm.png`, `project-layout-crosslink.png`,
  `project-layout-mobile.png`. Device emulation cleared; NSM left open locally.

## Governance menu and direct reading pages

- Governance now begins with its persistent seven-section menu. Removed the
  repeated visible Governance header and the Proposal/Results explorer headings;
  hidden section headings retain the document outline. At 1440px, all seven
  menu controls measured 156px rounded. The same menu stays above full records.
- A shared responsive record layout now serves proposals, grants, polls,
  network upgrades, ballots and elections. Main content, a status panel and
  contextual sources use the same column proportions as Projects. Grant
  milestones and ballot rules stay open. Each list entry has one opening link
  with a direct URL, instead of separate title and arrow buttons.
- Verified proposal search, keyboard Enter, proposal-to-ballot navigation,
  browser Back, grant program/search filters, Funded-result filtering, network
  upgrades and election records. Reloaded poll and election detail URLs; the
  election returns to its election archive, and a Q3 application returns to Q3.
- All seven sections were checked at 320px: no document overflow, selected menu
  item fully visible, and the menu was the first visible content block. Proposal,
  grant and result lists show mobile field labels. Checked the 390px grant
  detail and 1024px layout; the three tablet status columns measured equally.
- Confirmed all three BlockivIA milestones remain visible, including one paid
  row and two rows not marked paid. Numeric labels now read Milestone 1/2.
  Also verified the ZCAP question/basis controls, member search and Insights.
- The adjacent Projects view retained six cards and its seven named menu entries.
  Final browser error log was empty. Device emulation was cleared, and the
  Ironwood formal-verification grant was left open in the local preview.
- Focused ESLint, optimized build and TypeScript passed. All six existing
  governance tests passed. Source datasets, voting calculations, payment
  aggregation and refresh cadence were retained; no deployment was performed.
- Captures: `governance-grant-layout.png`, `governance-results-list.png`,
  `governance-menu-mobile.png`.

## Milestones and People: persistent menus and direct records

- Both views start with their persistent section menu. Removed repeated visible
  page introductions while preserving an off-screen page heading for navigation.
  The menu remains available on every detail page and reveals the selected item
  within its own horizontal scrolling area on narrow screens.
- Eight documented milestones now open full internal records in one click, with
  context, recorded date, related projects and primary sources. The two security
  records preserve the separate roles of Shielded Labs, Taylor Hornby and the
  coordinated ecosystem response. Prototype work is not presented as activation.
- Twelve team profiles now use portraits from the official Shielded Labs team
  page, saved locally with a source manifest. Each profile opens directly with
  role, organizational context, related projects, colleagues and sources. Project
  context is explicitly distinguished from an individual contribution history.
- The Communities tab retains all 27 existing OpenZcash directory entries and
  opens their descriptions and public channels internally. Community affiliation
  is not presented as Shielded Labs employment.
- At 320px, opened all 12 profiles and all eight milestone records: no document
  overflow or dialogs. All portraits loaded. Checked all six People filters and
  four Milestones filters: expected record counts, menu first and selected item
  fully visible. Reloaded profile, community and milestone detail URLs; tested
  keyboard activation, browser Back, colleague links and profile-to-project links.
- Global search opens a person or milestone directly. Checked the 1024px record
  layout and the adjacent Ironwood formal-verification grant: the existing
  governance heading/source anchors and full-page layout remain intact. Captured
  desktop layouts at 1440px. Final browser error log was empty.
- Focused ESLint, optimized build and TypeScript passed. Source datasets and
  counting logic remain unchanged. Preview server runs locally with background
  refresh disabled; no deployment was performed. Device emulation cleared and
  People left open.
- Captures: `people-directory-layout.png`, `people-profile-layout.png`,
  `people-menu-mobile.png`, `milestones-menu-layout.png`,
  `milestone-detail-layout.png`.

## Website proposal: direct suggestions and delivery plan

- Removed the repeated Website evolution introduction and recommendation heading.
  The first visible block is a persistent eight-item menu: All suggestions, the
  six named improvements and Delivery plan. At 1440px, all eight controls measured
  136px wide. The overview presents six concise cards in two aligned columns.
- Each menu item and suggestion card opens its complete internal page directly.
  The shared reading layout contains the proposal, original dated review finding,
  delivery checks, preview links and sources. The side panel distinguishes the
  proposed phase, existing preview coverage and the next step.
- Delivery plan preserves the three site entrances, source-update workflow and
  six Community Lead responsibilities. Proposed webhooks, editorial workflow and
  event automation remain clearly separate from the existing preview. Print media
  includes all six suggested improvements in addition to the delivery plan.
- Verified all six suggestion pages and the delivery plan at 1440px and 320px:
  menu first, active item visible, no document overflow and no dialogs. Checked
  keyboard opening from a card, a direct page reload, global-search opening,
  browser Back from Governance results and Epoch, and the Cryptography team link.
  The adjacent Governance, Projects and People views opened correctly.
- At 1024px the three status columns each measured 224px; the document stayed
  within the viewport. Confirmed six responsibilities and six print-only
  suggestion entries. Focused ESLint, optimized build and TypeScript passed.
- Captures: `website-menu-layout.png`, `website-suggestion-detail.png`,
  `website-delivery-plan.png`, `website-menu-mobile.png`. This is local preview
  work; existing source datasets, polling and background-refresh guards are
  unchanged.
- Final browser error log was empty. Device and print emulation were cleared;
  Website proposal was left open on All suggestions.

## Overview: compact overview and direct access — October 27, 2026

- Replaced the large hero actions, repeated orientation block and final governance
  banner with four primary shortcuts followed by a compact original-shield
  identity. No duplicate Overview heading is rendered.
- The shared two-column composition now presents all six projects next to six
  governance destinations, followed by recent repository work and the latest
  three documented milestones. Project cards preserve published status language;
  milestone summaries preserve the source attribution.
- Recent repository links use the same default 35-day sample as Development,
  exclude forks and open that repository already selected. Direct URL reloads
  preserve this initial filter; the generic Development shortcut opens all four
  non-fork repositories. The change does not alter the data provider or metrics.
- Verified every project, governance section, repository and milestone link in
  the overview. All four primary shortcuts worked on mobile. Keyboard Enter,
  browser Back and reloading the Crosslink activity URL also passed.
- At 1440px, the primary shortcuts each measured 276px. At 1024px they measured
  183px. Mobile places them in a two-by-two layout, with 44px-high targets and
  equal widths (159px at 390px; 124px at 320px). No document overflow at any
  checked width. The original shield measured 92px on desktop and 60px on mobile.
- Focused ESLint, optimized build and TypeScript passed. Final browser error log
  was empty. Emulation cleared; Overview left open in the local preview. No
  publishing, deployment, database writes or source-content refresh was added.
- Captures: `overview-direct-layout.png`, `overview-full-layout.png`,
  `overview-mobile-layout.png`.

## Governance: readable decision workspace — October 27, 2026

- Replaced the floating counters and oversized closed-round feature with a
  two-column workspace. The five latest published ZCG applications appear first,
  with aligned requested amounts, applicants, dates and full-row detail links.
- Q3 2026 is explicitly closed. The ballot map uses the observed published
  outcomes, with 37 individual result links, 17 Funded and 20 Rejected in the
  checked dataset. Every link identifies its ballot, proposal and outcome for
  assistive technology; no ZEC weights are aggregated. The payment distinction
  remains visible alongside the map.
- Funding shows the three latest dated payment records from the grant ledger,
  including the number of milestones marked paid. These are source ledger
  observations, not delivery certification or an independent transaction audit.
- Added compact direct routes to the NU7 panel comparison, voting archive and
  insights, with a lower-priority beginner guide. Reused the portal's single
  disclosure arrow. Source observation dates and refresh-failure states remain
  visible; the data providers and polling behavior are unchanged.
- Verified the proposal list and Unpair detail, Ironwood ballot 33, a grant's
  payments and milestones, all-grants program filtering, NU7 comparison, voting
  archive, insights and beginner-guide navigation. Browser Back and keyboard
  Enter preserve direct navigation and heading focus. The adjacent portal
  Overview still opens normally.
- Checked 1440, 1024, 390 and 320px widths without document overflow. Requested
  amounts and paid-milestone counts stack beneath titles on small screens.
  At 1024px the menu content and visible width both measured 751px after reducing
  its minimum item width. Mobile navigation remains scrollable.
- Focused ESLint, TypeScript and the optimized build passed. Browser error logs
  were empty. This remains a local internal preview with background importers
  disabled; no publication, deployment or database write was performed.
- Captures: `governance-overview-v2.png`, `governance-overview-full-v2.png`,
  `governance-overview-mobile-v2.png`, `governance-ballots-mobile-v2.png`.

## Governance: consistent collection tabs — October 27, 2026

- Proposals, Voting, Grants and Results now share a menu-first collection layout:
  compact contextual heading, search, aligned list columns and a supporting
  source panel. Each complete row opens its internal record directly, including
  clicks on requested amounts, budgets and voting weights. No modal is used.
- Removed repeated under-review badges and long poll explanations from lists.
  Source statuses remain available where they distinguish records. Grant bars
  show ledger milestones marked paid; result bars show accept share, excluding
  abstentions. A Funded outcome remains distinct from payment or delivery.
- Verified search, empty-state reset, pagination and keyboard activation. The
  proposal history, network-upgrade, coinholder-grant and election collections
  all open their full records. Search, filter, collection and page survive both
  browser Back and internal back links; reloading a filtered result detail also
  retains its return context.
- Checked all four collections at 1440, 1024, 390 and 320px without document
  overflow. Mobile metrics stack below the record identity; grant budget and
  paid-milestone values align despite the longer field label. Pagination returns
  focus to the collection heading. Twelve records are shown per page.
- Focused ESLint, optimized build and TypeScript passed. Existing governance
  data/math tests passed (6/6). This remains an internal local preview, with
  background refresh guarded and no deployment or database write.
- Captures: `governance-proposals-collection.png`,
  `governance-voting-collection.png`, `governance-grants-collection.png`,
  `governance-results-collection.png`, `governance-grants-collection-mobile.png`.

## Insights: direct analytical views — October 27, 2026

- Replaced the mixed statistics header and long repeated blocks with four views:
  ZCG decisions, grant payments, Q3 outcomes and the NU7 comparison. Each uses
  the shared collection navigation, aligned rows and contextual source panel.
- ZCG statuses open filtered proposal history; recent decisions open the full
  application. Program totals open the corresponding grant ledger, and the five
  latest dated paid entries open matching grant records. Identical applicant and
  proposal names are displayed once in the recent-decision list.
- Q3 totals group published outcomes and archived requested amounts. The largest
  requests with a Funded outcome and the highest-weight ballot open their full
  result records. Payment flags, requested amounts and voting outcomes remain
  distinct. Missing currency values are excluded from their respective totals;
  full recorded ZEC precision is retained without wrapping on desktop.
- NU7 summarizes the most-supported non-abstention option for each body. All five
  question links opened ZCAP with the matching question selected. Reload retained
  that question; switching the abstention basis changed the denominator. The
  Insights view also survived reload and browser Back.
- Verified all six status links, all three program-total links, the five recent
  payment links, both outcome filters, the five featured Funded ballots and the
  highest-weight ballot. A recent proposal opened via keyboard Enter. No modal
  or missing-record screen appeared in these checks.
- Checked all four views at 1440, 1024, 390 and 320px. No document overflow was
  observed. Mobile uses a balanced two-column menu: at 320px all four buttons
  measured 128px. Currency values and comparison results stack under their labels.
- Focused ESLint, TypeScript and the optimized build passed. Existing governance
  tests passed (6/6). Final browser error log was empty; device emulation cleared.
  Internal preview only; no deployment, data importer change or database write.
- Captures: `insights-decisions-desktop.png`, `insights-payments-desktop.png`,
  `insights-outcomes-desktop.png`, `insights-panels-desktop.png`, and corresponding
  `insights-*-mobile.png` files. Insights was left on ZCG decisions.

## ZCAP: voting comparisons and member records — October 27, 2026

- The first ZCAP block is the topic menu: Issuance, Reissuance, Sprout, Block
  intervals, Readiness and Members. Each topic opens its complete comparison;
  response labels appear once, beside aligned ZCAP and coinholder columns.
- All five comparisons were exercised. Each body retains its own units and
  percentage base. Excluding abstentions changes percentages but preserves raw
  counts, including the visible abstention row. Small fractional shares remain
  explicit. The chosen basis survived reload and navigation to another topic.
- The 202-row public roster has name/handle search, A–Z/Z–A ordering and twelve
  entries per page. Search, empty reset, pagination, heading focus and keyboard
  Enter were checked. Internal back navigation preserved the search and sort;
  browser Back preserved page 2. A direct member record survived reload.
- Member pages show the public handle, joined source label, observation date
  and contextual links. Public URLs and longer descriptions are preserved in
  the handle field. Marek's URL and Roosevelt Gordones' longer description were
  checked at 320px without overflow. No personal ballot or poll eligibility is
  inferred from inclusion in the roster.
- Comparison and directory layouts were checked at 1440, 1024, 390 and 320px
  without document overflow. On mobile, each response sits above the paired
  tallies, and joined labels sit beneath member identities. The topic menu uses
  three columns at 390px and two at 320px.
- The poll details link opened the full NU7 voting record with no dialog. The
  existing Insights block-interval link opened the matching ZCAP question, and
  the participation disclosure retained the full source scope and caveats.
- Focused ESLint, TypeScript and the optimized build passed; existing governance
  tests passed (6/6). Final browser error log was empty and emulation was cleared.
  The preview was restarted on the same local port with background refresh
  guarded. No deployment, data importer change or database write was performed.
- Captures: `zcap-comparison-desktop.png`, `zcap-comparison-mobile.png`,
  `zcap-members-desktop.png`, `zcap-members-mobile.png`, `zcap-member-detail.png`
  and `zcap-member-mobile.png`. ZCAP was left on Issuance.
