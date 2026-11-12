import { useMemo, useState } from 'react';
import { Alert, Modal, Select, Table, Tag, Typography } from 'antd';
import { t } from '../../shared/i18n/t';
import type { BlockFieldKey } from '../../types/domain';
import { FIELD_DEFS, REQUIRED_FIELDS, type FieldDef } from './columns';
import type { FieldMapping, ParsedFile } from './types';

interface Props {
  file: ParsedFile;
  initial: FieldMapping;
  onOk: (mapping: FieldMapping) => void;
  onCancel: () => void;
}

export function ColumnMappingModal({ file, initial, onOk, onCancel }: Props) {
  const [mapping, setMapping] = useState<FieldMapping>(initial);
  const firstRow = file.rows[0] ?? [];

  const options = useMemo(
    () => file.headers.map((h, i) => ({ value: i, label: h === '' ? `#${i + 1}` : h })),
    [file.headers],
  );

  const complete = REQUIRED_FIELDS.every((k) => mapping[k] !== undefined);
  const duplicate = useMemo(() => {
    const counts = new Map<number, number>();
    Object.values(mapping).forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1));
    const dup = [...counts.entries()].find(([, n]) => n > 1);
    return dup ? (file.headers[dup[0]] ?? `#${dup[0] + 1}`) : null;
  }, [mapping, file.headers]);

  const setField = (key: BlockFieldKey, value: number | undefined) =>
    setMapping((m) => {
      const next: FieldMapping = {};
      for (const def of FIELD_DEFS) {
        const idx = def.key === key ? value : m[def.key];
        if (idx !== undefined) next[def.key] = idx;
      }
      return next;
    });

  return (
    <Modal
      open
      width={680}
      title={t('import.mapping.title')}
      okText={t('import.mapping.ok')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: !complete || duplicate !== null }}
      onOk={() => onOk(mapping)}
      onCancel={onCancel}
    >
      <Typography.Paragraph>
        {t('import.mapping.intro', { name: file.fileName })}
      </Typography.Paragraph>
      {duplicate !== null && (
        <Alert
          type="error"
          showIcon
          message={t('import.mapping.duplicate', { column: duplicate })}
        />
      )}
      <Table<FieldDef>
        size="small"
        pagination={false}
        rowKey="key"
        dataSource={FIELD_DEFS}
        columns={[
          {
            title: t('import.mapping.field'),
            render: (_, def) => (
              <>
                {t(def.labelKey)}{' '}
                {def.required && <Tag color="red">{t('import.mapping.required')}</Tag>}
              </>
            ),
          },
          {
            title: t('import.mapping.column'),
            width: 260,
            render: (_, def) => (
              <Select<number>
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
                placeholder={t('import.mapping.notMapped')}
                status={def.required && mapping[def.key] === undefined ? 'error' : undefined}
                value={mapping[def.key]}
                options={options}
                onChange={(v) => setField(def.key, v)}
              />
            ),
          },
          {
            title: t('import.mapping.sample'),
            render: (_, def) => {
              const idx = mapping[def.key];
              const v = idx === undefined ? undefined : firstRow[idx];
              return <Typography.Text type="secondary">{v ?? ''}</Typography.Text>;
            },
          },
        ]}
      />
    </Modal>
  );
}
