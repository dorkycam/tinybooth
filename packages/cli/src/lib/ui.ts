/**
 * Console output helpers for the TinyBooth CLI. Wraps picocolors for color
 * handling and ora for spinners. Every command goes through these so output
 * stays uniform and so tests can assert on a single channel.
 */
import pc from 'picocolors';
import oraImport from 'ora';
import type { Ora } from 'ora';

/** Wrapper around `ora` typed once so consumers don't reach into the lib. */
export type Spinner = Ora;

/** Underlying console used for output. Replaceable in tests via setLogger. */
let logger: Pick<Console, 'log' | 'warn' | 'error' | 'info'> = console;

/** Install a custom logger (used by tests to capture output). */
export function setLogger(custom: Pick<Console, 'log' | 'warn' | 'error' | 'info'>): void {
  logger = custom;
}

/** Print an info-level message with a cyan tag. */
export function info(message: string): void {
  logger.info(`${pc.cyan('info')} ${message}`);
}

/** Print a success-level message with a green tag. */
export function success(message: string): void {
  logger.info(`${pc.green('ok')} ${message}`);
}

/** Print a warning-level message with a yellow tag. */
export function warn(message: string): void {
  logger.warn(`${pc.yellow('warn')} ${message}`);
}

/** Print an error-level message with a red tag. */
export function error(message: string): void {
  logger.error(`${pc.red('err')} ${message}`);
}

/** Print a step header used at the start of multi-step flows. */
export function step(index: number, total: number, label: string): void {
  logger.info(`${pc.gray(`[${index}/${total}]`)} ${pc.bold(label)}`);
}

/** Print a faded note (used for "would run" lines under dry-run). */
export function note(message: string): void {
  logger.info(pc.gray(`     ${message}`));
}

/** Print a literal line, no prefix. Useful for multi-line bodies. */
export function plain(message: string): void {
  logger.info(message);
}

/** Start a spinner. In CI or non-TTY, ora silently no-ops the animation. */
export function spinner(text: string): Spinner {
  return oraImport({ text, isEnabled: process.stdout.isTTY === true }).start();
}
