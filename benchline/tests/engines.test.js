// Run with: node --test tests/
// Covers the two pure engines (no DOM): scheduler and Surpac DTM / blast blocks.
// The engines live in the host app (src/features/benchline/engine) as ES modules; these tests run against them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine } from '../../src/features/benchline/engine/scheduleEngine.js';
import { DtmEng } from '../../src/features/benchline/engine/dtmEngine.js';

const P = { mineCap: 3e6, millCap: 7e5, spCap: 1.5e6, lag: 2, sink: 3, maxActive: 2, maxPeriods: 60, strategy: 'phase', ppy: 4, gUnit: 'gpt', price: 3000, rec: 0.9, cMine: 3.2, cProc: 22, cRe: 1.1, disc: 0.08 };

function demoModel() {
  const parsed = Engine.parseText(Engine.demoCSV());
  const map = Engine.detect(parsed.headers, parsed.numeric);
  return Engine.buildModel(parsed, map, { bx: 20, by: 20, bz: 10, dens: 2.7, phSrc: 'col', phN: 4 });
}

test('scheduler: column auto-detection on Surpac-style headers', () => {
  const p = Engine.parseText('Y_centre X_centre Z_centre Y_dim X_dim Z_dim au_ok density\n100 200 300 10 10 5 1.2 2.7\n110 200 300 10 10 5 0.2 2.7\n');
  const m = Engine.detect(p.headers, p.numeric);
  assert.deepEqual([m.x, m.y, m.z, m.grade, m.density], [1, 0, 2, 6, 7]);
});

for (const strategy of ['phase', 'value', 'feed']) {
  test(`scheduler (${strategy}): tonnes balance, every block mined, bench precedence holds`, () => {
    const m = demoModel();
    const U = Engine.buildUnits(m, 0.5, new Set());
    const r = Engine.schedule(m, U, { ...P, strategy });
    let total = 0; for (const t of m.t) total += t;
    assert.ok(Math.abs(r.totals.moved - total) < 1, 'moved tonnes equal model tonnes');
    assert.ok(Math.abs(r.totals.feed - r.totals.ore) < 1, 'all ore is milled (stockpile emptied)');
    const minP = {}, maxP = {};
    for (let i = 0; i < m.n; i++) {
      const p = r.blockPeriod[i]; assert.ok(p > 0, 'block scheduled');
      const k = m.phase[i] + '_' + m.bench[i];
      minP[k] = Math.min(minP[k] ?? 1e9, p); maxP[k] = Math.max(maxP[k] ?? 0, p);
    }
    for (const k in minP) { const [ph, b] = k.split('_').map(Number); const up = ph + '_' + (b - 1); if (up in maxP) assert.ok(minP[k] >= maxP[up], 'bench below starts after bench above finishes: ' + k); }
    for (const per of r.periods) { assert.ok(per.moved <= P.mineCap + 1); assert.ok(per.feed <= P.millCap + 1); }
  });
}

function demoDtm() {
  const d = DtmEng.demo();
  const s = DtmEng.parseStr(d.str, 'demo_topo.str');
  const tri = DtmEng.parseDtm(d.dtm, 'demo_topo.dtm', s.pts.length, 'demo_topo.str');
  return { d, dtm: DtmEng.buildDtm(s.pts, tri, 'demo') };
}

test('dtm: .dtm/.str pair parses and the raster matches known elevations', () => {
  const { d, dtm } = demoDtm();
  assert.equal(DtmEng.dtmStrName(d.dtm), 'demo_topo.str');
  assert.ok(dtm.ntri > 1000);
  assert.equal(DtmEng.zAt(dtm.r, 452300, 4381500), 300);           // pit floor
  assert.ok(Math.abs(DtmEng.zAt(dtm.r, 452300 + 150, 4381500) - 340) < 0.05); // wide 340 berm
});

test('dtm: blast block area, centroid and volume', () => {
  const { d, dtm } = demoDtm();
  const B = DtmEng.buildBlocks(DtmEng.parseStr(d.blk, 'demo_blasts.str').segs, 'demo_blasts.str');
  const out = DtmEng.stats(B, dtm.r, { bench: 10, fixed: false, floorRL: 0, dens: 2.7 });
  assert.equal(out, 0); assert.equal(B.length, 29);
  const b = B.find(x => x.name === '300-01');
  assert.equal(b.area, 625); assert.equal(b.per, 100);
  assert.ok(Math.abs(b.vol - 6250) < 1e-6); assert.ok(Math.abs(b.t - 16875) < 1e-6);
  const tri = DtmEng.buildBlocks(DtmEng.parseStr('blk,01-Jan-25,,\r\n0,0,0,0,\r\n5, 100, 200, 10, A1\r\n5,100,210,10\r\n5,110,210,10\r\n5,100,200,10\r\n0,0,0,0,END\r\n', 'c').segs, 'c')[0];
  assert.equal(tri.name, 'A1'); assert.equal(tri.area, 50);
  assert.ok(Math.abs(tri.cx - 206.6667) < 1e-3 && Math.abs(tri.cy - 103.3333) < 1e-3);
});

test('dtm: clear errors for bad input', () => {
  const { d } = demoDtm();
  const code = f => { try { f(); return null; } catch (e) { return e.code; } };
  assert.equal(code(() => DtmEng.parseDtm(d.dtm, 'x.dtm', 100, 'y.str')), 'dtmMismatch');
  assert.equal(code(() => DtmEng.parseStr('hello\nworld', 'z.str')), 'strEmpty');
  assert.equal(code(() => DtmEng.parseStr('\u0000\u0001binary\u0000\u0000\u0002', 'b.str')), 'binary');
  assert.equal(code(() => DtmEng.triangulate([{ x: 0, y: 0, z: 0 }], null)), 'noDelaunay');
});

test('dtm: recorded points are written as Surpac .str (Y, X, Z order)', () => {
  const txt = DtmEng.strText([{ x: 452300.123, y: 4381500.5, z: 300 }], 'pts');
  const line = txt.split('\n')[2];
  assert.equal(line, '1, 4381500.500, 452300.123, 300.000, P1');
  assert.ok(txt.trim().endsWith('END'));
});
