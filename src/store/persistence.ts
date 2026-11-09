import type { StateStorage } from 'zustand/middleware';
import { createEmptyData, DEFAULT_SETTINGS, type AppData } from '../domain/types';

export const STORAGE_KEY = 'sorteio-viceri:v1';
export const STORAGE_LIMIT_CHARS = 5_000_000;
export const STORAGE_ERROR_MESSAGE = 'Não foi possível salvar. Remova imagens ou baixe um backup.';

/** Um F5 no meio da animação volta direto para o resultado já sorteado. */
export function normalizeOnLoad(d: AppData): AppData {
  const { phase, drawId } = d.stage;
  // Referência quebrada (sorteio sumiu): volta ao início em vez de ficar numa tela vazia sem saída.
  if ((phase === 'drawing' || phase === 'winnerReveal') && !d.draws.some((x) => x.id === drawId)) {
    return { ...d, stage: { phase: 'idle' } };
  }
  if (phase === 'drawing') return { ...d, stage: { ...d.stage, phase: 'winnerReveal' } };
  return d;
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function isAppDataShape(raw: unknown): raw is AppData {
  return (
    isObj(raw) &&
    raw.version === 1 &&
    isObj(raw.prizes) &&
    isObj(raw.images) &&
    Array.isArray(raw.queue) &&
    Array.isArray(raw.participants) &&
    Array.isArray(raw.excluded) &&
    Array.isArray(raw.draws) &&
    isObj(raw.settings) &&
    isObj(raw.stage)
  );
}

const isStr = (x: unknown): x is string => typeof x === 'string';
const PHASES = new Set(['idle', 'prizeReveal', 'drawing', 'winnerReveal', 'noEligible', 'finale']);
const STATUSES = new Set(['pending', 'confirmed', 'absent']);

/**
 * Validação profunda (item por item), usada ao restaurar um backup: um item sem nome/e-mail
 * derrubaria a tela do palco depois. Devolve a descrição do problema, ou null se está tudo certo.
 */
export function validateAppData(raw: unknown): string | null {
  if (!isAppDataShape(raw)) return 'estrutura desconhecida';
  const bad = (list: unknown[], ok: (x: Record<string, unknown>) => boolean) => list.some((x) => !isObj(x) || !ok(x));
  const person = (x: Record<string, unknown>) => isStr(x.id) && isStr(x.name) && isStr(x.email);
  if (bad(raw.participants, person)) return 'lista de participantes com item inválido';
  if (bad(raw.excluded, person)) return 'lista de exclusões com item inválido';
  if (
    bad(
      raw.draws,
      (x) =>
        isStr(x.id) && isStr(x.prizeId) && isStr(x.prizeName) && isStr(x.participantId) && isStr(x.name) &&
        isStr(x.email) && STATUSES.has(x.status as string) && typeof x.at === 'number',
    )
  ) {
    return 'histórico de sorteios com item inválido';
  }
  if (bad(Object.values(raw.prizes), (p) => isStr(p.id) && isStr(p.name))) return 'prêmios com item inválido';
  if (raw.queue.some((q) => !isStr(q))) return 'fila de prêmios inválida';
  if (Object.values(raw.images).some((i) => !isStr(i))) return 'imagens inválidas';
  if (!PHASES.has(String((raw.stage as unknown as Record<string, unknown>).phase))) return 'estado do palco inválido';
  return null;
}

/** Valida a forma básica; qualquer coisa desconhecida vira dados vazios. */
export function migrate(raw: unknown): AppData {
  if (!isAppDataShape(raw)) return createEmptyData();
  return { ...raw, settings: { ...DEFAULT_SETTINGS, ...raw.settings } };
}

export function estimateUsage(d: AppData): { chars: number; ratio: number } {
  const chars = JSON.stringify(d).length;
  return { chars, ratio: chars / STORAGE_LIMIT_CHARS };
}

export function createSafeStorage(
  onError: (e: unknown) => void,
  opts: { base?: StateStorage; onOk?: () => void } = {},
): StateStorage {
  const base = opts.base ?? localStorage;
  return {
    getItem: (k) => {
      try {
        return base.getItem(k);
      } catch {
        return null;
      }
    },
    setItem: (k, v) => {
      try {
        base.setItem(k, v);
        opts.onOk?.();
      } catch (e) {
        onError(e);
      }
    },
    removeItem: (k) => {
      try {
        base.removeItem(k);
      } catch {
        /* ignore */
      }
    },
  };
}
