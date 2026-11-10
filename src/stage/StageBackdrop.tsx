import { motion, useReducedMotion } from 'motion/react';
import { ViceriMark } from '../brand/ViceriMark';

/** Anéis da marca flutuando bem de leve ao fundo: dão a cara da Viceri sem competir com o conteúdo. */
const MARKS = [
  { x: -3, y: -6, s: 300, c: '#FD4237', o: 0.07, r: -12 },
  { x: 84, y: 52, s: 360, c: '#FF8A3D', o: 0.06, r: 28 },
  { x: 66, y: -10, s: 140, c: '#FFB41F', o: 0.11, r: 10 },
  { x: 8, y: 66, s: 190, c: '#19A7AD', o: 0.07, r: 160 },
  { x: 40, y: 82, s: 110, c: '#FD4237', o: 0.1, r: -30 },
  { x: 92, y: -4, s: 90, c: '#8E5BD1', o: 0.08, r: 200 },
  { x: 24, y: 24, s: 70, c: '#FF6B8B', o: 0.1, r: 70 },
  { x: 70, y: 78, s: 120, c: '#FFB41F', o: 0.09, r: -70 },
] as const;

export function StageBackdrop() {
  const reduced = useReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {MARKS.map((m, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${m.x}%`, top: `${m.y}%`, opacity: m.o, rotate: m.r }}
          animate={reduced ? undefined : { y: [0, -16, 0], rotate: [m.r, m.r + (i % 2 ? 9 : -9), m.r] }}
          transition={{ duration: 7 + (i % 4) * 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        >
          <ViceriMark size={m.s} color={m.c} />
        </motion.div>
      ))}
    </div>
  );
}
