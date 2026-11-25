/* Kayıtlı planlar: kaydet, üzerine yaz, yükle, sil (en çok 20). */

import { parsePlan, serialize, type Block } from '../plan/model';
import { $, type AppState } from '../state';
import { KEYS, writeJSON } from '../storage/local';

/** HTML kaçışı. Plan adları innerHTML ile yazıldığı için zorunlu. */
export function esc(s: unknown): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function renderSaved(app: AppState): void {
  let h = '';
  app.saved.forEach((s, i) => {
    h +=
      '<li><div class="sv-main"><b>' + esc(s.n) + '</b><span>' + esc(s.p) + '</span></div>' +
      '<button type="button" class="mini" data-a="load" data-i="' + i + '">Yükle</button>' +
      '<button type="button" class="mini danger" data-a="del" data-i="' + i + '" aria-label="' + esc(s.n) + ' planını sil">Sil</button></li>';
  });
  $('saved').innerHTML = h || '<li class="empty">Kayıtlı plan yok. Güncel planı adlandırıp kaydedebilirsin.</li>';
}

function savePlan(app: AppState): void {
  const nameEl = $('save-name') as HTMLInputElement;
  const name = nameEl.value.trim() || 'Plan ' + (app.saved.length + 1);
  const p = serialize(app.t.plan);
  let found = -1;
  app.saved.forEach((s, i) => {
    if (s.n === name) found = i;
  });
  if (found >= 0) app.saved[found] = { n: name, p };
  else if (app.saved.length < 20) app.saved.push({ n: name, p });
  writeJSON(KEYS.saved, app.saved);
  nameEl.value = '';
  renderSaved(app);
}

export function bindSaved(app: AppState, load: (blocks: Block[]) => void): void {
  $('save-btn').addEventListener('click', () => savePlan(app));
  $('save-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      savePlan(app);
    }
  });
  $('saved').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button[data-a]');
    if (!b) return;
    const i = parseInt(b.getAttribute('data-i')!, 10);
    if (!app.saved[i]) return;
    if (b.getAttribute('data-a') === 'del') {
      app.saved.splice(i, 1);
      writeJSON(KEYS.saved, app.saved);
      renderSaved(app);
    } else {
      const res = parsePlan(app.saved[i].p);
      if (!res.blocks.length) return;
      load(res.blocks);
    }
  });
}
