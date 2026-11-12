import type { BlockId, BlockUserInput } from '../../types/domain';

/** child → parents ("child depends on parents"). */
export type DepGraph = Readonly<Record<BlockId, readonly BlockId[]>>;

export function graphFromInputs(inputs: Readonly<Record<BlockId, BlockUserInput>>): DepGraph {
  const g: Record<BlockId, BlockId[]> = {};
  for (const [id, input] of Object.entries(inputs)) g[id] = input.dependsOn;
  return g;
}

/** A path from `from` to `to` following "depends on" edges, or null. */
export function findDependencyPath(graph: DepGraph, from: BlockId, to: BlockId): BlockId[] | null {
  const visited = new Set<BlockId>();
  const stack: BlockId[] = [];
  const dfs = (node: BlockId): boolean => {
    stack.push(node);
    if (node === to) return true;
    visited.add(node);
    for (const next of graph[node] ?? []) {
      if (!visited.has(next) && dfs(next)) return true;
    }
    stack.pop();
    return false;
  };
  return dfs(from) ? stack : null;
}

/**
 * Would making `child` depend on `parents` create a cycle?
 * Returns the cycle as a chain `child → … → child`, or null if the change is safe.
 */
export function findCycleIfSet(
  graph: DepGraph,
  child: BlockId,
  parents: readonly BlockId[],
): BlockId[] | null {
  for (const parent of parents) {
    if (parent === child) return [child, child];
    const path = findDependencyPath(graph, parent, child);
    if (path) return [child, ...path];
  }
  return null;
}

/** Blocks that depend directly on `id`. */
export function childrenOf(graph: DepGraph, id: BlockId): BlockId[] {
  return Object.entries(graph)
    .filter(([, parents]) => parents.includes(id))
    .map(([child]) => child);
}

/** Order ids so every parent comes before its children; ties keep input order. Throws on a cycle. */
export function topoOrder(ids: readonly BlockId[], graph: DepGraph): BlockId[] {
  const set = new Set(ids);
  const indeg = new Map<BlockId, number>(ids.map((id) => [id, 0]));
  const kids = new Map<BlockId, BlockId[]>();
  for (const id of ids) {
    for (const p of graph[id] ?? []) {
      if (!set.has(p)) continue;
      indeg.set(id, (indeg.get(id) ?? 0) + 1);
      kids.set(p, [...(kids.get(p) ?? []), id]);
    }
  }
  const queue = ids.filter((id) => indeg.get(id) === 0);
  const out: BlockId[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined) break;
    out.push(id);
    for (const k of kids.get(id) ?? []) {
      const d = (indeg.get(k) ?? 0) - 1;
      indeg.set(k, d);
      if (d === 0) queue.push(k);
    }
  }
  if (out.length !== ids.length) throw new Error('Dependency cycle detected');
  return out;
}

export const formatChain = (chain: readonly BlockId[]): string => chain.join(' → ');
