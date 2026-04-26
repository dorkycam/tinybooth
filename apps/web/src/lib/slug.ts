/**
 * Generate a URL-friendly slug from a free-form name. Mirrors the original
 * TinyWall behavior so existing event slugs remain reproducible.
 */
import { customAlphabet } from 'nanoid';

const suffixGen = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4);

/**
 * Build a slug from `name` plus a random 4-char suffix to avoid collisions.
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const safeBase = base.length > 0 ? base : 'event';
  return `${safeBase}-${suffixGen()}`;
}
