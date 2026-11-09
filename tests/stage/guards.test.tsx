import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';
import { STORAGE_KEY } from '../../src/store/persistence';
import { resetStageLock } from '../../src/stage/lock';
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

describe('clicker keys that would reload or leave the stage', () => {
  it('F5 and Ctrl+R are swallowed on the stage (no reload, no state change)', () => {
    render(<StageApp />);
    expect(fireEvent.keyDown(window, { key: 'F5' })).toBe(false); // false = preventDefault foi chamado
    expect(fireEvent.keyDown(window, { key: 'r', ctrlKey: true })).toBe(false);
    expect(useAppStore.getState().stage.phase).toBe('idle');
  });

  it('F5 inside a text field still works (operator typing in the backstage)', () => {
    render(<StageApp />);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(fireEvent.keyDown(input, { key: 'F5' })).toBe(true);
  });
});

describe('second stage window overwriting the data', () => {
  it('a storage event from another tab blocks the stage with a clear warning', () => {
    render(<StageApp />);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: '{}' }));
    });
    expect(screen.getByText(/já está aberto em outra janela/i)).toBeInTheDocument();

    // enquanto bloqueado, o teclado não avança o sorteio
    fireEvent.keyDown(window, { key: ' ' });
    expect(useAppStore.getState().stage.phase).toBe('idle');
  });

  it('unrelated storage keys do not trigger the warning', () => {
    render(<StageApp />);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'outra-coisa', newValue: 'x' }));
    });
    expect(screen.queryByText(/já está aberto em outra janela/i)).not.toBeInTheDocument();
  });
});
