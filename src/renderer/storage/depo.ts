/* Arayüz tarafı depo: veri ana süreçte, JSON dosyalarında durur. Arayüz yalnızca window.cma ile konuşur. */

import type { CmaApi } from '../../shared/ipc';
import type { KayitliPlan } from '../../shared/model';
import { DEFAULT_PLAN, parsePlan, serialize, type Block } from '../plan/model';
import type { Settings } from '../plan/timer';

export interface SavedPlan {
  id?: string;
  n: string;
  p: string;
}

export function cma(): CmaApi | undefined {
  return (window as unknown as { cma?: CmaApi }).cma;
}

function api(): CmaApi {
  const c = cma();
  if (!c) throw new Error('window.cma yok');
  return c;
}

const ESKI_ANAHTARLAR = ['yp-plan', 'yp-set', 'yp-saved'] as const;

/** Electron penceresinin localStorage'ında eski veri varsa bir kez ana sürece yollar.
    Ana süreç taşımayı daha önce yaptıysa hiçbir şey yapmaz. localStorage silinmez. */
async function eskiVeriyiTasi(): Promise<void> {
  let eski: Record<string, string | null> | null = null;
  try {
    for (const k of ESKI_ANAHTARLAR) {
      const v = localStorage.getItem(k);
      if (v !== null) (eski ??= {})[k] = v;
    }
  } catch {
    return;
  }
  if (eski) await api().veri.tasi(eski);
}

function kayitliPlanlar(l: KayitliPlan[]): SavedPlan[] {
  return l.map((k) => ({ id: k.id, n: k.ad, p: k.plan }));
}

export interface Acilis {
  plan: Block[];
  settings: Settings;
  saved: SavedPlan[];
  panelAcik: boolean;
  tamEkran: boolean;
}

export async function yukle(): Promise<Acilis> {
  await eskiVeriyiTasi();
  const y = await api().veri.yukle();
  let plan = parsePlan(y.aktifPlan).blocks;
  if (!plan.length) plan = parsePlan(DEFAULT_PLAN).blocks;
  return {
    plan,
    settings: { auto: y.ayarlar.otomatik, loop: y.ayarlar.basaDon },
    saved: kayitliPlanlar(y.planlar),
    panelAcik: y.panelAcik,
    tamEkran: y.tamEkran,
  };
}

export function aktifPlanYaz(plan: Block[]): void {
  void api().veri.aktifPlanYaz(serialize(plan));
}

export function ayarlarYaz(s: Settings): void {
  void api().veri.ayarlarYaz({ otomatik: s.auto, basaDon: s.loop });
}

export async function planKaydet(ad: string, metin: string): Promise<SavedPlan[]> {
  return kayitliPlanlar(await api().veri.planKaydet(ad, metin));
}

export async function planSil(id: string): Promise<SavedPlan[]> {
  return kayitliPlanlar(await api().veri.planSil(id));
}
