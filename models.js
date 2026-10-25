// Low-poly 3D models: pedestrians (costumes, walk/run), horses (galloping legs), carriages, trams, trains.
import * as THREE from './vendor/three.module.js';
const C = new THREE.Color();
// --- tiny vertex-coloured geometry builder ---
// bevelled/rounded box: vertices pushed onto a rounded shell so nothing reads as a hard cube
const RBC = new Map();
export function rbox(w, h, d, rr) { const m = Math.min(w, h, d); if (m < .045) return new THREE.BoxGeometry(w, h, d); const key = w.toFixed(3) + h.toFixed(3) + d.toFixed(3) + (rr || 0); if (RBC.has(key)) return RBC.get(key).clone();
  const sg = m > .3 ? 4 : 3, rh = Math.min(rr || Math.max(m * .32, Math.min(w, d) * .16), w * .45, d * .45, .45), ry = Math.min(rr || m * .32, h * .45, rh), g = new THREE.BoxGeometry(w, h, d, sg, sg, sg), P = g.attributes.position, N = g.attributes.normal, hx = w / 2 - rh, hy = h / 2 - ry, hz = d / 2 - rh, v = new THREE.Vector3(), q = new THREE.Vector3();
  for (let k = 0; k < P.count; k++) { v.fromBufferAttribute(P, k); q.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z))); v.sub(q); if (v.lengthSq() < 1e-12) v.fromBufferAttribute(N, k); v.set(v.x / rh, v.y / ry, v.z / rh).normalize(); P.setXYZ(k, q.x + v.x * rh, q.y + v.y * ry, q.z + v.z * rh); v.set(v.x / rh, v.y / ry, v.z / rh).normalize(); N.setXYZ(k, v.x, v.y, v.z); }
  RBC.set(key, g); return g.clone(); }
export class GB { static smooth = true; static round = true; constructor() { this.p = []; this.n = []; this.c = []; }
  add(geo, col, m) { const hadN = !!geo.attributes.normal; const g = geo.index ? geo.toNonIndexed() : geo; if (m) g.applyMatrix4(m); if (!hadN || !GB.smooth) g.computeVertexNormals(); const P = g.attributes.position.array, Nn = g.attributes.normal.array; C.set(col);
    const cols = Array.isArray(col) ? null : [C.r, C.g, C.b];
    for (let k = 0; k < P.length; k += 3) { this.p.push(P[k], P[k + 1], P[k + 2]); this.n.push(Nn[k], Nn[k + 1], Nn[k + 2]); this.c.push(...cols); } return this; }
  box(w, h, d, x, y, z, col, rx = 0, ry = 0, rz = 0) { return this.add(GB.round ? rbox(w, h, d) : new THREE.BoxGeometry(w, h, d), col, M(x, y, z, rx, ry, rz)); }
  cyl(rt, rb, h, x, y, z, col, seg = 8, rx = 0, ry = 0, rz = 0) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), col, M(x, y, z, rx, ry, rz)); }
  sph(r, x, y, z, col, sx = 1, sy = 1, sz = 1, seg = 6) { const m = M(x, y, z); m.scale(new THREE.Vector3(sx, sy, sz)); seg = Math.round(seg * 1.4); return this.add(new THREE.SphereGeometry(r, seg, Math.max(3, seg - 2)), col, m); }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.computeBoundingSphere(); return g; } }
const _q = new THREE.Quaternion(), _e = new THREE.Euler();
export function M(x, y, z, rx = 0, ry = 0, rz = 0) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), new THREE.Vector3(1, 1, 1)); }
export const VC = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .78, metalness: 0, envMapIntensity: .6 });
const VCw = new THREE.MeshLambertMaterial({ vertexColors: true, color: 0x2a2420 }); // charred
export const charMat = VCw;
const lampOn = new THREE.MeshBasicMaterial({ color: 0xffd890 }); export const LAMPMAT = lampOn;
const BLOBT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(.55, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
export const BLOBM = new THREE.MeshBasicMaterial({ map: BLOBT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, toneMapped: false });
const BLOBG = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
export function blob(g, sx, sz, x = 0) { const m = new THREE.Mesh(BLOBG, BLOBM); m.scale.set(sx, 1, sz); m.position.set(x, .035, 0); m.renderOrder = -1; m.userData.blob = 1; g.add(m); return m; }
function mk(gb, mat = VC) { const m = new THREE.Mesh(gb.geo(), mat); m.castShadow = true; return m; }
const GC = new Map(); function cached(key, f) { if (!GC.has(key)) GC.set(key, f()); return GC.get(key); }
// ================= PEDESTRIANS =================
// look: {coat, trou, hat:'top'|'bowler'|'kepi'|'cap'|'bonnet'|'none'|'helmet'|'beret', hatc, skin, dress, stripes, long, apron, scarf}
export const LOOKS = {
  bourgeois: () => ({ coat: pick(['#22222a', '#3a2e28', '#2a3038', '#1c1c1c']), trou: pick(['#2a2a30', '#5a5450', '#3a3430']), hat: 'top', hatc: '#151515', long: true, cane: Math.random() < .5, watch: Math.random() < .5 }),
  clerk: () => ({ coat: pick(['#4a4038', '#3a3a44', '#5a4a3a']), trou: '#3a3530', hat: 'bowler', hatc: pick(['#222', '#3a2a1a']), news: Math.random() < .3, cane: Math.random() < .2 }),
  worker: () => ({ coat: pick(['#3a5a8a', '#2e4a72', '#5a4a3a', '#6a6050']), trou: pick(['#4a4038', '#2e3a5a']), hat: 'cap', hatc: pick(['#3a3a3a', '#4a3a2a']), apron: Math.random() < .3 }),
  lady: () => ({ parasol: Math.random() < .35 ? pick(['#f4ece0', '#e8c8d0', '#c8d8e8', '#3a2a3a', '#f0e0a0']) : null, coat: pick(['#7a2a3a', '#2a4a6a', '#4a2a5a', '#6a5a3a', '#2a5a4a', '#8a6a7a', '#c8b8a0']), trou: '#000', hat: 'bonnet', hatc: pick(['#e8d8c0', '#3a2a2a', '#a04060', '#f0f0e0']), dress: true }),
  maid: () => ({ coat: '#2a2a2a', trou: '#000', hat: 'bonnet', hatc: '#f4f0e8', dress: true, apron: true, basket: Math.random() < .6 }),
  artist: () => ({ coat: pick(['#5a3a2a', '#3a4a2a', '#2a2a3a']), trou: '#4a3a2a', hat: 'beret', hatc: pick(['#1a1a1a', '#5a1a1a', '#1a2a4a']), scarf: pick(['#c03020', '#d0a020', '#3060a0']) }),
  apache: () => ({ coat: '#f0f0f0', stripes: '#1a2a5a', trou: '#2a2a2a', hat: 'cap', hatc: '#2a2a2a', scarf: '#b01818' }),
  cop: () => ({ coat: '#1a2448', trou: '#1a2040', hat: 'kepi', hatc: '#1a2040', belt: '#d4b040', long: true }),
  gend: () => ({ coat: '#22285a', trou: '#d8d0c0', hat: 'helmet', hatc: '#2a2a2a', belt: '#d8d8d8' }),
  soldier: () => ({ coat: '#2a3a7a', trou: '#b02020', hat: 'kepi', hatc: '#b02020', belt: '#d8d0b0' }),
  vip: () => ({ coat: pick(['#e8e0f0', '#f0d8e0']), trou: '#000', hat: 'bonnet', hatc: '#6a4a5a', dress: true, scarf: '#f0ebe0' }),
  boss: () => ({ coat: '#0e0e0e', trou: '#111', hat: 'top', hatc: '#0a0a0a', long: true, scarf: '#ece6d8' }),
  player: () => ({ coat: '#7a5a2a', trou: '#3a3a44', hat: 'cap', hatc: '#5a4026', skin: '#e8c0a0', scarf: '#6a2420', apron: false, vest: '#8a6a3a', player: true }),
};
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
export function gangLook(c1, c2) { return { coat: c1, stripes: c1 === '#d8d8d8' || c1 === '#c8c8c8' ? '#1a2a5a' : null, trou: '#2a2a2a', hat: 'cap', hatc: c2 === '#111' ? '#222' : '#2a2a2a', scarf: c2 }; }
const SK = ['#e8c4a0', '#d8b08a', '#c89878', '#a87858', '#f0d0b8'];
const HAIR = ['#2a1a10', '#4a3020', '#1a1410', '#6a4a2a', '#8a6a3a', '#3a2a20', '#9a9088'];
const dk = (c, f = .7) => '#' + new THREE.Color(c).multiplyScalar(f).getHexString();
const lt = (c, f = .25) => '#' + new THREE.Color(c).lerp(new THREE.Color(1, 1, 1), f).getHexString();
// ellipsoid/elliptic-cylinder helpers (sx = front/back depth scale, sz = width scale)
function cylE(b, rt, rb, h, x, y, z, col, sx = 1, sz = 1, seg = 9, rz = 0) { const m = M(x, y, z, 0, 0, rz); m.scale(new THREE.Vector3(sx, 1, sz)); return b.add(new THREE.CylinderGeometry(rt, rb, h, seg), col, m); }
function shade(geo, y0, y1, lo = .62) { const P = geo.attributes.position.array, Cc = geo.attributes.color.array; for (let k = 0; k < P.length; k += 3) { const f = lo + (1 - lo) * Math.min(1, Math.max(0, (P[k + 1] - y0) / (y1 - y0))); Cc[k] *= f; Cc[k + 1] *= f; Cc[k + 2] *= f; } return geo; }
// smooth lathe/capsule helpers
function lathe(b, prof, x, y, z, col, sx = 1, sz = 1, seg = 18, ry = 0, phi0 = 0, phiL = Math.PI * 2) { if (prof[0][1] > prof[prof.length - 1][1]) prof = prof.slice().reverse(); const g = new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), seg, phi0, phiL); g.computeVertexNormals(); const m = M(x, y, z, 0, ry, 0); m.scale(new THREE.Vector3(sx, 1, sz)); return b.add(g, col, m); }
function caps(b, r, len, x, y, z, col, rx = 0, rz = 0, sx = 1, sz = 1) { const g = new THREE.CapsuleGeometry(r, len, 4, 10); const m = M(x, y, z, rx, 0, rz); m.scale(new THREE.Vector3(sx, 1, sz)); return b.add(g, col, m); }
function pedGeos(L) { const key = JSON.stringify(L); return cached('q' + key, () => {
  const hs = key.length * 7 + key.charCodeAt(5) * 3, sk = L.skin || SK[hs % SK.length], hair = L.dress ? HAIR[(hs >> 1) % 6] : HAIR[(hs >> 1) % HAIR.length], b = new GB();
  const coat = L.stripes ? '#f2f2f2' : L.coat, cHi = lt(coat, .12), cDk = dk(coat, .72);
  if (L.dress) { // smooth bodice + bell skirt with flounce ripples and bustle
    lathe(b, [[.001, .78], [.13, .8], [.15, .9], [.135, 1.0], [.16, 1.12], [.19, 1.2], [.13, 1.27], [.06, 1.3]], 0, 0, 0, coat, .8, 1.05);
    const sp = []; for (let k = 0; k <= 14; k++) { const t = k / 14, y = .82 - t * .8; sp.push([.12 + Math.pow(t, 1.5) * .21 + (k % 5 === 4 ? .015 : 0), y]); } sp.push([.001, .02]);
    lathe(b, sp.reverse(), .03, 0, 0, coat, .95, 1, 22);
    b.sph(.18, -.17, .76, 0, cDk, 1, .85, 1.05, 10); // bustle
    lathe(b, [[.15, .84], [.165, .86], [.165, .9], [.15, .92]], 0, 0, 0, L.scarf || dk(coat, .55), .8, 1.06);
    b.sph(.07, .1, 1.08, 0, lt(coat, .5), .5, 1.6, .9, 8); // lace jabot
    if (L.apron) { lathe(b, [[.2, .3], [.2, .3], [.16, .62], [.15, .8]], .05, 0, 0, '#f4f0e8', .98, 1.02, 16, 0, Math.PI * .1, Math.PI * .8); b.sph(.09, .11, 1.05, 0, '#f4f0e8', .5, 1.2, 1.4, 8); }
  } else { // tailored coat: lathe torso with nipped waist, rounded shoulders, tails/skirt
    lathe(b, [[.001, .7], [.15, .71], [.16, .8], [.152, .92], [.168, 1.06], [.19, 1.16], [.17, 1.25], [.1, 1.3], [.06, 1.31]], 0, 0, 0, coat, .74, 1.04);
    for (const s of [-1, 1]) b.sph(.095, -.005, 1.21, s * .175, coat, .95, .8, 1.1, 10); // shoulders
    if (L.stripes) for (let y = .8; y < 1.2; y += .09) lathe(b, [[.17, y - .014], [.176, y], [.17, y + .014]], 0, 0, 0, L.stripes, .75, 1.06);
    if (!L.stripes && !L.apron) { b.sph(.08, .1, 1.12, 0, '#efe8dc', .45, 1.6, .9, 8); b.sph(.032, .13, 1.22, 0, L.scarf || '#151515', .7, 1, 1.5, 6);
      for (const s of [-1, 1]) b.sph(.06, .105, 1.1, s * .07, cDk, .4, 2.1, .7, 7); for (const y of [.86, .95, 1.04]) b.sph(.014, .12, y, .03, '#c8a050', 1, 1, 1, 4); }
    if (L.vest) lathe(b, [[.158, .8], [.162, .95], [.17, 1.1], [.12, 1.2]], .012, 0, 0, L.vest, .74, 1.0, 16, 0, Math.PI * .2, Math.PI * .6);
    const tl = L.long ? .32 : .58; // coat skirt / tails, open at the front
    lathe(b, [[.17, .8], [.18, .72], [.21, (tl + .72) / 2], [.235, tl], [.225, tl - .02]], -.01, 0, 0, coat, .8, 1.02, 18, 0, Math.PI * .62, Math.PI * 1.76);
    b.sph(.012, -.13, .78, .05, cDk); b.sph(.012, -.13, .78, -.05, cDk); // back buttons
    if (L.apron) lathe(b, [[.17, .5], [.175, .6], [.17, .9], [.15, 1.0]], .01, 0, 0, '#c8b8a0', .76, 1.02, 14, 0, Math.PI * .15, Math.PI * .7);
    if (L.belt) { lathe(b, [[.16, .76], [.168, .78], [.168, .81], [.16, .83]], 0, 0, 0, L.belt, .75, 1.06); for (let y = .88; y < 1.2; y += .09) b.sph(.018, .125, y, 0, L.belt, 1, 1, 1, 5); for (const s of [-1, 1]) b.sph(.06, 0, 1.27, s * .19, L.belt, 1, .35, 1.1, 8); }
    lathe(b, [[.001, .66], [.14, .66], [.155, .72], [.15, .76]], 0, 0, 0, dk(L.trou, .9), .74, 1.05, 14); }
  if (L.scarf && !L.dress) lathe(b, [[.08, 1.24], [.12, 1.26], [.11, 1.31], [.07, 1.33]], .01, 0, 0, L.scarf, 1, 1.05, 14);
  const hIdx = b.p.length; // neck & head (built at old scale, then shrunk to realistic ~1/7.5 proportions)
  b.cyl(.06, .07, .1, .01, 1.32, 0, sk, 10); b.sph(.145, .02, 1.47, 0, sk, 1.0, 1.1, .94, 14);
  b.sph(.04, .155, 1.45, 0, sk, .9, .9, .7, 6); for (const s of [-1, 1]) { b.sph(.032, .02, 1.46, s * .14, sk, .55, 1, .45, 6); b.sph(.018, .145, 1.495, s * .05, '#1a1410', .6, 1, 1, 6); b.sph(.03, .145, 1.535, s * .055, dk(hair, .8), .4, .35, 1.2, 5); }
  b.sph(.03, .155, 1.405, 0, '#a85a4a', .5, .4, 1.3, 5);
  b.sph(.152, -.015, 1.51, 0, hair, 1.04, .78, 1, 14); b.sph(.11, -.08, 1.44, 0, hair, .8, .95, 1.15, 10);
  if (!L.dress && !L.player) { const f = hs % 5; if (f === 1 || f === 3) b.sph(.05, .155, 1.42, 0, dk(hair, .85), .5, .45, 1.6, 6); if (f === 2) b.sph(.11, .07, 1.37, 0, dk(hair, .85), .9, .8, 1.1, 8); if (f === 4) { b.sph(.05, .155, 1.42, 0, dk(hair), .5, .45, 1.8, 6); b.sph(.04, .14, 1.35, 0, dk(hair), 1, 1.3, 1, 6); } }
  if (L.dress) { b.sph(.09, -.13, 1.53, 0, hair, 1, .9, 1.1, 9); for (const s of [-1, 1]) b.sph(.04, .03, 1.55, s * .11, hair, 1, 1, 1, 6); }
  const hc = L.hatc, hHi = lt(hc, .1), band = L.hat === 'top' ? '#4a3a3a' : dk(hc, .55);
  const brim = (r, y, c, curl = .02, sx = .9) => lathe(b, [[.1, y], [r * .85, y + .002], [r, y + curl], [r + .012, y + curl + .01], [r * .98, y + curl + .014], [r * .84, y + .012], [.1, y + .01]], -.005, 0, 0, c, sx, 1, 22);
  switch (L.hat) {
    case 'top': lathe(b, [[.001, 1.58], [.13, 1.6], [.125, 1.7], [.13, 1.85], [.138, 1.93], [.13, 1.945], [.001, 1.95]], -.005, 0, 0, hc, .92, 1, 18); lathe(b, [[.132, 1.6], [.134, 1.66], [.13, 1.67]], -.005, 0, 0, band, .93, 1.01, 18); brim(.24, 1.585, hHi, .03); b.sph(.03, -.04, 1.951, .05, lt(hc, .45), 1.4, .1, 1, 5); break;
    case 'bowler': lathe(b, [[.001, 1.75], [.08, 1.745], [.13, 1.71], [.15, 1.65], [.148, 1.6]], -.005, 0, 0, hc, 1.0, 1, 18); lathe(b, [[.151, 1.6], [.152, 1.635], [.149, 1.64]], -.005, 0, 0, band, 1, 1, 18); brim(.21, 1.59, hHi, .035, .92); break;
    case 'kepi': lathe(b, [[.001, 1.77], [.12, 1.77], [.13, 1.7], [.145, 1.6], [.14, 1.57]], -.02, 0, 0, hc, 1, 1, 16); lathe(b, [[.146, 1.57], [.148, 1.61], [.146, 1.615]], -.02, 0, 0, '#14141c', 1, 1, 16); b.sph(.12, .14, 1.57, 0, '#111', .9, .1, 1.1, 10); b.sph(.03, .13, 1.66, 0, '#d4b040', .4, 1, 1, 6); break;
    case 'helmet': b.sph(.165, 0, 1.6, 0, hc, 1.05, 1.1, 1, 14); lathe(b, [[.001, 1.83], [.03, 1.83], [.04, 1.75], [.08, 1.7]], 0, 0, 0, '#d8d8d8', 1, .4, 10); b.sph(.045, .15, 1.62, 0, '#d4b040', .5, 1, 1, 6); break;
    case 'cap': lathe(b, [[.001, 1.68], [.13, 1.675], [.16, 1.64], [.155, 1.6], [.145, 1.57]], -.02, 0, 0, hc, 1.06, 1, 16); b.sph(.12, .14, 1.565, 0, dk(hc, .8), .85, .12, 1.15, 10); b.sph(.02, -.02, 1.685, 0, dk(hc, .7), 1, .5, 1, 5); break;
    case 'beret': lathe(b, [[.001, 1.69], [.12, 1.685], [.2, 1.64], [.18, 1.6], [.145, 1.585]], -.03, 0, 0, hc, 1, 1, 18, 0); b.cyl(.01, .012, .04, -.03, 1.705, 0, hc, 5); break;
    case 'bonnet': b.sph(.16, -.04, 1.53, 0, hc, 1, 1, 1.05, 12); lathe(b, [[.12, 1.45], [.21, 1.52], [.23, 1.58], [.2, 1.6]], .04, 0, 0, hc, .75, 1, 18, 0, -Math.PI * .1, Math.PI * 1.2);
      for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(.012, .012, .2, 6), '#a03050', M(.06, 1.37, s * .1)); b.sph(.05, -.01, 1.68, .08, '#c84060', 1, 1, 1, 7); b.sph(.045, -.06, 1.67, -.04, '#f0e0a0', 1, 1, 1, 7); b.sph(.04, -.02, 1.7, .02, '#5a8a4a', 1, .6, 1, 6); break;
    default: break; }
  for (let k = 0; k < hIdx; k += 3) { b.p[k] *= .86; b.p[k + 2] *= .86; } // slimmer, elegant torso
  for (let k = hIdx; k < b.p.length; k += 3) { b.p[k] = .01 + (b.p[k] - .01) * .72; b.p[k + 1] = 1.31 + (b.p[k + 1] - 1.32) * .72; b.p[k + 2] *= .72; }
  if (L.parasol) { b.cyl(.008, .008, 1.0, .1, 1.35, .26, '#3a2a1a', 5, 0, 0, -.12); lathe(b, [[.001, .17], [.15, .14], [.32, .06], [.42, 0], [.41, -.01], [.001, .16]], .16, 1.8, .26, L.parasol, 1, 1, 16); b.sph(.02, .16, 1.98, .26, '#c8a040'); }
  if (L.cane) { b.cyl(.012, .012, .9, .18, .45, .3, '#1a1410', 6, 0, 0, .12); b.sph(.025, .13, .91, .3, '#c8a040', 1, 1, 1, 6); }
  if (L.basket) { lathe(b, [[.001, 0], [.1, .005], [.12, .08], [.125, .14]], .1, .62, .3, '#8a6a3a', 1, 1, 12); b.sph(.05, .1, .78, .28, '#c8a050', 1, .6, 1, 6); b.sph(.04, .13, .79, .33, '#5a8a3a', 1, .6, 1, 6); }
  if (L.news) b.sph(.12, .18, .95, .29, '#ece4d0', .2, 1.1, .8, 6);
  if (L.watch) b.add(new THREE.TorusGeometry(.06, .006, 4, 10, Math.PI), '#d8b040', M(.125, .98, 0, Math.PI / 2, 0, 0));
  for (let k = 0; k < b.c.length; k += 3) { const l = b.c[k] * .3 + b.c[k + 1] * .59 + b.c[k + 2] * .11; for (let q = 0; q < 3; q++) b.c[k + q] = l + (b.c[k + q] - l) * .72; } // muted, painterly cloth
  const body = shade(b.geo(), .0, 1.3, .74);
  const lg = new GB(); if (L.dress) { lg.cyl(.04, .045, .3, 0, -.4, 0, '#2a2020', 8); } else { caps(lg, .07, .38, 0, -.24, 0, L.trou); lg.cyl(.066, .066, .04, 0, -.47, 0, dk(L.trou, .8), 10); }
  lg.sph(.06, .06, -.53, 0, '#16100c', 1.9, .65, .95, 9);
  const ar = new GB(); ar.sph(.07, 0, -.01, 0, L.dress ? lt(coat, .06) : coat, 1, 1, 1, 9); caps(ar, .062, .3, 0, -.22, 0, coat, 0, 0, 1, 1);
  if (L.dress) ar.sph(.095, 0, -.03, 0, coat, 1, .9, 1, 9);
  if (L.stripes) for (const y of [-.1, -.22, -.34]) ar.cyl(.066, .066, .03, 0, y, 0, L.stripes, 10);
  ar.cyl(.058, .062, .05, 0, -.41, 0, L.dress ? lt(coat, .5) : '#efe8dc', 10); ar.sph(.052, .01, -.47, 0, (L.dress || L.boss) && hs % 2 ? '#f4f0e8' : sk, .9, 1.15, .75, 8);
  return { body, leg: shade(lg.geo(), -.56, 0, .6), arm: ar.geo() }; }); }
// character material: soft rim light so figures pop off the cobbles from above
export const PEDU = { rim: { value: .14 } };
export const PEDM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .72, metalness: 0, envMapIntensity: .55, side: THREE.DoubleSide });
PEDM.onBeforeCompile = sh => { sh.uniforms.uRim = PEDU.rim; sh.fragmentShader = 'uniform float uRim;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  { float fr = pow(1. - clamp(abs(dot(normal, normalize(vViewPosition))), 0., 1.), 2.6); totalEmissiveRadiance += (diffuseColor.rgb * .9 + vec3(.1, .08, .05)) * fr * uRim; totalEmissiveRadiance += diffuseColor.rgb * .05; }`); };
const OUTM = new THREE.MeshBasicMaterial({ color: 0x120c08, side: THREE.BackSide });
OUTM.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * .022;'); };
export const PEDCFG = { outline: false };
const RINGT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(255,210,90,0)'); gr.addColorStop(.62, 'rgba(255,214,100,.12)'); gr.addColorStop(.8, 'rgba(255,224,130,.75)'); gr.addColorStop(.88, 'rgba(255,200,80,.35)'); gr.addColorStop(1, 'rgba(255,190,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
export const RINGM = new THREE.MeshBasicMaterial({ map: RINGT, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
export function makePed(L, mounted) { const G = pedGeos(L), g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const body = new THREE.Mesh(G.body, PEDM); body.castShadow = true; rig.add(body); if (PEDCFG.outline) { const o = new THREE.Mesh(G.body, OUTM); o.userData.blob = 1; body.add(o); }
  const legs = [-1, 1].map(s => { const m = new THREE.Mesh(G.leg, PEDM); m.position.set(0, .56, s * .1); m.castShadow = true; rig.add(m); return m; });
  const arms = [-1, 1].map(s => { const m = new THREE.Mesh(G.arm, PEDM); m.position.set(0, 1.18, s * .235); m.castShadow = true; rig.add(m); return m; });
  let horse = null; if (mounted) { horse = makeHorse('#2a1a12'); g.add(horse.g); rig.position.set(-.1, 1.05, 0); legs.forEach(l => { l.rotation.z = 1.3; l.rotation.x = l.position.z > 0 ? -.35 : .35; }); }
  if (L.player) { const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), RINGM); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; ring.userData.blob = 1; ring.renderOrder = -1; g.add(ring); g.userData.ring = ring; }
  if (mounted) blob(g, 2.6, 1.1); else blob(g, .9, .8);
  g.scale.set(1.3, 1.5, 1.3); return { g, rig, legs, arms, horse, ph: 0, dead: false }; }
// state: sp (units/s), dt, punch, aim
export function animPed(P, sp, dt, punch, dead) {
  if (dead) { if (!P.dead) { P.dead = true; P.rig.rotation.set(0, 0, Math.PI / 2); P.rig.position.y = P.horse ? .2 : .25; P.rig.position.x = P.horse ? 1.2 : -.3; P.legs.forEach(l => l.rotation.set(0, 0, 0)); if (P.horse) killHorse(P.horse); } return; }
  if (P.dead) { P.dead = false; P.rig.rotation.set(0, 0, 0); P.rig.position.set(P.horse ? -.1 : 0, P.horse ? 1.05 : 0, 0); }
  if (P.horse) { animHorse(P.horse, sp, dt); return; }
  P.t = (P.t || 0) + dt; P.sp = (P.sp || 0) + (sp - (P.sp || 0)) * Math.min(1, dt * 8); const v = P.sp, run = v > 5, k = Math.min(1, v * .35);
  P.ph += dt * Math.min(15, 2 + v * 2.2); const s = Math.sin(P.ph), c = Math.cos(P.ph), am = run ? .95 : Math.min(.6, v * .16);
  // legs: forward swing plus knee-lift feel via slight hip raise on the passing leg
  P.legs[0].rotation.z = s * am; P.legs[1].rotation.z = -s * am; P.legs[0].position.y = .56 + Math.max(0, c) * .05 * k; P.legs[1].position.y = .56 + Math.max(0, -c) * .05 * k;
  const br = Math.sin(P.t * 2.1 + P.g.id) * (1 - k); // breathing / weight shift when idle
  P.arms[0].rotation.z = -s * am * .85 + br * .04; P.arms[1].rotation.z = s * am * .85 - br * .04;
  P.arms[0].rotation.x = .1 + Math.abs(s) * .1 * k + (run ? .15 : 0); P.arms[1].rotation.x = -.1 - Math.abs(s) * .1 * k - (run ? .15 : 0);
  P.rig.position.y = Math.abs(c) * (run ? .07 : .025) * k + br * .006; P.rig.rotation.z = run ? -.16 : -v * .015; P.rig.rotation.y = s * .09 * k; P.rig.rotation.x = c * .035 * k + Math.sin(P.t * .7 + P.g.id) * .012 * (1 - k);
  if (P.aim) { P.arms[1].rotation.z = 1.5; P.arms[1].rotation.x = -.05; P.arms[0].rotation.z = 1.1; P.arms[0].rotation.x = .45; P.rig.rotation.y = -.12; }
  if (punch) { P.arms[1].rotation.z = 1.55; P.arms[1].rotation.x = -.2; P.rig.rotation.y = -.25; }
  if (P.g.userData.ring) { const r = P.g.userData.ring; r.rotation.z = P.t * .6; const p = 1 + Math.sin(P.t * 3) * .04; r.scale.set(p, p, p); } }
// ================= HORSES =================
const HC = ['#5a3a22', '#3a2416', '#2a1a12', '#7a5030', '#8a8580', '#1a1410', '#6a4428'];
function horseGeos(col) { return cached('h' + col, () => { const b = new GB(), dk = new THREE.Color(col).multiplyScalar(.55).getStyle(), mu = new THREE.Color(col).multiplyScalar(.75).getStyle(), LE = '#2a1a10', BR = '#c8a040';
  b.sph(.36, 0, 1.13, 0, col, 1.75, .78, .7, 12); b.sph(.32, .5, 1.17, 0, col, 1.05, 1.05, .82, 10); b.sph(.33, -.52, 1.17, 0, col, 1.05, 1, .85, 10); // barrel, chest, rump
  cylE(b, .15, .23, .7, .82, 1.5, 0, col, 1.15, .78, 10, -.75); // neck
  cylE(b, .1, .13, .52, 1.12, 1.66, 0, col, 1, .75, 9, 1.95); b.sph(.08, 1.32, 1.56, 0, mu, 1.2, 1, 1.1, 7); // head + muzzle
  for (const s of [-1, 1]) { b.add(new THREE.ConeGeometry(.035, .13, 5), col, M(1.0, 1.9, s * .06, s * .2, 0, .25)); b.sph(.022, 1.18, 1.71, s * .085, '#0a0806', 1, 1, 1, 4); b.box(.12, .1, .015, 1.15, 1.72, s * .1, LE); } // ears, eyes, blinkers
  for (let k = 0; k < 6; k++) b.box(.12, .08, .06, .66 + k * .08, 1.42 + k * .085, 0, dk, 0, 0, -.75); b.box(.14, .12, .1, 1.0, 1.86, 0, dk, 0, 0, .3); // mane + forelock
  cylE(b, .05, .1, .62, -.92, .9, 0, dk, 1, 1, 7, -.32); b.sph(.07, -.86, 1.2, 0, dk, 1, 1, 1, 5); // tail
  b.add(new THREE.TorusGeometry(.2, .055, 6, 12), LE, M(.66, 1.4, 0, 0, Math.PI / 2, -.75)); b.sph(.03, .74, 1.62, .1, BR, 1, 1, 1, 4); b.sph(.03, .74, 1.62, -.1, BR, 1, 1, 1, 4); // collar + hames knobs
  b.box(.42, .05, .6, .05, 1.42, 0, LE); b.box(.06, .52, .62, .02, 1.17, 0, LE); b.sph(.035, .05, 1.48, 0, BR, 1, 1, 1, 4); // saddle pad + girth + terret
  for (const s of [-1, 1]) { b.box(1.3, .04, .02, .0, 1.3, s * .255, LE, 0, 0, .04); b.box(.03, .03, .4, 1.2, 1.62, s * .0, LE); } // traces & noseband
  b.box(.04, .3, .58, -.55, 1.14, 0, LE, 0, 0, -.2); // breeching
  const lg = new GB(); lg.cyl(.085, .065, .42, 0, -.18, 0, col, 7); lg.cyl(.042, .04, .32, 0, -.54, 0, col, 6); lg.sph(.055, 0, -.7, 0, mu, 1, 1, 1, 5); lg.cyl(.065, .075, .1, 0, -.76, 0, '#1a1410', 7);
  return { body: shade(b.geo(), .8, 1.6, .7), leg: shade(lg.geo(), -.8, 0, .7) }; }); }
export function makeHorse(col) { col = col || HC[Math.floor(Math.random() * HC.length)]; const G = horseGeos(col), g = new THREE.Group(), body = new THREE.Mesh(G.body, VC); body.castShadow = true; g.add(body);
  const legs = [[.5, .15], [.5, -.15], [-.5, .15], [-.5, -.15]].map(([x, z]) => { const m = new THREE.Mesh(G.leg, VC); m.position.set(x, .9, z); m.castShadow = true; g.add(m); return m; }); return { g, body, legs, ph: Math.random() * 6, dead: false }; }
const GAIT = { walk: [0, Math.PI, Math.PI * 1.5, Math.PI * .5], trot: [0, Math.PI, Math.PI, 0], canter: [0, .7, .7, 1.6], gallop: [0, .45, 1.7, 2.2] };
export function animHorse(H, sp, dt) { if (H.dead) return; const moving = sp > .3; H.ph += dt * (moving ? Math.min(16, 4 + sp * .75) : 0); H.t = (H.t || 0) + dt;
  const g = sp < 3.5 ? 'walk' : sp < 7 ? 'trot' : sp < 10 ? 'canter' : 'gallop'; H.gw = H.gw || { ...GAIT }; const off = GAIT[g], am = { walk: .3, trot: .45, canter: .6, gallop: .75 }[g];
  H.off = H.off || off.slice(); for (let k = 0; k < 4; k++) H.off[k] += (off[k] - H.off[k]) * Math.min(1, dt * 6);
  H.legs.forEach((l, k) => { const s = Math.sin(H.ph + H.off[k]); l.rotation.z = moving ? s * am * (k < 2 ? 1 : .85) : 0; l.position.y = .9 + (moving ? Math.max(0, Math.cos(H.ph + H.off[k])) * am * .1 : 0); });
  const bob = g === 'trot' ? Math.abs(Math.sin(H.ph)) * .05 : g === 'walk' ? Math.sin(H.ph * 2) * .015 : Math.sin(H.ph) * .07;
  H.body.position.y = moving ? bob : Math.sin(H.t * 1.3) * .006; H.body.rotation.z = moving ? (g === 'canter' || g === 'gallop' ? Math.sin(H.ph + .6) * .06 : Math.sin(H.ph * 2) * .015) : Math.sin(H.t * .4) * .01; H.g.rotation.z = 0; }
export function killHorse(H) { if (H.dead) return; H.dead = true; H.g.rotation.x = Math.PI / 2; H.g.position.y = .3; H.legs.forEach(l => l.rotation.z = .4); }
// ================= WHEELS =================
const spokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#2a1c10'; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill(); g.fillStyle = '#c8a050'; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fill(); g.clearRect(0, 0, 0, 0);
  g.fillStyle = '#3a2814'; g.beginPath(); g.arc(32, 32, 25, 0, 7); g.fill(); g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(32, 32); g.arc(32, 32, 24, k * .5236 + .08, k * .5236 + .44); g.fill(); } g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#d4a840'; g.beginPath(); g.arc(32, 32, 6, 0, 7); g.fill(); g.strokeStyle = '#1a1208'; g.lineWidth = 4; g.beginPath(); g.arc(32, 32, 29, 0, 7); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
const wheelMat = new THREE.MeshLambertMaterial({ map: spokeTex, transparent: true, alphaTest: .4, side: THREE.DoubleSide });
function wheelPair(r, track, x, y = r) { const g = new THREE.Group(); g.position.set(x, y, 0); const rim = new GB();
  for (const s of [-1, 1]) { const z = s * track / 2; rim.add(new THREE.TorusGeometry(r * .94, .055, 5, 20), '#151210', M(0, 0, z)); rim.add(new THREE.TorusGeometry(r * .85, .04, 4, 20), '#b8902c', M(0, 0, z));
    rim.cyl(.11, .11, .16, 0, 0, z, '#2a1c10', 8, Math.PI / 2); rim.cyl(.06, .06, .2, 0, 0, z + s * .02, '#d4a840', 6, Math.PI / 2);
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; rim.box(.035, r * .78, .03, Math.cos(a) * r * .47, Math.sin(a) * r * .47, z, '#9a7030', 0, 0, a - Math.PI / 2); } }
  rim.cyl(.04, .04, track, 0, 0, 0, '#2a1c10', 5, Math.PI / 2);
  const m = new THREE.Mesh(cached('w' + r.toFixed(2) + track.toFixed(2), () => rim.geo()), VC); m.castShadow = true; g.add(m); return { g, r }; }
// ================= VEHICLES =================
function coachman(b, x, y, col = '#1e1e24', hat = '#111') { b.box(.3, .45, .4, x, y + .25, 0, col); b.box(.22, .22, .22, x + .02, y + .6, 0, '#e0b898'); b.cyl(.13, .12, .28, x, y + .86, 0, hat, 8); b.cyl(.2, .2, .03, x, y + .72, 0, hat, 10); }
function lampGeo(b, x, y, z) { b.box(.1, .5, .1, x, y - .2, z, '#1a1a1a'); }
const LAMPG = new THREE.CylinderGeometry(.08, .1, .24, 6);
export function makeVeh(type, d) { const g = new THREE.Group(), b = new GB(), out = { g, wheels: [], horses: [], lamps: [], cars: [] };
  const L = d.len, W = d.wid, h2 = L / 2; let lampAt = [];
  const panel = (x, y, z, w, h, dd, c) => b.add(rbox(w, h, dd, Math.min(h, dd) * .42), c, M(x, y, z));
  switch (type) {
    case 'brougham': case 'police': { const c = d.body, tr = d.roof; panel(-.2, 1.45, 0, 2.3, 1.3, W * .9, c); b.box(2.4, .1, W * .95, -.2, 2.14, 0, tr); b.box(2.0, .06, W * .8, -.2, 2.2, 0, tr);
      for (const s of [-1, 1]) { b.box(.7, .55, .02, .35, 1.6, s * W * .45, '#8aa0a8'); b.box(.6, .55, .02, -.65, 1.6, s * W * .45, '#8aa0a8'); b.box(.06, 1.2, .03, -.15, 1.45, s * W * .46, '#c8a040'); }
      b.box(.8, .5, W * .8, 1.3, 1.25, 0, c); b.box(.6, .12, W * .75, 1.35, 1.65, 0, '#3a2a1a'); coachman(b, 1.3, 1.6, type === 'police' ? '#1a2448' : '#2a2a30', type === 'police' ? '#1a2040' : '#111');
      b.box(L * .9, .12, .12, 0, .8, W * .3, '#2a1c10'); b.box(L * .9, .12, .12, 0, .8, -W * .3, '#2a1c10');
      if (type === 'police') { b.box(1.6, .3, .02, -.2, 1.0, W * .46, '#d8d0a0'); b.box(1.6, .3, .02, -.2, 1.0, -W * .46, '#d8d0a0'); }
      for (const s of [-1, 1]) { const z = s * W * .462; b.box(2.3, .05, .02, -.2, 1.28, z, '#c8a040'); b.box(2.3, .05, .02, -.2, 1.92, z, '#c8a040'); b.box(.05, .05, .05, -.5, 1.4, z + s * .02, '#e0c060');
        b.box(.5, .05, .25, -.2, .78, s * W * .55, '#2a1c10'); b.add(new THREE.TorusGeometry(.28, .035, 4, 10, Math.PI), '#1a1410', M(-1.0, 1.0, s * W * .38, 0, 0, Math.PI)); b.add(new THREE.TorusGeometry(.22, .035, 4, 10, Math.PI), '#1a1410', M(1.25, 1.0, s * W * .38, 0, 0, Math.PI));
        b.box(.04, .04, 2.0, -.2, 2.32, 0, '#c8a040'); b.box(2.0, .04, .04, -.2, 2.32, s * W * .38, '#c8a040'); b.sph(.18, -.2, 1.6, z + s * .01, type === 'police' ? '#d8d0a0' : '#c8a040', .6, .6, .1, 8); }
      b.box(.1, 1.0, W * .86, -1.37, 1.45, 0, new THREE.Color(c).multiplyScalar(.7).getStyle()); b.box(.4, .06, W * .7, -1.55, 1.0, 0, '#2a1c10');
      out.wheels.push(wheelPair(.75, W * 1.02, -1.0), wheelPair(.55, W * 1.0, 1.25)); lampAt = [[.95, 1.9, W * .5], [.95, 1.9, -W * .5]]; break; }
    case 'phaeton': { const c = d.body; panel(-.3, 1.05, 0, 1.8, .55, W * .9, c); b.box(1.1, .5, W * .85, -.5, 1.55, 0, '#5a1a10'); b.box(.4, .7, W * .85, -1.0, 1.5, 0, '#3a1a10');
      b.add(new THREE.CylinderGeometry(.75, .75, W * .9, 10, 1, true, 0, Math.PI), d.roof, M(-1.05, 1.5, 0, Math.PI / 2, 0, Math.PI / 2 + .3)); coachman(b, .3, 1.2, '#3a2a40', '#222');
      b.box(L * .9, .1, .1, .2, .75, W * .3, '#2a1c10'); b.box(L * .9, .1, .1, .2, .75, -W * .3, '#2a1c10'); out.wheels.push(wheelPair(.85, W, -.9), wheelPair(.6, W * .95, 1.05)); lampAt = [[.75, 1.5, W * .48], [.75, 1.5, -W * .48]]; break; }
    case 'barouche': { const c = d.body; panel(0, 1.05, 0, 3.4, .6, W * .9, c); b.box(1, .5, W * .85, -.8, 1.55, 0, '#6a2a5a'); b.box(1, .5, W * .85, .5, 1.55, 0, '#6a2a5a');
      b.add(new THREE.CylinderGeometry(.85, .85, W * .9, 10, 1, true, 0, Math.PI * .7), d.roof, M(-1.35, 1.45, 0, Math.PI / 2, 0, Math.PI / 2 + .1)); b.box(.7, .5, W * .7, 1.7, 1.45, 0, c); coachman(b, 1.7, 1.7, '#2a1a3a', '#111');
      b.box(L * .9, .12, .12, 0, .78, W * .3, '#2a1c10'); b.box(L * .9, .12, .12, 0, .78, -W * .3, '#2a1c10'); out.wheels.push(wheelPair(.85, W, -1.3), wheelPair(.65, W, 1.4)); lampAt = [[1.4, 1.9, W * .5], [1.4, 1.9, -W * .5]]; break; }
    case 'gig': { const c = d.body; b.box(1.1, .45, W * .7, 0, 1.25, 0, c); b.box(.6, .4, W * .65, -.2, 1.65, 0, '#3a2a1a'); coachman(b, 0, 1.35, '#4a3a2a', '#2a2a2a');
      b.box(2.8, .08, .08, 1.0, 1.05, .3, '#5a4020'); b.box(2.8, .08, .08, 1.0, 1.05, -.3, '#5a4020'); out.wheels.push(wheelPair(.95, W * 1.05, 0)); lampAt = [[.6, 1.5, W * .4]]; break; }
    case 'omnibus': { const c = d.body; panel(0, 1.55, 0, 5.4, 1.6, W * .92, c); b.box(5.4, .1, W * .98, 0, 2.4, 0, '#2a2a20');
      for (const s of [-1, 1]) for (let k = 0; k < 6; k++) b.box(.6, .6, .02, -2.1 + k * .82, 1.75, s * W * .465, '#7a9aa0'); b.box(5.3, .25, .02, 0, 1.05, W * .465, d.roof); b.box(5.3, .25, .02, 0, 1.05, -W * .465, d.roof);
      for (let k = 0; k < 5; k++) b.box(.25, .35, W * .7, -2 + k * .9, 2.65, 0, '#5a3a1a'); b.box(5.2, .4, .05, 0, 2.7, W * .47, '#e8d8a0'); b.box(5.2, .4, .05, 0, 2.7, -W * .47, '#e8d8a0'); // impériale
      for (let k = 0; k < 4; k++) b.box(.3, .1, .8, -2.75 - k * .1, .8 + k * .45, -W * .2, '#2a2a20'); coachman(b, 2.6, 2.4, '#3a3a2a', '#222'); for (let k = 0; k < 3; k++) { b.box(.25, .5, .3, -1.6 + k * 1.3, 2.9, .3, pick(['#2a2a30', '#7a2a3a', '#3a3a2a'])); b.box(.18, .18, .18, -1.6 + k * 1.3, 3.25, .3, '#e0b898'); }
      out.wheels.push(wheelPair(.85, W * 1.02, -1.8), wheelPair(.7, W * 1.02, 1.8)); lampAt = [[2.75, 2.2, W * .5], [2.75, 2.2, -W * .5]]; break; }
    case 'tram': { const c = d.body; panel(-.6, 1.6, 0, 5.4, 1.8, W * .92, c); b.box(5.6, .12, W, -.6, 2.55, 0, '#3a3a30'); for (const s of [-1, 1]) for (let k = 0; k < 6; k++) b.box(.6, .7, .02, -2.9 + k * .82, 1.95, s * W * .465, '#8aa8b0');
      b.box(5.4, .3, .03, -.6, 1.05, W * .47, d.roof); b.box(5.4, .3, .03, -.6, 1.05, -W * .47, d.roof); for (let k = 0; k < 5; k++) b.box(.3, .35, W * .7, -2.6 + k * 1, 2.8, 0, '#4a3a2a');
      // steam dummy
      b.box(1.5, 2.0, W * .9, 2.8, 1.5, 0, '#2a3a2a'); b.cyl(.18, .22, 1.2, 3.2, 3.0, 0, '#1a1a1a', 8); b.cyl(.3, .3, .12, 3.2, 3.6, 0, '#2a2a2a', 8); out.stack = [3.2, 3.7, 0];
      out.wheels.push(wheelPair(.5, W * .9, -2.3), wheelPair(.5, W * .9, 1.2), wheelPair(.55, W * .9, 2.8)); lampAt = [[3.6, 1.8, W * .4], [3.6, 1.8, -W * .4]]; break; }
    case 'train': { // Crampton locomotive + tender
      b.cyl(.75, .75, 4.6, .7, 1.85, 0, '#1a2a1e', 12, 0, 0, Math.PI / 2); b.cyl(.77, .77, .1, 1.6, 1.85, 0, '#c8a040', 12, 0, 0, Math.PI / 2); b.cyl(.77, .77, .1, -.2, 1.85, 0, '#c8a040', 12, 0, 0, Math.PI / 2);
      b.cyl(.28, .36, 1.3, 2.7, 3.1, 0, '#111', 10); b.cyl(.45, .3, .3, 2.7, 3.85, 0, '#111', 10); b.sph(.35, 1.0, 2.7, 0, '#c8a040', 1, .8, 1); b.box(1.2, 1.7, W * .95, -2.0, 2.2, 0, '#1a2a1e'); b.box(1.4, .15, W, -2.0, 3.1, 0, '#111');
      b.box(L, .3, W * .9, 0, .85, 0, '#2a1010'); b.box(.3, .5, W * .8, 3.0, .7, 0, '#6a1a10'); out.stack = [2.7, 4.0, 0];
      out.wheels.push(wheelPair(1.15, W * .95, -1.6), wheelPair(.55, W * .9, 1.5), wheelPair(.55, W * .9, 2.6)); lampAt = [[3.1, 1.3, W * .35], [3.1, 1.3, -W * .35]];
      // tender & carriages
      const t = new GB(); t.box(3.2, 1.4, W * .9, 0, 1.4, 0, '#1a2a1e'); t.box(3, .5, W * .7, 0, 2.2, 0, '#111'); const tm = mk(t); tm.position.x = -h2 - 1.9; g.add(tm); out.cars.push(tm);
      const tw = wheelPair(.55, W * .9, -h2 - 2.7); const tw2 = wheelPair(.55, W * .9, -h2 - 1.1); g.add(tw.g, tw2.g); out.wheels.push(tw, tw2);
      for (let c = 1; c <= 3; c++) { const cb = new GB(), x0 = -h2 - 3.6 - c * 7.7 + 3.8; const col = c === 1 ? '#1e3a5a' : c === 2 ? '#c8a040' : '#3a5a2a';
        cb.box(7.2, 1.9, W * .95, 0, 1.75, 0, col); cb.box(7.4, .2, W, 0, 2.8, 0, '#2a2a2a'); cb.cyl(W * .5, W * .5, 7.3, 0, 2.6, 0, '#3a3a3a', 10, 0, 0, Math.PI / 2);
        for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { cb.box(.6, .6, .02, -2.8 + k * 1.4, 2.0, s * W * .48, '#a8c0c8'); cb.box(.04, 1.5, .03, -2.3 + k * 1.4, 1.75, s * W * .485, '#c8a040'); }
        const cm = mk(cb); cm.position.x = x0; g.add(cm); out.cars.push(cm); for (const wx of [-2.6, 2.6]) { const w = wheelPair(.5, W * .9, x0 + wx); g.add(w.g); out.wheels.push(w); } }
      break; } }
  const bm = mk(b); g.add(bm); out.body = bm; out.wheels.forEach(w => { if (!w.g.parent) g.add(w.g); });
  for (const [x, y, z] of lampAt) { const m = new THREE.Mesh(LAMPG, lampOn); m.position.set(x, y, z); g.add(m); out.lamps.push(m); }
  // horses
  const nh = d.horses; for (let k = 0; k < nh; k++) { const H = makeHorse(type === 'police' ? '#1a1410' : null); const z = nh === 1 ? 0 : nh === 3 ? (k - 1) * .75 : (k ? .42 : -.42);
    H.g.position.set(h2 + 1.1, 0, z); H.g.scale.setScalar(.95); g.add(H.g); out.horses.push(H); }
  if (nh) { const ss = new GB(); ss.box(1.6, .08, W * .7, h2 + .5, 1.1, 0, '#3a2814'); ss.box(.08, .08, W * .7, h2 + .2, 1.1, 0, '#3a2814'); const sm = mk(ss); g.add(sm); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); blob(g, L * 1.05, W * 1.35); if (out.horses.length) blob(g, 3, W * 1.2, h2 + 1.1); g.traverse(o => { if (o.userData.blob) o.castShadow = false; }); return out; }
export function animVeh(V, sp, dt, signed) { for (const w of V.wheels) w.g.rotation.z -= (signed ?? sp) * dt / w.r; for (const H of V.horses) animHorse(H, sp, dt); }
