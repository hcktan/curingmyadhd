import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAN, parsePlan } from '../../src/plan/model';
import * as T from '../../src/plan/timer';

const MIN = 60000;
const T0 = 1_700_000_000_000;
const plan = (p = DEFAULT_PLAN) => parsePlan(p).blocks;
const AUTO_STOP: T.Settings = { auto: true, loop: false };

function started(p = DEFAULT_PLAN) {
  const s = T.createTimer(plan(p));
  T.toggle(s, T0);
  return s;
}

describe('editStart', () => {
  it('başlamamış plan → idx', () => {
    const s = T.createTimer(plan());
    expect(T.editStart(s)).toBe(0);
    T.goTo(s, 2, T0);
    expect(T.editStart(s)).toBe(2);
  });
  it('çalışan plan → idx + 1', () => {
    expect(T.editStart(started())).toBe(1);
  });
  it('yarıda duraklatılmış plan → idx + 1', () => {
    const s = started();
    T.toggle(s, T0 + MIN);
    expect(s.running).toBe(false);
    expect(T.editStart(s)).toBe(1);
  });
  it('bitmiş plan → plan.length', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 131 * MIN);
    expect(T.isDone(s)).toBe(true);
    expect(T.editStart(s)).toBe(8);
  });
});

describe('journeyP', () => {
  it('başta 0', () => {
    expect(T.journeyP(T.createTimer(plan()))).toBe(0);
  });
  it('ilk odak ortasında 0,125', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 12.5 * MIN);
    expect(T.journeyP(s)).toBeCloseTo(0.125, 10);
  });
  it('molada ilerlemez', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 26 * MIN);
    const a = T.journeyP(s);
    T.tick(s, AUTO_STOP, T0 + 29 * MIN);
    expect(s.plan[s.idx].k).toBe('K');
    expect(T.journeyP(s)).toBe(a);
    expect(a).toBeCloseTo(0.25, 10);
  });
  it('bitince 1', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 200 * MIN);
    expect(T.journeyP(s)).toBe(1);
  });
  it('odak bloğu yoksa 0', () => {
    const s = started('K5 U15');
    T.tick(s, AUTO_STOP, T0 + 3 * MIN);
    expect(T.journeyP(s)).toBe(0);
  });
});

describe('tick', () => {
  it('çalışmıyorsa null', () => {
    expect(T.tick(T.createTimer(plan()), AUTO_STOP, T0)).toBeNull();
  });
  it('otomatik geçişte sonraki blok kesintisiz başlar', () => {
    const s = started();
    const r = T.tick(s, AUTO_STOP, T0 + 27 * MIN);
    expect(r).toEqual({ beeped: true, wrapped: false });
    expect(s.idx).toBe(1);
    expect(s.running).toBe(true);
    expect(s.remaining).toBe(3 * MIN);
    expect(s.endAt).toBe(T0 + 30 * MIN);
  });
  it('elle geçişte sonraki blokta durur', () => {
    const s = started();
    T.tick(s, { auto: false, loop: false }, T0 + 27 * MIN);
    expect(s.idx).toBe(1);
    expect(s.running).toBe(false);
    expect(s.remaining).toBe(5 * MIN);
  });
  it('"Baştan" ayarında ilk bloğa döner', () => {
    const s = started('O25 K5');
    const r = T.tick(s, { auto: true, loop: true }, T0 + 31 * MIN);
    expect(r).toEqual({ beeped: true, wrapped: true });
    expect(s.idx).toBe(0);
    expect(s.running).toBe(true);
    expect(s.remaining).toBe(24 * MIN);
  });
  it('"Dur" ayarında plan biter', () => {
    const s = started('O25 K5');
    T.tick(s, AUTO_STOP, T0 + 31 * MIN);
    expect(T.isDone(s)).toBe(true);
    expect(s.running).toBe(false);
    expect([s.total, s.remaining]).toEqual([0, 0]);
  });
  it('uzun sıçramada birden çok blok geçilir', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 120 * MIN);
    expect(s.idx).toBe(7);
    expect(s.plan[7].k).toBe('U');
    expect(s.remaining).toBe(10 * MIN);
  });
  it('en çok 100 adım geçer', () => {
    const s = started('O1 K1');
    T.tick(s, { auto: true, loop: true }, T0 + 1000 * MIN);
    // 100 adım: 50 tur sonra yeniden ilk blokta, saat geride kalır.
    expect(s.idx).toBe(0);
    expect(s.endAt).toBe(T0 + 101 * MIN);
    expect(s.remaining).toBe(0);
  });
});

describe('prev ve goTo', () => {
  it('3 saniyeden fazla ilerlediyse aynı bloğun başına', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 30 * MIN + 4000);
    expect(s.idx).toBe(2);
    expect(T.prevTarget(s)).toBe(2);
    T.goTo(s, T.prevTarget(s), T0 + 30 * MIN + 4000);
    expect(s.remaining).toBe(25 * MIN);
    expect(s.endAt).toBe(T0 + 55 * MIN + 4000);
  });
  it('3 saniye içindeyse önceki bloğa', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 30 * MIN + 2000);
    expect(T.prevTarget(s)).toBe(1);
  });
  it('bitmiş planda son bloğa döner', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 131 * MIN);
    expect(T.prevTarget(s)).toBe(7);
    T.goTo(s, 7, T0 + 131 * MIN);
    expect(s.running).toBe(false);
    expect(s.remaining).toBe(15 * MIN);
  });
  it('goTo sınırları kırpar ve plan sonunda durur', () => {
    const s = started();
    T.goTo(s, -3, T0);
    expect(s.idx).toBe(0);
    T.goTo(s, 99, T0);
    expect(T.isDone(s)).toBe(true);
    expect(s.running).toBe(false);
  });
});

describe('toggle ve restart', () => {
  it('duraklat ve devam et kalan süreyi korur', () => {
    const s = started();
    T.toggle(s, T0 + 10 * MIN);
    expect(s.remaining).toBe(15 * MIN);
    T.toggle(s, T0 + 50 * MIN);
    expect(s.endAt).toBe(T0 + 65 * MIN);
  });
  it('bitmiş planda baştan başlatır', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 131 * MIN);
    expect(T.toggle(s, T0 + 200 * MIN)).toBe('restart');
    expect(s.idx).toBe(0);
    expect(s.running).toBe(true);
    expect(s.endAt).toBe(T0 + 225 * MIN);
  });
});

describe('applyPlan (commitPlan kuralı)', () => {
  it('çalışan bloğun süresi değişmez', () => {
    const s = started();
    T.applyPlan(s, parsePlan('O50 K5').blocks);
    expect(s.total).toBe(25 * MIN);
  });
  it('yarıda duraklatılmış bloğun süresi değişmez', () => {
    const s = started();
    T.toggle(s, T0 + MIN);
    T.applyPlan(s, parsePlan('O50 K5').blocks);
    expect(s.total).toBe(25 * MIN);
    expect(s.remaining).toBe(24 * MIN);
  });
  it('başlamamış blok yeni süreyi alır', () => {
    const s = T.createTimer(plan());
    T.applyPlan(s, parsePlan('O50 K5').blocks);
    expect(s.total).toBe(50 * MIN);
    expect(s.remaining).toBe(50 * MIN);
  });
  it('plan kısalınca bitmiş sayılır', () => {
    const s = started();
    T.tick(s, AUTO_STOP, T0 + 61 * MIN);
    T.applyPlan(s, parsePlan('O25 K5').blocks);
    expect(T.isDone(s)).toBe(true);
    expect(s.running).toBe(false);
  });
});
