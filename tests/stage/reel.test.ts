import { describe, expect, it } from 'vitest';
import { buildReel, buildReelWithMargins } from '../../src/stage/reel';
import type { Person } from '../../src/domain/types';

const p = (n: number): Person => ({ id: `u${n}`, name: `Pessoa ${n}`, email: `p${n}@v.com` });

describe('buildReel', () => {
  it('has the requested length, ends with the winner and only uses known people', () => {
    const eligible = [p(1), p(2), p(3), p(4)];
    const winner = p(9);
    const reel = buildReel(eligible, winner, 36);
    expect(reel).toHaveLength(36);
    expect(reel[reel.length - 1]).toEqual(winner);
    const known = new Set(['u1', 'u2', 'u3', 'u4', 'u9']);
    reel.forEach((x) => expect(known.has(x.id)).toBe(true));
  });

  it('never repeats the same person twice in a row (many runs, including tiny pools)', () => {
    for (let run = 0; run < 50; run++) {
      for (const eligible of [[p(1)], [p(1), p(2)], [p(1), p(2), p(3), p(4), p(5)]]) {
        const reel = buildReel(eligible, p(9), 36);
        for (let i = 1; i < reel.length; i++) expect(reel[i].id).not.toBe(reel[i - 1].id);
      }
    }
  });

  it('with nobody else eligible, shows only the winner', () => {
    const reel = buildReel([], p(9), 36);
    expect(reel).toHaveLength(36);
    expect(reel.every((x) => x.id === 'u9')).toBe(true);
  });

  it('does not duplicate the winner when the winner is also in the eligible list', () => {
    const reel = buildReel([p(1), p(9)], p(9), 12);
    expect(reel[reel.length - 1].id).toBe('u9');
    expect(reel[reel.length - 2].id).not.toBe('u9');
  });
});

describe('buildReelWithMargins (rolo contínuo: há nomes acima e abaixo do ganhador)', () => {
  const eligible = [p(1), p(2), p(3), p(4), p(5)];

  it('puts the winner at winnerIndex with extra cards AFTER it and before the first one', () => {
    const { cards, winnerIndex } = buildReelWithMargins(eligible, p(9), 36, 2);
    expect(cards).toHaveLength(2 + 36 + 2);
    expect(winnerIndex).toBe(2 + 36 - 1);
    expect(cards[winnerIndex].id).toBe('u9');
    expect(cards.length - 1 - winnerIndex).toBe(2); // o ganhador NÃO é o último cartão
  });

  it('never repeats the same person in two neighbouring cards, margins included', () => {
    for (let run = 0; run < 50; run++) {
      for (const pool of [[], [p(1)], [p(1), p(2)], eligible]) {
        const { cards } = buildReelWithMargins(pool, p(9), 36, 2);
        for (let i = 1; i < cards.length; i++) {
          if (pool.length > 0) expect(cards[i].id).not.toBe(cards[i - 1].id);
        }
      }
    }
  });

  it('with nobody else eligible it still has cards around the winner', () => {
    const { cards, winnerIndex } = buildReelWithMargins([], p(9), 12, 2);
    expect(cards).toHaveLength(2 + 12 + 2);
    expect(cards[winnerIndex].id).toBe('u9');
  });
});
