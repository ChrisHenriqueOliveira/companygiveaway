import { describe, expect, it } from 'vitest';
import {
  canUndo,
  confirmWinner,
  currentDraw,
  eligibleParticipants,
  finishDrawing,
  markAbsentAndRedraw,
  nextPrize,
  pendingQueue,
  startDraw,
  undoLast,
  type ViewPatch,
} from '../../src/domain/engine';
import type { DrawView, Person } from '../../src/domain/types';

const first = <T,>(xs: T[]) => xs[0];
const person = (n: number, email = `p${n}@v.com`): Person => ({ id: `u${n}`, name: `Pessoa ${n}`, email });

function makeView(over: Partial<DrawView> = {}): DrawView {
  return {
    queue: ['z1', 'z2'],
    prizes: {
      z1: { id: 'z1', name: 'Fone', createdAt: 1 },
      z2: { id: 'z2', name: 'Vale', createdAt: 2 },
    },
    participants: [person(1), person(2), person(3), person(4), person(5)],
    excluded: [{ id: 'x1', name: 'Diretor', email: 'p5@v.com' }],
    draws: [],
    stage: { phase: 'idle' },
    ...over,
  };
}
const apply = (v: DrawView, p: ViewPatch): DrawView => ({ ...v, ...p });

describe('eligibleParticipants', () => {
  it('excludes blacklist by normalized email even when cases differ', () => {
    const v = makeView({
      participants: [person(1, 'FULANO@VICERI.COM.BR'), person(2)],
      excluded: [{ id: 'x', name: 'Fulano', email: 'fulano@viceri.com.br' }],
    });
    expect(eligibleParticipants(v).map((p) => p.id)).toEqual(['u2']);
  });
  it('excludes confirmed, absent and pending winners', () => {
    const base = { prizeId: 'z1', prizeName: 'Fone', at: 1 };
    const v = makeView({
      draws: [
        { id: 'd1', participantId: 'u1', name: 'a', email: 'p1@v.com', status: 'confirmed', ...base },
        { id: 'd2', participantId: 'u2', name: 'b', email: 'p2@v.com', status: 'absent', ...base },
        { id: 'd3', participantId: 'u3', name: 'c', email: 'p3@v.com', status: 'pending', ...base },
      ],
    });
    expect(eligibleParticipants(v).map((p) => p.id)).toEqual(['u4']); // u5 is blacklisted
  });
});

describe('nextPrize', () => {
  it('goes to prizeReveal with the first prize of the queue', () => {
    expect(nextPrize(makeView())).toEqual({ stage: { phase: 'prizeReveal', prizeId: 'z1' } });
  });
  it('goes to finale when the queue is empty', () => {
    expect(nextPrize(makeView({ queue: [] }))).toEqual({ stage: { phase: 'finale' } });
  });
  it('does nothing outside idle', () => {
    expect(nextPrize(makeView({ stage: { phase: 'drawing', prizeId: 'z1' } }))).toEqual({});
  });
});

describe('pendingQueue', () => {
  it('drops confirmed prizes and unknown ids', () => {
    const v = makeView({
      queue: ['z1', 'ghost', 'z2'],
      draws: [{ id: 'd', prizeId: 'z1', prizeName: 'Fone', participantId: 'u1', name: 'a', email: 'p1@v.com', status: 'confirmed', at: 1 }],
    });
    expect(pendingQueue(v)).toEqual(['z2']);
  });
});

describe('draw flow', () => {
  it('startDraw creates a pending record for the picked eligible person', () => {
    let v = makeView();
    v = apply(v, nextPrize(v));
    const patch = startDraw(v, 100, first);
    expect(patch.stage?.phase).toBe('drawing');
    expect(patch.draws).toHaveLength(1);
    expect(patch.draws![0]).toMatchObject({ participantId: 'u1', prizeId: 'z1', prizeName: 'Fone', name: 'Pessoa 1', email: 'p1@v.com', status: 'pending', at: 100 });
    expect(patch.stage?.drawId).toBe(patch.draws![0].id);
  });

  it('startDraw only acts in prizeReveal/noEligible', () => {
    expect(startDraw(makeView(), 1, first)).toEqual({});
  });

  it('full flow next → start → finish → confirm', () => {
    let v = makeView();
    v = apply(v, nextPrize(v));
    v = apply(v, startDraw(v, 10, first));
    v = apply(v, finishDrawing(v));
    expect(v.stage.phase).toBe('winnerReveal');
    expect(currentDraw(v)?.participantId).toBe('u1');
    v = apply(v, confirmWinner(v));
    expect(v.stage).toEqual({ phase: 'idle' });
    expect(v.queue).toEqual(['z2']);
    expect(v.draws[0].status).toBe('confirmed');
    // next draw never picks the same winner
    v = apply(v, nextPrize(v));
    v = apply(v, startDraw(v, 20, first));
    expect(v.draws[1].participantId).toBe('u2');
  });

  it('markAbsentAndRedraw marks absent and draws another person for the same prize', () => {
    let v = makeView();
    v = apply(v, nextPrize(v));
    v = apply(v, startDraw(v, 10, first));
    v = apply(v, finishDrawing(v));
    v = apply(v, markAbsentAndRedraw(v, 11, first));
    expect(v.draws.map((d) => d.status)).toEqual(['absent', 'pending']);
    expect(v.draws[1].prizeId).toBe('z1');
    expect(v.draws[1].participantId).toBe('u2');
    expect(v.stage.phase).toBe('drawing');
  });

  it('goes to noEligible when nobody is left, keeping the prize pending and the absent record', () => {
    let v = makeView({ participants: [person(1)] });
    v = apply(v, nextPrize(v));
    v = apply(v, startDraw(v, 10, first));
    v = apply(v, finishDrawing(v));
    v = apply(v, markAbsentAndRedraw(v, 11, first));
    expect(v.stage).toEqual({ phase: 'noEligible', prizeId: 'z1' });
    expect(v.draws.map((d) => d.status)).toEqual(['absent']);
    expect(v.queue).toContain('z1');
  });

  it('startDraw with nobody eligible goes to noEligible without creating a record', () => {
    const v = makeView({ participants: [], stage: { phase: 'prizeReveal', prizeId: 'z1' } });
    expect(startDraw(v, 1, first)).toEqual({ stage: { phase: 'noEligible', prizeId: 'z1' } });
  });
});

describe('undo', () => {
  it('undoing a confirmed draw puts the prize back at the top of the queue', () => {
    let v = makeView();
    v = apply(v, nextPrize(v));
    v = apply(v, startDraw(v, 10, first));
    v = apply(v, finishDrawing(v));
    v = apply(v, confirmWinner(v));
    expect(canUndo(v)).toBe(true);
    v = apply(v, undoLast(v));
    expect(v.queue).toEqual(['z1', 'z2']);
    expect(v.draws).toEqual([]);
    expect(v.stage).toEqual({ phase: 'idle' });
  });

  it('undoing an absent record makes the person eligible again', () => {
    let v = makeView();
    v = apply(v, nextPrize(v));
    v = apply(v, startDraw(v, 10, first));
    v = apply(v, finishDrawing(v));
    v = apply(v, markAbsentAndRedraw(v, 11, first));
    v = apply(v, finishDrawing(v));
    v = apply(v, confirmWinner(v)); // u2 confirmed
    v = apply(v, undoLast(v)); // removes u2 confirmed
    v = apply(v, undoLast(v)); // removes u1 absent
    expect(eligibleParticipants(v).map((p) => p.id)).toContain('u1');
  });

  it('canUndo is false with a pending draw and with no draws', () => {
    expect(canUndo(makeView())).toBe(false);
    let v = makeView();
    v = apply(v, nextPrize(v));
    v = apply(v, startDraw(v, 10, first));
    expect(canUndo(v)).toBe(false);
  });
});
