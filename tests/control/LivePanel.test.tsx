import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LivePanel } from '../../src/control/LivePanel';
import { createEmptyData } from '../../src/domain/types';
import { ACTION_NAMES, resetActionsProvider, setActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';

let calls: Array<[string, unknown[]]> = [];

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  calls = [];
  // Provider igual ao do Controle: registra o que seria enviado ao palco via postMessage.
  setActionsProvider(
    () =>
      Object.fromEntries(
        ACTION_NAMES.map((n) => [n, (...args: unknown[]) => void calls.push([n, args])]),
      ) as never,
  );
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 1 });
});

afterEach(() => {
  vi.useRealTimers();
  resetActionsProvider();
});

const settle = () => act(() => void vi.advanceTimersByTime(6000));

describe('LivePanel buttons send plain commands to the stage', () => {
  it('"Próximo prêmio" sends stageNext with NO arguments (a click event cannot be postMessage-d)', () => {
    render(<LivePanel />);
    settle();
    fireEvent.click(screen.getByRole('button', { name: /próximo prêmio/i }));
    expect(calls).toEqual([['stageNext', []]]);
  });

  it('Sortear / Confirmar / Ausente send no arguments and everything is structured-cloneable', () => {
    const s = useAppStore.getState();
    s.stageNext();
    render(<LivePanel />);
    settle();
    fireEvent.click(screen.getByRole('button', { name: /sortear!/i }));

    act(() => {
      useAppStore.getState().stageStartDraw();
      useAppStore.getState().stageFinishDrawing();
    });
    settle();
    fireEvent.click(screen.getByRole('button', { name: /^confirmar$/i }));
    fireEvent.click(screen.getByRole('button', { name: /ausente/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /sim, ausente/i }));

    expect(calls).toEqual([
      ['stageStartDraw', []],
      ['stageConfirm', []],
      ['stageAbsent', []],
    ]);
    expect(() => structuredClone(calls)).not.toThrow();
  });
});

describe('LivePanel way back from the final wall / empty pool', () => {
  it('finale offers "Voltar ao início", which sends stageBackToIdle', () => {
    useAppStore.setState({ stage: { phase: 'finale' } });
    render(<LivePanel />);
    settle();
    fireEvent.click(screen.getByRole('button', { name: /voltar ao início/i }));
    expect(calls).toEqual([['stageBackToIdle', []]]);
  });

  it('noEligible offers it too', () => {
    useAppStore.setState({ stage: { phase: 'noEligible', prizeId: Object.keys(useAppStore.getState().prizes)[0] } });
    render(<LivePanel />);
    settle();
    fireEvent.click(screen.getByRole('button', { name: /voltar ao início/i }));
    expect(calls).toEqual([['stageBackToIdle', []]]);
  });
});

describe('LivePanel holds its buttons again when another prize is forced onto the stage', () => {
  it('the new gift sequence restarts, so "Sortear!" is locked until it is ready', () => {
    useAppStore.getState().addPrizes({ name: 'Vale', quantity: 1 });
    useAppStore.getState().stageNext();
    render(<LivePanel />);
    settle();
    expect(screen.getByRole('button', { name: /sortear!/i })).toBeEnabled();

    const second = useAppStore.getState().queue[1];
    act(() => useAppStore.getState().stageForcePrize(second));
    expect(screen.getByRole('button', { name: /sortear!/i })).toBeDisabled();

    settle();
    expect(screen.getByRole('button', { name: /sortear!/i })).toBeEnabled();
  });
});
