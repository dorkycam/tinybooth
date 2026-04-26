#!/usr/bin/env node
/**
 * `@tinybooth/cli` entry. Builds the commander program and parses argv.
 * All command logic lives in `./commands/`. Tests target `./program.ts`
 * directly so they don't have to spawn a subprocess.
 */
import { buildProgram } from './program.js';

const program = buildProgram();
await program.parseAsync(process.argv);
