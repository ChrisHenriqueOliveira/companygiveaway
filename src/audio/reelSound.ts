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

/**
 * Chacoalhada do presente: um chocalho suave (ruído curto + um "toc" grave).
 * `intensity` (0 a 1) cresce com a expectativa: mais forte e mais brilhante perto de estourar.
 */
export function playShake(intensity = 0.6): void {
  const a = audio();
  if (!a) return;
  const { c, out: dest } = a;
  const i = Math.min(1, Math.max(0, intensity));
  const t = c.currentTime;
  burstOfNoise(c, dest, t, 1700 + 900 * i, 0.05 + 0.12 * i, 0.05);

  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150 + 60 * i, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.03 + 0.07 * i, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.09);
}

/**
 * Chocalho contínuo enquanto o presente balança: uma chacoalhada a cada balanço da caixa
 * (o balanço dura 1,1 s em 7 movimentos), ficando mais forte até `totalMs`. Devolve a função que para.
 * `isOn` é consultado a cada chacoalhada, então ligar/desligar o som vale na hora.
 */
export function startRattle(totalMs: number, isOn: () => boolean = () => true): () => void {
  const SWING_MS = 157;
  const t0 = Date.now();
  const id = setInterval(() => {
    if (!isOn()) return;
    const k = Math.min(1, (Date.now() - t0) / Math.max(1, totalMs));
    playShake(0.35 + 0.65 * k);
  }, SWING_MS);
  return () => clearInterval(id);
}

/** A tampa do presente estoura: um "pop" que cai de tom, um estalo e um sopro de ar subindo. */
export function playPop(): void {
  const a = audio();
  if (!a) return;
  const { c, out: dest } = a;
  const t = c.currentTime;

  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(560, t);
  osc.frequency.exponentialRampToValueAtTime(130, t + 0.09);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.34, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.16);
  burstOfNoise(c, dest, t, 2400, 0.22, 0.05);

  const air = c.createBufferSource();
  air.buffer = noiseBuffer(c);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(700, t);
  bp.frequency.exponentialRampToValueAtTime(3800, t + 0.32);
  bp.Q.setValueAtTime(0.8, t);
  const ag = c.createGain();
  ag.gain.setValueAtTime(0.0001, t);
  ag.gain.exponentialRampToValueAtTime(0.13, t + 0.05);
  ag.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
  air.connect(bp);
  bp.connect(ag);
  ag.connect(dest);
  air.start(t);
  air.stop(t + 0.36);
}

/**
 * Confete na revelação do ganhador: dois estouros de canhão e, em seguida, um chuvisco de brilhinhos
 * que vai diminuindo (ruídos curtos e agudos com tempos e tons levemente irregulares, mas determinísticos).
 */
export function playConfetti(): void {
  const a = audio();
  if (!a) return;
  const { c, out: dest } = a;
  const t0 = c.currentTime;

  [0, 0.075].forEach((delay, k) => {
    const t = t0 + delay;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(k === 0 ? 520 : 400, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.24, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.14);
    burstOfNoise(c, dest, t, 2800, 0.14, 0.05);
  });

  for (let j = 0; j < 16; j++) {
    const t = t0 + 0.12 + j * 0.075 + ((j * 37) % 5) * 0.008;
    const vol = Math.max(0.012, 0.085 * (1 - j / 20));
    burstOfNoise(c, dest, t, 4200 + ((j * 911) % 7) * 450, vol, 0.022);
  }
}
