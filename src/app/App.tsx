import { useEffect } from 'react';
import { App as AntApp, Spin } from 'antd';
import { t } from '../shared/i18n/t';
import { useAppStore } from '../store';
import { useHydrated } from '../store/useHydrated';
import { AppLayout } from './AppLayout';
import styles from './AppLayout.module.css';
import { DeviationPage } from './pages/DeviationPage';
import { DrillingPage } from './pages/DrillingPage';
import { ExtractionPage } from './pages/ExtractionPage';
import { HomePage } from './pages/HomePage';
import { ResourcesPage } from './pages/ResourcesPage';
import { useCurrentPage } from './routes';

function LoadErrorNotice() {
  const { notification } = AntApp.useApp();
  const loadError = useAppStore((s) => s.loadError);
  const clear = useAppStore((s) => s.clearLoadError);
  useEffect(() => {
    if (!loadError) return;
    // Fixed key: the notice updates in place once the backup key is known.
    notification.error({
      key: 'load-error',
      message: t('load.errorTitle'),
      description: t('load.error', {
        message: loadError.message,
        backup: loadError.backupKey ?? t('load.noBackup'),
      }),
      duration: 0,
      onClose: clear,
    });
  }, [loadError, notification, clear]);
  return null;
}

export function App() {
  const hydrated = useHydrated();
  const page = useCurrentPage();
  if (!hydrated) {
    return (
      <div className={styles.loading}>
        <Spin size="large" tip={t('load.loading')}>
          <div style={{ width: 200, height: 80 }} />
        </Spin>
      </div>
    );
  }
  return (
    <>
      <LoadErrorNotice />
      <AppLayout page={page}>
        {page === 'home' && <HomePage />}
        {page === 'extraction' && <ExtractionPage />}
        {page === 'drilling' && <DrillingPage />}
        {page === 'resources' && <ResourcesPage />}
        {page === 'deviation' && <DeviationPage />}
      </AppLayout>
    </>
  );
}
