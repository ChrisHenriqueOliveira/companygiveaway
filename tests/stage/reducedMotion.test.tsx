import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';
import { resetStageLock } from '../../src/stage/lock';
import { StageApp } from '../../src/stage/StageApp';
import { pacing } from '../../src/stage/pacing';

vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../src/stage/confetti', () => ({ burst: () => undefined, cannons: () => () => undefined, softRain: () => () => undefined }));

const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 50) act(() => void vi.advanceTimersByTime(50));
};

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  resetActionsProvider();
  resetStageLock();
  // Sistema com "reduzir movimento" ligado (Windows com efeitos de animação desligados)
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
    onchange: null,
  })) as never;
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.updateSettings({ suspenseSeconds: 7, giftSeconds: 5 });
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 1 });
});
afterEach(() => vi.useRealTimers());

describe('"reduzir movimento" do sistema não encurta o suspense configurado', () => {
  it('the gift keeps its full-length sequence: "Sortear!" only appears at the configured pace', () => {
    render(<StageApp />);
    fireEvent.keyDown(window, { key: ' ' });
    advance(2500); // antes do bug o botão já aparecia em ~0,9 s
    expect(screen.queryByRole('button', { name: /sortear!/i })).not.toBeInTheDocument();

    advance(pacing(7, 5).giftReadyMs + 200);
    expect(screen.getByRole('button', { name: /sortear!/i })).toBeInTheDocument();
  });

  it('the reel lasts the configured suspense (7 s), not a capped 2 s', () => {
    render(<StageApp />);
    fireEvent.keyDown(window, { key: ' ' });
    advance(pacing(7, 5).giftReadyMs + 200);
    fireEvent.keyDown(window, { key: ' ' });
    expect(useAppStore.getState().stage.phase).toBe('drawing');

    advance(3000); // com o teto antigo de 2 s já teria revelado o ganhador
    expect(useAppStore.getState().stage.phase).toBe('drawing');

    advance(7000 + pacing(7, 5).settleMs);
    expect(useAppStore.getState().stage.phase).toBe('winnerReveal');
  });
});
