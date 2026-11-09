import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { HistoryTab } from '../../src/backstage/HistoryTab';
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
  a().stageNext();
  a().stageStartDraw();
  a().stageFinishDrawing();
  a().stageAbsent(); // primeiro sorteado vira ausente
  a().stageFinishDrawing();
  a().stageConfirm(); // o segundo confirma
});

describe('HistoryTab remove', () => {
  it('removing a confirmed record asks first, then returns the prize to the queue', async () => {
    const user = userEvent.setup();
    render(<HistoryTab />);
    const confirmed = useAppStore.getState().draws.find((d) => d.status === 'confirmed')!;

    await user.click(screen.getByRole('button', { name: new RegExp(`remover.*${confirmed.name}`, 'i') }));
    expect(screen.getByText(/volta para a lista de prêmios/i)).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^remover$/i }));

    expect(useAppStore.getState().draws.some((d) => d.id === confirmed.id)).toBe(false);
    expect(useAppStore.getState().queue).toHaveLength(1);
  });

  it('removing an absent record explains the prize is NOT returned and keeps the queue', async () => {
    const user = userEvent.setup();
    render(<HistoryTab />);
    const absent = useAppStore.getState().draws.find((d) => d.status === 'absent')!;

    await user.click(screen.getByRole('button', { name: new RegExp(`remover.*${absent.name}`, 'i') }));
    expect(screen.getByText(/o prêmio não volta/i)).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^remover$/i }));

    expect(useAppStore.getState().draws.some((d) => d.id === absent.id)).toBe(false);
    expect(useAppStore.getState().queue).toHaveLength(0);
  });
});
