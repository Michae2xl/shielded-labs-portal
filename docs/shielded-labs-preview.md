# Shielded Labs — governance & impact preview

Internal design proposal prepared on 25 October 2026. No deployment, publication,
message to Shielded Labs, repository push or change to their website is included.

## Open locally

After `DISABLE_BACKGROUND_REFRESH=1 npm run build`, run:

```sh
SHIELDED_LABS_PREVIEW=1 DISABLE_BACKGROUND_REFRESH=1 npm run start -- --hostname 127.0.0.1 --port 4246
```

Open `http://127.0.0.1:4246/shielded-preview`. The page and API are disabled unless
the preview flag is explicitly set. Middleware rejects disabled requests before
streaming. This flag is a release guard, not authentication: do not enable it on
a publicly accessible deployment. The documented server binds only to loopback.
Robots metadata prevents indexing; it is not an access-control mechanism.

## Experience

The shared navigation groups Overview and Zcash governance separately from
Shielded Labs' Projects, Code activity, Milestones, and Team & community. Website
proposal remains an unlisted working route, excluded from navigation and search.
Matching SVG icons, aligned labels and one selected
state replace the former workspace caption, active dot and left-hand stripe.
At widths up to 900px, a labeled Menu button reveals the complete navigation;
selection, outside click and Escape close it. All destinations use real links.

Visible demo labels, the Built on OpenZcash footer, and the internal-preview
browser title were removed on 28 October. Website suggestions use Available here
and Related pages. This presentation cleanup does not change the local serving
guard or source/status semantics. The design review and screenshots are in
`reports/shielded-preview/navigation-design-review.md`.

- Overview: four direct navigation shortcuts, a compact original-shield identity,
  all six project links, governance sections, repository activity and recent
  documented milestones. Repository links open Development already filtered;
  milestone links open their full internal records.
- Governance: a menu-first workspace prioritizing the latest published ZCG review
  applications and their requested amounts. A compact Q3 2026 ballot map opens
  each historical result directly. Dated grant payment records, panel comparison,
  voting history and insights share the same reading layout. Each source retains
  its observation date; a voting outcome remains distinct from payment or delivery.
  Proposals, Voting, Grants and Results use aligned collection lists with full-row
  detail links, contextual sources and search. Returning from a record preserves
  its collection, filters, search and page, including after a direct record reload.
  Insights separates ZCG decisions, grant payments, Q3 outcomes and the NU7 panel
  comparison into four compact views, with links to their underlying records.
- How it works: a neutral guide inside Governance (who decides, the seven stages from idea to
  activation, what a ZIP is, where the Dev Fund debate stands, chain forks, glossary). Dated
  statements name their date; sources are listed on the page.
- ZIPs: the zcash/zips repository rendered inside Governance as numbered ZIPs, unnumbered drafts,
  writing guides and unofficial previews of the open pull requests, with status filters, search,
  figures and MathML formulas. Each record links
  the repository source, the official rendering, the discussion and the pull request.
- Projects: six initiatives with filters and dedicated reading pages covering purpose,
  scope, milestones, next steps, repository activity and source attribution. Each page
  has a direct URL such as `?view=projects&project=crosslink`, section navigation and
  a next-project link. Direct loads are rendered with the selected project already open.
- Code activity: source-linked commits, repository filters, default branches, sampled
  activity, author identities and separate fork history.
- Impact: preventive research, discovery, coordinated response and attributed milestones.
- Team & community: official published roster, discipline filters, reused community directory,
  and links to published opportunities.
- Website proposal: menu-first navigation to seven improvements and a delivery plan.
  Each suggestion opens directly with its rationale, delivery checks, preview
  coverage and contextual sources. The plan combines site structure, update
  workflow and six Community Lead responsibilities, with a printable brief.

English copy is used for a director-facing presentation. Search, URL-addressable views,
browser back/forward, project pages, source-drawer keyboard dismissal and mobile
navigation are implemented. The revised visual direction follows the user's local
`shielded-labs-light.mp4` repository film, inspected at 3, 13 and 22 seconds:
near-black, silver and white. The original blue concept has been replaced throughout.
The opening now uses the original Shielded Labs logo asset at a smaller size
(190px desktop, 56px in the mobile hero), preserving its shape and shading. The earlier tiled
SVG interpretation was removed at the user’s request. Motion is a subtle 4px float,
not live repository telemetry. The decorative motion settles after four seconds, has no visible controls
and is disabled by `prefers-reduced-motion`. No video asset is copied or published.

Copy now uses direct section names, shorter project descriptions and fewer repeated
claims. Project entries use quiet surfaces and spacing instead of a ruled grid. Bespoke SVG
project glyphs accompany the original PNG shield in the sidebar and hero.
On mobile, navigation includes visible text labels in a horizontally scrolling strip.

## Existing OpenZcash foundation

The implementation stays in the existing Next.js application. It reuses the Shielded
Labs identity, public grants API and community catalog. Existing grants methodology,
coinholder resources, ZCAP, Arborist Calls, monthly reports, narratives, ZecHub and
meeting-calendar resources are linked directly. Their full interfaces have not been
rebuilt inside the preview. Existing database importers and publication policies are
not changed. The preview does not initiate imports or write to any database.

## Data and refresh behavior

The page renders a sanitized GitHub snapshot captured through the GitHub connector
on 25 October 2026. Only public commit metadata is retained; email addresses and
credentials are omitted. Six selected repositories are observed, with up to 100 commits
from each default branch. This is a bounded sample, not organization-wide history.
Forks are excluded from core counts; identical hashes are deduplicated. Author
identities may contain aliases and are never represented as employee headcount or
performance scores. Commit activity does not prove a release or mainnet activation.

The browser requests `/api/shielded-preview` on load and every five minutes while
visible. The server shares a five-minute cache and coalesces concurrent refreshes.
It reads public GitHub and OpenZcash APIs without credentials. Failed GitHub reads
retain the most recent successful observation with its original timestamp, marked
as a snapshot. Failed grant reads return an unavailable state, never invented totals.
The source check timestamp is distinct from observation timestamps and underlying
ledger freshness. Website editorial content remains a dated human-reviewed snapshot.

During validation, OpenZcash returned 218 grant records; direct GitHub requests timed
out on this host. The connector-captured commits remain visible with snapshot labels.
The five-minute mechanism is polling, not streaming or a background automation.
Webhooks, an editorial publishing queue and automated calendar lifecycle are proposed
future work, clearly identified as such in the website-evolution view.

## Primary sources and editorial decisions

- Local `shielded-labs-light.mp4` — user-requested visual reference for the revised monochrome direction.
- https://shieldedlabs.net/ — organizational identity and original shield silhouette.
- https://shieldedlabs.net/roadmap/ — five completed Crosslink prototype milestones;
  productionization remains in progress.
- https://shieldedlabs.net/the-orchard-counterfeiting-vulnerability/ — preventive
  engagement of Taylor Hornby, discovery on May 29 and ZODL-coordinated response.
  No claim that Shielded Labs alone fixed the vulnerability or that exploitation
  never occurred. No estimate of money saved.
- https://shieldedlabs.net/ironwood/ and the October Epoch announcement — separate
  historical deployment evidence from outdated forward-looking activation wording.
- https://shieldedlabs.net/epoch-future-proof-cryptography-for-zcash/ — research scope,
  announced team and target timeline. A target is not an activated capability.
- https://shieldedlabs.net/team/ — role attribution, reviewed on the preparation date.
- https://shieldedlabs.net/governance/ — protocol polling versus funding processes.
  September dates are presented as historical, not upcoming.
- https://shieldedlabs.net/projects/ — portfolio; Epoch missing from the reviewed
  index/menu is a concrete discoverability recommendation.
- https://github.com/ShieldedLabs — primary repository evidence.

## Validation

The full suite passed: 275 tests; 9 database-dependent integration tests skipped.
TypeScript, focused lint and optimized production build passed. Added tests cover
fork exclusion, hash deduplication, UTC sample bins, disabled API access, offline
source behavior, refresh coalescing and preservation of newer observations.
UI validation covers navigation, project pages, source-drawer Escape dismissal, global search,
grant-program and team filters, and fork warnings. Responsive checks and final
screenshots are recorded in `reports/shielded-preview/`.

## Local validation side effect

The first optimized-server checks started the application's existing production
scheduler and synchronized the configured **local** database mirrors. Those servers
were stopped. The final preview now explicitly disables background refresh; a
startup guard and regression tests ensure no import timers are registered. No
production database configuration was used, and no deployment was performed.

## Embedded governance workspace — October 25, 2026

The governance section now has Overview, Proposals, Voting, Grants, ZCAP,
Insights and Results, with internal full-page records (no modal or external
navigation required to inspect the datasets). Search, program/status filters,
pagination and query URLs are available. Primary-source links remain optional.

Data reuse:
- 753 ZCG history records captured read-only from the local published mirror.
  D-1 publication rules are preserved; this is distinct from the public review queue.
- Public OpenZcash APIs supply 24 current review records, 218 grants, 913
  grant-program payment rows and all 37 Q3 ballot results in the saved observation.
- The public ZCAP roster contains 202 names in this observation. Historical
  eligible electorates remain separate from the current roster.
- OpenZcash main's curated governance record (reviewed September 30) and
  NU7 comparisons (reviewed October 2) were copied into the preview only.
  Source: https://github.com/Michae2xl/openzcash/tree/main/src/lib/governance
  The exact-integer comparison calculations are reused without mixing ZEC and votes.

`/api/shielded-preview/governance` is opt-in and read-only. It refreshes datasets
independently, caches for five minutes and retains original observation dates on
failure. The browser polls while visible. Partial ledgers are rejected rather than
presented as complete. The snapshot supplies immediate, explicitly dated content.
No import job or voting submission is triggered. This is polling, not streaming.

Grant USD is recorded budget value. Paid totals include only source-marked paid
rows and are not independent transaction or delivery verification. Q3 Funded is a
voting outcome, not proof of payment. Ballots join archived applications by their
stable GitHub issue ID; per-question coin weights are never added across questions.
ZCAP and coinholder percentages always retain separate units and denominators.

## Continuous reading and orientation

The header now has a working breadcrumb and one portal-wide search. The separate
preview bar and the home metric strip have been removed; the internal-preview label
remains visible in the header. Home offers direct paths to projects, governance and
voting results. Search can open governance subsections directly, including when the
reader is already inside governance.

Project headers place their SVG symbol beside the title, without a separate emblem
column or a repeated metadata strip. A single reading column moves from a plain-language
purpose to progress, development and sources. Technical terms expand in place.
An optional governance introduction explains proposals, panels and outcomes, with
internal routes to the relevant records. Data tables retain their row separators.

The original shield has no playback control. Its short decorative entrance ends
automatically and respects reduced-motion settings. No changes to source data,
status rules, polling cadence or publishing scope were made in this visual iteration.


## Development map and contributor profiles

The Development page now connects public GitHub identities, repository cards,
commit search and two interactive heatmaps: repository by UTC day and contributor
identity by repository. Selecting a cell filters the inline commit list. Arrow
keys move between cells; Enter selects and Escape clears. The period can be 35
or 84 days, and the fixed color thresholds remain consistent between filters.

The bundled GitHub observation was refreshed at 2026-10-25T22:56:48Z through the
GitHub connector. It contains up to 100 latest default-branch commits per selected
repository (548 records before deduplication). This is not complete period coverage.
The live reader uses the same limit and retains the previous observation on failure.
Forks remain excluded by default and show an explicit inherited-history note when
included. UTC dates use the Git author timestamp. Counts deduplicate hashes across
repositories; a shared hash can still occupy cells in each repository.

Public avatars are saved locally for 31 linked profiles, keeping the existing
image security policy unchanged. Authors without a linked GitHub identity or an
available image use initials. Unlinked names are not merged with similar GitHub
profile names; automation profiles are identified separately. Observed identities
do not establish employment, team size, effort or performance.

The OpenZcash coinholder activity page supplied an interaction reference, not data
for development counts: https://openzcash.org/coinholders/activity. No vote weight,
voting clusters or inferred social relationships are mixed into these heatmaps.


## Alignment and hierarchy checkup

The portal now uses a shared centered content width for its header and reading
area. Selects share an SVG chevron and control geometry; native disclosures
use a right-aligned chevron that rotates on expansion. Navigation icons,
source links and table opening actions keep consistent vertical alignment.
Governance overview figures and menu items share even columns.

Development starts with balanced contributor rows, followed by a grouped
period/repository filter row and a compact expandable repository directory.
The separate summary strip was removed; totals remain beside their relevant lists.
Repeated section kickers, instructions, contributor selectors and duplicate
commit-opening links have been removed. Commit rows use one external action
and a concise metadata line. Source caveats remain in Data & methodology;
sampled counts, linked profiles, unlinked authors and fork boundaries are
preserved. Source records and refresh behavior are unchanged.

On mobile, the current portal section stays centered in the horizontal menu.
The two development selectors share a full row; fork inclusion and reset actions
sit beneath them so repository labels remain readable on narrow screens.

The repeated Development title and introduction are removed; Contributors is the
page heading, with the source date and refresh control alongside it. Projects
keeps its name in the breadcrumb and opens directly with the project menu,
followed by the project list. An off-screen heading preserves the page outline.

Choosing a project opens its full page directly, including progress,
milestones, next steps and source context. The project menu remains above the
project so readers can switch without returning to a filtered card. All projects
restores the overview, and project URLs, browser history and direct links remain
available. The redundant back/index row above individual projects is removed.

The menu uses project names in portfolio order: Crosslink, Epoch, NSM, Ironwood,
Zero and Dynamic Fees. A shared responsive reading layout pairs the introduction
with the current stage and next step. Purpose, scope, milestones and code occupy
the main reading column; contextual sources and repository coverage sit alongside
them. The layout becomes a single reading sequence on narrower screens. Technical
definitions remain optional, while progress stays visible without expansion.

## Governance navigation and record layout

Governance now starts with its section menu: Overview, Proposals, Voting, Grants,
Results, ZCAP and Insights. The menu remains present inside individual records,
and the repeated Governance title and explorer introductions are removed. Each
collection has a compact contextual heading. The selected section stays in
view as the horizontal menu adapts to narrower screens.

Proposal, poll, network-upgrade, grant, ballot and election records share the
same reading layout as Projects. Their title and context sit beside a compact
status panel; complete summaries, tallies, rules, payments and milestones occupy
the main column, with contextual sources alongside. Links within a record jump
to its sections without hiding content or opening a modal. List entries use
direct URLs and a single opening action; on mobile, the proposal, grant and
result tables become stacked entries with field labels.

Source observations, requested amounts, recorded payments, published outcomes
and delivery boundaries are preserved. Numeric milestone names are presented
as “Milestone 1” rather than an unexplained number. Source refresh and coverage
remain visible in a supporting column, which follows the list on small screens.

The collection tabs and search appear before each list. Requested amounts,
recorded dates, grant budgets and ballot metrics occupy consistent columns.
Grant bars represent milestones marked paid; result bars represent accept share.
Repeated review statuses and long poll explanations are omitted from the list
while full context remains inside each record. Lists paginate at twelve entries.
URL parameters retain the selected collection, search, filter and page when
opening a record and returning through its back link or browser history.

Insights uses the same two-column composition and contextual source panel. ZCG
status rows open filtered application history; recent decisions open the complete
application. Grant-program totals open the corresponding ledger, and dated paid
entries link to matching grant records. Q3 outcomes link to filtered results and
individual ballots. Requested amounts remain separate from payment totals.

The NU7 summary shows each body's most-supported non-abstention option, with
percentages that include abstentions. Each question opens the full ZCAP comparison
already selected. The summary never combines member votes with ZEC weight. Insight
view selection and the chosen comparison question are preserved in the URL.

ZCAP opens with the five NU7 topics and the member directory as its first menu.
Each topic displays the full comparison immediately: response labels appear once,
with ZCAP ballots and coinholder ZEC weight aligned in separate columns. Each
column shows its own percentage base. Excluding abstentions changes percentages
without hiding or changing the recorded raw tally; the chosen basis persists in
the URL. Participation rules and primary sources remain beside the comparison.

The member directory supports name/handle search, alphabetical sorting and
twelve rows per page. Each row opens an internal record with its public handle,
the source's joined label and the roster observation date. Returning preserves
the directory search, order and page. Roster inclusion does not establish poll
eligibility, and aggregate results are never attributed to individual members.
Long descriptions and URLs in the source's handle field are preserved.

## Milestones and people

Milestones and People now open with their filter menus, without duplicate page
titles or introductory feature blocks. The chronological list opens each event
directly into its context, attribution, related project and primary sources.
Security records retain the distinction between research commissioned by
Shielded Labs, Taylor Hornby's discovery and the response coordinated by ZODL.

People shows the published roster with twelve official portraits saved locally
from the Shielded Labs team page. Each profile opens inside the portal with its
published role, organizational context, relevant portal areas and colleagues.
Portfolio links do not assert personal authorship. Communities occupy their own
tab and open into descriptions and public channels from the OpenZcash directory.

Both areas reuse the governance reading layout. The section menu stays above
details, and source context sits beside the main content on desktop. URLs retain
the selected section and record, including direct loads and browser history.
Portal search opens individual people and milestones directly. This remains a
local internal preview; no biography, employment history or performance ranking
is inferred from development activity.

## Contact, simulators and editorial artwork

The portal contact form uses `POST /api/shielded-preview/contact`, gated by
`SHIELDED_LABS_PREVIEW=1`, to forward validated fields to the existing public
Shielded Labs Contact Form 7 form. It does not accept a caller-selected mail
destination or upstream URL. The original provider controls mail delivery and
spam classification. Only `mail_sent` is acknowledged as sent; unknown outcomes
retain the draft and are not retried automatically. The local limiter and
deduplication window are per process; add a shared edge limit for a multi-instance
public deployment. No live message was sent during implementation or review.

Resources includes the three original project models in sandboxed frames with
fixed origins. Portal source links preserve supported scenarios and open internal
records. Only the portal page's CSP allows the simulator hosts. The fee lab has
direct section navigation and starts at its calculator. The model code, design
and live data remain maintained by their source projects.

Blog entries carry local featured artwork derived from the publisher's Open
Graph metadata. The same images appear in the reader and Overview; Next Image
provides responsive sizes. `import-editorial.py --featured-only --input <json>`
updates the covers without reimporting article bodies.

Evidence and remaining delivery/deployment boundaries are recorded in
`reports/shielded-preview/integrations-2026-10-28.md`.

### Governance panel and responsive width — 2026-10-28

The governance dashboard now groups navigation by funding, decisions and community context. Overview cards lead to internal records; the NU7 comparison retains its selected question in `question=` and forwards it to the complete ZCAP comparison. Q3 outcome links preserve the funded/rejected filter through detail navigation. The home page highlights the governance panel before news and research.

Shared header/content width is fluid with balanced gutters, replacing the 1200px cap. Mobile governance navigation exposes all seven destinations in two rows. Original article reading widths and data-source distinctions are preserved. Validation: `reports/shielded-preview/governance-panel-2026-10-28.md`.

### Governance internal collections — 2026-10-28

Proposals, Voting, Grants and Results now share responsive record-card grids across the available width. ZCAP provides a wide comparison and member-card directory; Insights uses the same spacing and direct record/filter links. Source context sits below collections, while record pages place return navigation first and use a full-width facts strip. Record URLs preserve the current collection query, filter and page, including when opened in another tab. Validation and screenshots: `reports/shielded-preview/governance-inner-2026-10-28.md`.

### Work area layout and internal records — 28 October 2026

Projects, Code activity, Milestones and Team & community now use content-width card grids and consistent internal detail layouts. Project resources, milestones and code references link to portal records. Activity supports contributor, repository and commit detail URLs while preserving filters and heatmap selection; team/milestone details retain their originating filter. See `reports/shielded-preview/work-areas-2026-10-28.md` and its browser evidence for the local validation scope.

### Editorial areas and responsive readers — 29 October 2026

Blog, Resources and About use the same navigation-first layout and responsive card grids. Article and guide readers retain readable paragraph widths with a desktop outline and mobile section selector. Organization information, values, board profiles and institutional links use the available width without duplicating page headings. Category and search state persist through detail navigation, return and reload. See `reports/shielded-preview/editorial-layout-2026-10-29.md` for validation at 320–1686 CSS pixels, 38 browser checks, 14 focused tests and screenshots.

### Panel headings and ZCAP questions — 29 October 2026

Redundant introductory labels above panel and record titles have been removed. ZCAP now separates vote comparison from the member directory, presents five numbered questions on desktop and a compact question selector on mobile, and centers larger totals and percentages in clearly separated voting-body columns. Question prompts are short paraphrases; original ballot sources and exact vote weights remain available. Question selection, percentage basis, member search and direct record navigation retain their existing URL state. See `reports/shielded-preview/zcap-question-menu-2026-10-29.md` for local validation and screenshots.

### Simplified governance navigation — 29 October 2026

The four navigation group labels and their vertical separators have been removed. All seven governance destinations share one centered row with an underline for the current page; narrow layouts expose every link in two rows. Desktop navigation is 53 px tall, with 52 px link targets; mobile targets remain at least 44 px. The production build and component lint passed. Browser checks covered all seven destinations and widths of 320, 390, 651, 901 and 1440 px without navigation overflow. Evidence: `reports/shielded-preview/governance-navigation-clean-checks.json` and matching desktop/mobile screenshots. This change is available only in the local preview.

### Governance artwork and copy reduction — 29 October 2026

The next visual pass adds original SVG symbols to the seven main sections and clearly separates collection filters with outlined buttons and count badges. In Proposals, Grants, Voting and Results, filters and search now lead directly to cards; introductory headings remain only for accessibility and their redundant descriptions are removed. Desktop filter/search alignment and mobile wrapping preserve internal navigation. See `reports/shielded-preview/governance-artwork-2026-10-29.md` for validation and screenshots.

### Compact references and portal footer — 29 October 2026

Governance collections now end with one compact Sources & methodology panel containing the checked date and refresh control. Calculation notes and the current section's source context open inline, with the complete source catalog available underneath. The former standalone Data sources row is removed. All original source links and calculation distinctions remain available. The shared portal footer uses the original shield and compact Contact/Privacy links; governance omits the duplicate source action. See `reports/shielded-preview/reference-footer-2026-10-29.md` for desktop/mobile validation and screenshots.

### Insights composition — 29 October 2026

Insights now pairs an aggregate panel with a compact list of the underlying records. Decisions and Q3 outcomes use proportional SVG rings with labeled totals; payments separate combined totals from program breakdowns. NU7 leading responses share aligned ZCAP/coinholder columns and open the selected question directly. The four view controls fill the available width and wrap into two rows on mobile. Existing data calculations and source context remain unchanged. Evidence: `reports/shielded-preview/insights-redesign-2026-10-29.md`.

### ZCAP comparison and member directory — 29 October 2026

ZCAP now pairs a compact question navigator with one comparison panel, aligning response percentages, proportional bars and exact weights for the two voting bodies. Mobile uses a question selector and two columns per response. The member directory replaces separate cards with aligned rows, search, sorting and pagination; profiles and poll details remain internal. Existing datasets, calculation bases and source context are preserved. Evidence: `reports/shielded-preview/zcap-redesign-2026-10-29.md`.

### Voting and Results archives — 29 October 2026

Voting and Results now use full-width navigation and compact archive panels instead of repeated metric cards. Poll status and dates, upgrade activation information, Q3 accept shares and ZEC weights, and election totals share aligned columns. Mobile rows place labeled values below each identity. Search, outcome filters, pagination, internal records and return state are preserved. Short poll titles link to the original full records, which remain searchable. Evidence: `reports/shielded-preview/voting-results-redesign-2026-10-29.md`.

### Proposals and Grants lists — 29 October 2026

Proposals and Grants now share the archive presentation: three collection controls across the available width, compact rows, aligned status or milestone columns, and right-aligned USD values. Missing requested amounts use a dash with accessible text and a source-context explanation. Mobile rows retain complete amounts beneath each title. Collection, search, status and page state remain available through internal detail navigation and return. Evidence: `reports/shielded-preview/proposals-grants-lists-2026-10-29.md`.

### ZIP library and How it works — 4 November 2026

Governance gained two sections. `How it works` (`?view=governance&section=how-it-works`) explains
the decision process at the level of the November forum overview, in English, with internal links
to voting records, ZIPs and the Shielded Labs essays that back its figures. `ZIPs`
(`?view=governance&section=zips`) lists the zcash/zips repository: 139 documents, 14 figures.
Network upgrade records now link their ZIP references, and the global search finds ZIPs by
number or title. Rendering happens outside the server: `scripts/zips/import_zips.py` turns
reStructuredText and Markdown into the same inert node shape as the editorial import (docutils
with raw HTML and file insertion disabled, MathML for formulas, an allowlist for tags and
attributes, PNG figures only). A scheduled GitHub Actions job (`.github/workflows/zips-sync.yml`)
publishes the result to the `zips-data` branch every six hours; the portal reads that branch when
`ZIPS_DATA_URL` is set and otherwise serves the bundled snapshot. Open pull requests are
rendered as a fourth lane since the same day: the sync job lists them with the GitHub API, fetches
each head with git, renders the ZIP sources the pull request adds or changes (34 new documents
and 24 changed ones from 48 of the 70 open pull requests at the first run; edits to the
writing guides and the template are skipped) and labels every record
with its pull request, commit and an unofficial-preview notice.
