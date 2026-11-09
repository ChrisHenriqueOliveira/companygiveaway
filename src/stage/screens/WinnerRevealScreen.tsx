import { motion } from 'motion/react';
import { useEffect } from 'react';
import { currentDraw } from '../../domain/engine';
import { Presentinho } from '../../mascot/Presentinho';
import { useView } from '../../store/hooks';
import { Avatar, Button } from '../../ui';
import { cannons } from '../confetti';
import { lockStage } from '../lock';
import { PrizeShowcase } from './PrizeShowcase';

const LOCK_MS = 1300; // segura o "confirmar" até o nome aparecer por inteiro

export function WinnerRevealScreen({ onPrimary, onAbsent }: { onPrimary: () => void; onAbsent: () => void }) {
  const view = useView();
  const draw = currentDraw(view);

  useEffect(() => {
    lockStage(LOCK_MS);
    return cannons(2600);
  }, []);

  if (!draw) return null;
  const avatar = Math.round(Math.min(window.innerHeight * 0.19, 220));

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <motion.h2
        initial={{ y: -40, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        className="text-[clamp(1.8rem,3.4vw,3.6rem)] font-black uppercase tracking-wide text-feather"
      >
        Temos um sortudo!
      </motion.h2>

      <div className="flex w-full flex-wrap items-center justify-center gap-x-[5vw] gap-y-5">
        <div className="flex max-w-[70vw] flex-col items-center gap-3 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
          >
            <Avatar name={draw.name} email={draw.email} size={avatar} />
          </motion.div>
          <motion.span
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.3 }}
            className="break-words font-black leading-[1.05] text-eel"
            style={{ fontSize: 'clamp(2.6rem, min(7.5vw, 10vh), 9rem)' }}
          >
            {draw.name}
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-[clamp(1.1rem,1.8vw,2rem)] font-bold text-wolf"
          >
            {draw.email}
          </motion.span>
        </div>

        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-lg font-extrabold uppercase tracking-widest text-wolf">ganhou</span>
          <PrizeShowcase prizeId={draw.prizeId} compact />
        </motion.div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-5">
        <Button size="xl" onClick={onPrimary}>
          Confirmar
        </Button>
        <Button size="lg" variant="danger" onClick={onAbsent}>
          Ausente — ressortear
        </Button>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-[3vw] hidden xl:block">
        <Presentinho mood="celebrate" size={Math.round(Math.min(window.innerHeight * 0.22, 200))} />
      </div>
    </div>
  );
}
