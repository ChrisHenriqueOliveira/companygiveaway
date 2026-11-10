import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';
import { resetStageLock } from '../../src/stage/lock';
import { pacing } from '../../src/stage/pacing';
import { StageApp } from '../../src/stage/StageApp';

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
});
afterEach(() => vi.useRealTimers());

/** Sorteia até a tela do ganhador e devolve quanto tempo (ms) o "Confirmar" levou para liberar. */
function msUntilConfirmWorks(reelSeconds: number): number {
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.updateSettings({ giftSeconds: 2, suspenseSeconds: reelSeconds });
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 1 });
  resetStageLock();

  const { unmount } = render(<StageApp />);
  fireEvent.keyDown(window, { key: ' ' });
  advance(pacing(2).giftReadyMs + 200);
  fireEvent.keyDown(window, { key: ' ' });
  expect(useAppStore.getState().stage.phase).toBe('drawing');

  // espera o rolo terminar (duração configurada + a pausa fixa)
  while (useAppStore.getState().stage.phase !== 'winnerReveal') advance(50);

  let waited = 0;
  while (useAppStore.getState().stage.phase === 'winnerReveal' && waited < 8000) {
    fireEvent.keyDown(window, { key: ' ' });
    if (useAppStore.getState().stage.phase !== 'winnerReveal') break;
    advance(50);
    waited += 50;
  }
  unmount();
  return waited;
}

describe('the winner reveal does not depend on the reel duration', () => {
  it('"Confirmar" unlocks after the same time with a 3 s reel and a 12 s reel', () => {
    const short = msUntilConfirmWorks(3);
    const long = msUntilConfirmWorks(12);
    expect(Math.abs(short - long)).toBeLessThanOrEqual(150);
    expect(short).toBeGreaterThanOrEqual(pacing(2).winnerLockMs - 200);
  });
});
