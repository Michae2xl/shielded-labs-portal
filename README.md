# Shielded Labs Portal

Independent local repository for the Shielded Labs governance, research and community portal. Extracted from the OpenZcash working directory on 1 November 2026, including the latest local interface work from 29 October.

Typography uses self-hosted Jost for headings and navigation, Inter for body text and data, and Geist Mono for code. Jost's variable font (weights 100–900) comes from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/jost), converted to WOFF2 without changing its glyphs; its SIL Open Font License is included at `public/fonts/Jost-OFL.txt`. The portal does not require a locally installed Futura font or third-party font requests.

## Run locally

Requires Node.js 20.9 or later, npm and Python 3 for importer tests.

```sh
npm ci
npm run dev
```

The app serves two portals. Zcash governance opens at <http://127.0.0.1:4248/governance>; the Shielded Labs portal opens at <http://127.0.0.1:4248/shielded-preview?view=overview>, and `/` answers the same views. Any other request to `/` or `/shielded-preview` that names no Labs view is redirected to `/governance`, so links written as `?view=governance&…` before the portals had separate addresses still work. The bare root answers with the governance front page itself, because the hosting health check asks `/` for a 2xx, and then shows `/governance` as its address. Existing query links under `/shielded-preview` are preserved. The scripts enable the local preview flag and bind to loopback. No `.env`, database, OpenZcash checkout or credentials are required.

For the optimized local server:

```sh
npm run build
npm start
```

The preview flag is a release guard, not authentication. The GitHub remote is `Michae2xl/shielded-labs-portal`. This workspace is a prototype. All pages send `noindex, nofollow`, which does not restrict access.

The independently hosted feedback preview is available at [shielded-labs-portal-preview.up.railway.app](https://shielded-labs-portal-preview.up.railway.app). It runs on Railway without the local Mac or a tunnel. At the owner's request, the interface has no global prototype notice; the contact form remains demo-only. See [deployment and validation](reports/hosted-preview-2026-11-01.md) and [service settings](docs/feedback-hosting.json). Updates require a new deployment; local edits are not automatically published.

For a shared feedback session, use `npm run build:feedback` followed by `npm run start:feedback`. This mode disables contact delivery in both the browser and the API. The form can be tried locally without sending any personal data. A Cloudflare Quick Tunnel can expose this loopback server temporarily; the URL only works while the tunnel and local server are running. Rebuild with `npm run build` to leave feedback mode.

For independently hosted feedback, configure the Railway service to build with `npm run build:feedback` and start with `npm run start:hosted` on the platform's `PORT` and `0.0.0.0`. Use `/` as its health check. The hosted service needs no database or credentials and uses Node.js 22 with `RAILPACK_NODE_VERSION=22`. It retains disabled contact delivery and noindex headers. `.railwayignore` excludes local build output, environment files and internal reports from uploads. Service settings are configured on Railway; deprecated `railway.json` deployment configuration is not used.

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
