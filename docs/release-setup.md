# Release credentials setup

One-time setup so `build.yml` can build and submit without anyone typing a password. Until
this is done, a `v*` tag will fail at the `eas build` step.

Nothing here is committed. Secrets live in GitHub Actions and in EAS, never in git — see
`SECURITY.md`.

## 1. GitHub Actions secrets

Add these at **Settings > Secrets and variables > Actions > New repository secret**.

| Secret | What it is | Where to get it |
|---|---|---|
| `EXPO_TOKEN` | EAS access token, so CI can run `eas build` / `eas submit` as you | expo.dev > your account > **Access tokens** > Create token. Copy it immediately, it is shown once. |
| `ASC_API_KEY_BASE64` | The App Store Connect API private key (`.p8`), base64-encoded | See below |
| `ANDROID_SERVICE_ACCOUNT_JSON` | Google Play service-account JSON, whole file contents | See below |

### App Store Connect API key

This replaces Apple ID + password + 2FA. CI cannot do 2FA, so this is the only workable path.

1. [App Store Connect](https://appstoreconnect.apple.com) > **Users and Access** > **Integrations**
   tab > **App Store Connect API** > **Team Keys**.
2. Click **+**, give it a name, and set Access to **App Manager**.
3. **Download the `.p8`.** Apple lets you download it exactly once. If you lose it, revoke and
   make a new one.
4. On that same page, note the **Key ID** and the **Issuer ID** — you need both in step 2 below.

Encode the key for GitHub:

```sh
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n' | pbcopy
```

Paste that as `ASC_API_KEY_BASE64`. The `tr -d '\n'` matters — a wrapped value will not decode
cleanly in CI.

### Google Play service account

1. [Play Console](https://play.google.com/console) > **Setup** > **API access**.
2. Link a Google Cloud project if you have not already.
3. Create a service account (this bounces you to Google Cloud IAM), then create a **JSON key**
   for it and download that file.
4. Back in Play Console, grant the service account access: **Users and permissions** > invite
   the service-account email > give it **Release** permissions for this app.
5. Paste the entire contents of the JSON file as `ANDROID_SERVICE_ACCOUNT_JSON`.

The Play Console UI moves these around periodically. If "API access" is not under Setup, look
under Users and permissions.

## 2. Two values that are NOT secrets

The App Store Connect **Key ID** and **Issuer ID** are identifiers, not credentials — only the
`.p8` is sensitive. They belong in `eas.json`, committed.

**This is currently unwired.** `eas.json` submits with `appleId` + `appleTeamId`, which needs
interactive Apple 2FA and will fail under `--non-interactive`. Meanwhile `build.yml` writes
`secrets/asc-api-key.p8` and nothing reads it. `eas.json.example` already shows the correct
shape.

Replace the `ios` block in **both** submit profiles in `eas.json`:

```json
"ios": {
  "ascApiKeyPath": "./secrets/asc-api-key.p8",
  "ascApiKeyIssuerId": "<your Issuer ID>",
  "ascApiKeyId": "<your Key ID>"
}
```

Drop `appleId` and `appleTeamId` — the API key carries that context.

## 3. The `release` environment

`build.yml` declares `environment: release`, and the repo has no environments, so the job
cannot start.

**Settings > Environments > New environment**, name it exactly `release`.

While you are there, add yourself under **Required reviewers**. That is the gate that stops a
tag from shipping to the stores without your approval — the workflow is written assuming it
exists.

## 4. Check it before trusting it

Do not let the first real run be a release tag. Use the manual trigger:

**Actions > build > Run workflow**, profile `preview`, submit `false`.

That exercises credentials and the build without touching a store. Once it is green, run it
again with submit `true` to check the submit path against TestFlight and Play internal.

## Order of operations

1. Add the three secrets (section 1)
2. Wire the ASC key IDs into `eas.json` (section 2)
3. Create the `release` environment (section 3)
4. Manual `preview` build, no submit (section 4)
5. Manual `preview` build with submit
6. Only then rely on tags

## What triggers a real release

Covered in [CONTRIBUTING.md](../CONTRIBUTING.md). Short version: merging to `main` makes
release-please open a Release PR; merging that PR tags `vX.Y.Z` and publishes a GitHub Release;
the tag triggers `build.yml`, which waits on your `release` environment approval.
