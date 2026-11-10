/**
 * Sons do sorteio, sintetizados com WebAudio (sem arquivos, funciona offline).
 * Só dois sons existem: o tique da roleta e uma comemoração curta quando o ganhador é selecionado.
 */
let ctx: AudioContext | null = null;
let out: AudioNode | null = null;
let noise: AudioBuffer | null = null;

/** Só para testes: descarta o contexto de áudio criado. */
export function __resetAudioForTests(): void {
  ctx = null;
  out = null;
  noise = null;
}

function audio(): { c: AudioContext; out: AudioNode } | null {
  try {
    if (!ctx) {
      const g = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const AC = g.AudioContext ?? g.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor(); // evita estalos quando vários tiques se somam
      comp.threshold.setValueAtTime(-14, ctx.currentTime);
      comp.ratio.setValueAtTime(6, ctx.currentTime);
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.9, ctx.currentTime);
      master.connect(comp);
      comp.connect(ctx.destination);
      out = master;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return { c: ctx, out: out as AudioNode };
  } catch {
    return null;
  }
}

/** Navegadores só liberam áudio depois de um gesto do usuário: chame num clique/tecla. */
export function unlockAudio(): void {
  audio();
}

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noise) return noise;
  const len = Math.floor(c.sampleRate * 0.1);
  noise = c.createBuffer(1, len, c.sampleRate);
  const data = noise.getChannelData(0);
  let seed = 1234567;
  for (let i = 0; i < len; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0; // ruído determinístico (LCG)
    data[i] = (seed / 0xffffffff) * 2 - 1;
  }
  return noise;
}

function burstOfNoise(c: AudioContext, dest: AudioNode, t: number, freq: number, vol: number, dur: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(freq, t);
  bp.Q.setValueAtTime(1.2, t);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/**
 * Tique de roleta (a "palheta" batendo no pino). `speed` = linhas por segundo do rolo:
 * rápido = mais agudo, curto e baixinho; devagar = mais grave, mais longo e mais forte.
 */
export function playTick(speed = 6): void {
  const a = audio();
  if (!a) return;
  const { c, out: dest } = a;
  const s = Math.min(Math.abs(speed), 30);
  const t = c.currentTime;
  const freq = 520 + s * 14;
  const dur = Math.max(0.028, 0.07 - s * 0.0018);
  const vol = Math.max(0.12, 0.5 / (1 + s * 0.045));

  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.02);

  burstOfNoise(c, dest, t, freq * 2.2, vol * 0.45, 0.012);
}

/** Comemoração curta e discreta: três notas subindo (dó-mi-sol) e um "pop" de confete bem leve. */
export function playWin(): void {
  const a = audio();
  if (!a) return;
  const { c, out: dest } = a;
  const t0 = c.currentTime;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const t = t0 + i * 0.09;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, t);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.38);
  });
  burstOfNoise(c, dest, t0, 3200, 0.1, 0.06);
}
