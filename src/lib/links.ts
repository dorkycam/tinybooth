/**
 * Outbound links shown in the About section.
 *
 * `GITHUB_REPO_URL` is the one value to find-and-replace if the repo moves. The
 * issues, privacy, and terms URLs derive from it so they stay in sync.
 */

/** The public GitHub repository for TinyBooth. */
export const GITHUB_REPO_URL = 'https://github.com/dorkycam/tinybooth';

/** Where "Report a problem" sends people. */
export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;

/** The privacy policy, served from the repo. */
export const PRIVACY_URL = `${GITHUB_REPO_URL}/blob/main/PRIVACY.md`;

/** The terms of use, served from the repo. */
export const TERMS_URL = `${GITHUB_REPO_URL}/blob/main/TERMS.md`;
