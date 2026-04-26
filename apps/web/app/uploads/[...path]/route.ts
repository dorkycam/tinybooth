/**
 * GET /uploads/[...path]
 *
 * Dev-only static-file handler that serves the local-disk fallback storage
 * (`apps/web/.uploads/`). Production traffic never hits this path because
 * uploaded media is served straight from R2's public origin (per
 * `docs/launch-checklist.md` section "Cloudflare R2"). The handler returns a
 * 404 outside development so a misconfigured deploy can never expose
 * arbitrary files.
 */
import { stat, readFile } from 'node:fs/promises';
import { join, normalize, resolve, sep } from 'node:path';
import { NextResponse } from 'next/server';

const UPLOADS_ROOT = resolve(process.cwd(), '.uploads');

interface RouteParams {
  params: { path: string[] };
}

/**
 * Pick a Content-Type from the file extension. Small whitelist; defaults to
 * application/octet-stream for anything unexpected.
 */
function contentTypeFor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.zip')) return 'application/zip';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

/**
 * Serve a file from the on-disk uploads root. Rejects path traversal and any
 * non-development environment.
 */
export async function GET(_req: Request, { params }: RouteParams): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }
  const segments = Array.isArray(params.path) ? params.path : [params.path];
  const joined = segments.map((s) => decodeURIComponent(s)).join('/');
  const target = normalize(join(UPLOADS_ROOT, joined));
  if (!target.startsWith(UPLOADS_ROOT + sep) && target !== UPLOADS_ROOT) {
    return new NextResponse('Not found', { status: 404 });
  }
  try {
    const info = await stat(target);
    if (!info.isFile()) return new NextResponse('Not found', { status: 404 });
    const buf = await readFile(target);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentTypeFor(target),
        'Content-Length': String(info.size),
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
