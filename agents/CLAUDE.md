# CLAUDE.md — Mine Block Scheduler

Reusable agent instructions for all feature work in this repo. Read this fully before every task.

## Project summary

Client-side web app that imports quarry blocks (CSV/XLSX), lets planners set remaining stock and dependencies per block, set daily targets (tonnage, Cu %, Mo %, …) over a date range, and computes an optimal day-by-day extraction schedule using an LP/MIP solver (HiGHS WASM) in a Web Worker.

## Stack

React 18 · TypeScript (strict) · Vite · Ant Design v5 · dayjs · Zustand (+persist, IndexedDB via idb-keyval) · PapaParse · SheetJS (xlsx) · zod · highs (WASM) · ESLint + Prettier · pnpm

Do not add new dependencies without stating why and asking first.

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

A task is not done until `pnpm typecheck && pnpm lint` pass.

## Folder structure

```
src/
  app/                 # App shell, layout, providers, theme
  features/
    import/            # file parsing, column mapping, validation
    blocks/            # block list, block modal, dependency logic
    calendar/          # date range selection
    schedule/          # schedule table, row descriptors, results view
    solver/            # model builder, worker, solution parser (NO React here)
    settings/          # solver weights, rounding, tolerances
    export/            # CSV/XLSX export
  store/               # zustand slices + persistence + migrations
  shared/              # ui primitives, formatters, i18n strings, utils
  types/               # shared domain types
fixtures/              # sample CSV files
```

Each feature exposes a public `index.ts`; import from other features only through it.

## Domain rules (never break these)

- **Input file format:** UTF-8 with BOM, comma-delimited, Russian headers: `Высотная отметка,Группа,Материал,Объем,Масса,cu,mo,as1,pb,cueq,density,ox_level` → keys `elevation, group, material, volume, weight, cu, mo, as, pb, eq, density, oxLevel`. Header mapping lives in `features/import/columns.ts`.
- **Block ID** is generated as `${elevation}-${group}-${material}` (e.g. `1740-1-MF`); the file has no ID column. Never change this format without a migration, because dependencies and history reference it.
- **Units:** tonnage (`weight`) in tonnes; volume in m³; density in t/m³; Cu, Mo, Cu-eq in %; As and Pb in g/t. Never mix units silently. Daily results for grades and impurities are tonnage-weighted averages.
- **Remaining stock** ≤ original weight, ≥ 0. It decreases automatically when a schedule is **accepted**; every acceptance is recorded in history and can be undone.
- **Dependency:** a child block may be used on day `d` only if its parent is fully exported by the end of day `d` and the parent's start-of-day balance was below the release threshold (default 15,000 t, in settings). Within that day the parent is taken first. Dependencies must never form a cycle — validate on every change (`features/blocks/dependencyGraph.ts`).
- **Targets have a tolerance band** (default ±10 %, per row in settings). Inside the band = met. The solver penalizes going outside the band heavily and distance from the exact target lightly.
- **Grade constraints are linearized against actual daily tonnage:** `Σ (grade[b] − (1±tol)·target[d])·x[b,d]` with slack. Never divide by a decision variable.
- **Targets are soft:** the solver always returns a solution; days outside the band are reported, not hidden.
- **Schedule rows are data-driven** via `RowDescriptor` config. To add a new target or limit (e.g. max arsenic), add a descriptor and extend the model builder — do not hardcode rows in the table component.
- After any input change, the last solution is marked **stale**.

## Code conventions

- Strict TypeScript; no `any`, no non-null assertions without a comment explaining why.
- Function components + hooks only. Keep components presentational; logic goes in hooks, store slices or pure modules.
- Use antd components and theme tokens; no custom CSS frameworks. Minimal CSS modules only where antd can't do it.
- All user-facing strings go in `shared/i18n/en.ts`.
- Solver code in `features/solver/` must stay framework-free and runnable in a Worker.
- Number formatting via `shared/format.ts` only.
- Persisted state changes require a schema version bump and a migration.

## How to work on a feature

1. Restate the feature in 2–3 sentences and list assumptions. If a requirement is ambiguous and expensive to change later, ask before coding.
2. Identify affected modules and data types; propose type changes first.
3. If the feature touches the optimization model, write the new constraints in math notation in the plan.
4. Implement in small steps.
5. Run typecheck and lint. Fix everything.
6. Summarize: what changed, files touched, how to verify manually, any follow-ups.

## Things to avoid

- Writing automated tests (unit, component, e2e) or adding test libraries — not needed for now unless explicitly asked.
- Running the solver on the main thread.
- Storing derived data (achieved grades, totals) in persisted state — compute it.
- Breaking the import of existing user data (always migrate).
- Large unrelated refactors inside a feature task.

---

## Feature request template

Copy this when asking the agent for a new feature:

```
Feature: <short name>

Goal: <what the user should be able to do and why>

Details:
- <behavior 1>
- <behavior 2>

Affects solver model? <yes/no — if yes, describe new constraint/objective>

Acceptance criteria:
- [ ] <observable result 1>
- [ ] <observable result 2>
- [ ] typecheck and lint pass

Out of scope: <what not to touch>

Follow CLAUDE.md. Start in plan mode, ask clarifying questions, then implement after approval.
```
