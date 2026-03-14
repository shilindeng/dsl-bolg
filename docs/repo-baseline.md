# Repository Baseline

This repository is the single source of truth for future DSL Blog changes.

Current baseline:

- Public and admin UI follow the routes implemented in the `client` workspace.
- Server API, Prisma schema, content scripts, and deployment scripts follow the `server` workspace in this repository.
- Online-only admin pages that are not present in this repository are treated as drift, not as baseline.

For this round of work, the repository baseline intentionally includes:

- `/admin/dashboard`
- `/admin/homepage`
- `/admin/newsletter`
- `/admin/series`
- `/admin/taxonomy`
- `/admin/api-keys`
- `/editor`

It intentionally does not restore or require separate `/admin/posts`, `/admin/projects`, or `/admin/comments` pages before other work can continue.
