import type { AppData } from '../domain/types';
import { isAppDataShape, migrate, validateAppData } from '../store/persistence';

/** Só os dados do evento: o modo ensaio e erros de storage nunca entram no backup. */
export function serializeBackup(d: AppData): string {
  const { version, prizes, images, queue, participants, excluded, draws, settings, stage } = d;
  return JSON.stringify({ version, prizes, images, queue, participants, excluded, draws, settings, stage });
}

export function parseBackup(text: string): { ok: true; data: AppData } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'O arquivo não é um backup válido (JSON inválido).' };
  }
  if (!isAppDataShape(raw)) {
    return { ok: false, error: 'Este arquivo não parece um backup do Sorteio Viceri.' };
  }
  const problem = validateAppData(raw);
  if (problem) return { ok: false, error: `Backup com dados inválidos (${problem}). Nada foi alterado.` };
  return { ok: true, data: migrate(raw) };
}
