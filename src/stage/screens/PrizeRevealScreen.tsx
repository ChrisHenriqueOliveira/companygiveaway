import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Button } from '../../ui';
import { burst } from '../confetti';
import { GiftBox } from '../GiftBox';
import { lockStage } from '../lock';
import { pacing } from '../pacing';
import { PrizeShowcase } from './PrizeShowcase';

type Step = 'shake' | 'pop' | 'show';

/** O presente balança pelo tempo que o suspense configurado pede e só então revela o prêmio. */
export function PrizeRevealScreen({ prizeId, onPrimary }: { prizeId?: string; onPrimary: () => void }) {
  const suspense = useAppStore((s) => s.settings.suspenseSeconds);
  const gift = useAppStore((s) => s.settings.giftSeconds);
  const p = pacing(suspense, gift);
  const [step, setStep] = useState<Step>('shake');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // O suspense configurado vale sempre, mesmo com "reduzir movimento" ligado no sistema (é o show do evento).
    const t = [p.giftPopMs, p.giftShowMs, p.giftReadyMs];
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
  }, [p.giftPopMs, p.giftShowMs, p.giftReadyMs]);

  const size = Math.round(Math.min(window.innerHeight * 0.5, 440));

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex min-h-[48vh] items-center justify-center">
        {step !== 'show' ? (
          <motion.div key="box">
            <GiftBox size={size} shaking={step === 'shake'} popped={step === 'pop'} />
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
