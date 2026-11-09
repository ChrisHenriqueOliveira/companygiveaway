import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { buildHistoryWorkbook, historyFileName } from '../../src/io/sheetExport';
import type { DrawRecord } from '../../src/domain/types';

const at = new Date(2026, 11, 18, 21, 3).getTime();
const rec = (id: string, status: DrawRecord['status'], name: string): DrawRecord => ({
  id,
  prizeId: 'p',
  prizeName: 'Fone',
  participantId: id,
  name,
  email: `${id}@v.com`,
  status,
  at,
});

describe('buildHistoryWorkbook', () => {
  const wb = buildHistoryWorkbook([rec('a', 'confirmed', 'Ana'), rec('b', 'absent', 'Bob'), rec('c', 'pending', 'Caio')]);

  it('has a winners sheet with only confirmed draws and formatted time', () => {
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets['Ganhadores']);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ Prêmio: 'Fone', Nome: 'Ana', 'E-mail': 'a@v.com', Horário: '18/12/2026 21:03' });
  });

  it('has a full log sheet with translated status', () => {
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets['Log completo']);
    expect(rows.map((r) => r.Status)).toEqual(['Confirmado', 'Ausente', 'Pendente']);
  });
});

describe('historyFileName', () => {
  it('slugifies the event name', () => {
    expect(historyFileName('Sorteio de Fim de Ano Viceri 2026')).toBe('ganhadores-sorteio-de-fim-de-ano-viceri-2026.xlsx');
    expect(historyFileName('Ação & Festa!')).toBe('ganhadores-acao-festa.xlsx');
  });
});
