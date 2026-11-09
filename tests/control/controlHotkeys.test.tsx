import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { controlKeyAction, useControlHotkeys } from '../../src/control/hotkeys';
import { ACTION_NAMES, resetActionsProvider, setActionsProvider } from '../../src/store/actions';

const k = (key: string, mods: { ctrlKey?: boolean } = {}) => ({ key, ctrlKey: !!mods.ctrlKey, metaKey: false, altKey: false });
const free = { typing: false, modalOpen: false };

describe('controlKeyAction', () => {
  it('forwards only the clicker keys PageDown and ArrowRight', () => {
    expect(controlKeyAction(k('PageDown'), free)).toBe('primary');
    expect(controlKeyAction(k('ArrowRight'), free)).toBe('primary');
    for (const key of [' ', 'Enter', 'r', 'b', '.', 'PageUp', 'ArrowLeft', 'Escape']) {
      expect(controlKeyAction(k(key), free)).toBeNull(); // Espaço/Enter acionariam botões/toggles em foco
    }
  });

  it('is silent while typing, with a dialog open, or with a modifier', () => {
    expect(controlKeyAction(k('PageDown'), { typing: true, modalOpen: false })).toBeNull();
    expect(controlKeyAction(k('PageDown'), { typing: false, modalOpen: true })).toBeNull();
    expect(controlKeyAction(k('ArrowRight', { ctrlKey: true }), free)).toBeNull();
  });
});

let calls: Array<[string, unknown[]]> = [];
beforeEach(() => {
  calls = [];
  setActionsProvider(
    () => Object.fromEntries(ACTION_NAMES.map((n) => [n, (...a: unknown[]) => void calls.push([n, a])])) as never,
  );
});
afterEach(() => resetActionsProvider());

function Host() {
  useControlHotkeys();
  return <input aria-label="campo" />;
}

describe('useControlHotkeys', () => {
  it('lets the presenter keep driving the stage after clicking in the Control window', () => {
    render(<Host />);
    fireEvent.keyDown(window, { key: 'PageDown' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(calls).toEqual([
      ['stagePrimary', []],
      ['stagePrimary', []],
    ]);
  });

  it('ignores keys while typing in a field and when a dialog is open', () => {
    const { getByLabelText } = render(<Host />);
    getByLabelText('campo').focus();
    fireEvent.keyDown(getByLabelText('campo'), { key: 'ArrowRight' });
    expect(calls).toEqual([]);

    (getByLabelText('campo') as HTMLInputElement).blur();
    const dlg = document.createElement('div');
    dlg.setAttribute('role', 'dialog');
    document.body.appendChild(dlg);
    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(calls).toEqual([]);
    dlg.remove();
  });
});
