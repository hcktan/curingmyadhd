import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VeriDeposu } from '../../src/main/storage/veriDeposu';

let klasor: string;
let saat: number;
const simdi = () => saat;
const ac = () => new VeriDeposu({ klasor, bekleme: 0, simdi });
const oku = (ad: string) => JSON.parse(readFileSync(join(klasor, ad), 'utf8'));

beforeEach(() => {
  klasor = mkdtempSync(join(tmpdir(), 'cma-depo-'));
  saat = 1_700_000_000_000;
});
afterEach(() => rmSync(klasor, { recursive: true, force: true }));

describe('ilk açılış', () => {
  it('varsayılanları şema sürümüyle yazar', () => {
    const d = ac();
    expect(readdirSync(klasor).sort()).toEqual(['aktif-plan.json', 'ayarlar.json', 'cihaz.json', 'planlar.json']);
    expect(d.planlar.list().map((p) => p.ad)).toEqual(["Klasik 4'lü", 'Derin odak']);
    expect(d.ayarlar.read()).toEqual({ otomatik: true, basaDon: false });
    expect(d.aktifPlan.read().plan).toBe('O25 K5 O25 K5 O25 K5 O25 U15');
    for (const f of ['planlar.json', 'ayarlar.json', 'aktif-plan.json', 'cihaz.json']) expect(oku(f).surum).toBe(1);
    const p = oku('planlar.json').kayitlar[0];
    expect(p).toMatchObject({ silindi: false, cihazId: oku('cihaz.json').cihazId });
    expect(p.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof p.guncellendi).toBe('number');
  });

  it('cihazId iki açılışta aynı kalır', () => {
    const a = ac().cihaz.get().cihazId;
    const b = ac().cihaz.get().cihazId;
    expect(a).toBe(b);
  });
});

describe('kayıt ve okuma', () => {
  it('gidiş-dönüş: yeniden açınca aynı veri gelir', () => {
    const d = ac();
    d.aktifPlanYaz('o10 k2');
    d.ayarlarYaz({ otomatik: false, basaDon: true });
    d.planKaydet('Deneme', 'O15 K3');
    const e = ac();
    expect(e.aktifPlan.read().plan).toBe('O10 K2');
    expect(e.ayarlar.read()).toEqual({ otomatik: false, basaDon: true });
    expect(e.planlar.list().map((p) => [p.ad, p.plan])).toContainEqual(['Deneme', 'O15 K3']);
  });

  it('aynı adla kaydetmek üzerine yazar, kimlik değişmez', () => {
    const d = ac();
    const [a] = d.planKaydet('Deneme', 'O15').filter((p) => p.ad === 'Deneme');
    saat += 10;
    const [b] = d.planKaydet('Deneme', 'O20').filter((p) => p.ad === 'Deneme');
    expect(b.id).toBe(a.id);
    expect(b.plan).toBe('O20');
    expect(b.guncellendi).toBeGreaterThan(a.guncellendi);
    expect(d.planlar.list()).toHaveLength(3);
  });

  it('remove listeden çıkarır, dosyada silinme izi bırakır, guncellendi artar', () => {
    const d = ac();
    const hedef = d.planlar.list()[0];
    d.planSil(hedef.id);
    expect(d.planlar.list().map((p) => p.id)).not.toContain(hedef.id);
    const dosyada = oku('planlar.json').kayitlar.find((k: { id: string }) => k.id === hedef.id);
    expect(dosyada.silindi).toBe(true);
    expect(dosyada.guncellendi).toBeGreaterThan(hedef.guncellendi);
  });

  it('yazma birleştirilir ve flush ile diske işlenir', async () => {
    const d = new VeriDeposu({ klasor, bekleme: 50, simdi });
    d.aktifPlanYaz('O1');
    d.aktifPlanYaz('O2');
    expect(oku('aktif-plan.json').plan).toBe('O25 K5 O25 K5 O25 K5 O25 U15');
    d.flush();
    expect(oku('aktif-plan.json').plan).toBe('O2');
  });
});

describe('dosya güvenliği', () => {
  it('bozuk dosya kenara alınır, silinmez; varsayılanla devam edilir', () => {
    ac();
    writeFileSync(join(klasor, 'ayarlar.json'), '{ bozuk json');
    const d = ac();
    expect(d.ayarlar.read()).toEqual({ otomatik: true, basaDon: false });
    const bozuk = readdirSync(klasor).filter((f) => f.startsWith('ayarlar.bozuk-'));
    expect(bozuk).toHaveLength(1);
    expect(readFileSync(join(klasor, bozuk[0]), 'utf8')).toBe('{ bozuk json');
  });

  it('biçimi geçersiz dosya da kenara alınır', () => {
    ac();
    writeFileSync(join(klasor, 'planlar.json'), JSON.stringify({ surum: 1, kayitlar: [{ ad: 3 }] }));
    ac();
    expect(readdirSync(klasor).some((f) => f.startsWith('planlar.bozuk-'))).toBe(true);
  });

  it('yarıda kalmış .tmp dosyası asıl dosyayı bozmaz', () => {
    const d = ac();
    d.aktifPlanYaz('O30');
    writeFileSync(join(klasor, 'aktif-plan.json.tmp'), '{"yarım');
    expect(ac().aktifPlan.read().plan).toBe('O30');
  });
});

describe('doğrulama', () => {
  it('61 blokluk plan reddedilir, 60 blok kabul edilir', () => {
    const d = ac();
    expect(d.aktifPlanYaz('O1 '.repeat(61))).toBe(false);
    expect(d.aktifPlanYaz('O1 '.repeat(60))).toBe(true);
  });

  it('tanınmayan parça, boş metin ve metin olmayan değer reddedilir', () => {
    const d = ac();
    expect(d.aktifPlanYaz('O25 X9')).toBe(false);
    expect(d.aktifPlanYaz('')).toBe(false);
    expect(d.aktifPlanYaz(42)).toBe(false);
    expect(d.aktifPlan.read().plan).toBe('O25 K5 O25 K5 O25 K5 O25 U15');
  });

  it('21. kayıtlı plan reddedilir', () => {
    const d = ac();
    for (let i = 3; i <= 25; i++) d.planKaydet('Plan ' + i, 'O25');
    expect(d.planlar.list()).toHaveLength(20);
  });

  it('tipi yanlış ayar reddedilir', () => {
    const d = ac();
    expect(d.ayarlarYaz({ otomatik: 'evet', basaDon: false })).toBe(false);
    expect(d.ayarlarYaz({ otomatik: true })).toBe(false);
    expect(d.ayarlarYaz(null)).toBe(false);
    expect(d.ayarlar.read()).toEqual({ otomatik: true, basaDon: false });
  });

  it('geçersiz ad ve kimlik listeyi değiştirmez', () => {
    const d = ac();
    expect(d.planKaydet('', 'O25')).toHaveLength(2);
    expect(d.planKaydet('x'.repeat(25), 'O25')).toHaveLength(2);
    expect(d.planKaydet({ ad: 'x' }, 'O25')).toHaveLength(2);
    expect(d.planSil('../../etc/passwd')).toHaveLength(2);
  });
});

describe('localStorage taşıması', () => {
  const eski = {
    'yp-plan': JSON.stringify('O15 K3 U9'),
    'yp-set': JSON.stringify({ auto: false, loop: true }),
    'yp-saved': JSON.stringify([
      { n: 'Benim', p: 'O40 K10' },
      { n: 'Bozuk', p: 'X1' },
      { n: 'Derin odak', p: 'O50 K10' },
    ]),
  };

  it('eski biçimi yeni modele çevirir: n/p/auto/loop', () => {
    const d = ac();
    expect(d.tasi(eski)).toBe(true);
    expect(d.aktifPlan.read().plan).toBe('O15 K3 U9');
    expect(d.ayarlar.read()).toEqual({ otomatik: false, basaDon: true });
    expect(d.planlar.list().map((p) => [p.ad, p.plan])).toEqual([
      ['Benim', 'O40 K10'],
      ['Derin odak', 'O50 K10'],
    ]);
    expect(typeof oku('cihaz.json').tasindi).toBe('number');
    // Eski varsayılanlar silinme iziyle dosyada kalır.
    expect(oku('planlar.json').kayitlar.filter((k: { silindi: boolean }) => k.silindi)).toHaveLength(2);
  });

  it('ikinci kez çalışmaz', () => {
    const d = ac();
    d.tasi(eski);
    expect(ac().tasi({ 'yp-plan': JSON.stringify('O5') })).toBe(false);
    expect(ac().aktifPlan.read().plan).toBe('O15 K3 U9');
  });

  it('eski ayarlarda auto yoksa açık sayılır (kaynak kuralı)', () => {
    const d = ac();
    d.tasi({ 'yp-set': JSON.stringify({}) });
    expect(d.ayarlar.read()).toEqual({ otomatik: true, basaDon: false });
  });

  it('bozuk eski veri yok sayılır ama taşıma işaretlenir', () => {
    const d = ac();
    expect(d.tasi({ 'yp-plan': '{bozuk', 'yp-saved': 'null' })).toBe(true);
    expect(d.aktifPlan.read().plan).toBe('O25 K5 O25 K5 O25 K5 O25 U15');
    expect(d.planlar.list()).toHaveLength(2);
  });
});
