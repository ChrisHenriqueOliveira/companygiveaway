import type { ReactNode } from 'react';
import { cn } from './cn';

interface Props<T extends string> {
  tabs: Array<{ id: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border-2 border-b-4 px-4 py-2 text-sm font-extrabold uppercase tracking-wide transition',
              active
                ? 'border-macaw bg-[#DDF4FF] text-macaw'
                : 'border-swan bg-white text-wolf hover:bg-polar',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
