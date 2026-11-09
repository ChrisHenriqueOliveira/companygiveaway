import { describe, expect, it } from 'vitest';
import { eligibleParticipants, removeDraw, type ViewPatch } from '../../src/domain/engine';
import type { DrawRecord, DrawView } from '../../src/domain/types';

const rec = (id: string, status: DrawRecord['status'], participantId: string, prizeId = 'z1'): DrawRecord => ({
  id,
  prizeId,
  prizeName: 'Fone',
  participantId,
  name: participantId,
  email: `${participantId}@v.com`,
  status,
  at: 1,
});

const view = (over: Partial<DrawView> = {}): DrawView => ({
  queue: ['z2'],
  prizes: {
    z1: { id: 'z1', name: 'Fone', createdAt: 1 },
    z2: { id: 'z2', name: 'Vale', createdAt: 2 },
  },
  participants: [
    { id: 'ana', name: 'ana', email: 'ana@v.com' },
    { id: 'bob', name: 'bob', email: 'bob@v.com' },
  ],
  excluded: [],
  draws: [rec('d1', 'confirmed', 'ana'), rec('d2', 'absent', 'bob', 'z2')],
  stage: { phase: 'idle' },
  ...over,
});
const apply = (v: DrawView, p: ViewPatch): DrawView => ({ ...v, ...p });

describe('removeDraw', () => {
  it('removing a CONFIRMED record gives the prize back (top of the queue) and the person can win again', () => {
    const v = view();
    const next = apply(v, removeDraw(v, 'd1'));
    expect(next.draws.map((d) => d.id)).toEqual(['d2']);
    expect(next.queue).toEqual(['z1', 'z2']);
    expect(eligibleParticipants(next).map((p) => p.id)).toContain('ana');
  });

  it('removing an ABSENT record only frees the person: the prize list is untouched', () => {
    const v = view();
    const next = apply(v, removeDraw(v, 'd2'));
    expect(next.draws.map((d) => d.id)).toEqual(['d1']);
    expect(next.queue).toEqual(['z2']); // o prêmio z2 não volta nem muda
    expect(eligibleParticipants(next).map((p) => p.id)).toContain('bob');
  });

  it('does not duplicate a prize that is already in the queue and ignores deleted prizes', () => {
    const inQueue = view({ queue: ['z1', 'z2'] });
    expect(apply(inQueue, removeDraw(inQueue, 'd1')).queue).toEqual(['z1', 'z2']);

    const gone = view({ prizes: { z2: { id: 'z2', name: 'Vale', createdAt: 2 } } });
    expect(apply(gone, removeDraw(gone, 'd1')).queue).toEqual(['z2']);
  });

  it('refuses pending records, the draw on stage, and unknown ids', () => {
    const pending = view({ draws: [rec('d3', 'pending', 'ana')], stage: { phase: 'winnerReveal', prizeId: 'z1', drawId: 'd3' } });
    expect(removeDraw(pending, 'd3')).toEqual({});

    const onStage = view({ stage: { phase: 'winnerReveal', prizeId: 'z1', drawId: 'd1' } });
    expect(removeDraw(onStage, 'd1')).toEqual({});

    expect(removeDraw(view(), 'nope')).toEqual({});
  });
});
