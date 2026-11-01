# Proposals and Grants lists — 29 October 2026

## Change

Proposals and Grants now use the same archive layout as Voting and Results: collection navigation first, one panel for search and records, and a compact inline sources section below it.

- Proposals: aligned submission dates or status, right-aligned USD requests, compact applicant metadata, and no repeated amount labels on desktop.
- Grants: aligned milestone payment counts, proportional indicators, right-aligned USD budgets, and compact recipient, program and status metadata.
- The three collection buttons share the available width. On narrow screens, titles precede labeled values and every record remains a direct internal link.
- Identical title/applicant labels appear once. An absent requested amount is rendered as a dash with an accessible “Not recorded” label and an explanation in Sources & methodology.

Datasets, calculations and internal detail content are unchanged. Requests, recorded budgets and milestone payment flags retain their distinct meanings; payment flags do not certify delivery.

## Validation

- Final production build, TypeScript and component lint passed.
- Six existing governance tests passed.
- 28 browser observations are saved in `proposals-grants-list-checks.json`.
- All three proposal collections and all grant program filters were exercised. Proposal and grant details opened inside the portal, with search, filter and page state preserved on return. Historical proposal state also survived a detail-page reload.
- Empty searches and reset controls worked. Sources & methodology opened inline, including the explanation of missing amounts.
- Visual review covered desktop and mobile. Recorded width checks include 320, 390, 768, 1280 and desktop alignment at 1440 CSS pixels. No horizontal page overflow was observed. The $1,950,000.00 request and grant budget fit their columns at 320 pixels without abbreviation.
- Amount and arrow right edges match across desktop rows. Voting and Results retain their two-column collection navigation and archive layout.
- No browser console errors were captured.

## Evidence

- `proposals-list-desktop.png`
- `proposals-list-mobile.png`
- `proposals-history-laptop.png`
- `grants-list-desktop.png`
- `grants-list-mobile.png`
- `proposals-grants-list-checks.json`

This change is available in the local preview only. No commit, deployment or public-site change was performed.
