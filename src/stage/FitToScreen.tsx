import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Garante que o conteúdo de uma tela do palco sempre cabe na área disponível: se um nome longo,
 * um mural grande ou uma tela baixa (768p) fizerem o conteúdo passar, ele é reduzido na proporção.
 * Conteúdo que já cabe não é tocado (sem transform, para não afetar elementos `fixed`).
 */
export function FitToScreen({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = () => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const ih = i.scrollHeight;
    const iw = i.scrollWidth;
    let k = 1;
    if (ih > 0 && iw > 0) k = Math.min(1, o.clientHeight / ih, o.clientWidth / iw);
    if (!Number.isFinite(k) || k <= 0) k = 1;
    if (k < 1) k = Math.floor(k * 1000) / 1000;
    setScale((prev) => (prev === k ? prev : k));
  };

  useLayoutEffect(measure); // a cada render: o conteúdo pode ter mudado de tamanho

  useLayoutEffect(() => {
    window.addEventListener('resize', measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && outer.current && inner.current) {
      ro.observe(outer.current);
      ro.observe(inner.current);
    }
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={outer} data-fit="outer" className="flex h-full w-full items-center justify-center overflow-hidden">
      <div
        ref={inner}
        data-fit="inner"
        className="flex w-full flex-col items-center justify-center"
        style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'center center' } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
