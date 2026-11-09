import { FileSpreadsheet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { buildImportPreview, detectColumns, readSheetFile, type Row } from '../io/sheetImport';
import { useActions } from '../store/actions';
import { useAppStore } from '../store/appStore';
import { Avatar, Badge, Button, Field, Modal, toast } from '../ui';
import { cn } from '../ui';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'replace' | 'append';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function ImportDialog({ open, onClose }: Props) {
  const actions = useActions();
  const excluded = useAppStore((s) => s.excluded);
  const existing = useAppStore((s) => s.participants.length);

  const [sheet, setSheet] = useState<{ fileName: string; headers: string[]; rows: Row[] } | null>(null);
  const [cols, setCols] = useState({ name: '', email: '' });
  const [mode, setMode] = useState<Mode>('replace');

  useEffect(() => {
    if (open) {
      setSheet(null);
      setCols({ name: '', email: '' });
      setMode(existing > 0 ? 'append' : 'replace');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const { headers, rows } = await readSheetFile(file);
      if (rows.length === 0) {
        toast('A planilha está vazia.', 'error');
        return;
      }
      const d = detectColumns(headers, rows);
      setSheet({ fileName: file.name, headers, rows });
      setCols({ name: d.name ?? '', email: d.email ?? '' });
    } catch {
      toast('Não consegui ler essa planilha.', 'error');
    }
  };

  const preview = useMemo(
    () => (sheet && cols.email ? buildImportPreview(sheet.rows, cols, excluded) : null),
    [sheet, cols, excluded],
  );
  const count = preview?.valid.length ?? 0;

  const confirm = () => {
    if (!preview) return;
    actions.importParticipants(preview.valid, mode);
    toast(`${plural(count, 'participante importado', 'participantes importados')}!`, 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Importar planilha" size="lg">
      <div className="flex flex-col gap-5">
        <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-swan bg-polar p-5 transition hover:border-macaw">
          <FileSpreadsheet size={36} strokeWidth={2.5} className="text-macaw" />
          <span className="flex flex-col">
            <span className="text-lg font-extrabold text-eel">{sheet ? sheet.fileName : 'Escolher planilha'}</span>
            <span className="text-sm font-bold text-wolf">Excel (.xlsx, .xls) ou CSV com nome e e-mail</span>
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            aria-label="Arquivo da planilha"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>

        {sheet && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(['name', 'email'] as const).map((k) => (
                <Field key={k} label={k === 'name' ? 'Coluna do nome' : 'Coluna do e-mail'}>
                  <select
                    value={cols[k]}
                    onChange={(e) => setCols((c) => ({ ...c, [k]: e.target.value }))}
                    className="w-full rounded-2xl border-2 border-swan bg-polar px-4 py-3 font-bold text-eel outline-none focus:border-macaw"
                  >
                    <option value="">{k === 'name' ? 'Usar o começo do e-mail' : 'Escolha…'}</option>
                    {sheet.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>

            {preview && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge color="green">{plural(preview.valid.length, 'válido', 'válidos')}</Badge>
                  <Badge color="yellow">{plural(preview.duplicates, 'duplicado', 'duplicados')}</Badge>
                  <Badge color="red">{plural(preview.invalid, 'inválido', 'inválidos')}</Badge>
                  <Badge color="purple">{plural(preview.alreadyExcluded, 'na lista de exclusão', 'na lista de exclusão')}</Badge>
                  <Badge color="gray">{plural(preview.total, 'linha', 'linhas')}</Badge>
                </div>
                <ul className="flex flex-col gap-1 rounded-2xl bg-polar p-3">
                  {preview.valid.slice(0, 5).map((p) => (
                    <li key={p.email} className="flex items-center gap-3">
                      <Avatar name={p.name} email={p.email} size={32} />
                      <span className="font-extrabold text-eel">{p.name}</span>
                      <span className="font-bold text-wolf">{p.email}</span>
                    </li>
                  ))}
                  {preview.valid.length > 5 && (
                    <li className="px-1 text-sm font-bold text-wolf">…e mais {preview.valid.length - 5}</li>
                  )}
                </ul>
              </>
            )}

            <div role="radiogroup" aria-label="Modo de importação" className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {([
                ['replace', 'Substituir lista', 'Troca todos os participantes (quem já ganhou é mantido).'],
                ['append', 'Adicionar à lista', 'Mantém os atuais e acrescenta os novos.'],
              ] as const).map(([id, label, desc]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={mode === id}
                  aria-label={label}
                  onClick={() => setMode(id)}
                  className={cn(
                    'rounded-2xl border-2 border-b-4 p-4 text-left transition',
                    mode === id ? 'border-macaw bg-[#DDF4FF]' : 'border-swan bg-white hover:bg-polar',
                  )}
                >
                  <span className="block text-lg font-black text-eel">{label}</span>
                  <span className="text-sm font-bold text-wolf">{desc}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={count === 0} onClick={confirm}>
            Importar {plural(count, 'pessoa', 'pessoas')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
