import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-extrabold uppercase tracking-wider text-wolf">{label}</span>
      {children}
      {error && <span className="text-sm font-bold text-cardinal">{error}</span>}
    </label>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border-2 border-swan bg-polar px-4 py-3 font-bold text-eel outline-none transition placeholder:text-[#B3A5A2] focus:border-feather focus:bg-white',
        className,
      )}
      {...rest}
    />
  );
}
