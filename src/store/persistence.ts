import type { StateStorage } from 'zustand/middleware';
import { createEmptyData, DEFAULT_SETTINGS, type AppData } from '../domain/types';

export const STORAGE_KEY = 'sorteio-viceri:v1';
export const STORAGE_LIMIT_CHARS = 5_000_000;
export const STORAGE_ERROR_MESSAGE = 'Não foi possível salvar. Remova imagens ou baixe um backup.';

/** Um F5 no meio da animação volta direto para o resultado já sorteado. */
export function normalizeOnLoad(d: AppData): AppData {
  if (d.stage.phase === 'drawing') return { ...d, stage: { ...d.stage, phase: 'winnerReveal' } };
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
