# Plan-mode prompt: Mine Block Scheduler (build from zero)

> Paste everything below into Claude Code **in plan mode**. Put `CLAUDE.md` (the companion file) in the repo root first.

---

You are a senior full-stack engineer and operations-research practitioner. We are building, from an empty folder, a web application called **Pit Flow**. Produce a detailed implementation plan first. Do not write code until I approve the plan.

## 1. What the app does

Mining planners upload a list of quarry blocks and get a day-by-day schedule of how many tonnes to take from each block so that each day hits a production target and a target copper and molybdenum grade, while respecting each block's remaining stock and dependencies between blocks.

## 2. Tech stack (fixed — do not substitute without asking)

- **React 18 + TypeScript + Vite** (client-only SPA; no server needed for v1)
- **Ant Design v5** (`antd`) for UI: `Upload`, `List`, `Modal`, `Form`, `InputNumber`, `Select` (searchable), `DatePicker.RangePicker`, `Table`, `Layout`, `message`/`notification`
- **dayjs** for dates (antd's native date lib)
- **Zustand** with the `persist` middleware for state (persist to IndexedDB via `idb-keyval`; data may exceed localStorage limits)
- **PapaParse** for CSV, **SheetJS (`xlsx`)** for .xlsx/.xls — support both
- **zod** for validating parsed rows and persisted state
- **highs** (HiGHS LP/MIP solver compiled to WASM) for optimization, run inside a **Web Worker** so the UI never freezes
- **ESLint + Prettier**
- Package manager: pnpm

## 3. Data input

The user uploads a CSV or Excel file. Each row is one block. This is the real export format (file `cn1740_mf_22_bloki_karucvacq.csv`, UTF-8 **with BOM**, comma delimiter, decimal point, Russian headers):

```csv
Высотная отметка,Группа,Материал,Объем,Масса,cu,mo,as1,pb,cueq,density,ox_level
1740,1,MF,8734.375,23146.095,0.089388193,0.073411449,27.76903403,9.445277253,0.354257603,2.65,9.491447227
1740,1,WD,4984.375,13208.595,0.054153605,0.034432602,22.99181834,8.152037603,0.176884013,2.65,10.81992161
```

Column mapping (file header → internal key):

| File header | Key | Type / unit | Meaning and use |
|---|---|---|---|
| `Высотная отметка` | `elevation` | integer, m | Bench elevation. Part of the block ID. Group/filter the list by it. |
| `Группа` | `group` | integer | Block group number within the bench. Part of the block ID. |
| `Материал` | `material` | string code (e.g. `MF`, `WD`) | Material type. Part of the block ID. Show as a colored tag; filter by it. |
| `Объем` | `volume` | m³ | Block volume. Info only. |
| `Масса` | `weight` | tonnes | Initial tonnage. Default for remaining stock. |
| `cu` | `cu` | % | Copper grade. Used in the solver. |
| `mo` | `mo` | % | Molybdenum grade. Used in the solver. |
| `as1` | `as` | g/t | Arsenic. Info now; future limit row. |
| `pb` | `pb` | g/t | Lead. Info now; future limit row. |
| `cueq` | `eq` | % | Copper equivalent (combined Cu+Mo indicator). Info; show in results. |
| `density` | `density` | t/m³ | Volumetric weight. Info only. |
| `ox_level` | `oxLevel` | number (likely %) | Oxidation level. Store and display as info; possible future limit row. |

Requirements:
- **The file has no block ID column.** Generate a stable ID as `${elevation}-${group}-${material}` (e.g. `1740-1-MF`) and use it as the display name. If two rows produce the same ID, append `-r<rowNumber>` and warn the user. Dependencies and merge-on-reimport use this ID.
- Recognize the headers above exactly (trim whitespace, strip the BOM, case-insensitive). If a file has different headers, show a **column-mapping step** to let the user map columns manually; remember the last mapping. Optional columns (`volume`, `density`, `oxLevel`, `as`, `pb`, `eq`) may be missing; required: `elevation`, `group`, `material`, `weight`, `cu`, `mo`.
- Sanity check: `volume × density ≈ weight` (within 1 %). Flag rows that don't match as warnings, don't reject them.
- Keep full precision internally (values have 9+ decimals); round only for display.
- Also accept semicolon delimiters, decimal comma (`0,259`) and Windows-1251 encoding, since other exports from Russian-locale Excel may use them.
- Block weights are roughly 10,000–25,000 t, so a 70,000 t day typically uses several blocks.
- Validate each row with zod; show a summary of skipped/invalid rows with reasons. Never silently drop data.
- Re-importing a file must ask: replace all blocks, or merge by block ID (keeping user-entered stock and dependencies).

## 4. Layout

Three-zone layout using antd `Layout`:

- **Left sidebar — Block list.** Upload button on top, then a searchable, sortable list of blocks grouped by elevation, with a material filter. Each item shows ID (`1740-1-MF`), material tag, remaining tonnes, Cu %, Mo %, and a badge if the block is locked by a dependency. Virtualize if more than ~300 blocks.
- **Center — Schedule table.** Columns = days in the selected range. Rows are described in §6.
- **Right sidebar — Calendar.** `DatePicker.RangePicker` (or an inline range calendar) to select the planning horizon. Changing the range rebuilds the table columns, keeping any per-day values the user already edited for days that remain in range.

## 5. Block detail popup

Clicking a block opens a `Modal` with:
- Read-only block properties from the file.
The popup has exactly two editable fields:
- **Remaining stock** — `InputNumber`, tonnes, defaults to the file `weight`, min 0, max = `weight`. It goes down automatically when a schedule is accepted (see §8).
- **Dependency** — searchable `Select` listing all other blocks. Meaning: *this block cannot be scheduled until the selected (parent) block is fully exported, except on the day the parent is finished off from a remaining balance below the release threshold (default 15,000 t) — see §7.*
  - Reject self-dependency and any selection that creates a cycle (A→B→C→A); show which chain causes the cycle.
  - Plan for the option of more than one dependency later (store as an array internally, single-select in UI for now).

## 6. Schedule table

- One column per day in the selected range; first column holds row labels.
- Editable target rows per day (each cell is an `InputNumber`; a header-level "apply to all days" action is helpful):
  1. **Daily productivity** — tonnes/day, default `70000`
  2. **Copper content** — target %, default `0.259`
  3. **Molybdenum content** — target %, default `0.039`
- Row definitions must be **data-driven** (a config array of row descriptors: key, label, unit, default, min/max, precision, whether it is a target or a limit) so more rows can be added later — e.g. max arsenic, max lead — without touching table code.
- Below the target rows, after solving, show **result rows**:
  - Achieved tonnage, achieved Cu %, achieved Mo % (and tonnage-weighted As g/t, Pb g/t, Cu-eq %, ox_level for information), each with deviation from target in %. Color: green = within the ±10 % tolerance band, red = outside it (amber optional for "within band but > 7 %").
  - Remaining balance of each used block at end of day.
  - The per-block allocation for that day (expandable rows or a nested table: block ID → tonnes). Only show blocks with tonnes > 0.
- A **"Calculate schedule"** button; disabled while solving, with progress and a cancel option.
- Export result to CSV and XLSX.

## 7. Optimization model (core of the app — plan this carefully)

This is a multi-period ore-blending problem. Formulate it as an LP/MIP and solve with HiGHS in a Web Worker.

Sets: blocks `b`, days `d = 1..D`.
Variables: `x[b,d] ≥ 0` tonnes taken from block `b` on day `d`.

Let `T[d] = Σ_b x[b,d]` (actual tonnage on day `d`) and `tol = 0.10` (±10 %, configurable per target row in settings; default 10 % for all three).

Constraints:
- **Stock:** `Σ_d x[b,d] ≤ remaining[b]`
- **Daily tonnage band:** `0.9·P[d] − tUnder[d] ≤ T[d] ≤ 1.1·P[d] + tOver[d]`
- **Copper grade band (linearized against actual tonnage, never divide by a variable):**
  - `Σ_b (cu[b] − 0.9·Cu[d])·x[b,d] + cuUnder[d] ≥ 0`
  - `Σ_b (cu[b] − 1.1·Cu[d])·x[b,d] − cuOver[d] ≤ 0`
- **Molybdenum grade band:** same pattern with `mo`.
- All slack variables `≥ 0`; they are non-zero only when the band cannot be met.
- **Dependency** (child `c` depends on parent `p`, release threshold `R = 15,000 t`, configurable):
  - The child may be used on day `d` only if the parent is fully exported by the **end** of day `d` **and** the parent's remaining balance at the **start** of day `d` was below `R`. (If the parent finished on an earlier day, its start-of-day balance is 0, so this covers that case too.)
  - Start-of-day balance: `r[p,d] = remaining[p] − Σ_{t<d} x[p,t]`
  - Binary `open[p,d]` = child of `p` is allowed on day `d`:
    - `r[p,d] ≤ R + remaining[p]·(1 − open[p,d])` — linearize "below R" as `≤ R − ε` if you need strictness
    - `remaining[p] − Σ_{t≤d} x[p,t] ≤ remaining[p]·(1 − open[p,d])` — parent finished by end of day
    - `x[c,d] ≤ remaining[c]·open[p,d]`
  - If the parent's remaining is already 0, the child is free from day 1 (skip the binaries).
  - Within a day the order is: finish parent first, then the child. Show this order in the per-day allocation list.

Objective: minimize weighted slack (outside-band deviations) with a large weight, plus a small secondary penalty on the distance from the exact target (so the schedule aims at the centre of the band, not its edge). Weights are configurable in settings. Default priority: tonnage, then Cu, then Mo. Normalize grade slacks relative to the target so weights are comparable.

Also plan for:
- **Infeasibility is normal** (not enough stock, grades unreachable). The soft constraints guarantee a solution; the UI must clearly explain which days miss which targets and why (e.g. "no remaining blocks above 0.259 % Cu").
- **Scale:** estimate variable/binary counts (blocks × days). If the MIP gets slow (e.g. >500 blocks × 30 days), plan a fallback: rolling-horizon solving day by day as LPs with dependency availability carried forward. Set a solver time limit and return the best solution found.
- **Determinism and tolerance:** round final tonnages sensibly (configurable, e.g. to 1 t or 10 t) and recompute achieved grades after rounding.
- Keep the model builder a **pure module** (`buildModel(input) → LP string/object`, `parseSolution(raw) → Schedule`) independent of React and of the solver binding.

## 8. Persistence and state

- Persist blocks, user inputs (remaining stock, dependencies), date range, per-day targets, settings and the last solution.
- Version the persisted schema; include a migration hook.
- Mark the last solution as **stale** when any input changes after solving.
- **Accept schedule:** after a calculation the user clicks "Accept schedule". This automatically subtracts the scheduled tonnes from each block's remaining balance (the value shown in the popup and list). Blocks that reach 0 are shown as exhausted (greyed out, sorted to the bottom, still visible). Keep a history of accepted schedules so the last acceptance can be **undone**, restoring the previous balances.
- Within an unaccepted schedule, the solver already carries balances across days in the range; the table shows each block's balance at end of each day.

## 9. Non-functional

- Strict TypeScript, no `any`.
- Feature-based folder structure (see CLAUDE.md).
- Number formatting: thousands separators for tonnes, fixed decimals for grades.
- i18n-ready labels (keep all UI strings in one place; English first, Russian/Armenian later).
- Accessible: keyboard navigation for the list and table inputs.

## 10. What I want in the plan

1. Any remaining clarifying questions. Already decided: the popup has only two fields; As and Pb are in g/t; targets use a ±10 % band; a dependent block may be used on the same day the parent is finished if the parent's start-of-day balance is below 15,000 t; accepted schedules reduce remaining balances automatically; block ID = `elevation-group-material`. Still open: what the material codes (`MF`, `WD`, …) mean and whether any must be excluded or treated differently by the solver; the unit and meaning of `ox_level`.
2. Final folder structure.
3. Data types (TypeScript interfaces) for Block, BlockUserInput, DayTargets, RowDescriptor, SolverInput, Schedule, Settings.
4. The optimization model written out precisely.
5. Milestones, each independently shippable:
   - M1: scaffold, layout, theming, lint setup
   - M2: file import + column mapping + block list
   - M3: block popup (stock, dependency, cycle detection)
   - M4: calendar + schedule table with editable target rows
   - M5: solver worker + model builder
   - M6: results display, deviation highlighting, export
   - M7: persistence, settings, polish
6. Risks and how you'll mitigate them (WASM loading in Vite worker, solver performance, CSV format variance).
7. A sample CSV with ~25 realistic blocks in **exactly the real format above** (same headers, BOM, delimiter; 2–3 elevations, several groups, MF and WD materials, weights 10,000–25,000 t, grades around the targets so some days are reachable and some are not), to commit as `fixtures/blocks.sample.csv`. I will also add my real file as `fixtures/cn1740_mf_22_bloki_karucvacq.csv`.

Follow the conventions in `CLAUDE.md`. After approval, implement milestone by milestone, running lint and typecheck at the end of each milestone, and stop for review after each one.
