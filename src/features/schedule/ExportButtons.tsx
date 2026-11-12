import { useState } from 'react';
import { App, Button, Space, Tooltip } from 'antd';
import { t } from '../../shared/i18n/t';
import { useAppStore } from '../../store';
import { exportCsv, exportFileName, exportXlsx, scheduleToSheets } from '../export';
import { computeResults } from './diagnostics';

export function ExportButtons() {
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const stale = useAppStore((s) => s.solution.stale);

  const sheets = () => {
    const s = useAppStore.getState();
    const schedule = s.solution.schedule;
    if (!schedule) return null;
    const results = computeResults(schedule, s.blocks, s.userInputs, s.plan.targets, s.settings);
    const first = schedule.days[0]?.date;
    const last = schedule.days.at(-1)?.date;
    return {
      data: scheduleToSheets(schedule, results, s.blocks),
      range: first && last ? ([first, last] as const) : undefined,
    };
  };

  const run = async (kind: 'csv' | 'xlsx') => {
    const built = sheets();
    if (!built) return;
    setBusy(true);
    try {
      if (kind === 'csv') exportCsv(built.data, exportFileName(built.range, 'csv'));
      else await exportXlsx(built.data, exportFileName(built.range, 'xlsx'));
    } catch (e) {
      void message.error(t('export.failed', { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip title={stale ? t('export.staleHint') : undefined}>
      <Space.Compact>
        <Button size="small" onClick={() => void run('csv')} loading={busy}>
          {t('export.csv')}
        </Button>
        <Button size="small" onClick={() => void run('xlsx')} loading={busy}>
          {t('export.xlsx')}
        </Button>
      </Space.Compact>
    </Tooltip>
  );
}
