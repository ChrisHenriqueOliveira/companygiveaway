import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTickTracker } from '../../src/audio/tickTracker';

describe('createTickTracker (um tique por nome que passa pelo centro)', () => {
  it('ticks exactly when the reel position crosses a row boundary (rounded row changes)', () => {
    const track = createTickTracker(2);
    expect(track(2.0)).toBe(0);
    expect(track(2.3)).toBe(0); // ainda é a mesma linha no centro
    expect(track(2.49)).toBe(0);
    expect(track(2.51)).toBe(1); // o próximo nome chegou ao centro
    expect(track(2.9)).toBe(0);
    expect(track(3.4)).toBe(0);
    expect(track(3.6)).toBe(1);
  });

  it('reports every row crossed when the position jumps (fast reel / dropped frames)', () => {
    const track = createTickTracker(0);
    expect(track(3.2)).toBe(3);
    expect(track(3.4)).toBe(0);
    expect(track(7.1)).toBe(4);
  });

  it('is silent while the reel is not moving and for the overshoot/spring that stays on the same row', () => {
    const track = createTickTracker(41);
    expect(track(41)).toBe(0);
    expect(track(41.14)).toBe(0); // passa um pouquinho do alvo...
    expect(track(41.02)).toBe(0); // ...e volta pela mola, sem tique extra
  });

  it('counts a backwards move too (never negative)', () => {
    const track = createTickTracker(5);
    expect(track(3.9)).toBe(1);
  });
});

// ---------------------------------------------------------------- motor de som (WebAudio falso)
class FakeParam {
  calls: Array<[string, number, number]> = [];
  value = 0;
  setValueAtTime(v: number, t: number) { this.calls.push(['set', v, t]); return this; }
  exponentialRampToValueAtTime(v: number, t: number) { this.calls.push(['exp', v, t]); return this; }
  linearRampToValueAtTime(v: number, t: number) { this.calls.push(['lin', v, t]); return this; }
  cancelScheduledValues() { return this; }
}
class FakeNode { connect<T>(n: T): T { return n; } disconnect() {} }
class FakeOsc extends FakeNode { type = 'sine'; frequency = new FakeParam(); started = false; start() { this.started = true; } stop() {} }
class FakeGain extends FakeNode { gain = new FakeParam(); }
class FakeFilter extends FakeNode { type = 'lowpass'; frequency = new FakeParam(); Q = new FakeParam(); }
class FakeSource extends FakeNode { buffer: unknown = null; start() {} stop() {} }
class FakeCtx {
  static last: FakeCtx;
  currentTime = 0;
  state = 'running';
  sampleRate = 44100;
  destination = new FakeNode();
  oscs: FakeOsc[] = [];
  gains: FakeGain[] = [];
  sources: FakeSource[] = [];
  constructor() { FakeCtx.last = this; }
  createOscillator() { const o = new FakeOsc(); this.oscs.push(o); return o; }
  createGain() { const g = new FakeGain(); this.gains.push(g); return g; }
  createBiquadFilter() { return new FakeFilter(); }
  createBufferSource() { const s = new FakeSource(); this.sources.push(s); return s; }
  createBuffer(_c: number, len: number) { return { getChannelData: () => new Float32Array(len) }; }
  createDynamicsCompressor() { const n = new FakeNode() as FakeNode & Record<string, FakeParam>; for (const k of ['threshold', 'knee', 'ratio', 'attack', 'release']) n[k] = new FakeParam(); return n; }
  resume() { return Promise.resolve(); }
}

const firstFreq = (o: FakeOsc) => o.frequency.calls.find((c) => c[0] === 'set')![1];

describe('reel sound engine', () => {
  beforeEach(async () => {
    vi.stubGlobal('AudioContext', FakeCtx);
    const engine = await import('../../src/audio/reelSound');
    engine.__resetAudioForTests();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('a tick is a short percussive click, higher pitched and quieter when the reel is fast', async () => {
    const { playTick } = await import('../../src/audio/reelSound');
    playTick(2); // devagar
    const slow = FakeCtx.last.oscs[0];
    const slowGain = FakeCtx.last.gains.map((g) => g.gain.calls.find((c) => c[0] === 'exp')?.[1] ?? 0);
    playTick(28); // rápido
    const fast = FakeCtx.last.oscs[FakeCtx.last.oscs.length - 1];

    expect(slow.started && fast.started).toBe(true);
    expect(firstFreq(fast)).toBeGreaterThan(firstFreq(slow));
    const allPeaks = FakeCtx.last.gains.map((g) => g.gain.calls.find((c) => c[0] === 'exp')?.[1] ?? 0);
    const slowPeak = Math.max(...slowGain);
    const fastPeak = Math.max(...allPeaks.slice(slowGain.length));
    expect(fastPeak).toBeLessThan(slowPeak);
  });

  it('the celebration is a short ascending three-note chime', async () => {
    const { playWin } = await import('../../src/audio/reelSound');
    playWin();
    const freqs = FakeCtx.last.oscs.map(firstFreq).filter((f) => f > 300);
    const notes = freqs.slice(0, 3);
    expect(notes).toHaveLength(3);
    expect(notes[0]).toBeLessThan(notes[1]);
    expect(notes[1]).toBeLessThan(notes[2]);
  });

  it('never throws where WebAudio does not exist', async () => {
    vi.unstubAllGlobals();
    const engine = await import('../../src/audio/reelSound');
    engine.__resetAudioForTests();
    expect(() => {
      engine.playTick(5);
      engine.playWin();
      engine.unlockAudio();
    }).not.toThrow();
  });
});

describe('gift and confetti sounds', () => {
  beforeEach(async () => {
    vi.stubGlobal('AudioContext', FakeCtx);
    (await import('../../src/audio/reelSound')).__resetAudioForTests();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const peak = (from: number) =>
    Math.max(0, ...FakeCtx.last.gains.slice(from).map((g) => g.gain.calls.find((x) => x[0] === 'exp')?.[1] ?? 0));

  it('the shake is a soft rattle that gets stronger as the anticipation grows', async () => {
    const { playShake } = await import('../../src/audio/reelSound');
    playShake(0.2);
    const afterFirst = FakeCtx.last.gains.length;
    const soft = peak(0);
    playShake(1);
    expect(peak(afterFirst)).toBeGreaterThan(soft);
    expect(FakeCtx.last.sources.length).toBeGreaterThanOrEqual(2); // um ruído por chacoalhada
  });

  it('the gift pop is a quick falling "pop" plus a whoosh of air', async () => {
    const { playPop } = await import('../../src/audio/reelSound');
    playPop();
    const osc = FakeCtx.last.oscs[0];
    const start = osc.frequency.calls.find((x) => x[0] === 'set')![1];
    const end = osc.frequency.calls.find((x) => x[0] === 'exp')![1];
    expect(end).toBeLessThan(start); // o pitch cai: "pop"
    expect(FakeCtx.last.sources.length).toBeGreaterThanOrEqual(2); // estalo + sopro
  });

  it('the confetti is two cannon pops followed by a crackle of many tiny sparkles', async () => {
    const { playConfetti } = await import('../../src/audio/reelSound');
    playConfetti();
    expect(FakeCtx.last.oscs.length).toBeGreaterThanOrEqual(2); // dois estouros
    expect(FakeCtx.last.sources.length).toBeGreaterThanOrEqual(10); // chuvisco de brilhos
  });

  it('the rattle pulses about every swing of the box until it is stopped, and respects the on/off switch', async () => {
    vi.useFakeTimers();
    const { startRattle } = await import('../../src/audio/reelSound');

    const stop = startRattle(1100);
    vi.advanceTimersByTime(1100);
    const pulses = FakeCtx.last.oscs.length;
    expect(pulses).toBeGreaterThanOrEqual(6);
    expect(pulses).toBeLessThanOrEqual(8);

    stop();
    vi.advanceTimersByTime(1000);
    expect(FakeCtx.last.oscs.length).toBe(pulses);

    const before = FakeCtx.last.oscs.length;
    const stopMuted = startRattle(1100, () => false);
    vi.advanceTimersByTime(1100);
    stopMuted();
    expect(FakeCtx.last.oscs.length).toBe(before);
  });
});
