import { describe, expect, it } from 'vitest';
import { eligibleParticipants, forcePrize, type ViewPatch } from '../../src/domain/engine';
import type { DrawRecord, DrawView } from '../../src/domain/types';

const rec = (id: string, status: DrawRecord['status'], participantId: string, prizeId: string): DrawRecord => ({
  id,
  prizeId,
  prizeName: prizeId,
  participantId,
  name: participantId,
  email: `${participantId}@v.com`,
  status,
  at: 1,
});
const apply = (v: DrawView, p: ViewPatch): DrawView => ({ ...v, ...p });

const view = (over: Partial<DrawView> = {}): DrawView => ({
  queue: ['z1', 'z2', 'z3'],
  prizes: {
    z1: { id: 'z1', name: 'Fone', createdAt: 1 },
    z2: { id: 'z2', name: 'Vale', createdAt: 2 },
    z3: { id: 'z3', name: 'Cafeteira', createdAt: 3 },
  },
  participants: [
    { id: 'ana', name: 'ana', email: 'ana@v.com' },
    { id: 'bob', name: 'bob', email: 'bob@v.com' },
  ],
  excluded: [],
  draws: [],
  stage: { phase: 'idle' },
  ...over,
});

describe('forcePrize (mandar um prêmio específico para o palco)', () => {
  it('works from idle: the chosen prize is shown (not the first of the queue)', () => {
    const next = apply(view(), forcePrize(view(), 'z3'));
    expect(next.stage).toEqual({ phase: 'prizeReveal', prizeId: 'z3' });
  });

  it('replaces a prize that is on stage but was not drawn yet', () => {
    const v = view({ stage: { phase: 'prizeReveal', prizeId: 'z1' } });
    expect(apply(v, forcePrize(v, 'z2')).stage).toEqual({ phase: 'prizeReveal', prizeId: 'z2' });
  });

  it('replaces a prize whose winner was already revealed: the pending draw is discarded and the person can be drawn again', () => {
    const v = view({
      draws: [rec('d0', 'absent', 'bob', 'z1'), rec('d1', 'pending', 'ana', 'z1')],
      stage: { phase: 'winnerReveal', prizeId: 'z1', drawId: 'd1' },
    });
    const next = apply(v, forcePrize(v, 'z2'));
    expect(next.stage).toEqual({ phase: 'prizeReveal', prizeId: 'z2' });
    expect(next.draws.map((d) => d.id)).toEqual(['d0']); // o ausente do histórico fica
    expect(eligibleParticipants(next).map((p) => p.id)).toEqual(['ana']); // ana volta; bob continua ausente
  });

  it('keeps the queue untouched: the replaced prize stays where it was', () => {
    const v = view({ stage: { phase: 'prizeReveal', prizeId: 'z1' } });
    expect(apply(v, forcePrize(v, 'z2')).queue).toEqual(['z1', 'z2', 'z3']);
  });

  it('works from the final wall and from "no eligible"', () => {
    for (const phase of ['finale', 'noEligible'] as const) {
      const v = view({ stage: { phase, prizeId: 'z1' } });
      expect(apply(v, forcePrize(v, 'z2')).stage).toEqual({ phase: 'prizeReveal', prizeId: 'z2' });
    }
  });

  it('refuses prizes that are not pending in the queue (unknown, already confirmed)', () => {
    expect(forcePrize(view(), 'nope')).toEqual({});
    const done = view({ draws: [rec('d1', 'confirmed', 'ana', 'z2')] });
    expect(forcePrize(done, 'z2')).toEqual({});
  });
});
