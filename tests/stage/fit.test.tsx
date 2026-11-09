import { act, renderHook, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FitToScreen } from '../../src/stage/FitToScreen';
import { useWindowSize } from '../../src/stage/useWindowSize';

// jsdom não tem layout: devolve medidas combinadas pelo data-fit do elemento.
const sizes: Record<string, { h: number; w: number }> = {};
for (const prop of ['clientHeight', 'scrollHeight']) {
  Object.defineProperty(HTMLElement.prototype, prop, {
    configurable: true,
    get(this: HTMLElement) {
      return sizes[this.dataset.fit ?? '']?.h ?? 0;
    },
  });
}
for (const prop of ['clientWidth', 'scrollWidth']) {
  Object.defineProperty(HTMLElement.prototype, prop, {
    configurable: true,
    get(this: HTMLElement) {
      return sizes[this.dataset.fit ?? '']?.w ?? 0;
    },
  });
}
afterEach(() => {
  for (const k of Object.keys(sizes)) delete sizes[k];
});

describe('FitToScreen', () => {
  it('shrinks content that is taller than the available area (long names on a 768p projector)', () => {
    sizes.outer = { h: 500, w: 1000 };
    sizes.inner = { h: 1000, w: 800 };
    const { container } = render(
      <FitToScreen>
        <p>conteúdo</p>
      </FitToScreen>,
    );
    const inner = container.querySelector('[data-fit="inner"]') as HTMLElement;
    expect(inner.style.transform).toBe('scale(0.5)');
  });

  it('also shrinks content wider than the area, and never enlarges small content', () => {
    sizes.outer = { h: 800, w: 500 };
    sizes.inner = { h: 400, w: 1000 };
    const wide = render(<FitToScreen><p>x</p></FitToScreen>).container.querySelector('[data-fit="inner"]') as HTMLElement;
    expect(wide.style.transform).toBe('scale(0.5)');

    sizes.outer = { h: 800, w: 1000 };
    sizes.inner = { h: 100, w: 100 };
    const small = render(<FitToScreen><p>y</p></FitToScreen>).container.querySelectorAll('[data-fit="inner"]');
    const el = small[small.length - 1] as HTMLElement;
    // sem transform quando cabe (um transform criaria um "containing block" para elementos fixed)
    expect(el.style.transform).toBe('');
  });
});

describe('useWindowSize', () => {
  it('follows window resizes (e.g. moving the stage from the laptop to the projector)', () => {
    const { result } = renderHook(() => useWindowSize());
    act(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toEqual({ w: 1366, h: 768 });
  });
});
