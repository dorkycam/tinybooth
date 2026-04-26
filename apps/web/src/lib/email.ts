/**
 * Email delivery wrapper. Two backends:
 *
 *   - SES: used in production when `AWS_SES_REGION` plus the standard AWS
 *     credential envs are set. Lazy-imports `@aws-sdk/client-ses` so the
 *     local-dev path doesn't pay for the SDK weight.
 *   - Local file: writes the HTML payload to `apps/web/.emails/{ts}-{slug}.html`
 *     and logs the path. Lets a dev see exactly what would have been sent
 *     without provisioning anything.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Optional explicit From; defaults to env or "TinyBooth <hello@tinybooth.com>". */
  from?: string;
}

export interface EmailDeliveryResult {
  /** "ses" or "local". */
  via: 'ses' | 'local';
  /** Provider message id when available; local-disk path otherwise. */
  reference: string;
}

const DEFAULT_FROM = 'TinyBooth <hello@tinybooth.com>';

/**
 * Send an email via SES (when configured) or write it to disk (otherwise).
 *
 * @param msg Email payload.
 * @returns Delivery descriptor with the provider used and a reference id/path.
 */
export async function sendEmail(msg: EmailMessage): Promise<EmailDeliveryResult> {
  const region = process.env.AWS_SES_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (region && accessKeyId && secretAccessKey) {
    return sendViaSes(msg, { region, accessKeyId, secretAccessKey });
  }
  return writeToDisk(msg);
}

interface SesConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

interface SesClientLike {
  send(cmd: unknown): Promise<{ MessageId?: string }>;
}
interface SesModule {
  SESClient: new (cfg: unknown) => SesClientLike;
  SendEmailCommand: new (input: unknown) => unknown;
}

async function sendViaSes(msg: EmailMessage, cfg: SesConfig): Promise<EmailDeliveryResult> {
  // Lazy import via a string variable so TypeScript does not require the
  // @aws-sdk/client-ses package at typecheck time. The SDK only ships in
  // the deploy bundle when AWS envs are actually configured.
  const moduleName = '@aws-sdk/client-ses';
  const mod = (await import(/* @vite-ignore */ moduleName)) as SesModule;
  const ses = new mod.SESClient({
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  const cmd = new mod.SendEmailCommand({
    Source: msg.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM,
    Destination: { ToAddresses: [msg.to] },
    Message: {
      Subject: { Data: msg.subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: msg.html, Charset: 'UTF-8' },
        ...(msg.text ? { Text: { Data: msg.text, Charset: 'UTF-8' } } : {}),
      },
    },
  });
  const out = await ses.send(cmd);
  return { via: 'ses', reference: out.MessageId ?? 'unknown' };
}

async function writeToDisk(msg: EmailMessage): Promise<EmailDeliveryResult> {
  const dir = resolve(process.cwd(), '.emails');
  await mkdir(dir, { recursive: true });
  const slug = msg.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const path = join(dir, `${Date.now()}-${slug || 'email'}.html`);
  const wrapped = [
    `<!doctype html><html><body>`,
    `<p><strong>To:</strong> ${escapeHtml(msg.to)}</p>`,
    `<p><strong>From:</strong> ${escapeHtml(msg.from ?? DEFAULT_FROM)}</p>`,
    `<p><strong>Subject:</strong> ${escapeHtml(msg.subject)}</p>`,
    `<hr/>`,
    msg.html,
    `</body></html>`,
  ].join('\n');
  await writeFile(path, wrapped);
  // eslint-disable-next-line no-console
  console.info(`[email] wrote local stub to ${path}`);
  return { via: 'local', reference: path };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Send a strip-delivery email. Used by the camera flow when a guest opts to
 * have their strip emailed at a paid event. Quota tracking lives in the
 * strip router; this function only renders + sends.
 *
 * @param input Recipient email, event id, and a public strip URL.
 */
export async function sendStripDelivery(input: {
  to: string;
  eventName: string;
  stripUrl: string;
}): Promise<EmailDeliveryResult> {
  const safeName = escapeHtml(input.eventName);
  const safeUrl = escapeHtml(input.stripUrl);
  const html = `<p>Your strip from <strong>${safeName}</strong> is ready.</p>
<p><a href="${safeUrl}">Tap here to download or share</a>.</p>
<p>Thanks for celebrating with TinyBooth.</p>`;
  return sendEmail({
    to: input.to,
    subject: `Your strip from ${input.eventName}`,
    html,
  });
}
