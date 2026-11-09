import { DEFAULT_SETTINGS } from '../domain/types';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export interface Pacing {
  /** Presente balançando até estourar a tampa (= giftSeconds configurado). */
  giftPopMs: number;
  /** Prêmio aparece. */
  giftShowMs: number;
  /** Botão "Sortear!" liberado. */
  giftReadyMs: number;
  /** Pausa com o ganhador centralizado no rolo antes da revelação. */
  settleMs: number;
  /** Multiplicador dos atrasos da revelação do ganhador (1 = suspense de 7 s). */
  winnerScale: number;
  /** Tempo até o "Confirmar" ser liberado na revelação do ganhador. */
  winnerLockMs: number;
}

/**
 * Dois botões de ritmo independentes: `giftSeconds` (abertura do presente, 2–15 s) e
 * `suspenseSeconds` (rolo do sorteio e revelação do ganhador, 3–15 s).
 */
export function pacing(suspenseSeconds: number, giftSeconds: number = DEFAULT_SETTINGS.giftSeconds): Pacing {
  const s = clamp(suspenseSeconds, 3, 15);
  const giftPopMs = Math.round(clamp(giftSeconds, 2, 15) * 1000);
  const winnerScale = clamp(s / 7, 0.6, 2);
  return {
    giftPopMs,
    giftShowMs: giftPopMs + 500,
    giftReadyMs: giftPopMs + 1100,
    settleMs: Math.round(900 + s * 150),
    winnerScale,
    winnerLockMs: Math.round(3800 * winnerScale),
  };
}
