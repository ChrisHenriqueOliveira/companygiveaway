import { motion } from 'motion/react';

/** Caixa de presente que balança e estoura a tampa. Azul, para não ser confundida com o mascote. */
export function GiftBox({ size = 320, shaking, popped }: { size?: number; shaking: boolean; popped: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 240 250"
      width={size}
      height={size * 1.04}
      role="img"
      aria-label="Caixa de presente"
      style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
      animate={shaking ? { rotate: [0, -7, 7, -7, 7, -4, 4, 0], y: [0, -6, 0, -6, 0] } : { rotate: 0, scale: popped ? [1, 1.08, 1] : 1 }}
      transition={shaking ? { duration: 1.2, ease: 'easeInOut' } : { duration: 0.4 }}
    >
      <ellipse cx="120" cy="238" rx="86" ry="9" fill="#000" opacity="0.08" />
      <rect x="34" y="112" width="172" height="124" rx="16" fill="#1899D6" />
      <rect x="34" y="106" width="172" height="124" rx="16" fill="#1CB0F6" />
      <rect x="104" y="106" width="32" height="124" fill="#FFC800" />
      <motion.g
        animate={popped ? { y: -240, rotate: -24, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <rect x="22" y="72" width="196" height="46" rx="14" fill="#1899D6" />
        <rect x="22" y="66" width="196" height="46" rx="14" fill="#49C0F8" />
        <rect x="104" y="66" width="32" height="46" fill="#FFC800" />
        <ellipse cx="92" cy="50" rx="30" ry="17" transform="rotate(-22 92 50)" fill="#FFC800" stroke="#E5B400" strokeWidth="4" />
        <ellipse cx="148" cy="50" rx="30" ry="17" transform="rotate(22 148 50)" fill="#FFC800" stroke="#E5B400" strokeWidth="4" />
        <circle cx="120" cy="60" r="13" fill="#FFD84D" stroke="#E5B400" strokeWidth="4" />
      </motion.g>
    </motion.svg>
  );
}
