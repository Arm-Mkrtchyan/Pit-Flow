import type { SolverInput, SolverRowSpec } from '../../types/solver';

/**
 * Objective value of a [block][day] tonnage matrix, using the same penalties as buildModel
 * (band slacks, centre deviation, waste cost, early-day weighting). Lower is better.
 * Used to compare a time-limited MIP against the rolling-horizon heuristic.
 */
export function scoreMatrix(input: SolverInput, x: number[][]): number {
  const { days, blocks, rows, targets, settings } = input;
  const D = days.length;
  const dayWeight = (d: number) =>
    1 + settings.earlyDayPreference * (D > 1 ? (D - 1 - d) / (D - 1) : 0);
  const refTonnes = (pool: SolverRowSpec['pool'], d: number): number => {
    const row = rows.find((r) => r.pool === pool && r.basis === 'tonnage' && r.kind === 'target');
    const v = row ? (targets[row.key][d] ?? 0) : 0;
    return v > 0 ? v : 1;
  };

  let total = 0;
  for (const row of rows) {
    const st = settings.rows[row.key];
    for (let d = 0; d < D; d++) {
      const V = targets[row.key][d] ?? 0;
      if (row.basis === 'grade' && V <= 0) continue;
      let tonnes = 0;
      let gradeTonnes = 0;
      blocks.forEach((b, i) => {
        if (b.cls !== row.pool) return;
        const v = x[i]?.[d] ?? 0;
        tonnes += v;
        gradeTonnes += v * (row.blockField ? (b[row.blockField] ?? 0) : 0);
      });
      const norm =
        (row.basis === 'tonnage' ? (V > 0 ? V : 1) : V * refTonnes(row.pool, d)) / dayWeight(d);
      // expr(m) = Σ coef·x − rhs, matching buildModel's row definitions.
      const expr = (m: number) =>
        row.basis === 'tonnage' ? tonnes - m * V : gradeTonnes - m * V * tonnes;
      if (row.kind === 'target') {
        const tol = settings.aimExactTarget ? 0 : st.tolerance;
        const under = Math.max(-expr(1 - tol), 0);
        const over = Math.max(expr(1 + tol), 0);
        total += (st.weightOut * (under + over) + st.weightIn * Math.abs(expr(1))) / norm;
      } else if (!row.hard) {
        total += (st.weightOut * Math.max(expr(1), 0)) / norm;
      }
    }
  }
  blocks.forEach((b, i) => {
    if (b.cls === 'waste')
      total += settings.wasteCostPerTonne * (x[i] ?? []).reduce((s, v) => s + v, 0);
  });
  return total;
}
