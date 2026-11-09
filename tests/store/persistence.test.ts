import { describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import {
  createSafeStorage,
  estimateUsage,
  migrate,
  normalizeOnLoad,
  STORAGE_LIMIT_CHARS,
} from '../../src/store/persistence';

describe('normalizeOnLoad', () => {
  it('turns a reloaded "drawing" into "winnerReveal", keeping the drawId', () => {
    const d = { ...createEmptyData(), stage: { phase: 'drawing' as const, prizeId: 'p', drawId: 'd' } };
    expect(normalizeOnLoad(d).stage).toEqual({ phase: 'winnerReveal', prizeId: 'p', drawId: 'd' });
  });
  it('keeps other phases untouched', () => {
    const d = { ...createEmptyData(), stage: { phase: 'prizeReveal' as const, prizeId: 'p' } };
    expect(normalizeOnLoad(d)).toEqual(d);
  });
});

describe('migrate', () => {
  it('returns empty data for garbage', () => {
    expect(migrate(null)).toEqual(createEmptyData());
    expect(migrate({ foo: 1 })).toEqual(createEmptyData());
    expect(migrate('lixo')).toEqual(createEmptyData());
  });
  it('returns valid data as is', () => {
    const d = { ...createEmptyData(), queue: ['a'] };
    expect(migrate(d)).toEqual(d);
  });
});

describe('estimateUsage', () => {
  it('reports characters and ratio against the limit', () => {
    const u = estimateUsage(createEmptyData());
    expect(u.chars).toBeGreaterThan(0);
    expect(u.ratio).toBeCloseTo(u.chars / STORAGE_LIMIT_CHARS);
  });
});

describe('createSafeStorage', () => {
  it('reports setItem failures instead of throwing, and success via onOk', () => {
    const onError = vi.fn();
    const onOk = vi.fn();
    let fail = true;
    const base = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => {
        if (fail) throw new Error('QuotaExceededError');
      },
    };
    const s = createSafeStorage(onError, { base, onOk });
    expect(() => s.setItem('k', 'v')).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(1);
    fail = false;
    s.setItem('k', 'v');
    expect(onOk).toHaveBeenCalledTimes(1);
  });
});
