import { describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { createMirrorLink, createOwnerHub, isEnvelope, PROTOCOL, type Msg } from '../../src/sync/protocol';

const win = () => ({ postMessage: vi.fn() }) as unknown as MessageEventSource;
const env = (m: Msg) => ({ p: PROTOCOL, m });
const snapshot = (): Msg => ({
  t: 'state',
  data: createEmptyData(),
  rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
  storageError: null,
});

function makeHub() {
  const posted: Array<{ to: MessageEventSource; env: { p: string; m: Msg } }> = [];
  const apply = vi.fn();
  const hub = createOwnerHub({
    getSnapshot: snapshot,
    apply,
    post: (to, e) => posted.push({ to, env: e as { p: string; m: Msg } }),
  });
  return { hub, posted, apply };
}

describe('isEnvelope', () => {
  it('accepts only our protocol with a known message type', () => {
    expect(isEnvelope(env({ t: 'hello' }))).toBe(true);
    expect(isEnvelope({ p: 'outro/1', m: { t: 'hello' } })).toBe(false);
    expect(isEnvelope({ p: PROTOCOL, m: { t: 'drop-tables' } })).toBe(false);
    expect(isEnvelope({ p: PROTOCOL })).toBe(false);
    expect(isEnvelope(null)).toBe(false);
    expect(isEnvelope('hello')).toBe(false);
  });
});

describe('owner hub (palco)', () => {
  it('answers hello with the full state and registers the sender', () => {
    const { hub, posted } = makeHub();
    const a = win();
    hub.onMessage({ data: env({ t: 'hello' }), source: a });
    expect(hub.clientCount()).toBe(1);
    expect(posted).toHaveLength(1);
    expect(posted[0].to).toBe(a);
    expect(posted[0].env.m.t).toBe('state');
  });

  it('broadcast reaches every registered window', () => {
    const { hub, posted } = makeHub();
    const a = win();
    const b = win();
    hub.onMessage({ data: env({ t: 'hello' }), source: a });
    hub.onMessage({ data: env({ t: 'hello' }), source: b });
    posted.length = 0;
    hub.broadcast();
    expect(posted.map((p) => p.to)).toEqual([a, b]);
  });

  it('only applies actions from registered windows, with valid names', () => {
    const { hub, apply } = makeHub();
    const a = win();
    const stranger = win();
    hub.onMessage({ data: env({ t: 'hello' }), source: a });

    hub.onMessage({ data: env({ t: 'action', name: 'stageNext', args: [] }), source: stranger });
    expect(apply).not.toHaveBeenCalled();

    hub.onMessage({ data: env({ t: 'action', name: 'constructor' as never, args: [] }), source: a });
    hub.onMessage({ data: env({ t: 'action', name: 'rm -rf' as never, args: [] }), source: a });
    expect(apply).not.toHaveBeenCalled();

    hub.onMessage({ data: env({ t: 'action', name: 'addPrizes', args: [{ name: 'X', quantity: 1 }] }), source: a });
    expect(apply).toHaveBeenCalledWith('addPrizes', [{ name: 'X', quantity: 1 }]);
  });

  it('ping from a registered window gets pong; from an unknown one is treated as hello (state)', () => {
    const { hub, posted } = makeHub();
    const a = win();
    hub.onMessage({ data: env({ t: 'ping' }), source: a });
    expect(posted[0].env.m.t).toBe('state');
    expect(hub.clientCount()).toBe(1);
    hub.onMessage({ data: env({ t: 'ping' }), source: a });
    expect(posted[1].env.m.t).toBe('pong');
  });

  it('ignores junk, other protocols and messages without a source', () => {
    const { hub, posted, apply } = makeHub();
    hub.onMessage({ data: { p: 'x', m: { t: 'hello' } }, source: win() });
    hub.onMessage({ data: 'hello', source: win() });
    hub.onMessage({ data: env({ t: 'hello' }), source: null });
    expect(hub.clientCount()).toBe(0);
    expect(posted).toHaveLength(0);
    expect(apply).not.toHaveBeenCalled();
  });
});

describe('mirror link (controle)', () => {
  function makeLink() {
    let now = 1_000;
    const posted: Array<{ p: string; m: Msg }> = [];
    const onState = vi.fn();
    const link = createMirrorLink({ post: (e) => posted.push(e as { p: string; m: Msg }), onState, now: () => now });
    return { link, posted, onState, advance: (ms: number) => (now += ms) };
  }

  it('starts disconnected, says hello on tick, connects on state', () => {
    const { link, posted, onState } = makeLink();
    expect(link.connected()).toBe(false);
    link.tick();
    expect(posted.map((e) => e.m.t)).toEqual(['hello']);
    link.onMessage({ data: env(snapshot()) });
    expect(link.connected()).toBe(true);
    expect(onState).toHaveBeenCalledTimes(1);
  });

  it('pings while connected, and a pong keeps it alive', () => {
    const { link, posted, advance } = makeLink();
    link.onMessage({ data: env(snapshot()) });
    posted.length = 0;
    advance(2_000);
    link.tick();
    expect(posted.map((e) => e.m.t)).toEqual(['ping']);
    link.onMessage({ data: env({ t: 'pong' }) });
    advance(2_000);
    expect(link.connected()).toBe(true);
  });

  it('drops to disconnected after 3.5 s of silence and says hello again', () => {
    const { link, posted, advance } = makeLink();
    link.onMessage({ data: env(snapshot()) });
    advance(3_500);
    expect(link.connected()).toBe(false);
    posted.length = 0;
    link.tick();
    expect(posted.map((e) => e.m.t)).toEqual(['hello']);
  });

  it('sends actions only while connected', () => {
    const { link, posted } = makeLink();
    link.send('stageNext', []);
    expect(posted).toHaveLength(0);
    link.onMessage({ data: env(snapshot()) });
    link.send('stageNext', []);
    expect(posted).toEqual([env({ t: 'action', name: 'stageNext', args: [] })]);
  });

  it('ignores envelopes from another protocol', () => {
    const { link, onState } = makeLink();
    link.onMessage({ data: { p: 'x/1', m: snapshot() } });
    expect(onState).not.toHaveBeenCalled();
    expect(link.connected()).toBe(false);
  });
});

describe('reconnection after the stage window reloads (Review Focus 5)', () => {
  it('a fresh hub with no registered windows re-registers the control window and sends state again', () => {
    let now = 1_000;
    const control = win();
    const onState = vi.fn();
    let hub: ReturnType<typeof createOwnerHub>;

    // fiação: link -> hub (source = janela de controle); hub -> link
    const newHub = () =>
      createOwnerHub({
        getSnapshot: snapshot,
        apply: () => undefined,
        post: (to, e) => {
          if (to === control) link.onMessage({ data: e });
        },
      });
    const link = createMirrorLink({
      post: (e) => hub.onMessage({ data: e, source: control }),
      onState,
      now: () => now,
    });

    hub = newHub();
    link.tick(); // hello -> state
    expect(link.connected()).toBe(true);
    expect(onState).toHaveBeenCalledTimes(1);

    // palco recarregou: hub novo, sem ninguém registrado
    hub = newHub();
    expect(hub.clientCount()).toBe(0);
    now += 1_000;
    link.tick(); // ainda 'conectado' -> manda ping; o hub novo trata como hello e devolve o estado
    expect(hub.clientCount()).toBe(1);
    expect(onState).toHaveBeenCalledTimes(2);
    expect(link.connected()).toBe(true);
  });
});
