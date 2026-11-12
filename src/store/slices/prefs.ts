import type { StateCreator } from 'zustand';
import { detectLanguage, type Language } from '../../shared/i18n/t';
import type { RootState } from '../types';

/** User preferences that persist but are not solver settings (so "reset settings" keeps them). */
export interface PrefsSlice {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const createPrefsSlice: StateCreator<RootState, [], [], PrefsSlice> = (set) => ({
  language: detectLanguage(),
  setLanguage: (language) => set({ language }),
});
