# Independently hosted feedback preview — 1 November 2026

Public URL: https://shielded-labs-portal-preview.up.railway.app

## Follow-up: official introductions, Progress and What comes next

Deployment `f2d307cc-0314-4dba-9af2-fbbd97f2c9df` reached `SUCCESS`. All six projects now use short verbatim Shielded Labs excerpts for their introduction, Progress and What comes next, with explicit source links and publication dates or published windows where relevant. Shared introductions on Home, the project directory and related project rows use the same source data. These replacements are scoped to the requested blocks; glossary, technical-context and boundary copy are not claimed to be verbatim official text.

Crosslink uses the official roadmap phase and five named completed milestones with their actual completion dates. Epoch preserves the announcement's research/design phase and target language for the end of 2027. Ironwood's progress cites the October Epoch announcement's NU6.3 reference, not the older July planning language. Dynamic Fees uses the three published roadmap phase headings. NSM and Zero show the official ZIP and repository references. For NSM, Ironwood and Zero, the selected reference does not define a next milestone: the interface explicitly says “Not specified in this source.” This is not a statement that the projects have no future work. Dates labeled Published remain distinct from Completed.

The same compact bento pattern serves Overview and Progress. Projects with fewer reading links now give the Progress references a wider card to avoid tall, mostly empty neighboring cards. Existing FAQ, Research, Development, governance, navigation and neutral styling are retained. Official document links use the portal's existing articles and project research pages; explicit source links open the matching original publication.

Validation: 38 literal fields were matched against nine live official sources. All 175 tests across 29 files passed, together with TypeScript, ESLint, isolation, whitespace checks and the production build. Browser QA covered Overview and Progress for all six projects at desktop and narrow mobile widths (24 combinations), shared Home/directory introductions, Crosslink milestone navigation, Dynamic Fees phase navigation, Ironwood's cited article and browser Back. The final compact CSS adjustment was rebuilt and rechecked for sparse layouts. No horizontal overflow or browser errors were observed.

Public checks verified 14 routes, all expected official excerpts and source destinations, record titles and four CSS assets with HTTP 200. Public browser QA confirmed desktop and mobile layouts, the precise empty-state wording and Crosslink's internal milestone document. All 274 staged source files matched the canonical workspace hashes; 11 files differ from the preceding deployed source. Temporary verification servers were stopped and the viewport override reset. Crosslink Overview remains open. No commit or push was performed.

Evidence: `project-publications-sources-2026-11-01.json`, `project-publications-source-2026-11-01.json`, `project-publications-source-check-2026-11-01.json`, `project-publications-local-2026-11-01.json`, `project-publications-deployment-2026-11-01.json`, `project-publications-http-2026-11-01.json`, and `project-publications-public-2026-11-01.json`. Screenshot: `project-publications-public.png` in the task visualization directory.

## Follow-up: official project excerpts and Organization bento

Deployment `70c2ed91-e4b3-4988-bbf5-295534cbd5fb` reached `SUCCESS`. All six Why it matters blocks now display short verbatim excerpts from Shielded Labs, with quotation marks, semantic citation and a direct external source link. The shared project-context text in milestone records uses the same excerpts. Existing project introduction, glossary, progress and status copy are outside this replacement; this is not a claim that every portal sentence is official text.

Each excerpt was matched against the live official page, preserving its exact wording. The eight existing Organization paragraphs also matched the official homepage. Organization now groups About and Mission in two bento cards, followed by six value cards: three columns on wide content areas, two on intermediate widths and one on narrow screens. The source text and heading anchors are retained, with no new editorial interpretation.

Validation: 161 tests across 28 files; lint, TypeScript, isolation, whitespace checks and a production build. Desktop and mobile browser checks covered all six excerpts and their matching source destinations; Organization was checked at desktop, tablet and mobile widths, with Board navigation and Back. The actual Dynamic Fees source link opened the official Shielded Labs page. Public checks confirmed all seven routes and four CSS files returned HTTP 200, all six exact excerpts and source URLs are served, and the new Organization cards render on desktop and mobile. No horizontal overflow or browser console errors were observed. One browser navigation command timed out, but the resulting page was successfully loaded and verified without another navigation.

All 271 staged source files matched workspace hashes; nine files changed from the previous deployment. The temporary server was stopped, the source-test tab closed, and the viewport override reset. Organization remains open in the public preview. No commit or push was performed.

Evidence: `official-content-sources-2026-11-01.json`, `official-content-source-2026-11-01.json`, `official-content-source-check-2026-11-01.json`, `official-content-local-2026-11-01.json`, `official-content-deployment-2026-11-01.json`, `official-content-http-2026-11-01.json`, and `official-content-public-2026-11-01.json`. Screenshot: `organization-official-public.png` in the task visualization directory.

## Follow-up: Development bento across all projects

Deployment `1e970ba5-0f71-4509-bbb4-ee0724d52825` reached `SUCCESS`. The same public preview now serves a shared compact Development layout. Recent commits occupy the main card; repository cards alongside show branch, language and source date. A short sample note preserves the 100-commits-per-branch limit and fork attribution. Shared hashes are deduplicated using the existing activity helper, while commit and repository links retain their repository/fork context.

Development is available for all six projects. Crosslink, Ironwood, Zero and Dynamic Fees display their existing repository records. Epoch and NSM have no repositories linked in the portal, so their compact empty state links to their own Research tab without presenting invented activity or zero-count metrics. Missing repository records and empty commit samples remain distinct states. No repository associations or source data were changed.

Validation: 154 tests across 27 files passed; lint, TypeScript, isolation, whitespace checks and the production build passed. Browser checks exercised all six projects on desktop and mobile, the tablet breakpoint, source-linked commit and repository records (including forks), the empty-state research action, browser Back and direct reload. The 354 CSS-pixel mobile viewport had a 341px document width with no horizontal overflow. Public HTTP checks confirmed all six Development routes and four CSS assets returned 200. Public UI checks confirmed the bento layout, repository source navigation, Epoch's empty state and mobile layout. No browser console errors were observed.

All 269 staged source files matched the canonical workspace hashes; five files differ from the previous deployment. The isolated verification server was stopped and the viewport override reset. Crosslink Development remains open as the visual example. No commit or push was performed.

Evidence: `development-bento-source-2026-11-01.json`, `development-bento-source-check-2026-11-01.json`, `development-bento-local-2026-11-01.json`, `development-bento-deployment-2026-11-01.json`, `development-bento-http-2026-11-01.json`, and `development-bento-public-2026-11-01.json`. Public screenshot: `development-bento-public.png` in the task visualization directory.

## Follow-up: bento across the portal

Deployment `bc6b3d4f-b880-4943-829b-ed92b0dcb3a3` reached `SUCCESS`. The existing public URL serves the new layouts for Shielded Labs Overview, the shared project overview/progress/research screens, and all four Governance Insights views. The overview places milestones and code activity first, with compact blog rows and ecosystem navigation below. Project cards separate purpose, progress, next steps and reading; projects with one guide use a shorter composition. Insights groups totals, individual programs and recent records, and presents each NU7 question as a card with both voting bases labeled. Payment and largest-request summaries show the latest/top three records with links to the full collections.

The neutral palette, 12px card corners, 16px spacing and aligned actions follow the approved governance bento. Narrow screens stack related sections and retain full numeric precision on a single line. The existing sidebar, default governance landing, source data, distinctions between voting outcomes and payments, and project-scoped FAQ/document routes remain intact.

Validation: 145 tests across 27 files passed; lint, TypeScript, isolation, whitespace checks and production builds passed. The navigation test now checks distinct valid outcome filters because both a summary card and a full-list action legitimately link to Funded results. Local browser checks covered desktop, tablet and 354 CSS-pixel mobile layouts; rich and sparse project content; progress and research navigation; FAQ answer expansion; code history; grant payment records and source rows; funded-result filtering; and the matching NU7 comparison/basis. Public verification confirmed the new project grid, all five NU7 cards, overview tiles and loaded imagery, project progress navigation, full-precision mobile metrics and no horizontal overflow. No browser console errors were observed.

All 267 staged source files were hash-verified; seven files differ from the preceding deployment (six presentation files and one navigation test). The temporary test server was stopped, the viewport override was reset, and Crosslink remains open as the visual example. No commit or push was performed.

Evidence: `expanded-bento-source-2026-11-01.json`, `expanded-bento-source-check-2026-11-01.json`, `expanded-bento-local-2026-11-01.json`, `expanded-bento-deployment-2026-11-01.json`, `expanded-bento-http-2026-11-01.json`, and `expanded-bento-public-2026-11-01.json`. Public screenshots are `expanded-bento-project-public.png`, `expanded-bento-insights-public.png`, and `expanded-bento-overview-public.png` in the task visualization directory.

## Follow-up: complete Coinholder application history

Deployment `c36d4b16-83ec-49c0-8190-1119bc757054` reached `SUCCESS`. The public root, proposals route, governance API and five stylesheets returned HTTP 200 at 20:51 UTC. Coinholder Proposals now reads all open and closed FPF application issues, rather than the fixed Q3 catalog. The observed source contains 69 application issues; one support issue is excluded. New submissions, closed applications and resubmissions remain distinguishable. No total requested amount is added across historical resubmissions.

The default is All rounds, with search, round and source-status filters. Legacy `lane=q3` listing links now open this full collection. New stable internal application records preserve search, status, round and pagination on return and reload. Legacy Q3 application and result records remain available. Historical round membership uses primary published application lists: nine Q2 applications carried into Q3 match both filters but count once overall. Twelve other issues stay under Round not recorded instead of inferring a voting round from submission dates. Q4 has six submitted issues, while Voting retains its three open applications with completed steps and its separate $275,000 requested total. Approval, closed state, veto and payment are not conflated.

The overview no longer displays “Q3 wallets”; official ZODL, Zkool and Vizor images and links are retained and loaded publicly. Long applicant descriptions are clipped in the compact history list while remaining available in full records.

Validation: all 145 tests across 27 files passed, along with lint, TypeScript, isolation, CSS parsing, whitespace checks and a clean production build. Local desktop/mobile checks covered the legacy URL, historical and new application records, Q2 carry-forward filtering, pagination, search/status/round persistence, return/reload and current Voting totals. Narrow viewport: 354 CSS pixels, document width 341 pixels. The navigation test browser mock was completed with window.location for the existing Next Image wallet components. Public checks confirmed all 69 records, Q1 filtering, the historical Maya record, preserved return context, removed wallet heading and loaded logos. No browser console errors were observed.

Evidence: `coinholder-history-source-2026-11-01.json` (267 files; 10 changed from the previous deployed snapshot), `coinholder-history-source-check-2026-11-01.json`, `coinholder-history-local-2026-11-01.json`, `coinholder-history-http-2026-11-01.json` and `coinholder-history-public-2026-11-01.json`. Screenshot: `coinholder-history-public.png` in the task visualization directory. The local verification server was stopped and the temporary viewport override reset. No commit or push was performed.

## Follow-up: inline proposal status

Deployment `f4d2b867-e99c-4f59-8477-2c5f1d6c1f21` reached `SUCCESS`. “Accepting proposals” now sits beside the Coinholder grants title, with a subtle white dot that pulses every 1.8 seconds only during the submissions phase. The status wraps under the title on narrow screens, and the animation is disabled by `prefers-reduced-motion: reduce`.

The two changed participation files passed lint, TypeScript, a clean production build and whitespace checks; all six existing participation tests passed. Desktop and mobile rendering and the View proposals destination were checked. Public browser inspection confirmed the adjacent status and running 1.8-second animation with no console errors. Evidence: `status-pulse-local-2026-11-01.json`, `status-pulse-public-2026-11-01.json` and source manifest `status-pulse-source-2026-11-01.json`. Screenshot: `status-pulse-public.png` in the task visualization directory. The local verification server was stopped and the viewport override reset. No commit or push was performed.

## Follow-up: full overview bento and official wallet logos

Deployment `99f034ea-f791-4870-b340-8c964b4efb33` reached `SUCCESS`; the public page, five stylesheet assets and three wallet PNGs returned HTTP 200 at 20:34 UTC. The public logo files match the original source hashes.

The current-round calendar and participation paths now form a shared responsive bento grid. The calendar spans two columns, with application access alongside it and voting, ZCAP and discussion below. ZCG applications and grant payments use the same card headers, borders and footer actions as the existing results bento, with equal-height cards and aligned metrics. Existing internal destinations, dates, values and separate voting/payment semantics remain intact.

Official ZODL, Zkool and Vizor logos appear above their names in the Q3 wallet links. Unmodified originals were obtained from each wallet's official website or repository and are served locally. Source URLs, retrieval timestamps and hashes are retained in `docs/wallet-logo-sources.json`; ownership is documented in `THIRD_PARTY_NOTICES.md`.

Validation: 14 existing governance tests passed before the wallet-logo addition; updated TSX passed lint, TypeScript and a clean production build. Isolation, all 29 CSS stylesheets and whitespace checks passed. Desktop, two-column and mobile presentations were checked; the mobile viewport has no horizontal overflow. Click-throughs covered ZecOne's proposal record, the Zcash Arabia grant/milestone record, the internal program guide and current Coinholder proposals. All wallet images loaded locally and publicly. The published program guide remained internal, and no browser console errors were observed.

Evidence: `full-overview-bento-local-2026-11-01.json`, `full-overview-bento-public-2026-11-01.json`, `full-overview-bento-http-2026-11-01.json` and `full-overview-bento-source-2026-11-01.json`. Public screenshots are `full-overview-bento-public.png` and `full-overview-bento-activity.png` in the task visualization directory. The snapshot contains 266 files; eight files differ from the preceding deployment (four UI files, three wallet assets and the ownership notice). No commit or push was performed. The isolated local verification server was stopped and the browser viewport override was reset.

## Follow-up: unified governance bento grid

Deployment `69baf765-c509-447f-bbad-598fff4235e4` reached `SUCCESS`. The root and all five public stylesheet assets were verified at 20:27 UTC. This supersedes the independent compact outcome/context cards below.

Voting and context now share one responsive grid: Coinholder grants spans two columns, NU7 spans both rows, and Protocol decisions and Ecosystem funding complete the lower row. All four cards share headers, padding, footer actions and neutral surfaces. Counts retain their filtered internal links; the NU7 selector retains its matching comparison and denominator labels. Small share bars visualize each electorate separately. Obsolete styles for the former arrangement were removed. The existing context anchor and internal program guide remain available.

Validation: 14 existing tests across three files passed; lint, TypeScript, isolation, CSS parsing (29 stylesheets), whitespace checks and a clean production build passed. Desktop, two-column and single-column layouts were inspected, including the 354 CSS-pixel viewport with no horizontal overflow. Click/keyboard checks covered Funded results, NU7 question selection, the matching Sprout comparison and the internal program guide. The clean production build completed the same result/comparison interactions without console errors. Public Funded navigation passed and no public console errors were observed.

Public geometry confirmed a 862px-wide grid with the NU7 and both lower cards sharing the same bottom edge. Evidence: `bento-grid-local-2026-11-01.json`, `bento-grid-public-2026-11-01.json`, `bento-grid-http-2026-11-01.json` and source manifest `bento-grid-source-2026-11-01.json`. Screenshot: `bento-grid-public.png` in the task visualization directory. Exactly five source files differ from the previous deployment. Isolated test servers were stopped; no commit or push was performed.

## Follow-up: compact cards and metrics

Deployment `4a57feda-bd31-4446-8f05-040d7a2cf4f5` reached `SUCCESS`; the public root and its stylesheet assets were verified at 20:19 UTC. Six CSS modules changed from the white-accent deployment. No content, data, routes or application logic changed.

Governance outcome counts now sit beside their labels; the NU7 comparison uses compact rows with percentages aligned at the right. Protocol decisions and funding allocations share compact inner containers. Panel headers, actions and grant records have less padding, while related cards can retain their natural height. Participation, project listings, project detail cards and Insights received the same spacing review. White and neutral-gray accents remain in place.

Local click-through checks covered the Funded result filter, changing the NU7 question to Sprout retirement, opening the corresponding detailed comparison, Insights views, and opening Crosslink from Projects. Desktop and narrow-screen visual checks covered the changed card families, including the Shielded Labs Overview. At the observed 354 CSS-pixel narrow viewport, the page width was 341 pixels, without horizontal overflow. All 28 CSS files parsed successfully and `git diff --check` passed.

Public card heights measured 268px for Coinholder grants, 341px for NU7 scope and 227px for each context card; previous measurements were 453px, 453px and 295px respectively. Native viewport widths differed between captures and are retained in the evidence, so these are observed dimensions rather than a controlled benchmark. Evidence: `compact-cards-local-2026-11-01.json`, `compact-cards-public-2026-11-01.json`, `compact-cards-http-2026-11-01.json`, and source manifest `compact-cards-source-2026-11-01.json`. Screenshot: `compact-cards-public.png` in the task's visualization directory. The isolated verification server was stopped. No commit or push was performed.

## Follow-up: white and neutral accents

The orange interface accents were replaced with shared white and neutral-gray tokens in eleven CSS modules. Primary actions use white backgrounds with dark text and icons; tabs, project states, FAQ topics, notices and governance cards use neutral surfaces and borders. The Zcash logo asset remains unchanged. Layout, content, routes and data behavior were not modified.

Deployment `bebe7431-d16a-4c7f-b0f1-bd9e2e411297` reached `SUCCESS` and the public root and served stylesheets were verified at 20:07 UTC. The root still opens Governance and the global prototype notice is absent. Local browser checks covered desktop Governance, the internal Program guide, an expanded Crosslink FAQ answer, narrow-screen layout and mobile menu. White primary actions render dark text and icons (`#111` on `#f2f2f2`). CSS parsing passed for all 28 stylesheets, and whitespace checks passed.

Only the eleven CSS files differ from the prior deployed source manifest. Source: `white-accent-source-2026-11-01.json`; HTTP evidence: `white-accent-http-2026-11-01.json`; public screenshot: `white-accent-public.png` in the task's visualization directory. No commit or push was performed. The isolated local verification server was stopped; the existing development server was not changed.

## Follow-up: Governance as the starting page

At the user's request, `/` and `/shielded-preview` now open Governance Overview when no view is specified. The same default is used for initial rendering and browser history navigation. Explicit links, including the Shielded Labs `?view=overview`, continue to open their selected views.

Deployment `be8a036a-9211-4db6-b46d-bb857bebd452` reached `SUCCESS` and was verified publicly at 19:54 UTC on 1 November 2026. The changed component passed lint and whitespace checks. Public HTML checks confirmed the intended headings on both default routes, the explicit Overview and Crosslink. Browser checks confirmed root → Governance, navigation to Overview, Back to root → Governance, and reload → Governance, without console errors. The global notice remains absent. Evidence: `governance-home-http-2026-11-01.json`, `governance-home-source-2026-11-01.json` and `governance-home-public.png` in the task's visualization directory.

## Follow-up: remove global notice

At the user's request, the shared “Prototype · For feedback only” notice and its unused stylesheet were removed. Deployment `894e0324-5af2-4e6f-9b2d-8f1ad48314df` reached `SUCCESS` and was verified publicly at 19:49 UTC on 1 November 2026, at the same URL. The contact demo behavior and all other application behavior were retained.

Lint and whitespace checks passed. Public Overview, Governance and Crosslink FAQ returned 200 without the notice; the activity API returned valid JSON. Browser navigation Overview → Governance → Overview worked, current governance records loaded, and no console errors were observed. Evidence: `hosted-clean-http-2026-11-01.json`; source manifest: `hosted-clean-source-2026-11-01.json`; screenshot: `portal-clean-public.png` in the task's visualization directory. The initial deployment record below is historical.

Published at the user's request so Shielded Labs can test the point-zero prototype without the user's Mac running. This is an isolated Railway project using the existing account and plan. The existing workspace spending limit was retained. No expiration was configured. Ongoing availability depends on the Railway service and account remaining active; the preview is not an official production launch.

## Deployment

- Project: `shielded-labs-portal-preview` (`67a1dfef-5e13-47aa-bac8-987049d26fef`).
- Service: `portal-preview` (`9287ea6f-2047-4c1d-9da4-aa1bc09571c4`).
- Environment: `production` (`fd25f01d-1ac8-48d2-bd7f-613b52d71f2b`), exclusively for this prototype.
- Deployment: `58645708-57e6-4e7c-8fab-643a1deb0271`; terminal status `SUCCESS` confirmed at approximately 19:41 UTC.
- Source: CLI upload of the validated local snapshot; no GitHub autodeployment, commit or push in this step.
- Node.js 22, `npm run build:feedback`, `npm run start:hosted`, port 8080 on `0.0.0.0`, health check `/`, one replica, application sleep disabled.
- Nonsecret service configuration: `docs/feedback-hosting.json`.
- Uploaded file hashes and sizes: `reports/hosted-preview-source-2026-11-01.json` (263 files, 21,290,226 bytes). No environment files, credentials, Git metadata or internal reports were uploaded.
- No database, persistent volume or connection to the OpenZcash service was added. Existing services were not modified.

## Feedback mode

- Shared “Prototype · For feedback only” notice retained across pages.
- Contact remains a demonstration: browser delivery is disabled and the API returns 403 with `sent: false`.
- Noindex/nofollow and existing security headers retained. The URL is publicly accessible; no password was added.
- No messages were sent to Shielded Labs.

## Validation

- Repository isolation and nine targeted contact/controller/API tests passed.
- The Railway production build and TypeScript compilation completed successfully.
- Public root, governance and FAQ pages returned 200 with the prototype notice.
- Activity, governance and editorial APIs returned valid JSON. All six activity repositories reported live data during the probe.
- Contact POST returned the expected 403 and disabled-delivery response.
- HTTP evidence: `reports/hosted-preview-http-2026-11-01.json` (19:41 UTC).
- Browser click-through: Overview → Governance → internal Program guide; Crosslink FAQ opened and displayed its answer correctly.
- Public Overview rendered again after the previous Cloudflare tunnel was stopped at 19:42 UTC. No console errors were observed.
- Screenshot: `hosted-preview-public.png` in the task's Codex visualization directory. Desktop/mobile layout checks from the preceding feedback build remain recorded in `feedback-preview-2026-11-01.md`.

## Operation and boundaries

The new URL does not depend on the Mac, localhost or the old tunnel. The local portal server was left running for continued editing. Local changes require a deliberate new Railway deployment; they do not alter this hosted snapshot automatically.

Stop or remove only the named preview service/project to end hosting. The former Cloudflare URL is retired. Public data sources, dated editorial content and historical snapshot boundaries remain as documented in the README; hosting does not make those records independently verified or continuously updated.
