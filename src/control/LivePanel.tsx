import { Printer, Undo2 } from 'lucide-react';
import { printWinners } from '../print/printWinners';
import { useEffect, useMemo, useState } from 'react';
import { undoMessage } from '../backstage/messages';
import { currentDraw, eligibleParticipants, lastDraw, pendingQueue } from '../domain/engine';
import { deriveScreen, type StageScreen } from '../stage/deriveScreen';
import { pacing } from '../stage/pacing';
import { useActions } from '../store/actions';
import { selectActiveStage, selectUndoView, useAppStore } from '../store/appStore';
import { useCanUndo, useView, useWinners } from '../store/hooks';
import { Avatar, Badge, Button, Card, ConfirmDialog } from '../ui';
import { PrizeImage } from '../ui/PrizeImage';

const LABEL: Record<StageScreen, string> = {
  setup: 'Falta cadastrar prêmios ou participantes',
  idle: 'Aguardando o próximo prêmio',
  prizeReveal: 'Mostrando o prêmio',
  drawing: 'Sorteando…',
  winnerReveal: 'Ganhador na tela',
  noEligible: 'Sem participantes elegíveis',
  finale: 'Mural final no telão',
};

/** Segura os botões enquanto a animação do palco roda (o palco faz o mesmo no atalho de teclado). */
function useReady(phase: StageScreen, prizeId: string | undefined, gift: number): boolean {
  const [ready, setReady] = useState(true);
  useEffect(() => {
    const p = pacing(gift);
    const ms = phase === 'prizeReveal' ? p.giftReadyMs : phase === 'winnerReveal' ? p.winnerLockMs : 500;
    setReady(false);
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [phase, prizeId]); // trocar o prêmio da vez também recomeça a animação do palco
  return ready;
}

export function LivePanel() {
  const actions = useActions();
  const state = useAppStore();
  const view = useView();
  const canUndo = useCanUndo();
  const winners = useWinners();
  const [asking, setAsking] = useState(false);
  const [askAbsent, setAskAbsent] = useState(false);

  const phase = deriveScreen(state);
  const stage = selectActiveStage(state);
  const ready = useReady(phase, stage.prizeId, state.settings.giftSeconds);

  const draw = currentDraw(view);
  const prize = stage.prizeId ? state.prizes[stage.prizeId] : undefined;
  const prizeImage = prize?.imageId ? state.images[prize.imageId] : undefined;
  const upcoming = pendingQueue(view).filter((id) => id !== stage.prizeId);
  const next = upcoming[0] ? state.prizes[upcoming[0]] : undefined;
  const nextImage = next?.imageId ? state.images[next.imageId] : undefined;
  const eligible = eligibleParticipants(view).length;
  const undoTarget = useMemo(() => lastDraw(selectUndoView(state)), [state.draws, state.rehearsal]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-wolf">Ao vivo no telão</span>
          {state.rehearsal.active && <Badge color="yellow">Ensaio</Badge>}
        </div>
        <div className="text-2xl font-black text-eel">{LABEL[phase]}</div>

        {prize && (
          <div className="flex items-center gap-3 rounded-2xl bg-polar p-3">
            <PrizeImage src={prizeImage} size={56} />
            <div className="min-w-0">
              <div className="text-xs font-extrabold uppercase tracking-wider text-wolf">Prêmio da vez</div>
              <div className="truncate text-lg font-extrabold text-eel">{prize.name}</div>
            </div>
          </div>
        )}
        {draw && (phase === 'winnerReveal' || phase === 'drawing') && (
          <div className="flex items-center gap-3 rounded-2xl bg-success-tint p-3">
            <Avatar name={draw.name} email={draw.email} size={56} />
            <div className="min-w-0">
              <div className="text-xs font-extrabold uppercase tracking-wider text-success-dark">Sorteado</div>
              <div className="truncate text-lg font-extrabold text-eel">{draw.name}</div>
              <div className="truncate text-sm font-bold text-wolf">{draw.email}</div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-1">
          {phase === 'idle' && (
            <Button size="lg" disabled={!ready} onClick={() => actions.stageNext()}>
              Próximo prêmio
            </Button>
          )}
          {(phase === 'prizeReveal' || phase === 'noEligible') && (
            <Button size="lg" disabled={!ready} onClick={() => actions.stageStartDraw()}>
              Sortear!
            </Button>
          )}
          {phase === 'prizeReveal' && (
            <Button variant="ghost" onClick={() => actions.stageBackToIdle()}>
              Cancelar e voltar ao início
            </Button>
          )}
          {phase === 'drawing' && (
            <Button size="lg" disabled>
              Sorteando…
            </Button>
          )}
          {phase === 'winnerReveal' && (
            <>
              <Button size="lg" disabled={!ready} onClick={() => actions.stageConfirm()}>
                Confirmar
              </Button>
              <Button size="lg" variant="danger" disabled={!ready} onClick={() => setAskAbsent(true)}>
                Ausente — ressortear
              </Button>
            </>
          )}
          {(phase === 'finale' || phase === 'noEligible') && (
            <Button size="lg" variant="secondary" disabled={!ready} onClick={() => actions.stageBackToIdle()}>
              Voltar ao início
            </Button>
          )}
          <Button variant="warning" icon={<Undo2 size={18} strokeWidth={3} />} disabled={!canUndo} onClick={() => setAsking(true)}>
            Desfazer último
          </Button>
          {winners.length > 0 && (
            <Button variant="ghost" icon={<Printer size={18} strokeWidth={3} />} onClick={printWinners}>
              Imprimir ganhadores
            </Button>
          )}
          <p className="text-xs font-bold text-wolf">
            As teclas → e PageDown do passador de slides também avançam o sorteio com esta janela em foco.
          </p>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <span className="text-xs font-extrabold uppercase tracking-wider text-wolf">Próximo da fila</span>
        {next ? (
          <div className="flex items-center gap-3">
            <PrizeImage src={nextImage} size={48} />
            <span className="truncate text-lg font-extrabold text-eel">{next.name}</span>
          </div>
        ) : (
          <span className="font-bold text-wolf">Fila vazia</span>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge color="blue">{eligible === 1 ? '1 pessoa concorre' : `${eligible} pessoas concorrem`}</Badge>
          <Badge color="purple">{upcoming.length === 1 ? '1 prêmio depois' : `${upcoming.length} prêmios depois`}</Badge>
        </div>
      </Card>

      <ConfirmDialog
        open={askAbsent}
        title="Marcar como ausente?"
        message={
          draw
            ? `${draw.name} sai do sorteio e será sorteada outra pessoa para “${draw.prizeName}”. (Dá para recolocar ${draw.name} pelo Histórico.)`
            : 'Sortear outra pessoa para este prêmio?'
        }
        confirmLabel="Sim, ausente"
        danger
        onCancel={() => setAskAbsent(false)}
        onConfirm={() => {
          actions.stageAbsent();
          setAskAbsent(false);
        }}
      />
      <ConfirmDialog
        open={asking}
        title="Desfazer último sorteio"
        message={undoMessage(undoTarget)}
        confirmLabel="Desfazer"
        danger
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          actions.undoLast();
          setAsking(false);
        }}
      />
    </div>
  );
}
