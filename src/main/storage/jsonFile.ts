/* Tek bir JSON dosyası: okuma, atomik yazma, yazma birleştirme, bozuk dosyayı kenara alma.
   Electron'a bağlı değildir; Vitest ile geçici klasörde denenir. */

import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export interface JsonFileOptions<T> {
  /** Dosya yoksa ya da bozuksa kullanılacak değer. */
  varsayilan: () => T;
  /** Okunan ham değeri doğrular; geçersizse null döner. */
  dogrula: (ham: unknown) => T | null;
  /** Yazma birleştirme süresi (ms). 0: hemen yaz. */
  bekleme?: number;
  simdi?: () => number;
}

export class JsonFile<T> {
  private deger: T;
  private zamanlayici: ReturnType<typeof setTimeout> | null = null;
  private kirli = false;
  /** Kenara alınan bozuk dosyanın yolu (varsa). */
  readonly bozukYolu: string | null = null;
  /** Bozuk dosya kenara alınamadıysa diske hiç yazılmaz: bozuk dosya korunur. */
  private salt_okunur = false;

  readonly yol: string;
  private readonly o: JsonFileOptions<T>;

  constructor(yol: string, o: JsonFileOptions<T>) {
    this.yol = yol;
    this.o = o;
    mkdirSync(dirname(yol), { recursive: true });
    const okunan = this.oku();
    if (okunan.durum === 'tamam') {
      this.deger = okunan.deger;
    } else {
      if (okunan.durum === 'bozuk') {
        // Bozuk dosya üzerine yazılmaz: önce kenara alınır.
        const ad = basename(yol, '.json') + '.bozuk-' + this.simdi() + '.json';
        try {
          renameSync(yol, join(dirname(yol), ad));
          this.bozukYolu = join(dirname(yol), ad);
        } catch (e) {
          console.error('[depo] bozuk dosya kenara alınamadı, yazma kapatıldı:', yol, e);
          this.salt_okunur = true;
        }
      }
      this.deger = o.varsayilan();
      this.kirli = true;
      this.flush();
    }
  }

  private simdi(): number {
    return (this.o.simdi ?? Date.now)();
  }

  private oku(): { durum: 'tamam'; deger: T } | { durum: 'yok' } | { durum: 'bozuk' } {
    if (!existsSync(this.yol)) return { durum: 'yok' };
    try {
      const d = this.o.dogrula(JSON.parse(readFileSync(this.yol, 'utf8')));
      return d === null ? { durum: 'bozuk' } : { durum: 'tamam', deger: d };
    } catch {
      return { durum: 'bozuk' };
    }
  }

  get(): T {
    return this.deger;
  }

  /** Değeri değiştirir; diske birleştirilerek yazılır. */
  set(v: T): void {
    this.deger = v;
    this.kirli = true;
    const bekleme = this.o.bekleme ?? 0;
    if (bekleme <= 0) {
      this.flush();
      return;
    }
    if (this.zamanlayici) clearTimeout(this.zamanlayici);
    this.zamanlayici = setTimeout(() => this.flush(), bekleme);
  }

  /** Bekleyen yazmayı hemen diske işler (kapanışta çağrılır). */
  flush(): void {
    if (this.zamanlayici) {
      clearTimeout(this.zamanlayici);
      this.zamanlayici = null;
    }
    if (!this.kirli || this.salt_okunur) return;
    try {
      this.yazAtomik();
    } catch (e) {
      // Disk dolu ya da izin hatası: uygulama düşmez, değer bellekte kalır ve sonraki yazmada yeniden denenir.
      console.error('[depo] yazılamadı:', this.yol, e);
    }
  }

  /** Önce .tmp dosyasına yazar, sonra rename ile yerine koyar. Yarıda kesilirse asıl dosya sağlam kalır. */
  private yazAtomik(): void {
    const tmp = this.yol + '.tmp';
    const fd = openSync(tmp, 'w');
    try {
      writeSync(fd, JSON.stringify(this.deger, null, 2) + '\n', null, 'utf8');
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(tmp, this.yol);
    this.kirli = false;
  }
}
