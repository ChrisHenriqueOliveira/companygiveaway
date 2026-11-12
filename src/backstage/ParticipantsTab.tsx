import { Ban, FileUp, RotateCcw, Trash2, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { normalizeEmail } from '../domain/email';
import { foldText } from '../domain/text';
import type { Participant } from '../domain/types';
import { useActions } from '../store/actions';
import { useAppStore } from '../store/appStore';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, toast } from '../ui';
import { useFileDrop } from '../ui/DropZone';
import { ImportDialog } from './ImportDialog';
import { PersonForm } from './PersonForm';
import { SearchBox } from './SearchBox';

export function ParticipantsTab() {
  const actions = useActions();
  const participants = useAppStore((s) => s.participants);
  const excluded = useAppStore((s) => s.excluded);
  const draws = useAppStore((s) => s.draws);
  const [query, setQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [dropped, setDropped] = useState<File>();
  const drop = useFileDrop((f) => {
    setDropped(f);
    setImporting(true);
  });
  const [removing, setRemoving] = useState<Participant>();

  const blocked = useMemo(() => new Set(excluded.map((e) => normalizeEmail(e.email))), [excluded]);
  const winners = useMemo(() => new Set(draws.filter((d) => d.status === 'confirmed').map((d) => d.participantId)), [draws]);
  const absentRecords = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const d of draws) if (d.status === 'absent') m.set(d.participantId, [...(m.get(d.participantId) ?? []), d.id]);
    return m;
  }, [draws]);
  const excludedCount = participants.filter((p) => blocked.has(normalizeEmail(p.email))).length;

  const q = foldText(query.trim());
  const shown = q ? participants.filter((p) => foldText(p.name).includes(q) || foldText(p.email).includes(q)) : participants;

  const exclude = (id: string) => {
    const p = participants.find((x) => x.id === id);
    if (!p) return;
    const entry = excluded.find((e) => normalizeEmail(e.email) === normalizeEmail(p.email));
    if (entry) {
      actions.removeExcluded(entry.id);
      toast(`${p.name} voltou a concorrer.`, 'success');
    } else {
      actions.addExcluded({ name: p.name, email: p.email });
      toast(`${p.name} não será sorteado(a).`, 'info');
    }
  };

  const comeBack = (p: Participant) => {
    for (const id of absentRecords.get(p.id) ?? []) actions.removeDraw(id);
    toast(`${p.name} voltou a concorrer.`, 'success');
  };

  return (
    <div {...drop.props} className={`flex flex-col gap-6 rounded-3xl ${drop.over ? 'outline-dashed outline-4 outline-offset-4 outline-feather' : ''}`}>
      <Card className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black text-eel">Participantes</h3>
            <Badge color="blue">{participants.length} no total</Badge>
            {excludedCount > 0 && <Badge color="purple">{excludedCount} excluídos do sorteio</Badge>}
            {absentRecords.size > 0 && <Badge color="red">{absentRecords.size} ausentes</Badge>}
          </div>
          <Button icon={<FileUp size={18} strokeWidth={3} />} onClick={() => setImporting(true)}>
            Importar planilha
          </Button>
        </div>
        <PersonForm list={participants} onAdd={actions.addParticipant} />
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar participante" />
        {participants.length === 0 ? (
          <EmptyState title="Ninguém por aqui ainda" description="Importe a planilha de colaboradores ou adicione pessoas manualmente." />
        ) : (
          <ul className="flex max-h-[420px] flex-col gap-2 overflow-auto pr-1">
            {shown.map((p) => {
              const won = winners.has(p.id);
              const isExcluded = blocked.has(normalizeEmail(p.email));
              const isAbsent = !won && absentRecords.has(p.id);
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border-2 border-swan p-2.5 pr-3">
                  <Avatar name={p.name} email={p.email} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold text-eel">{p.name}</div>
                    <div className="truncate text-sm font-bold text-wolf">{p.email}</div>
                  </div>
                  {won && <Badge color="green">Ganhou</Badge>}
                  {isAbsent && <Badge color="red">Ausente</Badge>}
                  {isExcluded && <Badge color="purple">Excluído</Badge>}
                  {isAbsent && (
                    <button
                      type="button"
                      aria-label={`Voltar ${p.name} a concorrer`}
                      title="Voltar a concorrer"
                      onClick={() => comeBack(p)}
                      className="rounded-lg p-2 text-success-dark hover:bg-polar"
                    >
                      <RotateCcw size={18} strokeWidth={3} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={isExcluded ? `Voltar ${p.name} ao sorteio` : `Excluir ${p.name} do sorteio`}
                    title={isExcluded ? 'Voltar ao sorteio' : 'Excluir do sorteio'}
                    onClick={() => exclude(p.id)}
                    className={`rounded-lg p-2 hover:bg-polar ${isExcluded ? 'text-success-dark' : 'text-wolf hover:text-fox'}`}
                  >
                    {isExcluded ? <UserCheck size={18} strokeWidth={3} /> : <Ban size={18} strokeWidth={3} />}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${p.name}`}
                    title={won ? 'Quem já ganhou não pode ser removido' : 'Remover da lista'}
                    disabled={won}
                    onClick={() => setRemoving(p)}
                    className="rounded-lg p-2 text-wolf hover:bg-polar hover:text-cardinal disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={18} strokeWidth={3} />
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && <li className="p-4 text-center font-bold text-wolf">Ninguém encontrado.</li>}
          </ul>
        )}
      </Card>

      <ImportDialog
        open={importing}
        initialFile={dropped}
        onClose={() => {
          setImporting(false);
          setDropped(undefined);
        }}
      />
      <ConfirmDialog
        open={!!removing}
        title="Remover participante"
        message={removing ? `Remover ${removing.name} (${removing.email}) da lista de participantes?` : ''}
        confirmLabel="Remover"
        danger
        onCancel={() => setRemoving(undefined)}
        onConfirm={() => {
          if (removing) actions.removeParticipant(removing.id);
          setRemoving(undefined);
        }}
      />
    </div>
  );
}
