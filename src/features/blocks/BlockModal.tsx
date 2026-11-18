import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Form,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { t, unit } from '../../shared/i18n/t';
import { fmtGpt, fmtGrade, fmtNumber, fmtTonnes } from '../../shared/format';
import { classifyBlock } from '../../shared/utils/blockClass';
import { compareBlocks } from '../../shared/utils/ids';
import { materialColor } from '../../shared/utils/materialColor';
import { effectiveBlock } from '../../shared/utils/effectiveBlock';
import { formatThousands, parseThousands } from '../../shared/ui/numberInput';
import { useAppStore } from '../../store';
import { fromIso } from '../calendar';
import type { Block, BlockId, BlockUserInput, GradeField } from '../../types/domain';
import { childrenOf, findCycleIfSet, formatChain, graphFromInputs } from './dependencyGraph';

const GRADE_FIELDS: readonly GradeField[] = ['cu', 'mo', 'eq', 'as', 'pb'];
/** Draft grade values; null = empty field (falls back to the file value). */
type GradeDraft = Record<GradeField, number | null>;

/** Container: renders the modal for the block selected in the store, if any. */
export function BlockModal() {
  const openBlockId = useAppStore((s) => s.openBlockId);
  const block = useAppStore((s) => s.blocks.find((b) => b.id === s.openBlockId));
  const input = useAppStore((s) => (s.openBlockId ? s.userInputs[s.openBlockId] : undefined));
  if (!openBlockId || !block || !input) return null;
  // key resets the draft state whenever another block is opened.
  return <BlockModalContent key={block.id} block={block} input={input} />;
}

function BlockModalContent({ block, input }: { block: Block; input: BlockUserInput }) {
  const blocks = useAppStore((s) => s.blocks);
  const userInputs = useAppStore((s) => s.userInputs);
  const settings = useAppStore((s) => s.settings);
  const openBlock = useAppStore((s) => s.openBlock);
  const setRemaining = useAppStore((s) => s.setRemaining);
  const setDependsOn = useAppStore((s) => s.setDependsOn);
  const setGrades = useAppStore((s) => s.setGrades);

  const [remaining, setRemainingDraft] = useState<number | null>(input.remaining);
  const [parent, setParent] = useState<BlockId | undefined>(input.dependsOn[0]);
  // Current grades of the remaining material (file values, or recalculated from actuals / edited).
  const [grades, setGradesDraft] = useState<GradeDraft>(() => {
    const current = effectiveBlock(block, input);
    return {
      cu: current.cu,
      mo: current.mo,
      eq: current.eq,
      as: current.as ?? null,
      pb: current.pb ?? null,
    };
  });

  const graph = useMemo(() => graphFromInputs(userInputs), [userInputs]);
  const cycle = useMemo(
    () => (parent ? findCycleIfSet(graph, block.id, [parent]) : null),
    [graph, block.id, parent],
  );
  const children = useMemo(() => childrenOf(graph, block.id), [graph, block.id]);

  const options = useMemo(
    () =>
      [...blocks]
        .filter((b) => b.id !== block.id)
        .sort(compareBlocks)
        .map((b) => ({
          value: b.id,
          label: t('blockModal.optionLabel', {
            id: b.id,
            material: b.material,
            remaining: fmtTonnes(userInputs[b.id]?.remaining),
          }),
        })),
    [blocks, block.id, userInputs],
  );

  // An empty grade field means the file value.
  const current: Block = {
    ...block,
    cu: grades.cu ?? block.cu,
    mo: grades.mo ?? block.mo,
    eq: grades.eq ?? block.eq,
    as: grades.as ?? block.as,
    pb: grades.pb ?? block.pb,
  };
  const cls = classifyBlock(current, settings.oreCutoffEq);
  /** Editable grade, with a link back to the file value when it differs. */
  const gradeInput = (f: GradeField) => {
    const pct = f === 'cu' || f === 'mo' || f === 'eq';
    const fmt = pct ? fmtGrade : fmtGpt;
    const u = pct ? unit('%') : unit('g/t');
    const fileV = block[f];
    const v = grades[f];
    const differs = fileV !== undefined && v !== null && fmt(v) !== fmt(fileV);
    return (
      <Space direction="vertical" size={0}>
        <InputNumber<number>
          size="small"
          style={{ width: 150 }}
          min={0}
          step={pct ? 0.01 : 1}
          precision={pct ? 4 : 2}
          value={v}
          placeholder={fileV === undefined ? undefined : fmt(fileV)}
          addonAfter={u}
          onChange={(x) => setGradesDraft((d) => ({ ...d, [f]: x }))}
          onPressEnter={save}
          aria-label={t(`field.${f}`)}
        />
        {differs && (
          <Typography.Link
            style={{ fontSize: 12 }}
            onClick={() => setGradesDraft((d) => ({ ...d, [f]: fileV }))}
          >
            {t('blockModal.resetToFile', { value: `${fmt(fileV)} ${u}` })}
          </Typography.Link>
        )}
      </Space>
    );
  };
  const parentRemaining = parent ? (userInputs[parent]?.remaining ?? 0) : 0;
  const remainingValid = remaining !== null && remaining >= 0 && remaining <= block.weight;
  const canSave = remainingValid && cycle === null;

  const close = () => openBlock(null);
  const save = () => {
    if (!canSave) return;
    const result = setDependsOn(block.id, parent ? [parent] : []);
    if (!result.ok) return; // cycle shown inline; should not happen since canSave checked it
    setRemaining(block.id, remaining);
    const edited: Partial<Record<GradeField, number>> = {};
    for (const f of GRADE_FIELDS) {
      const v = grades[f];
      if (v !== null) edited[f] = v;
    }
    setGrades(block.id, edited);
    close();
  };

  const opt = (v: number | undefined, fmt: (n: number) => string, unit: string) =>
    v === undefined ? '—' : `${fmt(v)} ${unit}`;

  return (
    <Modal
      open
      width={640}
      title={
        <Space>
          {t('blockModal.title', { id: block.id })}
          <Tag color={materialColor(block.material)}>{block.material}</Tag>
          <Tag color={cls === 'ore' ? 'green' : 'default'}>{t(`class.${cls}`)}</Tag>
        </Space>
      }
      okText={t('blockModal.save')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: !canSave }}
      onOk={save}
      onCancel={close}
    >
      <Descriptions size="small" bordered column={2} title={t('blockModal.properties')}>
        <Descriptions.Item label={t('field.elevation')}>
          {fmtNumber(block.elevation)} {unit('m')}
        </Descriptions.Item>
        <Descriptions.Item label={t('field.group')}>{fmtNumber(block.group)}</Descriptions.Item>
        <Descriptions.Item label={t('field.weight')}>
          {fmtTonnes(block.weight)} {unit('t')}
        </Descriptions.Item>
        <Descriptions.Item label={t('field.volume')}>
          {opt(block.volume, fmtTonnes, unit('m³'))}
        </Descriptions.Item>
        <Descriptions.Item label={t('field.density')}>
          {opt(block.density, fmtNumber, unit('t/m³'))}
        </Descriptions.Item>
        <Descriptions.Item label={t('blockModal.sourceRow')}>{block.sourceRow}</Descriptions.Item>
        {block.site && (
          <Descriptions.Item label={t('field.site')} span={2}>
            {block.site}
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t('field.cu')}>{gradeInput('cu')}</Descriptions.Item>
        <Descriptions.Item label={t('field.mo')}>{gradeInput('mo')}</Descriptions.Item>
        <Descriptions.Item label={t('field.eq')} span={2}>
          <Space wrap>
            {gradeInput('eq')}
            <Typography.Text type="secondary">
              (
              {t('blockModal.classHint', {
                eq: fmtGrade(current.eq),
                cutoff: fmtGrade(settings.oreCutoffEq),
              })}
              )
            </Typography.Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={t('field.as')}>{gradeInput('as')}</Descriptions.Item>
        <Descriptions.Item label={t('field.pb')}>{gradeInput('pb')}</Descriptions.Item>
      </Descriptions>
      <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
        {t('blockModal.gradesHint')}
      </Typography.Text>
      {input.actuals && (
        <Alert
          style={{ marginTop: 12 }}
          type={input.actuals.overrun > 0 ? 'warning' : 'info'}
          showIcon
          message={t('blockModal.actuals', {
            tonnes: fmtTonnes(input.actuals.tonnes),
            date: fromIso(input.actuals.before).format('DD.MM.YYYY'),
          })}
          description={
            input.actuals.overrun > 0
              ? t('blockModal.actualsOverrun', { tonnes: fmtTonnes(input.actuals.overrun) })
              : undefined
          }
        />
      )}

      <Divider style={{ margin: '16px 0' }} />

      <Form layout="vertical" onFinish={save} component="div">
        <Form.Item
          label={t('blockModal.remaining')}
          help={t('blockModal.remainingHint', { weight: fmtTonnes(block.weight) })}
          validateStatus={remainingValid ? undefined : 'error'}
        >
          <Space.Compact style={{ width: '100%' }}>
            <InputNumber<number>
              autoFocus
              style={{ width: '100%' }}
              min={0}
              max={block.weight}
              step={1000}
              value={remaining}
              formatter={formatThousands}
              parser={parseThousands}
              onChange={setRemainingDraft}
              onPressEnter={save}
              aria-label={t('blockModal.remaining')}
            />
            <Button onClick={() => setRemainingDraft(block.weight)}>
              {t('blockModal.setFull')}
            </Button>
            <Button onClick={() => setRemainingDraft(0)}>{t('blockModal.setZero')}</Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item
          label={t('blockModal.dependency')}
          extra={t('blockModal.dependencyHint', {
            threshold: fmtTonnes(settings.releaseThreshold),
          })}
          validateStatus={cycle ? 'error' : undefined}
          style={{ marginTop: 24 }}
        >
          <Select<BlockId>
            showSearch
            allowClear
            optionFilterProp="label"
            placeholder={t('blockModal.dependencyNone')}
            value={parent}
            onChange={setParent}
            options={options}
            aria-label={t('blockModal.dependency')}
          />
        </Form.Item>
        {cycle && (
          <Alert
            type="error"
            showIcon
            message={
              cycle.length === 2 && cycle[0] === cycle[1]
                ? t('blockModal.self')
                : t('blockModal.cycle', { chain: formatChain(cycle) })
            }
          />
        )}
        {!cycle && parent && parentRemaining > 0 && (
          <Alert
            type="info"
            showIcon
            message={t('blockModal.lockedNow', { remaining: fmtTonnes(parentRemaining) })}
          />
        )}
      </Form>

      {children.length > 0 && (
        <>
          <Divider style={{ margin: '16px 0 8px' }} />
          <Typography.Text type="secondary">{t('blockModal.children')}: </Typography.Text>
          <Space size={4} wrap>
            {children.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </Space>
        </>
      )}
    </Modal>
  );
}
