import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';
import { STORAGE_ERROR_MESSAGE } from '../../src/store/persistence';
import { resetStageLock } from '../../src/stage/lock';
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
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.updateSettings({ giftSeconds: 2, suspenseSeconds: 3 });
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 1 });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('when saving fails', () => {
  it('the projector shows only a discreet marker, never the red error text in front of the audience', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    useAppStore.setState({ storageError: STORAGE_ERROR_MESSAGE });
    render(<StageApp />);
    expect(screen.queryByText(STORAGE_ERROR_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/não foi possível salvar/i)).toBeInTheDocument();
  });

  it('the draw does not start: the stage warns the operator instead', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    render(<StageApp />);
    fireEvent.keyDown(window, { key: ' ' });
    advance(3500);
    expect(useAppStore.getState().stage.phase).toBe('prizeReveal');

    useAppStore.setState({ storageError: STORAGE_ERROR_MESSAGE });
    fireEvent.keyDown(window, { key: ' ' });
    expect(useAppStore.getState().stage.phase).toBe('prizeReveal');
    expect(useAppStore.getState().draws).toEqual([]);
    expect(screen.getByText(/sorteio bloqueado/i)).toBeInTheDocument();
  });
});
