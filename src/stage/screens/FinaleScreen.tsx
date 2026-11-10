import { motion } from 'motion/react';
import { Gift, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { finaleLayout } from '../../domain/winners';
import { Presentinho } from '../../mascot/Presentinho';
import { useWinners } from '../../store/hooks';
import { Avatar } from '../../ui';
import { softRain } from '../confetti';
import { useWindowSize } from '../useWindowSize';

/** Cada prêmio ganha uma cor; ela liga visualmente a faixa do prêmio ao cartão do ganhador. */
const ACCENTS = [
  { bg: '#FD4237', fg: '#fff' },
  { bg: '#19A7AD', fg: '#fff' },
  { bg: '#FF8A3D', fg: '#fff' },
  { bg: '#8E5BD1', fg: '#fff' },
  { bg: '#FF6B8B', fg: '#fff' },
  { bg: '#FFB41F', fg: '#3B2F2E' },
] as const;

/**
 * Mural final: um cartão por ganhador, lendo de cima para baixo "o prêmio → quem ganhou":
 * imagem grande do prêmio, faixa colorida com o nome do prêmio e, embaixo, o ganhador.
 */
export function FinaleScreen() {
  const winners = useWinners();
  const { h } = useWindowSize();
  useEffect(() => softRain(), []);

  const n = winners.length;
  if (n === 0) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <Presentinho mood="idle" size={240} />
        <h1 className="text-5xl font-black text-eel">Ainda não há ganhadores</h1>
      </div>
    );
  }

  const L = finaleLayout(n);
  const imageH = Math.round((h * L.imageVh) / 100);
  const mascot = Math.max(72, Math.round(Math.min(h * 0.13, 130)));

  return (
    <div className="flex w-full flex-col items-center gap-[2vh]">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="flex items-center gap-5"
      >
        <Presentinho mood="celebrate" size={mascot} />
        <div className="flex flex-col items-start leading-tight">
          <h1 className="text-[clamp(2rem,3.6vw,4rem)] font-black text-feather">Parabéns aos ganhadores!</h1>
          <span className="inline-flex items-center gap-2 text-[clamp(1rem,1.5vw,1.6rem)] font-extrabold text-wolf">
            <Trophy size={20} strokeWidth={3} className="text-bee-dark" />
            {n === 1 ? '1 sortudo' : `${n} sortudos`}
          </span>
        </div>
      </motion.div>

      <ul
        className="grid w-full gap-[1.2vw]"
        style={{ gridTemplateColumns: `repeat(${L.cols}, minmax(0, 1fr))`, maxWidth: Math.min(1800, L.cols * 420) }}
      >
        {winners.map((w, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <motion.li
              key={w.draw.id}
              aria-label={`${w.draw.name} ganhou ${w.prizeName}`}
              initial={{ scale: 0.6, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: Math.min(0.3 + i * 0.07, 1.8) }}
              className="relative flex flex-col overflow-hidden rounded-[22px] border-2 border-b-[6px] border-swan bg-white shadow-sm"
            >
              <div
                className="relative flex items-center justify-center"
                style={{ height: imageH, background: `${accent.bg}1f` }}
              >
                {w.image ? (
                  <img src={w.image} alt="" className="h-full w-full object-contain p-2" />
                ) : (
                  <Gift size={Math.round(imageH * 0.5)} strokeWidth={2.2} style={{ color: accent.bg }} />
                )}
                <span
                  className="absolute left-2 top-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-bee px-2 text-sm font-black text-eel shadow"
                  aria-hidden="true"
                >
                  {w.order}º
                </span>
              </div>

              <div
                title={w.prizeName}
                className="flex min-h-[2.9em] items-center justify-center break-words px-3 py-1.5 text-center font-black leading-tight"
                style={{ background: accent.bg, color: accent.fg, fontSize: `clamp(0.8rem, ${L.nameVw * 0.78}vw, 2rem)` }}
              >
                <span className="line-clamp-2">{w.prizeName}</span>
              </div>

              <div className="flex flex-1 items-center gap-3 p-3">
                <Avatar name={w.draw.name} email={w.draw.email} size={L.avatar} />
                <div
                  title={w.draw.name}
                  className="line-clamp-3 min-w-0 break-words font-black leading-tight text-eel"
                  style={{ fontSize: `clamp(0.95rem, ${L.nameVw}vw, 3rem)` }}
                >
                  {w.draw.name}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
