import { useEffect } from 'react';
import { isTyping } from '../stage/hotkeys';
import { getActions } from '../store/actions';

/**
 * Depois de clicar na janela de Controle ela fica com o foco do teclado, e o passador de slides
 * deixaria de falar com o palco. Repassamos só as teclas de "avançar" do passador (PageDown e →).
 * Espaço/Enter ficam de fora de propósito: acionariam o botão ou o toggle que estiver em foco.
 */
export function controlKeyAction(
  e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean },
  ctx: { typing: boolean; modalOpen: boolean },
): 'primary' | null {
  if (e.ctrlKey || e.metaKey || e.altKey || ctx.typing || ctx.modalOpen) return null;
  return e.key === 'PageDown' || e.key === 'ArrowRight' ? 'primary' : null;
}

export function useControlHotkeys(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const action = controlKeyAction(e, {
        typing: isTyping(document.activeElement),
        modalOpen: !!document.querySelector('[role="dialog"]'),
      });
      if (action !== 'primary') return;
      e.preventDefault();
      getActions().stagePrimary(); // o palco aplica a mesma trava do clicker
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
