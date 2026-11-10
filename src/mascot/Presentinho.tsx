import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react';
import { BRAND_RED, BRAND_RED_DARK, MARK_CENTER, MARK_PATH } from '../brand/mark';

export type Mood = 'idle' | 'excited' | 'suspense' | 'celebrate' | 'sad';

const INK = '#3B2F2E';
const CHEEK = '#FF8F86';
const TONGUE = '#FF6B8B';
const AMBER = '#FFB41F';
const TEAL = '#19A7AD';

const AROUND_CENTER = { transformBox: 'view-box', transformOrigin: `${MARK_CENTER.x}px ${MARK_CENTER.y}px` } as const;

function bodyAnim(mood: Mood, reduced: boolean): TargetAndTransition {
  if (reduced) return mood === 'sad' ? { rotate: 7, y: 8 } : {};
  switch (mood) {
    case 'idle':
      return { y: [0, -7, 0], rotate: [0, -1.5, 0, 1.5, 0], transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } };
    case 'excited':
      return { y: [0, -16, 0], scale: [1, 1.04, 1], transition: { duration: 0.5, repeat: Infinity, ease: 'easeOut' } };
    case 'suspense':
      return { x: [-3, 3, -3], rotate: [-2, 2, -2], transition: { duration: 0.13, repeat: Infinity } };
    case 'celebrate':
      return { y: [0, -34, 0], transition: { duration: 0.65, repeat: Infinity, ease: 'easeOut' } };
    case 'sad':
      return { rotate: 7, y: 8, transition: { type: 'spring' } };
  }
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'excited':
      return (
        <>
          <ellipse cx="114" cy="122" rx="12" ry="13" fill={INK} />
          <ellipse cx="114" cy="130" rx="7" ry="5" fill={TONGUE} />
        </>
      );
    case 'suspense':
      return <path d="M96 126 Q105 118 114 126 T132 126" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;
    case 'celebrate':
      return (
        <>
          <path d="M90 112 Q114 154 138 112 Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <ellipse cx="114" cy="133" rx="11" ry="6" fill={TONGUE} />
        </>
      );
    case 'sad':
      return <path d="M98 130 Q114 112 130 130" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M96 116 Q114 136 132 116" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;
  }
}

function Eyes({ mood, reduced }: { mood: Mood; reduced: boolean }) {
  if (mood === 'celebrate') {
    return (
      <g stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M72 90 Q86 68 100 90" />
        <path d="M126 86 Q140 64 154 86" />
      </g>
    );
  }
  const dx = mood === 'suspense' ? 4 : 0;
  const dy = mood === 'sad' ? 3 : 0;
  const rx = mood === 'excited' ? 11 : 9.5;
  const ry = mood === 'excited' ? 14 : mood === 'sad' ? 11.5 : 12.5;
  const blink = !reduced && (mood === 'idle' || mood === 'excited');
  return (
    <>
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={blink ? { scaleY: [1, 1, 1, 0.08, 1] } : { scaleY: 1 }}
        transition={blink ? { duration: 4, repeat: Infinity, times: [0, 0.45, 0.9, 0.94, 1] } : undefined}
      >
        {[
          [86, 84],
          [140, 80],
        ].map(([cx, cy]) => (
          <g key={cx}>
            <ellipse cx={cx + dx} cy={cy + dy} rx={rx} ry={ry} fill={INK} />
            <circle cx={cx + dx + 3.5} cy={cy + dy - 4.5} r="3.6" fill="#fff" />
            <circle cx={cx + dx - 3} cy={cy + dy + 4.5} r="1.7" fill="#fff" opacity="0.85" />
          </g>
        ))}
      </motion.g>
      {mood === 'suspense' && (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M68 64 L102 72" />
          <path d="M156 60 L124 69" />
        </g>
      )}
      {mood === 'sad' && (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M66 70 L100 62" />
          <path d="M160 66 L128 58" />
        </g>
      )}
    </>
  );
}

function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.path
      d="M0 -11 L3.2 -3.2 L11 0 L3.2 3.2 L0 11 L-3.2 3.2 L-11 0 L-3.2 -3.2 Z"
      fill={AMBER}
      style={{ x, y, transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={{ scale: [0.2, 1.1, 0.2], rotate: [0, 90, 180], opacity: [0, 1, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, delay }}
    />
  );
}

/**
 * Mascote da Viceri ("Vi"): o próprio anel do logo é o corpo, e o rosto mora dentro do furo.
 * Na comemoração o anel gira em volta do rosto; na tensão ele treme e escorre suor.
 */
export function Mascot({ mood = 'idle', size = 200 }: { mood?: Mood; size?: number }) {
  const reduced = useReducedMotion() ?? false;
  const spin = mood === 'celebrate' && !reduced;
  return (
    <svg
      viewBox="0 0 213 215"
      width={size}
      height={size * (215 / 213)}
      role="img"
      aria-label="Vi, o mascote da Viceri"
      overflow="visible"
    >
      <ellipse cx="110" cy="206" rx="64" ry="8" fill="#000" opacity="0.08" />
      <motion.g
        key={mood}
        style={{ transformBox: 'view-box', transformOrigin: '110px 200px' }}
        animate={bodyAnim(mood, reduced)}
      >
        <motion.g
          style={AROUND_CENTER}
          animate={spin ? { rotate: 360 } : { rotate: 0 }}
          transition={spin ? { duration: 1.2, repeat: Infinity, repeatDelay: 0.35, ease: 'easeInOut' } : undefined}
        >
          <path d={MARK_PATH} fill={BRAND_RED_DARK} fillRule="evenodd" transform="translate(0 7)" />
          <path d={MARK_PATH} fill={BRAND_RED} fillRule="evenodd" />
          <path d="M26 72 C 34 46, 60 28, 90 20" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" fill="none" />
        </motion.g>

        <g transform={`rotate(-5 ${MARK_CENTER.x} ${MARK_CENTER.y})`}>
          <Eyes mood={mood} reduced={reduced} />
          <circle cx="64" cy="106" r="8" fill={CHEEK} opacity="0.55" />
          <circle cx="162" cy="100" r="8" fill={CHEEK} opacity="0.55" />
          <Mouth mood={mood} />
        </g>

        {mood === 'suspense' && (
          <motion.path
            d="M0 -8 Q9 6 0 12 Q-9 6 0 -8 Z"
            fill={TEAL}
            style={{ x: 176, y: 40 }}
            animate={{ y: [40, 62], opacity: [1, 0] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        )}
        {mood === 'sad' && <ellipse cx="66" cy="124" rx="4.5" ry="7" fill="#8FDDE0" />}
        {mood === 'celebrate' && (
          <>
            <Sparkle x={14} y={22} delay={0} />
            <Sparkle x={202} y={30} delay={0.35} />
            <Sparkle x={196} y={176} delay={0.7} />
            <Sparkle x={22} y={168} delay={0.5} />
          </>
        )}
      </motion.g>
    </svg>
  );
}

/** Nome antigo mantido para os imports existentes. */
export const Presentinho = Mascot;
