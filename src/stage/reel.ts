import { pickOne } from '../domain/random';
import type { Person } from '../domain/types';

/**
 * Cartões do rolo (só encenação: o ganhador já foi decidido). O último item é o ganhador.
 * Montado de trás para frente para garantir que nenhum item repete o vizinho.
 */
export function buildReel(eligible: Person[], winner: Person, length = 36): Person[] {
  const pool = [winner, ...eligible.filter((p) => p.id !== winner.id)];
  const reversed: Person[] = [winner];
  for (let i = 1; i < length; i++) {
    const prev = reversed[i - 1];
    const options = pool.length > 1 ? pool.filter((p) => p.id !== prev.id) : pool;
    reversed.push(pickOne(options));
  }
  return reversed.reverse();
}

/**
 * Rolo "contínuo": além dos cartões que terminam no ganhador, acrescenta `margin` cartões DEPOIS dele
 * (e antes do primeiro), para nunca parecer que a lista acabou quando o rolo para.
 * Nenhum cartão repete o vizinho.
 */
export function buildReelWithMargins(
  eligible: Person[],
  winner: Person,
  length = 36,
  margin = 2,
): { cards: Person[]; winnerIndex: number } {
  const body = buildReel(eligible, winner, length);
  const pool = [winner, ...eligible.filter((p) => p.id !== winner.id)];
  const next = (neighbour: Person) => pickOne(pool.length > 1 ? pool.filter((p) => p.id !== neighbour.id) : pool);

  const tail: Person[] = [];
  for (let i = 0; i < margin; i++) tail.push(next(i === 0 ? body[body.length - 1] : tail[i - 1]));

  const lead: Person[] = [];
  for (let i = 0; i < margin; i++) lead.unshift(next(i === 0 ? body[0] : lead[0]));

  return { cards: [...lead, ...body, ...tail], winnerIndex: margin + length - 1 };
}

/**
 * Quantidade de cartões do rolo: mais tempo de rolo = mais cartões, para a velocidade média
 * continuar boa de ver (rápida o bastante para borrar, lenta o bastante para ler no fim).
 */
export function reelLength(seconds: number): number {
  return Math.min(90, Math.max(30, Math.round(seconds * 6)));
}
