// Low-poly 3D models: pedestrians (costumes, walk/run), horses (galloping legs), carriages, trams, trains.
import * as THREE from './vendor/three.module.js';
const C = new THREE.Color();
// --- tiny vertex-coloured geometry builder ---
export class GB { constructor() { this.p = []; this.n = []; this.c = []; }
  add(geo, col, m) { const g = geo.index ? geo.toNonIndexed() : geo; if (m) g.applyMatrix4(m); g.computeVertexNormals(); const P = g.attributes.position.array, Nn = g.attributes.normal.array; C.set(col);
    const cols = Array.isArray(col) ? null : [C.r, C.g, C.b];
    for (let k = 0; k < P.length; k += 3) { this.p.push(P[k], P[k + 1], P[k + 2]); this.n.push(Nn[k], Nn[k + 1], Nn[k + 2]); this.c.push(...cols); } return this; }
  box(w, h, d, x, y, z, col, rx = 0, ry = 0, rz = 0) { return this.add(new THREE.BoxGeometry(w, h, d), col, M(x, y, z, rx, ry, rz)); }
  cyl(rt, rb, h, x, y, z, col, seg = 8, rx = 0, ry = 0, rz = 0) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), col, M(x, y, z, rx, ry, rz)); }
  sph(r, x, y, z, col, sx = 1, sy = 1, sz = 1, seg = 6) { const m = M(x, y, z); m.scale(new THREE.Vector3(sx, sy, sz)); return this.add(new THREE.SphereGeometry(r, seg, Math.max(3, seg - 2)), col, m); }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.computeBoundingSphere(); return g; } }
const _q = new THREE.Quaternion(), _e = new THREE.Euler();
export function M(x, y, z, rx = 0, ry = 0, rz = 0) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), new THREE.Vector3(1, 1, 1)); }
export const VC = new THREE.MeshLambertMaterial({ vertexColors: true });
const VCw = new THREE.MeshLambertMaterial({ vertexColors: true, color: 0x2a2420 }); // charred
export const charMat = VCw;
const lampOn = new THREE.MeshBasicMaterial({ color: 0xffd890 }); export const LAMPMAT = lampOn;
function mk(gb, mat = VC) { const m = new THREE.Mesh(gb.geo(), mat); m.castShadow = true; return m; }
const GC = new Map(); function cached(key, f) { if (!GC.has(key)) GC.set(key, f()); return GC.get(key); }
// ================= PEDESTRIANS =================
// look: {coat, trou, hat:'top'|'bowler'|'kepi'|'cap'|'bonnet'|'none'|'helmet'|'beret', hatc, skin, dress, stripes, long, apron, scarf}
export const LOOKS = {
  bourgeois: () => ({ coat: pick(['#22222a', '#3a2e28', '#2a3038', '#1c1c1c']), trou: pick(['#2a2a30', '#5a5450', '#3a3430']), hat: 'top', hatc: '#151515', long: true }),
  clerk: () => ({ coat: pick(['#4a4038', '#3a3a44', '#5a4a3a']), trou: '#3a3530', hat: 'bowler', hatc: pick(['#222', '#3a2a1a']) }),
  worker: () => ({ coat: pick(['#3a5a8a', '#2e4a72', '#5a4a3a', '#6a6050']), trou: pick(['#4a4038', '#2e3a5a']), hat: 'cap', hatc: pick(['#3a3a3a', '#4a3a2a']), apron: Math.random() < .3 }),
  lady: () => ({ coat: pick(['#7a2a3a', '#2a4a6a', '#4a2a5a', '#6a5a3a', '#2a5a4a', '#8a6a7a', '#c8b8a0']), trou: '#000', hat: 'bonnet', hatc: pick(['#e8d8c0', '#3a2a2a', '#a04060', '#f0f0e0']), dress: true }),
  maid: () => ({ coat: '#2a2a2a', trou: '#000', hat: 'bonnet', hatc: '#f4f0e8', dress: true, apron: true }),
  artist: () => ({ coat: pick(['#5a3a2a', '#3a4a2a', '#2a2a3a']), trou: '#4a3a2a', hat: 'beret', hatc: pick(['#1a1a1a', '#5a1a1a', '#1a2a4a']), scarf: pick(['#c03020', '#d0a020', '#3060a0']) }),
  apache: () => ({ coat: '#f0f0f0', stripes: '#1a2a5a', trou: '#2a2a2a', hat: 'cap', hatc: '#2a2a2a', scarf: '#b01818' }),
  cop: () => ({ coat: '#1a2448', trou: '#1a2040', hat: 'kepi', hatc: '#1a2040', belt: '#d4b040', long: true }),
  gend: () => ({ coat: '#22285a', trou: '#d8d0c0', hat: 'helmet', hatc: '#2a2a2a', belt: '#d8d8d8' }),
  soldier: () => ({ coat: '#2a3a7a', trou: '#b02020', hat: 'kepi', hatc: '#b02020', belt: '#d8d0b0' }),
  vip: () => ({ coat: pick(['#e8e0f0', '#f0d8e0']), trou: '#000', hat: 'bonnet', hatc: '#c03080', dress: true, scarf: '#ffffff' }),
  boss: () => ({ coat: '#0e0e0e', trou: '#111', hat: 'top', hatc: '#0a0a0a', long: true, scarf: '#f4c430' }),
  player: () => ({ coat: '#7a5a2a', trou: '#3a3a44', hat: 'cap', hatc: '#5a4026', skin: '#e8c0a0', scarf: '#2aa0a0', apron: false, vest: '#c89a3a', player: true }),
};
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
export function gangLook(c1, c2) { return { coat: c1, stripes: c1 === '#d8d8d8' || c1 === '#c8c8c8' ? '#1a2a5a' : null, trou: '#2a2a2a', hat: 'cap', hatc: c2 === '#111' ? '#222' : '#2a2a2a', scarf: c2 }; }
const SK = ['#e8c4a0', '#d8b08a', '#c89878', '#a87858', '#f0d0b8'];
function pedGeos(L) { const key = JSON.stringify(L); return cached('p' + key, () => {
  const sk = L.skin || SK[(key.length * 7) % SK.length], b = new GB();
  // torso
  if (L.dress) { b.cyl(.2, .42, .78, 0, .42, 0, L.coat, 10); b.box(.26, .42, .36, 0, 1.0, 0, L.coat); if (L.apron) b.box(.04, .6, .3, .2, .55, 0, '#f4f0e8'); }
  else { b.box(.28, .5, .42, 0, .98, 0, L.stripes ? '#f2f2f2' : L.coat); if (L.stripes) for (let y = .78; y < 1.2; y += .1) b.box(.29, .035, .43, 0, y, 0, L.stripes);
    if (L.vest) b.box(.3, .32, .3, 0, 1.0, 0, L.vest); if (L.long) b.box(.3, .32, .44, -.01, .62, 0, L.coat); if (L.apron) b.box(.05, .55, .32, .15, .72, 0, '#c8b8a0'); if (L.belt) b.box(.3, .06, .44, 0, .76, 0, L.belt); }
  if (L.scarf) b.box(.3, .08, .3, .02, 1.25, 0, L.scarf);
  // head
  b.box(.24, .26, .24, .02, 1.42, 0, sk); b.box(.04, .05, .06, .15, 1.4, 0, sk); // nose
  if (!L.dress && !L.player && key.length % 3 === 0) b.box(.05, .06, .16, .14, 1.34, 0, '#3a2a1a'); // moustache
  const hc = L.hatc;
  switch (L.hat) {
    case 'top': b.cyl(.15, .14, .34, 0, 1.72, 0, hc, 10); b.cyl(.24, .24, .03, 0, 1.56, 0, hc, 12); b.cyl(.152, .152, .05, 0, 1.6, 0, '#3a3a3a', 10); break;
    case 'bowler': b.sph(.15, 0, 1.6, 0, hc, 1, .8, 1); b.cyl(.21, .21, .025, 0, 1.56, 0, hc, 12); break;
    case 'kepi': b.cyl(.13, .14, .2, -.02, 1.64, 0, hc, 10); b.box(.12, .02, .2, .14, 1.56, 0, '#111'); b.cyl(.141, .141, .04, -.02, 1.56, 0, '#1a1a1a', 10); break;
    case 'helmet': b.sph(.16, 0, 1.6, 0, hc, 1, 1.1, 1); b.box(.04, .26, .04, -.02, 1.76, 0, '#c0c0c0'); break;
    case 'cap': b.cyl(.15, .15, .08, -.01, 1.58, 0, hc, 10); b.box(.12, .02, .22, .13, 1.55, 0, hc); break;
    case 'beret': b.cyl(.18, .15, .07, 0, 1.6, 0, hc, 10); break;
    case 'bonnet': b.sph(.17, -.02, 1.55, 0, hc, 1, .9, 1.05); b.cyl(.26, .26, .025, .02, 1.56, 0, hc, 12); b.box(.1, .04, .3, -.1, 1.56, 0, '#a03050'); break;
    default: b.box(.26, .08, .26, -.01, 1.57, 0, '#3a2a1a'); }
  if (L.dress) b.box(.12, .14, .3, -.12, 1.34, 0, '#3a2a1a'); // chignon
  const body = b.geo();
  const lg = new GB(); lg.box(.15, .54, .14, 0, -.27, 0, L.dress ? '#1a1a1a' : L.trou); lg.box(.22, .07, .14, .04, -.54, 0, '#1a1410');
  const ar = new GB(); ar.box(.12, .46, .12, 0, -.21, 0, L.stripes ? '#f2f2f2' : L.coat); if (L.stripes) { ar.box(.13, .035, .13, 0, -.12, 0, L.stripes); ar.box(.13, .035, .13, 0, -.28, 0, L.stripes); } ar.box(.1, .09, .1, 0, -.46, 0, sk);
  return { body, leg: lg.geo(), arm: ar.geo() }; }); }
export function makePed(L, mounted) { const G = pedGeos(L), g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const body = new THREE.Mesh(G.body, VC); body.castShadow = true; rig.add(body);
  const legs = [-1, 1].map(s => { const m = new THREE.Mesh(G.leg, VC); m.position.set(0, .56, s * .1); m.castShadow = true; rig.add(m); return m; });
  const arms = [-1, 1].map(s => { const m = new THREE.Mesh(G.arm, VC); m.position.set(0, 1.18, s * .27); m.castShadow = true; rig.add(m); return m; });
  let horse = null; if (mounted) { horse = makeHorse('#2a1a12'); g.add(horse.g); rig.position.set(-.1, 1.05, 0); legs.forEach(l => { l.rotation.z = 1.3; l.rotation.x = l.position.z > 0 ? -.35 : .35; }); }
  if (L.player) { const ring = new THREE.Mesh(new THREE.RingGeometry(.55, .7, 24), new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: .55, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; g.add(ring); }
  g.scale.setScalar(1.35); return { g, rig, legs, arms, horse, ph: 0, dead: false }; }
// state: sp (units/s), dt, punch, aim
export function animPed(P, sp, dt, punch, dead) {
  if (dead) { if (!P.dead) { P.dead = true; P.rig.rotation.z = Math.PI / 2; P.rig.position.y = P.horse ? .2 : .25; P.rig.position.x = P.horse ? 1.2 : -.3; P.legs.forEach(l => l.rotation.z = 0); if (P.horse) killHorse(P.horse); } return; }
  if (P.dead) { P.dead = false; P.rig.rotation.z = 0; P.rig.position.set(P.horse ? -.1 : 0, P.horse ? 1.05 : 0, 0); }
  if (P.horse) { animHorse(P.horse, sp, dt); return; }
  P.ph += dt * Math.min(16, sp * 2.6); const a = Math.sin(P.ph) * Math.min(.9, sp * .14), run = sp > 5;
  P.legs[0].rotation.z = a; P.legs[1].rotation.z = -a; P.arms[0].rotation.z = -a * .9; P.arms[1].rotation.z = a * .9;
  P.rig.position.y = run ? Math.abs(Math.sin(P.ph)) * .06 : 0; P.rig.rotation.z = run ? -.12 : 0;
  if (punch) { P.arms[1].rotation.z = 1.5; P.arms[1].rotation.x = -.2; } else P.arms[1].rotation.x = 0; }
// ================= HORSES =================
const HC = ['#5a3a22', '#3a2416', '#2a1a12', '#7a5030', '#8a8580', '#1a1410', '#6a4428'];
function horseGeos(col) { return cached('h' + col, () => { const b = new GB(), dk = new THREE.Color(col).multiplyScalar(.6).getStyle();
  b.box(1.25, .52, .5, 0, 1.12, 0, col); b.sph(.3, .55, 1.12, 0, col, 1.1, 1, .9); b.sph(.3, -.55, 1.12, 0, col, 1.1, 1, .9);
  b.box(.62, .28, .26, .82, 1.5, 0, col, 0, 0, .9); b.box(.48, .22, .22, 1.12, 1.68, 0, col, 0, 0, -.35); b.box(.08, .14, .06, 1.0, 1.86, .06, dk); b.box(.08, .14, .06, 1.0, 1.86, -.06, dk);
  b.box(.5, .1, .08, .76, 1.6, 0, dk, 0, 0, .9); // mane
  b.box(.12, .55, .12, -.86, .98, 0, dk, 0, 0, -.5); // tail
  b.box(.7, .06, .54, .05, 1.4, 0, '#1a1410'); // harness saddle pad
  const lg = new GB(); lg.box(.13, .78, .13, 0, -.39, 0, col); lg.box(.15, .1, .15, 0, -.78, 0, '#1a1410'); return { body: b.geo(), leg: lg.geo() }; }); }
export function makeHorse(col) { col = col || HC[Math.floor(Math.random() * HC.length)]; const G = horseGeos(col), g = new THREE.Group(), body = new THREE.Mesh(G.body, VC); body.castShadow = true; g.add(body);
  const legs = [[.5, .15], [.5, -.15], [-.5, .15], [-.5, -.15]].map(([x, z]) => { const m = new THREE.Mesh(G.leg, VC); m.position.set(x, .9, z); m.castShadow = true; g.add(m); return m; }); return { g, body, legs, ph: Math.random() * 6, dead: false }; }
export function animHorse(H, sp, dt) { if (H.dead) return; H.ph += dt * Math.min(18, 2 + sp * .9); const gal = Math.min(1, sp / 6), am = .15 + .55 * gal;
  const off = sp > 9 ? [0, .4, 1.6, 2.0] : [0, Math.PI, Math.PI * .5, Math.PI * 1.5];
  H.legs.forEach((l, k) => l.rotation.z = Math.sin(H.ph + off[k]) * am * (sp > .3 ? 1 : 0)); H.body.position.y = sp > 9 ? Math.sin(H.ph * 2) * .06 : 0; H.g.rotation.z = sp > 9 ? Math.sin(H.ph) * .04 : 0; }
export function killHorse(H) { if (H.dead) return; H.dead = true; H.g.rotation.x = Math.PI / 2; H.g.position.y = .3; H.legs.forEach(l => l.rotation.z = .4); }
// ================= WHEELS =================
const spokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#2a1c10'; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill(); g.fillStyle = '#c8a050'; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fill(); g.clearRect(0, 0, 0, 0);
  g.fillStyle = '#3a2814'; g.beginPath(); g.arc(32, 32, 25, 0, 7); g.fill(); g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(32, 32); g.arc(32, 32, 24, k * .5236 + .08, k * .5236 + .44); g.fill(); } g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#d4a840'; g.beginPath(); g.arc(32, 32, 6, 0, 7); g.fill(); g.strokeStyle = '#1a1208'; g.lineWidth = 4; g.beginPath(); g.arc(32, 32, 29, 0, 7); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
const wheelMat = new THREE.MeshLambertMaterial({ map: spokeTex, transparent: true, alphaTest: .4, side: THREE.DoubleSide });
function wheelPair(r, track, x, y = r) { const g = new THREE.Group(); g.position.set(x, y, 0); const rim = new GB(); for (const s of [-1, 1]) rim.add(new THREE.TorusGeometry(r * .95, .05, 4, 16), '#1a1208', M(0, 0, s * track / 2)); rim.cyl(.04, .04, track, 0, 0, 0, '#2a1c10', 4, Math.PI / 2);
  const m = mk(rim); g.add(m); for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.CircleGeometry(r * .97, 16), wheelMat); d.position.z = s * track / 2; d.castShadow = true; g.add(d); } return { g, r }; }
// ================= VEHICLES =================
function coachman(b, x, y, col = '#1e1e24', hat = '#111') { b.box(.3, .45, .4, x, y + .25, 0, col); b.box(.22, .22, .22, x + .02, y + .6, 0, '#e0b898'); b.cyl(.13, .12, .28, x, y + .86, 0, hat, 8); b.cyl(.2, .2, .03, x, y + .72, 0, hat, 10); }
function lampGeo(b, x, y, z) { b.box(.1, .5, .1, x, y - .2, z, '#1a1a1a'); }
const LAMPG = new THREE.BoxGeometry(.18, .22, .18);
export function makeVeh(type, d) { const g = new THREE.Group(), b = new GB(), out = { g, wheels: [], horses: [], lamps: [], cars: [] };
  const L = d.len, W = d.wid, h2 = L / 2; let lampAt = [];
  const panel = (x, y, z, w, h, dd, c) => b.box(w, h, dd, x, y, z, c);
  switch (type) {
    case 'brougham': case 'police': { const c = d.body, tr = d.roof; panel(-.2, 1.45, 0, 2.3, 1.3, W * .9, c); b.box(2.4, .1, W * .95, -.2, 2.14, 0, tr); b.box(2.0, .06, W * .8, -.2, 2.2, 0, tr);
      for (const s of [-1, 1]) { b.box(.7, .55, .02, .35, 1.6, s * W * .45, '#8aa0a8'); b.box(.6, .55, .02, -.65, 1.6, s * W * .45, '#8aa0a8'); b.box(.06, 1.2, .03, -.15, 1.45, s * W * .46, '#c8a040'); }
      b.box(.8, .5, W * .8, 1.3, 1.25, 0, c); b.box(.6, .12, W * .75, 1.35, 1.65, 0, '#3a2a1a'); coachman(b, 1.3, 1.6, type === 'police' ? '#1a2448' : '#2a2a30', type === 'police' ? '#1a2040' : '#111');
      b.box(L * .9, .12, .12, 0, .8, W * .3, '#2a1c10'); b.box(L * .9, .12, .12, 0, .8, -W * .3, '#2a1c10');
      if (type === 'police') { b.box(1.6, .3, .02, -.2, 1.0, W * .46, '#d8d0a0'); b.box(1.6, .3, .02, -.2, 1.0, -W * .46, '#d8d0a0'); }
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
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return out; }
export function animVeh(V, sp, dt, signed) { for (const w of V.wheels) w.g.rotation.z -= (signed ?? sp) * dt / w.r; for (const H of V.horses) animHorse(H, sp, dt); }
