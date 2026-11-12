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

/**
 * Etiqueta "X/Y" dos prêmios de um mesmo grupo, recalculada a partir dos que ainda existem:
 * ao excluir unidades, o total e a numeração acompanham (20 → apaga 5 → 1/15 … 15/15).
 * Prêmio sozinho no grupo não tem etiqueta.
 */
export function groupLabels(prizes: Record<ID, Prize>): Record<ID, { index: number; size: number }> {
  const groups = new Map<ID, Prize[]>();
  for (const p of Object.values(prizes)) {
    if (p.groupId) groups.set(p.groupId, [...(groups.get(p.groupId) ?? []), p]);
  }
  const labels: Record<ID, { index: number; size: number }> = {};
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    members.sort((a, b) => (a.groupIndex ?? 0) - (b.groupIndex ?? 0) || a.createdAt - b.createdAt);
    members.forEach((p, i) => (labels[p.id] = { index: i + 1, size: members.length }));
  }
  return labels;
}
