import { describe, expect, it } from 'vitest';
import { stageKeyAction } from '../../src/stage/hotkeys';

const free = { typing: false, modalOpen: false };
const key = (k: string, mods: { ctrlKey?: boolean; metaKey?: boolean } = {}) => ({
  key: k,
  ctrlKey: !!mods.ctrlKey,
  metaKey: !!mods.metaKey,
});

describe('stageKeyAction', () => {
  it.each([
    [' ', 'primary'],
    ['Enter', 'primary'],
    ['ArrowRight', 'primary'],
    ['PageDown', 'primary'],
    ['r', 'absent'],
    ['R', 'absent'],
    ['f', 'fullscreen'],
    ['F', 'fullscreen'],
    ['Escape', 'close'],
  ] as const)('maps %j to %s', (k, expected) => {
    expect(stageKeyAction(key(k), free)).toBe(expected);
  });

  it('opens backstage only with Ctrl/Cmd+K', () => {
    expect(stageKeyAction(key('k', { ctrlKey: true }), free)).toBe('backstage');
    expect(stageKeyAction(key('K', { metaKey: true }), free)).toBe('backstage');
    expect(stageKeyAction(key('k'), free)).toBeNull();
  });

  it.each(['b', 'B', '.', 'w', 'W', 'PageUp', 'ArrowLeft', 'x'])(
    'ignores clicker "black screen" and unknown key %j',
    (k) => {
      expect(stageKeyAction(key(k), free)).toBeNull();
    },
  );

  it('ignores browser shortcuts like Ctrl+R / Ctrl+F', () => {
    expect(stageKeyAction(key('r', { ctrlKey: true }), free)).toBeNull();
    expect(stageKeyAction(key('f', { ctrlKey: true }), free)).toBeNull();
  });

  it('while typing or with a modal open, only Escape and Ctrl+K act', () => {
    for (const ctx of [
      { typing: true, modalOpen: false },
      { typing: false, modalOpen: true },
    ]) {
      expect(stageKeyAction(key(' '), ctx)).toBeNull();
      expect(stageKeyAction(key('r'), ctx)).toBeNull();
      expect(stageKeyAction(key('Escape'), ctx)).toBe('close');
      expect(stageKeyAction(key('k', { ctrlKey: true }), ctx)).toBe('backstage');
    }
  });
});
