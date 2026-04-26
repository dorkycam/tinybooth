/**
 * Barrel export for `@tinybooth/strip-render`.
 *
 * Two backends share one layout module:
 * - `layout`: pure pixel math.
 * - `watermark`: text + visibility helpers.
 * - `sharp`: server-side composer (used by web).
 * - `skia`: on-device composer (used by mobile via the host bridge).
 * - `igShare`: 1080x1920 IG share composer.
 */
export * from './layout.js';
export * from './watermark.js';
export * from './sharp.js';
export * from './skia.js';
export * from './igShare.js';
