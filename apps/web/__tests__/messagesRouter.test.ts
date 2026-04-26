/**
 * Unit tests for the `messages` tRPC router.
 */
import { describe, expect, it, vi } from 'vitest';
import { messagesRouter } from '../src/server/api/routers/messages';
import { STATIC_MESSAGES } from '@tinybooth/messages';

describe('messages router', () => {
  it('returns the static library when no eventId is provided', async () => {
    const proxy = { customMessage: { findMany: vi.fn() } };
    const caller = messagesRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: null,
    });
    const list = await caller.list();
    expect(list).toEqual(STATIC_MESSAGES);
    expect(proxy.customMessage.findMany).not.toHaveBeenCalled();
  });

  it('appends event customs to the static pool', async () => {
    const proxy = {
      customMessage: {
        findMany: vi.fn(async () => [{ text: 'Custom one' }, { text: 'Custom two' }]),
      },
    };
    const caller = messagesRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: null,
    });
    const list = await caller.list({ eventId: 'e1' });
    expect(list).toHaveLength(STATIC_MESSAGES.length + 2);
    expect(list).toContain('Custom one');
    expect(list).toContain('Custom two');
  });

  it('add rejects FREE-tier events with TIER_REQUIRED payload', async () => {
    const proxy = {
      event: {
        findUnique: vi.fn(async () => ({ id: 'e1', ownerId: 'me', tier: 'FREE' })),
      },
    };
    const caller = messagesRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    await expect(caller.add({ eventId: 'e1', text: 'Hi!' })).rejects.toThrow(
      /TIER_REQUIRED/,
    );
  });

  it('add allows a paid host to insert a message', async () => {
    const proxy = {
      event: {
        findUnique: vi.fn(async () => ({ id: 'e1', ownerId: 'me', tier: 'EVENT_PASS' })),
      },
      customMessage: {
        create: vi.fn(async ({ data }: { data: { text: string } }) => ({
          id: 'cm1',
          text: data.text,
        })),
      },
    };
    const caller = messagesRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    const created = await caller.add({ eventId: 'e1', text: 'You look great!' });
    expect(created.text).toBe('You look great!');
  });

  it('delete enforces ownership through the parent event', async () => {
    const proxy = {
      customMessage: {
        findUnique: vi.fn(async () => ({
          id: 'cm1',
          event: { ownerId: 'someone-else' },
        })),
      },
    };
    const caller = messagesRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    await expect(caller.delete({ messageId: 'cm1' })).rejects.toThrow();
  });
});
