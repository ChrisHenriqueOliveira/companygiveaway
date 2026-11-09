import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

/** Só o modal do topo reage ao Esc (um ConfirmDialog dentro dos Bastidores, por exemplo). */
const stack: string[] = [];

const SIZE = {
  md: 'w-full max-w-lg',
  lg: 'w-full max-w-4xl',
  full: 'h-full w-full max-w-[1500px]',
} as const;

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: keyof typeof SIZE;
  children: ReactNode;
}

export function Modal({ open, onClose, title, size = 'md', children }: Props) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    stack.push(id);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey, true);
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey, true);
      stack.splice(stack.indexOf(id), 1);
      prev?.focus?.();
    };
  }, [open, id]);

  const trapTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !panel.current) return;
    const els = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onKeyDown={trapTab}
            className={cn(
              'flex max-h-full flex-col overflow-hidden rounded-[28px] border-2 border-b-[6px] border-swan bg-white shadow-2xl outline-none',
              SIZE[size],
            )}
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <div className="flex items-center justify-between gap-4 border-b-2 border-swan px-6 py-4">
              <h2 className="text-2xl font-black text-eel">{title}</h2>
              <button
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="rounded-xl p-2 text-wolf transition hover:bg-polar hover:text-eel"
              >
                <X size={26} strokeWidth={3} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
