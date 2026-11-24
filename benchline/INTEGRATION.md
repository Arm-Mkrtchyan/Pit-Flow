# Integrating Benchline into an existing project

These are instructions for the engineer or coding agent adding Benchline to a host application as its own page or section. Read `README.md` first for what the app does and how its files are organised.

## 0. Before changing anything

1. Inspect the host project: its framework (React, Vue, Angular, Svelte, server-rendered or plain), router, build tool, styling approach (global CSS, CSS modules, Tailwind, CSS-in-JS), theming (how dark mode is switched) and i18n setup.
2. Open `benchline/index.html` in a browser and click through all five tabs. That is the reference behaviour (see the acceptance checklist in §6).
3. Run `node --test benchline/tests/engines.test.js`. All 8 tests must pass before and after the integration.

## 1. Choose an approach

### A. Embed as a static page (fastest, no conflicts)
1. Copy the `benchline/` folder into the host's static assets (for example `public/benchline/`).
2. Add a route/page in the host that renders:
   ```html
   <iframe src="/benchline/index.html" title="Benchline" style="border:0;width:100%;height:calc(100vh - <host header height>)"></iframe>
   ```
3. Add a navigation link to the page.
4. Optional: sync the theme by setting `data-theme="dark"|"light"` on the iframe's `document.documentElement` (same origin), and the language with `iframe.contentWindow.setLang('ru'|'en')`.

Use this approach when the host's stack makes a native port expensive, or as a first step before §B.

### B. Native integration (recommended for "fully integrated")
Follow §2–§5. Keep the behaviour identical. Don't redesign the UI or rewrite the engines in this pass.

## 2. Code structure changes

The current scripts are classic browser scripts sharing globals. Convert them as follows:

| File | Kind | Action |
|---|---|---|
| `js/schedule-engine.js` | pure, no DOM | Make it an ES module: `export const Engine = (...)`. Keep the `module.exports` line or adapt the tests to `import`. |
| `js/dtm-engine.js` | pure, no DOM | Same: `export const DtmEng = (...)`. |
| `js/terrain-viewer.js` | DOM (one canvas) | ES module exporting a factory `createViewer()` instead of the singleton `V`, so the page can mount more than once. |
| `js/app.js` | DOM controller | Wrap it in `export function mountBenchline(root) { …; return destroy; }`. |
| `js/dtm-tab.js` | DOM controller | Wrap it in `mountDtmTab(root, ctx)`, called from `mountBenchline`. `ctx` passes what it uses from app.js: `I18N, t, nf, num, esc, css, ramp, PHC, RAMP_G, RAMP_P, S, applyStatic, openExport, setLang`. |

Points to watch in the controllers:
- **Element lookups:** they use `document.getElementById` and `document.querySelector` with fixed IDs (the `$`, `g` helpers). Change these to queries scoped to `root` (`root.querySelector('#…')`). Prefix the IDs (for example `bl-`) if the host could have matching ones. These IDs are used: `status langRu langEn side drop file demoBtn srcInfo mapGrid bx by bz dens fCol fOp fVal phSrc phN lag sink maxAct ppy maxP mineCap millCap spCap cogU cog wasteRk strat gUnit priceU price rec cMine cProc cRe disc alerts kpis expSched expBlocks c1 c2 c3 c4 gantt perLbl perSl play colMode benchLbl benchSl plan secDir secLbl secSl sect viewInfo legend ptable dtmBtn blkBtn dDemoBtn dtmFile blkFile dSrc dAlerts dModeSeg dViewSeg dVexV dVex dOpac dColor dGrid dLabels dFit d3wrap d3 dRead dCompass dCompN dNav dEmpty dBench dFloorMode dFloorRL dDens dExpBlk dBlkEmpty dBlk dVertsH dVertsEmpty dVerts dExpStr dExpCsv dClear dPicksEmpty dPicks modal mTitle mClose mHint mText mCopy mMsg`, plus the per-column selects `map_x … map_phase` that are generated at runtime.
- **Function overrides:** `dtm-tab.js` reassigns two globals from `app.js` to extend them: `openExport` (adds the `d_blk`, `d_str`, `d_csv` export kinds) and `setLang` (also re-renders the DTM tab). In module form, replace this with explicit hooks: let app.js accept extra export handlers and an `onLangChange` callback list.
- **Translations:** `I18N.ru` and `I18N.en` live in `app.js`. `dtm-tab.js` adds its own keys with `Object.assign`. `t(key, ...args)` replaces `{0}`, `{1}` and so on. If the host has an i18n library, you can move these dictionaries into it. Keep the Russian strings exactly as they are.
- **Markup:** the page body in `index.html` (top bar `header.bar`, `.app` grid with the settings rail and the workspace, and `#modal`) becomes the page template. For a React or Vue host the lowest-risk path is to render that markup once (as a template, or `dangerouslySetInnerHTML` from an imported HTML string) and call `mountBenchline(rootEl)` in `useEffect`/`onMounted`. Converting it to idiomatic components is a separate, later task.
- **Dependencies:** install `chart.js@4.4.1` and `delaunator@5`, then import them instead of the CDN tags. Code references `window.Chart` / `new Chart(...)` in app.js and `window.Delaunator` in dtm-tab.js; pass them in or import them directly.

## 3. Styles

`css/benchline.css` has some global selectors that would leak into the host: `:root`, `:root[data-theme="dark"]`, `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`, `html,body`, `body`, `*`, `h1,h2,h3`, `button,input,select,textarea`, `:focus-visible`, `table`, `th`, `td`, `[hidden]`.

1. Scope everything under one root class, for example `.benchline`. Use the host's mechanism (CSS modules, `postcss-prefix-selector`, a Vue `scoped` block, or a manual prefix).
2. Move the colour tokens from `:root` to `.benchline`, and from the dark-theme selectors to whatever the host uses for dark mode (for example `.dark .benchline` or `[data-theme=dark] .benchline`). Keep both palettes.
3. Rules on `html,body` become rules on `.benchline` (background, text colour, font).
4. Keep `[hidden]{display:none!important}` scoped inside `.benchline`; the code toggles visibility with `el.hidden`.
5. Google Fonts: add the IBM Plex link to the host's document head, or self-host the fonts. The fallbacks are system fonts.
6. The page assumes it fills the content area. Set `.benchline` to the host's content height. The 3D view (`.d3wrap`) is sized from the viewport (`min(64vh,620px)`), which is fine inside a scrolling page.

## 4. Lifecycle and cleanup (required for single-page apps)

Everything below is created at mount and must be released in `destroy()`:
- **Chart.js:** `S.charts` (call `.destroy()` on each).
- **Timers:** the play button's `setInterval` (`S.view.play`), the debounce timer `timer`, and the resize timer `rz`.
- **Window and document listeners:** `keydown` (Escape closes the modal) and `resize`.
- **Theme listeners:** `matchMedia('(prefers-color-scheme: dark)')` `change` listeners in app.js and dtm-tab.js, and the `MutationObserver`s on `document.documentElement` (attribute `data-theme`) in app.js and dtm-tab.js.
- **Viewer:** the `ResizeObserver` on the 3D canvas.
- **WebGL:** buffers and texture, then `gl.getExtension('WEBGL_lose_context')?.loseContext()`.
- **Canvases:** the large offscreen canvases in the DTM tab (`st.base`, `st.skin`, up to 4096×4096). Drop the references.

Lazy-load the whole section through the router. It is about 110 KB of code plus Chart.js, so it shouldn't be in the host's main bundle.

## 5. Things to adapt now that it runs inside a normal app

- **Exports:** Benchline was built for a sandbox that blocks file downloads, so its exports open a modal with the CSV or `.str` text and a Copy button (`openExport` in app.js and dtm-tab.js). In the host, add real downloads (`Blob` + `URL.createObjectURL` + `<a download>`): `.csv` for the schedules and block table, and `.str` for the recorded points. Keep the modal as a fallback.
- **localStorage keys:** `benchline-lang` (`ru` or `en`) and `benchline-tab` (the last open tab). Move these to the host's settings store if it has one.
- **Language switch:** the top bar has its own RU/EN switch. If the host already has a language switch, drive `setLang` from it and hide Benchline's.
- **Top bar:** `header.bar` (brand, status line and language switch) can become the section header, or be removed so the host's chrome is used. Keep `#status`: the app writes model status to it.
- **Persistence:** none today. All data stays in memory, and the demo data loads on start. If the host has a backend, saving uploaded files or schedules is a separate feature.

## 6. Acceptance checklist

On the default example data (it loads automatically):
- Header status: 3,496 blocks · 4 pushbacks · 16 benches.
- KPIs: mine life 3.8 yr (15 quarters, to Y4 Q3), total moved 35.02 Mt, strip ratio 2.41, ore 10.27 Mt at 1.50 g/t, NPV ≈ $860.2M at 8% (RU: «860,2 млн $»).
- Charts tab draws four charts. Gantt, Plan & section (with Play) and Period table all render.
- DTM tab: demo surface with 8,881 points and 17,520 triangles, and 29 blocks. Block `300-01` has area 625 m², volume 6,250 m³ and 16,875 t (bench 10 m, density 2.7). The totals row reads 291 106 m³ and 785 986 t.
- Hovering the surface shows live X/Y/Z. Clicking a block highlights it and lists its vertices. In point-recording mode, clicks add P1, P2…, and Export .str produces `1, Y, X, Z, P1` lines ending in `END`.
- The 3D/Plan switch, vertical exaggeration, fill opacity, colour modes, grid and label toggles all work.
- RU/EN switch changes every label, including the table headers and the chart legends.
- Light and dark themes are both readable. At 400 px width there is no horizontal page scroll.
- `node --test tests/engines.test.js` passes, and there are no console errors.
