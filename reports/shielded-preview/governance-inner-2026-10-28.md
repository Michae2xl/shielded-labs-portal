# Governance internal sections — 28 October 2026

Local implementation and browser review at `http://127.0.0.1:4246/shielded-preview`.

## Scope

- Proposals, Voting, Grants and Results use the available content width, with two or three record cards per row on larger screens and one on phones. Cards align their amounts, dates, vote weights, progress and navigation arrows.
- Section menus remain first. Search and filters share the heading area on wide screens and reflow on narrow screens. Repeated status headings were removed; source context moves below the records instead of occupying a fixed sidebar.
- Results exposes All outcomes / Funded / Rejected as count-bearing filters. Vote shares and per-proposal ZEC weights remain separate.
- ZCAP uses a full-width comparison with distinct percentage bases for member ballots and ZEC weight. Its member directory uses the same card rhythm.
- Insights uses cards for status distributions, program totals, outcomes and question comparisons, with direct links to underlying records or filtered collections. Long payment totals remain on one line at the tested widths.
- Record pages have the return action and section links at the top, a full-width facts strip, and reading content alongside source context.
- Collection record URLs now carry the current program, lane, query, filter and page where relevant, including for modified clicks/new tabs. Normal back-to-list actions preserve the same state.

## Verification

- Production build and TypeScript passed.
- ESLint passed on the four changed React components.
- Existing governance, provider and isolation suites: 3 files / 14 tests passed. Calculations and source/provider behavior were not changed.
- 58 browser checks recorded in `governance-inner-browser-review.json`: all passed. These include viewport/layout observations and interaction checks, not 58 independent automated test cases.
- Six principal sections checked at 320, 390, 1440 and 1686 CSS-pixel widths across the review. Internal history, Q3 proposals, network upgrades, elections, member directory and Insights subdivisions also checked on mobile.
- No horizontal page overflow in the observed layouts.
- Direct detail and return paths checked for proposals, grants, poll records, network upgrades, elections, Q3 results and ZCAP members.
- Search, pagination, grant-program selection, result-outcome selection and member sorting/search preserved when returning. ZCAP's abstention basis updates both percentages and the URL; an Insights comparison link opens the matching question internally.
- No browser error logs were observed during the interaction review.

## Evidence

- `governance-inner-proposals.png`
- `governance-inner-results.png`
- `governance-inner-zcap.png`
- `governance-inner-insights.png`
- `governance-inner-payments-mobile.png`
- `governance-inner-zcap-mobile.png`

## Boundaries

This is a local preview, not a deployment. The review did not submit votes, contact messages or grant applications. Existing distinctions between requested/budget amounts, paid ledger entries, published outcomes, membership eligibility and protocol activation remain in place. Live sources may change counts after this review.
