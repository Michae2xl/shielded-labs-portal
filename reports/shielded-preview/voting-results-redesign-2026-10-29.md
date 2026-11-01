# Voting and Results composition — 29 October 2026

## Change

Voting and Results use full-width collection navigation followed by one archive panel. Search, filters, records and pagination belong to that panel; source context remains in the existing inline Sources & methodology section.

- Coinholder polls: shorter display titles, compact SVG symbols, aligned status and recorded-date columns. Original titles remain in internal records and remain searchable.
- Network upgrades: aligned stage, activation date and block height, with original ZIP references. Missing activation data stays explicitly unrecorded.
- Q3 results: ballot numbers, proposal identity and outcome, aligned accept shares with proportional bars, and exact ZEC weights. Identical project/applicant labels are shown once in the list.
- Committee elections: elected members, ballot totals, seats and dates in aligned rows.
- Mobile: rows adapt to title-first layouts with labeled values underneath. All records remain direct internal links.

The archive layout is opt-in for these two collections. Proposals and Grants retain their existing card presentation. Calculations, source datasets, full record content and navigation state handling are unchanged. A Funded result remains a voting outcome, not proof of payment. Accept share excludes abstentions; ZEC weights apply separately to each proposal.

## Validation

- Final production build and TypeScript passed.
- Component lint passed.
- Existing governance and metric tests: 8 passed in 2 files.
- 33 recorded browser checks: searches, Funded/Rejected filters, empty-state resets, pagination, reload, direct record opening, return-state preservation, inline sources and responsive dimensions.
- Poll, upgrade, Q3 proposal and election records opened within the portal. Return navigation retained search, filters and pagination where applicable.
- Visual review covered 320, 390, 1280 and 1440 CSS pixels. No horizontal page overflow was observed in recorded dimension checks. Fractional ZEC amounts fit at 320 pixels; percentages and weights share aligned value positions.
- Adjacent Proposals and Grants retained two-column card layouts in the laptop-width check.
- No browser console errors were captured in the final review.

## Evidence

- `voting-results-redesign-checks.json`
- `voting-redesign-desktop.png`, `voting-redesign-mobile.png`
- `upgrades-redesign-desktop.png`, `upgrades-redesign-mobile.png`
- `results-redesign-desktop.png`, `results-redesign-mobile.png`
- `elections-redesign-desktop.png`

Local preview only. No commit, deployment or public-site change was performed.
