/* Veri modeli. Eşlemeye hazır: her kayıtta kalıcı kimlik, güncellenme zamanı, cihaz kimliği ve silinme izi.
   Alan adları Türkçe. Ana süreç ve arayüz ortak kullanır. */

import { DEFAULT_PLAN } from './plan';

/** Dosya biçiminin şema sürümü. Biçim değişirse artırılır ve eski dosyalar taşınır. */
export const SURUM = 1;

/** Eşleme alanları: tek belgelerde id yoktur. */
export interface EslemeAlanlari {
  /** Milisaniye cinsinden son değişiklik zamanı. */
  guncellendi: number;
  /** Kaydı en son değiştiren cihaz. */
  cihazId: string;
}

/** Listedeki her kayıt. Silme gerçek silme değildir: `silindi: true` ile kalır. */
export interface Kayit extends EslemeAlanlari {
  id: string;
  silindi: boolean;
}

export interface KayitliPlan extends Kayit {
  ad: string;
  /** Plan metni, ör. `O25 K5 O25 U15`. */
  plan: string;
}

export interface AyarlarDegeri {
  otomatik: boolean;
  basaDon: boolean;
}
export type Ayarlar = AyarlarDegeri & EslemeAlanlari;

export interface AktifPlan extends EslemeAlanlari {
  plan: string;
}

/** Cihaza özel: eşlenmez. */
export interface Cihaz {
  cihazId: string;
  /** localStorage'dan tek seferlik taşımanın yapıldığı zaman. */
  tasindi?: number;
}

/** Dosya kökleri: her dosyada şema sürümü bulunur. */
export interface PlanlarDosyasi {
  surum: number;
  kayitlar: KayitliPlan[];
}
export type AyarlarDosyasi = { surum: number } & Ayarlar;
export type AktifPlanDosyasi = { surum: number } & AktifPlan;
export type CihazDosyasi = { surum: number } & Cihaz;

export const VARSAYILAN_PLANLAR: { ad: string; plan: string }[] = [
  { ad: "Klasik 4'lü", plan: DEFAULT_PLAN },
  { ad: 'Derin odak', plan: 'O50 K10 O50 K10 O50 U20' },
];
export const VARSAYILAN_AYARLAR: AyarlarDegeri = { otomatik: true, basaDon: false };

/** Arayüzün açılışta aldığı tek paket. */
export interface Yukleme {
  aktifPlan: string;
  ayarlar: AyarlarDegeri;
  planlar: KayitliPlan[];
  panelAcik: boolean;
  tamEkran: boolean;
}

/** Arayüzden taşıma için gelen ham localStorage değerleri (eski biçim, doğrulanmamış). */
export interface EskiVeri {
  'yp-plan'?: string | null;
  'yp-set'?: string | null;
  'yp-saved'?: string | null;
}
