import { useCallback, useEffect, useRef, useState } from 'react';
import { App } from 'antd';
import { useAppStore } from '../../store';
import { t } from '../../shared/i18n/t';
import { solveInWorker, SolveCancelled, validateSchedule, type SolveHandle } from '../solver';
import { enumerateDays } from '../calendar';
import type { SolverPhase } from '../../types/solver';
import { buildSolverInput } from './solverInput';

export interface SolveProgress {
  phase: SolverPhase;
  day?: number;
  days?: number;
  startedAt: number;
}

/** Runs the solver worker and stores the result. */
export function useSolve() {
  const { message } = App.useApp();
  const [progress, setProgress] = useState<SolveProgress | null>(null);
  const handle = useRef<SolveHandle | null>(null);

  useEffect(() => () => handle.current?.cancel(), []);

  const solve = useCallback(async () => {
    const s = useAppStore.getState();
    const days = enumerateDays(s.plan.range);
    if (days.length === 0 || s.blocks.length === 0) return;
    const input = buildSolverInput(s.blocks, s.userInputs, days, s.plan.targets, s.settings);

    const startedAt = Date.now();
    setProgress({ phase: 'loading', startedAt });
    const h = solveInWorker(input, (p) =>
      setProgress({ phase: p.phase, day: p.day, days: p.days, startedAt }),
    );
    handle.current = h;
    try {
      const { schedule, warnings } = await h.promise;
      if (import.meta.env.DEV) {
        const violations = validateSchedule(input, schedule);
        console.assert(violations.length === 0, 'Schedule violates hard rules', violations);
      }
      useAppStore.getState().setSchedule(schedule, warnings);
      void message.success(t('solve.done', { seconds: (schedule.solveMs / 1000).toFixed(1) }));
    } catch (e) {
      if (e instanceof SolveCancelled) void message.info(t('solve.cancelled'));
      else
        void message.error(
          t('solve.failed', { error: e instanceof Error ? e.message : String(e) }),
        );
    } finally {
      if (handle.current === h) handle.current = null;
      setProgress(null);
    }
  }, [message]);

  const cancel = useCallback(() => handle.current?.cancel(), []);

  return { solve, cancel, progress };
}
