import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '../../ui';
import { burst } from '../confetti';
import { GiftBox } from '../GiftBox';
import { lockStage } from '../lock';
import { PrizeShowcase } from './PrizeShowcase';

type Step = 'shake' | 'pop' | 'show';

export function PrizeRevealScreen({ prizeId, onPrimary }: { prizeId?: string; onPrimary: () => void }) {
  const reduced = useReducedMotion() ?? false;
  const [step, setStep] = useState<Step>('shake');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = reduced ? [150, 400, 900] : [1200, 1700, 2400];
    lockStage(t[2]);
    const timers = [
      setTimeout(() => {
        setStep('pop');
        burst();
      }, t[0]),
      setTimeout(() => setStep('show'), t[1]),
      setTimeout(() => setReady(true), t[2]),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const size = Math.round(Math.min(window.innerHeight * 0.5, 440));

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex min-h-[48vh] items-center justify-center">
        <AnimatePresence mode="wait">
          {step !== 'show' ? (
            <motion.div key="box" exit={{ scale: 0.4, opacity: 0, y: 40 }} transition={{ duration: 0.25 }}>
              <GiftBox size={size} shaking={step === 'shake' && !reduced} popped={step === 'pop'} />
            </motion.div>
          ) : (
            <motion.div
              key="prize"
              initial={{ scale: 0.3, opacity: 0, y: 60 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            >
              <PrizeShowcase prizeId={prizeId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="h-24">
        {ready && (
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
            <Button size="xl" onClick={onPrimary}>
              Sortear!
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
