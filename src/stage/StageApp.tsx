import { motion } from 'motion/react';
import { Monitor, Printer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ViceriMark } from '../brand/ViceriMark';
import { Presentinho } from '../mascot/Presentinho';
import { printWinners } from '../print/printWinners';
import { WinnersPrintSheet } from '../print/WinnersPrintSheet';
import { selectActiveStage, useAppStore } from '../store/appStore';
import { STORAGE_KEY } from '../store/persistence';
import { useActions } from '../store/actions';
import { isControlWindowOpen, openControlWindow } from '../sync/openControl';
import { startOwnerBridge } from '../sync/ownerBridge';
import { ConfirmDialog, toast, Toaster } from '../ui';
import { deriveScreen } from './deriveScreen';
import { FitToScreen } from './FitToScreen';
import { useStageHotkeys } from './hotkeys';
import { isStageLocked, lockStage } from './lock';
import { DrawingScreen } from './screens/DrawingScreen';
import { FinaleScreen } from './screens/FinaleScreen';
import { IdleScreen } from './screens/IdleScreen';
import { NoEligibleScreen } from './screens/NoEligibleScreen';
import { PrizeRevealScreen } from './screens/PrizeRevealScreen';
import { SetupScreen } from './screens/SetupScreen';
import { WinnerRevealScreen } from './screens/WinnerRevealScreen';
import { StageBackdrop } from './StageBackdrop';
import { useWindowSize } from './useWindowSize';

const PRIMARY_GUARD_MS = 600; // clique duplo do passador não pula etapa
const REDRAW_MESSAGE_MS = 1150;

export function StageApp() {
  const actions = useActions();
  const state = useAppStore();
  const { h } = useWindowSize();
  const screen = deriveScreen(state);
  const stage = selectActiveStage(state);
  const { eventName, logoImageId } = state.settings;
  const logo = logoImageId ? state.images[logoImageId] : undefined;

  const [redrawing, setRedrawing] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [askControl, setAskControl] = useState(false);
  const redrawTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(redrawTimer.current), []);
  useEffect(() => startOwnerBridge(), []); // atende a janela de Controle (se houver)

  // Outra aba/janela do palco gravou no mesmo localStorage: as duas se sobrescreveriam e ganhadores sumiriam.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setConflict(true);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const onPrimary = () => {
    if (isStageLocked()) return;
    // O ganhador precisa estar salvo antes da animação: sem salvar, não sorteia (e avisa quem opera).
    if ((screen === 'prizeReveal' || screen === 'noEligible') && state.storageError && !state.rehearsal.active) {
      toast('Sorteio bloqueado: não foi possível salvar. Abra o Controle e veja o aviso.', 'error');
      return;
    }
    lockStage(PRIMARY_GUARD_MS);
    switch (screen) {
      case 'idle':
        return actions.stageNext();
      case 'prizeReveal':
      case 'noEligible':
        return actions.stageStartDraw();
      case 'winnerReveal':
        return actions.stageConfirm();
      default:
        return;
    }
  };

  const onAbsent = () => {
    if (screen !== 'winnerReveal' || redrawing || isStageLocked()) return;
    lockStage(REDRAW_MESSAGE_MS + PRIMARY_GUARD_MS);
    setRedrawing(true);
    redrawTimer.current = setTimeout(() => {
      actions.stageAbsent();
      setRedrawing(false);
    }, REDRAW_MESSAGE_MS);
  };

  /** Bastidores = janela de Controle: nada de configuração ou fila de prêmios aparece no telão. */
  function openControl() {
    // Já aberta: só traz para a frente. Senão pergunta antes (um clique sem querer não pode expor nada no telão).
    if (isControlWindowOpen()) openControlWindow();
    else setAskControl(true);
  }

  function confirmOpenControl() {
    setAskControl(false);
    if (!openControlWindow()) toast('Permita popups para esta página e tente de novo.', 'error');
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  useStageHotkeys(
    conflict
      ? {}
      : {
          primary: onPrimary,
          absent: onAbsent,
          fullscreen: toggleFullscreen,
          backstage: openControl,
          print: () => {
            if (screen === 'finale') printWinners();
          },
        },
  );

  const openBackstage = openControl;

  return (
    <main data-screen={screen} className="relative flex h-screen w-screen select-none flex-col overflow-hidden bg-white">
      <StageBackdrop />

      {state.rehearsal.active && (
        <div className="relative z-20 bg-bee py-1.5 text-center text-lg font-black uppercase tracking-[0.3em] text-white">
          Modo ensaio
        </div>
      )}
      {state.storageError && (
        // Só uma bolinha discreta no telão: o texto do erro fica para a janela de Controle (o público não precisa ver).
        <div
          aria-label="Não foi possível salvar"
          title="Não foi possível salvar. Veja o aviso na janela de Controle."
          className="absolute left-3 top-3 z-20 h-3 w-3 rounded-full bg-cardinal opacity-70"
        />
      )}

      <header className="relative z-10 flex items-center justify-center gap-4 px-8 pt-5">
        {logo ? <img src={logo} alt="" className="h-12 object-contain" /> : <ViceriMark size={40} />}
        <span className="text-xl font-extrabold uppercase tracking-[0.25em] text-wolf">{eventName}</span>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-[4vw] pb-8">
        {/* Sem animação de saída: o estado do sorteio nunca pode depender de uma animação terminar. */}
        <motion.div
          key={`${screen}:${stage.prizeId ?? ''}`}
          className="h-full w-full"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          {/* O conteúdo se reduz sozinho se não couber (nomes longos, telas de 768p, mural grande). */}
          <FitToScreen>
            {screen === 'setup' && <SetupScreen onOpenBackstage={openBackstage} />}
            {screen === 'idle' && <IdleScreen onPrimary={onPrimary} />}
            {screen === 'prizeReveal' && <PrizeRevealScreen prizeId={stage.prizeId} onPrimary={onPrimary} />}
            {screen === 'drawing' && <DrawingScreen />}
            {screen === 'winnerReveal' && <WinnerRevealScreen onPrimary={onPrimary} onAbsent={onAbsent} />}
            {screen === 'noEligible' && <NoEligibleScreen onPrimary={onPrimary} onOpenBackstage={openBackstage} />}
            {screen === 'finale' && <FinaleScreen />}
          </FitToScreen>
        </motion.div>
      </div>

      {screen === 'winnerReveal' && (
        <div className="pointer-events-none absolute bottom-6 left-[3vw] z-10 hidden xl:block">
          <Presentinho mood="celebrate" size={Math.round(Math.min(h * 0.2, 190))} />
        </div>
      )}

      {redrawing && (
        <motion.div
          key="redraw"
          className="absolute inset-0 z-30 flex items-center justify-center bg-white/85 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.p
            initial={{ scale: 0.6, rotate: -4 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 14 }}
            className="text-[clamp(2.4rem,6vw,6.5rem)] font-black text-cardinal"
          >
            Ixi, não veio? Bora de novo!
          </motion.p>
        </motion.div>
      )}

      {screen === 'finale' && (
        <div className="absolute bottom-4 left-4 z-20 flex gap-2 opacity-30 transition-opacity hover:opacity-100 focus-within:opacity-100">
          <button type="button" aria-label="Imprimir ganhadores" title="Imprimir ganhadores (P)" onClick={printWinners} className="rounded-xl p-2 text-wolf hover:bg-polar">
            <Printer size={22} strokeWidth={2.5} />
          </button>
        </div>
      )}
      <div className="absolute bottom-4 right-4 z-20 flex gap-2 opacity-30 transition-opacity hover:opacity-100 focus-within:opacity-100">
        <button type="button" aria-label="Abrir bastidores (janela de controle)" title="Bastidores / janela de controle (Ctrl+K)" onClick={openControl} className="rounded-xl p-2 text-wolf hover:bg-polar">
          <Monitor size={22} strokeWidth={2.5} />
        </button>
      </div>

      <ConfirmDialog
        open={askControl}
        title="Abrir a janela de Controle?"
        message={
          <>
            <b>Ops, certeza que quer abrir isso?</b> O Controle mostra a fila de prêmios e as configurações. Se este telão estiver
            espelhando a tela, o público vai ver. Só abra se o Controle for ficar no seu notebook.
          </>
        }
        confirmLabel="Sim, abrir o Controle"
        cancelLabel="Cancelar"
        onCancel={() => setAskControl(false)}
        onConfirm={confirmOpenControl}
      />
      <Toaster />
      <WinnersPrintSheet />

      {conflict && (
        <div role="alertdialog" aria-label="Sorteio aberto em outra janela" className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-white p-10 text-center">
          <h2 className="text-5xl font-black text-cardinal">Este sorteio já está aberto em outra janela</h2>
          <p className="max-w-3xl text-2xl font-bold text-wolf">
            Duas janelas do palco gravando ao mesmo tempo apagariam ganhadores. Feche a outra janela e recarregue esta para continuar com os dados salvos.
          </p>
          <button type="button" className="btn-3d btn-feather rounded-[24px] px-12 py-5 text-2xl" onClick={() => location.reload()}>
            Recarregar com os dados salvos
          </button>
        </div>
      )}
    </main>
  );
}
