/* Benchline — dtm-engine.js
 * Surpac .str/.dtm text parsers, triangulation fallback, height raster, blast block geometry and volumes, .str writer, demo data. No DOM.
 * ES module, no DOM: runs in the browser and under node (benchline/tests).
 */
/*DTM-START*/
export const DtmEng = (() => {
  const err = (k, ...a) => { const e = new Error(k); e.code = k; e.args = a; return e; };
  const base = n => String(n || '').split(/[\\/]/).pop().trim();
  function isBinary(s) {
    const n = Math.min(s.length, 4000); let bad = 0;
    for (let i = 0; i < n; i++) { const c = s.charCodeAt(i); if (c === 0 || c === 0xFFFD || (c < 32 && c !== 9 && c !== 10 && c !== 13)) bad++; }
    return bad > Math.max(2, n * 0.01);
  }
  // Surpac string file: "string, Y, X, Z, D1, D2…"; a record with string 0 ends a segment; "0,…,END" ends the file.
  function parseStr(text, name) {
    if (isBinary(text)) throw err('binary', name);
    const pts = [], segs = []; let cur = null;
    const L = text.split(/\r?\n/);
    for (let i = 0; i < L.length; i++) {
      const l = L[i].trim(); if (!l) continue;
      const f = l.split(','), s0 = f[0].trim();
      if (!/^\d+$/.test(s0)) continue;
      const s = +s0;
      if (s === 0) { if (cur) { segs.push(cur); cur = null; } if (/\bEND\b/i.test(l)) break; continue; }
      const y = parseFloat(f[1]), x = parseFloat(f[2]), z = parseFloat(f[3]);
      if (!isFinite(x) || !isFinite(y)) continue;
      const p = { x, y, z: isFinite(z) ? z : 0, s, d: f.slice(4).map(v => v.trim()).filter(Boolean) };
      pts.push(p);
      if (!cur || cur.s !== s) { if (cur) segs.push(cur); cur = { s, pts: [] }; }
      cur.pts.push(p);
    }
    if (cur) segs.push(cur);
    if (!pts.length) throw err('strEmpty', name);
    return { pts, segs };
  }
  const dtmStrName = text => base((text.split(/\r?\n/, 1)[0] || '').split(',')[0]);
  // Surpac DTM text file: after TRISOLATION, "tri, p1, p2, p3, n1, n2, n3" with 1-based point numbers into the .str
  function parseDtm(text, name, n, strName) {
    if (isBinary(text)) throw err('binary', name);
    const tri = []; let seen = false, bad = 0;
    for (const raw of text.split(/\r?\n/)) {
      const l = raw.trim(); if (!l) continue;
      if (/^TRISOLATION/i.test(l)) { seen = true; continue; }
      if (!seen || /^(OBJECT|END|POINT)/i.test(l)) continue;
      const f = l.split(',').map(v => v.trim());
      if (f.length < 4 || !/^\d+$/.test(f[1]) || !/^\d+$/.test(f[2]) || !/^\d+$/.test(f[3])) continue;
      const a = +f[1] - 1, b = +f[2] - 1, c = +f[3] - 1;
      if (a < 0 || b < 0 || c < 0 || a >= n || b >= n || c >= n) { bad++; continue; }
      tri.push(a, b, c);
    }
    if (bad > 0 && bad >= tri.length / 3) throw err('dtmMismatch', strName);
    if (!tri.length) throw err('noTri');
    return Uint32Array.from(tri);
  }
  function triangulate(pts, D) {
    if (!D) throw err('noDelaunay');
    const seen = new Set(), keep = [];
    for (const p of pts) { const k = Math.round(p.x * 100) + ':' + Math.round(p.y * 100); if (!seen.has(k)) { seen.add(k); keep.push(p); } }
    if (keep.length < 3) throw err('noTri');
    const c = new Float64Array(keep.length * 2); keep.forEach((p, i) => { c[2 * i] = p.x; c[2 * i + 1] = p.y; });
    const T = new D(c).triangles, nt = T.length / 3, me = new Float64Array(nt);
    const ed = (a, b) => Math.hypot(keep[a].x - keep[b].x, keep[a].y - keep[b].y);
    for (let k = 0; k < nt; k++) { const a = T[3 * k], b = T[3 * k + 1], d = T[3 * k + 2]; me[k] = Math.max(ed(a, b), ed(b, d), ed(d, a)); }
    const lim = Float64Array.from(me).sort()[Math.floor(nt / 2)] * 8;
    const out = []; for (let k = 0; k < nt; k++) if (me[k] <= lim) out.push(T[3 * k], T[3 * k + 1], T[3 * k + 2]);
    if (!out.length) throw err('noTri');
    return { pts: keep, tri: Uint32Array.from(out) };
  }
  function rasterize(d, N) {
    const E = d.ext, W = E.x1 - E.x0, H = E.y1 - E.y0, cell = Math.max(W, H) / N;
    const nx = Math.floor(W / cell) + 1, ny = Math.floor(H / cell) + 1, z = new Float32Array(nx * ny).fill(NaN);
    const { px, py, pz, tri } = d;
    for (let t = 0; t < tri.length; t += 3) {
      const a = tri[t], b = tri[t + 1], c = tri[t + 2];
      const ax = (px[a] - E.x0) / cell, ay = (E.y1 - py[a]) / cell, bx = (px[b] - E.x0) / cell, by = (E.y1 - py[b]) / cell, cx = (px[c] - E.x0) / cell, cy = (E.y1 - py[c]) / cell;
      const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (Math.abs(den) < 1e-12) continue;
      const i0 = Math.max(0, Math.ceil(Math.min(ax, bx, cx) - 1e-9)), i1 = Math.min(nx - 1, Math.floor(Math.max(ax, bx, cx) + 1e-9));
      const j0 = Math.max(0, Math.ceil(Math.min(ay, by, cy) - 1e-9)), j1 = Math.min(ny - 1, Math.floor(Math.max(ay, by, cy) + 1e-9));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const w1 = ((by - cy) * (i - cx) + (cx - bx) * (j - cy)) / den, w2 = ((cy - ay) * (i - cx) + (ax - cx) * (j - cy)) / den, w3 = 1 - w1 - w2;
        if (w1 >= -1e-7 && w2 >= -1e-7 && w3 >= -1e-7) z[j * nx + i] = w1 * pz[a] + w2 * pz[b] + w3 * pz[c];
      }
    }
    return { nx, ny, cell, z, x0: E.x0, y1: E.y1 };
  }
  function zAt(r, x, y) {
    const fx = (x - r.x0) / r.cell, fy = (r.y1 - y) / r.cell;
    if (!(fx >= 0 && fy >= 0 && fx <= r.nx - 1 && fy <= r.ny - 1)) return NaN;
    const i = Math.min(r.nx - 2, Math.floor(fx)), j = Math.min(r.ny - 2, Math.floor(fy)), u = fx - i, v = fy - j, k = j * r.nx + i, Z = r.z;
    const q = [[Z[k], (1 - u) * (1 - v)], [Z[k + 1], u * (1 - v)], [Z[k + r.nx], (1 - u) * v], [Z[k + r.nx + 1], u * v]];
    let s = 0, w = 0, any = null;
    for (const [z, wt] of q) if (z === z) { s += z * wt; w += wt; any = z; }
    return any === null ? NaN : (w > 1e-9 ? s / w : any);
  }
  function buildDtm(pts, tri, name, N) {
    const n = pts.length, px = new Float64Array(n), py = new Float64Array(n), pz = new Float64Array(n);
    pts.forEach((p, i) => { px[i] = p.x; py[i] = p.y; pz[i] = p.z; });
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const i of tri) { const x = px[i], y = py[i], z = pz[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    if (!(x1 > x0) || !(y1 > y0)) throw err('noTri');
    if (!(z1 > z0)) z1 = z0 + 1;
    const d = { name, n, px, py, pz, tri, ntri: tri.length / 3, ext: { x0, x1, y0, y1, z0, z1 } };
    d.r = rasterize(d, N || 1500);
    return d;
  }
  function pip(x, y, P) {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; }
    return c;
  }
  function buildBlocks(segs, name) {
    const list = [], cnt = {};
    for (const sg of segs) {
      const P = sg.pts.map(p => ({ x: p.x, y: p.y, z: p.z }));
      if (P.length > 1 && Math.hypot(P[0].x - P[P.length - 1].x, P[0].y - P[P.length - 1].y) < 1e-3) P.pop();
      if (P.length < 3) continue;
      cnt[sg.s] = (cnt[sg.s] || 0) + 1;
      const nm = sg.pts[0].d[0] || `${sg.s}-${cnt[sg.s]}`;
      const ox = P[0].x, oy = P[0].y, bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
      let a2 = 0, cx = 0, cy = 0, per = 0, zs = 0, mx = 0, my = 0;
      for (let i = 0; i < P.length; i++) {
        const p = P[i], q = P[(i + 1) % P.length], x1 = p.x - ox, y1 = p.y - oy, x2 = q.x - ox, y2 = q.y - oy, cr = x1 * y2 - x2 * y1;
        a2 += cr; cx += (x1 + x2) * cr; cy += (y1 + y2) * cr; per += Math.hypot(q.x - p.x, q.y - p.y); zs += p.z; mx += p.x; my += p.y;
        bb.x0 = Math.min(bb.x0, p.x); bb.x1 = Math.max(bb.x1, p.x); bb.y0 = Math.min(bb.y0, p.y); bb.y1 = Math.max(bb.y1, p.y);
      }
      const ok = Math.abs(a2) > 1e-9;
      list.push({ name: nm, s: sg.s, P, area: Math.abs(a2) / 2, per, cx: ok ? ox + cx / (3 * a2) : mx / P.length, cy: ok ? oy + cy / (3 * a2) : my / P.length, rl: zs / P.length, bb });
    }
    if (!list.length) throw err('noPoly', name);
    return list;
  }
  // Volume above the blast floor: mean (surface − floor) over raster nodes inside the polygon × exact polygon area
  function stats(list, r, o) {
    let outside = 0;
    for (const b of list) {
      b.floor = o.fixed ? o.floorRL : b.rl - o.bench; b.surf = b.vol = b.t = null;
      if (!r) continue;
      const i0 = Math.max(0, Math.floor((b.bb.x0 - r.x0) / r.cell)), i1 = Math.min(r.nx - 1, Math.ceil((b.bb.x1 - r.x0) / r.cell));
      const j0 = Math.max(0, Math.floor((r.y1 - b.bb.y1) / r.cell)), j1 = Math.min(r.ny - 1, Math.ceil((r.y1 - b.bb.y0) / r.cell));
      let n = 0, sz = 0, dep = 0;
      for (let j = j0; j <= j1; j++) {
        const y = r.y1 - j * r.cell;
        for (let i = i0; i <= i1; i++) {
          const z = r.z[j * r.nx + i]; if (z !== z) continue;
          if (!pip(r.x0 + i * r.cell, y, b.P)) continue;
          n++; sz += z; dep += Math.max(0, z - b.floor);
        }
      }
      if (!n) { const z = zAt(r, b.cx, b.cy); if (z !== z) { outside++; continue; } n = 1; sz = z; dep = Math.max(0, z - b.floor); }
      b.surf = sz / n; b.vol = dep / n * b.area; b.t = b.vol * o.dens;
    }
    return outside;
  }
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sdate = (d = new Date()) => `${String(d.getDate()).padStart(2, '0')}-${MON[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`;
  const f3 = v => v.toFixed(3);
  function strText(points, title) {
    return [`${title},${sdate()},,`, '0, 0.000, 0.000, 0.000,',
      ...points.map((p, i) => `1, ${f3(p.y)}, ${f3(p.x)}, ${f3(p.z)}, P${i + 1}`),
      '0, 0.000, 0.000, 0.000,', '0, 0.000, 0.000, 0.000, END'].join('\n');
  }
  // Example data written in Surpac text format, so it goes through the same parsers as real files
  function demo() {
    // Pit surface built like a surveyed pit DTM: rings along each toe and crest, joined into triangles
    const X0 = 452300, Y0 = 4381500, R = 330, A = 240, face = 3.6, Rf = 80;
    const berm = [12, 12, 12, 40, 12, 12, 12, 12, 12, 12, 12, 12];
    const pitZ = r => { if (r <= Rf) return 300; let rr = Rf, z = 300; for (const b of berm) { if (r < rr + face) return z + 10 * (r - rr) / face; rr += face; z += 10; if (r < rr + b) return z; rr += b; } return z + (r - rr) * 0.8; };
    const topo = (x, y) => 418 + 0.025 * x - 0.015 * y + 6 * Math.sin(x / 90) * Math.cos(y / 120) + 4 * Math.cos((x + y) / 70);
    const rings = [];
    for (let r = 10; r < Rf; r += 10) rings.push(r);
    let rr = Rf; rings.push(Rf);
    for (const b of berm) { rr += face; rings.push(rr - 0.01); if (b > 20) rings.push(rr + b / 2); rr += b; rings.push(rr); }
    for (let r = rr + 8; r <= R; r += 8) rings.push(r);
    const S = ['demo_topo,' + sdate() + ',,ssi_styles:styles.ssi', '0, 0.000, 0.000, 0.000,'];
    const pt = (x, y) => S.push(`1, ${f3(Y0 + y)}, ${f3(X0 + x)}, ${f3(Math.min(topo(x, y), pitZ(Math.hypot(x, y))))},`);
    pt(0, 0);
    for (const r of rings) for (let a = 0; a < A; a++) { const q = a / A * Math.PI * 2; pt(r * Math.cos(q), r * Math.sin(q)); }
    S.push('0, 0.000, 0.000, 0.000,', '0, 0.000, 0.000, 0.000, END');
    const D = ['demo_topo.str,' + sdate() + ',,ssi_styles:styles.ssi', '0,           0.000,           0.000,           0.000,           0.000,           0.000,           0.000', 'OBJECT, 1,', 'TRISOLATION, 1, neighbours=no,validated=true,closed=no'];
    let k = 0; const id = (ring, a) => 2 + ring * A + (a % A);
    for (let a = 0; a < A; a++) D.push(`${++k}, 1, ${id(0, a)}, ${id(0, a + 1)}, 0, 0, 0,`);
    for (let ring = 0; ring < rings.length - 1; ring++) for (let a = 0; a < A; a++) {
      const p = id(ring, a), q = id(ring, a + 1), s = id(ring + 1, a), u = id(ring + 1, a + 1);
      D.push(`${++k}, ${p}, ${s}, ${u}, 0, 0, 0,`, `${++k}, ${p}, ${u}, ${q}, 0, 0, 0,`);
    }
    D.push('END');
    const B = ['demo_blasts,' + sdate() + ',,', '0, 0.000, 0.000, 0.000,'];
    const poly = (s, name, P, z) => { [...P, P[0]].forEach(([x, y]) => B.push(`${s}, ${f3(Y0 + y)}, ${f3(X0 + x)}, ${f3(z)}, ${name}`)); B.push('0, 0.000, 0.000, 0.000,'); };
    let m = 0;
    for (let y = 50; y >= -75; y -= 25) for (let x = -75; x < 75; x += 25) {
      const C = [[x, y], [x + 25, y], [x + 25, y + 25], [x, y + 25]];
      if (C.every(([a, b]) => Math.hypot(a, b) <= 80)) poly(1, `300-${String(++m).padStart(2, '0')}`, C, 300);
    }
    m = 0;
    for (let a = -75; a < 75; a += 30) {
      const P = [];
      for (let q = a; q <= a + 30 + 1e-9; q += 5) P.push([132 * Math.cos(q * Math.PI / 180), 132 * Math.sin(q * Math.PI / 180)]);
      for (let q = a + 30; q >= a - 1e-9; q -= 5) P.push([168 * Math.cos(q * Math.PI / 180), 168 * Math.sin(q * Math.PI / 180)]);
      poly(2, `340-${String(++m).padStart(2, '0')}`, P, 340);
    }
    B.push('0, 0.000, 0.000, 0.000, END');
    return { str: S.join('\n'), dtm: D.join('\n'), blk: B.join('\n') };
  }
  return { parseStr, parseDtm, dtmStrName, triangulate, buildDtm, zAt, pip, buildBlocks, stats, strText, demo };
})();
/*DTM-END*/
