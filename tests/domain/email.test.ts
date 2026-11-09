import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from '../../src/domain/email';

describe('email', () => {
  it('normalizes with trim and lower-case', () => {
    expect(normalizeEmail('  Fulano.Silva@Viceri.COM.br ')).toBe('fulano.silva@viceri.com.br');
  });
  it('validates basic shapes', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('abc')).toBe(false);
    expect(isValidEmail('a@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});
