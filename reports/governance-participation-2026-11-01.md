# Governance participation review — 1 November 2026

Implemented in the local preview at `http://127.0.0.1:4248/shielded-preview?view=governance&section=overview`.

- Q4 2026 calendar above the Overview dashboard; phase follows the published UTC deadlines, without importing Q3 voting totals.
- “How to participate” replaces the shorter “Who decides?” block. It covers protocol decisions, the 8% / 12% funding allocation, applications, coinholder voting, ZCAP and community participation.
- Voting links to the same Overview guide. No sidebar entries were added.
- Wallets are attributed to the completed Q3 round; Q4-specific instructions remain subject to the forthcoming FPF guidance.
- The ZCG review metric explicitly identifies ZCG.

## Sources checked

- [OpenZcash proposals](https://openzcash.org/coinholders/proposals)
- [FPF Q4 call and calendar](https://forum.zcashcommunity.com/t/q4-2026-coinholder-directed-retroactive-grant-program-call-for-proposals/58598)
- [OpenZcash program history](https://openzcash.org/coinholders)
- [OpenZcash governance](https://openzcash.org/governance)
- [ZIP 1016](https://zips.z.cash/zip-1016)
- [OpenZcash wallet directory](https://openzcash.org/wallets/find)
- [ZCAP membership criteria](https://zfnd.org/zcash-community-advisory-panel/)
- [OpenZcash communities](https://openzcash.org/communities)

## Validation

- 99 tests passed across 20 files, including four UTC calendar/state tests.
- Lint, production build and whitespace checks passed.
- Desktop and 390 × 844 viewport tested. No horizontal page overflow on mobile.
- Overview anchor, Voting → guide, guide → ZCAP and browser return exercised.
- Voting search `NU7` persisted when returning from the guide.
- Rendered source destinations inspected; no browser console errors observed.

This records local implementation and browser validation, not deployment or publication.
