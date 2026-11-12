// Framework-free solver. Only solverClient touches browser APIs (Worker).
export { solveInWorker, SolveCancelled, type SolveHandle } from './solverClient';
export { buildModel, estimateSize } from './buildModel';
export { validateSchedule } from './validateSchedule';
export { scoreMatrix } from './evaluate';
