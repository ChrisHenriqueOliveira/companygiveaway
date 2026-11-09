import { describe, expect, it } from 'vitest';
import { createAppStore } from '../../src/store/appStore';

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};
const play = (a: () => ReturnType<ReturnType<typeof createAppStore>['getState']>) => {
  a().stageNext();
  a().stageStartDraw();
  a().stageFinishDrawing();
};

describe('removeDraw (store)', () => {
  it('confirmed: prize returns to the queue and the winner is eligible again', () => {
    const store = createAppStore({ persist: true, storage: mem() });
    const a = () => store.getState();
    a().importParticipants([{ name: 'Ana', email: 'ana@v.com' }], 'replace');
    a().addPrizes({ name: 'Fone', quantity: 1 });
    play(a);
    a().stageConfirm();
    expect(a().queue).toEqual([]);

    a().removeDraw(a().draws[0].id);
    expect(a().draws).toEqual([]);
    expect(a().queue).toHaveLength(1);
    a().stageNext();
    a().stageStartDraw();
    expect(a().draws[0].name).toBe('Ana'); // pode ser sorteada de novo
  });

  it('absent: the person is eligible again but the prize queue does not change', () => {
    const store = createAppStore({ persist: true, storage: mem() });
    const a = () => store.getState();
    a().importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
    a().addPrizes({ name: 'Fone', quantity: 1 });
    play(a);
    a().stageAbsent();
    a().stageFinishDrawing();
    a().stageConfirm();
    const absent = a().draws.find((d) => d.status === 'absent')!;
    const queueBefore = a().queue;

    a().removeDraw(absent.id);
    expect(a().draws.some((d) => d.id === absent.id)).toBe(false);
    expect(a().queue).toEqual(queueBefore);
  });

  it('rehearsal: only test draws can be removed, and the real queue is never touched', () => {
    const store = createAppStore({ persist: true, storage: mem() });
    const a = () => store.getState();
    a().importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
    a().addPrizes({ name: 'Fone', quantity: 1 });
    a().addPrizes({ name: 'Vale', quantity: 1 });
    play(a);
    a().stageConfirm(); // sorteio REAL
    const real = a().draws[0];

    a().setRehearsal(true);
    play(a);
    a().stageConfirm();
    const test = a().rehearsal.draws[0];

    a().removeDraw(real.id); // não pode mexer no real durante o ensaio
    expect(a().draws).toHaveLength(1);

    a().removeDraw(test.id);
    expect(a().rehearsal.draws).toHaveLength(0);
    expect(a().queue).toHaveLength(1); // fila real intacta
  });
});
