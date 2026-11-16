import type {
  DrillAssignment,
  DrillRig,
  DrillRigPosition,
  DrillSettings,
  IsoDate,
} from '../../types/domain';
import { clockToMinutes, dayNumberToIso, isoToDayNumber } from '../../shared/utils/dates';
import type { DrillBlock } from './drillBlocks';

/**
 * Drilling duration of one drilling block (pure; no React).
 *
 * Block volume V at position p; rig rows i with drilled metres dᵢ, blasting index Iᵢ (m³/lm),
 * productivity rᵢ (lm/h), H ᵢ working hours/day from shift start, start day sᵢ.
 *   Remaining volume        R  = max(V − Σ dᵢ·Iᵢ, 0)
 *   Rig volume rate          vᵢ = rᵢ·Iᵢ  (m³/h)
 * Started rigs drill R together (each within its daily working window) until R is used up;
 * rig i drills Vᵢ ⇒ planned metres pᵢ = Vᵢ / Iᵢ, total metres = dᵢ + pᵢ.
 * With no rig started yet, each rig shows a preview as if it drilled R alone.
 * Blast day: finish time T of the block; T ≤ blastTime − loadMinutes → same day, else next day.
 */

export type RowIssue = 'noRig' | 'unknownRig' | 'noPosition';

export interface Finish {
  date: IsoDate;
  /** Minutes after midnight. */
  minutes: number;
}

export interface RowResult {
  rowId: string;
  rigId: string | null;
  perf: DrillRigPosition | null;
  hoursPerDay: number;
  drilledLm: number;
  plannedLm: number;
  totalLm: number;
  /** Linear metres drilled per calendar day. */
  perDay: Map<IsoDate, number>;
  /** Working days of this rig on the block (hours ÷ hours per day); null if not computable. */
  durationDays: number | null;
  /** Not started yet: metres and duration are an "as if alone" estimate. */
  preview: boolean;
  issue: RowIssue | null;
}

export interface BlockResult {
  key: string;
  rows: RowResult[];
  remainingVolume: number;
  finish: Finish | null;
  blastDay: IsoDate | null;
  /** Remaining volume could not be finished within the simulation limit. */
  unfinished: boolean;
}

const EPS = 1e-6;
const DAY = 1440;
/** Simulation safety limit. */
const MAX_DAYS = 3660;

export function rigPerformance(rig: DrillRig, position: string): DrillRigPosition | null {
  return rig.byPosition[position] ?? rig.byPosition['*'] ?? null;
}

export function calcDrillBlock(
  block: DrillBlock,
  rows: readonly DrillAssignment[],
  rigsById: ReadonlyMap<string, DrillRig>,
  settings: DrillSettings,
): BlockResult {
  const results: RowResult[] = rows.map((r) => {
    const rig = r.rigId !== null ? rigsById.get(r.rigId) : undefined;
    const perf = rig ? rigPerformance(rig, block.position) : null;
    const issue: RowIssue | null =
      r.rigId === null ? 'noRig' : !rig ? 'unknownRig' : !perf ? 'noPosition' : null;
    return {
      rowId: r.rowId,
      rigId: r.rigId,
      perf,
      hoursPerDay: rig?.hoursPerDay ?? settings.hoursPerDay,
      drilledLm: r.drilledLm,
      plannedLm: 0,
      totalLm: r.drilledLm,
      perDay: new Map(),
      durationDays: null,
      preview: false,
      issue,
    };
  });

  const drilledVolume = results.reduce(
    (s, r) => s + (r.perf ? r.drilledLm * r.perf.blastIndex : 0),
    0,
  );
  const remainingVolume = Math.max(block.volume - drilledVolume, 0);
  const base = { key: block.key, rows: results, remainingVolume };
  if (remainingVolume <= EPS) return { ...base, finish: null, blastDay: null, unfinished: false };

  const usable = results
    .map((r, i) => ({ r, start: rows[i]?.start ?? null }))
    .filter(
      (x): x is { r: RowResult & { perf: DrillRigPosition }; start: IsoDate | null } =>
        x.r.perf !== null,
    );
  const started = usable.filter(
    (x): x is { r: RowResult & { perf: DrillRigPosition }; start: IsoDate } => x.start !== null,
  );

  if (started.length === 0) {
    for (const { r } of usable) {
      r.plannedLm = remainingVolume / r.perf.blastIndex;
      r.totalLm = r.drilledLm + r.plannedLm;
      r.durationDays = r.plannedLm / (r.perf.productivity * r.hoursPerDay);
      r.preview = true;
    }
    return { ...base, finish: null, blastDay: null, unfinished: false };
  }

  // Event-driven simulation in minutes since day 0 (UTC day numbers).
  const shift = clockToMinutes(settings.shiftStart) ?? 0;
  const rigs = started.map(({ r, start }) => ({
    r,
    startDay: isoToDayNumber(start),
    rate: (r.perf.productivity * r.perf.blastIndex) / 60, // m³ per minute
    windowMin: Math.min(Math.max(r.hoursPerDay, 0), 24) * 60,
    minutes: 0,
    volume: 0,
  }));
  const day0 = Math.min(...rigs.map((x) => x.startDay));
  let rem = remainingVolume;
  let finishT: number | null = null;

  for (let k = day0; k < day0 + MAX_DAYS && finishT === null; k++) {
    const winStart = k * DAY + shift;
    const todays = rigs.filter((x) => x.startDay <= k && x.windowMin > 0);
    if (todays.length === 0) continue;
    const points = new Set<number>([winStart]);
    for (const x of todays) points.add(winStart + x.windowMin);
    const midnight = (k + 1) * DAY;
    if (midnight > winStart) points.add(midnight);
    const sorted = [...points].sort((a, b) => a - b);
    for (let j = 0; j + 1 < sorted.length && finishT === null; j++) {
      const a = sorted[j] as number;
      const b = sorted[j + 1] as number;
      const active = todays.filter((x) => winStart + x.windowMin >= b);
      const rate = active.reduce((s, x) => s + x.rate, 0);
      if (rate <= 0) continue;
      const dt = Math.min(b - a, rem / rate);
      const date = dayNumberToIso(Math.floor(a / DAY));
      for (const x of active) {
        const v = x.rate * dt;
        x.volume += v;
        x.minutes += dt;
        x.r.perDay.set(date, (x.r.perDay.get(date) ?? 0) + v / x.r.perf.blastIndex);
      }
      rem -= rate * dt;
      if (rem <= EPS) finishT = a + dt;
    }
  }

  for (const x of rigs) {
    x.r.plannedLm = x.volume / x.r.perf.blastIndex;
    x.r.totalLm = x.r.drilledLm + x.r.plannedLm;
    x.r.durationDays = x.windowMin > 0 ? x.minutes / x.windowMin : null;
  }

  if (finishT === null) return { ...base, finish: null, blastDay: null, unfinished: true };
  const finishDay = Math.floor(finishT / DAY);
  const finish: Finish = { date: dayNumberToIso(finishDay), minutes: finishT - finishDay * DAY };
  const blast = clockToMinutes(settings.blastTime) ?? 16 * 60;
  const sameDay = finish.minutes <= blast - settings.loadMinutesPerHole + EPS;
  return {
    ...base,
    finish,
    blastDay: dayNumberToIso(finishDay + (sameDay ? 0 : 1)),
    unfinished: false,
  };
}
