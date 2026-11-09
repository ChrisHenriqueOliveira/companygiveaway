import { normalizeEmail } from './email';
import { newId, pickOne } from './random';
import type { DrawRecord, DrawView, ID, Participant } from './types';

export type ViewPatch = Partial<Pick<DrawView, 'queue' | 'draws' | 'stage'>>;
type Pick1 = <T>(items: T[]) => T;

export function eligibleParticipants(v: DrawView): Participant[] {
  const blocked = new Set(v.excluded.map((e) => normalizeEmail(e.email)));
  const taken = new Set(v.draws.map((d) => d.participantId)); // confirmed, absent e pending
  return v.participants.filter((p) => !blocked.has(normalizeEmail(p.email)) && !taken.has(p.id));
}

export function pendingQueue(v: DrawView): ID[] {
  const done = new Set(v.draws.filter((d) => d.status === 'confirmed').map((d) => d.prizeId));
  return v.queue.filter((id) => v.prizes[id] && !done.has(id));
}

export function currentDraw(v: DrawView): DrawRecord | undefined {
  return v.draws.find((d) => d.id === v.stage.drawId);
}

export function nextPrize(v: DrawView): ViewPatch {
  if (v.stage.phase !== 'idle') return {};
  const [first] = pendingQueue(v);
  return first
    ? { stage: { phase: 'prizeReveal', prizeId: first } }
    : { stage: { phase: 'finale' } };
}

export function startDraw(v: DrawView, now: number, pick: Pick1 = pickOne): ViewPatch {
  const { phase, prizeId } = v.stage;
  if ((phase !== 'prizeReveal' && phase !== 'noEligible') || !prizeId) return {};
  const prize = v.prizes[prizeId];
  const eligible = eligibleParticipants(v);
  if (!prize || eligible.length === 0) return { stage: { phase: 'noEligible', prizeId } };
  const winner = pick(eligible);
  const record: DrawRecord = {
    id: newId(),
    prizeId,
    prizeName: prize.name,
    participantId: winner.id,
    name: winner.name,
    email: winner.email,
    status: 'pending',
    at: now,
  };
  return { draws: [...v.draws, record], stage: { phase: 'drawing', prizeId, drawId: record.id } };
}

export function finishDrawing(v: DrawView): ViewPatch {
  if (v.stage.phase !== 'drawing') return {};
  return { stage: { ...v.stage, phase: 'winnerReveal' } };
}

export function confirmWinner(v: DrawView): ViewPatch {
  const draw = currentDraw(v);
  if (v.stage.phase !== 'winnerReveal' || !draw) return {};
  return {
    draws: v.draws.map((d) => (d.id === draw.id ? { ...d, status: 'confirmed' as const } : d)),
    queue: v.queue.filter((id) => id !== draw.prizeId),
    stage: { phase: 'idle' },
  };
}

export function markAbsentAndRedraw(v: DrawView, now: number, pick: Pick1 = pickOne): ViewPatch {
  const draw = currentDraw(v);
  if (v.stage.phase !== 'winnerReveal' || !draw) return {};
  const draws = v.draws.map((d) => (d.id === draw.id ? { ...d, status: 'absent' as const } : d));
  const next = startDraw(
    { ...v, draws, stage: { phase: 'prizeReveal', prizeId: draw.prizeId } },
    now,
    pick,
  );
  return { draws, ...next };
}

/**
 * Remove um registro do histórico. A pessoa volta a concorrer; se o registro era CONFIRMADO o prêmio
 * volta para o topo da fila, se era AUSENTE o prêmio não muda (ele já tinha sido sorteado de novo).
 */
export function removeDraw(v: DrawView, drawId: ID): ViewPatch {
  const d = v.draws.find((x) => x.id === drawId);
  if (!d || d.status === 'pending' || v.stage.drawId === drawId) return {};
  const draws = v.draws.filter((x) => x.id !== drawId);
  const restore = d.status === 'confirmed' && v.prizes[d.prizeId] && !v.queue.includes(d.prizeId);
  return restore ? { draws, queue: [d.prizeId, ...v.queue] } : { draws };
}

/** Saída segura do mural final / "sem elegíveis": volta ao início sem apagar nenhum sorteio. */
export function backToIdle(v: DrawView): ViewPatch {
  if (v.stage.phase === 'finale' || v.stage.phase === 'noEligible') return { stage: { phase: 'idle' } };
  return {};
}

export function canUndo(v: DrawView): boolean {
  return (
    v.draws.length > 0 &&
    v.draws.every((d) => d.status !== 'pending') &&
    (v.stage.phase === 'idle' || v.stage.phase === 'finale')
  );
}

export function undoLast(v: DrawView): ViewPatch {
  if (!canUndo(v)) return {};
  const last = v.draws.reduce((a, b) => (b.at >= a.at ? b : a));
  const draws = v.draws.filter((d) => d.id !== last.id);
  const restore = last.status === 'confirmed' && v.prizes[last.prizeId] && !v.queue.includes(last.prizeId);
  return {
    draws,
    queue: restore ? [last.prizeId, ...v.queue] : v.queue,
    stage: { phase: 'idle' },
  };
}
