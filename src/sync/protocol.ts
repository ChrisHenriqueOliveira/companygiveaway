import type { AppData } from '../domain/types';
import { ACTION_NAMES, type ActionName } from '../store/actions';
import type { Rehearsal } from '../store/appStore';

export const PROTOCOL = 'sorteio-viceri/1';
/** Sem nenhum contato por mais que isso, o Controle se considera desconectado. */
export const CONNECTION_TIMEOUT_MS = 3_000;

export type Msg =
  | { t: 'hello' } // controle → palco: "estou aqui, me manda o estado"
  | { t: 'state'; data: AppData; rehearsal: Rehearsal; storageError: string | null } // palco → controle
  | { t: 'action'; name: ActionName; args: unknown[] } // controle → palco
  | { t: 'ping' }
  | { t: 'pong' };

export type Envelope = { p: string; m: Msg };

const TYPES = new Set(['hello', 'state', 'action', 'ping', 'pong']);

export function isEnvelope(x: unknown): x is Envelope {
  if (typeof x !== 'object' || x === null) return false;
  const e = x as { p?: unknown; m?: unknown };
  if (e.p !== PROTOCOL || typeof e.m !== 'object' || e.m === null) return false;
  return TYPES.has((e.m as { t?: unknown }).t as string);
}

const wrap = (m: Msg): Envelope => ({ p: PROTOCOL, m });

interface HubDeps {
  getSnapshot: () => Msg;
  apply: (name: ActionName, args: unknown[]) => void;
  post: (target: MessageEventSource, env: unknown) => void;
}

/** Lado do palco (dono do estado): registra janelas de Controle, devolve estado e executa comandos. */
export function createOwnerHub(deps: HubDeps) {
  const clients = new Set<MessageEventSource>();

  const sendState = (to: MessageEventSource) => deps.post(to, wrap(deps.getSnapshot()));

  return {
    onMessage(e: { data: unknown; source: MessageEventSource | null }): void {
      if (!isEnvelope(e.data) || !e.source) return;
      const { m } = e.data;
      switch (m.t) {
        case 'hello':
          clients.add(e.source);
          sendState(e.source);
          return;
        case 'ping':
          if (clients.has(e.source)) {
            deps.post(e.source, wrap({ t: 'pong' }));
          } else {
            // palco recarregou e perdeu o registro: trata o ping como hello para o Controle voltar sozinho
            clients.add(e.source);
            sendState(e.source);
          }
          return;
        case 'action':
          if (clients.has(e.source) && ACTION_NAMES.includes(m.name) && Array.isArray(m.args)) {
            deps.apply(m.name, m.args);
          }
          return;
        default:
          return;
      }
    },
    broadcast(): void {
      for (const c of [...clients]) {
        if ((c as Window).closed) {
          clients.delete(c);
          continue;
        }
        sendState(c);
      }
    },
    clientCount: () => clients.size,
  };
}

interface LinkDeps {
  post: (env: unknown) => void;
  onState: (m: Extract<Msg, { t: 'state' }>) => void;
  now: () => number;
}

/** Lado do Controle (espelho): mantém a conexão viva e envia comandos ao palco. */
export function createMirrorLink(deps: LinkDeps) {
  let lastContact = Number.NEGATIVE_INFINITY;
  const connected = () => deps.now() - lastContact < CONNECTION_TIMEOUT_MS + 500;

  return {
    onMessage(e: { data: unknown }): void {
      if (!isEnvelope(e.data)) return;
      const { m } = e.data;
      if (m.t === 'state') {
        lastContact = deps.now();
        deps.onState(m);
      } else if (m.t === 'pong') {
        lastContact = deps.now();
      }
    },
    tick(): void {
      deps.post(wrap({ t: connected() ? 'ping' : 'hello' }));
    },
    connected,
    send(name: ActionName, args: unknown[]): void {
      if (!connected()) return;
      deps.post(wrap({ t: 'action', name, args }));
    },
  };
}
