import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickOne, sampleUnique, secureRandomInt } from '../../src/domain/random';

function mockRandom(values: number[]) {
  let i = 0;
  vi.spyOn(crypto, 'getRandomValues').mockImplementation(((arr: Uint32Array) => {
    arr[0] = values[i++ % values.length];
    return arr;
  }) as typeof crypto.getRandomValues);
}

afterEach(() => vi.restoreAllMocks());

describe('secureRandomInt', () => {
  it('returns values in [0, max)', () => {
    mockRandom([0, 7, 13]);
    expect(secureRandomInt(10)).toBe(0);
    expect(secureRandomInt(10)).toBe(7);
    expect(secureRandomInt(10)).toBe(3);
  });

  it('discards values above the unbiased limit (rejection sampling)', () => {
    // max=10 → limit = floor(2^32/10)*10 = 4294967290; 4294967295 must be rejected
    mockRandom([4294967295, 25]);
    expect(secureRandomInt(10)).toBe(5);
  });

  it('throws when max <= 0', () => {
    expect(() => secureRandomInt(0)).toThrow();
    expect(() => secureRandomInt(-3)).toThrow();
  });
});

describe('pickOne / sampleUnique', () => {
  it('pickOne returns an element of the list', () => {
    expect([1, 2, 3]).toContain(pickOne([1, 2, 3]));
  });

  it('sampleUnique returns n distinct elements from the set', () => {
    const out = sampleUnique([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4);
    expect(out).toHaveLength(4);
    expect(new Set(out).size).toBe(4);
    out.forEach((x) => expect(x).toBeGreaterThanOrEqual(1));
  });

  it('sampleUnique with n > length returns all elements', () => {
    expect(sampleUnique([1, 2, 3], 10).sort()).toEqual([1, 2, 3]);
  });
});
