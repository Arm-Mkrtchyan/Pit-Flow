import type { StateCreator } from 'zustand';
import type { BlockFieldKey, Settings } from '../../types/domain';
import { DEFAULT_SETTINGS } from '../../features/settings/defaults';
import type { RootState } from '../types';

export interface SettingsSlice {
  settings: Settings;
  setLastColumnMapping: (mapping: Record<string, BlockFieldKey>) => void;
}

export const createSettingsSlice: StateCreator<RootState, [], [], SettingsSlice> = (set) => ({
  settings: DEFAULT_SETTINGS,
  setLastColumnMapping: (mapping) =>
    set((s) => ({ settings: { ...s.settings, lastColumnMapping: mapping } })),
});
