import { Space } from 'antd';
import {
  DrillImportButton,
  DrillingSidePanel,
  DrillingTable,
  EquipmentButton,
} from '../../features/drilling';
import { t } from '../../shared/i18n/t';
import { PageColumns } from '../AppLayout';

/** Планирование бурения: drilling duration per block from its volume and the drilling equipment. */
export function DrillingPage() {
  return (
    <PageColumns
      center={
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <DrillImportButton />
            <EquipmentButton />
          </Space>
          <DrillingTable />
        </Space>
      }
      right={<DrillingSidePanel />}
      centerLabel={t('layout.drilling')}
      rightLabel={t('layout.calendar')}
    />
  );
}
