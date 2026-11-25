import { defineConfig, devices } from '@playwright/test';
import type { Target } from './tests/e2e/helpers';

/* İki hedef: "kaynak" (kaynak/v0.1-tarayici.html, file:// ile, değiştirilmeden) ve "tasinan" (Vite derlemesi).
   Önce kaynak çalışır ve görüntüleri tests/shots/kaynak/ altına yazar; taşınan sürüm bu görüntülerle karşılaştırılır. */
export default defineConfig<{ target: Target }>({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: true,
  reporter: [['list']],
  updateSnapshots: 'none',
  snapshotPathTemplate: '{testDir}/../shots/kaynak/{arg}{ext}',
  // threshold 0: her piksel farkı sayılır (varsayılan 0.2, cam bulanıklığının kaybolmasını bile yakalamıyordu).
  expect: { toHaveScreenshot: { threshold: 0, maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'kaynak', use: { target: 'kaynak' } },
    { name: 'tasinan', use: { target: 'tasinan' }, dependencies: ['kaynak'] },
  ],
});
