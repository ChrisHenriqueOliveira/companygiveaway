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
  setActionsProvider(
    () => Object.fromEntries(ACTION_NAMES.map((n) => [n, (...a: unknown[]) => void calls.push([n, a])])) as never,
  );
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.importParticipants([{ name: 'Ana Souza', email: 'ana@v.com' }, { name: 'Bob Lima', email: 'bob@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 1 });
});
afterEach(() => {
  vi.useRealTimers();
  resetActionsProvider();
});
const settle = () => act(() => void vi.advanceTimersByTime(6000));

function revealWinner() {
  const s = useAppStore.getState();
  s.stageNext();
  s.stageStartDraw();
  s.stageFinishDrawing();
  return useAppStore.getState().draws[0];
}

describe('"Ausente" in the Control window asks first, naming the person', () => {
  it('does not mark anyone absent until the operator confirms', () => {
    const w = revealWinner();
    render(<LivePanel />);
    settle();
    fireEvent.click(screen.getByRole('button', { name: /ausente — ressortear/i }));

    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText(new RegExp(w.name))).toBeInTheDocument();
    expect(within(dlg).getByText(/Fone/)).toBeInTheDocument();
    expect(calls).toEqual([]);

    fireEvent.click(within(dlg).getByRole('button', { name: /cancelar/i }));
    expect(calls).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: /ausente — ressortear/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /sim, ausente/i }));
    expect(calls).toEqual([['stageAbsent', []]]);
  });
});

describe('way back from a prize reveal', () => {
  it('offers to cancel the gift and go back to the start (nothing was drawn yet)', () => {
    useAppStore.getState().stageNext();
    render(<LivePanel />);
    settle();
    fireEvent.click(screen.getByRole('button', { name: /cancelar e voltar ao início/i }));
    expect(calls).toEqual([['stageBackToIdle', []]]);
  });
});

describe('undo dialog says what will be undone', () => {
  it('names the most recent record (person and prize)', () => {
    const s = useAppStore.getState();
    revealWinner();
    s.stageConfirm();
    const rec = useAppStore.getState().draws[0];
    render(<LivePanel />);
    settle();
    fireEvent.click(screen.getByRole('button', { name: /desfazer último/i }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText(new RegExp(`${rec.name} — Fone`))).toBeInTheDocument();
  });
});

describe('Control hint', () => {
  it('tells the operator the clicker keys also work in this window', () => {
    render(<LivePanel />);
    expect(screen.getByText(/passador/i)).toBeInTheDocument();
  });
});
