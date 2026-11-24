/* Benchline — dtm-tab.js
 * DTM & blast blocks tab: its translations, file loading, draped "skin" texture, coordinate readout, point recording, tables, exports.
 * Classic browser script: shares globals with the other Benchline scripts. Load order matters (see README).
 */
/* ---------- translations for this tab ---------- */
Object.assign(I18N.ru, {
  tDtm: 'ЦМР и взрывные блоки', dLoadDtm: 'Загрузить ЦМР (.dtm + .str)', dLoadBlk: 'Загрузить взрывные блоки (.str)', dDemo: 'Демо-данные',
  dDropHint: 'Для ЦМР выберите сразу два файла: .dtm и его .str. Один .str с точками тоже подойдёт: поверхность будет построена триангуляцией. Файлы можно перетащить на окно вида: .dtm вместе с .str — поверхность, отдельный .str — взрывные блоки.',
  dNoDtm: 'ЦМР: не загружена', dNoBlk: 'Блоки: не загружены', dDtmInfo: 'ЦМР: {0} · точек: {1} · треугольников: {2}', dBlkInfo: 'Блоки: {0} · полигонов: {1}',
  dDemoDtm: 'демо-поверхность карьера (пример данных)', dDemoBlk: 'демо-блоки (пример данных)', dTriang: 'триангуляция',
  dModeSel: 'Выбор блока', dModePick: 'Запись точек', d3d: '3D', dPlan: 'План', dVex: 'Верт. масштаб', dOpac: 'Заливка блоков',
  dColor: 'Цвет блоков', dcBlock: 'По блокам', dcVol: 'По объёму', dcRl: 'По отметке', dGrid: 'Сетка координат', dLabels: 'Подписи блоков', dFit: 'Показать всё',
  dHover: 'Наведите курсор на поверхность', dEmpty: 'Загрузите ЦМР из Surpac, чтобы увидеть поверхность.',
  dNav: 'Перетаскивание — вращение · ПКМ или Shift — сдвиг · колесо — масштаб', dNavPlan: 'Перетаскивание — сдвиг · колесо — масштаб',
  dParamsH: 'Расчёт объёмов', dBench: 'Высота уступа', dFloor: 'Подошва блока', dfPoly: 'Отметка полигона − высота уступа', dfFixed: 'Фиксированная отметка', dFloorRL: 'Отметка подошвы', dDens: 'Плотность',
  dBlocksH: 'Взрывные блоки', dBlkEmpty: 'Загрузите .str с полигонами взрывных блоков.',
  dthName: 'Блок', dthArea: 'Площадь, м²', dthPer: 'Периметр, м', dthCx: 'Центр X', dthCy: 'Центр Y', dthRl: 'Отм. полигона', dthSurf: 'Ср. отм. ЦМР', dthFloor: 'Подошва', dthVol: 'Объём, м³', dthT: 'Масса, т',
  dVertsTitle: 'Координаты вершин', dVertsH: 'Координаты вершин: {0}', dVertsEmpty: 'Щёлкните по блоку на поверхности или в таблице, чтобы увидеть координаты его вершин.',
  dthNo: '№', dthZs: 'Z полигона', dthZd: 'Z по ЦМР',
  dPicksH: 'Записанные точки', dPicksEmpty: 'Включите «Запись точек» и щёлкните по поверхности: координаты X, Y, Z появятся здесь.',
  dClear: 'Очистить', dExpStr: 'Экспорт .str', dExpCsv: 'Экспорт CSV', dExpBlk: 'Экспорт таблицы', dRemove: 'Удалить точку {0}',
  e_binary: 'Файл {0} сохранён в двоичном формате. Сохраните его в Surpac как текстовый (без флажка «Binary») и загрузите снова.',
  e_strEmpty: 'В файле {0} не найдено точек.', e_noStrForDtm: 'Для файла .dtm нужен его файл .str с точками. Выберите оба файла вместе.',
  e_dtmMismatch: 'Треугольники в .dtm ссылаются на точки, которых нет в {0}. Проверьте, что это парный файл .str.',
  e_noTri: 'Не удалось построить поверхность: в файле нет треугольников.', e_noDelaunay: 'Не удалось загрузить модуль триангуляции. Загрузите .dtm вместе с .str или обновите страницу.',
  e_noPoly: 'В файле {0} нет полигонов: в каждом сегменте нужно не меньше трёх точек.', e_noDtmFile: 'Выберите файл .dtm и его .str.',
  e_no3d: 'Браузер не поддерживает WebGL 2, поэтому 3D-вид недоступен. Таблицы и расчёты работают.',
  w_outside: 'Блоков вне ЦМР: {0}. Для них объём не рассчитан.',
  x_dBlk: 'CSV таблицы блоков', x_dBlkHint: 'По строке на блок: центр, площадь, отметки, объём и масса.',
  x_dStr: 'Записанные точки в формате Surpac .str', x_dStrHint: 'Сохраните текст в файл с расширением .str и откройте в Surpac. Порядок полей: номер стринга, Y, X, Z, описание.',
  x_dCsv: 'CSV записанных точек', x_dCsvHint: 'По строке на точку: номер, X, Y, Z.'
});
Object.assign(I18N.en, {
  tDtm: 'DTM & blasts', dLoadDtm: 'Load DTM (.dtm + .str)', dLoadBlk: 'Load blast blocks (.str)', dDemo: 'Demo data',
  dDropHint: 'For a DTM, select the .dtm and its .str together. A .str of points on its own also works: it is triangulated. You can drop files on the view: a .dtm with its .str loads the surface, a single .str loads blast blocks.',
  dNoDtm: 'DTM: not loaded', dNoBlk: 'Blocks: not loaded', dDtmInfo: 'DTM: {0} · {1} points · {2} triangles', dBlkInfo: 'Blocks: {0} · {1} polygons',
  dDemoDtm: 'demo pit surface (example data)', dDemoBlk: 'demo blocks (example data)', dTriang: 'triangulated',
  dModeSel: 'Select block', dModePick: 'Record points', d3d: '3D', dPlan: 'Plan', dVex: 'Vertical exaggeration', dOpac: 'Block fill',
  dColor: 'Block colour', dcBlock: 'By block', dcVol: 'By volume', dcRl: 'By RL', dGrid: 'Coordinate grid', dLabels: 'Block labels', dFit: 'Fit view',
  dHover: 'Move the cursor over the surface', dEmpty: 'Load a Surpac DTM to see the surface.',
  dNav: 'Drag to rotate · right-drag or Shift to pan · wheel to zoom', dNavPlan: 'Drag to pan · wheel to zoom',
  dParamsH: 'Volume calculation', dBench: 'Bench height', dFloor: 'Blast floor', dfPoly: 'Polygon RL − bench height', dfFixed: 'Fixed RL', dFloorRL: 'Floor RL', dDens: 'Density',
  dBlocksH: 'Blast blocks', dBlkEmpty: 'Load a .str of blast block polygons.',
  dthName: 'Block', dthArea: 'Area m²', dthPer: 'Perimeter m', dthCx: 'Centroid X', dthCy: 'Centroid Y', dthRl: 'Polygon RL', dthSurf: 'Mean DTM Z', dthFloor: 'Floor RL', dthVol: 'Volume m³', dthT: 'Tonnes',
  dVertsTitle: 'Vertex coordinates', dVertsH: 'Vertex coordinates: {0}', dVertsEmpty: 'Click a block on the surface or in the table to see its vertex coordinates.',
  dthNo: '#', dthZs: 'Z (string)', dthZd: 'Z (DTM)',
  dPicksH: 'Recorded points', dPicksEmpty: 'Turn on Record points and click the surface; the X, Y, Z coordinates appear here.',
  dClear: 'Clear', dExpStr: 'Export .str', dExpCsv: 'Export CSV', dExpBlk: 'Export table', dRemove: 'Remove point {0}',
  e_binary: 'File {0} is in binary format. Save it from Surpac as text (clear the Binary option) and load it again.',
  e_strEmpty: 'No points found in {0}.', e_noStrForDtm: 'A .dtm needs its .str point file. Select both files together.',
  e_dtmMismatch: 'Triangles in the .dtm refer to points missing from {0}. Check that it is the matching .str.',
  e_noTri: 'Could not build a surface: the file has no triangles.', e_noDelaunay: 'The triangulation module did not load. Load a .dtm with its .str, or reload the page.',
  e_noPoly: 'No polygons in {0}: each segment needs at least three points.', e_noDtmFile: 'Select a .dtm and its .str.',
  e_no3d: 'This browser has no WebGL 2, so the 3D view is unavailable. Tables and calculations still work.',
  w_outside: '{0} blocks fall outside the DTM; their volume is not calculated.',
  x_dBlk: 'Block table CSV', x_dBlkHint: 'One row per block: centroid, area, elevations, volume and tonnes.',
  x_dStr: 'Recorded points as Surpac .str', x_dStrHint: 'Save the text as a .str file and open it in Surpac. Field order: string, Y, X, Z, description.',
  x_dCsv: 'Recorded points CSV', x_dCsvHint: 'One row per point: number, X, Y, Z.'
});

/* ---------- DTM tab UI ---------- */
const DT = (() => {
  const g = id => document.getElementById(id);
  const st = { dtm: null, blk: null, picks: [], sel: -1, mode: 'select', errs: {}, gl: null, built: false, started: false, base: null, skin: null, o: null };
  const mk = (k, ...a) => { const e = new Error(k); e.code = k; e.args = a; return e; };
  const panelOn = () => !document.querySelector('[data-panel="dtm"]').hidden;
  const errMsg = e => e.code ? t('e_' + e.code, ...(e.args || [])) : String(e.message || e);
  const vex = () => Math.max(1, num('dVex') || 1);
  const RAMP_D = [[66, 82, 92], [112, 118, 110], [160, 148, 120], [206, 196, 170], [240, 236, 224]];
  const hexRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h.trim()); if (!m) return [0.95, 0.96, 0.97]; const n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const nice = v => { const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };

  function buildFrom(dtm, strs, isDemo) {
    let pts, tri, name;
    if (dtm) {
      if (!strs.length) throw mk('noStrForDtm');
      const want = DtmEng.dtmStrName(dtm.text).toLowerCase();
      const s = strs.find(f => f.name.toLowerCase() === want) || strs[0];
      pts = DtmEng.parseStr(s.text, s.name).pts;
      tri = DtmEng.parseDtm(dtm.text, dtm.name, pts.length, s.name);
      name = dtm.name + ' + ' + s.name;
    } else if (strs.length) {
      const r = DtmEng.triangulate(DtmEng.parseStr(strs[0].text, strs[0].name).pts, window.Delaunator);
      pts = r.pts; tri = r.tri; name = strs[0].name;
    } else throw mk('noDtmFile');
    const d = DtmEng.buildDtm(pts, tri, name); d.demo = !!isDemo; d.triang = !dtm; return d;
  }
  const readAll = files => Promise.all([...files].map(f => f.text().then(text => ({ name: f.name, text }))));
  async function loadDtmFiles(files) {
    try {
      const F = await readAll(files);
      const d = buildFrom(F.find(f => /\.dtm$/i.test(f.name)), F.filter(f => /\.str$/i.test(f.name)), false);
      setDtm(d);
    } catch (e) { st.errs.dtm = e; renderInfo(); }
  }
  async function loadBlkFile(f) {
    try { const text = await f.text(); setBlk(DtmEng.buildBlocks(DtmEng.parseStr(text, f.name).segs, f.name), f.name, false); }
    catch (e) { st.errs.blk = e; renderInfo(); }
  }
  function setDtm(d) { st.dtm = d; st.errs.dtm = null; st.picks = []; st.sel = -1; st.built = false; st.started = true; recompute(); if (panelOn()) show(); renderAll(); }
  function setBlk(list, name, demo) { st.blk = { list, name, demo }; st.errs.blk = null; st.sel = -1; recompute(); drawSkin(); renderAll(); }
  function loadDemo() {
    const D = DtmEng.demo();
    st.dtm = buildFrom({ name: 'demo_topo.dtm', text: D.dtm }, [{ name: 'demo_topo.str', text: D.str }], true);
    st.blk = { list: DtmEng.buildBlocks(DtmEng.parseStr(D.blk, 'demo_blasts.str').segs, 'demo_blasts.str'), name: 'demo_blasts.str', demo: true };
    st.errs = {}; st.picks = []; st.sel = -1; st.built = false; recompute();
  }
  function recompute() {
    if (!st.blk) return;
    st.blk.outside = DtmEng.stats(st.blk.list, st.dtm && st.dtm.r, { bench: num('dBench'), fixed: g('dFloorMode').value === 'fixed', floorRL: num('dFloorRL'), dens: num('dDens') });
  }

  function show() {
    if (!st.started) { st.started = true; if (!st.dtm && !st.blk) loadDemo(); renderAll(); }
    if (st.gl === null) { try { st.gl = V.init(g('d3'), { hover, click, leave, change: compass }); } catch (e) { st.gl = false; } if (st.gl) V.setBg(hexRgb(css('--sunk'))); renderInfo(); }
    if (!st.gl) return;
    if (st.dtm && !st.built) build();
    V.req();
  }
  function shade(r, z0, z1) {
    const img = new ImageData(r.nx, r.ny), D = img.data, Z = r.z, nx = r.nx, ny = r.ny, c = r.cell;
    const zen = Math.PI / 4, az = (360 - 315 + 90) * Math.PI / 180, cz = Math.cos(zen), sz = Math.sin(zen), span = z1 - z0 || 1;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, z = Z[k]; if (z !== z) continue;
      const at = (ii, jj) => { if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) return z; const v = Z[jj * nx + ii]; return v === v ? v : z; };
      const dzdx = (at(i + 1, j) - at(i - 1, j)) / (2 * c), dzdy = (at(i, j + 1) - at(i, j - 1)) / (2 * c);
      const slope = Math.atan(Math.hypot(dzdx, dzdy)), asp = Math.atan2(dzdy, -dzdx);
      const hs = Math.max(0, cz * Math.cos(slope) + sz * Math.sin(slope) * Math.cos(az - asp));
      const f = Math.max(0, Math.min(1, (z - z0) / span)) * (RAMP_D.length - 1), q = Math.min(RAMP_D.length - 2, Math.floor(f)), u = f - q, m = 0.38 + 0.72 * hs;
      for (let ch = 0; ch < 3; ch++) D[4 * k + ch] = Math.min(255, (RAMP_D[q][ch] + (RAMP_D[q + 1][ch] - RAMP_D[q][ch]) * u) * m);
      D[4 * k + 3] = 255;
    }
    return img;
  }
  function positions() {
    const d = st.dtm, o = st.o, n = d.n, ve = vex(), pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[3 * i] = d.px[i] - o.x; pos[3 * i + 1] = (d.pz[i] - o.z) * ve; pos[3 * i + 2] = -(d.py[i] - o.y); }
    return pos;
  }
  function build() {
    const d = st.dtm, E = d.ext, W = E.x1 - E.x0, H = E.y1 - E.y0, r = d.r;
    st.o = { x: (E.x0 + E.x1) / 2, y: (E.y0 + E.y1) / 2, z: E.z0 };
    const uv = new Float32Array(d.n * 2);
    for (let i = 0; i < d.n; i++) { uv[2 * i] = (d.px[i] - E.x0) / W; uv[2 * i + 1] = (E.y1 - d.py[i]) / H; }
    V.setMesh(positions(), uv, d.tri);
    V.scene({ W, H, zr: (E.z1 - E.z0) * vex(), cell: r.cell });
    const maxT = Math.min(V.maxTex(), window.innerWidth < 700 ? 2048 : 4096), s = maxT / Math.max(W, H);
    st.base = st.base || document.createElement('canvas'); st.skin = st.skin || document.createElement('canvas');
    st.base.width = st.skin.width = Math.max(2, Math.round(W * s)); st.base.height = st.skin.height = Math.max(2, Math.round(H * s));
    const tmp = document.createElement('canvas'); tmp.width = r.nx; tmp.height = r.ny; tmp.getContext('2d').putImageData(shade(r, E.z0, E.z1), 0, 0);
    const bc = st.base.getContext('2d'); bc.clearRect(0, 0, st.base.width, st.base.height); bc.imageSmoothingEnabled = true; bc.imageSmoothingQuality = 'high';
    bc.drawImage(tmp, -0.5 * r.cell * s, -0.5 * r.cell * s, r.nx * r.cell * s, r.ny * r.cell * s);
    st.built = true; V.fit(); drawSkin();
  }
  const blockColor = (b, i, mode, vmax, r0, r1) => mode === 'volume' ? ramp(RAMP_G, (b.vol || 0) / vmax) : mode === 'rl' ? ramp(RAMP_P, (b.rl - r0) / ((r1 - r0) || 1)) : PHC[i % PHC.length];
  function drawSkin() {
    if (!st.built || !st.skin) return;
    const c = st.skin, x = c.getContext('2d'), E = st.dtm.ext, r = st.dtm.r, W = E.x1 - E.x0, H = E.y1 - E.y0, sx = c.width / W, sy = c.height / H, u = Math.max(c.width, c.height) / 1000;
    const T = (X, Y) => [(X - E.x0) * sx, (E.y1 - Y) * sy];
    x.clearRect(0, 0, c.width, c.height); x.drawImage(st.base, 0, 0);
    const lab = (s, px, py, size, al) => { x.font = `600 ${Math.round(size)}px "IBM Plex Mono", ui-monospace, monospace`; x.textAlign = al || 'left'; x.lineJoin = 'round'; x.lineWidth = size * 0.28; x.strokeStyle = 'rgba(16,22,26,.8)'; x.strokeText(s, px, py); x.fillStyle = '#fff'; x.fillText(s, px, py); };
    if (g('dGrid').checked) {
      const step = nice(Math.max(W, H) / 7);
      x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = u * 0.9; x.beginPath();
      const xs = [], ys = [];
      for (let X = Math.ceil(E.x0 / step) * step; X <= E.x1; X += step) { const px = T(X, 0)[0]; xs.push([X, px]); x.moveTo(px, 0); x.lineTo(px, c.height); }
      for (let Y = Math.ceil(E.y0 / step) * step; Y <= E.y1; Y += step) { const py = T(0, Y)[1]; ys.push([Y, py]); x.moveTo(0, py); x.lineTo(c.width, py); }
      x.stroke(); x.textBaseline = 'top';
      for (const [X, px] of xs) { const i = Math.round((X - r.x0) / r.cell); let j = 0; while (j < r.ny && !(r.z[j * r.nx + i] === r.z[j * r.nx + i])) j++; if (j < r.ny) lab('X ' + nf(X), px + u * 4, j * r.cell * sy + u * 5, u * 12); }
      x.textBaseline = 'bottom';
      for (const [Y, py] of ys) { const j = Math.round((r.y1 - Y) / r.cell); let i = 0; while (i < r.nx && !(r.z[j * r.nx + i] === r.z[j * r.nx + i])) i++; if (i < r.nx) lab('Y ' + nf(Y), i * r.cell * sx + u * 5, py - u * 4, u * 12); }
    }
    if (st.blk) {
      const L = st.blk.list, op = +g('dOpac').value, mode = g('dColor').value, vmax = Math.max(1, ...L.map(b => b.vol || 0));
      const r0 = Math.min(...L.map(b => b.rl)), r1 = Math.max(...L.map(b => b.rl));
      const path = b => { x.beginPath(); b.P.forEach((p, k) => { const [px, py] = T(p.x, p.y); k ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); };
      L.forEach((b, i) => {
        path(b); x.globalAlpha = op; x.fillStyle = blockColor(b, i, mode, vmax, r0, r1); x.fill(); x.globalAlpha = 1;
        x.lineWidth = u * 1.3; x.strokeStyle = 'rgba(14,18,22,.9)'; x.stroke();
      });
      if (st.sel >= 0 && L[st.sel]) { path(L[st.sel]); x.lineWidth = u * 4.5; x.strokeStyle = css('--accent'); x.stroke(); x.lineWidth = u * 1.2; x.strokeStyle = '#fff'; x.stroke(); }
      if (g('dLabels').checked) {
        x.textBaseline = 'middle';
        L.forEach(b => { const [px, py] = T(b.cx, b.cy), size = Math.max(u * 7, Math.min(u * 18, Math.sqrt(b.area) * sx * 0.2)); lab(b.name, px, py, size, 'center'); });
      }
    }
    x.textBaseline = 'alphabetic';
    st.picks.forEach((p, i) => {
      const [px, py] = T(p.x, p.y);
      x.beginPath(); x.arc(px, py, u * 5, 0, Math.PI * 2); x.fillStyle = css('--accent'); x.fill(); x.lineWidth = u * 1.5; x.strokeStyle = '#fff'; x.stroke();
      lab('P' + (i + 1), px + u * 8, py - u * 6, u * 13);
    });
    V.setTexture(c);
  }

  const hf = (sx, sz) => { const o = st.o, z = DtmEng.zAt(st.dtm.r, sx + o.x, -sz + o.y); return z === z ? (z - o.z) * vex() : NaN; };
  function world(e) {
    if (!st.built) return null;
    const h = V.pick(e, hf); if (!h) return null;
    const o = st.o, X = h.x + o.x, Y = -h.z + o.y, Z = DtmEng.zAt(st.dtm.r, X, Y);
    return Z === Z ? { x: X, y: Y, z: Z } : null;
  }
  const blockAt = p => { if (!st.blk) return -1; const L = st.blk.list; for (let i = L.length - 1; i >= 0; i--) if (DtmEng.pip(p.x, p.y, L[i].P)) return i; return -1; };
  let hq = null;
  function hover(e) {
    if (hq) { hq = e; return; } hq = e;
    requestAnimationFrame(() => {
      const ev = hq; hq = null; const p = world(ev);
      if (!p) { g('dRead').textContent = t('dHover'); return; }
      const k = blockAt(p);
      g('dRead').textContent = `X ${nf(p.x, 2)}   Y ${nf(p.y, 2)}   Z ${nf(p.z, 2)}` + (k >= 0 ? ' · ' + st.blk.list[k].name : '');
    });
  }
  const leave = () => { g('dRead').textContent = t('dHover'); };
  function click(e) {
    const p = world(e); if (!p) return;
    if (st.mode === 'pick') { st.picks.push(p); drawSkin(); renderPicks(); return; }
    select(blockAt(p));
  }
  function select(k) { st.sel = k; drawSkin(); renderBlocks(); renderVerts(); }
  function compass() { g('dCompass').style.transform = `rotate(${V.yaw() * 180 / Math.PI}deg)`; }

  function renderInfo() {
    const d = st.dtm, b = st.blk;
    const dn = d ? (d.demo ? t('dDemoDtm') : d.name + (d.triang ? ' (' + t('dTriang') + ')' : '')) : '';
    const bn = b ? (b.demo ? t('dDemoBlk') : b.name) : '';
    g('dSrc').innerHTML = `<span>${esc(d ? t('dDtmInfo', dn, nf(d.n), nf(d.ntri)) : t('dNoDtm'))}</span><span>${esc(b ? t('dBlkInfo', bn, b.list.length) : t('dNoBlk'))}</span>`;
    const a = [];
    for (const k of ['dtm', 'blk']) if (st.errs[k]) a.push(`<div class="alert err">${esc(errMsg(st.errs[k]))}</div>`);
    if (st.gl === false) a.push(`<div class="alert err">${esc(t('e_no3d'))}</div>`);
    if (b && d && b.outside) a.push(`<div class="alert">${esc(t('w_outside', b.outside))}</div>`);
    g('dAlerts').innerHTML = a.join('');
    const em = g('dEmpty'); em.hidden = !!d && st.gl !== false; em.textContent = st.gl === false ? t('e_no3d') : t('dEmpty');
    g('dNav').textContent = V.mode() === 'plan' ? t('dNavPlan') : t('dNav');
    g('dCompN').textContent = t('N');
    g('dVexV').textContent = '×' + nf(vex(), 1);
  }
  function renderBlocks() {
    const el = g('dBlk'), B = st.blk;
    g('dBlkEmpty').hidden = !!B; g('dExpBlk').disabled = !B;
    if (!B) { el.innerHTML = ''; return; }
    const f = (v, d) => v == null ? '—' : nf(v, d);
    const H = ['dthName', 'dthArea', 'dthPer', 'dthCx', 'dthCy', 'dthRl', 'dthSurf', 'dthFloor', 'dthVol', 'dthT'].map(k => `<th>${esc(t(k))}</th>`).join('');
    const rows = B.list.map((b, i) => `<tr data-k="${i}"${i === st.sel ? ' class="sel"' : ''}><td><span class="swatch" style="background:${blockColor(b, i, g('dColor').value, Math.max(1, ...B.list.map(q => q.vol || 0)), Math.min(...B.list.map(q => q.rl)), Math.max(...B.list.map(q => q.rl)))}"></span>${esc(b.name)}</td><td>${f(b.area)}</td><td>${f(b.per)}</td><td>${f(b.cx, 1)}</td><td>${f(b.cy, 1)}</td><td>${f(b.rl, 1)}</td><td>${f(b.surf, 1)}</td><td>${f(b.floor, 1)}</td><td>${f(b.vol)}</td><td>${f(b.t)}</td></tr>`).join('');
    const sum = k => B.list.reduce((a, b) => a + (b[k] || 0), 0);
    el.innerHTML = `<thead><tr>${H}</tr></thead><tbody>${rows}</tbody><tfoot><tr><td>${esc(t('total'))}</td><td>${nf(sum('area'))}</td><td></td><td></td><td></td><td></td><td></td><td></td><td>${nf(sum('vol'))}</td><td>${nf(sum('t'))}</td></tr></tfoot>`;
  }
  function renderVerts() {
    const B = st.blk, b = B && st.sel >= 0 ? B.list[st.sel] : null;
    g('dVertsH').textContent = b ? t('dVertsH', b.name) : t('dVertsTitle');
    g('dVertsEmpty').hidden = !!b;
    if (!b) { g('dVerts').innerHTML = ''; return; }
    const r = st.dtm && st.dtm.r;
    g('dVerts').innerHTML = `<thead><tr><th>${t('dthNo')}</th><th>X</th><th>Y</th><th>${esc(t('dthZs'))}</th><th>${esc(t('dthZd'))}</th></tr></thead><tbody>` +
      b.P.map((p, i) => { const zd = r ? DtmEng.zAt(r, p.x, p.y) : NaN; return `<tr><td>${i + 1}</td><td>${nf(p.x, 2)}</td><td>${nf(p.y, 2)}</td><td>${nf(p.z, 2)}</td><td>${zd === zd ? nf(zd, 2) : '—'}</td></tr>`; }).join('') + '</tbody>';
  }
  function renderPicks() {
    const P = st.picks;
    g('dPicksEmpty').hidden = P.length > 0;
    ['dExpStr', 'dExpCsv', 'dClear'].forEach(id => g(id).disabled = !P.length);
    g('dPicks').innerHTML = P.length ? `<thead><tr><th>${t('dthNo')}</th><th>X</th><th>Y</th><th>Z</th><th></th></tr></thead><tbody>` +
      P.map((p, i) => `<tr><td>P${i + 1}</td><td>${nf(p.x, 2)}</td><td>${nf(p.y, 2)}</td><td>${nf(p.z, 2)}</td><td><button class="xbtn" type="button" data-rm="${i}" aria-label="${esc(t('dRemove', i + 1))}">×</button></td></tr>`).join('') + '</tbody>' : '';
  }
  function renderSegs() {
    document.querySelectorAll('#dModeSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === st.mode));
    document.querySelectorAll('#dViewSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === V.mode()));
    g('dFloorRL').disabled = g('dFloorMode').value !== 'fixed';
  }
  function renderAll() { renderInfo(); renderBlocks(); renderVerts(); renderPicks(); renderSegs(); }
  function relang() { renderAll(); leave(); drawSkin(); }

  // exports reuse the CSV modal
  const baseExport = openExport;
  openExport = function (kind) {
    if (!String(kind).startsWith('d_')) return baseExport(kind);
    S.exportKind = kind; let csv = '', title = '', hint = '';
    if (kind === 'd_blk' && st.blk) {
      const q = v => v == null ? '' : (+v).toFixed(3);
      csv = ['name,centroid_x,centroid_y,area_m2,perimeter_m,polygon_rl,mean_dtm_z,floor_rl,volume_m3,tonnes',
        ...st.blk.list.map(b => [/[",]/.test(b.name) ? `"${b.name.replace(/"/g, '""')}"` : b.name, q(b.cx), q(b.cy), q(b.area), q(b.per), q(b.rl), q(b.surf), q(b.floor), q(b.vol), q(b.t)].join(','))].join('\n');
      title = t('x_dBlk'); hint = t('x_dBlkHint');
    } else if (kind === 'd_str') { csv = DtmEng.strText(st.picks, 'recorded_points'); title = t('x_dStr'); hint = t('x_dStrHint'); }
    else { csv = ['point,x,y,z', ...st.picks.map((p, i) => `P${i + 1},${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)}`)].join('\n'); title = t('x_dCsv'); hint = t('x_dCsvHint'); }
    g('mTitle').textContent = title; g('mHint').textContent = hint; g('mText').value = csv; g('mMsg').textContent = '';
    if (g('modal').hidden) { g('modal').hidden = false; g('mCopy').focus(); }
  };

  // wiring
  g('dtmBtn').addEventListener('click', () => g('dtmFile').click());
  g('blkBtn').addEventListener('click', () => g('blkFile').click());
  g('dtmFile').addEventListener('change', e => { if (e.target.files.length) loadDtmFiles(e.target.files); e.target.value = ''; });
  g('blkFile').addEventListener('change', e => { if (e.target.files[0]) loadBlkFile(e.target.files[0]); e.target.value = ''; });
  g('dDemoBtn').addEventListener('click', () => { loadDemo(); st.started = true; renderAll(); show(); });
  const wrap = g('d3wrap');
  ['dragenter', 'dragover'].forEach(ty => wrap.addEventListener(ty, e => { e.preventDefault(); wrap.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ty => wrap.addEventListener(ty, e => { e.preventDefault(); wrap.classList.remove('over'); }));
  wrap.addEventListener('drop', e => {
    const fs = [...e.dataTransfer.files]; if (!fs.length) return;
    if (fs.some(f => /\.dtm$/i.test(f.name))) loadDtmFiles(fs); else { const s = fs.find(f => /\.str$/i.test(f.name)); if (s) loadBlkFile(s); }
  });
  document.querySelectorAll('#dModeSeg button').forEach(b => b.addEventListener('click', () => { st.mode = b.dataset.m; renderSegs(); }));
  document.querySelectorAll('#dViewSeg button').forEach(b => b.addEventListener('click', () => { V.setMode(b.dataset.v); renderSegs(); renderInfo(); compass(); }));
  g('dVex').addEventListener('input', () => { g('dVexV').textContent = '×' + nf(vex(), 1); if (st.built) { V.setPos(positions()); V.scene({ zr: (st.dtm.ext.z1 - st.dtm.ext.z0) * vex() }); } });
  ['dOpac', 'dColor', 'dGrid', 'dLabels'].forEach(id => g(id).addEventListener(id === 'dOpac' ? 'input' : 'change', () => { drawSkin(); renderBlocks(); }));
  ['dBench', 'dFloorMode', 'dFloorRL', 'dDens'].forEach(id => g(id).addEventListener(id === 'dFloorMode' ? 'change' : 'input', () => { renderSegs(); recompute(); renderBlocks(); renderInfo(); if (g('dColor').value === 'volume') drawSkin(); }));
  g('dFit').addEventListener('click', () => { if (st.built) V.fit(); });
  g('dBlk').addEventListener('click', e => { const tr = e.target.closest('tr[data-k]'); if (tr) select(+tr.dataset.k === st.sel ? -1 : +tr.dataset.k); });
  g('dPicks').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { st.picks.splice(+b.dataset.rm, 1); drawSkin(); renderPicks(); } });
  g('dClear').addEventListener('click', () => { st.picks = []; drawSkin(); renderPicks(); });
  g('dExpBlk').addEventListener('click', () => openExport('d_blk'));
  g('dExpStr').addEventListener('click', () => openExport('d_str'));
  g('dExpCsv').addEventListener('click', () => openExport('d_csv'));
  document.querySelector('.tab[data-tab="dtm"]').addEventListener('click', () => requestAnimationFrame(show));
  const syncTools = () => { document.querySelector('.tabs .tools').hidden = panelOn(); };
  document.querySelectorAll('.tab').forEach(tb => tb.addEventListener('click', syncTools)); syncTools();
  const rebg = () => { if (st.gl) V.setBg(hexRgb(css('--sunk'))); };
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rebg); } catch (e) {}
  new MutationObserver(rebg).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const baseSetLang = setLang;
  setLang = l => { baseSetLang(l); relang(); };

  applyStatic(); renderAll(); leave();
  if (panelOn()) requestAnimationFrame(show);
  return { st, show };
})();
