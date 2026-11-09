import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { PrizesTab } from '../../src/backstage/PrizesTab';
import { createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';

beforeEach(() => {
  localStorage.clear();
  resetActionsProvider();
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const a = () => useAppStore.getState();
  a().importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  a().addPrizes({ name: 'Fone', quantity: 1 });
  a().addPrizes({ name: 'Vale', quantity: 1 });
});

describe('PrizesTab "mandar para o palco"', () => {
  it('sends the chosen prize straight to the stage when nothing is being drawn', async () => {
    const user = userEvent.setup();
    render(<PrizesTab />);
    await user.click(screen.getByRole('button', { name: /mandar vale para o palco/i }));
    const second = useAppStore.getState().queue[1];
    expect(useAppStore.getState().stage).toEqual({ phase: 'prizeReveal', prizeId: second });
  });

  it('asks first when a winner is already on screen, and cancelling changes nothing', async () => {
    const user = userEvent.setup();
    const a = () => useAppStore.getState();
    a().stageNext();
    a().stageStartDraw();
    a().stageFinishDrawing();
    render(<PrizesTab />);

    await user.click(screen.getByRole('button', { name: /mandar vale para o palco/i }));
    expect(screen.getByText(/será descartado/i)).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancelar/i }));
    expect(a().stage.phase).toBe('winnerReveal');
    expect(a().draws).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /mandar vale para o palco/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^mandar para o palco$/i }));
    expect(a().stage).toEqual({ phase: 'prizeReveal', prizeId: a().queue[1] });
    expect(a().draws).toEqual([]);
  });
});
