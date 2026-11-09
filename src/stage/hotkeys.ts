import { useEffect, useRef } from 'react';

export type StageKeyAction = 'primary' | 'absent' | 'fullscreen' | 'backstage' | 'close' | null;

/**
 * Mapa de teclas do palco. Passadores de slide costumam ter um botão de "tela preta"
 * que envia B, "." ou W, e botão "voltar" que envia PageUp: todos são ignorados.
 * O Bastidores usa Ctrl/Cmd+K, que nenhum passador envia.
 */
export function stageKeyAction(
  e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey'>,
  ctx: { typing: boolean; modalOpen: boolean },
): StageKeyAction {
  if (e.ctrlKey || e.metaKey) return e.key.toLowerCase() === 'k' ? 'backstage' : null;
  if (e.key === 'Escape') return 'close';
  if (ctx.typing || ctx.modalOpen) return null;
  switch (e.key) {
    case ' ':
    case 'Enter':
    case 'ArrowRight':
    case 'PageDown':
      return 'primary';
    case 'r':
    case 'R':
      return 'absent';
    case 'f':
    case 'F':
      return 'fullscreen';
    default:
      return null;
  }
}

type Handlers = Partial<Record<Exclude<StageKeyAction, null>, () => void>>;

export function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
}

export function useStageHotkeys(handlers: Handlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = isTyping(document.activeElement);
      // Passadores de slide costumam enviar F5: recarregar tiraria o palco da tela cheia.
      if (!typing && (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r'))) {
        e.preventDefault();
        return;
      }
      if (e.repeat) return;
      const action = stageKeyAction(e, {
        typing,
        modalOpen: !!document.querySelector('[role="dialog"]'),
      });
      if (!action) return;
      const fn = ref.current[action];
      if (!fn) return;
      e.preventDefault(); // evita rolar a página e "clicar" no botão focado junto com o atalho
      fn();
      if (action === 'primary') {
        const el = document.activeElement as HTMLElement | null;
        if (el && el.tagName === 'BUTTON') el.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
