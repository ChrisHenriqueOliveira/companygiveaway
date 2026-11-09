/**
 * Trava curta para a ação principal: evita que um clique duplo do passador de slides
 * pule etapas, e segura o avanço até a animação da tela atual terminar.
 */
let until = 0;

export function lockStage(ms: number): void {
  until = Math.max(until, Date.now() + ms);
}

export function isStageLocked(): boolean {
  return Date.now() < until;
}

export function resetStageLock(): void {
  until = 0;
}
