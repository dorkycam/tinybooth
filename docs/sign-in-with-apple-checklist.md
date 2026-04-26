# Sign in with Apple compliance checklist

Apple Guideline 4.8 requires apps that offer any third-party social login
(Google Sign-In in our case) to also offer Sign in with Apple as a
peer option. TinyBooth offers Google + magic link, so SIWA must be
present.

This doc is a single-pass walkthrough for the things Camrynn or a future
auditor needs to verify before submission.

References:
- [Apple App Review Guideline 4.8](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple)
- [Sign in with Apple integration overview](https://developer.apple.com/sign-in-with-apple/get-started/)
- [Token revocation requirements (2024)](https://developer.apple.com/help/app-store-connect/manage-your-team/revoke-tokens-for-sign-in-with-apple)
- [Sign in with Apple JS server-to-server notifications](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api)

## 1. Provisioning + capability

- [ ] In App Store Connect -> Users and Access -> Keys, generate a Sign in
      with Apple key and download the `.p8` file. Save the Key ID + Team ID;
      the server uses both to mint client-secret JWTs.
- [ ] In the developer portal -> Identifiers, edit the App ID
      `com.codesquad.tinybooth` and turn on the `Sign In with Apple`
      capability. Do not configure a Services ID (that is the web flow we
      do not use yet).
- [ ] Regenerate provisioning profiles after enabling the capability so
      EAS picks up the new entitlement.

## 2. Expo / Xcode config

- [x] `apps/mobile/app.json` declares `ios.usesAppleSignIn: true` so Expo
      adds the entitlement to the generated `.entitlements` file.
- [x] `apps/mobile/app.json` plugins list includes
      `expo-apple-authentication`.
- [x] `apps/mobile/app.json` `ios.entitlements` contains
      `com.apple.developer.applesignin: ["Default"]` so prebuild does not
      strip it.
- [ ] After `expo prebuild`, `apps/mobile/ios/TinyBooth/TinyBooth.entitlements`
      contains the entitlement key. Verify by opening the file before
      pushing the next build.

Apple does not require a special `Info.plist` entry beyond the
entitlement; the framework reads the entitlement at runtime.

## 3. Client integration

- [x] `apps/mobile/src/lib/auth.ts` exports `signInWithApple()` which uses
      `expo-apple-authentication`'s `signInAsync` with both `FULL_NAME`
      and `EMAIL` scopes.
- [x] The client passes Apple's `identityToken` to Supabase via
      `signInWithIdToken({ provider: 'apple', token })` so Supabase
      becomes the single auth source.
- [x] Email is captured from Apple's response (`out.email`) and from
      Supabase (`data.session.user.email`); the first non-null wins.
      First-time SIWA returns the email; subsequent sign-ins return null,
      which is handled.
- [x] When the user picks "Hide my email," Apple returns a private relay
      address. We never need to handle this on the client; Supabase stores
      whatever address Apple sends and the email pipeline (SES) can send
      to private relay addresses without special config.

## 4. Server integration

- [x] `apps/web/src/server/api/routers/account.ts` exposes `account.delete`
      which cascades the user's data and removes the row.
- [ ] `apps/web/src/server/api/routers/account.ts` exposes
      `account.revokeAppleToken` which signs a client secret JWT and POSTs
      to `https://appleid.apple.com/auth/revoke` per the [Sign in with Apple
      REST API docs](https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens).
      Add this in the next pass; the mobile client already calls the route
      via `revokeAppleToken()` (see `apps/mobile/src/lib/auth.ts`). Server
      no-ops when the env var `APPLE_TEAM_KEY` is unset (dev mode).
- [ ] Apple sends server-to-server notifications when a user revokes the
      app via Settings -> Apple ID -> Password & Security. Subscribe by
      setting the notification endpoint in App Store Connect to
      `https://tinybooth.com/api/webhooks/apple-notifications`.

## 5. Account deletion + token revoke

Per Apple's 2024 guidance, account deletion must include token revocation.
Our flow:

1. User taps "Delete account" in Settings (`apps/mobile/app/(tabs)/settings.tsx`).
2. Two-step confirm.
3. Mobile calls `revokeAppleToken()` which POSTs to
   `/api/trpc/account.revokeAppleToken` with the bearer token. Server
   no-ops in dev; in production it signs a client secret JWT and calls
   Apple's revoke endpoint.
4. Mobile calls `deleteAccount()` which cascades the rows.
5. Mobile signs out and routes to `/`.

See `docs/account-deletion-audit.md` for the full audit.

## 6. UI rules per Guideline 4.8

- [x] SIWA button is the same size as Google and magic link buttons.
- [x] SIWA button is at the top of the auth UI (Apple does not require
      this, but it is the convention).
- [x] SIWA button uses Apple's official asset (the white-on-black or
      black-on-white pill). We use the system component from
      `expo-apple-authentication` so the asset is always current.
- [x] No "preferred" framing for any provider.
- [x] No request for additional info beyond email + name (Apple does not
      send anything else).

## 7. Pre-submission verification

Before the next App Store submission:

1. Sandbox SIWA on a real device. Hide-my-email should produce a private
   relay address; the dashboard should display it.
2. Sandbox account delete with a SIWA-only account. Confirm the next
   sign-in attempt with the same Apple ID returns to a "first time"
   consent screen (proof the token was revoked).
3. Run `eas build --profile preview --platform ios`. Open the resulting
   `.entitlements` and confirm `com.apple.developer.applesignin` is
   present.
4. Submit a TestFlight build to a sandbox tester whose Apple ID is on
   another team. Confirm SIWA still works (the entitlement does not need
   per-user provisioning beyond the team key).

## 8. What we deliberately do NOT do at launch

- **Sign in with Apple for the web (Services ID).** Web hosts use email
  magic link or Google. SIWA on web requires a separate Services ID and
  domain verification; not worth the complexity until we see SIWA web
  demand.
- **Apple Game Center, Wallet, or any other Apple framework.** None
  needed for TinyBooth.
- **Custom server-side Apple JWT verification.** Supabase does this for
  us via `signInWithIdToken({ provider: 'apple' })`. If we ever leave
  Supabase Auth, we add JWT verification here.
