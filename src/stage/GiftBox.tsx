import { motion } from 'motion/react';
import { BRAND_RED, BRAND_RED_DARK, MARK_PATH } from '../brand/mark';

/** Caixa de presente da marca: vermelha, com fita âmbar e o anel da Viceri estampado na frente. */
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
      transition={shaking ? { duration: 1.1, ease: 'easeInOut', repeat: Infinity } : { duration: 0.4 }}
    >
      <ellipse cx="120" cy="238" rx="86" ry="9" fill="#000" opacity="0.08" />
      <rect x="34" y="112" width="172" height="124" rx="16" fill={BRAND_RED_DARK} />
      <rect x="34" y="106" width="172" height="124" rx="16" fill={BRAND_RED} />
      {/* o anel da marca estampado na frente da caixa */}
      <g transform="translate(75 126) scale(0.42)">
        <path d={MARK_PATH} fill="#fff" fillRule="evenodd" opacity="0.95" />
      </g>
      <motion.g
        animate={popped ? { y: -240, rotate: -24, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <rect x="22" y="72" width="196" height="46" rx="14" fill="#D9342A" />
        <rect x="22" y="66" width="196" height="46" rx="14" fill="#FF6B60" />
        <rect x="104" y="66" width="32" height="46" fill="#FFB41F" />
        <ellipse cx="92" cy="50" rx="30" ry="17" transform="rotate(-22 92 50)" fill="#FFB41F" stroke="#D99200" strokeWidth="4" />
        <ellipse cx="148" cy="50" rx="30" ry="17" transform="rotate(22 148 50)" fill="#FFB41F" stroke="#D99200" strokeWidth="4" />
        <circle cx="120" cy="60" r="13" fill="#FFCB5C" stroke="#D99200" strokeWidth="4" />
      </motion.g>
    </motion.svg>
  );
}
