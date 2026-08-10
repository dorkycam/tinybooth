# Release credentials setup

One-time setup so `build.yml` can build and submit without anyone typing a password.

Store credentials live in **EAS**, not in GitHub. `eas submit` reads them server-side, so no
private key is ever written to a CI runner's disk and GitHub holds exactly one secret.

Nothing here is committed. See `SECURITY.md`.

## 1. The one GitHub secret

**Settings > Secrets and variables > Actions > New repository secret**

| Secret | What it is | Where to get it |
|---|---|---|
| `EXPO_TOKEN` | EAS access token, so CI can run `eas build` / `eas submit` as you | expo.dev > your account > **Access tokens** > Create token. Copy it immediately, it is shown once. |

That is the complete list.

## 2. App Store Connect API key, stored in EAS

This replaces Apple ID + password + 2FA. CI cannot do 2FA, so this is the only workable path.

1. [App Store Connect](https://appstoreconnect.apple.com) > **Users and Access** >
   **Integrations** tab > **App Store Connect API** > **Team Keys**.
2. Click **+**, name it, set Access to **App Manager**.
3. **Download the `.p8`.** Apple allows exactly one download. Lose it and you revoke and
   reissue.
4. Note the **Key ID** and **Issuer ID** shown on that page.
5. Hand it to EAS:

   ```sh
   eas credentials --platform ios
   ```

   Choose the production profile, then **App Store Connect API Key** > **Set up a new key**,
   and give it the `.p8`, the Key ID, and the Issuer ID when prompted.

Delete the local `.p8` afterwards. EAS has it now.

## 3. Play service account, stored in EAS

1. [Play Console](https://play.google.com/console) > **Setup** > **API access**.
2. Link a Google Cloud project if you have not already.
3. Create a service account (this bounces you to Google Cloud IAM), then create a **JSON key**
   for it and download the file.
4. Back in Play Console, grant that service-account email **Release** permission for this app
   under **Users and permissions**.
5. Hand it to EAS:

   ```sh
   eas credentials --platform android
   ```

   Choose **Google Service Account Key** and point it at the JSON file.

The Play Console UI moves these around. If "API access" is not under Setup, look under Users
and permissions.

## 4. Environments

`build.yml` runs inside a GitHub Environment picked from the build profile:

| Trigger | Profile | Environment | Goes to |
|---|---|---|---|
| Manual run, profile `preview` | `preview` | `develop` | TestFlight + Play internal |
| Manual run, profile `production` | `production` | `production` | Public store release |
| `v*` tag (release-please, from `main`) | `production` | `production` | Public store release |

Production only ever happens from `main`: the tag is created when you merge the release PR that
release-please opens against `main`.

`scripts/setup-branch-protection.sh` creates both environments and adds you as a required
reviewer on `production`, so a tag cannot reach a public store unattended. `develop` is left
ungated so TestFlight builds stay one click.

## 5. Check it before trusting it

Do not let the first real run be a release tag.

**Actions > build > Run workflow**, profile `preview`, submit `false`. That exercises
credentials and the build without touching a store. Once green, run it again with submit
`true` to check the submit path against TestFlight and Play internal.

## Order of operations

1. Add `EXPO_TOKEN` (section 1)
2. Upload the ASC API key to EAS (section 2)
3. Upload the Play service account to EAS (section 3)
4. Create the environments (section 4, or run the setup script)
5. Manual `preview` build, no submit
6. Manual `preview` build with submit
7. Only then rely on tags

## How to ship

Use the **build** workflow — Actions > build > Run workflow. There is no local shipping
script; a second path would only drift from CI.

Note that "submit" means "upload", not "release to users":

- **Android** lands as a **draft** on its track (`releaseStatus: "draft"` in `eas.json`). You
  promote it in Play Console.
- **iOS** lands in App Store Connect and goes through TestFlight processing. Submitting for
  App Store review is a separate manual step.
- A **`production`** build additionally waits on the environment's required reviewer.

All three are deliberate. Nothing reaches users without a human.

## Troubleshooting

**`eas submit` cannot find the app on iOS.** Already handled: `ascAppId` is pinned in both
submit profiles. That value is the numeric App Store Connect app ID, visible in the app's URL
there. It is an identifier, not a credential, and is public in every App Store link, so it
belongs in the committed config.

**"You must be logged in" in CI.** `EXPO_TOKEN` is missing or expired. It is the only GitHub
secret this workflow needs.

**iOS builds start failing after Feb 2027.** The distribution certificate and provisioning
profile expire 2027-02-17. EAS can usually renew them itself, since its App Store Connect API
key holds an ADMIN role.

## What triggers a real release

Covered in [CONTRIBUTING.md](../CONTRIBUTING.md). Short version: merging to `main` makes
release-please open a Release PR; merging that PR tags `vX.Y.Z` and publishes a GitHub Release;
the tag triggers `build.yml`, which waits on your `production` environment approval.
