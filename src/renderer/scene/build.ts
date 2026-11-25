/* Sahnenin durağan parçaları: zemin çizgileri, yıldızlar ve kar taneleri. */

import { rng } from './perspective';

const SVGNS = 'http://www.w3.org/2000/svg';

export const WMIN = 0.5;
export const WMAX = 8;

export interface Ripple {
  w: number;
  off: number;
  len: number;
  bend: number;
  light: boolean;
  el: SVGPathElement;
}
export interface Flake {
  el: SVGCircleElement;
  thr: number;
}

export function el<T extends SVGElement>(name: string, attrs: Record<string, string>, parent: Element): T {
  const e = document.createElementNS(SVGNS, name) as T;
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}

/** Tohum 11 ile çizer. Rastgele sayıların çekiliş sırası kaynakla birebir aynıdır. */
export function buildStatic(reduceMotion: boolean): { ripples: Ripple[]; flakes: Flake[] } {
  const r = rng(11);
  const $ = (id: string) => document.getElementById(id)!;
  const ripples: Ripple[] = [];
  const flakes: Flake[] = [];
  const g = $('ripples');
  for (let i = 0; i < 130; i++) {
    const light = i % 2 === 0;
    const w = WMIN + r() * (WMAX - WMIN);
    const off = (r() - 0.5) * 840;
    const len = 30 + 120 * r();
    const bend = (r() - 0.5) * 7;
    const e = el<SVGPathElement>('path', { stroke: light ? 'var(--ripple-l)' : 'var(--ripple-d)' }, g);
    ripples.push({ w, off, len, bend, light, el: e });
  }
  const sg = $('stars');
  for (let i = 0; i < 46; i++) {
    const cx = (r() * 430).toFixed(1);
    const cy = (r() * 320).toFixed(1);
    const rad = (0.5 + r() * 0.8).toFixed(2);
    const fo = (0.4 + r() * 0.6).toFixed(2);
    el('circle', { cx, cy, r: rad, 'fill-opacity': fo }, sg);
  }
  const fg = $('flakes');
  for (let i = 0; i < 120; i++) {
    const sz = 0.7 + r() * 1.9;
    const cx = (-20 + r() * 500).toFixed(1);
    const cy = reduceMotion ? (r() * 860).toFixed(0) : '0';
    const fo = (0.45 + r() * 0.5).toFixed(2);
    const c = el<SVGCircleElement>(
      'circle',
      { cx, cy, r: sz.toFixed(2), fill: 'var(--flake)', 'fill-opacity': fo, class: 'snowf' },
      fg,
    );
    const dur = (18 - sz * 4.5 + r() * 3).toFixed(1);
    const delay = (r() * 20).toFixed(1);
    const dx = (-30 - r() * 70).toFixed(0);
    c.setAttribute('style', 'animation-duration:' + dur + 's;animation-delay:-' + delay + 's;--dx:' + dx + 'px');
    flakes.push({ el: c, thr: r() * 1.08 });
  }
  return { ripples, flakes };
}

/** Geniş pencerede 0..430 sütununun dışına düşen yıldız, kar ve zemin çizgileri.
    Ayrı tohumlarla üretilir: sütunun içindeki rastgele dizi (tohum 11) hiç değişmez.
    Bu öğeler yalnızca `.app.wide` iken görünür. */
export function buildWide(reduceMotion: boolean): { ripples: Ripple[]; flakes: Flake[] } {
  const $ = (id: string) => document.getElementById(id)!;
  const yan = (r: () => number, ic: number, dis: number) => {
    // Sütunun soluna ya da sağına, sütundan `ic` ile `dis` birim uzağa.
    const d = ic + r() * (dis - ic);
    return r() < 0.5 ? -d : 430 + d;
  };

  const rs = rng(12);
  const sg = $('stars-wide');
  for (let i = 0; i < 160; i++) {
    const cx = yan(rs, 0, 1500).toFixed(1);
    const cy = (rs() * 320).toFixed(1);
    el('circle', { cx, cy, r: (0.5 + rs() * 0.8).toFixed(2), 'fill-opacity': (0.4 + rs() * 0.6).toFixed(2) }, sg);
  }

  const rf = rng(13);
  const fg = $('flakes-wide');
  const flakes: Flake[] = [];
  for (let i = 0; i < 360; i++) {
    const sz = 0.7 + rf() * 1.9;
    const cx = yan(rf, 0, 1600).toFixed(1);
    const cy = reduceMotion ? (rf() * 860).toFixed(0) : '0';
    const c = el<SVGCircleElement>(
      'circle',
      { cx, cy, r: sz.toFixed(2), fill: 'var(--flake)', 'fill-opacity': (0.45 + rf() * 0.5).toFixed(2), class: 'snowf' },
      fg,
    );
    const dur = (18 - sz * 4.5 + rf() * 3).toFixed(1);
    const delay = (rf() * 20).toFixed(1);
    const dx = (-30 - rf() * 70).toFixed(0);
    c.setAttribute('style', 'animation-duration:' + dur + 's;animation-delay:-' + delay + 's;--dx:' + dx + 'px');
    flakes.push({ el: c, thr: rf() * 1.08 });
  }

  const rr = rng(14);
  const g = $('ripples-wide');
  const ripples: Ripple[] = [];
  for (let i = 0; i < 240; i++) {
    const light = i % 2 === 0;
    const w = WMIN + rr() * (WMAX - WMIN);
    const mag = 420 + rr() * 2200;
    const off = rr() < 0.5 ? -mag : mag;
    const len = 30 + 120 * rr();
    const bend = (rr() - 0.5) * 7;
    const e = el<SVGPathElement>('path', { stroke: light ? 'var(--ripple-l)' : 'var(--ripple-d)' }, g);
    ripples.push({ w, off, len, bend, light, el: e });
  }
  return { ripples, flakes };
}
