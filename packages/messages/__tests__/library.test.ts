import { describe, expect, it } from 'vitest';
import { STATIC_MESSAGES, getRandomMessage } from '../src/index';

describe('STATIC_MESSAGES', () => {
  it('contains exactly 9 entries', () => {
    expect(STATIC_MESSAGES).toHaveLength(9);
  });

  it('matches the original Swift sillyMessages array verbatim and in order', () => {
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

  it('preserves the cool-face emoji as the final entry', () => {
    expect(STATIC_MESSAGES[8]).toBe('\u{1F60E}');
  });
});

describe('getRandomMessage', () => {
  it('returns a string from the static library when no extras are provided', () => {
    for (let i = 0; i < 50; i += 1) {
      const message = getRandomMessage();
      expect(STATIC_MESSAGES).toContain(message);
    }
  });

  it('returns a string from the union of static + extras when extras are provided', () => {
    const extras = ['Custom one', 'Custom two'] as const;
    const union = new Set<string>([...STATIC_MESSAGES, ...extras]);
    for (let i = 0; i < 100; i += 1) {
      const message = getRandomMessage(extras);
      expect(union.has(message)).toBe(true);
    }
  });

  it('handles an empty extras array as if no extras were passed', () => {
    const message = getRandomMessage([]);
    expect(STATIC_MESSAGES).toContain(message);
  });
});
