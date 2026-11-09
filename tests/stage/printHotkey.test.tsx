import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';
import { resetStageLock } from '../../src/stage/lock';
import { stageKeyAction } from '../../src/stage/hotkeys';
import { StageApp } from '../../src/stage/StageApp';

vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../src/stage/confetti', () => ({ burst: () => undefined, cannons: () => () => undefined, softRain: () => () => undefined }));

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  resetActionsProvider();
  resetStageLock();
  window.print = vi.fn();
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 1 });
});
afterEach(() => vi.useRealTimers());

describe('P prints the winners sheet', () => {
  it('stageKeyAction maps P (but not Ctrl+P, which the browser handles itself)', () => {
    const free = { typing: false, modalOpen: false };
    expect(stageKeyAction({ key: 'p', ctrlKey: false, metaKey: false }, free)).toBe('print');
    expect(stageKeyAction({ key: 'P', ctrlKey: false, metaKey: false }, free)).toBe('print');
    expect(stageKeyAction({ key: 'p', ctrlKey: true, metaKey: false }, free)).toBeNull();
    expect(stageKeyAction({ key: 'p', ctrlKey: false, metaKey: false }, { typing: true, modalOpen: false })).toBeNull();
  });

  it('only on the final wall: pressing P during the draw does nothing', () => {
    render(<StageApp />);
    fireEvent.keyDown(window, { key: 'p' });
    expect(window.print).not.toHaveBeenCalled();
  });

  it('on the final wall: P and the corner button both print', () => {
    useAppStore.setState({ stage: { phase: 'finale' } });
    render(<StageApp />);
    act(() => void vi.advanceTimersByTime(300));
    fireEvent.keyDown(window, { key: 'p' });
    expect(window.print).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /imprimir ganhadores/i }));
    expect(window.print).toHaveBeenCalledTimes(2);
  });
});
