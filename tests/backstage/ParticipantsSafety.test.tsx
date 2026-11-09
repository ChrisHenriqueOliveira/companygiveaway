import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { HistoryTab } from '../../src/backstage/HistoryTab';
import { ParticipantsTab } from '../../src/backstage/ParticipantsTab';
import { createEmptyData } from '../../src/domain/types';
import { foldText } from '../../src/domain/text';
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
  useAppStore.getState().importParticipants([{ name: 'João Antônio', email: 'joao@v.com' }, { name: 'Maria Souza', email: 'maria@v.com' }], 'replace');
});

describe('foldText', () => {
  it('ignores accents and case', () => {
    expect(foldText('João')).toBe('joao');
    expect(foldText('AÇÃO Ênfase')).toBe('acao enfase');
  });
});

describe('ParticipantsTab', () => {
  it('search ignores accents ("joao" finds "João")', async () => {
    const user = userEvent.setup();
    render(<ParticipantsTab />);
    await user.type(screen.getByLabelText(/buscar participante/i), 'joao');
    expect(screen.getByText('João Antônio')).toBeInTheDocument();
    expect(screen.queryByText('Maria Souza')).not.toBeInTheDocument();
  });

  it('removing a participant asks first', async () => {
    const user = userEvent.setup();
    render(<ParticipantsTab />);
    await user.click(screen.getByRole('button', { name: /^remover maria souza$/i }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText(/maria@v.com/)).toBeInTheDocument();
    expect(useAppStore.getState().participants).toHaveLength(2);

    await user.click(within(dlg).getByRole('button', { name: /cancelar/i }));
    expect(useAppStore.getState().participants).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /^remover maria souza$/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^remover$/i }));
    expect(useAppStore.getState().participants.map((p) => p.name)).toEqual(['João Antônio']);
  });

  it('shows an "Ausente" badge and lets the person come back with one click', async () => {
    const user = userEvent.setup();
    const ana = useAppStore.getState().participants[0];
    useAppStore.setState({
      draws: [{ id: 'd1', prizeId: 'z', prizeName: 'Fone', participantId: ana.id, name: ana.name, email: ana.email, status: 'absent', at: 1 }],
    });
    render(<ParticipantsTab />);
    expect(screen.getByText('Ausente')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /voltar joão antônio a concorrer/i }));
    expect(useAppStore.getState().draws).toEqual([]);
    expect(screen.queryByText('Ausente')).not.toBeInTheDocument();
  });
});

describe('HistoryTab undo dialog', () => {
  it('names the record that will be undone', async () => {
    const user = userEvent.setup();
    const s = useAppStore.getState();
    s.addPrizes({ name: 'Fone', quantity: 1 });
    s.stageNext();
    s.stageStartDraw();
    s.stageFinishDrawing();
    s.stageConfirm();
    const rec = useAppStore.getState().draws[0];
    render(<HistoryTab />);
    await user.click(screen.getByRole('button', { name: /desfazer último/i }));
    expect(within(screen.getByRole('dialog')).getByText(new RegExp(`${rec.name} — Fone`))).toBeInTheDocument();
  });
});
