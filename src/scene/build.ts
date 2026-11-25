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
