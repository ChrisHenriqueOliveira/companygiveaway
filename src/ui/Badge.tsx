import type { ReactNode } from 'react';
import { cn } from './cn';

const COLORS = {
  green: 'bg-success-tint text-success-dark',
  blue: 'bg-macaw-tint text-macaw-dark',
  red: 'bg-cardinal-tint text-cardinal-dark',
  yellow: 'bg-bee-tint text-fox',
  purple: 'bg-beetle-tint text-beetle-dark',
  gray: 'bg-polar text-wolf',
} as const;

export function Badge({ color = 'gray', children, className }: { color?: keyof typeof COLORS; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide', COLORS[color], className)}>
      {children}
    </span>
  );
}
