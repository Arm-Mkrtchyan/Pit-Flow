import type { BlocksSlice } from './slices/blocks';
import type { SettingsSlice } from './slices/settings';
import type { SolutionSlice } from './slices/solution';
import type { UiSlice } from './slices/ui';

export type RootState = BlocksSlice & SettingsSlice & SolutionSlice & UiSlice;
