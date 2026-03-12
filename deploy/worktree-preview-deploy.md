# Worktree Preview Deploy

This flow pushes the current local worktree to production without publishing the changes to GitHub first.

## Local command

```powershell
.\deploy\publish-worktree.ps1 -ServerHost 198.11.176.136 -KeyPath D:\vibe-coding\root.pem
```

What it does:

1. Runs `npm run build` in `server`.
2. Runs `npm run build` in `client`.
3. Creates a tarball from the current worktree.
4. Excludes `.git`, `node_modules`, build output, Playwright artifacts, and local logs.
5. Uploads the tarball and the remote installer script to the server.
6. Installs the remote script to `/opt/dsl-blog/bin/install-worktree-release.sh`.
7. Creates a new release from the uploaded tarball, reuses the shared env/database/uploads state, restarts services, and validates health checks.

## Remote command

```bash
DEPLOY_CONFIG=/opt/dsl-blog/config/deploy.env \
WORKTREE_BRANCH=codex/ope-20260309-codex \
WORKTREE_COMMIT=<local-head-sha> \
bash /opt/dsl-blog/bin/install-worktree-release.sh /tmp/dsl-blog-worktree-<timestamp>.tar.gz
```

The remote installer:

- does not modify `/opt/dsl-blog/repo`
- does not change the standard `update.sh` workflow for `origin/$DEPLOY_BRANCH`
- writes release metadata with `.source=workspace-upload`
- reuses the existing backup, build, restart, validation, and rollback flow

## After validation

When the preview looks correct in production, commit and push the current branch:

```powershell
git add .
git commit -m "..."
git push origin codex/ope-20260309-codex
```
