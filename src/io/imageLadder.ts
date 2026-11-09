/** Resolução máxima (antes: 640 px). O telão mostra o prêmio grande, então a imagem precisa de pixels. */
export const MAX_IMAGE_SIDE = 1280;
/** Teto por imagem em caracteres do data URL (~160 KB): 20 imagens ainda cabem no localStorage. */
export const IMAGE_BUDGET_CHARS = 220_000;

/** [maior lado, qualidade]: tenta a melhor e só desce se estourar o teto. */
export const IMAGE_STEPS: ReadonlyArray<readonly [number, number]> = [
  [MAX_IMAGE_SIDE, 0.9],
  [1024, 0.85],
  [800, 0.8],
  [640, 0.75],
];

export function encodeWithinBudget(
  encode: (maxSide: number, quality: number) => string,
  budget = IMAGE_BUDGET_CHARS,
): string {
  let last = '';
  for (const [side, quality] of IMAGE_STEPS) {
    last = encode(side, quality);
    if (last.length <= budget) return last;
  }
  return last; // nada coube: devolve a menor tentativa em vez de falhar o upload
}
