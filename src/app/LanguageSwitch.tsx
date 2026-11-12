import { Select } from 'antd';
import { LANGUAGES, t, type Language } from '../shared/i18n/t';
import { useAppStore } from '../store';

export function LanguageSwitch() {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  return (
    <Select<Language>
      size="small"
      value={language}
      onChange={setLanguage}
      options={[...LANGUAGES]}
      aria-label={t('language.label')}
      style={{ width: 120 }}
    />
  );
}
