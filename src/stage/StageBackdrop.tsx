import { motion, useReducedMotion } from 'motion/react';

const SHAPES = [
  { x: 6, y: 12, s: 46, c: '#58CC02', t: 'circle' },
  { x: 90, y: 10, s: 38, c: '#1CB0F6', t: 'square' },
  { x: 14, y: 46, s: 30, c: '#FFC800', t: 'tri' },
  { x: 94, y: 42, s: 52, c: '#CE82FF', t: 'circle' },
  { x: 4, y: 80, s: 40, c: '#FF4B4B', t: 'square' },
  { x: 88, y: 84, s: 34, c: '#FF9600', t: 'tri' },
  { x: 24, y: 90, s: 28, c: '#1CB0F6', t: 'circle' },
  { x: 74, y: 6, s: 26, c: '#FFC800', t: 'square' },
  { x: 38, y: 6, s: 22, c: '#CE82FF', t: 'tri' },
  { x: 62, y: 92, s: 44, c: '#58CC02', t: 'square' },
  { x: 80, y: 62, s: 24, c: '#FF4B4B', t: 'circle' },
  { x: 10, y: 64, s: 22, c: '#58CC02', t: 'tri' },
] as const;

/** Confetes geométricos suaves ao fundo: dão a cara de festa sem competir com o conteúdo. */
export function StageBackdrop() {
  const reduced = useReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {SHAPES.map((sh, i) => (
        <motion.div
          key={i}
          className="absolute opacity-[0.16]"
          style={{
            left: `${sh.x}%`,
            top: `${sh.y}%`,
            width: sh.s,
            height: sh.s,
            background: sh.t === 'tri' ? 'transparent' : sh.c,
            borderRadius: sh.t === 'circle' ? '50%' : sh.t === 'square' ? 10 : 0,
            borderLeft: sh.t === 'tri' ? `${sh.s / 2}px solid transparent` : undefined,
            borderRight: sh.t === 'tri' ? `${sh.s / 2}px solid transparent` : undefined,
            borderBottom: sh.t === 'tri' ? `${sh.s}px solid ${sh.c}` : undefined,
          }}
          animate={reduced ? undefined : { y: [0, -14, 0], rotate: [0, i % 2 ? 14 : -14, 0] }}
          transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}
