/** Minimal CPLEX-LP text builder. Pure; no solver dependency. */

export type Term = readonly [coef: number, variable: string];
export type Sense = '<=' | '>=' | '=';

const TERMS_PER_LINE = 8;

/** Format a coefficient compactly with 12 significant digits. */
export function num(n: number): string {
  if (!Number.isFinite(n)) throw new Error(`Non-finite coefficient in LP model: ${n}`);
  if (Math.abs(n) < 1e-13) return '0';
  return String(Number(n.toPrecision(12)));
}

function expr(terms: readonly Term[]): string {
  const parts = terms.map(([c, v]) => `${c < 0 ? '-' : '+'} ${num(Math.abs(c))} ${v}`);
  const lines: string[] = [];
  for (let i = 0; i < parts.length; i += TERMS_PER_LINE) {
    lines.push(parts.slice(i, i + TERMS_PER_LINE).join(' '));
  }
  return lines.join('\n   ');
}

export class LpBuilder {
  private readonly objective = new Map<string, number>();
  /** Objective part that is optimised first (tonnage); see `toString`. */
  private readonly primary = new Map<string, number>();
  private readonly constraints: string[] = [];
  private readonly binaries: string[] = [];
  private readonly upper = new Map<string, number>();
  private readonly variables = new Set<string>();
  private rowCount = 0;

  /** Adds `coef·variable` to the objective; `primary` terms are also optimised on their own first. */
  addObjective(variable: string, coef: number, primary = false): void {
    if (coef === 0) return;
    this.variables.add(variable);
    this.objective.set(variable, (this.objective.get(variable) ?? 0) + coef);
    if (primary) this.primary.set(variable, (this.primary.get(variable) ?? 0) + coef);
  }

  /** The primary objective terms (to evaluate a solution of the primary phase). */
  get primaryTerms(): Term[] {
    return [...this.primary.entries()].map(([v, c]) => [c, v]);
  }

  /** Adds `Σ terms sense rhs`. Terms with zero coefficient are dropped; empty rows are skipped. */
  addConstraint(terms: readonly Term[], sense: Sense, rhs: number, label = 'c'): void {
    const nz = terms.filter(([c]) => c !== 0);
    if (nz.length === 0) return;
    nz.forEach(([, v]) => this.variables.add(v));
    this.constraints.push(` ${label}${this.rowCount++}: ${expr(nz)} ${sense} ${num(rhs)}`);
  }

  /** Upper bound on a continuous variable (lower bound stays 0); the tighter bound wins. */
  addUpperBound(variable: string, ub: number): void {
    this.variables.add(variable);
    this.upper.set(variable, Math.min(ub, this.upper.get(variable) ?? Infinity));
  }

  addBinary(variable: string): void {
    this.variables.add(variable);
    this.binaries.push(variable);
  }

  get stats(): { rows: number; columns: number; binaries: number } {
    return { rows: this.rowCount, columns: this.variables.size, binaries: this.binaries.length };
  }

  /**
   * LP text. `primary`: minimise only the primary terms. `full` (default): minimise the whole
   * objective; with `primaryCap`, the primary terms may not exceed it (lexicographic 2nd phase).
   */
  toString(phase: 'primary' | 'full' = 'full', primaryCap?: number): string {
    const source = phase === 'primary' ? this.primary : this.objective;
    const objTerms: Term[] = [...source.entries()].map(([v, c]) => [c, v]);
    const out = ['Minimize', ` obj: ${objTerms.length > 0 ? expr(objTerms) : '0'}`, 'Subject To'];
    out.push(...this.constraints);
    const prim = this.primaryTerms;
    if (phase === 'full' && primaryCap !== undefined && prim.length > 0) {
      out.push(` primcap: ${expr(prim)} <= ${num(primaryCap)}`);
    }
    if (this.upper.size > 0) {
      out.push('Bounds');
      for (const [v, ub] of this.upper) out.push(` 0 <= ${v} <= ${num(ub)}`);
    }
    if (this.binaries.length > 0) {
      out.push('Binary');
      for (let i = 0; i < this.binaries.length; i += TERMS_PER_LINE) {
        out.push(` ${this.binaries.slice(i, i + TERMS_PER_LINE).join(' ')}`);
      }
    }
    out.push('End', '');
    return out.join('\n');
  }
}
