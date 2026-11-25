/* Blok geçişi (Otomatik/Elle) ve plan bitince (Dur/Baştan) ayarları. */

import { $, type AppState } from '../state';
import { KEYS, writeJSON } from '../storage/local';

export function paintSettings(app: AppState): void {
  Array.prototype.forEach.call($('set-auto').children, (b: Element) => {
    b.setAttribute('aria-pressed', (b.getAttribute('data-v') === '1') === app.settings.auto ? 'true' : 'false');
  });
  Array.prototype.forEach.call($('set-loop').children, (b: Element) => {
    b.setAttribute('aria-pressed', (b.getAttribute('data-v') === '1') === app.settings.loop ? 'true' : 'false');
  });
}

export function bindSettings(app: AppState): void {
  $('set-auto').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button[data-v]');
    if (!b) return;
    app.settings.auto = b.getAttribute('data-v') === '1';
    writeJSON(KEYS.settings, app.settings);
    paintSettings(app);
  });
  $('set-loop').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button[data-v]');
    if (!b) return;
    app.settings.loop = b.getAttribute('data-v') === '1';
    writeJSON(KEYS.settings, app.settings);
    paintSettings(app);
  });
}
