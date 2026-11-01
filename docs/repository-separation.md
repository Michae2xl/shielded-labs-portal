# Repository separation — 1 November 2026

The source is the local `Michae2xl/openzcash` checkout, including uncommitted portal work. Its base Git commit and SHA-256 hashes of all copied source files are preserved in `extraction-manifest.json`. The portal files were not committed in that checkout, so this repository begins with a new import commit instead of claiming a preserved Git history for them.

## Extraction scope

Copied the portal UI, portal API routes, typed data, tests, editorial importer, public media and portal-specific documentation/review evidence. Copied the small public CSV utility, Q3 round catalog and community catalog needed by those modules. Preserved the original MIT license and OpenZcash attribution.

Did not copy `.env` files, secrets, database files, migrations, authentication, unrelated OpenZcash routes, deploy configuration, `node_modules`, `.git` or agent settings. The final repository installs its own dependencies with its own lockfile. The original source files remain in place, unchanged by this extraction.

## Necessary adaptations

1. Added standalone application metadata, global styles, locally hosted font assets, root entry point and minimal framework/security configuration. The portal components and established URLs are preserved.
2. Removed direct access to OpenZcash's database-backed `listProposals` function. Historical proposals retain the bundled published snapshot and original date; public sources continue to refresh independently.
3. Removed OpenZcash authentication and scheduled import initialization. The local opt-in route guard remains, including the new `/` entry point.
4. Created a minimal package manifest and lockfile, local run scripts, isolation checks and standalone validation evidence.

## Future source-project cleanup

The original checkout has substantial unrelated uncommitted work. Nothing was deleted or committed there. Removing the old portal copy and its shared integration points should be a separately reviewed cleanup after accepting this repository. It is not required to run this repository.

## Publication boundary

Creating this repository does not migrate the public Shielded Labs website, publish code to GitHub, change ownership, send a message or validate real contact delivery. Existing source dates and evidence limitations still apply.
