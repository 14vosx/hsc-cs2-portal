import { describe, expect, it } from 'vitest';

import { isValidPlayerEmailToken, isValidPlayerPassword } from './player-email-auth-validation';

describe('player email auth validation', () => {
  it('accepts only the backend 64-character lowercase hexadecimal token format', () => {
    expect(isValidPlayerEmailToken('a'.repeat(64))).toBe(true);
    expect(isValidPlayerEmailToken('A'.repeat(64))).toBe(false);
    expect(isValidPlayerEmailToken('a'.repeat(63))).toBe(false);
  });

  it('counts Unicode code points for exact password bounds', () => {
    expect(isValidPlayerPassword('😀'.repeat(10))).toBe(true);
    expect(isValidPlayerPassword('😀'.repeat(9))).toBe(false);
    expect(isValidPlayerPassword('a'.repeat(128))).toBe(true);
    expect(isValidPlayerPassword('a'.repeat(129))).toBe(false);
  });
});
