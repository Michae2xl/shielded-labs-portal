# Standalone repository validation — 1 November 2026

Final project: `Shielded Labs Portal`, in `Documents/ChatGPT/Shielded Labs Portal`.
The app is running locally on `http://127.0.0.1:4248/shielded-preview` from that directory.

## Automated checks

- 12 Vitest files, 55 tests passed, including independent public-source refresh and preservation of the original historical snapshot date.
- 4 Python editorial importer tests passed.
- Full portal ESLint check passed with no errors.
- Production build passed, including TypeScript and all 7 application routes.
- Repository isolation check passed: all application imports resolve locally; no database/auth dependencies, environment files or external project symlinks.
- No installed dependency symlink resolves outside the new project.
- Credential-pattern scan found no private keys, GitHub tokens or credential-bearing database URLs in the exported files.
- All 408 recorded source files still matched their pre-extraction SHA-256 hashes in OpenZcash.

## Browser checks in the final folder

- Overview rendered with the original shield, navigation, news images and project entry points.
- Opened Proposals, selected ZCG history, searched for Zcash Brazil and opened the 2026 record inside the portal. Returned to the list with the query preserved.
- The historical proposal displayed `Saved record · 25 Oct 2026` rather than a new observation date. The public review queue refreshed independently.
- Opened Blog and read the complete Epoch article with its cover and source details.
- At 390 CSS pixels, the article and Crosslink project detail stayed within the viewport. Opened the mobile menu, switched to Projects and selected Crosslink.
- No broken images were found in the inspected views. No browser console errors were captured.
- Saved desktop and mobile screenshots beside this report. Temporary viewport overrides were reset.

## Scope and remaining work

The unchanged dependency on external public data APIs and embedded simulator hosts is intentional. Historical proposal refresh remains a dated local snapshot, not a direct database connection. The source repository was preserved and no remote or deployment was created.

The prior full interaction reports remain under `reports/shielded-preview`. This pass verifies the extraction and representative desktop/mobile routes; it does not repeat every earlier interaction or validate actual email delivery.

The framework still emits its existing `middleware` deprecation notice. Migrating to the newer `proxy` filename is separate from this extraction.
