import { describe, expect, it } from 'vitest';
import { pendingQueue } from '../../src/domain/engine';
import { createAppStore, selectView } from '../../src/store/appStore';
import { STORAGE_KEY } from '../../src/store/persistence';

function memStorage() {
  const m = new Map<string, string>();
  return {
    raw: m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}
function setup() {
  const storage = memStorage();
  const store = createAppStore({ persist: true, storage });
  return { storage, store, a: () => store.getState() };
}
const ana = { name: 'Ana', email: 'ana@v.com' };
const bob = { name: 'Bob', email: 'bob@v.com' };

function playOne(s: ReturnType<typeof setup>) {
  s.a().stageNext();
  s.a().stageStartDraw();
  s.a().stageFinishDrawing();
  s.a().stageConfirm();
}

describe('prizes', () => {
  it('addPrizes with quantity 3 creates 3 queue entries sharing one image', () => {
    const s = setup();
    s.a().addPrizes({ name: 'Vale', image: 'data:x', quantity: 3 });
    expect(s.a().queue).toHaveLength(3);
    expect(Object.keys(s.a().images)).toHaveLength(1);
  });

  it('removePrize frees an unreferenced image', () => {
    const s = setup();
    s.a().addPrizes({ name: 'A', image: 'data:x', quantity: 1 });
    s.a().removePrize(s.a().queue[0]);
    expect(s.a().images).toEqual({});
    expect(s.a().queue).toEqual([]);
  });

  it('removePrize does nothing for a confirmed prize', () => {
    const s = setup();
    s.a().importParticipants([ana], 'replace');
    s.a().addPrizes({ name: 'A', quantity: 1 });
    const id = s.a().queue[0];
    playOne(s);
    s.a().removePrize(id);
    expect(s.a().prizes[id]).toBeDefined();
  });

  it('reorderQueue rejects non-permutations and applies valid ones', () => {
    const s = setup();
    s.a().addPrizes({ name: 'A', quantity: 1 });
    s.a().addPrizes({ name: 'B', quantity: 1 });
    const [x, y] = s.a().queue;
    s.a().reorderQueue([x]);
    expect(s.a().queue).toEqual([x, y]);
    s.a().reorderQueue([y, x]);
    expect(s.a().queue).toEqual([y, x]);
  });
});

describe('participants', () => {
  it('replace import preserves winners missing from the new list and dedupes emails', () => {
    const s = setup();
    s.a().importParticipants([ana], 'replace');
    s.a().addPrizes({ name: 'A', quantity: 1 });
    playOne(s); // ana wins (only one eligible)
    s.a().importParticipants([bob, { name: 'Bob 2', email: 'BOB@v.com' }], 'replace');
    expect(s.a().participants.map((p) => p.email)).toEqual(['bob@v.com', 'ana@v.com']);
  });

  it('removeParticipant is blocked for winners', () => {
    const s = setup();
    s.a().importParticipants([ana], 'replace');
    s.a().addPrizes({ name: 'A', quantity: 1 });
    playOne(s);
    s.a().removeParticipant(s.a().participants[0].id);
    expect(s.a().participants).toHaveLength(1);
  });

  it('addParticipant rejects duplicates', () => {
    const s = setup();
    s.a().addParticipant(ana);
    s.a().addParticipant({ name: 'x', email: 'ANA@v.com' });
    expect(s.a().participants).toHaveLength(1);
  });
});

describe('persistence', () => {
  it('rehydrates saved data in a new store and recovers a mid-draw reload', () => {
    const s = setup();
    s.a().addPrizes({ name: 'A', quantity: 1 });
    s.a().importParticipants([ana], 'replace');
    s.a().stageNext();
    s.a().stageStartDraw();
    expect(s.a().stage.phase).toBe('drawing');
    const s2 = createAppStore({ persist: true, storage: s.storage });
    expect(s2.getState().queue).toHaveLength(1);
    expect(s2.getState().stage.phase).toBe('winnerReveal');
    expect(s2.getState().draws).toHaveLength(1);
  });

  it('never stores rehearsal or storageError', () => {
    const s = setup();
    s.a().setRehearsal(true);
    const saved = JSON.parse(s.storage.raw.get(STORAGE_KEY)!).state;
    expect(saved).not.toHaveProperty('rehearsal');
    expect(saved).not.toHaveProperty('storageError');
  });

  it('keeps state in memory and flags storageError when quota is exceeded, then clears it', () => {
    let fail = true;
    const base = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => {
        if (fail) throw new Error('QuotaExceededError');
      },
    };
    const store = createAppStore({ persist: true, storage: base });
    store.getState().addPrizes({ name: 'A', quantity: 1 });
    expect(store.getState().storageError).toMatch(/salvar/i);
    expect(store.getState().queue).toHaveLength(1);
    fail = false;
    store.getState().addPrizes({ name: 'B', quantity: 1 });
    expect(store.getState().storageError).toBeNull();
  });
});

describe('rehearsal mode', () => {
  it('runs draws without touching the real queue/draws, but persists registrations', () => {
    const s = setup();
    s.a().importParticipants([ana, bob], 'replace');
    s.a().addPrizes({ name: 'A', quantity: 1 });
    s.a().addPrizes({ name: 'B', quantity: 1 });
    s.a().setRehearsal(true);
    playOne(s);
    expect(s.a().queue).toHaveLength(2);
    expect(s.a().draws).toEqual([]);
    expect(s.a().rehearsal.draws).toHaveLength(1);
    expect(pendingQueue(selectView(s.a()))).toHaveLength(1);
    s.a().addParticipant({ name: 'Caio', email: 'caio@v.com' });
    const saved = JSON.parse(s.storage.raw.get(STORAGE_KEY)!).state;
    expect(saved.participants).toHaveLength(3);
    s.a().setRehearsal(false);
    expect(s.a().rehearsal.draws).toEqual([]);
    expect(s.a().stage.phase).toBe('idle');
  });

  it('undo during rehearsal never touches real draws', () => {
    const s = setup();
    s.a().importParticipants([ana, bob], 'replace');
    s.a().addPrizes({ name: 'A', quantity: 1 });
    s.a().addPrizes({ name: 'B', quantity: 1 });
    playOne(s); // real
    s.a().setRehearsal(true);
    s.a().undoLast();
    expect(s.a().draws).toHaveLength(1);
  });
});
