import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useSyncExternalStore } from 'react';

type Kind = 'success' | 'error' | 'info';
interface Item {
  id: number;
  msg: string;
  kind: Kind;
}

let items: Item[] = [];
let counter = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function toast(msg: string, kind: Kind = 'info'): void {
  const item = { id: ++counter, msg, kind };
  items = [...items, item];
  emit();
  setTimeout(() => {
    items = items.filter((i) => i !== item);
    emit();
  }, 3800);
}

const STYLE: Record<Kind, { cls: string; icon: typeof Info }> = {
  success: { cls: 'border-feather-dark bg-feather text-white', icon: CheckCircle2 },
  error: { cls: 'border-cardinal-dark bg-cardinal text-white', icon: AlertTriangle },
  info: { cls: 'border-macaw-dark bg-macaw text-white', icon: Info },
};

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => items,
  );
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-3" aria-live="polite">
      <AnimatePresence>
        {list.map((t) => {
          const { cls, icon: Icon } = STYLE[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border-b-4 px-5 py-3 text-base font-extrabold shadow-lg ${cls}`}
            >
              <Icon size={22} strokeWidth={3} />
              {t.msg}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
