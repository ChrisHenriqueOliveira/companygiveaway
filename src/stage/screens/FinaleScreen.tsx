import { motion } from 'motion/react';
import { useEffect } from 'react';
import { Presentinho } from '../../mascot/Presentinho';
import { useAppStore } from '../../store/appStore';
import { Avatar } from '../../ui';
import { softRain } from '../confetti';

/** Mural final: de até 5×4 cartões; com mais de 20 ganhadores os cartões encolhem para caber. */
export function FinaleScreen() {
  const real = useAppStore((s) => s.draws);
  const rehearsal = useAppStore((s) => s.rehearsal);
  const source = rehearsal.active ? rehearsal.draws : real;
  const winners = source.filter((d) => d.status === 'confirmed');
  const n = winners.length;

  useEffect(() => softRain(), []);

  if (n === 0) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <Presentinho mood="idle" size={240} />
        <h1 className="text-5xl font-black text-eel">Ainda não há ganhadores</h1>
      </div>
    );
  }

  // Poucos ganhadores: cartões grandes. Até 20 cabem em 5×4; acima disso encolhem para caber.
  const tier = n <= 4 ? 0 : n <= 9 ? 1 : n <= 16 ? 2 : n <= 20 ? 3 : 4;
  const cols = [2, 3, 4, 5, n <= 30 ? 6 : 8][tier];
  const avatar = [112, 88, 72, 64, 44][tier];
  const nameVw = [2.6, 2.1, 1.7, 1.45, 1.1][tier];
  const maxWidth = [1100, 1500, 1700, 1700, 1800][tier];

  return (
    <div className="flex h-full w-full flex-col items-center gap-6 py-2">
      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="text-[clamp(2rem,4vw,4.2rem)] font-black text-feather"
      >
        Parabéns aos ganhadores!
      </motion.h1>
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <ul className="grid w-full gap-3" style={{ maxWidth, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {winners.map((d, i) => (
            <motion.li
              key={d.id}
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: Math.min(i * 0.05, 1.2) }}
              className="flex items-center gap-4 rounded-[22px] border-2 border-b-4 border-swan bg-white p-3.5"
            >
              <Avatar name={d.name} email={d.email} size={avatar} />
              <div className="min-w-0">
                <div className="break-words font-black leading-tight text-eel" style={{ fontSize: `clamp(0.95rem, ${nameVw}vw, 3rem)` }}>
                  {d.name}
                </div>
                <div className="break-words font-extrabold leading-tight text-feather-dark" style={{ fontSize: `clamp(0.8rem, ${nameVw * 0.72}vw, 2.2rem)` }}>
                  {d.prizeName}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
