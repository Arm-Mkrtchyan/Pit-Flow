import { useState } from 'react';
import { App, Button, Tooltip, Upload } from 'antd';
import { t } from '../../shared/i18n/t';
import { useAppStore } from '../../store';
import { ActualsModal } from './ActualsModal';
import { ActualsFormatError, parseActualsWorkbook } from './parseActuals';
import type { ParsedActuals } from './types';

/** Upload the monthly plan/actual workbook and open the actuals preview. */
export function ActualsButton() {
  const { message } = App.useApp();
  const hasBlocks = useAppStore((s) => s.blocks.length > 0);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<{ fileName: string; parsed: ParsedActuals } | null>(null);

  const handle = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseActualsWorkbook(await file.arrayBuffer());
      if (parsed.rows.length === 0) void message.warning(t('actuals.empty', { name: file.name }));
      else setState({ fileName: file.name, parsed });
    } catch (e) {
      const error =
        e instanceof ActualsFormatError
          ? t('actuals.notFound')
          : e instanceof Error
            ? e.message
            : String(e);
      void message.error(t('import.failed', { name: file.name, error }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title={hasBlocks ? t('actuals.hint') : t('solve.needBlocks')}>
        <Upload
          accept=".xlsx,.xlsm,.xls"
          showUploadList={false}
          disabled={!hasBlocks}
          beforeUpload={(file) => {
            void handle(file);
            return false;
          }}
        >
          <Button block loading={loading} disabled={!hasBlocks}>
            {t('actuals.button')}
          </Button>
        </Upload>
      </Tooltip>
      {state && (
        <ActualsModal
          fileName={state.fileName}
          parsed={state.parsed}
          onClose={() => setState(null)}
        />
      )}
    </>
  );
}
