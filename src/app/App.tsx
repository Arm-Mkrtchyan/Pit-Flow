import { Empty, Typography } from 'antd';
import { t } from '../shared/i18n/t';
import { AppLayout } from './AppLayout';

export function App() {
  return (
    <AppLayout
      left={
        <>
          <Typography.Title level={5}>{t('layout.blocks')}</Typography.Title>
          <Empty description={t('blocks.empty')} />
        </>
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
