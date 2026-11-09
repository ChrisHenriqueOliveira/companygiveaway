import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore, type AppState } from '../../src/store/appStore';
import { resetStageLock } from '../../src/stage/lock';
import { deriveScreen } from '../../src/stage/deriveScreen';
import { StageApp } from '../../src/stage/StageApp';
import { isControlWindowOpen, openControlWindow } from '../../src/sync/openControl';

// Animações de saída não terminam no jsdom com relógio falso: sem isso a próxima tela nunca monta.
// O resto do motion continua real; só o AnimatePresence vira passthrough.
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../src/sync/openControl', () => ({ openControlWindow: vi.fn(() => ({})), isControlWindowOpen: vi.fn(() => false) }));

vi.mock('../../src/stage/confetti', () => ({
  burst: () => undefined,
  cannons: () => () => undefined,
  softRain: () => () => undefined,
}));

const blank = (): AppState & ReturnType<typeof useAppStore.getState> =>
  ({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  }) as never;

function seed(opts: { participants?: number; prizes?: number } = {}) {
  const { participants = 5, prizes = 2 } = opts;
  useAppStore.setState(blank());
  const s = () => useAppStore.getState();
  s().updateSettings({ suspenseSeconds: 3, giftSeconds: 2 });
  s().importParticipants(
    Array.from({ length: participants }, (_, i) => ({ name: `Pessoa ${i + 1}`, email: `p${i + 1}@v.com` })),
    'replace',
  );
  for (let i = 0; i < prizes; i++) s().addPrizes({ name: `Prêmio ${i + 1}`, quantity: 1 });
}

const key = (k: string) => fireEvent.keyDown(window, { key: k });
/** Avança em passos curtos, cada um num act próprio: o React precisa montar as telas no meio do caminho. */
const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 50) act(() => void vi.advanceTimersByTime(50));
};
const screenOf = () => document.querySelector('main')?.getAttribute('data-screen');
const phase = () => useAppStore.getState().stage.phase;

beforeEach(() => {
  vi.mocked(openControlWindow).mockClear();
  vi.mocked(isControlWindowOpen).mockReturnValue(false);
  vi.useFakeTimers();
  localStorage.clear();
  resetActionsProvider();
  resetStageLock();
});
afterEach(() => vi.useRealTimers());

describe('deriveScreen', () => {
  it('is "setup" without participants or without any prize', () => {
    useAppStore.setState(blank());
    expect(deriveScreen(useAppStore.getState())).toBe('setup');
    seed({ participants: 0, prizes: 2 });
    expect(deriveScreen(useAppStore.getState())).toBe('setup');
    seed({ participants: 3, prizes: 0 });
    expect(deriveScreen(useAppStore.getState())).toBe('setup');
  });

  it('follows the stage phase once set up', () => {
    seed();
    expect(deriveScreen(useAppStore.getState())).toBe('idle');
  });
});

describe('StageApp', () => {
  it('plays a full draw with the keyboard and never reveals how many prizes are left', () => {
    seed();
    render(<StageApp />);
    const seen: string[] = [];
    // A folha de impressão fica escondida na tela (display:none): só conta o que o público realmente vê.
    const snap = () =>
      seen.push(
        [...document.body.children]
          .filter((el) => !el.classList.contains('print-root'))
          .map((el) => el.textContent)
          .join(' '),
      );

    expect(screenOf()).toBe('idle');
    expect(screen.getByRole('button', { name: /próximo prêmio/i })).toBeInTheDocument();
    snap();

    key(' ');
    expect(phase()).toBe('prizeReveal');
    advance(3500);
    snap();

    key(' ');
    expect(phase()).toBe('drawing');
    advance(5200);
    expect(phase()).toBe('winnerReveal');
    expect(useAppStore.getState().draws).toHaveLength(1);
    advance(3000);
    snap();

    key(' ');
    expect(phase()).toBe('idle');
    expect(useAppStore.getState().draws[0].status).toBe('confirmed');
    advance(800);

    // O botão e o texto do idle são idênticos depois do primeiro prêmio (sem pistas de "último")
    expect(screen.getByRole('button', { name: /próximo prêmio/i })).toBeInTheDocument();
    snap();

    seen.forEach((t) => expect(t).not.toMatch(/restam|restante|último|ultimo|\d+\s*(de|\/)\s*\d+|fila/i));
  });

  it('Next prize stays enabled and identical when it is the last prize, then shows the finale', () => {
    seed({ prizes: 1 });
    render(<StageApp />);
    const before = screen.getByRole('button', { name: /próximo prêmio/i }).outerHTML;

    key(' ');
    advance(3500);
    key(' ');
    advance(5200);
    advance(3000);
    key(' '); // confirma o único prêmio
    advance(800);
    expect(phase()).toBe('idle');

    const after = screen.getByRole('button', { name: /próximo prêmio/i });
    expect(after).toBeEnabled();
    expect(after.outerHTML).toBe(before);

    key(' ');
    expect(phase()).toBe('finale');
    advance(800);
    expect(screenOf()).toBe('finale');
  });

  it('"R" shows the redraw message, then draws a different person for the same prize', () => {
    seed();
    render(<StageApp />);
    key(' ');
    advance(3500);
    key(' ');
    advance(5200);
    advance(3000);
    const first = useAppStore.getState().draws[0];

    key('r');
    expect(screen.getByText(/ixi, não veio/i)).toBeInTheDocument();
    advance(1300);

    const { draws } = useAppStore.getState();
    expect(draws).toHaveLength(2);
    expect(draws[0].status).toBe('absent');
    expect(draws[1].prizeId).toBe(first.prizeId);
    expect(draws[1].participantId).not.toBe(first.participantId);
    expect(phase()).toBe('drawing');
  });

  it('ignores a double press of the primary key within the guard window', () => {
    seed();
    render(<StageApp />);
    key(' ');
    key(' ');
    expect(phase()).toBe('prizeReveal');
  });

  it('ignores the clicker "black screen" keys and Esc/typing do not advance', () => {
    seed();
    render(<StageApp />);
    for (const k of ['b', '.', 'w', 'PageUp']) key(k);
    expect(phase()).toBe('idle');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('asks "are you sure?" before opening the Controle window (a stray click could expose the queue on the projector)', () => {
    seed();
    render(<StageApp />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByText(/certeza que quer abrir/i)).toBeInTheDocument();
    expect(openControlWindow).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByText(/certeza que quer abrir/i)).not.toBeInTheDocument();
    expect(openControlWindow).not.toHaveBeenCalled();

    // o ícone do canto passa pelo mesmo aviso
    fireEvent.click(screen.getByRole('button', { name: /abrir bastidores/i }));
    expect(openControlWindow).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /sim, abrir o controle/i }));
    expect(openControlWindow).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/certeza que quer abrir/i)).not.toBeInTheDocument();
  });

  it('does not ask again when the Controle window is already open: it just brings it to the front', () => {
    vi.mocked(isControlWindowOpen).mockReturnValue(true);
    seed();
    render(<StageApp />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.queryByText(/certeza que quer abrir/i)).not.toBeInTheDocument();
    expect(openControlWindow).toHaveBeenCalledTimes(1);
  });

  it('shows the setup screen when there is nothing to draw yet', () => {
    useAppStore.setState(blank());
    render(<StageApp />);
    expect(screenOf()).toBe('setup');
  });
});
