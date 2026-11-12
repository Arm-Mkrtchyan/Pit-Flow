import { memo } from 'react';
import { Space, Tag, Tooltip, Typography, theme } from 'antd';
import { t } from '../../shared/i18n/t';
import { fmtGrade, fmtTonnes } from '../../shared/format';
import { materialColor } from '../../shared/utils/materialColor';
import type { BlockView } from './useBlockListView';
import styles from './BlockList.module.css';

interface Props {
  view: BlockView;
  index: number;
  active: boolean;
  onOpen: (index: number) => void;
}

export const BlockListItem = memo(function BlockListItem({ view, index, active, onOpen }: Props) {
  const { token } = theme.useToken();
  const { block, cls, remaining, exhausted, lockedBy } = view;
  return (
    <div
      role="option"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      data-index={index}
      className={styles.item}
      style={{
        opacity: exhausted ? 0.45 : 1,
        background: active ? token.controlItemBgActive : undefined,
      }}
      onClick={() => onOpen(index)}
    >
      <div className={styles.itemTop}>
        <Typography.Text strong>{block.id}</Typography.Text>
        <Space size={2}>
          <Tag color={materialColor(block.material)} className={styles.tag}>
            {block.material}
          </Tag>
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
        {fmtTonnes(remaining)} t · {t('field.cu')} {fmtGrade(block.cu)} % · {t('field.mo')}{' '}
        {fmtGrade(block.mo)} % · {t('field.eq')} {fmtGrade(block.eq)} %
      </Typography.Text>
    </div>
  );
});
