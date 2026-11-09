import type { DrawRecord, ID, Prize } from './types';

export interface WinnerItem {
  draw: DrawRecord;
  /** Nome do prêmio hoje; se o prêmio foi apagado depois, o nome guardado no sorteio. */
  prizeName: string;
  image?: string;
  /** 1, 2, 3… na ordem em que foram sorteados. */
  order: number;
}

/** Ganhadores confirmados, na ordem do sorteio, já com o nome e a imagem do prêmio resolvidos. */
export function winnersOf(
  draws: readonly DrawRecord[],
  prizes: Record<ID, Prize>,
  images: Record<ID, string>,
): WinnerItem[] {
  return draws
    .filter((d) => d.status === 'confirmed')
    .sort((a, b) => a.at - b.at)
    .map((draw, i) => {
      const prize = prizes[draw.prizeId];
      return {
        draw,
        prizeName: prize?.name ?? draw.prizeName,
        image: prize?.imageId ? images[prize.imageId] : undefined,
        order: i + 1,
      };
    });
}

export interface FinaleLayout {
  cols: number;
  /** Altura da área da imagem do prêmio, em % da altura da tela. */
  imageVh: number;
  avatar: number;
  /** Tamanho do nome do ganhador, em vw. */
  nameVw: number;
}

/** Poucos ganhadores: cartões grandes. Até 20 (o esperado) cabem em 5 colunas; acima disso encolhem. */
export function finaleLayout(n: number): FinaleLayout {
  if (n <= 3) return { cols: Math.max(1, n), imageVh: 34, avatar: 84, nameVw: 2.2 };
  if (n <= 6) return { cols: 3, imageVh: 23, avatar: 72, nameVw: 1.9 };
  if (n <= 8) return { cols: 4, imageVh: 19, avatar: 64, nameVw: 1.6 };
  if (n <= 12) return { cols: 4, imageVh: 15, avatar: 60, nameVw: 1.6 };
  if (n <= 20) return { cols: 5, imageVh: 13, avatar: 52, nameVw: 1.35 };
  if (n <= 30) return { cols: 6, imageVh: 8, avatar: 44, nameVw: 1.1 };
  return { cols: 8, imageVh: 7, avatar: 36, nameVw: 0.95 };
}
