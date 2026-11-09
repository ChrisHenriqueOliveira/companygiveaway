import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportDialog } from '../../src/backstage/ImportDialog';
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

const CSV = 'Nome;E-mail\nAna;ana@v.com\nBob;bob@v.com\nCaio;caio@v.com\nAna Repetida;ANA@v.com\n';

describe('ImportDialog', () => {
  it('shows a preview with valid and duplicate counts, then imports in append mode', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    useAppStore.getState().addParticipant({ name: 'Zeca', email: 'zeca@v.com' });
    render(<ImportDialog open onClose={onClose} />);

    await user.upload(
      screen.getByLabelText(/arquivo da planilha/i),
      new File([CSV], 'colaboradores.csv', { type: 'text/csv' }),
    );

    expect(await screen.findByText('3 válidos')).toBeInTheDocument();
    expect(screen.getByText('1 duplicado')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /adicionar à lista/i }));
    await user.click(screen.getByRole('button', { name: /importar 3 pessoas/i }));

    const emails = useAppStore.getState().participants.map((p) => p.email);
    expect(emails).toEqual(['zeca@v.com', 'ana@v.com', 'bob@v.com', 'caio@v.com']);
    expect(onClose).toHaveBeenCalled();
  });

  it('replace mode swaps the list', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addParticipant({ name: 'Zeca', email: 'zeca@v.com' });
    render(<ImportDialog open onClose={() => undefined} />);

    await user.upload(
      screen.getByLabelText(/arquivo da planilha/i),
      new File([CSV], 'colaboradores.csv', { type: 'text/csv' }),
    );
    await screen.findByText('3 válidos');
    await user.click(screen.getByRole('radio', { name: /substituir lista/i }));
    await user.click(screen.getByRole('button', { name: /importar 3 pessoas/i }));

    expect(useAppStore.getState().participants.map((p) => p.email)).toEqual([
      'ana@v.com',
      'bob@v.com',
      'caio@v.com',
    ]);
  });

  it('lets the user pick columns when they cannot be detected', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onClose={() => undefined} />);
    await user.upload(
      screen.getByLabelText(/arquivo da planilha/i),
      new File(['X,Y\n1,2\n'], 'estranho.csv', { type: 'text/csv' }),
    );
    expect(await screen.findByLabelText(/coluna do e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /importar 0 pessoas/i })).toBeDisabled();
  });
});
