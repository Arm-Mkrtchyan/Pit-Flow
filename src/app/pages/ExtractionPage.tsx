import { ActualsButton } from '../../features/actuals';
import { CalendarPanel } from '../../features/calendar';
import { SchedulePanel } from '../../features/schedule';
import { SettingsDrawer } from '../../features/settings';
import { t } from '../../shared/i18n/t';
import { PageColumns } from '../AppLayout';
import { BlocksPanel } from './BlocksPanel';

/** Планирование добычи: the extraction scheduler. */
export function ExtractionPage() {
  return (
    <>
      <PageColumns
        left={<BlocksPanel extra={<ActualsButton />} />}
        center={<SchedulePanel />}
        right={<CalendarPanel />}
        centerLabel={t('layout.schedule')}
        rightLabel={t('layout.calendar')}
      />
      <SettingsDrawer />
    </>
  );
}
