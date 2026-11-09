import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { useAppStore } from '../../src/store/appStore';
import { ErrorBoundary } from '../../src/ui/ErrorBoundary';

let boom = true;
function Bomb() {
  if (boom) throw new Error('algo quebrou');
  return <p>tudo certo</p>;
}

beforeEach(() => {
  boom = true;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
});
afterEach(() => vi.restoreAllMocks());

describe('ErrorBoundary', () => {
  it('shows a friendly recovery screen instead of a blank projector', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar de novo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recarregar/i })).toBeInTheDocument();
  });

  it('"Tentar de novo" re-renders the children once the problem is gone', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    boom = false;
    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));
    expect(screen.getByText('tudo certo')).toBeInTheDocument();
  });

  it('"Voltar ao início do sorteio" resets a stuck stage (and drops an unconfirmed draw) before retrying', () => {
    useAppStore.setState({
      stage: { phase: 'winnerReveal', prizeId: 'z', drawId: 'ghost' },
      draws: [{ id: 'p', prizeId: 'z', prizeName: 'x', participantId: 'u', name: 'N', email: 'n@v.com', status: 'pending', at: 1 }],
    });
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    boom = false;
    fireEvent.click(screen.getByRole('button', { name: /voltar ao início do sorteio/i }));
    expect(useAppStore.getState().stage).toEqual({ phase: 'idle' });
    expect(useAppStore.getState().draws).toEqual([]);
    expect(screen.getByText('tudo certo')).toBeInTheDocument();
  });
});
