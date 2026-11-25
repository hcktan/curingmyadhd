/* Başlangıç: sahneyi yerleştirir, durumu yükler, modülleri birbirine bağlar. */

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/app.css';
import './scene/scene.css';
import './styles/layout.css';
import sceneSvg from './scene/scene.svg?raw';

import type { Block } from './plan/model';
import * as T from './plan/timer';
import { paneliKur } from './panels/mount';
import { buildStatic, buildWide, prefersReducedMotion } from './scene/build';
import { clearPrints, initFlow, startFlow } from './scene/flow';
import { sahneDuzeni } from './scene/layout';
import { getPengQ, initRender, renderScene, type Motion } from './scene/render';
import type { AppState } from './state';
import { aktifPlanYaz, cma, yukle } from './storage/depo';
import { bindDock, renderDock } from './ui/dock';
import { bindSaved, renderSaved } from './ui/saved';
import { bindSettings, paintSettings } from './ui/settings';
import { bindSheet, renderChips, showErr, syncText } from './ui/sheet';
import { beep, ensureAudio } from './ui/sound';
import { bindStrip, buildStrip, paintStrip } from './ui/strip';

const appEl = document.querySelector<HTMLElement>('.app')!;
appEl.insertAdjacentHTML('afterbegin', sceneSvg);

const reduceMotion = prefersReducedMotion();
const sutun = buildStatic(reduceMotion);
const yanlar = buildWide(reduceMotion);
const ripples = sutun.ripples.concat(yanlar.ripples);
const flakes = sutun.flakes.concat(yanlar.flakes);

/** Trafik ışıkları için üst pay: pencerede 28 px, tam ekranda 0. */
function baslikPayi(tamEkran: boolean): void {
  document.documentElement.style.setProperty('--baslik-payi', tamEkran ? '0px' : '28px');
}

// Açılış eşzamansız: veri ana süreçten gelir. Veri gelmeden zamanlayıcı başlamaz.
let app!: AppState;

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
  aktifPlanYaz(app.t.plan);
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
  aktifPlanYaz(app.t.plan);
  buildStrip(app.t.plan);
  clearPrints();
  app.lastKey = '';
  showErr('');
  render('instant');
}

async function basla(): Promise<void> {
  if (!cma()) {
    document.body.textContent = 'Bu uygulama yalnızca masaüstü uygulaması olarak çalışır.';
    return;
  }
  const acilis = await yukle();
  app = {
    t: T.createTimer(acilis.plan),
    settings: acilis.settings,
    saved: acilis.saved,
    sel: -1,
    lastKey: '',
  };

  baslikPayi(acilis.tamEkran);
  cma()!.pencere.tamEkranDegisti(baslikPayi);
  sahneDuzeni(appEl);

  // Plan editörü sağ panelin "Plan" sekmesine taşınır; kimlikler aynı kalır.
  const sheet = document.getElementById('sheet')!;
  sheet.hidden = false;
  const panel = paneliKur([{ id: 'plan', ad: 'Plan', icerik: sheet }], (acik) => {
    document.getElementById('gear')!.setAttribute('aria-expanded', acik ? 'true' : 'false');
    if (acik) {
      showErr('');
      syncText(app);
      renderChips(app);
    }
    void cma()!.pencere.panelDurumu(acik);
  });
  if (acilis.panelAcik) panel.ayarla(true);

  bindDock({
    toggle,
    restart: () => restart(false),
    prev: () => goTo(T.prevTarget(app.t)),
    next: () => goTo(app.t.idx + 1),
    togglePanel: () => panel.ayarla(!panel.acikMi()),
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
}

void basla();
