import { Gift } from 'lucide-react';

export function PrizeImage({ src, size = 48, className = '', fit = 'cover' }: { src?: string; size?: number; className?: string; fit?: 'cover' | 'contain' }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`shrink-0 rounded-xl border-2 border-swan bg-white ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-[#FFF3D4] text-bee-dark ${className}`}
      style={{ width: size, height: size }}
    >
      <Gift size={size * 0.5} strokeWidth={2.5} />
    </span>
  );
}
