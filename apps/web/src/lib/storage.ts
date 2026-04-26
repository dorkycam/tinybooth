/**
 * Storage abstraction.
 *
 * `uploadBuffer` is the only method routes call. Two implementations ship:
 *   - `R2Storage` for production (Cloudflare R2 via the AWS S3 SDK).
 *   - `LocalDiskStorage` for offline/local dev (writes under `apps/web/.uploads/`).
 *
 * The factory chooses R2 when all required env vars are present and falls back
 * to local disk otherwise. Either way the route layer gets the same Promise<Result>.
 */
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export interface StorageResult {
  /** Public URL the client can fetch. */
  url: string;
  /** Bucket-relative key (used for deletion later). */
  key: string;
}

export interface Storage {
  uploadBuffer(key: string, buf: Buffer, contentType: string): Promise<StorageResult>;
  deleteObject(key: string): Promise<void>;
}

/**
 * Local-disk implementation. Writes files to `apps/web/.uploads/` and serves
 * them from the `/uploads/*` route. Used when R2 envs are missing.
 */
export class LocalDiskStorage implements Storage {
  constructor(private readonly rootDir: string, private readonly publicBase: string) {}

  async uploadBuffer(key: string, buf: Buffer, _contentType: string): Promise<StorageResult> {
    const fullPath = join(this.rootDir, key);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buf);
    return { url: `${this.publicBase}/${key}`, key };
  }

  async deleteObject(key: string): Promise<void> {
    const fullPath = join(this.rootDir, key);
    try {
      await unlink(fullPath);
    } catch (err) {
      // Ignore "file does not exist"; treat delete as idempotent.
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
}

/**
 * Cloudflare R2 implementation. Lazy-imports `@aws-sdk/client-s3` so the local
 * dev path does not pay for the SDK or its native deps when offline.
 */
export class R2Storage implements Storage {
  constructor(private readonly cfg: R2Config) {}

  private async client(): Promise<{
    PutObjectCommand: typeof import('@aws-sdk/client-s3').PutObjectCommand;
    DeleteObjectCommand: typeof import('@aws-sdk/client-s3').DeleteObjectCommand;
    s3: import('@aws-sdk/client-s3').S3Client;
  }> {
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import(
      '@aws-sdk/client-s3'
    );
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${this.cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.cfg.accessKeyId,
        secretAccessKey: this.cfg.secretAccessKey,
      },
    });
    return { s3, PutObjectCommand, DeleteObjectCommand };
  }

  async uploadBuffer(key: string, buf: Buffer, contentType: string): Promise<StorageResult> {
    const { s3, PutObjectCommand } = await this.client();
    await s3.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: key,
        Body: buf,
        ContentType: contentType,
      }),
    );
    return { url: `${this.cfg.publicBase}/${key}`, key };
  }

  async deleteObject(key: string): Promise<void> {
    const { s3, DeleteObjectCommand } = await this.client();
    await s3.send(new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
  }
}

let cached: Storage | undefined;

/**
 * Resolve the storage backend based on env. Cached per process.
 */
export function getStorage(): Storage {
  if (cached) return cached;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.R2_PUBLIC_BASE;

  if (accountId && accessKeyId && secretAccessKey && bucket && publicBase) {
    cached = new R2Storage({ accountId, accessKeyId, secretAccessKey, bucket, publicBase });
    return cached;
  }

  // Fall back to local disk. Default base path is the app root /.uploads.
  const rootDir = resolve(process.cwd(), '.uploads');
  const publicBaseLocal = process.env.LOCAL_UPLOAD_BASE_URL ?? '/uploads';
  // eslint-disable-next-line no-console
  console.warn(
    '[storage] R2 env not set. Falling back to LocalDiskStorage at',
    rootDir,
  );
  cached = new LocalDiskStorage(rootDir, publicBaseLocal);
  return cached;
}

/**
 * Reset the cached storage backend. Test-only.
 */
export function __resetStorageForTests(): void {
  cached = undefined;
}
