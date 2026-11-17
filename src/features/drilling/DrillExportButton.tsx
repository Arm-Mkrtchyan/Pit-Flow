import { useState } from 'react';
import { App, Button } from 'antd';
import type { DrillRig } from '../../types/domain';
import { t } from '../../shared/i18n/t';
import { drillingFileName, exportDrillingXlsx } from './drillingXlsx';
import { useDrillingTable } from './useDrillingTable';

/** Downloads the drilling table as a styled Excel file, in the current UI language. */
export function DrillExportButton() {
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const { rows, days, range, rigs, hasBlocks } = useDrillingTable();

  const run = async () => {
    setBusy(true);
    try {
      const rigsById = new Map<string, DrillRig>(rigs.map((r) => [r.id, r]));
      await exportDrillingXlsx(rows, days, rigsById, drillingFileName(range));
    } catch (e) {
      void message.error(t('export.failed', { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={() => void run()} loading={busy} disabled={!hasBlocks || days.length === 0}>
      {t('drilling.export.button')}
    </Button>
  );
}
