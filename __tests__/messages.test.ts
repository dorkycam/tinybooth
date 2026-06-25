import { describe, expect, it } from 'vitest';
import { STATIC_MESSAGES, getRandomMessage } from '../src/lib/messages';

describe('STATIC_MESSAGES', () => {
  it('contains exactly the nine original entries', () => {
    expect(STATIC_MESSAGES).toHaveLength(9);
  });

  it('preserves the original order verbatim', () => {
    expect(STATIC_MESSAGES).toEqual([
      'Smile!',
      'Cheese!',
      'Work it!',
      'Cute!',
      'Perfect!',
      'Pose!',
      'Adorable!',
      "That's Great!",
      '\u{1F60E}',
    ]);
  });

  it('has no empty entries', () => {
    for (const message of STATIC_MESSAGES) {
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('getRandomMessage', () => {
  it('returns a member of the library', () => {
    for (let i = 0; i < 100; i += 1) {
      expect(STATIC_MESSAGES).toContain(getRandomMessage());
    }
  });
});
