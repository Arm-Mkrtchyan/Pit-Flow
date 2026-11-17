import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  Upload,
} from 'antd';
import { t, unit } from '../../shared/i18n/t';
import { fmtInt } from '../../shared/format';
import { useAppStore } from '../../store';
import type { DrillModel, DrillUnit } from '../../types/domain';
import { readBlockFile } from '../import';
import { defaultRigs } from './defaults';
import { parseRigList, type ParsedRigList } from './rigList';

const ACCEPT = '.csv,.txt,.xlsx,.xlsm,.xls';
const DEFAULT_HOURS = 24;

/** Daily metres of a model at "any position" (or its first position). */
function dailyLm(model: DrillModel | undefined): number | null {
  if (!model) return null;
  const perf = model.byPosition['*'] ?? Object.values(model.byPosition)[0];
  return perf ? perf.productivity * (model.hoursPerDay ?? DEFAULT_HOURS) : null;
}

/** Working rigs with their productivity model; the model can be changed when `onModel` is set. */
function RigTable({
  rigs,
  models,
  onModel,
}: {
  rigs: readonly DrillUnit[];
  models: readonly DrillModel[];
  onModel?: (rigId: string, modelId: string | null) => void;
}) {
  const byId = new Map(models.map((m) => [m.id, m]));
  const options = models.map((m) => ({ value: m.id, label: m.name }));
  return (
    <Table<DrillUnit>
      size="small"
      rowKey="id"
      pagination={false}
      dataSource={[...rigs]}
      columns={[
        { title: t('drilling.col.name'), dataIndex: 'name', width: 160 },
        {
          title: t('drilling.col.model'),
          render: (_: unknown, r) =>
            onModel ? (
              <Select<string>
                size="small"
                allowClear
                style={{ width: '100%' }}
                placeholder={t('drilling.rigs.noModel')}
                status={r.modelId === null ? 'warning' : undefined}
                value={r.modelId ?? undefined}
                options={options}
                onChange={(v) => onModel(r.id, v ?? null)}
                aria-label={t('drilling.col.model')}
              />
            ) : r.modelId !== null ? (
              byId.get(r.modelId)?.name
            ) : (
              <Typography.Text type="warning">{t('drilling.rigs.noModel')}</Typography.Text>
            ),
        },
        {
          title: `${t('drilling.col.productivity')}, ${unit('lm/d')}`,
          width: 150,
          align: 'right',
          render: (_: unknown, r) => {
            const lm = dailyLm(r.modelId !== null ? byId.get(r.modelId) : undefined);
            return lm === null ? '—' : fmtInt(lm);
          },
        },
      ]}
    />
  );
}

/** The working rigs offered in the drilling table: view, change models, upload a new list. */
export function RigListButton() {
  const { message } = App.useApp();
  const rigs = useAppStore((s) => s.drilling.rigs);
  const models = useAppStore((s) => s.drilling.models);
  const setRigs = useAppStore((s) => s.setRigs);
  const setRigModel = useAppStore((s) => s.setRigModel);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ name: string; parsed: ParsedRigList } | null>(null);
  const unmatched = rigs.filter((r) => r.modelId === null).length;

  const handle = async (file: File) => {
    setLoading(true);
    try {
      const { file: f } = await readBlockFile(file.name, await file.arrayBuffer());
      const grid = [
        ...Array.from({ length: f.headerRowNumber - 1 }, () => []),
        f.headers,
        ...f.rows,
      ];
      setPreview({ name: file.name, parsed: parseRigList(grid, models) });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      void message.error(t('import.failed', { name: file.name, error }));
    } finally {
      setLoading(false);
    }
  };

  const previewUnmatched = preview?.parsed.rigs.filter((r) => r.modelId === null) ?? [];

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {t('drilling.rigs.button', { count: rigs.length })}
      </Button>
      <Modal
        open={open}
        width={640}
        title={t('drilling.rigs.title')}
        onCancel={() => setOpen(false)}
        footer={
          <Space>
            <Popconfirm
              title={t('drilling.rigs.resetConfirm')}
              okText={t('drilling.equipmentReset')}
              cancelText={t('common.cancel')}
              onConfirm={() => {
                setRigs(defaultRigs(models));
                void message.success(t('drilling.rigs.resetDone'));
              }}
            >
              <Button>{t('drilling.equipmentReset')}</Button>
            </Popconfirm>
            <Upload
              accept={ACCEPT}
              showUploadList={false}
              beforeUpload={(file) => {
                void handle(file);
                return false;
              }}
            >
              <Button type="primary" loading={loading}>
                {t('drilling.rigs.upload')}
              </Button>
            </Upload>
            <Button onClick={() => setOpen(false)}>{t('common.close')}</Button>
          </Space>
        }
      >
        {unmatched > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message={t('drilling.rigs.unmatched', { count: unmatched })}
          />
        )}
        <RigTable rigs={rigs} models={models} onModel={setRigModel} />
      </Modal>
      {preview && (
        <Modal
          open
          width={640}
          title={t('drilling.rigs.preview', { name: preview.name })}
          okText={t('drilling.equipmentApply')}
          okButtonProps={{ disabled: preview.parsed.rigs.length === 0 }}
          onOk={() => {
            setRigs(preview.parsed.rigs);
            void message.success(t('drilling.rigs.applied', { count: preview.parsed.rigs.length }));
            setPreview(null);
          }}
          onCancel={() => setPreview(null)}
        >
          {preview.parsed.rigs.length === 0 && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('import.summary.nothing')}
            />
          )}
          {preview.parsed.skipped.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('drilling.rigs.skipped', { rows: preview.parsed.skipped.join(', ') })}
            />
          )}
          {previewUnmatched.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('drilling.rigs.unmatched', { count: previewUnmatched.length })}
            />
          )}
          {preview.parsed.rigs.length > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('drilling.equipmentReplace')}
            />
          )}
          <RigTable rigs={preview.parsed.rigs} models={models} />
        </Modal>
      )}
    </>
  );
}
