import type { StateCreator } from 'zustand';
import type { BlockFieldKey, RowKey, RowSettings, Settings } from '../../types/domain';
import { DEFAULT_SETTINGS } from '../../features/settings/defaults';
import type { RootState } from '../types';

export interface SettingsSlice {
  settings: Settings;
  setLastColumnMapping: (mapping: Record<string, BlockFieldKey>) => void;
  updateSettings: (patch: Partial<Omit<Settings, 'rows' | 'lastColumnMapping'>>) => void;
  updateRowSettings: (row: RowKey, patch: Partial<RowSettings>) => void;
  resetSettings: () => void;
}

export const createSettingsSlice: StateCreator<RootState, [], [], SettingsSlice> = (set) => ({
  settings: DEFAULT_SETTINGS,
  setLastColumnMapping: (mapping) =>
    set((s) => ({ settings: { ...s.settings, lastColumnMapping: mapping } })),
  updateSettings: (patch) =>
    set((s) => ({
      settings: { ...s.settings, ...patch },
      solution: { ...s.solution, stale: s.solution.schedule !== null || s.solution.stale },
    })),
  updateRowSettings: (row, patch) =>
    set((s) => ({
      settings: {
        ...s.settings,
        rows: { ...s.settings.rows, [row]: { ...s.settings.rows[row], ...patch } },
      },
      solution: { ...s.solution, stale: s.solution.schedule !== null || s.solution.stale },
    })),
  resetSettings: () =>
    set((s) => ({
      // Keep the remembered column mapping; it is a convenience, not a solver setting.
      settings: { ...DEFAULT_SETTINGS, lastColumnMapping: s.settings.lastColumnMapping },
      solution: { ...s.solution, stale: s.solution.schedule !== null || s.solution.stale },
    })),
});
