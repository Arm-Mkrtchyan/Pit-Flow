import { Button, Modal, Space, Typography } from 'antd';
import { t } from '../../shared/i18n/t';
import type { ReimportMode } from './merge';

interface Props {
  existing: number;
  incoming: number;
  onChoose: (mode: ReimportMode) => void;
  onCancel: () => void;
}

export function ReimportModeModal({ existing, incoming, onChoose, onCancel }: Props) {
  return (
    <Modal open title={t('import.reimport.title')} footer={null} onCancel={onCancel}>
      <Typography.Paragraph>
        {t('import.reimport.intro', { existing, incoming })}
      </Typography.Paragraph>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Button type="primary" block onClick={() => onChoose('merge')} autoFocus>
            {t('import.reimport.merge')}
          </Button>
          <Typography.Text type="secondary">{t('import.reimport.mergeHint')}</Typography.Text>
        </div>
        <div>
          <Button danger block onClick={() => onChoose('replace')}>
            {t('import.reimport.replace')}
          </Button>
          <Typography.Text type="secondary">{t('import.reimport.replaceHint')}</Typography.Text>
        </div>
      </Space>
    </Modal>
  );
}
