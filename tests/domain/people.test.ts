import { describe, expect, it } from 'vitest';
import { avatarColor, initials, validateNewPerson } from '../../src/domain/people';

const PALETTE = ['#FD4237', '#FF8A3D', '#FFB41F', '#19A7AD', '#8E5BD1', '#FF6B8B'];

describe('initials', () => {
  it('uses first and last name', () => {
    expect(initials('Christian de Oliveira')).toBe('CO');
    expect(initials('Ana')).toBe('A');
    expect(initials('  maria   souza ')).toBe('MS');
  });
});

describe('avatarColor', () => {
  it('is deterministic and inside the palette', () => {
    expect(avatarColor('a@b.co')).toBe(avatarColor('a@b.co'));
    expect(PALETTE).toContain(avatarColor('a@b.co'));
    expect(PALETTE).toContain(avatarColor('zzz@viceri.com.br'));
  });
});

describe('validateNewPerson', () => {
  const list = [{ id: '1', name: 'Ana', email: 'ana@v.com' }];
  it('requires a name', () => {
    expect(validateNewPerson(list, { name: '  ', email: 'x@v.com' })).toEqual({ ok: false, error: 'name-required' });
  });
  it('rejects invalid email', () => {
    expect(validateNewPerson(list, { name: 'Bob', email: 'bob' })).toEqual({ ok: false, error: 'email-invalid' });
  });
  it('rejects duplicates regardless of case', () => {
    expect(validateNewPerson(list, { name: 'Ana 2', email: 'ANA@V.COM' })).toEqual({ ok: false, error: 'duplicate' });
  });
  it('returns the normalized person', () => {
    expect(validateNewPerson(list, { name: '  Bob ', email: ' BOB@V.com ' })).toEqual({
      ok: true,
      person: { name: 'Bob', email: 'bob@v.com' },
    });
  });
});
