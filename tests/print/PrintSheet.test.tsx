import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryTab } from '../../src/backstage/HistoryTab';
import { LivePanel } from '../../src/control/LivePanel';
import { createEmptyData } from '../../src/domain/types';
import { WinnersPrintSheet } from '../../src/print/WinnersPrintSheet';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';

const draw = (id: string, name: string, prizeId: string, prizeName: string, at: number, status = 'confirmed') => ({
  id, prizeId, prizeName, participantId: id, name, email: `${id}@viceri.com.br`, status: status as 'confirmed', at,
});

beforeEach(() => {
  localStorage.clear();
  resetActionsProvider();
  window.print = vi.fn();
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
    settings: { eventName: 'Festa Viceri 2026', giftSeconds: 4, suspenseSeconds: 7 },
    prizes: { z1: { id: 'z1', name: 'Fone bluetooth', imageId: 'i1', createdAt: 1 }, z2: { id: 'z2', name: 'Vale R$200', createdAt: 2 } },
    images: { i1: 'data:image/webp;base64,AAAA' },
    draws: [
      draw('d2', 'Bruno Lima', 'z2', 'Vale R$200', 2),
      draw('d1', 'Ana Souza', 'z1', 'Fone bluetooth', 1),
      draw('d3', 'Carla Dias', 'z2', 'Vale R$200', 3, 'absent'),
    ],
  } as never);
});
const sheet = () => document.querySelector('.print-root') as HTMLElement;

describe('WinnersPrintSheet (folha para imprimir / salvar em PDF)', () => {
  it('is a separate sheet outside the app root, with the event name and a title', () => {
    render(<WinnersPrintSheet />);
    expect(sheet()).not.toBeNull();
    expect(sheet().parentElement).toBe(document.body);
    expect(within(sheet()).getByText('Festa Viceri 2026')).toBeInTheDocument();
    expect(within(sheet()).getByRole('heading', { name: /ganhadores/i })).toBeInTheDocument();
  });

  it('lists one row per winner in drawing order: prize, winner, e-mail and a delivery box', () => {
    render(<WinnersPrintSheet />);
    const rows = within(sheet()).getAllByRole('row').slice(1); // sem o cabeçalho
    expect(rows).toHaveLength(2); // ausente e pendente ficam de fora

    expect(within(rows[0]).getByText('Fone bluetooth')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Ana Souza')).toBeInTheDocument();
    expect(within(rows[0]).getByText('d1@viceri.com.br')).toBeInTheDocument();
    expect(within(rows[0]).getByText('☐')).toBeInTheDocument();
    expect(rows[0].querySelector('img')?.getAttribute('src')).toBe('data:image/webp;base64,AAAA');

    expect(within(rows[1]).getByText('Bruno Lima')).toBeInTheDocument();
    expect(rows[1].querySelector('img')).toBeNull();
  });

  it('says so when nobody won yet', () => {
    useAppStore.setState({ draws: [] });
    render(<WinnersPrintSheet />);
    expect(within(sheet()).getByText(/nenhum ganhador/i)).toBeInTheDocument();
  });

  it('marks a rehearsal printout so it is never mistaken for the official result', () => {
    useAppStore.setState({
      rehearsal: { active: true, stage: { phase: 'finale' }, draws: [draw('t1', 'Teste Silva', 'z1', 'Fone bluetooth', 9)] },
    });
    render(<WinnersPrintSheet />);
    expect(within(sheet()).getByText(/ensaio/i)).toBeInTheDocument();
    expect(within(sheet()).getByText('Teste Silva')).toBeInTheDocument();
    expect(within(sheet()).queryByText('Ana Souza')).not.toBeInTheDocument();
  });
});

describe('print buttons', () => {
  it('History tab: "Imprimir" prints and is disabled without winners', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<HistoryTab />);
    await user.click(screen.getByRole('button', { name: /imprimir ganhadores/i }));
    expect(window.print).toHaveBeenCalledTimes(1);
    unmount();

    useAppStore.setState({ draws: [] });
    render(<HistoryTab />);
    expect(screen.getByRole('button', { name: /imprimir ganhadores/i })).toBeDisabled();
  });

  it('Control live panel: offers printing once there are winners', async () => {
    const user = userEvent.setup();
    render(<LivePanel />);
    await user.click(screen.getByRole('button', { name: /imprimir ganhadores/i }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
