import { describe, expect, it, vi } from 'vitest';
import { encodeWithinBudget, MAX_IMAGE_SIDE, IMAGE_BUDGET_CHARS } from '../../src/io/imageLadder';

describe('encodeWithinBudget (alta resolução com teto de tamanho)', () => {
  it('starts at the highest resolution (much more than the old 640 px)', () => {
    expect(MAX_IMAGE_SIDE).toBeGreaterThanOrEqual(1280);
    const encode = vi.fn((_side: number, _quality: number) => 'x'.repeat(1000));
    encodeWithinBudget(encode);
    expect(encode).toHaveBeenCalledTimes(1);
    expect(encode.mock.calls[0][0]).toBe(MAX_IMAGE_SIDE);
  });

  it('steps down until the result fits the storage budget', () => {
    const sizes = new Map<number, number>([[1280, IMAGE_BUDGET_CHARS + 50_000], [1024, IMAGE_BUDGET_CHARS + 1], [800, IMAGE_BUDGET_CHARS - 10], [640, 1000]]);
    const seen: number[] = [];
    const out = encodeWithinBudget((side) => {
      seen.push(side);
      return 'x'.repeat(sizes.get(side) ?? 10);
    });
    expect(seen).toEqual([1280, 1024, 800]);
    expect(out.length).toBe(IMAGE_BUDGET_CHARS - 10);
  });

  it('returns the smallest attempt when nothing fits (never fails the upload)', () => {
    const out = encodeWithinBudget((side) => 'x'.repeat(IMAGE_BUDGET_CHARS * 2 + side));
    expect(out.length).toBe(IMAGE_BUDGET_CHARS * 2 + 640);
  });
});
