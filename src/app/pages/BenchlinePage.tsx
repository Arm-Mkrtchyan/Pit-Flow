import { useEffect, useRef } from 'react';
import { Layout } from 'antd';
import { attachBenchline } from '../../features/benchline';
import { t } from '../../shared/i18n/t';
import { useAppStore } from '../../store';
import styles from '../AppLayout.module.css';

/** Benchline (open-pit scheduler + DTM viewer). Its own DOM controller renders inside this element. */
export function BenchlinePage() {
  const ref = useRef<HTMLElement>(null);
  const language = useAppStore((s) => s.language);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    return attachBenchline(host, language);
  }, [language]);
  return <Layout.Content ref={ref} className={styles.benchline} aria-label={t('page.benchline')} />;
}
