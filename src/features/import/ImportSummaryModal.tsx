import { useMemo } from 'react';
import { Alert, Col, Descriptions, Modal, Row, Statistic, Table, Tag, Typography } from 'antd';
import { t } from '../../shared/i18n/t';
import { fmtNumber } from '../../shared/format';
import { classifyBlock } from '../../shared/utils/blockClass';
import { useAppStore } from '../../store';
import type { MergeReport } from './merge';
import type { FieldMapping, ImportIssue, MappedResult, ParsedFile } from './types';

interface Props {
  file: ParsedFile;
  mapping: FieldMapping;
  parseErrors: string[];
  result: MappedResult;
  report?: MergeReport;
  onClose: () => void;
}

export function ImportSummaryModal({ file, mapping, parseErrors, result, report, onClose }: Props) {
  const cutoff = useAppStore((s) => s.settings.oreCutoffEq);
  const errors = result.issues.filter((i) => i.level === 'error').length;
  const warnings = result.issues.length - errors;
  const ore = result.blocks.filter((b) => classifyBlock(b, cutoff) === 'ore').length;

  const ignored = useMemo(() => {
    const used = new Set(Object.values(mapping));
    return file.headers.filter((h, i) => h !== '' && !used.has(i));
  }, [file.headers, mapping]);

  const format = [
    file.meta.kind.toUpperCase(),
    file.meta.encoding,
    file.meta.delimiter !== undefined
      ? `"${file.meta.delimiter === '\t' ? '\\t' : file.meta.delimiter}"`
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Modal
      open
      width={760}
      title={t('import.summary.title', { name: file.fileName })}
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
        <Col span={4}>
          <Statistic title={t('import.summary.rows')} value={result.totalRows} />
        </Col>
        <Col span={4}>
          <Statistic title={t('import.summary.imported')} value={result.blocks.length} />
        </Col>
        <Col span={4}>
          <Statistic
            title={t('import.summary.skipped')}
            value={errors}
            valueStyle={errors ? { color: '#cf1322' } : undefined}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title={t('import.summary.warnings')}
            value={warnings}
            valueStyle={warnings ? { color: '#d48806' } : undefined}
          />
        </Col>
        <Col span={4}>
          <Statistic title={t('import.summary.ore')} value={ore} />
        </Col>
        <Col span={4}>
          <Statistic title={t('import.summary.waste')} value={result.blocks.length - ore} />
        </Col>
      </Row>
      <Typography.Paragraph type="secondary">
        {t('import.summary.format')}: {format}
        {ignored.length > 0 && (
          <> · {t('import.summary.ignoredColumns', { columns: ignored.join(', ') })}</>
        )}
      </Typography.Paragraph>

      {report && (
        <Descriptions
          size="small"
          bordered
          column={1}
          title={t('import.summary.merge')}
          style={{ marginBottom: 12 }}
        >
          <Descriptions.Item label={t('import.summary.added')}>
            {fmtNumber(report.added)}
          </Descriptions.Item>
          <Descriptions.Item label={t('import.summary.updated')}>
            {fmtNumber(report.updated)}
          </Descriptions.Item>
          <Descriptions.Item label={t('import.summary.removed')}>
            {report.removed.length > 0 ? report.removed.join(', ') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('import.summary.droppedDeps')}>
            {report.droppedDependencies.length > 0 ? report.droppedDependencies.join(', ') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('import.summary.clamped')}>
            {report.clamped.length > 0 ? report.clamped.join(', ') : '—'}
          </Descriptions.Item>
        </Descriptions>
      )}

      {parseErrors.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={t('import.summary.parseErrors')}
          description={parseErrors.slice(0, 10).join('\n')}
          style={{ marginBottom: 12, whiteSpace: 'pre-line' }}
        />
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
