# @tinybooth/ui-tokens

Brand tokens for TinyBooth: colors, typography, spacing.

## Philosophy

Tokens are the contract between design and code. The token names describe the role (`paper`, `ink`, `coral`) instead of the value, so the same token can shift hex codes between light and dark mode without any consumer-side change. Color tokens are grouped by mode (`COLORS.light`, `COLORS.dark`) rather than scattered, which keeps the dark-mode swap a single object pivot at runtime. Typography and spacing follow a 4-pt scale with explicit, named keys that should map cleanly to React Native `StyleSheet`, Tailwind config, and CSS custom properties.

These tokens are v0 and intentionally small. The Phase 2 designer pass can grow the scale, but the existing tokens will not be renamed or removed without a migration.
