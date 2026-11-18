import { ResourcesPanel } from '../../features/resources';
import { t } from '../../shared/i18n/t';
import { PageColumns } from '../AppLayout';

/** Ресурсы: actual exported ore per block written into the resource file. */
export function ResourcesPage() {
  return <PageColumns center={<ResourcesPanel />} centerLabel={t('page.resources')} />;
}
