import { animate, motion, useMotionValue, useReducedMotion, useTransform, useVelocity, type MotionValue } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { currentDraw, eligibleParticipants } from '../../domain/engine';
import type { Person } from '../../domain/types';
import { Presentinho } from '../../mascot/Presentinho';
import { useActions } from '../../store/actions';
import { useAppStore } from '../../store/appStore';
import { useView } from '../../store/hooks';
import { Avatar } from '../../ui';
import { burst } from '../confetti';
import { pacing } from '../pacing';
import { buildReelWithMargins, reelLength } from '../reel';
import { useWindowSize } from '../useWindowSize';
import { PrizeShowcase } from './PrizeShowcase';

const REEL_MARGIN = 2; // cartões extras acima do primeiro e abaixo do ganhador (o rolo nunca "acaba")
const SPRING_MS = 450; // o rolo passa um pouquinho do alvo e volta com uma mola (reserva no fim da duração)

/**
 * Um cartão do rolo em formato de tambor 3D: quanto mais longe do centro, mais inclinado, menor e
 * mais apagado; em alta velocidade ele borra (motion blur) e, ao parar, fica nítido e cresce.
 */
function ReelCard({ person, index, pos, vel, H }: { person: Person; index: number; pos: MotionValue<number>; vel: MotionValue<number>; H: number }) {
  const d = useTransform(pos, (p) => index - p); // distância ao centro, em linhas
  const y = useTransform(d, (v) => v * H * (1 - 0.07 * Math.min(Math.abs(v), 3)));
  const rotateX = useTransform(d, (v) => Math.max(-75, Math.min(75, -v * 26)));
  const scale = useTransform(d, (v) => 1.07 - 0.13 * Math.min(Math.abs(v), 3.2));
  const opacity = useTransform(d, (v) => {
    const a = Math.abs(v);
    return a > 3.2 ? 0 : Math.max(0, 1 - 0.3 * a);
  });
  const filter = useTransform([vel, d], (latest: number[]) => {
    const [v, dd] = latest;
    const blur = Math.min(7, Math.abs(v) * 0.32) * Math.min(1, 0.35 + Math.abs(dd) * 0.4);
    return blur < 0.3 ? 'none' : `blur(${blur.toFixed(1)}px)`;
  });

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-8 flex items-center gap-5 whitespace-nowrap px-6"
      style={{ top: `calc(50% - ${H / 2}px)`, height: H, y, rotateX, scale, opacity, filter, backfaceVisibility: 'hidden' }}
    >
      <Avatar name={person.name} email={person.email} size={Math.round(H * 0.6)} />
      <span className="truncate font-black text-eel" style={{ fontSize: H * 0.36 }}>
        {person.name}
      </span>
    </motion.div>
  );
}

export function DrawingScreen() {
  const actions = useActions();
  const view = useView();
  const reduced = useReducedMotion() ?? false;
  const suspense = useAppStore((s) => s.settings.suspenseSeconds);
  const seconds = suspense; // sempre o tempo configurado, mesmo com "reduzir movimento" no sistema

  const draw = currentDraw(view);
  // O ganhador já foi decidido e gravado antes da animação; o rolo só encena. Mais tempo = mais cartões.
  const [{ cards: reel, winnerIndex }] = useState(() =>
    draw
      ? buildReelWithMargins(
          eligibleParticipants(view),
          { id: draw.participantId, name: draw.name, email: draw.email },
          reelLength(seconds),
          REEL_MARGIN,
        )
      : { cards: [], winnerIndex: 0 },
  );
  const { w, h } = useWindowSize();
  const H = Math.max(84, Math.round(Math.min(h * 0.125, 132)));
  const width = Math.min(w * 0.62, 860);

  const pos = useMotionValue(REEL_MARGIN); // linha que está no centro (cresce até o ganhador)
  const vel = useVelocity(pos);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!draw) {
      actions.stageFinishDrawing();
      return;
    }
    let cancelled = false;
    let spring: ReturnType<typeof animate> | undefined;
    // Fase 1: corre com desaceleração longa e passa 0,22 linha do alvo. Fase 2: mola de volta ao alvo.
    const run = animate(pos, winnerIndex + 0.22, {
      duration: Math.max(1, seconds - SPRING_MS / 1000),
      ease: [0.16, 0.62, 0.12, 1],
    });
    void run.then(() => {
      if (!cancelled) spring = animate(pos, winnerIndex, { type: 'spring', stiffness: 170, damping: 13 });
    });
    // O fim do sorteio é decidido por timers (a animação é só visual).
    const lock = setTimeout(() => {
      setLocked(true);
      burst({ x: 0.5, y: 0.5 }, 70);
    }, seconds * 1000);
    const finish = setTimeout(() => actions.stageFinishDrawing(), seconds * 1000 + pacing().settleMs);
    return () => {
      cancelled = true;
      run.stop();
      spring?.stop();
      clearTimeout(lock);
      clearTimeout(finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <PrizeShowcase prizeId={draw?.prizeId} compact />
      <div className="flex items-center gap-[2vw]">
        <div className="hidden lg:block">
          <Presentinho mood={locked ? 'excited' : 'suspense'} size={Math.round(Math.min(h * 0.26, 240))} />
        </div>

        <div className="relative">
          <motion.div
            aria-hidden="true"
            className="absolute -inset-5 rounded-[56px] blur-2xl"
            style={{ background: 'linear-gradient(120deg, rgba(28,176,246,.4), rgba(206,130,255,.4), rgba(88,204,2,.4))' }}
            animate={locked ? { opacity: 1, scale: 1.05 } : { opacity: [0.45, 0.85, 0.45], scale: 1 }}
            transition={locked ? { duration: 0.4 } : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div
            aria-label="Sorteando"
            className="relative overflow-hidden rounded-[40px] border-4 border-white bg-gradient-to-b from-[#F1F8FF] via-white to-[#F1F8FF] shadow-2xl"
            style={{ width, height: 5 * H, perspective: 1100 }}
          >
            {reel.map((p, i) => (
              <ReelCard key={i} person={p} index={i} pos={pos} vel={vel} H={H} />
            ))}

            <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-white via-white/70 to-transparent" style={{ height: 1.5 * H }} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/70 to-transparent" style={{ height: 1.5 * H }} />

            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 rounded-[30px] border-[5px]"
              style={{ top: `calc(50% - ${H / 2 - 4}px)`, height: H - 8 }}
              animate={
                locked
                  ? { borderColor: '#58CC02', boxShadow: '0 0 0 8px rgba(88,204,2,.18), 0 0 50px rgba(88,204,2,.5)', scale: [1, 1.04, 1] }
                  : { borderColor: '#1CB0F6', boxShadow: '0 0 0 6px rgba(28,176,246,.12), 0 0 30px rgba(28,176,246,.3)', scale: 1 }
              }
              transition={{ duration: 0.45 }}
            />
          </div>

          <motion.div
            aria-hidden="true"
            className={`absolute -left-11 top-1/2 -translate-y-1/2 ${locked ? 'text-feather' : 'text-macaw'}`}
            animate={locked ? { x: 0 } : { x: [0, 7, 0] }}
            transition={{ duration: 0.7, repeat: locked ? 0 : Infinity }}
          >
            <ChevronRight size={44} strokeWidth={4} />
          </motion.div>
          <motion.div
            aria-hidden="true"
            className={`absolute -right-11 top-1/2 -translate-y-1/2 ${locked ? 'text-feather' : 'text-macaw'}`}
            animate={locked ? { x: 0 } : { x: [0, -7, 0] }}
            transition={{ duration: 0.7, repeat: locked ? 0 : Infinity }}
          >
            <ChevronLeft size={44} strokeWidth={4} />
          </motion.div>
        </div>
        <div className="hidden w-[10vw] lg:block" />
      </div>

      <motion.p
        className={`text-[clamp(1.4rem,2.2vw,2.4rem)] font-extrabold ${locked ? 'text-feather' : 'text-macaw'}`}
        animate={reduced || locked ? { opacity: 1 } : { opacity: [1, 0.45, 1] }}
        transition={{ duration: 1.2, repeat: locked ? 0 : Infinity }}
      >
        {locked ? 'Achamos!' : 'Sorteando…'}
      </motion.p>
    </div>
  );
}
