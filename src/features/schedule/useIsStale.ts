import { useMemo } from 'react';
import { useAppStore } from '../../store';
import { enumerateDays } from '../calendar';
import { buildSolverInput } from './solverInput';

/**
 * Whether the stored solution no longer matches the inputs. Uses the stale flag set by every
 * input action, plus an input-hash comparison as a safety net.
 */
export function useIsStale(): boolean {
  const schedule = useAppStore((s) => s.solution.schedule);
  const flag = useAppStore((s) => s.solution.stale);
  const blocks = useAppStore((s) => s.blocks);
  const inputs = useAppStore((s) => s.userInputs);
  const range = useAppStore((s) => s.plan.range);
  const targets = useAppStore((s) => s.plan.targets);
  const settings = useAppStore((s) => s.settings);
  return useMemo(() => {
    if (!schedule) return false;
    if (flag) return true;
    const input = buildSolverInput(blocks, inputs, enumerateDays(range), targets, settings);
    return input.inputHash !== schedule.inputHash;
  }, [schedule, flag, blocks, inputs, range, targets, settings]);
}
