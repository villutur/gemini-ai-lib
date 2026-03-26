# Release Workflow

This document describes the repo-safe manual release flow for
`@villutur/gemini-ai-lib`.

## Prerequisites

Before starting a release:

1. You are logged into npm:
   - `npm whoami`
2. npm account 2FA is configured according to your org/publish policy.
3. Git worktree is clean (no staged/unstaged changes).
4. Current branch has an upstream and is fully synced (no ahead/behind).
5. You are in the repository root.

## Version Bump

Use the release bump script:

```bash
pnpm release:bump --patch
```

Supported options:

- `--patch` (default)
- `--minor`
- `--major`
- `--version X.Y.Z`
- `--skip-checks` (emergency only)

By default, the script enforces:

- clean git worktree
- upstream configured and synced (ahead/behind check)
- `pnpm typecheck`
- `pnpm build`
- `npm pack --dry-run`

If all checks pass, the script will:

1. bump `package.json` version
2. create commit `chore(release): vX.Y.Z`
3. create annotated tag `vX.Y.Z`

## Publish

Publish explicitly after reviewing the bump commit/tag:

```bash
pnpm release:publish
```

Then push:

```bash
git push
git push --tags
```

## Rollback Guidance

### Before publishing to npm

If the release commit/tag is wrong and package is not published yet:

1. Delete local tag:
   - `git tag -d vX.Y.Z`
2. Revert or reset the release commit according to team policy.
3. Re-run `pnpm release:bump` with the intended version.

### After publishing to npm

Published versions should generally not be overwritten.

- Prefer publishing a fixed follow-up version.
- If required, deprecate the broken version:
  - `npm deprecate @villutur/gemini-ai-lib@X.Y.Z "message"`
- Avoid unpublish except in exceptional policy-approved cases.
