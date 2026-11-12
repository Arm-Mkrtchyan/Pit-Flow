import { useMemo, type ReactNode } from 'react';
import {
  Button,
  Divider,
  Drawer,
  Empty,
  Form,
  InputNumber,
  List,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { t, unit, type UnitCode } from '../../shared/i18n/t';
import { fmtTonnes } from '../../shared/format';
import { formatThousands, parseThousands } from '../../shared/ui/numberInput';
import { clearAllData, useAppStore } from '../../store';
import type { RowDescriptor, Settings } from '../../types/domain';
import { ROW_DESCRIPTORS } from '../schedule';

/** Plain numeric settings (roundingStep is a fixed choice, edited with a Select). */
type NumericKey = Exclude<
  { [K in keyof Settings]-?: Settings[K] extends number ? K : never }[keyof Settings],
  'roundingStep'
>;

interface NumField {
  key: NumericKey;
  label: Parameters<typeof t>[0];
  help?: Parameters<typeof t>[0];
  min: number;
  max: number;
  step: number;
  /** Displayed value = stored × scale (e.g. fractions shown as %). */
  scale?: number;
  precision?: number;
  thousands?: boolean;
  suffix?: UnitCode;
}

const GENERAL: NumField[] = [
  {
    key: 'oreCutoffEq',
    label: 'settings.oreCutoff',
    help: 'settings.oreCutoffHelp',
    min: 0,
    max: 100,
    step: 0.01,
    precision: 3,
    suffix: '%',
  },
  {
    key: 'releaseThreshold',
    label: 'settings.release',
    help: 'settings.releaseHelp',
    min: 0,
    max: 1e7,
    step: 1000,
    thousands: true,
    suffix: 't',
  },
  {
    key: 'amberThreshold',
    label: 'settings.amber',
    help: 'settings.amberHelp',
    min: 0,
    max: 100,
    step: 1,
    scale: 100,
    precision: 1,
    suffix: '%',
  },
];

const SOLVER: NumField[] = [
  { key: 'timeLimitSec', label: 'settings.timeLimit', min: 1, max: 3600, step: 5, suffix: 's' },
  {
    key: 'mipRelGap',
    label: 'settings.mipGap',
    help: 'settings.mipGapHelp',
    min: 0,
    max: 50,
    step: 0.5,
    scale: 100,
    precision: 2,
    suffix: '%',
  },
  {
    key: 'earlyDayPreference',
    label: 'settings.earlyDays',
    help: 'settings.earlyDaysHelp',
    min: 0,
    max: 5,
    step: 0.1,
    precision: 2,
  },
  {
    key: 'wasteCostPerTonne',
    label: 'settings.wasteCost',
    help: 'settings.wasteCostHelp',
    min: 0,
    max: 1,
    step: 0.000001,
    precision: 7,
  },
  {
    key: 'rollingHorizonAbove',
    label: 'settings.rolling',
    help: 'settings.rollingHelp',
    min: 100,
    max: 1e6,
    step: 1000,
    thousands: true,
  },
];

function NumberSetting({ field }: { field: NumField }) {
  const value = useAppStore((s) => s.settings[field.key]);
  const update = useAppStore((s) => s.updateSettings);
  const scale = field.scale ?? 1;
  return (
    <Form.Item label={t(field.label)} extra={field.help ? t(field.help) : undefined}>
      <InputNumber<number>
        style={{ width: 200 }}
        min={field.min}
        max={field.max}
        step={field.step}
        precision={field.precision}
        value={Number((value * scale).toPrecision(12))}
        formatter={field.thousands ? formatThousands : undefined}
        parser={field.thousands ? parseThousands : undefined}
        addonAfter={field.suffix ? unit(field.suffix) : undefined}
        onChange={(v) => {
          if (v !== null && Number.isFinite(v)) update({ [field.key]: v / scale });
        }}
        aria-label={t(field.label)}
      />
    </Form.Item>
  );
}

function RowSettingsTable() {
  const rows = useAppStore((s) => s.settings.rows);
  const update = useAppStore((s) => s.updateRowSettings);
  const targetRows = ROW_DESCRIPTORS.filter((d) => d.kind === 'target');
  const num = (
    desc: RowDescriptor,
    field: 'tolerance' | 'weightOut' | 'weightIn',
    scale: number,
    step: number,
  ): ReactNode => (
    <InputNumber<number>
      size="small"
      min={0}
      step={step}
      value={Number((rows[desc.key][field] * scale).toPrecision(12))}
      onChange={(v) => {
        if (v !== null && Number.isFinite(v)) update(desc.key, { [field]: v / scale });
      }}
      aria-label={`${t(desc.labelKey)} ${t(`settings.row.${field}`)}`}
      style={{ width: 90 }}
    />
  );
  return (
    <Table<RowDescriptor>
      size="small"
      pagination={false}
      rowKey="key"
      dataSource={targetRows}
      columns={[
        { title: t('settings.row.row'), render: (_, d) => t(d.labelKey) },
        {
          title: `${t('settings.row.tolerance')} (±%)`,
          render: (_, d) => num(d, 'tolerance', 100, 1),
        },
        { title: t('settings.row.weightOut'), render: (_, d) => num(d, 'weightOut', 1, 50) },
        { title: t('settings.row.weightIn'), render: (_, d) => num(d, 'weightIn', 1, 0.1) },
      ]}
    />
  );
}

function HistoryList() {
  const history = useAppStore((s) => s.history);
  const undo = useAppStore((s) => s.undoLastAcceptance);
  const items = useMemo(
    () =>
      history.map((h) => ({
        ...h,
        tonnes: Object.values(h.taken).reduce((s, v) => s + v, 0),
        blocks: Object.keys(h.taken).length,
      })),
    [history],
  );
  if (items.length === 0)
    return <Empty description={t('history.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  return (
    <List
      size="small"
      dataSource={items}
      renderItem={(h, i) => (
        <List.Item
          actions={
            i === 0
              ? [
                  <Popconfirm
                    key="undo"
                    title={t('undo.confirmTitle')}
                    onConfirm={() => undo()}
                    okText={t('undo.button')}
                    cancelText={t('common.cancel')}
                  >
                    <Button size="small">{t('undo.button')}</Button>
                  </Popconfirm>,
                ]
              : []
          }
        >
          <List.Item.Meta
            title={t('history.item', { start: h.range[0], end: h.range[1] })}
            description={t('history.detail', {
              when: dayjs(h.acceptedAt).format('DD.MM.YYYY HH:mm'),
              tonnes: fmtTonnes(h.tonnes),
              blocks: h.blocks,
            })}
          />
        </List.Item>
      )}
    />
  );
}

export function SettingsDrawer() {
  const open = useAppStore((s) => s.settingsOpen);
  const setOpen = useAppStore((s) => s.setSettingsOpen);
  const rounding = useAppStore((s) => s.settings.roundingStep);
  const update = useAppStore((s) => s.updateSettings);
  const reset = useAppStore((s) => s.resetSettings);

  return (
    <Drawer open={open} onClose={() => setOpen(false)} width={620} title={t('settings.title')}>
      <Typography.Paragraph type="secondary">{t('settings.staleNote')}</Typography.Paragraph>

      <Typography.Title level={5}>{t('settings.section.targets')}</Typography.Title>
      <Typography.Paragraph type="secondary">{t('settings.weightsHelp')}</Typography.Paragraph>
      <RowSettingsTable />

      <Divider />
      <Form layout="vertical" component="div">
        <Typography.Title level={5}>{t('settings.section.general')}</Typography.Title>
        {GENERAL.map((f) => (
          <NumberSetting key={f.key} field={f} />
        ))}

        <Typography.Title level={5}>{t('settings.section.solver')}</Typography.Title>
        <Form.Item label={t('settings.rounding')} extra={t('settings.roundingHelp')}>
          <Select<Settings['roundingStep']>
            style={{ width: 200 }}
            value={rounding}
            onChange={(v) => update({ roundingStep: v })}
            options={[1, 10, 100].map((v) => ({
              value: v as Settings['roundingStep'],
              label: `${v} ${unit('t')}`,
            }))}
            aria-label={t('settings.rounding')}
          />
        </Form.Item>
        {SOLVER.map((f) => (
          <NumberSetting key={f.key} field={f} />
        ))}
      </Form>

      <Space>
        <Popconfirm
          title={t('settings.resetConfirm')}
          onConfirm={reset}
          okText={t('settings.reset')}
          cancelText={t('common.cancel')}
        >
          <Button>{t('settings.reset')}</Button>
        </Popconfirm>
      </Space>

      <Divider />
      <Typography.Title level={5}>{t('history.title')}</Typography.Title>
      <HistoryList />

      <Divider />
      <Typography.Title level={5}>{t('settings.section.data')}</Typography.Title>
      <Typography.Paragraph type="secondary">{t('settings.clearHelp')}</Typography.Paragraph>
      <Popconfirm
        title={t('settings.clearConfirm')}
        onConfirm={() => void clearAllData()}
        okText={t('settings.clear')}
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel')}
      >
        <Button danger>{t('settings.clear')}</Button>
      </Popconfirm>
    </Drawer>
  );
}
