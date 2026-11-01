# ZCAP question navigation and panel headings

Local preview: `http://127.0.0.1:4246/shielded-preview?view=governance&section=zcap&filter=issuance`

## Changes

- Removed introductory labels such as “Open governance” above panel and detail titles. Retained statuses, dates, data labels and accessible record context.
- Separated ZCAP vote comparison and members into a centered navigation control.
- Added five numbered ballot-question buttons; mobile uses a compact native selector.
- Rephrased topic headings as questions, with an explicit shortened-wording note and original source links.
- Increased and centered totals and percentages, separated comparison columns, and retained exact vote weights and their distinct units.
- Preserved internal member details, search, return navigation and percentage-basis behavior.

## Validation

- Production build and TypeScript check passed.
- Lint passed for the affected TypeScript components.
- Existing governance tests: 6 passed; tally calculation code was unchanged.
- Exercised all five questions in the browser and verified selected-question/percentage state survives reload.
- Sprout: 134 member ballots and 2,399,146.25 ZEC with all responses; 126 and 2,397,462.5 ZEC excluding abstentions.
- Issuance: 135 and 2,403,537 ZEC with all responses; 120 and 2,402,464.875 ZEC excluding abstentions.
- Member search → profile → return kept the search query.
- Checked 1440 px desktop, 390 px mobile and 320 px narrow layouts. No page overflow or clipped exact totals in the checked states.
- Reviewed cleaned headings on Overview, Governance, a proposal record, Projects, an Epoch detail and About; Overview also checked at 320 px.
- No browser console errors captured during the final review.

Evidence: `zcap-question-menu-checks.json`, `zcap-question-menu-desktop.png`, `zcap-question-menu-mobile.png`, and `heading-cleanup-overview-desktop.png`.

These results concern the local preview. No deployment or publication was performed.
