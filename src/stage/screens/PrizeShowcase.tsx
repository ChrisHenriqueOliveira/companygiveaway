import { useAppStore } from '../../store/appStore';
import { PrizeImage } from '../../ui/PrizeImage';
import { useWindowSize } from '../useWindowSize';

/** Imagem + nome do prêmio. O palco nunca mostra mais do que o prêmio da vez. */
export function PrizeShowcase({ prizeId, compact = false }: { prizeId?: string; compact?: boolean }) {
  const { h } = useWindowSize();
  const prize = useAppStore((s) => (prizeId ? s.prizes[prizeId] : undefined));
  const image = useAppStore((s) => (prize?.imageId ? s.images[prize.imageId] : undefined));
  if (!prize) return null;

  if (compact) {
    // Durante o rolo: imagem em destaque acima do nome (menor que na revelação do ganhador).
    return (
      <div className="flex max-w-[80vw] flex-col items-center gap-2 text-center">
        <PrizeImage src={image} fit="contain" size={Math.round(Math.min(h * 0.22, 230))} className="!rounded-[28px] !border-4 shadow-lg" />
        <span className="text-[clamp(1.4rem,2.4vw,2.6rem)] font-black leading-tight text-eel">{prize.name}</span>
      </div>
    );
  }
  return (
    <div className="flex max-w-[80vw] flex-col items-center gap-5 text-center">
      <PrizeImage src={image} fit="contain" size={Math.round(Math.min(h * 0.38, 400))} className="!rounded-[36px] !border-4 shadow-xl" />
      <span className="text-[clamp(2.2rem,5vw,5.5rem)] font-black leading-tight text-eel">{prize.name}</span>
    </div>
  );
}
