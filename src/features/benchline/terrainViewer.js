/* Benchline — terrain-viewer.js
 * Minimal WebGL 2 viewer: one textured terrain mesh, orbit and plan cameras, heightfield ray picking.
 * ES module: createViewer() returns an independent viewer, so the page can mount more than once; destroy() releases it.
 */
/* ---------- small WebGL 2 terrain viewer: one textured mesh, orbit / plan camera, heightfield picking ---------- */
export function createViewer() {
  let ro = null, ac = null;
  let gl = null, cv = null, prog, loc = {}, vao, vb, tb, ib, cnt = 0, tex = null, aniso = null, need = false, cb = {}, VP = null, IVP = null;
  const C = { mode: '3d', yaw: 0.35, pitch: 0.62, dist: 800, t: [0, 0, 0], hh: 300, zoom: 1, size: 600, W: 600, H: 600, zr: 100, cell: 1, bg: [0.95, 0.96, 0.97] };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const M = {
    persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2), m = new Float32Array(16); m[0] = t / a; m[5] = t; m[10] = (fa + n) / (n - fa); m[11] = -1; m[14] = 2 * fa * n / (n - fa); return m; },
    ortho(l, r, b, t, n, f) { const m = new Float32Array(16); m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n); m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1; return m; },
    look(e, c, u) { const z = nrm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = nrm(cross(u, z)), y = cross(z, x); return Float32Array.from([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]); },
    mul(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
    inv(a) {
      const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
      const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
      const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
      const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
      return Float32Array.from([(a11 * b11 - a12 * b10 + a13 * b09) * d, (a02 * b10 - a01 * b11 - a03 * b09) * d, (a31 * b05 - a32 * b04 + a33 * b03) * d, (a22 * b04 - a21 * b05 - a23 * b03) * d,
        (a12 * b08 - a10 * b11 - a13 * b07) * d, (a00 * b11 - a02 * b08 + a03 * b07) * d, (a32 * b02 - a30 * b05 - a33 * b01) * d, (a20 * b05 - a22 * b02 + a23 * b01) * d,
        (a10 * b10 - a11 * b08 + a13 * b06) * d, (a01 * b08 - a00 * b10 - a03 * b06) * d, (a30 * b04 - a31 * b02 + a33 * b00) * d, (a21 * b02 - a20 * b04 - a23 * b00) * d,
        (a11 * b07 - a10 * b09 - a12 * b06) * d, (a00 * b09 - a01 * b07 + a02 * b06) * d, (a31 * b01 - a30 * b03 - a32 * b00) * d, (a20 * b03 - a21 * b01 + a22 * b00) * d]);
    }
  };
  const aspect = () => Math.max(0.1, (cv.clientWidth || 1) / (cv.clientHeight || 1));
  function mats() {
    const a = aspect(); let P, Vw;
    if (C.mode === '3d') {
      const cp = Math.cos(C.pitch), e = [C.t[0] + C.dist * cp * Math.sin(C.yaw), C.t[1] + C.dist * Math.sin(C.pitch), C.t[2] + C.dist * cp * Math.cos(C.yaw)];
      P = M.persp(Math.PI / 4, a, Math.max(0.05, C.dist / 400), C.dist + C.size * 8); Vw = M.look(e, C.t, [0, 1, 0]);
    } else {
      const hh = C.hh / C.zoom, top = C.zr + C.size;
      P = M.ortho(-hh * a, hh * a, -hh, hh, 0.1, top * 2 + C.size); Vw = M.look([C.t[0], top, C.t[2]], [C.t[0], 0, C.t[2]], [0, 0, -1]);
    }
    VP = M.mul(P, Vw); IVP = M.inv(VP);
  }
  function render() {
    need = false; if (!gl) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (!w || !h) return;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); gl.clearColor(C.bg[0], C.bg[1], C.bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (cnt && tex) {
      mats(); gl.useProgram(prog); gl.uniformMatrix4fv(loc.m, false, VP);
      gl.bindVertexArray(vao); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc.s, 0);
      gl.drawElements(gl.TRIANGLES, cnt, gl.UNSIGNED_INT, 0);
    }
    if (cb.change) cb.change();
  }
  const req = () => { if (!need) { need = true; requestAnimationFrame(render); } };
  function pan(dx, dy) {
    if (C.mode === '3d') {
      const k = 2 * C.dist * Math.tan(Math.PI / 8) / (cv.clientHeight || 1), s = Math.sin(C.yaw), c = Math.cos(C.yaw);
      C.t[0] += (-dx * c - dy * s) * k; C.t[2] += (dx * s - dy * c) * k;
    } else { const k = 2 * C.hh / C.zoom / (cv.clientHeight || 1); C.t[0] -= dx * k; C.t[2] -= dy * k; }
  }
  function planXZ(e) {
    const b = cv.getBoundingClientRect(), nx = (e.clientX - b.left) / b.width * 2 - 1, ny = -((e.clientY - b.top) / b.height * 2 - 1), hh = C.hh / C.zoom;
    return [C.t[0] + nx * hh * aspect(), C.t[2] - ny * hh];
  }
  function zoomBy(f, e) {
    if (C.mode === '3d') C.dist = clamp(C.dist * f, C.size * 0.02, C.size * 6);
    else {
      const b0 = e ? planXZ(e) : null; C.zoom = clamp(C.zoom / f, 0.3, 400);
      if (b0) { const b1 = planXZ(e); C.t[0] += b0[0] - b1[0]; C.t[2] += b0[1] - b1[1]; }
    }
  }
  function interaction() {
    const ptr = new Map(); let down = null, pd = null;
    ac = new AbortController(); const sig = { signal: ac.signal };
    cv.addEventListener('contextmenu', e => e.preventDefault(), sig);
    cv.addEventListener('pointerdown', e => { try { cv.setPointerCapture(e.pointerId); } catch (x) {} ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); down = { x: e.clientX, y: e.clientY, moved: false }; pd = null; }, sig);
    cv.addEventListener('pointermove', e => {
      const p = ptr.get(e.pointerId);
      if (p) {
        const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
        if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) down.moved = true;
        if (down && down.moved) {
          if (ptr.size === 1) {
            if (C.mode === '3d' && !(e.shiftKey || (e.buttons & 6))) { C.yaw -= dx * 0.006; C.pitch = clamp(C.pitch + dy * 0.006, 0.08, 1.55); }
            else pan(dx, dy);
          } else if (ptr.size === 2) {
            const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
            if (pd) zoomBy(pd / d); pd = d; pan(dx / 2, dy / 2);
          }
          req();
        }
      }
      if (cb.hover) cb.hover(e);
    }, sig);
    const up = e => { const had = ptr.delete(e.pointerId); pd = null; if (had && down && !down.moved && !ptr.size && cb.click) cb.click(e); if (!ptr.size) down = null; };
    cv.addEventListener('pointerup', up, sig);
    cv.addEventListener('pointercancel', e => { ptr.delete(e.pointerId); pd = null; down = null; }, sig);
    cv.addEventListener('pointerleave', () => { if (!ptr.size && cb.leave) cb.leave(); }, sig);
    cv.addEventListener('wheel', e => { e.preventDefault(); zoomBy(Math.exp(clamp(e.deltaY, -200, 200) * 0.0015), e); req(); if (cb.hover) cb.hover(e); }, { passive: false, signal: ac.signal });
  }
  function init(canvas, callbacks) {
    cv = canvas; cb = callbacks || {};
    gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) return false;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec3 p;in vec2 t;uniform mat4 m;out vec2 vt;void main(){vt=t;gl_Position=m*vec4(p,1.0);}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, '#version 300 es\nprecision highp float;in vec2 vt;uniform sampler2D s;out vec4 o;void main(){vec4 c=texture(s,vt);if(c.a<0.05)discard;o=vec4(c.rgb,1.0);}'));
    gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    loc = { p: gl.getAttribLocation(prog, 'p'), t: gl.getAttribLocation(prog, 't'), m: gl.getUniformLocation(prog, 'm'), s: gl.getUniformLocation(prog, 's') };
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.enableVertexAttribArray(loc.p); gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 0, 0);
    tb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, tb); gl.enableVertexAttribArray(loc.t); gl.vertexAttribPointer(loc.t, 2, gl.FLOAT, false, 0, 0);
    ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bindVertexArray(null);
    gl.enable(gl.DEPTH_TEST);
    aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    interaction();
    ro = new ResizeObserver(req); ro.observe(canvas);
    return true;
  }
  function setMesh(pos, uv, idx) {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, tb); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null); cnt = idx.length; req();
  }
  function setPos(pos) { gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW); req(); }
  function setTexture(canvas) {
    if (!tex) tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    req();
  }
  function scene(o) { Object.assign(C, o); C.size = Math.max(C.W, C.H); }
  function fit() {
    C.t = [0, C.zr * 0.05, 0]; C.dist = C.size * 1.12; C.yaw = 0.35; C.pitch = 0.62; C.zoom = 1;
    C.hh = Math.max(C.H / 2, C.W / 2 / aspect()) * 1.05; req();
  }
  // Ray through the cursor, clipped to the model footprint, marched across the heightfield hf(x, z) → scene height
  function pick(e, hf) {
    if (!gl || !cnt) return null;
    mats();
    const b = cv.getBoundingClientRect(), nx = (e.clientX - b.left) / b.width * 2 - 1, ny = -((e.clientY - b.top) / b.height * 2 - 1);
    const tr = v => { const m = IVP, x = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], y = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], z = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14], w = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15]; return [x / w, y / w, z / w]; };
    const o = tr([nx, ny, -1]), p1 = tr([nx, ny, 1]), dv = [p1[0] - o[0], p1[1] - o[1], p1[2] - o[2]], L = Math.hypot(...dv), d = dv.map(v => v / L);
    let t0 = 0, t1 = L;
    for (const [ax, lo, hi] of [[0, -C.W / 2, C.W / 2], [2, -C.H / 2, C.H / 2]]) {
      if (Math.abs(d[ax]) < 1e-12) { if (o[ax] < lo || o[ax] > hi) return null; continue; }
      let a = (lo - o[ax]) / d[ax], c = (hi - o[ax]) / d[ax]; if (a > c) [a, c] = [c, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, c);
    }
    if (t0 > t1) return null;
    const hz = Math.hypot(d[0], d[2]), step = hz < 1e-6 ? (t1 - t0) : Math.max(C.cell * 0.7 / hz, (t1 - t0) / 6000);
    let prev = null;
    for (let t = t0; t <= t1 + 1e-9; t += step) {
      const x = o[0] + d[0] * t, y = o[1] + d[1] * t, z = o[2] + d[2] * t, g = hf(x, z);
      if (g !== g) { prev = null; continue; }
      if (y - g <= 0) {
        if (prev === null) return { x, z, y: g };
        let a = prev, c = t;
        for (let i = 0; i < 24; i++) { const m = (a + c) / 2, gm = hf(o[0] + d[0] * m, o[2] + d[2] * m); if (gm !== gm || o[1] + d[1] * m - gm > 0) a = m; else c = m; }
        const xb = o[0] + d[0] * c, zb = o[2] + d[2] * c; return { x: xb, z: zb, y: hf(xb, zb) };
      }
      prev = t;
    }
    return null;
  }
  // Release everything init() created: observers, listeners, GL objects, then the context itself.
  function destroy() {
    if (ro) { ro.disconnect(); ro = null; }
    if (ac) { ac.abort(); ac = null; }
    cb = {};
    if (!gl) return;
    const g = gl; gl = null; cnt = 0;
    for (const b of [vb, tb, ib]) if (b) g.deleteBuffer(b);
    if (tex) g.deleteTexture(tex);
    if (vao) g.deleteVertexArray(vao);
    if (prog) g.deleteProgram(prog);
    vb = tb = ib = tex = vao = prog = null;
    g.getExtension('WEBGL_lose_context')?.loseContext();
  }
  return {
    init, setMesh, setPos, setTexture, scene, fit, pick, req, destroy,
    setMode(m) { C.mode = m; req(); }, mode: () => C.mode, yaw: () => C.mode === '3d' ? C.yaw : 0,
    setBg(rgb) { C.bg = rgb; req(); }, maxTex: () => gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048
  };
}

