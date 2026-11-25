/* Plan şeridi: parça genişliği blok süresiyle orantılı. */

import { KIND, type Block } from '../plan/model';
import { isDone, type TimerState } from '../plan/timer';
import { $ } from '../state';

let segEls: HTMLCollection | [] = [];

export function buildStrip(plan: Block[]): void {
  const stripEl = $('strip');
  let h = '';
  plan.forEach((b, i) => {
    h +=
      '<button type="button" class="seg k-' + b.k + '" style="flex:' + b.m + ' 1 0" data-i="' + i +
      '" aria-label="Blok ' + (i + 1) + ': ' + KIND[b.k].name + ', ' + b.m + ' dakika"><i class="bar"><i class="fill"></i></i></button>';
  });
  stripEl.innerHTML = h;
  segEls = stripEl.children;
}

export function paintStrip(s: TimerState): void {
  for (let i = 0; i < segEls.length; i++) {
    const seg = segEls[i] as HTMLElement;
    const f = i < s.idx ? 1 : i === s.idx ? (s.total ? (s.total - s.remaining) / s.total : 0) : 0;
    ((seg.firstChild as HTMLElement).firstChild as HTMLElement).style.transform = 'scaleX(' + f.toFixed(4) + ')';
    const c = i === s.idx && !isDone(s);
    if (seg.classList.contains('cur') !== c) seg.classList.toggle('cur', c);
  }
}

export function bindStrip(goTo: (i: number) => void): void {
  $('strip').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button[data-i]');
    if (b) goTo(parseInt(b.getAttribute('data-i')!, 10));
  });
}
