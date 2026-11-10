import { useEffect } from 'react';
import type { MotionValue } from 'motion/react';
import { playTick } from './reelSound';
import { createTickTracker } from './tickTracker';

/**
 * Liga o som ao MESMO valor que move os cartões do rolo (`pos`, em linhas): cada vez que um nome novo
 * chega ao centro sai um tique. Como o som não tem relógio próprio, ele acompanha qualquer mudança de
 * velocidade, duração ou easing sem precisar de ajuste. A velocidade atual (`vel`) só dá o timbre.
 */
export function useReelSound(pos: MotionValue<number>, vel: MotionValue<number>, enabled: boolean): void {
  useEffect(() => {
    const track = createTickTracker(pos.get());
    return pos.on('change', (p) => {
      const crossed = track(p); // mantém o rastreador em dia mesmo com o som desligado
      if (enabled && crossed > 0) playTick(Math.abs(vel.get()));
    });
  }, [pos, vel, enabled]);
}
