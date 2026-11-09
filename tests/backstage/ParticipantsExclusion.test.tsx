import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ParticipantsTab } from '../../src/backstage/ParticipantsTab';
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
  useAppStore.getState().importParticipants([{ name: 'Ana Souza', email: 'ana@v.com' }], 'replace');
});

describe('ParticipantsTab exclusion toggle', () => {
  it('the same button excludes and then brings the person back to the draw', async () => {
    const user = userEvent.setup();
    render(<ParticipantsTab />);

    await user.click(screen.getByRole('button', { name: /excluir ana souza do sorteio/i }));
    expect(useAppStore.getState().excluded.map((e) => e.email)).toEqual(['ana@v.com']);

    await user.click(screen.getByRole('button', { name: /voltar ana souza ao sorteio/i }));
    expect(useAppStore.getState().excluded).toEqual([]);
    expect(screen.getByRole('button', { name: /excluir ana souza do sorteio/i })).toBeEnabled();
  });

  it('matches by normalized e-mail even when the exclusion was typed in another case', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addExcluded({ name: 'Ana', email: 'ANA@V.COM' });
    render(<ParticipantsTab />);
    await user.click(screen.getByRole('button', { name: /voltar ana souza ao sorteio/i }));
    expect(useAppStore.getState().excluded).toEqual([]);
  });
});
