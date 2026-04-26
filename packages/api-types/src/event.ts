/**
 * Event tier. Drives feature flags, retention, and per-event quotas. Mirrors
 * the Postgres enum defined in the Prisma schema.
 */
export enum EventTier {
  FREE = 'FREE',
  EVENT_PASS = 'EVENT_PASS',
  EVENT_PASS_PLUS = 'EVENT_PASS_PLUS',
}

/** Per-event branding overrides (logo URL + theme colors). */
export interface EventBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

/** Free-form per-event settings; evolves over time without schema changes. */
export interface EventSettings {
  slideshowSpeedSeconds?: number;
  watermarkEnabled?: boolean;
  allowVideoUploads?: boolean;
  [key: string]: unknown;
}

/**
 * Event is the cross-product unit. A TinyBooth photostrip and a TinyWall guest
 * upload tied to the same event share branding, retention, and dashboard view.
 */
export interface Event {
  id: string;
  ownerId: string | null;
  name: string;
  slug: string;
  tier: EventTier;
  startsAt: string | null;
  endsAt: string | null;
  retainUntil: string;
  branding: EventBranding;
  settings: EventSettings;
  emailDeliveries: number;
  smsDeliveries: number;
  createdAt: string;
}
