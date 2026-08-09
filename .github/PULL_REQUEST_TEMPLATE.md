## Related issue

<!--
Every PR should trace back to an issue. Use a closing keyword so the issue
closes on merge:

    Closes #123

If there genuinely isn't one (a typo fix, a dependency bump), write "No issue"
and one line on why.
-->

Closes #

## What this changes

<!-- One or two sentences, in plain language. -->

## Type of change

- [ ] feat (new capability)
- [ ] fix (bug fix)
- [ ] refactor / chore
- [ ] docs
- [ ] test

> Target `develop`, not `main`. `main` is release-only — see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Checklist

- [ ] Linked an issue above (or explained why there isn't one)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Follows [AGENTS.md](../AGENTS.md) conventions (no `any`, explicit return types, theme
      tokens not hardcoded hex, one component per file)
- [ ] Conventional Commit message(s)
- [ ] **No secrets** in the diff (keys, `.p8`/`.p12`, keystores, service-account JSON, `.env`)
- [ ] No em dashes or AI-filler words in code/comments/copy
- [ ] Screenshots or a screen recording for any UI change (below)

## Screenshots / recording

<!-- For UI changes. Delete if not applicable. -->
