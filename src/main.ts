/* Başlangıç: sahneyi yerleştirir, durumu yükler, modülleri birbirine bağlar. */

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/app.css';
import './scene/scene.css';
import sceneSvg from './scene/scene.svg?raw';

import { serialize, type Block } from './plan/model';
import * as T from './plan/timer';
import { buildStatic, prefersReducedMotion } from './scene/build';
import { clearPrints, initFlow, startFlow } from './scene/flow';
import { getPengQ, initRender, renderScene, type Motion } from './scene/render';
import type { AppState } from './state';
import { KEYS, loadPlanBlocks, loadSaved, loadSettings, writeJSON } from './storage/local';
import { bindDock, renderDock } from './ui/dock';
import { bindSaved, renderSaved } from './ui/saved';
import { bindSettings, paintSettings } from './ui/settings';
import { bindSheet, renderChips, showErr, syncText } from './ui/sheet';
import { beep, ensureAudio } from './ui/sound';
import { bindStrip, buildStrip, paintStrip } from './ui/strip';

document.querySelector('.app')!.insertAdjacentHTML('afterbegin', sceneSvg);

const reduceMotion = prefersReducedMotion();
const { ripples, flakes } = buildStatic(reduceMotion);

const app: AppState = {
  t: T.createTimer(loadPlanBlocks()),
  settings: loadSettings(),
  saved: loadSaved(),
  sel: -1,
  lastKey: '',
};

function render(motion?: Motion): void {
  const s = app.t;
  renderScene(s, motion);
  renderDock(s);
  paintStrip(s);
  const key = s.idx + ':' + T.editStart(s);
  if (key !== app.lastKey) {
    app.lastKey = key;
    if (app.sel < T.editStart(s)) app.sel = -1;
    syncText(app);
    renderChips(app);
  }
}

function commitPlan(np: Block[], newSel: number, fromText?: boolean): void {
  T.applyPlan(app.t, np);
  app.sel = newSel;
  writeJSON(KEYS.plan, serialize(app.t.plan));
  buildStrip(app.t.plan);
  if (fromText) {
    app.lastKey = app.t.idx + ':' + T.editStart(app.t);
    renderChips(app);
  } else app.lastKey = '';
  render();
}

function goTo(i: number, motion?: Motion): void {
  T.goTo(app.t, i, Date.now());
  clearPrints();
  render(motion || 'jump');
}

function restart(startRunning: boolean): void {
  T.restart(app.t, startRunning, Date.now());
  clearPrints();
  render('instant');
}

function toggle(): void {
  ensureAudio();
  if (T.isDone(app.t)) {
    restart(true);
    return;
  }
  T.toggle(app.t, Date.now());
  render();
}

function tick(): void {
  const r = T.tick(app.t, app.settings, Date.now());
  if (!r) return;
  if (r.wrapped) clearPrints();
  if (r.beeped) beep();
  render(r.wrapped ? 'instant' : undefined);
}

function loadSavedPlan(blocks: Block[]): void {
  T.loadPlan(app.t, blocks);
  app.sel = -1;
  writeJSON(KEYS.plan, serialize(app.t.plan));
  buildStrip(app.t.plan);
  clearPrints();
  app.lastKey = '';
  showErr('');
  render('instant');
}

bindDock({
  toggle,
  restart: () => restart(false),
  prev: () => goTo(T.prevTarget(app.t)),
  next: () => goTo(app.t.idx + 1),
  openSheet: () => {
    showErr('');
    syncText(app);
    renderChips(app);
  },
});
bindStrip((i) => goTo(i));
bindSheet(app, commitPlan);
bindSettings(app);
bindSaved(app, loadSavedPlan);

initRender(flakes);
buildStrip(app.t.plan);
renderSaved(app);
paintSettings(app);
initFlow(ripples, () => T.walking(app.t), getPengQ);
if (!reduceMotion) startFlow();
setInterval(tick, 250);
render('instant');

