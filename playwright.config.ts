import { defineConfig, devices } from '@playwright/test';

/* İki proje:
   - electron (npm run shot): derlenmiş Electron uygulaması, tek işçi. Sahne kaynakla
     (tests/shots/kaynak/) ve Electron temel görüntüleriyle (tests/shots/electron/) karşılaştırılır.
   - kaynak (npm run shot:kaynak): kaynak/v0.1-tarayici.html tarayıcıda; dondurulmuş referans
     görüntüleri yeniden üretir. Elle çalıştırılır. */
export default defineConfig({
  outputDir: './test-results',
  reporter: [['list']],
  updateSnapshots: 'none',
  snapshotPathTemplate: '{testDir}/../../shots/{arg}{ext}',
  // threshold 0: her piksel farkı sayılır (varsayılan 0.2, cam bulanıklığının kaybolmasını bile yakalamıyordu).
  expect: { toHaveScreenshot: { threshold: 0, maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  projects: [
    {
      name: 'electron',
      testDir: './tests/e2e/electron',
      workers: 1,
      fullyParallel: false,
      timeout: 60_000,
    },
    {
      name: 'kaynak',
      testDir: './tests/e2e/kaynak',
      fullyParallel: true,
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
    },
  ],
});
