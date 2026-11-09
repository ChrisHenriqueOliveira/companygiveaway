import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
export type ButtonSize = 'md' | 'lg' | 'xl';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'btn-feather',
  secondary: 'btn-macaw',
  danger: 'btn-cardinal',
  warning: 'btn-bee',
  ghost: 'btn-ghost',
};

const SIZE: Record<ButtonSize, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
  xl: 'rounded-[24px] px-14 py-6 text-3xl',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, className, children, ...rest }: Props) {
  return (
    <button type="button" className={cn('btn-3d', VARIANT[variant], SIZE[size], className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}
