# ZCAP composition — 29 October 2026

## Change

Reorganized ZCAP around two full-width views: vote comparison and the public member directory. The implementation is limited to the ZCAP component and its stylesheet.

- Five numbered questions occupy a compact side navigation on desktop and a select control on narrow screens.
- A single comparison panel aligns each response with ZCAP and coinholder percentages, proportional bars and exact weights. The percentage-basis control is shown once.
- Public member records use two compact columns on desktop and one on mobile, with aligned names, handles, joined labels and detail arrows.
- Search, alphabetical ordering and pagination remain above or within the same directory panel. Member profiles and poll rules open as internal records.
- Source and calculation context remain in the existing inline Sources & methodology panel.

The datasets and percentage calculations are unchanged. Member ballots and ZEC voting weight remain separate. Excluding abstentions changes the percentage base while preserving the original recorded weights. Roster inclusion is not presented as proof of eligibility for a particular poll or an individual's voting choice.

## Validation

- Production build and TypeScript passed; component lint passed.
- Existing governance tests: 6 passed in 1 file.
- 25 recorded browser checks covering search, empty-state reset, sorting, pagination, profile navigation, poll navigation, percentage basis, question selection and responsive layout.
- All five questions were exercised in desktop navigation and with the mobile selector at 320 CSS pixels. Exact denominators fit on one line, including fractional ZEC values with abstentions excluded.
- Visual review at 320, 390, 1280 and 1440 CSS pixels. No horizontal page overflow was observed. Final percentage-basis controls fit their labels and retain 44 px targets.
- Profile return preserved the query and, separately, descending order and page 2. Browser Back from poll details restored the selected question and percentage basis.
- No browser console errors captured in the final review.

## Evidence

- `zcap-redesign-checks.json`
- `zcap-redesign-desktop.png`
- `zcap-redesign-laptop.png`
- `zcap-redesign-members.png`
- `zcap-redesign-mobile.png`
- `zcap-redesign-members-mobile.png`

Local preview only. No commit, deployment or public-site change was performed.
