#!/usr/bin/env bash
#
# One-time repo setup: create `develop`, make it the default branch, and protect
# both long-lived branches so nothing can be pushed to them directly.
#
# Resulting flow:
#   feature branch -> PR -> develop -> PR -> main -> release-please -> tag + Release
#
# Requires gh authenticated with the `repo` scope (`gh auth login`).
#
# Safe to re-run. Every call is idempotent.

set -euo pipefail

# gh prefers GITHUB_TOKEN/GH_TOKEN over the credential it stored at login, so a
# stale token in the environment makes every call fail with "Bad credentials"
# even when `gh auth login` succeeded. Blank them for this script and let gh
# fall back to the keyring.
unset GITHUB_TOKEN GH_TOKEN

REPO="${REPO:-dorkycam/tinybooth}"

# Must match the job `name:` values in .github/workflows/ci.yml. If you rename a
# job there, rename it here too or the branch will wait forever on a check that
# no longer reports.
CHECK_BUILD="typecheck + lint + test"
CHECK_SECRETS="gitleaks"

echo "==> Repo: $REPO"

if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 0. Let Actions open pull requests.
#
# release-please works by opening a "Release vX.Y.Z" PR. With this off it can
# create its release branch and then dies with "GitHub Actions is not permitted
# to create or approve pull requests", leaving an orphaned branch behind and no
# release. This is the single setting that makes the release chain work.
#
# default_workflow_permissions stays `read`: every workflow here declares the
# scopes it needs, so the repo-wide default should stay minimal.
# ---------------------------------------------------------------------------
echo "==> Allowing Actions to open pull requests (required by release-please)"
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=true >/dev/null

# Housekeeping for a PR-only flow: delete the head branch once a PR merges, so
# merged feature branches do not pile up on the remote.
echo "==> Enabling delete-branch-on-merge"
gh api -X PATCH "repos/$REPO" -F delete_branch_on_merge=true >/dev/null

# ---------------------------------------------------------------------------
# 1. Create `develop` from `main` if it does not exist yet.
# ---------------------------------------------------------------------------
if gh api "repos/$REPO/branches/develop" >/dev/null 2>&1; then
  echo "==> develop already exists, leaving it alone"
else
  echo "==> Creating develop from main"
  MAIN_SHA="$(gh api "repos/$REPO/git/ref/heads/main" --jq .object.sha)"
  gh api "repos/$REPO/git/refs" \
    -f ref='refs/heads/develop' \
    -f sha="$MAIN_SHA" >/dev/null
fi

# ---------------------------------------------------------------------------
# 2. Make `develop` the default branch, so new PRs target it automatically.
# ---------------------------------------------------------------------------
echo "==> Setting default branch to develop"
gh api -X PATCH "repos/$REPO" -f default_branch=develop >/dev/null

# ---------------------------------------------------------------------------
# 3. Protect both branches.
#
# required_approving_review_count is 0 on purpose: this is a solo-maintainer
# repo and GitHub does not let you approve your own PR, so requiring 1 would
# lock the maintainer out of their own project. The PR itself is still
# mandatory, so `git push origin main` is refused either way. Raise this to 1
# the moment a second maintainer joins.
#
# enforce_admins=true is what makes "no one, including me" true. Turn it off
# temporarily if you ever need to force-push a fix.
# ---------------------------------------------------------------------------
protect() {
  local branch="$1"
  echo "==> Protecting $branch"
  gh api -X PUT "repos/$REPO/branches/$branch/protection" \
    --input - >/dev/null <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["$CHECK_BUILD", "$CHECK_SECRETS"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false,
  "required_conversation_resolution": true
}
JSON
}

protect main
protect develop

echo
echo "==> Done."
gh api "repos/$REPO" --jq '"default branch: " + .default_branch'
for b in main develop; do
  gh api "repos/$REPO/branches/$b/protection" \
    --jq '"'"$b"': PR required, admins enforced=" + (.enforce_admins.enabled|tostring) + ", checks=" + ([.required_status_checks.contexts[]]|join(", "))'
done
