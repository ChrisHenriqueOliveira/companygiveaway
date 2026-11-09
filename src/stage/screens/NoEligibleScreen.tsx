import { Presentinho } from '../../mascot/Presentinho';
import { useWindowSize } from '../useWindowSize';
import { Button } from '../../ui';

export function NoEligibleScreen({ onPrimary, onOpenBackstage }: { onPrimary: () => void; onOpenBackstage: () => void }) {
  const { h } = useWindowSize();
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <Presentinho mood="sad" size={Math.round(Math.min(h * 0.34, 320))} />
      <h1 className="text-[clamp(2.4rem,5vw,5rem)] font-black text-eel">Acabaram os participantes!</h1>
      <p className="max-w-3xl text-[clamp(1.2rem,2vw,2.2rem)] font-bold text-wolf">
        Ninguém mais está elegível para este prêmio.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button size="lg" variant="secondary" onClick={onOpenBackstage}>
          Abrir bastidores
        </Button>
        <Button size="lg" variant="ghost" onClick={onPrimary}>
          Tentar de novo
        </Button>
      </div>
    </div>
  );
}
