// World data: real Paris c.1880 rasterised from OpenStreetMap (tools/raster.py) — 1 unit = 2.5 m, tile = T units
export const K = { ROAD: 0, SIDE: 1, BLD: 2, WATER: 3, BRIDGE: 4, PARK: 5, STAIR: 6, RAIL: 7 };
export const S = { MAC: 0, PAVE: 1, DIRT: 2, GRASS: 3, FLAG: 4, WATER: 5, STAIR: 6 };
export const SURF = { 0: { grip: 1, spd: 1, n: 'macadam' }, 1: { grip: .5, spd: .92, n: 'pavé' }, 2: { grip: .75, spd: .62, n: 'dirt' }, 3: { grip: .7, spd: .6 }, 4: { grip: .85, spd: .85 }, 5: { grip: 1, spd: 1 }, 6: { grip: 1, spd: 1 } };
async function pix(u) { const b = await (await fetch(u)).blob(); const bm = await createImageBitmap(b, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bm, 0, 0); return g.getImageData(0, 0, bm.width, bm.height).data; }
const [MP, DP, WJ] = await Promise.all([pix('map/map.png'), pix('map/depth.png'), fetch('map/world.json').then(r => r.json())]);
export const NX = WJ.N[0], NZ = WJ.N[1], T = WJ.T, WX = NX * T, WZ = NZ * T, CH = 32, CHU = CH * T, NCX = Math.ceil(NX / CH), NCZ = Math.ceil(NZ / CH);
export const kind = new Uint8Array(NX * NZ), surf = new Uint8Array(NX * NZ), dist = new Uint8Array(NX * NZ), depth = new Uint8Array(NX * NZ);
for (let i = 0; i < NX * NZ; i++) { kind[i] = MP[i * 4]; surf[i] = MP[i * 4 + 1]; dist[i] = MP[i * 4 + 2]; depth[i] = DP[i * 4]; }
export const DN = ['Montmartre', 'Grands Boulevards & Opéra', 'Les Halles & the Marais', 'Gares & Rail Yards', 'La Seine', 'Île de la Cité & Île Saint-Louis', 'Quartier Latin', 'Champs-Élysées & Concorde', 'Faubourg Saint-Germain & Invalides', 'Belleville & La Villette', 'Bastille & Faubourg Saint-Antoine', 'Montparnasse & Denfert', 'Passy & Trocadéro', 'Batignolles & Monceau'];
export const LM = WJ.landmarks, LABELS = WJ.labels, FLAGGED = WJ.flagged;
// Place de l'Étoile: the raster fills the centre with building blocks; open it into a true circular place (paved island + ring road)
export const ETOILE = LM.arc ? { x: LM.arc[1], z: LM.arc[2], ri: 15, ro: 27 } : null;
if (ETOILE) { const ci = ETOILE.x / T, cj = ETOILE.z / T, R = ETOILE.ro / T + 1; for (let j = Math.floor(cj - R); j <= cj + R; j++) for (let i = Math.floor(ci - R); i <= ci + R; i++) { if (i < 0 || j < 0 || i >= NX || j >= NZ) continue; const d = Math.hypot(i + .5 - ci, j + .5 - cj) * T, t = j * NX + i;
  if (d < ETOILE.ri) { kind[t] = K.SIDE; surf[t] = S.FLAG; } else if (d < ETOILE.ro) { kind[t] = K.ROAD; surf[t] = S.PAVE; } } }
export const ti = (i, j) => j * NX + i;
export const inb = (i, j) => i >= 0 && j >= 0 && i < NX && j < NZ;
export const kij = (i, j) => inb(i, j) ? kind[ti(i, j)] : K.BLD;
export const tileAt = (x, z) => { const i = Math.floor(x / T), j = Math.floor(z / T); return inb(i, j) ? ti(i, j) : -1; };
export const kAt = (x, z) => { const t = tileAt(x, z); return t < 0 ? K.BLD : kind[t]; };
export const pedBlock = (x, z) => { const k = kAt(x, z); return k === K.BLD || k === K.WATER; };
export const vehBlock = (x, z) => { const k = kAt(x, z); return k === K.BLD || k === K.WATER || k === K.STAIR; };
export const hash = (i, j, s = 0) => { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function snapWalk(i0, j0, veh, R = 40) { i0 = Math.floor(i0); j0 = Math.floor(j0);
  for (let r = 0; r < R; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    const i = i0 + di, j = j0 + dj; if (!inb(i, j)) continue; const k = kind[ti(i, j)];
    if (veh ? ((k === K.ROAD || k === K.BRIDGE) && kij(i + 1, j) !== K.BLD && kij(i - 1, j) !== K.BLD && kij(i, j + 1) !== K.BLD && kij(i, j - 1) !== K.BLD) : (k === K.SIDE || k === K.PARK)) return [(i + .5) * T, (j + .5) * T]; }
  return [i0 * T, j0 * T]; }
// mission POIs -> real places
const ALIAS = { salon: 'industrie' };
export const POI = {}, POIV = {};
export function poiFor(key) { const k = ALIAS[key] || key; const l = LM[k]; if (!l) { console.warn('POI missing', key); return; } POI[key] = snapWalk(l[1] / T, l[2] / T, false); POIV[key] = snapWalk(l[1] / T, l[2] / T, true); }
for (const k in LM) poiFor(k); poiFor('salon');
// ---- traffic graph ----
export const GN = WJ.nodes; export const GE = WJ.edges.map(([a, b, c, mid]) => { const p = [GN[a][0], GN[a][1], ...mid, GN[b][0], GN[b][1]]; return { a, b, c, p }; });
export const ADJ = GN.map(() => []); GE.forEach((e, k) => { ADJ[e.a].push(k); ADJ[e.b].push(k); });
const NG = new Map(); GN.forEach((n, k) => { const key = Math.floor(n[0] / 64) * 1000 + Math.floor(n[1] / 64); if (!NG.has(key)) NG.set(key, []); NG.get(key).push(k); });
export function nodesIn(x, z, r) { const out = []; const a0 = Math.floor((x - r) / 64), a1 = Math.floor((x + r) / 64), b0 = Math.floor((z - r) / 64), b1 = Math.floor((z + r) / 64);
  for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) { const l = NG.get(a * 1000 + b); if (l) for (const k of l) out.push(k); } return out; }
export function nearestNode(x, z) { let best = -1, bd = 1e18; for (let r = 64; r < 1500 && best < 0; r *= 2) for (const k of nodesIn(x, z, r)) { const d = (GN[k][0] - x) ** 2 + (GN[k][1] - z) ** 2; if (d < bd) { bd = d; best = k; } } return best; }
// polyline of an edge traversed from node n
export const edgePts = (e, from) => { const p = GE[e].p, out = []; for (let k = 0; k < p.length; k += 2) out.push([p[k], p[k + 1]]); return GE[e].a === from ? out : out.reverse(); };
export const edgeOther = (e, n) => GE[e].a === n ? GE[e].b : GE[e].a;
// ---- rail paths ----
function mkPath(pts) { const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; }
export const TRAM = mkPath(WJ.tram), TRAIN = mkPath(WJ.train);
export function pathAt(P, s) { s = Math.max(0, Math.min(P.len, s)); let k = 1; while (k < P.cum.length - 1 && P.cum[k] < s) k++; const a = P.pts[k - 1], b = P.pts[k], f = (s - P.cum[k - 1]) / ((P.cum[k] - P.cum[k - 1]) || 1);
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[1] - a[1], b[0] - a[0])]; }
export function pathNear(P, x, z) { let best = 0, bd = 1e18; for (let s = 0; s <= P.len; s += 2) { const q = pathAt(P, s), d = (q[0] - x) ** 2 + (q[1] - z) ** 2; if (d < bd) { bd = d; best = s; } } return best; }
// ---- building parcels / styles (shared by renderer and ground) ----
export const ST = { HAUS: 0, OLD: 1, MONT: 2, BRICK: 3 };
const DSTY = { 0: [2, 2, 2, 1], 1: [0], 2: [1, 1, 0], 3: [3, 3, 1], 4: [1], 5: [1, 1, 0], 6: [1, 0], 7: [0], 8: [0, 0, 1], 9: [2, 3, 1, 3], 10: [1, 3, 1], 11: [2, 1, 3], 12: [0, 1], 13: [0, 0, 1] };
export const skipT = new Uint8Array(NX * NZ); // tiles replaced by landmark models
export function styleOf(i, j) { const pi = i >> 2, pj = j >> 2, d = dist[ti(i, j)], l = DSTY[d] || [0]; return l[Math.floor(hash(pi, pj, 7) * l.length)]; }
export const DCUT = [4, 3, 3, 5];
// building height (walls) for tile, 0 if open. Returns also courtyard/workshop
export function bldH(i, j) { if (!inb(i, j)) return 0; const t = ti(i, j); if (kind[t] !== K.BLD || skipT[t]) return 0; const st = styleOf(i, j), dp = depth[t];
  const pi = i >> 2, pj = j >> 2, h0 = hash(pi, pj, 3);
  if (dp > DCUT[st]) return hash(i >> 1, j >> 1, 9) < .45 ? 0 : 2.6 + (st === 3 ? 2 : 0); // courtyard or workshop
  const f = st === 0 ? 4 + Math.floor(h0 * 2.4) : st === 1 ? 3 + Math.floor(h0 * 2.2) : st === 2 ? 1 + Math.floor(h0 * 2) : 2 + Math.floor(h0 * 3);
  return 1.6 + f * 1.2 + .3; }
export const isYard = (i, j) => inb(i, j) && kind[ti(i, j)] === K.BLD && !skipT[ti(i, j)] && bldH(i, j) === 0;
// ---- props (data, generated lazily per chunk) ----
export const PD = { lamp: { r: .3, hp: 25 }, tree: { r: .6, hp: 200 }, morris: { r: .9, hp: 80 }, wallace: { r: .7, hp: 120 }, trough: { r: .8, hp: 60 }, pissoir: { r: .9, hp: 90 }, bench: { r: .5, hp: 40 }, kiosk: { r: 1, hp: 120 },
  crate: { r: .7, hp: 50 }, table: { r: .6, hp: 30 }, barricade: { r: 1.2, hp: 300 }, phone: { r: .4, hp: 1e9 }, manhole: { r: 0, hp: 1e9 }, solid: { r: 1, hp: 1e9 } };
const propGrid = new Map(); export const chunkProps = new Map(); export const dynProps = [];
const gk = (x, z) => Math.floor(x / 8) * 10000 + Math.floor(z / 8);
export function addProp(type, x, z, extra) { const p = Object.assign({ type, x, z, r: PD[type].r, hp: PD[type].hp, alive: true }, extra || {}); const k = gk(x, z); if (!propGrid.has(k)) propGrid.set(k, []); propGrid.get(k).push(p); return p; }
export const hooks = { prop: null };
export function setPropM(p) { if (hooks.prop) hooks.prop(p); }
function nearSame(type, x, z, r) { const a = Math.floor(x / 8), b = Math.floor(z / 8), n = Math.ceil(r / 8); for (let i = a - n; i <= a + n; i++) for (let j = b - n; j <= b + n; j++) { const l = propGrid.get(i * 10000 + j); if (l) for (const p of l) if (p.type === type && (p.x - x) ** 2 + (p.z - z) ** 2 < r * r) return true; } return false; }
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export function ensureChunk(cx, cz) { const key = cx * 1000 + cz; if (chunkProps.has(key)) return chunkProps.get(key); const L = []; chunkProps.set(key, L);
  for (let j = cz * CH; j < Math.min(NZ, cz * CH + CH); j++) for (let i = cx * CH; i < Math.min(NX, cx * CH + CH); i++) { const t = ti(i, j), k = kind[t]; if (k !== K.SIDE && k !== K.PARK) continue;
    const d = dist[t], h = hash(i, j, 1), x = (i + .5) * T, z = (j + .5) * T; let road = null, water = false, bld = false;
    for (const [di, dj] of N4) { const kk = kij(i + di, j + dj); if ((kk === K.ROAD || kk === K.BRIDGE) && !road) road = [di, dj]; if (kk === K.WATER) water = true; if (kk === K.BLD) bld = true; }
    const put = (ty, px, pz, o) => { const p = addProp(ty, px, pz, o); L.push(p); return p; };
    if (k === K.PARK) { if (h < .13 && !nearSame('tree', x, z, 4.5)) put('tree', x + (hash(i, j, 2) - .5) * 1.5, z + (hash(i, j, 3) - .5) * 1.5, { s: .8 + hash(i, j, 4) * .6 }); else if (h > .995) put('bench', x, z); continue; }
    if (road) { const rs = surf[ti(i + road[0], j + road[1])], boul = rs === S.MAC; const lx = x + road[0] * .7, lz = z + road[1] * .7;
      if (h < .3 && !nearSame('lamp', x, z, boul ? 11 : 12)) { put('lamp', lx, lz, { arc: boul && (d === 1 || d === 7), ry: Math.atan2(road[1], road[0]) }); continue; }
      if (boul && !bld && h > .6 && !nearSame('tree', x, z, 4.8)) { put('tree', x + road[0] * .3, z + road[1] * .3, { s: .9 + hash(i, j, 4) * .4 }); continue; }
      if (boul && h > .55 && h < .6 && !nearSame('tree', x, z, 4.8) && !bld) { put('tree', x, z, { s: 1 }); continue; } }
    if (water && h > .55 && !nearSame('tree', x, z, 5.5)) { put('tree', x, z, { s: 1.05 }); continue; }
    if (h > .9955 && !nearSame('morris', x, z, 30)) put('morris', x, z); else if (h > .991 && h <= .9955 && d !== 0 && !nearSame('wallace', x, z, 40)) put('wallace', x, z);
    else if (h > .987 && h <= .991 && (d === 0 || d === 9 || d === 3 || d === 11) && !nearSame('trough', x, z, 30)) put('trough', x, z);
    else if (h > .983 && h <= .987 && road && surf[ti(i + road[0], j + road[1])] === S.MAC && !nearSame('kiosk', x, z, 40)) put('kiosk', x, z);
    else if (h > .979 && h <= .983 && road && surf[ti(i + road[0], j + road[1])] === S.MAC && !nearSame('pissoir', x, z, 40)) put('pissoir', x, z);
    else if (h > .97 && h <= .979 && road && surf[ti(i + road[0], j + road[1])] === S.MAC) put('bench', x, z, { ry: Math.atan2(road[1], road[0]) }); }
  return L; }
export function propsNear(x, z) { const out = []; const a = Math.floor(x / 8), b = Math.floor(z / 8);
  const c0 = Math.floor((x - 8) / CHU), c1 = Math.floor((x + 8) / CHU), d0 = Math.floor((z - 8) / CHU), d1 = Math.floor((z + 8) / CHU);
  for (let c = c0; c <= c1; c++) for (let d = d0; d <= d1; d++) if (c >= 0 && d >= 0 && c < NCX && d < NCZ) ensureChunk(c, d);
  for (let i = a - 1; i <= a + 1; i++) for (let j = b - 1; j <= b + 1; j++) { const l = propGrid.get(i * 10000 + j); if (l) for (const p of l) if (p.alive) out.push(p); } return out; }
export function addDynProp(type, x, z, extra) { const p = addProp(type, x, z, extra); p.dyn = true; dynProps.push(p); setPropM(p); return p; }
