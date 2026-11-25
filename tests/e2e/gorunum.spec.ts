/* Ekran durumları: her durum iki tema ve iki boyutta çekilir. Kaynakta görüntü kaydedilir,
   taşınan sürümde aynı görüntü kaydedilir ve kaynakla karşılaştırılır. */
import { mkdirSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { MIN, SHOTS, expect, test } from './helpers';

type Step = (page: Page) => Promise<void>;

const start: Step = async (p) => {
  await p.click('#toggle');
};
const ff = (ms: number): Step => async (p) => {
  await p.clock.fastForward(ms);
};
const gear: Step = async (p) => {
  await p.click('#gear');
};

const STATES: Record<string, Step[]> = {
  bos: [],
  'odak-orta': [start, ff(12.5 * MIN)],
  duraklat: [start, ff(12.5 * MIN), start],
  'kisa-mola': [start, ff(27 * MIN)],
  'uzun-mola': [start, ff(120 * MIN)],
  bitti: [start, ff(131 * MIN)],
  'elle-durdu': [gear, async (p) => p.click('#set-auto button[data-v="0"]'), gear, start, ff(25 * MIN)],
  panel: [gear],
  'panel-basladi': [start, ff(12.5 * MIN), gear],
  'panel-secili': [gear, async (p) => p.click('#chips button:nth-child(3)')],
  'panel-hata': [gear, async (p) => p.fill('#plan-text', 'O25 X9')],
};

const SIZES = {
  dar: { width: 430, height: 860 },
  genis: { width: 1280, height: 800 },
};

async function shoot(page: Page, target: string, name: string): Promise<void> {
  mkdirSync(`${SHOTS}/${target}`, { recursive: true });
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `${SHOTS}/${target}/${name}.png`, animations: 'disabled' });
  if (target === 'tasinan') await expect(page).toHaveScreenshot(`${name}.png`);
}

for (const [state, steps] of Object.entries(STATES)) {
  for (const theme of ['light', 'dark'] as const) {
    for (const [sizeName, size] of Object.entries(SIZES)) {
      const name = `${state}-${theme === 'light' ? 'acik' : 'koyu'}-${sizeName}`;
      test(`görüntü ${name}`, async ({ open, target }) => {
        const page = await open({ colorScheme: theme, size });
        for (const s of steps) await s(page);
        await shoot(page, target, name);
      });
    }
  }
}

test('görüntü azaltilmis-acik-dar', async ({ open, target }) => {
  const page = await open({ reducedMotion: 'reduce' });
  await shoot(page, target, 'azaltilmis-acik-dar');
});
