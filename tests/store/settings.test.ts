import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/domain/types';
import { createAppStore } from '../../src/store/appStore';
import { migrate } from '../../src/store/persistence';
import { createEmptyData } from '../../src/domain/types';

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

describe('gift and reel durations are separate settings', () => {
  it('both have defaults', () => {
    expect(DEFAULT_SETTINGS.giftSeconds).toBeGreaterThanOrEqual(2);
    expect(DEFAULT_SETTINGS.suspenseSeconds).toBe(7);
  });

  it('updateSettings stores each one independently and clamps them (gift 2–15, reel 3–15)', () => {
    const store = createAppStore({ persist: true, storage: mem() });
    const a = () => store.getState();
    a().updateSettings({ giftSeconds: 9 });
    expect(a().settings.giftSeconds).toBe(9);
    expect(a().settings.suspenseSeconds).toBe(7);

    a().updateSettings({ suspenseSeconds: 12 });
    expect(a().settings.giftSeconds).toBe(9);
    expect(a().settings.suspenseSeconds).toBe(12);

    a().updateSettings({ giftSeconds: 0 });
    expect(a().settings.giftSeconds).toBe(2);
    a().updateSettings({ giftSeconds: 99 });
    expect(a().settings.giftSeconds).toBe(15);
  });

  it('data saved before this setting existed still loads, with the default gift duration', () => {
    const old = createEmptyData();
    const legacy = { ...old, settings: { eventName: 'Antigo', suspenseSeconds: 5 } };
    const loaded = migrate(legacy);
    expect(loaded.settings.suspenseSeconds).toBe(5);
    expect(loaded.settings.giftSeconds).toBe(DEFAULT_SETTINGS.giftSeconds);
  });
});
