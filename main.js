import * as THREE from './vendor/three.module.js';
import { POI as POI_T, FACTIONS, MISSIONS } from './missions.js';
// ================= CONSTANTS & MAP =================
const N = 112, T = 4, W = N * T;
const K = { ROAD: 0, SIDE: 1, BLD: 2, WATER: 3, BRIDGE: 4, PARK: 5, STAIR: 6, RAIL: 7 };
const S = { MAC: 0, PAVE: 1, DIRT: 2, GRASS: 3, FLAG: 4, WATER: 5, STAIR: 6 };
const SURF = { 0: { grip: 1, spd: 1, n: 'macadam' }, 1: { grip: .5, spd: .92, n: 'pavé' }, 2: { grip: .75, spd: .62, n: 'dirt' }, 3: { grip: .7, spd: .6 }, 4: { grip: .85, spd: .85 }, 5: { grip: 1, spd: 1 }, 6: { grip: 1, spd: 1 } };
const kind = new Uint8Array(N * N), surf = new Uint8Array(N * N), dist = new Uint8Array(N * N);
const DN = ['Montmartre', 'Grands Boulevards & Opéra', 'Les Halles & Belleville', 'Rail Yards (Saint-Lazare)', 'La Seine', 'Île de la Cité', 'Quartier Latin'];
let rs = 1880; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
function districtOf(i, j) {
  if (j < 30) return 0; if (j < 52) return i < 14 ? 3 : i >= 72 ? 2 : 1;
  if (j < 58 || (j >= 64 && j < 68)) return 4; if (j < 64) return 5; return 6;
}
const ti = (i, j) => j * N + i;
const parkBlock = new Set(['4,1', '9,2', '2,8', '7,9', '5,3', '10,10', '3,10']);
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const d = districtOf(i, j), road = i % 10 < 2 || j % 10 < 2, id = ti(i, j); dist[id] = d;
  let k, s;
  if (i === 5) { k = K.RAIL; s = S.DIRT; }
  else if (d === 4) { if (i % 20 < 2 || (i % 10 < 2 && i > 90)) { k = K.BRIDGE; s = S.PAVE; } else { k = K.WATER; s = S.WATER; } }
  else if (d === 5 && !(i % 10 < 2)) { const lj = j - 58; if (lj === 0 || lj === 5) { k = K.SIDE; s = S.FLAG; } else if (i % 10 === 2 || i % 10 === 9) { k = K.SIDE; s = S.FLAG; } else { k = K.BLD; s = 0; } }
  else if (road) { k = K.ROAD; s = d === 1 ? S.MAC : d === 3 ? S.DIRT : d === 0 ? ((i * 7 + j * 3) % 5 === 0 ? S.DIRT : S.PAVE) : S.PAVE;
    if (d === 0 && (i % 20 === 10 || i % 20 === 11) && j % 10 >= 2 && j > 1) { k = K.STAIR; s = S.STAIR; }
    if (d === 1 && j % 10 < 2 && (j === 40 || j === 41)) s = S.MAC; }
  else { const li = i % 10 - 2, lj = j % 10 - 2, bk = Math.floor(i / 10) + ',' + Math.floor(j / 10);
    if (d === 3) { k = K.ROAD; s = S.DIRT; if (li > 1 && li < 6 && lj > 1 && lj < 5 && i > 8) { k = K.BLD; } }
    else if (li === 0 || li === 7 || lj === 0 || lj === 7) { k = K.SIDE; s = S.FLAG; }
    else if (parkBlock.has(bk)) { k = K.PARK; s = S.GRASS; } else { k = K.BLD; s = 0; } }
  kind[id] = k; surf[id] = s;
}
const tileAt = (x, z) => { const i = Math.floor(x / T), j = Math.floor(z / T); if (i < 0 || j < 0 || i >= N || j >= N) return -1; return ti(i, j); };
const kAt = (x, z) => { const t = tileAt(x, z); return t < 0 ? K.BLD : kind[t]; };
const pedBlock = (x, z) => { const k = kAt(x, z); return k === K.BLD || k === K.WATER; };
const vehBlock = (x, z) => { const k = kAt(x, z); return k === K.BLD || k === K.WATER || k === K.STAIR; };
function snapWalk(ti_, tj, veh) { // nearest walkable tile center
  for (let r = 0; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    const i = ti_ + di, j = tj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue; const k = kind[ti(i, j)];
    if (veh ? (k === K.ROAD || k === K.BRIDGE) : (k === K.SIDE || k === K.ROAD || k === K.PARK)) return [(i + .5) * T, (j + .5) * T]; }
  return [ti_ * T, tj * T];
}
const POI = {}; for (const k in POI_T) POI[k] = snapWalk(POI_T[k][0], POI_T[k][1], false);
const POIV = {}; for (const k in POI_T) POIV[k] = snapWalk(POI_T[k][0], POI_T[k][1], true);
// ================= RENDERER =================
const glc = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
let PIX = 3;
function resize() { renderer.setSize(Math.ceil(innerWidth / PIX), Math.ceil(innerHeight / PIX), false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); hud.width = innerWidth * Math.min(2, devicePixelRatio); hud.height = innerHeight * Math.min(2, devicePixelRatio); }
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0e0c0a);
const camera = new THREE.PerspectiveCamera(48, 1, 1, 400); camera.up.set(0, 0, -1);
const amb = new THREE.HemisphereLight(0xf0e6d0, 0x40382c, 1.0); scene.add(amb);
const sun = new THREE.DirectionalLight(0xfff2d8, .8); sun.position.set(-30, 100, -40); scene.add(sun);
const hud = document.getElementById('hud'), hx = hud.getContext('2d');
// ---- procedural textures ----
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; }
function tex(c, rep) { const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; }
const sh = (b, v) => { const r = Math.max(0, Math.min(255, b[0] + v)), g = Math.max(0, Math.min(255, b[1] + v)), bb = Math.max(0, Math.min(255, b[2] + v)); return `rgb(${r|0},${g|0},${bb|0})`; };
function noiseFill(g, w, h, base, amt, sz = 1) { for (let y = 0; y < h; y += sz) for (let x = 0; x < w; x += sz) { g.fillStyle = sh(base, (rnd() - .5) * amt); g.fillRect(x, y, sz, sz); } }
const TP = 16; // pixels per tile in ground texture
const pat = {};
pat.mac = cv(TP, TP, (g) => noiseFill(g, TP, TP, [70, 68, 66], 14));
pat.pave = cv(TP, TP, (g) => { noiseFill(g, TP, TP, [62, 58, 54], 10); for (let y = 0; y < TP; y += 4) for (let x = (y / 4 % 2) * 2; x < TP; x += 4) { g.fillStyle = sh([96, 90, 84], (rnd() - .5) * 30); g.fillRect(x, y, 3, 3); } });
pat.paveD = cv(TP, TP, (g) => { g.drawImage(pat.pave, 0, 0); for (let n = 0; n < 6; n++) { g.fillStyle = 'rgba(70,52,30,.6)'; g.fillRect(rnd() * TP, rnd() * TP, 3, 2); } });
pat.dirt = cv(TP, TP, (g) => { noiseFill(g, TP, TP, [104, 82, 56], 26); g.fillStyle = 'rgba(60,44,28,.5)'; g.fillRect(0, 5, TP, 1); g.fillRect(0, 11, TP, 1); });
pat.grass = cv(TP, TP, (g) => noiseFill(g, TP, TP, [64, 86, 48], 30));
pat.flag = cv(TP, TP, (g) => { noiseFill(g, TP, TP, [150, 142, 126], 14); g.fillStyle = 'rgba(80,72,60,.7)'; g.fillRect(0, 0, TP, 1); g.fillRect(0, 8, TP, 1); g.fillRect(0, 0, 1, 8); g.fillRect(8, 8, 1, 8); });
pat.water = cv(TP, TP, (g) => { noiseFill(g, TP, TP, [40, 62, 70], 10); g.fillStyle = 'rgba(160,190,190,.25)'; for (let n = 0; n < 3; n++) g.fillRect(rnd() * TP, rnd() * TP, 5, 1); });
pat.stair = cv(TP, TP, (g) => { for (let y = 0; y < TP; y += 4) { g.fillStyle = '#9a9184'; g.fillRect(0, y, TP, 3); g.fillStyle = '#4c463e'; g.fillRect(0, y + 3, TP, 1); } });
pat.rail = cv(TP, TP, (g) => { g.drawImage(pat.dirt, 0, 0); g.fillStyle = '#4a3420'; for (let y = 1; y < TP; y += 4) g.fillRect(2, y, 12, 2); g.fillStyle = '#9aa0a4'; g.fillRect(4, 0, 1, TP); g.fillRect(11, 0, 1, TP); });
pat.bridge = cv(TP, TP, (g) => { g.drawImage(pat.pave, 0, 0); });
const groundC = cv(N * TP, N * TP, (g) => {
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const id = ti(i, j), k = kind[id], s = surf[id]; let p;
    if (k === K.WATER) p = pat.water; else if (k === K.RAIL) p = pat.rail; else if (k === K.STAIR) p = pat.stair; else if (k === K.SIDE) p = pat.flag; else if (k === K.PARK) p = pat.grass; else if (k === K.BLD) p = pat.flag;
    else p = s === S.MAC ? pat.mac : s === S.DIRT ? pat.dirt : (i * 13 + j * 7) % 4 === 0 ? pat.paveD : pat.pave;
    g.drawImage(p, i * TP, j * TP); if (k === K.BRIDGE) { g.fillStyle = '#5a5248'; g.fillRect(i * TP, j * TP, 2, TP); g.fillRect(i * TP + TP - 2, j * TP, 2, TP); } }
  // tram rails along row 40/41 in boulevards
  g.fillStyle = '#a8aeb2'; g.fillRect(14 * TP, 41 * TP - 5, 86 * TP, 1); g.fillRect(14 * TP, 41 * TP + 4, 86 * TP, 1);
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(W, W), new THREE.MeshLambertMaterial({ map: tex(groundC) }));
ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, 0, W / 2); scene.add(ground);
// minimap image
const miniC = cv(N, N, (g) => { const col = { 0: '#555', 1: '#8a8170', 2: '#2a2622', 3: '#2e4a58', 4: '#666', 5: '#3d5a2c', 6: '#999', 7: '#6a4a2a' };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { g.fillStyle = col[kind[ti(i, j)]]; g.fillRect(i, j, 1, 1); } });
// ---- buildings ----
const roofTex = {
  lime: tex(cv(32, 32, (g) => { noiseFill(g, 32, 32, [196, 184, 158], 16); g.fillStyle = '#6e7478'; g.fillRect(0, 0, 32, 4); g.fillRect(0, 28, 32, 4); g.fillStyle = '#7a4a38'; g.fillRect(8, 12, 3, 3); g.fillRect(22, 18, 3, 3); })),
  brick: tex(cv(32, 32, (g) => { noiseFill(g, 32, 32, [130, 70, 52], 22); g.fillStyle = 'rgba(40,20,10,.5)'; for (let y = 0; y < 32; y += 4) g.fillRect(0, y, 32, 1); })),
  wood: tex(cv(32, 32, (g) => { noiseFill(g, 32, 32, [96, 74, 52], 20); g.fillStyle = 'rgba(30,20,10,.6)'; for (let x = 0; x < 32; x += 5) g.fillRect(x, 0, 1, 32); })),
  slate: tex(cv(32, 32, (g) => { noiseFill(g, 32, 32, [76, 82, 92], 14); g.fillStyle = 'rgba(20,20,30,.5)'; for (let y = 0; y < 32; y += 3) g.fillRect(0, y, 32, 1); })),
  glass: tex(cv(32, 32, (g) => { noiseFill(g, 32, 32, [120, 150, 150], 12); g.fillStyle = '#34413e'; for (let x = 0; x < 32; x += 6) g.fillRect(x, 0, 1, 32); for (let y = 0; y < 32; y += 8) g.fillRect(0, y, 32, 1); })),
  copper: tex(cv(32, 32, (g) => { noiseFill(g, 32, 32, [90, 150, 120], 20); g.fillStyle = '#d4b040'; g.fillRect(14, 14, 4, 4); })),
  gothic: tex(cv(32, 32, (g) => { noiseFill(g, 32, 32, [150, 146, 136], 20); g.fillStyle = '#585452'; for (let x = 2; x < 32; x += 6) g.fillRect(x, 0, 2, 32); })),
};
const wallTex = tex(cv(32, 32, (g) => { noiseFill(g, 32, 32, [170, 156, 130], 12); g.fillStyle = '#2a2a30'; for (let y = 4; y < 32; y += 8) for (let x = 3; x < 32; x += 8) g.fillRect(x, y, 3, 4); }));
const wallM = new THREE.MeshLambertMaterial({ map: wallTex });
const bldGroups = {};
function addBox(rt, x, z, w, d, h) { (bldGroups[rt] = bldGroups[rt] || []).push([x, z, w, d, h]); }
const RT = ['wood', 'lime', 'brick', 'slate', 'glass', 'slate', 'brick'];
for (let bj = 0; bj < 12; bj++) for (let bi = 0; bi < 12; bi++) {
  const i0 = bi * 10 + 2, j0 = bj * 10 + 2; if (i0 >= N || j0 >= N) continue;
  // gather BLD tiles bbox in block interior
  let mi = 99, Mi = -1, mj = 99, Mj = -1; for (let j = j0; j < Math.min(N, j0 + 8); j++) for (let i = i0; i < Math.min(N, i0 + 8); i++) if (kind[ti(i, j)] === K.BLD) { mi = Math.min(mi, i); Mi = Math.max(Mi, i); mj = Math.min(mj, j); Mj = Math.max(Mj, j); }
  if (Mi < 0) continue; const d = dist[ti(mi, mj)]; const rt = RT[d]; if (d === 5) continue;
  const x0 = mi * T, z0 = mj * T, w = (Mi - mi + 1) * T, dd = (Mj - mj + 1) * T;
  const key = bi + ',' + bj;
  if (key === '3,3') { addBox('copper', x0 + w / 2, z0 + dd / 2, w, dd, 14); addBox('lime', x0 + w / 2, z0 + dd / 2, w * .5, dd * .5, 19); continue; } // Palais Garnier
  if (key === '5,5' && d === 5) { addBox('gothic', x0 + w / 2, z0 + dd / 2, w, dd, 12); addBox('gothic', x0 + 3, z0 + 3, 5, 5, 22); addBox('gothic', x0 + 3, z0 + dd - 3, 5, 5, 22); continue; } // Notre-Dame
  if (key === '5,9') { addBox('lime', x0 + w / 2, z0 + dd / 2, w, dd, 12); addBox('copper', x0 + w / 2, z0 + dd / 2, 8, 8, 24); continue; } // Panthéon
  const hb = d === 0 ? 4 : d === 1 ? 14 : d === 2 ? 6 : d === 3 ? 7 : 9;
  if (d === 2 && bi < 10) { addBox('glass', x0 + w / 2, z0 + dd / 2, w, dd, 6); continue; } // Halles pavilions
  if (d === 3) { addBox('slate', x0 + w / 2, z0 + dd / 2, w, dd, 6); continue; }
  const split = rnd() < .5; const n = d === 0 ? 4 : 2;
  for (let s = 0; s < n; s++) { const h = hb * (.7 + rnd() * .6);
    if (split) addBox(rt, x0 + w * (s + .5) / n, z0 + dd / 2, w / n - .2, dd, h); else addBox(rt, x0 + w / 2, z0 + dd * (s + .5) / n, w, dd / n - .2, h); }
}
// island (Cité)
for (let bi = 0; bi < 11; bi++) { const x0 = (bi * 10 + 3) * T, z0 = 59 * T, w = 6 * T, dd = 4 * T; if (kind[ti(bi * 10 + 3, 60)] !== K.BLD) continue;
  if (bi === 5) { addBox('gothic', x0 + w / 2, z0 + dd / 2, w, dd, 12); addBox('gothic', x0 + 3, z0 + 3, 5, 5, 24); addBox('gothic', x0 + w - 3, z0 + 3, 5, 5, 24); addBox('slate', x0 + w * .7, z0 + dd / 2, 2, 2, 30); }
  else addBox(bi === 4 ? 'slate' : 'lime', x0 + w / 2, z0 + dd / 2, w, dd, 10); }
for (const rt in bldGroups) {
  const arr = bldGroups[rt], m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), [wallM, wallM, new THREE.MeshLambertMaterial({ map: roofTex[rt] }), wallM, wallM, wallM], arr.length);
  const o = new THREE.Object3D(); arr.forEach((b, k) => { o.position.set(b[0], b[4] / 2, b[1]); o.scale.set(b[2], b[4], b[3]); o.updateMatrix(); m.setMatrixAt(k, o.matrix); }); scene.add(m);
}
// ================= SPRITES =================
const PG = new THREE.PlaneGeometry(1, 1); PG.rotateX(-Math.PI / 2);
const matCache = {};
function spriteMat(key, w, h, draw) { if (!matCache[key]) matCache[key] = new THREE.MeshLambertMaterial({ map: tex(cv(w, h, draw)), transparent: true, alphaTest: .5 }); return matCache[key]; }
function pedMat(coat, hat, skin = '#d8b090') { return spriteMat('p' + coat + hat, 16, 16, (g) => { g.fillStyle = coat; g.fillRect(4, 2, 8, 12); g.fillRect(9, 1, 3, 3); g.fillRect(9, 12, 3, 3); g.fillStyle = skin; g.fillRect(11, 2, 2, 2); g.fillRect(11, 12, 2, 2); g.fillStyle = hat; g.beginPath(); g.arc(8, 8, 3.5, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(4, 13, 8, 1); }); }
const horseMat = spriteMat('horse', 24, 12, (g) => { g.fillStyle = '#5a3a22'; g.fillRect(3, 3, 14, 6); g.fillRect(16, 4, 6, 4); g.fillStyle = '#2a1a10'; g.fillRect(1, 5, 3, 2); g.fillRect(20, 5, 3, 2); g.fillStyle = '#c8b090'; g.fillRect(21, 5, 1, 2); });
const deadHorseMat = spriteMat('dhorse', 24, 12, (g) => { g.fillStyle = '#3a2216'; g.fillRect(3, 2, 14, 7); g.fillStyle = '#6a0a0a'; g.fillRect(6, 9, 10, 3); });
function carMat(body, roof, len) { return spriteMat('c' + body + roof + len, len * 4, 12, (g, w) => { g.fillStyle = '#1a1410'; g.fillRect(3, 0, 5, 12); g.fillRect(w - 9, 0, 5, 12); g.fillStyle = body; g.fillRect(1, 1, w - 2, 10); g.fillStyle = roof; g.fillRect(3, 2, w - 7, 8); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(3, 2, w - 7, 1); g.fillStyle = '#c8a050'; g.fillRect(w - 2, 3, 2, 6); }); }
const wreckMat = spriteMat('wreck', 32, 12, (g) => { noiseFill(g, 32, 12, [40, 34, 30], 30, 2); });
// ================= AUDIO =================
let AC = null, snd = true, master;
function audio() { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination); } catch (e) { } }
function tone(f, d, type = 'square', v = .1, f2, when = 0) { if (!AC || !snd) return; const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02); }
let nbuf; function noise(d, v = .3, fq = 1200, when = 0) { if (!AC || !snd) return; if (!nbuf) { nbuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const a = nbuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
  const t = AC.currentTime + when, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = nbuf; f.type = 'lowpass'; f.frequency.value = fq; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + d + .02); }
const SFX = { shot: () => { noise(.18, .5, 2500); tone(120, .1, 'square', .1, 50); }, shotgun: () => { noise(.35, .7, 1500); }, rifle: () => { noise(.12, .5, 4000); tone(300, .08, 'square', .06, 80); },
  boom: () => { noise(1.2, .9, 400); tone(60, .8, 'sine', .4, 25); }, whistle: () => { tone(2600, .5, 'sine', .12); tone(2750, .25, 'sine', .08, 0, .12); }, hit: () => noise(.08, .3, 800), hoof: () => { tone(180 + Math.random() * 40, .05, 'triangle', .07); },
  pager: () => { tone(1800, .08, 'square', .05); tone(1800, .08, 'square', .05, 0, .12); }, crash: () => { noise(.4, .6, 900); }, cash: () => { tone(1320, .08, 'square', .06); tone(1760, .15, 'square', .06, 0, .08); }, swing: () => noise(.1, .15, 3000), bell: () => { tone(523, 1.2, 'sine', .15); tone(784, 1.2, 'sine', .08); } };
// cabaret tune (cancan-ish) — simple sequencer
const TUNE = [72, 0, 74, 72, 77, 76, 0, 74, 72, 0, 74, 72, 79, 77, 0, 76, 74, 0, 76, 74, 81, 79, 77, 76, 74, 72, 71, 72, 74, 0, 72, 0];
let tuneT = 0, tuneI = 0, musicOn = false;
function musicTick(dt, vol) { if (!AC || !snd || vol <= 0.01) return; tuneT -= dt; if (tuneT > 0) return; tuneT = .16; const n = TUNE[tuneI++ % TUNE.length]; if (n) { tone(440 * 2 ** ((n - 69) / 12), .14, 'square', .03 * vol); if (tuneI % 4 === 1) tone(440 * 2 ** ((n - 81) / 12), .3, 'triangle', .05 * vol); } }
// ================= PROPS & LIGHTS =================
const PT = { // r: radius, hp, solid
  morris: { r: .9, hp: 80, sz: 2.2, draw: (g) => { g.fillStyle = '#2c4a30'; g.beginPath(); g.arc(8, 8, 7, 0, 7); g.fill(); ['#c33', '#ec4', '#36a', '#eee'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(8, 8, 6, k * 1.57, k * 1.57 + 1.2); g.lineTo(8, 8); g.fill(); }); g.fillStyle = '#1c3a20'; g.beginPath(); g.arc(8, 8, 3, 0, 7); g.fill(); } },
  wallace: { r: .7, hp: 120, sz: 1.8, draw: (g) => { g.fillStyle = '#1e4a32'; g.beginPath(); g.arc(8, 8, 6, 0, 7); g.fill(); g.fillStyle = '#4a8a6a'; for (let k = 0; k < 4; k++) { g.fillRect(8 + Math.cos(k * 1.57) * 4 - 1, 8 + Math.sin(k * 1.57) * 4 - 1, 2, 2); } g.fillStyle = '#8cc'; g.fillRect(7, 7, 2, 2); } },
  trough: { r: .8, hp: 60, sz: 2.4, draw: (g) => { g.fillStyle = '#6a665e'; g.fillRect(1, 5, 14, 6); g.fillStyle = '#3a5a6a'; g.fillRect(2, 6, 12, 4); } },
  pissoir: { r: .9, hp: 90, sz: 2.2, draw: (g) => { g.fillStyle = '#1e3a26'; g.beginPath(); g.arc(8, 8, 7, 0, 7); g.fill(); g.fillStyle = '#2e5a36'; g.fillRect(3, 7, 10, 2); } },
  lamp: { r: .3, hp: 25, sz: 1, draw: (g) => { g.fillStyle = '#1a1a1a'; g.fillRect(6, 6, 4, 4); g.fillStyle = '#ffe2a0'; g.fillRect(7, 7, 2, 2); } },
  tree: { r: .6, hp: 200, sz: 4, y: 3, draw: (g) => { for (let k = 0; k < 30; k++) { g.fillStyle = sh([50, 80, 40], (Math.random() - .5) * 40); g.beginPath(); g.arc(8 + (Math.random() - .5) * 8, 8 + (Math.random() - .5) * 8, 3, 0, 7); g.fill(); } } },
  crate: { r: .7, hp: 50, sz: 1.6, draw: (g) => { g.fillStyle = '#8a6a3a'; g.fillRect(1, 1, 14, 14); g.strokeStyle = '#4a3418'; g.lineWidth = 2; g.strokeRect(2, 2, 12, 12); g.beginPath(); g.moveTo(2, 2); g.lineTo(14, 14); g.stroke(); } },
  table: { r: .6, hp: 30, sz: 1.4, draw: (g) => { g.fillStyle = '#6a4424'; g.beginPath(); g.arc(8, 8, 6, 0, 7); g.fill(); g.fillStyle = '#bbb'; g.fillRect(6, 6, 2, 2); g.fillStyle = '#8c4'; g.fillRect(9, 8, 2, 3); } },
  barricade: { r: 1.2, hp: 300, sz: 3, draw: (g) => { g.fillStyle = '#5a4428'; g.fillRect(0, 4, 16, 8); g.fillStyle = '#8a7a5a'; for (let k = 0; k < 4; k++) g.fillRect(k * 4 + 1, 5, 3, 3); } },
  phone: { r: .4, hp: 1e9, sz: 1.6, draw: (g) => { g.fillStyle = '#5a3a1a'; g.fillRect(3, 3, 10, 10); g.fillStyle = '#d4a020'; g.fillRect(5, 5, 6, 6); g.fillStyle = '#111'; g.fillRect(7, 2, 2, 4); } },
  manhole: { r: 0, hp: 1e9, sz: 1.6, draw: (g) => { g.fillStyle = '#333'; g.beginPath(); g.arc(8, 8, 7, 0, 7); g.fill(); g.strokeStyle = '#555'; for (let k = 2; k < 14; k += 3) { g.beginPath(); g.moveTo(k, 2); g.lineTo(k, 14); g.stroke(); } } },
};
for (const k in PT) PT[k].mat = spriteMat('prop' + k, 16, 16, PT[k].draw);
const props = [], propGrid = new Map();
const gkey = (x, z) => (Math.floor(x / 8) * 1000 + Math.floor(z / 8));
function addProp(type, x, z, extra) { const p = Object.assign({ type, x, z, r: PT[type].r, hp: PT[type].hp, alive: true }, extra || {}); props.push(p); const k = gkey(x, z); if (!propGrid.has(k)) propGrid.set(k, []); propGrid.get(k).push(p); return p; }
function propsNear(x, z) { const out = []; const a = Math.floor(x / 8), b = Math.floor(z / 8); for (let i = a - 1; i <= a + 1; i++) for (let j = b - 1; j <= b + 1; j++) { const l = propGrid.get(i * 1000 + j); if (l) for (const p of l) if (p.alive) out.push(p); } return out; }
const lamps = [];
for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const id = ti(i, j); if (kind[id] !== K.SIDE) continue; const d = dist[id];
  const nr = [ti(i + 1, j), ti(i - 1, j), ti(i, j + 1), ti(i, j - 1)].find(t => kind[t] === K.ROAD);
  const x = (i + .5) * T, z = (j + .5) * T, h = (i * 31 + j * 17) % 23;
  if (nr !== undefined && (i + j) % 4 === 0) { const arc = d === 1 && surf[nr] === S.MAC && (j % 10 === 2 || j % 10 === 9 || j === 39 || j === 42); lamps.push(addProp('lamp', x, z, { arc, li: lamps.length })); continue; }
  if (h === 3) addProp('morris', x, z); else if (h === 7 && d !== 0) addProp('wallace', x, z); else if (h === 11 && (d === 0 || d === 2 || d === 3)) addProp('trough', x, z); else if (h === 15 && d === 1) addProp('pissoir', x, z);
}
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (kind[ti(i, j)] === K.PARK && (i + j * 3) % 5 === 0) addProp('tree', (i + .5) * T, (j + .5) * T);
// manholes (catacomb/sewer network)
const MANHOLES = [[21, 20], [41, 30], [81, 31], [31, 70], [71, 90], [101, 50], [11, 100]].map(([i, j]) => addProp('manhole', (i + .5) * T, (j + .5) * T));
// instanced prop rendering
const propInst = {}; const _o = new THREE.Object3D();
(function buildPropInst() { const byT = {}; props.forEach(p => (byT[p.type] = byT[p.type] || []).push(p));
  for (const t in byT) { const arr = byT[t], m = new THREE.InstancedMesh(PG, PT[t].mat, arr.length + 40); m.count = arr.length; propInst[t] = m; arr.forEach((p, k) => { p.ii = k; setPropM(p); }); scene.add(m); } })();
function setPropM(p) { const m = propInst[p.type]; if (!m) return; const s = p.alive ? PT[p.type].sz : 0; _o.position.set(p.x, PT[p.type].y || .3 + (p.ii % 7) * .01, p.z); _o.rotation.set(0, (p.ii * 1.7) % 6.28, 0); _o.scale.set(s, 1, s); _o.updateMatrix(); m.setMatrixAt(p.ii, _o.matrix); m.instanceMatrix.needsUpdate = true; }
function addDynProp(type, x, z, extra) { const p = addProp(type, x, z, extra); let m = propInst[type]; if (!m) { m = propInst[type] = new THREE.InstancedMesh(PG, PT[type].mat, 64); m.count = 0; scene.add(m); }
  // reuse dead slot
  let slot = props.find(q => q !== p && q.type === type && !q.alive && q.ii !== undefined && !q.reused); if (slot) { slot.reused = true; p.ii = slot.ii; } else { if (m.count >= m.instanceMatrix.count) { p.ii = 0; } else p.ii = m.count++; }
  setPropM(p); return p; }
// light pools
const poolTex = tex(cv(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }));
function poolMesh(list, color, size) { const m = new THREE.InstancedMesh(PG, new THREE.MeshBasicMaterial({ map: poolTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }), list.length);
  list.forEach((p, k) => { p.pi = k; _o.position.set(p.x, .25, p.z); _o.rotation.set(0, 0, 0); _o.scale.set(size, 1, size); _o.updateMatrix(); m.setMatrixAt(k, _o.matrix); }); m.renderOrder = 2; scene.add(m); return m; }
const gasL = lamps.filter(l => !l.arc), arcL = lamps.filter(l => l.arc);
const gasPool = poolMesh(gasL, 0xff9a40, 9), arcPool = poolMesh(arcL, 0xb8d8ff, 13);
function killLampPool(p) { const m = p.arc ? arcPool : gasPool; _o.scale.set(0, 0, 0); _o.updateMatrix(); m.setMatrixAt(p.pi, _o.matrix); m.instanceMatrix.needsUpdate = true; }
// windmills (Montmartre) with turning sails
const mills = [];
[[13, 13], [33, 3], [53, 23], [73, 13], [93, 5]].forEach(([i, j]) => { const [x, z] = snapWalk(i, j, false); const body = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 7, 8), new THREE.MeshLambertMaterial({ map: roofTex.wood })); body.position.set(x + 3, 3.5, z + 3);
  const sail = new THREE.Mesh(PG, spriteMat('sail', 32, 32, (g) => { g.fillStyle = '#ddd2b4'; g.fillRect(14, 0, 4, 32); g.fillRect(0, 14, 32, 4); g.fillStyle = '#5a4430'; g.fillRect(15, 0, 2, 32); g.fillRect(0, 15, 32, 2); })); sail.scale.set(9, 1, 9); sail.position.set(x + 3, 7.6, z + 3); scene.add(body, sail); mills.push(sail); addProp('trough', x + 3, z + 3, { r: 2, hp: 1e9 }); });
// ================= ENTITIES =================
const peds = [], vehs = [], fx = [], projs = [], pickups = [];
const PEDT = {
  civ: { hp: 30, spd: 2.2, mats: [['#3a3a46', '#222'], ['#6a4a3a', '#3a2a1a'], ['#7a2a3a', '#d8c8a0'], ['#4a5a3a', '#333'], ['#8a7a5a', '#5a4a3a'], ['#2a2a2a', '#111'], ['#a05a6a', '#e0b0c0']] },
  cop: { hp: 50, spd: 5.4, mats: [['#1e2a5a', '#14183a']] }, gend: { hp: 80, spd: 10.5, mats: [['#2a2a6a', '#d0b040']], mounted: true },
  soldier: { hp: 60, spd: 4, mats: [['#2a3a7a', '#b02020']] }, gang: { hp: 45, spd: 5.2, mats: [['#c8c8c8', '#a01818']] },
  vip: { hp: 60, spd: 3.6, mats: [['#e0e0f0', '#c03080']] }, boss: { hp: 160, spd: 4.6, mats: [['#111', '#f4c430']] },
};
const FCOL = { apache: ['#d8d8d8', '#a01818'], avant: ['#6a4a8a', '#c8a020'], velvet: ['#4a1a4a', '#111'], crimson: ['#8a1a1a', '#222'], side: ['#555', '#a01818'] };
function mkPedMesh(mat, mounted) { const g = new THREE.Group(); if (mounted) { const h = new THREE.Mesh(PG, horseMat); h.scale.set(3, 1, 1.5); h.position.y = .4; g.add(h); }
  const m = new THREE.Mesh(PG, mat); m.scale.set(1.3, 1, 1.3); m.position.y = mounted ? 1.4 : .6; g.add(m); scene.add(g); return g; }
function spawnPed(type, x, z, o = {}) { const d = PEDT[type], mm = o.col || d.mats[Math.floor(rnd() * d.mats.length)];
  const p = Object.assign({ type, x, z, a: rnd() * 6.28, hp: d.hp, spd: d.spd, alive: true, t: 0, cd: rnd(), wander: rnd() * 6.28, flee: 0, mounted: !!d.mounted }, o);
  p.mesh = mkPedMesh(pedMat(mm[0], mm[1]), p.mounted); peds.push(p); return p; }
function removePed(p) { scene.remove(p.mesh); const i = peds.indexOf(p); if (i >= 0) peds.splice(i, 1); }
const VT = {
  brougham: { len: 4.2, wid: 2.2, horses: 2, spd: 23, acc: 15, hp: 110, body: '#1a1a1a', roof: '#3a2a2a', turn: 2.4 },
  phaeton: { len: 3.6, wid: 2, horses: 2, spd: 30, acc: 22, hp: 70, body: '#c0a040', roof: '#7a2a1a', turn: 2.9 },
  barouche: { len: 4.8, wid: 2.4, horses: 2, spd: 20, acc: 11, hp: 240, body: '#2a1a3a', roof: '#4a2a5a', turn: 2.0 },
  gig: { len: 2.8, wid: 1.8, horses: 1, spd: 21, acc: 17, hp: 55, body: '#7a5a30', roof: '#a08050', turn: 3.2 },
  omnibus: { len: 6.5, wid: 2.6, horses: 3, spd: 15, acc: 7, hp: 420, body: '#c8b060', roof: '#3a5a3a', turn: 1.5 },
  police: { len: 4.2, wid: 2.2, horses: 2, spd: 27, acc: 18, hp: 160, body: '#0a0a1e', roof: '#1e2a5a', turn: 2.6 },
  tram: { len: 7, wid: 2.6, horses: 0, spd: 12, acc: 4, hp: 900, body: '#3a5a3a', roof: '#aa3a1a', turn: 0, rail: 'x' },
  train: { len: 8, wid: 2.6, horses: 0, spd: 22, acc: 5, hp: 5000, body: '#1a1a1a', roof: '#4a1a1a', turn: 0, rail: 'z' },
};
function spawnVeh(type, x, z, a, o = {}) { const d = VT[type], g = new THREE.Group(); const body = new THREE.Mesh(PG, carMat(d.body, d.roof, Math.round(d.len * 2)));
  body.scale.set(d.len, 1, d.wid); body.position.y = .8; g.add(body); const hs = [];
  for (let k = 0; k < d.horses; k++) { const h = new THREE.Mesh(PG, horseMat); h.scale.set(2.6, 1, 1.2); const row = d.horses === 3 ? (k === 2 ? 1 : 0) : 0; h.position.set(d.len / 2 + 1.6 + row * 2.8, .5, d.horses === 1 ? 0 : (d.horses === 3 && k === 2 ? 0 : (k ? .65 : -.65))); g.add(h); hs.push(h); }
  if (type === 'tram' || type === 'train') { const st = new THREE.Mesh(PG, spriteMat('stack', 8, 8, (g) => { g.fillStyle = '#222'; g.beginPath(); g.arc(4, 4, 3.5, 0, 7); g.fill(); })); st.position.set(d.len * .3, 1.2, 0); g.add(st); }
  const v = Object.assign({ type, x, z, a, vx: 0, vz: 0, av: 0, hp: d.hp, horseHp: d.horses ? 60 * d.horses : 1e9, alive: true, driver: null, mesh: g, body, hs, d, burn: 0, t: 0, wreck: false, cars: [] }, o);
  if (type === 'train') { for (let c = 1; c <= 3; c++) { const cb = new THREE.Mesh(PG, carMat('#4a2a1a', '#6a4a2a', 16)); cb.scale.set(7.5, 1, 2.5); cb.position.set(-c * 8.2, .8, 0); g.add(cb); } }
  scene.add(g); vehs.push(v); return v; }
function removeVeh(v) { scene.remove(v.mesh); const i = vehs.indexOf(v); if (i >= 0) vehs.splice(i, 1); }
// ================= PLAYER =================
const START = snapWalk(84, 50, false);
const player = { x: START[0], z: START[1], a: 0, hp: 100, alive: true, veh: null, w: 0, ammo: { fists: 1e9 }, cd: 0, punch: 0, walkT: 0, inv: 0, god: false };
player.mesh = mkPedMesh(pedMat('#3a2a1a', '#6a5030', '#e0b898'));
const WEAP = [
  { id: 'fists', n: 'Fists', melee: true, dmg: 12, rate: .35, rng: 1.6 },
  { id: 'brick', n: 'Cobblestone', throw: 'brick', dmg: 40, rate: .6, pick: 6 },
  { id: 'swordcane', n: 'Sword-Cane', melee: true, dmg: 35, rate: .4, rng: 2.2, pick: 1e9 },
  { id: 'revolver', n: 'Lefaucheux Revolver', dmg: 30, rate: .3, rng: 40, pick: 30, snd: 'shot' },
  { id: 'shotgun', n: 'Double-Barrel Shotgun', dmg: 22, rate: .9, rng: 18, pellets: 6, spread: .35, pick: 16, snd: 'shotgun' },
  { id: 'winchester', n: 'Winchester 1873', dmg: 34, rate: .16, rng: 55, pick: 45, snd: 'rifle' },
  { id: 'dynamite', n: 'Dynamite', throw: 'dynamite', rate: 1, pick: 5 },
  { id: 'molotov', n: 'Absinthe Molotov', throw: 'molotov', rate: .8, pick: 6 },
];
const WI = Object.fromEntries(WEAP.map((w, i) => [w.id, i]));
function giveWeapon(id, n) { player.ammo[id] = Math.min(999999, (player.ammo[id] || 0) + (n || WEAP[WI[id]].pick)); }
function haveW(i) { return (player.ammo[WEAP[i].id] || 0) > 0; }
function cycleW(d) { for (let k = 1; k <= WEAP.length; k++) { const i = (player.w + d * k + WEAP.length * 3) % WEAP.length; if (haveW(i)) { player.w = i; return; } } }
let money = 0, mult = 1, respect = { apache: 0, avant: 0, velvet: 0, crimson: 0 }, done = {}, heat = 0, wanted = 0, sightT = 0;
let gameTime = 20.5, rain = 0, rainTarget = 0, weatherT = 60;
const pagerQ = []; let pagerT = 0, pagerMsg = '', bigMsg = '', bigT = 0, districtMsg = '', districtT = 0, lastDistrict = -1;
function pager(msg, t = 5) { pagerQ.push([msg, t]); }
function big(msg, t = 3) { bigMsg = msg; bigT = t; }
function addMoney(n, raw) { const v = raw ? n : n * mult; money = Math.max(0, money + v); if (n > 0) SFX.cash(); return v; }
function addHeat(n) { if (player.god === 'noheat') return; heat = Math.min(40, heat + n); }
// ================= INPUT =================
const keys = {}; const pressed = {};
addEventListener('keydown', e => { audio(); if (!keys[e.code]) pressed[e.code] = true; keys[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
let gpPrev = {};
function readInput() { const I = { mx: 0, my: 0, fire: false, enter: false, prev: false, next: false, pause: false, stick: false, thr: 0, steer: 0 };
  const L = keys.KeyA || keys.ArrowLeft, R = keys.KeyD || keys.ArrowRight, U = keys.KeyW || keys.ArrowUp, D = keys.KeyS || keys.ArrowDown;
  I.mx = (R ? 1 : 0) - (L ? 1 : 0); I.my = (D ? 1 : 0) - (U ? 1 : 0); I.thr = (U ? 1 : 0) - (D ? 1 : 0); I.steer = I.mx;
  I.fire = keys.Space || keys.ControlLeft || keys.ControlRight; I.enter = pressed.KeyF || pressed.Enter; I.prev = pressed.KeyQ; I.next = pressed.KeyE; I.pause = pressed.Escape || pressed.KeyP;
  const gps = navigator.getGamepads ? navigator.getGamepads() : []; for (const gp of gps) { if (!gp) continue; const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; const b = i => gp.buttons[i] && gp.buttons[i].pressed;
    if (Math.hypot(ax, ay) > .25) { I.mx = ax; I.my = ay; I.stick = true; } if (b(0) || b(7)) I.fire = true;
    if (b(14)) { I.mx = -1; } if (b(15)) I.mx = 1; if (b(12)) I.my = -1; if (b(13)) I.my = 1;
    const e = (i, k) => { if (b(i) && !gpPrev[i]) I[k] = true; }; e(3, 'enter'); e(1, 'enter'); e(4, 'prev'); e(5, 'next'); e(9, 'pause'); gpPrev = Object.fromEntries(gp.buttons.map((x, i) => [i, x.pressed])); break; }
  for (const k in pressed) pressed[k] = false; return I; }
// ================= HELPERS =================
const ang = (a) => { while (a > Math.PI) a -= 6.2832; while (a < -Math.PI) a += 6.2832; return a; };
const d2 = (a, b, x, z) => (a - x) ** 2 + (b - z) ** 2;
const ppos = () => player.veh ? [player.veh.x, player.veh.z] : [player.x, player.z];
function copsNear(r) { const [px, pz] = ppos(); return peds.some(p => p.alive && (p.type === 'cop' || p.type === 'gend') && d2(p.x, p.z, px, pz) < r * r) || vehs.some(v => v.police && v.alive && d2(v.x, v.z, px, pz) < r * r); }
function crime(n) { addHeat(copsNear(30) ? n : n * .5); }
// ================= COMBAT =================
const tracerMat = new THREE.LineBasicMaterial({ color: 0xffe080 });
function tracer(x1, z1, x2, z2) { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, 1.2, z1), new THREE.Vector3(x2, 1.2, z2)]); const l = new THREE.Line(g, tracerMat); scene.add(l); fx.push({ m: l, t: .06, kill: true }); }
const flashMat = spriteMat('flash', 16, 16, (g) => { const gr = g.createRadialGradient(8, 8, 0, 8, 8, 8); gr.addColorStop(0, '#fff8c0'); gr.addColorStop(.4, '#ff9020'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 16, 16); });
const smokeMat = spriteMat('smoke', 16, 16, (g) => { g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(8, 8, 7, 0, 7); g.fill(); });
const fireMat = spriteMat('fire', 16, 16, (g) => { for (let k = 0; k < 12; k++) { g.fillStyle = ['#ff4010', '#ffa020', '#ffe060'][k % 3]; g.beginPath(); g.arc(8 + (Math.random() - .5) * 8, 8 + (Math.random() - .5) * 8, 3, 0, 7); g.fill(); } });
const bloodMat = spriteMat('blood', 16, 16, (g) => { g.fillStyle = '#6a0808'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(8 + (Math.random() - .5) * 8, 8 + (Math.random() - .5) * 8, 2 + Math.random() * 2, 0, 7); g.fill(); } });
function spr(mat, x, z, s, t, y = 1.5, grow = 0) { const m = new THREE.Mesh(PG, mat); m.position.set(x, y, z); m.scale.set(s, 1, s); scene.add(m); fx.push({ m, t, grow, kill: true }); return m; }
function damagePed(p, dmg, src) { if (!p.alive) return; p.hp -= dmg; p.flee = 6; SFX.hit(); if (p.hp <= 0) killPed(p, src); else if (p.type === 'civ') p.hostile = false; }
function killPed(p, src) { p.alive = false; spr(bloodMat, p.x, p.z, 2, 25, .1); p.mesh.rotation.z = 0; p.mesh.children.forEach(c => c.material = c.material === horseMat ? deadHorseMat : c.material); p.mesh.scale.set(1, 1, .5); p.deadT = 20;
  if (src === 'player') { addMoney(p.type === 'cop' || p.type === 'soldier' || p.type === 'gend' ? 100 : 20); crime(p.type === 'cop' || p.type === 'gend' || p.type === 'soldier' ? 6 : 2); if (rnd() < .25) dropPickup(p.x, p.z); } }
function damageVeh(v, dmg, horse, src) { if (!v.alive || v.d.rail) return; if (horse && v.d.horses) { v.horseHp -= dmg; if (v.horseHp <= 0 && !v.horseDead) { v.horseDead = true; { const sp = Math.hypot(v.vx, v.vz); v.av = (rnd() < .5 ? -1 : 1) * (5 + sp * .5); v.vx *= 1.1; v.vz *= 1.1; v.hp -= 10; if (v.driver && v.driver.inVeh !== undefined) {} } v.hs.forEach(h => h.material = deadHorseMat); pager(v === player.veh ? 'Your horses are down!' : 'Horses down!', 2); } return; }
  v.hp -= dmg; if (v.hp <= 0 && !v.burn) { v.burn = 3; } if (src === 'player' && v.police) crime(.5); }
function explode(x, z, r = 6, dmg = 160) { SFX.boom(); spr(flashMat, x, z, r * 1.6, .5, 3, 14); for (let k = 0; k < 5; k++) spr(smokeMat, x + (rnd() - .5) * 4, z + (rnd() - .5) * 4, 3, 1.5 + rnd(), 2.5, 3);
  for (const p of peds) if (p.alive && d2(p.x, p.z, x, z) < r * r) damagePed(p, dmg, 'player');
  for (const v of vehs) if (v.alive && d2(v.x, v.z, x, z) < (r + 2) ** 2) { damageVeh(v, dmg, false, 'player'); damageVeh(v, dmg * .5, true, 'player'); }
  for (const p of propsNear(x, z)) if (d2(p.x, p.z, x, z) < r * r) damageProp(p, dmg);
  if (!player.veh && d2(player.x, player.z, x, z) < r * r) hurtPlayer(dmg * .5); camShake = .6; }
function damageProp(p, dmg) { if (!p.alive || p.hp > 1e8) return; p.hp -= dmg; if (p.hp <= 0) { p.alive = false; setPropM(p); spr(smokeMat, p.x, p.z, 2, .8, 1, 2); if (p.type === 'lamp') killLampPool(p); if (p.type === 'wallace' || p.type === 'trough') for (let k = 0; k < 4; k++) spr(spriteMat('wat', 4, 4, g => { g.fillStyle = '#7ab'; g.fillRect(0, 0, 4, 4); }), p.x + (rnd() - .5) * 3, p.z + (rnd() - .5) * 3, .6, 1.2, .3); SFX.crash(); } }
function hurtPlayer(d) { if (player.god === true || !player.alive) return; player.hp -= d; flash = .25; if (player.hp <= 0) die('WASTED'); }
let flash = 0, camShake = 0;
// hitscan from (x,z) dir a; returns end point
function hitscan(x, z, a, rng, dmg, src, ignore) { const dx = Math.cos(a), dz = Math.sin(a); let ex = x, ez = z;
  for (let s = .5; s < rng; s += .5) { ex = x + dx * s; ez = z + dz * s; if (pedBlock(ex, ez) && kAt(ex, ez) === K.BLD) break;
    for (const p of peds) if (p.alive && !p.inVeh && p !== ignore && Math.abs(p.x - ex) < .8 && Math.abs(p.z - ez) < .8) { damagePed(p, dmg, src); return [ex, ez]; }
    for (const v of vehs) { if (!v.alive || v === ignore) continue; const lx = (ex - v.x) * Math.cos(v.a) + (ez - v.z) * Math.sin(v.a), lz = -(ex - v.x) * Math.sin(v.a) + (ez - v.z) * Math.cos(v.a);
      const front = v.d.horses ? v.d.len / 2 + 2.4 + (v.d.horses === 3 ? 2.8 : 0) : 0; const hb = lx > v.d.len / 2 ? .7 : .2; if (Math.abs(lz) < v.d.wid / 2 + hb && lx > -v.d.len / 2 && lx < v.d.len / 2 + front) { damageVeh(v, dmg, lx > v.d.len / 2, src); if (v === player.veh) hurtPlayer(dmg * .15); return [ex, ez]; } }
    if (src !== 'player' && !player.veh && player !== ignore && Math.abs(player.x - ex) < .7 && Math.abs(player.z - ez) < .7) { hurtPlayer(dmg); return [ex, ez]; }
    for (const p of propsNear(ex, ez)) if (p.r > 0 && d2(p.x, p.z, ex, ez) < p.r * p.r) { damageProp(p, dmg); return [ex, ez]; } }
  return [ex, ez]; }
function fireWeapon(x, z, a, src = 'player', ignore) { const w = WEAP[player.w]; if (player.cd > 0) return false; player.cd = w.rate;
  if (w.melee) { SFX.swing(); const hx_ = x + Math.cos(a) * w.rng * .7, hz = z + Math.sin(a) * w.rng * .7; let hit = false;
    for (const p of peds) if (p.alive && d2(p.x, p.z, hx_, hz) < (w.rng * .8) ** 2) { damagePed(p, w.dmg, src); hit = true; if (p.type === 'cop' || p.type === 'gend') crime(2); else crime(.4); break; }
    if (!hit) for (const p of propsNear(hx_, hz)) if (d2(p.x, p.z, hx_, hz) < (p.r + 1) ** 2) { damageProp(p, w.dmg); hit = true; break; }
    if (!hit) for (const v of vehs) if (v.alive && v !== player.veh && d2(v.x, v.z, hx_, hz) < 9) { damageVeh(v, w.dmg * .5, false, src); break; }
    player.punch = .2; return true; }
  if (w.id !== 'fists') { player.ammo[w.id]--; if (player.ammo[w.id] <= 0) { delete player.ammo[w.id]; setTimeout(() => cycleW(1), 0); } }
  if (w.throw) { projs.push({ type: w.throw, x, z, vx: Math.cos(a) * 16, vz: Math.sin(a) * 16, t: w.throw === 'dynamite' ? 1.6 : .7, m: spr(w.throw === 'brick' ? PT.crate.mat : w.throw === 'dynamite' ? spriteMat('dyn', 8, 8, g => { g.fillStyle = '#c02020'; g.fillRect(1, 3, 6, 2); g.fillStyle = '#fe4'; g.fillRect(7, 3, 1, 1); }) : spriteMat('bottle', 8, 8, g => { g.fillStyle = '#6c4'; g.fillRect(2, 3, 5, 2); g.fillStyle = '#f80'; g.fillRect(7, 3, 1, 2); }), x, z, .7, 99, 1.5) }); SFX.swing(); return true; }
  SFX[w.snd](); crime(copsNear(25) ? 1.2 : .3); spr(flashMat, x + Math.cos(a) * 1.2, z + Math.sin(a) * 1.2, 1.2, .05, 1.3);
  for (let k = 0; k < (w.pellets || 1); k++) { const aa = a + (w.spread ? (rnd() - .5) * w.spread : (rnd() - .5) * .04); const e = hitscan(x, z, aa, w.rng, w.dmg, src, ignore || player.veh); tracer(x, z, e[0], e[1]); }
  for (const p of peds) if (p.alive && p.type === 'civ' && d2(p.x, p.z, x, z) < 400) p.flee = 6;
  return true; }
function npcShoot(sh, tx, tz, dmg = 8, acc = .15) { const a = Math.atan2(tz - sh.z, tx - sh.x) + (rnd() - .5) * acc * 2; SFX.shot(); const e = hitscan(sh.x + Math.cos(a), sh.z + Math.sin(a), a, 40, dmg, 'npc', sh); tracer(sh.x, sh.z, e[0], e[1]);
  if (player.veh && d2(e[0], e[1], player.veh.x, player.veh.z) < 30) { } }
// ================= VEHICLE PHYSICS =================
function vehCorners(v, x, z, a) { const c = Math.cos(a), s = Math.sin(a), L = v.d.len / 2 + (v.d.horses ? 2.2 : 0), Wd = v.d.wid / 2; const pts = [];
  for (const [lx, lz] of [[L, Wd], [L, -Wd], [-v.d.len / 2, Wd], [-v.d.len / 2, -Wd], [L, 0], [0, Wd], [0, -Wd]]) pts.push([x + lx * c - lz * s, z + lx * s + lz * c]); return pts; }
function driveVeh(v, thr, steer, dt, handbrake) { const d = v.d; if (d.rail) return driveRail(v, thr, dt);
  const t = tileAt(v.x, v.z), sf = SURF[t >= 0 ? surf[t] : 0]; let grip = sf.grip * (1 - rain * .35), top = d.spd * sf.spd;
  if (v.horseDead || v.wreck) { thr = 0; top = 0; }
  const fx_ = Math.cos(v.a), fz = Math.sin(v.a); let fwd = v.vx * fx_ + v.vz * fz, lat = -v.vx * fz + v.vz * fx_;
  if (thr > 0) fwd += d.acc * thr * dt * (fwd < 0 ? 2 : 1); else if (thr < 0) fwd += (fwd > 1 ? -d.acc * 2.2 : -d.acc * .6) * -thr * dt;
  fwd = Math.max(-top * .35, Math.min(top, fwd)); if (Math.abs(thr) < .05) fwd *= (1 - 1.2 * dt);
  if (fwd > top) fwd -= (fwd - top) * 3 * dt;
  lat *= Math.max(0, 1 - (handbrake ? 1.2 : 7 * grip) * dt);
  const turnK = Math.min(1, Math.abs(fwd) / 6) * Math.sign(fwd || 1);
  if (v.horseDead) { v.a += v.av * dt; v.av *= (1 - 1.5 * dt); fwd *= (1 - 2 * dt); } else v.a += steer * d.turn * turnK * dt * (1 + (1 - grip) * .4);
  v.vx = fx_ * fwd - fz * lat; v.vz = fz * fwd + fx_ * lat; moveVeh(v, dt); }
function moveVeh(v, dt) { const nx = v.x + v.vx * dt, nz = v.z + v.vz * dt; const sp = Math.hypot(v.vx, v.vz);
  if (vehCorners(v, nx, nz, v.a).some(p => vehBlock(p[0], p[1]))) { if (!vehCorners(v, nx, v.z, v.a).some(p => vehBlock(p[0], p[1]))) { v.x = nx; v.vz *= -.25; } else if (!vehCorners(v, v.x, nz, v.a).some(p => vehBlock(p[0], p[1]))) { v.z = nz; v.vx *= -.25; } else { v.vx *= -.3; v.vz *= -.3; }
    if (sp > 8) { damageVeh(v, sp * 1.2); if (v === player.veh) { SFX.crash(); camShake = .3; } } return; }
  v.x = Math.max(2, Math.min(W - 2, nx)); v.z = Math.max(2, Math.min(W - 2, nz));
  // props
  for (const p of propsNear(v.x, v.z)) if (p.r > 0 && d2(p.x, p.z, v.x + Math.cos(v.a) * v.d.len * .5, v.z + Math.sin(v.a) * v.d.len * .5) < (p.r + 1.4) ** 2) { if (sp > 6 && p.hp < 400) { damageProp(p, sp * 6); v.vx *= .7; v.vz *= .7; } else { v.vx *= -.3; v.vz *= -.3; v.x -= Math.cos(v.a) * .3; v.z -= Math.sin(v.a) * .3; } }
  // peds
  if (sp > 3) for (const p of peds) if (p.alive && !p.inVeh && !(p.type === 'vip' && sp < 12) && d2(p.x, p.z, v.x + Math.cos(v.a) * v.d.len * .4, v.z + Math.sin(v.a) * v.d.len * .4) < (v.d.len * .5 + 1) ** 2) { damagePed(p, sp * 4, v === player.veh ? 'player' : 'veh'); if (p.alive) { p.x += v.vx * .1; p.z += v.vz * .1; } }
  // vehicles
  for (const o of vehs) { if (o === v || !o.alive) continue; const r = (v.d.len + o.d.len) * .42; const dd = d2(o.x, o.z, v.x, v.z); if (dd < r * r && dd > .01) { const dist = Math.sqrt(dd), nx2 = (v.x - o.x) / dist, nz2 = (v.z - o.z) / dist, push = (r - dist) * .5;
    if (o.d.rail) { v.x += nx2 * push * 2; v.z += nz2 * push * 2; } else { v.x += nx2 * push; v.z += nz2 * push; o.x -= nx2 * push; o.z -= nz2 * push; }
    const rel = (v.vx - o.vx) * nx2 + (v.vz - o.vz) * nz2; if (rel < 0) { v.vx -= rel * nx2 * .8; v.vz -= rel * nz2 * .8; if (!o.d.rail) { o.vx += rel * nx2 * .6; o.vz += rel * nz2 * .6; } if (-rel > 7) { damageVeh(v, -rel * 1.5); damageVeh(o, -rel * 1.5, false, v === player.veh ? 'player' : ''); if (v === player.veh || o === player.veh) { SFX.crash(); camShake = .3; if (o.police || v.police) crime(.6); } } } } }
  // player on foot
  if (!player.veh && sp > 3 && d2(player.x, player.z, v.x, v.z) < (v.d.len * .5 + .8) ** 2) { hurtPlayer(sp * 2); player.x += v.vx * .15; player.z += v.vz * .15; } }
// rail vehicles: tram along x on z=41T; train along z on x=5.5T
function driveRail(v, thr, dt) { const d = v.d; let sp = v.sp || 0; sp += thr * d.acc * dt; if (Math.abs(thr) < .05) sp *= 1 - .3 * dt; sp = Math.max(-d.spd, Math.min(d.spd, sp)); v.sp = sp;
  if (d.rail === 'x') { v.x += sp * dt; if (v.x > 99 * T) { v.x = 99 * T; v.sp = -Math.abs(sp) * .2; } if (v.x < 15 * T) { v.x = 15 * T; v.sp = Math.abs(sp) * .2; } v.a = sp >= 0 ? 0 : Math.PI; v.vx = sp; v.vz = 0; }
  else { v.z += sp * dt; if (v.z > W + 30) v.z = -30; if (v.z < -30) v.z = W + 30; v.a = Math.PI / 2; v.vz = sp; v.vx = 0; }
  const asp = Math.abs(sp); if (asp > 2) { for (const p of peds) if (p.alive && Math.abs(p.x - v.x) < (d.rail === 'x' ? d.len / 2 + .8 : 2) && Math.abs(p.z - v.z) < (d.rail === 'x' ? 2 : d.len * 2.4)) damagePed(p, 100, v === player.veh ? 'player' : 'veh');
    for (const o of vehs) if (o !== v && o.alive && !o.d.rail && Math.abs(o.x - v.x) < (d.rail === 'x' ? d.len / 2 + 2 : 2.5) && Math.abs(o.z - v.z) < (d.rail === 'x' ? 2.4 : d.len * 2.5)) { damageVeh(o, asp * 4); o.vx += (d.rail === 'x' ? Math.sign(sp) * 10 : (o.x > v.x ? 8 : -8)); o.vz += (d.rail === 'z' ? Math.sign(sp) * 10 : (o.z > v.z ? 8 : -8)); }
    if (!player.veh && Math.abs(player.x - v.x) < (d.rail === 'x' ? d.len / 2 + .6 : 1.8) && Math.abs(player.z - v.z) < (d.rail === 'x' ? 1.8 : d.len * 2.4)) hurtPlayer(200); } }
// ================= PLAYER CONTROL =================
function enterExit() { if (player.veh) { const v = player.veh; const s = Math.hypot(v.vx, v.vz) + Math.abs(v.sp || 0); if (s > 6) return; player.veh = null; v.driver = null;
    let ex = v.x - Math.sin(v.a) * (v.d.wid / 2 + 1), ez = v.z + Math.cos(v.a) * (v.d.wid / 2 + 1); if (pedBlock(ex, ez)) { ex = v.x + Math.sin(v.a) * (v.d.wid / 2 + 1); ez = v.z - Math.cos(v.a) * (v.d.wid / 2 + 1); }
    player.x = ex; player.z = ez; player.mesh.visible = true; return; }
  let best = null, bd = 30; for (const v of vehs) { if (!v.alive || v.wreck) continue; const dd = d2(v.x, v.z, player.x, player.z); const rr = (v.d.len / 2 + 2.5) ** 2 + (v.type === 'train' ? 60 : 0); if (dd < rr && dd < bd) { bd = dd; best = v; } }
  if (!best) return; const v = best;
  if (v.driver) { const dr = v.driver; dr.alive = true; dr.x = v.x - Math.sin(v.a) * 2; dr.z = v.z + Math.cos(v.a) * 2; dr.inVeh = null; dr.mesh.visible = true; dr.flee = 8; if (!peds.includes(dr)) peds.push(dr); v.driver = null; SFX.hit();
    if (v.police) { crime(4); } else crime(1); if (dr.type === 'cop') dr.hostile = true; pager(v.police ? 'You pulled a sergent off his own carriage!' : 'Carriage jacked!', 1.5); }
  if (v.traffic) v.traffic = false; v.parked = false; player.veh = v; v.driver = 'player'; player.mesh.visible = false; if (v.hp < 0) v.hp = 1; }
function updatePlayer(I, dt) { player.cd -= dt; player.punch -= dt;
  if (I.enter) enterExit(); if (I.prev) cycleW(-1); if (I.next) cycleW(1);
  const v = player.veh;
  if (v) { let thr = I.thr, steer = I.steer;
    if (I.stick && Math.hypot(I.mx, I.my) > .2) { const ta = Math.atan2(I.my, I.mx), da = ang(ta - v.a); const mag = Math.min(1, Math.hypot(I.mx, I.my));
      if (Math.abs(da) > 2.4 && Math.hypot(v.vx, v.vz) < 4) { thr = -mag; steer = Math.max(-1, Math.min(1, -ang(ta + Math.PI - v.a) * 2)); } else { thr = Math.abs(da) > 1.9 ? -1 : mag; steer = Math.max(-1, Math.min(1, da * 2.5)); } }
    driveVeh(v, thr, steer, dt, keys.ShiftLeft); player.x = v.x; player.z = v.z;
    if (I.fire && !WEAP[player.w].melee && !WEAP[player.w].throw) fireWeapon(v.x + Math.cos(v.a) * (v.d.len / 2 + 3), v.z + Math.sin(v.a) * (v.d.len / 2 + 3), v.a);
    else if (I.fire && WEAP[player.w].throw) fireWeapon(v.x, v.z, v.a + Math.PI / 2);
    const sp = Math.hypot(v.vx, v.vz) + Math.abs(v.sp || 0); if (v.d.horses && !v.horseDead) { v.hoof = (v.hoof || 0) - dt * sp * .35; if (v.hoof < 0) { v.hoof = 1; SFX.hoof(); } }
    if (v.burn) hurtPlayer(dt * 8); return; }
  const m = Math.hypot(I.mx, I.my); const run = m > .2;
  if (run) { const a = Math.atan2(I.my, I.mx); player.a = a; const sp = 7 * Math.min(1, m) * (keys.ShiftLeft ? .5 : 1); const nx = player.x + Math.cos(a) * sp * dt, nz = player.z + Math.sin(a) * sp * dt;
    const blocked = (x, z) => pedBlock(x, z) || propsNear(x, z).some(p => p.r > 0 && d2(p.x, p.z, x, z) < (p.r + .3) ** 2) || vehs.some(o => o.alive && d2(o.x, o.z, x, z) < (o.d.wid * .5 + .4) ** 2);
    if (!blocked(nx, player.z)) player.x = nx; if (!blocked(player.x, nz)) player.z = nz; player.walkT += dt * sp; }
  if (I.fire) fireWeapon(player.x, player.z, player.a);
  // pickups
  for (const pk of pickups) if (pk.alive && d2(pk.x, pk.z, player.x, player.z) < 2.6) collectPickup(pk); }
// ================= PICKUPS =================
const PKM = {};
function pkMat(kind) { if (PKM[kind]) return PKM[kind]; const col = { brick: '#999', swordcane: '#ccc', revolver: '#ddd', shotgun: '#b84', winchester: '#da6', dynamite: '#d22', molotov: '#6c4', health: '#f44', money: '#fd2', mission: '#f0f', armor: '#48f' }[kind] || '#fff';
  return PKM[kind] = spriteMat('pk' + kind, 16, 16, g => { g.fillStyle = '#000'; g.fillRect(1, 1, 14, 14); g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(2, 2, 12, 12); g.fillStyle = col; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.fillText(kind === 'health' ? '+' : kind === 'money' ? '₣' : kind === 'mission' ? '★' : kind[0].toUpperCase(), 8, 12); }); }
function addPickup(kind, x, z, o = {}) { const m = new THREE.Mesh(PG, pkMat(kind)); m.scale.set(1.6, 1, 1.6); m.position.set(x, 1, z); scene.add(m); const p = Object.assign({ kind, x, z, m, alive: true }, o); pickups.push(p); return p; }
function dropPickup(x, z) { addPickup(rnd() < .6 ? 'money' : 'revolver', x, z, { temp: 20 }); }
function collectPickup(pk) { pk.alive = false; pk.m.visible = false; if (pk.respawn) pk.rt = pk.respawn;
  if (pk.kind === 'health') { player.hp = 100; pager('Vin rouge — health restored', 1.5); } else if (pk.kind === 'money') addMoney(pk.amt || 250); else if (pk.kind === 'mission') { pk.got = true; SFX.cash(); }
  else { giveWeapon(pk.kind); player.w = WI[pk.kind]; pager(WEAP[WI[pk.kind]].n + '!', 1.5); SFX.cash(); } }
const PK_SPOTS = [['brick', 'tertre'], ['swordcane', 'garnier'], ['revolver', 'chien'], ['revolver', 'procope'], ['shotgun', 'abattoir'], ['shotgun', 'bourse'], ['winchester', 'railyard'], ['winchester', 'sorbonne'], ['dynamite', 'ivry'], ['dynamite', 'catacombs'], ['molotov', 'ratmort'], ['molotov', 'chatnoir'], ['health', 'hoteldieu'], ['health', 'galette'], ['health', 'cafepaix'], ['brick', 'belleville'], ['revolver', 'boulmich'], ['health', 'cellier']];
PK_SPOTS.forEach(([k, poi], i) => { const [x, z] = POI[poi]; const [x2, z2] = snapWalk(Math.floor(x / T) + (i % 3) - 1, Math.floor(z / T) + 2, false); addPickup(k, x2, z2, { respawn: 30 }); });
// phones & kiosk
const PHONES = []; for (const f in FACTIONS) { const [x, z] = POI[FACTIONS[f].phone]; const p = addDynProp('phone', x, z); p.fac = f; PHONES.push(p); }
{ const [x, z] = POI.boulevard; const p = addDynProp('phone', x, z); p.fac = 'side'; PHONES.push(p); }
const ringMat = new THREE.MeshBasicMaterial({ color: 0xf4c430, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false });
const phoneRings = PHONES.map(p => { const r = new THREE.Mesh(new THREE.RingGeometry(1.6, 2, 16), ringMat.clone()); r.rotation.x = -Math.PI / 2; r.position.set(p.x, .4, p.z); r.material.color.set({ apache: 0xe02020, avant: 0xa060e0, velvet: 0xe060c0, crimson: 0xff4020, side: 0xf4c430 }[p.fac]); scene.add(r); return r; });
const objMarker = new THREE.Mesh(new THREE.RingGeometry(2.2, 3, 20), new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false })); objMarker.rotation.x = -Math.PI / 2; scene.add(objMarker);
const objArrow = new THREE.Mesh(new THREE.ConeGeometry(.9, 2, 4), new THREE.MeshBasicMaterial({ color: 0xffe040 })); objArrow.rotation.x = Math.PI; scene.add(objArrow);
// ================= TRAFFIC =================
const NODE = (a) => (a * 10 + 1) * T; // intersection centre coordinate
function edgeOK(a, b, a2, b2) { if (a2 < 0 || b2 < 0 || a2 > 11 || b2 > 11) return false; for (let s = 0; s <= 10; s++) { const x = NODE(a) + (NODE(a2) - NODE(a)) * s / 10, z = NODE(b) + (NODE(b2) - NODE(b)) * s / 10; const k = kAt(x, z); if (!(k === K.ROAD || k === K.BRIDGE)) return false; } return true; }
const NB = {}; for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) NB[a + ',' + b] = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([da, db]) => edgeOK(a, b, a + da, b + db)).map(([da, db]) => [a + da, b + db]);
const TRAFFIC_T = ['brougham', 'brougham', 'brougham', 'gig', 'gig', 'phaeton', 'barouche', 'omnibus'];
function spawnTraffic(px, pz) { for (let tries = 0; tries < 8; tries++) { const a = Math.floor(rnd() * 12), b = Math.floor(rnd() * 12); const nb = NB[a + ',' + b]; if (!nb.length) continue; const x = NODE(a), z = NODE(b); const dd = d2(x, z, px, pz); if (dd < 45 * 45 || dd > 90 * 90) continue;
    const to = nb[Math.floor(rnd() * nb.length)]; const ty = TRAFFIC_T[Math.floor(rnd() * TRAFFIC_T.length)]; const v = spawnVeh(ty, x, z, Math.atan2(NODE(to[1]) - z, NODE(to[0]) - x), { traffic: true, from: [a, b], to });
    v.driver = spawnPed('civ', x, z, { inVeh: v }); v.driver.mesh.visible = false; peds.splice(peds.indexOf(v.driver), 1); return v; } }
function trafficAI(v, dt) { if (v.horseDead || v.burn) { driveVeh(v, 0, 0, dt); return; } const [a2, b2] = v.to, lane = 1.1; const tx = NODE(a2), tz = NODE(b2); const dx = tx - NODE(v.from[0]), dz = tz - NODE(v.from[1]); const l = Math.hypot(dx, dz) || 1;
  const ox = -dz / l * lane, oz = dx / l * lane; const gx = tx + ox, gz = tz + oz; if (d2(v.x, v.z, gx, gz) < 9) { const nb = NB[a2 + ',' + b2].filter(n => !(n[0] === v.from[0] && n[1] === v.from[1])); const n = nb.length ? nb[Math.floor(rnd() * nb.length)] : v.from; v.from = [a2, b2]; v.to = n; }
  const ta = Math.atan2(gz - v.z, gx - v.x), da = ang(ta - v.a); let thr = Math.abs(da) > 1 ? .2 : .55; const pp = ppos();
  // brake for obstacles ahead
  const fx_ = v.x + Math.cos(v.a) * 6, fz = v.z + Math.sin(v.a) * 6; if (d2(fx_, fz, pp[0], pp[1]) < 12 || vehs.some(o => o !== v && o.alive && d2(o.x, o.z, fx_, fz) < 10) || peds.some(p => p.alive && d2(p.x, p.z, fx_, fz) < 4)) thr = -.6;
  if (v.panic) thr = 1; driveVeh(v, thr, Math.max(-1, Math.min(1, da * 2)), dt); }
// ================= PED AI =================
function pedAI(p, dt) { if (!p.alive) { p.deadT -= dt; if (p.deadT < 0) removePed(p); return; } p.cd -= dt; p.t += dt; const [px, pz] = ppos(); const dP = Math.sqrt(d2(p.x, p.z, px, pz));
  let mx = 0, mz = 0, sp = p.spd;
  const lawman = p.type === 'cop' || p.type === 'gend' || p.type === 'soldier';
  const hostile = (lawman && wanted > 0) || p.hostile;
  if (hostile && player.alive) { const a = Math.atan2(pz - p.z, px - p.x); p.a = a;
    if (p.type === 'soldier') { /* holds the line */ if (p.cd < 0 && dP < 45) { p.cd = 3; npcShoot(p, px, pz, 14, .12); } }
    else if (p.armed && dP < 28 && dP > 4) { if (p.cd < 0) { p.cd = 1.1 + rnd(); npcShoot(p, player.veh && rnd() < .5 ? player.veh.x + Math.cos(player.veh.a) * player.veh.d.len : px, player.veh ? player.veh.z + Math.sin(player.veh.a) * player.veh.d.len : pz, p.boss ? 12 : 7, .14); } if (dP > 12) { mx = Math.cos(a); mz = Math.sin(a); } }
    else { if (dP > 1.4) { mx = Math.cos(a); mz = Math.sin(a); } else if (p.cd < 0) { p.cd = .8; SFX.swing(); if (lawman && (!player.veh || Math.hypot(player.veh.vx, player.veh.vz) < 2.5)) { bustT += .9; } else if (!player.veh) hurtPlayer(p.type === 'gend' ? 14 : 8); } }
    if (lawman && p.type === 'cop' && p.cd < -3 && dP < 30) { p.cd = 0; SFX.whistle(); }
  } else if (p.flee > 0) { p.flee -= dt; const a = Math.atan2(p.z - pz, p.x - px); mx = Math.cos(a); mz = Math.sin(a); sp *= 2.2; }
  else if (p.follow) { const f = p.follow; if (d2(p.x, p.z, f[0], f[1]) > 4) { const a = Math.atan2(f[1] - p.z, f[0] - p.x); mx = Math.cos(a); mz = Math.sin(a); sp *= 1.8; } }
  else if (!p.stand) { if (rnd() < dt * .3) p.wander += (rnd() - .5) * 2; mx = Math.cos(p.wander); mz = Math.sin(p.wander); }
  if (mx || mz) { const nx = p.x + mx * sp * dt, nz = p.z + mz * sp * dt; const bad = (x, z) => (p.mounted ? kAt(x, z) === K.STAIR || pedBlock(x, z) : pedBlock(x, z)) || (!hostile && p.type === 'civ' && !p.flee && kAt(x, z) === K.ROAD && kAt(p.x, p.z) !== K.ROAD);
    let moved = false; if (!bad(nx, p.z)) { p.x = nx; moved = true; } if (!bad(p.x, nz)) { p.z = nz; moved = true; } if (!moved || bad(nx, nz)) p.wander += 1.6 + rnd(); p.a = Math.atan2(mz, mx); } }
// ================= WANTED SYSTEM =================
let bustT = 0, spawnT = 0, barricadeT = 0;
const LV = [0, 1, 4, 9, 16];
function updateWanted(dt) { const prev = wanted; wanted = heat >= LV[4] ? 4 : heat >= LV[3] ? 3 : heat >= LV[2] ? 2 : heat >= LV[1] ? 1 : 0;
  if (wanted > prev) { pager(['', 'Sergents de ville alerted!', 'Gendarmerie à cheval on your trail!', 'Brigade Mobile carriages deployed!', 'MARTIAL LAW — the Army is mobilised!'][wanted], 2.5); SFX.whistle(); }
  const seen = copsNear(wanted >= 3 ? 50 : 35); if (wanted > 0) { if (seen) sightT = 0; else sightT += dt; if (sightT > (12 + wanted * 3)) { heat = LV[wanted - 1] + (wanted > 1 ? .5 : 0) - .01; if (wanted === 1) heat = 0; sightT = 0; pager('The trail goes cold... (-1 head)', 2); } }
  else heat = Math.max(0, heat - dt * .2);
  bustT = Math.max(0, bustT - dt * .4); if (bustT > 2.2) die('BUSTED');
  // spawn law
  spawnT -= dt; if (wanted > 0 && spawnT < 0) { spawnT = 4.5 - wanted * .6; const [px, pz] = ppos(); const cops = peds.filter(p => p.alive && (p.type === 'cop' || p.type === 'gend')).length, pv = vehs.filter(v => v.police && v.alive).length;
    const sp = () => { for (let k = 0; k < 10; k++) { const a = rnd() * 6.28, r = 28 + rnd() * 14, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r; if (!pedBlock(x, z) && kAt(x, z) !== K.STAIR) return [x, z]; } return null; };
    if (cops < 2 + wanted * 2) { const s = sp(); if (s) spawnPed(wanted >= 2 && rnd() < .55 ? 'gend' : 'cop', s[0], s[1]); }
    if (wanted >= 3 && pv < wanted - 1) { for (let k = 0; k < 8; k++) { const a = Math.floor(rnd() * 12), b = Math.floor(rnd() * 12), x = NODE(a), z = NODE(b), dd = d2(x, z, px, pz); if (dd > 35 * 35 && dd < 70 * 70 && NB[a + ',' + b].length) { const v = spawnVeh('police', x, z, 0, { police: true }); v.driver = 'cop'; break; } } } }
  if (wanted >= 4) { barricadeT -= dt; if (barricadeT < 0) { barricadeT = 14; spawnBarricade(); } }
  if (wanted === 0) for (const p of peds) if ((p.type === 'cop' || p.type === 'gend' || p.type === 'soldier') && p.alive && rnd() < dt * .2 && d2(p.x, p.z, ...ppos()) > 900) removePed(p); }
function spawnBarricade() { const [px, pz] = ppos(); const v = player.veh; const a = v ? v.a : player.a; let bx = px + Math.cos(a) * 30, bz = pz + Math.sin(a) * 30;
  const i = Math.round(bx / T / 10), j = Math.round(bz / T / 10); bx = NODE(Math.max(0, Math.min(11, i))); bz = NODE(Math.max(0, Math.min(11, j)));
  if (d2(bx, bz, px, pz) < 300) return; const horiz = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a));
  for (let k = -2; k <= 2; k++) { const x = bx + (horiz ? 0 : k * 2.4), z = bz + (horiz ? k * 2.4 : 0); if (!pedBlock(x, z)) addDynProp('barricade', x, z, { temp: 40 }); }
  for (let k = -2; k <= 2; k++) { const x = bx + (horiz ? -Math.sign(Math.cos(a)) * 3 : k * 2), z = bz + (horiz ? k * 2 : -Math.sign(Math.sin(a)) * 3); if (!pedBlock(x, z)) spawnPed('soldier', x, z, { stand: true, cd: k * .05 + 1.5 }); }
  pager('Barricade ahead! Rifle volleys!', 2); }
function policeAI(v, dt) { if (v.horseDead || v.burn) { driveVeh(v, 0, 0, dt); return; } const [px, pz] = ppos(); const ta = Math.atan2(pz - v.z, px - v.x), da = ang(ta - v.a); const dist = Math.sqrt(d2(v.x, v.z, px, pz));
  if (wanted === 0) { driveVeh(v, .3, Math.max(-1, Math.min(1, -da)), dt); if (dist > 90) { v.alive = false; removeVeh(v); } return; }
  v.stuck = (Math.hypot(v.vx, v.vz) < 1.5) ? (v.stuck || 0) + dt : 0; if (v.stuck > 1.2) { v.rev = 1; v.stuck = 0; } if (v.rev > 0) { v.rev -= dt; driveVeh(v, -1, Math.sign(da) * -1, dt); return; }
  driveVeh(v, dist < 6 ? .4 : 1, Math.max(-1, Math.min(1, da * 2.2)), dt);
  v.cd = (v.cd || 0) - dt; if (wanted >= 3 && dist < 26 && v.cd < 0) { v.cd = 1.2; const pv = player.veh; if (pv && pv.d.horses) { npcShoot(v, pv.x + Math.cos(pv.a) * (pv.d.len / 2 + 2), pv.z + Math.sin(pv.a) * (pv.d.len / 2 + 2), 9, .08); } else npcShoot(v, px, pz, 8, .14); }
  if (dist < 5 && !player.veh) bustT += dt * .8; }
// ================= DEATH / BUSTED =================
let deadT = 0;
function die(why) { if (!player.alive || player.god === true) return; player.alive = false; deadT = 3; big(why, 3); SFX.bell(); if (M) failMission(why === 'BUSTED' ? 'Busted!' : 'You died!'); }
function respawn(why) { const at = why === 'BUSTED' ? POI.prefecture : POI.hoteldieu; if (player.veh) { player.veh.driver = null; player.veh = null; }
  player.x = at[0]; player.z = at[1] + 2; player.hp = 100; player.alive = true; player.mesh.visible = true; heat = 0; wanted = 0; bustT = 0; const loss = Math.floor(money * .1); money -= loss;
  if (why === 'BUSTED') { player.ammo = { fists: 1e9 }; player.w = 0; pager(`Préfecture: fined ${loss} F and weapons confiscated.`, 3); } else pager(`Hôtel-Dieu: doctor's bill ${loss} F.`, 3);
  for (const p of [...peds]) if (p.type === 'soldier' || p.type === 'cop' || p.type === 'gend') removePed(p); for (const v of [...vehs]) if (v.police) removeVeh(v); mult = Math.max(1, mult - 1); }
// ================= MISSIONS =================
let M = null; // active mission
const byFac = {}; MISSIONS.forEach(m => (byFac[m.fac] = byFac[m.fac] || []).push(m));
const facName = f => f === 'side' ? 'Kiosque (side jobs)' : FACTIONS[f].name;
function nextFor(f) { return (byFac[f] || []).find(m => !done[m.id]) || null; }
function nearPOI(name, veh) { const p = (veh ? POIV : POI)[name]; return p; }
function ringPos(x, z, r) { for (let k = 0; k < 20; k++) { const a = rnd() * 6.28, rr = r * (.4 + rnd() * .6), xx = x + Math.cos(a) * rr, zz = z + Math.sin(a) * rr; if (!pedBlock(xx, zz) && kAt(xx, zz) !== K.STAIR) return [xx, zz]; } return [x, z]; }
function startMission(def) { if (M) return; M = { def, i: -1, ents: [], vehs: [], props: [], pks: [], t: 0 }; big(def.title, 2.5); pager(`${facName(def.fac)}: "${def.title}"${def.en ? ' (' + def.en + ')' : ''} — ${def.brief}`, 7); SFX.pager(); nextStep(); }
function cleanupStep() { if (!M) return; M.ents.forEach(p => { if (p.alive) { p.hostile = false; p.flee = 5; p.mission = false; } }); M.ents = []; M.props.forEach(p => { if (p.alive) { p.alive = false; setPropM(p); } }); M.props = []; M.pks.forEach(p => { p.alive = false; p.m.visible = false; }); M.pks = []; }
function nextStep() { cleanupStep(); M.i++; const s = M.def.steps[M.i]; if (!s) return completeMission(); M.s = s; M.t = 0; M.timer = s.time || 0; M.cp = 0; M.hold = 0; M.wave = 0; pager(s.text, 4);
  const [px, pz] = ppos(); const at = s.at ? POI[s.at] : null;
  switch (s.t) {
    case 'steal': { const have = player.veh && player.veh.type === s.vtype; if (have) break; if (s.vtype === 'tram') { M.target = vehs.find(v => v.type === 'tram' && v.alive) || (tram = spawnVeh('tram', 30 * T, 41 * T, 0, { railAuto: true })); break; }
      const vp = s.at ? POIV[s.at] : snapWalk(Math.floor(px / T) + 4, Math.floor(pz / T), true); const v = spawnVeh(s.vtype, vp[0], vp[1], 0, { parked: true, mission: true }); if (rnd() < .5) { v.driver = spawnPed('civ', vp[0], vp[1], { inVeh: v }); v.driver.mesh.visible = false; peds.splice(peds.indexOf(v.driver), 1); } M.target = v; break; }
    case 'kill': { if (s.give) { giveWeapon(s.give, s.give === 'swordcane' ? 1e9 : 60); player.w = WI[s.give]; } const n = s.n || 3; const col = FCOL[M.def.fac === 'apache' ? 'velvet' : M.def.fac === 'velvet' ? 'apache' : 'velvet'];
      for (let k = 0; k < n; k++) { const [x, z] = ringPos(at[0], at[1], 9); M.ents.push(spawnPed(k === 0 && s.boss ? 'boss' : 'gang', x, z, { mission: true, hostile: true, armed: s.armed && (k % 2 === 0 || s.boss), col: k === 0 && s.boss ? undefined : col })); } break; }
    case 'destroy': { const n = s.n || 2; for (let k = 0; k < n; k++) { const [x, z] = ringPos(at[0], at[1], 7); if (s.what === 'vehicle') { const vp = snapWalk(Math.floor(x / T), Math.floor(z / T), true); const v = spawnVeh(s.vtype || 'gig', vp[0] + k * 1.5, vp[1], k, { parked: true, mission: true }); M.vehs.push(v); }
        else M.props.push(addDynProp('crate', x, z, { hp: 60 })); } giveWeapon('molotov', 3); break; }
    case 'smash': { const n = s.n || 5; for (let k = 0; k < n; k++) { const [x, z] = ringPos(at[0], at[1], 5); M.props.push(addDynProp('table', x, z)); } break; }
    case 'collect': { const n = s.n || 4; for (let k = 0; k < n; k++) { const [x, z] = ringPos(at[0], at[1], 22); M.pks.push(addPickup('mission', x, z)); } break; }
    case 'escort': { const [x, z] = POI[s.at]; M.vip = spawnPed('vip', x, z, { mission: true, stand: true }); M.ents.push(M.vip); M.board = false; break; }
    case 'survive': { if (s.lvl) heat = Math.max(heat, LV[s.lvl] + .5); break; }
    case 'race': { M.cps = s.cps.map(c => POIV[c]); break; }
  } }
function stepTarget() { if (!M || !M.s) return null; const s = M.s; switch (s.t) {
  case 'goto': return POI[s.at]; case 'deliver': return POIV[s.at];
  case 'steal': { const v = M.target; if (v && v.alive) return [v.x, v.z]; return null; }
  case 'kill': { const a = M.ents.filter(p => p.alive); if (!a.length) return null; const [px, pz] = ppos(); a.sort((p, q) => d2(p.x, p.z, px, pz) - d2(q.x, q.z, px, pz)); return [a[0].x, a[0].z]; }
  case 'destroy': { const a = M.vehs.find(v => v.alive && !v.wreck) || M.props.find(p => p.alive); return a ? [a.x, a.z] : null; }
  case 'smash': { const a = M.props.find(p => p.alive); return a ? [a.x, a.z] : null; }
  case 'collect': { const a = M.pks.find(p => p.alive); return a ? [a.x, a.z] : null; }
  case 'escort': return M.board ? POIV[s.to] : [M.vip.x, M.vip.z];
  case 'race': return M.cps[M.cp]; case 'hold': return POI[s.at]; default: return null; } }
function updateMission(dt) { if (!M || !M.s || !player.alive) return; const s = M.s; M.t += dt; const [px, pz] = ppos(); const near = (p, r) => p && d2(p[0], p[1], px, pz) < r * r;
  const timed = s.time && !['survive', 'hold'].includes(s.t); if (timed) { M.timer -= dt; if (M.timer <= 0) return failMission('Out of time!'); }
  switch (s.t) {
    case 'goto': if ((near(POI[s.at], 6) || near(POIV[s.at], 6)) && (!s.foot || !player.veh)) nextStep(); break;
    case 'steal': if (player.veh && player.veh.type === s.vtype) { M.veh = player.veh; nextStep(); } else if (M.target && !M.target.alive) return failMission('The carriage was destroyed!'); break;
    case 'deliver': if (player.veh && near(POIV[s.at], 6) && Math.hypot(player.veh.vx, player.veh.vz) < 9) { if (M.veh && player.veh !== M.veh && M.veh.alive) { pager('Wrong carriage! Bring the one you took.', 1); break; } nextStep(); } else if (M.veh && (!M.veh.alive || M.veh.wreck)) return failMission('The cargo is lost!'); break;
    case 'kill': if (M.ents.every(p => !p.alive)) nextStep(); break;
    case 'destroy': if (M.vehs.every(v => !v.alive || v.wreck) && M.props.every(p => !p.alive)) nextStep(); break;
    case 'smash': if (M.props.every(p => !p.alive)) { addMoney(500); nextStep(); } break;
    case 'collect': if (M.pks.every(p => !p.alive)) nextStep(); break;
    case 'escort': { const v = M.vip; if (!v.alive) return failMission('Your passenger is dead!');
      if (!M.board) { if (player.veh && d2(v.x, v.z, px, pz) < 64 && Math.hypot(player.veh.vx, player.veh.vz) < 4) { M.board = true; M.bveh = player.veh; v.mesh.visible = false; v.inVeh = player.veh; v.stand = true; pager('Passenger aboard. Drive!', 2); } else if (player.veh && d2(v.x, v.z, px, pz) < 400) v.follow = [px, pz]; }
      else { v.x = M.bveh.x; v.z = M.bveh.z; if (!M.bveh.alive || M.bveh.burn) { M.vip.hp = 0; M.vip.alive = false; return failMission('Your passenger is dead!'); }
        if (player.veh === M.bveh && near(POIV[s.to], 6) && Math.hypot(player.veh.vx, player.veh.vz) < 9) { v.mesh.visible = true; v.x += 3; v.inVeh = null; v.stand = false; v.alive = true; addMoney(300); M.ents = M.ents.filter(e => e !== v); v.flee = 3; nextStep(); } } break; }
    case 'survive': { if (s.lose) { if (wanted === 0) nextStep(); } else { M.timer -= dt; if (wanted < s.lvl) heat = Math.max(heat, LV[s.lvl] + .5); if (M.timer <= 0) { heat = s.next0 ? 0 : heat; nextStep(); } } break; }
    case 'race': if (!player.veh) { if (M.t > 1) pager('Get back in a carriage!', .5); } else if (near(M.cps[M.cp], 7)) { M.cp++; SFX.pager(); if (M.cp >= M.cps.length) nextStep(); } break;
    case 'hold': { const p = POI[s.at]; if (near(p, 14)) { M.hold += dt; M.wave -= dt; if (M.wave < 0) { M.wave = 6; for (let k = 0; k < 2; k++) { const [x, z] = ringPos(p[0], p[1], 26); M.ents.push(spawnPed('gang', x, z, { mission: true, hostile: true, armed: s.armed && k === 0, col: FCOL.velvet })); } } if (M.hold >= s.time) nextStep(); } else if (M.t > 1) pager('Get back to the position!', .5); break; }
  } }
function completeMission() { const d = M.def; const first = !done[d.id]; done[d.id] = true; const got = addMoney(d.reward); if (d.fac !== 'side') { respect[d.fac] = Math.min(100, respect[d.fac] + d.respect); const r = FACTIONS[d.fac].rival; if (respect[r] !== undefined) respect[r] -= Math.round(d.respect / 2); }
  if (first) mult = Math.min(8, mult + (d.n % 5 === 0 || d.fac === 'side' && d.n % 7 === 0 ? 1 : 0)); big('MISSION COMPLETE', 3); pager(`+${got.toLocaleString()} F  ·  Respect ${d.fac !== 'side' ? facName(d.fac) + ' ' + respect[d.fac] : '+'}  ·  ×${mult}`, 4); SFX.bell();
  M.s = null; cleanupStep(); stats.completed++; M = null; save(); }
let lastFail = ''; function failMission(why) { if (!M) return; lastFail = M.def.id + ':' + (M.s && M.s.t) + ':' + why; big('MISSION FAILED', 3); pager(why, 3); cleanupStep(); M.vehs.forEach(v => v.mission = false); M = null; stats.failed++; }
const stats = { completed: 0, failed: 0 };
// ================= SAVE =================
function save() { try { localStorage.setItem('gtaParis1880', JSON.stringify({ money, mult, respect, done, ammo: player.ammo, gameTime })); } catch (e) { } }
function load() { try { const s = JSON.parse(localStorage.getItem('gtaParis1880')); if (!s) return false; money = s.money; mult = s.mult; respect = s.respect; done = s.done; player.ammo = s.ammo; player.ammo.fists = 1e9; gameTime = s.gameTime; return true; } catch (e) { return false; } }
// ================= WORLD SIM =================
let tram = spawnVeh('tram', 30 * T, 41 * T, 0, { railAuto: true }); tram.sp = 8;
let train = spawnVeh('train', 5.5 * T, 10, Math.PI / 2, { railAuto: true }); train.sp = 18; train.stopT = 0;
const PARKED = [['phaeton', 'garnier'], ['brougham', 'chien'], ['gig', 'tertre'], ['barouche', 'elysee'], ['omnibus', 'boulmich'], ['brougham', 'procope'], ['phaeton', 'bourse'], ['gig', 'bateau']];
PARKED.forEach(([t, p]) => { const [x, z] = POIV[p]; spawnVeh(t, x + 2, z, 0, { parked: true, home: true }); });
function railAuto(v, dt) { if (v.type === 'tram') { const dir = v.dirS || 1; if (Math.abs(v.sp) < .5 && (v.x >= 99 * T - 1 || v.x <= 15 * T + 1)) v.dirS = v.x > 50 * T ? -1 : 1; let thr = (v.dirS || 1);
    const [px, pz] = ppos(); if (Math.abs(pz - v.z) < 3 && (px - v.x) * Math.sign(v.sp || 1) > 0 && Math.abs(px - v.x) < 10) thr = -Math.sign(v.sp || 1); if (rnd() < dt * .5 && Math.abs(v.sp) > 3) SFX.hoof(); driveRail(v, thr * .6, dt); v.sp = Math.max(-9, Math.min(9, v.sp)); }
  else { // train: stop at Gare (z ~ 36*T) for 8s
    if (Math.abs(v.z - 36 * T) < 2 && v.stopT <= 0 && !v.justStopped) { v.stopT = 8; v.justStopped = true; v.sp = 0; } if (Math.abs(v.z - 36 * T) > 20) v.justStopped = false;
    if (v.stopT > 0) { v.stopT -= dt; v.sp = 0; if (v.stopT <= 0) { tone(330, .6, 'sawtooth', .05); v.sp = 2; } return; } driveRail(v, .6, dt); v.sp = Math.min(v.sp, 18);
    v.smk = (v.smk || 0) - dt; if (v.smk < 0) { v.smk = .25; spr(smokeMat, v.x, v.z + 2, 2.5, 2, 3, 2); } } }
function populate(dt) { const [px, pz] = ppos();
  const civs = peds.filter(p => p.type === 'civ' && p.alive).length; const want = 42;
  if (civs < want) for (let k = 0; k < 3; k++) { const a = rnd() * 6.28, r = 30 + rnd() * 30, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r; const kk = kAt(x, z); if (kk === K.SIDE || kk === K.PARK || kk === K.STAIR) { spawnPed('civ', x, z); break; } }
  const tr = vehs.filter(v => v.traffic).length; if (tr < (20)) spawnTraffic(px, pz);
  for (const p of [...peds]) if (!p.mission && d2(p.x, p.z, px, pz) > 100 * 100) removePed(p);
  for (const v of [...vehs]) if ((v.traffic || (v.wreck && !v.mission) || (v.police && wanted === 0)) && v !== player.veh && d2(v.x, v.z, px, pz) > 110 * 110) removeVeh(v);
  for (const p of props) if (p.temp && p.alive) { p.temp -= dt; if (p.temp < 0) { p.alive = false; setPropM(p); } }
  // gang presence by turf when respect low
  if (rnd() < dt * .2) { const d = dist[tileAt(px, pz)] ?? 1; const fac = d === 0 ? 'avant' : d === 2 ? 'apache' : d === 6 ? 'crimson' : d === 1 ? 'velvet' : null;
    if (fac && peds.filter(p => p.gang && p.alive).length < 4) { const a = rnd() * 6.28, x = px + Math.cos(a) * 35, z = pz + Math.sin(a) * 35; if (!pedBlock(x, z)) spawnPed('gang', x, z, { gang: fac, col: FCOL[fac], hostile: respect[fac] < -10, armed: respect[fac] < -30 }); } } }
function updateProjs(dt) { for (let k = projs.length - 1; k >= 0; k--) { const p = projs[k]; p.t -= dt; const nx = p.x + p.vx * dt, nz = p.z + p.vz * dt; let hit = pedBlock(nx, nz) && kAt(nx, nz) === K.BLD;
    if (!hit && p.type !== 'dynamite') hit = peds.some(q => q.alive && d2(q.x, q.z, nx, nz) < 1) || vehs.some(v => v.alive && v !== player.veh && d2(v.x, v.z, nx, nz) < 4) || propsNear(nx, nz).some(q => q.r > 0 && d2(q.x, q.z, nx, nz) < (q.r + .3) ** 2);
    if (hit) { p.vx *= -.2; p.vz *= -.2; } else { p.x = nx; p.z = nz; } p.vx *= (1 - dt * 1.5); p.vz *= (1 - dt * 1.5); p.m.position.set(p.x, 1 + Math.max(0, p.t) * 2, p.z); p.m.rotation.y += dt * 10;
    if (hit && p.type !== 'dynamite' || p.t <= 0) { scene.remove(p.m); fx.splice(fx.findIndex(f => f.m === p.m), 1); projs.splice(k, 1);
      if (p.type === 'brick') { for (const q of peds) if (q.alive && d2(q.x, q.z, p.x, p.z) < 2.5) { damagePed(q, 40, 'player'); break; } for (const q of propsNear(p.x, p.z)) if (d2(q.x, q.z, p.x, p.z) < 4) damageProp(q, 30); for (const v of vehs) if (v.alive && v !== player.veh && d2(v.x, v.z, p.x, p.z) < 9) damageVeh(v, 15, true, 'player'); SFX.hit(); }
      else if (p.type === 'dynamite') explode(p.x, p.z, 6, 170);
      else { SFX.crash(); fires.push({ x: p.x, z: p.z, t: 5, m: spr(fireMat, p.x, p.z, 4, 5, .6) }); crime(1); } } }
  for (let k = fires.length - 1; k >= 0; k--) { const f = fires[k]; f.t -= dt; f.m.rotation.y += dt * 3; if (f.t < 0) { fires.splice(k, 1); continue; }
    for (const q of peds) if (q.alive && d2(q.x, q.z, f.x, f.z) < 6) damagePed(q, 30 * dt, 'player'); for (const v of vehs) if (v.alive && d2(v.x, v.z, f.x, f.z) < 9) damageVeh(v, 30 * dt, false, 'player'); for (const q of propsNear(f.x, f.z)) if (d2(q.x, q.z, f.x, f.z) < 9) damageProp(q, 25 * dt);
    if (!player.veh && d2(player.x, player.z, f.x, f.z) < 5) hurtPlayer(15 * dt); } }
const fires = [];
function updateFx(dt) { for (let k = fx.length - 1; k >= 0; k--) { const f = fx[k]; f.t -= dt; if (f.grow) { const s = f.m.scale.x + f.grow * dt; f.m.scale.set(s, 1, s); } if (f.t <= 0) { scene.remove(f.m); if (f.m.geometry !== PG) f.m.geometry.dispose(); fx.splice(k, 1); } } }
function updateVehs(dt) { for (const v of [...vehs]) { if (!v.alive) continue; v.t += dt;
    if (v.burn) { v.burn -= dt; if (rnd() < dt * 8) spr(fireMat, v.x + (rnd() - .5) * 2, v.z + (rnd() - .5) * 2, 2, .4, 1.5); if (v.burn <= 0) { v.burn = 0; v.wreck = true; v.hp = 0; v.body.material = wreckMat; v.hs.forEach(h => h.visible = false); explode(v.x, v.z, 5, 100); if (v.police) crime(3); if (player.veh === v) { hurtPlayer(80); enterExitForce(); } v.vx = v.vz = 0; } }
    if (v === player.veh) continue;
    if (v.railAuto) railAuto(v, dt); else if (v.police && v.driver && !v.wreck) policeAI(v, dt); else if (v.traffic && v.driver && !v.wreck) trafficAI(v, dt); else if (v.wreck || v.parked || !v.driver) { if (!v.d.rail) driveVeh(v, 0, 0, dt); else driveRail(v, 0, dt); }
    if (v.traffic && v.driver && Math.hypot(v.vx, v.vz) < .5) { v.stk = (v.stk || 0) + dt; if (v.stk > 6) { v.panic = false; v.a += 1.57; v.stk = 0; } } } }
function enterExitForce() { const v = player.veh; if (!v) return; player.veh = null; v.driver = null; player.x = v.x + 3; player.z = v.z; if (pedBlock(player.x, player.z)) player.x = v.x - 3; player.mesh.visible = true; }
// ================= DAY / NIGHT =================
let daylight = 1;
function updateSky(dt) { gameTime = (gameTime + dt / 25) % 24; const h = gameTime; daylight = h > 6 && h < 19 ? 1 : h > 5 && h <= 6 ? h - 5 : h >= 19 && h < 20.5 ? 1 - (h - 19) / 1.5 : 0;
  weatherT -= dt; if (weatherT < 0) { weatherT = 60 + rnd() * 90; rainTarget = rnd() < .35 ? 1 : 0; if (rainTarget) pager('Rain! The pavé turns to glass.', 2); } rain += (rainTarget - rain) * dt * .3;
  const dl = daylight * (1 - rain * .3); amb.intensity = .22 + dl * .95; sun.intensity = dl * .75; amb.color.setRGB(.85 + .15 * dl, .82 + .1 * dl, .78 + .2 * (1 - dl)); scene.background.setRGB(.05 + .1 * dl, .05 + .09 * dl, .06 + .08 * dl);
  const night = 1 - daylight; const fl = .82 + Math.sin(performance.now() * .013) * .08 + (rnd() < .05 ? -.25 : 0); gasPool.material.opacity = night * .65 * fl; arcPool.material.opacity = night * (.85 + (rnd() < .03 ? -.5 : Math.sin(performance.now() * .05) * .05)); }
// ================= CAMERA =================
let camH = 40; const camPos = new THREE.Vector3();
function updateCam(dt) { const v = player.veh; const sp = v ? Math.hypot(v.vx, v.vz) + Math.abs(v.sp || 0) : 0; const tgt = (48 + sp * 1.5); camH += (tgt - camH) * Math.min(1, dt * 1.5);
  const lx = v ? v.vx * .5 : 0, lz = v ? v.vz * .5 : 0; const tx = player.x + lx, tz = player.z + lz; camPos.x += (tx - camPos.x) * Math.min(1, dt * 5); camPos.z += (tz - camPos.z) * Math.min(1, dt * 5);
  const sx = camShake > 0 ? (rnd() - .5) * camShake * 2 : 0; camShake = Math.max(0, camShake - dt); camera.position.set(camPos.x + sx, camH, camPos.z + .01 + sx); camera.lookAt(camPos.x + sx, 0, camPos.z + sx); }
// ================= MESH SYNC =================
function syncMeshes(t) { for (const p of peds) { if (!p.mesh.visible && !p.inVeh) p.mesh.visible = true; if (p.inVeh) { p.mesh.visible = false; continue; } p.mesh.position.set(p.x, 0, p.z); p.mesh.rotation.y = -p.a; if (p.alive) { const b = Math.sin(p.t * 12) * .06; p.mesh.children[p.mounted ? 1 : 0].position.x = b; } }
  for (const v of vehs) { v.mesh.position.set(v.x, 0, v.z); v.mesh.rotation.y = -v.a; if (!v.horseDead) { const sp = Math.hypot(v.vx, v.vz); v.hs.forEach((h, k) => { h.position.y = .5 + Math.abs(Math.sin(t * sp * .6 + k)) * .02; h.scale.z = 1.2 + Math.sin(t * sp * .7 + k * 2) * .08 * Math.min(1, sp); }); } }
  player.mesh.position.set(player.x, 0, player.z); player.mesh.rotation.y = -player.a; player.mesh.children[0].scale.set(player.punch > 0 ? 1.6 : 1.3, 1, 1.3);
  for (const pk of pickups) if (pk.alive) { pk.m.rotation.y = t * 2; pk.m.position.y = 1 + Math.sin(t * 4) * .2; }
  for (const pk of pickups) if (!pk.alive && pk.rt !== undefined) { pk.rt -= 1 / 60; if (pk.rt <= 0) { pk.alive = true; pk.m.visible = true; delete pk.rt; } }
  mills.forEach((m, k) => m.rotation.y = t * .6 + k);
  phoneRings.forEach((r, k) => { r.visible = !M; r.scale.setScalar(1 + Math.sin(t * 4) * .15); });
  const tg = stepTarget(); objMarker.visible = objArrow.visible = !!tg; if (tg) { objMarker.position.set(tg[0], .35, tg[1]); objMarker.rotation.z = t; objArrow.position.set(tg[0], 5 + Math.sin(t * 5) * .6, tg[1]); objArrow.rotation.y = t * 2; } }
// ================= HUD =================
function drawHead(x, y, s, on) { hx.fillStyle = on ? '#1e2a5a' : 'rgba(40,40,40,.5)'; hx.fillRect(x, y + s * .2, s, s * .35); hx.fillRect(x + s * .1, y, s * .8, s * .3); hx.fillStyle = on ? '#e0b898' : 'rgba(90,90,90,.5)'; hx.fillRect(x + s * .2, y + s * .55, s * .6, s * .45); if (on) { hx.fillStyle = '#d4a020'; hx.fillRect(x + s * .4, y + s * .05, s * .2, s * .2); } }
function txt(s, x, y, size, col = '#f4c430', align = 'left') { hx.font = `bold ${size}px "Courier New",monospace`; hx.textAlign = align; hx.fillStyle = '#000'; hx.fillText(s, x + size * .08, y + size * .08); hx.fillStyle = col; hx.fillText(s, x, y); }
function wrap(s, maxW, size) { hx.font = `bold ${size}px "Courier New",monospace`; const words = s.split(' '), lines = []; let l = ''; for (const w of words) { const t = l ? l + ' ' + w : w; if (hx.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; } if (l) lines.push(l); return lines; }
function drawHUD(dt) { const dpr = hud.width / innerWidth, Wd = hud.width, H = hud.height; hx.setTransform(dpr, 0, 0, dpr, 0, 0); hx.clearRect(0, 0, innerWidth, innerHeight); const w = innerWidth, h = innerHeight, sm = w < 700;
  if (rain > .05) { hx.strokeStyle = `rgba(180,200,220,${rain * .5})`; hx.lineWidth = 1; hx.beginPath(); for (let k = 0; k < 120 * rain; k++) { const x = Math.random() * w, y = Math.random() * h; hx.moveTo(x, y); hx.lineTo(x - 3, y + 12); } hx.stroke(); }
  if (flash > 0) { hx.fillStyle = `rgba(200,0,0,${flash})`; hx.fillRect(0, 0, w, h); flash -= dt; }
  const fs = sm ? 20 : 28; txt('₣ ' + money.toLocaleString('fr-FR'), 12, fs + 8, fs, '#f4c430'); txt('×' + mult, 12, fs * 2 + 10, fs * .8, '#e04020');
  for (let k = 0; k < 4; k++) drawHead(w - (4 - k) * (sm ? 26 : 34) - 10, 10, sm ? 22 : 30, k < wanted);
  // health
  hx.fillStyle = '#300'; hx.fillRect(12, fs * 2 + 18, 120, 8); hx.fillStyle = player.hp > 30 ? '#c02020' : '#ff4040'; hx.fillRect(12, fs * 2 + 18, 120 * Math.max(0, player.hp) / 100, 8);
  // weapon
  const W_ = WEAP[player.w], am = player.ammo[W_.id]; txt(W_.n + (W_.id === 'fists' || W_.id === 'swordcane' ? '' : '  ' + am), 12, fs * 2 + 44, sm ? 12 : 15, '#e8dcc0');
  if (player.veh) { const v = player.veh; txt(`${v.type.toUpperCase()}  ${Math.round(Math.hypot(v.vx, v.vz) * 2.2 + Math.abs(v.sp || 0) * 2.2)} km/h  ${v.horseDead ? 'HORSES DOWN' : v.d.horses ? 'horses ' + Math.max(0, Math.round(v.horseHp / v.d.horses / .6)) + '%' : ''}`, 12, fs * 2 + 62, sm ? 11 : 13, v.horseDead ? '#f44' : '#bca'); }
  // minimap
  const ms = sm ? 90 : 130, mx = w - ms - 10, my = sm ? 44 : 52; hx.globalAlpha = .85; hx.imageSmoothingEnabled = false; hx.save(); hx.beginPath(); hx.rect(mx, my, ms, ms); hx.clip(); const zoom = 2.2, [px, pz] = ppos();
  hx.drawImage(miniC, mx + ms / 2 - px / T * zoom, my + ms / 2 - pz / T * zoom, N * zoom, N * zoom); hx.fillStyle = '#ff0'; hx.fillRect(mx + ms / 2 - 2, my + ms / 2 - 2, 4, 4);
  const tg = stepTarget(); const dot = (q, c) => { const x = mx + ms / 2 + (q[0] - px) / T * zoom, y = my + ms / 2 + (q[1] - pz) / T * zoom; hx.fillStyle = c; hx.fillRect(Math.max(mx, Math.min(mx + ms - 5, x - 3)), Math.max(my, Math.min(my + ms - 5, y - 3)), 6, 6); };
  if (!M) PHONES.forEach(p => dot([p.x, p.z], p.fac === 'side' ? '#fc0' : '#f3c')); if (tg) dot(tg, '#ff0'); for (const p of peds) if (p.alive && (p.type === 'cop' || p.type === 'gend')) dot([p.x, p.z], '#44f');
  hx.restore(); hx.globalAlpha = 1; hx.strokeStyle = '#f4c430'; hx.strokeRect(mx, my, ms, ms); txt(String(Math.floor(gameTime)).padStart(2, '0') + ':' + String(Math.floor(gameTime % 1 * 60)).padStart(2, '0') + (rain > .5 ? ' ☂' : ''), mx, my + ms + 16, 13, '#e8dcc0');
  // pager
  if (pagerT <= 0 && pagerQ.length) { [pagerMsg, pagerT] = pagerQ.shift(); SFX.pager(); } if (pagerT > 0) { pagerT -= dt; const pw = sm ? w - 20 : Math.min(w - 340, 640), lines = wrap(pagerMsg, pw - 20, sm ? 12 : 15); const ph = lines.length * (sm ? 15 : 19) + 14, x0 = (w - pw) / 2, py = sm ? 150 : 8; hx.save(); hx.translate(0, py - 8);
    hx.fillStyle = 'rgba(30,40,30,.88)'; hx.fillRect(x0, 8, pw, ph); hx.strokeStyle = '#8c8'; hx.strokeRect(x0, 8, pw, ph); lines.forEach((l, k) => txt(l, x0 + 10, 26 + k * (sm ? 15 : 19), sm ? 12 : 15, '#bfe8a8')); hx.restore(); }
  // objective arrow
  if (tg) { const a = Math.atan2(tg[1] - pz, tg[0] - px), dd = Math.hypot(tg[0] - px, tg[1] - pz); if (dd > 12) { const cx = w / 2 + Math.cos(a) * Math.min(w, h) * .3, cy = h / 2 + Math.sin(a) * Math.min(w, h) * .3; hx.save(); hx.translate(cx, cy); hx.rotate(a); hx.fillStyle = '#ffe040'; hx.strokeStyle = '#000'; hx.lineWidth = 2; hx.beginPath(); hx.moveTo(18, 0); hx.lineTo(-10, -12); hx.lineTo(-4, 0); hx.lineTo(-10, 12); hx.closePath(); hx.fill(); hx.stroke(); hx.restore(); } }
  if (M && M.s) { let st = M.s.text; if (M.s.t === 'kill') st += ` ${M.ents.filter(p => p.alive).length} left`; if (M.s.t === 'collect') st += ` ${M.pks.filter(p => p.alive).length} left`; if (M.s.t === 'race') st += ` CP ${M.cp + 1}/${M.cps.length}`; if (M.s.t === 'hold') st += ` ${Math.max(0, Math.ceil(M.s.time - M.hold))}s`; if (M.s.t === 'survive' && !M.s.lose) st += ` ${Math.ceil(M.timer)}s`;
    if (M.timer && !['survive', 'hold'].includes(M.s.t)) st += `  ⏱ ${Math.ceil(M.timer)}`; txt(st, w / 2, h - 30, sm ? 14 : 18, '#ffe040', 'center'); }
  if (bigT > 0) { bigT -= dt; txt(bigMsg, w / 2, h * .38, sm ? 30 : 52, bigMsg === 'WASTED' || bigMsg === 'BUSTED' || bigMsg.includes('FAIL') ? '#e02020' : '#f4c430', 'center'); }
  if (districtT > 0) { districtT -= dt; txt(districtMsg, w / 2, h * .48, sm ? 16 : 22, '#e8dcc0', 'center'); }
  if (!M && nearPhone) txt(nearPhone.fac === 'side' ? 'Newsstand kiosk — side job: walk in' : `${facName(nearPhone.fac)} — magneto phone`, w / 2, h * .6, sm ? 13 : 16, '#ffe040', 'center'); }
// ================= MENUS =================
let state = 'title', paused = false, nearPhone = null, phoneCD = 0, holyCD = 0, holeCD = 0;
const $ = id => document.getElementById(id);
function startGame(cont) { audio(); if (!cont) { localStorage.removeItem('gtaParis1880'); money = 0; mult = 1; done = {}; respect = { apache: 0, avant: 0, velvet: 0, crimson: 0 }; player.ammo = { fists: 1e9 }; giveWeapon('brick', 4); } else load();
  $('title').classList.add('hidden'); state = 'play'; pager('Paris, 1880. Fresh off the night train with nothing but a watchmaker\'s hands. Find a magneto phone (glowing rings) — Maza\'s Apaches at Les Halles are hiring.', 7); }
$('bPlay').onclick = () => startGame(false); $('bCont').onclick = () => startGame(true); if (!localStorage.getItem('gtaParis1880')) $('bCont').style.display = 'none';
function setPause(on) { paused = on; $('pause').classList.toggle('hidden', !on); if (on) buildMenu(); }
$('bRes').onclick = () => setPause(false); $('bSave').onclick = () => { save(); $('bSave').textContent = 'SAVED ✓'; setTimeout(() => $('bSave').textContent = 'SAVE', 1200); };
$('bSnd').onclick = () => { snd = !snd; $('bSnd').textContent = 'SOUND: ' + (snd ? 'ON' : 'OFF'); }; $('bAbort').onclick = () => { if (M) failMission('Mission abandoned.'); setPause(false); };
function buildMenu() { const nd = Object.keys(done).length; $('pstats').innerHTML = `₣ ${money.toLocaleString('fr-FR')} · ×${mult} · Missions ${nd}/${MISSIONS.length} · Respect: ` + Object.entries(respect).map(([k, v]) => `${k} ${v}`).join(' · ');
  let h = ''; for (const f of ['apache', 'avant', 'velvet', 'crimson', 'side']) { h += `<h4>${facName(f)}</h4>`; for (const m of byFac[f]) { const avail = done[m.id] || m === nextFor(f); h += `<div class="${done[m.id] ? 'done' : ''}">${avail ? `<button data-m="${m.id}">${done[m.id] ? 'REPLAY' : 'PLAY'}</button>` : '🔒 '}${m.n}. ${m.title}${done[m.id] ? ' ✓' : ''}</div>`; } }
  $('mlist').innerHTML = h; $('mlist').querySelectorAll('button').forEach(b => b.onclick = () => { const m = MISSIONS.find(x => x.id === b.dataset.m); if (M) failMission('Abandoned.'); setPause(false); startMission(m); }); }
// ================= MAIN LOOP =================
let last = performance.now(), simT = 0, dbgPause = false;
function step(dt, I) { if (!player.alive) { deadT -= dt; if (deadT <= 0) respawn(bigMsg); } else updatePlayer(I, dt);
  for (const p of [...peds]) pedAI(p, dt); updateVehs(dt); updateProjs(dt); updateWanted(dt); updateMission(dt); populate(dt); updateSky(dt); updateFx(dt);
  // phones
  phoneCD -= dt; holyCD -= dt; holeCD -= dt; nearPhone = null; if (!player.veh) for (const p of PHONES) if (d2(p.x, p.z, player.x, player.z) < 9) nearPhone = p;
  if (nearPhone && !M && phoneCD < 0 && player.alive) { phoneCD = 3; const m = nextFor(nearPhone.fac); SFX.bell(); if (m) startMission(m); else pager('Nothing more for you today. (Replay jobs from the pause menu.)', 3); }
  // Notre-Dame confessional (west door) drops one level
  const nd = POI.notredame; if (!player.veh && wanted > 0 && holyCD < 0 && d2(nd[0], nd[1], player.x, player.z) < 16) { holyCD = 20; heat = wanted > 1 ? LV[wanted - 1] + .1 : 0; addMoney(-300, true); pager('Confessional, Notre-Dame: "Mea culpa." -1 head, 300 F in the alms box.', 3); SFX.bell(); }
  // catacomb manholes: travel underground, lose up to 2 heads
  if (!player.veh && holeCD < 0) for (let k = 0; k < MANHOLES.length; k++) { const h = MANHOLES[k]; if (d2(h.x, h.z, player.x, player.z) < 2) { const o = MANHOLES[(k + 3) % MANHOLES.length]; holeCD = 6; player.x = o.x + 1.5; player.z = o.z; camPos.set(player.x, 0, player.z); if (wanted > 0) heat = wanted > 2 ? LV[wanted - 2] + .1 : 0; pager('Through the Catacombs... you surface elsewhere, unseen.', 3); noise(1, .3, 300); break; } }
  const d = dist[tileAt(player.x, player.z)]; if (d !== undefined && d !== lastDistrict) { lastDistrict = d; districtMsg = DN[d]; districtT = 2.5; }
  musicTick(dt, nearCabaret()); }
function nearCabaret() { let best = 0; for (const n of ['chatnoir', 'lapin', 'galette', 'moulinrouge', 'ratmort']) { const p = POI[n]; const dd = Math.sqrt(d2(p[0], p[1], player.x, player.z)); best = Math.max(best, 1 - dd / 30); } return state === 'title' ? .6 : best; }
function frame(now) { requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; const I = readInput();
  if (state === 'play') { if (I.pause) setPause(!paused); if (!paused && !dbgPause) { simT += dt; step(dt, I); } } else { simT += dt; updateSky(dt * .3); camPos.x = 60 * T + Math.sin(simT * .05) * 80; camPos.z = 40 * T + Math.cos(simT * .05) * 60; musicTick(dt, .6); }
  updateCam(dt); syncMeshes(simT); renderer.render(scene, camera); if (state === 'play') drawHUD(dt); }
addEventListener('resize', resize); resize(); camPos.set(player.x, 0, player.z);
requestAnimationFrame(frame);
// ================= DEBUG / TEST API =================
window.GAME = { THREE, player, peds, vehs, props, MISSIONS, POI, POIV, get M() { return M; }, get wanted() { return wanted; }, get money() { return money; }, get heat() { return heat; }, set heat(v) { heat = v; }, get done() { return done; }, stats, get lastFail() { return lastFail; }, WEAP,
  start: startGame, startMission: (id) => startMission(MISSIONS.find(m => m.id === id)), fail: failMission, step: (n = 60, dt = 1 / 30, I) => { for (let k = 0; k < n; k++) step(dt, I || readInput()); }, pause: (b) => dbgPause = b,
  enter: enterExit, fire: (a) => { if (a !== undefined) player.a = a; player.cd = 0; return fireWeapon(player.veh ? player.veh.x : player.x, player.veh ? player.veh.z : player.z, player.a); },
  give: giveWeapon, sel: (id) => player.w = WI[id], target: stepTarget, setTime: (h) => gameTime = h, setRain: (r) => { rain = rainTarget = r; },
  tp(x, z) { if (player.veh) { player.veh.x = x; player.veh.z = z; player.veh.vx = player.veh.vz = 0; } player.x = x; player.z = z; camPos.set(x, 0, z); },
  drive: (thr, steer, n = 30) => { for (let k = 0; k < n; k++) { driveVeh(player.veh, thr, steer, 1 / 30); player.x = player.veh.x; player.z = player.veh.z; step(1 / 30, { mx: 0, my: 0, thr: 0, steer: 0 }); } },
  spawnVeh, hitscan, render: () => { updateCam(1); syncMeshes(simT); renderer.render(scene, camera); drawHUD(0); } };
// autopilot: performs the current mission step through normal game actions (used by automated tests)
GAME.solveStep = function () { if (!M || !M.s) return 'none'; const s = M.s, I0 = { mx: 0, my: 0, thr: 0, steer: 0 }; const tick = (n = 5) => GAME.step(n, 1 / 30, I0); const g0 = player.god; player.god = true; player.hp = 100; if (!player.alive) respawn('WASTED');
  const gotoVeh = (x, z) => { GAME.tp(x, z); tick(3); };
  const killAt = (tx, tz, hp) => { if (player.veh) enterExitForce(); let px = tx + 1.5, pz = tz; for (let k = 0; k < 8; k++) { const a = k * .785, x = tx + Math.cos(a) * 2.2, z = tz + Math.sin(a) * 2.2; if (!pedBlock(x, z) && !pedBlock((x + tx) / 2, (z + tz) / 2)) { px = x; pz = z; break; } } player.x = px; player.z = pz; giveWeapon('shotgun', 50); player.w = WI.shotgun; player.cd = 0; fireWeapon(player.x, player.z, Math.atan2(tz - player.z, tx - player.x)); tick(1); };
  const ensureVeh = () => { if (!player.veh) { const [x, z] = snapWalk(Math.floor(player.x / T), Math.floor(player.z / T), true); const v = spawnVeh('brougham', x, z, 0); GAME.tp(x + 2.5, z); enterExit(); if (!player.veh) { player.veh = v; v.driver = 'player'; } } };
  switch (s.t) {
    case 'goto': if (s.foot && player.veh) enterExitForce(); { const p = POI[s.at]; if (player.veh) { const q = POIV[s.at]; GAME.tp(q[0], q[1]); } else GAME.tp(p[0], p[1]); } tick(3); break;
    case 'steal': { if (player.veh) enterExitForce(); let v = M.target && M.target.alive && !M.target.wreck ? M.target : vehs.find(x => x.type === s.vtype && x.alive && !x.wreck); if (!v) return 'steal:no-vehicle'; for (const o of vehs) if (o !== v && !o.d.rail && d2(o.x, o.z, v.x, v.z) < 64) { o.x += 12; o.z += 0; } GAME.tp(v.x + Math.cos(v.a) * 0, v.z + v.d.wid / 2 + 1.2); enterExit(); tick(3); break; }
    case 'deliver': case 'race': { if (!player.veh && M.veh && M.veh.alive && !M.veh.wreck) { player.veh = M.veh; M.veh.driver = 'player'; M.veh.parked = false; player.mesh.visible = false; } ensureVeh(); const list = s.t === 'race' ? M.cps.slice(M.cp) : [POIV[s.at]]; for (const q of list) { gotoVeh(q[0], q[1]); } break; }
    case 'kill': for (let r = 0; r < 40 && M && M.s === s; r++) { const p = M.ents.find(e => e.alive); if (!p) { tick(1); break; } killAt(p.x, p.z); } break;
    case 'destroy': case 'smash': for (let r = 0; r < 60 && M && M.s === s; r++) { const v = M.vehs.find(x => x.alive && !x.wreck && !x.burn); const p = M.props.find(x => x.alive); if (v) { killAt(v.x, v.z + v.d.wid / 2 + .2); damageVeh(v, 0); } else if (p) killAt(p.x, p.z); else tick(10); } break;
    case 'collect': for (const pk of [...M.pks]) if (pk.alive) { if (player.veh) enterExitForce(); player.x = pk.x; player.z = pk.z; tick(1); } break;
    case 'escort': { ensureVeh(); const v = M.vip; const q0 = snapWalk(Math.floor(v.x / T), Math.floor(v.z / T), true); gotoVeh(q0[0], q0[1]); tick(5); if (M && M.board) { const q = POIV[s.to]; gotoVeh(q[0], q[1]); tick(3); } break; }
    case 'survive': if (s.lose) { heat = 0; tick(3); } else { tick(Math.ceil((M.timer + .5) * 30)); } break;
    case 'hold': { const p = POI[s.at]; if (player.veh) enterExitForce(); player.x = p[0]; player.z = p[1]; tick(Math.ceil((s.time + 1) * 30)); break; }
  } player.god = g0; return s.t; };
