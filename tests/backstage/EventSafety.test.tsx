import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventTab } from '../../src/backstage/EventTab';
import { createEmptyData } from '../../src/domain/types';
import { downloadText } from '../../src/io/download';
import { serializeBackup } from '../../src/io/backup';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';

vi.mock('../../src/io/download', () => ({
  downloadText: vi.fn(),
  todayStamp: () => '2026-12-18',
  timeStamp: () => '2026-12-18_2130',
}));

beforeEach(() => {
  vi.mocked(downloadText).mockClear();
  localStorage.clear();
  resetActionsProvider();
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 2 });
});

describe('EventTab safety net', () => {
  it('downloads an automatic snapshot of tonight\'s data right before zeroing the event', async () => {
    const user = userEvent.setup();
    render(<EventTab />);
    await user.click(screen.getByRole('button', { name: /^zerar evento$/i }));
    const dlg = screen.getByRole('dialog');
    await user.type(within(dlg).getByRole('textbox'), 'ZERAR');
    await user.click(within(dlg).getByRole('button', { name: /zerar tudo/i }));

    expect(downloadText).toHaveBeenCalledTimes(1);
    const [name, body] = vi.mocked(downloadText).mock.calls[0];
    expect(name).toBe('backup-antes-de-zerar-2026-12-18_2130.json');
    expect(JSON.parse(body).participants).toHaveLength(1); // o snapshot tem os dados de ANTES
    expect(useAppStore.getState().participants).toEqual([]);
  });

  it('restore shows what is inside the file and snapshots the current state first', async () => {
    const other = { ...createEmptyData(), participants: [{ id: 'x', name: 'Zé', email: 'ze@v.com' }, { id: 'y', name: 'Yan', email: 'yan@v.com' }] };
    const file = new File([serializeBackup(other)], 'meu.json', { type: 'application/json' });
    render(<EventTab />);
    fireEvent.change(screen.getByLabelText(/arquivo de backup/i), { target: { files: [file] } });

    const dlg = await screen.findByRole('dialog');
    expect(within(dlg).getByText(/2 participantes/i)).toBeInTheDocument();
    expect(within(dlg).getByText(/0 prêmios/i)).toBeInTheDocument();
    expect(downloadText).not.toHaveBeenCalled();

    fireEvent.click(within(dlg).getByRole('button', { name: /^restaurar$/i }));
    await waitFor(() => expect(useAppStore.getState().participants).toHaveLength(2));
    const [name, body] = vi.mocked(downloadText).mock.calls[0];
    expect(name).toBe('backup-antes-de-restaurar-2026-12-18_2130.json');
    expect(JSON.parse(body).participants[0].email).toBe('ana@v.com');
  });

  it('refuses a malformed backup instead of crashing the app later', async () => {
    const broken = { ...createEmptyData(), participants: [{ id: 'x', email: 'ze@v.com' }] }; // sem nome
    const file = new File([JSON.stringify(broken)], 'ruim.json', { type: 'application/json' });
    render(<EventTab />);
    fireEvent.change(screen.getByLabelText(/arquivo de backup/i), { target: { files: [file] } });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(useAppStore.getState().participants).toHaveLength(1); // nada foi trocado
  });
});
