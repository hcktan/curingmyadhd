/* Ayar panelindeki plan editörü: plan metni, taşlar, düzenleme çubuğu, ekleme düğmeleri. */

import { clampMin, copyPlan, fmtMin, KIND, MAXBLOCKS, parsePlan, serialize, type Block, type Kind } from '../plan/model';
import { editStart, focusTotal, isDone } from '../plan/timer';
import { $, type AppState } from '../state';

export type CommitPlan = (np: Block[], newSel: number, fromText?: boolean) => void;

export function syncText(app: AppState): void {
  ($('plan-text') as HTMLTextAreaElement).value = serialize(app.t.plan.slice(editStart(app.t)));
}

export function showErr(msg: string): void {
  const errEl = $('plan-err');
  errEl.textContent = msg;
  errEl.hidden = !msg;
}

export function renderChips(app: AppState): void {
  const s = app.t;
  const plan = s.plan;
  const es = editStart(s);
  let h = '';
  plan.forEach((b, i) => {
    const cls = 'chip k-' + b.k + (i < es ? ' locked' : '') + (i === s.idx && !isDone(s) ? ' cur' : '') + (i === app.sel ? ' sel' : '');
    h += '<button type="button" class="' + cls + '" data-i="' + i + '">' + b.k + b.m + '</button>';
  });
  $('chips').innerHTML = h;
  const tbEl = $('tb');
  const showTb = app.sel >= es && app.sel < plan.length;
  tbEl.hidden = !showTb;
  if (showTb) {
    ($('tb-min') as HTMLInputElement).value = String(plan[app.sel].m);
    tbEl.querySelectorAll('[data-a^="t-"]').forEach((b) => {
      b.setAttribute('aria-pressed', b.getAttribute('data-a')!.charAt(2) === plan[app.sel].k ? 'true' : 'false');
    });
  }
  let all = 0;
  plan.forEach((b) => {
    all += b.m;
  });
  $('plan-sum').textContent = plan.length + ' blok · odak ' + fmtMin(focusTotal(plan) / 60000) + ' · toplam ' + fmtMin(all);
  const hint = $('plan-hint');
  if (isDone(s)) {
    hint.textContent = 'Plan bitti. Blok eklersen akış devam eder.';
    hint.hidden = false;
  } else if (es > 0) {
    hint.textContent = 'Plan başladı. Yalnızca sıradaki bloklar değişir.';
    hint.hidden = false;
  } else hint.hidden = true;
}

export function bindSheet(app: AppState, commitPlan: CommitPlan): void {
  const taEl = $('plan-text') as HTMLTextAreaElement;
  taEl.addEventListener('input', () => {
    const res = parsePlan(taEl.value);
    const es = editStart(app.t);
    showErr(res.bad ? 'Anlaşılmadı: ' + res.bad : '');
    if (es === 0 && !res.blocks.length) {
      if (!res.bad) showErr('En az bir blok gerekli.');
      return;
    }
    commitPlan(app.t.plan.slice(0, es).concat(res.blocks), -1, true);
  });

  $('chips').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button[data-i]');
    if (!b) return;
    const i = parseInt(b.getAttribute('data-i')!, 10);
    if (i < editStart(app.t)) return;
    app.sel = app.sel === i ? -1 : i;
    renderChips(app);
  });

  $('tb').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button[data-a]');
    const es = editStart(app.t);
    const sel = app.sel;
    if (!b || sel < es || sel >= app.t.plan.length) return;
    const a = b.getAttribute('data-a')!;
    const np = copyPlan(app.t.plan);
    let ns = sel;
    let t: Block;
    if (a === 'dec5') np[sel].m = clampMin(np[sel].m - 5);
    else if (a === 'dec1') np[sel].m = clampMin(np[sel].m - 1);
    else if (a === 'inc1') np[sel].m = clampMin(np[sel].m + 1);
    else if (a === 'inc5') np[sel].m = clampMin(np[sel].m + 5);
    else if (a.indexOf('t-') === 0) np[sel].k = a.charAt(2) as Kind;
    else if (a === 'left') {
      if (sel - 1 < es) return;
      t = np[sel - 1];
      np[sel - 1] = np[sel];
      np[sel] = t;
      ns = sel - 1;
    } else if (a === 'right') {
      if (sel + 1 >= np.length) return;
      t = np[sel + 1];
      np[sel + 1] = np[sel];
      np[sel] = t;
      ns = sel + 1;
    } else if (a === 'del') {
      if (np.length === 1) return;
      np.splice(sel, 1);
      ns = -1;
    }
    commitPlan(np, ns);
  });

  $('tb-min').addEventListener('change', function (this: HTMLInputElement) {
    const es = editStart(app.t);
    const sel = app.sel;
    if (sel < es || sel >= app.t.plan.length) return;
    const np = copyPlan(app.t.plan);
    np[sel].m = clampMin(Math.round(Number(this.value)) || 1);
    commitPlan(np, sel);
  });

  $('adds').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button[data-add]');
    if (!b || app.t.plan.length >= MAXBLOCKS) return;
    const k = b.getAttribute('data-add') as Kind;
    const np = copyPlan(app.t.plan);
    np.push({ k, m: KIND[k].def });
    showErr('');
    commitPlan(np, np.length - 1);
  });
}
