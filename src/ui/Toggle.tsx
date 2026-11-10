import { motion } from 'motion/react';
import { cn } from './cn';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 text-left font-extrabold text-eel"
    >
      <span
        className={cn(
          'relative h-8 w-14 shrink-0 rounded-full border-b-4 transition-colors',
          checked ? 'border-feather-dark bg-feather' : 'border-[#DCCFCC] bg-swan',
        )}
      >
        <motion.span
          className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow"
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </span>
      {label}
    </button>
  );
}
