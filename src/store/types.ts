import type { BlocksSlice } from './slices/blocks';
import type { DrillingSlice } from './slices/drilling';
import type { HistorySlice } from './slices/history';
import type { PlanSlice } from './slices/plan';
import type { PrefsSlice } from './slices/prefs';
import type { SettingsSlice } from './slices/settings';
import type { SolutionSlice } from './slices/solution';
import type { UiSlice } from './slices/ui';

export type RootState = BlocksSlice &
  PlanSlice &
  SettingsSlice &
  SolutionSlice &
  HistorySlice &
  PrefsSlice &
  UiSlice &
  DrillingSlice;
