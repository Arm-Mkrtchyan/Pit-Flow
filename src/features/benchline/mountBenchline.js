/* Benchline — mountBenchline.js (was app.js)
 * Formatting helpers, scheduler UI: settings, KPIs, charts, Gantt, plan/section, table, export modal.
 * mountBenchline(root, { lang }) renders into `root` (which already holds template.html) and returns { setLang, destroy }.
 * All element lookups are scoped to `root`; IDs carry a bl- prefix. Translations live in shared/i18n as bl.* keys.
 */
import { en } from '../../shared/i18n/en';
import { translate } from '../../shared/i18n/t';
import { Engine } from './engine/scheduleEngine.js';
import { mountDtmTab } from './dtmTab.js';
import { Chart } from './vendor.js';

const LOCALES = { ru: 'ru-RU', en: 'en-US', hy: 'hy-AM' };
const BOM = '\uFEFF';

/** Mount Benchline into `root`. Returns { setLang(lang), destroy() }. */
export function mountBenchline(root, opts = {}) {
const $ = s => root.querySelector(s);
const S = { lang: LOCALES[opts.lang] ? opts.lang : 'ru', parsed: null, src: null, map: {}, model: null, U: null, res: null, err: null, charts: [], ms: 0, rects: { plan: [], sect: [] }, exportKind: null, exportFile: null };
// Everything registered on window/document or observing outside `root`; released by destroy().
const cleanups = [];
const listen = (target, type, fn, o) => { target.addEventListener(type, fn, o); cleanups.push(() => target.removeEventListener(type, fn, o)); };
const t = (k, ...a) => {
  const key = 'bl.' + k;
  if (!(key in en)) return k;
  return translate(S.lang, key, a.length ? Object.fromEntries(a.map((v, i) => [i, v])) : undefined);
};
const loc = () => LOCALES[S.lang];
const nf = (v, d = 0) => Number(v).toLocaleString(loc(), { minimumFractionDigits: d, maximumFractionDigits: d });
const css = n => getComputedStyle(root).getPropertyValue(n).trim();
const num = id => { const v = parseFloat(String($('#bl-' + id).value).replace(',', '.')); return isFinite(v) ? v : 0; };
const PHC = ['#3a7bd5', '#d9540b', '#2f8a4a', '#8e4ec6', '#c23a2b', '#0f8fa8', '#b8930f', '#6b7a8f', '#d1497a', '#4f6d1f', '#7a4b2a', '#2a5b8a'];
const RAMP_P = [[33, 60, 110], [32, 122, 140], [86, 166, 104], [214, 186, 60], [226, 98, 36]];
const RAMP_G = [[246, 214, 92], [236, 142, 40], [196, 44, 40]];
const ramp = (st, v) => { v = Math.max(0, Math.min(1, v)); const f = v * (st.length - 1), i = Math.min(st.length - 2, Math.floor(f)), u = f - i; const c = st[i].map((x, k) => Math.round(x + (st[i + 1][k] - x) * u)); return `rgb(${c})`; };
const fT = v => v >= 1e6 ? nf(v / 1e6, 2) + ' ' + t('Mt') : nf(v / 1e3) + ' ' + t('kt');
const fK = v => nf(v / 1e3);
// RU (and HY) read «860,2 млн $»; EN reads $860.2M.
const fM = v => S.lang !== 'en' ? (v < 0 ? '−' : '') + nf(Math.abs(v) / 1e6, 1) + ' ' + t('mUSD') : (v < 0 ? '−$' : '$') + nf(Math.abs(v) / 1e6, 1) + 'M';
const gU = () => $('#bl-gUnit').value === 'gpt' ? t('gpt') : '%';
const mU = () => $('#bl-gUnit').value === 'gpt' ? t('oz') : t('t');
const phName = k => t('pb') + ' ' + S.model.phaseKeys[k];
const perName = (p, short) => {
  const ppy = +$('#bl-ppy').value, y = Math.ceil(p / ppy), k = (p - 1) % ppy + 1;
  if (ppy === 1) return t('Y') + y;
  return `${t('Y')}${y}${short ? '' : ' '}${ppy === 4 ? t('Q') : t('M')}${k}`;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// The host sets <html lang> and owns the language switch.
function applyStatic() {
  root.querySelectorAll('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
  root.querySelectorAll('[data-ip]').forEach(e => { e.placeholder = t(e.dataset.ip); });
  $('#bl-benchSl').setAttribute('aria-label', t('plan')); $('#bl-secSl').setAttribute('aria-label', t('section')); $('#bl-secDir').setAttribute('aria-label', t('section'));
  $('#bl-play').textContent = t(S.view.play ? 'pause' : 'play');
  $('#bl-viewInfo').textContent = t('hoverHint');
  if (S.parsed) buildMapUI(true);
  renderSrc();
  if (!$('#bl-modal').hidden && S.exportKind) openExport(S.exportKind);
}
// Driven by the host's language switch (the language is persisted by the host store).
const langHooks = [];
function setLang(l) {
  if (!LOCALES[l] || l === S.lang) return;
  S.lang = l;
  applyStatic(); renderAll();
  langHooks.forEach(f => f());
}

function params() {
  return {
    mineCap: num('mineCap') * 1e3, millCap: num('millCap') * 1e3, spCap: num('spCap') * 1e3,
    lag: Math.max(0, num('lag') | 0), sink: Math.max(1, num('sink') | 0), maxActive: Math.max(1, num('maxAct') | 0),
    maxPeriods: Math.max(1, Math.min(400, num('maxP') | 0)), strategy: $('#bl-strat').value, ppy: +$('#bl-ppy').value,
    gUnit: $('#bl-gUnit').value, price: num('price'), rec: num('rec') / 100, cMine: num('cMine'), cProc: num('cProc'), cRe: num('cRe'), disc: num('disc') / 100
  };
}

function buildMapUI(keep) {
  const P = S.parsed, g = $('#bl-mapGrid');
  const prev = keep ? Object.fromEntries(Engine.ORDER.map(k => [k, $('#bl-map_' + k) ? $('#bl-map_' + k).value : -1])) : null;
  const prevF = keep ? $('#bl-fCol').value : null;
  const opts = [`<option value="-1">${t('none')}</option>`, ...P.headers.map((h, i) => `<option value="${i}">${esc(h)}</option>`)].join('');
  g.innerHTML = Engine.ORDER.map(k => `<label class="field"><span>${t('m_' + k)}${['x', 'y', 'z', 'grade'].includes(k) ? ' <em>' + t('req') + '</em>' : ''}</span><select id="bl-map_${k}" data-lv="model">${opts}</select></label>`).join('');
  for (const k of Engine.ORDER) $('#bl-map_' + k).value = keep ? prev[k] : (S.map[k] != null ? S.map[k] : -1);
  $('#bl-fCol').innerHTML = opts;
  if (keep) $('#bl-fCol').value = prevF;
  else { $('#bl-fCol').value = -1; $('#bl-fVal').value = ''; $('#bl-phSrc').value = S.map.phase != null ? 'col' : 'auto'; }
}
function renderSrc() {
  const s = S.src;
  if (!s) { $('#bl-srcInfo').textContent = ''; return; }
  if (s.reading) { $('#bl-srcInfo').textContent = t('reading', s.name); return; }
  $('#bl-srcInfo').textContent = t('srcInfo', s.demo ? t('demoName') : s.name, nf(s.n), s.c);
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
      for (const k of Engine.ORDER) { const v = +$('#bl-map_' + k).value; S.map[k] = v >= 0 ? v : null; }
      S.model = Engine.buildModel(S.parsed, S.map, {
        bx: num('bx') || 1, by: num('by') || 1, bz: num('bz') || 1, dens: num('dens') || 2.7,
        phSrc: $('#bl-phSrc').value === 'col' && S.map.phase != null ? 'col' : 'auto', phN: num('phN') || 1,
        filter: { col: +$('#bl-fCol').value, op: $('#bl-fOp').value, val: $('#bl-fVal').value.trim() }
      });
      S.view.firstBench = null; S.view.sec = -1;
    }
    const ws = new Set($('#bl-wasteRk').value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean));
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
  $('#bl-cogU').textContent = gU(); $('#bl-priceU').textContent = $('#bl-gUnit').value === 'gpt' ? t('u_poz') : t('u_pt');
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
  $('#bl-alerts').innerHTML = a.join('');
  const m = S.model;
  $('#bl-status').textContent = m && S.res ? t('statusOk', nf(m.n), m.phaseKeys.length, m.benchZ.length, nf(S.ms)) : (S.err ? t('statusErr') : t('statusNone'));
}

function renderKPIs() {
  const r = S.res;
  if (!r || !r.periods.length) { $('#bl-kpis').innerHTML = ''; return; }
  const T = r.totals, p = params(), n = r.periods.length;
  const g = T.ore ? T.oreMetal / T.ore : 0, fg = T.feed ? T.feedMetal / T.feed : 0;
  const mFmt = $('#bl-gUnit').value === 'gpt' ? nf(T.metal / 1e3) + ' ' + t('koz') : nf(T.metal / 1e3, 1) + ' ' + t('kt');
  const util = p.millCap ? T.feed / (p.millCap * n) * 100 : 0;
  const K = [
    [t('k_life'), t('v_life', nf(n / p.ppy, 1)), t('d_life', n, perName(n))],
    [t('k_moved'), fT(T.moved), t('d_moved', nf(T.ore ? T.waste / T.ore : 0, 2))],
    [t('k_ore'), fT(T.ore), t('d_ore', nf(g, 2), gU())],
    [t('k_feed'), fT(T.feed), t('d_feed', nf(fg, 2), gU(), nf(util))],
    [t('k_metal'), mFmt, t('d_metal', fM(T.revenue))],
    [t('k_npv'), fM(T.npv), t('d_npv', nf(p.disc * 100, 1), fM(T.cash))]
  ];
  $('#bl-kpis').innerHTML = K.map((k, i) => `<div class="kpi${i === 5 ? ' npv' : ''}"><span class="k">${esc(k[0])}</span><span class="v">${esc(k[1])}</span><span class="d">${esc(k[2])}</span></div>`).join('');
}

function renderCharts() {
  S.charts.forEach(c => c.destroy()); S.charts = [];
  const r = S.res; if (!r || !r.periods.length) return;
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
  S.charts.push(new Chart($('#bl-c1'), { type: 'bar', data: { labels, datasets: [
    { label: t('l_oreMill'), data: kt('direct'), backgroundColor: ore },
    { label: t('l_oreSp'), data: kt('toSp'), backgroundColor: spc },
    { label: t('l_waste'), data: kt('waste'), backgroundColor: waste }] }, options: base() }));
  const o2 = base(gU()); o2.scales.y2.stacked = false;
  S.charts.push(new Chart($('#bl-c2'), { type: 'bar', data: { labels, datasets: [
    { type: 'line', label: t('l_head'), data: P.map(x => x.feed ? +(x.feedMetal / x.feed).toFixed(3) : null), borderColor: acc, backgroundColor: acc, yAxisID: 'y2', pointRadius: 0, borderWidth: 2, tension: .25 },
    { type: 'line', label: t('l_millCap'), data: P.map(() => p.millCap / 1e3), borderColor: ink, borderDash: [4, 4], borderWidth: 1, pointRadius: 0, stack: 'cap' },
    { label: t('l_direct'), data: kt('direct'), backgroundColor: ore },
    { label: t('l_reclaim'), data: kt('reclaim'), backgroundColor: spc }] }, options: o2 }));
  const o3 = base(gU()); o3.scales.y.stacked = false; o3.scales.x.stacked = false; o3.scales.y.beginAtZero = true;
  S.charts.push(new Chart($('#bl-c3'), { type: 'line', data: { labels, datasets: [
    { label: t('l_spBal'), data: kt('spT'), borderColor: spc, backgroundColor: spc + '33', fill: true, pointRadius: 0, borderWidth: 2, stepped: true },
    { label: t('l_spG'), data: P.map(x => x.spT > 0 ? +x.spG.toFixed(3) : null), borderColor: acc, yAxisID: 'y2', pointRadius: 0, borderWidth: 1.5 }] }, options: o3 }));
  const o4 = base(); o4.scales.y.stacked = false; o4.scales.x.stacked = false; o4.scales.y.title.text = t('mUSD');
  S.charts.push(new Chart($('#bl-c4'), { type: 'bar', data: { labels, datasets: [
    { type: 'line', label: t('l_cum'), data: P.map(x => +(x.cumDcf / 1e6).toFixed(2)), borderColor: acc, pointRadius: 0, borderWidth: 2 },
    { label: t('l_cash'), data: P.map(x => +(x.cash / 1e6).toFixed(2)), backgroundColor: P.map(x => x.cash >= 0 ? css('--good') : css('--bad')) }] }, options: o4 }));
}

function renderGantt() {
  const r = S.res, m = S.model, el = $('#bl-gantt');
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
  const r = S.res, el = $('#bl-ptable');
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
  const sl = $('#bl-perSl'); sl.max = r.periods.length; sl.value = S.view.period;
  const bs = $('#bl-benchSl'); bs.max = m.benchZ.length - 1;
  if (S.view.firstBench == null) {
    const ore = new Float64Array(m.benchZ.length); const cog = num('cog');
    for (let i = 0; i < m.n; i++) if (m.g[i] >= cog) ore[m.bench[i]] += m.t[i];
    S.view.bench = Math.max(0, ore.indexOf(Math.max(...ore))); S.view.firstBench = 1; S.view.sec = -1;
  }
  bs.value = S.view.bench;
  const list = $('#bl-secDir').value === 'EW' ? m.ys : m.xs;
  const ss = $('#bl-secSl'); ss.max = list.length - 1;
  if (S.view.sec < 0 || S.view.sec > list.length - 1) {
    let best = 0, bd = Infinity; const c = $('#bl-secDir').value === 'EW' ? (m.ext.y0 + m.ext.y1) / 2 : (m.ext.x0 + m.ext.x1) / 2;
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
  const panel = root.querySelector('[data-panel="views"]');
  const m = S.model, r = S.res;
  if (panel.hidden || !m || !r) return;
  const per = S.view.period, mode = $('#bl-colMode').value, bp = r.blockPeriod, cog = num('cog'), gmax = gradeMax();
  const rest = css('--rest'), muted = css('--muted');
  $('#bl-perLbl').textContent = per === 0 ? t('preMining') : perName(per);
  {
    const E = m.ext, pad = 8, b = S.view.bench;
    const cv = $('#bl-plan'), { ctx, w, h } = sizeCanvas(cv, E.x1 - E.x0, E.y1 - E.y0);
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
    if ($('#bl-secDir').value === 'EW') { const yy = oy + (E.y1 - m.ys[S.view.sec]) * s; ctx.moveTo(0, yy); ctx.lineTo(w, yy); }
    else { const xx = ox + (m.xs[S.view.sec] - E.x0) * s; ctx.moveTo(xx, 0); ctx.lineTo(xx, h); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = muted; ctx.font = `11px ${css('--f-mono')}`; ctx.fillText(t('north'), w - 30, 16);
    S.rects.plan = rects;
    $('#bl-benchLbl').textContent = t('benchLbl', m.benchZ[b], b + 1, m.benchZ.length);
  }
  {
    const E = m.ext, pad = 8, ew = $('#bl-secDir').value === 'EW';
    const list = ew ? m.ys : m.xs, at = list[S.view.sec];
    const a0 = ew ? E.x0 : E.y0, a1 = ew ? E.x1 : E.y1;
    const cv = $('#bl-sect'), { ctx, w, h } = sizeCanvas(cv, a1 - a0, Math.max((E.z1 - E.z0) * 1.6, (a1 - a0) * 0.45));
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
    // Right label: same spot as before for one-letter labels; longer ones (HY) are kept inside the canvas.
  const rl = ew ? t('E') : t('N');
  ctx.fillText(ew ? t('W') : t('S'), 4, h - 6); ctx.fillText(rl, Math.min(w - 12, w - 4 - ctx.measureText(rl).width), h - 6);
    S.rects.sect = rects;
    $('#bl-secLbl').textContent = `${ew ? 'Y' : 'X'} = ${at}`;
  }
  const lg = $('#bl-legend'), nm = `<span><span class="swatch" style="background:var(--rest);border:1px solid var(--line)"></span>${t('notMined')}</span>`;
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
  if (!hit) { $('#bl-viewInfo').textContent = t('hoverHint'); return; }
  const m = S.model, i = hit[4], p = S.res.blockPeriod[i];
  $('#bl-viewInfo').textContent = t('info', m.x[i], m.y[i], m.z[i], fK(m.t[i]), nf(m.g[i], 2), gU(), m.rockNames[m.rock[i]], phName(m.phase[i]), p ? t('minedIn', perName(p)) : t('notSched'));
}

/* ---------- export ---------- */
// Other tabs add export kinds by prefix (the DTM tab registers 'd_'). A handler returns { title, hint, text, file, type }.
const exportHandlers = [];
const registerExport = (prefix, fn) => { exportHandlers.push([prefix, fn]); };
function showExport(x) {
  S.exportFile = { name: x.file, type: x.type, bom: !!x.bom };
  $('#bl-mTitle').textContent = x.title;
  $('#bl-mHint').textContent = x.hint; $('#bl-mText').value = x.text; $('#bl-mMsg').textContent = '';
  if ($('#bl-modal').hidden) { $('#bl-modal').hidden = false; $('#bl-mDl').focus(); }
}
function openExport(kind) {
  const ext = exportHandlers.find(([p]) => String(kind).startsWith(p));
  if (ext) { S.exportKind = kind; showExport(ext[1](kind)); return; }
  if (!S.res) return;
  S.exportKind = kind;
  let csv, hint;
  if (kind === 'sched') {
    const gl = $('#bl-gUnit').value === 'gpt' ? 'gpt' : 'pct';
    csv = [`period,label,moved_t,ore_t,waste_t,ore_grade_${gl},feed_t,head_grade_${gl},reclaim_t,stockpile_t,metal_${$('#bl-gUnit').value === 'gpt' ? 'oz' : 't'},revenue_usd,cost_usd,cash_usd,discounted_cash_usd`,
      ...S.res.periods.map(x => [x.t, perName(x.t), x.moved.toFixed(0), x.ore.toFixed(0), x.waste.toFixed(0), x.ore ? (x.oreMetal / x.ore).toFixed(3) : 0, x.feed.toFixed(0), x.feed ? (x.feedMetal / x.feed).toFixed(3) : 0, x.reclaim.toFixed(0), x.spT.toFixed(0), x.metal.toFixed(0), x.revenue.toFixed(0), x.cost.toFixed(0), x.cash.toFixed(0), x.dcf.toFixed(0)].join(','))].join('\n');
    hint = t('x_schedHint');
  } else {
    const m = S.model, bp = S.res.blockPeriod, L = ['x,y,z,tonnes,grade,rock,pushback,period'];
    for (let i = 0; i < m.n; i++) L.push(`${m.x[i]},${m.y[i]},${m.z[i]},${m.t[i].toFixed(1)},${m.g[i]},${m.rockNames[m.rock[i]]},${m.phaseKeys[m.phase[i]]},${bp[i]}`);
    csv = L.join('\n');
    hint = t('x_blocksHint');
  }
  // The period table is meant for Excel: a BOM keeps Cyrillic period labels readable. The block CSV goes to Surpac/Vulcan as is.
  showExport({ title: kind === 'sched' ? t('x_sched') : t('x_blocks'), hint, text: csv, file: kind === 'sched' ? 'benchline_schedule.csv' : 'benchline_blocks.csv', type: 'text/csv', bom: kind === 'sched' });
}
// Real file download; the text box and Copy stay as a fallback.
$('#bl-mDl').addEventListener('click', () => {
  const f = S.exportFile; if (!f) return;
  const blob = new Blob([(f.bom ? BOM : '') + $('#bl-mText').value], { type: f.type + ';charset=utf-8' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = f.name; root.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#bl-mCopy').addEventListener('click', () => {
  const ta = $('#bl-mText');
  const fallback = () => { ta.focus(); ta.select(); $('#bl-mMsg').textContent = t('selected'); };
  try { navigator.clipboard.writeText(ta.value).then(() => $('#bl-mMsg').textContent = t('copied'), fallback); } catch (e) { fallback(); }
});
const closeModal = () => { $('#bl-modal').hidden = true; S.exportKind = null; S.exportFile = null; };
$('#bl-mClose').addEventListener('click', closeModal);
$('#bl-modal').addEventListener('click', e => { if (e.target.id === 'bl-modal') closeModal(); });
listen(document, 'keydown', e => { if (e.key === 'Escape' && !$('#bl-modal').hidden) closeModal(); });
$('#bl-expSched').addEventListener('click', () => openExport('sched'));
$('#bl-expBlocks').addEventListener('click', () => openExport('blocks'));

/* ---------- wiring ---------- */
$('#bl-side').addEventListener('input', e => { if (e.target.id === 'bl-file') return; queue(e.target.dataset.lv || 'sched'); });
$('#bl-side').addEventListener('change', e => { if (e.target.tagName === 'SELECT') queue(e.target.dataset.lv || 'sched'); });
$('#bl-file').addEventListener('change', e => { const f = e.target.files[0]; if (f) readFile(f); });
function readFile(f) {
  S.src = { name: f.name, reading: true }; renderSrc();
  const fr = new FileReader();
  fr.onload = () => loadText(String(fr.result), f.name, false);
  fr.onerror = () => { S.err = { msg: t('e_read', f.name) }; S.src = null; renderSrc(); renderAll(); };
  fr.readAsText(f);
}
const drop = $('#bl-drop');
['dragenter', 'dragover'].forEach(ty => drop.addEventListener(ty, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ty => drop.addEventListener(ty, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) readFile(f); });
$('#bl-demoBtn').addEventListener('click', () => loadText(Engine.demoCSV(), 'demo_pit.csv', true));

root.querySelectorAll('.tab').forEach(tb => tb.addEventListener('click', () => {
  root.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', x === tb));
  root.querySelectorAll('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== tb.dataset.tab);
  try { localStorage.setItem('benchline-tab', tb.dataset.tab); } catch (e) {}
  if (tb.dataset.tab === 'views') renderViews();
}));
$('#bl-perSl').addEventListener('input', e => { S.view.period = +e.target.value; renderViews(); });
$('#bl-benchSl').addEventListener('input', e => { S.view.bench = +e.target.value; renderViews(); });
$('#bl-secSl').addEventListener('input', e => { S.view.sec = +e.target.value; renderViews(); });
$('#bl-secDir').addEventListener('change', () => { S.view.sec = -1; setupViews(); renderViews(); });
$('#bl-colMode').addEventListener('change', renderViews);
$('#bl-plan').addEventListener('mousemove', e => hover('plan', e));
$('#bl-sect').addEventListener('mousemove', e => hover('sect', e));
$('#bl-play').addEventListener('click', () => {
  if (S.view.play) { clearInterval(S.view.play); S.view.play = null; $('#bl-play').textContent = t('play'); return; }
  if (!S.res) return;
  const n = S.res.periods.length; if (S.view.period >= n) S.view.period = 0;
  $('#bl-play').textContent = t('pause');
  S.view.play = setInterval(() => {
    S.view.period++; $('#bl-perSl').value = S.view.period; renderViews();
    if (S.view.period >= n) { clearInterval(S.view.play); S.view.play = null; $('#bl-play').textContent = t('play'); }
  }, 450);
});
let rz; listen(window, 'resize', () => { clearTimeout(rz); rz = setTimeout(renderViews, 120); });
// The palette follows html[data-theme] (the host has no OS-driven dark mode).
const retheme = () => { renderCharts(); renderViews(); };
const mo = new MutationObserver(retheme); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
cleanups.push(() => mo.disconnect());

applyStatic();
try { const tb = localStorage.getItem('benchline-tab'); if (tb) { const b = root.querySelector(`.tab[data-tab="${tb}"]`); if (b) b.click(); } } catch (e) {}
loadText(Engine.demoCSV(), 'demo_pit.csv', true);

/* ---------- DTM tab (was dtm-tab.js, which extended openExport and setLang; now explicit hooks) ---------- */
const dtm = mountDtmTab(root, {
  t, nf, num, esc, css, ramp, PHC, RAMP_G, RAMP_P, applyStatic, openExport,
  registerExport, onLangChange: f => { langHooks.push(f); }
});

let destroyed = false;
function destroy() {
  if (destroyed) return; destroyed = true;
  clearTimeout(timer); clearTimeout(rz);
  if (S.view.play) { clearInterval(S.view.play); S.view.play = null; }
  S.charts.forEach(c => c.destroy()); S.charts = [];
  cleanups.splice(0).forEach(f => f());
  dtm.destroy();
}
return { setLang, destroy };
}
