import { useMemo } from 'react';
import { useAppStore } from '../../store';
import { computeResults, type DayResult } from './diagnostics';

/** Derived per-day results for the current schedule (memoised; never persisted). */
export function useScheduleResults(): Map<string, DayResult> | null {
  const schedule = useAppStore((s) => s.solution.schedule);
  const blocks = useAppStore((s) => s.blocks);
  const inputs = useAppStore((s) => s.userInputs);
  const targets = useAppStore((s) => s.plan.targets);
  const settings = useAppStore((s) => s.settings);
  return useMemo(() => {
    if (!schedule) return null;
    const results = computeResults(schedule, blocks, inputs, targets, settings);
    return new Map(results.map((r) => [r.date, r]));
  }, [schedule, blocks, inputs, targets, settings]);
}
