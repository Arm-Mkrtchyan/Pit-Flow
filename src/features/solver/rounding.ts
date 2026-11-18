import { STOCK_EPS } from './buildModel';

/**
 * Round a raw tonnage matrix [block][day] to `step` tonnes using cumulative rounding,
 * so totals never drift and never exceed stock. If the solver (nearly) exhausted a block,
 * the cumulative is snapped to exactly its stock so the block truly reaches 0 — required
 * for dependency semantics. A day's take never exceeds the block's daily limit `cap[b]`;
 * what rounding would push over it carries to the next days.
 */
export function roundAllocations(
  raw: number[][],
  stock: number[],
  step: number,
  cap: readonly (number | undefined)[] = [],
): number[][] {
  return raw.map((row, b) => {
    const S = stock[b] ?? 0;
    const C = cap[b] ?? Infinity;
    let rawCum = 0;
    let prev = 0;
    return row.map((v) => {
      rawCum += Math.max(v, 0);
      let cum: number;
      if (S - rawCum < Math.max(step / 2, STOCK_EPS)) cum = S;
      else cum = Math.min(Math.round(rawCum / step) * step, S);
      cum = Math.min(Math.max(cum, prev), prev + C);
      const take = cum - prev;
      prev = cum;
      return take;
    });
  });
}
