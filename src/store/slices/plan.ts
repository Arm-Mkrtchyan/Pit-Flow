import type { StateCreator } from 'zustand';
import type { DayTargets, IsoDate, RowKey } from '../../types/domain';
import { enumerateDays } from '../../features/calendar/dateRange';
import { ROW_BY_KEY } from '../../features/schedule/rowDescriptors';
import { emptyTargets, pruneTargets } from '../../features/schedule/targets';
import type { RootState } from '../types';

export interface PlanSlice {
  plan: { range: [IsoDate, IsoDate] | null; targets: DayTargets };
  /** Change the horizon; overrides for days that stay in range are kept, others dropped. */
  setRange: (range: [IsoDate, IsoDate] | null) => void;
  /** Set one day's value; null (or the default value) removes the override. */
  setTarget: (row: RowKey, date: IsoDate, value: number | null) => void;
  /** Set a row for every day in range; null resets the row to its default. */
  applyToAll: (row: RowKey, value: number | null) => void;
}

const clamp = (row: RowKey, v: number) => {
  const d = ROW_BY_KEY[row];
  return Math.min(Math.max(v, d.min), d.max);
};

export const createPlanSlice: StateCreator<RootState, [], [], PlanSlice> = (set) => ({
  plan: { range: null, targets: emptyTargets() },

  setRange: (range) =>
    set((s) => ({
      plan: { range, targets: pruneTargets(s.plan.targets, enumerateDays(range)) },
      solution: { ...s.solution, stale: true },
    })),

  setTarget: (row, date, value) =>
    set((s) => {
      const current = s.plan.targets[row];
      let rowTargets: Partial<Record<IsoDate, number>>;
      if (
        value === null ||
        !Number.isFinite(value) ||
        clamp(row, value) === ROW_BY_KEY[row].default
      ) {
        if (!(date in current)) return {};
        rowTargets = Object.fromEntries(Object.entries(current).filter(([d]) => d !== date));
      } else {
        const v = clamp(row, value);
        if (current[date] === v) return {};
        rowTargets = { ...current, [date]: v };
      }
      return {
        plan: { ...s.plan, targets: { ...s.plan.targets, [row]: rowTargets } },
        solution: { ...s.solution, stale: true },
      };
    }),

  applyToAll: (row, value) =>
    set((s) => {
      const rowTargets: Partial<Record<IsoDate, number>> = {};
      if (value !== null && Number.isFinite(value)) {
        const v = clamp(row, value);
        if (v !== ROW_BY_KEY[row].default) {
          for (const day of enumerateDays(s.plan.range)) rowTargets[day] = v;
        }
      }
      return {
        plan: { ...s.plan, targets: { ...s.plan.targets, [row]: rowTargets } },
        solution: { ...s.solution, stale: true },
      };
    }),
});
