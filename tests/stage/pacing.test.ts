import { describe, expect, it } from 'vitest';
import { pacing } from '../../src/stage/pacing';

describe('pacing: abertura do presente e rolo do sorteio são configuráveis separadamente', () => {
  it('the gift opens exactly after the configured gift seconds, whatever the reel suspense is', () => {
    expect(pacing(7, 4).giftPopMs).toBe(4000);
    expect(pacing(15, 4).giftPopMs).toBe(4000);
    expect(pacing(3, 4).giftPopMs).toBe(4000);
    expect(pacing(7, 9).giftPopMs).toBe(9000);
  });

  it('the reel-side timings (settle / winner reveal) follow the reel suspense, not the gift', () => {
    expect(pacing(7, 2).settleMs).toBe(pacing(7, 15).settleMs);
    expect(pacing(7, 2).winnerLockMs).toBe(pacing(7, 15).winnerLockMs);
    expect(pacing(12, 4).settleMs).toBeGreaterThan(pacing(4, 4).settleMs);
    expect(pacing(12, 4).winnerLockMs).toBeGreaterThan(pacing(4, 4).winnerLockMs);
  });

  it('keeps the gift sequence ordered: pop < show < ready', () => {
    for (const g of [2, 4, 8, 15]) {
      const p = pacing(7, g);
      expect(p.giftPopMs).toBeLessThan(p.giftShowMs);
      expect(p.giftShowMs).toBeLessThan(p.giftReadyMs);
    }
  });

  it('with the defaults the winner reveal is clearly slower than the old fixed timings', () => {
    const p = pacing(7, 4);
    expect(p.settleMs).toBeGreaterThanOrEqual(1800); // antes: 600 ms
    expect(p.winnerLockMs).toBeGreaterThanOrEqual(3500); // antes: 1300 ms
  });

  it('clamps values outside the sliders (reel 3–15 s, gift 2–15 s)', () => {
    expect(pacing(1, 4)).toEqual(pacing(3, 4));
    expect(pacing(99, 4)).toEqual(pacing(15, 4));
    expect(pacing(7, 0).giftPopMs).toBe(2000);
    expect(pacing(7, 99).giftPopMs).toBe(15000);
  });

  it('winnerScale stretches the winner reveal delays proportionally (1x at 7 s)', () => {
    expect(pacing(7, 4).winnerScale).toBe(1);
    expect(pacing(14, 4).winnerScale).toBe(2);
    expect(pacing(3, 4).winnerScale).toBeCloseTo(0.6);
  });
});
