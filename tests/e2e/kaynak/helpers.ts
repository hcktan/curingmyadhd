import { test as base, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/* Kaynak sürümün (kaynak/v0.1-tarayici.html) tarayıcıda açılması. Bu görüntüler dondurulmuş referanstır:
   Electron sahnesi bunlarla karşılaştırılır. Yeniden üretmek için: npm run shot:kaynak */
export type Target = 'kaynak';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const SHOTS = resolve(ROOT, 'tests/shots');
const SOURCE_URL = pathToFileURL(resolve(ROOT, 'kaynak/v0.1-tarayici.html')).href;
const FONT_DIR = resolve(ROOT, 'node_modules/@fontsource/jost/files');

/* Kaynak sürüm Jost'u Google Fonts'tan ister. Testte ağa çıkılmaz: istek, taşınan sürümün kullandığı
   aynı yerel @font-face tanımlarıyla ve aynı woff2 dosyalarıyla cevaplanır. */
const FONT_CSS = readFileSync(resolve(ROOT, 'src/styles/fonts.css'), 'utf8').replaceAll(
  'url(@fontsource/jost/files/',
  'url(https://fonts.gstatic.com/jost/',
);

/** Sahte saatin kurulduğu ve sayfa yüklendikten sonra durdurulduğu anlar. */
export const T_INSTALL = new Date('2026-01-05T08:00:00Z').getTime();
export const T_PAUSE = T_INSTALL + 60_000;
export const MIN = 60_000;

export interface OpenOptions {
  colorScheme?: 'light' | 'dark';
  reducedMotion?: 'reduce' | 'no-preference';
  size?: { width: number; height: number };
}

export const test = base.extend<{ target: Target; open: (o?: OpenOptions) => Promise<Page>; external: string[] }>({
  target: ['kaynak', { option: true }],
  external: async ({ page, target }, use) => {
    const list: string[] = [];
    page.on('request', (r) => {
      const u = r.url();
      if (u.startsWith('data:') || u.startsWith('file:')) return;
      list.push(u);
    });
    if (target === 'kaynak') {
      await page.route('https://fonts.googleapis.com/**', (route) =>
        route.fulfill({ contentType: 'text/css', body: FONT_CSS, headers: { 'access-control-allow-origin': '*' } }),
      );
      await page.route('https://fonts.gstatic.com/jost/**', (route) => {
        const name = new URL(route.request().url()).pathname.split('/').pop()!;
        return route.fulfill({
          contentType: 'font/woff2',
          body: readFileSync(resolve(FONT_DIR, name)),
          headers: { 'access-control-allow-origin': '*' },
        });
      });
    }
    await use(list);
  },
  open: async ({ page, target, external }, use) => {
    void external;
    await use(async (o: OpenOptions = {}) => {
      await page.setViewportSize(o.size ?? { width: 430, height: 860 });
      await page.emulateMedia({ colorScheme: o.colorScheme ?? 'light', reducedMotion: o.reducedMotion ?? 'no-preference' });
      await page.clock.install({ time: T_INSTALL });
      void target;
      await page.goto(SOURCE_URL);
      await page.clock.pauseAt(T_PAUSE);
      await page.evaluate(async () => {
        await Promise.all(['300', '400', '500'].map((w) => document.fonts.load(w + ' 16px Jost', 'Aş')));
        await document.fonts.ready;
      });
      return page;
    });
  },
});

export { expect };

/** Odaktaki öğeyi bırakır; boşluk tuşu belgeye gitsin diye. */
export async function blur(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

export async function curSeg(page: Page): Promise<string | null> {
  return page.locator('#strip .seg.cur').getAttribute('data-i');
}
