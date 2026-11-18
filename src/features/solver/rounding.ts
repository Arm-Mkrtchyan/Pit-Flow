import { STOCK_EPS } from './buildModel';

/**
 * Round a raw tonnage matrix [block][day] to `step` tonnes using cumulative rounding,
 * so totals never drift and never exceed stock. If the solver (nearly) exhausted a block,
 * the cumulative is snapped to exactly its stock so the block truly reaches 0 — required
 * for dependency semantics. A day's take never exceeds that day's limit `cap[b][d]` (0 on
 * dates the block is off); what rounding would push over it carries to the next days.
 */
export function roundAllocations(
  raw: number[][],
  stock: number[],
  step: number,
  cap: readonly (readonly number[])[] = [],
): number[][] {
  return raw.map((row, b) => {
    const S = stock[b] ?? 0;
    let rawCum = 0;
    let prev = 0;
    return row.map((v, d) => {
      const C = cap[b]?.[d] ?? Infinity;
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
