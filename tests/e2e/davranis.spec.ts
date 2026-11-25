/* Tıklama testleri: aynı dosya hem kaynakta hem taşınan sürümde çalışır. */
import { MIN, blur, curSeg, expect, test } from './helpers';

const chips = '#chips button';
const segs = '#strip .seg';

test.describe('akış', () => {
  test('ekran durumları beklenen metni gösterir', async ({ open }) => {
    const page = await open();
    await expect(page.locator('#time')).toHaveText('25:00');
    await expect(page.locator('#toggle')).toHaveText('Başlat');
    await page.click('#toggle');
    await page.clock.fastForward(12.5 * MIN);
    await expect(page.locator('#time')).toHaveText('12:30');
    await expect(page.locator('#toggle')).toHaveText('Duraklat');
    await expect(page.locator('#scene')).toHaveAttribute('class', 'walking');
    await expect(page).toHaveTitle('12:30 · Yürüyen Penguen');
    await page.clock.fastForward(14.5 * MIN);
    await expect(page.locator('#time')).toHaveText('03:00');
    await expect(page.locator('#scene')).toHaveAttribute('class', 'resting');
    expect(await curSeg(page)).toBe('1');
    await page.clock.fastForward(93 * MIN);
    await expect(page.locator('#time')).toHaveText('10:00');
    expect(await curSeg(page)).toBe('7');
    await page.clock.fastForward(11 * MIN);
    await expect(page.locator('#time')).toHaveText('00:00');
    await expect(page.locator('#toggle')).toHaveText('Yeniden');
    await expect(page.locator('#next')).toBeDisabled();
    await expect(page.locator(`${segs}.cur`)).toHaveCount(0);
  });

  test('başlat, duraklat, devam et; boşluk tuşu', async ({ open }) => {
    const page = await open();
    await page.click('#toggle');
    await page.clock.fastForward(MIN);
    await page.click('#toggle');
    await expect(page.locator('#toggle')).toHaveText('Devam et');
    await expect(page.locator('#time')).toHaveText('24:00');
    await page.clock.fastForward(10 * MIN);
    await expect(page.locator('#time')).toHaveText('24:00');
    await blur(page);
    await page.keyboard.press('Space');
    await expect(page.locator('#toggle')).toHaveText('Duraklat');
    await page.keyboard.press('Space');
    await expect(page.locator('#toggle')).toHaveText('Devam et');
  });

  test('metin alanı odaktayken boşluk tuşu zamanlayıcıyı çalıştırmaz', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    await page.focus('#plan-text');
    await page.keyboard.press('Space');
    await expect(page.locator('#toggle')).toHaveText('Başlat');
  });

  test('ileri, geri (3 saniye kuralı) ve baştan', async ({ open }) => {
    const page = await open();
    await page.click('#toggle');
    await page.click('#next');
    expect(await curSeg(page)).toBe('1');
    await page.clock.fastForward(2000);
    await page.click('#prev');
    expect(await curSeg(page)).toBe('0');
    await page.clock.fastForward(4000);
    await page.click('#prev');
    expect(await curSeg(page)).toBe('0');
    await page.clock.fastForward(250);
    await expect(page.locator('#time')).toHaveText('25:00');
    await page.click('#next');
    await page.click('#next');
    await page.click('#reset');
    expect(await curSeg(page)).toBe('0');
    await expect(page.locator('#toggle')).toHaveText('Başlat');
  });

  test('şerit parçasına tıklayınca o bloğa atlar', async ({ open }) => {
    const page = await open();
    await page.click(`${segs}[data-i="4"]`);
    expect(await curSeg(page)).toBe('4');
    await expect(page.locator('#time')).toHaveText('25:00');
    await page.click(`${segs}[data-i="7"]`);
    await expect(page.locator('#time')).toHaveText('15:00');
  });

  test('"Baştan" ayarı ilk bloğa döner, "Dur" ayarında plan biter', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    await page.click('#set-loop button[data-v="1"]');
    await page.click('#gear');
    await page.click('#toggle');
    await page.clock.fastForward(131 * MIN);
    expect(await curSeg(page)).toBe('0');
    await expect(page.locator('#time')).toHaveText('24:00');
    await expect(page.locator('#toggle')).toHaveText('Duraklat');
  });

  test('elle geçişte sonraki blokta durur', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    await page.click('#set-auto button[data-v="0"]');
    await page.click('#gear');
    await page.click('#toggle');
    await page.clock.fastForward(25 * MIN);
    expect(await curSeg(page)).toBe('1');
    await expect(page.locator('#toggle')).toHaveText('Başlat');
    await expect(page.locator('#time')).toHaveText('05:00');
  });
});

test.describe('plan editörü', () => {
  test('plan metni şeridi değiştirir; plan başlayınca yalnızca sıradakiler değişir', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    await page.fill('#plan-text', 'O10 K2 O10');
    await expect(page.locator(segs)).toHaveCount(3);
    await expect(page.locator('#time')).toHaveText('10:00');
    await page.fill('#plan-text', 'O25 X9');
    await expect(page.locator('#plan-err')).toHaveText('Anlaşılmadı: X9');
    await page.fill('#plan-text', '');
    await expect(page.locator('#plan-err')).toHaveText('En az bir blok gerekli.');
    await expect(page.locator(segs)).toHaveCount(1);

    await page.fill('#plan-text', 'O25 K5 O25 K5');
    await page.click('#toggle');
    await expect(page.locator('#plan-hint')).toHaveText('Plan başladı. Yalnızca sıradaki bloklar değişir.');
    await expect(page.locator('#plan-text')).toHaveValue('K5 O25 K5');
    await page.fill('#plan-text', 'O10');
    await expect(page.locator(segs)).toHaveCount(2);
    await expect(page.locator(chips)).toHaveText(['O25', 'O10']);
    await expect(page.locator(`${chips}.locked`)).toHaveCount(1);
  });

  test('taş düzenleme: süre, tür, taşıma, silme', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    await page.click(`${chips}:nth-child(3)`);
    await expect(page.locator('#tb')).toBeVisible();
    await page.click('#tb [data-a="inc5"]');
    await page.click('#tb [data-a="inc1"]');
    await page.click('#tb [data-a="dec1"]');
    await expect(page.locator(`${chips}:nth-child(3)`)).toHaveText('O30');
    await page.click('#tb [data-a="dec5"]');
    await page.fill('#tb-min', '40');
    await page.dispatchEvent('#tb-min', 'change');
    await expect(page.locator(`${chips}:nth-child(3)`)).toHaveText('O40');
    await page.click('#tb [data-a="t-K"]');
    await expect(page.locator(`${chips}:nth-child(3)`)).toHaveText('K40');
    await page.click('#tb [data-a="left"]');
    await expect(page.locator(`${chips}:nth-child(2)`)).toHaveText('K40');
    await expect(page.locator(`${chips}.sel`)).toHaveAttribute('data-i', '1');
    await page.click('#tb [data-a="right"]');
    await expect(page.locator(`${chips}:nth-child(3)`)).toHaveText('K40');
    await page.click('#tb [data-a="del"]');
    await expect(page.locator(chips)).toHaveCount(7);
    await expect(page.locator('#tb')).toBeHidden();

    await page.fill('#plan-text', 'O5');
    await page.click(`${chips}:nth-child(1)`);
    await page.click('#tb [data-a="del"]');
    await expect(page.locator(chips)).toHaveCount(1);
  });

  test('ekleme düğmeleri ve 60 blok sınırı', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    await page.click('#adds [data-add="O"]');
    await page.click('#adds [data-add="K"]');
    await page.click('#adds [data-add="U"]');
    await expect(page.locator(chips)).toHaveCount(11);
    await expect(page.locator(`${chips}:nth-child(9)`)).toHaveText('O25');
    await expect(page.locator(`${chips}:nth-child(10)`)).toHaveText('K5');
    await expect(page.locator(`${chips}:nth-child(11)`)).toHaveText('U15');
    await page.fill('#plan-text', 'O1 '.repeat(60));
    await page.click('#adds [data-add="O"]');
    await expect(page.locator(chips)).toHaveCount(60);
  });
});

test.describe('kayıtlı planlar ve kalıcılık', () => {
  test('ilk açılışta iki hazır plan', async ({ open }) => {
    const page = await open();
    await expect(page.locator('#saved li b')).toHaveText(["Klasik 4'lü", 'Derin odak']);
  });

  test('kaydet, üzerine yaz, adsız kaydet, yükle, sil', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    await page.fill('#save-name', 'Deneme');
    await page.click('#save-btn');
    await expect(page.locator('#saved li')).toHaveCount(3);
    await page.fill('#plan-text', 'O10 K1');
    await page.fill('#save-name', 'Deneme');
    await page.press('#save-name', 'Enter');
    await expect(page.locator('#saved li')).toHaveCount(3);
    await expect(page.locator('#saved li:nth-child(3) span')).toHaveText('O10 K1');
    await page.click('#save-btn');
    await expect(page.locator('#saved li:nth-child(4) b')).toHaveText('Plan 4');

    await page.click('#saved li:nth-child(2) [data-a="load"]');
    await expect(page.locator(segs)).toHaveCount(6);
    await expect(page.locator('#time')).toHaveText('50:00');
    await page.click('#saved li:nth-child(1) [data-a="del"]');
    await expect(page.locator('#saved li b')).toHaveText(['Derin odak', 'Deneme', 'Plan 4']);
  });

  test('en çok 20 kayıtlı plan', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    for (let i = 0; i < 22; i++) await page.click('#save-btn');
    await expect(page.locator('#saved li')).toHaveCount(20);
  });

  test('yeniden yüklenince plan, ayarlar ve kayıtlar geri gelir', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    await page.fill('#plan-text', 'O15 K3 U9');
    await page.click('#set-auto button[data-v="0"]');
    await page.click('#set-loop button[data-v="1"]');
    await page.fill('#save-name', 'Kalıcı');
    await page.click('#save-btn');
    const stored = await page.evaluate(() => [
      localStorage.getItem('yp-plan'),
      localStorage.getItem('yp-set'),
      JSON.parse(localStorage.getItem('yp-saved') || '[]').length,
    ]);
    expect(stored).toEqual(['"O15 K3 U9"', '{"auto":false,"loop":true}', 3]);
    await page.reload();
    await expect(page.locator(segs)).toHaveCount(3);
    await expect(page.locator('#time')).toHaveText('15:00');
    await page.click('#gear');
    await expect(page.locator('#set-auto button[data-v="0"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#set-loop button[data-v="1"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#saved li:nth-child(3) b')).toHaveText('Kalıcı');
  });

  test('plan adları HTML olarak yorumlanmaz', async ({ open }) => {
    const page = await open();
    await page.click('#gear');
    await page.fill('#save-name', '<b>x</b>"&');
    await page.click('#save-btn');
    await expect(page.locator('#saved li:nth-child(3) .sv-main b')).toHaveText('<b>x</b>"&');
  });
});

test('dış adrese istek gitmez, Jost yerelden yüklenir', async ({ open, external, target }) => {
  test.skip(target === 'kaynak', 'Kaynak Jost için Google Fonts ister; testte bu istek yerel dosyaya yönlendirilir.');
  const page = await open();
  await page.click('#gear');
  expect(await page.evaluate(() => document.fonts.check('300 16px Jost'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('500 16px Jost', 'ş'))).toBe(true);
  expect(external).toEqual([]);
});
