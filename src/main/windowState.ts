/* Pencere durumu: pencere.json (cihaza özel, eşlenmez) ve ekran dışı konum kuralı. */

import { join } from 'node:path';
import { JsonFile } from './storage/jsonFile';

export interface PencereDurumu {
  x?: number;
  y?: number;
  genislik: number;
  yukseklik: number;
  tamEkran: boolean;
  buyutulmus: boolean;
  panelAcik: boolean;
}

export interface Dikdortgen {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const VARSAYILAN_BOYUT = { genislik: 1280, yukseklik: 800 };
export const EN_KUCUK = { genislik: 430, yukseklik: 640 };
export const PANEL_GENISLIGI = 360;
export const SAHNE_EN_AZ = 430;
/** Görünür sayılmak için pencerenin bir ekranla en az bu kadar örtüşmesi gerekir. */
const GORUNUR = { width: 100, height: 50 };

function kesisim(a: Dikdortgen, b: Dikdortgen): { width: number; height: number } {
  return {
    width: Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
    height: Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
  };
}

function ortala(boyut: { width: number; height: number }, alan: Dikdortgen): Dikdortgen {
  const width = Math.min(boyut.width, alan.width);
  const height = Math.min(boyut.height, alan.height);
  return {
    x: Math.round(alan.x + (alan.width - width) / 2),
    y: Math.round(alan.y + (alan.height - height) / 2),
    width,
    height,
  };
}

/** Kayıtlı pencere bir ekranın çalışma alanıyla yeterince örtüşüyorsa olduğu gibi kalır.
    Konum yoksa ya da hiçbir ekranda görünmüyorsa (ör. dış ekran çıkarıldı) ana ekranda ortalanır.
    `ekranlar[0]` ana ekrandır. */
export function fitToDisplays(
  pencere: { x?: number; y?: number; width: number; height: number },
  ekranlar: Dikdortgen[],
): Dikdortgen {
  const ana = ekranlar[0];
  const boyut = {
    width: Math.max(EN_KUCUK.genislik, pencere.width),
    height: Math.max(EN_KUCUK.yukseklik, pencere.height),
  };
  if (pencere.x === undefined || pencere.y === undefined) return ortala(boyut, ana);
  const r = { x: pencere.x, y: pencere.y, ...boyut };
  const gorunur = ekranlar.some((e) => {
    const k = kesisim(r, e);
    return k.width >= GORUNUR.width && k.height >= GORUNUR.height;
  });
  return gorunur ? r : ortala(boyut, ana);
}

/** Panel açılırken sahne en az 430 px kalsın diye pencerenin olması gereken sınırları.
    Pencere yeterince genişse değişmez. Sağa doğru genişler; ekranda yer yoksa sola kayar. */
export function panelIcinGenislet(pencere: Dikdortgen, alan: Dikdortgen): Dikdortgen {
  const gereken = SAHNE_EN_AZ + PANEL_GENISLIGI;
  if (pencere.width >= gereken) return pencere;
  const width = Math.min(gereken, alan.width);
  let x = pencere.x;
  if (x + width > alan.x + alan.width) x = Math.max(alan.x, alan.x + alan.width - width);
  return { ...pencere, x, width };
}

function durumMu(h: unknown): PencereDurumu | null {
  if (!h || typeof h !== 'object') return null;
  const o = h as Record<string, unknown>;
  const sayi = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  const istege = (v: unknown) => v === undefined || sayi(v);
  if (!istege(o.x) || !istege(o.y) || !sayi(o.genislik) || !sayi(o.yukseklik)) return null;
  if (typeof o.tamEkran !== 'boolean' || typeof o.buyutulmus !== 'boolean' || typeof o.panelAcik !== 'boolean')
    return null;
  return o as unknown as PencereDurumu;
}

export function pencereDosyasi(userData: string): JsonFile<PencereDurumu> {
  return new JsonFile<PencereDurumu>(join(userData, 'pencere.json'), {
    varsayilan: () => ({ ...VARSAYILAN_BOYUT, tamEkran: false, buyutulmus: false, panelAcik: false }),
    dogrula: durumMu,
    bekleme: 500,
  });
}
