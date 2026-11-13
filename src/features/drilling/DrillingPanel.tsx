import { Button, Card, Empty, Typography } from 'antd';
import { t } from '../../shared/i18n/t';

/**
 * Drilling planning workspace. Phase 1 placeholder: the equipment uploader and the
 * drilling-duration calculation are added once the equipment format and formula are agreed.
 */
export function DrillingPanel() {
  return (
    <Card
      title={t('drilling.equipment')}
      extra={
        <Button type="primary" disabled>
          {t('drilling.uploadEquipment')}
        </Button>
      }
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<Typography.Text type="secondary">{t('drilling.comingSoon')}</Typography.Text>}
      />
    </Card>
  );
}
