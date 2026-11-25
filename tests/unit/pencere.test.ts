import { describe, expect, it } from 'vitest';
import { fitToDisplays, panelIcinGenislet } from '../../src/main/windowState';

const ANA = { x: 0, y: 25, width: 1440, height: 875 };
const DIS = { x: 1440, y: 0, width: 1920, height: 1080 };

describe('fitToDisplays', () => {
  it('konum yoksa ana ekranda ortalar', () => {
    expect(fitToDisplays({ width: 1280, height: 800 }, [ANA])).toEqual({ x: 80, y: 63, width: 1280, height: 800 });
  });
  it('ekranda görünen pencere olduğu gibi kalır', () => {
    const b = { x: 100, y: 100, width: 800, height: 700 };
    expect(fitToDisplays(b, [ANA])).toEqual(b);
  });
  it('dış ekrandaki pencere, dış ekran bağlıyken kalır', () => {
    const b = { x: 1600, y: 100, width: 800, height: 700 };
    expect(fitToDisplays(b, [ANA, DIS])).toEqual(b);
  });
  it('dış ekran çıkarıldıysa ana ekranda ortalanır', () => {
    expect(fitToDisplays({ x: 1600, y: 100, width: 800, height: 700 }, [ANA])).toEqual({ x: 320, y: 113, width: 800, height: 700 });
  });
  it('kenardan yalnızca birkaç piksel taşan pencere görünmez sayılır', () => {
    const r = fitToDisplays({ x: 1400, y: 100, width: 800, height: 700 }, [ANA]);
    expect(r.x).toBe(320);
  });
  it('ekrandan büyük pencere ekrana sığdırılır, en küçük boyutun altına inmez', () => {
    expect(fitToDisplays({ width: 3000, height: 2000 }, [ANA])).toEqual({ x: 0, y: 25, width: 1440, height: 875 });
    expect(fitToDisplays({ width: 100, height: 100 }, [ANA])).toMatchObject({ width: 430, height: 640 });
  });
  it('elle bozulmuş dev boyut ekrana göre sınırlanır', () => {
    expect(fitToDisplays({ x: 10, y: 30, width: 1e9, height: 1e9 }, [ANA])).toEqual({ x: 10, y: 30, width: 1440, height: 875 });
  });
});

describe('panelIcinGenislet', () => {
  it('yeterince geniş pencere değişmez', () => {
    const b = { x: 10, y: 10, width: 1280, height: 800 };
    expect(panelIcinGenislet(b, ANA)).toBe(b);
  });
  it('dar pencere sağa doğru 790 px olur', () => {
    expect(panelIcinGenislet({ x: 100, y: 50, width: 430, height: 860 }, ANA)).toEqual({ x: 100, y: 50, width: 790, height: 860 });
  });
  it('sağda yer yoksa sola kayar', () => {
    expect(panelIcinGenislet({ x: 1000, y: 50, width: 430, height: 860 }, ANA)).toMatchObject({ x: 650, width: 790 });
  });
});
