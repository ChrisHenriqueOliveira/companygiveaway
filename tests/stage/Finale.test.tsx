import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { useAppStore } from '../../src/store/appStore';
import { FinaleScreen } from '../../src/stage/screens/FinaleScreen';

vi.mock('../../src/stage/confetti', () => ({ burst: () => undefined, cannons: () => () => undefined, softRain: () => () => undefined }));

const draw = (id: string, name: string, prizeId: string, prizeName: string, at: number, status = 'confirmed') => ({
  id, prizeId, prizeName, participantId: id, name, email: `${id}@v.com`, status: status as 'confirmed', at,
});

beforeEach(() => {
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
    prizes: {
      z1: { id: 'z1', name: 'Fone bluetooth', imageId: 'i1', createdAt: 1 },
      z2: { id: 'z2', name: 'Vale R$200', createdAt: 2 },
    },
    images: { i1: 'data:image/webp;base64,AAAA' },
    draws: [
      draw('d1', 'Ana Souza', 'z1', 'Fone bluetooth', 1),
      draw('d2', 'Bruno Lima', 'z2', 'Vale R$200', 2),
      draw('d3', 'Carla Dias', 'z2', 'Vale R$200', 3, 'absent'),
    ],
  } as never);
});

describe('FinaleScreen (mural de ganhadores)', () => {
  it('shows each winner together with the prize they won, one card per confirmed draw', () => {
    render(<FinaleScreen />);
    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(2); // a ausente não aparece

    const ana = screen.getByRole('listitem', { name: /ana souza ganhou fone bluetooth/i });
    expect(within(ana).getByText('Ana Souza')).toBeInTheDocument();
    expect(within(ana).getByText('Fone bluetooth')).toBeInTheDocument();

    const bruno = screen.getByRole('listitem', { name: /bruno lima ganhou vale r\$200/i });
    expect(within(bruno).getByText('Vale R$200')).toBeInTheDocument();
  });

  it('shows the prize picture (large) when the prize has one, and a gift placeholder otherwise', () => {
    render(<FinaleScreen />);
    const ana = screen.getByRole('listitem', { name: /ana souza/i });
    expect(ana.querySelector('img')?.getAttribute('src')).toBe('data:image/webp;base64,AAAA');
    const bruno = screen.getByRole('listitem', { name: /bruno lima/i });
    expect(bruno.querySelector('img')).toBeNull();
    expect(bruno.querySelector('svg')).not.toBeNull(); // ícone de presente
  });

  it('lists winners in the order they were drawn', () => {
    render(<FinaleScreen />);
    const names = screen.getAllByRole('listitem').map((li) => li.getAttribute('aria-label'));
    expect(names[0]).toMatch(/ana souza/i);
    expect(names[1]).toMatch(/bruno lima/i);
  });

  it('has a friendly empty state', () => {
    useAppStore.setState({ draws: [] });
    render(<FinaleScreen />);
    expect(screen.getByText(/ainda não há ganhadores/i)).toBeInTheDocument();
  });

  it('shows the test draws (not the real ones) while rehearsing', () => {
    useAppStore.setState({
      rehearsal: { active: true, stage: { phase: 'finale' }, draws: [draw('t1', 'Teste Silva', 'z1', 'Fone bluetooth', 5)] },
    });
    render(<FinaleScreen />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('listitem', { name: /teste silva/i })).toBeInTheDocument();
  });
});
