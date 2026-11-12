import type { Allocation, Schedule, ScheduleDay, ScheduleStatus } from '../../types/domain';
import type { SolverInput } from '../../types/solver';
import { STOCK_EPS } from './buildModel';
import { roundAllocations } from './rounding';

/** Primal value of a HiGHS column result, if it carries one. */
export function primalOf(col: unknown): number | undefined {
  if (typeof col !== 'object' || col === null || !('Primal' in col)) return undefined;
  return typeof col.Primal === 'number' ? col.Primal : undefined;
}

/** Read x variable values out of a HiGHS Columns map into a [block][day] matrix. */
export function readMatrix(
  xName: (string | null)[][],
  columns: Readonly<Record<string, unknown>>,
): number[][] {
  return xName.map((row) =>
    row.map((name) => (name ? Math.max(primalOf(columns[name]) ?? 0, 0) : 0)),
  );
}

/** Depth in the dependency chain (parents < children), for within-day ordering. */
function depths(input: SolverInput): number[] {
  const index = new Map(input.blocks.map((b, i) => [b.id, i]));
  const memo = new Map<number, number>();
  const depth = (i: number, seen: Set<number>): number => {
    const cached = memo.get(i);
    if (cached !== undefined) return cached;
    if (seen.has(i)) return 0; // cycles are prevented upstream; guard anyway
    seen.add(i);
    let d = 0;
    for (const pid of input.blocks[i]?.dependsOn ?? []) {
      const p = index.get(pid);
      if (p !== undefined) d = Math.max(d, depth(p, seen) + 1);
    }
    memo.set(i, d);
    return d;
  };
  return input.blocks.map((_, i) => depth(i, new Set()));
}

/** Round a raw solution and turn it into a Schedule. */
export function toSchedule(
  input: SolverInput,
  raw: number[][],
  status: ScheduleStatus,
  solveMs: number,
  mipGap?: number,
): Schedule {
  const stock = input.blocks.map((b) => b.remaining);
  const rounded = roundAllocations(raw, stock, input.settings.roundingStep);
  const depth = depths(input);
  const balance = [...stock];

  const days: ScheduleDay[] = input.days.map((date, d) => {
    const allocations: (Allocation & { depth: number })[] = [];
    input.blocks.forEach((b, i) => {
      const tonnes = rounded[i]?.[d] ?? 0;
      if (tonnes <= STOCK_EPS) return;
      const endBalance = Math.max((balance[i] ?? 0) - tonnes, 0);
      balance[i] = endBalance;
      allocations.push({ blockId: b.id, cls: b.cls, tonnes, endBalance, depth: depth[i] ?? 0 });
    });
    allocations.sort((a, b) => a.depth - b.depth || b.tonnes - a.tonnes);
    return { date, allocations: allocations.map(({ depth: _depth, ...a }) => a) };
  });

  return {
    days,
    status,
    mipGap,
    solveMs,
    inputHash: input.inputHash,
    solvedAt: new Date().toISOString(),
  };
}
