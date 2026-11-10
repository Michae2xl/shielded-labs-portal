# Maintaining the portal

The portal reads some sources live and carries dated copies of others. This page lists which is which, how to refresh each copy, and how changes reach the public preview.

## What updates itself

| Data | Source | Refresh | Without the source |
| --- | --- | --- | --- |
| Code activity (10 repositories) | GitHub REST API, conditional requests | 5-minute cache | Last reading, then `github-snapshot.json` |
| Latest Crosslink release | GitHub releases API | 5-minute cache | Last reading, then `github-snapshot.json` |
| NSM balance | Blockchair: tip height and chain value pools | 1-minute cache | Last reading, then the ZIP 237 balance at NU7 activation |
| ZCG review queue, grants, payments, committee, verification, coinholder proposals | `governance-provider.ts` | 5-minute cache | Last reading, then `governance-data/snapshot.json` |
| ZCG grants ledger | openzcash.org API | 5-minute cache | Hidden |
| ZIPs and open ZIP pull requests | `zips-data` branch, written every 6 hours by `zips-sync.yml` | Read only when `ZIPS_DATA_URL` is set | Bundled snapshot in `src/lib/shielded-preview/zips` |

The NSM balance is scheduled issuance minus the issued supply in all chain value pools at the tip, as ZIP 237 defines it; `src/lib/shielded-preview/nsm/balance.ts` holds the subsidy rules and the published test values. The formula holds until the reissuance height (block 8,939,664); from there the balance depends on every prior block and the portal stops computing it.

The GitHub sources run without a token. Conditional requests keep unchanged repositories out of the hourly limit; if the limit is reached, the pages show the last reading and say so.

## What needs a person

| Content | Where | How |
| --- | --- | --- |
| Blog posts and official pages | `editorial/catalog.json`, `editorial/documents.json` | `python3 scripts/shielded-preview/import-editorial.py`, or `--only <id>` to refresh one document and leave the rest |
| Articles published away from shieldedlabs.net | `editorial/linked-articles.ts` | Add an entry with a short summary and links. For the full text, paste it into `editorial/article-text/<id>.md` and run `npm run import:article-text`. The imported post replaces the entry once the site publishes an article with the same title |
| Team | `team-profiles.ts`, `TEAM_REVIEWED` in `content.ts` | Only what each person's own records show |
| Milestones | `milestones` and `MILESTONES_REVIEWED` in `content.ts` | Each entry cites its primary source; a network upgrade also points at its governance record |
| Polls, elections and network upgrades | `governance-data/record.json` | Update `checkedAt`; an upgrade entry may carry its own `checkedAt` |
| ZCG / Dev Fund calendar | `devFundPublished` in `governance-dev-fund.ts` | Fill questions and results only from what their authors publish |
| Crosslink guide | `crosslink-guide/` | `releaseTag` is the release the steps summarize; downloads follow the latest release automatically. Rounds and reward totals live in `history.ts` |
| Bundled GitHub snapshot | `github-snapshot.json` | `npm run snapshot:github` (uses the GitHub CLI login) |
| Bundled ZIP snapshot | `src/lib/shielded-preview/zips` | `npm run import:zips` with a checkout of zcash/zips next to this repository |

## Alerts

`.github/workflows/source-watch.yml` runs every day and files one issue, "Source changes to review", listing:

- new posts and changed pages on shieldedlabs.net, with the import command to run;
- new posts in the forum threads the portal cites, and posts by confirmed team accounts;
- a Crosslink release newer than the one the guide summarizes;
- dated content past its schedule: Dev Fund questions and results, the governance record, the bundled ZIP snapshot.

Run the same check locally with `npm run check:sources`.

## Checks

`.github/workflows/ci.yml` runs on every pull request and push to `main`. The same commands locally:

```sh
npm run lint
npm run typecheck
npm test
npm run test:importer
npm run test:sources
npm run test:zips      # needs: python3 -m pip install -r scripts/zips/requirements.txt
npm run check:isolation
npm run build
npm run test:e2e       # after the build; needs Google Chrome installed
```

## Deploy

The public preview does not deploy from Git. From a clean checkout of `main`, after the checks pass:

```sh
railway up --ci
```

Configuration the service reads:

- `SHIELDED_LABS_PREVIEW=1`, set by the start scripts, enables the data routes.
- `NEXT_PUBLIC_SHIELDED_LABS_FEEDBACK_PREVIEW` turns on feedback mode (see the README).
- `ZIPS_DATA_URL` makes the portal read the synced `zips-data` branch instead of the bundled ZIP snapshot. While this repository is private, `ZIPS_DATA_TOKEN` must hold a fine-grained token with read-only Contents access to it; once the repository is public, the token is not needed.
