/**
 * Persistent "current event" pointer for the mobile app.
 *
 * When the booth is paired with an event, every subsequent strip uploads to
 * the event via tRPC. Stored in `expo-secure-store` so the pairing survives
 * app launches and force-quits.
 */
import { deleteSecure, readSecure, writeSecure } from './secureStore';

const KEY = '@tinybooth/event/connection';

export interface EventConnection {
  eventId: string;
  eventName: string;
  slug: string;
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
  };
  connectedAt: string;
}

/** Read the current pairing, or null when the booth is unpaired. */
export async function loadConnection(): Promise<EventConnection | null> {
  const raw = await readSecure(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EventConnection;
  } catch {
    return null;
  }
}

/** Persist a new pairing. Overwrites any existing connection. */
export async function saveConnection(conn: EventConnection): Promise<void> {
  await writeSecure(KEY, JSON.stringify(conn));
}

/** Drop the current pairing. */
export async function clearConnection(): Promise<void> {
  await deleteSecure(KEY);
}

/**
 * Parse a pairing payload encoded by the dashboard QR. Format:
 *   `tinybooth://event?id={eventId}&code={pairingCode}`
 *
 * Returns null when the payload doesn't match. Pairing code validation runs
 * server-side via tRPC `event.bySlug` plus a follow-up signed nonce check.
 */
export interface ParsedPairing {
  eventId: string;
  pairingCode: string;
}
export function parsePairingPayload(payload: string): ParsedPairing | null {
  try {
    const url = new URL(payload);
    if (url.protocol !== 'tinybooth:') return null;
    if (url.host !== 'event' && url.pathname.replace(/^\/+/, '') !== 'event') return null;
    const eventId = url.searchParams.get('id');
    const pairingCode = url.searchParams.get('code');
    if (!eventId || !pairingCode) return null;
    return { eventId, pairingCode };
  } catch {
    return null;
  }
}
