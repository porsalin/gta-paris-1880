// LANDMARKS of Paris as they stood in 1890 — real OpenStreetMap footprints (map/landmarks.json, built by
// tools/build_landmarks.py) extruded into clean stone volumes with crisp cornices and hipped/mansard roofs,
// plus hand-built 1890 features (domes, towers, spires, columns, the 1889 Exposition iron, Sacré-Cœur's building site).
// The Tour Eiffel and Galerie des machines stay gfx.js models (graphics worker, 76ce834); not duplicated here. Dates and sources: landmarks_1890.md.
// gfx.js calls install(ctx) once before it places its own landmark models, skips every key in OWNED, and calls update().
// Zoning / prop placement: use inLandmark(x, z, pad) or the RESV tile mask (world.js) — nothing goes inside a footprint.
import * as THREE from './vendor/three.module.js';
import { ROADS as VROADS } from './vec.js';
import { LM, T, K, NX as NXl, kind, skipT, ti, inb, addProp, RESV, POI, POIV, hooks } from './world.js';
const D = await fetch('map/landmarks.json').then(r => r.json());
const PI = Math.PI;
// height compression: ~.62 unit per metre up to 21 m (a Haussmann front is ~12 units, like the procedural blocks), then compressed so towers and domes
// still dominate the skyline without poking through the top-down camera (~40 units up)
export const hw = m => m <= 21 ? m * .62 : 13 + (m - 21) * .075;
// ---------------- footprint geometry helpers ----------------
const area = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const perim = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); } return s; };
function pip(p, x, z) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const a = p[i], b = p[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
const inPoly = (P, x, z) => pip(P.o, x, z) && !P.h.some(h => pip(h, x, z));
function obb(p) { let mx = 0, mz = 0; for (const v of p) { mx += v[0]; mz += v[1]; } mx /= p.length; mz /= p.length; let a = 0, b = 0, c = 0; for (const v of p) { const x = v[0] - mx, z = v[1] - mz; a += x * x; b += x * z; c += z * z; }
  const th = .5 * Math.atan2(2 * b, a - c), ux = Math.cos(th), uz = Math.sin(th); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const v of p) { const x = v[0] - mx, z = v[1] - mz, u = x * ux + z * uz, w = -x * uz + z * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, w); v1 = Math.max(v1, w); }
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2; return { x: mx + cu * ux - cv * uz, z: mz + cu * uz + cv * ux, ux, uz, L: u1 - u0, W: v1 - v0 }; }
const DIRV = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0], NE: [.7, -.7], NW: [-.7, -.7], SE: [.7, .7], SW: [-.7, .7] };
// orient an OBB so its +u axis is the axis closest to the named compass front, pointing that way
function face(o, f) { const d = DIRV[f]; if (Math.abs(o.ux * d[0] + o.uz * d[1]) < Math.abs(-o.uz * d[0] + o.ux * d[1])) { [o.ux, o.uz] = [-o.uz, o.ux]; [o.L, o.W] = [o.W, o.L]; } if (o.ux * d[0] + o.uz * d[1] < 0) { o.ux = -o.ux; o.uz = -o.uz; } return o; }
const at = (o, s, t) => [o.x + o.ux * s * o.L / 2 - o.uz * t * o.W / 2, o.z + o.uz * s * o.L / 2 + o.ux * t * o.W / 2];
const at3 = (o, s, t, y) => { const q = at(o, s, t); return [q[0], y, q[1]]; };
const angOf = o => Math.atan2(o.uz, o.ux);
function shapeOf(P, c) { const S = new THREE.Shape(P.o.map(v => new THREE.Vector2(v[0] - c[0], -(v[1] - c[1])))); for (const h of P.h) S.holes.push(new THREE.Path(h.map(v => new THREE.Vector2(v[0] - c[0], -(v[1] - c[1]))))); return S; }
function ll(la, lo) { const KX = 111320 * Math.cos(48.862 * PI / 180); return [(lo - 2.270) * KX / 2.5, (48.895 - la) * 111320 / 2.5]; }
// ---------------- builder: merges per material (one draw call per material per landmark) ----------------
// rotation convention: ry = a aligns a box's local x with the compass angle a (atan2(dz, dx)) in world x/z
class B { constructor(c) { this.c = c; this.m = new Map(); }
  put0(g, mat) { g = g.index ? g.toNonIndexed() : g; (this.m.get(mat) || this.m.set(mat, []).get(mat)).push(g); return this; }
  put(g, mat, x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) { g = g.index ? g.toNonIndexed() : g; g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x - this.c[0], y, z - this.c[1]), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, -ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz))); return this.put0(g, mat); }
  box(w, h, d, x, y, z, mat, ry = 0) { return this.put(new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z, ry); }
  cyl(rt, rb, h, x, y, z, mat, seg = 16) { return this.put(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y + h / 2, z); }
  cone(r, h, x, y, z, mat, seg = 8, ry = 0) { return this.put(new THREE.ConeGeometry(r, h, seg), mat, x, y + h / 2, z, ry); }
  dome(r, x, y, z, mat, sy = 1, seg = 24) { return this.put(new THREE.SphereGeometry(r, seg, 10, 0, PI * 2, 0, PI / 2), mat, x, y, z, 0, 1, sy, 1); }
  sphere(r, x, y, z, mat) { return this.put(new THREE.SphereGeometry(r, 10, 8), mat, x, y, z); }
  beam(a, c, t, mat) { const d = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), l = d.length(); if (l < 1e-3) return this; const g = new THREE.BoxGeometry(t, l, t); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); return this.put(g, mat, (a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2); }
  prism(polys, y0, h, mat) { for (const P of polys) { const g = new THREE.ExtrudeGeometry(shapeOf(P, this.c), { depth: h, bevelEnabled: false, curveSegments: 1 }); g.rotateX(-PI / 2); g.translate(0, y0, 0); this.put0(g, mat); } return this; }
  // hipped / mansard roof: the real footprint bevelled inwards; inset limited by the mean wing width so it never self-intersects
  hip(polys, y0, h, mat, k = .5, maxIn = 99) { for (const P of polys) { const ins = Math.max(.15, Math.min(maxIn, k * Math.abs(area(P.o)) / perim(P.o) * (P.h.length ? .5 : 1)));
      const g = new THREE.ExtrudeGeometry(shapeOf(P, this.c), { depth: .02, bevelEnabled: true, bevelThickness: h, bevelSize: ins, bevelOffset: -ins, bevelSegments: 1, curveSegments: 1 }); g.rotateX(-PI / 2); g.translate(0, y0, 0); this.put0(g, mat); } return this; }
  // crisp projecting cornice that outlines the silhouette from above
  cornice(polys, y, mat, o = .32) { for (const P of polys) { const g = new THREE.ExtrudeGeometry(shapeOf(P, this.c), { depth: .3, bevelEnabled: true, bevelThickness: .02, bevelSize: o, bevelOffset: 0, bevelSegments: 1, curveSegments: 1 }); g.rotateX(-PI / 2); g.translate(0, y - .32, 0); this.put0(g, mat); } return this; }
  // windows along every outer wall (their tops glow from above at night)
  windows(polys, y, mat, step = 2.6, h = .9) { for (const P of polys) { const p = P.o; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < step) continue; const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L;
        let nx = dz, nz = -dx; if (pip(p, (a[0] + b[0]) / 2 + nx * .4, (a[1] + b[1]) / 2 + nz * .4)) { nx = -nx; nz = -nz; } const n = Math.floor(L / step);
        for (let k = 0; k < n; k++) { const f = (k + .5) / n; this.box(.7, h, .14, a[0] + (b[0] - a[0]) * f + nx * .06, y, a[1] + (b[1] - a[1]) * f + nz * .06, mat, Math.atan2(dz, dx)); } } } return this; }
  build() { const g = new THREE.Group(); for (const [mat, list] of this.m) { let n = 0; for (const q of list) n += q.attributes.position.count; const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
      for (const q of list) { if (!q.attributes.normal) q.computeVertexNormals(); P.set(q.attributes.position.array, o * 3); N.set(q.attributes.normal.array, o * 3); if (q.attributes.uv) U.set(q.attributes.uv.array, o * 2); o += q.attributes.position.count; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(U, 2)); geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = !mat.transparent && !mat.userData.noShadow; mesh.receiveShadow = true; g.add(mesh); } g.position.set(this.c[0], 0, this.c[1]); return g; } }
// ---------------- materials (period palette; gfx's landmark stone carries its ashlar shader) ----------------
let M = null; const SAILS = [], ROT = [];
function cvTex(n, f) { const c = document.createElement('canvas'); c.width = c.height = n; f(c.getContext('2d'), n); return c; }
function setTex(c, r) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(r * 4, r); t.colorSpace = THREE.SRGBColorSpace; return t; }
function mats(L_, ctx) { const std = ctx.stdM; M = { stone: L_.stone, stoneD: L_.stoneD, gothic: L_.gothic, slate: L_.slate, copper: L_.copper, gold: L_.gold, iron: L_.iron, soot: L_.soot, wood: L_.wood, sail: L_.sail, brick: L_.brick, zinc: L_.zinc, water: L_.water, red: L_.red,
    lead: std({ color: 0x5c646e, roughness: .55, metalness: .25 }), cornice: std({ color: 0xe6dcc4 }), marble: std({ color: 0xc89a90 }), bronze: std({ color: 0x4a5a48, roughness: .5, metalness: .5 }),
    chateau: std({ color: 0xf2eee4 }), scaff: std({ color: 0x9a7a52, roughness: .95 }), yard: std({ color: 0xb8ac94, roughness: 1 }), paving: std({ color: 0xbcb2a0, roughness: .95 }), cobble: () => M._cb || (M._cb = std({ map: setTex(cvTex(64, (g, n) => { g.fillStyle = '#7d7568'; g.fillRect(0, 0, n, n); for (let y = 0; y < n; y += 4) for (let x = (y / 4 % 2) * 2; x < n; x += 4) { const v = 100 + Math.random() * 40 | 0; g.fillStyle = `rgb(${v + 12},${v + 6},${v - 6})`; g.fillRect(x + .5, y + .5, 3, 3); } }), 6), roughness: 1 })),
    flagM: () => M._fl || (M._fl = std({ map: setTex(cvTex(64, (g, n) => { g.fillStyle = '#a39a88'; g.fillRect(0, 0, n, n); for (let y = 0; y < n; y += 16) for (let x = (y / 16 % 2) * 10; x < n; x += 20) { const v = 172 + Math.random() * 22 | 0; g.fillStyle = `rgb(${v},${v - 6},${v - 18})`; g.fillRect(x + 1, y + 1, 18, 14); } }), 3), roughness: .95 })),
    kerb: () => M._kb || (M._kb = std({ color: 0x3a342c, roughness: 1 })),
    rose: ctx.ROSEM || L_.glass, lancet: ctx.LANCET || L_.glass, eif: ctx.EIFM || std({ color: 0x74382a, roughness: .62, metalness: .35 }), eifl: ctx.EIFL || std({ color: 0x3a2a1a, emissive: 0xffc878, emissiveIntensity: 0, roughness: .4 }), liberty: std({ color: 0x9a6a3a, roughness: .45, metalness: .7 }), // the copper was still bright in 1889
    win: std({ color: 0x2a2620, emissive: 0xffb860, emissiveIntensity: 0 }), gas: std({ color: 0xf0e0b0, emissive: 0xffd090, emissiveIntensity: 0 }), redl: std({ color: 0x8a1a14, emissive: 0xff3020, emissiveIntensity: 0 }),
    tree: std({ color: 0x4a6a34, roughness: 1 }), hglass: new THREE.MeshStandardMaterial({ color: 0xa8bcc0, roughness: .12, metalness: .4, transparent: true, opacity: .88 }) }; }
// ---------------- reusable pieces ----------------
// standard stone block: walls to `m` metres, cornice, lit windows, slate (or other) hipped/mansard roof
function std(b, P, m, o = {}) { const h = hw(m), y0 = o.y0 || 0; b.prism(P, y0, h, o.wall || M.stone).cornice(P, y0 + h, o.cor || M.cornice, o.co ?? .32);
  if (o.win !== false) for (let f = 0; f < (o.floors || Math.max(1, Math.round(h / 3.4))); f++) b.windows(P, y0 + 1.2 + f * 3.1, M.win, o.step || 2.6);
  if (o.roof !== null) b.hip(P, y0 + h, o.rh ?? 2.6, o.roof || M.slate, o.rk ?? .5, o.rmax ?? 5); return h + y0; }
// square tower with a pyramid/spire top
function tower(b, x, z, w, m, top = 'flat', mat = M.gothic, ry = 0) { const h = hw(m); b.box(w, h, w, x, 0, z, mat, ry).box(w + .5, .4, w + .5, x, h - .2, z, M.cornice, ry);
  if (top === 'spire') b.cone(w * .5, w * 2.6, x, h, z, M.lead, 8, ry + PI / 8); else if (top === 'pyr') b.cone(w * .72, w * .8, x, h + .2, z, M.slate, 4, ry + PI / 4); else b.box(w - .4, .25, w - .4, x, h + .2, z, M.lead, ry);
  return h; }
// drum + ribbed dome + lantern
function domeOn(b, x, z, r, y, mat = M.lead, o = {}) { const dh = o.drum ?? r * .9; b.cyl(r, r, dh, x, y, z, o.drumMat || M.stone, 24).cyl(r + .35, r + .35, .35, x, y + dh, z, M.cornice, 24);
  for (let k = 0; k < 12; k++) { const a = k * PI / 6; b.box(.35, dh * .9, .35, x + Math.cos(a) * (r + .1), y, z + Math.sin(a) * (r + .1), M.cornice); }
  b.dome(r, x, y + dh + .3, z, mat, o.sy ?? 1.25); for (let k = 0; k < 12; k++) b.put(new THREE.TorusGeometry(r + .04, .09, 4, 10, PI / 2), o.rib || M.gold, x, y + dh + .3, z, k * PI / 6, 1, o.sy ?? 1.25, 1);
  const top = y + dh + .3 + r * (o.sy ?? 1.25); b.cyl(r * .2, r * .22, r * .45, x, top - .1, z, M.stone, 12).cone(r * .24, r * .5, x, top + r * .35, z, o.lant || mat, 12).sphere(.22, x, top + r * .9, z, M.gold); return top + r; }
// timber scaffolding cage around a footprint part (Sacré-Cœur, Sorbonne)
function scaffold(b, poly, y0, h, step = 2.4) { const p = poly; for (let i = 0; i < p.length; i++) { const a = p[i], c = p[(i + 1) % p.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.round(L / step));
    let nx = (c[1] - a[1]) / L, nz = -(c[0] - a[0]) / L; if (pip(p, (a[0] + c[0]) / 2 + nx * .5, (a[1] + c[1]) / 2 + nz * .5)) { nx = -nx; nz = -nz; }
    for (let k = 0; k <= n; k++) { const x = a[0] + (c[0] - a[0]) * k / n + nx * .8, z = a[1] + (c[1] - a[1]) * k / n + nz * .8; b.box(.18, h, .18, x, y0, z, M.scaff); }
    for (let y = y0 + 2; y <= y0 + h; y += 2.2) { b.beam([a[0] + nx * .8, y, a[1] + nz * .8], [c[0] + nx * .8, y, c[1] + nz * .8], .14, M.scaff); b.box(L, .08, .9, (a[0] + c[0]) / 2 + nx * 1.1, y, (a[1] + c[1]) / 2 + nz * 1.1, M.wood, Math.atan2(c[1] - a[1], c[0] - a[0])); } } }
// lattice derrick crane (period hand/steam crane: timber mast + jib)
function crane(b, x, z, h, ang) { b.box(.9, .3, .9, x, 0, z, M.wood).box(.35, h, .35, x, 0, z, M.scaff); for (let y = 1.5; y < h; y += 2) b.box(.9, .1, .1, x, y, z, M.scaff, ang);
  b.beam([x, h * .25, z], [x + Math.cos(ang) * h * .75, h * .95, z + Math.sin(ang) * h * .75], .3, M.scaff).beam([x, h, z], [x + Math.cos(ang) * h * .75, h * .95, z + Math.sin(ang) * h * .75], .08, M.iron);
  b.beam([x + Math.cos(ang) * h * .75, h * .95, z + Math.sin(ang) * h * .75], [x + Math.cos(ang) * h * .75, h * .3, z + Math.sin(ang) * h * .75], .05, M.iron).box(.8, .5, .8, x + Math.cos(ang) * h * .75, h * .3 - .5, z + Math.sin(ang) * h * .75, M.stoneD); }
function statue(b, x, z, ped = 1.6, s = 1, mat = M.bronze, ry = 0) { b.box(1.4 * s, ped, 1.4 * s, x, 0, z, M.stone, ry).box(1.7 * s, .25, 1.7 * s, x, ped - .1, z, M.cornice, ry).cyl(.28 * s, .38 * s, 1.5 * s, x, ped + .15, z, mat, 8).sphere(.22 * s, x, ped + 1.85 * s, z, mat); return ped + 2 * s; }
function fountain(b, x, z, r) { b.cyl(r, r + .2, .7, x, 0, z, M.stone, 28).cyl(r - .35, r - .35, .05, x, .62, z, M.water, 28).cyl(r * .35, r * .45, 1.2, x, .6, z, M.stoneD, 16).cyl(r * .5, r * .3, .3, x, 1.8, z, M.stone, 16)
  .cyl(r * .45, r * .45, .04, x, 2.08, z, M.water, 16).cyl(.18, .25, 1.4, x, 2.1, z, M.bronze, 8).sphere(.3, x, 3.5, z, M.bronze); }
function gasLamps(b, cx, cz, r, n, ph = 0) { for (let k = 0; k < n; k++) { const a = ph + k * 2 * PI / n, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; b.cyl(.1, .16, 3.4, x, 0, z, M.iron, 6).box(.42, .5, .42, x, 3.4, z, M.gas).cone(.34, .3, x, 3.9, z, M.iron, 4, PI / 4); } }
// Baltard pavilion (Les Halles): cast-iron columns, lantern roof, zinc
function baltard(b, x, z, w, d, ang) { const ca = Math.cos(ang), sa = Math.sin(ang), P = (u, v) => [x + u * ca - v * sa, z + u * sa + v * ca], h = 6.2;
  for (let u = -w / 2; u <= w / 2 + .01; u += w / 6) for (const v of [-d / 2, d / 2]) { const q = P(u, v); b.box(.3, h, .3, q[0], 0, q[1], M.iron); }
  for (let v = -d / 2 + d / 6; v < d / 2 - .01; v += d / 6) for (const u of [-w / 2, w / 2]) { const q = P(u, v); b.box(.3, h, .3, q[0], 0, q[1], M.iron); }
  b.box(w + .4, 1.4, d + .4, x, h - 1.4, z, M.hglass, ang).box(w + 1.2, .25, d + 1.2, x, h, z, M.iron, ang);
  b.put(roofG(w + 1.2, d + 1.2, 2.4), M.zinc, x, h + .25, z, ang).box(w * .55, 1.2, d * .3, x, h + 2.2, z, M.hglass, ang).put(roofG(w * .6, d * .36, 1), M.zinc, x, h + 3.4, z, ang); }
// gabled roof prism, long axis along local x
function roofG(L, W, h) { const s = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, h)]); const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }); g.translate(0, 0, -L / 2); g.rotateY(PI / 2); return g; }
function roofPrism(b, o, h, y, mat = M.slate, fr = 1) { b.put(roofG(o.L * fr, o.W, h), mat, o.x, y, o.z, angOf(o)); }
// triangular pediment on a facade (width spans across the front)
function pediment(b, x, z, a, W, h, y) { const s = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, h)]); b.put(new THREE.ExtrudeGeometry(s, { depth: .8, bevelEnabled: false }), M.stone, x, y, z, a + PI / 2); }
// colonnade of n columns between two points
function cols(b, a, c, n, h, r, y = 0, mat = M.stone) { for (let k = 0; k < n; k++) { const f = n === 1 ? .5 : k / (n - 1); b.cyl(r, r * 1.08, h, a[0] + (c[0] - a[0]) * f, y, a[1] + (c[1] - a[1]) * f, mat, 10); } }
// church: real footprint walls, nave roof along the main axis, west-front towers, crossing spire/dome, rose window
function church(b, G, o = {}) { const { P, o: B0 } = G, a = angOf(B0), h = std(b, P, o.m ?? 20, { wall: o.wall || M.gothic, roof: null, step: 3.4, floors: 2, co: .2 });
  b.hip(P, h, o.rh ?? Math.min(6, B0.W * .3), o.roofMat || M.lead, .85, B0.W * .3); // pitched roof following the real nave/transept/apse outline
  if (o.towers) for (const t of [-1, 1]) { const q = at(B0, .82, t * .62); tower(b, q[0], q[1], o.tw || Math.min(7, B0.W * .3), o.towers, o.ttop || 'flat', o.wall || M.gothic, a); }
  if (o.tower1) { const q = at(B0, .85, 0); tower(b, q[0], q[1], o.tw || Math.min(6, B0.W * .35), o.tower1, o.ttop || 'spire', o.wall || M.gothic, a); }
  if (o.fleche) { const q = at(B0, o.fx ?? -.1, 0); b.cone(1.1, hw(o.fleche) - h + 4, q[0], h, q[1], M.lead, 8, PI / 8); }
  if (o.dome) { const q = at(B0, o.dx ?? -.1, 0); domeOn(b, q[0], q[1], o.dome, h, o.domeMat || M.lead, { rib: o.rib || M.lead, drum: o.drum }); }
  if (o.rose !== false) { const q = at(B0, 1, 0); b.put(new THREE.CircleGeometry(Math.min(2.4, B0.W * .2), 20), M.rose, q[0] + B0.ux * .2, h * .66, q[1] + B0.uz * .2, a - PI / 2); }
  if (o.lancets) b.windows(P, h * .35, M.lancet, 3.6, h * .4); return h; }
// classical temple front (Madeleine, Bourse, Panthéon portico)
function temple(b, G, m, n = 8, o = {}) { const { P, o: B0 } = G, a = angOf(B0), h = hw(m); b.prism(P, 0, h * .95, M.stone).cornice(P, h, M.cornice, .45);
  roofPrism(b, B0, h * .26, h, o.roof || M.lead, 1); const peri = o.peri;
  for (const s of [1, -1]) { if (s < 0 && !peri && !o.back) continue; const q = at(B0, s * .97, 0); pediment(b, q[0] + B0.ux * s * .3, q[1] + B0.uz * s * .3, a, B0.W * .98, h * .26, h);
    cols(b, at(B0, s * 1.03, -.92), at(B0, s * 1.03, .92), n, h * .92, .55); }
  if (peri) for (const t of [-1, 1]) cols(b, at(B0, -.94, t * 1.04), at(B0, .94, t * 1.04), peri, h * .92, .55);
  b.box(B0.L + 2, .8, B0.W + 2, B0.x, 0, B0.z, M.stoneD, a); }
// railway terminus: stone head-house on the front, glazed iron train shed behind
function station(b, G, o = {}) { const { P, o: B0 } = G, a = angOf(B0), hh = hw(o.m ?? 20), fd = o.fd ?? .16;
  const sh = { ...B0, L: B0.L * (1 - fd), x: B0.x - B0.ux * B0.L * fd / 2, z: B0.z - B0.uz * B0.L * fd / 2 };
  b.box(sh.L, 6, sh.W, sh.x, 0, sh.z, M.brick, a); const n = o.sheds || 1; for (let k = 0; k < n; k++) { const t = -1 + (2 * k + 1) / n, q = at(sh, 0, t);
    b.put(new THREE.CylinderGeometry(sh.W / n / 2, sh.W / n / 2, sh.L, 16, 1, false, 0, PI), M.hglass, q[0], 6, q[1], a, 1, .45, 1, 0, PI / 2);
    for (let u = -.95; u <= .96; u += .1) { const r = at(sh, u, t); b.put(new THREE.TorusGeometry(sh.W / n / 2, .18, 4, 12, PI), M.iron, r[0], 6, r[1], a + PI / 2, 1, .45, 1); } }
  const fq = at(B0, 1 - fd / 2, 0), fo = { ...B0, L: B0.L * fd, x: fq[0], z: fq[1] }; b.box(fo.L, hh, fo.W, fo.x, 0, fo.z, M.stone, a).box(fo.L + .6, .4, fo.W + .6, fo.x, hh, fo.z, M.cornice, a);
  b.put(roofG(fo.W, fo.L, 2), M.slate, fo.x, hh + .4, fo.z, a + PI / 2); for (let f = 0; f < 2; f++) b.box(.15, 1.2, fo.W * .8, fo.x + B0.ux * fo.L / 2, 1.5 + f * 3.4, fo.z + B0.uz * fo.L / 2, M.win, a);
  if (o.clock !== false) { b.put(new THREE.CircleGeometry(1.2, 18), M.chateau, fo.x + B0.ux * (fo.L / 2 + .1), hh * .8, fo.z + B0.uz * (fo.L / 2 + .1), a - PI / 2); }
  if (o.statues) for (let k = -4; k <= 4; k++) b.cyl(.25, .3, 1.4, ...at3(fo, 0, k / 4.5, hh + .4), M.stone, 6); }
// triumphal gate (Arc, Carrousel, Portes Saint-Denis/Saint-Martin): solid piers, arched passage roof
function gate(b, x, z, a, w, d, m, o = {}) { const h = hw(m), pw = o.pier ?? w * .32; for (const s of [-1, 1]) b.box(pw, h, d, x + Math.cos(a) * s * (w - pw) / 2, 0, z + Math.sin(a) * s * (w - pw) / 2, o.mat || M.stone, a);
  b.box(w, h * .36, d, x, h * .64, z, o.mat || M.stone, a).box(w + .8, .5, d + .8, x, h, z, M.cornice, a).box(w * .9, .6, d * .85, x, h + .5, z, o.attic || M.stone, a);
  if (o.quad) b.box(w * .3, 1.2, d * .5, x, h + 1.1, z, M.bronze, a); if (o.cross) b.box(d * .5, h * .4, w - 2 * pw, x, 0, z, M.stoneD, a); }
// Montmartre windmill (Moulin de la Galette / Moulin Rouge): body, cap, sails animated in update()
function mill(b, g, x, z, base, mat, capMat, sailMat, ry = 0) { const h = 5.4; b.cyl(1.5, 1.9, h, x, base, z, mat, 10).cone(1.9, 1.8, x, base + h, z, capMat, 10);
  const hub = new THREE.Group(); hub.position.set(x - b.c[0] + Math.cos(ry) * 1.7, base + h - .4, z - b.c[1] + Math.sin(ry) * 1.7); hub.rotation.y = -ry;
  const rot = new THREE.Group(); hub.add(rot); for (let k = 0; k < 4; k++) { const arm = new THREE.Group(); arm.rotation.x = k * PI / 2; const m = new THREE.Mesh(new THREE.BoxGeometry(.1, 5, .95), sailMat); m.position.y = 2.6; m.castShadow = true; arm.add(m); rot.add(arm); }
  g.push(hub); ROT.push(rot); }
// ---------------- 1889 Exposition iron ----------------
// Palais du Trocadéro (Davioud & Bourdais, 1878): rotunda with twin 'minaret' towers, two curved arcaded wings toward the Seine
function trocadero(b, ang) { const [x, z] = b.c, R = 11, th = 55 * PI / 180;
  b.cyl(R, R + .4, hw(30), x, 0, z, M.stone, 32).dome(R, x, hw(30), z, M.slate, .45, 32).cyl(R + .6, R + .6, .4, x, hw(30), z, M.cornice, 32);
  for (const s of [-1, 1]) { const tx = x - Math.cos(ang) * R * .7 + Math.cos(ang + s * PI / 2) * R * .95, tz = z - Math.sin(ang) * R * .7 + Math.sin(ang + s * PI / 2) * R * .95; b.box(3.6, hw(82), 3.6, tx, 0, tz, M.stone, ang).cone(2.2, 3, tx, hw(82), tz, M.lead, 4, ang + PI / 4).sphere(.4, tx, hw(82) + 3.1, tz, M.gold); }
  for (const s of [-1, 1]) { const Rw = 52, cx = x - Math.cos(ang) * (Rw - R - 4), cz = z - Math.sin(ang) * (Rw - R - 4); for (let k = 0; k < 14; k++) { const t0 = ang + s * (.2 + th * k / 14), t1 = ang + s * (.2 + th * (k + 1) / 14);
      const p0 = [cx + Math.cos(t0) * Rw, cz + Math.sin(t0) * Rw], p1 = [cx + Math.cos(t1) * Rw, cz + Math.sin(t1) * Rw], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + .3, m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], aa = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      b.box(L, hw(12), 5, m[0], 0, m[1], M.stone, aa).put(roofG(L, 5.4, 1.4), M.slate, m[0], hw(12), m[1], aa).box(L, .3, 5.6, m[0], hw(12) - .3, m[1], M.cornice, aa); }
    const t = ang + s * (.2 + th), e = [cx + Math.cos(t) * Rw, cz + Math.sin(t) * Rw]; b.box(7, hw(17), 9, e[0], 0, e[1], M.stone, t).hip([{ o: [[-3.5, -4.5], [3.5, -4.5], [3.5, 4.5], [-3.5, 4.5]].map(([u, v]) => [e[0] + u * Math.cos(t) - v * Math.sin(t), e[1] + u * Math.sin(t) + v * Math.cos(t)]), h: [] }], hw(17), 2, M.slate); }
  // cascade and basin down the hill toward the Seine
  for (let k = 0; k < 6; k++) { const d = R + 4 + k * 3.2; b.box(6 - k * .2, .4 - k * .03, 3, x + Math.cos(ang) * d, 0, z + Math.sin(ang) * d, M.water, ang); }
  b.cyl(9, 9.3, .6, x + Math.cos(ang) * (R + 28), 0, z + Math.sin(ang) * (R + 28), M.stone, 28).cyl(8.6, 8.6, .05, x + Math.cos(ang) * (R + 28), .58, z + Math.sin(ang) * (R + 28), M.water, 28); }
// Liberty Enlightening the World, Bartholdi's 1/4-scale bronze (1889) on the Île aux Cygnes; faced EAST (toward the Eiffel Tower) until 1937
function liberty(b) { const [x, z] = b.c; b.box(3.2, 3.6, 3.2, x, 0, z, M.stone).box(3.6, .3, 3.6, x, 3.5, z, M.cornice).cyl(.55, .8, 3.6, x, 3.8, z, M.liberty, 10).sphere(.45, x, 7.8, z, M.liberty)
  .beam([x + .35, 6.9, z], [x + .6, 9.6, z], .22, M.liberty).cone(.25, .5, x + .62, 9.6, z, M.gold, 8).box(.4, .6, .2, x - .4, 6.5, z + .3, M.liberty); for (let k = 0; k < 7; k++) { const t = k / 6 * PI - PI / 2; b.beam([x, 8.1, z], [x + Math.cos(t) * .2, 8.6, z + Math.sin(t) * .6], .06, M.liberty); } }
// ---------------- SPEC: one entry per landmark ----------------
// d: footprint key in map/landmarks.json (default = key); pt: hand point (map/landmarks.json pt); r: radius for point-built monuments
// lab: map label; f: main front; s: solid colliders [[x, z, r]] (world) for free-standing monuments; walk: footprint stays walkable
const S = {};
const add = (k, o) => { S[k] = o; };
// --- Île de la Cité ---
add('notredame', { lab: 'Notre-Dame de Paris', f: 'W', fn(b, G) { const h = church(b, G, { m: 33, towers: 69, tw: 6.2, fleche: 96, fx: -.18, rose: true, lancets: true });
  for (const s of [-1, 1]) { const q = at(G.o, -.15, s * 1.02); b.put(new THREE.CircleGeometry(2, 20), M.rose, q[0] - G.o.uz * s * .3, h * .66, q[1] + G.o.ux * s * .3, angOf(G.o) + (s > 0 ? 0 : PI)); }
  for (let k = 0; k < 9; k++) for (const s of [-1, 1]) { const q = at(G.o, -.7 + k * .17, s * 1.25); b.beam([q[0], 0, q[1]], [...at(G.o, -.7 + k * .17, s * .9).slice(0, 1), h * .8, at(G.o, -.7 + k * .17, s * .9)[1]], .45, M.gothic); } } }); // flying buttresses
add('saintechapelle', { lab: 'Sainte-Chapelle', f: 'W', fn(b, G) { church(b, G, { m: 42, fleche: 75, fx: .1, roofMat: M.slate, lancets: true }); } });
add('palaisjustice', { lab: 'Palais de Justice & Conciergerie', f: 'N', fn(b, G) { const h = std(b, G.P, 24, { rh: 3 });
  for (const [u, v, w] of [[.62, 1.02, 3.6], [.48, 1.02, 3.6], [.34, 1.02, 3.6], [.9, 1.02, 2.6]]) { const q = at(G.o, v, -u); b.cyl(w / 2, w / 2, h + 2, q[0], 0, q[1], M.gothic, 14).cone(w / 2 + .3, w * .9, q[0], h + 2, q[1], M.slate, 14); } // Conciergerie towers on the Seine
  const q = at(G.o, .2, .55); b.cone(.9, hw(75) - h + 6, q[0], h, q[1], M.lead, 8); } });
add('hoteldieu', { lab: 'Hôtel-Dieu (rebuilt 1877)', f: 'N', fn(b, G) { std(b, G.P, 22); } });
add('pontneuf', { lab: 'Pont Neuf & Henri IV', pt: 'henri4', r: 3.2, fn(b) { statue(b, b.c[0], b.c[1], 2.4, 1.4, M.bronze); b.box(1.6, .7, 1, b.c[0], 4.2, b.c[1], M.bronze); } });
add('pontarts', { lab: 'Pont des Arts (iron footbridge, 1804)', label: true, fn(b) { bridge(b, b.c, 'foot', 9, { lamps: false }); } });
// --- Louvre / Tuileries / Palais-Royal ---
add('louvre', { lab: 'Palais du Louvre', f: 'E', hull: true, fn(b, G) { std(b, G.P, 20, { rh: 3.2, rmax: 4.5 });
  for (const P of G.P) { const p = P.o; for (let i = 0; i < p.length; i++) { const a = p[i], c = p[(i + 1) % p.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L > 30) { const m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2], aa = Math.atan2(c[1] - a[1], c[0] - a[0]), ox = Math.sin(aa) * 3, oz = -Math.cos(aa) * 3; const ins = pip(p, m[0] + ox, m[1] + oz) ? 1 : -1;
          b.box(9, hw(24), 9, m[0] + ox * ins, 0, m[1] + oz * ins, M.stone, aa).cone(6.2, 4.5, m[0] + ox * ins, hw(24), m[1] + oz * ins, M.slate, 4, aa + PI / 4); } } } } }); // pavilions with tall domed (square) roofs
add('carrousel', { lab: 'Arc du Carrousel', r: 7, fn(b) { const a = angOf(G0(b, 'louvre').o); gate(b, b.c[0], b.c[1], a + PI / 2, 8, 2.8, 19, { quad: true, cross: false }); }, sol: 2 });
add('palaisroyal', { lab: 'Palais-Royal', f: 'S', fn(b, G) { std(b, G.P, 20); } });
add('comedie', { lab: 'Comédie-Française', f: 'SW', fn(b, G) { std(b, G.P, 22, { rh: 3 }); } });
add('tuileries', { lab: 'Jardin des Tuileries (palace demolished 1883)', label: true });
// --- Grands Boulevards ---
add('garnier', { lab: 'Opéra Garnier (1875)', f: 'S', fn(b, G) { const o = G.o, h = std(b, G.P, 26, { roof: null });
  b.hip(G.P, h, 1.5, M.copper, .3, 3); const q = at(o, .15, 0); b.cyl(o.W * .32, o.W * .32, 2, q[0], h, q[1], M.stone, 28).dome(o.W * .32, q[0], h + 2, q[1], M.copper, .45, 28).sphere(.5, q[0], h + 2 + o.W * .14, q[1], M.gold);
  const s = at(o, -.42, 0); b.box(o.L * .2, hw(56) - h, o.W * .62, s[0], h, s[1], M.stone, angOf(o)); pediment(b, ...at(o, -.32, 0), angOf(o), o.W * .62, 3, hw(56)); roofPrism(b, { ...o, x: s[0], z: s[1], L: o.L * .2, W: o.W * .62 }, 3, hw(56), M.copper);
  for (const t of [-1, 1]) { const g = at(o, .98, t * .82); b.box(1.4, 2.6, 1.4, g[0], h, g[1], M.gold); } // gilt groups on the facade
  b.windows(G.P, 2, M.win, 3.2, 2); } });
add('madeleine', { lab: 'La Madeleine', f: 'S', fn(b, G) { temple(b, G, 30, 8, { peri: 11 }); } });
add('bourse', { lab: 'Palais Brongniart (Bourse)', f: 'W', fn(b, G) { temple(b, G, 22, 14, { peri: 18, back: true }); } });
add('trinite', { lab: 'Église de la Trinité', f: 'S', fn(b, G) { church(b, G, { m: 24, tower1: 63, ttop: 'pyr', wall: M.stone }); } });
add('staugustin', { lab: 'Saint-Augustin', f: 'NW', fn(b, G) { church(b, G, { m: 26, dome: Math.min(8, G.o.W * .35), dx: -.6, wall: M.stone }); } });
add('printemps', { lab: 'Grands Magasins du Printemps', f: 'N', fn(b, G) { const h = std(b, G.P, 22, { roof: M.zinc, step: 2.2 }); for (const t of [-1, 1]) { const q = at(G.o, t * .8, .9); domeOn(b, q[0], q[1], 2.6, h, M.slate, { drum: 1, sy: 1.5, rib: M.gold }); } } });
add('folies', { lab: 'Folies Bergère', f: 'E', fn(b, G) { std(b, G.P, 16, { roof: M.zinc }); } });
add('portestdenis', { lab: 'Porte Saint-Denis', r: 6, fn(b) { gate(b, b.c[0], b.c[1], 0, 9.5, 2.6, 24, {}); } });
add('portestmartin', { lab: 'Porte Saint-Martin', r: 6, fn(b) { gate(b, b.c[0], b.c[1], 0, 7.5, 2.2, 18, { pier: 2.6 }); } });
add('cirquehiver', { lab: "Cirque d'Hiver", f: 'S', fn(b, G) { const o = G.o, R = Math.min(o.L, o.W) / 2, h = hw(18); b.cyl(R, R, h, o.x, 0, o.z, M.stone, 20).cyl(R + .4, R + .4, .4, o.x, h, o.z, M.cornice, 20).cone(R + .2, 4, o.x, h + .4, o.z, M.zinc, 20).sphere(.4, o.x, h + 4.4, o.z, M.gold); b.windows([{ o: [...Array(20)].map((_, k) => [o.x + Math.cos(k * PI / 10) * R, o.z + Math.sin(k * PI / 10) * R]), h: [] }], h * .55, M.win, 2.2); } });
add('republique', { lab: 'Place de la République (Marianne 1883)', pt: 'marianne', r: 5, fn(b) { const [x, z] = b.c; b.cyl(4.6, 5, 1, x, 0, z, M.stone, 24).cyl(2, 2.4, 6, x, 1, z, M.stone, 16).cyl(1.6, 2, .5, x, 7, z, M.cornice, 16).cyl(.55, .7, 3.6, x, 7.5, z, M.bronze, 10).sphere(.5, x, 11.4, z, M.bronze).beam([x + .3, 10.6, z], [x + .5, 12.6, z], .18, M.bronze);
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; statue(b, x + Math.cos(a) * 3.3, z + Math.sin(a) * 3.3, 1, .9, M.bronze); } gasLamps(b, x, z, 7, 8); } });
add('chatelet', { lab: 'Théâtre du Châtelet', f: 'E', fn(b, G) { std(b, G.P, 20, { roof: M.zinc }); } });
add('lyrique', { lab: 'Théâtre des Nations (Opéra-Comique 1887–98)', f: 'W', fn(b, G) { std(b, G.P, 20, { roof: M.zinc }); } });
add('favart', { lab: 'Salle Favart (burnt shell, 1887 fire)', f: 'N', fn(b, G) { const h = hw(18); b.prism(G.P, 0, h, M.soot).cornice(G.P, h, M.soot, .2); b.prism(G.P.map(P => ({ o: P.o, h: [] })), 0, .4, M.yard); for (let k = 0; k < 6; k++) { const q = at(G.o, -.8 + k * .32, (k % 2 ? .4 : -.3)); b.beam([q[0], h, q[1]], [q[0] + 2, .5, q[1] + 1], .3, M.wood); } }, open: true });
add('stjacques', { lab: 'Tour Saint-Jacques & square', d: 'stjacques', r: 4, fn(b, G) { const [x, z] = G ? [G.o.x, G.o.z] : b.c, w = 4.6, h = hw(52); b.box(w, h, w, x, 0, z, M.gothic).box(w + .6, .5, w + .6, x, h, z, M.cornice);
  for (const [s, t] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.box(.7, h + 1.6, .7, x + s * w / 2, 0, z + t * w / 2, M.gothic).cone(.5, 1.5, x + s * w / 2, h + 1.6, z + t * w / 2, M.gothic, 6);
  b.box(w - 1, .3, w - 1, x, h + .3, z, M.lead).cyl(.3, .4, 1.4, x, h + .6, z, M.bronze, 8); // Saint James on the top
  const sq = G0(b, 'stjacquessq'); if (sq) for (const P of sq.P) for (let k = 0; k < 10; k++) { const v = P.o[Math.floor(k * P.o.length / 10)]; b.cyl(.2, .3, 2, v[0] + (x - v[0]) * .2, 0, v[1] + (z - v[1]) * .2, M.wood, 6).sphere(1.6, v[0] + (x - v[0]) * .2, 3.2, v[1] + (z - v[1]) * .2, M.tree); } } });
add('fontstmichel', { lab: 'Fontaine Saint-Michel (1860)', pt: 'fstmichel', r: 5, fn(b) { const fx = .545, fz = -.839, x0 = b.c[0] - fx * 2.4, z0 = b.c[1] - fz * 2.4, // faces NNE onto the place, back against the corner block
    a = Math.atan2(fx, -fz), ca = Math.cos(a), sa = Math.sin(a); // Davioud's wall fountain, a triumphal-arch façade turned to the place and the bridge
  const P = (u, v) => [x0 + ca * u - sa * v, z0 + sa * u + ca * v], H = hw(26), bx = (w, h, d, u, y, v, m) => { const q = P(u, v); b.box(w, h, d, q[0], y, q[1], m, a); }, cy = (r0, r1, h, u, y, v, m, n = 10) => { const q = P(u, v); b.cyl(r0, r1, h, q[0], y, q[1], m, n); }, sp = (r, u, y, v, m) => { const q = P(u, v); b.sphere(r, q[0], y, q[1], m); };
  bx(7.6, H * .86, 1.8, 0, 0, 1.6, M.stone); bx(8, .35, 2.4, 0, H * .62, 1.4, M.cornice); bx(4.4, H * .12, 2, 0, H * .86, 1.6, M.stone); bx(4.8, .3, 2.2, 0, H * .98, 1.6, M.cornice); // body, entablature, crowning attic
  bx(4.8, .15, 1.4, 0, H * .64 + .35, 1.4, M.lead); // roof flats seen from above
  bx(2.6, H * .5, .3, 0, H * .1, .55, M.soot); // the deep central niche
  for (const s of [-3.2, -1.7, 1.7, 3.2]) { bx(.9, 1.8, .9, s, 0, .2, M.stone); cy(.3, .34, H * .62 - 1.8, s, 1.8, .2, M.red, 12); bx(.8, 1.3, .8, s, H * .62 + .35, .2, M.stone); cy(.22, .3, 1.1, s, H * .62 + 1.65, .2, M.stone, 8); sp(.2, s, H * .62 + 2.9, .2, M.stone); } // four red-marble columns carrying the Virtues
  bx(1.6, 1.2, .4, 0, H * .86 + .2, .5, M.bronze); // arms of Paris on the attic
  bx(2.4, 2.2, 1.6, 0, 0, -.3, M.stoneD); cy(.35, .45, 2.1, 0, 2.2, -.3, M.bronze, 8); sp(.32, 0, 4.6, -.3, M.bronze); bx(.2, .2, 2.4, .5, 4.4, -.5, M.bronze); bx(1.6, .2, .6, -.3, 5.1, -.1, M.bronze); bx(1.2, .45, 1.6, 0, 2.2, -1.1, M.bronze); // St Michael with sword and wings, the devil under his foot
  for (const s of [-1, 1]) { sp(.55, s * 2.4, 1.2, -1, M.bronze); bx(.45, .35, 1.6, s * 2.4, .9, -1.6, M.bronze); } // the two water-spitting dragons
  [[3.2, .9, 1.4, -1.6], [5.2, .6, 1.5, -2.9], [7.8, .45, 3, -5]].forEach(([w, h, d, o]) => { bx(w, h, d, 0, 0, o, M.stone); bx(w - .5, .06, d - .5, 0, h - .04, o, M.water); }); // stepped cascade into the street basin
  for (const s of [-1, 1]) { const q = P(s * 5, -5); b.cyl(.1, .16, 3.4, q[0], 0, q[1], M.iron, 6).box(.42, .5, .42, q[0], 3.4, q[1], M.gas); } } });
add('innocents', { lab: 'Fontaine des Innocents (Goujon 1549, square since 1858)', pt: 'finnocents', r: 7, fn(b) { const [x, z] = b.c, w = 7, h = hw(15);
  b.box(15, .5, 15, x, 0, z, M.stone).box(13, .9, 13, x, .5, z, M.stone).box(12, .06, 12, x, 1.38, z, M.water); // stepped basin, water cascading on four sides
  for (const [s, t] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.box(1.4, h, 1.4, x + s * (w / 2 - .7), 1.4, z + t * (w / 2 - .7), M.marble);
  for (const a of [0, PI / 2, PI, -PI / 2]) { const ux = Math.cos(a), uz = Math.sin(a); b.box(w * .5, 1.2, .5, x + ux * (w / 2 - .25), 1.4 + h - 1.2, z + uz * (w / 2 - .25), M.marble, a); pediment(b, x + ux * (w / 2 + .1), z + uz * (w / 2 + .1), a, w, 1.6, 1.4 + h); }
  b.box(w + .6, .5, w + .6, x, 1.4 + h, z, M.cornice).cone(w * .72, 3.2, x, 1.9 + h, z, M.lead, 4, PI / 4);
  for (const [s, t] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 0; k < 6; k++) b.cyl(.18, .26, 2, x + s * 11 + t * (k - 2.5) * 3.6, 0, z + t * 11 + s * (k - 2.5) * 3.6, M.wood, 6).sphere(1.5, x + s * 11 + t * (k - 2.5) * 3.6, 3.1, z + t * 11 + s * (k - 2.5) * 3.6, M.tree); } });
// --- Seine bridges as they stood in 1890 (no Pont Alexandre III — begun 1896; no Passerelle Debilly — 1900; no Pont Mirabeau — 1896) ---
// Each model hugs the game's own walkable K.BRIDGE deck (found by flood fill from the real position), so geometry and collisions agree.
let BCL = null; const BUSED = new Set();
function clusters() { if (BCL) return BCL; BCL = []; // every bridge deck the game actually draws and walks: vec.js roads flagged br, chained end to end
  const R = VROADS.filter(r => r.br && r.p.length >= 4), grp = R.map((_, i) => i), f = i => grp[i] === i ? i : (grp[i] = f(grp[i])), ends = r => [[r.p[0], r.p[1]], [r.p[r.p.length - 2], r.p[r.p.length - 1]]];
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) if (ends(R[i]).some(a => ends(R[j]).some(b => Math.hypot(a[0] - b[0], a[1] - b[1]) < 3))) grp[f(i)] = f(j);
  const G = new Map(); R.forEach((r, i) => (G.get(f(i)) || G.set(f(i), []).get(f(i))).push(r));
  let C = [...G.values()].map(rs => { const P = []; let W = 0; for (const r of rs) { W = Math.max(W, r.pw); for (let k = 0; k < r.p.length; k += 2) P.push([r.p[k], r.p[k + 1]]); } return { P, W }; });
  const mk = c => { const o = obb(c.P); if (o.W > o.L) { [o.ux, o.uz] = [-o.uz, o.ux]; [o.L, o.W] = [o.W, o.L]; } o.W += c.W; o.walk = true; o.P = c.P; o.pw = c.W; return o; };
  for (let again = true; again;) { again = false; const O = C.map(mk); // twin carriageways of one bridge (drawn as parallel roads) become a single deck
    outer: for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) { const a = O[i], b = O[j]; if (Math.abs(a.ux * b.ux + a.uz * b.uz) > .96 && Math.hypot(a.x - b.x, a.z - b.z) < (a.W + b.W) * .6 + 4) { C[i] = { P: C[i].P.concat(C[j].P), W: Math.max(C[i].W, C[j].W) }; C.splice(j, 1); again = true; break outer; } } }
  for (const c of C) { const o = mk(c); if (o.L >= 8) BCL.push(o); }
  return BCL; }
let BASG = null; function assign() { if (BASG) return BASG; BASG = new Map(); const pairs = []; for (const k in BR) { const c = ll(BR[k][1], BR[k][2]); for (const o of clusters()) { const d = Math.hypot(o.x - c[0], o.z - c[1]); if (d < 45) pairs.push([d, k, o]); } }
  pairs.sort((p, q) => p[0] - q[0]); for (const [, k, o] of pairs) if (!BASG.has(k) && !BUSED.has(o)) { BASG.set(k, o); BUSED.add(o); } return BASG; }
function deckOf(c, foot, k) { const best = k && assign().get(k); if (best) return best;
  // no walkable deck in the game map here (footbridges, Carrousel, Iéna): a visual span across the river, perpendicular to the local Seine
  const wp = []; const ci = Math.floor(c[0] / T), cj = Math.floor(c[1] / T); for (let dj = -25; dj <= 25; dj++) for (let di = -25; di <= 25; di++) if (inb(ci + di, cj + dj) && kind[ti(ci + di, cj + dj)] === K.WATER) wp.push([(ci + di + .5) * T, (cj + dj + .5) * T]);
  if (wp.length < 20) return null; if (kind[ti(ci, cj)] !== K.WATER) { let bd = 1e9, w0 = null; for (const w of wp) { const d = Math.hypot(w[0] - c[0], w[1] - c[1]); if (d < bd) { bd = d; w0 = w; } } c = w0; } const r = obb(wp), ux = -r.uz, uz = r.ux; let s0 = 0, s1 = 0; const wet = s => { const x = c[0] + ux * s, z = c[1] + uz * s; return inb(Math.floor(x / T), Math.floor(z / T)) && kind[ti(Math.floor(x / T), Math.floor(z / T))] === K.WATER; };
  if (!wet(0)) return null; while (s1 < 200 && wet(s1 + 1)) s1++; while (s0 > -200 && wet(s0 - 1)) s0--; const L = s1 - s0 + 4, m = (s0 + s1) / 2;
  return { x: c[0] + ux * m, z: c[1] + uz * m, ux, uz, L, W: foot ? 4.4 : 8, walk: false }; }
function waterSpan(o) { // trim a deck to the part over the river so it runs square onto the quays
  const wet = (s, t) => { const q = at(o, s, t), i = Math.floor(q[0] / T), j = Math.floor(q[1] / T); if (!inb(i, j)) return false; const k = kind[ti(i, j)]; return k === K.WATER || k === K.BRIDGE; };
  let s0 = null, s1 = null; for (let s = -1; s <= 1.0001; s += .02) if (wet(s, 0) || wet(s, -.6) || wet(s, .6)) { if (s0 === null) s0 = s; s1 = s; }
  if (s0 === null || s1 - s0 < .2) return o; s0 = Math.max(-1, s0 - .04); s1 = Math.min(1, s1 + .04); const m = at(o, (s0 + s1) / 2, 0); let W = o.W, x = m[0], z = m[1];
  if (o.P && o.P.length > 1) { let lo = 1e9, hi = -1e9; for (let i = 0; i < o.P.length; i++) { const p = o.P[i], u = ((p[0] - o.x) * o.ux + (p[1] - o.z) * o.uz) / (o.L / 2); if (u < s0 - .02 || u > s1 + .02) continue; const v = -(p[0] - o.x) * o.uz + (p[1] - o.z) * o.ux; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (hi >= lo) { W = hi - lo + o.pw + .7; const vm = (hi + lo) / 2, cv = -(m[0] - o.x) * o.uz + (m[1] - o.z) * o.ux; x += -o.uz * (vm - cv); z += o.ux * (vm - cv); } } // width of the painted deck itself (pavements + dark kerb edge), centred on it
  return { ...o, x, z, W, L: o.L * (s1 - s0) / 2 }; }
function bridge(b, c, kind_, n, o2 = {}, key) { const o0 = deckOf(c, kind_ === 'foot', key); if (!o0) return; const o = waterSpan(o0), a = angOf(o), L = o.L, W = o.W, iron = kind_ === 'iron', foot = kind_ === 'foot';
  const par = iron || foot ? M.iron : M.stone, ph = iron || foot ? .75 : 1.0, pw = iron || foot ? .14 : .45, sw = foot ? 0 : Math.min(1.6, W * .14);
  // one solid deck: slab, roadway, raised pavements and parapets share the same edges (no water showing between)
  b.box(L, .55, W + .3, ...at3(o, 0, 0, -.58), foot ? M.iron : M.stone, a); if (!o.walk) { if (foot) b.box(L, .05, W, ...at3(o, 0, 0, 0), M.wood, a); else { const rw = W * .62, pw = (W - rw) / 2; b.box(L, .06, W, ...at3(o, 0, 0, 0), M.kerb(), a); b.box(L, .08, rw, ...at3(o, 0, 0, .02), M.cobble(), a); for (const t of [-1, 1]) b.box(L, .1, pw - .35, ...at3(o, 0, t * (rw / 2 + pw / 2 + .05) / (W / 2), .02), M.flagM(), a); } } // fallback decks get the same cobbled roadway, dark kerbs and flagged pavements the painted decks have // slab top sits just under the painted roadway, filling any gap to the parapets
  for (const t of [-1, 1]) { b.box(L, ph, pw, ...at3(o, 0, t * (1 - pw / W), 0), par, a); if (!iron && !foot) b.box(L + .2, .14, pw + .16, ...at3(o, 0, t * (1 - pw / W), ph), M.cornice, a); }
  const nar = n || Math.max(2, Math.round(L / 22)), sl = L / nar, pd = foot ? .8 : Math.min(3, sl * .16), nose = foot ? .7 : pd * 1.5, ox = W / 2 + .15;
  // spandrel faces and the arch rings of every span (voussoirs stepping down from crown to springing)
  for (const t of [-1, 1]) { b.box(L, .7, .3, ...at3(o, 0, t * (ox / (W / 2)), -1.2), iron || foot ? M.iron : M.stoneD, a);
    for (let k = 0; k < nar; k++) { const s0 = -1 + 2 * k / nar; for (let r = 1; r < 10; r++) { const u = s0 + 2 / nar * r / 10, h = Math.sin(PI * r / 10); b.box(sl / 10 + .05, .22, .35, ...at3(o, u, t * ((ox + .05) / (W / 2)), -1.6 + h * 1.0), iron || foot ? M.iron : M.cornice, a); } } }
  // piers with pointed cutwaters (avant-becs) upstream and downstream, capped by a stone hood
  for (let k = 1; k < nar; k++) { const s = -1 + 2 * k / nar, mat = foot ? M.iron : M.stoneD; b.box(pd, 2.8, W + .6, ...at3(o, s, 0, -3.3), mat, a);
    for (const t of [-1, 1]) { const A = at(o, s - pd / L, t * (ox + .15) / (W / 2)), B2 = at(o, s + pd / L, t * (ox + .15) / (W / 2)), C2 = at(o, s, t * (ox + .15 + nose) / (W / 2)); b.prism([{ o: [A, B2, C2], h: [] }], -3.3, 3.0, mat);
      const A2 = at(o, s - pd * .8 / L, t * (ox + .15) / (W / 2)), B3 = at(o, s + pd * .8 / L, t * (ox + .15) / (W / 2)), C3 = at(o, s, t * (ox + .15 + nose * .8) / (W / 2)); b.prism([{ o: [A2, B3, C3], h: [] }], -.3, .35, foot ? M.iron : M.stone);
      if (!foot && !iron) b.cyl(pd * .45, pd * .45, ph + .2, ...at3(o, s, t * (1 + .2 / W), 0), M.stone, 12); } } // refuge bays over the piers
  if (iron) for (let k = 0; k < nar; k++) { const s0 = -1 + 2 * k / nar, s1 = s0 + 2 / nar; for (const t of [-1, 1]) for (let r = 1; r < 8; r++) { const u = s0 + (s1 - s0) * r / 8, h = Math.sin(PI * r / 8) * .55; b.box(.12, .1, .16, ...at3(o, u, t * (1 + .3 / W), -h - .2), M.iron, a); } }
  if (o2.lamps !== false) for (let k = 0; k <= nar; k += (nar > 4 ? 2 : 1)) for (const t of [-1, 1]) { const q = at(o, -1 + 2 * k / nar, t * (1 - pw / W)); b.cyl(.09, .14, 3.2, q[0], ph, q[1], M.iron, 6).box(.36, .4, .36, q[0], ph + 3.2, q[1], M.gas); }
  if (o2.extra) o2.extra(b, o, a); }
const BR = { // key: [label, lat, lon, construction, arches]
  pontneufb: ['Pont Neuf (1607), grand bras', 48.85790, 2.34190, 'stone', 7], pontneufs: ['Pont Neuf (1607), petit bras', 48.85630, 2.34070, 'stone', 5], pontcarrousel: ['Pont du Carrousel (Polonceau, cast iron, 1834)', 48.85955, 2.33300, 'iron', 3],
  pontroyal: ['Pont Royal (1689)', 48.86030, 2.32960, 'stone', 5], pontsolferino: ['Pont de Solférino (cast iron road bridge, 1861)', 48.86130, 2.32440, 'iron', 3],
  pontconcorde: ['Pont de la Concorde (Perronet, 1791)', 48.86370, 2.31960, 'stone', 5], pontinvalides: ['Pont des Invalides (1855)', 48.86360, 2.31040, 'stone', 4],
  pontalma: ["Pont de l'Alma (1856, with the Zouave)", 48.86350, 2.30160, 'stone', 3], pontiena: ["Pont d'Iéna (1814)", 48.85990, 2.29300, 'stone', 5],
  pontchange: ['Pont au Change (1860)', 48.85650, 2.34680, 'stone', 3], pontnd: ['Pont Notre-Dame (stone, 1853)', 48.85600, 2.34960, 'stone', 3],
  pontarcole: ["Pont d'Arcole (iron single span, 1855)", 48.85520, 2.35090, 'iron', 1], pontstmichel: ['Pont Saint-Michel (1857)', 48.85360, 2.34410, 'stone', 3],
  petitpont: ['Petit-Pont (1853)', 48.85265, 2.34720, 'stone', 1], pontdouble: ['Pont au Double (cast iron, 1883)', 48.85230, 2.34880, 'iron', 1],
  pontlp: ['Pont Louis-Philippe (1862)', 48.85470, 2.35460, 'stone', 3], pontstlouis: ['Pont Saint-Louis (iron, 1870)', 48.85300, 2.35300, 'iron', 1],
  pontmarie: ['Pont Marie (1635)', 48.85230, 2.35770, 'stone', 5], ponttournelle: ['Pont de la Tournelle (1656)', 48.85100, 2.35450, 'stone', 6],
  pontsully: ['Pont Sully (iron, 1876)', 48.84980, 2.35950, 'iron', 3], pontausterlitz: ["Pont d'Austerlitz (stone, 1854)", 48.84430, 2.36580, 'stone', 5],
  pontbercy: ['Pont de Bercy (1864)', 48.83840, 2.37470, 'stone', 5], pontpassy: ['Passerelle de Passy (iron footbridge, 1878)', 48.85560, 2.28760, 'foot', 4] };
const ZOUAVE = (b, o, a) => { for (const s of [-.33, .33]) { const q = at(o, s, 1 + 2.4 / o.W); b.cyl(.35, .45, 1.6, q[0], -1.6, q[1], M.stone, 8).cyl(.25, .3, 1.5, q[0], 0, q[1], M.stoneD, 8).sphere(.3, q[0], 1.7, q[1], M.stoneD); } };
for (const k in BR) { const [lab, la, lo, ty, n] = BR[k], c = ll(la, lo); D.pt['br_' + k] = c; add(k, { lab, pt: 'br_' + k, label: true, fn(b) { bridge(b, c, ty, n, k === 'pontalma' ? { extra: ZOUAVE } : {}, k); } }); }
// --- Left bank ---
add('pantheon', { lab: 'Panthéon', f: 'W', fn(b, G) { const o = G.o, h = std(b, G.P, 26, { roof: M.lead, rh: 1.5, win: false }); const q = at(o, -.05, 0); domeOn(b, q[0], q[1], Math.min(9, o.W * .3), h, M.lead, { drum: 6, rib: M.lead, sy: 1.15 });
  const p = at(o, 1.04, 0); b.box(5, h, o.W * .5, p[0], 0, p[1], M.stone, angOf(o)); pediment(b, ...at(o, 1.14, 0), angOf(o), o.W * .5, 3.4, h); cols(b, at(o, 1.16, -.24), at(o, 1.16, .24), 6, h - .3, .6); } });
add('sorbonne', { lab: 'Sorbonne (rebuilding 1885–1901)', f: 'W', fn(b, G) { const o = G.o, a = angOf(o);
  // chapel (1642) stands; the new Sorbonne of Nénot rises around it — the northern half is still a building site in 1890
  const Pn = [], Ps = []; for (const P of G.P) { const c = P.o.reduce((s, v) => [s[0] + v[0] / P.o.length, s[1] + v[1] / P.o.length], [0, 0]); ((c[0] - o.x) * -o.uz + (c[1] - o.z) * o.ux < 0 ? Pn : Ps).push(P); }
  std(b, Ps.length ? Ps : G.P, 20); for (const P of Pn) { b.prism([P], 0, hw(10), M.stone); scaffold(b, P.o, 0, hw(16)); } const n = at(o, 0, -.5); crane(b, n[0], n[1], 18, a + 1);
  const c = at(o, .3, .1); b.box(14, hw(24), 8, c[0], 0, c[1], M.stone, a); domeOn(b, ...at(o, .3, .1), 3.6, hw(24), M.lead, { drum: 2.5, rib: M.lead }); } });
add('luxembourg', { lab: 'Palais du Luxembourg (Sénat)', f: 'N', fn(b, G) { const h = std(b, G.P, 22, { rh: 3 }); const q = at(G.o, 1, 0); domeOn(b, q[0], q[1], 3.4, h, M.slate, { drum: 2, rib: M.gold, sy: 1.4 }); } });
add('museelux', { lab: 'Musée du Luxembourg (Orangerie)', f: 'N', fn(b, G) { std(b, G.P, 12); } });
add('odeon', { lab: "Théâtre de l'Odéon", f: 'N', fn(b, G) { const h = std(b, G.P, 20, { rh: 2 }); cols(b, at(G.o, 1.06, -.4), at(G.o, 1.06, .4), 8, h * .55, .5); } });
add('stsulpice', { lab: 'Saint-Sulpice (south tower unfinished)', f: 'W', fn(b, G) { const o = G.o, a = angOf(o), h = church(b, G, { m: 33, wall: M.stone, roofMat: M.slate, rose: false });
  const n = at(o, .86, -.6), s = at(o, .86, .6), w = Math.min(8, o.W * .3); tower(b, n[0], n[1], w, 73, 'flat', M.stone, a); b.cyl(w * .4, w * .45, 4, n[0], hw(73), n[1], M.stone, 12); tower(b, s[0], s[1], w, 68, 'flat', M.stoneD, a); // the south tower was never finished
  cols(b, at(o, 1.04, -.4), at(o, 1.04, .4), 6, h * .5, .5); } });
add('stgermain', { lab: 'Saint-Germain-des-Prés', f: 'W', fn(b, G) { church(b, G, { m: 18, tower1: 50, ttop: 'spire', rose: false }); } });
add('stetienne', { lab: 'Saint-Étienne-du-Mont', f: 'W', fn(b, G) { church(b, G, { m: 24, tower1: 50, ttop: 'pyr', tw: 3.4 }); } });
add('valdegrace', { lab: 'Val-de-Grâce', f: 'N', fn(b, G) { const o = G.o, h = std(b, G.P, 18, { rh: 2.4 }); const q = at(o, .55, 0); domeOn(b, q[0], q[1], 5.2, h, M.lead, { drum: 4, rib: M.gold, sy: 1.25 }); } });
add('cluny', { lab: 'Hôtel de Cluny (Musée de Cluny)', f: 'S', fn(b, G) { std(b, G.P, 15, { wall: M.gothic, rh: 4, rk: .6 }); const q = at(G.o, .9, .7); b.cyl(1.2, 1.2, hw(20), q[0], 0, q[1], M.gothic, 8).cone(1.5, 2.4, q[0], hw(20), q[1], M.slate, 8); } });
add('institut', { lab: 'Institut de France', f: 'N', fn(b, G) { const o = G.o, h = std(b, G.P, 18); const q = at(o, .7, 0); domeOn(b, q[0], q[1], 4, h, M.lead, { drum: 3.4, rib: M.gold, sy: 1.3 }); }, d: 'institut' });
add('monnaie', { lab: 'Hôtel de la Monnaie', f: 'N', fn(b, G) { std(b, G.P, 20); } });
add('beauxarts', { lab: 'École des Beaux-Arts', f: 'N', fn(b, G) { std(b, G.P, 18); } });
add('bourbon', { lab: 'Palais Bourbon (Chambre des députés)', f: 'N', fn(b, G) { const h = std(b, G.P, 20); cols(b, at(G.o, 1.04, -.35), at(G.o, 1.04, .35), 12, h * .95, .55); pediment(b, ...at(G.o, 1.06, 0), angOf(G.o), G.o.W * .75, 3.2, h); } });
add('invalides', { lab: 'Hôtel des Invalides', f: 'N', fn(b, G) { std(b, G.P, 18, { rh: 3 }); } });
add('domeinv', { lab: 'Dôme des Invalides', f: 'S', fn(b, G) { const o = G.o, h = std(b, G.P, 26, { roof: M.lead, rh: 1.2 }); domeOn(b, o.x, o.z, Math.min(7.5, o.W * .34), h, M.gold, { drum: 6, rib: M.gold, lant: M.gold, sy: 1.35 }); } });
add('ecolemil', { lab: 'École Militaire', f: 'NW', fn(b, G) { const h = std(b, G.P, 18); const q = at(G.o, 1, 0); b.box(10, 3, 10, q[0], h, q[1], M.slate, angOf(G.o)).dome(4.5, q[0], h + 3, q[1], M.slate, .6, 4); } });
add('stgermainaux', { lab: "Saint-Germain-l'Auxerrois", f: 'W', fn(b, G) { church(b, G, { m: 20, tower1: 38, ttop: 'spire', tw: 3 }); } });
add('steustache', { lab: 'Saint-Eustache', f: 'W', fn(b, G) { church(b, G, { m: 33, towers: 46, tw: 4, fleche: 40, fx: -.2, wall: M.gothic }); } });
add('hoteldeville', { lab: 'Hôtel de Ville (rebuilt 1873–82)', f: 'W', fn(b, G) { const o = G.o, h = std(b, G.P, 24, { rh: 4, rk: .55 }); for (const [s, t] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const q = at(o, s * .92, t * .92); b.box(9, hw(28), 9, q[0], 0, q[1], M.stone, angOf(o)).cone(7, 5.5, q[0], hw(28), q[1], M.slate, 4, angOf(o) + PI / 4); }
  const c = at(o, 1, 0); b.box(5, hw(50), 5, c[0], 0, c[1], M.stone, angOf(o)).cone(4, 5, c[0], hw(50), c[1], M.slate, 4, angOf(o) + PI / 4); b.put(new THREE.CircleGeometry(1.2, 16), M.chateau, c[0] + o.ux * 2.6, hw(40), c[1] + o.uz * 2.6, angOf(o) - PI / 2); } });
add('bnf', { lab: 'Bibliothèque nationale', f: 'E', fn(b, G) { std(b, G.P, 18); } });
add('bourse_commerce', { lab: 'Halle au blé (rebuilt as Bourse de commerce 1888–89)', f: 'E', fn(b, G) { const o = G.o, R = Math.min(o.L, o.W) / 2 - .5, h = hw(18); b.prism(G.P, 0, h, M.stone).cornice(G.P, h, M.cornice); b.cyl(R * .62, R * .62, 2, o.x, h, o.z, M.stone, 28).dome(R * .62, o.x, h + 2, o.z, M.hglass, .55, 28); b.windows(G.P, 2, M.win, 2.6); } });
add('halles', { lab: 'Les Halles (Baltard pavilions)', pt: 'halles', walk: true, fn(b) { const a = .2, ca = Math.cos(a), sa = Math.sin(a), [x, z] = b.c; // 10 pavilions in two groups across rue Baltard (the last two came in 1936)
  for (const [u, v] of [[-38, -11], [-19, -11], [0, -11], [19, -11], [38, -11], [-38, 11], [-19, 11], [0, 11], [19, 11], [38, 11]]) baltard(b, x + u * ca - v * sa, z + u * sa + v * ca, 15, 15, a);
  for (const s of [-1, 1]) b.put(new THREE.CylinderGeometry(3.2, 3.2, 80, 12, 1, true, 0, PI), M.hglass, x - s * 0, 6.2, z, a, 1, .6, 1, 0, PI / 2); }, r: 46 });
// --- stations ---
add('garenord', { lab: 'Gare du Nord (1865)', f: 'S', fn(b, G) { station(b, G, { m: 26, sheds: 1, fd: .1, statues: true }); } });
add('gareest', { lab: "Gare de l'Est (1849 hall)", pt: 'gareest', r: 30, fn(b) { const a = -PI / 2, G = { P: [], o: { x: b.c[0], z: b.c[1] - 22, ux: 0, uz: 1, L: 70, W: 30 } }; G.o.x = b.c[0]; G.o.z = b.c[1] - 22; station(b, G, { m: 22, fd: .14 });
  const q = at(G.o, 1, 0); b.put(new THREE.CircleGeometry(6, 24, 0, PI), M.hglass, q[0], hw(14), q[1] + .3, a + PI); void a; } });
add('gare', { lab: 'Gare Saint-Lazare (1889 front)', f: 'S', fn(b, G) { station(b, G, { m: 22, sheds: 3, fd: .1 }); } });
add('garelyon', { lab: 'Gare de Lyon (old 1855 station)', f: 'W', fn(b, G) { station(b, G, { m: 16, sheds: 1, fd: .12, clock: false }); } });
add('gareaust', { lab: "Gare d'Orléans (Austerlitz, 1867 hall)", f: 'W', fn(b, G) { station(b, G, { m: 20, sheds: 1, fd: .1 }); } });
// --- Montmartre ---
add('sacrecoeur', { lab: 'Sacré-Cœur (under construction, 1875–1919)', f: 'S', fn(b, G) { const o = G.o, a = angOf(o); // walls up to the drums; no dome until 1899+, no campanile until 1912
  for (const P of G.P) { b.prism([P], 0, hw(18), M.chateau).prism([{ o: P.o, h: [] }], 0, .3, M.yard); scaffold(b, P.o, 0, hw(22), 2.8); }
  const c = at(o, .05, 0); b.cyl(6.5, 6.5, hw(26), c[0], 0, c[1], M.chateau, 20); scaffold(b, [...Array(10)].map((_, k) => [c[0] + Math.cos(k * PI / 5) * 6.6, c[1] + Math.sin(k * PI / 5) * 6.6]), 0, hw(30), 2.6);
  for (const s of [-1, 1]) { const q = at(o, .62, s * .5); b.cyl(2.2, 2.2, hw(14), q[0], 0, q[1], M.chateau, 12); }
  crane(b, ...at(o, .4, 1.1), 22, a + PI); crane(b, ...at(o, -.6, -1.1), 20, a + .4); crane(b, ...at(o, -.3, .9), 18, a - 2);
  // site yard: stone blocks, sheds, carts
  for (let k = 0; k < 18; k++) { const q = at(o, -1.15 + (k % 6) * .1, -1.2 + Math.floor(k / 6) * .25); b.box(2, .9 + (k % 3) * .3, 1.2, q[0], 0, q[1], M.chateau, a + k * .3); }
  for (let k = 0; k < 3; k++) { const q = at(o, 1.25, -.6 + k * .6); b.box(6, 3, 3.5, q[0], 0, q[1], M.wood, a).put(roofG(6.4, 4, 1.2), M.zinc, q[0], 3, q[1], a); } } });
add('galette', { lab: 'Moulin de la Galette', pt: 'galettemill', r: 3, fn(b, G, H) { mill(b, H, b.c[0], b.c[1], 0, M.wood, M.wood, M.sail, -.6); }, sol: 2.2 });
add('moulinrouge89', { lab: 'Moulin Rouge (opened Oct 1889)', pt: 'moulinrouge', r: 4, fn(b, G, H) { const [x, z] = b.c; b.box(10, hw(10), 7, x, 0, z + 4, M.stoneD).box(10.6, .3, 7.6, x, hw(10), z + 4, M.cornice); mill(b, H, x, z, hw(4), M.redl, M.redl, M.redl, -PI / 2); b.box(9, .6, .3, x, hw(8), z + .4, M.redl); }, sol: 2.2 });
add('elyseemont', { lab: 'Élysée-Montmartre', relabel: 'moulinrouge' });
// --- Concorde / Champs / Seine west ---
add('concorde', { lab: 'Place de la Concorde', d: 'concordepl', label: true, clear: 'concordepl', fn(b) { const o = PT.obelisk; b.box(2.6, 3, 2.6, o[0], 0, o[1], M.stoneD).put(new THREE.CylinderGeometry(.8, 1.15, 17, 4), M.marble, o[0], 3 + 8.5, o[1], PI / 4).cone(.8, 1.4, o[0], 20, o[1], M.marble, 4, PI / 4);
  for (const k of ['fmers', 'ffleuves']) { const f = PT[k]; fountain(b, f[0], f[1], 6.6); } for (const f of [PT.fmers, PT.ffleuves]) gasLamps(b, f[0], f[1], 8.5, 8, PI / 8);
  for (let k = 0; k < 8; k++) { const a = k * PI / 4 + PI / 8, x = o[0] + Math.cos(a) * 34, z = o[1] + Math.sin(a) * 26; b.box(3, 2.4, 3, x, 0, z, M.stone).box(2.4, 1.4, 2.4, x, 2.4, z, M.stone); } }, solid: [['obelisk', 1.9], ['fmers', 6.8], ['ffleuves', 6.8]], cen: 'obelisk' });
add('arc', { lab: "Arc de Triomphe de l'Étoile", r: 14, fn(b) { const c = LM.champs, [x, z] = b.c, a = Math.atan2(c[2] - z, c[1] - x) + PI / 2, ca = Math.cos(a), sa = Math.sin(a);
  const P = (u, v) => [x + ca * u - sa * v, z + sa * u + ca * v], W = 18, D = 8.8, H = hw(50), mw = 5.8, tw = 3.4, pw = (W - mw) / 2, pd = (D - tw) / 2; // 45 x 22 m, main arch 14.6 m, side arches 8.4 m
  const bx = (w, h, d, u, y, v, m = M.stone) => b.box(w, h, d, ...[P(u, v)].map(q => [q[0], y, q[1]])[0], m, a);
  for (const su of [-1, 1]) { const u = su * (W - pw) / 2; for (const sv of [-1, 1]) bx(pw, H * .62, pd, u, 0, sv * (D - pd) / 2); // four piers
    bx(pw, H * .62 - H * .4, tw, u, H * .4, 0); // over the transverse arches
    for (let k = 1; k <= 4; k++) { const t = k / 5, e = tw / 2 * (1 - Math.sqrt(1 - t * t)); for (const sv of [-1, 1]) bx(pw, H * .4 - H * .4 * Math.sqrt(1 - t * t) * .18 - H * .3, .35, u, H * .3 + H * .1 * (1 - Math.sqrt(1 - t * t)), sv * (tw / 2 - e - .17)); } // transverse vault haunches
    for (const sv of [-1, 1]) bx(pw * .55, H * .28, .5, u, H * .04, sv * (D / 2 + .2), M.stoneD); } // the sculpted groups (Départ, Triomphe, Résistance, Paix) on the pier faces
  for (let k = 0; k < 6; k++) { const t = (k + .5) / 6, du = mw / 2 * Math.sqrt(1 - t * t); for (const s of [-1, 1]) bx(mw / 2 - du, H * .05, D, s * (mw / 2 - (mw / 2 - du) / 2), H * .38 + H * .2 * t - .01, 0); } // the main barrel vault, stepped
  bx(mw, H * .04, D, 0, H * .58, 0); // crown of the arch
  bx(W, H * .1, D, 0, H * .62, 0); bx(W + .6, .4, D + .6, 0, H * .72, 0, M.cornice); // frieze & cornice
  bx(W - .2, H * .2, D - .2, 0, H * .72 + .4, 0); bx(W + .1, .3, D + .1, 0, H * .92 + .4, 0, M.cornice); // attic with its band of shields
  for (let k = 0; k < 15; k++) { const u = -W / 2 + .6 + k * (W - 1.2) / 14; for (const s of [-1, 1]) bx(.5, .6, .12, u, H * .8, s * (D / 2 - .02), M.stoneD); }
  for (let k = 0; k < 6; k++) { const v = -D / 2 + .6 + k * (D - 1.2) / 5; for (const s of [-1, 1]) bx(.12, .6, .5, s * (W / 2 - .02), H * .8, v, M.stoneD); }
  const top = H * .92 + .7; bx(W - 1.4, .08, D - 1.4, 0, top - .05, 0, M.paving); for (const s of [-1, 1]) { bx(mw + .6, .14, D - 1.6, s * 0, top, 0, M.stoneD); bx(W - 1.6, .14, tw + .4, 0, top, 0, M.stoneD); } for (const su of [-1, 1]) for (const sv of [-1, 1]) bx(pw - 1.8, .2, pd - 1, su * (W - pw) / 2, top, sv * (D - pd) / 2, M.zinc); // vault-crown flags over the arches, zinc skylights over the four piers // flat stone-flagged roof terrace seen from above
  for (const s of [-1, 1]) { bx(W, .6, .3, 0, top, s * (D / 2 - .15)); bx(.3, .6, D, s * (W / 2 - .15), top, 0); } // parapet round the terrace
  bx(2.4, 1.1, 1.6, W / 2 - 2.6, top, 0, M.stone); bx(2.6, .15, 1.8, W / 2 - 2.6, top + 1.1, 0, M.cornice); // stair-head kiosk of the visitors' stair
  // Place de l'Étoile: chained bollard ring round the monument, candelabra ring, lamp pairs at the mouth of each of the 12 avenues
  for (let k = 0; k < 32; k++) { const t = k * 2 * PI / 32; b.cyl(.14, .18, .9, x + Math.cos(t) * 13, 0, z + Math.sin(t) * 13, M.stoneD, 6); }
  for (let k = 0; k < 32; k++) { const t0 = k * 2 * PI / 32, t1 = (k + 1) * 2 * PI / 32, m = (t0 + t1) / 2, L = 13 * (t1 - t0); b.box(L, .05, .05, x + Math.cos(m) * 13, .7, z + Math.sin(m) * 13, M.iron, m + PI / 2); }
  gasLamps(b, x, z, 18, 16, PI / 16);
  for (const t of avenues(x, z)) for (const s of [-1, 1]) { const q = [x + Math.cos(t) * 71 - Math.sin(t) * s * 8, z + Math.sin(t) * 71 + Math.cos(t) * s * 7]; b.cyl(.12, .2, 3.8, q[0], 0, q[1], M.iron, 6).box(.5, .55, .5, q[0], 3.8, q[1], M.gas).cone(.4, .35, q[0], 4.35, q[1], M.iron, 4, PI / 4); } }, sol: 6 });
// bearings of the avenues leaving a rond-point, from the vector road ends near its centre (Étoile has 12)
function avenues(x, z, rIn = 40, rOut = 75) { const B = []; for (const r of VROADS) { if (r.br || r.w < 4) continue; const p = r.p; for (let i = 0; i + 3 < p.length; i += 2) { const d0 = Math.hypot(p[i] - x, p[i + 1] - z), d1 = Math.hypot(p[i + 2] - x, p[i + 3] - z); if (Math.min(d0, d1) < rIn && Math.max(d0, d1) > rIn && Math.max(d0, d1) < rOut + 60) { const q = d0 > d1 ? i : i + 2; B.push(Math.atan2(p[q + 1] - z, p[q] - x)); } } }
  B.sort((a, b) => a - b); const C = []; for (const t of B) { const l = C[C.length - 1]; if (l && Math.abs(t - l.t / l.n) < .14) { l.t += t; l.n++; } else C.push({ t, n: 1 }); } if (C.length > 1 && Math.abs(C[0].t / C[0].n + 2 * PI - C[C.length - 1].t / C[C.length - 1].n) < .14) C.shift(); return C.map(c => c.t / c.n).slice(0, 12); }
add('vendome', { lab: 'Place Vendôme & Column', pt: 'vendomecol', r: 2.2, fn(b) { const [x, z] = b.c; b.box(3.2, 2.4, 3.2, x, 0, z, M.bronze).cyl(1.15, 1.25, hw(44) - 3, x, 2.4, z, M.bronze, 14).box(1.8, .8, 1.8, x, hw(44) - .6, z, M.bronze).cyl(.3, .4, 2, x, hw(44) + .2, z, M.bronze, 8);
  for (let k = 0; k < 7; k++) b.put(new THREE.TorusGeometry(1.24, .08, 4, 16), M.bronze, x, 3 + k * (hw(44) - 6) / 7, z, 0, 1, 1, 1, PI / 2); gasLamps(b, x, z, 6, 4, PI / 4); }, sol: 2.2 });
add('bastille', { lab: 'Colonne de Juillet (Bastille)', d: 'juillet', r: 4.8, fn(b) { const [x, z] = b.c; b.cyl(4.6, 4.8, 1.4, x, 0, z, M.stone, 24).box(5, 3, 5, x, 1.4, z, M.marble).cyl(1, 1.1, hw(51) - 6, x, 4.4, z, M.bronze, 14).cyl(1.5, 1.5, .6, x, hw(51) - 1.6, z, M.bronze, 12).sphere(.8, x, hw(51) - .2, z, M.gold).cyl(.15, .2, 2.4, x, hw(51) + .4, z, M.gold, 6); gasLamps(b, x, z, 7, 8); }, sol: 4.8 });
add('vosges', { lab: 'Place des Vosges (Place Royale)', pt: 'louis13', label: true, fn(b) { const [x, z] = b.c, w = 56; for (const [u, v, L, W] of [[0, -w / 2 - 6, w + 24, 10], [0, w / 2 + 6, w + 24, 10], [-w / 2 - 6, 0, 10, w], [w / 2 + 6, 0, 10, w]]) { b.box(L, hw(18), W, x + u, 0, z + v, M.brick).put(new THREE.BoxGeometry(L + .5, .4, W + .5), M.cornice, x + u, hw(18), z + v);
    b.hip([{ o: [[x + u - L / 2, z + v - W / 2], [x + u + L / 2, z + v - W / 2], [x + u + L / 2, z + v + W / 2], [x + u - L / 2, z + v + W / 2]], h: [] }], hw(18) + .2, 3.2, M.slate, .5, 4.5); }
  b.box(w - 4, .15, w - 4, x, 0, z, M.paving); statue(b, x, z, 2.4, 1.4, M.marble); for (const [s, t] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) fountain(b, x + s * 16, z + t * 16, 2.6); }, sol: [[0, 0, 1.4]], r: 40, block: true });
add('elysee', { lab: "Palais de l'Élysée", f: 'S', fn(b, G) { std(b, G.P, 16); } });
add('observatoire', { lab: 'Observatoire de Paris', f: 'S', fn(b, G) { const h = std(b, G.P, 18); for (const t of [-1, 1]) { const q = at(G.o, 0, t * .9); b.dome(2.6, q[0], h, q[1], M.zinc, 1, 16); } } });
add('bonmarche', { lab: 'Au Bon Marché (Boileau & Eiffel, 1869–87)', f: 'E', fn(b, G) { const h = std(b, G.P, 20, { roof: M.zinc, step: 2.2 }); b.hip(G.P, h, 1, M.hglass, .25, 3); } });
add('trocadero', { lab: 'Palais du Trocadéro (1878)', pt: 'trocadero', r: 60, fn(b) { const e = PT.eiffelC; trocadero(b, Math.atan2(e[1] - b.c[1], e[0] - b.c[0])); }, sol: [[0, 0, 11.4]] });
add('liberty', { lab: 'Liberty (Bartholdi, 1889; faced east)', pt: 'liberty', r: 2, fn(b) { liberty(b); }, sol: 1.8 });
export const SPEC = S;
// ---------------- install: labels, footprints, reservations, colliders, streamed models ----------------
const PT = D.pt; const GEO = {}; export const FOOTPRINTS = []; export const OWNED = new Set(['conciergerie', 'tuileries']);
function G0(b, k) { const L = D.L[k]; if (!L) return null; if (GEO[k]) return GEO[k]; const P = L.p.map(q => ({ o: q.o, h: q.h || [] })); let big = P[0]; for (const q of P) if (Math.abs(area(q.o)) > Math.abs(area(big.o))) big = q; return GEO[k] = { P, o: obb(big.o), c: L.c }; }
const circ = (c, r, n = 16) => [...Array(n)].map((_, k) => [c[0] + Math.cos(k * 2 * PI / n) * r, c[1] + Math.sin(k * 2 * PI / n) * r]);
export function inLandmark(x, z, pad = 0) { for (const F of FOOTPRINTS) { if ((x - F.c[0]) ** 2 + (z - F.c[1]) ** 2 > (F.R + pad) ** 2) continue; if (!pad) { if (F.P.some(P => inPoly(P, x, z))) return F.key; } else for (let k = 0; k < 8; k++) { const a = k * PI / 4; if (F.P.some(P => inPoly(P, x + Math.cos(a) * pad, z + Math.sin(a) * pad))) return F.key; } } return null; }
function reserve(key, P, blk) { const cs = P.flatMap(q => q.o); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const v of cs) { x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); z0 = Math.min(z0, v[1]); z1 = Math.max(z1, v[1]); }
  const c = [(x0 + x1) / 2, (z0 + z1) / 2]; FOOTPRINTS.push({ key, P, c, R: Math.hypot(x1 - x0, z1 - z0) / 2 });
  for (let j = Math.floor(z0 / T) - 1; j <= Math.floor(z1 / T) + 1; j++) for (let i = Math.floor(x0 / T) - 1; i <= Math.floor(x1 / T) + 1; i++) { if (!inb(i, j)) continue; const x = (i + .5) * T, z = (j + .5) * T;
      let hit = P.some(q => inPoly(q, x, z)); if (!hit) for (const [dx, dz] of [[-.9, -.9], [.9, -.9], [-.9, .9], [.9, .9]]) if (P.some(q => inPoly(q, x + dx, z + dz))) { hit = true; break; }
      if (!hit && blk && P.some(q => pip(q.o, x, z))) { const t = ti(i, j); RESV[t] = 1; if (kind[t] === K.BLD) skipT[t] = 1; continue; } // courtyards (footprint holes, e.g. Cour Carrée) stay open
      if (!hit) continue; const t = ti(i, j); RESV[t] = 1; if (blk && kind[t] === K.BLD) skipT[t] = 1; } return c; }
function clearHull(P) { const pts = P.flatMap(q => q.o).slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of pts.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const H = lo.slice(0, -1).concat(up.slice(0, -1)); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const v of H) { x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); z0 = Math.min(z0, v[1]); z1 = Math.max(z1, v[1]); }
  for (let j = Math.floor(z0 / T); j <= Math.floor(z1 / T); j++) for (let i = Math.floor(x0 / T); i <= Math.floor(x1 / T); i++) { if (!inb(i, j)) continue; const t = ti(i, j); if (kind[t] === K.BLD && !RESV[t] && pip(H, (i + .5) * T, (j + .5) * T)) { RESV[t] = 1; skipT[t] = 1; } } }
function solid(x, z, r) { addProp('solid', x, z, { r, hp: 1e9 }); SOL.push([x, z, r]); }
const SOL = [];
// no street trees, kiosks or benches out on the bridge decks (1890 bridges were bare stone or iron)
function onDeck(x, z) { for (const r of VROADS) { if (!r.br) continue; const [x0, z0, x1, z1] = r.bb; if (x < x0 || x > x1 || z < z0 || z > z1) continue; const p = r.p; for (let i = 0; i + 3 < p.length; i += 2) { const ax = p[i], az = p[i + 1], dx = p[i + 2] - ax, dz = p[i + 3] - az, l = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l)); if (Math.hypot(x - ax - t * dx, z - az - t * dz) < r.pw / 2 + 1.5) return true; } } return false; }
export function install(ctx) { if (M) return; mats(ctx.L_, ctx); { const prev = hooks.allow; hooks.allow = (ty, x, z) => (!prev || prev(ty, x, z)) && (ty === 'lamp' || !onDeck(x, z)); }
  const tro = LM.trocadero, em = LM.ecolemil; // 1889 Exposition, real positions along the Trocadéro – École Militaire axis
  PT.trocadero = PT.trocadero || [tro[1], tro[2]]; const ax = PT.trocadero, f = (k) => [ax[0] + (em[1] - ax[0]) * k, ax[1] + (em[2] - ax[1]) * k];
  PT.eiffelC = f(.335); PT.galerieC = f(.80);
  for (const k in S) { const sp = S[k]; if (sp.relabel) { if (LM[sp.relabel]) LM[sp.relabel][0] = sp.lab; continue; }
    let c, P = null, G = null; const dk = sp.d || k;
    if (k === 'eiffel') c = PT.eiffelC; else if (k === 'galerie') c = PT.galerieC; else if (sp.pt && PT[sp.pt]) c = PT[sp.pt];
    if (!sp.pt && D.L[dk]) { G = G0(null, dk); if (sp.f) face(G.o, sp.f); P = G.P; c = c || G.c; }
    if (!c && LM[k]) c = [LM[k][1], LM[k][2]]; if (!c && D.L[dk]) c = D.L[dk].c; if (!c) { console.warn('landmark without position', k); continue; }
    if (sp.cen && PT[sp.cen]) c = PT[sp.cen];
    if (sp.rect) { const a = k === 'galerie' ? Math.atan2(em[2] - c[1], em[1] - c[0]) + PI / 2 : 0, ca = Math.cos(a), sa = Math.sin(a), [L, W] = sp.rect; P = [{ o: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [c[0] + u * L / 2 * ca - v * W / 2 * sa, c[1] + u * L / 2 * sa + v * W / 2 * ca]), h: [] }]; }
    if (!P && sp.r && !sp.label) P = [{ o: circ(c, sp.r), h: [] }];
    if (sp.label && !sp.block) P = null;
    if (sp.block && !P) P = [{ o: circ(c, sp.r || 20), h: [] }];
    // label on the M map: existing keys keep their coordinates (mission POIs depend on them); new keys get the real position
    if (LM[k]) LM[k][0] = sp.lab; else LM[k] = [sp.lab, c[0], c[1], 'landmark', ''];
    if (k === 'eiffel' || k === 'galerie') { LM[k][1] = c[0]; LM[k][2] = c[1]; }
    if (P) reserve(k, P, !sp.walk && !sp.open || sp.block || k === 'favart');
    if (sp.clear && D.L[sp.clear]) reserve(k, G0(null, sp.clear).P, true); // open square: no procedural blocks on the place itself
    if (P && sp.hull) clearHull(P); // the Cour Napoléon and Carrousel were open ground in 1890 (no pyramid until 1989)
    if (sp.sol === 'legs') { const e = LM.ecolemil, a = Math.atan2(e[2] - c[1], e[1] - c[0]) + PI / 4; for (let q = 0; q < 4; q++) { const u = [1, -1, -1, 1][q] * 25.6, v = [1, 1, -1, -1][q] * 25.6; solid(c[0] + u * Math.cos(a) - v * Math.sin(a), c[1] + u * Math.sin(a) + v * Math.cos(a), 3.2); } }
    else if (typeof sp.sol === 'number') solid(c[0], c[1], sp.sol); else if (Array.isArray(sp.sol)) for (const [dx, dz, r] of sp.sol) solid(c[0] + dx, c[1] + dz, r);
    if (sp.solid) for (const [p, r] of sp.solid) solid(PT[p][0], PT[p][1], r);
    if (!sp.fn) continue; OWNED.add(k);
    let R = 8; if (P) for (const q of P) for (const v of q.o) R = Math.max(R, Math.hypot(v[0] - c[0], v[1] - c[1])); if (k === 'concorde') R = 40; if (k === 'eiffel') R = 30;
    const entry = { key: k, x: c[0], z: c[1], ang: 0, w: R * 2, d: R * 2, type: 'lmk', model: 'custom' };
    entry.custom = () => { const b = new B(c), H = []; sp.fn(b, G, H); const g = b.build(); for (const h of H) g.add(h); return g; };
    ctx.LMODELS.push(entry); }
  // keep mission points of interest out of the new monument colliders
  for (const tab of [POI, POIV]) for (const key in tab) { const p = tab[key]; if (!p) continue; const xz = Array.isArray(p) ? p : [p.x, p.z]; for (const [x, z, r] of SOL) { const dx = xz[0] - x, dz = xz[1] - z, d = Math.hypot(dx, dz); if (d < r + 1) { const s = (r + 1.2) / (d || 1), nx = d ? dx : 1, nz = d ? dz : 0; if (Array.isArray(p)) { p[0] = x + nx * s; p[1] = z + nz * s; } else { p.x = x + nx * s; p.z = z + nz * s; } } } }
  return OWNED; }
// ---------------- per-frame: night lighting + windmill sails ----------------
export function update(night, t, dt = 1 / 60) { if (!M) return; M.win.emissiveIntensity = night * 1.1; M.gas.emissiveIntensity = night * 3; M.redl.emissiveIntensity = .05 + night * 1.6; M.eifl.emissiveIntensity = Math.max(M.eifl.emissiveIntensity, night * 2.2);
  for (let i = ROT.length - 1; i >= 0; i--) { const r = ROT[i]; if (!r.parent?.parent?.parent) { if (r.userData.seen) ROT.splice(i, 1); continue; } r.userData.seen = 1; r.rotation.x = t * .35; } }
export const _bridgeDeck = k => BR[k] ? deckOf(ll(BR[k][1], BR[k][2]), BR[k][3] === 'foot', k) : null; export const _bridgeDecks = () => clusters();
