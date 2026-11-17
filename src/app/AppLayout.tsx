import { useState, type ReactNode } from 'react';
import { Button, Layout, Segmented, Tooltip, Typography } from 'antd';
import { t } from '../shared/i18n/t';
import { LanguageSwitch } from './LanguageSwitch';
import { PAGES, navigate, pageHref, type PageId } from './routes';
import styles from './AppLayout.module.css';
import logoUrl from '../assets/pit-flow-logo-transparent.webp';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  page: PageId;
  children: ReactNode;
}

/** Header (app title → home, page switch, language) above the current page. */
export function AppLayout({ page, children }: AppLayoutProps) {
  return (
    <Layout className={styles.root}>
      <Header className={styles.header}>
        <a href={pageHref('home')} className={styles.titleLink} title={t('page.home')}>
          <img src={logoUrl} alt={t('app.title')} className={styles.logo} />
        </a>
        {page === 'home' ? (
          <Typography.Text type="secondary">{t('app.subtitle')}</Typography.Text>
        ) : (
          <Segmented<PageId>
            value={page}
            onChange={navigate}
            options={PAGES.map((p) => ({ value: p.id, label: t(p.titleKey) }))}
          />
        )}
        <div className={styles.headerRight}>
          <LanguageSwitch />
        </div>
      </Header>
      {children}
    </Layout>
  );
}

interface PageColumnsProps {
  left?: ReactNode;
  center: ReactNode;
  right?: ReactNode;
  centerLabel: string;
  rightLabel?: string;
}

/**
 * Optional block list on the left, page content in the centre, optional right panel.
 * The right panel can be hidden (leaving a narrow strip with its toggle) and shown again.
 */
export function PageColumns({ left, center, right, centerLabel, rightLabel }: PageColumnsProps) {
  const [rightCollapsed, setRightCollapsed] = useState(false);
  return (
    <Layout>
      {left !== undefined && (
        <Sider width={340} theme="light" className={styles.sider} aria-label={t('layout.blocks')}>
          {left}
        </Sider>
      )}
      <Content className={styles.content} aria-label={centerLabel}>
        {center}
      </Content>
      {right !== undefined && (
        <Sider
          width={300}
          theme="light"
          className={styles.sider}
          aria-label={rightLabel}
          collapsible
          collapsed={rightCollapsed}
          collapsedWidth={40}
          trigger={null}
        >
          <Tooltip
            title={rightCollapsed ? t('layout.showPanel') : t('layout.hidePanel')}
            placement="left"
          >
            <Button
              size="small"
              className={styles.panelToggle}
              aria-label={rightCollapsed ? t('layout.showPanel') : t('layout.hidePanel')}
              aria-expanded={!rightCollapsed}
              onClick={() => setRightCollapsed((c) => !c)}
              icon={<Chevron direction={rightCollapsed ? 'left' : 'right'} />}
            />
          </Tooltip>
          <div hidden={rightCollapsed}>{right}</div>
        </Sider>
      )}
    </Layout>
  );
}

/** Double chevron drawn inline (no icon dependency), centred in its box. */
function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', transform: direction === 'left' ? 'scaleX(-1)' : undefined }}
    >
      <path d="M3.5 3.5 8 8l-4.5 4.5M8.5 3.5 13 8l-4.5 4.5" />
    </svg>
  );
}
