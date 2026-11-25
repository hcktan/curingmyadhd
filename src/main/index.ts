/* Ana süreç: tek pencere, güvenlik sınırı, IPC, veri deposu ve pencere durumu. */

import { app, BrowserWindow, ipcMain, Menu, screen, session, type IpcMainInvokeEvent } from 'electron';
import { isAbsolute, join } from 'node:path';
import { macosMenusu } from '../platform/macos/menu';
import { macosPencereSecenekleri } from '../platform/macos/window';
import { KANAL } from '../shared/ipc';
import type { Yukleme } from '../shared/model';
import * as V from '../shared/validate';
import { VeriDeposu } from './storage/veriDeposu';
import { EN_KUCUK, fitToDisplays, panelIcinGenislet, pencereDosyasi, type PencereDurumu } from './windowState';

const MAC = process.platform === 'darwin';
const RENDERER_URL = process.env['ELECTRON_RENDERER_URL'];
const GELISTIRME = !app.isPackaged && !!RENDERER_URL;

/* Testler gerçek kullanıcı verisine dokunmasın diye veri klasörü komut satırından verilebilir.
   Bu bir anahtar değildir; yalnızca klasör yoludur.
   Yalnızca paketlenmemiş uygulamada ve mutlak yolla kabul edilir. */
const klasorArg = app.isPackaged ? undefined : process.argv.find((a) => a.startsWith('--cma-veri-klasoru='));
const testKlasoru = klasorArg?.slice('--cma-veri-klasoru='.length);
if (testKlasoru && isAbsolute(testKlasoru)) app.setPath('userData', testKlasoru);

if (!app.requestSingleInstanceLock()) {
  // İki örnek aynı JSON dosyalarına yazmasın.
  app.quit();
} else {
  let pencere: BrowserWindow | null = null;
  let veri: VeriDeposu;
  let durum: ReturnType<typeof pencereDosyasi>;

  const sayfaAdresi = (): string =>
    RENDERER_URL && GELISTIRME ? RENDERER_URL : new URL('file://' + join(import.meta.dirname, '../renderer/index.html')).href;

  /** IPC yalnızca uygulamanın kendi sayfasından kabul edilir. */
  const guvenliGonderen = (e: IpcMainInvokeEvent): boolean => {
    const url = e.senderFrame?.url;
    if (!url || !pencere || e.sender !== pencere.webContents) return false;
    const beklenen = new URL(sayfaAdresi());
    const gelen = new URL(url);
    return gelen.protocol === beklenen.protocol && gelen.host === beklenen.host && gelen.pathname === beklenen.pathname;
  };

  const isle = <A extends unknown[], R>(kanal: string, f: (...a: A) => R, red: R) => {
    ipcMain.handle(kanal, (e, ...a) => (guvenliGonderen(e) ? f(...(a as A)) : red));
  };

  const durumuKaydet = () => {
    if (!pencere) return;
    const tamEkran = pencere.isFullScreen();
    const onceki = durum.get();
    // Tam ekranda ya da büyütülmüşken normal boyut saklanır; çıkınca pencere ona döner.
    const b = tamEkran || pencere.isMaximized() ? null : pencere.getContentBounds();
    const yeni: PencereDurumu = {
      ...onceki,
      ...(b ? { x: b.x, y: b.y, genislik: b.width, yukseklik: b.height } : {}),
      tamEkran,
      buyutulmus: pencere.isMaximized(),
    };
    durum.set(yeni);
  };

  function pencereAc(): void {
    const d = durum.get();
    const ekranlar = [screen.getPrimaryDisplay(), ...screen.getAllDisplays().filter((x) => x.id !== screen.getPrimaryDisplay().id)].map(
      (x) => x.workArea,
    );
    const b = fitToDisplays({ x: d.x, y: d.y, width: d.genislik, height: d.yukseklik }, ekranlar);

    pencere = new BrowserWindow({
      ...b,
      useContentSize: true,
      minWidth: EN_KUCUK.genislik,
      minHeight: EN_KUCUK.yukseklik,
      show: false,
      title: 'Yürüyen Penguen',
      backgroundColor: '#9DB6CC',
      ...(MAC ? macosPencereSecenekleri : {}),
      webPreferences: {
        preload: join(import.meta.dirname, '../preload/index.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        webviewTag: false,
        devTools: GELISTIRME,
        spellcheck: false,
      },
    });

    const wc = pencere.webContents;
    // Gezinme kilidi: uygulama dışı adres yok, yeni pencere yok.
    const izinli = (url: string): boolean => {
      try {
        return new URL(url).href.split('#')[0] === sayfaAdresi().split('#')[0];
      } catch {
        return false;
      }
    };
    wc.on('will-navigate', (e, url) => {
      if (!izinli(url)) e.preventDefault();
    });
    wc.on('will-redirect', (e, url) => {
      if (!izinli(url)) e.preventDefault();
    });
    wc.on('will-frame-navigate', (e) => {
      if (!izinli(e.url)) e.preventDefault();
    });
    wc.setWindowOpenHandler(() => ({ action: 'deny' }));

    pencere.once('ready-to-show', () => {
      if (!pencere) return;
      if (d.buyutulmus) pencere.maximize();
      pencere.show();
      if (d.tamEkran) pencere.setFullScreen(true);
    });
    for (const olay of ['resize', 'move', 'maximize', 'unmaximize'] as const) pencere.on(olay as 'resize', durumuKaydet);
    pencere.on('enter-full-screen', () => {
      durumuKaydet();
      wc.send(KANAL.tamEkran, true);
    });
    pencere.on('leave-full-screen', () => {
      durumuKaydet();
      wc.send(KANAL.tamEkran, false);
    });
    pencere.on('close', durumuKaydet);
    pencere.on('closed', () => {
      pencere = null;
    });

    void pencere.loadURL(sayfaAdresi());
  }

  app.on('second-instance', () => {
    if (!pencere) return;
    if (pencere.isMinimized()) pencere.restore();
    pencere.focus();
  });

  app.whenReady().then(() => {
    veri = new VeriDeposu({ klasor: join(app.getPath('userData'), 'veri') });
    durum = pencereDosyasi(app.getPath('userData'));

    // Uygulama hiçbir izin istemez (kamera, bildirim vb.).
    session.defaultSession.setPermissionRequestHandler((_wc, _izin, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.setDevicePermissionHandler(() => false);

    isle(
      KANAL.yukle,
      (): Yukleme => ({
        aktifPlan: veri.aktifPlan.read().plan,
        ayarlar: veri.ayarlar.read(),
        planlar: veri.planlar.list(),
        panelAcik: durum.get().panelAcik,
        tamEkran: !!pencere?.isFullScreen(),
      }),
      null as unknown as Yukleme,
    );
    isle(KANAL.aktifPlanYaz, (m: unknown) => veri.aktifPlanYaz(m), false);
    isle(KANAL.ayarlarYaz, (a: unknown) => veri.ayarlarYaz(a), false);
    isle(KANAL.planKaydet, (ad: unknown, m: unknown) => veri.planKaydet(ad, m), []);
    isle(KANAL.planSil, (id: unknown) => veri.planSil(id), []);
    isle(KANAL.tasi, (e: unknown) => veri.tasi(e), false);
    isle(
      KANAL.panelDurumu,
      (acikHam: unknown) => {
        const acik = V.mantiksal(acikHam);
        if (acik === null || !pencere) return;
        durum.set({ ...durum.get(), panelAcik: acik });
        if (acik && !pencere.isFullScreen() && !pencere.isMaximized()) {
          const b = pencere.getContentBounds();
          const alan = screen.getDisplayMatching(pencere.getBounds()).workArea;
          const yeni = panelIcinGenislet(b, alan);
          if (yeni.width !== b.width || yeni.x !== b.x) pencere.setContentBounds(yeni);
        }
      },
      undefined,
    );

    if (MAC) Menu.setApplicationMenu(macosMenusu(GELISTIRME));
    pencereAc();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) pencereAc();
    });
  });

  app.on('before-quit', () => {
    durumuKaydet();
    veri?.flush();
    durum?.flush();
  });

  app.on('window-all-closed', () => {
    // macOS'ta son pencere kapanınca uygulama çıkmaz.
    if (!MAC) app.quit();
  });
}
