import { Empty, Typography } from 'antd';
import { t } from '../shared/i18n/t';
import { BlockList } from '../features/blocks';
import { ImportButton } from '../features/import';
import { AppLayout } from './AppLayout';
import styles from './AppLayout.module.css';

export function App() {
  return (
    <AppLayout
      left={
        <div className={styles.leftPanel}>
          <ImportButton />
          <BlockList />
        </div>
      }
      center={<Empty description={t('schedule.empty')} />}
      right={
        <>
          <Typography.Title level={5}>{t('layout.calendar')}</Typography.Title>
          <Typography.Text type="secondary">{t('calendar.placeholder')}</Typography.Text>
        </>
      }
    />
  );
}
