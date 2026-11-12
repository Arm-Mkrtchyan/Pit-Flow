import type { StateCreator } from 'zustand';
import type { Schedule } from '../../types/domain';
import type { SolverWarning } from '../../types/solver';
import type { RootState } from '../types';

export interface SolutionSlice {
  solution: { schedule: Schedule | null; stale: boolean; warnings: SolverWarning[] };
  setSchedule: (schedule: Schedule, warnings: SolverWarning[]) => void;
  clearSchedule: () => void;
}

export const createSolutionSlice: StateCreator<RootState, [], [], SolutionSlice> = (set) => ({
  solution: { schedule: null, stale: false, warnings: [] },
  setSchedule: (schedule, warnings) => set({ solution: { schedule, stale: false, warnings } }),
  clearSchedule: () => set({ solution: { schedule: null, stale: false, warnings: [] } }),
});
