// City layout & zoning (1890): land-use map, building variety rules, legal prop placement.
// Data: map/zones.json (tools/zoning_gen.py). Plugs into world.js through `hooks` (style, floors, allow, zoneProps)
// and into gfx.js through hooks.shop / hooks.stallAt. Renderable zone models live in zrender.js.
import { K, S, NX, NZ, T, CHU, kind, surf, ti, inb, kij, hash, LABELS, LM, skipT, hooks, PD } from './world.js';
export const ZD = await fetch('map/zones.json').then(r => r.json());
const ZB = Uint8Array.from(atob(ZD.z), c => c.charCodeAt(0));
export const Z = Object.fromEntries(ZD.names.map((n, k) => [n, k]));
export const ZNAMES = ZD.names;
const CW = ZD.W, CZ = ZD.H, CS = ZD.cell;
export const zoneAt = (x, z) => { const i = Math.floor(x / CS), j = Math.floor(z / CS); return i < 0 || j < 0 || i >= CW || j >= CZ ? 0 : ZB[j * CW + i]; };
const zt = (i, j) => { const a = i >> 2, b = j >> 2; return a < 0 || b < 0 || a >= CW || b >= CZ ? 0 : ZB[b * CW + a]; }; // tile -> zone (cell = 4 tiles)
export const zoneTile = zt;
// ---- new prop kinds (collision radii); rendered by zrender.js
Object.assign(PD, { stall: { r: 1.1, hp: 1e9 }, bouq: { r: .7, hp: 1e9 }, band: { r: 3.2, hp: 1e9 } });
// ---- footprints of zone buildings replace generic blocks (skipT = "drawn by someone else")
function rectTiles(x, z, w, d, a, f) { const ca = Math.cos(a), sa = Math.sin(a); for (let u = -w / 2; u <= w / 2; u += 1) for (let v = -d / 2; v <= d / 2; v += 1) { const i = Math.floor((x + u * ca - v * sa) / T), j = Math.floor((z + u * sa + v * ca) / T); if (inb(i, j)) f(ti(i, j), i, j); } }
const own = (x, z, w, d, a) => rectTiles(x, z, w + 1, d + 1, a, t => { if (kind[t] === K.BLD) skipT[t] = 1; });
for (const c of ZD.churches) own(c[1], c[2], c[3], c[4], c[5]);
for (const h of ZD.halls) own(h[1], h[2], h[3], h[4], h[5]);
for (const g of ZD.gaso) own(g[1], g[2], g[3] * 2, g[3] * 2, 0);
for (const f of ZD.fact) own(f[1], f[2], f[3], f[4], f[5]);
for (const w of ZD.ware) own(w[1], w[2], w[3], w[4], w[5]);
for (const s of ZD.sheds) own(s[1], s[2], s[3], s[4], s[5]);
for (const v of ZD.vines) own(v[0], v[1], v[2], v[3], v[4]);
for (const q of ZD.quar) own(q[0], q[1], q[2] * 2, q[2] * 2, 0);
for (const s of ZD.shacks) own(s[0], s[1], 5, 4, s[2]);
for (const m of ZD.mills) own(m[1], m[2], 5, 5, 0);
// ---- M-map labels for the quarters (drawn by the existing label pass)
// district labels are drawn on the M map by main.js (HOOKS.map) in a larger face than street names
export const quarterAt = (x, z) => { let b = null, bd = 1e18; for (const q of ZD.quarters) { const d = (q[1] - x) ** 2 + (q[2] - z) ** 2; if (d < bd) { bd = d; b = q; } } return bd < 420 ** 2 ? b : null; };
// ---- building variety: style (HAUS 0, OLD 1, MONT 2, BRICK 3) and storeys per zone, deterministic per plot
const STY = (z, i, j) => { const h = hash(i >> 2, j >> 2, 7);
  switch (z) { case Z.commercial: case Z.bourgeois: case Z.luxury: case Z.civic: return h < .9 ? 0 : 1;
    case Z.working: return h < .42 ? 3 : h < .8 ? 1 : 0; case Z.medieval: case Z.latin: return h < .86 ? 1 : 0; case Z.market: return h < .5 ? 1 : 0;
    case Z.industrial: case Z.warehouse: case Z.railway: return h < .8 ? 3 : 1; case Z.rural: return h < .8 ? 2 : 1; default: return -1; } };
hooks.style = (i, j) => { const s = STY(zt(i, j), i, j); return s < 0 ? null : s; };
// storeys above ground floor: ranges per zone; old quarters use narrow 2-tile plots; neighbours never share the same count
const FR = { [Z.commercial]: [5, 2], [Z.luxury]: [5, 2], [Z.bourgeois]: [4, 3], [Z.civic]: [3, 2], [Z.working]: [2, 3], [Z.medieval]: [3, 3], [Z.latin]: [3, 3], [Z.market]: [3, 2], [Z.industrial]: [1, 2], [Z.warehouse]: [1, 1], [Z.railway]: [1, 2], [Z.rural]: [1, 2], [Z.riverside]: [4, 2] };
const plotF = (z, a, b) => { const r = FR[z]; return r ? r[0] + Math.floor(hash(a, b, 3) * (r[1] + .999)) : null; };
hooks.floors = (i, j, st) => { const z = zt(i, j), sh = z === Z.medieval || z === Z.latin || z === Z.working ? 1 : 2, a = i >> sh, b = j >> sh; let f = plotF(z, a, b); if (f == null) return null;
  if (f === plotF(z, a - 1, b) || f === plotF(z, a, b - 1)) f += hash(a, b, 4) < .5 ? 1 : -1; const r = FR[z]; return Math.max(r[0] - (z === Z.rural ? 0 : 1), Math.min(r[0] + r[1] + 1, f)); };
// ---- ground-floor uses. returns -1 for a residential door/porte-cochère, else trade index into gfx SHOPW
// 0 CAFÉ 1 BOULANGERIE 2 TABAC 3 VINS 4 PHARMACIE 5 MODES 6 LIBRAIRIE 7 BOUCHERIE
const TR = { [Z.commercial]: [.85, [5, 5, 6, 4, 2, 1, 5, 7]], [Z.luxury]: [.8, [5, 5, 5, 6, 4, 5, 2, 5]], [Z.bourgeois]: [.22, [1, 4, 7, 2, 6, 1, 4, 5]], [Z.working]: [.55, [3, 3, 1, 7, 2, 1, 3, 7]],
  [Z.medieval]: [.6, [3, 1, 7, 6, 2, 5, 3, 1]], [Z.latin]: [.7, [6, 6, 6, 1, 2, 3, 6, 4]], [Z.market]: [.92, [7, 1, 3, 7, 1, 2, 7, 3]], [Z.industrial]: [.08, [3, 3, 2, 3, 3, 3, 3, 3]], [Z.warehouse]: [.05, [3, 3, 3, 3, 3, 3, 3, 3]],
  [Z.railway]: [.3, [2, 3, 1, 2, 3, 2, 6, 3]], [Z.rural]: [.12, [3, 3, 1, 3, 3, 3, 3, 3]], [Z.civic]: [0, [1]], [Z.riverside]: [.5, [3, 6, 2, 3, 1, 6, 3, 2]] };
const isRoad = (i, j) => { const k = kij(i, j); return k === K.ROAD || k === K.BRIDGE; };
export function cornerAt(i, j) { let h = false, v = false; for (let r = 1; r <= 3; r++) { if (isRoad(i + r, j) || isRoad(i - r, j)) h = true; if (isRoad(i, j + r) || isRoad(i, j - r)) v = true; } return h && v; }
const boulAt = (i, j) => { for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) if (inb(i + a, j + b) && kind[ti(i + a, j + b)] === K.ROAD && surf[ti(i + a, j + b)] === S.MAC) return true; return false; };
hooks.shop = (bi, bj, oi, oj) => { const z = zt(bi, bj), tr = TR[z]; if (!tr) return null; const pa = bi >> 1, pb = bj >> 1; if (hash(pa, pb, 61) > tr[0]) return -1;
  const corner = cornerAt(oi, oj), boul = boulAt(oi, oj); let k = tr[1][Math.floor(hash(pa, pb, 62) * tr[1].length)];
  if ((corner || (boul && z !== Z.bourgeois)) && hash(pa, pb, 69) < (corner ? .55 : .3)) k = hash(pa, pb, 70) < .75 ? 0 : 3; // cafés & marchands de vins on corners and boulevards
  return k; };
// ---- street markets: stall tiles precomputed on pavement/market squares only (never the carriageway, never against a façade)
const STALL = new Map(); for (const [x, z, a] of ZD.stalls) STALL.set(Math.floor(x / T) + ',' + Math.floor(z / T), a);
hooks.stallAt = () => null; // gfx's random street-life stalls are off; market stalls are zone props (ZD.stalls) drawn by zrender.js
// ---- placement rules for generic street furniture (world.js ensureChunk asks before placing)
const STREET = new Set(['morris', 'kiosk', 'pissoir', 'wallace', 'trough', 'bench']);
export function legal(type, x, z) { const i = Math.floor(x / T), j = Math.floor(z / T), k = kij(i, j); if (type === 'tree') return !FOUNTS.some(f => Math.abs(f[1] - x) < 5.2 && Math.abs(f[2] - z) < 5.2); if (type === 'lamp') return true;
  if (k === K.ROAD || k === K.BRIDGE || k === K.WATER || k === K.BLD || k === K.RAIL) return false;
  if (type === 'fountain') return isFountainSite(x, z);
  if (k === K.SIDE && STREET.has(type)) { let road = false, bld = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = kij(i + a, j + b); if (q === K.ROAD || q === K.BRIDGE) road = true; if (q === K.BLD) bld = true; }
    if (bld) return false; // never in front of a door
    if (type !== 'bench' && type !== 'kiosk' && !road) return false; } // columns, pissoirs, troughs at the kerb
  if (k === K.PARK && zt(i, j) === Z.cemetery && type !== 'bench') return false;
  return true; }
export const FOUNTS = ZD.fountains; // [name,x,z,type,real]
export function isFountainSite(x, z) { const i = Math.floor(x / T), j = Math.floor(z / T); if (kij(i, j) === K.PARK && zt(i, j) !== Z.cemetery) return true; return FOUNTS.some(f => f[4] && (f[1] - x) ** 2 + (f[2] - z) ** 2 < 64); }
hooks.allow = legal;
// ---- zone-owned props, per chunk
const BYCH = new Map(); const reg = (x, z, f) => { const k = Math.floor(x / CHU) * 1000 + Math.floor(z / CHU); (BYCH.get(k) || BYCH.set(k, []).get(k)).push(f); };
const BASINLM = ['luxjardin', 'tuileriesg', 'monceau'].map(k => LM[k]).filter(Boolean);
for (const f of FOUNTS) { if (f[3] === 'basin' && BASINLM.some(l => (l[1] - f[1]) ** 2 + (l[2] - f[2]) ** 2 < 45 ** 2)) continue; reg(f[1], f[2], (put) => put('fountain', f[1], f[2], { name: f[0], ftype: f[3] })); }
for (const [x, z, a] of ZD.stalls) reg(x, z, put => put('stall', x, z, { ry: a }));
for (const [x, z, a] of ZD.bouq) reg(x, z, put => put('bouq', x, z, { ry: a }));
for (const [x, z] of ZD.bands) reg(x, z, put => put('band', x, z));
hooks.zoneProps = (cx, cz, put, nearAny) => { for (const f of BYCH.get(cx * 1000 + cz) || []) f((ty, x, z, o) => nearAny && ty !== 'fountain' && nearAny(x, z, ty === 'stall' ? 1.4 : ty === 'band' ? 3.4 : .8) ? null : put(ty, x, z, o)); };
window.__ZN = { ZD, Z, zoneAt, zoneTile: zt, legal, isFountainSite, quarterAt };
