import { Button, Upload } from 'antd';
import { t } from '../../shared/i18n/t';
import { useAppStore } from '../../store';
import { ColumnMappingModal } from './ColumnMappingModal';
import { ImportSummaryModal } from './ImportSummaryModal';
import { ReimportModeModal } from './ReimportModeModal';
import { useImport } from './useImport';

const ACCEPT = '.csv,.txt,.xlsx,.xlsm,.xls';

/** Upload button plus the modals of the extraction block import. */
export function ImportButton() {
  const { step, handleFile, confirmMapping, chooseMode, close } = useImport();
  const existing = useAppStore((s) => s.blocks.length);

  return (
    <>
      <Upload
        accept={ACCEPT}
        showUploadList={false}
        beforeUpload={(file) => {
          void handleFile(file);
          return false;
        }}
      >
        <Button type="primary" block loading={step.kind === 'reading'}>
          {step.kind === 'reading' ? t('import.reading', { name: step.name }) : t('import.upload')}
        </Button>
      </Upload>

      {step.kind === 'mapping' && (
        <ColumnMappingModal
          file={step.file}
          initial={step.mapping}
          onOk={confirmMapping}
          onCancel={close}
        />
      )}
      {step.kind === 'reimport' && (
        <ReimportModeModal
          existing={existing}
          incoming={step.result.blocks.length}
          onChoose={chooseMode}
          onCancel={close}
        />
      )}
      {step.kind === 'summary' && (
        <ImportSummaryModal
          file={step.file}
          mapping={step.mapping}
          parseErrors={step.parseErrors}
          result={step.result}
          report={step.report}
          onClose={close}
        />
      )}
    </>
  );
}
