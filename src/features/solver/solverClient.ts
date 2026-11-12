import type { Schedule } from '../../types/domain';
import type { SolverInput, SolverWarning, WorkerResponse } from '../../types/solver';

export interface SolveHandle {
  promise: Promise<{ schedule: Schedule; warnings: SolverWarning[] }>;
  /** Terminates the worker; the promise rejects with SolveCancelled. */
  cancel: () => void;
}

export class SolveCancelled extends Error {
  constructor() {
    super('Cancelled');
  }
}

/**
 * Run one solve in a fresh Web Worker (never on the main thread). A new worker per solve
 * keeps WASM state isolated and makes cancel a simple terminate().
 */
export function solveInWorker(
  input: SolverInput,
  onProgress: (msg: Extract<WorkerResponse, { type: 'progress' }>) => void,
): SolveHandle {
  const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
  let rejectFn: (e: Error) => void = () => undefined;

  const promise = new Promise<{ schedule: Schedule; warnings: SolverWarning[] }>(
    (resolve, reject) => {
      rejectFn = reject;
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        if (msg.type === 'progress') {
          onProgress(msg);
          return;
        }
        worker.terminate();
        if (msg.type === 'result') resolve({ schedule: msg.schedule, warnings: msg.warnings });
        else reject(new Error(msg.message));
      };
      worker.onerror = (e) => {
        worker.terminate();
        reject(new Error(e.message || 'Solver worker failed to start'));
      };
    },
  );
  worker.postMessage({ type: 'solve', input });

  return {
    promise,
    cancel: () => {
      worker.terminate();
      rejectFn(new SolveCancelled());
    },
  };
}
