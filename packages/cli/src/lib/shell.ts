/**
 * `execa` wrapper for the TinyBooth CLI. Centralizes:
 *
 *   - the dry-run flag (logs the command instead of running it),
 *   - consistent error handling (non-zero exit converts to a typed error),
 *   - stdout capture for the "shell out and parse the JSON" pattern.
 *
 * Every command shells out via this module so we have one place to mock in
 * tests and one place to enforce dry-run semantics.
 */
import { note } from './ui.js';

/** Result returned from `run`. Always present, even on dry-run. */
export interface RunResult {
  /** True if dry-run was active and the command was not actually executed. */
  dryRun: boolean;
  /** Captured stdout. Empty string under dry-run. */
  stdout: string;
  /** Captured stderr. Empty string under dry-run. */
  stderr: string;
  /** Process exit code. 0 under dry-run. */
  exitCode: number;
}

/** Options accepted by `run`. */
export interface RunOptions {
  /** Working directory for the spawned process. */
  cwd?: string;
  /** Extra env vars merged on top of process.env. */
  env?: Record<string, string>;
  /** When true, log the command instead of running it. */
  dryRun?: boolean;
  /** Forward stdio to the parent process. Useful for interactive logins. */
  stdio?: 'inherit' | 'pipe';
  /** Optional stdin string piped to the child. */
  input?: string;
}

/**
 * Thrown when an external CLI exits non-zero. Includes captured streams so
 * callers can render a helpful error.
 */
export class ShellError extends Error {
  /** The full command for the message. */
  public readonly command: string;
  /** Process exit code. */
  public readonly exitCode: number;
  /** Captured stdout. */
  public readonly stdout: string;
  /** Captured stderr. */
  public readonly stderr: string;

  /** Build a readable error and stash the streams for callers. */
  public constructor(command: string, exitCode: number, stdout: string, stderr: string) {
    super(`Command failed (${exitCode}): ${command}\n${stderr || stdout}`);
    this.name = 'ShellError';
    this.command = command;
    this.exitCode = exitCode;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

/** Lazy reference to execa so tests can inject a fake without importing it. */
type ExecaFn = (
  file: string,
  args: readonly string[],
  options: Record<string, unknown>,
) => Promise<{ stdout: string; stderr: string; exitCode: number }>;

let execaImpl: ExecaFn | null = null;

/**
 * Inject an `execa`-shaped function. Tests use this to avoid spawning real
 * processes; production code lazy-loads execa via the default loader.
 */
export function setExecaImpl(fn: ExecaFn | null): void {
  execaImpl = fn;
}

/** Lazy-load execa from node_modules. Cached after first call. */
async function getExeca(): Promise<ExecaFn> {
  if (execaImpl !== null) return execaImpl;
  const mod = (await import('execa')) as unknown as { execa: ExecaFn };
  execaImpl = mod.execa;
  return execaImpl;
}

/**
 * Run an external command. Under dry-run, the command is logged via the UI
 * helpers and never spawned.
 *
 * @param file Executable to run (e.g. `vercel`).
 * @param args Argument vector.
 * @param options Spawn / dry-run options.
 */
export async function run(
  file: string,
  args: readonly string[],
  options: RunOptions = {},
): Promise<RunResult> {
  const printable = formatCommand(file, args);
  if (options.dryRun === true) {
    note(`would run: ${printable}`);
    return { dryRun: true, stdout: '', stderr: '', exitCode: 0 };
  }
  const execa = await getExeca();
  try {
    const result = await execa(file, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: options.stdio ?? 'pipe',
      input: options.input,
    });
    return {
      dryRun: false,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      exitCode: result.exitCode ?? 0,
    };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; exitCode?: number };
    throw new ShellError(printable, e.exitCode ?? 1, e.stdout ?? '', e.stderr ?? '');
  }
}

/**
 * Run a command and return whether it succeeded (true) or failed (false).
 * Useful for "is this CLI installed" / "is the user logged in" checks where
 * a non-zero exit is a normal outcome, not an error.
 */
export async function runOk(
  file: string,
  args: readonly string[],
  options: RunOptions = {},
): Promise<boolean> {
  try {
    const result = await run(file, args, options);
    if (result.dryRun) return true;
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/** Format a command vector into a copy-paste-able shell string. */
export function formatCommand(file: string, args: readonly string[]): string {
  const parts = [file, ...args].map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg));
  return parts.join(' ');
}
