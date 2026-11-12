import { BlockList, BlockModal } from '../features/blocks';
import { CalendarPanel } from '../features/calendar';
import { ImportButton } from '../features/import';
import { ScheduleTable } from '../features/schedule';
import { AppLayout } from './AppLayout';
import styles from './AppLayout.module.css';

export function App() {
  return (
    <AppLayout
      left={
        <div className={styles.leftPanel}>
          <ImportButton />
          <BlockList />
          <BlockModal />
        </div>
      }
      center={<ScheduleTable />}
      right={<CalendarPanel />}
    />
  );
}
