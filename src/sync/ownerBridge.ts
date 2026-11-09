import { isStageLocked, lockStage } from '../stage/lock';
import type { ActionName } from '../store/actions';
import { selectData, useAppStore } from '../store/appStore';
import { createOwnerHub } from './protocol';

const STAGE_ACTIONS = new Set<ActionName>([
  'stageNext',
  'stageStartDraw',
  'stageFinishDrawing',
  'stageConfirm',
  'stageAbsent',
  'stageBackToIdle',
  'stageForcePrize',
  'undoLast',
  'removeDraw',
]);

/**
 * Aplica no palco uma ação vinda do Controle, respeitando a mesma trava do clicker: sem isso, um clique
 * no Controle e um aperto do passador logo depois avançariam dois passos de uma vez.
 */
export function applyFromControl(name: ActionName, args: unknown[]): void {
  if (name === 'stagePrimary' && isStageLocked()) return;
  const fn = useAppStore.getState()[name] as unknown as (...a: unknown[]) => void;
  fn(...args);
  if (name === 'stagePrimary') lockStage(600);
  else if (STAGE_ACTIONS.has(name)) lockStage(800);
}

/** Palco: dono do estado. Atende janelas de Controle e replica cada mudança para elas. */
export function startOwnerBridge(): () => void {
  const hub = createOwnerHub({
    getSnapshot: () => {
      const s = useAppStore.getState();
      return { t: 'state', data: selectData(s), rehearsal: s.rehearsal, storageError: s.storageError };
    },
    apply: applyFromControl,
    post: (target, env) => (target as Window).postMessage(env, '*'),
  });

  const onMessage = (e: MessageEvent) => hub.onMessage({ data: e.data, source: e.source });
  window.addEventListener('message', onMessage);

  let queued = false;
  const unsubscribe = useAppStore.subscribe(() => {
    if (queued || hub.clientCount() === 0) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      hub.broadcast(); // junta rajadas de mudanças num único envio
    });
  });

  return () => {
    window.removeEventListener('message', onMessage);
    unsubscribe();
  };
}
