import { useEffect } from 'react';
import type { MotionValue } from 'motion/react';
import { playTick, startWhoosh } from './reelSound';
import { createTickTracker } from './tickTracker';

/**
 * Liga o som ao MESMO valor que move os cartões do rolo (`pos`, em linhas): cada vez que um nome novo
 * chega ao centro sai um tique, e um sopro de ar acompanha a velocidade (`vel`) do giro, apagando
 * suavemente quando o rolo para. Como o som não tem relógio próprio, ele acompanha qualquer mudança
 * de velocidade, duração ou easing sem precisar de ajuste.
 */
export function useReelSound(pos: MotionValue<number>, vel: MotionValue<number>, enabled: boolean): void {
  useEffect(() => {
    const track = createTickTracker(pos.get());
    let whoosh: ReturnType<typeof startWhoosh> | null = null;
    const follow = () => {
      if (!enabled) return;
      whoosh ??= startWhoosh();
      whoosh.set(Math.abs(vel.get()));
    };
    const offPos = pos.on('change', (p) => {
      const crossed = track(p); // mantém o rastreador em dia mesmo com o som desligado
      if (enabled && crossed > 0) playTick(Math.abs(vel.get()));
      follow();
    });
    const offVel = vel.on('change', follow);
    return () => {
      offPos();
      offVel();
      whoosh?.stop();
    };
  }, [pos, vel, enabled]);
}
