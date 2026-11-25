/* localStorage deposu. Anahtarlar kaynak sürümle aynı: yp-plan, yp-set, yp-saved. */

import { DEFAULT_PLAN, parsePlan, type Block } from '../plan/model';
import type { Settings } from '../plan/timer';

export const KEYS = { plan: 'yp-plan', settings: 'yp-set', saved: 'yp-saved' } as const;

export interface SavedPlan {
  n: string;
  p: string;
}

export function readJSON(k: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch (e) {
    return null;
  }
}

export function writeJSON(k: string, v: unknown): void {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    /* depo dolu ya da kapalı: sessizce geç */
  }
}

export function loadPlanBlocks(): Block[] {
  let plan = parsePlan(readJSON(KEYS.plan) || DEFAULT_PLAN).blocks;
  if (!plan.length) plan = parsePlan(DEFAULT_PLAN).blocks;
  return plan;
}

export function loadSettings(): Settings {
  const st = (readJSON(KEYS.settings) || {}) as Partial<Settings>;
  return { auto: st.auto !== false, loop: !!st.loop };
}

/** Kayıtlı planlar. İlk açılışta iki hazır plan yazılır. */
export function loadSaved(): SavedPlan[] {
  let saved = readJSON(KEYS.saved);
  if (!Array.isArray(saved)) {
    saved = [
      { n: "Klasik 4'lü", p: DEFAULT_PLAN },
      { n: 'Derin odak', p: 'O50 K10 O50 K10 O50 U20' },
    ];
    writeJSON(KEYS.saved, saved);
  }
  return saved as SavedPlan[];
}
