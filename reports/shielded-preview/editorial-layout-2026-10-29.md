# Blog, Resources and About layout review

Date: 29 October 2026. Local route: `/shielded-preview`.

## Changes

- Blog uses image-led cards across the available content width, with aligned metadata, summaries and reading links. Cards adapt from three to two to one column.
- Resources uses the same card system, with a content-type icon, concise description and direct access to guides, FAQs, roadmaps and simulator records.
- About puts its section menu first. Organization information and the mission share a row on wide screens; the six values use a responsive card grid. Board profiles, careers, contact and privacy remain internal destinations.
- Readers use the full layout width while limiting long paragraphs to a readable measure. Desktop section navigation becomes a native section selector on narrow screens. Related reading uses the same card spacing.
- Returning from an article, guide or simulator preserves its originating category and search. The search is also retained on reload. Redundant board-profile category text was removed.
- Existing imported content, source dates, images and external source links were preserved. No new organizational or project claims were added.

## Observed validation

- Production build completed successfully, including TypeScript. The existing Next.js middleware deprecation notice remains.
- ESLint passed for the changed TypeScript files.
- Three focused test suites passed: 14 tests covering editorial content/link handling, integrations and the new content-grouping/query helpers.
- 38 browser assertions passed; details are in `editorial-layout-checks-2026-10-29.json`.
- Representative layouts were checked at 320, 390, 1024, 1440 and 1686 CSS pixels. The inspected pages had no document-level horizontal overflow or popup detail views.
- Exercised Blog category/search, empty-search recovery, article opening, outline navigation, return and reload; Resources project/search, FAQ opening and question navigation; About organization, board profiles, closed role details, contact and privacy.
- The mobile FAQ selector reached the requested answer below the fixed header. The Dynamic Fees model loaded inside the portal, and changing its section retained the library return path.
- Verified article-to-project and project-to-resource navigation. The final browser console check contained no errors.

## Evidence

- `editorial-blog-desktop.png`, `editorial-blog-1440.png`, `editorial-blog-mobile.png`
- `editorial-resources-desktop.png`, `editorial-resources-mobile.png`
- `editorial-about-desktop.png`, `editorial-about-mobile.png`
- `editorial-article-desktop.png`, `editorial-article-mobile.png`, `editorial-faq-mobile.png`
- `editorial-contact-mobile.png`, `editorial-profile-mobile.png`

## Validation boundary

This review covers the local preview and emulated browser widths. No contact message was sent, no simulator calculations were changed or independently audited, and no deployment or publication was performed. Existing content-source dates remain visible in the readers.
