import { Button, Upload } from 'antd';
import { t } from '../../shared/i18n/t';
import { ImportFlowModals } from './ImportFlowModals';
import { useImport } from './useImport';

const ACCEPT = '.csv,.txt,.xlsx,.xlsm,.xls';

/** Upload button plus the modals of the extraction block import. */
export function ImportButton() {
  const flow = useImport();
  const { step, handleFile } = flow;

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
      <ImportFlowModals flow={flow} />
    </>
  );
}
