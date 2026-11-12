import type { DayTargets, IsoDate, RowDescriptor, RowKey } from '../../types/domain';
import { ROW_DESCRIPTORS } from './rowDescriptors';

export const emptyTargets = (): DayTargets =>
  Object.fromEntries(ROW_DESCRIPTORS.map((d) => [d.key, {}])) as DayTargets;

/** Per-day value: the user's override, else the row default. */
export function resolveTarget(desc: RowDescriptor, targets: DayTargets, date: IsoDate): number {
  return targets[desc.key][date] ?? desc.default;
}

/** Resolve every row for every day (input for the solver). */
export function resolveTargets(
  days: readonly IsoDate[],
  targets: DayTargets,
): Record<RowKey, number[]> {
  const out = {} as Record<RowKey, number[]>;
  for (const d of ROW_DESCRIPTORS) out[d.key] = days.map((day) => resolveTarget(d, targets, day));
  return out;
}

/** Keep only overrides for dates in `days`. */
export function pruneTargets(targets: DayTargets, days: readonly IsoDate[]): DayTargets {
  const keep = new Set(days);
  const out = emptyTargets();
  for (const { key } of ROW_DESCRIPTORS) {
    for (const [date, v] of Object.entries(targets[key] ?? {})) {
      if (keep.has(date) && v !== undefined) out[key][date] = v;
    }
  }
  return out;
}
