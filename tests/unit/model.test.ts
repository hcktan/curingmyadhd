import { describe, expect, it } from 'vitest';
import { fmtMin, parsePlan, serialize } from '../../src/shared/plan';
import { fmtParts } from '../../src/renderer/plan/timer';

describe('parsePlan', () => {
  it('O25 KM5 UM15 üç blok verir', () => {
    expect(parsePlan('O25 KM5 UM15')).toEqual({
      blocks: [
        { k: 'O', m: 25 },
        { k: 'K', m: 5 },
        { k: 'U', m: 15 },
      ],
      bad: '',
    });
  });

  it('küçük harf ve Türkçe İ okunur', () => {
    expect(parsePlan('o25 k5').blocks).toEqual([
      { k: 'O', m: 25 },
      { k: 'K', m: 5 },
    ]);
    // "İ" büyük harfe çevrilince I olur; plan harfi değildir, bad alanına düşer.
    expect(parsePlan('İ O25').bad).toBe('I');
    expect(parsePlan('um15').blocks).toEqual([{ k: 'U', m: 15 }]);
  });

  it('ayraçlar ve boşluksuz yazım okunur', () => {
    const r = parsePlan('O25, K5; O25 | K5 > U15 - O10 · K3');
    expect(r.bad).toBe('');
    expect(serialize(r.blocks)).toBe('O25 K5 O25 K5 U15 O10 K3');
    expect(serialize(parsePlan('O25K5U15').blocks)).toBe('O25 K5 U15');
  });

  it('süre sınırları uygulanır', () => {
    expect(parsePlan('O0').blocks).toEqual([{ k: 'O', m: 1 }]);
    expect(parsePlan('O999').blocks).toEqual([{ k: 'O', m: 180 }]);
  });

  it('en fazla 60 blok alınır', () => {
    expect(parsePlan('O1 '.repeat(75)).blocks).toHaveLength(60);
  });

  it('tanınmayan kısım bad alanında döner', () => {
    expect(parsePlan('O25 X9')).toEqual({ blocks: [{ k: 'O', m: 25 }], bad: 'X9' });
  });

  it('serialize ile gidiş-dönüş tutarlı', () => {
    for (const p of ['O25 K5 O25 K5 O25 K5 O25 U15', 'O50 K10 O50 K10 O50 U20', 'U1 O180']) {
      expect(serialize(parsePlan(p).blocks)).toBe(p);
      expect(serialize(parsePlan(serialize(parsePlan(p).blocks)).blocks)).toBe(p);
    }
  });
});

describe('biçimler', () => {
  it('fmtMin', () => {
    expect(fmtMin(45)).toBe('45 dk');
    expect(fmtMin(60)).toBe('1 sa');
    expect(fmtMin(75)).toBe('1 sa 15 dk');
  });

  it('fmtParts yukarı yuvarlar', () => {
    expect(fmtParts(1).text).toBe('00:01');
    expect(fmtParts(0).text).toBe('00:00');
    expect(fmtParts(-5).text).toBe('00:00');
    expect(fmtParts(25 * 60000)).toEqual({ text: '25:00', m: 25, s: 0 });
    expect(fmtParts(750000).text).toBe('12:30');
  });
});
