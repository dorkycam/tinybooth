#!/usr/bin/env bash
# Wraps `eas build` + `eas submit` for the TinyBooth mobile app with safety
# prompts. Camrynn runs this from `apps/mobile/`.
#
# Usage:
#   ./scripts/build-and-submit.sh preview   # internal dist + TestFlight + Play Internal
#   ./scripts/build-and-submit.sh production
#
# What it does:
#   1. Verifies the eas-cli is installed and the user is logged in.
#   2. Confirms which profile is being shipped.
#   3. Runs `eas build --platform all --profile <profile> --non-interactive`.
#   4. Pauses for confirmation before `eas submit`.
#   5. Runs `eas submit --platform all --profile <profile> --non-interactive`.
#
# Required env (set via EAS secrets, not committed):
#   APPLE_ID, ASC_APP_ID, APPLE_TEAM_ID, ASC_API_KEY_ID, ASC_API_KEY_ISSUER_ID
#   plus ./secrets/asc-api-key.p8 and ./secrets/play-service-account.json on disk.
#
# Hard rules:
#   - Never commits real credentials. The `./secrets/` directory is gitignored.
#   - Never auto-promotes a build. Reviewer always confirms before submit.
#   - Aborts if working tree is dirty (uncommitted changes break the audit trail).

set -euo pipefail

PROFILE="${1:-}"

if [[ -z "$PROFILE" ]]; then
  echo "Usage: $0 <preview|production>" >&2
  exit 64
fi

if [[ "$PROFILE" != "preview" && "$PROFILE" != "production" ]]; then
  echo "Profile must be 'preview' or 'production'. Got: $PROFILE" >&2
  exit 64
fi

if ! command -v eas >/dev/null 2>&1; then
  echo "eas-cli not found. Install with: pnpm add -g eas-cli" >&2
  exit 1
fi

if ! eas whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: eas login" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; then
  echo "Working tree is dirty. Commit or stash before building." >&2
  exit 1
fi

GIT_SHA="$(git rev-parse --short HEAD)"
GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

cat <<EOF
About to ship TinyBooth.
  profile : $PROFILE
  branch  : $GIT_BRANCH
  sha     : $GIT_SHA
  who     : $(eas whoami)

Continue? (type "yes" to proceed)
EOF

read -r CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted."
  exit 1
fi

echo
echo "==> Building both platforms ($PROFILE)"
eas build \
  --platform all \
  --profile "$PROFILE" \
  --non-interactive \
  --message "build $GIT_SHA on $GIT_BRANCH"

echo
echo "Builds complete. Submit to App Store + Play Store now? (type \"submit\" to proceed)"
read -r SUBMIT_CONFIRM
if [[ "$SUBMIT_CONFIRM" != "submit" ]]; then
  echo "Skipping submit. Builds remain available in EAS for manual download."
  exit 0
fi

echo
echo "==> Submitting both platforms ($PROFILE)"
eas submit \
  --platform all \
  --profile "$PROFILE" \
  --non-interactive

echo
echo "Submitted. iOS shows up in App Store Connect, Android in Play Console."
echo "Apple review averages 24 to 48 hours. Play internal track is near-instant."
