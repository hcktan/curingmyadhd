/* Electron testleri için ortak düzen. Her test kendi geçici veri klasörüyle açılır;
   gerçek kullanıcı verisine dokunulmaz. */
import { _electron as electron, test as base, expect, type ElectronApplication, type Page } from '@playwright/test';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export const T_INSTALL = new Date('2026-01-05T08:00:00Z').getTime();
export const T_PAUSE = T_INSTALL + 60_000;
export const MIN = 60_000;

export interface AcSecenekleri {
  colorScheme?: 'light' | 'dark';
  reducedMotion?: 'reduce' | 'no-preference';
  /** Pencerenin içerik boyutu. */
  size?: { width: number; height: number };
  /** Var olan bir veri klasörüyle aç (yeniden açılış testleri). */
  klasor?: string;
  /** Sahte saati kur (varsayılan: evet). */
  saat?: boolean;
  /** Açılıştan önce pencerenin localStorage'ına yazılacak eski veri. */
  localStorage?: Record<string, string>;
}

export interface Uygulama {
  app: ElectronApplication;
  page: Page;
  klasor: string;
  /** Açılıştan bu yana dış alan adına giden istekler. */
  disIstekler: string[];
  /** veri klasöründeki bir JSON dosyasını okur. */
  dosya: (ad: string) => any;
  kapat: () => Promise<void>;
}

export async function icerikBoyutu(u: Uygulama, w: number, h: number): Promise<void> {
  // Uygulamanın kendi penceresi (testte açılan kaynak penceresi değil).
  await u.app.evaluate(({ BrowserWindow }, [w, h]) => {
    const p = BrowserWindow.getAllWindows().find((x) => !x.webContents.getURL().includes('/kaynak/'))!;
    p.setContentSize(w, h);
  }, [w, h]);
  await expect.poll(() => u.page.evaluate(() => [innerWidth, innerHeight])).toEqual([w, h]);
}

async function yaziTipleri(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await Promise.all(['300', '400', '500'].map((w) => document.fonts.load(w + ' 16px Jost', 'Aş')));
    await document.fonts.ready;
  });
}

export async function ac(o: AcSecenekleri = {}): Promise<Uygulama> {
  const klasor = o.klasor ?? mkdtempSync(join(tmpdir(), 'cma-test-'));
  const app = await electron.launch({
    args: [ROOT, `--cma-veri-klasoru=${klasor}`, '--force-device-scale-factor=1', '--force-color-profile=srgb'],
    colorScheme: o.colorScheme ?? 'light',
  });
  const page = await app.firstWindow();
  await page.waitForLoadState('load');
  if (o.reducedMotion) await page.emulateMedia({ reducedMotion: o.reducedMotion });
  const disIstekler: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('devtools:')) disIstekler.push(u);
  });
  const u: Uygulama = {
    app,
    page,
    klasor,
    disIstekler,
    dosya: (ad) => JSON.parse(readFileSync(join(klasor, 'veri', ad), 'utf8')),
    kapat: async () => {
      await app.close();
    },
  };
  if (o.size) await icerikBoyutu(u, o.size.width, o.size.height);
  if (o.localStorage) {
    await page.evaluate((ls) => {
      for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v);
    }, o.localStorage);
  }
  if (o.saat !== false) {
    // Sahte saat sayfa betiklerinden önce kurulmalı: kurulur, sayfa yeniden yüklenir, sonra durdurulur.
    await app.context().clock.install({ time: T_INSTALL });
  }
  if (o.saat !== false || o.localStorage || o.reducedMotion) {
    await page.reload();
    await page.waitForLoadState('load');
  }
  await page.locator('#strip .seg').first().waitFor();
  if (o.saat !== false) await page.clock.pauseAt(T_PAUSE);
  await yaziTipleri(page);
  return u;
}

export const test = base.extend<{ uygulama: (o?: AcSecenekleri) => Promise<Uygulama> }>({
  uygulama: async ({}, use) => {
    const acilanlar: Uygulama[] = [];
    await use(async (o) => {
      const u = await ac(o);
      acilanlar.push(u);
      return u;
    });
    for (const u of acilanlar) await u.app.close().catch(() => {});
  },
});

export { expect };

export async function blur(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

export async function curSeg(page: Page): Promise<string | null> {
  return page.locator('#strip .seg.cur').getAttribute('data-i');
}
