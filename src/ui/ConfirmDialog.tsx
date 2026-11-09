import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { TextInput } from './Field';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  requireText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger,
  requireText,
  onConfirm,
  onCancel,
}: Props) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);
  const ok = !requireText || typed === requireText;

  return (
    <Modal open={open} onClose={onCancel} title={title} size="md">
      <div className="flex flex-col gap-5">
        <div className="text-lg font-bold text-eel">{message}</div>
        {requireText && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-wolf">
              Para confirmar, digite <b className="text-cardinal">{requireText}</b>
            </span>
            <TextInput
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label={`Digite ${requireText}`}
              onKeyDown={(e) => e.key === 'Enter' && ok && onConfirm()}
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} disabled={!ok} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
