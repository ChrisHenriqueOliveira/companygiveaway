import type { ActionName } from '../store/actions';
import { selectData, useAppStore } from '../store/appStore';
import { createOwnerHub } from './protocol';

/** Palco: dono do estado. Atende janelas de Controle e replica cada mudança para elas. */
export function startOwnerBridge(): () => void {
  const hub = createOwnerHub({
    getSnapshot: () => {
      const s = useAppStore.getState();
      return { t: 'state', data: selectData(s), rehearsal: s.rehearsal, storageError: s.storageError };
    },
    apply: (name: ActionName, args: unknown[]) => {
      const fn = useAppStore.getState()[name] as unknown as (...a: unknown[]) => void;
      fn(...args);
    },
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
