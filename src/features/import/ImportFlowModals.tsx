import { useAppStore } from '../../store';
import { ColumnMappingModal } from './ColumnMappingModal';
import { ImportSummaryModal } from './ImportSummaryModal';
import { ReimportModeModal } from './ReimportModeModal';
import type { useImport } from './useImport';

/** Modals of the block import flow (mapping → replace/merge → summary) for one `useImport()`. */
export function ImportFlowModals({ flow }: { flow: ReturnType<typeof useImport> }) {
  const { step, confirmMapping, chooseMode, close } = flow;
  const existing = useAppStore((s) => s.blocks.length);

  return (
    <>
      {step.kind === 'mapping' && (
        <ColumnMappingModal
          file={step.file}
          initial={step.mapping}
          onOk={confirmMapping}
          onCancel={close}
        />
      )}
      {step.kind === 'reimport' && (
        <ReimportModeModal
          existing={existing}
          incoming={step.result.blocks.length}
          onChoose={chooseMode}
          onCancel={close}
        />
      )}
      {step.kind === 'summary' && (
        <ImportSummaryModal
          file={step.file}
          mapping={step.mapping}
          parseErrors={step.parseErrors}
          result={step.result}
          report={step.report}
          onClose={close}
        />
      )}
    </>
  );
}
