import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { currentDraw } from '../../domain/engine';
import { useAppStore } from '../../store/appStore';
import { useView } from '../../store/hooks';
import { Avatar, Button } from '../../ui';
import { PrizeImage } from '../../ui/PrizeImage';
import { cannons } from '../confetti';
import { lockStage } from '../lock';
import { pacing } from '../pacing';
import { useWindowSize } from '../useWindowSize';

/**
 * Revelação em etapas, no ritmo do suspense configurado (k = 1 com 7 s):
 * título → prêmio grande → avatar → NOME (com confete) → e-mail → botões.
 */
export function WinnerRevealScreen({ onPrimary, onAbsent }: { onPrimary: () => void; onAbsent: () => void }) {
  const view = useView();
  const draw = currentDraw(view);
  const prize = useAppStore((s) => (draw ? s.prizes[draw.prizeId] : undefined));
  const image = useAppStore((s) => (prize?.imageId ? s.images[prize.imageId] : undefined));
  const { winnerScale: k, winnerLockMs } = pacing();
  const { h } = useWindowSize();

  useEffect(() => {
    lockStage(winnerLockMs);
    let stop = () => undefined as void;
    const t = setTimeout(() => {
      stop = cannons(2800);
    }, 2300 * k);
    return () => {
      clearTimeout(t);
      stop();
    };
  }, [k, winnerLockMs]);

  if (!draw) return null;
  const hero = Math.round(Math.min(h * 0.27, 310));
  const avatar = Math.round(Math.min(h * 0.12, 130));
  const spring = { type: 'spring', stiffness: 220, damping: 16 } as const;

  return (
    <div className="flex w-full flex-col items-center gap-[1.6vh]">
      <motion.h2
        initial={{ y: -40, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ ...spring, delay: 0.1 * k }}
        className="text-[clamp(1.6rem,3vw,3.2rem)] font-black uppercase tracking-wide text-feather"
      >
        Temos um sortudo!
      </motion.h2>

      <motion.div
        initial={{ scale: 0.3, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.5 * k }}
        className="flex flex-col items-center gap-2"
      >
        <PrizeImage src={image} size={hero} fit="contain" className="!rounded-[32px] !border-4 shadow-xl" />
        <span className="text-[clamp(1.3rem,2.2vw,2.4rem)] font-black text-eel">{prize?.name ?? draw.prizeName}</span>
      </motion.div>

      <div className="flex max-w-[88vw] items-center justify-center gap-[2vw]">
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 1.5 * k }}
        >
          <Avatar name={draw.name} email={draw.email} size={avatar} />
        </motion.div>
        <motion.span
          initial={{ y: 40, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ ...spring, delay: 2.3 * k }}
          className="break-words text-center font-black leading-[1.05] text-eel"
          style={{ fontSize: 'clamp(2.4rem, min(6vw, 8.5vh), 7rem)' }}
        >
          {draw.name}
        </motion.span>
      </div>

      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.1 * k }}
        className="text-[clamp(1rem,1.5vw,1.7rem)] font-bold text-wolf"
      >
        {draw.email}
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.4 * k, duration: 0.4 }}
        className="flex flex-col items-center gap-2"
      >
        <Button size="xl" onClick={onPrimary}>
          Confirmar
        </Button>
        {/* Ação rara e secundária: discreta, longe do botão principal (atalho: R). */}
        <button
          type="button"
          onClick={onAbsent}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-lg font-extrabold text-wolf underline-offset-4 hover:text-cardinal hover:underline"
        >
          <RefreshCw size={18} strokeWidth={3} />
          Ausente? Sortear outro
        </button>
      </motion.div>

    </div>
  );
}
