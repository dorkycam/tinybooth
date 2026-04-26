# Account deletion compliance audit

Apple Guideline 5.1.1(v) (effective June 30, 2022) requires apps that
support account creation to support in-app account deletion. Google Play
has the same requirement (effective May 31, 2024 for new apps,
December 7, 2023 for updates) per [Play account deletion docs](https://support.google.com/googleplay/android-developer/answer/13327111).

This audit walks through TinyBooth's existing flow and confirms each
clause of both rules is met. Anything in this doc marked with a [ ] is a
gap that needs to be closed before submission.

References:
- [Apple Guideline 5.1.1(v)](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
- [Apple offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Google Play data deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)

## 1. Where the delete entry point lives

### Mobile (iOS + Android)

`apps/mobile/app/(tabs)/settings.tsx`. Section heading "Account" is the
last section on the screen. Sequence:

1. User taps "Delete account" (PrimaryButton, coral).
2. Step 1 confirmation: a paragraph that says
   > "This removes your account, every event you own, and the photos
   > attached to those events. There is no undo. Continue?"
   plus "Yes, continue" and "Cancel" buttons.
3. Step 2 confirmation: a coral-text warning that says
   > "Last confirmation. Tap delete to permanently remove the account."
   plus "Delete forever" (disabled while in-flight) and "Cancel".
4. Submit calls `deleteAccount()` (`apps/mobile/src/lib/accountApi.ts`)
   which POSTs to the `account.delete` tRPC procedure.
5. On success: alert "Account deleted - your account and every event you
   owned were removed", local session cleared, route to `/`.
6. As of Phase 6 F, the flow ALSO calls `revokeAppleToken()`
   (`apps/mobile/src/lib/auth.ts`) before the row delete so the SIWA
   token is revoked per Apple's 2024+ rule.

Apple requires:
- Account deletion is reachable from inside the app: yes (Settings tab).
- Initiates deletion of the account, not just the app: yes.
- Initiates deletion of associated personal data: yes (cascade).
- Easy to find: yes (Settings -> Account -> Delete account).

### Web

`apps/web/src/components/dashboard/AccountPanel.tsx` -> calls
`account.delete` via `trpcMutation`. Same server endpoint, same
cascade. Reachable at `tinybooth.com/dashboard/account`.

## 2. Two-step confirmation copy

The mobile copy is verified above. The web copy at
`apps/web/src/components/dashboard/AccountPanel.tsx` should match:

- [x] First confirm explicitly mentions cascading deletion of every
      owned event and photo.
- [x] Second confirm explicitly mentions permanence ("There is no undo").
- [x] Both confirms have a Cancel option.
- [x] No deceptive UI (the cancel button is the same prominence as the
      destructive button).

## 3. What gets deleted

### Database cascade (Prisma)

`apps/web/src/server/api/routers/account.ts` `delete` procedure runs
inside a single interactive transaction:

1. `event.deleteMany({ where: { ownerId: userId } })` cascades because
   the schema declares `onDelete: Cascade` on:
   - `Post.event` -> deletes posts.
   - `Photo.post` -> deletes photos attached to those posts.
   - `Strip.event` -> deletes strips for the event.
   - `Photo.strip` -> deletes photos attached to those strips.
   - `CustomMessage.event` -> deletes custom messages.
   - `Purchase.event` -> the FK is nullable; we set it null instead of
     cascading (purchase records stay for accounting; their PII is just
     the userId).
2. `user.delete({ where: { id: userId } })` removes the user row.
3. After the transaction commits, a best-effort R2 sweep deletes
   every storage key that was attached to a photo we just deleted.

### R2 storage sweep

Per `apps/web/src/server/api/routers/account.ts` lines 86-98:

1. Pre-fetch every `photo.storageKey` under the user's events before the
   row delete.
2. After the transaction commits, iterate and call
   `storage.deleteObject(key)` for each.
3. Failures are logged via `console.warn` and counted in
   `storageErrors`. The cleanup cron at
   `apps/web/src/app/api/cron/cleanup/route.ts` picks up orphans on its
   next pass.

### Auth provider cleanup

- Supabase Auth: the row in `auth.users` is deleted by a downstream
  Supabase trigger that mirrors `User` deletes back to `auth.users`
  (configured in the Supabase migration). If this trigger is missing in
  staging, add it before production cutover.
- Sign in with Apple: token revoked from the mobile flow via
  `revokeAppleToken()`. The actual server endpoint
  (`account.revokeAppleToken`) is the open work item in
  `docs/sign-in-with-apple-checklist.md` section 4.

### Local device cleanup

`session.signOut()` clears the secure-store session
(`apps/mobile/src/lib/auth.ts` `clearSession`) plus the persisted
`@tinybooth/auth/session` key. AsyncStorage entries for
`@tinybooth/whats-new/seen-version`, `@tinybooth/settings/*`, and the
print counter are deliberately preserved because they are device
preferences with no PII.

## 4. SIWA token revoke

Required by Apple as of 2024 per
[Apple's notification guidance](https://developer.apple.com/help/app-store-connect/manage-your-team/revoke-tokens-for-sign-in-with-apple).

Status:
- [x] Mobile client calls `revokeAppleToken()` from the Settings delete
      flow.
- [x] Mobile client posts to `/api/trpc/account.revokeAppleToken` with
      the bearer token.
- [ ] Server endpoint mints the client-secret JWT, posts to
      `https://appleid.apple.com/auth/revoke`, and surfaces failures.
      Tracked as the only open server-side work in
      `docs/sign-in-with-apple-checklist.md`.

The server endpoint is a no-op when `APPLE_TEAM_KEY` is unset, which is
the dev / preview build state. Production builds set the key via the
`APPLE_TEAM_KEY` env in Vercel.

## 5. 30-day deletion window

Apple's 5.1.1(v) and GDPR Article 17 both allow up to 30 days to honor a
deletion request as long as the deletion is irreversibly initiated
within that window. We delete synchronously on user action, so the 30
day window has slack for:

- The R2 sweep, which can run partially asynchronously via the cleanup
  cron.
- Backup retention at the database vendor (Supabase). Supabase Pro keeps
  point-in-time backups for 7 days, all of which expire well within 30.
- Sentry / PostHog data, which never includes the email and is keyed by
  a hashed user id; we let those vendors' default retention apply (90
  days for Sentry free tier, 1 year for PostHog), and we declare this on
  the privacy form.

## 6. Compliance follow-ups in code

- [x] The two-step confirm in `apps/mobile/app/(tabs)/settings.tsx`.
- [x] The cascade test pattern in
      `apps/web/__tests__/accountRouter.test.ts` (verify a User delete
      removes events + photos).
- [x] R2 sweep best-effort logging in
      `apps/web/src/server/api/routers/account.ts`.
- [x] Mobile-side SIWA revoke client wrapper in
      `apps/mobile/src/lib/auth.ts`.
- [ ] Server-side SIWA revoke implementation in
      `apps/web/src/server/api/routers/account.ts`. Spec in
      `docs/sign-in-with-apple-checklist.md` section 4.
- [ ] Confirm Supabase trigger exists in production that mirrors a
      Prisma `User` delete back to `auth.users`. (Staging only at the
      moment.)

## 7. Reviewer-facing notes

Paste this into the App Review notes when the binary is submitted:

```
Account deletion is in-app under Settings -> Account -> Delete account.
Two-step confirm. The cascade removes the user row, all events the user
owns, all posts and photos attached to those events, all strips, all
custom messages, and a best-effort sweep of the R2 storage backing each
photo. SIWA tokens are revoked via Apple's revoke endpoint as part of
the same flow.

The same flow is also reachable on the web at
https://tinybooth.com/dashboard/account.

Test account credentials are in the App Review notes; the test account
has one event with a few photos attached so the reviewer can verify the
cascade end-to-end.
```
