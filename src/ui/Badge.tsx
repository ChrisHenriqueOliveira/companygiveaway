import type { ReactNode } from 'react';
import { cn } from './cn';

const COLORS = {
  green: 'bg-[#D7FFB8] text-feather-dark',
  blue: 'bg-[#DDF4FF] text-macaw-dark',
  red: 'bg-[#FFDFE0] text-cardinal-dark',
  yellow: 'bg-[#FFF5CC] text-fox',
  purple: 'bg-[#F3E1FF] text-[#A560E8]',
  gray: 'bg-polar text-wolf',
} as const;

export function Badge({ color = 'gray', children, className }: { color?: keyof typeof COLORS; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide', COLORS[color], className)}>
      {children}
    </span>
  );
}
