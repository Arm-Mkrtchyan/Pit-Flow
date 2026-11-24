/**
 * Benchline: open-pit life-of-mine scheduler and Surpac DTM / blast block viewer, ported from the
 * standalone app in benchline/ (approach B of benchline/INTEGRATION.md).
 *
 * The UI is a DOM controller (plain JS) mounted into a host element; the engines in ./engine are pure
 * and are covered by `npm test` in benchline/.
 */
export { attachBenchline } from './attach';
