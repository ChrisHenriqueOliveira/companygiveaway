import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react';

export type Mood = 'idle' | 'excited' | 'suspense' | 'celebrate' | 'sad';

const INK = '#4B4B4B';

function bodyAnim(mood: Mood, reduced: boolean): TargetAndTransition {
  if (reduced) return mood === 'sad' ? { rotate: 5, y: 6 } : {};
  switch (mood) {
    case 'idle':
      return { y: [0, -6, 0], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } };
    case 'excited':
      return { y: [0, -14, 0], transition: { duration: 0.5, repeat: Infinity, ease: 'easeOut' } };
    case 'suspense':
      return { x: [-3, 3, -3], transition: { duration: 0.14, repeat: Infinity } };
    case 'celebrate':
      return {
        y: [0, -30, 0],
        rotate: [0, -7, 7, 0],
        transition: { duration: 0.65, repeat: Infinity, ease: 'easeOut' },
      };
    case 'sad':
      return { rotate: 5, y: 6, transition: { type: 'spring' } };
  }
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'excited':
      return (
        <>
          <ellipse cx="100" cy="156" rx="10" ry="11" fill={INK} />
          <ellipse cx="100" cy="162" rx="6" ry="4" fill="#FF8FA3" />
        </>
      );
    case 'suspense':
      return <path d="M86 157 Q93 150 100 157 T114 157" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;
    case 'celebrate':
      return (
        <>
          <path d="M80 148 Q100 182 120 148 Z" fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth="4" />
          <ellipse cx="100" cy="163" rx="9" ry="5" fill="#FF6F91" />
        </>
      );
    case 'sad':
      return <path d="M86 164 Q100 148 114 164" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M86 150 Q100 166 114 150" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;
  }
}

function Eyes({ mood, reduced }: { mood: Mood; reduced: boolean }) {
  if (mood === 'celebrate') {
    return (
      <g stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M56 134 Q72 112 88 134" />
        <path d="M112 134 Q128 112 144 134" />
      </g>
    );
  }
  const dx = mood === 'suspense' ? 4 : 0;
  const dy = mood === 'sad' ? 5 : mood === 'suspense' ? -3 : 0;
  const rx = mood === 'excited' ? 17 : 15;
  const ry = mood === 'excited' ? 21 : 19;
  const blink = !reduced && (mood === 'idle' || mood === 'excited');
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={blink ? { scaleY: [1, 1, 1, 0.08, 1] } : { scaleY: 1 }}
      transition={blink ? { duration: 4, repeat: Infinity, times: [0, 0.45, 0.9, 0.94, 1] } : undefined}
    >
      {[72, 128].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="128" rx={rx} ry={ry} fill="#fff" stroke="#E5E5E5" strokeWidth="2" />
          <circle cx={cx + dx} cy={128 + dy} r="8.5" fill={INK} />
          <circle cx={cx + dx + 3} cy={128 + dy - 3} r="3" fill="#fff" />
        </g>
      ))}
      {mood === 'suspense' && (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M55 103 L85 112" />
          <path d="M145 103 L115 112" />
        </g>
      )}
      {mood === 'sad' && (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M57 112 L85 104" />
          <path d="M143 112 L115 104" />
        </g>
      )}
    </motion.g>
  );
}

/** Mascote original do sorteio: uma caixa de presente expressiva. */
export function Presentinho({ mood = 'idle', size = 200 }: { mood?: Mood; size?: number }) {
  const reduced = useReducedMotion() ?? false;
  const spinBow = mood === 'celebrate' && !reduced;
  return (
    <svg
      viewBox="0 0 200 210"
      width={size}
      height={size * 1.05}
      role="img"
      aria-label="Presentinho, o mascote do sorteio"
    >
      <ellipse cx="100" cy="199" rx="54" ry="7" fill="#000" opacity="0.08" />
      <motion.g
        key={mood}
        style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        animate={bodyAnim(mood, reduced)}
      >
        {mood === 'celebrate' && (
          <g fill="#58CC02" stroke="#58A700" strokeWidth="3">
            <rect x="8" y="112" width="40" height="16" rx="8" transform="rotate(-48 40 120)" />
            <rect x="152" y="112" width="40" height="16" rx="8" transform="rotate(48 160 120)" />
          </g>
        )}
        <rect x="40" y="88" width="120" height="100" rx="18" fill="#58A700" />
        <rect x="40" y="82" width="120" height="100" rx="18" fill="#58CC02" />
        <rect x="30" y="68" width="140" height="34" rx="12" fill="#6DBF0A" />
        <rect x="30" y="62" width="140" height="34" rx="12" fill="#89E219" />
        <rect x="92" y="62" width="16" height="34" fill="#FFC800" />
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={spinBow ? { rotate: 360 } : { rotate: 0 }}
          transition={spinBow ? { duration: 0.9, repeat: Infinity, ease: 'linear' } : undefined}
        >
          <ellipse cx="82" cy="50" rx="19" ry="11" transform="rotate(-20 82 50)" fill="#FFC800" stroke="#E5B400" strokeWidth="3" />
          <ellipse cx="118" cy="50" rx="19" ry="11" transform="rotate(20 118 50)" fill="#FFC800" stroke="#E5B400" strokeWidth="3" />
          <circle cx="100" cy="56" r="9" fill="#FFD84D" stroke="#E5B400" strokeWidth="3" />
        </motion.g>
        <Eyes mood={mood} reduced={reduced} />
        <circle cx="50" cy="148" r="7" fill="#FF8FA3" opacity="0.55" />
        <circle cx="150" cy="148" r="7" fill="#FF8FA3" opacity="0.55" />
        <Mouth mood={mood} />
        {mood === 'sad' && <ellipse cx="54" cy="150" rx="4" ry="6" fill="#7FD6FF" />}
      </motion.g>
    </svg>
  );
}
