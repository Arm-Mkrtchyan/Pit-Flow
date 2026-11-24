/* Benchline — schedule-engine.js
 * Block model CSV parsing, column detection, pushback/bench scheduling, stockpile, economics. No DOM.
 * ES module, no DOM: runs in the browser and under node (benchline/tests).
 */
/*ENGINE-START*/
export const Engine = (() => {
  const EPS = 1e-6;
  const fail = code => { const e = new Error(code); e.code = code; throw e; };
  const isNum = s => s !== '' && s != null && isFinite(+s);
  function splitLine(line, d) {
    if (d === 'ws') return line.trim().split(/\s+/);
    if (line.indexOf('"') < 0) return line.split(d).map(s => s.trim());
    const out = []; let cur = '', q = false;
    for (const ch of line) {
      if (ch === '"') { q = !q; continue; }
      if (ch === d && !q) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    out.push(cur.trim()); return out;
  }
  const isComment = l => /^[#%!*]/.test(l);
  function parseText(text) {
    const lines = text.split(/\r?\n/);
    const sample = lines.filter(l => l.trim() && !isComment(l.trim())).slice(0, 60);
    let delim = ',', best = 0;
    for (const d of [',', ';', '\t']) {
      const c = sample.reduce((a, l) => a + (l.split(d).length - 1), 0);
      if (c > best) { best = c; delim = d; }
    }
    if (best === 0) delim = 'ws';
    let hi = -1;
    for (let i = 0; i < Math.min(lines.length, 300); i++) {
      const l = lines[i].trim();
      if (!l || isComment(l)) continue;
      const t = splitLine(l, delim);
      if (t.length < 3) continue;
      const nn = t.filter(x => !isNum(x)).length;
      if (nn < t.length * 0.6) continue;
      let j = i + 1; while (j < lines.length && !lines[j].trim()) j++;
      if (j >= lines.length) continue;
      const t2 = splitLine(lines[j].trim(), delim);
      if (t2.filter(isNum).length >= 3 && t2.length >= t.length - 1) { hi = i; break; }
    }
    if (hi < 0) fail('noHeader');
    const headers = splitLine(lines[hi].trim(), delim).map((h, i) => h || ('col' + (i + 1)));
    const nc = headers.length, cols = headers.map(() => []);
    let n = 0;
    for (let i = hi + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l || isComment(l)) continue;
      const t = splitLine(l, delim);
      if (t.length < 3) continue;
      for (let c = 0; c < nc; c++) cols[c].push(t[c] === undefined ? '' : t[c]);
      n++;
    }
    if (!n) fail('noRows');
    const numeric = cols.map(col => {
      let k = 0, bad = 0;
      for (let i = 0; i < col.length && k < 2000; i++) { const v = col[i]; if (v === '') continue; k++; if (!isNum(v)) bad++; }
      return k > 0 && bad === 0;
    });
    const data = cols.map((col, i) => numeric[i] ? Float64Array.from(col, v => v === '' ? NaN : +v) : col);
    return { headers, numeric, data, n };
  }
  const KEYS = {
    x: ['x', 'xc', 'xcentre', 'xcenter', 'xworld', 'xcentroid', 'centroidx', 'xcen', 'xmid', 'midx', 'east', 'easting', 'xcoord', 'xpos', 'восток'],
    y: ['y', 'yc', 'ycentre', 'ycenter', 'yworld', 'ycentroid', 'centroidy', 'ycen', 'ymid', 'midy', 'north', 'northing', 'ycoord', 'ypos', 'север'],
    z: ['z', 'zc', 'zcentre', 'zcenter', 'zworld', 'zcentroid', 'centroidz', 'zcen', 'zmid', 'midz', 'rl', 'elev', 'elevation', 'zcoord', 'zpos', 'отметка', 'высота'],
    dx: ['dx', 'xinc', 'xlength', 'xsize', 'dimx', 'xdim', 'sizex', 'xlen', 'xextent', 'xblocksize'],
    dy: ['dy', 'yinc', 'ylength', 'ysize', 'dimy', 'ydim', 'sizey', 'ylen', 'yextent', 'yblocksize'],
    dz: ['dz', 'zinc', 'zlength', 'zsize', 'dimz', 'zdim', 'sizez', 'zlen', 'zextent', 'zblocksize'],
    grade: ['au', 'cu', 'grade', 'ag', 'zn', 'ni', 'pb', 'mo', 'fe', 'u3o8', 'auppm', 'augt', 'augpt', 'cupct', 'gold', 'copper', 'содержание', 'золото', 'медь'],
    density: ['density', 'sg', 'dens', 'bd', 'rd', 'bulkdensity', 'specificgravity', 'drydensity', 'плотность', 'объемныйвес', 'объёмныйвес'],
    tonnes: ['tonnes', 'tons', 'tonnage', 'ton', 'mass', 'тоннаж', 'масса', 'тонны'],
    rock: ['rocktype', 'rock', 'rtype', 'lith', 'lithology', 'mat', 'material', 'oretype', 'domain', 'geol', 'geology', 'zone', 'weathering', 'порода', 'типпороды', 'литология', 'домен'],
    phase: ['pushback', 'phase', 'pb', 'stage', 'cutback', 'pitshell', 'shell', 'pit', 'этап', 'очередь']
  };
  const ORDER = ['x', 'y', 'z', 'dx', 'dy', 'dz', 'grade', 'density', 'tonnes', 'rock', 'phase'];
  const NUMERIC = new Set(['x', 'y', 'z', 'dx', 'dy', 'dz', 'grade', 'density', 'tonnes']);
  const PREFIX = new Set(['grade', 'density', 'tonnes', 'rock', 'phase']);
  const norm = h => String(h).toLowerCase().replace(/[^a-z0-9а-яё]/g, '');
  function detect(headers, numeric) {
    const used = new Set(), map = {};
    for (const pass of [0, 1]) for (const k of ORDER) {
      if (map[k] != null || (pass === 1 && !PREFIX.has(k))) continue;
      for (const name of KEYS[k]) {
        const idx = headers.findIndex((h, i) => !used.has(i) && (!NUMERIC.has(k) || numeric[i]) &&
          (pass === 0 ? norm(h) === name : norm(h).startsWith(name)));
        if (idx >= 0) { map[k] = idx; used.add(idx); break; }
      }
    }
    if (map.grade == null) { const idx = headers.findIndex((h, i) => numeric[i] && !used.has(i)); if (idx >= 0) map.grade = idx; }
    return map;
  }
  function buildModel(parsed, map, o) {
    const D = parsed.data;
    const col = k => (map[k] != null && map[k] >= 0) ? D[map[k]] : null;
    const X = col('x'), Y = col('y'), Z = col('z'), G = col('grade');
    if (!X || !Y || !Z) fail('needXYZ');
    if (!G) fail('needGrade');
    const DX = col('dx'), DY = col('dy'), DZ = col('dz'), DN = col('density'), TN = col('tonnes'), RK = col('rock');
    const PH = o.phSrc === 'col' ? col('phase') : null;
    let F = null;
    if (o.filter && o.filter.col >= 0 && o.filter.val !== '') {
      const fc = D[o.filter.col], isN = parsed.numeric[o.filter.col], v = isN ? +o.filter.val : String(o.filter.val).trim();
      const cmp = { eq: (a, b) => a == b, ne: (a, b) => a != b, gt: (a, b) => a > b, ge: (a, b) => a >= b, lt: (a, b) => a < b, le: (a, b) => a <= b }[o.filter.op];
      F = i => cmp(fc[i], v);
    }
    const A = { x: [], y: [], z: [], dx: [], dy: [], dz: [], t: [], g: [], rock: [], ph: [] };
    const rockNames = [], rockIdx = new Map(), phVals = new Map();
    let air = 0, filtered = 0, outside = 0;
    for (let i = 0; i < parsed.n; i++) {
      if (F && !F(i)) { filtered++; continue; }
      const x = +X[i], y = +Y[i], z = +Z[i];
      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) { filtered++; continue; }
      let dx = DX ? +DX[i] : o.bx, dy = DY ? +DY[i] : o.by, dz = DZ ? +DZ[i] : o.bz;
      if (!(dx > 0)) dx = o.bx; if (!(dy > 0)) dy = o.by; if (!(dz > 0)) dz = o.bz;
      let den = DN ? +DN[i] : o.dens; if (!isFinite(den)) den = o.dens;
      const t = TN ? +TN[i] : dx * dy * dz * den;
      if (!(t > 0)) { air++; continue; }
      let ph = 0;
      if (PH) {
        const pv = PH[i];
        if (pv === '' || pv == null || (typeof pv === 'number' && !(pv > 0)) || pv === '0') { outside++; continue; }
        const key = String(pv); if (!phVals.has(key)) phVals.set(key, pv); ph = key;
      }
      const rk = RK ? String(RK[i]) : '—';
      let ri = rockIdx.get(rk); if (ri == null) { ri = rockNames.length; rockNames.push(rk); rockIdx.set(rk, ri); }
      let g = +G[i]; if (!(g > 0)) g = 0;
      A.x.push(x); A.y.push(y); A.z.push(z); A.dx.push(dx); A.dy.push(dy); A.dz.push(dz); A.t.push(t); A.g.push(g); A.rock.push(ri); A.ph.push(ph);
    }
    const n = A.x.length;
    if (!n) fail('noBlocks');
    const m = {
      n, x: Float64Array.from(A.x), y: Float64Array.from(A.y), z: Float64Array.from(A.z),
      dx: Float32Array.from(A.dx), dy: Float32Array.from(A.dy), dz: Float32Array.from(A.dz),
      t: Float64Array.from(A.t), g: Float64Array.from(A.g), rock: Int32Array.from(A.rock), rockNames,
      phase: new Int32Array(n), phaseKeys: [], bench: new Int32Array(n), benchZ: [], air, filtered, outside
    };
    if (PH) {
      const keys = [...phVals.keys()];
      const allNum = keys.every(k => isFinite(+k));
      keys.sort(allNum ? (a, b) => (+a) - (+b) : (a, b) => a.localeCompare(b));
      const pi = new Map(keys.map((k, i) => [k, i]));
      for (let i = 0; i < n; i++) m.phase[i] = pi.get(A.ph[i]);
      m.phaseKeys = keys;
    } else {
      let tw = 0, cx = 0, cy = 0, zmin = Infinity;
      for (let i = 0; i < n; i++) { tw += m.t[i]; cx += m.x[i] * m.t[i]; cy += m.y[i] * m.t[i]; if (m.z[i] < zmin) zmin = m.z[i]; }
      cx /= tw; cy /= tw;
      const met = new Float64Array(n);
      for (let i = 0; i < n; i++) met[i] = Math.hypot(m.x[i] - cx, m.y[i] - cy) - (m.z[i] - zmin);
      const ord = Array.from({ length: n }, (_, i) => i).sort((a, b) => met[a] - met[b]);
      const N = Math.max(1, Math.min(12, o.phN | 0));
      let acc = 0;
      for (const i of ord) { m.phase[i] = Math.min(N - 1, Math.floor(acc / tw * N)); acc += m.t[i]; }
      m.phaseKeys = Array.from({ length: N }, (_, i) => String(i + 1));
    }
    const zk = [...new Set(Array.from(m.z, z => Math.round(z * 100)))].sort((a, b) => b - a);
    const zi = new Map(zk.map((k, i) => [k, i]));
    m.benchZ = zk.map(k => k / 100);
    for (let i = 0; i < n; i++) m.bench[i] = zi.get(Math.round(m.z[i] * 100));
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < n; i++) {
      x0 = Math.min(x0, m.x[i] - m.dx[i] / 2); x1 = Math.max(x1, m.x[i] + m.dx[i] / 2);
      y0 = Math.min(y0, m.y[i] - m.dy[i] / 2); y1 = Math.max(y1, m.y[i] + m.dy[i] / 2);
      z0 = Math.min(z0, m.z[i] - m.dz[i] / 2); z1 = Math.max(z1, m.z[i] + m.dz[i] / 2);
    }
    m.ext = { x0, x1, y0, y1, z0, z1 };
    m.xs = [...new Set(Array.from(m.x, v => Math.round(v * 100)))].sort((a, b) => a - b).map(v => v / 100);
    m.ys = [...new Set(Array.from(m.y, v => Math.round(v * 100)))].sort((a, b) => a - b).map(v => v / 100);
    return m;
  }
  function buildUnits(m, cutoff, wasteRocks) {
    const ws = new Set(); m.rockNames.forEach((r, i) => { if (wasteRocks.has(r.toUpperCase())) ws.add(i); });
    const key = new Map(), units = [];
    for (let i = 0; i < m.n; i++) {
      const k = m.phase[i] * 100000 + m.bench[i];
      let u = key.get(k);
      if (!u) { u = { phase: m.phase[i], bench: m.bench[i], z: m.benchZ[m.bench[i]], blocks: [], t: 0, ore: 0, metal: 0 }; key.set(k, u); units.push(u); }
      u.blocks.push(i); u.t += m.t[i];
      if (m.g[i] >= cutoff && !ws.has(m.rock[i])) { u.ore += m.t[i]; u.metal += m.t[i] * m.g[i]; }
    }
    const byPhase = m.phaseKeys.map(() => []);
    for (const u of units) {
      u.blocks.sort((a, b) => (m.x[a] - m.x[b]) || (m.y[a] - m.y[b]));
      byPhase[u.phase].push(u);
    }
    byPhase.forEach(l => l.sort((a, b) => a.bench - b.bench));
    return { units, byPhase };
  }
  function schedule(m, U, p) {
    const NP = U.byPhase.length, BP = U.byPhase;
    const ptr = new Int32Array(NP), started = new Uint8Array(NP);
    for (const u of U.units) { u.rem = u.t; u.hist = []; }
    const lastBench = BP.map(l => l.length ? l[l.length - 1].bench : -1);
    const firstInc = k => ptr[k] < BP[k].length ? BP[k][ptr[k]].bench : Infinity;
    const sp = { t: 0, m: 0 }, periods = [], warnings = [];
    let allDone = BP.every(l => !l.length);
    for (let t = 1; t <= p.maxPeriods && !(allDone && sp.t <= EPS); t++) {
      let mineRem = p.mineCap, millRem = p.millCap;
      const rec = { t, moved: 0, ore: 0, waste: 0, oreMetal: 0, direct: 0, directMetal: 0, toSp: 0, reclaim: 0, reclaimMetal: 0, ph: new Array(NP).fill(null) };
      const touched = BP.map(() => new Set()), blocked = new Set();
      let guard = 0;
      while (mineRem > EPS && guard++ < 200000) {
        let active = 0; for (let k = 0; k < NP; k++) if (started[k] && ptr[k] < BP[k].length) active++;
        const cands = [];
        for (let k = 0; k < NP; k++) {
          if (ptr[k] >= BP[k].length) continue;
          const u = BP[k][ptr[k]];
          if (blocked.has(u)) continue;
          if (!started[k] && active >= p.maxActive) continue;
          if (!touched[k].has(u.bench) && touched[k].size >= p.sink) continue;
          if (k > 0 && firstInc(k - 1) <= Math.min(u.bench + p.lag, lastBench[k - 1])) continue;
          cands.push(u);
        }
        if (!cands.length) break;
        let u = cands[0];
        const val = c => c.metal / c.t, of = c => c.ore / c.t;
        if (p.strategy === 'value') { for (const c of cands) if (val(c) > val(u) + 1e-12) u = c; }
        else if (p.strategy === 'feed') {
          if (millRem > EPS) { for (const c of cands) if (of(c) > of(u) + 1e-12) u = c; }
          else { for (const c of cands) if (of(c) < of(u) - 1e-12) u = c; }
        }
        const oreFrac = u.ore / u.t, g = u.ore > 0 ? u.metal / u.ore : 0;
        let amt = Math.min(u.rem, mineRem);
        if (oreFrac > 0) {
          const room = millRem + Math.max(0, p.spCap - sp.t);
          if (room / oreFrac < amt) amt = room / oreFrac;
          if (amt <= EPS) { blocked.add(u); continue; }
        }
        const ore = amt * oreFrac, d = Math.min(ore, millRem), s = ore - d;
        rec.moved += amt; rec.ore += ore; rec.waste += amt - ore; rec.oreMetal += ore * g;
        rec.direct += d; rec.directMetal += d * g; millRem -= d;
        rec.toSp += s; sp.t += s; sp.m += s * g;
        mineRem -= amt; u.rem -= amt; u.hist.push([t, amt]);
        const k = u.phase; started[k] = 1; touched[k].add(u.bench);
        const ph = rec.ph[k] || (rec.ph[k] = { t: 0, zTop: u.z, zBot: u.z });
        ph.t += amt; ph.zTop = Math.max(ph.zTop, u.z); ph.zBot = Math.min(ph.zBot, u.z);
        if (u.rem <= Math.max(EPS, u.t * 1e-9)) { u.rem = 0; ptr[k]++; }
      }
      if (millRem > EPS && sp.t > EPS) {
        const r = Math.min(millRem, sp.t), g = sp.m / sp.t;
        rec.reclaim = r; rec.reclaimMetal = r * g; sp.t -= r; sp.m -= r * g; millRem -= r;
        if (sp.t < EPS) { sp.t = 0; sp.m = 0; }
      }
      rec.feed = rec.direct + rec.reclaim; rec.feedMetal = rec.directMetal + rec.reclaimMetal;
      rec.spT = sp.t; rec.spG = sp.t > 0 ? sp.m / sp.t : 0;
      allDone = BP.every((l, k) => ptr[k] >= l.length);
      if (rec.moved <= EPS && rec.reclaim <= EPS) {
        if (!allDone) warnings.push({ k: 'stall', a: [t] });
        break;
      }
      periods.push(rec);
    }
    let unmined = 0; for (const u of U.units) unmined += u.rem;
    if (unmined > EPS && !warnings.length) warnings.push({ k: 'limit', a: [p.maxPeriods, unmined] });
    if (sp.t > EPS) warnings.push({ k: 'spLeft', a: [sp.t] });
    const conv = p.gUnit === 'gpt' ? 1 / 31.1035 : 1 / 100;
    let cum = 0, npv = 0;
    for (const r of periods) {
      r.metal = r.feedMetal * conv * p.rec;
      r.revenue = r.metal * p.price;
      r.cost = r.moved * p.cMine + r.feed * p.cProc + r.reclaim * p.cRe;
      r.cash = r.revenue - r.cost;
      r.dcf = r.cash / Math.pow(1 + p.disc, r.t / p.ppy);
      npv += r.dcf; cum += r.dcf; r.cumDcf = cum;
    }
    const bp = new Int16Array(m.n);
    for (const u of U.units) {
      if (!u.hist.length) continue;
      let acc = 0, h = 0, cumH = u.hist[0][1];
      for (const i of u.blocks) {
        const mid = acc + m.t[i] / 2;
        while (h < u.hist.length - 1 && mid > cumH) { h++; cumH += u.hist[h][1]; }
        bp[i] = mid <= cumH + 1e-6 ? u.hist[h][0] : 0;
        acc += m.t[i];
      }
    }
    const sum = f => periods.reduce((a, r) => a + r[f], 0);
    const totals = { moved: sum('moved'), ore: sum('ore'), waste: sum('waste'), oreMetal: sum('oreMetal'), feed: sum('feed'), feedMetal: sum('feedMetal'), reclaim: sum('reclaim'), metal: sum('metal'), revenue: sum('revenue'), cost: sum('cost'), cash: sum('cash'), npv, unmined };
    return { periods, warnings, blockPeriod: bp, totals };
  }
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function demoCSV() {
    const r = mulberry(11), gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
    const shells = [[335, 40], [305, 55], [285, 70], [265, 85]];
    const L = ['xcentre,ycentre,zcentre,xlength,ylength,zlength,au,density,rocktype,pushback'];
    for (let z = 415; z >= 265; z -= 10) for (let x = -250; x <= 250; x += 20) for (let y = -250; y <= 250; y += 20) {
      const rr = Math.hypot(x, y); let ph = 0;
      for (let k = 0; k < shells.length; k++) if (z >= shells[k][0] && rr <= shells[k][1] + (z - shells[k][0])) { ph = k + 1; break; }
      if (!ph) continue;
      const ex = (x - 15) / 150, ey = (y + 5 - 0.25 * x) / 60, ez = (z - 335 + 0.3 * x) / 75;
      const d2 = ex * ex + ey * ey + ez * ez;
      const trend = 1 + 0.35 * Math.sin(x / 45) * Math.cos(y / 60);
      const g = 0.07 * Math.exp(0.7 * gauss()) + 3.4 * trend * Math.exp(-1.5 * d2) * Math.exp(0.4 * gauss());
      const rock = z >= 385 ? 'OX' : 'FR';
      const den = rock === 'OX' ? 2.2 : (g > 0.5 ? 2.8 : 2.7);
      L.push(`${x},${y},${z},20,20,10,${g.toFixed(3)},${den},${rock},${ph}`);
    }
    return L.join('\n');
  }
  return { parseText, detect, buildModel, buildUnits, schedule, demoCSV, ORDER };
})();
/*ENGINE-END*/
