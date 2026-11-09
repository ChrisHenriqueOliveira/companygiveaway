import { render, screen } from '@testing-library/react';
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
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  });
});

describe('PrizesTab', () => {
  it('registering "Vale R$200" × 3 creates three separate queue rows badged 1/3, 2/3, 3/3', async () => {
    const user = userEvent.setup();
    render(<PrizesTab />);

    await user.type(screen.getByLabelText(/nome do prêmio/i), 'Vale R$200');
    const more = screen.getByRole('button', { name: /aumentar quantidade/i });
    await user.click(more);
    await user.click(more);
    await user.click(screen.getByRole('button', { name: /cadastrar prêmio/i }));

    expect(useAppStore.getState().queue).toHaveLength(3);
    expect(screen.getAllByText('Vale R$200')).toHaveLength(3);
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('3/3')).toBeInTheDocument();
    // formulário volta ao estado inicial
    expect(screen.getByLabelText(/nome do prêmio/i)).toHaveValue('');
  });

  it('single prize has no group badge and blank name is not registered', async () => {
    const user = userEvent.setup();
    render(<PrizesTab />);

    await user.click(screen.getByRole('button', { name: /cadastrar prêmio/i }));
    expect(useAppStore.getState().queue).toHaveLength(0);

    await user.type(screen.getByLabelText(/nome do prêmio/i), 'Fone');
    await user.click(screen.getByRole('button', { name: /cadastrar prêmio/i }));
    expect(useAppStore.getState().queue).toHaveLength(1);
    expect(screen.queryByText(/\d\/\d/)).not.toBeInTheDocument();
  });

  it('lists confirmed winners in the "Já sorteados" section', async () => {
    const user = userEvent.setup();
    const s = useAppStore.getState();
    s.importParticipants([{ name: 'Ana Souza', email: 'ana@v.com' }], 'replace');
    s.addPrizes({ name: 'Fone', quantity: 1 });
    useAppStore.getState().stageNext();
    useAppStore.getState().stageStartDraw();
    useAppStore.getState().stageFinishDrawing();
    useAppStore.getState().stageConfirm();

    render(<PrizesTab />);
    await user.click(screen.getByRole('button', { name: /já sorteados/i }));
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
  });
});
