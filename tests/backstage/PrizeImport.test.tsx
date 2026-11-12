import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportDialog } from '../../src/backstage/ImportDialog';
import { PrizeImportDialog } from '../../src/backstage/PrizeImportDialog';
import { PrizesTab } from '../../src/backstage/PrizesTab';
import { createEmptyData } from '../../src/domain/types';
import { buildPrizePreview, detectPrizeColumns } from '../../src/io/sheetImport';
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

const CSV = 'Prêmio;Quantidade\nPolo Viceri;3\nFone Bluetooth;1\nVale-presente;50\nSem quantidade;\n;5\n';

describe('prize sheet parsing', () => {
  it('detects the prize and quantity columns by header', () => {
    expect(detectPrizeColumns(['Prêmio', 'Qtd'], [])).toEqual({ name: 'Prêmio', quantity: 'Qtd' });
    expect(detectPrizeColumns(['Item', 'Quantidade'], [])).toEqual({ name: 'Item', quantity: 'Quantidade' });
  });

  it('falls back to the first text column when there is no recognizable header', () => {
    const rows = [{ A: 'Polo', B: 2 }];
    expect(detectPrizeColumns(['A', 'B'], rows).name).toBe('A');
  });

  it('builds items: empty/invalid quantity = 1, capped at 20, rows without a name are skipped', () => {
    const rows = [
      { P: 'Polo', Q: '3' },
      { P: 'Fone', Q: '' },
      { P: 'Vale', Q: '50' },
      { P: '', Q: '5' },
      { P: 'Caneca', Q: 'abc' },
    ];
    const p = buildPrizePreview(rows, { name: 'P', quantity: 'Q' });
    expect(p.items).toEqual([
      { name: 'Polo', quantity: 3 },
      { name: 'Fone', quantity: 1 },
      { name: 'Vale', quantity: 20 },
      { name: 'Caneca', quantity: 1 },
    ]);
    expect(p.units).toBe(25);
    expect(p.skipped).toBe(1);
    expect(p.capped).toBe(1);
  });
});

describe('PrizeImportDialog', () => {
  it('imports a spreadsheet of prizes into the queue (quantity becomes separate units)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PrizeImportDialog open onClose={onClose} />);
    await user.upload(screen.getByLabelText(/arquivo da planilha de prêmios/i), new File([CSV], 'premios.csv', { type: 'text/csv' }));

    expect(await screen.findByText('4 prêmios')).toBeInTheDocument();
    expect(screen.getByText('25 unidades na fila')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /importar 4 prêmios/i }));

    const { queue, prizes } = useAppStore.getState();
    expect(queue).toHaveLength(25);
    expect(queue.map((id) => prizes[id].name).slice(0, 4)).toEqual(['Polo Viceri', 'Polo Viceri', 'Polo Viceri', 'Fone Bluetooth']);
    expect(onClose).toHaveBeenCalled();
  });

  it('accepts the spreadsheet dropped on the file area', async () => {
    render(<PrizeImportDialog open onClose={() => undefined} />);
    const zone = screen.getByLabelText(/arquivo da planilha de prêmios/i).closest('label')!;
    fireEvent.drop(zone, { dataTransfer: { types: ['Files'], files: [new File([CSV], 'premios.csv', { type: 'text/csv' })] } });
    expect(await screen.findByText('4 prêmios')).toBeInTheDocument();
  });

  it('loads a file that was dropped on the tab itself (initialFile)', async () => {
    render(<PrizeImportDialog open initialFile={new File([CSV], 'premios.csv', { type: 'text/csv' })} onClose={() => undefined} />);
    expect(await screen.findByText('4 prêmios')).toBeInTheDocument();
  });
});

describe('collaborators sheet can be dragged in too', () => {
  it('accepts a dropped file on the import area', async () => {
    render(<ImportDialog open onClose={() => undefined} />);
    const zone = screen.getByLabelText(/arquivo da planilha/i).closest('label')!;
    const csv = 'Nome;E-mail\nAna;ana@v.com\nBob;bob@v.com\n';
    fireEvent.drop(zone, { dataTransfer: { types: ['Files'], files: [new File([csv], 'c.csv', { type: 'text/csv' })] } });
    expect(await screen.findByText('2 válidos')).toBeInTheDocument();
  });
});

describe('PrizesTab: dropping a sheet and the X/Y tag', () => {
  it('opens the import dialog when a spreadsheet is dropped on the tab', async () => {
    const { container } = render(<PrizesTab />);
    fireEvent.drop(container.firstElementChild!, { dataTransfer: { types: ['Files'], files: [new File([CSV], 'premios.csv', { type: 'text/csv' })] } });
    expect(await screen.findByText('4 prêmios')).toBeInTheDocument();
  });

  it('after deleting units of a group the tags are recounted (20 → delete 5 → 1/15…15/15)', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addPrizes({ name: 'Polo Viceri', quantity: 20 });
    render(<PrizesTab />);
    expect(screen.getByText('20/20')).toBeInTheDocument();

    for (let i = 0; i < 5; i++) {
      await user.click(screen.getAllByRole('button', { name: /excluir polo viceri/i })[0]);
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^excluir$/i }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    }

    expect(useAppStore.getState().queue).toHaveLength(15);
    expect(screen.getByText('1/15')).toBeInTheDocument();
    expect(screen.getByText('15/15')).toBeInTheDocument();
    expect(screen.queryByText(/\/20$/)).not.toBeInTheDocument();
  }, 30000);
});
