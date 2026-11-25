/* Masaüstü kabuğu: panel, pencere durumu, JSON depo, taşıma ve güvenlik sınırı. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, icerikBoyutu, test } from './fixture';

const kesisir = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test.describe('panel', () => {
  test('ayar düğmesi paneli açar ve kapatır; kapatma düğmesi de kapatır', async ({ uygulama }) => {
    const { page } = await uygulama();
    await expect(page.locator('#panel-root')).toBeHidden();
    await page.click('#gear');
    await expect(page.locator('#panel-root')).toBeVisible();
    await expect(page.locator('#gear')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.sekme')).toHaveText(['Plan']);
    await expect(page.locator('#plan-text')).toBeVisible();
    await page.click('#gear');
    await expect(page.locator('#panel-root')).toBeHidden();
    await page.click('#gear');
    await page.click('#panel-kapat');
    await expect(page.locator('#panel-root')).toBeHidden();
    await expect(page.locator('#gear')).toHaveAttribute('aria-expanded', 'false');
  });

  for (const size of [
    { width: 430, height: 860 },
    { width: 1280, height: 800 },
    { width: 1512, height: 982 },
  ]) {
    test(`panel açıkken penguen görünür kalır (${size.width}x${size.height})`, async ({ uygulama }) => {
      const { page } = await uygulama({ size });
      await page.click('#gear');
      await expect(page.locator('#panel-root')).toBeVisible();
      // Dar pencere panel için genişler: sahne en az 430 px kalır.
      await expect.poll(() => page.evaluate(() => document.querySelector('.app')!.getBoundingClientRect().width)).toBeGreaterThanOrEqual(430);
      const r = await page.evaluate(() => {
        const k = (s: string) => document.querySelector(s)!.getBoundingClientRect().toJSON();
        return { peng: k('#peng'), app: k('.app'), panel: k('#panel-root'), sheet: k('#sheet') };
      });
      expect(kesisir(r.peng, r.panel)).toBe(false);
      expect(kesisir(r.peng, r.sheet)).toBe(false);
      expect(r.peng.left).toBeGreaterThanOrEqual(r.app.left);
      expect(r.peng.right).toBeLessThanOrEqual(r.app.right);
      expect(r.peng.bottom).toBeLessThanOrEqual(r.app.bottom);
      expect(r.peng.top).toBeGreaterThanOrEqual(r.app.top);
    });
  }
});

test.describe('pencere durumu', () => {
  test('boyut, konum ve panel durumu kapatıp açınca aynı gelir', async ({ uygulama }) => {
    const u = await uygulama({ saat: false });
    const hedef = await u.app.evaluate(({ BrowserWindow, screen }) => {
      const a = screen.getPrimaryDisplay().workArea;
      const b = { x: a.x + 40, y: a.y + 30, width: 900, height: 700 };
      BrowserWindow.getAllWindows()[0].setContentBounds(b);
      return BrowserWindow.getAllWindows()[0].getContentBounds();
    });
    await u.page.click('#gear');
    await expect(u.page.locator('#panel-root')).toBeVisible();
    await u.kapat();
    const json = JSON.parse(readFileSync(join(u.klasor, 'pencere.json'), 'utf8'));
    expect(json).toMatchObject({ x: hedef.x, y: hedef.y, genislik: 900, yukseklik: 700, panelAcik: true, tamEkran: false });

    const u2 = await uygulama({ klasor: u.klasor, saat: false });
    const b = await u2.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getContentBounds());
    expect(b).toEqual(hedef);
    await expect(u2.page.locator('#panel-root')).toBeVisible();
  });
});

test.describe('JSON depo', () => {
  test('dosyalar şema sürümü ve eşleme alanlarıyla yazılır; silinen plan iz bırakır', async ({ uygulama }) => {
    const u = await uygulama();
    const { page } = u;
    await page.click('#gear');
    await page.fill('#plan-text', 'O10 K2');
    await page.click('#set-loop button[data-v="1"]');
    await page.fill('#save-name', 'Deneme');
    await page.click('#save-btn');
    await expect(page.locator('#saved li')).toHaveCount(3);
    await page.click('#saved li:nth-child(1) [data-a="del"]');
    await expect(page.locator('#saved li')).toHaveCount(2);
    await u.kapat();

    const cihaz = u.dosya('cihaz.json');
    expect(cihaz.surum).toBe(1);
    expect(cihaz.cihazId).toMatch(/^[0-9a-f-]{36}$/);
    expect(u.dosya('aktif-plan.json')).toMatchObject({ surum: 1, plan: 'O10 K2', cihazId: cihaz.cihazId });
    expect(u.dosya('ayarlar.json')).toMatchObject({ surum: 1, otomatik: true, basaDon: true, cihazId: cihaz.cihazId });
    const planlar = u.dosya('planlar.json');
    expect(planlar.surum).toBe(1);
    expect(planlar.kayitlar).toHaveLength(3);
    for (const k of planlar.kayitlar) {
      expect(k.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(typeof k.guncellendi).toBe('number');
      expect(k.cihazId).toBe(cihaz.cihazId);
    }
    expect(planlar.kayitlar.find((k: { ad: string }) => k.ad === "Klasik 4'lü").silindi).toBe(true);
    expect(planlar.kayitlar.find((k: { ad: string }) => k.ad === 'Deneme')).toMatchObject({ plan: 'O10 K2', silindi: false });
  });
});

test.describe('localStorage taşıması', () => {
  test('eski veri bir kez taşınır, ikinci açılışta tekrar çalışmaz', async ({ uygulama }) => {
    const eski = {
      'yp-plan': JSON.stringify('O15 K3 U9'),
      'yp-set': JSON.stringify({ auto: false, loop: true }),
      'yp-saved': JSON.stringify([{ n: 'Eski plan', p: 'O40 K10' }]),
    };
    const u = await uygulama({ localStorage: eski });
    await expect(u.page.locator('#strip .seg')).toHaveCount(3);
    await expect(u.page.locator('#saved li b')).toHaveText(['Eski plan']);
    // localStorage silinmez.
    expect(await u.page.evaluate(() => localStorage.getItem('yp-plan'))).toBe(JSON.stringify('O15 K3 U9'));
    await u.page.evaluate(() => localStorage.setItem('yp-plan', JSON.stringify('O5')));
    await u.kapat();
    expect(u.dosya('aktif-plan.json').plan).toBe('O15 K3 U9');
    expect(u.dosya('ayarlar.json')).toMatchObject({ otomatik: false, basaDon: true });
    expect(typeof u.dosya('cihaz.json').tasindi).toBe('number');

    const u2 = await uygulama({ klasor: u.klasor });
    await expect(u2.page.locator('#time')).toHaveText('15:00');
    await u2.kapat();
    expect(u2.dosya('aktif-plan.json').plan).toBe('O15 K3 U9');
  });
});

test.describe('güvenlik', () => {
  test('arayüzde Node yok; window.cma yalnızca belgelenen fonksiyonları verir', async ({ uygulama }) => {
    const { page } = await uygulama({ saat: false });
    const r = await page.evaluate(() => ({
      require: typeof (window as any).require,
      process: typeof (window as any).process,
      module: typeof (window as any).module,
      cma: Object.fromEntries(Object.entries((window as any).cma).map(([k, v]) => [k, Object.keys(v as object).sort()])),
      donmus: Object.isFrozen((window as any).cma),
    }));
    expect(r.require).toBe('undefined');
    expect(r.process).toBe('undefined');
    expect(r.module).toBe('undefined');
    expect(r.cma).toEqual({
      veri: ['aktifPlanYaz', 'ayarlarYaz', 'planKaydet', 'planSil', 'tasi', 'yukle'],
      pencere: ['panelDurumu', 'tamEkranDegisti'],
    });
  });

  test('window.open ve dış adrese gezinme engellenir', async ({ uygulama }) => {
    const u = await uygulama({ saat: false });
    const { page } = u;
    const once = page.url();
    expect(await page.evaluate(() => window.open('https://example.com') === null)).toBe(true);
    await page.evaluate(() => {
      location.href = 'https://example.com/';
    });
    await page.waitForTimeout(500);
    expect(page.url()).toBe(once);
    expect(await u.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);
  });

  test('geçersiz IPC verisi yazılmaz', async ({ uygulama }) => {
    const u = await uygulama({ saat: false });
    const r = await u.page.evaluate(async () => {
      const c = (window as any).cma.veri;
      return [
        await c.aktifPlanYaz('O1 '.repeat(61)),
        await c.ayarlarYaz({ otomatik: 'evet', basaDon: 1 }),
        (await c.planKaydet('<x>'.repeat(20), 'O25')).length,
        (await c.planSil('../../pencere.json')).length,
      ];
    });
    expect(r).toEqual([false, false, 2, 2]);
    await u.kapat();
    expect(u.dosya('aktif-plan.json').plan).toBe('O25 K5 O25 K5 O25 K5 O25 U15');
  });

  test('açılışta dış alan adına istek gitmez, Jost yerelden yüklenir', async ({ uygulama }) => {
    const u = await uygulama({ saat: false });
    await u.page.reload();
    await u.page.locator('#strip .seg').first().waitFor();
    await u.page.click('#gear');
    expect(await u.page.evaluate(() => document.fonts.check('300 16px Jost'))).toBe(true);
    expect(await u.page.evaluate(() => document.fonts.check('500 16px Jost', 'ş'))).toBe(true);
    expect(u.disIstekler).toEqual([]);
  });

  test('pencere boyutu en küçük sınırın altına inmez', async ({ uygulama }) => {
    const u = await uygulama({ saat: false });
    await u.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(200, 200));
    const b = await u.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getContentSize());
    expect(b[0]).toBeGreaterThanOrEqual(430);
    expect(b[1]).toBeGreaterThanOrEqual(640);
    await icerikBoyutu(u, 430, 860);
  });
});
