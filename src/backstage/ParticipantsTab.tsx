import { Ban, FileUp, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { normalizeEmail } from '../domain/email';
import { useActions } from '../store/actions';
import { useAppStore } from '../store/appStore';
import { Avatar, Badge, Button, Card, EmptyState, toast } from '../ui';
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

  const blocked = useMemo(() => new Set(excluded.map((e) => normalizeEmail(e.email))), [excluded]);
  const winners = useMemo(() => new Set(draws.filter((d) => d.status === 'confirmed').map((d) => d.participantId)), [draws]);
  const excludedCount = participants.filter((p) => blocked.has(normalizeEmail(p.email))).length;

  const q = query.trim().toLowerCase();
  const shown = q ? participants.filter((p) => p.name.toLowerCase().includes(q) || p.email.includes(q)) : participants;

  const exclude = (id: string) => {
    const p = participants.find((x) => x.id === id);
    if (!p) return;
    actions.addExcluded({ name: p.name, email: p.email });
    toast(`${p.name} não será sorteado(a).`, 'info');
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black text-eel">Participantes</h3>
            <Badge color="blue">{participants.length} no total</Badge>
            {excludedCount > 0 && <Badge color="purple">{excludedCount} excluídos do sorteio</Badge>}
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
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border-2 border-swan p-2.5 pr-3">
                  <Avatar name={p.name} email={p.email} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold text-eel">{p.name}</div>
                    <div className="truncate text-sm font-bold text-wolf">{p.email}</div>
                  </div>
                  {won && <Badge color="green">Ganhou</Badge>}
                  {isExcluded && <Badge color="purple">Excluído</Badge>}
                  <button
                    type="button"
                    aria-label={`Excluir ${p.name} do sorteio`}
                    title="Excluir do sorteio"
                    disabled={isExcluded}
                    onClick={() => exclude(p.id)}
                    className="rounded-lg p-2 text-wolf hover:bg-polar hover:text-fox disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Ban size={18} strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${p.name}`}
                    title={won ? 'Quem já ganhou não pode ser removido' : 'Remover da lista'}
                    disabled={won}
                    onClick={() => actions.removeParticipant(p.id)}
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

      <ImportDialog open={importing} onClose={() => setImporting(false)} />
    </div>
  );
}
