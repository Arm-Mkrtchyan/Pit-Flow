# Benchline: open-pit mine scheduler

A browser-based open-pit scheduling tool in the spirit of GEOVIA MineSched, with a simpler, lighter workflow. It runs as the **Benchline** page of Pit Flow (`#/benchline`), in English, Russian and Armenian, following the app's language switch.

## What it does

**Scheduler (tabs 1–4)**
- Imports a block model CSV or text export from Surpac or Vulcan (comma, semicolon, tab or space separated) and auto-detects the X/Y/Z, size, grade, density, tonnes, rock type and pushback columns.
- Schedules pushbacks top-down bench by bench, with a pushback lag, a maximum sink rate and a maximum number of active pushbacks. It applies mining, mill and stockpile capacities, a cut-off grade and waste rock codes, and offers three sequencing strategies.
- Shows life-of-mine KPIs, charts (material movement, mill feed and head grade, stockpile, cash flow and NPV), a Gantt chart of RLs per pushback, plan and section views per period, and a period table.
- Exports CSV of the period schedule and of a per-block schedule (to re-import into Surpac or Vulcan).

**DTM & blast blocks (tab 5)**
- Loads a Surpac DTM (a text `.dtm` together with its `.str`). A `.str` of points alone is triangulated.
- Loads blast block polygons from a Surpac `.str`; the block name comes from the D1 field.
- Drapes the blocks over the DTM as a "skin": hillshaded surface, coloured block fills, outlines, labels and a coordinate grid. It has 3D orbit and north-up plan views, and a vertical exaggeration control.
- Shows live X/Y/Z cursor coordinates. Clicking a block lists its vertex coordinates. Clicking in point-recording mode records X/Y/Z points, which export as a Surpac `.str` (Y, X, Z order) or as CSV.
- Calculates area, perimeter, centroid, mean DTM elevation, volume above the blast floor, and tonnes for each block.

## Project structure

The app code lives in the host project; this folder keeps the docs, the engine tests and the original standalone build.

```
src/features/benchline/               (Pit Flow)
  index.ts                 public entry: attachBenchline(host, lang) → detach
  attach.ts                creates the .benchline root, mounts it, keeps it alive across the language remount, loads the IBM Plex fonts
  template.html            page markup (IDs prefixed with bl-)
  benchline.css            all styles, scoped under .benchline (light palette; dark via html[data-theme="dark"])
  engine/scheduleEngine.js PURE  block model parsing + scheduling + economics   → export Engine
  engine/dtmEngine.js      PURE  Surpac .str/.dtm parsing, raster, block volumes  → export DtmEng
  mountBenchline.js        DOM   helpers, scheduler UI, export modal              → mountBenchline(root, { lang }) → { setLang, destroy }
  mountBenchline.d.ts      types for the TypeScript side
  dtmTab.js                DOM   DTM & blast blocks tab                           → mountDtmTab(root, ctx) → { destroy }
  terrainViewer.js         DOM   minimal WebGL 2 terrain viewer + picking         → createViewer()
  vendor.js                chart.js and delaunator imports
src/app/pages/BenchlinePage.tsx       lazily loaded page that attaches Benchline
src/shared/i18n/{en,ru,hy}.ts         all strings, as bl.* keys (placeholders {0}, {1}…)

benchline/                             (this folder)
  tests/engines.test.js    node tests for both pure engines (imports them from src/features/benchline/engine)
  standalone/benchline-standalone.html   the original app as one self-contained file (reference behaviour, RU/EN)
  INTEGRATION.md           how it was integrated, and the acceptance checklist
```

Libraries: `chart.js@4.4.1` (charts on the Charts tab) and `delaunator@5` (triangulating a `.str` of points loaded without a `.dtm`) are npm dependencies of Pit Flow, bundled only into the lazily loaded Benchline chunk. The IBM Plex fonts come from Google Fonts, with system font fallbacks.

## Run locally

From the project root: `pnpm dev`, then open `#/benchline`. It opens with example data already loaded on both parts of the app. The original standalone version can still be opened directly: `standalone/benchline-standalone.html`.

## Tests

```
cd benchline && npm test               (node --test tests/engines.test.js)
```
The tests cover column detection, tonnage balance, bench precedence and capacities for all three strategies, `.dtm`/`.str` parsing, raster elevations, block area, centroid and volume, error codes, and the `.str` writer.

## Supported file formats

| File | Format notes |
|---|---|
| Block model | CSV or whitespace text with one header row, then one row per block. Comment lines starting with `# % ! *` are skipped. |
| Surpac `.str` | Text format. Line 1 is the header and line 2 the axis record. Records are `string, Y, X, Z, D1, D2…`. A record with string number `0` ends a segment, and `0, …, END` ends the file. **Y (northing) comes before X.** |
| Surpac `.dtm` | Text format. After `TRISOLATION`, each line is `tri, p1, p2, p3, n1, n2, n3`. `p1..p3` are 1-based numbers of the points in the paired `.str`, counted in file order across all strings (separator records are not counted). Line 1 of the `.dtm` names its `.str`; that name is used to pick the matching file. |

Binary Surpac files are detected and rejected with a message asking the user to re-save them as text.

## Known limitations

- The scheduler sequences whole benches within each pushback, not individual blocks or polygons. It uses a greedy rule, not a mathematical optimiser, and models a single stockpile.
- The DTM reader has been verified against the format description and generated examples, not yet against files exported from a live Surpac install.
- The volume calculation samples the DTM on a raster of about 1500 cells across the long side of the DTM. Each block's volume is the mean depth above the floor × the exact polygon area.
