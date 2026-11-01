# Governance artwork and reduced interface copy

## Implemented

- Original SVG symbols identify all seven governance sections. Hover and current-page treatments use the existing monochrome palette and respect reduced motion.
- Collection filters have individual outlines, supporting symbols and distinct count badges.
- Proposals, Grants, Voting and Results place filters and search together, followed directly by their record cards. Repeated introductory titles and descriptions are removed visually; accessible section headings remain.
- Q3 collection labels retain the year. The explanation that result percentages exclude abstentions remains with the source and interpretation notes.
- Insights shares the new collection-filter styling. Record content, tally calculations, sources and navigation state were not changed.

## Verified locally

- Production build, TypeScript and affected-component lint passed.
- Opened every governance section, all three proposal collections, a searched historical proposal and its internal detail; return preserved the collection and search query.
- Responsive checks covered 320, 390, 651, 901 and 1440 CSS pixels. No page overflow occurred. Mobile filters wrap, with all destinations visible.
- Confirmed the repeated introductory paragraph is absent and the collection heading occupies only its accessible 1 px box.
- No browser console errors captured in the final review.

Evidence: `governance-artwork-desktop.png`, `governance-artwork-mobile.png` and `governance-artwork-checks.json`. These are local preview results; no deployment was performed.
