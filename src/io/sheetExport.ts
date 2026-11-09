import * as XLSX from 'xlsx';
import type { DrawRecord, DrawStatus } from '../domain/types';

const STATUS_LABEL: Record<DrawStatus, string> = {
  confirmed: 'Confirmado',
  absent: 'Ausente',
  pending: 'Pendente',
};

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildHistoryWorkbook(draws: DrawRecord[]): XLSX.WorkBook {
  const winners = draws
    .filter((d) => d.status === 'confirmed')
    .map((d) => ({ Prêmio: d.prizeName, Nome: d.name, 'E-mail': d.email, Horário: formatDateTime(d.at) }));
  const log = draws.map((d) => ({
    Prêmio: d.prizeName,
    Nome: d.name,
    'E-mail': d.email,
    Status: STATUS_LABEL[d.status],
    Horário: formatDateTime(d.at),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(winners, { header: ['Prêmio', 'Nome', 'E-mail', 'Horário'] }),
    'Ganhadores',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(log, { header: ['Prêmio', 'Nome', 'E-mail', 'Status', 'Horário'] }),
    'Log completo',
  );
  return wb;
}

export function historyFileName(eventName: string): string {
  const slug = eventName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `ganhadores-${slug || 'evento'}.xlsx`;
}

export function exportHistoryXlsx(draws: DrawRecord[], eventName: string): void {
  XLSX.writeFile(buildHistoryWorkbook(draws), historyFileName(eventName));
}
