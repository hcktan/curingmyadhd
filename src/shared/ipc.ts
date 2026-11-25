/* IPC kanal adları ve preload'un arayüze verdiği API. Kanal adları yalnızca burada tanımlanır. */

import type { AyarlarDegeri, EskiVeri, KayitliPlan, Yukleme } from './model';

export const KANAL = {
  yukle: 'veri:yukle',
  aktifPlanYaz: 'veri:aktif-plan-yaz',
  ayarlarYaz: 'veri:ayarlar-yaz',
  planKaydet: 'veri:plan-kaydet',
  planSil: 'veri:plan-sil',
  tasi: 'veri:tasi',
  panelDurumu: 'pencere:panel-durumu',
  tamEkran: 'pencere:tam-ekran',
} as const;

/** `window.cma`: arayüzün ana süreçle konuştuğu tek yol. */
export interface CmaApi {
  veri: {
    yukle(): Promise<Yukleme>;
    aktifPlanYaz(metin: string): Promise<boolean>;
    ayarlarYaz(ayarlar: AyarlarDegeri): Promise<boolean>;
    /** Aynı ad varsa üzerine yazar. Güncel listeyi döner. */
    planKaydet(ad: string, metin: string): Promise<KayitliPlan[]>;
    planSil(id: string): Promise<KayitliPlan[]>;
    /** localStorage'dan tek seferlik taşıma. Daha önce yapıldıysa hiçbir şey yapmaz ve false döner. */
    tasi(eski: EskiVeri): Promise<boolean>;
  };
  pencere: {
    panelDurumu(acik: boolean): Promise<void>;
    /** Tam ekrana girip çıkınca çağrılır. Aboneliği bırakan fonksiyonu döner. */
    tamEkranDegisti(cb: (tamEkran: boolean) => void): () => void;
  };
}
