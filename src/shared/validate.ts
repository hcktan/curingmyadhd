/* IPC doğrulaması. Ana süreç arayüzden gelen her değeri buradan geçirir; geçersiz değer yazılmaz. */

import type { AyarlarDegeri, EskiVeri } from './model';
import { MAXBLOCKS, parsePlan, serialize } from './plan';

export const MAX_KAYITLI_PLAN = 20;
export const MAX_AD = 24;
/** Plan metninin üst sınırı: 60 blok × "U180 " = 300 karakter; pay bırakılır. */
export const MAX_PLAN_METNI = 600;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Geçerli plan metnini düzgün biçimde döner (ör. `O25 K5`), geçersizse null.
    En az 1, en çok 60 blok; tanınmayan parça olmamalı. */
export function planMetni(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > MAX_PLAN_METNI) return null;
  const blokSayisi = (v.toUpperCase().replace(/İ/g, 'I').match(/([OKU])M?\s*\d{1,4}/g) || []).length;
  if (blokSayisi < 1 || blokSayisi > MAXBLOCKS) return null;
  const r = parsePlan(v);
  if (r.bad) return null;
  return serialize(r.blocks);
}

export function planAdi(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const ad = v.trim();
  if (!ad || ad.length > MAX_AD) return null;
  return ad;
}

export function ayarlar(v: unknown): AyarlarDegeri | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (typeof o.otomatik !== 'boolean' || typeof o.basaDon !== 'boolean') return null;
  return { otomatik: o.otomatik, basaDon: o.basaDon };
}

export function kimlik(v: unknown): string | null {
  return typeof v === 'string' && UUID.test(v) ? v : null;
}

export function mantiksal(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}

function jsonOku(v: unknown): unknown {
  if (typeof v !== 'string' || v.length > 100_000) return undefined;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
}

/** Eski localStorage verisini yeni modele çevirir: n → ad, p → plan, auto → otomatik, loop → basaDon.
    Geçersiz parçalar atlanır. Hiçbir şey yoksa ilgili alan undefined kalır. */
export function eskiVeriyiCevir(v: unknown): {
  aktifPlan?: string;
  ayarlar?: AyarlarDegeri;
  planlar?: { ad: string; plan: string }[];
} {
  const sonuc: ReturnType<typeof eskiVeriyiCevir> = {};
  if (!v || typeof v !== 'object') return sonuc;
  const e = v as EskiVeri;

  const p = jsonOku(e['yp-plan']);
  const pm = planMetni(p);
  if (pm) sonuc.aktifPlan = pm;

  const s = jsonOku(e['yp-set']);
  if (s && typeof s === 'object') {
    const o = s as Record<string, unknown>;
    // Kaynak sürümdeki kural: auto açıkça false değilse açık; loop doğruysa açık.
    sonuc.ayarlar = { otomatik: o.auto !== false, basaDon: !!o.loop };
  }

  const k = jsonOku(e['yp-saved']);
  if (Array.isArray(k)) {
    const planlar: { ad: string; plan: string }[] = [];
    for (const x of k) {
      if (planlar.length >= MAX_KAYITLI_PLAN) break;
      if (!x || typeof x !== 'object') continue;
      const ad = planAdi((x as Record<string, unknown>).n);
      const plan = planMetni((x as Record<string, unknown>).p);
      if (!ad || !plan) continue;
      const i = planlar.findIndex((y) => y.ad === ad);
      if (i >= 0) planlar[i] = { ad, plan };
      else planlar.push({ ad, plan });
    }
    sonuc.planlar = planlar;
  }
  return sonuc;
}
