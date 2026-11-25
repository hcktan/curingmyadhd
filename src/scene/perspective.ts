/* Sahne: perspektif. Ufuk y=470, başlangıç y=690. s=1 yakın, s küçüldükçe uzak. */

export const YH = 470;
export const YB = 690;
export const K = 3.5;
export const X0 = 205;
export const DX = 30;
export const PSCALE = 1.35;
export const SEND = 1 / (1 + K);

export interface PerspPoint {
  s: number;
  x: number;
  y: number;
}

export function persp(p: number): PerspPoint {
  const s = 1 / (1 + K * p);
  return { s, x: X0 + (DX * (1 - s)) / (1 - SEND), y: YH + (YB - YH) * s };
}

/** Sabit tohumlu rastgele sayı üreteci (mulberry32). */
export function rng(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
