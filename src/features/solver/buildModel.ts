import type { SolverInput, SolverRowSpec } from '../../types/solver';
import { LpBuilder, type Term } from './lpWriter';

/**
 * Multi-period blending model (see CLAUDE.md / plan §4).
 *
 *   x[b,d] ≥ 0           tonnes from block b on day d
 *   Σ_d x[b,d] ≤ S_b      stock
 *   x[b,d] ≤ C[b,d]       daily limit: min(block limit, date exception limit); 0 on off dates
 *   continuity            z[b,d] started, f[b,d] exhausted (binary, monotone):
 *                           x[b,d] ≤ U[b,d]·z[b,d],   Σ_{t≤d} x[b,t] ≥ S_b·f[b,d],
 *                           x[b,d] + short[b,d] ≥ m[b,d]·(z[b,d] − f[b,d])   (dates not off)
 *                         with m[b,d] = min(minDailyTonnes, C[b,d]) and short heavily penalised
 *   target rows (soft band ±τ, normalised slacks) and limit rows (hard or soft upper bound),
 *   grade rows linearised against the pool's actual daily tonnage
 *   dependency gates with binaries open[p,d]
 *
 * Pure: returns LP text plus the variable index needed to read the solution back.
 */

export const STOCK_EPS = 1e-6;
/** Penalty of a continuity shortfall relative to the ore tonnage outside-band weight. */
export const CONTINUITY_PENALTY = 10;

type Blk = SolverInput['blocks'][number];

/** The block is not worked on this date (planner exception). */
export function isOff(b: Blk, date: string | undefined): boolean {
  return date !== undefined && b.dayOverrides?.[date]?.off === true;
}

/** Upper limit on the block's take this date (block limit and date exception); ∞ = none. */
export function dayCap(b: Blk, date: string | undefined): number {
  if (isOff(b, date)) return 0;
  const o = date !== undefined ? b.dayOverrides?.[date]?.max : undefined;
  return Math.min(b.dailyMax ?? Infinity, o ?? Infinity);
}

/** Minimum take of a working (started, not yet finished) block this date. */
export function dayMin(b: Blk, date: string | undefined, minDaily: number): number {
  return Math.min(minDaily, dayCap(b, date));
}

/** Continuity applies to blocks with stock while the setting is on. */
export function hasContinuity(b: Blk, minDaily: number): boolean {
  return minDaily > 0 && b.remaining > STOCK_EPS;
}

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
  const minDaily = input.settings.minDailyTonnes;
  const continuity = withStock.reduce(
    (n, b) => n + (hasContinuity(b, minDaily) ? (b.started ? 1 : 2) : 0),
    0,
  );
  const ids = new Map(input.blocks.map((b) => [b.id, b]));
  const parents = new Set<string>();
  for (const c of withStock) {
    for (const p of c.dependsOn) if ((ids.get(p)?.remaining ?? 0) > STOCK_EPS) parents.add(p);
  }
  return { xVars: withStock.length * D, binaries: (parents.size + continuity) * D };
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
    days.map((date, d) => (b.remaining > STOCK_EPS && !isOff(b, date) ? `x_${i}_${d}` : null)),
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

  // Daily limit: x[b,d] ≤ C[b,d] (a bound, not a row). Only binding below the stock.
  blocks.forEach((b, i) => {
    for (let d = 0; d < D; d++) {
      const v = x(i, d);
      const cap = dayCap(b, days[d]);
      if (v && cap < b.remaining) lp.addUpperBound(v, cap);
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

  // --- continuity: once started, every date (except off dates) until exhausted -----------
  const minDaily = settings.minDailyTonnes;
  const oreTonnageRow = rows.find((r) => r.pool === 'ore' && r.basis === 'tonnage');
  const shortWeight =
    CONTINUITY_PENALTY * (oreTonnageRow ? settings.rows[oreTonnageRow.key].weightOut : 1000);
  blocks.forEach((b, i) => {
    if (!hasContinuity(b, minDaily)) return;
    const S = b.remaining;
    // z[d]: started by day d (constant 1 when already started before this model).
    const z = days.map((_, d) => (b.started ? null : `z_${i}_${d}`));
    const f = days.map((_, d) => `f_${i}_${d}`);
    const cum: Term[] = [];
    for (let d = 0; d < D; d++) {
      const zd = z[d] ?? null;
      const fd = f[d] ?? '';
      const v = x(i, d);
      if (zd) lp.addBinary(zd);
      lp.addBinary(fd);
      if (v) cum.push([1, v]);
      // Monotone: once started / exhausted, stays so.
      const zn = z[d + 1];
      if (zd && zn)
        lp.addConstraint(
          [
            [1, zd],
            [-1, zn],
          ],
          '<=',
          0,
          'zmono',
        );
      const fn = f[d + 1];
      if (fn)
        lp.addConstraint(
          [
            [1, fd],
            [-1, fn],
          ],
          '<=',
          0,
          'fmono',
        );
      // Exhausted by end of day d:  Σ_{t≤d} x ≥ S·f
      lp.addConstraint([...cum, [-S, fd]], '>=', 0, 'fin');
      if (!v) continue; // off date: no take, no minimum
      // Nothing before the start:  x ≤ U·z
      if (zd)
        lp.addConstraint(
          [
            [1, v],
            [-Math.min(dayCap(b, days[d]), S), zd],
          ],
          '<=',
          0,
          'start',
        );
      // Working day minimum:  x + short ≥ m·(z − f)
      const m = dayMin(b, days[d], minDaily);
      if (m <= STOCK_EPS) continue;
      const short = `s_${i}_${d}`;
      const terms: Term[] = [
        [1, v],
        [1, short],
        [m, fd],
      ];
      if (zd) lp.addConstraint([...terms, [-m, zd]], '>=', 0, 'cont');
      else lp.addConstraint(terms, '>=', m, 'cont');
      lp.addObjective(short, (shortWeight * dayWeight(d)) / refTonnes('ore', d));
    }
  });

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
