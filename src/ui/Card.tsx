import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[20px] border-2 border-b-4 border-swan bg-white', className)} {...rest} />;
}
