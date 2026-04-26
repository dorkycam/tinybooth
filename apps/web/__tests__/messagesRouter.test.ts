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
});
