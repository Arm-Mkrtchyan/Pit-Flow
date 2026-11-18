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
  private readonly constraints: string[] = [];
  private readonly binaries: string[] = [];
  private readonly upper = new Map<string, number>();
  private readonly variables = new Set<string>();
  private rowCount = 0;

  addObjective(variable: string, coef: number): void {
    if (coef === 0) return;
    this.variables.add(variable);
    this.objective.set(variable, (this.objective.get(variable) ?? 0) + coef);
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

  toString(): string {
    const objTerms: Term[] = [...this.objective.entries()].map(([v, c]) => [c, v]);
    const out = ['Minimize', ` obj: ${objTerms.length > 0 ? expr(objTerms) : '0'}`, 'Subject To'];
    out.push(...this.constraints);
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
