/// <reference lib="webworker" />
import highsLoader from 'highs';
import wasmUrl from 'highs/runtime?url';
import type { WorkerRequest, WorkerResponse } from '../../types/solver';
import { solveSchedule, type HighsLike } from './solve';

const post = (msg: WorkerResponse) => self.postMessage(msg);

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== 'solve') return;
  try {
    post({ type: 'progress', phase: 'loading' });
    const highs: HighsLike = await highsLoader({ locateFile: () => wasmUrl });
    const { schedule, warnings } = solveSchedule(highs, event.data.input, (phase, info) =>
      post({ type: 'progress', phase, ...info }),
    );
    post({ type: 'result', schedule, warnings });
  } catch (e) {
    post({ type: 'error', message: e instanceof Error ? e.message : String(e) });
  }
};
