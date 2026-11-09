import { useAppStore } from '../../store/appStore';
import { PrizeImage } from '../../ui/PrizeImage';

/** Imagem + nome do prêmio. O palco nunca mostra mais do que o prêmio da vez. */
export function PrizeShowcase({ prizeId, compact = false }: { prizeId?: string; compact?: boolean }) {
  const prize = useAppStore((s) => (prizeId ? s.prizes[prizeId] : undefined));
  const image = useAppStore((s) => (prize?.imageId ? s.images[prize.imageId] : undefined));
  if (!prize) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-[28px] border-2 border-b-[6px] border-swan bg-white px-6 py-3">
        <PrizeImage src={image} size={64} />
        <span className="text-[clamp(1.5rem,2.6vw,2.8rem)] font-black text-eel">{prize.name}</span>
      </div>
    );
  }
  return (
    <div className="flex max-w-[80vw] flex-col items-center gap-5 text-center">
      <PrizeImage src={image} fit="contain" size={Math.round(Math.min(window.innerHeight * 0.38, 400))} className="!rounded-[36px] !border-4 shadow-xl" />
      <span className="text-[clamp(2.2rem,5vw,5.5rem)] font-black leading-tight text-eel">{prize.name}</span>
    </div>
  );
}
