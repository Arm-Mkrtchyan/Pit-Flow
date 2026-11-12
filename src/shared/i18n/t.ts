import { en, type I18nKey } from './en';

export type { I18nKey };

/** Translate a key, replacing `{name}` placeholders with params. */
export function t(key: I18nKey, params?: Record<string, string | number>): string {
  const template: string = en[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
