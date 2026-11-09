import { newId } from './random';
import type { ID, Prize } from './types';

/** Quantidade N vira N prêmios independentes do mesmo grupo (sorteados em momentos distintos). */
export function expandPrizeInput(
  input: { name: string; imageId?: ID; quantity: number },
  now: number,
): Prize[] {
  const name = input.name.trim();
  if (!name) throw new Error('Nome do prêmio é obrigatório');
  if (!Number.isInteger(input.quantity) || input.quantity < 1) throw new Error('Quantidade inválida');
  const groupId = input.quantity > 1 ? newId() : undefined;
  return Array.from({ length: input.quantity }, (_, i) => ({
    id: newId(),
    name,
    imageId: input.imageId,
    ...(groupId ? { groupId, groupIndex: i + 1, groupSize: input.quantity } : {}),
    createdAt: now,
  }));
}
