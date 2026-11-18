import type { StateCreator } from 'zustand';
import type { AcceptedEntry, BlockId, BlockUserInput, IsoDate } from '../../types/domain';
import type { RootState } from '../types';

const MAX_HISTORY = 50;

export type AcceptResult =
  { ok: true; entry: AcceptedEntry } | { ok: false; reason: 'noSchedule' | 'stale' | 'empty' };
export type UndoResult =
  | { ok: true; entry: AcceptedEntry }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'missing'; missing: BlockId[] };

export interface HistorySlice {
  history: AcceptedEntry[];
  /** Subtract the scheduled tonnes from remaining stock and record it. Clears the solution. */
  acceptSchedule: () => AcceptResult;
  /** Restore the balances from before the last acceptance. */
  undoLastAcceptance: () => UndoResult;
  /** Apply recalculated stock/grades from actual extraction, as an undoable history entry. */
  applyActualsResult: (r: {
    userInputs: Record<BlockId, BlockUserInput>;
    before: Record<BlockId, number>;
    taken: Record<BlockId, number>;
    beforeInputs: Record<BlockId, BlockUserInput>;
    range: [IsoDate, IsoDate];
  }) => AcceptedEntry | null;
}

export const createHistorySlice: StateCreator<RootState, [], [], HistorySlice> = (set, get) => ({
  history: [],

  acceptSchedule: () => {
    const s = get();
    const schedule = s.solution.schedule;
    if (!schedule) return { ok: false, reason: 'noSchedule' };
    if (s.solution.stale) return { ok: false, reason: 'stale' };

    const taken: Record<BlockId, number> = {};
    for (const d of schedule.days) {
      for (const a of d.allocations) taken[a.blockId] = (taken[a.blockId] ?? 0) + a.tonnes;
    }
    const ids = Object.keys(taken).filter((id) => s.userInputs[id]);
    const first = schedule.days[0]?.date;
    const last = schedule.days.at(-1)?.date;
    if (ids.length === 0 || !first || !last) return { ok: false, reason: 'empty' };

    const before: Record<BlockId, number> = {};
    const userInputs = { ...s.userInputs };
    for (const id of ids) {
      const input = userInputs[id];
      if (!input) continue;
      before[id] = input.remaining;
      userInputs[id] = { ...input, remaining: Math.max(input.remaining - (taken[id] ?? 0), 0) };
    }
    const entry: AcceptedEntry = {
      id: crypto.randomUUID(),
      acceptedAt: new Date().toISOString(),
      range: [first, last],
      before,
      taken: Object.fromEntries(ids.map((id) => [id, taken[id] ?? 0])),
    };
    set({
      userInputs,
      history: [entry, ...s.history].slice(0, MAX_HISTORY),
      solution: { schedule: null, stale: false, warnings: [] },
    });
    return { ok: true, entry };
  },

  undoLastAcceptance: () => {
    const s = get();
    const entry = s.history[0];
    if (!entry) return { ok: false, reason: 'empty' };
    const missing = Object.keys(entry.before).filter((id) => !s.userInputs[id]);
    if (missing.length > 0) return { ok: false, reason: 'missing', missing };
    const userInputs = { ...s.userInputs };
    for (const [id, remaining] of Object.entries(entry.before)) {
      const input = userInputs[id];
      const full = entry.beforeInputs?.[id];
      // Actuals entries restore the whole input (stock and grades); keep the current planner
      // settings (dependencies, daily limit, date exceptions), which actuals never change.
      if (input) userInputs[id] = full ? withPlannerSettings(full, input) : { ...input, remaining };
    }
    set({
      userInputs,
      history: s.history.slice(1),
      solution: { ...s.solution, stale: s.solution.schedule !== null },
    });
    return { ok: true, entry };
  },

  applyActualsResult: (r) => {
    const ids = Object.keys(r.before);
    if (ids.length === 0) return null;
    const entry: AcceptedEntry = {
      id: crypto.randomUUID(),
      kind: 'actuals',
      acceptedAt: new Date().toISOString(),
      range: r.range,
      before: r.before,
      taken: r.taken,
      beforeInputs: r.beforeInputs,
    };
    set((s) => ({
      userInputs: r.userInputs,
      history: [entry, ...s.history].slice(0, MAX_HISTORY),
      solution: { ...s.solution, stale: s.solution.schedule !== null || s.solution.stale },
    }));
    return entry;
  },
});

function withPlannerSettings(restored: BlockUserInput, current: BlockUserInput): BlockUserInput {
  const out: BlockUserInput = {
    ...restored,
    dependsOn: current.dependsOn,
    dailyMax: current.dailyMax,
    dayOverrides: current.dayOverrides,
  };
  if (out.dailyMax === undefined) delete out.dailyMax;
  if (out.dayOverrides === undefined) delete out.dayOverrides;
  return out;
}
