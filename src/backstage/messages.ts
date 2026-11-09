import type { DrawRecord } from '../domain/types';

const STATUS = { confirmed: 'confirmado', absent: 'ausente', pending: 'em andamento' } as const;

/** Texto do aviso de "Desfazer": diz exatamente quem e qual prêmio serão desfeitos. */
export function undoMessage(d?: DrawRecord): string {
  if (!d) return 'Não há nenhum registro para desfazer.';
  const base = `Vai apagar o registro mais recente: ${d.name} — ${d.prizeName} (${STATUS[d.status]}).`;
  return d.status === 'confirmed'
    ? `${base} O prêmio volta para o topo da fila e a pessoa volta a concorrer.`
    : `${base} A pessoa volta a concorrer.`;
}
