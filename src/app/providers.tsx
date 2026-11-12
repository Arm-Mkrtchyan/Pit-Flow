import { Fragment, useEffect, type ReactNode } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import hyAM from 'antd/locale/hy_AM';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import 'dayjs/locale/hy-am';
import 'dayjs/locale/ru';
import { setLanguage, type Language } from '../shared/i18n/t';
import { useAppStore } from '../store';
import { theme } from './theme';

const ANTD_LOCALE: Record<Language, Locale> = { en: enUS, ru: ruRU, hy: hyAM };
const DAYJS_LOCALE: Record<Language, string> = { en: 'en', ru: 'ru', hy: 'hy-am' };

export function Providers({ children }: { children: ReactNode }) {
  const language = useAppStore((s) => s.language);
  // Set synchronously before children render, so t() and dayjs use the new language in this
  // render. Both calls are idempotent.
  setLanguage(language);
  dayjs.locale(DAYJS_LOCALE[language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <ConfigProvider theme={theme} locale={ANTD_LOCALE[language]}>
      <AntApp>
        {/* Remount on language change so memoised labels (table columns etc.) are rebuilt. */}
        <Fragment key={language}>{children}</Fragment>
      </AntApp>
    </ConfigProvider>
  );
}
