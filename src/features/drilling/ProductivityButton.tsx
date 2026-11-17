import { useState } from 'react';
import { Alert, App, Button, Modal, Popconfirm, Space, Table, Tag, Upload } from 'antd';
import { t, unit } from '../../shared/i18n/t';
import { fmtInt, fmtNumber } from '../../shared/format';
import { useAppStore } from '../../store';
import type { DrillModel } from '../../types/domain';
import { readBlockFile, type ParsedFile } from '../import';
import { defaultModels } from './defaults';
import { modelFromCard, parseEquipmentCards, type CardIssue } from './equipmentCard';
import { parseEquipment, type ParsedEquipment } from './parseEquipment';

const ACCEPT = '.csv,.txt,.xlsx,.xlsm,.xls';
const DEFAULT_HOURS = 24;

const positionLabel = (p: string) => (p === '*' ? t('drilling.anyPosition') : p.toUpperCase());

interface Preview {
  name: string;
  parsed: ParsedEquipment;
  cardIssues: CardIssue[];
}

/** The approved workbook (parameter cards per model) or, failing that, the flat format. */
function parseProductivityFile(file: ParsedFile): Omit<Preview, 'name'> {
  const grid = [
    ...Array.from({ length: file.headerRowNumber - 1 }, () => []),
    file.headers,
    ...file.rows,
  ];
  const cards = parseEquipmentCards(grid);
  if (cards) {
    return {
      parsed: { models: cards.cards.map(modelFromCard), issues: [] },
      cardIssues: cards.issues,
    };
  }
  return { parsed: parseEquipment(file), cardIssues: [] };
}

/** Productivity per rig model: table of the models (used in the preview and the list). */
export function ModelTable({ models }: { models: readonly DrillModel[] }) {
  return (
    <Table<DrillModel>
      size="small"
      rowKey="id"
      pagination={false}
      dataSource={[...models]}
      columns={[
        { title: t('drilling.col.model'), dataIndex: 'name' },
        {
          title: t('drilling.col.hours'),
          width: 110,
          render: (_: unknown, m) => fmtNumber(m.hoursPerDay),
        },
        {
          title: `${t('drilling.col.position')}: ${t('drilling.col.productivity')} · ${t('drilling.col.blastIndex')}`,
          render: (_: unknown, m) =>
            Object.entries(m.byPosition).map(([p, v]) => (
              <Tag key={p}>
                {positionLabel(p)}: {fmtInt(v.productivity * (m.hoursPerDay ?? DEFAULT_HOURS))}{' '}
                {unit('lm/d')} · {fmtNumber(v.blastIndex)} {unit('m³/lm')}
              </Tag>
            )),
        },
      ]}
    />
  );
}

/** Upload the productivity of rig models (approved workbook), preview it, then replace it. */
export function ProductivityButton() {
  const { message } = App.useApp();
  const setModels = useAppStore((s) => s.setModels);
  const models = useAppStore((s) => s.drilling.models);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const handle = async (file: File) => {
    setLoading(true);
    try {
      const { file: parsedFile } = await readBlockFile(file.name, await file.arrayBuffer());
      setPreview({ name: file.name, ...parseProductivityFile(parsedFile) });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      void message.error(t('import.failed', { name: file.name, error }));
    } finally {
      setLoading(false);
    }
  };

  const missing = preview?.parsed.issues.find((i) => i.kind === 'missingColumns');
  const badRows = preview?.parsed.issues.flatMap((i) => (i.kind === 'badRow' ? [i.row] : [])) ?? [];

  const upload = (
    <Upload
      accept={ACCEPT}
      showUploadList={false}
      beforeUpload={(file) => {
        void handle(file);
        return false;
      }}
    >
      <Button type="primary" loading={loading}>
        {t('drilling.productivity.upload')}
      </Button>
    </Upload>
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {t('drilling.productivity.button', { count: models.length })}
      </Button>
      <Modal
        open={open}
        width={760}
        title={t('drilling.productivity.title')}
        onCancel={() => setOpen(false)}
        footer={
          <Space>
            <Popconfirm
              title={t('drilling.productivity.resetConfirm')}
              okText={t('drilling.equipmentReset')}
              cancelText={t('common.cancel')}
              onConfirm={() => {
                setModels(defaultModels());
                void message.success(t('drilling.productivity.resetDone'));
              }}
            >
              <Button>{t('drilling.equipmentReset')}</Button>
            </Popconfirm>
            {upload}
            <Button onClick={() => setOpen(false)}>{t('common.close')}</Button>
          </Space>
        }
      >
        <ModelTable models={models} />
      </Modal>
      {preview && (
        <Modal
          open
          width={760}
          title={t('drilling.productivity.preview', { name: preview.name })}
          okText={t('drilling.equipmentApply')}
          okButtonProps={{ disabled: preview.parsed.models.length === 0 }}
          onOk={() => {
            setModels(preview.parsed.models);
            void message.success(
              t('drilling.productivity.applied', { count: preview.parsed.models.length }),
            );
            setPreview(null);
          }}
          onCancel={() => setPreview(null)}
        >
          {missing && missing.kind === 'missingColumns' && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('drilling.equipmentMissingColumns', {
                fields: missing.fields.map((f) => t(`drilling.col.${f}`)).join(', '),
              })}
            />
          )}
          {badRows.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('drilling.equipmentBadRows', { rows: badRows.slice(0, 20).join(', ') })}
            />
          )}
          {preview.cardIssues.map((i) => (
            <Alert
              key={i.model}
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('drilling.equipmentBadCard', {
                model: i.model,
                fields: i.fields.join(', '),
              })}
            />
          ))}
          {preview.parsed.models.length > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('drilling.productivity.replace')}
            />
          )}
          <ModelTable models={preview.parsed.models} />
        </Modal>
      )}
    </>
  );
}
