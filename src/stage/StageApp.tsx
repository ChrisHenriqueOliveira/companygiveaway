import { AnimatePresence, motion } from 'motion/react';
import { Monitor, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BackstagePanel } from '../backstage/BackstagePanel';
import { selectActiveStage, useAppStore } from '../store/appStore';
import { useActions } from '../store/actions';
import { openControlWindow } from '../sync/openControl';
import { startOwnerBridge } from '../sync/ownerBridge';
import { Modal, Toaster } from '../ui';
import { deriveScreen } from './deriveScreen';
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

const PRIMARY_GUARD_MS = 600; // clique duplo do passador não pula etapa
const REDRAW_MESSAGE_MS = 1150;

export function StageApp() {
  const actions = useActions();
  const state = useAppStore();
  const screen = deriveScreen(state);
  const stage = selectActiveStage(state);
  const { eventName, logoImageId } = state.settings;
  const logo = logoImageId ? state.images[logoImageId] : undefined;

  const [backstage, setBackstage] = useState(false);
  const [redrawing, setRedrawing] = useState(false);
  const redrawTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(redrawTimer.current), []);
  useEffect(() => startOwnerBridge(), []); // atende a janela de Controle (se houver)

  const onPrimary = () => {
    if (isStageLocked()) return;
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

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  useStageHotkeys({
    primary: onPrimary,
    absent: onAbsent,
    fullscreen: toggleFullscreen,
    backstage: () => setBackstage((o) => !o),
    close: () => setBackstage(false),
  });

  const openBackstage = () => setBackstage(true);

  return (
    <main data-screen={screen} className="relative flex h-screen w-screen select-none flex-col overflow-hidden bg-white">
      <StageBackdrop />

      {state.rehearsal.active && (
        <div className="relative z-20 bg-bee py-1.5 text-center text-lg font-black uppercase tracking-[0.3em] text-white">
          Modo ensaio
        </div>
      )}
      {state.storageError && (
        <div className="relative z-20 bg-cardinal py-1.5 text-center text-lg font-extrabold text-white">{state.storageError}</div>
      )}

      <header className="relative z-10 flex items-center justify-center gap-4 px-8 pt-5">
        {logo && <img src={logo} alt="" className="h-12 object-contain" />}
        <span className="text-xl font-extrabold uppercase tracking-[0.25em] text-wolf">{eventName}</span>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-[4vw] pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            className="flex h-full w-full items-center justify-center"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {screen === 'setup' && <SetupScreen onOpenBackstage={openBackstage} />}
            {screen === 'idle' && <IdleScreen onPrimary={onPrimary} />}
            {screen === 'prizeReveal' && <PrizeRevealScreen prizeId={stage.prizeId} onPrimary={onPrimary} />}
            {screen === 'drawing' && <DrawingScreen />}
            {screen === 'winnerReveal' && <WinnerRevealScreen onPrimary={onPrimary} onAbsent={onAbsent} />}
            {screen === 'noEligible' && <NoEligibleScreen onPrimary={onPrimary} onOpenBackstage={openBackstage} />}
            {screen === 'finale' && <FinaleScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {redrawing && (
          <motion.div
            key="redraw"
            className="absolute inset-0 z-30 flex items-center justify-center bg-white/85 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 z-20 flex gap-2 opacity-30 transition-opacity hover:opacity-100 focus-within:opacity-100">
        <button type="button" aria-label="Abrir bastidores" title="Bastidores (Ctrl+K)" onClick={openBackstage} className="rounded-xl p-2 text-wolf hover:bg-polar">
          <Settings size={22} strokeWidth={2.5} />
        </button>
      </div>
      <div className="absolute bottom-4 right-4 z-20 flex gap-2 opacity-30 transition-opacity hover:opacity-100 focus-within:opacity-100">
        <button type="button" aria-label="Abrir janela de controle" title="Janela de controle" onClick={() => openControlWindow()} className="rounded-xl p-2 text-wolf hover:bg-polar">
          <Monitor size={22} strokeWidth={2.5} />
        </button>
      </div>

      <Modal open={backstage} onClose={() => setBackstage(false)} title="Bastidores" size="full">
        <BackstagePanel />
      </Modal>
      <Toaster />
    </main>
  );
}
