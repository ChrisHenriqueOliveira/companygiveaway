/**
 * Sons do sorteio, sintetizados com WebAudio (sem arquivos, funciona offline).
 * Tudo passa por uma "sala" (reverb sintético) para ganhar corpo e cauda, em vez de soar seco:
 * tique da roleta, sopro do rolo, chocalho/pop do presente, comemoração e confete.
 */
let ctx: AudioContext | null = null;
let out: AudioNode | null = null; // som com reverb
let dry: AudioNode | null = null; // som direto, sem reverb (tiques ficam nítidos)
let noise: AudioBuffer | null = null;

/** Só para testes: descarta o contexto de áudio criado. */
export function __resetAudioForTests(): void {
  ctx = null;
  out = null;
  dry = null;
  noise = null;
}

/** Resposta de impulso de uma sala pequena e quente: ruído que decai e vai escurecendo. */
function roomImpulse(c: AudioContext, seconds = 1.7): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let seed = 987654 + ch * 7919;
    let lp = 0;
    for (let i = 0; i < len; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const white = (seed / 0xffffffff) * 2 - 1;
      const t = i / len;
      lp += (white - lp) * (0.55 - 0.45 * t); // vai ficando mais grave com o tempo
      d[i] = lp * Math.pow(1 - t, 2.6);
    }
  }
  return buf;
}

function audio(): { c: AudioContext; out: AudioNode; dry: AudioNode } | null {
  try {
    if (!ctx) {
      const g = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const AC = g.AudioContext ?? g.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor(); // evita estalos quando vários sons se somam
      comp.threshold.setValueAtTime(-14, ctx.currentTime);
      comp.ratio.setValueAtTime(6, ctx.currentTime);
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.9, ctx.currentTime);
      master.connect(comp);
      comp.connect(ctx.destination);
      dry = master;

      const bus = ctx.createGain();
      bus.connect(master);
      if (typeof ctx.createConvolver === 'function') {
        const room = ctx.createConvolver();
        room.buffer = roomImpulse(ctx);
        const send = ctx.createGain();
        send.gain.setValueAtTime(0.32, ctx.currentTime);
        bus.connect(send);
        send.connect(room);
        room.connect(master);
      }
      out = bus;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return { c: ctx, out: out as AudioNode, dry: dry as AudioNode };
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

/** Uma nota "de sino": seno com ataque macio e cauda longa (a sala completa o resto). */
function bell(c: AudioContext, dest: AudioNode, t: number, freq: number, vol: number, tail: number) {
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + tail);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + tail + 0.05);
}

/**
 * Tique de roleta (a "palheta" batendo no pino). `speed` = linhas por segundo do rolo:
 * rápido = mais agudo, curto e baixinho; devagar = mais grave, mais longo e mais forte.
 * Sai direto (sem reverb) para os tiques continuarem nítidos; o sopro do rolo dá o "clima".
 */
export function playTick(speed = 6): void {
  const a = audio();
  if (!a) return;
  const { c, dry: dest } = a;
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

/**
 * Sopro contínuo do rolo girando (ar passando): o volume e o brilho seguem a velocidade, então ele
 * cresce quando o rolo acelera e vai sumindo junto com a desaceleração, sem corte seco no fim.
 * `set(velocidade em linhas/s)` a cada movimento; `stop()` apaga suavemente.
 */
export function startWhoosh(): { set: (speed: number) => void; stop: () => void } {
  const a = audio();
  if (!a) return { set: () => undefined, stop: () => undefined };
  const { c, out: dest } = a;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  src.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.setValueAtTime(0.7, c.currentTime);
  bp.frequency.setValueAtTime(500, c.currentTime);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start(c.currentTime);
  let stopped = false;
  return {
    set(speed: number) {
      if (stopped) return;
      const s = Math.min(Math.abs(speed), 30);
      const t = c.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.linearRampToValueAtTime(Math.min(0.075, 0.0001 + s * 0.0035), t + 0.09);
      bp.frequency.cancelScheduledValues(t);
      bp.frequency.linearRampToValueAtTime(420 + s * 90, t + 0.09);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      const t = c.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.5); // apaga em meio segundo
      src.stop(t + 0.55);
    },
  };
}

/**
 * Comemoração quando o ganhador é selecionado: arpejo dó-mi-sol-dó (sinos macios) com cauda de sala
 * e um brilho de confete. Curto, mas termina "no ar", sem corte.
 */
export function playWin(): void {
  const a = audio();
  if (!a) return;
  const { c, out: dest } = a;
  const t0 = c.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => bell(c, dest, t0 + i * 0.1, f, i === 3 ? 0.2 : 0.17, i === 3 ? 1.5 : 0.9));
  notes.forEach((f, i) => bell(c, dest, t0 + i * 0.1, f * 2, 0.04, 0.5)); // brilho (harmônico)
  burstOfNoise(c, dest, t0, 3400, 0.09, 0.07);
  burstOfNoise(c, dest, t0 + 0.3, 5200, 0.05, 0.12);
}

/**
 * Chacoalhada do presente: um chocalho (ruído curto + um "toc" grave) que ecoa na sala.
 * `intensity` (0 a 1) cresce com a expectativa: mais forte e mais brilhante perto de estourar.
 */
export function playShake(intensity = 0.6): void {
  const a = audio();
  if (!a) return;
  const { c, out: dest } = a;
  const i = Math.min(1, Math.max(0, intensity));
  const t = c.currentTime;
  burstOfNoise(c, dest, t, 1700 + 900 * i, 0.05 + 0.12 * i, 0.07);

  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150 + 60 * i, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.03 + 0.07 * i, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.11);
}

/**
 * Chocalho contínuo enquanto o presente balança: uma chacoalhada a cada balanço da caixa
 * (o balanço dura 1,1 s em 7 movimentos), ficando mais forte até `totalMs`, com um tom suave de
 * expectativa subindo por baixo. Devolve a função que para (o tom some em um instante, sem corte).
 * `isOn` é consultado a cada chacoalhada, então ligar/desligar o som vale na hora.
 */
export function startRattle(totalMs: number, isOn: () => boolean = () => true): () => void {
  const SWING_MS = 157;
  const t0 = Date.now();
  let riser: { fade: () => void; mute: () => void } | null = null;

  const makeRiser = () => {
    const a = audio();
    if (!a) return;
    const { c, out: dest } = a;
    const t = c.currentTime;
    const dur = Math.max(0.5, totalMs / 1000);
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(196, t);
    osc.frequency.exponentialRampToValueAtTime(392, t + dur); // sobe uma oitava até a abertura
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(1800, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.055, t + dur);
    osc.connect(lp);
    lp.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 1);
    riser = {
      fade: () => {
        const now = c.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.linearRampToValueAtTime(0.0001, now + 0.12);
      },
      mute: () => {
        g.gain.cancelScheduledValues(c.currentTime);
        g.gain.setValueAtTime(0.0001, c.currentTime);
      },
    };
  };

  const id = setInterval(() => {
    if (!isOn()) {
      riser?.mute();
      return;
    }
    if (!riser) makeRiser();
    const k = Math.min(1, (Date.now() - t0) / Math.max(1, totalMs));
    playShake(0.35 + 0.65 * k);
  }, SWING_MS);

  return () => {
    clearInterval(id);
    riser?.fade();
  };
}

/** A tampa do presente estoura: um "pop" que cai de tom, um estalo, um sopro de ar subindo e um sininho. */
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
  bp.frequency.exponentialRampToValueAtTime(3800, t + 0.4);
  bp.Q.setValueAtTime(0.8, t);
  const ag = c.createGain();
  ag.gain.setValueAtTime(0.0001, t);
  ag.gain.exponentialRampToValueAtTime(0.13, t + 0.06);
  ag.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  air.connect(bp);
  bp.connect(ag);
  ag.connect(dest);
  air.start(t);
  air.stop(t + 0.48);

  // sininhos de "surpresa" que ficam ecoando
  bell(c, dest, t + 0.07, 1318.5, 0.07, 1.1);
  bell(c, dest, t + 0.15, 1760, 0.05, 1.2);
}

/**
 * Confete na revelação do ganhador: dois estouros de canhão, um chuvisco de brilhinhos que vai
 * diminuindo e dois sininhos que ficam ecoando (tons levemente irregulares, mas determinísticos).
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
    burstOfNoise(c, dest, t, 4200 + ((j * 911) % 7) * 450, vol, 0.03);
  }

  bell(c, dest, t0 + 0.2, 1046.5, 0.08, 1.6);
  bell(c, dest, t0 + 0.38, 1568, 0.06, 1.8);
}
