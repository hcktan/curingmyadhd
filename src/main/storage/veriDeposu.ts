/* Uygulamanın verisi: dört JSON dosyası ve üzerlerindeki işlemler.
   IPC işleyicileri yalnızca bu sınıfı çağırır; dosya yollarını yalnızca bu sınıf bilir. */

import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import {
  SURUM,
  VARSAYILAN_AYARLAR,
  VARSAYILAN_PLANLAR,
  type AktifPlanDosyasi,
  type AyarlarDegeri,
  type AyarlarDosyasi,
  type CihazDosyasi,
  type KayitliPlan,
  type PlanlarDosyasi,
} from '../../shared/model';
import { DEFAULT_PLAN } from '../../shared/plan';
import * as V from '../../shared/validate';
import { JsonFile } from './jsonFile';
import { JsonDocRepository, JsonListRepository, type Saat } from './jsonRepository';

type Ham = Record<string, unknown>;
const nesne = (v: unknown): v is Ham => !!v && typeof v === 'object' && !Array.isArray(v);
const sayi = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const metin = (v: unknown): v is string => typeof v === 'string';

function esleme(o: Ham): boolean {
  return sayi(o.guncellendi) && metin(o.cihazId);
}

function kayitliPlanMi(v: unknown): v is KayitliPlan {
  if (!nesne(v)) return false;
  return (
    metin(v.id) && typeof v.silindi === 'boolean' && esleme(v) && V.planAdi(v.ad) !== null && V.planMetni(v.plan) !== null
  );
}

export interface VeriDeposuSecenekleri {
  /** Veri klasörü (userData/veri). */
  klasor: string;
  /** Yazma birleştirme süresi (ms). Testte 0. */
  bekleme?: number;
  simdi?: () => number;
}

export class VeriDeposu {
  readonly cihaz: JsonFile<CihazDosyasi>;
  readonly planlar: JsonListRepository<KayitliPlan>;
  readonly ayarlar: JsonDocRepository<AyarlarDegeri>;
  readonly aktifPlan: JsonDocRepository<{ plan: string }>;
  private readonly dosyalar: JsonFile<unknown>[];
  private readonly simdi: () => number;

  constructor(o: VeriDeposuSecenekleri) {
    const simdi = o.simdi ?? Date.now;
    this.simdi = simdi;
    const bekleme = o.bekleme ?? 300;

    this.cihaz = new JsonFile<CihazDosyasi>(join(o.klasor, 'cihaz.json'), {
      varsayilan: () => ({ surum: SURUM, cihazId: randomUUID() }),
      dogrula: (h) =>
        nesne(h) && h.surum === SURUM && metin(h.cihazId) && (h.tasindi === undefined || sayi(h.tasindi))
          ? (h as unknown as CihazDosyasi)
          : null,
      simdi,
    });
    const saat: Saat = { simdi, cihazId: this.cihaz.get().cihazId };

    const planDosyasi = new JsonFile<PlanlarDosyasi>(join(o.klasor, 'planlar.json'), {
      varsayilan: () => ({
        surum: SURUM,
        kayitlar: VARSAYILAN_PLANLAR.map((p, i) => ({
          id: randomUUID(),
          ad: p.ad,
          plan: p.plan,
          silindi: false,
          guncellendi: simdi() + i,
          cihazId: saat.cihazId,
        })),
      }),
      dogrula: (h) =>
        nesne(h) && h.surum === SURUM && Array.isArray(h.kayitlar) && h.kayitlar.every(kayitliPlanMi)
          ? (h as unknown as PlanlarDosyasi)
          : null,
      bekleme,
      simdi,
    });
    this.planlar = new JsonListRepository(planDosyasi, saat);

    const ayarDosyasi = new JsonFile<AyarlarDosyasi>(join(o.klasor, 'ayarlar.json'), {
      varsayilan: () => ({ surum: SURUM, ...VARSAYILAN_AYARLAR, guncellendi: simdi(), cihazId: saat.cihazId }),
      dogrula: (h) =>
        nesne(h) && h.surum === SURUM && V.ayarlar(h) && esleme(h) ? (h as unknown as AyarlarDosyasi) : null,
      bekleme,
      simdi,
    });
    this.ayarlar = new JsonDocRepository<AyarlarDegeri>(ayarDosyasi, saat, (d) => ({
      otomatik: d.otomatik,
      basaDon: d.basaDon,
    }));

    const aktifDosyasi = new JsonFile<AktifPlanDosyasi>(join(o.klasor, 'aktif-plan.json'), {
      varsayilan: () => ({ surum: SURUM, plan: DEFAULT_PLAN, guncellendi: simdi(), cihazId: saat.cihazId }),
      dogrula: (h) =>
        nesne(h) && h.surum === SURUM && V.planMetni(h.plan) && esleme(h) ? (h as unknown as AktifPlanDosyasi) : null,
      bekleme,
      simdi,
    });
    this.aktifPlan = new JsonDocRepository<{ plan: string }>(aktifDosyasi, saat, (d) => ({ plan: d.plan }));

    this.dosyalar = [this.cihaz, planDosyasi, ayarDosyasi, aktifDosyasi] as JsonFile<unknown>[];
  }

  /** Bekleyen yazmaları diske işler. */
  flush(): void {
    for (const d of this.dosyalar) d.flush();
  }

  aktifPlanYaz(v: unknown): boolean {
    const plan = V.planMetni(v);
    if (!plan) return false;
    this.aktifPlan.write({ plan });
    return true;
  }

  ayarlarYaz(v: unknown): boolean {
    const a = V.ayarlar(v);
    if (!a) return false;
    this.ayarlar.write(a);
    return true;
  }

  /** Aynı ad varsa üzerine yazar; yoksa en çok 20 plana kadar ekler. Geçersiz girdi listeyi değiştirmez. */
  planKaydet(adHam: unknown, metinHam: unknown): KayitliPlan[] {
    const ad = V.planAdi(adHam);
    const plan = V.planMetni(metinHam);
    if (ad && plan) {
      const var_ = this.planlar.list().find((p) => p.ad === ad);
      if (var_) this.planlar.put({ ...var_, plan });
      else if (this.planlar.list().length < V.MAX_KAYITLI_PLAN)
        this.planlar.put({ id: this.planlar.yeniKimlik(), ad, plan, silindi: false });
    }
    return this.planlar.list();
  }

  planSil(idHam: unknown): KayitliPlan[] {
    const id = V.kimlik(idHam);
    if (id) this.planlar.remove(id);
    return this.planlar.list();
  }

  /** localStorage'dan tek seferlik taşıma. İkinci kez çalışmaz. */
  tasi(eski: unknown): boolean {
    if (this.cihaz.get().tasindi !== undefined) return false;
    const c = V.eskiVeriyiCevir(eski);
    if (c.aktifPlan) this.aktifPlan.write({ plan: c.aktifPlan });
    if (c.ayarlar) this.ayarlar.write(c.ayarlar);
    if (c.planlar) {
      // Kaynak sürümdeki liste olduğu gibi gelir: mevcut (varsayılan) planlar silinme iziyle kalkar.
      for (const p of this.planlar.list()) this.planlar.remove(p.id);
      for (const p of c.planlar) this.planlar.put({ id: this.planlar.yeniKimlik(), ad: p.ad, plan: p.plan, silindi: false });
    }
    this.cihaz.set({ ...this.cihaz.get(), tasindi: this.simdi() });
    this.flush();
    return true;
  }
}
