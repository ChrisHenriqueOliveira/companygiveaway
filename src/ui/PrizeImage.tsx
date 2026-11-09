import { Gift } from 'lucide-react';

export function PrizeImage({ src, size = 48, className = '' }: { src?: string; size?: number; className?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`shrink-0 rounded-xl border-2 border-swan bg-white object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-[#FFF5CC] text-bee-dark ${className}`}
      style={{ width: size, height: size }}
    >
      <Gift size={size * 0.5} strokeWidth={2.5} />
    </span>
  );
}
