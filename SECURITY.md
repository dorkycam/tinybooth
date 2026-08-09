# Security Policy

## Reporting a vulnerability

Please report security issues privately. Do **not** open a public issue for a vulnerability.

Use GitHub's private vulnerability reporting — the "Report a vulnerability" button under the
repo's [Security tab](https://github.com/dorkycam/tinybooth/security). We'll acknowledge
within a few days and keep you updated on a fix.

For anything that is **not** a vulnerability (bugs, crashes, feature requests), open a normal
issue instead: https://github.com/dorkycam/tinybooth/issues

## Scope

TinyBooth runs entirely on-device. It has no backend, no accounts, and makes no network
requests, so most server-side and data-exfiltration classes do not apply. The areas worth
reporting:

- A way the app leaks photos off the device.
- A native-module or dependency vulnerability that affects the built app.
- Anything that exposes signing credentials or developer-account access.

## For contributors: never commit secrets

Signing credentials, API keys, `.p8` / `.p12` files, keystores, service-account JSON, and
`.env` files must never be committed. They live in EAS's credential store, not in git. A
`gitleaks` pre-commit hook and a CI secret scan are in place; do not bypass them.
