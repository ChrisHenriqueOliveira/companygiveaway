export function newId(): string {
  return crypto.randomUUID();
}

/** Inteiro uniforme em [0, maxExclusive) via crypto, com rejeição (sem viés de módulo). */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive deve ser um inteiro positivo');
  }
  const limit = Math.floor(2 ** 32 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % maxExclusive;
  }
}

export function pickOne<T>(items: readonly T[]): T {
  if (items.length === 0) throw new Error('lista vazia');
  return items[secureRandomInt(items.length)];
}

/** n elementos distintos (Fisher-Yates parcial). n > length devolve todos. */
export function sampleUnique<T>(items: readonly T[], n: number): T[] {
  const arr = [...items];
  const take = Math.min(n, arr.length);
  for (let i = 0; i < take; i++) {
    const j = i + secureRandomInt(arr.length - i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, take);
}
