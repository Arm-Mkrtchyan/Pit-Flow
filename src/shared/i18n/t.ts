import { en, type I18nKey } from './en';
import { hy } from './hy';
import { ru } from './ru';

export type { I18nKey };

export type Language = 'en' | 'ru' | 'hy';

/** Languages offered in the switcher, labelled in their own language. */
export const LANGUAGES: ReadonlyArray<{ value: Language; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'hy', label: 'Հայերեն' },
];

const DICTS: Record<Language, Readonly<Record<I18nKey, string>>> = { en, ru, hy };

let current: Language = 'en';

/** Set the active language for t(). Called by the app root before rendering. */
export function setLanguage(lang: Language): void {
  current = lang;
}

export function getLanguage(): Language {
  return current;
}

/** Best guess from the browser for first-time users. */
export function detectLanguage(): Language {
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en';
  if (nav.startsWith('ru')) return 'ru';
  if (nav.startsWith('hy')) return 'hy';
  return 'en';
}

/** Translate a key in the active language, replacing `{name}` placeholders with params. */
export function t(key: I18nKey, params?: Record<string, string | number>): string {
  const template = DICTS[current][key] ?? en[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Localised unit symbol. */
export type UnitCode =
  | 't'
  | '%'
  | 'g/t'
  | 'm³'
  | 't/m³'
  | 'm'
  | 's'
  | 'lm'
  | 'lm/h'
  | 'lm/d'
  | 'm³/lm'
  | 'min'
  | 'h'
  | 'd'
  | 't/d';
const UNIT_KEYS: Record<UnitCode, I18nKey> = {
  t: 'unit.t',
  '%': 'unit.pct',
  'g/t': 'unit.gpt',
  'm³': 'unit.m3',
  't/m³': 'unit.tm3',
  m: 'unit.m',
  s: 'unit.s',
  lm: 'unit.lm',
  'lm/h': 'unit.lmPerHour',
  'lm/d': 'unit.lmPerDay',
  'm³/lm': 'unit.m3PerLm',
  min: 'unit.min',
  h: 'unit.h',
  d: 'unit.d',
  't/d': 'unit.tPerDay',
};
export const unit = (u: UnitCode): string => t(UNIT_KEYS[u]);
