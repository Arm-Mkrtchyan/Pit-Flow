import { useState } from 'react';
import { Alert, App, Button, Modal, Table, Tag, Upload } from 'antd';
import { t, unit } from '../../shared/i18n/t';
import { fmtNumber } from '../../shared/format';
import { useAppStore } from '../../store';
import type { DrillRig } from '../../types/domain';
import { readBlockFile } from '../import';
import { parseEquipment, type ParsedEquipment } from './parseEquipment';

const ACCEPT = '.csv,.txt,.xlsx,.xlsm,.xls';

const positionLabel = (p: string) => (p === '*' ? t('drilling.anyPosition') : p.toUpperCase());

/** Upload the drilling equipment list, preview it, then replace the current list. */
export function EquipmentButton() {
  const { message } = App.useApp();
  const setRigs = useAppStore((s) => s.setRigs);
  const rigCount = useAppStore((s) => s.drilling.rigs.length);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ name: string; parsed: ParsedEquipment } | null>(null);

  const handle = async (file: File) => {
    setLoading(true);
    try {
      const { file: parsedFile } = await readBlockFile(file.name, await file.arrayBuffer());
      setPreview({ name: file.name, parsed: parseEquipment(parsedFile) });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      void message.error(t('import.failed', { name: file.name, error }));
    } finally {
      setLoading(false);
    }
  };

  const missing = preview?.parsed.issues.find((i) => i.kind === 'missingColumns');
  const badRows = preview?.parsed.issues.flatMap((i) => (i.kind === 'badRow' ? [i.row] : [])) ?? [];

  return (
    <>
      <Upload
        accept={ACCEPT}
        showUploadList={false}
        beforeUpload={(file) => {
          void handle(file);
          return false;
        }}
      >
        <Button loading={loading}>
          {rigCount > 0
            ? t('drilling.equipmentLoaded', { count: rigCount })
            : t('drilling.uploadEquipment')}
        </Button>
      </Upload>
      {preview && (
        <Modal
          open
          width={760}
          title={t('drilling.equipmentPreview', { name: preview.name })}
          okText={t('drilling.equipmentApply')}
          okButtonProps={{ disabled: preview.parsed.rigs.length === 0 }}
          onOk={() => {
            setRigs(preview.parsed.rigs);
            void message.success(
              t('drilling.equipmentApplied', { count: preview.parsed.rigs.length }),
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
          {rigCount > 0 && preview.parsed.rigs.length > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('drilling.equipmentReplace')}
            />
          )}
          <Table<DrillRig>
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={preview.parsed.rigs}
            columns={[
              { title: t('drilling.col.name'), dataIndex: 'name' },
              { title: t('drilling.col.model'), dataIndex: 'model' },
              {
                title: `${t('drilling.col.hours')}`,
                render: (_: unknown, r) => fmtNumber(r.hoursPerDay),
              },
              {
                title: `${t('drilling.col.position')}: ${t('drilling.col.productivity')} · ${t('drilling.col.blastIndex')}`,
                render: (_: unknown, r) =>
                  Object.entries(r.byPosition).map(([p, v]) => (
                    <Tag key={p}>
                      {positionLabel(p)}: {fmtNumber(v.productivity)} {unit('lm/h')} ·{' '}
                      {fmtNumber(v.blastIndex)} {unit('m³/lm')}
                    </Tag>
                  )),
              },
            ]}
          />
        </Modal>
      )}
    </>
  );
}
