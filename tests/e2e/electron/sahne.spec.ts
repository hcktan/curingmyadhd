/* Görüntüler.
   1) Kaynakla birebir karşılaştırma: 430x860, panel kapalı, sahne durumları. Kaynak HTML her çalıştırmada
      aynı Electron'da açılıp çekilir (tests/shots/kaynak-electron/, git'e girmez). Trafik ışığı payı
      (pencere çubuğu) kaynakta olmadığı için bu karşılaştırmada sıfırlanır.
   2) Electron temel görüntüleri: tests/shots/electron/. Panel ve geniş pencere burada denetlenir. */
import type { Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIN, expect, icerikBoyutu, test, type Uygulama } from './fixture';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const FONT_CSS = readFileSync(resolve(ROOT, 'src/renderer/styles/fonts.css'), 'utf8').replaceAll(
  'url(@fontsource/jost/files/',
  'url(https://fonts.gstatic.com/jost/',
);

type Adim = (page: Page) => Promise<void>;
const basla: Adim = async (p) => {
  await p.click('#toggle');
};
const ilerlet = (ms: number): Adim => async (p) => {
  await p.clock.fastForward(ms);
};
const ayar: Adim = async (p) => {
  await p.click('#gear');
};

const DURUMLAR: Record<string, Adim[]> = {
  bos: [],
  'odak-orta': [basla, ilerlet(12.5 * MIN)],
  duraklat: [basla, ilerlet(12.5 * MIN), basla],
  'kisa-mola': [basla, ilerlet(27 * MIN)],
  'uzun-mola': [basla, ilerlet(120 * MIN)],
  bitti: [basla, ilerlet(131 * MIN)],
  'elle-durdu': [ayar, async (p) => p.click('#set-auto button[data-v="0"]'), ayar, basla, ilerlet(25 * MIN)],
  panel: [ayar],
  'panel-basladi': [basla, ilerlet(12.5 * MIN), ayar],
  'panel-secili': [ayar, async (p) => p.click('#chips button:nth-child(3)')],
  'panel-hata': [ayar, async (p) => p.fill('#plan-text', 'O25 X9')],
};

const TEMALAR = [
  ['light', 'acik'],
  ['dark', 'koyu'],
] as const;

async function hazirla(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
  // Panel açılınca pencere yeniden boyutlanır; sahne düzeninin oturmasını bekle.
  // (requestAnimationFrame sahte saatle durduğu için kullanılmaz; ResizeObserver gerçek zamanda çalışır.)
  await page.evaluate(() => document.body.getBoundingClientRect());
  await page.waitForTimeout(150);
}

/* Kaynak sürüm aynı Electron içinde ikinci bir pencerede açılır: iki görüntü de aynı Chromium ve aynı
   GPU yoluyla çizilir. (Tarayıcıda çekilen tests/shots/kaynak/ görüntüleri farklı bir Chromium sürümünden
   geldiği için her pikselde 1-2 seviye, kenarlarda daha fazla fark verir; eşik gevşetilmez.) */
async function kaynakPenceresi(u: Uygulama, reducedMotion?: 'reduce'): Promise<Page> {
  const ctx = u.app.context();
  await ctx.route('https://fonts.googleapis.com/**', (r) =>
    r.fulfill({ contentType: 'text/css', body: FONT_CSS, headers: { 'access-control-allow-origin': '*' } }),
  );
  await ctx.route('https://fonts.gstatic.com/jost/**', (r) =>
    r.fulfill({
      contentType: 'font/woff2',
      body: readFileSync(resolve(ROOT, 'node_modules/@fontsource/jost/files', new URL(r.request().url()).pathname.split('/').pop()!)),
      headers: { 'access-control-allow-origin': '*' },
    }),
  );
  const [page] = await Promise.all([
    u.app.waitForEvent('window'),
    u.app.evaluate(({ BrowserWindow }, yol) => {
      const w = new BrowserWindow({
        width: 430, height: 860, useContentSize: true,
        webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
      });
      void w.loadFile(yol);
    }, resolve(ROOT, 'kaynak/v0.1-tarayici.html')),
  ]);
  await page.waitForLoadState('load');
  if (reducedMotion) {
    await page.emulateMedia({ reducedMotion });
    await page.reload();
    await page.waitForLoadState('load');
  }
  // İki sayfada da kareler bir kez dönsün (ilk karenin zaman damgası iki sayfada aynı başlasın diye).
  await page.clock.runFor(100);
  await page.evaluate(async () => {
    await Promise.all(['300', '400', '500'].map((w) => document.fonts.load(w + ' 16px Jost', 'Aş')));
    await document.fonts.ready;
  });
  return page;
}

test.describe('kaynakla karşılaştırma (430x860, panel kapalı)', () => {
  const SAHNE = ['bos', 'odak-orta', 'duraklat', 'kisa-mola', 'uzun-mola', 'bitti', 'elle-durdu'];
  const durumlar: [string, 'light' | 'dark', string, 'reduce' | undefined][] = [];
  for (const durum of SAHNE) for (const [tema, ad] of TEMALAR) durumlar.push([durum, tema, `${durum}-${ad}-dar`, undefined]);
  durumlar.push(['bos', 'light', 'azaltilmis-acik-dar', 'reduce']);

  for (const [durum, tema, isim, azalt] of durumlar) {
    test(`kaynak ${isim}`, async ({ uygulama }) => {
      const u = await uygulama({ colorScheme: tema, size: { width: 430, height: 860 }, reducedMotion: azalt });
      const k = await kaynakPenceresi(u, azalt);
      for (const a of DURUMLAR[durum]) await a(k);
      await hazirla(k);
      mkdirSync(resolve(ROOT, 'tests/shots/kaynak-electron'), { recursive: true });
      await k.screenshot({ path: resolve(ROOT, 'tests/shots/kaynak-electron', `${isim}.png`), animations: 'disabled' });

      const { page } = u;
      await page.addStyleTag({ content: ':root { --baslik-payi: 0px !important; }' });
      await page.clock.runFor(100);
      for (const a of DURUMLAR[durum]) await a(page);
      // Panel açılınca pencere 790 px'e genişler; kapatılınca eski boyuta dönmez.
      if (durum === 'elle-durdu') await icerikBoyutu(u, 430, 860);
      await hazirla(page);
      // Aynı çizim motorunda gürültü ölçüldü: sıfır. Bu yüzden tek piksel fark bile kabul edilmez.
      await expect(page).toHaveScreenshot(['kaynak-electron', `${isim}.png`], { maxDiffPixelRatio: 0 });
    });
  }
});

test.describe('Electron temel görüntüleri', () => {
  const BOYUTLAR = {
    dar: { width: 430, height: 860 },
    genis: { width: 1280, height: 800 },
    tam: { width: 1512, height: 982 },
  };
  const DURUM = ['bos', 'odak-orta', 'bitti', 'panel', 'panel-basladi', 'panel-secili', 'panel-hata'];
  for (const durum of DURUM) {
    for (const [tema, ad] of TEMALAR) {
      for (const [boyutAdi, size] of Object.entries(BOYUTLAR)) {
        const isim = `${durum}-${ad}-${boyutAdi}`;
        test(`electron ${isim}`, async ({ uygulama }) => {
          const { page } = await uygulama({ colorScheme: tema, size });
          for (const a of DURUMLAR[durum]) await a(page);
          await hazirla(page);
          await expect(page).toHaveScreenshot(['electron', `${isim}.png`]);
        });
      }
    }
  }
});
