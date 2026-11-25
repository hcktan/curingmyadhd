/* Süre rakamları, belge başlığı, kontrol hapı ve klavye. */

import { fmtParts, isDone, type TimerState } from '../plan/timer';
import { $ } from '../state';

export function renderDock(s: TimerState): void {
  const f = fmtParts(isDone(s) ? 0 : s.remaining);
  let html = '';
  for (let i = 0; i < f.text.length; i++) {
    const ch = f.text.charAt(i);
    html += '<span class="' + (ch === ':' ? 'c' : 'd') + '">' + ch + '</span>';
  }
  const tEl = $('time');
  tEl.innerHTML = html;
  tEl.setAttribute('aria-label', f.m + ' dakika ' + f.s + ' saniye');
  document.title = (s.running ? f.text + ' · ' : '') + 'Yürüyen Penguen';
  $('toggle').textContent = isDone(s) ? 'Yeniden' : s.running ? 'Duraklat' : s.remaining < s.total ? 'Devam et' : 'Başlat';
  ($('next') as HTMLButtonElement).disabled = isDone(s);
}

export interface DockActions {
  toggle: () => void;
  restart: () => void;
  prev: () => void;
  next: () => void;
  openSheet: () => void;
}

export function bindDock(a: DockActions): void {
  $('toggle').addEventListener('click', a.toggle);
  $('reset').addEventListener('click', a.restart);
  $('prev').addEventListener('click', a.prev);
  $('next').addEventListener('click', a.next);
  $('gear').addEventListener('click', function (this: HTMLElement) {
    const sh = $('sheet');
    sh.hidden = !sh.hidden;
    this.setAttribute('aria-expanded', sh.hidden ? 'false' : 'true');
    if (!sh.hidden) a.openSheet();
  });
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    const tag = ((e.target as Element).tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'button') return;
    e.preventDefault();
    a.toggle();
  });
}
