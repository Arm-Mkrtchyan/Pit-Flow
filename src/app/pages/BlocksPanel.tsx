import type { ReactNode } from 'react';
import { BlockList, BlockModal } from '../../features/blocks';
import { ImportButton, PasteBlocksZone } from '../../features/import';
import styles from '../AppLayout.module.css';

/** Shared block list (same data on every page); `extra` adds page-specific actions under the import. */
export function BlocksPanel({ extra }: { extra?: ReactNode }) {
  return (
    <div className={styles.leftPanel}>
      <ImportButton />
      {extra}
      <BlockList empty={<PasteBlocksZone />} />
      <BlockModal />
    </div>
  );
}
