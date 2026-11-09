import { describe, expect, it } from 'vitest';
import { createAppStore } from '../../src/store/appStore';

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};
function setup(prizes = 2) {
  const store = createAppStore({ persist: true, storage: mem() });
  const a = () => store.getState();
  a().importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  for (let i = 0; i < prizes; i++) a().addPrizes({ name: `P${i + 1}`, quantity: 1 });
  return { store, a };
}

describe('stagePrimary (the same step the clicker does, usable from the Control window)', () => {
  it('advances idle → prizeReveal → drawing, and confirms a revealed winner', () => {
    const { a } = setup();
    a().stagePrimary();
    expect(a().stage.phase).toBe('prizeReveal');
    a().stagePrimary();
    expect(a().stage.phase).toBe('drawing');
    a().stagePrimary(); // durante o rolo não faz nada
    expect(a().stage.phase).toBe('drawing');
    a().stageFinishDrawing();
    a().stagePrimary();
    expect(a().stage.phase).toBe('idle');
    expect(a().draws[0].status).toBe('confirmed');
  });

  it('does nothing while there is nothing to draw (setup screen), exactly like the stage', () => {
    const store = createAppStore({ persist: true, storage: mem() });
    store.getState().stagePrimary();
    expect(store.getState().stage.phase).toBe('idle');
    store.getState().addPrizes({ name: 'P', quantity: 1 }); // prêmio sem participantes
    store.getState().stagePrimary();
    expect(store.getState().stage.phase).toBe('idle');
  });

  it('retries the draw from "no eligible" (like the stage key)', () => {
    const { a } = setup(1);
    a().stagePrimary();
    a().stagePrimary();
    a().stageFinishDrawing();
    a().stageAbsent();
    a().stageFinishDrawing();
    a().stageAbsent(); // os dois ausentes -> ninguém elegível
    expect(a().stage.phase).toBe('noEligible');
    a().addParticipant({ name: 'Caio', email: 'caio@v.com' });
    a().stagePrimary();
    expect(a().stage.phase).toBe('drawing');
  });
});

describe('draws are blocked while saving is failing (the winner must be persisted before the animation)', () => {
  function failingStore() {
    const m = new Map<string, string>();
    const ctl = { fail: false };
    const storage = {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (ctl.fail) throw new Error('QuotaExceededError');
        m.set(k, v);
      },
      removeItem: (k: string) => void m.delete(k),
    };
    const store = createAppStore({ persist: true, storage });
    const a = () => store.getState();
    a().importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
    a().addPrizes({ name: 'P1', quantity: 1 });
    return { ctl, a };
  }

  it('stageStartDraw does nothing while a save is failing, and works again once saving recovers', () => {
    const { ctl, a } = failingStore();
    a().stageNext();
    ctl.fail = true;
    a().updateSettings({ eventName: 'Qualquer mudança' }); // qualquer gravação que falha liga o erro
    expect(a().storageError).not.toBeNull();

    a().stageStartDraw();
    expect(a().stage.phase).toBe('prizeReveal');
    expect(a().draws).toEqual([]);

    ctl.fail = false;
    a().updateSettings({ eventName: 'Outra mudança' }); // gravou: o erro some
    expect(a().storageError).toBeNull();
    a().stageStartDraw();
    expect(a().stage.phase).toBe('drawing');
  });

  it('rehearsal still draws, because nothing is saved in rehearsal anyway', () => {
    const { ctl, a } = failingStore();
    ctl.fail = true;
    a().setRehearsal(true);
    expect(a().storageError).not.toBeNull();
    a().stageNext();
    a().stageStartDraw();
    expect(a().rehearsal.stage.phase).toBe('drawing');
  });
});
