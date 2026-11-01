# Insights composition — 29 October 2026

## Change

Replaced the repeated metric-card grid with two coordinated panels: an aggregate visualization and a compact list of supporting records. The change is limited to the Insights component and its stylesheet.

- ZCG decisions: proportional SVG distribution, total records, aligned status/count/share rows, direct filtered-archive links and recent decision records.
- Grant payments: combined historical USD budget and recorded ZEC totals, separate program breakdowns, recent payment links to internal grant records.
- Q3 outcomes: proposal distribution with requested amounts, alongside the largest requests with a Funded voting outcome.
- NU7 comparison: numbered questions with aligned leading-response columns, preserving separate voting bases and explicit inclusion of abstentions.
- Full-width view navigation, no repeated page introduction, and the existing inline sources panel.

The source datasets, aggregation logic, payment/decision distinctions and result calculations were retained. Exact amounts remain available; no currency conversion or new interpretation of grant status was introduced.

## Validation

- Production build and TypeScript passed.
- Component lint passed.
- Existing governance/metrics tests: 8 passed across 2 files.
- 23 recorded browser checks, covering all four views at 1280, 390 and 320 CSS pixels; visual review also at 1440 pixels.
- No horizontal page overflow in these checks. View controls remain at least 48 px high.
- An initial narrow-screen ZEC line wrap was corrected; both aggregate values fit one line at 320 px, including with the scrollbar present.
- Status links opened the matching archive filter. Recent decisions, payments and Q3 proposals opened the correct internal records. Program and outcome links retained their filters.
- Browser Back restored Insights; NU7 selection survived reload. The comparison link opened the selected ZCAP question with All responses selected.
- Methodology remained accessible inline. No browser console errors were captured in the final review.

## Evidence

- `insights-redesign-checks.json`
- `insights-redesign-decisions-desktop.png`
- `insights-redesign-payments-desktop.png`
- `insights-redesign-outcomes-desktop.png`
- `insights-redesign-comparison-desktop.png`
- `insights-redesign-mobile.png`

Local preview only. No commit, deployment or public-site change was performed.
