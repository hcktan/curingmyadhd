/* Depo arayüzleri. Uygulaması ana süreçte (src/main/storage/jsonRepository.ts). */

import type { Kayit } from './model';

/** Kayıt listesi. `put` ve `remove` eşleme alanlarını (guncellendi, cihazId) kendisi doldurur. */
export interface ListRepository<T extends Kayit> {
  /** Silinmemiş kayıtlar, ekleme sırasıyla. */
  list(): T[];
  get(id: string): T | undefined;
  put(kayit: Omit<T, 'guncellendi' | 'cihazId'>): T;
  /** Silinme izi bırakır: kayıt `silindi: true` ile dosyada kalır. */
  remove(id: string): void;
}

/** Tek belge (ayarlar, aktif plan). `write` eşleme alanlarını kendisi doldurur. */
export interface DocRepository<V> {
  read(): V;
  write(deger: V): void;
}
