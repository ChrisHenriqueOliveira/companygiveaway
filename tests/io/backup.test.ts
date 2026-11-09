import { describe, expect, it } from 'vitest';
import { parseBackup, serializeBackup } from '../../src/io/backup';
import { createEmptyData } from '../../src/domain/types';

describe('backup', () => {
  it('round-trips data', () => {
    const data = {
      ...createEmptyData(),
      queue: ['p1'],
      prizes: { p1: { id: 'p1', name: 'Fone', createdAt: 1 } },
      images: { i1: 'data:image/webp;base64,AAAA' },
    };
    const parsed = parseBackup(serializeBackup(data));
    expect(parsed).toEqual({ ok: true, data });
  });

  it('rejects invalid json and wrong shapes', () => {
    expect(parseBackup('lixo').ok).toBe(false);
    expect(parseBackup('{}').ok).toBe(false);
    expect(parseBackup(JSON.stringify({ version: 2, prizes: {} })).ok).toBe(false);
    expect(parseBackup('null').ok).toBe(false);
  });

  it('never carries rehearsal state', () => {
    const json = serializeBackup({ ...createEmptyData(), rehearsal: { active: true } } as never);
    expect(json).not.toContain('rehearsal');
  });
});
