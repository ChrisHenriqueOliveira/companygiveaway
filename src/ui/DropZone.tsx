import { useState, type DragEvent, type ReactNode } from 'react';
import { cn } from './cn';

/** Props de arrastar-e-soltar um arquivo (planilha) sobre qualquer elemento. */
export function useFileDrop(onFile: (file: File) => void) {
  const [over, setOver] = useState(false);
  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
  return {
    over,
    props: {
      onDragOver: (e: DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: (e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      },
      onDrop: (e: DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) onFile(file);
      },
    },
  };
}

/** Área "escolher ou arrastar a planilha". */
export function DropZone({
  onFile,
  ariaLabel,
  icon,
  title,
  hint,
}: {
  onFile: (file: File) => void;
  ariaLabel: string;
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  const { over, props } = useFileDrop(onFile);
  return (
    <label
      {...props}
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-5 transition',
        over ? 'scale-[1.01] border-feather bg-[#FFF1F0]' : 'border-swan bg-polar hover:border-macaw',
      )}
    >
      {icon}
      <span className="flex flex-col">
        <span className="text-lg font-extrabold text-eel">{over ? 'Solte a planilha aqui' : title}</span>
        <span className="text-sm font-bold text-wolf">{hint}</span>
      </span>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="sr-only"
        aria-label={ariaLabel}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </label>
  );
}
