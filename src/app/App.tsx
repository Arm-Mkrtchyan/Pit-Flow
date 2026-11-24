import { Suspense, lazy, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
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

// Benchline (~110 KB plus Chart.js) loads only when its page is opened.
const BenchlinePage = lazy(() =>
  import('./pages/BenchlinePage').then((m) => ({ default: m.BenchlinePage })),
);

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
  const page = useCurrentPage();
  // Pages live in the URL hash, which Vercel Analytics doesn't see: report each page as a path.
  const path = page === 'home' ? '/' : `/${page}`;
  return (
    <>
      <Analytics route={path} path={path} />
      <AppContent page={page} />
    </>
  );
}

function AppContent({ page }: { page: ReturnType<typeof useCurrentPage> }) {
  const hydrated = useHydrated();
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
        {page === 'benchline' && (
          <Suspense
            fallback={
              <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
                <Spin size="large" />
              </div>
            }
          >
            <BenchlinePage />
          </Suspense>
        )}
      </AppLayout>
    </>
  );
}
