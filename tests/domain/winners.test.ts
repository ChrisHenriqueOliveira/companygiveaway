import { describe, expect, it } from 'vitest';
import { finaleLayout, winnersOf } from '../../src/domain/winners';
import type { DrawRecord, Prize } from '../../src/domain/types';

const rec = (id: string, status: DrawRecord['status'], at: number, prizeId = 'z1', name = id): DrawRecord => ({
  id, prizeId, prizeName: `snap-${prizeId}`, participantId: id, name, email: `${id}@v.com`, status, at,
});
const prizes: Record<string, Prize> = {
  z1: { id: 'z1', name: 'Fone', imageId: 'i1', createdAt: 1 },
  z2: { id: 'z2', name: 'Vale', createdAt: 2 },
};
const images = { i1: 'data:image/webp;base64,AAA' };

describe('winnersOf', () => {
  it('keeps only confirmed draws, in the order they were drawn, with the prize image resolved', () => {
    const out = winnersOf(
      [rec('c', 'confirmed', 30, 'z2'), rec('a', 'confirmed', 10, 'z1'), rec('x', 'absent', 20), rec('p', 'pending', 40)],
      prizes,
      images,
    );
    expect(out.map((w) => w.draw.id)).toEqual(['a', 'c']);
    expect(out.map((w) => w.order)).toEqual([1, 2]);
    expect(out[0]).toMatchObject({ prizeName: 'Fone', image: 'data:image/webp;base64,AAA' });
    expect(out[1]).toMatchObject({ prizeName: 'Vale', image: undefined });
  });

  it('falls back to the name saved in the draw when the prize was deleted later', () => {
    const [w] = winnersOf([rec('a', 'confirmed', 1, 'gone')], prizes, images);
    expect(w.prizeName).toBe('snap-gone');
    expect(w.image).toBeUndefined();
  });

  it('is empty when nobody won', () => {
    expect(winnersOf([], prizes, images)).toEqual([]);
  });
});

describe('finaleLayout', () => {
  it('uses big cards for few winners and never more columns than winners', () => {
    expect(finaleLayout(1).cols).toBe(1);
    expect(finaleLayout(2).cols).toBe(2);
    expect(finaleLayout(3).cols).toBe(3);
    expect(finaleLayout(2).imageVh).toBeGreaterThan(finaleLayout(20).imageVh);
  });

  it('grows columns and shrinks cards monotonically as winners increase', () => {
    let prev = finaleLayout(1);
    for (let n = 2; n <= 60; n++) {
      const cur = finaleLayout(n);
      expect(cur.cols).toBeGreaterThanOrEqual(prev.cols);
      expect(cur.imageVh).toBeLessThanOrEqual(prev.imageVh);
      expect(cur.avatar).toBeLessThanOrEqual(prev.avatar);
      prev = cur;
    }
  });

  it('fits the expected 20 prizes in at most 5 columns (5×4)', () => {
    expect(finaleLayout(20).cols).toBeLessThanOrEqual(5);
    expect(finaleLayout(0).cols).toBe(1);
  });
});
