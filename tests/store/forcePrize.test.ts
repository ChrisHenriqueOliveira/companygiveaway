import { describe, expect, it } from 'vitest';
import { createAppStore } from '../../src/store/appStore';

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

function setup() {
  const store = createAppStore({ persist: true, storage: mem() });
  const a = () => store.getState();
  a().importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  a().addPrizes({ name: 'Fone', quantity: 1 });
  a().addPrizes({ name: 'Vale', quantity: 1 });
  return { store, a };
}

describe('stageForcePrize (store)', () => {
  it('after the winner was revealed, forcing another prize drops that unconfirmed draw and shows the new prize', () => {
    const { a } = setup();
    const [first, second] = a().queue;
    a().stageNext();
    a().stageStartDraw();
    a().stageFinishDrawing();
    expect(a().stage.phase).toBe('winnerReveal');
    expect(a().draws).toHaveLength(1);

    a().stageForcePrize(second);
    expect(a().stage).toEqual({ phase: 'prizeReveal', prizeId: second });
    expect(a().draws).toEqual([]);
    expect(a().queue).toEqual([first, second]);

    // o fluxo segue normal a partir do prêmio forçado
    a().stageStartDraw();
    a().stageFinishDrawing();
    a().stageConfirm();
    expect(a().draws[0].prizeId).toBe(second);
    expect(a().queue).toEqual([first]);
  });

  it('in rehearsal it only touches the rehearsal stage and draws', () => {
    const { a } = setup();
    const second = a().queue[1];
    a().setRehearsal(true);
    a().stageNext();
    a().stageStartDraw();
    a().stageFinishDrawing();
    a().stageForcePrize(second);
    expect(a().rehearsal.stage).toEqual({ phase: 'prizeReveal', prizeId: second });
    expect(a().rehearsal.draws).toEqual([]);
    expect(a().stage.phase).toBe('idle');
  });

  it('ignores ids that are not in the queue', () => {
    const { a } = setup();
    a().stageForcePrize('nope');
    expect(a().stage.phase).toBe('idle');
  });
});
