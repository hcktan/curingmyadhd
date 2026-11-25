/* Zaman mantığı: saf fonksiyonlar. Saat (`now`) dışarıdan verilir; DOM'a dokunulmaz. */

import { MAXBLOCKS, type Block } from './model';

export interface TimerState {
  plan: Block[];
  idx: number;
  total: number;
  remaining: number;
  running: boolean;
  endAt: number;
}

export interface Settings {
  auto: boolean;
  loop: boolean;
}

export function createTimer(plan: Block[]): TimerState {
  const s: TimerState = { plan, idx: 0, total: 0, remaining: 0, running: false, endAt: 0 };
  setBlock(s, 0);
  return s;
}

export function curMs(s: TimerState): number {
  return s.idx < s.plan.length ? s.plan[s.idx].m * 60000 : 0;
}

export function setBlock(s: TimerState, i: number): void {
  s.idx = i;
  s.total = curMs(s);
  s.remaining = s.total;
}

export function isDone(s: TimerState): boolean {
  return s.idx >= s.plan.length;
}

export function walking(s: TimerState): boolean {
  return s.running && !isDone(s) && s.plan[s.idx].k === 'O';
}

/** Düzenlenebilen ilk bloğun sırası. */
export function editStart(s: TimerState): number {
  if (isDone(s)) return s.plan.length;
  return s.running || s.remaining < s.total ? s.idx + 1 : s.idx;
}

export function focusTotal(plan: Block[]): number {
  let t = 0;
  plan.forEach((b) => {
    if (b.k === 'O') t += b.m * 60000;
  });
  return t;
}

/** Yolculuk ilerlemesi (0..1): yalnızca odak süresi sayılır. */
export function journeyP(s: TimerState): number {
  const tot = focusTotal(s.plan);
  if (!tot) return 0;
  let d = 0;
  for (let i = 0; i < s.idx && i < s.plan.length; i++) if (s.plan[i].k === 'O') d += s.plan[i].m * 60000;
  if (!isDone(s) && s.plan[s.idx].k === 'O') d += s.total - s.remaining;
  return Math.max(0, Math.min(1, d / tot));
}

export function fmtParts(ms: number): { text: string; m: number; s: number } {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(t / 60);
  const sec = t % 60;
  return { text: (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec, m, s: sec };
}

export function goTo(s: TimerState, i: number, now: number): void {
  i = Math.max(0, Math.min(s.plan.length, i));
  const was = s.running;
  setBlock(s, i);
  if (isDone(s)) s.running = false;
  else if (was) s.endAt = now + s.total;
}

export function restart(s: TimerState, startRunning: boolean, now: number): void {
  s.running = false;
  setBlock(s, 0);
  if (startRunning) {
    s.endAt = now + s.total;
    s.running = true;
  }
}

/** Başlat/Duraklat/Devam et. Plan bitmişse baştan başlatır ve 'restart' döner. */
export function toggle(s: TimerState, now: number): 'restart' | 'toggle' {
  if (isDone(s)) {
    restart(s, true, now);
    return 'restart';
  }
  if (s.running) {
    s.remaining = Math.max(0, s.endAt - now);
    s.running = false;
  } else {
    if (s.remaining <= 0) s.remaining = s.total;
    s.endAt = now + s.remaining;
    s.running = true;
  }
  return 'toggle';
}

/** Geri düğmesinin gideceği blok: 3 saniye kuralı. */
export function prevTarget(s: TimerState): number {
  if (isDone(s)) return s.plan.length - 1;
  if (s.total - s.remaining > 3000) return s.idx;
  return s.idx - 1;
}

/** Saat ilerlemesi. Çalışmıyorsa null döner (hiçbir şey çizilmez). */
export function tick(s: TimerState, settings: Settings, now: number): { beeped: boolean; wrapped: boolean } | null {
  if (!s.running) return null;
  let n = 0;
  let beeped = false;
  let wrapped = false;
  while (s.running && now >= s.endAt && n++ < 100) {
    beeped = true;
    s.idx++;
    if (s.idx >= s.plan.length) {
      if (settings.loop) {
        setBlock(s, 0);
        wrapped = true;
      } else {
        s.idx = s.plan.length;
        s.total = 0;
        s.remaining = 0;
        s.running = false;
        break;
      }
    } else setBlock(s, s.idx);
    if (settings.auto) s.endAt += s.total;
    else s.running = false;
  }
  if (s.running) s.remaining = Math.max(0, s.endAt - now);
  return { beeped, wrapped };
}

/** Plan değişikliği kuralı: çalışan ya da yarıda kalan bloğun süresi değişmez. */
export function applyPlan(s: TimerState, np: Block[]): void {
  s.plan = np.slice(0, MAXBLOCKS);
  if (s.idx >= s.plan.length) {
    s.idx = s.plan.length;
    s.total = 0;
    s.remaining = 0;
    s.running = false;
  } else if (!s.running && s.remaining === s.total) {
    s.total = s.plan[s.idx].m * 60000;
    s.remaining = s.total;
  }
}

/** Kayıtlı planı yükler: durur ve ilk bloğa döner. */
export function loadPlan(s: TimerState, blocks: Block[]): void {
  s.running = false;
  s.plan = blocks;
  setBlock(s, 0);
}
