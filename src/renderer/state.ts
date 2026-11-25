/* Uygulamanın paylaşılan durumu. Modüller bu nesneyi okur ve değiştirir. */

import type { Settings, TimerState } from './plan/timer';
import type { SavedPlan } from './storage/depo';

export interface AppState {
  t: TimerState;
  settings: Settings;
  saved: SavedPlan[];
  /** Panelde seçili taşın sırası, yoksa -1. */
  sel: number;
  /** Plan editörünün en son çizildiği `idx:editStart` anahtarı. */
  lastKey: string;
}

export const $ = (id: string): HTMLElement => document.getElementById(id)!;
