import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { currentDraw, eligibleParticipants } from '../../domain/engine';
import { Presentinho } from '../../mascot/Presentinho';
import { useActions } from '../../store/actions';
import { useAppStore } from '../../store/appStore';
import { useView } from '../../store/hooks';
import { Avatar } from '../../ui';
import { buildReel } from '../reel';
import { PrizeShowcase } from './PrizeShowcase';

const REEL_LENGTH = 36;
const SETTLE_MS = 600; // pausa com o ganhador centralizado antes da revelação

export function DrawingScreen() {
  const actions = useActions();
  const view = useView();
  const reduced = useReducedMotion() ?? false;
  const suspense = useAppStore((s) => s.settings.suspenseSeconds);
  const seconds = reduced ? Math.min(2, suspense) : suspense;

  const draw = currentDraw(view);
  // O ganhador já foi decidido e gravado antes da animação; o rolo só encena.
  const [reel] = useState(() =>
    draw
      ? buildReel(eligibleParticipants(view), { id: draw.participantId, name: draw.name, email: draw.email }, REEL_LENGTH)
      : [],
  );
  const [H] = useState(() => Math.max(84, Math.round(Math.min(window.innerHeight * 0.125, 132))));

  useEffect(() => {
    if (!draw) {
      actions.stageFinishDrawing();
      return;
    }
    const t = setTimeout(() => actions.stageFinishDrawing(), seconds * 1000 + SETTLE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const N = reel.length;
  const startY = 2 * H;
  const endY = -(N - 3) * H;
  const width = Math.min(window.innerWidth * 0.62, 820);

  return (
    <div className="flex flex-col items-center gap-6">
      <PrizeShowcase prizeId={draw?.prizeId} compact />
      <div className="flex items-center gap-[2vw]">
        <div className="hidden lg:block">
          <Presentinho mood="suspense" size={Math.round(Math.min(window.innerHeight * 0.26, 240))} />
        </div>
        <div
          aria-label="Sorteando"
          className="relative overflow-hidden rounded-[36px] border-4 border-swan bg-white shadow-xl"
          style={{ width, height: 5 * H }}
        >
          <motion.ul
            initial={{ y: startY }}
            animate={{ y: endY }}
            transition={{ duration: seconds, ease: [0.12, 0.7, 0.1, 1] }}
          >
            {reel.map((p, i) => (
              <li key={i} className="flex items-center gap-5 px-8" style={{ height: H }}>
                <Avatar name={p.name} email={p.email} size={Math.round(H * 0.62)} />
                <span className="truncate font-black text-eel" style={{ fontSize: H * 0.36 }}>
                  {p.name}
                </span>
              </li>
            ))}
          </motion.ul>
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-white via-white/80 to-transparent" style={{ height: 1.7 * H }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 to-transparent" style={{ height: 1.7 * H }} />
          <div
            className="pointer-events-none absolute inset-x-4 rounded-[28px] border-4 border-macaw bg-macaw/5"
            style={{ top: 2 * H + 4, height: H - 8 }}
          />
        </div>
        <div className="hidden w-[10vw] lg:block" />
      </div>
      <motion.p
        className="text-[clamp(1.4rem,2.2vw,2.4rem)] font-extrabold text-macaw"
        animate={reduced ? undefined : { opacity: [1, 0.45, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        Sorteando…
      </motion.p>
    </div>
  );
}
