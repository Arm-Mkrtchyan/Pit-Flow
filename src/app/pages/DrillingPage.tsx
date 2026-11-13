import { DrillingPanel } from '../../features/drilling';
import { t } from '../../shared/i18n/t';
import { PageColumns } from '../AppLayout';
import { BlocksPanel } from './BlocksPanel';

/** Планирование бурения: drilling duration per block from its volume and the drilling equipment. */
export function DrillingPage() {
  return (
    <PageColumns
      left={<BlocksPanel />}
      center={<DrillingPanel />}
      centerLabel={t('layout.drilling')}
    />
  );
}
