import { describe, expect, it } from 'vitest';
import { backToIdle, lastDraw } from '../../src/domain/engine';
import type { DrawRecord, DrawView } from '../../src/domain/types';
import { normalizeOnLoad, validateAppData } from '../../src/store/persistence';
import { createEmptyData } from '../../src/domain/types';

const rec = (id: string, at: number, status: DrawRecord['status'] = 'confirmed'): DrawRecord => ({
  id, prizeId: 'z1', prizeName: 'Fone', participantId: 'ana', name: 'Ana', email: 'ana@v.com', status, at,
});
const view = (over: Partial<DrawView> = {}): DrawView => ({
  queue: ['z1'],
  prizes: { z1: { id: 'z1', name: 'Fone', createdAt: 1 } },
  participants: [{ id: 'ana', name: 'Ana', email: 'ana@v.com' }],
  excluded: [],
  draws: [],
  stage: { phase: 'idle' },
  ...over,
});

describe('backToIdle is also allowed from a prize reveal (nothing drawn yet)', () => {
  it('prizeReveal → idle, keeping the queue', () => {
    expect(backToIdle(view({ stage: { phase: 'prizeReveal', prizeId: 'z1' } }))).toEqual({ stage: { phase: 'idle' } });
  });
  it('winnerReveal/drawing stay protected while a real draw is on screen', () => {
    const v = view({ draws: [rec('d1', 1, 'pending')], stage: { phase: 'winnerReveal', prizeId: 'z1', drawId: 'd1' } });
    expect(backToIdle(v)).toEqual({});
  });
  it('but a winnerReveal pointing to a missing draw (corrupted state) can be escaped', () => {
    const v = view({ stage: { phase: 'winnerReveal', prizeId: 'z1', drawId: 'ghost' } });
    expect(backToIdle(v)).toEqual({ stage: { phase: 'idle' } });
  });
});

describe('lastDraw', () => {
  it('is the record undo would remove (latest by time)', () => {
    expect(lastDraw(view({ draws: [rec('a', 1), rec('b', 5), rec('c', 3)] }))?.id).toBe('b');
    expect(lastDraw(view())).toBeUndefined();
  });
});

describe('normalizeOnLoad heals a dangling draw reference', () => {
  it('winnerReveal/drawing whose draw no longer exists goes back to idle', () => {
    for (const phase of ['winnerReveal', 'drawing'] as const) {
      const d = { ...createEmptyData(), stage: { phase, prizeId: 'z1', drawId: 'ghost' } };
      expect(normalizeOnLoad(d).stage).toEqual({ phase: 'idle' });
    }
  });
});

describe('validateAppData (deep check used when restoring a backup)', () => {
  const ok = () => ({
    ...createEmptyData(),
    participants: [{ id: 'a', name: 'Ana', email: 'ana@v.com' }],
    draws: [rec('d', 1)],
    prizes: { z1: { id: 'z1', name: 'Fone', createdAt: 1 } },
    queue: ['z1'],
  });

  it('accepts well-formed data', () => {
    expect(validateAppData(ok())).toBeNull();
  });

  it('rejects participants, draws, prizes and queue items with missing/wrong fields', () => {
    const noName = ok();
    (noName.participants[0] as unknown as Record<string, unknown>).name = undefined;
    expect(validateAppData(noName)).toMatch(/participantes/i);

    const badStatus = ok();
    (badStatus.draws[0] as unknown as Record<string, unknown>).status = 'maybe';
    expect(validateAppData(badStatus)).toMatch(/sorteios/i);

    const noEmail = ok();
    (noEmail.draws[0] as unknown as Record<string, unknown>).email = 42;
    expect(validateAppData(noEmail)).toMatch(/sorteios/i);

    const badPrize = ok();
    (badPrize.prizes.z1 as Record<string, unknown>).name = null;
    expect(validateAppData(badPrize)).toMatch(/prêmios/i);

    const badQueue = ok();
    (badQueue as Record<string, unknown>).queue = [1, 2];
    expect(validateAppData(badQueue)).toMatch(/fila/i);

    const badStage = ok();
    (badStage.stage as unknown as Record<string, unknown>).phase = 'teleport';
    expect(validateAppData(badStage)).toMatch(/palco/i);
  });
});
