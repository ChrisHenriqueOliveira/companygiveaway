import { describe, expect, it } from 'vitest';
import { backToIdle, canUndo, markAbsentAndRedraw, nextPrize, startDraw, finishDrawing, eligibleParticipants, undoLast, type ViewPatch } from '../../src/domain/engine';
import type { DrawView } from '../../src/domain/types';

const first = <T,>(xs: T[]) => xs[0];
const apply = (v: DrawView, p: ViewPatch): DrawView => ({ ...v, ...p });
const view = (over: Partial<DrawView> = {}): DrawView => ({
  queue: ['z1'],
  prizes: { z1: { id: 'z1', name: 'Fone', createdAt: 1 } },
  participants: [{ id: 'u1', name: 'Ana', email: 'ana@v.com' }],
  excluded: [],
  draws: [],
  stage: { phase: 'idle' },
  ...over,
});

describe('backToIdle', () => {
  it('leaves the finale wall without touching any draw', () => {
    expect(backToIdle(view({ stage: { phase: 'finale' } }))).toEqual({ stage: { phase: 'idle' } });
  });

  it('leaves noEligible keeping the prize pending, and then undo of the absent record works', () => {
    let v = view();
    v = apply(v, nextPrize(v));
    v = apply(v, startDraw(v, 1, first));
    v = apply(v, finishDrawing(v));
    v = apply(v, markAbsentAndRedraw(v, 2, first)); // última pessoa marcada ausente por engano
    expect(v.stage.phase).toBe('noEligible');
    expect(canUndo(v)).toBe(false);

    v = apply(v, backToIdle(v));
    expect(v.stage).toEqual({ phase: 'idle' });
    expect(v.queue).toEqual(['z1']);
    expect(canUndo(v)).toBe(true);

    v = apply(v, undoLast(v));
    expect(eligibleParticipants(v).map((p) => p.id)).toEqual(['u1']);
  });

  it('does nothing in any other phase', () => {
    for (const phase of ['idle', 'prizeReveal', 'drawing', 'winnerReveal'] as const) {
      expect(backToIdle(view({ stage: { phase, prizeId: 'z1' } }))).toEqual({});
    }
  });
});
