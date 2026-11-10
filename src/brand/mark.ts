/**
 * Logo da Viceri recriado em vetor: um triângulo arredondado vazado (anel grosso embaixo/à esquerda,
 * fino em cima/à direita). Dois contornos + `fill-rule: evenodd` = o furo branco.
 */
export const BRAND_RED = '#FD4237';
export const BRAND_RED_DARK = '#CF281E';
export const MARK_VIEWBOX = '0 0 213 200';

export const MARK_OUTER =
  'M 5 90 C 4 52, 52 14, 124 9 C 186 5, 213 32, 205 72 C 199 106, 158 160, 119 186 C 100 199, 68 196, 40 170 C 18 150, 6 122, 5 90 Z';
export const MARK_INNER =
  'M 33 92 C 33 66, 74 32, 128 24 C 174 17, 199 33, 198 62 C 194 92, 152 140, 115 161 C 96 172, 74 168, 57 151 C 42 136, 33 116, 33 92 Z';

/** Anel completo (para usar com fill-rule="evenodd"). */
export const MARK_PATH = `${MARK_OUTER} ${MARK_INNER}`;

/** Centro do furo, onde o rosto do mascote mora. */
export const MARK_CENTER = { x: 116, y: 92 };
