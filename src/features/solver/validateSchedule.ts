import type { Schedule } from '../../types/domain';
import type { SolverInput } from '../../types/solver';

/**
 * Check a schedule against the hard rules (stock, waste capacity, dependencies).
 * Returns human-readable violations; empty means valid. Tolerance absorbs rounding.
 */
export function validateSchedule(input: SolverInput, schedule: Schedule): string[] {
  const tol = Math.max(input.settings.roundingStep, 1);
  const issues: string[] = [];
  const byId = new Map(input.blocks.map((b) => [b.id, b]));
  const taken = new Map<string, number[]>(input.blocks.map((b) => [b.id, input.days.map(() => 0)]));
  schedule.days.forEach((day, d) =>
    day.allocations.forEach((a) => {
      const row = taken.get(a.blockId);
      if (row) row[d] = (row[d] ?? 0) + a.tonnes;
    }),
  );
  const cum = (id: string, upTo: number) =>
    (taken.get(id) ?? []).slice(0, upTo + 1).reduce((s, v) => s + v, 0);

  for (const b of input.blocks) {
    const total = cum(b.id, input.days.length - 1);
    if (total > b.remaining + 1e-6)
      issues.push(`${b.id}: takes ${total} t > stock ${b.remaining} t`);
  }

  const wasteRow = input.rows.find((r) => r.pool === 'waste' && r.hard);
  input.days.forEach((date, d) => {
    const day = schedule.days[d];
    if (!day) return;
    if (wasteRow) {
      const cap = input.targets[wasteRow.key][d] ?? Infinity;
      const w = day.allocations.filter((a) => a.cls === 'waste').reduce((s, a) => s + a.tonnes, 0);
      if (w > cap + tol) issues.push(`${date}: waste ${w} t > capacity ${cap} t`);
    }
    for (const a of day.allocations) {
      const cap = byId.get(a.blockId)?.dailyMax;
      if (cap !== undefined && a.tonnes > cap + 1e-6)
        issues.push(`${date}: ${a.blockId} takes ${a.tonnes} t > daily limit ${cap} t`);
      for (const pid of byId.get(a.blockId)?.dependsOn ?? []) {
        const p = byId.get(pid);
        if (!p || p.remaining <= 1e-6) continue;
        const startBal = p.remaining - (d > 0 ? cum(pid, d - 1) : 0);
        const endBal = p.remaining - cum(pid, d);
        if (endBal > 1e-6)
          issues.push(
            `${date}: ${a.blockId} used before parent ${pid} finished (${endBal} t left)`,
          );
        if (startBal >= input.settings.releaseThreshold + tol)
          issues.push(
            `${date}: ${a.blockId} used but ${pid} started the day at ${startBal} t ≥ threshold`,
          );
      }
    }
  });
  return issues;
}
