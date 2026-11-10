import { DEFAULT_SETTINGS } from '../domain/types';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export interface Pacing {
  /** Presente balançando até estourar a tampa (= giftSeconds configurado). */
  giftPopMs: number;
  /** Prêmio aparece. */
  giftShowMs: number;
  /** Botão "Sortear!" liberado. */
  giftReadyMs: number;
  /** Pausa com o ganhador travado no centro do rolo antes da revelação. Fixa. */
  settleMs: number;
  /** Multiplicador dos atrasos da revelação do ganhador. Sempre 1: a revelação é sempre igual. */
  winnerScale: number;
  /** Tempo até o "Confirmar" ser liberado na revelação do ganhador. Fixo. */
  winnerLockMs: number;
}

/**
 * Só a abertura do presente (`giftSeconds`, 2–15 s) é configurável aqui. A duração do rolo
 * (`suspenseSeconds`) vale apenas para o rolo: a pausa depois dele e a revelação do ganhador
 * são sempre iguais, porque o público já sabe quem ganhou.
 */
export function pacing(giftSeconds: number = DEFAULT_SETTINGS.giftSeconds): Pacing {
  const giftPopMs = Math.round(clamp(giftSeconds, 2, 15) * 1000);
  return {
    giftPopMs,
    giftShowMs: giftPopMs + 500,
    giftReadyMs: giftPopMs + 1100,
    settleMs: 1800,
    winnerScale: 1,
    winnerLockMs: 3800,
  };
}
