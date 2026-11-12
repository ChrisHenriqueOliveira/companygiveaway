import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Presentinho } from '../../mascot/Presentinho';
import { useWindowSize } from '../useWindowSize';
import { useAppStore } from '../../store/appStore';
import { Button } from '../../ui';

export function SetupScreen({ onOpenBackstage }: { onOpenBackstage: () => void }) {
  const { h } = useWindowSize();
  const hasPrizes = useAppStore((s) => Object.keys(s.prizes).length > 0);
  const hasPeople = useAppStore((s) => s.participants.length > 0);
  const items = [
    { ok: hasPrizes, label: 'Cadastrar os prêmios' },
    { ok: hasPeople, label: 'Importar os participantes' },
  ];
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <Presentinho mood="idle" size={Math.round(Math.min(h * 0.34, 320))} />
      <h1 className="text-[clamp(2.4rem,5vw,5rem)] font-black text-eel">Vamos preparar o sorteio!</h1>
      <ul className="flex flex-col gap-3">
        {items.map((it, i) => (
          <motion.li
            key={it.label}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 * i, type: 'spring', stiffness: 380, damping: 26 }}
            className="flex items-center gap-4 rounded-2xl border-2 border-b-4 border-swan bg-white px-6 py-3 text-2xl font-extrabold text-eel"
          >
            {it.ok ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-success text-white">
                <Check size={22} strokeWidth={4} />
              </span>
            ) : (
              <span role="status" aria-label="Aguardando" className="relative inline-flex h-9 w-9 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-4 border-swan" />
                <motion.span
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-feather"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                />
              </span>
            )}
            {it.label}
          </motion.li>
        ))}
      </ul>
      <Button size="lg" variant="secondary" onClick={onOpenBackstage}>
        Abrir bastidores
      </Button>
    </div>
  );
}
