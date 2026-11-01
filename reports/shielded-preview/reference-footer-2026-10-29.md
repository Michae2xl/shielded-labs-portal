# Compact references and footer — 29 October 2026

## Scope

- Consolidated governance calculation context, data-source access and refresh controls into a single inline panel, collapsed by default.
- Preserved the section-specific calculation notes, source provenance and all six catalog source links. Changing an Insights view closes the previous view's notes.
- Removed the separate Data sources row and duplicate governance footer source action.
- Added a compact shared footer with the original Shielded Labs shield and internal Contact/Privacy links. Other portal areas retain access to the general source dialog.

## Validation

- Production build and TypeScript completed successfully; focused lint passed for all seven changed TypeScript files.
- Browser checks covered Overview, Proposals, Grants, Voting, Results, ZCAP and Insights: each collection exposes one collapsed reference control and one refresh control.
- Calculation basis and full source catalog opened inline; all six catalog links remained present. Refresh completed and restored its enabled state.
- Desktop reference bar measured 62 px high; compact footer measured 78 px high.
- At 390 and 320 CSS pixels, references fit without horizontal page overflow. Expanded notes and source cards stack into one column.
- Footer Contact and Privacy links opened their corresponding internal pages. The contact form was not submitted.
- No browser console errors were captured in this check. Temporary viewport overrides were cleared.

## Evidence

- `reference-footer-desktop.png`
- `reference-footer-mobile.png`
- `reference-footer-checks.json`

Validated on the local preview only. No deployment or public-site change was performed.
