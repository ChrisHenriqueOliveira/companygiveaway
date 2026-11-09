import { FileDown, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { eligibleParticipants } from '../domain/engine';
import { exportHistoryXlsx } from '../io/sheetExport';
import { useActions } from '../store/actions';
import { useAppStore } from '../store/appStore';
import { useCanUndo, useView } from '../store/hooks';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, toast } from '../ui';

const time = (ms: number) =>
  new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function HistoryTab() {
  const actions = useActions();
  const realDraws = useAppStore((s) => s.draws);
  const rehearsal = useAppStore((s) => s.rehearsal);
  const eventName = useAppStore((s) => s.settings.eventName);
  const view = useView();
  const canUndo = useCanUndo();
  const [asking, setAsking] = useState(false);

  const shown = [...(rehearsal.active ? rehearsal.draws : realDraws)].sort((a, b) => b.at - a.at);
  const eligible = eligibleParticipants(view).length;

  const exportXlsx = () => {
    exportHistoryXlsx(realDraws, eventName);
    toast('Planilha de ganhadores baixada!', 'success');
  };

  return (
    <div className="flex flex-col gap-6">
      {rehearsal.active && (
        <div className="rounded-2xl border-2 border-bee bg-[#FFF5CC] px-4 py-3 font-extrabold text-fox">
          ENSAIO: estes são os sorteios de teste. Eles somem quando o modo ensaio for desligado.
        </div>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-black text-eel">Histórico</h3>
          <Badge color="blue">{eligible === 1 ? '1 pessoa ainda concorre' : `${eligible} pessoas ainda concorrem`}</Badge>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" icon={<Undo2 size={18} strokeWidth={3} />} disabled={!canUndo} onClick={() => setAsking(true)}>
            Desfazer último
          </Button>
          <Button variant="secondary" icon={<FileDown size={18} strokeWidth={3} />} disabled={realDraws.length === 0} onClick={exportXlsx}>
            Exportar Excel
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        {shown.length === 0 ? (
          <EmptyState mood="excited" title="Nada sorteado ainda" description="Os sorteios aparecem aqui, do mais recente para o mais antigo." />
        ) : (
          <ol className="flex flex-col gap-2">
            {shown.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-2xl border-2 border-swan p-2.5 pr-4">
                <Avatar name={d.name} email={d.email} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-extrabold text-eel">{d.name}</div>
                  <div className="truncate text-sm font-bold text-wolf">{d.prizeName}</div>
                </div>
                {rehearsal.active && <Badge color="yellow">Ensaio</Badge>}
                {d.status === 'confirmed' && <Badge color="green">✅ Confirmado</Badge>}
                {d.status === 'absent' && <Badge color="red">🚫 Ausente</Badge>}
                {d.status === 'pending' && <Badge color="blue">Sorteando…</Badge>}
                <span className="w-20 text-right text-sm font-extrabold text-wolf">{time(d.at)}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <ConfirmDialog
        open={asking}
        title="Desfazer último sorteio"
        message="O registro mais recente será apagado. Se o prêmio foi confirmado, ele volta para o topo da fila e a pessoa volta a concorrer."
        confirmLabel="Desfazer"
        danger
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          actions.undoLast();
          setAsking(false);
          toast('Último sorteio desfeito.', 'info');
        }}
      />
    </div>
  );
}
