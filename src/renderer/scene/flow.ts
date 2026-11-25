/* Yürürken zemin izleyiciye doğru akar: kar çizgileri ve ayak izleri aynı derinlik ekseninde kayar. */

import { el, WMAX, WMIN, type Ripple } from './build';
import { PSCALE, YB, YH, type PerspPoint } from './perspective';

interface Print {
  w: number;
  off: number;
  el: SVGEllipseElement;
}

const V = 0.5;
const STEP_T = 0.45;
let flowAcc = 0;
let flowSide = 1;
let lastT = 0;
let ripples: Ripple[] = [];
const prints: Print[] = [];
let isWalking: () => boolean = () => false;
let pengQ: () => PerspPoint;

function printsG(): Element {
  return document.getElementById('prints')!;
}

export function paintRipple(o: Ripple): void {
  const u = 1 / o.w;
  const e = o.el;
  const y = YH + (YB - YH) * u;
  const x = 215 + o.off * u;
  const len = o.len * u;
  const bend = o.bend * u;
  const f = Math.max(0, Math.min(1, (WMAX - o.w) / 0.9, (o.w - WMIN) / 0.35));
  const uc = Math.min(u, 1.2);
  e.setAttribute(
    'd',
    'M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' q' + (len / 2).toFixed(1) + ' ' + (-bend).toFixed(1) + ' ' + len.toFixed(1) + ' 0',
  );
  e.setAttribute('stroke-width', (0.5 + 1.6 * u).toFixed(2));
  e.setAttribute('stroke-opacity', (f * (o.light ? 0.32 + 0.25 * uc : 0.12 + 0.14 * uc)).toFixed(3));
}

function paintPrint(o: Print): void {
  const u = 1 / o.w;
  const k = PSCALE * u;
  const e = o.el;
  e.setAttribute('cx', (215 + o.off * u).toFixed(1));
  e.setAttribute('cy', (YH + (YB - YH) * u + 1).toFixed(1));
  e.setAttribute('rx', (3.6 * k).toFixed(2));
  e.setAttribute('ry', (5.4 * k).toFixed(2));
  e.setAttribute('fill-opacity', (Math.min(1, (o.w - WMIN) / 0.35) * (0.35 + 0.5 * Math.min(u, 1))).toFixed(3));
}

export function clearPrints(): void {
  const g = printsG();
  while (prints.length) g.removeChild(prints.pop()!.el);
}

function spawnPrint(): void {
  flowSide = -flowSide;
  const q = pengQ();
  const u = q.s;
  const x = q.x + flowSide * 8 * PSCALE * u;
  const o: Print = { w: 1 / u, off: (x - 215) / u, el: el<SVGEllipseElement>('ellipse', {}, printsG()) };
  prints.push(o);
  paintPrint(o);
}

function frame(t: number): void {
  const dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 0;
  lastT = t;
  if (isWalking() && dt > 0) {
    for (let i = 0; i < ripples.length; i++) {
      const o = ripples[i];
      o.w -= V * dt;
      if (o.w < WMIN) o.w += WMAX - WMIN;
      paintRipple(o);
    }
    const g = printsG();
    for (let i = prints.length - 1; i >= 0; i--) {
      const o = prints[i];
      o.w -= V * dt;
      if (o.w < WMIN) {
        g.removeChild(o.el);
        prints.splice(i, 1);
      } else paintPrint(o);
    }
    flowAcc += dt;
    if (flowAcc >= STEP_T) {
      flowAcc -= STEP_T;
      spawnPrint();
    }
  }
  requestAnimationFrame(frame);
}

export function initFlow(r: Ripple[], walkingFn: () => boolean, pengQFn: () => PerspPoint): void {
  ripples = r;
  isWalking = walkingFn;
  pengQ = pengQFn;
  ripples.forEach((o) => paintRipple(o));
}

export function startFlow(): void {
  requestAnimationFrame(frame);
}
