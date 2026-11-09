# Zcash proposal explorer — source review, 9 November 2026

The ZIP tab keeps the complete library and adds a curated funding, governance and voting research view: List, Map (support bars, general landscape, statement timeline), and Compare (up to three records).

## Data and evidence

- `src/lib/shielded-preview/zips/dev-fund.ts`: original funding proposals, explicit withdrawal sources, dated public statements, relationships, and URL state.
- `dev-fund-additional.json`: eleven governance, funding, and polling drafts reviewed against immutable GitHub revisions. Together the view contains seventeen records, including a requested no-change baseline and historical proposals. This is not an official ballot or a complete ZIP register.
- The targeted import adds nine missing documents and reviews eleven PR heads. The full-library synchronization date remains 5 November; the curated review date is 9 November. The pinned commit on each proposal is the relevant version for the comparison.
- `public/governance-profiles/sources.json`: provenance for locally cached public account avatars. No third-party image domains were added to the portal's CSP. Initials remain a fallback if an asset fails.

## Support bars

One unit is one distinct public account's latest reviewed statement for that proposal within the selected source filter. Co-author statements are excluded from the bars and identified in the timeline. Accounts are not verified unique humans. The common scale is the largest catalogued account sample, not an electorate denominator. No ranking, probability, voting percentage, or inferred position is generated.

The sample includes dated statements from the full accessible ZAP forum thread and selected other proposal discussions. Only explicit positions are counted; participant names expand from the counts and are alphabetically ordered, without weighting prominence. Adoption experiences are separately listed and excluded from support counts. Missing evidence remains unknown. Forum and X are separately filterable. X coverage is a partial selection of publicly visible author posts and replies. Engagement on the author post is a separate dated snapshot and never feeds the bars.

Historical responses do not prove support for later edits. A closed pull request is not automatically a withdrawal: PR #1414 is marked withdrawn based on its author's explicit X announcement; the committee taper uses its forum withdrawal; PR #1421 remains an earlier open draft rather than being incorrectly labeled closed.

## Maintaining the view

1. Read the canonical PR head, complete draft, and explicit status announcements. Preserve immutable source links and original owners.
2. Import new full documents with the existing ZIP renderer and link resolver. Update the index counts without claiming a complete synchronization when only selected PRs were refreshed.
3. Add an explicit, dated source and context for each statement. Mark authors; do not infer support from likes, affiliation, silence, or ambiguous replies.
4. Refresh the manual review date only after reviewing changed records. The explorer warns when a loaded library revision differs from its pinned comparison.
5. Run typecheck, lint, the test suite and build; check pointer and keyboard selection, source filters, historical filters, document/back navigation, comparison limits, and mobile layout.

## Topic map and X review

The general map uses Funding (gold), Governance (white), and Voting (gray) sectors with visible separators. The Zcash logo does not imply that every proposal is a Dev Fund decision. Proposed changes, a current-rules reference, and historical proposals have distinct labels; historical records occupy a separate dashed section.

On 9 November, two xAI X Search research calls fetched 60 post results in total (not necessarily distinct) and 11 user results. Direct original posts were then checked in the browser before adding Josh Swihart, Barry Silbert, Brian Cohen and co-author Zooko. Tyler Winklevoss’s broader statement on ending the Dev Fund is linked as related discussion, not attributed to the lockbox. Vague replies and third-party reports were not counted. This is a bounded manual review, not an exhaustive X crawl or an automatic refresh pipeline. Credentials were used in memory only and were not added to this repository or the client.

UI validation found a conflict between centered map-node transforms and the global button press animation. Map placement now uses the independent CSS `translate` property so pointer clicks stay on the node while pressing it.

## Navigation cleanup

The default map opens the topic overview. List, Map and Compare stay available; map views use Overview, Public positions and Timeline. Search, topic and status are grouped, with a single result count and Clear filters. Status supports current, historical-only and all records; old `past=0` links still resolve to current records. URL state preserves filters on document return.

Source selection sits beside public positions or the selected proposal’s statements, rather than implying it changes the topic map. Secondary statement context and comparison sources expand on demand. A Back to proposals control returns to browsing after selecting a card. Topic-only and historical-only maps omit empty sectors.


## Inclusive positions review

The 9 November review retrieved 289 accessible posts from the ZAP topic, not 289 supporters. Deleted/hidden posts, quoted text, general praise, likes and ambiguous reactions are not explicit ZIP positions. The expanded sample adds 24 dated forum records across ZAP, member restrictions, Town Square, human participation and ecosystem grants. This remains a curated, incomplete evidence sample, not an exhaustive census.

ZAP PR #1431 still points to `e0677267f46c4de9dec28146132cba4668161cb2`. Forum post 283 instead links a revised draft in `violetrollergirl/zcash-zips` at `ad90f2e5b7318338ac9490702c3b0f653a5643a8`. Paul Brigner’s support and vaspholdings’ concerns explicitly reference that revised text. Their entries retain this source; the UI warns that ZAP positions span drafts. The revised draft credits emersonian, whose earlier statement is therefore excluded from independent totals. The comparison’s pinned PR text is not silently replaced with a contributor’s branch.

Every record has an authors’-aim summary linked to its proposal source, not a portal endorsement. The timeline uses day grouping and the portal’s gold/white/gray palette. Support counts open equal participant/source lists on both the bar view and Compare. No credentials or xAI responses were copied into client data. A third exploratory X search was not treated as verified evidence; no unverified X findings were added.


## Expanded review and ordering (9 November)

The additional bounded review adds 45 dated records (34 Forum, 11 X), including ordinary community accounts and explicit positions on the lockbox, ZAP, lock-weighted polling, Town Square, wind-down and historical proposals. Two further X discovery calls returned 80 post results before direct source verification. These search results were not treated as votes or a complete census. Every proposal now has a compact coverage disclosure, including author-only topics and discussions where no specific X position was verified.

Tyler's post `2116209929518494040` explicitly quotes the compromise announcement and supports it with reservations. It is included; his different general Dev Fund post remains separate context. Replies must be checked against their parent: Shieldedmark's support in topic 58906 replies to the ZIP 248 process comment, not the no-change option, and was not counted for that option. Paul Brigner's X article is recorded as a concern about legal-defense operations, not blanket opposition.

Public positions sort by total reviewed independent accounts for the selected source, descending, with alphabetical ties. Zero-record proposals remain at the end. This order measures recorded activity, not approval, probability or community consensus. Search, topic, status, comparison selections and the separate map order remain intact.

Selected map cards use one topic-colored border and subtle fill; keyboard focus is an inset white outline, avoiding the previous double outer contour.
