import { describe, expect, it } from 'vitest';
import { pacing } from '../../src/stage/pacing';

describe('pacing: só a abertura do presente é configurável; a revelação do ganhador é sempre igual', () => {
  it('the gift opens exactly after the configured gift seconds', () => {
    expect(pacing(4).giftPopMs).toBe(4000);
    expect(pacing(9).giftPopMs).toBe(9000);
  });

  it('keeps the gift sequence ordered: pop < show < ready', () => {
    for (const g of [2, 4, 8, 15]) {
      const p = pacing(g);
      expect(p.giftPopMs).toBeLessThan(p.giftShowMs);
      expect(p.giftShowMs).toBeLessThan(p.giftReadyMs);
    }
  });

  it('the winner reveal (pause after the reel stops, delays, lock) is FIXED, whatever the settings', () => {
    const base = pacing(4);
    for (const g of [2, 4, 15]) {
      const p = pacing(g);
      expect(p.settleMs).toBe(base.settleMs);
      expect(p.winnerLockMs).toBe(base.winnerLockMs);
      expect(p.winnerScale).toBe(1);
    }
    expect(base.settleMs).toBeGreaterThanOrEqual(1800);
    expect(base.winnerLockMs).toBeGreaterThanOrEqual(3500);
  });

  it('clamps the gift seconds to the slider (2–15)', () => {
    expect(pacing(0).giftPopMs).toBe(2000);
    expect(pacing(99).giftPopMs).toBe(15000);
  });

  it('has no dependency on the reel duration at all (the reel setting cannot leak into the reveal)', () => {
    expect(pacing.length).toBeLessThanOrEqual(1);
  });
});
