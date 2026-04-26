/**
 * SMS delivery wrapper. Two backends:
 *
 *   - Twilio: used in production when TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
 *     + TWILIO_FROM are set. Lazy-imports `twilio` so the local-dev path does
 *     not pay for the SDK weight.
 *   - Local file: writes the rendered SMS to apps/web/.sms/{ts}.txt and logs
 *     the path. Lets a dev see exactly what would have been sent without
 *     provisioning a Twilio account.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface SmsMessage {
  /** E.164 phone number (e.g. +13105550100). */
  to: string;
  /** Plain-text body, max ~1600 chars per Twilio. */
  body: string;
  /** Optional explicit From; defaults to TWILIO_FROM env. */
  from?: string;
}

export interface SmsDeliveryResult {
  /** "twilio" or "local". */
  via: 'twilio' | 'local';
  /** Provider message sid when available; local-disk path otherwise. */
  reference: string;
}

interface TwilioCfg {
  accountSid: string;
  authToken: string;
  from: string;
}

/**
 * Send an SMS via Twilio (when configured) or write it to disk (otherwise).
 *
 * @param msg SMS payload.
 */
export async function sendSms(msg: SmsMessage): Promise<SmsDeliveryResult> {
  const cfg = readTwilioConfig();
  if (cfg) return sendViaTwilio(msg, cfg);
  return writeToDisk(msg);
}

function readTwilioConfig(): TwilioCfg | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!accountSid || !authToken || !from) return null;
  return { accountSid, authToken, from };
}

interface TwilioMessageInstance {
  sid: string;
}
interface TwilioClient {
  messages: {
    create(args: { to: string; from: string; body: string }): Promise<TwilioMessageInstance>;
  };
}
interface TwilioModule {
  default: (sid: string, token: string) => TwilioClient;
}

async function sendViaTwilio(msg: SmsMessage, cfg: TwilioCfg): Promise<SmsDeliveryResult> {
  const moduleName = 'twilio';
  const mod = (await import(/* @vite-ignore */ moduleName)) as TwilioModule;
  const client = mod.default(cfg.accountSid, cfg.authToken);
  const sent = await client.messages.create({
    to: msg.to,
    from: msg.from ?? cfg.from,
    body: msg.body,
  });
  return { via: 'twilio', reference: sent.sid };
}

async function writeToDisk(msg: SmsMessage): Promise<SmsDeliveryResult> {
  const dir = resolve(process.cwd(), '.sms');
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${Date.now()}-${slugifyForFilename(msg.to)}.txt`);
  const wrapped = [
    `To: ${msg.to}`,
    `From: ${msg.from ?? process.env.TWILIO_FROM ?? '<unset>'}`,
    `---`,
    msg.body,
  ].join('\n');
  await writeFile(path, wrapped);
  // eslint-disable-next-line no-console
  console.info(`[sms] wrote local stub to ${path}`);
  return { via: 'local', reference: path };
}

function slugifyForFilename(input: string): string {
  return input.replace(/[^a-z0-9]+/gi, '').slice(0, 16) || 'sms';
}
