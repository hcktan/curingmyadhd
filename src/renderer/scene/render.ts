/* Sahne çizimi: penguenin yeri, kar seyrelmesi, sis, yürüme/dinlenme sınıfı. */

import { journeyP, walking, type TimerState } from '../plan/timer';
import type { Flake } from './build';
import { persp, PSCALE, type PerspPoint } from './perspective';

export type Motion = 'instant' | 'jump' | undefined;

let pengQ: PerspPoint = persp(0);
let lastSnowQ = -1;
let jumpTimer = 0;
let flakes: Flake[] = [];

export function initRender(f: Flake[]): void {
  flakes = f;
}

export function getPengQ(): PerspPoint {
  return pengQ;
}

function placePenguin(p: number, motion: Motion): void {
  const pengpos = document.getElementById('pengpos')!;
  const q = persp(p);
  if (motion === 'instant') pengpos.style.transition = 'none';
  else if (motion === 'jump') {
    pengpos.style.transition = 'transform 1.2s ease-in-out';
    clearTimeout(jumpTimer);
    jumpTimer = window.setTimeout(() => {
      pengpos.style.transition = '';
    }, 1300);
  }
  pengpos.style.transform =
    'translate(' + q.x.toFixed(1) + 'px, ' + q.y.toFixed(1) + 'px) scale(' + (PSCALE * q.s).toFixed(4) + ')';
  if (motion === 'instant') {
    void pengpos.getBoundingClientRect();
    pengpos.style.transition = '';
  }
  pengQ = q;
}

function paintSnow(p: number): void {
  const q = Math.round(p * 60);
  if (q === lastSnowQ) return;
  lastSnowQ = q;
  flakes.forEach((f) => {
    f.el.style.opacity = f.thr > p ? '1' : '0';
  });
}

export function renderScene(s: TimerState, motion: Motion): void {
  const p = journeyP(s);
  placePenguin(p, motion);
  paintSnow(p);
  document.getElementById('fog')!.style.opacity = (0.72 * Math.pow(1 - p, 1.3)).toFixed(3);
  document.getElementById('scene')!.setAttribute('class', walking(s) ? 'walking' : 'resting');
}
