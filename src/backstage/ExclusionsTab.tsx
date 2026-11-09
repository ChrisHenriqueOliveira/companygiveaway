import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { normalizeEmail } from '../domain/email';
import { useActions } from '../store/actions';
import { useAppStore } from '../store/appStore';
import { Avatar, Badge, Button, Card, EmptyState } from '../ui';
import { PersonForm } from './PersonForm';
import { SearchBox } from './SearchBox';

export function ExclusionsTab() {
  const actions = useActions();
  const excluded = useAppStore((s) => s.excluded);
  const participants = useAppStore((s) => s.participants);
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const emails = new Set(excluded.map((e) => normalizeEmail(e.email)));
    return participants.filter((p) => emails.has(normalizeEmail(p.email))).length;
  }, [excluded, participants]);

  const q = query.trim().toLowerCase();
  const shown = q ? excluded.filter((p) => p.name.toLowerCase().includes(q) || p.email.includes(q)) : excluded;

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-black text-eel">Quem não pode ganhar</h3>
          <Badge color="purple">{excluded.length} na lista</Badge>
        </div>
        <p className="font-bold text-wolf">
          Diretores e organizadores ficam aqui. A comparação é pelo e-mail, então vale mesmo que a pessoa esteja na planilha.
        </p>
        <PersonForm list={excluded} onAdd={actions.addExcluded} buttonLabel="Excluir do sorteio" />
        <div className="rounded-2xl bg-[#F3E1FF] px-4 py-3 font-extrabold text-[#A560E8]">
          {matches === 1 ? '1 pessoa da lista de participantes está excluída.' : `${matches} pessoas da lista de participantes estão excluídas.`}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar na lista de exclusão" />
        {excluded.length === 0 ? (
          <EmptyState title="Ninguém excluído" description="Todos os participantes concorrem. Adicione diretores e organizadores acima." />
        ) : (
          <ul className="flex max-h-[360px] flex-col gap-2 overflow-auto pr-1">
            {shown.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl border-2 border-swan p-2.5 pr-3">
                <Avatar name={p.name} email={p.email} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold text-eel">{p.name}</div>
                  <div className="truncate text-sm font-bold text-wolf">{p.email}</div>
                </div>
                <Button variant="ghost" icon={<Trash2 size={16} strokeWidth={3} />} aria-label={`Remover ${p.name} da exclusão`} onClick={() => actions.removeExcluded(p.id)}>
                  Remover
                </Button>
              </li>
            ))}
            {shown.length === 0 && <li className="p-4 text-center font-bold text-wolf">Ninguém encontrado.</li>}
          </ul>
        )}
      </Card>
    </div>
  );
}
