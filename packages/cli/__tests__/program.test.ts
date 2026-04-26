/**
 * Tests for the commander wiring. We don't exercise the action handlers here
 * (the per-command files cover those); this just asserts the CLI has every
 * advertised command and exposes them with the right names.
 */
import { describe, expect, it } from 'vitest';
import { buildProgram, detectRepoRoot } from '../src/program';

describe('buildProgram', () => {
  it('registers the eight top-level commands', () => {
    const program = buildProgram('/repo');
    const names = program.commands.map((c) => c.name()).sort();
    // env and seed are command groups, so they show up as well.
    expect(names).toEqual(
      ['deploy', 'doctor', 'env', 'logs', 'migrate', 'release', 'seed', 'setup'].sort(),
    );
  });

  it('exposes seed event as a subcommand', () => {
    const program = buildProgram('/repo');
    const seed = program.commands.find((c) => c.name() === 'seed');
    expect(seed).toBeDefined();
    const eventSub = seed?.commands.find((c) => c.name() === 'event');
    expect(eventSub).toBeDefined();
  });

  it('registers every env subcommand', () => {
    const program = buildProgram('/repo');
    const env = program.commands.find((c) => c.name() === 'env');
    const subs = env?.commands.map((c) => c.name()).sort() ?? [];
    expect(subs).toEqual(['get', 'list', 'set', 'sync']);
  });

  it('detectRepoRoot resolves to a non-empty path', () => {
    const root = detectRepoRoot();
    expect(root.length).toBeGreaterThan(0);
  });
});
