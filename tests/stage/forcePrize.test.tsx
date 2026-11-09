import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';
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
  s.updateSettings({ suspenseSeconds: 3, giftSeconds: 2 });
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 1 });
  s.addPrizes({ name: 'Vale', quantity: 1 });
});
afterEach(() => vi.useRealTimers());

describe('forcing another prize onto the stage', () => {
  it('restarts the gift reveal for the new prize (the stage does not stay on the old animation)', () => {
    render(<StageApp />);
    fireEvent.keyDown(window, { key: ' ' });
    advance(3500);
    expect(screen.getByRole('button', { name: /sortear!/i })).toBeInTheDocument(); // presente do 1º já aberto

    const second = useAppStore.getState().queue[1];
    act(() => useAppStore.getState().stageForcePrize(second));
    expect(screen.queryByRole('button', { name: /sortear!/i })).not.toBeInTheDocument(); // recomeçou o presente

    advance(3500);
    expect(screen.getByText('Vale')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sortear!/i })).toBeInTheDocument();
  });
});
