/**
 * Unit tests for the `strip` tRPC router. Covers `create` (Phase 1) plus the
 * new `deliver` mutation (Phase 4) including tier gating + quota enforcement.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stripRouter } from '../src/server/api/routers/strip';

describe('strip.create', () => {
  it('create requires the parent event when eventId is provided', async () => {
    const proxy = {
      event: { findUnique: vi.fn(async () => null) },
      strip: { create: vi.fn() },
    };
    const caller = stripRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: null,
    });
    await expect(
      caller.create({
        eventId: 'missing',
        layout: '1x4_classic',
        photos: [{ url: 'https://x/a.webp', storageKey: 'k', width: 0, height: 0, order: 0 }],
      }),
    ).rejects.toThrow();
  });

  it('create works for standalone strips with no eventId', async () => {
    const proxy = {
      event: { findUnique: vi.fn() },
      strip: {
        create: vi.fn(async ({ data }: { data: { layout: string } }) => ({
          id: 's1',
          layout: data.layout,
          photos: [],
        })),
      },
    };
    const caller = stripRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: null,
    });
    const out = await caller.create({
      layout: '2x2',
      photos: [{ url: 'https://x/a.webp', storageKey: 'k', width: 0, height: 0, order: 0 }],
    });
    expect(out.layout).toBe('2x2');
    expect(proxy.event.findUnique).not.toHaveBeenCalled();
  });
});

interface MockEvent {
  id: string;
  name: string;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
  endsAt: Date | null;
  createdAt: Date;
  emailDeliveries: number;
  smsDeliveries: number;
}
interface MockStrip {
  id: string;
  igShareUrl: string | null;
  event: MockEvent | null;
  photos: Array<{ url: string; order: number }>;
}

function makeDeliverDb(initial: { strip: MockStrip; event: MockEvent }) {
  const eventStore = new Map<string, MockEvent>([[initial.event.id, initial.event]]);
  const stripStore = new Map<string, MockStrip>([[initial.strip.id, initial.strip]]);
  const proxy = {
    strip: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return stripStore.get(where.id) ?? null;
      }),
    },
    event: {
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { emailDeliveries?: { increment: number }; smsDeliveries?: { increment: number } };
        }) => {
          const ev = eventStore.get(where.id);
          if (!ev) throw new Error('event missing');
          if (data.emailDeliveries) ev.emailDeliveries += data.emailDeliveries.increment;
          if (data.smsDeliveries) ev.smsDeliveries += data.smsDeliveries.increment;
          return ev;
        },
      ),
    },
    photo: {
      findFirst: vi.fn(async () => initial.strip.photos[0] ?? null),
    },
  };
  return { proxy, eventStore, stripStore };
}

beforeEach(async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tinybooth-strip-deliver-'));
  process.cwd = (): string => dir;
  delete process.env.AWS_SES_REGION;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_FROM;
});

describe('strip.deliver', () => {
  function setupPaid(): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proxy: any;
    eventStore: Map<string, MockEvent>;
  } {
    return makeDeliverDb({
      event: {
        id: 'ev1',
        name: 'Mya 30',
        tier: 'EVENT_PASS',
        endsAt: new Date('2030-06-01'),
        createdAt: new Date('2030-04-01'),
        emailDeliveries: 0,
        smsDeliveries: 0,
      },
      strip: {
        id: 's1',
        igShareUrl: 'https://x/strip.webp',
        event: {
          id: 'ev1',
          name: 'Mya 30',
          tier: 'EVENT_PASS',
          endsAt: new Date('2030-06-01'),
          createdAt: new Date('2030-04-01'),
          emailDeliveries: 0,
          smsDeliveries: 0,
        },
        photos: [{ url: 'https://x/photo.webp', order: 0 }],
      },
    });
  }

  it('rejects FREE-tier events with TIER_REQUIRED', async () => {
    const { proxy } = makeDeliverDb({
      event: {
        id: 'ev1',
        name: 'Free party',
        tier: 'FREE',
        endsAt: null,
        createdAt: new Date(),
        emailDeliveries: 0,
        smsDeliveries: 0,
      },
      strip: {
        id: 's1',
        igShareUrl: 'https://x/s.webp',
        event: {
          id: 'ev1',
          name: 'Free party',
          tier: 'FREE',
          endsAt: null,
          createdAt: new Date(),
          emailDeliveries: 0,
          smsDeliveries: 0,
        },
        photos: [],
      },
    });
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.deliver({ stripId: 's1', channel: 'email', email: 'guest@example.com' }),
    ).rejects.toThrow(/TIER_REQUIRED/);
  });

  it('rejects email send when channel field is missing', async () => {
    const { proxy } = setupPaid();
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.deliver({ stripId: 's1', channel: 'email' }),
    ).rejects.toThrow();
  });

  it('rejects sms send when phone is missing', async () => {
    const { proxy } = setupPaid();
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.deliver({ stripId: 's1', channel: 'sms' }),
    ).rejects.toThrow();
  });

  it('rejects when the strip does not exist', async () => {
    const { proxy } = setupPaid();
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.deliver({ stripId: 'gone', channel: 'email', email: 'guest@example.com' }),
    ).rejects.toThrow();
  });

  it('rejects standalone (eventless) strips', async () => {
    const { proxy } = makeDeliverDb({
      event: {
        id: 'ev1',
        name: 'irrelevant',
        tier: 'EVENT_PASS',
        endsAt: null,
        createdAt: new Date(),
        emailDeliveries: 0,
        smsDeliveries: 0,
      },
      strip: {
        id: 's_standalone',
        igShareUrl: null,
        event: null,
        photos: [{ url: 'https://x/p.webp', order: 0 }],
      },
    });
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.deliver({ stripId: 's_standalone', channel: 'email', email: 'guest@example.com' }),
    ).rejects.toThrow();
  });

  it('decrements email quota on a successful email send', async () => {
    const { proxy, eventStore } = setupPaid();
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    const r = await caller.deliver({
      stripId: 's1',
      channel: 'email',
      email: 'guest@example.com',
    });
    expect(r.ok).toBe(true);
    expect(eventStore.get('ev1')!.emailDeliveries).toBe(1);
  });

  it('decrements sms quota on a successful sms send', async () => {
    const { proxy, eventStore } = setupPaid();
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    const r = await caller.deliver({
      stripId: 's1',
      channel: 'sms',
      phone: '+13105550100',
    });
    expect(r.ok).toBe(true);
    expect(eventStore.get('ev1')!.smsDeliveries).toBe(1);
  });

  it('blocks send when quota is exhausted', async () => {
    const { proxy } = makeDeliverDb({
      event: {
        id: 'ev1',
        name: 'Mya',
        tier: 'EVENT_PASS',
        endsAt: new Date('2030-06-01'),
        createdAt: new Date('2030-04-01'),
        emailDeliveries: 50, // already at cap
        smsDeliveries: 0,
      },
      strip: {
        id: 's1',
        igShareUrl: 'https://x/s.webp',
        event: {
          id: 'ev1',
          name: 'Mya',
          tier: 'EVENT_PASS',
          endsAt: new Date('2030-06-01'),
          createdAt: new Date('2030-04-01'),
          emailDeliveries: 50,
          smsDeliveries: 0,
        },
        photos: [{ url: 'https://x/p.webp', order: 0 }],
      },
    });
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.deliver({ stripId: 's1', channel: 'email', email: 'guest@example.com' }),
    ).rejects.toThrow(/Delivery quota exhausted/);
  });

  it('uses the photo URL when igShareUrl is null', async () => {
    const { proxy, eventStore } = makeDeliverDb({
      event: {
        id: 'ev1',
        name: 'Mya',
        tier: 'EVENT_PASS_PLUS',
        endsAt: new Date('2030-06-01'),
        createdAt: new Date('2030-04-01'),
        emailDeliveries: 0,
        smsDeliveries: 0,
      },
      strip: {
        id: 's1',
        igShareUrl: null,
        event: {
          id: 'ev1',
          name: 'Mya',
          tier: 'EVENT_PASS_PLUS',
          endsAt: new Date('2030-06-01'),
          createdAt: new Date('2030-04-01'),
          emailDeliveries: 0,
          smsDeliveries: 0,
        },
        photos: [{ url: 'https://x/p.webp', order: 0 }],
      },
    });
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    const r = await caller.deliver({
      stripId: 's1',
      channel: 'sms',
      phone: '+13105550100',
    });
    expect(r.ok).toBe(true);
    expect(eventStore.get('ev1')!.smsDeliveries).toBe(1);
  });

  it('rejects strips with no deliverable URL', async () => {
    const { proxy } = makeDeliverDb({
      event: {
        id: 'ev1',
        name: 'Mya',
        tier: 'EVENT_PASS',
        endsAt: new Date(),
        createdAt: new Date(),
        emailDeliveries: 0,
        smsDeliveries: 0,
      },
      strip: {
        id: 's1',
        igShareUrl: null,
        event: {
          id: 'ev1',
          name: 'Mya',
          tier: 'EVENT_PASS',
          endsAt: new Date(),
          createdAt: new Date(),
          emailDeliveries: 0,
          smsDeliveries: 0,
        },
        photos: [],
      },
    });
    const caller = stripRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.deliver({ stripId: 's1', channel: 'email', email: 'guest@example.com' }),
    ).rejects.toThrow(/No deliverable URL/);
  });
});
