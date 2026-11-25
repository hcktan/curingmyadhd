/* JSON dosyası üzerinde depo uygulamaları. */

import { randomUUID } from 'node:crypto';
import type { EslemeAlanlari, Kayit } from '../../shared/model';
import type { DocRepository, ListRepository } from '../../shared/repository';
import type { JsonFile } from './jsonFile';

export interface Saat {
  simdi: () => number;
  cihazId: string;
}

/** Kayıtlar `{ surum, kayitlar: [...] }` biçimindeki bir dosyada durur. */
export class JsonListRepository<T extends Kayit> implements ListRepository<T> {
  private readonly dosya: JsonFile<{ surum: number; kayitlar: T[] }>;
  private readonly saat: Saat;

  constructor(dosya: JsonFile<{ surum: number; kayitlar: T[] }>, saat: Saat) {
    this.dosya = dosya;
    this.saat = saat;
  }

  /** Silinmiş olanlar dahil hepsi (eşleme ve testler için). */
  tumu(): T[] {
    return this.dosya.get().kayitlar;
  }

  list(): T[] {
    return this.tumu().filter((k) => !k.silindi);
  }

  get(id: string): T | undefined {
    return this.list().find((k) => k.id === id);
  }

  put(kayit: Omit<T, 'guncellendi' | 'cihazId'>): T {
    const yeni = { ...kayit, guncellendi: this.zaman(kayit.id), cihazId: this.saat.cihazId } as T;
    const d = this.dosya.get();
    const i = d.kayitlar.findIndex((k) => k.id === yeni.id);
    const kayitlar = d.kayitlar.slice();
    if (i >= 0) kayitlar[i] = yeni;
    else kayitlar.push(yeni);
    this.dosya.set({ ...d, kayitlar });
    return yeni;
  }

  remove(id: string): void {
    const k = this.tumu().find((x) => x.id === id);
    if (!k || k.silindi) return;
    this.put({ ...k, silindi: true });
  }

  yeniKimlik(): string {
    return randomUUID();
  }

  /** guncellendi her değişiklikte kesin artar (aynı milisaniyede iki değişiklik olsa bile). */
  private zaman(id: string): number {
    const onceki = this.tumu().find((k) => k.id === id)?.guncellendi ?? 0;
    return Math.max(this.saat.simdi(), onceki + 1);
  }
}

/** Tek belge: `{ surum, ...deger, guncellendi, cihazId }`. */
export class JsonDocRepository<V extends object> implements DocRepository<V> {
  private readonly dosya: JsonFile<{ surum: number } & V & EslemeAlanlari>;
  private readonly saat: Saat;
  private readonly ayikla: (d: V & EslemeAlanlari) => V;

  constructor(
    dosya: JsonFile<{ surum: number } & V & EslemeAlanlari>,
    saat: Saat,
    ayikla: (d: V & EslemeAlanlari) => V,
  ) {
    this.dosya = dosya;
    this.saat = saat;
    this.ayikla = ayikla;
  }

  read(): V {
    return this.ayikla(this.dosya.get());
  }

  /** Eşleme alanları dahil ham belge. */
  ham(): V & EslemeAlanlari {
    return this.dosya.get();
  }

  write(deger: V): void {
    const d = this.dosya.get();
    this.dosya.set({
      ...d,
      ...deger,
      guncellendi: Math.max(this.saat.simdi(), d.guncellendi + 1),
      cihazId: this.saat.cihazId,
    });
  }
}
