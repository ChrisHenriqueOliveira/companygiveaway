import * as XLSX from 'xlsx';
import { isValidEmail, normalizeEmail } from '../domain/email';
import type { Excluded } from '../domain/types';

export type Row = Record<string, unknown>;

const cell = (v: unknown) => String(v ?? '').trim();
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

function decodeText(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf); // CSV exportado pelo Excel antigo
  }
}

function sheetToRows(wb: XLSX.WorkBook): { headers: string[]; rows: Row[] } {
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { headers: [], rows: [] };
  const all = XLSX.utils.sheet_to_json<Row>(ws, { defval: '' });
  const rows = all.filter((r) => Object.values(r).some((v) => cell(v) !== ''));
  const headers = all.length ? Object.keys(all[0]) : [];
  return { headers, rows };
}

async function readBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}

/** Lê a 1ª aba (xlsx/xls) ou um CSV (separador , ou ;), ignorando linhas vazias. */
export async function readSheetFile(file: File): Promise<{ headers: string[]; rows: Row[] }> {
  const buf = await readBuffer(file);
  const isCsv = /\.(csv|txt)$/i.test(file.name) || file.type.startsWith('text/');
  if (!isCsv) return sheetToRows(XLSX.read(buf, { type: 'array' }));

  const text = decodeText(buf).replace(/^﻿/, '');
  let result = sheetToRows(XLSX.read(text, { type: 'string' }));
  if (result.headers.length === 1 && result.headers[0].includes(';')) {
    result = sheetToRows(XLSX.read(text, { type: 'string', FS: ';' } as XLSX.ParsingOptions));
  }
  return result;
}

const NAME_HINTS = ['nome', 'name', 'colaborador', 'funcionario'];
const EMAIL_HINTS = ['email', 'e-mail', 'mail', 'correio'];

export function detectColumns(headers: string[], rows: Row[]): { name?: string; email?: string } {
  const hit = (hints: string[], skip?: string) =>
    headers.find((h) => h !== skip && hints.some((k) => fold(h).includes(k)));

  let email = hit(EMAIL_HINTS);
  if (!email) {
    email = headers.find((h) => {
      const vals = rows.slice(0, 50).map((r) => cell(r[h])).filter(Boolean);
      return vals.length > 0 && vals.filter((v) => v.includes('@')).length / vals.length > 0.5;
    });
  }
  let name = hit(NAME_HINTS, email);
  if (!name && email) {
    name = headers.find((h) => {
      if (h === email) return false;
      const vals = rows.slice(0, 50).map((r) => cell(r[h])).filter(Boolean);
      return vals.length > 0 && vals.every((v) => !v.includes('@'));
    });
  }
  return { ...(name ? { name } : {}), ...(email ? { email } : {}) };
}

export interface ImportPreview {
  valid: Array<{ name: string; email: string }>;
  duplicates: number;
  invalid: number;
  alreadyExcluded: number;
  total: number;
}

export function buildImportPreview(
  rows: Row[],
  cols: { name: string; email: string },
  excluded: Excluded[],
): ImportPreview {
  const blocked = new Set(excluded.map((e) => normalizeEmail(e.email)));
  const seen = new Set<string>();
  const valid: ImportPreview['valid'] = [];
  let duplicates = 0;
  let invalid = 0;
  let alreadyExcluded = 0;
  for (const r of rows) {
    const rawEmail = cell(r[cols.email]);
    if (!isValidEmail(rawEmail)) {
      invalid++;
      continue;
    }
    const email = normalizeEmail(rawEmail);
    if (seen.has(email)) {
      duplicates++;
      continue;
    }
    seen.add(email);
    valid.push({ name: cell(r[cols.name]) || email.split('@')[0], email });
    if (blocked.has(email)) alreadyExcluded++;
  }
  return { valid, duplicates, invalid, alreadyExcluded, total: rows.length };
}

const PRIZE_HINTS = ['premio', 'prize', 'item', 'brinde', 'produto', 'descricao', 'nome', 'name'];
const QTY_HINTS = ['quantidade', 'qtd', 'qtde', 'qte', 'quantity', 'qty', 'unidades'];
export const MAX_PRIZE_QTY = 20;

export function detectPrizeColumns(headers: string[], rows: Row[]): { name?: string; quantity?: string } {
  const hit = (hints: string[], skip?: string) =>
    headers.find((h) => h !== skip && hints.some((k) => fold(h).includes(k)));
  const quantity = hit(QTY_HINTS);
  let name = hit(PRIZE_HINTS, quantity);
  if (!name) {
    // sem cabeçalho reconhecível: a primeira coluna com texto (não numérico) é o nome
    name = headers.find((h) => {
      if (h === quantity) return false;
      const vals = rows.slice(0, 50).map((r) => cell(r[h])).filter(Boolean);
      return vals.length > 0 && vals.some((v) => Number.isNaN(Number(v)));
    });
  }
  return { ...(name ? { name } : {}), ...(quantity ? { quantity } : {}) };
}

export interface PrizePreview {
  items: Array<{ name: string; quantity: number }>;
  units: number;
  skipped: number; // linhas sem nome
  capped: number; // quantidades acima do limite, reduzidas
  total: number;
}

/** Cada linha vira um prêmio (quantidade vazia/inválida = 1; limitada a MAX_PRIZE_QTY). */
export function buildPrizePreview(rows: Row[], cols: { name: string; quantity: string }): PrizePreview {
  const items: PrizePreview['items'] = [];
  let skipped = 0;
  let capped = 0;
  for (const r of rows) {
    const name = cell(r[cols.name]);
    if (!name) {
      skipped++;
      continue;
    }
    const raw = cols.quantity ? Math.floor(Number(cell(r[cols.quantity]).replace(',', '.'))) : 1;
    let quantity = Number.isFinite(raw) && raw >= 1 ? raw : 1;
    if (quantity > MAX_PRIZE_QTY) {
      quantity = MAX_PRIZE_QTY;
      capped++;
    }
    items.push({ name, quantity });
  }
  return { items, units: items.reduce((n, i) => n + i.quantity, 0), skipped, capped, total: rows.length };
}
