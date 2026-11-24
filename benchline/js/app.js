/* Benchline — app.js
 * Translations (I18N), formatting helpers, scheduler UI: settings, KPIs, charts, Gantt, plan/section, table, CSV export modal.
 * Classic browser script: shares globals with the other Benchline scripts. Load order matters (see README).
 */
/* ---------- translations ---------- */
const I18N = {
  ru: {
    tagline: 'Календарное планирование открытых горных работ',
    s1: 'Блочная модель', dropB: 'Перетащите сюда CSV блочной модели', dropS: 'Экспорт Surpac или Vulcan (CSV / текст) · или нажмите, чтобы выбрать файл',
    demo: 'Загрузить демо-карьер', colmap: 'Сопоставление столбцов',
    bx: 'Размер блока X', by: 'Размер блока Y', bz: 'Размер блока Z', dens: 'Плотность по умолчанию',
    sizesHint: 'Размеры и плотность применяются, только если в файле нет соответствующих столбцов.',
    filter: 'Фильтр строк (необязательно)', fWhere: 'Включать только строки, где', fTest: 'Условие', fValue: 'Значение', fValPh: 'напр. 1',
    s2: 'Этапы отработки и уступы', phSrc: 'Источник этапов', phCol: 'Из столбца этапов', phAuto: 'Авто: кольца параллельно борту',
    phN: 'Число авто-этапов', lag: 'Отставание этапов', sink: 'Макс. скорость понижения', maxAct: 'Макс. одновременных этапов',
    phHint: 'Строки с этапом 0 или пустым считаются вне карьера. Этап может отрабатывать уступ, только когда предыдущий этап опустился ниже на заданное число уступов.',
    s3: 'Производственные показатели', ppy: 'Длительность периода', month: 'Месяц', quarter: 'Квартал', year: 'Год', maxP: 'Макс. число периодов',
    mineCap: 'Производительность по горной массе', millCap: 'Производительность фабрики', spCap: 'Ёмкость склада руды', cog: 'Бортовое содержание',
    wasteRk: 'Коды пород, всегда идущие в отвал', wasteRkPh: 'напр. OVB, DYKE',
    strat: 'Приоритет отработки', stratPhase: 'По порядку этапов (сверху вниз, ранние этапы первыми)', stratValue: 'Сначала самые богатые уступы', stratFeed: 'Загрузить фабрику, остаток — на вскрышу',
    s4: 'Экономика', gUnit: 'Единица содержания', gptOpt: 'г/т → металл в унциях', pctOpt: '% → металл в тоннах',
    price: 'Цена металла', rec: 'Извлечение', cMine: 'Затраты на добычу', cProc: 'Затраты на переработку', cRe: 'Затраты на перевалку со склада', disc: 'Ставка дисконтирования',
    u_m: 'м', u_tm3: 'т/м³', u_cnt: 'шт.', u_ben: 'уступов', u_benp: 'уступов/период', u_ktp: 'тыс. т/период', u_kt: 'тыс. т', u_comma: 'через запятую',
    u_cMine: '$/т горной массы', u_cProc: '$/т руды', u_cRe: '$/т', u_pyr: '%/год', u_poz: '$/унц', u_pt: '$/т металла',
    tCharts: 'Графики', tGantt: 'Диаграмма Ганта', tViews: 'План и разрез', tTable: 'Таблица по периодам',
    expSched: 'Экспорт графика', expBlocks: 'Экспорт блоков',
    c1: 'Перемещение горной массы', c2: 'Питание фабрики и содержание', c3: 'Остаток на складе руды', c4: 'Денежный поток',
    ganttHint: 'В каждой ячейке — отметки отработанных уступов этапа и объём горной массы. Насыщенность цвета показывает долю от производительности за период.',
    pitEnd: 'Карьер на конец периода', play: 'Воспроизвести', pause: 'Пауза', colBy: 'Раскраска', cPeriod: 'Период отработки', cPhase: 'Этап', cGrade: 'Содержание',
    plan: 'План', section: 'Разрез', EW: 'Запад–Восток', NS: 'Юг–Север', hoverHint: 'Наведите курсор на блок, чтобы увидеть его данные.',
    close: 'Закрыть', copy: 'Копировать CSV',
    req: 'обязательно', none: '— нет —',
    m_x: 'Восток (X)', m_y: 'Север (Y)', m_z: 'Отметка (Z)', m_dx: 'Размер блока X', m_dy: 'Размер блока Y', m_dz: 'Размер блока Z',
    m_grade: 'Содержание', m_density: 'Плотность', m_tonnes: 'Тоннаж', m_rock: 'Тип породы', m_phase: 'Этап',
    srcInfo: '{0} · строк: {1} · столбцов: {2}', reading: 'Чтение файла {0}…', demoName: 'demo_pit.csv (пример данных)',
    statusOk: 'Блоков: {0} · этапов: {1} · уступов: {2} · расчёт за {3} мс', statusNone: 'Модель не загружена', statusErr: 'Требуется внимание',
    t: 'т', kt: 'тыс. т', Mt: 'млн т', koz: 'тыс. унц', oz: 'унц', gpt: 'г/т', mUSD: 'млн $',
    pb: 'Этап', Y: 'Г', Q: 'К', M: 'М', preMining: 'до начала работ',
    k_life: 'Срок отработки', v_life: '{0} г.', d_life: 'периодов: {0} · до {1}',
    k_moved: 'Горная масса', d_moved: 'коэф. вскрыши {0}',
    k_ore: 'Добыто руды', d_ore: '{0} {1} в массиве',
    k_feed: 'Переработано', d_feed: '{0} {1} · загрузка {2}%',
    k_metal: 'Извлечено металла', d_metal: 'выручка {0}',
    k_npv: 'ЧДД (NPV)', d_npv: 'ставка {0}% · без дисконта {1}',
    l_oreMill: 'Руда на фабрику', l_oreSp: 'Руда на склад', l_waste: 'Вскрыша', l_head: 'Содержание в питании', l_millCap: 'Мощность фабрики',
    l_direct: 'Прямая подача', l_reclaim: 'Со склада', l_spBal: 'Остаток на складе', l_spG: 'Содержание на складе', l_cum: 'Накопленный дисконт. поток', l_cash: 'Денежный поток за период',
    th_period: 'Период', th_moved: 'Горн. масса, тыс. т', th_ore: 'Руда, тыс. т', th_waste: 'Вскрыша, тыс. т', th_strip: 'Коэф. вскрыши', th_oreG: 'Руда, {0}',
    th_feed: 'Переработка, тыс. т', th_head: 'Питание, {0}', th_reclaim: 'Со склада, тыс. т', th_sp: 'Склад, тыс. т', th_metal: 'Металл, {0}',
    th_cash: 'Поток, млн $', th_dcf: 'Дисконт., млн $', total: 'Итого',
    g_title: '{0}, {1}: отметки {2}, {3} тыс. т',
    benchLbl: 'Уступ, отм. {0} · {1} из {2}', notMined: 'Не отработано', below: 'Ниже {0} {1}',
    north: 'С ↑', W: 'З', E: 'В', S: 'Ю', N: 'С',
    info: 'X {0}  Y {1}  отм. {2} · {3} тыс. т · {4} {5} · {6} · {7} · {8}', minedIn: 'отработан: {0}', notSched: 'не запланирован',
    w_stall: 'Расчёт остановился в периоде {0}: ни один блок нельзя отработать. Проверьте производительности, число одновременных этапов и отставание этапов.',
    w_limit: 'Достигнут лимит в {0} периодов, в карьере осталось {1} млн т. Увеличьте производительность по горной массе или макс. число периодов.',
    w_spLeft: 'На складе в конце графика осталось {0} тыс. т руды.',
    w_mill: 'Периодов с недогрузкой фабрики: {0} из {1}. Это нормально для периодов предварительной вскрыши и доработки; если таких периодов намного больше, вскрыто слишком мало руды.',
    e_noHeader: 'Не найдена строка заголовков. В файле должна быть одна строка с названиями столбцов, а затем по строке на каждый блок.',
    e_noRows: 'В файле есть заголовок, но нет строк с блоками.',
    e_needXYZ: 'Сопоставьте столбцы X, Y и Z, чтобы построить модель.',
    e_needGrade: 'Сопоставьте столбец содержания, чтобы построить модель.',
    e_noBlocks: 'После фильтрации не осталось блоков. Проверьте фильтр строк и столбец этапов.',
    e_read: 'Не удалось прочитать файл {0}.',
    x_sched: 'CSV графика по периодам', x_blocks: 'CSV графика по блокам',
    x_schedHint: 'По строке на период. Вставьте в Excel или сохраните как .csv. Десятичный разделитель — точка.',
    x_blocksHint: 'По строке на блок с периодом отработки (0 — не отработан). Импортируйте в Surpac или Vulcan как CSV и раскрасьте модель по полю period.',
    copied: 'Скопировано в буфер обмена.', selected: 'Текст выделен. Нажмите Ctrl+C (⌘C), чтобы скопировать.'
  },
  en: {
    tagline: 'Open-pit mine scheduler',
    s1: 'Block model', dropB: 'Drop a block model CSV here', dropS: 'Surpac or Vulcan CSV / text export · or click to browse',
    demo: 'Load demo pit', colmap: 'Column mapping',
    bx: 'Block size X', by: 'Block size Y', bz: 'Block size Z', dens: 'Default density',
    sizesHint: 'Sizes and density are used only where the file has no column for them.',
    filter: 'Row filter (optional)', fWhere: 'Only include rows where', fTest: 'Test', fValue: 'Value', fValPh: 'e.g. 1',
    s2: 'Pushbacks & benches', phSrc: 'Pushback source', phCol: 'From pushback column', phAuto: 'Auto: slope-parallel rings',
    phN: 'Auto pushbacks', lag: 'Pushback lag', sink: 'Max sink rate', maxAct: 'Max active pushbacks',
    phHint: 'Rows with pushback 0 or blank count as outside the pit. A pushback can mine a bench only when the previous pushback is that many benches deeper.',
    s3: 'Production targets', ppy: 'Period length', month: 'Month', quarter: 'Quarter', year: 'Year', maxP: 'Max periods',
    mineCap: 'Mining capacity', millCap: 'Mill capacity', spCap: 'Stockpile capacity', cog: 'Cut-off grade',
    wasteRk: 'Rock codes always sent to waste', wasteRkPh: 'e.g. OVB, DYKE',
    strat: 'Sequencing priority', stratPhase: 'Pushback order (top-down, earliest pushback first)', stratValue: 'Highest grade first', stratFeed: 'Keep the mill full, strip when it is',
    s4: 'Economics', gUnit: 'Grade unit', gptOpt: 'g/t → reports ounces', pctOpt: '% → reports tonnes of metal',
    price: 'Metal price', rec: 'Recovery', cMine: 'Mining cost', cProc: 'Processing cost', cRe: 'Rehandle cost', disc: 'Discount rate',
    u_m: 'm', u_tm3: 't/m³', u_cnt: 'count', u_ben: 'benches', u_benp: 'benches/period', u_ktp: 'kt/period', u_kt: 'kt', u_comma: 'comma separated',
    u_cMine: '$/t moved', u_cProc: '$/t feed', u_cRe: '$/t reclaimed', u_pyr: '%/yr', u_poz: '$/oz', u_pt: '$/t metal',
    tCharts: 'Charts', tGantt: 'Gantt', tViews: 'Plan & section', tTable: 'Period table',
    expSched: 'Export schedule', expBlocks: 'Export blocks',
    c1: 'Material movement', c2: 'Mill feed and head grade', c3: 'Stockpile balance', c4: 'Cash flow',
    ganttHint: "Each cell shows the bench RLs mined in that pushback and the tonnes moved. Shading is the share of the period's mining capacity.",
    pitEnd: 'Pit at end of', play: 'Play', pause: 'Pause', colBy: 'Colour by', cPeriod: 'Period mined', cPhase: 'Pushback', cGrade: 'Grade',
    plan: 'Plan view', section: 'Section', EW: 'West–East', NS: 'South–North', hoverHint: 'Hover a block to inspect it.',
    close: 'Close', copy: 'Copy CSV',
    req: 'required', none: '— none —',
    m_x: 'Easting (X)', m_y: 'Northing (Y)', m_z: 'Elevation (Z)', m_dx: 'Block size X', m_dy: 'Block size Y', m_dz: 'Block size Z',
    m_grade: 'Grade', m_density: 'Density', m_tonnes: 'Tonnes', m_rock: 'Rock type', m_phase: 'Pushback',
    srcInfo: '{0} · {1} rows · {2} columns', reading: 'Reading {0}…', demoName: 'demo_pit.csv (example data)',
    statusOk: '{0} blocks · {1} pushbacks · {2} benches · scheduled in {3} ms', statusNone: 'No model loaded', statusErr: 'Needs attention',
    t: 't', kt: 'kt', Mt: 'Mt', koz: 'koz', oz: 'oz', gpt: 'g/t', mUSD: '$M',
    pb: 'PB', Y: 'Y', Q: 'Q', M: 'M', preMining: 'pre-mining',
    k_life: 'Mine life', v_life: '{0} yr', d_life: '{0} periods · to {1}',
    k_moved: 'Total moved', d_moved: 'strip ratio {0}',
    k_ore: 'Ore mined', d_ore: '{0} {1} in situ',
    k_feed: 'Mill feed', d_feed: '{0} {1} · {2}% utilised',
    k_metal: 'Metal recovered', d_metal: '{0} revenue',
    k_npv: 'NPV', d_npv: 'at {0}% · undiscounted {1}',
    l_oreMill: 'Ore to mill', l_oreSp: 'Ore to stockpile', l_waste: 'Waste', l_head: 'Head grade', l_millCap: 'Mill capacity',
    l_direct: 'Direct feed', l_reclaim: 'Reclaimed', l_spBal: 'Closing balance', l_spG: 'Stockpile grade', l_cum: 'Cumulative discounted', l_cash: 'Period cash flow',
    th_period: 'Period', th_moved: 'Moved kt', th_ore: 'Ore kt', th_waste: 'Waste kt', th_strip: 'Strip', th_oreG: 'Ore {0}',
    th_feed: 'Feed kt', th_head: 'Head {0}', th_reclaim: 'Reclaim kt', th_sp: 'Stockpile kt', th_metal: 'Metal {0}',
    th_cash: 'Cash $M', th_dcf: 'Disc. $M', total: 'Total',
    g_title: '{0} {1}: RL {2}, {3} kt',
    benchLbl: 'Bench RL {0} · {1} of {2}', notMined: 'Not yet mined', below: 'Below {0} {1}',
    north: 'N ↑', W: 'W', E: 'E', S: 'S', N: 'N',
    info: 'X {0}  Y {1}  RL {2} · {3} kt · {4} {5} · {6} · {7} · {8}', minedIn: 'mined {0}', notSched: 'not scheduled',
    w_stall: 'Scheduling stalled in period {0}: no block could be mined. Check capacities, max active pushbacks and the pushback lag.',
    w_limit: 'Reached the {0}-period limit with {1} Mt still in the pit. Raise mining capacity or max periods.',
    w_spLeft: '{0} kt of ore is left on the stockpile at the end of the schedule.',
    w_mill: 'The mill runs below capacity in {0} of {1} periods. Pre-strip and ramp-down periods are normal; many more points to too little ore exposed.',
    e_noHeader: "Couldn't find a header row. The file needs one row of column names followed by one row per block.",
    e_noRows: 'The file has a header but no block rows.',
    e_needXYZ: 'Map the X, Y and Z columns to build the model.',
    e_needGrade: 'Map a grade column to build the model.',
    e_noBlocks: 'No blocks left after filtering. Check the row filter and pushback column.',
    e_read: "Couldn't read {0}.",
    x_sched: 'Period schedule CSV', x_blocks: 'Block schedule CSV',
    x_schedHint: 'One row per period. Paste into Excel, or save as .csv.',
    x_blocksHint: 'One row per block with its scheduled period (0 = not mined). Import it into Surpac or Vulcan as a CSV and use the period field to colour the model.',
    copied: 'Copied to clipboard.', selected: 'Selected. Press Ctrl+C (⌘C) to copy.'
  }
};

const $ = s => document.querySelector(s);
const S = { lang: 'ru', parsed: null, src: null, map: {}, model: null, U: null, res: null, err: null, charts: [], ms: 0, rects: { plan: [], sect: [] }, exportKind: null };
try { const l = localStorage.getItem('benchline-lang'); if (l === 'en' || l === 'ru') S.lang = l; } catch (e) {}
const t = (k, ...a) => { const s = (I18N[S.lang][k] ?? I18N.en[k] ?? k); return a.length ? s.replace(/\{(\d)\}/g, (_, i) => a[i]) : s; };
const loc = () => S.lang === 'ru' ? 'ru-RU' : 'en-US';
const nf = (v, d = 0) => Number(v).toLocaleString(loc(), { minimumFractionDigits: d, maximumFractionDigits: d });
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const num = id => { const v = parseFloat(String($('#' + id).value).replace(',', '.')); return isFinite(v) ? v : 0; };
const PHC = ['#3a7bd5', '#d9540b', '#2f8a4a', '#8e4ec6', '#c23a2b', '#0f8fa8', '#b8930f', '#6b7a8f', '#d1497a', '#4f6d1f', '#7a4b2a', '#2a5b8a'];
const RAMP_P = [[33, 60, 110], [32, 122, 140], [86, 166, 104], [214, 186, 60], [226, 98, 36]];
const RAMP_G = [[246, 214, 92], [236, 142, 40], [196, 44, 40]];
const ramp = (st, v) => { v = Math.max(0, Math.min(1, v)); const f = v * (st.length - 1), i = Math.min(st.length - 2, Math.floor(f)), u = f - i; const c = st[i].map((x, k) => Math.round(x + (st[i + 1][k] - x) * u)); return `rgb(${c})`; };
const fT = v => v >= 1e6 ? nf(v / 1e6, 2) + ' ' + t('Mt') : nf(v / 1e3) + ' ' + t('kt');
const fK = v => nf(v / 1e3);
const fM = v => S.lang === 'ru' ? (v < 0 ? '−' : '') + nf(Math.abs(v) / 1e6, 1) + ' млн $' : (v < 0 ? '−$' : '$') + nf(Math.abs(v) / 1e6, 1) + 'M';
const gU = () => $('#gUnit').value === 'gpt' ? t('gpt') : '%';
const mU = () => $('#gUnit').value === 'gpt' ? t('oz') : t('t');
const phName = k => t('pb') + ' ' + S.model.phaseKeys[k];
const perName = (p, short) => {
  const ppy = +$('#ppy').value, y = Math.ceil(p / ppy), k = (p - 1) % ppy + 1;
  if (ppy === 1) return t('Y') + y;
  return `${t('Y')}${y}${short ? '' : ' '}${ppy === 4 ? t('Q') : t('M')}${k}`;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function applyStatic() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
  document.querySelectorAll('[data-ip]').forEach(e => { e.placeholder = t(e.dataset.ip); });
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === S.lang));
  $('#benchSl').setAttribute('aria-label', t('plan')); $('#secSl').setAttribute('aria-label', t('section')); $('#secDir').setAttribute('aria-label', t('section'));
  $('#play').textContent = t(S.view.play ? 'pause' : 'play');
  $('#viewInfo').textContent = t('hoverHint');
  if (S.parsed) buildMapUI(true);
  renderSrc();
  if (!$('#modal').hidden && S.exportKind) openExport(S.exportKind);
}
function setLang(l) {
  S.lang = l;
  try { localStorage.setItem('benchline-lang', l); } catch (e) {}
  applyStatic(); renderAll();
}

function params() {
  return {
    mineCap: num('mineCap') * 1e3, millCap: num('millCap') * 1e3, spCap: num('spCap') * 1e3,
    lag: Math.max(0, num('lag') | 0), sink: Math.max(1, num('sink') | 0), maxActive: Math.max(1, num('maxAct') | 0),
    maxPeriods: Math.max(1, Math.min(400, num('maxP') | 0)), strategy: $('#strat').value, ppy: +$('#ppy').value,
    gUnit: $('#gUnit').value, price: num('price'), rec: num('rec') / 100, cMine: num('cMine'), cProc: num('cProc'), cRe: num('cRe'), disc: num('disc') / 100
  };
}

function buildMapUI(keep) {
  const P = S.parsed, g = $('#mapGrid');
  const prev = keep ? Object.fromEntries(Engine.ORDER.map(k => [k, $('#map_' + k) ? $('#map_' + k).value : -1])) : null;
  const prevF = keep ? $('#fCol').value : null;
  const opts = [`<option value="-1">${t('none')}</option>`, ...P.headers.map((h, i) => `<option value="${i}">${esc(h)}</option>`)].join('');
  g.innerHTML = Engine.ORDER.map(k => `<label class="field"><span>${t('m_' + k)}${['x', 'y', 'z', 'grade'].includes(k) ? ' <em>' + t('req') + '</em>' : ''}</span><select id="map_${k}" data-lv="model">${opts}</select></label>`).join('');
  for (const k of Engine.ORDER) $('#map_' + k).value = keep ? prev[k] : (S.map[k] != null ? S.map[k] : -1);
  $('#fCol').innerHTML = opts;
  if (keep) $('#fCol').value = prevF;
  else { $('#fCol').value = -1; $('#fVal').value = ''; $('#phSrc').value = S.map.phase != null ? 'col' : 'auto'; }
}
function renderSrc() {
  const s = S.src;
  if (!s) { $('#srcInfo').textContent = ''; return; }
  if (s.reading) { $('#srcInfo').textContent = t('reading', s.name); return; }
  $('#srcInfo').textContent = t('srcInfo', s.demo ? t('demoName') : s.name, nf(s.n), s.c);
}

function loadText(text, name, demo) {
  try {
    S.parsed = Engine.parseText(text);
    S.src = { name, demo, n: S.parsed.n, c: S.parsed.headers.length };
    S.map = Engine.detect(S.parsed.headers, S.parsed.numeric);
    buildMapUI(false); renderSrc();
    run('model');
  } catch (e) { S.err = { k: e.code, msg: e.message }; S.model = null; S.res = null; renderSrc(); renderAll(); }
}

function run(level) {
  const t0 = performance.now();
  S.err = null;
  try {
    if (!S.parsed) return;
    if (level === 'model' || !S.model) {
      for (const k of Engine.ORDER) { const v = +$('#map_' + k).value; S.map[k] = v >= 0 ? v : null; }
      S.model = Engine.buildModel(S.parsed, S.map, {
        bx: num('bx') || 1, by: num('by') || 1, bz: num('bz') || 1, dens: num('dens') || 2.7,
        phSrc: $('#phSrc').value === 'col' && S.map.phase != null ? 'col' : 'auto', phN: num('phN') || 1,
        filter: { col: +$('#fCol').value, op: $('#fOp').value, val: $('#fVal').value.trim() }
      });
      S.view.firstBench = null; S.view.sec = -1;
    }
    const ws = new Set($('#wasteRk').value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean));
    S.U = Engine.buildUnits(S.model, num('cog'), ws);
    S.res = Engine.schedule(S.model, S.U, params());
    S.view.period = S.res.periods.length;
  } catch (e) { S.err = { k: e.code, msg: e.message }; S.res = null; if (level === 'model') S.model = null; }
  S.ms = performance.now() - t0;
  renderAll();
}
let timer = null;
const queue = lv => { queue.lv = queue.lv === 'model' ? 'model' : lv; clearTimeout(timer); timer = setTimeout(() => { const l = queue.lv; queue.lv = null; run(l); }, 220); };

S.view = { period: 1, bench: 0, sec: -1, play: null, firstBench: null };

function renderAll() {
  $('#cogU').textContent = gU(); $('#priceU').textContent = $('#gUnit').value === 'gpt' ? t('u_poz') : t('u_pt');
  renderAlerts(); renderKPIs(); renderCharts(); renderGantt(); renderTable(); setupViews(); renderViews();
}

function warnText(w) {
  if (w.k === 'stall') return t('w_stall', w.a[0]);
  if (w.k === 'limit') return t('w_limit', w.a[0], nf(w.a[1] / 1e6, 2));
  if (w.k === 'spLeft') return t('w_spLeft', nf(w.a[0] / 1e3));
  return w.k;
}
function renderAlerts() {
  const a = [];
  if (S.err) a.push(`<div class="alert err">${esc(S.err.k ? t('e_' + S.err.k) : S.err.msg)}</div>`);
  if (S.res) {
    for (const w of S.res.warnings) a.push(`<div class="alert">${esc(warnText(w))}</div>`);
    const p = params(), under = S.res.periods.filter(r => r.feed < p.millCap * 0.98).length;
    if (under > 1 && p.millCap > 0) a.push(`<div class="alert">${esc(t('w_mill', under, S.res.periods.length))}</div>`);
  }
  $('#alerts').innerHTML = a.join('');
  const m = S.model;
  $('#status').textContent = m && S.res ? t('statusOk', nf(m.n), m.phaseKeys.length, m.benchZ.length, nf(S.ms)) : (S.err ? t('statusErr') : t('statusNone'));
}

function renderKPIs() {
  const r = S.res;
  if (!r || !r.periods.length) { $('#kpis').innerHTML = ''; return; }
  const T = r.totals, p = params(), n = r.periods.length;
  const g = T.ore ? T.oreMetal / T.ore : 0, fg = T.feed ? T.feedMetal / T.feed : 0;
  const mFmt = $('#gUnit').value === 'gpt' ? nf(T.metal / 1e3) + ' ' + t('koz') : nf(T.metal / 1e3, 1) + ' ' + t('kt');
  const util = p.millCap ? T.feed / (p.millCap * n) * 100 : 0;
  const K = [
    [t('k_life'), t('v_life', nf(n / p.ppy, 1)), t('d_life', n, perName(n))],
    [t('k_moved'), fT(T.moved), t('d_moved', nf(T.ore ? T.waste / T.ore : 0, 2))],
    [t('k_ore'), fT(T.ore), t('d_ore', nf(g, 2), gU())],
    [t('k_feed'), fT(T.feed), t('d_feed', nf(fg, 2), gU(), nf(util))],
    [t('k_metal'), mFmt, t('d_metal', fM(T.revenue))],
    [t('k_npv'), fM(T.npv), t('d_npv', nf(p.disc * 100, 1), fM(T.cash))]
  ];
  $('#kpis').innerHTML = K.map((k, i) => `<div class="kpi${i === 5 ? ' npv' : ''}"><span class="k">${esc(k[0])}</span><span class="v">${esc(k[1])}</span><span class="d">${esc(k[2])}</span></div>`).join('');
}

function renderCharts() {
  S.charts.forEach(c => c.destroy()); S.charts = [];
  const r = S.res; if (!r || !r.periods.length || !window.Chart) return;
  const P = r.periods, labels = P.map(x => perName(x.t, true)), p = params();
  const ink = css('--muted'), grid = css('--line');
  Chart.defaults.font.family = css('--f-body'); Chart.defaults.font.size = 11; Chart.defaults.color = ink;
  const base = (y2) => ({
    responsive: true, maintainAspectRatio: false, animation: false, locale: loc(), interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 10 } } },
    scales: Object.assign({ x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 12 } },
      y: { stacked: true, grid: { color: grid }, border: { display: false }, title: { display: true, text: t('kt') } } },
      y2 ? { y2: { position: 'right', grid: { display: false }, border: { display: false }, beginAtZero: true, title: { display: true, text: y2 } } } : {})
  });
  const kt = f => P.map(x => +(x[f] / 1e3).toFixed(1));
  const ore = css('--ore'), waste = css('--waste'), spc = css('--sp'), acc = css('--accent');
  S.charts.push(new Chart($('#c1'), { type: 'bar', data: { labels, datasets: [
    { label: t('l_oreMill'), data: kt('direct'), backgroundColor: ore },
    { label: t('l_oreSp'), data: kt('toSp'), backgroundColor: spc },
    { label: t('l_waste'), data: kt('waste'), backgroundColor: waste }] }, options: base() }));
  const o2 = base(gU()); o2.scales.y2.stacked = false;
  S.charts.push(new Chart($('#c2'), { type: 'bar', data: { labels, datasets: [
    { type: 'line', label: t('l_head'), data: P.map(x => x.feed ? +(x.feedMetal / x.feed).toFixed(3) : null), borderColor: acc, backgroundColor: acc, yAxisID: 'y2', pointRadius: 0, borderWidth: 2, tension: .25 },
    { type: 'line', label: t('l_millCap'), data: P.map(() => p.millCap / 1e3), borderColor: ink, borderDash: [4, 4], borderWidth: 1, pointRadius: 0, stack: 'cap' },
    { label: t('l_direct'), data: kt('direct'), backgroundColor: ore },
    { label: t('l_reclaim'), data: kt('reclaim'), backgroundColor: spc }] }, options: o2 }));
  const o3 = base(gU()); o3.scales.y.stacked = false; o3.scales.x.stacked = false; o3.scales.y.beginAtZero = true;
  S.charts.push(new Chart($('#c3'), { type: 'line', data: { labels, datasets: [
    { label: t('l_spBal'), data: kt('spT'), borderColor: spc, backgroundColor: spc + '33', fill: true, pointRadius: 0, borderWidth: 2, stepped: true },
    { label: t('l_spG'), data: P.map(x => x.spT > 0 ? +x.spG.toFixed(3) : null), borderColor: acc, yAxisID: 'y2', pointRadius: 0, borderWidth: 1.5 }] }, options: o3 }));
  const o4 = base(); o4.scales.y.stacked = false; o4.scales.x.stacked = false; o4.scales.y.title.text = t('mUSD');
  S.charts.push(new Chart($('#c4'), { type: 'bar', data: { labels, datasets: [
    { type: 'line', label: t('l_cum'), data: P.map(x => +(x.cumDcf / 1e6).toFixed(2)), borderColor: acc, pointRadius: 0, borderWidth: 2 },
    { label: t('l_cash'), data: P.map(x => +(x.cash / 1e6).toFixed(2)), backgroundColor: P.map(x => x.cash >= 0 ? css('--good') : css('--bad')) }] }, options: o4 }));
}

function renderGantt() {
  const r = S.res, m = S.model, el = $('#gantt');
  if (!r || !m) { el.innerHTML = ''; return; }
  const cap = params().mineCap, P = r.periods;
  let h = `<thead><tr><th>${t('cPhase')}</th>${P.map(x => `<th>${perName(x.t, true)}</th>`).join('')}</tr></thead><tbody>`;
  m.phaseKeys.forEach((_, k) => {
    const name = phName(k);
    h += `<tr><td><span class="swatch" style="background:${PHC[k % PHC.length]}"></span>${esc(name)}</td>`;
    for (const x of P) {
      const c = x.ph[k];
      if (!c) { h += '<td></td>'; continue; }
      const pct = Math.max(8, Math.min(100, c.t / cap * 100));
      const rl = c.zTop === c.zBot ? `${c.zTop}` : `${c.zTop}–${c.zBot}`;
      h += `<td class="c" style="background:color-mix(in srgb, ${PHC[k % PHC.length]} ${(pct * 0.55).toFixed(0)}%, transparent)" title="${esc(t('g_title', name, perName(x.t), rl, fK(c.t)))}">${rl}<small>${fK(c.t)} ${t('kt')}</small></td>`;
    }
    h += '</tr>';
  });
  el.innerHTML = h + '</tbody>';
}

function renderTable() {
  const r = S.res, el = $('#ptable');
  if (!r || !r.periods.length) { el.innerHTML = ''; return; }
  const u = gU(), mu = mU();
  const cols = [
    [t('th_period'), x => perName(x.t)], [t('th_moved'), x => fK(x.moved)], [t('th_ore'), x => fK(x.ore)], [t('th_waste'), x => fK(x.waste)],
    [t('th_strip'), x => x.ore ? nf(x.waste / x.ore, 2) : '—'], [t('th_oreG', u), x => x.ore ? nf(x.oreMetal / x.ore, 2) : '—'],
    [t('th_feed'), x => fK(x.feed)], [t('th_head', u), x => x.feed ? nf(x.feedMetal / x.feed, 2) : '—'], [t('th_reclaim'), x => fK(x.reclaim)],
    [t('th_sp'), x => fK(x.spT)], [t('th_metal', mu), x => nf(x.metal)], [t('th_cash'), x => nf(x.cash / 1e6, 1)], [t('th_dcf'), x => nf(x.dcf / 1e6, 1)]
  ];
  const T = r.totals;
  const tot = [t('total'), fK(T.moved), fK(T.ore), fK(T.waste), T.ore ? nf(T.waste / T.ore, 2) : '—', T.ore ? nf(T.oreMetal / T.ore, 2) : '—', fK(T.feed), T.feed ? nf(T.feedMetal / T.feed, 2) : '—', fK(T.reclaim), '', nf(T.metal), nf(T.cash / 1e6, 1), nf(T.npv / 1e6, 1)];
  el.innerHTML = `<thead><tr>${cols.map(c => `<th>${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${r.periods.map(x => `<tr>${cols.map(c => `<td>${c[1](x)}</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr>${tot.map(v => `<td>${v}</td>`).join('')}</tr></tfoot>`;
}

/* ---------- plan & section views ---------- */
function setupViews() {
  const m = S.model, r = S.res;
  if (!m || !r) return;
  const sl = $('#perSl'); sl.max = r.periods.length; sl.value = S.view.period;
  const bs = $('#benchSl'); bs.max = m.benchZ.length - 1;
  if (S.view.firstBench == null) {
    const ore = new Float64Array(m.benchZ.length); const cog = num('cog');
    for (let i = 0; i < m.n; i++) if (m.g[i] >= cog) ore[m.bench[i]] += m.t[i];
    S.view.bench = Math.max(0, ore.indexOf(Math.max(...ore))); S.view.firstBench = 1; S.view.sec = -1;
  }
  bs.value = S.view.bench;
  const list = $('#secDir').value === 'EW' ? m.ys : m.xs;
  const ss = $('#secSl'); ss.max = list.length - 1;
  if (S.view.sec < 0 || S.view.sec > list.length - 1) {
    let best = 0, bd = Infinity; const c = $('#secDir').value === 'EW' ? (m.ext.y0 + m.ext.y1) / 2 : (m.ext.x0 + m.ext.x1) / 2;
    list.forEach((v, i) => { if (Math.abs(v - c) < bd) { bd = Math.abs(v - c); best = i; } });
    S.view.sec = best;
  }
  ss.value = S.view.sec;
}
function blockColor(i, mode, per, bp, cog, gmax) {
  const p = bp[i], mined = p > 0 && p <= per;
  if (mode === 'period') return mined ? ramp(RAMP_P, (p - 1) / Math.max(1, S.res.periods.length - 1)) : null;
  if (!mined) return null;
  if (mode === 'phase') return PHC[S.model.phase[i] % PHC.length];
  const g = S.model.g[i];
  return g < cog ? css('--waste') : ramp(RAMP_G, (g - cog) / Math.max(1e-9, gmax - cog));
}
function sizeCanvas(cv, wW, wH) {
  const w = cv.clientWidth || cv.parentElement.clientWidth || 400;
  const h = Math.max(160, Math.min(520, w * wH / wW));
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px';
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
function gradeMax() {
  if (S.view.gmaxModel === S.model) return S.view.gmax;
  const a = Array.from(S.model.g).sort((x, y) => x - y);
  S.view.gmax = a[Math.floor(a.length * 0.98)] || 1; S.view.gmaxModel = S.model; return S.view.gmax;
}
function renderViews() {
  const panel = document.querySelector('[data-panel="views"]');
  const m = S.model, r = S.res;
  if (panel.hidden || !m || !r) return;
  const per = S.view.period, mode = $('#colMode').value, bp = r.blockPeriod, cog = num('cog'), gmax = gradeMax();
  const rest = css('--rest'), muted = css('--muted');
  $('#perLbl').textContent = per === 0 ? t('preMining') : perName(per);
  {
    const E = m.ext, pad = 8, b = S.view.bench;
    const cv = $('#plan'), { ctx, w, h } = sizeCanvas(cv, E.x1 - E.x0, E.y1 - E.y0);
    const s = Math.min((w - 2 * pad) / (E.x1 - E.x0), (h - 2 * pad) / (E.y1 - E.y0));
    const ox = (w - s * (E.x1 - E.x0)) / 2, oy = (h - s * (E.y1 - E.y0)) / 2;
    ctx.clearRect(0, 0, w, h);
    const rects = [];
    for (let i = 0; i < m.n; i++) {
      if (m.bench[i] !== b) continue;
      const x = ox + (m.x[i] - m.dx[i] / 2 - E.x0) * s, y = oy + (E.y1 - (m.y[i] + m.dy[i] / 2)) * s, bw = m.dx[i] * s, bh = m.dy[i] * s;
      ctx.fillStyle = blockColor(i, mode, per, bp, cog, gmax) || rest;
      ctx.fillRect(x, y, Math.max(1, bw - (bw > 4 ? 0.6 : 0)), Math.max(1, bh - (bh > 4 ? 0.6 : 0)));
      rects.push([x, y, bw, bh, i]);
    }
    ctx.strokeStyle = muted; ctx.setLineDash([5, 4]); ctx.lineWidth = 1; ctx.beginPath();
    if ($('#secDir').value === 'EW') { const yy = oy + (E.y1 - m.ys[S.view.sec]) * s; ctx.moveTo(0, yy); ctx.lineTo(w, yy); }
    else { const xx = ox + (m.xs[S.view.sec] - E.x0) * s; ctx.moveTo(xx, 0); ctx.lineTo(xx, h); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = muted; ctx.font = `11px ${css('--f-mono')}`; ctx.fillText(t('north'), w - 30, 16);
    S.rects.plan = rects;
    $('#benchLbl').textContent = t('benchLbl', m.benchZ[b], b + 1, m.benchZ.length);
  }
  {
    const E = m.ext, pad = 8, ew = $('#secDir').value === 'EW';
    const list = ew ? m.ys : m.xs, at = list[S.view.sec];
    const a0 = ew ? E.x0 : E.y0, a1 = ew ? E.x1 : E.y1;
    const cv = $('#sect'), { ctx, w, h } = sizeCanvas(cv, a1 - a0, Math.max((E.z1 - E.z0) * 1.6, (a1 - a0) * 0.45));
    const s = Math.min((w - 2 * pad) / (a1 - a0), (h - 2 * pad) / (E.z1 - E.z0));
    const ox = (w - s * (a1 - a0)) / 2, oy = (h - s * (E.z1 - E.z0)) / 2;
    ctx.clearRect(0, 0, w, h);
    const rects = [];
    for (let i = 0; i < m.n; i++) {
      const c = ew ? m.y[i] : m.x[i], half = (ew ? m.dy[i] : m.dx[i]) / 2;
      if (Math.abs(c - at) > half * 0.999) continue;
      const a = ew ? m.x[i] : m.y[i], da = ew ? m.dx[i] : m.dy[i];
      const x = ox + (a - da / 2 - a0) * s, y = oy + (E.z1 - (m.z[i] + m.dz[i] / 2)) * s, bw = da * s, bh = m.dz[i] * s;
      ctx.fillStyle = blockColor(i, mode, per, bp, cog, gmax) || rest;
      ctx.fillRect(x, y, Math.max(1, bw - (bw > 4 ? 0.6 : 0)), Math.max(1, bh - (bh > 4 ? 0.6 : 0)));
      rects.push([x, y, bw, bh, i]);
    }
    const zb = m.benchZ[S.view.bench], yb = oy + (E.z1 - zb) * s;
    ctx.strokeStyle = muted; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(0, yb); ctx.lineTo(w, yb); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = muted; ctx.font = `11px ${css('--f-mono')}`;
    ctx.fillText(ew ? t('W') : t('S'), 4, h - 6); ctx.fillText(ew ? t('E') : t('N'), w - 12, h - 6);
    S.rects.sect = rects;
    $('#secLbl').textContent = `${ew ? 'Y' : 'X'} = ${at}`;
  }
  const lg = $('#legend'), nm = `<span><span class="swatch" style="background:var(--rest);border:1px solid var(--line)"></span>${t('notMined')}</span>`;
  if (mode === 'period') {
    lg.innerHTML = `<span>${perName(1)}</span><span class="ramp" style="background:linear-gradient(90deg,${[0, .25, .5, .75, 1].map(v => ramp(RAMP_P, v)).join(',')})"></span><span>${perName(r.periods.length)}</span><span style="margin-left:12px"></span>${nm}`;
  } else if (mode === 'phase') {
    lg.innerHTML = m.phaseKeys.map((_, k) => `<span><span class="swatch" style="background:${PHC[k % PHC.length]}"></span>${esc(phName(k))}</span>`).join('') + nm;
  } else {
    lg.innerHTML = `<span><span class="swatch" style="background:var(--waste)"></span>${t('below', nf(cog, 2), gU())}</span><span>${nf(cog, 2)}</span><span class="ramp" style="background:linear-gradient(90deg,${[0, .5, 1].map(v => ramp(RAMP_G, v)).join(',')})"></span><span>${nf(gmax, 2)}+ ${gU()}</span>${nm}`;
  }
}
function hover(which, ev) {
  const cv = ev.currentTarget, b = cv.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top;
  const hit = S.rects[which].find(r => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]);
  if (!hit) { $('#viewInfo').textContent = t('hoverHint'); return; }
  const m = S.model, i = hit[4], p = S.res.blockPeriod[i];
  $('#viewInfo').textContent = t('info', m.x[i], m.y[i], m.z[i], fK(m.t[i]), nf(m.g[i], 2), gU(), m.rockNames[m.rock[i]], phName(m.phase[i]), p ? t('minedIn', perName(p)) : t('notSched'));
}

/* ---------- export ---------- */
function openExport(kind) {
  if (!S.res) return;
  S.exportKind = kind;
  let csv, hint;
  if (kind === 'sched') {
    const gl = $('#gUnit').value === 'gpt' ? 'gpt' : 'pct';
    csv = [`period,label,moved_t,ore_t,waste_t,ore_grade_${gl},feed_t,head_grade_${gl},reclaim_t,stockpile_t,metal_${$('#gUnit').value === 'gpt' ? 'oz' : 't'},revenue_usd,cost_usd,cash_usd,discounted_cash_usd`,
      ...S.res.periods.map(x => [x.t, perName(x.t), x.moved.toFixed(0), x.ore.toFixed(0), x.waste.toFixed(0), x.ore ? (x.oreMetal / x.ore).toFixed(3) : 0, x.feed.toFixed(0), x.feed ? (x.feedMetal / x.feed).toFixed(3) : 0, x.reclaim.toFixed(0), x.spT.toFixed(0), x.metal.toFixed(0), x.revenue.toFixed(0), x.cost.toFixed(0), x.cash.toFixed(0), x.dcf.toFixed(0)].join(','))].join('\n');
    hint = t('x_schedHint');
  } else {
    const m = S.model, bp = S.res.blockPeriod, L = ['x,y,z,tonnes,grade,rock,pushback,period'];
    for (let i = 0; i < m.n; i++) L.push(`${m.x[i]},${m.y[i]},${m.z[i]},${m.t[i].toFixed(1)},${m.g[i]},${m.rockNames[m.rock[i]]},${m.phaseKeys[m.phase[i]]},${bp[i]}`);
    csv = L.join('\n');
    hint = t('x_blocksHint');
  }
  $('#mTitle').textContent = kind === 'sched' ? t('x_sched') : t('x_blocks');
  $('#mHint').textContent = hint; $('#mText').value = csv; $('#mMsg').textContent = '';
  if ($('#modal').hidden) { $('#modal').hidden = false; $('#mCopy').focus(); }
}
$('#mCopy').addEventListener('click', () => {
  const ta = $('#mText');
  const fallback = () => { ta.focus(); ta.select(); $('#mMsg').textContent = t('selected'); };
  try { navigator.clipboard.writeText(ta.value).then(() => $('#mMsg').textContent = t('copied'), fallback); } catch (e) { fallback(); }
});
const closeModal = () => { $('#modal').hidden = true; S.exportKind = null; };
$('#mClose').addEventListener('click', closeModal);
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
$('#expSched').addEventListener('click', () => openExport('sched'));
$('#expBlocks').addEventListener('click', () => openExport('blocks'));

/* ---------- wiring ---------- */
document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => { if (S.lang !== b.dataset.lang) setLang(b.dataset.lang); }));
$('#side').addEventListener('input', e => { if (e.target.id === 'file') return; queue(e.target.dataset.lv || 'sched'); });
$('#side').addEventListener('change', e => { if (e.target.tagName === 'SELECT') queue(e.target.dataset.lv || 'sched'); });
$('#file').addEventListener('change', e => { const f = e.target.files[0]; if (f) readFile(f); });
function readFile(f) {
  S.src = { name: f.name, reading: true }; renderSrc();
  const fr = new FileReader();
  fr.onload = () => loadText(String(fr.result), f.name, false);
  fr.onerror = () => { S.err = { msg: t('e_read', f.name) }; S.src = null; renderSrc(); renderAll(); };
  fr.readAsText(f);
}
const drop = $('#drop');
['dragenter', 'dragover'].forEach(ty => drop.addEventListener(ty, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ty => drop.addEventListener(ty, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) readFile(f); });
$('#demoBtn').addEventListener('click', () => loadText(Engine.demoCSV(), 'demo_pit.csv', true));

document.querySelectorAll('.tab').forEach(tb => tb.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', x === tb));
  document.querySelectorAll('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== tb.dataset.tab);
  try { localStorage.setItem('benchline-tab', tb.dataset.tab); } catch (e) {}
  if (tb.dataset.tab === 'views') renderViews();
}));
$('#perSl').addEventListener('input', e => { S.view.period = +e.target.value; renderViews(); });
$('#benchSl').addEventListener('input', e => { S.view.bench = +e.target.value; renderViews(); });
$('#secSl').addEventListener('input', e => { S.view.sec = +e.target.value; renderViews(); });
$('#secDir').addEventListener('change', () => { S.view.sec = -1; setupViews(); renderViews(); });
$('#colMode').addEventListener('change', renderViews);
$('#plan').addEventListener('mousemove', e => hover('plan', e));
$('#sect').addEventListener('mousemove', e => hover('sect', e));
$('#play').addEventListener('click', () => {
  if (S.view.play) { clearInterval(S.view.play); S.view.play = null; $('#play').textContent = t('play'); return; }
  if (!S.res) return;
  const n = S.res.periods.length; if (S.view.period >= n) S.view.period = 0;
  $('#play').textContent = t('pause');
  S.view.play = setInterval(() => {
    S.view.period++; $('#perSl').value = S.view.period; renderViews();
    if (S.view.period >= n) { clearInterval(S.view.play); S.view.play = null; $('#play').textContent = t('play'); }
  }, 450);
});
let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(renderViews, 120); });
const retheme = () => { renderCharts(); renderViews(); };
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retheme); } catch (e) {}
new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

applyStatic();
try { const tb = localStorage.getItem('benchline-tab'); if (tb) { const b = document.querySelector(`.tab[data-tab="${tb}"]`); if (b) b.click(); } } catch (e) {}
loadText(Engine.demoCSV(), 'demo_pit.csv', true);
