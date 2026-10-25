// Vector streets, water, parks and rails (OSM, tools/vector.py) for smooth, tile-free rendering.
// The gameplay grid in world.js is the rasterisation of exactly these shapes, so what you see is what you collide with.
import { T, CHU } from './world.js';
const V = await fetch('map/vec.json').then(r => r.json());
const W = V.W;
const bb = (p, m) => { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); z0 = Math.min(z0, p[k + 1]); z1 = Math.max(z1, p[k + 1]); } return [x0 - m, z0 - m, x1 + m, z1 + m]; };
// road: c class, br bridge, sf surface (0 macadam, 1 setts, 2 dirt), w carriageway width, pw pavement band width
export const ROADS = V.roads.map(([c, br, sf, p]) => { const wt = W[c] ?? 1, w = c === -2 ? T * .9 : wt * T, pw = c >= 1 ? (wt + 2) * T : w; return { c, br, sf, p, w, pw, bb: bb(p, pw / 2 + 1) }; }).sort((a, b) => a.c - b.c);
const poly = (L, kind) => L.filter(p => p.length >= 6).map(p => ({ p, kind, bb: bb(p, 1) }));
export const WATER = poly(V.water), ISLAND = poly(V.island), PARK = poly(V.park), RAIL = V.rail.filter(p => p.length >= 4).map(p => ({ p, bb: bb(p, 4) }));
// junction fillets: shared end points of 3+ carriageways
const JN = new Map(); for (const r of ROADS) { if (r.c < 1 || r.br) continue; for (const k of [0, r.p.length - 2]) { const key = Math.round(r.p[k] * 2) + ',' + Math.round(r.p[k + 1] * 2); const j = JN.get(key) || { x: r.p[k], z: r.p[k + 1], n: 0, w: 0, sf: 0 }; j.n++; if (r.w > j.w) { j.w = r.w; j.sf = r.sf; } JN.set(key, j); } }
export const JUNC = [...JN.values()].filter(j => j.n >= 3).map(j => ({ ...j, bb: [j.x - j.w, j.z - j.w, j.x + j.w, j.z + j.w] }));
export function near(list, x0, z0, x1, z1) { return list.filter(o => o.bb[0] < x1 && o.bb[2] > x0 && o.bb[1] < z1 && o.bb[3] > z0); }
// per-chunk index (lazy)
const IDX = new Map();
export function chunkVec(cx, cz, m = 8) { const k = cx * 1000 + cz; if (IDX.has(k)) return IDX.get(k); const x0 = cx * CHU - m, z0 = cz * CHU - m, x1 = x0 + CHU + 2 * m, z1 = z0 + CHU + 2 * m;
  const o = { roads: near(ROADS, x0, z0, x1, z1), water: near(WATER, x0, z0, x1, z1), island: near(ISLAND, x0, z0, x1, z1), park: near(PARK, x0, z0, x1, z1), rail: near(RAIL, x0, z0, x1, z1), junc: near(JUNC, x0, z0, x1, z1) }; IDX.set(k, o); return o; }
export function polyPath(g, p) { g.moveTo(p[0], p[1]); for (let k = 2; k < p.length; k += 2) g.lineTo(p[k], p[k + 1]); g.closePath(); }
export function linePath(g, p) { g.moveTo(p[0], p[1]); for (let k = 2; k < p.length; k += 2) g.lineTo(p[k], p[k + 1]); }
export { V as VEC, W as VW };
