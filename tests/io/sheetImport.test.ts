import { describe, expect, it } from 'vitest';
import { buildImportPreview, detectColumns, readSheetFile } from '../../src/io/sheetImport';

describe('detectColumns', () => {
  it('matches headers ignoring accents, case and extra words', () => {
    expect(detectColumns(['Nome Completo', 'E-mail Corporativo'], [])).toEqual({
      name: 'Nome Completo',
      email: 'E-mail Corporativo',
    });
    expect(detectColumns(['Funcionário', 'EMAIL'], [])).toEqual({ name: 'Funcionário', email: 'EMAIL' });
  });

  it('falls back to the column containing "@" and the first other text column', () => {
    const rows = [
      { 'Col A': 'Ana', 'Col B': 'ana@v.com' },
      { 'Col A': 'Bob', 'Col B': 'bob@v.com' },
    ];
    expect(detectColumns(['Col A', 'Col B'], rows)).toEqual({ name: 'Col A', email: 'Col B' });
  });

  it('returns undefined when nothing can be detected', () => {
    expect(detectColumns(['X', 'Y'], [{ X: '1', Y: '2' }])).toEqual({});
  });
});

describe('buildImportPreview', () => {
  const cols = { name: 'N', email: 'E' };
  const excluded = [{ id: 'x', name: 'Caio', email: 'caio@v.com' }];

  it('counts valid, duplicates, invalid and already-excluded on a messy sheet', () => {
    const rows = [
      { N: 'Ana', E: ' ANA@V.COM ' },
      { N: 'Ana 2', E: 'ana@v.com' },
      { N: '', E: '' },
      { N: 'Bob', E: 'bob' },
      { N: 'Caio', E: 'caio@v.com' },
    ];
    const p = buildImportPreview(rows, cols, excluded);
    expect(p.valid).toEqual([
      { name: 'Ana', email: 'ana@v.com' },
      { name: 'Caio', email: 'caio@v.com' },
    ]);
    expect(p.duplicates).toBe(1);
    expect(p.invalid).toBe(2);
    expect(p.alreadyExcluded).toBe(1);
    expect(p.total).toBe(5);
  });

  it('uses the e-mail local part when the name is blank', () => {
    const p = buildImportPreview([{ N: '  ', E: 'maria.souza@v.com' }], cols, []);
    expect(p.valid).toEqual([{ name: 'maria.souza', email: 'maria.souza@v.com' }]);
  });
});

describe('readSheetFile', () => {
  it('reads a ";" separated CSV and skips blank lines', async () => {
    const file = new File(['Nome;Email\nAna;ana@v.com\n\n'], 'x.csv', { type: 'text/csv' });
    const { headers, rows } = await readSheetFile(file);
    expect(headers).toEqual(['Nome', 'Email']);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ Nome: 'Ana', Email: 'ana@v.com' });
  });

  it('reads a "," separated CSV', async () => {
    const file = new File(['Nome,Email\nAna,ana@v.com\nBob,bob@v.com\n'], 'y.csv', { type: 'text/csv' });
    const { rows } = await readSheetFile(file);
    expect(rows).toHaveLength(2);
  });

  it('decodes accents in UTF-8 CSV', async () => {
    const file = new File(['Nome,Email\nJoão Antônio,joao@v.com\n'], 'z.csv', { type: 'text/csv' });
    const { rows } = await readSheetFile(file);
    expect(rows[0]).toMatchObject({ Nome: 'João Antônio' });
  });
});
