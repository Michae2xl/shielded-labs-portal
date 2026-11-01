# Shielded Labs Portal

Independent local repository for the Shielded Labs governance, research and community portal. Extracted from the OpenZcash working directory on 1 November 2026, including the latest local interface work from 29 October.

## Run locally

Requires Node.js 20.9 or later, npm and Python 3 for importer tests.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4248/shielded-preview>. `/` also opens the portal. Existing query links under `/shielded-preview` are preserved. The scripts enable the local preview flag and bind to loopback. No `.env`, database, OpenZcash checkout or credentials are required.

For the optimized local server:

```sh
npm run build
npm start
```

The preview flag is a release guard, not authentication. Public deployment needs a separate release review. This repository has not been deployed and has no GitHub remote configured by the extraction.

## Verify

```sh
npm run check:isolation
npm test
npm run test:importer
npm run lint
npm run build
npm run typecheck
```

## Included

- Governance: Overview, Proposals, Voting, Grants, Results, ZCAP and Insights, with internal records and preserved filters.
- Six projects, repository activity, milestones, team and community profiles.
- Twenty imported articles, project guides, FAQs, Crosslink manual, institutional pages and local media.
- Existing contact integration and embedded Crosslink, NSM and Dynamic Fees simulators.
- Original tests, import utility, source attribution, local fonts and previous review evidence.

## Data boundaries

The application uses public HTTP sources for current review proposals, grants, payments, voting results, ZCAP and GitHub. Source dates and offline snapshot behavior remain visible. It does not import the OpenZcash database schema, authentication, credentials or background schedulers.

The 753 historical ZCG proposals remain the published snapshot captured on 25 October 2026. In OpenZcash their refresh used its local database; this standalone version deliberately retains `snapshot` status and the original timestamp. A future independent history source is required to refresh those records. The public review queue is a separate dataset and continues to refresh.

Article, team, project and milestone content also remains dated editorial data. Source refreshes happen on request and while the portal is visible; this is not a background editorial service.

The contact form forwards to the existing Shielded Labs service when submitted. Automated checks use intercepted responses; real email delivery has not been tested. Simulators still run on their original hosts.

## Provenance and next work

See [the extraction record](docs/repository-separation.md), [source manifest](docs/extraction-manifest.json) and [third-party notices](THIRD_PARTY_NOTICES.md). The material in `reports/shielded-preview` describes checks performed in the original project; the standalone validation is recorded separately in `reports/repository-separation.md`.

Remaining release work includes independent history refresh, durable source monitoring, complete governance search, real contact-delivery validation, editorial review, redirect/SEO planning and deployment.
