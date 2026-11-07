# Third-party notices

Portal code and the small reused catalogs/utilities were extracted from [OpenZcash](https://github.com/Michae2xl/openzcash). Its MIT license and copyright notice are preserved in `LICENSE`. The extraction includes local changes that were not yet committed upstream; see the manifest for file-level provenance.

Shielded Labs names, logos, editorial text, portraits and project material retain their original ownership and source attribution. Their inclusion does not imply that the code's MIT license changes their licensing. Source URLs and capture dates are retained in the data files and readers.

Inter and Geist Mono font files are unchanged copies of the Google Fonts assets already used by the source application. They are served locally so installing/building the portal does not require a font download. Their SIL Open Font License notices are in `public/fonts/Inter-OFL.txt` and `public/fonts/GeistMono-OFL.txt`.

- [Inter license](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt)
- `public/fonts/og/inter-latin-{400,500}-normal.woff` are unchanged copies from `@fontsource/inter` 5.2.6 (same license), used only to draw share images.
- [Geist Mono license](https://github.com/google/fonts/blob/main/ofl/geistmono/OFL.txt)

Simulator applications are embedded from their original publishers and have not been copied or relicensed. Dependencies retain their respective licenses in their packages.

ZODL, Zkool and Vizor wallet logos are unchanged assets from their official sites or repository. They retain their original ownership and are used only to identify links to the respective wallets. Source URLs and hashes are recorded in `docs/wallet-logo-sources.json`.

## Zcash Improvement Proposals

The ZIP library under `src/lib/shielded-preview/zips` and the figures under
`public/shielded-preview/zips` are rendered from the zcash/zips repository
(https://github.com/zcash/zips), which is published under the MIT license
(see its `COPYING.rst`). Individual documents state their own license in the
header shown on each record. The repository remains the canonical text; the
portal shows a rendered copy with attribution and a link to the source file.
