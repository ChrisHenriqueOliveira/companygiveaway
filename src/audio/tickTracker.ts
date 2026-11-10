/**
 * Conta quantas linhas do rolo passaram pelo centro desde a última chamada.
 * A linha "no centro" é a posição arredondada: um tique = um nome novo no centro.
 * A mola do final (passa um pouco do alvo e volta) fica na mesma linha, então não gera tique extra.
 */
export function createTickTracker(startPosition: number): (position: number) => number {
  let last = Math.round(startPosition);
  return (position: number) => {
    const row = Math.round(position);
    const crossed = Math.abs(row - last);
    last = row;
    return crossed;
  };
}
