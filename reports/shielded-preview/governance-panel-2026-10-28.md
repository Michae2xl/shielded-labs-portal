# Governance panel and fluid layout — 28 October 2026

Local implementation in `/shielded-preview`; not deployed.

## Changed

- A grouped governance menu: Dashboard; Funding (Proposals, Grants); Decisions (Voting, Results); Community & context (ZCAP, Insights). All seven destinations remain visible in a compact two-row menu on phones.
- Three overview cards explain funding, decisions and participation. Counts come from the existing OpenZcash records; unavailable data is not represented as zero.
- Recent proposals, recorded payment milestones, a NU7 comparison and the Q3 outcome summary form the main dashboard. Every item opens its underlying internal record or filtered collection.
- The NU7 card switches between all five questions. It shows the leading answer for each electorate, the raw tally and the separate percentage base. The full comparison retains the selected question. Browser Back restores it.
- Funded/rejected counts replace the numbered ballot tiles. Selecting a count opens that outcome filter, preserved when opening and returning from an individual result.
- A concise roles section distinguishes ZCG committee decisions, coinholder votes and ZCAP advisory participation.
- The home page gives the governance panel a prominent entry point before the news, while retaining the news photos and direct project, activity and milestone links.
- Shared page/header width is now fluid rather than capped at 1200px. Gutters remain balanced and small; article reading measures remain bounded for readability. News image resolution responds to the wider layout.

## Evidence boundaries

ZCAP roster inclusion does not establish poll eligibility. ZCAP member ballots and coinholder ZEC weight are separate populations and units. Q3 “Funded” is a voting result, not evidence of payment. Payment milestones remain ledger records, not certification that work was delivered. Existing source dates, links, freshness checks and unavailable-source behavior remain available.

Role descriptions were checked against [ZCG's review process](https://zcashcommunitygrants.org/selection/) and [ZF's ZCAP description](https://zfnd.org/zcash-community-advisory-panel/). Numerical comparisons reuse the existing source-backed OpenZcash data and calculation functions.

## Validation

- Production build and TypeScript check: passed.
- Lint on the changed TypeScript components: passed.
- Existing governance, provider and isolation suites: 14 tests passed.
- 35 browser observations recorded in `governance-panel-browser-review.json`: all passed. They include the nine main areas at 1686px and 390px; six governance collections at 390px; the dashboard at 320px and 768px; direct proposal/grant/result records; preserved result filters; and preserved NU7 comparison selection.
- At a 1686px viewport, the main region is 1423px with 36px left/right gutters (1351px usable content versus 1128px under the previous cap, approximately 20% more). No page-level horizontal overflow in the checked views.
- No live form submission, external vote, publishing or deployment was performed.

## Screenshots

- `governance-home-fluid.png`: home at 1686px with the primary governance entry point.
- `governance-panel-desktop.png`: redesigned governance dashboard at 1686px.
- `governance-panel-mobile.png`: compact seven-link navigation and stacked governance cards at 390px.
- `governance-home-mobile.png`: home at 390px.

Final live check: all three news photos loaded with sizes following the fluid grid. Browser viewport overrides were cleared after verification.
