import type { SolverInput, SolverRowSpec } from '../../types/solver';
import { LpBuilder, type Term } from './lpWriter';

/**
 * Multi-period blending model (see CLAUDE.md / plan §4).
 *
 *   x[b,d] ≥ 0           tonnes from block b on day d
 *   Σ_d x[b,d] ≤ S_b      stock
 *   x[b,d] ≤ C_b          daily productivity limit of the block (hard, when set)
 *   target rows (soft band ±τ, normalised slacks) and limit rows (hard or soft upper bound),
 *   grade rows linearised against the pool's actual daily tonnage
 *   dependency gates with binaries open[p,d]
 *
 * Pure: returns LP text plus the variable index needed to read the solution back.
 */

export const STOCK_EPS = 1e-6;

export interface BuiltModel {
  lp: string;
  /** x variable name for [blockIndex][dayIndex], or null when the block has no stock. */
  xName: (string | null)[][];
  stats: { rows: number; columns: number; binaries: number };
}

/** Size check used to pick full MIP vs rolling horizon (cheap; no LP text). */
export function estimateSize(input: SolverInput): { xVars: number; binaries: number } {
  const D = input.days.length;
  const withStock = input.blocks.filter((b) => b.remaining > STOCK_EPS);
  const ids = new Map(input.blocks.map((b) => [b.id, b]));
  const parents = new Set<string>();
  for (const c of withStock) {
    for (const p of c.dependsOn) if ((ids.get(p)?.remaining ?? 0) > STOCK_EPS) parents.add(p);
  }
  return { xVars: withStock.length * D, binaries: parents.size * D };
}

function gradeOf(b: SolverInput['blocks'][number], field: SolverRowSpec['blockField']): number {
  return field ? (b[field] ?? 0) : 0;
}

export function buildModel(input: SolverInput): BuiltModel {
  const { days, blocks, rows, targets, settings } = input;
  const D = days.length;
  const lp = new LpBuilder();

  // --- x variables ---------------------------------------------------------
  const xName: (string | null)[][] = blocks.map((b, i) =>
    days.map((_, d) => (b.remaining > STOCK_EPS ? `x_${i}_${d}` : null)),
  );
  const x = (i: number, d: number): string | null => xName[i]?.[d] ?? null;

  // Stock: Σ_d x[b,d] ≤ S_b
  blocks.forEach((b, i) => {
    const terms: Term[] = [];
    for (let d = 0; d < D; d++) {
      const v = x(i, d);
      if (v) terms.push([1, v]);
    }
    lp.addConstraint(terms, '<=', b.remaining, 'stock');
  });

  // Daily productivity limit: x[b,d] ≤ C_b (a bound, not a row). Only binding below the stock.
  blocks.forEach((b, i) => {
    const cap = b.dailyMax;
    if (cap === undefined || !(cap > 0) || cap >= b.remaining) return;
    for (let d = 0; d < D; d++) {
      const v = x(i, d);
      if (v) lp.addUpperBound(v, cap);
    }
  });

  // Reference tonnage per pool/day for normalising grade slacks: the pool's tonnage target.
  const refTonnes = (pool: SolverRowSpec['pool'], d: number): number => {
    const row = rows.find((r) => r.pool === pool && r.basis === 'tonnage' && r.kind === 'target');
    const v = row ? (targets[row.key][d] ?? 0) : 0;
    return v > 0 ? v : 1;
  };

  // Earlier days weigh more, so unavoidable shortfalls land at the end of the horizon
  // instead of being spread arbitrarily (the LP is otherwise indifferent between days).
  const dayWeight = (d: number) =>
    1 + settings.earlyDayPreference * (D > 1 ? (D - 1 - d) / (D - 1) : 0);

  // --- target / limit rows -------------------------------------------------
  for (const row of rows) {
    const st = settings.rows[row.key];
    // Exact mode: a zero-width band, so every tonne/grade-tonne off target is penalised at the
    // outside-band weight. Total shortfall is fixed by stock, so the early-day weighting then
    // pushes it to the last days instead of spreading it across the band.
    const tol = settings.aimExactTarget ? 0 : st.tolerance;
    for (let d = 0; d < D; d++) {
      const V = targets[row.key][d] ?? 0;
      const pool: Array<{ v: string; g: number }> = [];
      blocks.forEach((b, i) => {
        const v = x(i, d);
        if (v && b.cls === row.pool) pool.push({ v, g: gradeOf(b, row.blockField) });
      });

      if (row.basis === 'grade' && V <= 0) continue; // no grade target that day
      const norm =
        (row.basis === 'tonnage' ? (V > 0 ? V : 1) : V * refTonnes(row.pool, d)) / dayWeight(d);
      const tag = `${row.key}_${d}`;
      // For tonnage rows coef = 1 and rhs scales with V; for grade rows coef = g − m·V and rhs = 0.
      const terms = (m: number): Term[] =>
        pool.map(({ v, g }) => [row.basis === 'tonnage' ? 1 : g - m * V, v] as const);
      const rhs = (m: number) => (row.basis === 'tonnage' ? m * V : 0);

      if (row.kind === 'target') {
        const u = `u_${tag}`;
        const o = `o_${tag}`;
        const p = `p_${tag}`;
        const n = `m_${tag}`;
        lp.addConstraint([...terms(1 - tol), [1, u]], '>=', rhs(1 - tol), 'lo');
        lp.addConstraint([...terms(1 + tol), [-1, o]], '<=', rhs(1 + tol), 'hi');
        lp.addConstraint([...terms(1), [-1, p], [1, n]], '=', rhs(1), 'ctr');
        lp.addObjective(u, st.weightOut / norm);
        lp.addObjective(o, st.weightOut / norm);
        lp.addObjective(p, st.weightIn / norm);
        lp.addObjective(n, st.weightIn / norm);
      } else if (row.hard) {
        lp.addConstraint(terms(1), '<=', rhs(1), 'lim');
      } else {
        const o = `o_${tag}`;
        lp.addConstraint([...terms(1), [-1, o]], '<=', rhs(1), 'lim');
        lp.addObjective(o, st.weightOut / norm);
      }
    }
  }

  // Tiny cost on waste so it is stripped only when it releases ore.
  blocks.forEach((b, i) => {
    if (b.cls !== 'waste') return;
    for (let d = 0; d < D; d++) {
      const v = x(i, d);
      if (v) lp.addObjective(v, settings.wasteCostPerTonne);
    }
  });

  // --- dependencies ----------------------------------------------------------
  const index = new Map(blocks.map((b, i) => [b.id, i]));
  const R = settings.releaseThreshold - settings.releaseEpsilon;
  const openVars = new Map<number, string[]>();

  const ensureOpen = (p: number): string[] => {
    const existing = openVars.get(p);
    if (existing) return existing;
    const S = blocks[p]?.remaining ?? 0;
    const y = days.map((_, d) => `y_${p}_${d}`);
    y.forEach((v) => lp.addBinary(v));
    for (let d = 0; d < D; d++) {
      const yd = y[d] ?? '';
      const before: Term[] = [];
      for (let t = 0; t < d; t++) {
        const v = x(p, t);
        if (v) before.push([1, v]);
      }
      const today = x(p, d);
      const upToToday: Term[] = today ? [...before, [1, today]] : before;
      // Start-of-day balance below R:  S − Σ_{t<d} x ≤ R + S(1 − y)  ⇔  Σ_{t<d} x − S·y ≥ −R
      if (S > R) lp.addConstraint([...before, [-S, yd]], '>=', -R, 'rel');
      // Finished by end of day:  S − Σ_{t≤d} x ≤ S(1 − y)  ⇔  Σ_{t≤d} x − S·y ≥ 0
      lp.addConstraint([...upToToday, [-S, yd]], '>=', 0, 'fin');
      // Valid cut: once open, stays open.
      const next = y[d + 1];
      if (next)
        lp.addConstraint(
          [
            [1, yd],
            [-1, next],
          ],
          '<=',
          0,
          'mono',
        );
    }
    openVars.set(p, y);
    return y;
  };

  blocks.forEach((c, ci) => {
    if (c.remaining <= STOCK_EPS) return;
    for (const pid of c.dependsOn) {
      const p = index.get(pid);
      // Missing or exhausted parent ⇒ child is free.
      if (p === undefined || (blocks[p]?.remaining ?? 0) <= STOCK_EPS) continue;
      const y = ensureOpen(p);
      for (let d = 0; d < D; d++) {
        const v = x(ci, d);
        const yd = y[d];
        if (v && yd)
          lp.addConstraint(
            [
              [1, v],
              [-c.remaining, yd],
            ],
            '<=',
            0,
            'gate',
          );
      }
    }
  });

  return { lp: lp.toString(), xName, stats: lp.stats };
}
