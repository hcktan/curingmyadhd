/* Plan modeli: blok türleri, sınırlar, plan yazımının ayrıştırılması. */

export type Kind = 'O' | 'K' | 'U';
export interface Block {
  k: Kind;
  m: number;
}

export const KIND: Record<Kind, { name: string; def: number }> = {
  O: { name: 'Odak', def: 25 },
  K: { name: 'Kısa mola', def: 5 },
  U: { name: 'Uzun mola', def: 15 },
};
export const MAXMIN = 180;
export const MAXBLOCKS = 60;
export const DEFAULT_PLAN = 'O25 K5 O25 K5 O25 K5 O25 U15';

export function clampMin(v: number): number {
  return Math.max(1, Math.min(MAXMIN, v));
}

export function serialize(blocks: Block[]): string {
  return blocks.map((b) => b.k + b.m).join(' ');
}

export function parsePlan(txt: unknown): { blocks: Block[]; bad: string } {
  const s = String(txt).toUpperCase().replace(/İ/g, 'I');
  const re = /([OKU])M?\s*(\d{1,4})/g;
  const blocks: Block[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (blocks.length < MAXBLOCKS) blocks.push({ k: m[1] as Kind, m: clampMin(parseInt(m[2], 10)) });
  }
  const bad = s.replace(/([OKU])M?\s*\d{1,4}/g, ' ').replace(/[\s,;|>\-·]+/g, ' ').trim();
  return { blocks, bad };
}

export function fmtMin(m: number): string {
  if (m >= 60) {
    const r = m % 60;
    return Math.floor(m / 60) + ' sa' + (r ? ' ' + r + ' dk' : '');
  }
  return m + ' dk';
}

export function copyPlan(plan: Block[]): Block[] {
  return plan.map((x) => ({ k: x.k, m: x.m }));
}
