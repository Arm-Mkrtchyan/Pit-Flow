import type { StateCreator } from 'zustand';
import type { Schedule } from '../../types/domain';
import type { RootState } from '../types';

export interface SolutionSlice {
  solution: { schedule: Schedule | null; stale: boolean };
}

export const createSolutionSlice: StateCreator<RootState, [], [], SolutionSlice> = () => ({
  solution: { schedule: null, stale: false },
});
