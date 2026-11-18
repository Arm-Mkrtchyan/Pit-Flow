import { memo } from 'react';
import { Space, Tag, Tooltip, Typography, theme } from 'antd';
import { t, unit } from '../../shared/i18n/t';
import { fmtGrade, fmtTonnes } from '../../shared/format';
import { materialColor } from '../../shared/utils/materialColor';
import type { BlockView } from './useBlockListView';
import styles from './BlockList.module.css';

/** Role of the item while dependencies are edited. */
export type DepMark = 'selected' | 'parent';

interface Props {
  view: BlockView;
  index: number;
  /** Roving-tabindex item (keyboard focus target). */
  active: boolean;
  /** Show the current-item background. */
  highlighted: boolean;
  mark?: DepMark;
  onOpen: (index: number) => void;
}

export const BlockListItem = memo(function BlockListItem({
  view,
  index,
  active,
  highlighted,
  mark,
  onOpen,
}: Props) {
  const { token } = theme.useToken();
  const { block, cls, remaining, exhausted, dependsOn, lockedBy } = view;
  const markColor =
    mark === 'selected' ? token.colorPrimary : mark === 'parent' ? token.colorWarning : undefined;
  const background =
    mark === 'selected'
      ? token.colorPrimaryBg
      : mark === 'parent'
        ? token.colorWarningBg
        : highlighted
          ? token.controlItemBgActive
          : undefined;
  return (
    <div
      role="option"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      data-index={index}
      className={styles.item}
      style={{
        opacity: exhausted && !mark ? 0.45 : 1,
        background,
        boxShadow: markColor ? `inset 3px 0 0 ${markColor}` : undefined,
        borderBottom: `1px solid ${token.colorSplit}`,
      }}
      onClick={() => onOpen(index)}
    >
      <div className={styles.itemTop}>
        <Typography.Text strong>{block.id}</Typography.Text>
        <Space size={2}>
          <Tag color={materialColor(block.material)} className={styles.tag}>
            {block.material}
          </Tag>
          {mark === 'parent' && (
            <Tag color="orange" className={styles.tag}>
              {t('blocks.dep.parentTag')}
            </Tag>
          )}
          {cls === 'waste' && <Tag className={styles.tag}>{t('class.waste')}</Tag>}
          {exhausted && <Tag className={styles.tag}>{t('blocks.exhausted')}</Tag>}
          {lockedBy.length > 0 && (
            <Tooltip title={t('blocks.lockedBy', { parents: lockedBy.join(', ') })}>
              <Tag color="orange" className={styles.tag}>
                {t('blocks.locked')}
              </Tag>
            </Tooltip>
          )}
        </Space>
      </div>
      <Typography.Text type="secondary" className={styles.itemStats}>
        {fmtTonnes(remaining)} {unit('t')} · {t('field.cu')} {fmtGrade(block.cu)} % ·{' '}
        {t('field.mo')} {fmtGrade(block.mo)} % · {t('field.eq')} {fmtGrade(block.eq)} %
      </Typography.Text>
      {dependsOn.length > 0 && (
        <div
          className={styles.itemStats}
          style={{ color: lockedBy.length > 0 ? token.colorWarningText : token.colorTextSecondary }}
        >
          ↳ {t('blocks.dep.dependsOn', { parents: dependsOn.join(', ') })}
        </div>
      )}
    </div>
  );
});
