import { describe, expect, it } from 'vitest';
import { createAppStore } from '../../src/store/appStore';

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

describe('stageBackToIdle', () => {
  it('returns from the finale and a late prize can then be drawn', () => {
    const store = createAppStore({ persist: true, storage: mem() });
    const a = () => store.getState();
    a().importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
    a().addPrizes({ name: 'Fone', quantity: 1 });
    a().stageNext(); a().stageStartDraw(); a().stageFinishDrawing(); a().stageConfirm();
    a().stageNext(); // fila vazia -> mural final
    expect(a().stage.phase).toBe('finale');

    a().addPrizes({ name: 'Prêmio surpresa do patrocinador', quantity: 1 }); // chegou depois
    a().stageBackToIdle();
    expect(a().stage.phase).toBe('idle');
    expect(a().draws).toHaveLength(1); // ninguém perdeu o prêmio

    a().stageNext();
    expect(a().stage.phase).toBe('prizeReveal');
    expect(a().prizes[a().stage.prizeId!].name).toBe('Prêmio surpresa do patrocinador');
  });

  it('works in rehearsal without touching the real stage', () => {
    const store = createAppStore({ persist: true, storage: mem() });
    const a = () => store.getState();
    a().setRehearsal(true);
    a().stageNext(); // sem prêmios -> mural final (ensaio)
    expect(a().rehearsal.stage.phase).toBe('finale');
    a().stageBackToIdle();
    expect(a().rehearsal.stage.phase).toBe('idle');
    expect(a().stage.phase).toBe('idle');
  });
});
