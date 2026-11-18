import type { Schedule } from '../../types/domain';
import type { SolverInput, SolverPhase, SolverWarning } from '../../types/solver';
import { STOCK_EPS, buildModel, estimateSize } from './buildModel';
import { scoreMatrix, type MatrixScore } from './evaluate';
import { primalOf, readMatrix, toSchedule } from './parseSolution';

/** The subset of the highs-js API we use (keeps this module binding-agnostic). */
export interface HighsLike {
  solve(
    lp: string,
    options?: Record<string, string | number | boolean>,
  ): { Status: string; Columns: Readonly<Record<string, unknown>> };
}

export type ProgressFn = (phase: SolverPhase, info?: { day?: number; days?: number }) => void;

const BINARY_LIMIT = 3000;

/** A day in the rolling horizon returned no usable solution. */
export class SolverError extends Error {
  constructor(
    readonly day: string,
    readonly status: string,
  ) {
    super(`Solver returned "${status}" for ${day}`);
  }
}

/** Lexicographic comparison of two scores: tonnage first, then the full objective. */
function better(a: MatrixScore, b: MatrixScore): boolean {
  const eps = Math.max(1e-6 * Math.max(Math.abs(a.primary), Math.abs(b.primary)), 1e-4);
  if (Math.abs(a.primary - b.primary) > eps) return a.primary < b.primary;
  return a.total < b.total;
}

function hasSolution(res: { Status: string; Columns: Readonly<Record<string, unknown>> }): boolean {
  if (res.Status === 'Optimal') return true;
  if (res.Status !== 'Time limit reached') return false;
  return primalOf(Object.values(res.Columns)[0]) !== undefined;
}

/** Gap for the tonnage phase: tonnage is the first priority, so solve it (nearly) exactly. */
const PRIMARY_GAP = 1e-4;

/**
 * Lexicographic solve: phase 1 minimises only the tonnage terms (ore tonnage outside its band,
 * earliest days first; continuity), phase 2 the full objective (grades, band centre, waste)
 * without letting the tonnage terms get worse than phase 1 found. Each phase has the full
 * time limit. Falls back to a single full solve if phase 1 finds nothing.
 */
function solveOnce(highs: HighsLike, input: SolverInput, timeLimitSec: number) {
  const model = buildModel(input);
  const opts = (gap: number) => ({
    time_limit: timeLimitSec,
    mip_rel_gap: gap,
    output_flag: false,
  });
  const single = () => {
    const res = highs.solve(model.lp, opts(input.settings.mipRelGap));
    return { model, res, ok: hasSolution(res) };
  };
  if (model.primaryTerms.length === 0) return single();

  const p1 = highs.solve(model.lpPrimary, opts(Math.min(input.settings.mipRelGap, PRIMARY_GAP)));
  if (!hasSolution(p1)) return single();
  const v1 = model.primaryTerms.reduce((s, [c, v]) => s + c * (primalOf(p1.Columns[v]) ?? 0), 0);
  // Small slack so phase 2 stays feasible despite solver tolerances.
  const cap = v1 + Math.max(1e-6 * Math.abs(v1), 1e-4);
  const p2 = highs.solve(model.lpFinal(cap), opts(input.settings.mipRelGap));
  const optimal = p1.Status === 'Optimal' && p2.Status === 'Optimal';
  if (hasSolution(p2)) {
    return {
      model,
      res: { Status: optimal ? 'Optimal' : 'Time limit reached', Columns: p2.Columns },
      ok: true,
    };
  }
  // Grades could not be optimised in time: keep the tonnage-optimal plan.
  return { model, res: { Status: 'Time limit reached', Columns: p1.Columns }, ok: true };
}

/** Day-by-day fallback: each day is a small MIP; balances carry forward. */
function solveRolling(highs: HighsLike, input: SolverInput, progress: ProgressFn): number[][] {
  const D = input.days.length;
  const raw = input.blocks.map(() => new Array<number>(D).fill(0));
  const remaining = input.blocks.map((b) => b.remaining);
  // Continuity carries over: a block worked on an earlier day must keep going.
  const started = input.blocks.map((b) => b.started === true);
  const perDay = Math.max(2, input.settings.timeLimitSec / Math.max(D, 1));

  for (let d = 0; d < D; d++) {
    progress('rolling', { day: d + 1, days: D });
    const dayInput: SolverInput = {
      ...input,
      days: [input.days[d] ?? ''],
      blocks: input.blocks.map((b, i) => ({
        ...b,
        remaining: remaining[i] ?? 0,
        started: started[i] ?? false,
      })),
      targets: Object.fromEntries(
        Object.entries(input.targets).map(([k, v]) => [k, [v[d] ?? 0]]),
      ) as SolverInput['targets'],
    };
    const { model, res, ok } = solveOnce(highs, dayInput, perDay);
    if (!ok) throw new SolverError(input.days[d] ?? String(d), res.Status);
    const m = readMatrix(model.xName, res.Columns);
    m.forEach((row, i) => {
      const v = Math.min(row[0] ?? 0, remaining[i] ?? 0);
      const r = raw[i];
      if (r) r[d] = v;
      remaining[i] = Math.max((remaining[i] ?? 0) - v, 0);
      if (v > STOCK_EPS) started[i] = true;
    });
  }
  return raw;
}

/** Solve the full horizon as one MIP, falling back to rolling horizon if too large or no solution. */
export function solveSchedule(
  highs: HighsLike,
  input: SolverInput,
  progress: ProgressFn = () => undefined,
): { schedule: Schedule; warnings: SolverWarning[] } {
  const t0 = performance.now();
  const warnings: SolverWarning[] = [];
  const size = estimateSize(input);
  const tooBig = size.xVars > input.settings.rollingHorizonAbove || size.binaries > BINARY_LIMIT;

  if (!tooBig) {
    progress('building');
    progress('solving');
    const { model, res, ok } = solveOnce(highs, input, input.settings.timeLimitSec);
    if (ok && res.Status === 'Optimal') {
      const raw = readMatrix(model.xName, res.Columns);
      return { schedule: toSchedule(input, raw, 'optimal', performance.now() - t0), warnings };
    }
    if (ok) {
      // Time limit: the incumbent may be poor. Compare with the fast day-by-day heuristic.
      const mip = readMatrix(model.xName, res.Columns);
      const rolling = solveRolling(highs, input, progress);
      const useRolling = better(scoreMatrix(input, rolling), scoreMatrix(input, mip));
      warnings.push({ code: useRolling ? 'timeLimitRolling' : 'timeLimit' });
      return {
        schedule: toSchedule(
          input,
          useRolling ? rolling : mip,
          useRolling ? 'rolling_horizon' : 'time_limit',
          performance.now() - t0,
        ),
        warnings,
      };
    }
    warnings.push({ code: 'fullModelFailed', status: res.Status });
  } else {
    warnings.push({ code: 'tooLarge', xVars: size.xVars, binaries: size.binaries });
  }
  const raw = solveRolling(highs, input, progress);
  return {
    schedule: toSchedule(input, raw, 'rolling_horizon', performance.now() - t0),
    warnings,
  };
}
