# Shielded Labs Portal

Two portals in one Next.js app:

- **Zcash Governance**: proposals, votes, grants, results, ZCAP, the Dev Fund calendar, transparency records and the library of Zcash Improvement Proposals, read from public sources.
- **Shielded Labs**: the organization's projects, repository activity, milestones, team, articles and guides, including the Crosslink manual.

It is a prototype for review, not an official Shielded Labs or Zcash site. Every page sends `noindex, nofollow`.

## Live preview

| What | Address |
| --- | --- |
| Zcash Governance | <https://shielded-labs-portal-preview.up.railway.app/governance> |
| Shielded Labs portal | <https://shielded-labs-portal-preview.up.railway.app/?view=overview> |

The preview runs on Railway from this repository's `main` and is updated by hand; a push does not deploy it. The contact form there is demo-only and sends nothing.

## Clone and run

You need Node.js 20.9 or later, npm, and Python 3 for the importer tests. No database, account, credential or environment file is required.

```sh
git clone https://github.com/Michae2xl/shielded-labs-portal.git
cd shielded-labs-portal
npm ci
npm run dev
```

Then open:

- Zcash Governance: <http://127.0.0.1:4248/governance>
- Shielded Labs portal: <http://127.0.0.1:4248/?view=overview>

For the optimized build, run `npm run build` and then `npm start`, on the same addresses.

### How the addresses work

`/governance` is the governance portal. The Shielded Labs portal answers at `/` and at `/shielded-preview` when the link names one of its views, for example `?view=overview`. Any other request to those two paths goes to `/governance`, so older links written as `?view=governance&…` still work. The bare root answers with the governance front page, because the hosting health check asks `/` for a 2xx.

### Where things are

| Path | What it holds |
| --- | --- |
| `src/app/governance` | The governance portal's page, header and metadata |
| `src/app/shielded-preview` | The screens of both portals |
| `src/lib/shielded-preview` | Data, importers' output and the logic behind the screens |
| `src/app/api` | The routes that read the public sources |
| `scripts` | Importers, source checks and the isolation check |
| `tests/e2e` | Screen checks that open every page in Chrome |
| `docs` | Maintenance guide, hosting settings and provenance records |

### Hosting your own copy

Build with `npm run build:feedback` and start with `npm run start:hosted`, which listens on the platform's `PORT` on `0.0.0.0`. Use `/` as the health check and Node.js 22. This mode keeps contact delivery disabled and needs no database or credentials. The settings used for the preview are in [docs/feedback-hosting.json](docs/feedback-hosting.json), and the deploy steps are in [docs/MAINTAINING.md](docs/MAINTAINING.md).

To share a session from your own machine, use `npm run build:feedback` followed by `npm run start:feedback`; rebuild with `npm run build` to leave that mode.

### Notes

The preview flag set by the scripts is a release guard, not authentication. Typography is self-hosted: Jost for headings and navigation, Inter for body text and data, Geist Mono for code. Jost comes from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/jost) under the SIL Open Font License, included at `public/fonts/Jost-OFL.txt`. The code is under the [MIT License](LICENSE); third-party material is listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Verify

```sh
npm run check:isolation
npm test
npm run test:importer
npm run test:sources
npm run test:zips
npm run lint
npm run build
npm run typecheck
npm run test:e2e   # after the build: opens every screen in the installed Chrome
```

CI runs the same checks on every pull request. What updates itself, what needs a person, the daily source alerts and the deploy steps are in [docs/MAINTAINING.md](docs/MAINTAINING.md).

## ZIP library

Governance includes the Zcash Improvement Proposals from [zcash/zips](https://github.com/zcash/zips) (MIT), unofficial previews of its open pull requests, and a `How it works` guide. The proposals are rendered outside the server by `scripts/zips/import_zips.py`: reStructuredText through docutils with raw HTML and file insertion disabled, Markdown through Python-Markdown, formulas as MathML, and an allowlist that keeps only known tags and attributes. The output uses the same inert node shape as the editorial import, so no proposal HTML reaches the browser.

- The bundled snapshot lives in `src/lib/shielded-preview/zips` (index, metadata and one JSON document per ZIP) with PNG figures under `public/shielded-preview/zips`. Refresh it with `npm run import:zips`, which expects a zcash/zips checkout at `../zips` (`--source` accepts another path); add `--pulls pulls.json` with the output of `gh api --paginate --slurp -X GET repos/zcash/zips/pulls -f state=open -f per_page=100` to include the open pull requests, which the importer fetches from the checkout's `origin` by their head commits. Rendering needs `pip install -r scripts/zips/requirements.txt`; `npm run test:zips` skips the rendering tests when those packages are missing.
- `.github/workflows/zips-sync.yml` lists the open pull requests with the workflow token, renders the repository and the pull request heads every six hours and publishes the result to the `zips-data` branch without a deployment. Set `ZIPS_DATA_URL` to that branch's raw base, for example `https://raw.githubusercontent.com/Michae2xl/shielded-labs-portal/zips-data`, and the API serves the synchronized index and documents, validated on read, with a five-minute cache; the bundled snapshot remains the fallback. Without the variable the portal serves the snapshot only and makes no network request for ZIPs. While the repository is private, raw.githubusercontent.com also needs `ZIPS_DATA_TOKEN`: a fine-grained personal access token limited to this repository with read-only Contents permission, set on the server only.
- Pull request previews are third-party content: they pass the same allowlist as merged documents, carry the pull request number and head commit, and are labelled as unofficial on every record. Only files under `zips/` with a ZIP header are rendered; pull requests without one are listed in `meta.json` as failures.

## Included

- Governance: Overview, Proposals, Voting, Grants, Results, ZCAP and Insights, with internal records and preserved filters.
- Six projects, repository activity, milestones and team profiles.
- Twenty imported articles, project guides, FAQs, Crosslink manual, institutional pages and local media.
- Existing contact integration and embedded Crosslink, NSM and Dynamic Fees simulators.
- Original tests, import utility, source attribution, local fonts and previous review evidence.

## Data boundaries

The application uses public HTTP sources for current review proposals, grants, payments, voting results, ZCAP and GitHub. Current Coinholder proposals come directly from the FPF GitHub repository and remain separate from archived Q3 results. Source dates and offline snapshot behavior remain visible. It does not import the OpenZcash database schema, authentication, credentials or background schedulers.

The 753 historical ZCG proposals remain the published snapshot captured on 25 October 2026. In OpenZcash their refresh used its local database; this standalone version deliberately retains `snapshot` status and the original timestamp. A future independent history source is required to refresh those records. The public review queue is a separate dataset and continues to refresh.

Article, team, project and milestone content also remains dated editorial data. Source refreshes happen on request and while the portal is visible; this is not a background editorial service.

Outside feedback mode, the contact form forwards to the existing Shielded Labs service when submitted. In the hosted feedback preview, delivery is disabled in both the browser and the API. Automated checks use mocked responses; real email delivery has not been tested. A draft survives navigation between Contact and Privacy in memory only and is discarded when leaving About or reloading. Simulators still run on their original hosts.

## Provenance and next work

See [the extraction record](docs/repository-separation.md), [source manifest](docs/extraction-manifest.json) and [third-party notices](THIRD_PARTY_NOTICES.md). The material in `reports/shielded-preview` describes checks performed in the original project; the standalone validation is recorded separately in `reports/repository-separation.md`.

Remaining work for an official release includes independent history refresh, durable source monitoring, full-record governance search, real contact-delivery validation, editorial/privacy review and redirect/SEO planning. The sidebar search covers the curated page index; live governance records and commits have their own search fields.
