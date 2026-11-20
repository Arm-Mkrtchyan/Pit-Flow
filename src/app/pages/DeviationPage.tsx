import { DeviationPanel } from '../../features/deviation';
import { t } from '../../shared/i18n/t';
import { PageColumns } from '../AppLayout';

/** Расчёт отклонения: work order / plan / actual by block and date. */
export function DeviationPage() {
  return <PageColumns center={<DeviationPanel />} centerLabel={t('page.deviation')} />;
}
