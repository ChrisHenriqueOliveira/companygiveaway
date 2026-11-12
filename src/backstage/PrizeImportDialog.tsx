import { FileSpreadsheet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { buildPrizePreview, detectPrizeColumns, MAX_PRIZE_QTY, readSheetFile, type Row } from '../io/sheetImport';
import { useActions } from '../store/actions';
import { Badge, Button, Field, Modal, toast } from '../ui';
import { DropZone } from '../ui/DropZone';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const SELECT = 'w-full rounded-2xl border-2 border-swan bg-polar px-4 py-3 font-bold text-eel outline-none focus:border-feather';

export function PrizeImportDialog({ open, onClose, initialFile }: { open: boolean; onClose: () => void; initialFile?: File }) {
  const actions = useActions();
  const [sheet, setSheet] = useState<{ fileName: string; headers: string[]; rows: Row[] } | null>(null);
  const [cols, setCols] = useState({ name: '', quantity: '' });

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const { headers, rows } = await readSheetFile(file);
      if (rows.length === 0) {
        toast('A planilha está vazia.', 'error');
        return;
      }
      const d = detectPrizeColumns(headers, rows);
      setSheet({ fileName: file.name, headers, rows });
      setCols({ name: d.name ?? '', quantity: d.quantity ?? '' });
    } catch {
      toast('Não consegui ler essa planilha.', 'error');
    }
  };

  useEffect(() => {
    if (open) {
      setSheet(null);
      setCols({ name: '', quantity: '' });
      if (initialFile) void onFile(initialFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const preview = useMemo(() => (sheet && cols.name ? buildPrizePreview(sheet.rows, cols) : null), [sheet, cols]);
  const count = preview?.items.length ?? 0;

  const confirm = () => {
    if (!preview) return;
    for (const it of preview.items) actions.addPrizes({ name: it.name, quantity: it.quantity });
    toast(`${plural(preview.units, 'prêmio cadastrado', 'prêmios cadastrados')}! Adicione as imagens editando cada um.`, 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Importar prêmios por planilha" size="lg">
      <div className="flex flex-col gap-5">
        <DropZone
          onFile={(f) => void onFile(f)}
          ariaLabel="Arquivo da planilha de prêmios"
          icon={<FileSpreadsheet size={36} strokeWidth={2.5} className="text-macaw" />}
          title={sheet ? sheet.fileName : 'Escolher ou arrastar a planilha'}
          hint="Excel (.xlsx, .xls) ou CSV com uma coluna de prêmio e, se quiser, a quantidade"
        />

        {sheet && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Coluna do prêmio">
                <select value={cols.name} onChange={(e) => setCols((c) => ({ ...c, name: e.target.value }))} className={SELECT}>
                  <option value="">Escolha…</option>
                  {sheet.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
              <Field label="Coluna da quantidade">
                <select value={cols.quantity} onChange={(e) => setCols((c) => ({ ...c, quantity: e.target.value }))} className={SELECT}>
                  <option value="">Sem quantidade (1 de cada)</option>
                  {sheet.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
            </div>

            {preview && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge color="green">{plural(preview.items.length, 'prêmio', 'prêmios')}</Badge>
                  <Badge color="blue">{plural(preview.units, 'unidade na fila', 'unidades na fila')}</Badge>
                  {preview.skipped > 0 && <Badge color="red">{plural(preview.skipped, 'linha sem nome', 'linhas sem nome')}</Badge>}
                  {preview.capped > 0 && <Badge color="yellow">{`quantidade limitada a ${MAX_PRIZE_QTY}: ${preview.capped}`}</Badge>}
                </div>
                <ul className="flex max-h-60 flex-col gap-1 overflow-auto rounded-2xl bg-polar p-3">
                  {preview.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="flex-1 truncate font-extrabold text-eel">{it.name}</span>
                      <span className="font-black text-wolf">×{it.quantity}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-bold text-wolf">Os prêmios entram no fim da fila, sem imagem. Depois é só editar cada um para colocar a foto.</p>
              </>
            )}
          </>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={count === 0} onClick={confirm}>
            Importar {plural(count, 'prêmio', 'prêmios')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
