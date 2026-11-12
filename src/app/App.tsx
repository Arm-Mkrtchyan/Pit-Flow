import { useEffect } from 'react';
import { App as AntApp, Spin } from 'antd';
import { BlockList, BlockModal } from '../features/blocks';
import { CalendarPanel } from '../features/calendar';
import { ImportButton } from '../features/import';
import { ActualsButton } from '../features/actuals';
import { SchedulePanel } from '../features/schedule';
import { SettingsDrawer } from '../features/settings';
import { t } from '../shared/i18n/t';
import { useAppStore } from '../store';
import { useHydrated } from '../store/useHydrated';
import { AppLayout } from './AppLayout';
import styles from './AppLayout.module.css';

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
      <AppLayout
        left={
          <div className={styles.leftPanel}>
            <ImportButton />
            <ActualsButton />
            <BlockList />
            <BlockModal />
          </div>
        }
        center={<SchedulePanel />}
        right={<CalendarPanel />}
      />
      <SettingsDrawer />
    </>
  );
}
