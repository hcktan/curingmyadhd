/* macOS'a özel pencere seçenekleri. Sahne pencerenin üstüne kadar uzar; trafik ışıkları gökyüzünün üstünde durur. */

import type { BrowserWindowConstructorOptions } from 'electron';

/** Trafik ışıklarının kapladığı yükseklik: arayüz süreyi bu kadar aşağı alır (tam ekranda 0). */
export const BASLIK_PAYI = 28;

export const macosPencereSecenekleri: BrowserWindowConstructorOptions = {
  titleBarStyle: 'hiddenInset',
  trafficLightPosition: { x: 14, y: 14 },
};
