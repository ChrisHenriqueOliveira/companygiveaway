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
