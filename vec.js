// Vector streets, water, parks and rails (OSM, tools/vector.py) for smooth, tile-free rendering.
// The gameplay grid in world.js is the rasterisation of exactly these shapes, so what you see is what you collide with.
import { T, CHU } from './world.js';
const V = await fetch('map/vec.json').then(r => r.json());
const W = V.W;
const bb = (p, m) => { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); z0 = Math.min(z0, p[k + 1]); z1 = Math.max(z1, p[k + 1]); } return [x0 - m, z0 - m, x1 + m, z1 + m]; };
// v14 road-shape review (render side; the gameplay raster is untouched): snap near-miss ends, drop artefact stubs, de-duplicate overlaps, remove zig-zag kinks, round sharp corners
export const ROADFIX = { snap: 0, stub: 0, dup: 0, kink: 0, round: 0 };
(() => { const R = V.roads, key = (x, z) => Math.round(x * 2) + ',' + Math.round(z * 2), len = p => { let L = 0; for (let k = 0; k + 3 < p.length; k += 2) L += Math.hypot(p[k + 2] - p[k], p[k + 3] - p[k + 1]); return L; };
  // 1. near-miss ends: endpoints within 3 units of another endpoint are merged onto the cluster mean (closes gaps and slivers at junctions and bridge heads)
  const E = []; R.forEach((r, i) => { const p = r[3]; E.push([i, 0], [i, p.length - 2]); }); const G = new Map(), gk = (x, z) => Math.floor(x / 3) + ':' + Math.floor(z / 3);
  for (const e of E) { const p = R[e[0]][3], k = gk(p[e[1]], p[e[1] + 1]); (G.get(k) || G.set(k, []).get(k)).push(e); }
  const seen = new Set(); for (const e of E) { const p = R[e[0]][3], x = p[e[1]], z = p[e[1] + 1], id = e[0] * 2 + (e[1] ? 1 : 0); if (seen.has(id)) continue; const cl = [e];
    const a = Math.floor(x / 3), b = Math.floor(z / 3); for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) for (const f of G.get((a + da) + ':' + (b + db)) || []) { if (f === e) continue; const q = R[f[0]][3], fid = f[0] * 2 + (f[1] ? 1 : 0); if (seen.has(fid)) continue; const d = Math.hypot(q[f[1]] - x, q[f[1] + 1] - z); if (d < 3) cl.push(f); }
    let mx = 0, mz = 0; for (const f of cl) { const q = R[f[0]][3]; mx += q[f[1]]; mz += q[f[1] + 1]; seen.add(f[0] * 2 + (f[1] ? 1 : 0)); } mx /= cl.length; mz /= cl.length;
    if (cl.length > 1) for (const f of cl) { const q = R[f[0]][3]; if (Math.hypot(q[f[1]] - mx, q[f[1] + 1] - mz) > .01) ROADFIX.snap++; q[f[1]] = mx; q[f[1] + 1] = mz; } }
  const deg = new Map(); for (const r of R) { const p = r[3]; for (const k of [0, p.length - 2]) { const kk = key(p[k], p[k + 1]); deg.set(kk, (deg.get(kk) || 0) + 1); } }
  const drop = new Set(), pair = new Map();
  R.forEach((r, i) => { const [c, , , p] = r; if (c < 1 || p.length < 4) return; const w = (W[c] ?? 1) * T, d0 = deg.get(key(p[0], p[1])), d1 = deg.get(key(p[p.length - 2], p[p.length - 1])), L = len(p);
    // 2. stubs: a dead-end spur shorter than its own width hanging off a junction is a digitising artefact (renders as a blob)
    if ((d0 === 1) !== (d1 === 1) && L < w * 1.2) { drop.add(i); ROADFIX.stub++; return; }
    // 3. overlaps: two ways sharing both ends with ~equal length are the same street drawn twice
    const k0 = key(p[0], p[1]), k1 = key(p[p.length - 2], p[p.length - 1]), pk = k0 < k1 ? k0 + '|' + k1 : k1 + '|' + k0, o = pair.get(pk);
    if (o !== undefined && Math.abs(len(R[o][3]) - L) < L * .15) { if (R[o][0] >= c) { drop.add(i); } else { drop.add(o); pair.set(pk, i); } ROADFIX.dup++; } else if (o === undefined) pair.set(pk, i); });
  for (const i of drop) R[i] = null;
  for (const r of R) { if (!r || r[0] < 1) continue; const w = (W[r[0]] ?? 1) * T; let p = r[3];
    // 4. kinks: an interior vertex that turns hard over a segment shorter than ~half the street width is a zig-zag
    for (let pass = 0; pass < 2; pass++) { const q = [p[0], p[1]]; for (let k = 2; k + 3 < p.length; k += 2) { const ax = p[k] - q[q.length - 2], az = p[k + 1] - q[q.length - 1], bx = p[k + 2] - p[k], bz = p[k + 3] - p[k + 1], la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
        const cs = la * lb > 0 ? (ax * bx + az * bz) / (la * lb) : 1; if (cs < .77 && Math.min(la, lb) < w * .6 && p.length > 4) { ROADFIX.kink++; continue; } q.push(p[k], p[k + 1]); } q.push(p[p.length - 2], p[p.length - 1]); p = q; }
    // 5. corners: cut any interior corner sharper than ~20 deg into a short arc (two Chaikin passes, cut <= 0.8 width)
    for (let pass = 0; pass < 2; pass++) { const q = [p[0], p[1]]; for (let k = 2; k + 3 < p.length; k += 2) { const ax = p[k] - p[k - 2], az = p[k + 1] - p[k - 1], bx = p[k + 2] - p[k], bz = p[k + 3] - p[k + 1], la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
        const cs = la * lb > 0 ? (ax * bx + az * bz) / (la * lb) : 1; if (cs > .94) { q.push(p[k], p[k + 1]); continue; } const ca = Math.min(la * .3, w * .8) / la, cb = Math.min(lb * .3, w * .8) / lb;
        q.push(p[k] - ax * ca, p[k + 1] - az * ca, p[k] + bx * cb, p[k + 1] + bz * cb); if (!pass) ROADFIX.round++; } q.push(p[p.length - 2], p[p.length - 1]); p = q; }
    r[3] = p; }
  V.roads = R.filter(Boolean); })();
// road: c class, br bridge, sf surface (0 macadam, 1 setts, 2 dirt), w carriageway width, pw pavement band width
export const ROADS = V.roads.map(([c, br, sf, p]) => { const wt = W[c] ?? 1, w = c === -2 ? T * .9 : wt * T, pw = c >= 1 ? (wt + 2) * T : w; return { c, br, sf, p, w, pw, bb: bb(p, pw / 2 + 1) }; }).sort((a, b) => a.c - b.c);
const poly = (L, kind) => L.filter(p => p.length >= 6).map(p => ({ p, kind, bb: bb(p, 1) }));
export const WATER = poly(V.water), ISLAND = poly(V.island), PARK = poly(V.park), RAIL = V.rail.filter(p => p.length >= 4).map(p => ({ p, bb: bb(p, 4) }));
// junction fillets: shared end points of 3+ carriageways
const JN = new Map(); for (const r of ROADS) { if (r.c < 1) continue; for (const k of [0, r.p.length - 2]) { const key = Math.round(r.p[k] * 2) + ',' + Math.round(r.p[k + 1] * 2); const j = JN.get(key) || { x: r.p[k], z: r.p[k + 1], n: 0, w: 0, wmin: 1e9, sf: 0, br: 0, d: [] }; j.n++; if (r.br) j.br++;
  const q = k ? r.p.length - 4 : 2, dx = r.p[q] - r.p[k], dz = r.p[q + 1] - r.p[k + 1], l = Math.hypot(dx, dz) || 1; j.d.push([dx / l, dz / l]); j.wmin = Math.min(j.wmin, r.w); if (r.w > j.w || (j.br && !r.br && r.w >= j.w)) { j.w = r.w; j.sf = r.sf; } JN.set(key, j); } }
// v14: fillets at 3+-way junctions, at elbows (two streets meeting at an angle) and width steps, and at bridge heads (drawn after the deck so the parapet edge does not cut the road)
const JUNC0 = [...JN.values()].filter(j => j.n >= 3 || (j.n === 2 && (j.br === 1 || j.wmin < j.w - .1 || j.d[0][0] * j.d[1][0] + j.d[0][1] * j.d[1][1] > -.82))).map(j => ({ x: j.x, z: j.z, n: j.n, w: j.n === 2 && !j.br ? (j.wmin + j.w) / 2 : j.w, sf: j.sf, br: j.br > 0 && j.br < j.n, bb: [j.x - j.w, j.z - j.w, j.x + j.w, j.z + j.w] }));
export const JUNC = (() => { /* v15: merge clustered junction/bridge-head discs (Vert-Galant "heart") into one */ const out = [], used = new Uint8Array(JUNC0.length);
  for (let a = 0; a < JUNC0.length; a++) { if (used[a]) continue; const C = [JUNC0[a]]; used[a] = 1; for (let k = 0; k < C.length; k++) for (let b = a + 1; b < JUNC0.length; b++) if (!used[b] && Math.hypot(JUNC0[b].x - C[k].x, JUNC0[b].z - C[k].z) < 1.05 * Math.max(JUNC0[b].w, C[k].w)) { used[b] = 1; C.push(JUNC0[b]); }
    if (C.length === 1) { out.push(C[0]); continue; } let x = 0, z = 0, w = 0, n = 0; for (const j of C) { x += j.x; z += j.z; w = Math.max(w, j.w); n = Math.max(n, j.n); } x /= C.length; z /= C.length; const r = Math.max(...C.map(j => Math.hypot(j.x - x, j.z - z))); w = Math.min(w + r * .6, w * 1.35);
    out.push({ x, z, n: Math.max(n, 3), w, sf: C[0].sf, br: false, bb: [x - w, z - w, x + w, z + w] }); } return out; })();
export function near(list, x0, z0, x1, z1) { return list.filter(o => o.bb[0] < x1 && o.bb[2] > x0 && o.bb[1] < z1 && o.bb[3] > z0); }
// per-chunk index (lazy)
const IDX = new Map();
export function chunkVec(cx, cz, m = 8) { const k = cx * 1000 + cz; if (IDX.has(k)) return IDX.get(k); const x0 = cx * CHU - m, z0 = cz * CHU - m, x1 = x0 + CHU + 2 * m, z1 = z0 + CHU + 2 * m;
  const o = { roads: near(ROADS, x0, z0, x1, z1), water: near(WATER, x0, z0, x1, z1), island: near(ISLAND, x0, z0, x1, z1), park: near(PARK, x0, z0, x1, z1), rail: near(RAIL, x0, z0, x1, z1), junc: near(JUNC, x0, z0, x1, z1) }; IDX.set(k, o); return o; }
export function polyPath(g, p) { g.moveTo(p[0], p[1]); for (let k = 2; k < p.length; k += 2) g.lineTo(p[k], p[k + 1]); g.closePath(); }
export function linePath(g, p) { g.moveTo(p[0], p[1]); for (let k = 2; k < p.length; k += 2) g.lineTo(p[k], p[k + 1]); }
export { V as VEC, W as VW };
