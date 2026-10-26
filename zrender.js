// Zone buildings & set-dressing for the zoning layer (zoning.js data). Vertex-coloured merged geometry per 256-unit region,
// built lazily near the camera and hidden when far (cheap LOD). Churches by style, Baltard market halls, gasometers, factories
// with chimneys, Bercy wine halls, rail goods sheds, Montmartre vines/quarries/shacks/mill, bouquinistes, Seine boats, bandstands, cemeteries.
import * as THREE from './vendor/three.module.js';
import { scene, camera, hillH } from './gfx.js';
import { GB, M } from './models.js';
import { K, T, NX, NZ, kind, ti, inb, hash, chunkProps } from './world.js';
import { ZD, Z, zoneTile } from './zoning.js';
import { ROADS as VROADS } from './vec.js';
GB.round = true;
const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .84, metalness: 0, envMapIntensity: .5 });
const GLOW = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .4, emissive: 0xffb060, emissiveIntensity: 0 });
// palette: painterly period colours
const C = { stone: '#d6c9ab', stone2: '#c2b494', stoneD: '#a39578', gothic: '#b8ae98', slate: '#4e5660', zinc: '#7d8892', lead: '#5d6670', copper: '#6fa08a', gold: '#c9a043', brick: '#9a5a40', brickD: '#7a4632', soot: '#4a4440',
  iron: '#2c3234', glass: '#9fb4b6', wood: '#6e4e32', woodD: '#4a3424', tar: '#2a2622', green: '#2f5a3e', vine: '#5d7a36', soil: '#8a6e4a', gypsum: '#d8d0bc', canvas: '#e6dcc4', red: '#8e2a22', white: '#ece6d8', water: '#6d8a90', moss: '#6f7a5a' };
const prism = (b, w, h, d, x, y, z, col, ry = 0) => { // gable roof along x: triangular prism of width d, ridge height h
  const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2);
  return b.add(g, col, M(x, y, z, 0, ry, 0)); };
const cone = (b, r, h, x, y, z, col, seg = 8) => b.add(new THREE.ConeGeometry(r, h, seg), col, M(x, y + h / 2, z));
const cyl = (b, rt, rb, h, x, y, z, col, seg = 12) => b.add(new THREE.CylinderGeometry(rt, rb, h, seg), col, M(x, y + h / 2, z));
const box = (b, w, h, d, x, y, z, col, ry = 0) => b.add(new THREE.BoxGeometry(w, h, d), col, M(x, y + h / 2, z, 0, ry, 0));
const rbx = (b, w, h, d, x, y, z, col, ry = 0) => b.box(w, h, d, x, y + h / 2, z, col, 0, ry, 0);
const dome = (b, r, x, y, z, col, sy = 1) => { const m = M(x, y, z); m.scale(new THREE.Vector3(1, sy, 1)); return b.add(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), col, m); };
const onion = (b, r, x, y, z, col) => { const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector2(r * Math.sin(Math.PI * Math.pow(t, .8)) * (1 - t * .35) + .02, t * r * 2.2)); } b.add(new THREE.LatheGeometry(pts, 12), col, M(x, y, z)); cone(b, .08, r * .9, x, y + r * 2.2, z, C.gold, 4); };
// ---------- churches ----------
function church(b, w, d, sty, real) { const hw = w / 2, nd = d * .55, ad = d * .22;
  if (sty === 'gothic') { const H = 13; rbx(b, w * .8, H, nd, -w * .05, 0, 0, C.gothic); prism(b, w * .8, 6, nd + .4, -w * .05, H, 0, C.slate);
    for (const s of [-1, 1]) { rbx(b, w * .76, H * .55, ad, -w * .05, 0, s * (nd / 2 + ad / 2), C.stone2); box(b, w * .76, .3, ad + .4, -w * .05, H * .55, s * (nd / 2 + ad / 2), C.lead);
      for (let k = 0; k < 6; k++) { const x = -hw * .8 + k * w * .14; box(b, .7, H * .8, .7, x, 0, s * (nd / 2 + ad + .2), C.stoneD); b.add(new THREE.BoxGeometry(.4, .4, ad * 1.4), C.stoneD, M(x, H * .78, s * (nd / 2 + ad * .55), s * .55, 0, 0)); } }
    cyl(b, nd / 2, nd / 2, H, -hw * .85, 0, 0, C.gothic, 10); cone(b, nd / 2 + .2, 5, -hw * .85, H, 0, C.slate, 10);
    if (real && w > 28) { for (const s of [-1, 1]) { rbx(b, w * .14, H * 1.7, nd * .42, hw * .82, 0, s * nd * .3, C.gothic); box(b, w * .15, .5, nd * .44, hw * .82, H * 1.7, s * nd * .3, C.stoneD); } b.add(new THREE.CircleGeometry(nd * .22, 18), C.iron, M(hw * .9 + .05, H * .95, 0, 0, Math.PI / 2, 0)); }
    else { rbx(b, w * .14, H * 1.4, nd * .5, hw * .82, 0, 0, C.gothic); cone(b, nd * .32, H * 1.1, hw * .82, H * 1.4, 0, C.slate, 8); cone(b, .1, 1.2, hw * .82, H * 2.5, 0, C.gold, 4); }
    cone(b, .5, 6, w * .05, H + 5, 0, C.lead, 6); return; }
  if (sty === 'romanesque') { const H = 9; rbx(b, w * .78, H, nd, -w * .04, 0, 0, C.stone2); prism(b, w * .78, 4, nd + .5, -w * .04, H, 0, '#8a5e48');
    for (const s of [-1, 1]) { rbx(b, w * .7, H * .55, ad * .9, -w * .06, 0, s * (nd / 2 + ad * .45), C.stone2); box(b, w * .7, .25, ad, -w * .06, H * .55, s * (nd / 2 + ad * .45), '#8a5e48'); }
    cyl(b, nd * .45, nd * .45, H * .85, -hw * .82, 0, 0, C.stone2, 14); dome(b, nd * .46, -hw * .82, H * .85, 0, '#8a5e48', .55);
    rbx(b, nd * .55, H * 1.9, nd * .55, hw * .7, 0, 0, C.stone2); for (const s of [-1, 1]) box(b, .25, 1.6, .9, hw * .7 + s * nd * .28, H * 1.6, 0, C.soot, 0);
    cone(b, nd * .42, 4.5, hw * .7, H * 1.9, 0, '#8a5e48', 4); return; }
  if (sty === 'orthodox') { const H = 9; rbx(b, w * .6, H, d * .6, 0, 0, 0, C.white); for (const [x, z] of [[0, 0]]) { cyl(b, d * .15, d * .15, 3, x, H, z, C.white, 12); onion(b, d * .17, x, H + 3, z, C.gold); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(b, d * .07, d * .07, 2.5, sx * w * .22, H, sz * d * .22, C.white, 10); onion(b, d * .08, sx * w * .22, H + 2.5, sz * d * .22, C.gold); } rbx(b, w * .2, H * .8, d * .35, w * .38, 0, 0, C.white); return; }
  if (sty === 'synagogue') { const H = 11; rbx(b, w * .85, H, d * .8, 0, 0, 0, '#d8c7a4'); box(b, w * .86, .5, d * .82, 0, H, 0, C.zinc); for (const s of [-1, 1]) { rbx(b, w * .12, H + 4, w * .12, w * .38, 0, s * d * .32, '#c9b38a'); dome(b, w * .07, w * .38, H + 4, s * d * .32, C.copper, 1.2); }
    b.add(new THREE.CircleGeometry(d * .14, 16), C.glass, M(w * .425 + .03, H * .7, 0, 0, Math.PI / 2, 0)); return; }
  // classical / baroque: temple front, nave, dome or lantern
  const H = sty === 'baroque' ? 12 : 11; rbx(b, w * .74, H, nd, -w * .08, 0, 0, C.stone); prism(b, w * .74, 3.2, nd + .4, -w * .08, H, 0, C.slate);
  for (const s of [-1, 1]) { rbx(b, w * .66, H * .6, ad, -w * .1, 0, s * (nd / 2 + ad / 2), C.stone2); box(b, w * .66, .25, ad + .3, -w * .1, H * .6, s * (nd / 2 + ad / 2), C.lead); }
  if (sty === 'classical') { rbx(b, w * .16, 1, nd * 1.1, hw * .8, 0, 0, C.stoneD); for (let k = 0; k < 6; k++) cyl(b, .45, .5, H * .8, hw * .9, 1, -nd * .45 + k * nd * .18, C.white, 10); box(b, w * .18, 1, nd * 1.05, hw * .82, H * .8 + 1, 0, C.stone);
    prism(b, w * .18, 2.6, nd * 1.05, hw * .82, H * .8 + 2, 0, C.stone2, Math.PI / 2 * 0); if (w > 26) { cyl(b, nd * .2, nd * .2, 2, -w * .08, H + 1.2, 0, C.stone, 12); dome(b, nd * .2, -w * .08, H + 3.2, 0, C.slate, 1.1); } else { rbx(b, 2, 4, 2, -hw * .6, H, 0, C.stone); cone(b, 1.3, 2, -hw * .6, H + 4, 0, C.slate, 8); } }
  else { rbx(b, w * .12, H * 1.25, nd * 1.05, hw * .8, 0, 0, C.stone); rbx(b, w * .1, H * .5, nd * .7, hw * .8, H * 1.25, 0, C.stone); for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(H * .22, .35, 5, 10, Math.PI / 2), C.stone2, M(hw * .8, H * 1.25, s * nd * .35, 0, Math.PI / 2, s > 0 ? 0 : Math.PI / 2));
    for (let k = 0; k < 4; k++) cyl(b, .4, .45, H * 1.1, hw * .87, 0, -nd * .36 + k * nd * .24, C.white, 8); prism(b, w * .1, 2.2, nd * .72, hw * .8, H * 1.75, 0, C.stone2);
    cyl(b, nd * .3, nd * .3, 3, -w * .12, H + 1.5, 0, C.stone, 14); dome(b, nd * .31, -w * .12, H + 4.5, 0, C.slate, 1.3); cyl(b, .7, .8, 2, -w * .12, H + 4.5 + nd * .4, 0, C.stone, 8); cone(b, .8, 1.5, -w * .12, H + 6.5 + nd * .4, 0, C.lead, 8); } }
// ---------- markets, industry, rail ----------
function hall(b, w, d) { const H = 6.5; rbx(b, w, 1.2, d, 0, 0, 0, C.brick); for (let x = -w / 2 + 2; x <= w / 2 - 2; x += 4) for (const s of [-1, 1]) box(b, .35, H, .35, x, 0, s * (d / 2 - .3), C.iron);
  box(b, w, .4, d, 0, H, 0, C.iron); prism(b, w + 1, 2.4, d + 1.2, 0, H + .4, 0, C.zinc); box(b, w * .9, 1.4, d * .32, 0, H + 2.2, 0, C.glass); prism(b, w * .9, 1.2, d * .38, 0, H + 3.6, 0, C.zinc);
  for (const s of [-1, 1]) { box(b, w * .98, 3.2, .15, 0, 2.2, s * (d / 2 - .25), '#3a4a48'); } }
function gasometer(b, r) { const H = r * 1.25; cyl(b, r * .96, r * .96, H * .78, 0, 0, 0, '#56606a', 24); dome(b, r * .96, 0, H * .78, 0, '#4a525a', .14); const n = 12;
  for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; box(b, .5, H, .5, Math.cos(a) * r, 0, Math.sin(a) * r, C.iron); } for (const y of [H * .33, H * .66, H]) b.add(new THREE.TorusGeometry(r, .18, 4, 28), C.iron, M(0, y, 0, Math.PI / 2, 0, 0)); }
function factory(b, w, d, chim, k) { const H = 5.5; rbx(b, w, H, d, 0, 0, 0, k % 2 ? C.brick : C.brickD); const n = Math.max(2, Math.round(w / 4));
  for (let q = 0; q < n; q++) { const x = -w / 2 + (q + .5) * w / n; const s = new THREE.Shape(); s.moveTo(-w / n / 2, 0); s.lineTo(w / n / 2, 0); s.lineTo(w / n / 2, 2.2); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); b.add(g, q % 2 ? C.zinc : C.lead, M(x, H, 0)); box(b, .2, 2.0, d * .98, x + w / n / 2 - .12, H, 0, C.glass); }
  if (chim) { const cx = w / 2 - 1.6, cz = d / 2 - 1.6; rbx(b, 2.6, 2.4, 2.6, cx, 0, cz, C.brickD); cyl(b, .7, 1.05, 22, cx, 2.4, cz, C.brick, 10); cyl(b, .85, .85, .6, cx, 24.2, cz, C.soot, 10); } }
function warehouse(b, w, d) { const H = 5; rbx(b, w, H, d, 0, 0, 0, '#cdbd9c'); prism(b, w + .6, 2.6, d + .8, 0, H, 0, '#8c6450'); for (let x = -w / 2 + 2.5; x < w / 2 - 1; x += 3.6) box(b, 1.4, 2.6, .2, x, 0, d / 2 + .05, C.woodD);
  for (let q = 0; q < 6; q++) cyl(b, .5, .5, 1.1, -w / 2 + 2 + q * 1.3, 0, d / 2 + 1.4, C.wood, 8); } // wine barrels on the quay
function shed(b, w, d) { const H = 5; for (let x = -w / 2 + 1; x <= w / 2 - 1; x += 3.5) for (const s of [-1, 1]) box(b, .3, H, .3, x, 0, s * (d / 2 - .4), C.iron); box(b, w, .3, d, 0, H, 0, C.iron); prism(b, w, 1.6, d + .8, 0, H + .3, 0, C.zinc); box(b, w * .96, .2, d * .25, 0, H + 1.5, 0, C.glass);
  rbx(b, w * .8, .7, d * .5, 0, 0, 0, C.stoneD); for (let q = 0; q < 4; q++) rbx(b, 1.4, 1.2, 1, -w / 3 + q * 2.2, .7, 0, C.wood); }
// ---------- Montmartre ----------
function vines(b, w, d) { box(b, w, .06, d, 0, 0, 0, C.soil); for (let v = -d / 2 + 1; v < d / 2; v += 1.4) { box(b, w - 1, .05, .35, 0, .06, v, '#6e5638'); for (let u = -w / 2 + 1; u < w / 2 - .5; u += 1.1) { box(b, .08, 1.1, .08, u, 0, v, C.woodD); b.sph(.42, u + .2, .95, v, (hash(u * 10 | 0, v * 10 | 0, 3) < .5 ? C.vine : '#4e6a2e'), 1, .7, 1, 5); } } }
function quarry(b, r) { cyl(b, r, r * 1.08, .12, 0, 0, 0, C.gypsum, 20); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28 + .3, rr = r * (.75 + hash(k, 2, 5) * .2); b.box(r * .5, 2 + hash(k, 1, 5) * 3, r * .35, Math.cos(a) * rr, 1.5, Math.sin(a) * rr, k % 2 ? '#cfc4aa' : '#bfb394', 0, -a, 0); }
  cyl(b, r * .5, r * .5, .14, 0, 0, 0, '#a89c80', 16); box(b, 2.4, 1.2, 1.4, r * .2, 0, -r * .1, C.woodD); for (let k = 0; k < 3; k++) rbx(b, .9, .7, .9, -r * .2 + k * 1.2, 0, r * .25, C.gypsum); }
function shack(b, k) { rbx(b, 4, 2.2, 3, 0, 0, 0, k % 3 ? '#7a6248' : '#8a7a62'); prism(b, 4.4, 1.0, 3.4, 0, 2.2, 0, k % 2 ? '#6a7076' : '#5a4a3a'); box(b, .8, 1.6, .1, 2.0, 0, .4, C.woodD); if (k % 2) for (let q = 0; q < 5; q++) box(b, .08, 1, .08, -2.5 + q * 1.2, 0, 2.3, C.woodD); }
function mill(b) { cyl(b, 1.3, 1.9, 6, 0, 0, 0, '#7a5a3e', 10); cone(b, 1.6, 2, 0, 6, 0, C.slate, 10); box(b, 1, 1, 1, 1.5, 5, 0, C.wood); for (let k = 0; k < 4; k++) b.add(new THREE.BoxGeometry(.1, 5, .9), C.canvas, M(2.05, 5.5, 0, k * Math.PI / 2 + .4, 0, 0).multiply(M(0, 2.4, 0))); }
// ---------- the Seine ----------
function bouq(b, k) { for (let q = 0; q < 2; q++) { const x = -.9 + q * 1.8; box(b, 1.7, .75, .6, x, .75, 0, '#2e4a36'); b.add(new THREE.BoxGeometry(1.7, .06, .55), '#2e4a36', M(x, 1.75, -.3, -1.1, 0, 0)); for (let n = 0; n < 6; n++) box(b, .24, .12, .4, x - .6 + n * .25, 1.5, 0, ['#8a3a2a', '#c8b890', '#3a4a6a', '#6a5a3a'][(n + k) % 4]); } box(b, 3.6, .75, .1, 0, 0, .25, C.stoneD); }
function boat(b, t) { if (t === 'barge') { rbx(b, 15, 1.4, 3.6, 0, -.6, 0, C.tar); box(b, 13, .1, 3.2, 0, .8, 0, C.woodD); for (let q = 0; q < 3; q++) b.sph(1.1, -4.5 + q * 4, .9, 0, ['#5a4a3a', '#b8a888', '#3a3634'][q], 1.6, .5, 1.1, 6); rbx(b, 2, 1.4, 2.6, 6, .8, 0, C.wood); return; }
  if (t === 'lavoir') { rbx(b, 16, 1, 5, 0, -.4, 0, C.woodD); rbx(b, 14, 2.4, 4.2, 0, .6, 0, '#8a7a5e'); prism(b, 14.4, 1.4, 4.8, 0, 3, 0, '#5d6268'); for (let q = 0; q < 8; q++) box(b, .9, .05, .7, -6 + q * 1.7, 2.2, 2.4, C.white); return; }
  if (t === 'bains') { rbx(b, 22, .8, 9, 0, -.3, 0, C.woodD); for (const s of [-1, 1]) rbx(b, 22, 2.4, 1.8, 0, .5, s * 3.6, '#e2d8c0'); for (const s of [-1, 1]) rbx(b, 1.8, 2.4, 5.4, s * 10, .5, 0, '#e2d8c0'); box(b, 18, .05, 5, 0, .45, 0, C.water); for (let q = 0; q < 6; q++) box(b, .1, 1.2, .1, -9 + q * 3.6, 2.9, 3.6, C.red); return; }
  rbx(b, 13, 1.2, 3, 0, -.4, 0, '#2e3a44'); rbx(b, 8, 1.8, 2.4, -1, .8, 0, C.white); box(b, 8.4, .15, 2.8, -1, 2.6, 0, C.red); cyl(b, .35, .35, 2.4, 2, 2.6, 0, C.soot, 8); }
function band(b) { cyl(b, 3, 3.2, .9, 0, 0, 0, C.stone, 8); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; cyl(b, .1, .1, 3, Math.cos(a) * 2.8, .9, Math.sin(a) * 2.8, C.iron, 6); } cone(b, 3.4, 1.6, 0, 3.9, 0, '#3e6a52', 8); cone(b, .25, .8, 0, 5.5, 0, C.gold, 6); b.add(new THREE.TorusGeometry(2.9, .06, 4, 16), C.iron, M(0, 1.6, 0, Math.PI / 2, 0, 0)); }
function stall(b, k) { box(b, 2.2, .8, 1.2, 0, 0, 0, C.wood); box(b, 2.0, .2, 1.0, 0, .8, 0, ['#a83a2a', '#d0a040', '#5a8a3a', '#e0d8c0'][k % 4]); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(b, .06, 2.1, .06, sx * 1.1, 0, sz * .6, C.woodD);
  prism(b, 2.6, .5, 1.6, 0, 2.1, 0, k % 2 ? '#e8e0cc' : '#9a2a24'); }
// tombs on cemetery park tiles: steles, slabs and chapel tombs on a deterministic grid
function tombs(b, x0, z0, x1, z1) { for (let z = z0; z < z1; z += 2.6) for (let x = x0; x < x1; x += 2.2) { const i = Math.floor(x / T), j = Math.floor(z / T); if (!inb(i, j) || kind[ti(i, j)] !== K.PARK || zoneTile(i, j) !== Z.cemetery) continue;
    const h = hash(i, j, 41); if (h < .25) continue; const px = x + (hash(i, j, 42) - .5) * .5, pz = z + (hash(i, j, 43) - .5) * .5, y = hillH(px, pz);
    if (h > .93) { rbx(b, 1.6, 2.4, 2, px, y, pz, '#b8b0a0'); prism(b, 1.8, .8, 2.2, px, y + 2.4, pz, '#8a8478'); }
    else if (h > .6) { rbx(b, .9, .12, 1.8, px, y, pz, '#a8a094'); box(b, .8, 1.1, .18, px, y, pz - .85, '#bcb4a6'); }
    else { box(b, .7, .9, .16, px, y, pz, h > .45 ? '#9c968a' : '#c4bcae'); } } }
// ---------- region build / LOD ----------
const RS = 256, REG = new Map();
const put = (k, f) => { (REG.get(k) || REG.set(k, { items: [], g: null }).get(k)).items.push(f); };
const at = (x, z, f) => put(Math.floor(x / RS) + ',' + Math.floor(z / RS), f);
const place = (B, x, z, a, f) => { const b = new GB(); f(b); const g = b.geo(); g.applyMatrix4(M(x, hillH(x, z), z, 0, -a, 0)); B.push(g); };
for (const c of ZD.churches) at(c[1], c[2], B => place(B, c[1], c[2], c[5], b => church(b, c[3], c[4], c[6], c[7])));
for (const h of ZD.halls) at(h[1], h[2], B => place(B, h[1], h[2], h[5], b => hall(b, h[3], h[4])));
for (const g of ZD.gaso) at(g[1], g[2], B => place(B, g[1], g[2], 0, b => gasometer(b, g[3])));
ZD.fact.forEach((f, k) => at(f[1], f[2], B => place(B, f[1], f[2], f[5], b => factory(b, f[3], f[4], f[6], k))));
for (const w of ZD.ware) at(w[1], w[2], B => place(B, w[1], w[2], w[5], b => warehouse(b, w[3], w[4])));
for (const s of ZD.sheds) at(s[1], s[2], B => place(B, s[1], s[2], s[5], b => shed(b, s[3], s[4])));
for (const v of ZD.vines) at(v[0], v[1], B => place(B, v[0], v[1], v[4], b => vines(b, v[2], v[3])));
for (const q of ZD.quar) at(q[0], q[1], B => place(B, q[0], q[1], 0, b => quarry(b, q[2])));
ZD.shacks.forEach((s, k) => at(s[0], s[1], B => place(B, s[0], s[1], s[2], b => shack(b, k))));
for (const m of ZD.mills) at(m[1], m[2], B => place(B, m[1], m[2], .6, b => mill(b)));
ZD.bouq.forEach((q, k) => at(q[0], q[1], B => place(B, q[0], q[1], q[2] + Math.PI / 2, b => bouq(b, k))));
// keep moored boats clear of bridge decks (hull ~16 long: test bow, midships and stern against every bridge segment)
const BRS = VROADS.filter(r => r.br), segD = (x, z, p, i) => { const ax = p[i], az = p[i + 1], dx = p[i + 2] - ax, dz = p[i + 3] - az, l = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l)); return Math.hypot(x - ax - t * dx, z - az - t * dz); };
const nearBridge = (x, z, a) => { for (const r of BRS) { const [x0, z0, x1, z1] = r.bb; if (x < x0 - 12 || x > x1 + 12 || z < z0 - 12 || z > z1 + 12) continue; for (const s of [-8, 0, 8]) { const px = x + Math.cos(a) * s, pz = z + Math.sin(a) * s; for (let i = 0; i + 3 < r.p.length; i += 2) if (segD(px, pz, r.p, i) < r.pw / 2 + 3) return true; } } return false; };
for (const o of ZD.boats) if (!nearBridge(o[1], o[2], o[3])) at(o[1], o[2], B => place(B, o[1], o[2], o[3], b => boat(b, o[0])));
for (const o of ZD.bands) at(o[0], o[1], B => place(B, o[0], o[1], 0, b => band(b)));
ZD.stalls.forEach((s, k) => at(s[0], s[1], B => place(B, s[0], s[1], s[2], b => stall(b, k))));
for (let rz = 0; rz * RS < NZ * T; rz++) for (let rx = 0; rx * RS < NX * T; rx++) put(rx + ',' + rz, B => { const b = new GB(); tombs(b, rx * RS, rz * RS, (rx + 1) * RS, (rz + 1) * RS); if (b.p.length) B.push(b.geo()); });
function merge(list) { let n = 0; for (const g of list) n += g.attributes.position.count; const P = new Float32Array(n * 3), N = new Float32Array(n * 3), Cc = new Float32Array(n * 3); let o = 0;
  for (const g of list) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); Cc.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; g.dispose(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); g.computeBoundingSphere(); return g; }
function build(k, R) { const B = []; for (const f of R.items) f(B); if (!B.length) { R.g = 'empty'; return; } const m = new THREE.Mesh(merge(B), MAT); m.castShadow = true; m.receiveShadow = true; m.name = 'zone:' + k; m.matrixAutoUpdate = false; R.g = m; scene.add(m); }
let budget = 0;
function tick(force) { const cx = camera.position.x, cz = camera.position.z; budget = force ? 1e9 : 3;
  for (const [k, R] of REG) { const [a, b] = k.split(',').map(Number), dx = Math.max(0, Math.abs(cx - (a + .5) * RS) - RS / 2), dz = Math.max(0, Math.abs(cz - (b + .5) * RS) - RS / 2), near = dx * dx + dz * dz < 260 * 260;
    if (near && !R.g && budget-- > 0) build(k, R); if (R.g && R.g !== 'empty') { R.g.visible = near; if (dx * dx + dz * dz > 700 * 700) { scene.remove(R.g); R.g.geometry.dispose(); R.g = null; } } }
  if (!force) requestAnimationFrame(() => tick()); }
tick();
export function zrenderAll() { for (const [k, R] of REG) if (!R.g) build(k, R); } // tests / screenshots
export const ZREG = REG;
window.__ZR = { all: zrenderAll, near: () => tick(true), REG };
