import { describe, expect, it } from 'vitest';
import { expandPrizeInput } from '../../src/domain/prizes';

describe('expandPrizeInput', () => {
  it('splits quantity 3 into 3 independent prizes of one group', () => {
    const out = expandPrizeInput({ name: 'Vale R$200', imageId: 'img1', quantity: 3 }, 1000);
    expect(out).toHaveLength(3);
    expect(new Set(out.map((p) => p.id)).size).toBe(3);
    expect(new Set(out.map((p) => p.groupId)).size).toBe(1);
    expect(out[0].groupId).toBeDefined();
    expect(out.map((p) => p.groupIndex)).toEqual([1, 2, 3]);
    out.forEach((p) => {
      expect(p.groupSize).toBe(3);
      expect(p.imageId).toBe('img1');
      expect(p.name).toBe('Vale R$200');
      expect(p.createdAt).toBe(1000);
    });
  });
  it('quantity 1 yields one prize without group', () => {
    const [p, ...rest] = expandPrizeInput({ name: 'Fone', quantity: 1 }, 5);
    expect(rest).toHaveLength(0);
    expect(p.groupId).toBeUndefined();
    expect(p.groupSize).toBeUndefined();
  });
  it('throws on invalid quantity or empty name', () => {
    expect(() => expandPrizeInput({ name: 'x', quantity: 0 }, 1)).toThrow();
    expect(() => expandPrizeInput({ name: '   ', quantity: 1 }, 1)).toThrow();
  });
});

describe('groupLabels (etiqueta X/Y segue as exclusões)', () => {
  it('renumbers and recounts after units are removed', async () => {
    const { groupLabels } = await import('../../src/domain/prizes');
    const all = expandPrizeInput({ name: 'Polo', quantity: 20 }, 1);
    const left = Object.fromEntries(all.filter((_, i) => ![1, 4, 7, 10, 13].includes(i)).map((p) => [p.id, p]));
    const labels = groupLabels(left);
    const ordered = Object.values(left);
    expect(ordered).toHaveLength(15);
    expect(labels[ordered[0].id]).toEqual({ index: 1, size: 15 });
    expect(labels[ordered[1].id]).toEqual({ index: 2, size: 15 });
    expect(labels[ordered[14].id]).toEqual({ index: 15, size: 15 });
  });

  it('a lone unit and ungrouped prizes have no label', async () => {
    const { groupLabels } = await import('../../src/domain/prizes');
    const [a] = expandPrizeInput({ name: 'Polo', quantity: 3 }, 1);
    const [solo] = expandPrizeInput({ name: 'Fone', quantity: 1 }, 1);
    expect(groupLabels({ [a.id]: a, [solo.id]: solo })).toEqual({});
  });
});
