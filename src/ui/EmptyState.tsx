import type { ReactNode } from 'react';
import { Presentinho, type Mood } from '../mascot/Presentinho';

export function EmptyState({ mood = 'idle', title, description, action }: { mood?: Mood; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Presentinho mood={mood} size={110} />
      <h3 className="text-2xl font-black text-eel">{title}</h3>
      {description && <p className="max-w-md text-base font-bold text-wolf">{description}</p>}
      {action}
    </div>
  );
}
