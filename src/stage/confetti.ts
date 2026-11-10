import confetti from 'canvas-confetti';

const COLORS = ['#FD4237', '#FF8A3D', '#FFB41F', '#FF6B8B', '#19A7AD', '#8E5BD1'];
const RAIN_X = [0.2, 0.5, 0.8, 0.35, 0.65];

function safe(opts: confetti.Options) {
  try {
    void confetti({ colors: COLORS, disableForReducedMotion: false, ...opts });
  } catch {
    /* confete é só enfeite: nunca pode derrubar o palco */
  }
}

/** Explosão única (abrir o presente). */
export function burst(origin: { x: number; y: number } = { x: 0.5, y: 0.6 }, count = 170): void {
  safe({ particleCount: count, spread: 95, startVelocity: 48, origin });
}

/** Canhões laterais durante `ms` (revelação do ganhador). Devolve a função de limpeza. */
export function cannons(ms = 2400): () => void {
  const end = Date.now() + ms;
  let raf = 0;
  const frame = () => {
    safe({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0, y: 0.75 } });
    safe({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1, y: 0.75 } });
    if (Date.now() < end) raf = requestAnimationFrame(frame);
  };
  frame();
  return () => cancelAnimationFrame(raf);
}

/** Chuva suave e contínua (mural final). */
export function softRain(): () => void {
  let i = 0;
  const id = setInterval(() => {
    safe({ particleCount: 36, spread: 110, startVelocity: 28, gravity: 0.7, origin: { x: RAIN_X[i++ % RAIN_X.length], y: 0 } });
  }, 2600);
  return () => clearInterval(id);
}
