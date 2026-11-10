import { ImagePlus, X } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { compressImage } from '../io/image';
import { toast } from '../ui';

interface Props {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  ariaLabel: string;
  hint?: string;
}

export function ImagePicker({ value, onChange, ariaLabel, hint = 'Clique ou arraste uma imagem' }: Props) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const handle = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Escolha um arquivo de imagem.', 'error');
      return;
    }
    setBusy(true);
    try {
      onChange(await compressImage(file));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não consegui ler a imagem.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void handle(e.dataTransfer.files[0]);
  };

  return (
    <div className="relative">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 border-dashed text-center text-sm font-extrabold transition ${
          over ? 'border-macaw bg-[#DFF5F6] text-macaw' : 'border-swan bg-polar text-wolf hover:border-macaw hover:text-macaw'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={ariaLabel}
          onChange={(e) => {
            void handle(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {value ? (
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : (
          <>
            <ImagePlus size={30} strokeWidth={2.5} />
            <span>{busy ? 'Processando…' : hint}</span>
          </>
        )}
      </label>
      {value && (
        <button
          type="button"
          aria-label="Remover imagem"
          onClick={() => onChange(undefined)}
          className="absolute right-2 top-2 rounded-full bg-cardinal p-1 text-white shadow transition hover:bg-cardinal-dark"
        >
          <X size={16} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
