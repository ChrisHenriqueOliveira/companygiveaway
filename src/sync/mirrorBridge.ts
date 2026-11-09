import { ACTION_NAMES, resetActionsProvider, setActionsProvider } from '../store/actions';
import { useAppStore, type AppActions } from '../store/appStore';
import { createMirrorLink } from './protocol';

let snapshot = { connected: false };
const subs = new Set<() => void>();

export const subscribeLink = (cb: () => void) => {
  subs.add(cb);
  return () => void subs.delete(cb);
};
export const getLinkSnapshot = () => snapshot;

/** Controle: espelho do palco. Recebe o estado e converte as ações da UI em comandos ao palco. */
export function startMirror(): () => void {
  const link = createMirrorLink({
    post: (env) => {
      try {
        window.opener?.postMessage(env, '*');
      } catch {
        /* palco fechado */
      }
    },
    onState: (m) => useAppStore.setState({ ...m.data, rehearsal: m.rehearsal, storageError: m.storageError }),
    now: () => Date.now(),
  });

  const refresh = () => {
    const connected = link.connected();
    if (connected !== snapshot.connected) {
      snapshot = { connected };
      subs.forEach((f) => f());
    }
  };

  const onMessage = (e: MessageEvent) => {
    if (!window.opener || e.source !== window.opener) return; // só o palco que abriu esta janela
    link.onMessage({ data: e.data });
    refresh();
  };
  window.addEventListener('message', onMessage);

  const proxy = Object.fromEntries(
    ACTION_NAMES.map((name) => [name, (...args: unknown[]) => link.send(name, args)]),
  ) as unknown as AppActions;
  setActionsProvider(() => proxy);

  link.tick();
  const id = setInterval(() => {
    link.tick();
    refresh();
  }, 1000);

  return () => {
    clearInterval(id);
    window.removeEventListener('message', onMessage);
    resetActionsProvider();
  };
}
