import { Presentinho } from '../../mascot/Presentinho';
import { useWindowSize } from '../useWindowSize';
import { Button } from '../../ui';

/** Idêntica em qualquer momento: nada aqui pode denunciar quantos prêmios faltam. */
export function IdleScreen({ onPrimary }: { onPrimary: () => void }) {
  const { h } = useWindowSize();
  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <Presentinho mood="idle" size={Math.round(Math.min(h * 0.4, 380))} />
      <h1 className="text-[clamp(2.6rem,5.4vw,5.8rem)] font-black leading-tight text-eel">Quem será o próximo sortudo?</h1>
      <Button size="xl" onClick={onPrimary}>
        Próximo prêmio
      </Button>
    </div>
  );
}
