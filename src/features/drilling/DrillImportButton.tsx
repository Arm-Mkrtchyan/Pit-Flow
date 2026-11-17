import { useCallback, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Col,
  Modal,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { t } from '../../shared/i18n/t';
import { useAppStore } from '../../store';
import { fromIso } from '../calendar';
import { readBlockFile, type ImportIssue } from '../import';
import { parseProductionSchedule, type DrillImportResult } from './parseSchedule';

const ACCEPT = '.csv,.txt,.xlsx,.xlsm,.xls';

type Step =
  | { kind: 'idle' }
  | { kind: 'reading'; name: string }
  | { kind: 'summary'; name: string; result: DrillImportResult };

/** Reads a production schedule and replaces the drilling block list. */
function useDrillImport() {
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const { message } = App.useApp();

  const handleFile = useCallback(
    async (f: File) => {
      setStep({ kind: 'reading', name: f.name });
      try {
        const { file } = await readBlockFile(f.name, await f.arrayBuffer());
        const result = parseProductionSchedule(file);
        if (result.blocks.length > 0) useAppStore.getState().setDrillBlocks(result.blocks);
        setStep({ kind: 'summary', name: f.name, result });
      } catch (e) {
        setStep({ kind: 'idle' });
        const error = e instanceof Error ? e.message : String(e);
        void message.error(t('import.failed', { name: f.name, error }));
      }
    },
    [message],
  );

  const close = useCallback(() => setStep({ kind: 'idle' }), []);
  return { step, handleFile, close };
}

/** Upload button for the drilling page's block list (production schedule CSV/XLSX). */
export function DrillImportButton() {
  const { step, handleFile, close } = useDrillImport();

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
        <Button type="primary" loading={step.kind === 'reading'}>
          {step.kind === 'reading'
            ? t('import.reading', { name: step.name })
            : t('drilling.import.upload')}
        </Button>
      </Upload>
      {step.kind === 'summary' && (
        <DrillImportSummary name={step.name} result={step.result} onClose={close} />
      )}
    </>
  );
}

function DrillImportSummary({
  name,
  result,
  onClose,
}: {
  name: string;
  result: DrillImportResult;
  onClose: () => void;
}) {
  const skipped = result.totalRows - result.usedRows;
  return (
    <Modal
      open
      width={720}
      title={t('import.summary.title', { name })}
      onCancel={onClose}
      onOk={onClose}
      okText={t('common.close')}
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      {result.blocks.length === 0 && (
        <Alert
          type="error"
          showIcon
          message={t('import.summary.nothing')}
          style={{ marginBottom: 12 }}
        />
      )}
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <Statistic title={t('import.summary.rows')} value={result.totalRows} />
        </Col>
        <Col span={6}>
          <Statistic title={t('drilling.import.locations')} value={result.blocks.length} />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('import.summary.skipped')}
            value={skipped}
            valueStyle={skipped ? { color: '#cf1322' } : undefined}
          />
        </Col>
      </Row>
      {result.period && (
        <Typography.Paragraph type="secondary">
          {t('drilling.import.period', {
            from: fromIso(result.period[0]).format('DD.MM.YYYY'),
            to: fromIso(result.period[1]).format('DD.MM.YYYY'),
          })}
        </Typography.Paragraph>
      )}
      {result.issues.length > 0 && (
        <Table<ImportIssue>
          size="small"
          rowKey={(r) => `${r.row}-${r.level}-${r.message}`}
          dataSource={result.issues}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          columns={[
            { title: t('import.summary.row'), dataIndex: 'row', width: 70 },
            {
              title: t('import.summary.level'),
              dataIndex: 'level',
              width: 100,
              render: (level: ImportIssue['level']) =>
                level === 'error' ? (
                  <Tag color="red">{t('import.summary.error')}</Tag>
                ) : (
                  <Tag color="gold">{t('import.summary.warning')}</Tag>
                ),
            },
            { title: t('import.summary.message'), dataIndex: 'message' },
          ]}
        />
      )}
    </Modal>
  );
}
