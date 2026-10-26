// Renderer: chunked streaming world (ground canvases, extruded buildings with procedural facades & mansards), landmarks,
// water, lamps & light pools, shadows, particles, decals, quality presets, retro PS1 mode.
import * as THREE from './vendor/three.module.js';
import { K, S, NX, NZ, T, WX, WZ, CH, CHU, NCX, NCZ, kind, surf, dist, depth, ti, inb, kij, hash, LM, TRAM, TRAIN, pathAt, ST, styleOf, bldH, isYard, skipT, DCUT, ensureChunk, chunkProps, dynProps, hooks, addProp, ETOILE, kAt } from './world.js';
import { GB, M as MX, VC, LAMPMAT } from './models.js';
import { POST, postSize, postRender } from './post.js';
import * as LMK from './landmarks.js'; // real-footprint 1890 landmarks
import { chunkVec, polyPath, linePath, ROADS as VROADS, WATER as VWATER, ISLAND as VISLAND, PARK as VPARK, RAIL as VRAIL, near } from './vec.js';
export { POST };
// ================= TERRAIN: the Butte Montmartre =================
// Gameplay stays on the flat x/z plane; every built-in material is lifted in its vertex stage by the same
// height field, so ground, buildings, props, people, carriages and their shadows all ride up the hill together.
export const HILL = { x: 2050, z: 395, r: 330, h: 15 };
export function hillH(x, z) { const d = Math.hypot(x - HILL.x, (z - HILL.z) * 1.12) / HILL.r; if (d >= 1) return 0; const t = 1 - d; return HILL.h * t * t * (3 - 2 * t) * (1 + .06 * Math.sin(x * .05) * Math.cos(z * .04) * t); }
THREE.ShaderChunk.common += `
float hillH(vec2 p){ float d=length(vec2(p.x-${HILL.x.toFixed(1)},(p.y-${HILL.z.toFixed(1)})*1.12))/${HILL.r.toFixed(1)}; if(d>=1.) return 0.; float t=1.-d; return ${HILL.h.toFixed(1)}*t*t*(3.-2.*t)*(1.+.06*sin(p.x*.05)*cos(p.y*.04)*t); }`;
THREE.ShaderChunk.project_vertex = THREE.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;', 'vec4 hwp = modelMatrix * mvPosition; hwp.y += hillH(hwp.xz); mvPosition = viewMatrix * hwp;');
THREE.ShaderChunk.worldpos_vertex = THREE.ShaderChunk.worldpos_vertex.replace('worldPosition = modelMatrix * worldPosition;', 'worldPosition = modelMatrix * worldPosition; worldPosition.y += hillH(worldPosition.xz);');
// ================= SETTINGS =================
export const PRESETS = {
  low: { n: 'Low', scale: .75, shadows: false, smap: 1024, lights: 0, lshad: 0, lsm: 256, tp: 8, parts: 300, aa: false, post: false, bloom: false, peds: 34, traffic: 14, det: 0, life: 0, ssao: false, fx: 0 },
  medium: { n: 'Medium', scale: .9, shadows: true, smap: 1024, lights: 4, lshad: 2, lsm: 512, tp: 16, parts: 700, aa: false, post: true, bloom: false, peds: 46, traffic: 18, det: 1, life: 1, ssao: false, fx: 1 },
  high: { n: 'High', scale: 1, shadows: true, smap: 2048, lights: 8, lshad: 3, lsm: 512, tp: 24, parts: 1400, aa: true, post: true, bloom: true, peds: 56, traffic: 22, det: 2, life: 2, ssao: false, fx: 2 },
  ultra: { n: 'Ultra', scale: 1, shadows: true, smap: 4096, lights: 12, lshad: 6, lsm: 1024, tp: 32, parts: 2400, aa: true, post: true, bloom: true, peds: 64, traffic: 26, dpr: 2, det: 2, life: 2, ssao: true, fx: 3 } };
export const CFG = Object.assign({ preset: 'high', scale: 1, shadows: true, ps1: false, fps: false, post: true }, JSON.parse(localStorage.getItem('gtaParis1880gfx') || '{}'));
export let Q = Object.assign({}, PRESETS[CFG.preset] || PRESETS.high);
export function saveCfg() { localStorage.setItem('gtaParis1880gfx', JSON.stringify(CFG)); }
// ================= RENDERER / SCENE =================
const glc = document.getElementById('gl');
export const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: Q.aa && !CFG.ps1, powerPreference: 'high-performance', stencil: false });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1814); scene.fog = new THREE.Fog(0x9a9a90, 80, 220);
export const camera = new THREE.PerspectiveCamera(42, 1, 2, 600); camera.up.set(0, 0, -1);
export const hud = document.getElementById('hud');
const MAXANI = renderer.capabilities.getMaxAnisotropy();
export function resize() { const dpr = CFG.ps1 ? .34 : Math.min(Q.dpr || 1.25, devicePixelRatio || 1) * CFG.scale; renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight, false);
  glc.style.imageRendering = CFG.ps1 ? 'pixelated' : 'auto'; postCfg(); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); hud.width = innerWidth * Math.min(2, devicePixelRatio); hud.height = innerHeight * Math.min(2, devicePixelRatio); }
// lights
export const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x5a5040, 1.1); scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xfff0d8, 2.6); sun.castShadow = true; scene.add(sun, sun.target);
sun.shadow.bias = -.0006; sun.shadow.normalBias = .06; sun.shadow.radius = 3;
function applyShadow() { const on = CFG.shadows && Q.shadows && !CFG.ps1; sun.castShadow = on; sun.shadow.mapSize.set(Q.smap, Q.smap); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
applyShadow();
// gas-lamp lights: downward spot lights (one shadow pass each, unlike a 6-face point light); the nearest Q.lshad cast real shadow maps so
// people, carriages and street furniture throw shadows away from the lamp. Count and map size scale with the preset.
const PL = []; window.__PL = PL; function mkLights() { for (const l of PL) { scene.remove(l, l.target); if (l.shadow && l.shadow.map) l.shadow.map.dispose(); } PL.length = 0; const shOn = CFG.shadows && Q.shadows && !CFG.ps1;
  for (let k = 0; k < Q.lights; k++) { const l = new THREE.SpotLight(0xffa860, 0, 16, 1.38, .8, 1.25); l.position.set(0, 2.6, 0); l.target.position.set(0, 0, 0);
    if (shOn && k < (Q.lshad || 0)) { l.castShadow = true; l.shadow.mapSize.set(Q.lsm, Q.lsm); l.shadow.camera.near = .3; l.shadow.camera.far = 18; l.shadow.bias = -.0015; l.shadow.normalBias = .04; l.shadow.radius = 3; }
    scene.add(l, l.target); PL.push(l); } }
mkLights();
const FL = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffb060, 0, 22, 1.5); scene.add(l); return { l, t: 0, i: 0 }; }); // flashes/fires
// env map
const pmrem = new THREE.PMREMGenerator(renderer);
function envFrom(top, hor, bot) { const c = cv(256, 128, (g) => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, top); gr.addColorStop(.48, hor); gr.addColorStop(.52, hor); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  g.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 40; k++) g.fillRect(Math.random() * 256, 58 + Math.random() * 8, 6, 2); });
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; const r = pmrem.fromEquirectangular(t).texture; t.dispose(); return r; }
const ENV_DAY = envFrom('#8fb0d0', '#e8e4dc', '#5a5248'), ENV_NIGHT = envFrom('#0a1020', '#3a3440', '#100c08');
scene.environment = ENV_DAY;
// ================= TEXTURES =================
export function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d', { willReadFrequently: true }), w, h); return c; }
function tex(c, rep = true, srgb = true) { const t = new THREE.CanvasTexture(c); if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANI; return t; }
let rs = 1880; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
const sh = (b, v) => `rgb(${Math.max(0, Math.min(255, b[0] + v)) | 0},${Math.max(0, Math.min(255, b[1] + v)) | 0},${Math.max(0, Math.min(255, b[2] + v)) | 0})`;
function noise(g, w, h, base, amt, sz = 1, a = 1) { for (let y = 0; y < h; y += sz) for (let x = 0; x < w; x += sz) { g.globalAlpha = a; g.fillStyle = sh(base, (rnd() - .5) * amt); g.fillRect(x, y, sz, sz); } g.globalAlpha = 1; }
// ground patterns: 128px = 2 tiles
const GP = {};
GP.mac = cv(128, 128, g => { noise(g, 128, 128, [104, 98, 88], 16, 2); for (let k = 0; k < 500; k++) { g.fillStyle = sh([130, 122, 110], (rnd() - .5) * 40); g.fillRect(rnd() * 128, rnd() * 128, 1.5, 1.5); } g.fillStyle = 'rgba(60,50,40,.12)'; for (let k = 0; k < 14; k++) { g.beginPath(); g.ellipse(rnd() * 128, rnd() * 128, 6 + rnd() * 14, 3 + rnd() * 6, rnd() * 3, 0, 7); g.fill(); } });
GP.pave = cv(128, 128, g => { g.fillStyle = '#3e3c3a'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 8) for (let x = (y / 8 % 2) * 5; x < 138; x += 10) { g.fillStyle = sh([120, 116, 110], (rnd() - .5) * 34); g.beginPath(); g.roundRect(x - 5 + rnd(), y + .8, 8.6, 6.4, 1.6); g.fill(); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x - 4, y + 1.2, 7, 1.5); } });
GP.dirt = cv(128, 128, g => { noise(g, 128, 128, [128, 104, 74], 26, 2); g.fillStyle = 'rgba(70,52,32,.25)'; for (let k = 0; k < 20; k++) { g.beginPath(); g.ellipse(rnd() * 128, rnd() * 128, 4 + rnd() * 10, 2 + rnd() * 5, rnd() * 3, 0, 7); g.fill(); } for (let k = 0; k < 200; k++) { g.fillStyle = sh([150, 130, 100], (rnd() - .5) * 50); g.fillRect(rnd() * 128, rnd() * 128, 2, 2); } });
GP.grass = cv(128, 128, g => { noise(g, 128, 128, [72, 98, 52], 22, 2); for (let k = 0; k < 900; k++) { g.fillStyle = sh([86, 118, 60], (rnd() - .5) * 46); g.fillRect(rnd() * 128, rnd() * 128, 1, 3); } g.fillStyle = 'rgba(40,60,20,.2)'; for (let k = 0; k < 12; k++) { g.beginPath(); g.arc(rnd() * 128, rnd() * 128, 6 + rnd() * 10, 0, 7); g.fill(); } });
GP.flag = cv(128, 128, g => { noise(g, 128, 128, [156, 150, 140], 10, 2); g.strokeStyle = 'rgba(70,64,56,.45)'; g.lineWidth = 1; for (let k = 0; k <= 128; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 128); g.moveTo(0, k); g.lineTo(128, k); g.stroke(); } for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(80,70,60,.12)'; g.beginPath(); g.arc(rnd() * 128, rnd() * 128, 3 + rnd() * 6, 0, 7); g.fill(); } });
GP.gravel = cv(128, 128, g => { noise(g, 128, 128, [190, 176, 146], 18, 2); for (let k = 0; k < 600; k++) { g.fillStyle = sh([210, 196, 166], (rnd() - .5) * 50); g.fillRect(rnd() * 128, rnd() * 128, 1.5, 1.5); } });
GP.yard = cv(128, 128, g => { g.fillStyle = '#5a544c'; g.fillRect(0, 0, 128, 128); for (let k = 0; k < 340; k++) { g.fillStyle = sh([128, 120, 108], (rnd() - .5) * 40); g.beginPath(); g.arc(rnd() * 128, rnd() * 128, 2.5 + rnd() * 2, 0, 7); g.fill(); } });
GP.parvis = cv(128, 128, g => { noise(g, 128, 128, [176, 168, 150], 10, 2); g.strokeStyle = 'rgba(90,80,70,.4)'; for (let k = 0; k <= 128; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 128); g.moveTo(0, k); g.lineTo(128, k); g.stroke(); } });
GP.stair = cv(128, 128, g => { for (let y = 0; y < 128; y += 8) { g.fillStyle = sh([170, 162, 150], (rnd() - .5) * 10); g.fillRect(0, y, 128, 6); g.fillStyle = '#5a544c'; g.fillRect(0, y + 6, 128, 2); } });
GP.rail = cv(128, 128, g => { noise(g, 128, 128, [86, 80, 74], 30, 2); g.fillStyle = 'rgba(70,46,24,.85)'; for (let y = 2; y < 128; y += 10) g.fillRect(0, y, 128, 4); });
GP.track = cv(128, 128, g => { noise(g, 128, 128, [104, 98, 90], 34, 2); /* v15 ballast + sleepers + steel; 128 px = 4 world units across, one track centred on the pattern edge (y=0) */
  for (let n = 0; n < 220; n++) { g.fillStyle = `rgba(${n % 3 ? 60 : 150},${n % 3 ? 56 : 144},${n % 3 ? 52 : 136},.5)`; g.fillRect((n * 37) % 128, (n * 59) % 128, 2, 2); }
  for (let x = 4; x < 128; x += 21.33) { g.fillStyle = 'rgba(64,44,28,.95)'; g.fillRect(x, 0, 8, 42); g.fillRect(x, 86, 8, 42); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 7, 0, 2, 42); g.fillRect(x + 7, 86, 2, 42); }
  for (const y of [23, 105]) { g.fillStyle = '#3a3836'; g.fillRect(0, y - 2, 128, 5); g.fillStyle = '#9a9894'; g.fillRect(0, y - 1, 128, 2); } });
// Impressionist texture pass: re-lay every canvas as short, overlapping dabs of the colour beneath them, wrapping at the edges
// so tiles still repeat. Gives brushwork in the world itself (it rotates and scales with the scene) instead of a screen overlay.
function paintify(c, w0 = 3, dens = .9, a = .55) { const g = c.getContext('2d'), W = c.width, H = c.height, src = g.getImageData(0, 0, W, H).data; const n = Math.round(W * H / (w0 * w0 * 3) * dens); g.lineCap = 'round';
  for (let k = 0; k < n; k++) { const x = rnd() * W, y = rnd() * H, o = ((y | 0) * W + (x | 0)) * 4, j = (rnd() - .5) * 14; const ang = Math.sin(x * .013 + Math.cos(y * .011) * 2) * 1.2 + (rnd() - .5) * 1.8, L = w0 * (1.6 + rnd() * 1.8), dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2;
    g.strokeStyle = `rgba(${src[o] + j | 0},${src[o + 1] + j | 0},${src[o + 2] + j * 1.2 | 0},${a})`; g.lineWidth = w0 * (.7 + rnd() * .6);
    for (const ox of [0, x < L ? W : x > W - L ? -W : 0]) for (const oy of [0, y < L ? H : y > H - L ? -H : 0]) { if ((ox || oy) && !(ox && oy) && false) continue; g.beginPath(); g.moveTo(x + ox - dx, y + oy - dy); g.lineTo(x + ox + dx, y + oy + dy); g.stroke(); } } return c; }
for (const k of ['mac', 'dirt', 'grass', 'flag', 'gravel', 'yard', 'parvis']) paintify(GP[k], 3.2, .8, .45); paintify(GP.pave, 2.2, .5, .28);
GP.under = cv(128, 128, g => { g.fillStyle = '#4a443c'; g.fillRect(0, 0, 128, 128); });
const CLS = { mac: 0, pave: 1, dirt: 2, grass: 3, flag: 4, water: 5, stair: 6, rail: 7, yard: 8, parvis: 9, gravel: 10, under: 11 }; const CLSN = Object.keys(CLS);
const ROADC = c => c <= 2; // carriageway classes
function gclass(i, j) { if (!inb(i, j)) return CLS.under; const t = ti(i, j), k = kind[t], s = surf[t];
  switch (k) { case K.ROAD: case K.BRIDGE: return s === S.MAC ? 0 : s === S.DIRT ? 2 : 1; case K.WATER: return 5; case K.PARK: return 3; case K.STAIR: return 6; case K.RAIL: return 7;
    case K.SIDE: { let road = false, park = false; for (const [a, b] of N4) { const kk = kij(i + a, j + b); if (kk === K.ROAD || kk === K.BRIDGE) road = true; if (kk === K.PARK) park = true; } return park && !road ? 10 : 4; }
    case K.BLD: return skipT[t] ? 9 : bldH(i, j) > 0 ? 11 : 8; } return 11; }
const N4 = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W
// corner cut: returns [corner(0=NE,1=SE,2=SW,3=NW), otherClass] if tile sticks out
function cutOf(cl, i, j, c) { const n = cl(i, j - 1), e = cl(i + 1, j), s = cl(i, j + 1), w = cl(i - 1, j);
  if (n === e && n !== c && s === c && w === c) return [0, n]; if (e === s && e !== c && n === c && w === c) return [1, e]; if (s === w && s !== c && n === c && e === c) return [2, s]; if (w === n && w !== c && s === c && e === c) return [3, w]; return null; }
// facades: 256x512 = 6.4 x 10 units (4 bays, ground floor 1.6, floors 1.2)
const FY = y => 512 - y * 51.2;
function facade(st, emis) { return cv(256, 512, g => { rs = 77 + st * 13 + (emis ? 5 : 0);
  const base = [[222, 210, 184], [200, 186, 160], [214, 202, 178], [150, 78, 54]][st];
  if (emis) { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 512); } else { noise(g, 256, 512, base, st === 3 ? 18 : 12, 2);
    if (st === 3) { g.fillStyle = 'rgba(220,200,170,.35)'; for (let y = 0; y < 512; y += 6) { g.fillRect(0, y, 256, 1); for (let x = (y / 6 % 2) * 8; x < 256; x += 16) g.fillRect(x, y, 1, 6); } }
    else if (st === 0) { g.fillStyle = 'rgba(120,104,80,.25)'; for (let y = FY(1.6); y > 0; y -= 15) g.fillRect(0, y, 256, 1); }
    else if (st === 2) { g.fillStyle = 'rgba(90,64,40,.55)'; for (let x = 0; x < 256; x += 40) g.fillRect(x, 0, 5, 512); for (let y = 30; y < 512; y += 61) g.fillRect(0, y, 256, 4); } }
  const lit = (p) => emis ? (rnd() < p ? (rnd() < .5 ? '#ffd28a' : '#ffb868') : '#000') : null;
  // ground floor
  for (let b = 0; b < 4; b++) { const x = b * 64;
    if (st === 3) { if (!emis) { g.fillStyle = '#3a2418'; g.fillRect(x + 10, FY(1.4), 44, FY(0) - FY(1.4)); } continue; }
    const shop = st !== 2 || b % 2 === 0; if (shop) { if (!emis) { g.fillStyle = ['#3a2a1e', '#1e3a2a', '#5a1a14', '#1e2a4a'][(b + st) % 4]; g.fillRect(x + 4, FY(1.5), 56, FY(.1) - FY(1.5)); g.fillStyle = '#243038'; g.fillRect(x + 9, FY(1.25), 46, FY(.15) - FY(1.25));
      g.fillStyle = '#d8c890'; g.fillRect(x + 6, FY(1.48), 52, 7); } else { g.fillStyle = lit(.65); g.fillRect(x + 9, FY(1.25), 46, FY(.15) - FY(1.25)); } }
    else if (!emis) { g.fillStyle = '#4a3420'; g.fillRect(x + 22, FY(1.2), 20, FY(0) - FY(1.2)); } }
  // upper floors
  const fl = st === 2 ? 3 : 7;
  for (let f = 0; f < fl; f++) { const y0 = 1.6 + f * 1.2; for (let b = 0; b < 4; b++) { const x = b * 64, ww = st === 3 ? 34 : st === 2 ? 20 : 24, wh = st === 3 ? 44 : f === 0 && st === 0 ? 44 : 36, wx = x + 32 - ww / 2, wy = FY(y0 + .25) - wh;
      if (emis) { g.fillStyle = lit(st === 3 ? .15 : .32); if (st === 3) { g.beginPath(); g.roundRect(wx, wy, ww, wh, [ww / 2, ww / 2, 0, 0]); g.fill(); } else g.fillRect(wx + 2, wy + 2, ww - 4, wh - 4); continue; }
      if (st === 3) { g.fillStyle = '#c8b898'; g.beginPath(); g.roundRect(wx - 3, wy - 3, ww + 6, wh + 6, [ww / 2 + 3, ww / 2 + 3, 0, 0]); g.fill(); g.fillStyle = '#1e2428'; g.beginPath(); g.roundRect(wx, wy, ww, wh, [ww / 2, ww / 2, 0, 0]); g.fill(); g.fillStyle = 'rgba(160,170,170,.5)'; for (let k = 1; k < 4; k++) g.fillRect(wx, wy + k * wh / 4, ww, 1); g.fillRect(wx + ww / 2, wy, 1, wh); continue; }
      g.fillStyle = st === 0 ? '#ece4d0' : '#e0d6c0'; g.fillRect(wx - 3, wy - 3, ww + 6, wh + 5); g.fillStyle = '#1c2226'; g.fillRect(wx, wy, ww, wh); g.fillStyle = 'rgba(150,170,180,.35)'; g.fillRect(wx + 2, wy + 2, ww / 2 - 3, wh - 4); g.fillStyle = '#d8d0bc'; g.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      if (st !== 0) { g.fillStyle = st === 2 ? '#3a6a4a' : ['#5a7060', '#7a6040', '#4a5a6a'][b % 3]; g.fillRect(wx - 10, wy, 8, wh); g.fillRect(wx + ww + 2, wy, 8, wh); }
      if (st === 0 && (f === 0 || f === 3 || f === 5)) { g.fillStyle = '#e8e0cc'; g.fillRect(wx - 6, wy - 9, ww + 12, 6); }
      if (st === 0 && f !== 1 && f !== 4) { g.fillStyle = '#16181a'; g.fillRect(wx - 3, wy + wh - 12, ww + 6, 2); for (let k = 0; k < ww + 6; k += 3) g.fillRect(wx - 3 + k, wy + wh - 12, 1, 12); } }
    if (!emis && st === 0 && (f === 1 || f === 4)) { const y = FY(y0 + .25); g.fillStyle = '#e4dcc8'; g.fillRect(0, y, 256, 4); g.fillStyle = '#121416'; g.fillRect(0, y - 14, 256, 2); for (let k = 0; k < 256; k += 4) g.fillRect(k, y - 14, 1, 14); }
    if (!emis && st !== 2) { g.fillStyle = 'rgba(80,70,56,.3)'; g.fillRect(0, FY(y0), 256, 2); } }
  if (!emis && st === 0) { g.fillStyle = '#e8e0cc'; g.fillRect(0, FY(1.62), 256, 5); }
  if (!emis && st < 2) { // Haussmann articulation: pilasters between bays, string courses with cast shadow, rusticated base
    for (let b = 0; b <= 4; b++) { const x = b * 64 - 3; g.fillStyle = 'rgba(255,248,232,.32)'; g.fillRect(x, 0, 6, FY(1.6)); g.fillStyle = 'rgba(60,48,34,.22)'; g.fillRect(x + 6, 0, 2, FY(1.6)); }
    for (let f = 1; f < fl; f++) { const y = FY(1.6 + f * 1.2) + 2; g.fillStyle = 'rgba(70,58,42,.35)'; g.fillRect(0, y + 3, 256, 3); g.fillStyle = 'rgba(250,244,228,.55)'; g.fillRect(0, y, 256, 3); }
    g.fillStyle = 'rgba(60,48,34,.5)'; g.fillRect(0, 6, 256, 5); g.fillStyle = 'rgba(250,244,228,.7)'; g.fillRect(0, 0, 256, 6); for (let k = 0; k < 256; k += 8) { g.fillStyle = 'rgba(250,244,228,.6)'; g.fillRect(k, 11, 5, 4); } // crowning cornice + dentils
    g.fillStyle = 'rgba(70,58,42,.28)'; for (let y = FY(1.6) + 14; y < 512; y += 14) g.fillRect(0, y, 256, 2); }
  }); }
const FACC = [0, 1, 2, 3].map(s => paintify(facade(s, false), 2.2, .55, .38)); const FAC = FACC.map(c => tex(c)), FACE = [0, 1, 2, 3].map(s => tex(facade(s, true)));
// window glass: smooth and partly metallic so it picks up the sky; stone stays matte
const FACRM = FACC.map(c => { const o = cv(c.width, c.height, () => {}); const gi = c.getContext('2d').getImageData(0, 0, c.width, c.height), go = o.getContext('2d'), od = go.createImageData(c.width, c.height);
  for (let k = 0; k < gi.data.length; k += 4) { const r = gi.data[k], gg = gi.data[k + 1], b = gi.data[k + 2], glass = r < 96 && gg < 108 && b < 120 && b >= r - 4; od.data[k] = 255; od.data[k + 1] = glass ? 30 : 232; od.data[k + 2] = glass ? 150 : 0; od.data[k + 3] = 255; } go.putImageData(od, 0, 0); return tex(o, true, false); });
// mansard slopes 128x64 = 3.2 units along x 1 slope
function slope(st, emis) { return cv(128, 64, g => { rs = 99 + st; const base = [[94, 100, 110], [84, 82, 86], [160, 82, 54], [70, 70, 68]][st]; /* v14: zinc a touch darker so sunlit hip ends stop reading as pale patches */
  if (emis) { g.fillStyle = '#000'; g.fillRect(0, 0, 128, 64); } else { noise(g, 128, 64, base, 14, 2); g.fillStyle = 'rgba(30,30,40,.35)'; if (st === 2) for (let y = 0; y < 64; y += 5) g.fillRect(0, y, 128, 1); else for (let x = 0; x < 128; x += 6) g.fillRect(x, 0, 1, 64); }
  if (st < 2) for (const x of [32, 96]) { if (emis) { g.fillStyle = rnd() < .3 ? '#ffc070' : '#000'; g.fillRect(x - 7, 26, 14, 18); continue; } g.fillStyle = 'rgba(20,22,28,.35)'; g.fillRect(x - 10, 50, 22, 4); g.fillStyle = st === 0 ? '#8c939c' : '#7e7a78'; g.fillRect(x - 11, 20, 22, 30); g.beginPath(); g.moveTo(x - 13, 22); g.lineTo(x, 11); g.lineTo(x + 13, 22); g.fill(); g.fillStyle = '#d8d0c0'; g.fillRect(x - 8, 25, 16, 20); g.fillStyle = '#1c2226'; g.fillRect(x - 6, 27, 12, 16); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x - 13, 21, 26, 2); /* v13: zinc dormer cheeks, slim cream frame */ }
  if (!emis) { g.fillStyle = 'rgba(40,40,46,.35)'; g.fillRect(0, 0, 128, 2); } }); } /* v14: dark zinc ridge roll instead of a pale strip (pale wedges on hips) */
const SLO = [0, 1, 2, 3].map(s => tex(paintify(slope(s, false), 2, .7, .45))), SLOE = [0, 1, 2, 3].map(s => tex(slope(s, true)));
function roofT(st) { return cv(256, 256, g => { rs = 55 + st; const base = [[126, 129, 134], [98, 96, 98], [168, 90, 58], [74, 72, 70]][st]; noise(g, 256, 256, base, 10, 2);
  for (let k = 0; k < 10; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '20,24,30'},${.04 + rnd() * .05})`; g.fillRect(rnd() * 256, rnd() * 256, 30 + rnd() * 60, 20 + rnd() * 60); } // weathered patches
  if (st === 0) for (let x = 0; x < 256; x += 8) { g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(x, 0, 1, 256); g.fillStyle = "rgba(20,24,30,.3)"; g.fillRect(x + 1, 0, 1, 256); for (let y = 0; y < 256; y += 64) { g.fillStyle = 'rgba(20,24,30,.15)'; g.fillRect(x, y + rnd() * 8, 12, 1); } }
  else if (st === 1) for (let y = 0; y < 256; y += 7) { g.fillStyle = 'rgba(20,20,26,.4)'; g.fillRect(0, y, 256, 1.5); for (let x = (y / 7 % 2) * 6; x < 256; x += 12) { g.fillStyle = `rgba(${rnd() < .5 ? '255,255,255,.06' : '0,0,0,.08'})`; g.fillRect(x, y + 1.5, 11, 5.5); g.fillStyle = 'rgba(20,20,26,.3)'; g.fillRect(x, y, 1, 7); } }
  else if (st === 2) for (let y = 0; y < 256; y += 6) { g.fillStyle = 'rgba(60,20,10,.45)'; g.fillRect(0, y, 256, 1.5); for (let x = (y / 6 % 2) * 5; x < 256; x += 10) { g.fillStyle = sh([180, 96, 62], (rnd() - .5) * 40); g.fillRect(x + .5, y + 1.5, 9, 4); } }
  else { g.fillStyle = 'rgba(150,180,190,.55)'; g.fillRect(20, 40, 216, 32); g.fillRect(20, 160, 216, 32); g.fillStyle = 'rgba(30,40,40,.6)'; for (let x = 20; x < 236; x += 12) { g.fillRect(x, 40, 2, 32); g.fillRect(x, 160, 2, 32); } }
  if (st < 2) { for (let k = 0; k < 2; k++) { const x = 30 + rnd() * 190, y = 30 + rnd() * 190; g.fillStyle = 'rgba(30,34,40,.7)'; g.fillRect(x, y, 16, 22); g.fillStyle = 'rgba(160,190,200,.55)'; g.fillRect(x + 2, y + 2, 12, 18); g.fillStyle = 'rgba(30,34,40,.6)'; g.fillRect(x + 7, y + 2, 2, 18); } // skylights
    for (let k = 0; k < 3; k++) { const x = rnd() * 256, y = rnd() * 256, gr = g.createLinearGradient(x, y, x, y + 70); gr.addColorStop(0, 'rgba(20,18,16,.25)'); gr.addColorStop(1, 'rgba(20,18,16,0)'); g.fillStyle = gr; g.fillRect(x, y, 10, 70); } } // soot streaks
  g.fillStyle = 'rgba(255,255,255,.06)'; for (let k = 0; k < 10; k++) g.fillRect(rnd() * 256, rnd() * 256, 30, 3); }); }
const ROOF = [0, 1, 2, 3].map(s => tex(paintify(roofT(s), 3, .8, .5)));
const PARTY = tex(cv(128, 128, g => { noise(g, 128, 128, [184, 170, 146], 16, 2); g.fillStyle = 'rgba(60,50,40,.15)'; for (let k = 0; k < 6; k++) g.fillRect(rnd() * 128, 0, 6 + rnd() * 6, 128); }));
const QUAY = tex(cv(128, 128, g => { g.fillStyle = '#5a544a'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 16) for (let x = (y / 16 % 2) * 16; x < 140; x += 32) { g.fillStyle = sh([160, 150, 132], (rnd() - .5) * 26); g.fillRect(x - 16 + 1, y + 1, 30, 14); } g.fillStyle = 'rgba(30,50,40,.35)'; g.fillRect(0, 96, 128, 32); }));
const GLASS = tex(cv(64, 64, g => { g.fillStyle = '#8aa4a8'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, 64, 20); g.fillStyle = '#2a3230'; for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 2, 64); for (let y = 0; y < 64; y += 16) g.fillRect(0, y, 64, 2); }));
const stdM = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .86, metalness: 0 }, o));
export const BM = [...FAC.map((m, k) => stdM({ map: m, emissiveMap: FACE[k], emissive: 0xffffff, emissiveIntensity: 0, vertexColors: true, roughnessMap: FACRM[k], metalnessMap: FACRM[k], roughness: 1, metalness: 1 })), ...SLO.map((m, k) => stdM({ map: m, emissiveMap: SLOE[k], emissive: 0xffffff, emissiveIntensity: 0, vertexColors: true, roughness: .55, metalness: .25 })),
  ...ROOF.map((m, k) => stdM({ map: m, vertexColors: true, roughness: k === 0 ? .5 : .8, metalness: k === 0 ? .3 : 0 })), stdM({ map: PARTY, vertexColors: true }), stdM({ map: QUAY, vertexColors: true }), stdM({ map: GLASS, roughness: .2, metalness: .3, vertexColors: true })];
const MI = { fac: 0, slo: 4, roof: 8, party: 12, quay: 13, glass: 14 };
// ================= MATERIAL HELPERS FOR LANDMARKS =================
const LMat = { stone: stdM({ color: 0xd8ccb0 }), stoneD: stdM({ color: 0xa89c88 }), gothic: stdM({ color: 0xb4ac9c }), slate: stdM({ color: 0x4a5058, roughness: .6, metalness: .2 }), copper: stdM({ color: 0x6aa88a, roughness: .55, metalness: .3 }),
  gold: stdM({ color: 0xe0b040, roughness: .3, metalness: .9 }), glass: stdM({ map: GLASS, roughness: .15, metalness: .4 }), iron: stdM({ color: 0x3a4440, roughness: .5, metalness: .6 }), soot: stdM({ color: 0x3a3430 }), wood: stdM({ color: 0x8a6a48 }), sail: stdM({ color: 0xe8dcc0, side: THREE.DoubleSide }), brick: stdM({ color: 0x9a5038 }), zinc: stdM({ color: 0x7a8690, roughness: .45, metalness: .4 }), water: stdM({ color: 0x3a6a78, roughness: .05, metalness: .2 }), red: stdM({ color: 0x8a2a20 }), white: stdM({ color: 0xf0ece0 }) };
// ================= LANDMARK MODELS =================
class MB { constructor() { this.m = new Map(); } add(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); const m = MX(x, y, z, rx, ry, rz); m.scale(new THREE.Vector3(sx, sy, sz)); g.applyMatrix4(m); if (!this.m.has(mat)) this.m.set(mat, []); this.m.get(mat).push(g); return this; }
  box(w, h, d, x, y, z, mat, ry = 0) { return this.add(new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z, 0, ry); }
  cyl(rt, rb, h, x, y, z, mat, seg = 12) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y + h / 2, z); }
  gable(len, wid, h, x, y, z, mat, alongZ) { const s = new THREE.Shape([new THREE.Vector2(-wid / 2, 0), new THREE.Vector2(wid / 2, 0), new THREE.Vector2(0, h)]); const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); if (!alongZ) g.rotateY(Math.PI / 2); return this.add(g, mat, x, y, z); }
  dome(r, x, y, z, mat, sy = 1, seg = 16) { return this.add(new THREE.SphereGeometry(r, seg, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z, 0, 0, 0, 1, sy, 1); }
  cone(r, h, x, y, z, mat, seg = 8) { return this.add(new THREE.ConeGeometry(r, h, seg), mat, x, y + h / 2, z); }
  cols(x0, z0, x1, z1, n, h, r, y, mat) { for (let k = 0; k < n; k++) { const f = n === 1 ? .5 : k / (n - 1); this.cyl(r, r * 1.1, h, x0 + (x1 - x0) * f, y, z0 + (z1 - z0) * f, mat, 8); } return this; }
  build() { const g = new THREE.Group(); for (const [mat, list] of this.m) { const P = [], Nn = [], U = []; for (const q of list) { if (!q.attributes.normal) q.computeVertexNormals(); P.push(...q.attributes.position.array); Nn.push(...q.attributes.normal.array); if (q.attributes.uv) U.push(...q.attributes.uv.array); else for (let k = 0; k < q.attributes.position.count; k++) U.push(0, 0); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); } return g; } }
const L_ = LMat; LMat.slate.emissive.set(0x161a20); LMat.zinc.emissive.set(0x181c22); LMat.copper.emissive.set(0x10201a); LMat.slate.color.set(0x5a626c);
// --- procedural ashlar blocks + weathering on landmark stone (world-space, no UVs needed) ---
function ashlar(mat, bh = .55, bl = 1.1, wear = 1) { mat.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPa; varying vec3 vWNa;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPa=(modelMatrix*vec4(transformed,1.)).xyz; vWNa=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vWPa; varying vec3 vWNa; float hA(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}`)
    .replace('#include <color_fragment>', `#include <color_fragment>
    { vec3 n=abs(vWNa); vec2 p = n.y>.7 ? vWPa.xz : (n.x>n.z ? vWPa.zy : vWPa.xy); float row=floor(p.y/${bh.toFixed(3)}); float u=p.x/${bl.toFixed(3)}+row*.5; vec2 cell=vec2(floor(u),row);
      vec2 f=vec2(fract(u), fract(p.y/${bh.toFixed(3)})); float m=smoothstep(.0,.05,f.x)*smoothstep(1.,.95,f.x)*smoothstep(.0,.08,f.y)*smoothstep(1.,.92,f.y);
      float v=.9+.14*hA(cell); if(n.y>.7){m=1.;v=.97+.06*hA(floor(p*.5));}
      float grime = (1.-smoothstep(0.,3.5,vWPa.y-${'0.'}0))*.22*${wear.toFixed(2)}; float streak=hA(vec2(floor(p.x*2.),3.))*.12*${wear.toFixed(2)}*smoothstep(.0,1.,fract(-p.y*.07));
      diffuseColor.rgb *= mix(.68,1.,m)*v*(1.-grime-streak); }`); }; mat.customProgramCacheKey = () => 'ashlar' + bh + bl + wear; mat.needsUpdate = true; return mat; }
function seams(mat, sp = .6) { mat.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPs; varying vec3 vWNs;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPs=(modelMatrix*vec4(transformed,1.)).xyz; vWNs=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPs; varying vec3 vWNs;').replace('#include <color_fragment>', `#include <color_fragment>
    { vec3 n=vWNs; float c = abs(n.x)>abs(n.z) ? vWPs.z : vWPs.x; if(abs(n.y)>.97) c=vWPs.x; float f=fract(c/${sp.toFixed(2)}); diffuseColor.rgb *= .86 + .2*smoothstep(.0,.12,f) - .14*smoothstep(.85,1.,f) + .05*sin(vWPs.y*1.7+c*.3); }`); };
  mat.customProgramCacheKey = () => 'seam' + sp; mat.needsUpdate = true; return mat; }
// stained-glass rose window texture (emissive at night)
const ROSETEX = tex(cv(256, 256, g => { const c = 128; g.fillStyle = '#18140f'; g.fillRect(0, 0, 256, 256); const C = ['#1a3a9a', '#b01a20', '#2a6ad0', '#d8a020', '#5a1a7a', '#1a7a5a'];
  for (let r = 6; r > 0; r--) { const R = r * 20; for (let k = 0; k < 24; k++) { const a0 = k / 24 * 6.283, a1 = (k + 1) / 24 * 6.283; g.fillStyle = C[(k + r * 2) % C.length]; g.beginPath(); g.moveTo(c, c); g.arc(c, c, R, a0 + .02, a1 - .02); g.closePath(); g.fill(); } g.strokeStyle = '#18140f'; g.lineWidth = 3; g.beginPath(); g.arc(c, c, R, 0, 7); g.stroke(); }
  g.strokeStyle = '#2a2018'; g.lineWidth = 4; for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(k * .5236) * 124, c + Math.sin(k * .5236) * 124); g.stroke(); }
  g.fillStyle = '#d8a020'; g.beginPath(); g.arc(c, c, 14, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#c8bca8'; g.beginPath(); g.arc(c, c, 124, 0, 7); g.stroke(); }), false);
export const ROSEM = stdM({ map: ROSETEX, emissiveMap: ROSETEX, emissive: 0xffffff, emissiveIntensity: .1, roughness: .3, metalness: .1 });
const LANCET = stdM({ color: 0x1a2030, emissive: 0xffb060, emissiveIntensity: 0, roughness: .3, metalness: .3 });
function lancet(wid, h) { const pts = [], h1 = h - wid * .87; pts.push(new THREE.Vector2(-wid / 2, 0), new THREE.Vector2(wid / 2, 0), new THREE.Vector2(wid / 2, h1));
  for (let k = 1; k <= 5; k++) { const a = k / 5 * Math.PI / 3; pts.push(new THREE.Vector2(-wid / 2 + Math.cos(a) * wid, h1 + Math.sin(a) * wid)); }
  for (let k = 4; k >= 0; k--) { const a = k / 5 * Math.PI / 3; pts.push(new THREE.Vector2(wid / 2 - Math.cos(a) * wid, h1 + Math.sin(a) * wid)); }
  return new THREE.Shape(pts); }
function arch(b, wid, h, x, y, z, mat, faceX, dep = .25) { const g = new THREE.ExtrudeGeometry(lancet(wid, h), { depth: dep, bevelEnabled: false }); g.translate(0, 0, -dep / 2); return b.add(g, mat, x, y, z, 0, faceX ? Math.PI / 2 : 0, 0); }
function notredame(b, w, d) { const G = L_.gothic, Gd = L_.stoneD, LEAD = L_.slate, nw = d * .36, fw = w * .13, fx = w * .5 - fw / 2 - .5, fz = d * .46, x0 = -w * .32, x1 = fx - fw / 2;
  // west facade
  b.box(fw, 12.5, d * .92, fx, 0, 0, G); const ff = fx + fw / 2;
  for (const s of [-1, 0, 1]) { const pw = s ? 3.0 : 3.6, pz = s * d * .3; for (let k = 0; k < 3; k++) arch(b, pw - k * .45, 5.2 - k * .4, ff + .15 + (2 - k) * .12, 0, pz, k === 2 ? L_.soot : (k ? Gd : G), true, .3);
    b.box(.5, 5.6, .5, ff + .2, 0, pz + pw / 2 + .3, G).box(.5, 5.6, .5, ff + .2, 0, pz - pw / 2 - .3, G); }
  b.box(.6, .5, d * .92, ff + .1, 5.6, 0, Gd); for (let k = 0; k < 28; k++) b.box(.3, .9, .32, ff + .2, 6.1, -d * .43 + k * d * .86 / 27, Gd).cyl(.12, .12, .2, ff + .2, 7.0, -d * .43 + k * d * .86 / 27, Gd, 5); // gallery of kings
  b.box(.6, .3, d * .92, ff + .15, 7.25, 0, G);
  b.add(new THREE.CircleGeometry(2.5, 28), ROSEM, ff + .26, 9.4, 0, 0, Math.PI / 2).add(new THREE.TorusGeometry(2.55, .22, 5, 28), Gd, ff + .26, 9.4, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) { arch(b, 1.3, 3.6, ff + .05, 7.6, s * d * .3 - .7, LANCET, true, .2); arch(b, 1.3, 3.6, ff + .05, 7.6, s * d * .3 + .7, LANCET, true, .2); }
  b.box(.5, .3, d * .92, ff + .1, 12.2, 0, Gd); for (let k = 0; k < 22; k++) b.cyl(.09, .09, 1.6, ff + .05, 12.5, -d * .42 + k * d * .84 / 21, G, 5); b.box(fw * .9, .35, d * .92, fx, 14.1, 0, Gd); // grand gallery
  for (const s of [-1, 1]) { const tz = s * d * .3, tw = d * .32; b.box(fw, 7.2, tw, fx, 14.4, tz, G);
    for (const q of [-1, 1]) { arch(b, 1.0, 5.2, ff + .05, 15.2, tz + q * tw * .22, L_.soot, true, .2); arch(b, 1.0, 5.2, fx + q * .1, 15.2, tz + s * (tw / 2 + .05), L_.soot, false, .2); }
    for (const cx of [-1, 1]) for (const cz of [-1, 1]) b.box(.7, 21.6, .7, fx + cx * (fw / 2 - .1), 0, tz + cz * (tw / 2 - .1), G).cone(.32, 1.6, fx + cx * (fw / 2 - .1), 21.6, tz + cz * (tw / 2 - .1), G, 6);
    b.box(fw + .3, .35, tw + .3, fx, 21.6, tz, Gd); b.box(fw * .8, .2, tw * .8, fx, 21.95, tz, LEAD).box(1.6, 2.4, 1.6, fx - fw * .2, 21.9, tz - s * tw * .2, G).cone(1.1, 1.6, fx - fw * .2, 24.3, tz - s * tw * .2, LEAD, 4); for (let k = 0; k < 8; k++) b.box(.12, .55, .12, fx + fw / 2 + .05, 21.95, tz - tw / 2 + k * tw / 7, G); }
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) b.box(.55, 12.6, .55, ff + .25, 0, s * d * .46 * (k < 2 ? 1 : .2) * (k % 2 ? 1 : .98) + (k > 1 ? s * d * .1 : 0), G);
  // nave + choir, clerestory, aisles, flying buttresses
  const nl = x1 - x0, ncx = (x0 + x1) / 2; b.box(nl, 10, nw, ncx, 0, 0, G).gable(nl, nw, 5.2, ncx, 10, 0, LEAD); b.box(nl, .2, .1, ncx, 15.2, 0, L_.gold); for (let k = 0; k < nl / 1.2; k++) b.cone(.12, .5, x0 + k * 1.2, 15.2, 0, L_.iron, 4);
  for (const s of [-1, 1]) { b.box(nl, 5.6, d * .19, ncx, 0, s * (nw / 2 + d * .095), G); b.add(new THREE.BoxGeometry(nl, .25, d * .22), LEAD, ncx, 6.0, s * (nw / 2 + d * .1), s * .32, 0, 0);
    const nb = Math.floor(nl / 3.1); for (let k = 0; k < nb; k++) { const bx = x0 + (k + .5) * nl / nb; if (Math.abs(bx + w * .02) < d * .1) continue;
      arch(b, .9, 2.8, bx, 6.6, s * (nw / 2 + .02), LANCET, false, .12); arch(b, .9, 2.3, bx, 1.4, s * (nw / 2 + d * .19 + .02), LANCET, false, .12);
      const pz = s * (nw / 2 + d * .2); b.box(.7, 8, .9, bx, 0, pz, G).cone(.34, 2.2, bx, 8, pz, G, 6);
      b.add(new THREE.BoxGeometry(.32, .4, d * .2 * 1.25), Gd, bx, 8.1, s * (nw / 2 + d * .1), s * -.62, 0, 0); } }
  // transept with north & south roses
  const tx = -w * .02; b.box(4.6, 10, d * .96, tx, 0, 0, G).gable(d * .96, 4.6, 5.2, tx, 10, 0, LEAD, true);
  for (const s of [-1, 1]) { b.add(new THREE.CircleGeometry(1.6, 24), ROSEM, tx, 7.6, s * (d * .48 + .02), 0, s > 0 ? 0 : Math.PI, 0).add(new THREE.TorusGeometry(1.65, .16, 5, 24), Gd, tx, 7.6, s * (d * .48 + .02));
    arch(b, 2.2, 4, tx, 0, s * (d * .48 + .05), L_.soot, false, .2); b.box(4.6, 1.2, .3, tx, 10, s * d * .48, Gd); for (const q of [-1, 1]) b.box(.6, 13, .6, tx + q * 2.2, 0, s * d * .48, G).cone(.3, 2, tx + q * 2.2, 13, s * d * .48, G, 6); }
  // apse (chevet) with radiating buttresses
  b.add(new THREE.CylinderGeometry(nw / 2, nw / 2, 10, 14, 1, false, 0, Math.PI), G, x0, 5, 0, 0, Math.PI, 0).add(new THREE.SphereGeometry(nw / 2, 14, 6, 0, Math.PI, 0, Math.PI / 2), LEAD, x0, 10, 0, 0, Math.PI, 0, 1, .9, 1);
  b.add(new THREE.CylinderGeometry(nw / 2 + d * .17, nw / 2 + d * .17, 5.6, 14, 1, false, 0, Math.PI), G, x0, 2.8, 0, 0, Math.PI, 0);
  for (let k = 0; k <= 6; k++) { const a = Math.PI / 2 + k / 6 * Math.PI, px = x0 + Math.cos(a) * (nw / 2 + d * .2), pz = -Math.sin(a) * (nw / 2 + d * .2); b.box(.7, 8, .7, px, 0, pz, G).cone(.32, 2.2, px, 8, pz, G, 6);
    const mx = x0 + Math.cos(a) * (nw / 2 + d * .1), mz = -Math.sin(a) * (nw / 2 + d * .1); b.add(new THREE.BoxGeometry(d * .25, .38, .32), Gd, mx, 8.1, mz, 0, -a + Math.PI, .6 * (Math.cos(a) > 0 ? 1 : 1)); }
  // Viollet-le-Duc spire over the crossing
  b.cyl(1.0, 1.1, 2.4, tx, 13.5, 0, LEAD, 8); for (let k = 0; k < 8; k++) b.cone(.18, 1.6, tx + Math.cos(k * .785) * 1.05, 15.6, Math.sin(k * .785) * 1.05, LEAD, 4);
  b.cyl(.55, .9, 3, tx, 15.9, 0, LEAD, 8).cone(.55, 9, tx, 18.9, 0, LEAD, 8).cyl(.06, .06, 1.2, tx, 27.9, 0, L_.gold, 4).box(.6, .08, .08, tx, 28.6, 0, L_.gold); }
seams(LMat.slate); seams(LMat.zinc, .5); seams(LMat.copper, .7); ashlar(LMat.stone); ashlar(LMat.stoneD, .5, 1.0, 1.2); ashlar(LMat.gothic, .45, .9, 1.5); LMat.gothic.color.set(0xc4baa6);
const BUILD = {
  cathedral(b, w, d) { return notredame(b, w, d); const nw = d * .42; b.box(w * .78, 9, nw, -w * .06, 0, 0, L_.gothic).gable(w * .78, nw, 4.5, -w * .06, 9, 0, L_.slate);
    for (const s of [-1, 1]) { b.box(w * .7, 5, d * .2, -w * .08, 0, s * (nw / 2 + d * .1), L_.gothic); b.add(new THREE.BoxGeometry(w * .7, .3, d * .24), L_.slate, -w * .08, 5.6, s * (nw / 2 + d * .1), s * .35, 0, 0);
      for (let k = 0; k < 7; k++) b.add(new THREE.BoxGeometry(.5, 6, .5), L_.gothic, -w * .4 + k * w * .1, 5.5, s * (nw / 2 + d * .12), s * .5, 0, 0); }
    b.box(w * .12, 9, d * .95, -w * .02, 0, 0, L_.gothic).gable(d * .95, w * .12, 4.5, -w * .02, 9, 0, L_.slate, true).cone(.7, 10, -w * .02, 11.5, 0, L_.slate, 8);
    b.cyl(nw / 2, nw / 2, 9, -w * .45, 0, 0, L_.gothic, 12).cone(nw / 2, 4, -w * .45, 9, 0, L_.slate, 12);
    for (const s of [-1, 1]) b.box(w * .16, 16, d * .26, w * .41, 0, s * d * .24, L_.gothic); b.box(w * .16, 13, d * .24, w * .41, 0, 0, L_.gothic);
    b.add(new THREE.CircleGeometry(2.2, 20), L_.iron, w * .49 + .02, 9, 0, 0, Math.PI / 2); for (const s of [-1, 1]) for (let k = 0; k < 3; k++) b.box(.3, 1, .3, w * .41 + (k - 1) * 1.5, 16, s * d * .24 + d * .1, L_.gothic); },
  chapel(b, w, d) { b.box(w * .9, 9, d * .75, 0, 0, 0, L_.gothic).gable(w * .9, d * .75, 6, 0, 9, 0, L_.slate).cone(.45, 9, -w * .05, 12, 0, L_.gold, 6); b.add(new THREE.CircleGeometry(1.4, 16), L_.iron, w * .45 + .02, 7, 0, 0, Math.PI / 2); },
  church(b, w, d, k) { b.box(w * .8, 7, d * .55, -w * .08, 0, 0, L_.stoneD).gable(w * .8, d * .55, 3.2, -w * .08, 7, 0, L_.slate);
    if (k === 'stsulpice') { for (const s of [-1, 1]) b.box(w * .16, 13, d * .2, w * .38, 0, s * d * .28, L_.stoneD).cyl(1.2, 1.4, 2.5, w * .38, 13, s * d * .28, L_.stoneD); b.box(w * .1, 8, d * .7, w * .44, 0, 0, L_.stoneD).cols(w * .5, -d * .3, w * .5, d * .3, 6, 6, .4, 0, L_.stone); }
    else if (k === 'staugustin') { b.cyl(d * .25, d * .25, 4, -w * .25, 7, 0, L_.stoneD, 16).dome(d * .26, -w * .25, 11, 0, L_.slate, 1.3).cone(.6, 3, -w * .25, 14.3, 0, L_.gold); }
    else { b.box(w * .16, 12, d * .26, w * .36, 0, 0, L_.stoneD).box(w * .17, 1.6, d * .27, w * .36, 9, 0, L_.soot).box(w * .19, .4, d * .29, w * .36, 12, 0, L_.stone).cone(d * .18, 6, w * .36, 12.4, 0, L_.slate, 4).box(.12, 1.4, .12, w * .36, 18.2, 0, L_.gold).box(.12, .12, .7, w * .36, 18.9, 0, L_.gold); } },
  opera(b, w, d) { b.box(w * .86, 7, d * .78, -w * .02, 0, 0, L_.stone).box(w * .14, 8.5, d * .7, w * .38, 0, 0, L_.stone).cols(w * .46, -d * .3, w * .46, d * .3, 8, 4.5, .35, 3, L_.stoneD)
      .box(w * .12, .8, d * .72, w * .38, 8.5, 0, L_.copper).dome(d * .26, w * .14, 7, 0, L_.copper, .55).cyl(.8, .8, .8, w * .14, 9.6, 0, L_.gold)
      .box(w * .3, 11, d * .6, -w * .2, 0, 0, L_.stone).gable(d * .6, w * .3, 4, -w * .2, 11, 0, L_.copper, true).cyl(.5, .5, 1.6, -w * .2, 15, 0, L_.gold, 6);
    for (const s of [-1, 1]) { b.cyl(d * .12, d * .12, 7, -w * .02, 0, s * d * .42, L_.stone, 14).dome(d * .12, -w * .02, 7, s * d * .42, L_.copper, .8); b.box(.8, 2, .8, w * .44, 8.5, s * d * .34, L_.gold); }
    const fx = w * .45 + .02; for (let k = 0; k < 7; k++) { const z = -d * .27 + k * d * .09; arch(b, d * .06, 2.8, fx, 0, z, L_.soot, true, .2); b.box(.3, .25, .4, fx + .1, 2.9, z, L_.gold); }
    for (let k = 0; k < 8; k++) { const z = -d * .3 + k * d * .6 / 7; b.cyl(.18, .18, 4.5, fx + .25, 3, z - .3, L_.stoneD, 8).cyl(.18, .18, 4.5, fx + .25, 3, z + .3, L_.stoneD, 8); }
    for (const s of [-1, 1]) { b.box(.9, 1.2, 1.4, w * .44, 10.5, s * d * .32, L_.gold); b.add(new THREE.SphereGeometry(.7, 8, 6), L_.gold, w * .44, 11.9, s * d * .32, 0, 0, 0, .7, 1.3, .9); b.add(new THREE.ConeGeometry(.45, 1.4, 6), L_.gold, w * .44, 12.9, s * d * .32); }
    b.add(new THREE.TorusGeometry(d * .265, .18, 5, 28), L_.gold, w * .14, 7.1, 0, Math.PI / 2).add(new THREE.TorusGeometry(1.0, .12, 5, 14), L_.gold, w * .14, 10.3, 0, Math.PI / 2);
    b.add(new THREE.SphereGeometry(.5, 8, 6), L_.gold, -w * .2, 17, 0).add(new THREE.ConeGeometry(.3, 1.2, 6), L_.gold, -w * .2, 18, 0).box(.4, .4, 3, -w * .2 + w * .15, 15.2, 0, L_.gold); },
  temple(b, w, d) { b.box(w, 1.2, d, 0, 0, 0, L_.stoneD).box(w * .78, 7, d * .62, 0, 1.2, 0, L_.stone); const nx = Math.max(4, Math.round(w / 2.4)), nz = Math.max(3, Math.round(d / 2.4));
    b.cols(-w * .46, -d * .44, w * .46, -d * .44, nx, 6.4, .42, 1.2, L_.stone).cols(-w * .46, d * .44, w * .46, d * .44, nx, 6.4, .42, 1.2, L_.stone).cols(w * .46, -d * .3, w * .46, d * .3, nz - 1, 6.4, .42, 1.2, L_.stone).cols(-w * .46, -d * .3, -w * .46, d * .3, nz - 1, 6.4, .42, 1.2, L_.stone)
      .box(w * .98, 1.1, d * .96, 0, 7.6, 0, L_.stone).gable(w * .98, d * .96, 2.6, 0, 8.7, 0, L_.slate); },
  dome(b, w, d, k) { const g = k === 'invalides' ? L_.gold : k === 'pantheon' ? L_.stoneD : L_.slate, r = Math.min(w, d) * .2;
    b.box(w * .9, 8, d * .36, 0, 0, 0, L_.stone).box(w * .36, 8, d * .9, 0, 0, 0, L_.stone).gable(w * .9, d * .36, 2.5, 0, 8, 0, L_.slate).gable(d * .9, w * .36, 2.5, 0, 8, 0, L_.slate, true)
      .cols(w * .5, -d * .15, w * .5, d * .15, 6, 6.5, .4, 0, L_.stone).gable(w * .08, d * .4, 2, w * .48, 7, 0, L_.stone)
      .cyl(r, r, 4.5, 0, 8, 0, L_.stone, 20).cols(r * 1.1, 0, r * 1.1, 0, 1, 4, .3, 8, L_.stone).dome(r * 1.05, 0, 12.5, 0, g, 1.25, 20).cyl(.6, .8, 2, 0, 18.2, 0, L_.stone, 8).cone(.6, 2, 0, 20.2, 0, L_.gold, 8);
    for (let k2 = 0; k2 < 12; k2++) { const a = k2 / 12 * 6.283; b.cyl(.25, .25, 4, Math.cos(a) * r * 1.12, 8, Math.sin(a) * r * 1.12, L_.stone, 6); } },
  palace(b, w, d, k) { const t = Math.max(5, Math.min(10, Math.min(w, d) * .24)), H = k === 'louvre' ? 8 : 7.5, R = k === 'hoteldeville' ? null : L_.slate;
    const wing = (x, z, lx, lz) => { b.box(lx, H, lz, x, 0, z, L_.stone); if (R) b.box(Math.max(.5, lx - 1.4), 1.8, Math.max(.5, lz - 1.4), x, H, z, R); };
    if (w > 16 && d > 16) { wing(0, -d / 2 + t / 2, w, t); wing(0, d / 2 - t / 2, w, t); wing(-w / 2 + t / 2, 0, t, d - 2 * t); wing(w / 2 - t / 2, 0, t, d - 2 * t); if (k === 'louvre') { wing(w * .1, 0, t * .8, d - 2 * t); } } else wing(0, 0, w, d);
    if (R) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const px = sx * (w / 2 - t * .6), pz = sz * (d / 2 - t * .6); b.box(t * 1.2, H + 1, t * 1.2, px, 0, pz, L_.stone).cone(t * .85, 4, px, H + 1, pz, L_.slate, 4); }
    if (R) b.box(t * .9, H + 2, t * 1.6, w / 2 - t * .4, 0, 0, L_.stone).gable(t * 1.6, t * .9, 2, w / 2 - t * .4, H + 2, 0, L_.slate, true);
    if (k === 'conciergerie') for (let q = 0; q < 3; q++) b.cyl(1.6, 1.6, 9, w * .5, 0, -d * .3 + q * d * .25, L_.stoneD, 12).cone(1.7, 4, w * .5, 9, -d * .3 + q * d * .25, L_.slate, 12);
    if (k === 'bonmarche' || k === 'printemps' || k === 'magasinslouvre') { for (const sx of [-1, 1]) b.dome(2.6, sx * (w / 2 - 3), H + 1, d / 2 - 3, L_.copper, 1.3); if (w > 16 && d > 16) b.box(w - 2 * t, .4, d - 2 * t, 0, H - 1, 0, L_.glass); } },
  ruin(b, w, d) { const t = Math.min(d, 7); for (let k = 0; k < 14; k++) { const x0 = -w / 2 + k * w / 14, hh = 3 + hash(k, 1, 5) * 5; b.box(w / 14 - .5, hh, .6, x0 + w / 28, 0, -t / 2, L_.soot).box(w / 14 - .5, hh * (.6 + hash(k, 3, 5) * .5), .6, x0 + w / 28, 0, t / 2, L_.soot); }
    b.box(5, 10, t + .6, 0, 0, 0, L_.soot).box(w, .3, t, 0, 0, 0, L_.soot).box(.6, 6, t, -w / 2, 0, 0, L_.soot).box(.6, 6, t, w / 2, 0, 0, L_.soot); },
  hall(b, w, d, k) { if (k !== 'industrie') { const n = Math.max(2, Math.round(d / 8)); for (let q = 0; q < n; q++) { const z = -d / 2 + (q + .5) * d / n; b.box(w * .92, 3.6, d / n - 2, 0, 0, z, k === 'abattoir' ? L_.brick : L_.stoneD).gable(w * .92, d / n - 1.4, 1.8, 0, 3.6, z, L_.slate); } return; }
    b.box(w, 6, d, 0, 0, 0, L_.stone).add(new THREE.CylinderGeometry(d * .42, d * .42, w * .94, 16, 1, false, 0, Math.PI), L_.glass, 0, 6, 0, 0, 0, Math.PI / 2, 1, 1, .55).box(4, 10, d * .5, w / 2 - 2, 0, 0, L_.stone).gable(d * .5, 4, 3, w / 2 - 2, 10, 0, L_.stone, true); },
  trocadero(b, w, d) { b.cyl(7, 7, 8, 0, 0, 0, L_.stone, 20).dome(7, 0, 8, 0, L_.slate, .7, 20); for (const s of [-1, 1]) b.box(3, 17, 3, -2, 0, s * 6, L_.stone).cone(2.2, 3, -2, 17, s * 6, L_.slate, 4);
    for (const s of [-1, 1]) for (let k = 0; k < 9; k++) { const a = s * (.5 + k * .14), r = 18; b.box(4.4, 6, 4, Math.cos(a + Math.PI) * -r * .2 - Math.cos(a) * 4 + 3, 0, Math.sin(a) * r, L_.stone, -a); } },
  halles(b, w, d) { const nx = Math.max(1, Math.round(w / 15)), nz = Math.max(1, Math.round(d / 15)), pw = w / nx, pd = d / nz;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = -w / 2 + (i + .5) * pw, z = -d / 2 + (j + .5) * pd; b.box(pw - 3, 4.2, pd - 3, x, 0, z, L_.iron).box(pw - 2.4, .4, pd - 2.4, x, 4.2, z, L_.zinc).box(pw * .45, 1.6, pd * .45, x, 4.6, z, L_.glass).box(pw * .5, .3, pd * .5, x, 6.2, z, L_.zinc); }
    b.box(w * .98, .3, 2.6, 0, 5, 0, L_.glass); },
  station(b, w, d) { b.box(w * .16, 8, d, w * .42, 0, 0, L_.stone).add(new THREE.CircleGeometry(1.3, 20), L_.white, w * .5 + .05, 6, 0, 0, Math.PI / 2).gable(d, w * .16, 2.5, w * .42, 8, 0, L_.slate, true);
    b.box(w * .84, 4, .8, -w * .08, 0, -d / 2 + .4, L_.stoneD).box(w * .84, 4, .8, -w * .08, 0, d / 2 - .4, L_.stoneD).add(new THREE.CylinderGeometry(d * .5, d * .5, w * .84, 18, 1, true, 0, Math.PI), L_.glass, -w * .08, 4, 0, 0, 0, Math.PI / 2, 1, 1, .5); },
  arc(b) { for (const s of [-1, 1]) { b.box(9, 11, 6, 0, 0, s * 6, L_.stone).box(9.3, .8, 6.3, 0, 0, s * 6, L_.stoneD); for (const q of [-1, 1]) { b.box(.4, 4.2, 3.2, q * 4.6, 1.2, s * 6.2, L_.stoneD); b.add(new THREE.SphereGeometry(.8, 8, 6), L_.stoneD, q * 4.75, 4.2, s * 6.2, 0, 0, 0, .5, 1.5, 1); b.add(new THREE.SphereGeometry(.6, 8, 6), L_.stoneD, q * 4.75, 5.6, s * 5.6, 0, 0, 0, .5, 1, 1); }
      arch(b, 2.2, 6, 0, 0, s * 6, L_.soot, true, 9.2); }
    b.box(9, 3.2, 18, 0, 11, 0, L_.stone).box(9.6, .6, 18.6, 0, 11.4, 0, L_.stoneD).box(9.2, 1, 18.2, 0, 12.4, 0, L_.stoneD); for (let k = 0; k < 30; k++) b.box(9.5, .5, .2, 0, 12.6, -8.7 + k * .6, L_.stone);
    b.box(9.4, .5, 18.4, 0, 14.2, 0, L_.stoneD).box(9, .4, 18, 0, 14.7, 0, L_.stone); },
  obelisk(b) { b.box(2.2, 2, 2.2, 0, 0, 0, L_.stoneD).add(new THREE.CylinderGeometry(.42, .7, 8.5, 4), L_.stone, 0, 6.25, 0, 0, Math.PI / 4).cone(.45, 1, 0, 10.5, 0, L_.gold, 4);
    for (const s of [-1, 1]) { b.cyl(4.5, 4.5, .7, 0, 0, s * 15, L_.stoneD, 20).cyl(4.1, 4.1, .1, 0, .65, s * 15, L_.water, 20).cyl(.6, 1, 2.6, 0, 0, s * 15, L_.stoneD).cyl(2, 1.4, .4, 0, 2.6, s * 15, L_.gold).cyl(.3, .4, 1.6, 0, 3, s * 15, L_.stoneD).cyl(1, .8, .3, 0, 4.6, s * 15, L_.gold); }
    for (const [x, z] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) b.cyl(.5, .6, 5, x, 0, z, L_.iron, 8).box(.8, .9, .8, x, 5, z, L_.gold); },
  column(b, w, d, k) { b.box(2.6, 2.6, 2.6, 0, 0, 0, L_.stoneD).cyl(.85, .95, 12, 0, 2.6, 0, k === 'bastille' ? L_.copper : L_.iron, 14).box(2, .6, 2, 0, 14.6, 0, L_.iron).cyl(.35, .45, 1.6, 0, 15.2, 0, k === 'bastille' ? L_.gold : L_.iron, 8); },
  tower(b) { b.box(4, 14, 4, 0, 0, 0, L_.gothic); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cone(.5, 2.5, sx * 1.7, 14, sz * 1.7, L_.gothic, 6); b.box(.8, 1.6, .8, 0, 14, 0, L_.gothic); },
  rotunda(b, w, d) { const r = Math.min(w, d) * .45; b.cyl(r, r, 6.5, 0, 0, 0, L_.stone, 20).cyl(r + .1, r + .1, .5, 0, 5.2, 0, L_.red, 20).cone(r, 3, 0, 6.5, 0, L_.zinc, 20); },
  theatre(b, w, d, k, plain) { b.box(w * .9, 7, d * .9, 0, 0, 0, plain ? L_.stoneD : L_.stone).gable(w * .9, d * .9, 2.6, 0, 7, 0, L_.slate); if (!plain) b.cols(w * .46, -d * .32, w * .46, d * .32, 6, 5, .32, 1, L_.stone).box(w * .06, 1, d * .74, w * .46, 6, 0, L_.stone);
    if (k === 'folies' || k === 'moulinrouge') b.box(.2, 1.4, d * .5, w * .46, 6.2, 0, L_.red); },
  mill(b) { b.cyl(1.2, 1.9, 6, 0, 0, 0, L_.wood, 10).cone(1.5, 1.8, 0, 6, 0, L_.slate, 10).box(1, 1, 1, 1.4, 5.3, 0, L_.wood); },
  scaffold(b, w, d, k) { const H = k === 'hoteldeville' ? 8 : 3.5; if (k === 'hoteldeville') { this.palace(b, w, d, 'hoteldeville'); b.box(w * .6, .4, d * .6, 0, H, 0, L_.slate); } else { b.box(w * .7, H, d * .25, 0, 0, 0, L_.stone).box(w * .25, H, d * .7, 0, 0, 0, L_.stone).cyl(d * .2, d * .2, H + 1, -w * .2, 0, 0, L_.stone, 16); }
    for (let x = -w / 2; x <= w / 2; x += 3) for (const s of [-1, 1]) b.box(.18, H + 3, .18, x, 0, s * (d / 2 + .6), L_.wood); for (let y = 2; y < H + 3; y += 2) for (const s of [-1, 1]) b.box(w, .15, .5, 0, y, s * (d / 2 + .6), L_.wood);
    for (const s of [-1, 1]) { b.box(.5, H + 12, .5, s * w * .3, 0, s * d * .2, L_.wood); b.add(new THREE.BoxGeometry(14, .4, .4), L_.wood, s * w * .3 + 5, H + 11.5, s * d * .2, 0, s * .6, 0); } },
  pavilion(b) { for (const s of [-1, 1]) b.box(5, 4.5, 5, 0, 0, s * 8, L_.stone).cols(2.6, s * 8 - 1.8, 2.6, s * 8 + 1.8, 4, 3.6, .3, 0, L_.stoneD).cone(3.8, 2, 0, 4.5, s * 8, L_.slate, 4); },
  basin(b) { b.cyl(6, 6, .6, 0, 0, 0, L_.stoneD, 28).cyl(5.6, 5.6, .1, 0, .56, 0, L_.water, 28).cyl(.5, .8, 1.6, 0, 0, 0, L_.stoneD); },
  sign(b) { b.box(.15, 3, .15, 0, 0, 0, L_.iron).box(1.4, .8, .1, .6, 2.3, 0, L_.red).box(.3, .4, .3, 1.3, 2.4, 0, L_.gold); },
};
// landmark specs: model, front compass, flood radius (tiles), frontLong
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0], NW: [-.7, -.7], NE: [.7, -.7], SE: [.7, .7], SW: [-.7, .7] };
const LS = { cathedral: { R: 26, fl: 1 }, chapel: { R: 8, fl: 1 }, church: { R: 18, fl: 1 }, opera: { R: 30, fl: 1 }, temple: { R: 20, fl: 1 }, dome: { R: 24, fl: 1 }, palace: { R: 40, fl: 0 }, ruin: { R: 70, fl: 0 }, hall: { R: 50, fl: 0 }, trocadero: { fix: [30, 40] },
  halles: { R: 50, fl: 0 }, station: { R: 36, fl: 1 }, arc: { fix: [9, 18] }, obelisk: { fix: [20, 30] }, column: { fix: [3, 3] }, tower: { fix: [5, 5] }, rotunda: { R: 12, fl: 0 }, theatre: { R: 14, fl: 0 }, concert: { R: 8, fl: 0 }, mill: { fix: [4, 4] }, scaffold: { R: 26, fl: 0 }, store: { R: 30, fl: 0 }, pavilion: { fix: [6, 22] }, garden: { basin: 1 }, cabaret: { sign: 1 }, cafe: { sign: 1 }, shop: { sign: 1 }, gallery: { sign: 1 } };
const FRONT = { notredame: 'W', garnier: 'S', madeleine: 'S', bourse: 'W', pantheon: 'W', invalides: 'S', staugustin: 'NW', institut: 'N', stsulpice: 'W', stgermain: 'W', steustache: 'W', trinite: 'S', lorette: 'S', garenord: 'S', gareest: 'S', gare: 'S', garelyon: 'W', gareaust: 'W', garemontp: 'N', odeon: 'N', chatelet: 'E', lyrique: 'W', saintechapelle: 'W', industrie: 'N', trocadero: 'SE', sacrecoeur: 'S', conciergerie: 'N' };
export const LMODELS = []; // {key,x,z,ang,w,d,type,group?,sails?}
function fitFootprint(key, l, sp) { const ci = Math.floor(l[1] / T), cj = Math.floor(l[2] / T); let seed = null;
  for (let r = 0; r < 8 && !seed; r++) for (let dj = -r; dj <= r && !seed; dj++) for (let di = -r; di <= r; di++) if (kij(ci + di, cj + dj) === K.BLD) { seed = [ci + di, cj + dj]; break; }
  if (!seed) return null; const R = sp.R, seen = new Set([seed[0] + ',' + seed[1]]), st = [seed], tiles = [];
  while (st.length && tiles.length < 6000) { const [i, j] = st.pop(); tiles.push([i, j]); for (const [a, b] of N4) { const ii = i + a, jj = j + b, kk = ii + ',' + jj; if (seen.has(kk) || kij(ii, jj) !== K.BLD || (ii - ci) ** 2 + (jj - cj) ** 2 > R * R || skipT[ti(ii, jj)]) continue; seen.add(kk); st.push([ii, jj]); } }
  if (tiles.length < 6) return null; let mx = 0, mz = 0; for (const [i, j] of tiles) { mx += i; mz += j; } mx /= tiles.length; mz /= tiles.length; let a = 0, b = 0, c = 0; for (const [i, j] of tiles) { const x = i - mx, z = j - mz; a += x * x; b += x * z; c += z * z; }
  let th = .5 * Math.atan2(2 * b, a - c); const us = [], vs = []; for (const [i, j] of tiles) { const x = i - mx, z = j - mz; us.push(x * Math.cos(th) + z * Math.sin(th)); vs.push(-x * Math.sin(th) + z * Math.cos(th)); }
  us.sort((p, q) => p - q); vs.sort((p, q) => p - q); const q = (arr, f) => arr[Math.floor(f * (arr.length - 1))]; let u0 = q(us, .03), u1 = q(us, .97) + 1, v0 = q(vs, .03), v1 = q(vs, .97) + 1;
  let w = (u1 - u0) * T, d = (v1 - v0) * T; const cu = (u0 + u1) / 2 - .5, cv_ = (v0 + v1) / 2 - .5; let x = (mx + .5 + cu * Math.cos(th) - cv_ * Math.sin(th)) * T, z = (mz + .5 + cu * Math.sin(th) + cv_ * Math.cos(th)) * T;
  if (!sp.fl) { /* front on long side */ th += Math.PI / 2; [w, d] = [d, w]; } // local x = front direction
  if (sp.fl && w < d) { th += Math.PI / 2; [w, d] = [d, w]; if (!sp.fl) { } }
  const f = DIRS[FRONT[key]]; if (f && Math.cos(th) * f[0] + Math.sin(th) * f[1] < 0) th += Math.PI;
  const cap = key === 'louvre' || key === 'industrie' ? [140, 140] : (LCAP[l[3]] || [80, 60]); return { x, z, ang: th, w: Math.min(w, cap[0]), d: Math.min(d, cap[1]), tiles }; }
const LCAP = { cathedral: [54, 24], church: [40, 20], chapel: [16, 8], palace: [56, 44], temple: [36, 26], theatre: [32, 26], concert: [18, 14], opera: [70, 50], dome: [44, 44], station: [60, 48], store: [48, 40], scaffold: [48, 40], rotunda: [24, 24], hall: [70, 40] };

// ================= 1889 EXPOSITION: TOUR EIFFEL + GALERIE DES MACHINES =================
// iron beam between two points, merged into the landmark builder
const _bq = new THREE.Quaternion(), _bu = new THREE.Vector3(0, 1, 0), _bd = new THREE.Vector3();
function beam(b, a, c, t, mat) { _bd.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); const l = _bd.length(); if (l < 1e-3) return; _bq.setFromUnitVectors(_bu, _bd.normalize()); const g = new THREE.BoxGeometry(t, l, t); g.applyQuaternion(_bq); b.add(g, mat, (a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2); }
export const EIFM = stdM({ color: 0x74382a, roughness: .62, metalness: .35 }); // 'rouge de Venise' of 1889
export const EIFL = stdM({ color: 0x3a2a1a, emissive: 0xffc878, emissiveIntensity: 0, roughness: .4 }); // gas jets along the edges
const GALG = new THREE.MeshStandardMaterial({ color: 0x9fb4b8, roughness: .15, metalness: .4, transparent: true, opacity: .94, envMapIntensity: 1.2 });
BUILD.eiffel = function (b) { const H = 72, W0 = 18, K_ = .05, y1 = 13.7, y2 = 27.6, wv = y => W0 * Math.exp(-K_ * y), lw = y => 7 - 2.5 * Math.min(1, y / y2);
  const M = EIFM, t1 = .34, t2 = .16;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const N = 9; let prev = null;
    for (let k = 0; k <= N; k++) { const y = y2 * k / N, o = wv(y), i = Math.max(0, o - lw(y)); const C = [[sx * i, y, sz * i], [sx * o, y, sz * i], [sx * o, y, sz * o], [sx * i, y, sz * o]];
      for (let q = 0; q < 4; q++) beam(b, C[q], C[(q + 1) % 4], t2, M);
      if (prev) for (let q = 0; q < 4; q++) { beam(b, prev[q], C[q], t1, M); beam(b, prev[q], C[(q + 1) % 4], t2, M); beam(b, prev[(q + 1) % 4], C[q], t2, M); if (q === 2) for (let e = 0; e < 3; e++) b.box(.22, .22, .22, C[q][0] * (1 - e * .002), y - e * (y2 / N) / 3, C[q][2], EIFL); }
      prev = C; }
    // stone pier under each leg
    b.box(lw(0) + .6, .8, lw(0) + .6, sx * (W0 - lw(0) / 2), 0, sz * (W0 - lw(0) / 2), L_.stoneD); }
  // decorative arches between the legs (1889)
  for (const [ax, az] of [[1, 0], [0, 1]]) for (const s of [-1, 1]) { const i0 = W0 - lw(0) + .5, n = 12; let p = null; for (let k = 0; k <= n; k++) { const f = k / n, u = -i0 + 2 * i0 * f, y = 1.5 + (y1 - 2.2) * Math.sin(f * Math.PI), w = wv(y) - .2, P = ax ? [u, y, s * Math.min(w, W0)] : [s * Math.min(w, W0), y, u]; if (p) beam(b, p, P, .3, M); p = P; } }
  // upper shaft
  { const N = 12; let prev = null; for (let k = 0; k <= N; k++) { const y = y2 + (H * .92 - y2) * k / N, o = wv(y); const C = [[-o, y, -o], [o, y, -o], [o, y, o], [-o, y, o]];
      for (let q = 0; q < 4; q++) beam(b, C[q], C[(q + 1) % 4], t2, M);
      if (prev) for (let q = 0; q < 4; q++) { beam(b, prev[q], C[q], t1 * .8, M); beam(b, prev[q], C[(q + 1) % 4], t2 * .8, M); b.box(.2, .2, .2, C[q][0], y, C[q][2], EIFL); } prev = C; } }
  // platforms: 1st (with the glazed galleries), 2nd, top + campanile & beacon
  { const o = wv(y1) + .9; b.box(o * 2, 1.3, o * 2, 0, y1 - .6, 0, M); for (const [x, z, w, d] of [[0, -o + .9, o * 2 - 1, 1.6], [0, o - .9, o * 2 - 1, 1.6], [-o + .9, 0, 1.6, o * 2 - 1], [o - .9, 0, 1.6, o * 2 - 1]]) b.box(w, 1.6, d, x, y1 + .7, z, EIFM);
    b.box(o * 2 - 3.6, .15, o * 2 - 3.6, 0, y1 + .7, 0, L_.zinc); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; b.box(.18, .9, o * 2, Math.cos(a) * o, y1 + .7, Math.sin(a) * o, EIFM, a); } }
  { const o = wv(y2) + .5; b.box(o * 2, .9, o * 2, 0, y2 - .4, 0, M); b.box(o * 2 - 1.4, 1.3, o * 2 - 1.4, 0, y2 + .5, 0, L_.zinc); }
  { const y = H * .92, o = wv(y) + .3; b.box(o * 2, .6, o * 2, 0, y, 0, M); b.cyl(.9, 1.1, 2.2, 0, y + .6, 0, L_.zinc, 12).dome(.95, 0, y + 2.8, 0, M, .9, 12).cyl(.12, .16, 2.4, 0, y + 3.6, 0, M, 6); b.box(.6, .6, .6, 0, y + 2.2, 0, EIFL); } };
BUILD.galerie = function (b, w, d) { const L = 128, R = 20, n = 21; // Galerie des Machines: 420 m three-hinged arched hall, glazed barrel
  const roof = new THREE.CylinderGeometry(R, R, L, 28, 1, true, 0, Math.PI); roof.rotateZ(Math.PI / 2); roof.rotateX(Math.PI / 2); roof.scale(1, 1.15, 1); b.add(roof, GALG, 0, 6, 0);
  for (let k = 0; k < n; k++) { const x = -L / 2 + L * k / (n - 1); let p = null; for (let q = 0; q <= 16; q++) { const a = Math.PI * q / 16, P = [x, 6 + Math.sin(a) * R * 1.15 + .15, Math.cos(a) * (R + .15)]; if (p) beam(b, p, P, .5, EIFM); p = P; } }
  for (let q = 0; q <= 8; q++) { const a = Math.PI * q / 8; beam(b, [-L / 2, 6 + Math.sin(a) * R * 1.15 + .2, Math.cos(a) * (R + .2)], [L / 2, 6 + Math.sin(a) * R * 1.15 + .2, Math.cos(a) * (R + .2)], .25, EIFM); }
  for (const s of [-1, 1]) { b.box(L, 6, 1.2, 0, 0, s * (R - .4), L_.stone); b.box(L, .6, 1.6, 0, 6, s * (R - .4), L_.stoneD); for (let k = 0; k < 10; k++) b.box(1.6, 12, 1.6, s * (L / 2 - .6), 0, -R + 2 + k * (2 * R - 4) / 9, L_.stone); b.box(1.4, 15, 2 * R + .2, s * (L / 2 + .2), 0, 0, GALG); b.box(2, 3, 12, s * (L / 2 + 1.2), 0, 0, L_.stoneD).box(2.2, 1, 13, s * (L / 2 + 1.3), 3, 0, L_.gold); } };
LS.eiffel = { fix: [40, 40] }; LS.galerie = { fix: [130, 44] };
if (LM.trocadero && LM.ecolemil) { const tx = LM.trocadero[1], tz = LM.trocadero[2], ex = LM.ecolemil[1], ez = LM.ecolemil[2];
  // real positions interpolated on the Trocadéro – École Militaire axis (tower at 31 %, Galerie at 80 %)
  LM.eiffel = ['Tour Eiffel (1889)', tx + (ex - tx) * .31, tz + (ez - tz) * .31, 'eiffel', 'completed March 1889 for the Exposition Universelle'];
  LM.galerie = ['Galerie des Machines (1889)', tx + (ex - tx) * .80, tz + (ez - tz) * .80, 'galerie', 'Dutert & Contamin, 1889'];
  if (!FRONT.galerie) FRONT.galerie = 'N'; }
LMK.install({ LMODELS, L_, stdM, ROSEM, LANCET, EIFM: typeof EIFM !== 'undefined' ? EIFM : null, EIFL: typeof EIFL !== 'undefined' ? EIFL : null });
(function placeLandmarks() { const order = Object.keys(LM).sort((p, q) => (LS[LM[p][3]]?.R || 0) - (LS[LM[q][3]]?.R || 0));
  for (const key of order) { if (LMK.OWNED.has(key)) continue; const l = LM[key], type = l[3], sp = LS[type]; if (!sp) continue; let fp;
    if (sp.sign) { fp = { x: l[1], z: l[2], ang: 0, w: 2, d: 2, model: 'sign' }; let best = null, bd = 1e9; const ci = Math.floor(l[1] / T), cj = Math.floor(l[2] / T); for (let dj = -8; dj <= 8; dj++) for (let di = -8; di <= 8; di++) if (kij(ci + di, cj + dj) === K.SIDE) { const dd = di * di + dj * dj; if (dd < bd) { bd = dd; best = [ci + di, cj + dj]; } } if (!best) continue;
      fp.x = (best[0] + .5) * T; fp.z = (best[1] + .5) * T; for (const [a, b] of N4) if (kij(best[0] + a, best[1] + b) === K.ROAD) fp.ang = Math.atan2(b, a) + Math.PI / 2; }
    else if (sp.basin) { const ci = Math.floor(l[1] / T), cj = Math.floor(l[2] / T); if (kij(ci, cj) !== K.PARK || !['luxjardin', 'tuileriesg', 'monceau'].includes(key)) continue; fp = { x: l[1], z: l[2], ang: 0, w: 12, d: 12, model: 'basin', solid: 6 }; }
    else if (sp.fix) { let ang = 0; if (key === 'arc') { const c = LM.champs; ang = Math.atan2(c[2] - l[2], c[1] - l[1]); } if (key === 'concorde') { const c = LM.madeleine; ang = Math.atan2(c[2] - l[2], c[1] - l[1]) + Math.PI / 2; }
      if (key === 'eiffel' || key === 'galerie') { ang = Math.atan2(LM.ecolemil[2] - l[2], LM.ecolemil[1] - l[1]) + (key === 'galerie' ? Math.PI / 2 : Math.PI / 4); }
      if (key === 'trocadero') { ang = Math.atan2(LM.champdemars[2] - l[2], LM.champdemars[1] - l[1]); }
      fp = { x: l[1], z: l[2], ang, w: sp.fix[0], d: sp.fix[1] }; const ci = Math.floor(l[1] / T), cj = Math.floor(l[2] / T), r = Math.ceil(Math.max(...sp.fix) / T / 2);
      if (['tower', 'mill', 'trocadero', 'pavilion', 'eiffel', 'galerie'].includes(type)) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (inb(ci + di, cj + dj) && kij(ci + di, cj + dj) === K.BLD) skipT[ti(ci + di, cj + dj)] = 1; }
    else { fp = fitFootprint(key, l, sp); if (!fp) continue; const ca = Math.cos(fp.ang), sa = Math.sin(fp.ang); for (const [i, j] of fp.tiles) { const x = (i + .5) * T - fp.x, z = (j + .5) * T - fp.z, u = x * ca + z * sa, v = -x * sa + z * ca; if (Math.abs(u) < fp.w / 2 + 1 && Math.abs(v) < fp.d / 2 + 1) skipT[ti(i, j)] = 1; } delete fp.tiles; }
    fp.key = key; fp.type = type; fp.model = fp.model || (type === 'concert' ? 'theatre' : type === 'store' ? 'palace' : type); LMODELS.push(fp);
    const ca = Math.cos(fp.ang), sa = Math.sin(fp.ang), solid = (lx, lz, r) => addProp('solid', fp.x + lx * ca - lz * sa, fp.z + lx * sa + lz * ca, { r, hp: 1e9 });
    if (type === 'arc') { solid(0, -6, 3.6); solid(0, 6, 3.6); } else if (type === 'obelisk') { solid(0, 0, 1.4); solid(0, 15, 4.6); solid(0, -15, 4.6); } else if (type === 'column') solid(0, 0, 1.7); else if (type === 'mill') solid(0, 0, 2); else if (type === 'tower') solid(0, 0, 2.6); else if (type === 'eiffel') { for (const a of [-1, 1]) for (const c of [-1, 1]) solid(a * 14.5, c * 14.5, 4.2); } else if (fp.solid) solid(0, 0, fp.solid); } })();
function buildLandmark(L) { if (L.custom) return L.custom(L); const b = new MB(); const f = BUILD[L.model]; if (!f) return null; f.call(BUILD, b, L.w, L.d, L.key, L.type === 'concert'); const g = b.build(); g.position.set(L.x, 0, L.z); g.rotation.y = -L.ang; g.scale.y = .58;
  if (L.model === 'mill') { const s = new THREE.Group(); s.position.set(1.95, 5.3, 0); for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.08, 4.8, .9), L_.sail); m.position.y = 2.4; const a = new THREE.Group(); a.rotation.x = k * Math.PI / 2; a.add(m); s.add(a); m.castShadow = true; } g.add(s); L.sails = s; }
  if (L.model === 'sign') { const lamp = new THREE.Mesh(new THREE.BoxGeometry(.3, .4, .3), LAMPMAT); lamp.position.set(1.3, 2.4, 0); g.add(lamp); }
  return g; }
// ================= PROP MODELS (instanced) =================
const PROPMAT = stdM({ vertexColors: true, roughness: .8 });
const LANTM = stdM({ color: 0x3a3020, emissive: 0xffc070, emissiveIntensity: 0, roughness: .3 }), GLOBEM = stdM({ color: 0xd8dce0, emissive: 0xdde8ff, emissiveIntensity: 0, roughness: .2 });
const CANOPYM = stdM({ color: 0xffffff, roughness: .9, vertexColors: true });
export const CUTU = { uRes: { value: new THREE.Vector2(1280, 720) }, uCut: { value: 1 } };
// shop atlas: awnings (8 colours), signs (8 trades), white, railings, goods (4 kinds)
const SHOPW = ['CAFÉ', 'BOULANGERIE', 'TABAC', 'VINS', 'PHARMACIE', 'MODES', 'LIBRAIRIE', 'BOUCHERIE'], AWC = ['#9a2424', '#2a5a34', '#24407a', '#b88a24', '#6a2450', '#2e2e2e', '#b0582a', '#246a6a'];
const SHOPC = cv(512, 1024, g => { for (let k = 0; k < 8; k++) for (let st = 0; st < 8; st++) { g.fillStyle = st % 2 ? '#efe6d2' : AWC[k]; g.fillRect(k * 64 + st * 8, 0, 8, 128); }
  const sh = g.createLinearGradient(0, 0, 0, 128); sh.addColorStop(0, 'rgba(0,0,0,.25)'); sh.addColorStop(.85, 'rgba(0,0,0,0)'); sh.addColorStop(.86, 'rgba(255,255,255,.15)'); sh.addColorStop(1, 'rgba(0,0,0,.1)'); g.fillStyle = sh; g.fillRect(0, 0, 512, 128);
  for (let k = 0; k < 8; k++) { const y = 128 + k * 40; g.fillStyle = ['#183424', '#4a1812', '#141414', '#1a2646'][k % 4]; g.fillRect(0, y, 512, 40); g.strokeStyle = '#c8a040'; g.lineWidth = 3; g.strokeRect(100, y + 4, 312, 32); g.save(); g.translate(256, y + 21); g.scale(1.4, 1); g.fillStyle = '#ecc85a'; g.font = 'bold 22px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(SHOPW[k], 0, 0); g.restore(); }
  g.fillStyle = '#fff'; g.fillRect(0, 448, 512, 32); g.clearRect(0, 480, 512, 32); g.fillStyle = '#16181a'; g.fillRect(0, 481, 512, 3); g.fillRect(0, 506, 512, 4); for (let x = 0; x < 512; x += 14) { g.fillRect(x, 481, 2, 29); g.beginPath(); g.arc(x + 7, 496, 4, 0, 7); g.lineWidth = 1.5; g.strokeStyle = '#16181a'; g.stroke(); }
  const G4 = [['#c8302a', '#e89a2a', '#78a03a', '#e8c040'], ['#e84a7a', '#f4e060', '#f8f4f0', '#a040c0', '#e86a3a'], ['#c8904a', '#a8703a', '#e0b070'], ['#4a1a2a', '#2a4a2a', '#5a1a1a']];
  for (let t = 0; t < 4; t++) { const x0 = t * 128; g.fillStyle = t === 1 ? '#3a5a2a' : '#6a4a2a'; g.fillRect(x0, 512, 128, 128); for (let n = 0; n < 90; n++) { g.fillStyle = G4[t][n % G4[t].length]; g.beginPath(); if (t === 2) g.ellipse(x0 + 10 + Math.random() * 108, 522 + Math.random() * 108, 11, 6, Math.random() * 3, 0, 7); else g.arc(x0 + 8 + Math.random() * 112, 520 + Math.random() * 112, t === 3 ? 5 : 7, 0, 7); g.fill(); } g.strokeStyle = '#3a2a18'; g.lineWidth = 6; g.strokeRect(x0 + 3, 515, 122, 122); }
  // v14 period street graphics: enamel street plaques (blue, white rim), bill posters, painted wall advertisements
  const PLQ = ['RUE', 'BOULEVARD', 'AVENUE', 'PLACE']; for (let k = 0; k < 4; k++) { const x = k * 128; g.fillStyle = '#f4f0e6'; g.fillRect(x + 4, 644, 120, 56); g.fillStyle = '#1e3a8a'; g.fillRect(x + 8, 648, 112, 48); g.strokeStyle = '#f4f0e6'; g.lineWidth = 2; g.strokeRect(x + 12, 652, 104, 40);
    g.fillStyle = '#f4f0e6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 13px Georgia, serif'; g.fillText(PLQ[k], x + 64, 662); g.font = 'bold 15px Georgia, serif'; g.fillText(['DE RIVOLI', 'ST-MICHEL', "DE L'OPÉRA", 'VENDÔME'][k], x + 64, 680, 96); }
  const PST = [['#c8302a', '#f4e8c8', 'MOULIN', 'ROUGE'], ['#f0d040', '#2a1a10', 'CIRQUE', 'FERNANDO'], ['#1a2a5a', '#f4e8c8', 'FOLIES', 'BERGÈRE'], ['#e8e0d0', '#7a2a1a', 'CHOCOLAT', 'MENIER'], ['#2a5a3a', '#f4e060', 'EXPOSITION', '1889'], ['#a03a6a', '#fff', 'JARDIN DE', 'PARIS'], ['#d86a2a', '#1a1a1a', 'ABSINTHE', 'PERNOD'], ['#f4e8c8', '#1a3a6a', 'LE PETIT', 'JOURNAL']];
  PST.forEach(([bg, fg, t1, t2], k) => { const x = k * 64; g.fillStyle = '#d8cca8'; g.fillRect(x, 704, 64, 128); g.fillStyle = bg; g.fillRect(x + 3, 707, 58, 122); g.fillStyle = fg; g.textAlign = 'center'; g.font = 'bold 11px Georgia, serif'; g.fillText(t1, x + 32, 724, 56); g.font = 'italic bold 11px Georgia, serif'; g.fillText(t2, x + 32, 740, 56);
    g.globalAlpha = .5; g.beginPath(); g.ellipse(x + 32, 785, 20, 28, 0, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 3, 707 + (k * 37) % 110, 58, 2); });
  const ADS = [['#3a2a1e', '#e8c860', 'CHOCOLAT MENIER', 'Évitez les contrefaçons'], ['#7a1a14', '#f4e8c8', 'BYRRH', 'Vin tonique au quinquina'], ['#1e2a4a', '#f0e0b0', 'AU BON MARCHÉ', 'Nouveautés · Maison A. Boucicaut'], ['#24402a', '#f4e8c8', 'GRANDS MAGASINS DU LOUVRE', 'Soieries · Confections']];
  ADS.forEach(([bg, fg, t1, t2], k) => { const x = (k % 2) * 256, y = 832 + (k >> 1) * 96; g.fillStyle = bg; g.fillRect(x + 2, y + 2, 252, 92); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 30px Georgia, serif'; g.fillText(t1, x + 128, y + 36, 236); g.font = 'italic 15px Georgia, serif'; g.fillText(t2, x + 128, y + 70, 236);
    g.fillStyle = 'rgba(232,224,208,.22)'; for (let n = 0; n < 40; n++) g.fillRect(x + 2 + ((n * 97) % 250), y + 2 + ((n * 53) % 90), 3 + (n % 5) * 3, 2); }); /* weathered paint */ });
const SHOPT = tex(SHOPC, false); SHOPT.anisotropy = 4;
const UVR = (x0, y0, x1, y1) => [x0 / 512, 1 - y1 / 1024, x1 / 512, 1 - y0 / 1024], WHT = UVR(8, 452, 24, 476), RAIL = UVR(0, 480, 512, 512);
const PLUV = k => UVR(k * 128 + 4, 644, k * 128 + 124, 700), PSUV = k => UVR(k * 64, 704, k * 64 + 64, 832), ADUV = k => UVR((k % 2) * 256 + 2, 834 + (k >> 1) * 96, (k % 2) * 256 + 254, 926 + (k >> 1) * 96);
const AWUV = k => UVR(k * 64, 0, k * 64 + 64, 126), SGUV = k => UVR(96, 128 + k * 40, 416, 168 + k * 40), GDUV = t => UVR(t * 128 + 4, 516, t * 128 + 124, 636);
const SHOPM = stdM({ map: SHOPT, vertexColors: true, side: THREE.DoubleSide, alphaTest: .5, roughness: .82 });
SHOPM.onBeforeCompile = sh => { sh.uniforms.uRes = CUTU.uRes; sh.uniforms.uCut = CUTU.uCut; sh.fragmentShader = 'uniform vec2 uRes; uniform float uCut;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  if (vColor.r > 1.5) { vec2 q = (gl_FragCoord.xy - uRes * .5) / uRes.y; float r = length(q * vec2(1., 1.25)); float a = smoothstep(.12, .26, r); float dth = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453); }`).replace('#include <color_fragment>', '#include <color_fragment>\n if (vColor.r > 1.5) diffuseColor.rgb *= .5;'); };
// quad builder (positions, normals, uvs, colours); colour r>1.5 marks see-through-near-player overhangs
class QB { constructor() { this.p = []; this.n = []; this.u = []; this.c = []; }
  q(a, b, c, d, uv, col = [1, 1, 1]) { const [u0, v0, u1, v1] = uv; const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const [P, U, V] of [[a, u0, v0], [b, u1, v0], [c, u1, v1], [a, u0, v0], [c, u1, v1], [d, u0, v1]]) { this.p.push(P[0], P[1], P[2]); this.n.push(nx, ny, nz); this.u.push(U, V); this.c.push(col[0], col[1], col[2]); } return this; }
  frame(mx, mz, nx, nz) { const Rx = nz, Rz = -nx; return (u, y, w) => [mx + Rx * u + nx * w, y, mz + Rz * u + nz * w]; }
  box(W, u, y, w, su, sy, sw, col, uv = WHT, top = null) { const u0 = u - su / 2, u1 = u + su / 2, y1 = y + sy, w0 = w - sw / 2, w1 = w + sw / 2;
    this.q(W(u0, y, w1), W(u1, y, w1), W(u1, y1, w1), W(u0, y1, w1), uv, col); this.q(W(u0, y1, w1), W(u1, y1, w1), W(u1, y1, w0), W(u0, y1, w0), top || uv, top ? [1, 1, 1] : col);
    this.q(W(u1, y, w1), W(u1, y, w0), W(u1, y1, w0), W(u1, y1, w1), uv, col); this.q(W(u0, y, w0), W(u0, y, w1), W(u0, y1, w1), W(u0, y1, w0), uv, col); this.q(W(u1, y, w0), W(u0, y, w0), W(u0, y1, w0), W(u1, y1, w0), uv, col); return this; }
  mesh(mat) { if (!this.p.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.computeBoundingSphere(); const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m; } }
const STONE = [.9, .86, .78], STONE2 = [.8, .76, .68], IRONC = [.09, .1, .1], WOOD = [.42, .28, .16], MARBLE = [.95, .93, .9], WICKER = [.62, .44, .24], GILT = [.85, .66, .25];
const nearLM = (x, z) => LMODELS.some(m => m.model !== 'sign' && (x - m.x) ** 2 + (z - m.z) ** 2 < (Math.hypot(m.w, m.d) / 2 + 6) ** 2);
function stall(B, W, k) { // market stall: posts, trestle, produce, striped canopy
  for (const [u, w] of [[-1.1, -.7], [1.1, -.7], [-1.1, .7], [1.1, .7]]) B.box(W, u, 0, w, .07, 2.05, .07, WOOD);
  B.box(W, 0, .72, 0, 2.3, .08, 1.3, WOOD); B.box(W, 0, 0, 0, 2.2, .72, .06, [.3, .2, .12]); for (let t = 0; t < 2; t++) B.box(W, -.55 + t * 1.1, .8, 0, 1, .2, 1.1, WOOD, WHT, GDUV(k % 2 ? 1 : (t ? 0 : 2)));
  const A = AWUV(k % 8), hi = [2, 2, 2]; B.q(W(-1.25, 2.0, -.85), W(1.25, 2.0, -.85), W(1.25, 2.35, 0), W(-1.25, 2.35, 0), A, hi); B.q(W(-1.25, 2.35, 0), W(1.25, 2.35, 0), W(1.25, 2.0, .85), W(-1.25, 2.0, .85), A, hi); }
function flowerCart(B, W) { B.box(W, 0, .45, 0, 1.4, .35, .8, WOOD, WHT, GDUV(1)); for (const w of [-.46, .46]) B.box(W, -.15, 0, w, .7, .7, .06, [.25, .17, .1]); B.box(W, .95, .55, 0, .6, .05, .06, WOOD); B.box(W, .5, .8, -.3, .05, 1.2, .05, WOOD);
  B.q(W(-.4, 2.0, -.9), W(1.4, 2.0, -.9), W(1.4, 2.0, .3), W(-.4, 2.0, .3), AWUV(1), [2, 2, 2]); }
function cafeSet(B, W, u, w) { B.box(W, u, 0, w, .07, .72, .07, IRONC); B.box(W, u, 0, w, .32, .03, .32, IRONC); B.box(W, u, .72, w, .58, .04, .58, MARBLE);
  for (const s of [-1, 1]) { B.box(W, u + s * .48, 0, w, .05, .44, .3, IRONC); B.box(W, u + s * .48, .44, w, .34, .05, .34, WICKER); B.box(W, u + s * .64, .44, w, .05, .45, .34, WICKER); } }
const FS = 1.5; // Haussmann storey scale: 3.6 m storeys against ~1.8 m people
const RDK = (i, j) => { const k = kij(i, j); return k === K.ROAD || k === K.BRIDGE; }, cornerT = (i, j) => { let h = false, v = false; for (let r = 1; r <= 2; r++) { if (RDK(i + r, j) || RDK(i - r, j)) h = true; if (RDK(i, j + r) || RDK(i, j - r)) v = true; } return h && v; }; /* v15: street-name plaques only at street corners */
function detailGeo(det, cx, cz) { const B = new QB(), PLQB = new Set(); const lvl = Q.det | 0; if (!lvl) return B;
  for (const [ax, az, bx, bz, h, st, nx, nz, ua, ub, oi, oj, bi, bj] of det) { const L = Math.hypot(bx - ax, bz - az), W = B.frame((ax + bx) / 2, (az + bz) / 2, nx, nz), mid = (ua + ub) / 2;
    // window sills and lintels (stone), Haussmann wrought-iron balconies on the 2nd and 5th floors
    if (lvl >= 2) { const fl = st === 2 ? 3 : 7; for (let f = 0; f < fl; f++) { const y0 = (1.6 + f * 1.2) * FS, wh = (f === 0 && st === 0 ? .86 : .7) * FS; if (y0 + .3 + wh > h) break;
        for (let sp = Math.ceil((ua - .8 * FS) / (1.6 * FS)) * 1.6 * FS + .8 * FS; sp < ub - .35; sp += 1.6 * FS) { if (sp < ua + .35) continue; const u = -(sp - mid); B.box(W, u, y0 + .25, .04, 1.1, .08, .16, STONE2); if (st === 0) B.box(W, u, y0 + .38 + wh, .03, 1.06, .1, .12, STONE); } } }
    if (st === 0) for (const y0 of [2.8 * FS, 6.4 * FS]) { if (y0 + 1.8 > h) continue; B.box(W, 0, y0 + .3, .2, L, .07, .5, STONE2); B.q(W(-L / 2, y0 + .37, .48), W(L / 2, y0 + .37, .48), W(L / 2, y0 + .85, .48), W(-L / 2, y0 + .85, .48), RAIL); }
    else B.box(W, 0, 1.6 * FS, .05, L, .08, .12, STONE2);
    // v14 street graphics: enamel name plaque at the street corner, bill posters on old fronts, painted advertisements high on plain walls
    if (lvl >= 1 && gclass(oi, oj) === 4) { const hp = hash(bi, bj, 81);
      if (ua < .4 && L > 2 && cornerT(oi, oj) && hash(bi, bj, 82) < .8 && !PLQB.has(bi * 65536 + bj) && PLQB.add(bi * 65536 + bj)) { const u = -(ua - mid) - .25; B.q(W(u - .55, 3.55, .07), W(u + .55, 3.55, .07), W(u + .55, 4.05, .07), W(u - .55, 4.05, .07), PLUV(Math.floor(hash(oi >> 3, oj >> 3, 83) * 4))); }
      const zk0 = hooks.shop ? hooks.shop(bi, bj, oi, oj) : null, shop0 = !(zk0 === -1 || (zk0 == null && hash(bi, bj, 61) > (st === 2 ? .45 : .7))); /* v15: posters go on blank (non-shop) ground floors, any style */
      if (!shop0 && hp < (st === 0 ? .5 : .6) && L > 2) { const n = 1 + Math.floor(hash(bi, bj, 84) * 3), u0 = (hash(bi, bj, 85) - .5) * (L - 2.5); for (let k = 0; k < n; k++) { const u = u0 + (k - (n - 1) / 2) * .78; B.q(W(u - .36, .55, .06), W(u + .36, .55, .06), W(u + .36, 1.95, .06), W(u - .36, 1.95, .06), PSUV(Math.floor(hash(bi + k, bj, 86) * 8))); } }
      else if (st !== 0 && hp > .78 && L > 5 && h > 8) { const aw = Math.min(L * .8, 9), ah = aw * .37, y1 = h - 1.2; B.q(W(-aw / 2, y1 - ah, .05), W(aw / 2, y1 - ah, .05), W(aw / 2, y1, .05), W(-aw / 2, y1, .05), ADUV(Math.floor(hash(bi, bj, 87) * 4)), [.92, .9, .86]); } }
    // ground-floor shopfronts on the pavement side
    if (gclass(oi, oj) !== 4) continue; const zk = hooks.shop ? hooks.shop(bi, bj, oi, oj) : null; if (zk === -1 || (zk == null && hash(bi, bj, 61) > (st === 2 ? .45 : .7))) continue; const k = zk ?? Math.floor(hash(bi >> 1, bj >> 1, 62) * 8); // ground-floor use from zoning.js
    B.q(W(-L * .46, 2.46, .05), W(L * .46, 2.46, .05), W(L * .46, 2.9, .05), W(-L * .46, 2.9, .05), SGUV(k)); B.box(W, 0, 2.4, .04, L * .96, .05, .06, GILT);
    if (hash(bi, bj, 63) < .8) { const A = AWUV(Math.floor(hash(bi >> 2, bj >> 2, 64) * 8)), hi = [2, 2, 2]; B.q(W(-L / 2, 1.86, 1.1), W(L / 2, 1.86, 1.1), W(L / 2, 2.36, .07), W(-L / 2, 2.36, .07), A, hi); B.q(W(-L / 2, 1.66, 1.1), W(L / 2, 1.66, 1.1), W(L / 2, 1.86, 1.1), W(-L / 2, 1.86, 1.1), A, hi); }
    if (Q.life && (k === 0 || k === 3)) { if (gclass(oi + Math.round(nx), oj + Math.round(nz)) !== 0 || true) cafeSet(B, W, -.45 + hash(bi, bj, 65) * .2, 1.3); if (lvl >= 2 && hash(bi, bj, 66) < .6) cafeSet(B, W, .5, 1.25); }
    else if (lvl >= 2 && hash(bi, bj, 67) < .7) { const t = k === 1 ? 2 : k === 6 ? 3 : k === 5 ? 1 : 0; B.box(W, -.4, 0, .45, .66, .42, .5, WOOD, WHT, GDUV(t)); if (hash(bi, bj, 68) < .5) B.box(W, .42, 0, .4, .6, .34, .45, WOOD, WHT, GDUV((t + 1) % 4)); } }
  // street life on squares and pavements
  if (Q.life) { const i0 = cx * CH, j0 = cz * CH; for (let j = j0; j < j0 + CH; j++) for (let i = i0; i < i0 + CH; i++) { const c0 = gclass(i, j); if (c0 !== 4 && c0 !== 9) continue; const x = i * T + T / 2, z = j * T + T / 2;
      const sa = hooks.stallAt ? hooks.stallAt(i, j) : null; if (sa != null) { const r = Math.abs(Math.sin(sa)) > .5; /* market stalls only where zoning.js puts a market */ stall(B, B.frame(x, z, r ? 1 : 0, r ? 0 : 1), Math.floor(hash(i, j, 73) * 8)); continue; }
      if (c0 === 4 && hash(i, j, 74) < .006) { const rd = N4.findIndex(([a, b]) => ROADC(gclass(i + a, j + b))); if (rd >= 0) { const [a, b] = N4[rd]; flowerCart(B, B.frame(x, z, b, -a)); } } } }
  return B; }
// v12: puddle decals removed — rain now wets every road / pavement / roof surface globally (see WETU)
const POSTC = cv(1024, 256, g => { const P = [['#c8302a', '#f4e8c8', 'OPÉRA', 'FAUST'], ['#f0d040', '#2a1a10', 'CIRQUE', "D'HIVER"], ['#1a2a5a', '#f4e8c8', 'FOLIES', 'BERGÈRE'], ['#e8e0d0', '#7a2a1a', 'CHOCOLAT', 'MENIER'], ['#2a5a3a', '#f4e060', 'CHÂTELET', 'Le Tour du Monde'], ['#a03a6a', '#fff', 'BAL', 'MABILLE'], ['#d86a2a', '#1a1a1a', 'ABSINTHE', 'PERNOD'], ['#3a3a6a', '#f4e8c8', 'EXPOSITION', '1880']];
  g.fillStyle = '#c8b890'; g.fillRect(0, 0, 1024, 256); P.forEach(([bg, fg, a, b], k) => { const x = k * 128; g.fillStyle = bg; g.fillRect(x + 4, 10, 120, 236); g.fillStyle = fg; g.textAlign = 'center'; g.font = 'bold 22px Georgia, serif'; g.fillText(a, x + 64, 60, 112); g.font = 'italic 16px Georgia, serif'; g.fillText(b, x + 64, 90, 112); g.fillStyle = fg; g.globalAlpha = .55; g.beginPath(); g.arc(x + 64, 160, 34, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,.12)'; for (let n = 0; n < 6; n++) g.fillRect(x + 4, 10 + Math.random() * 230, 120, 2); }); });
const POSTERM = stdM({ map: tex(POSTC, false), roughness: .9 });
CANOPYM.onBeforeCompile = sh => { sh.uniforms.uRes = CUTU.uRes; sh.uniforms.uT = WU.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  { vec3 ip = vec3(0.);
  #ifdef USE_INSTANCING
  ip = instanceMatrix[3].xyz;
  #endif
  float sw = max(0., position.y - 2.3); float ph = uT * 1.25 + ip.x * .19 + ip.z * .13; transformed.x += (sin(ph) * .055 + sin(uT * 3.3 + position.y * 2.1 + ip.z) * .018) * sw; transformed.z += (cos(ph * .83) * .04 + sin(uT * 2.7 + position.x * 2.) * .015) * sw; }`); sh.fragmentShader = 'uniform vec2 uRes;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  { vec2 q = (gl_FragCoord.xy - uRes * .5) / uRes.y; float r = length(q * vec2(1., 1.25)); }`); };
// organic tree canopies: indexed spheres with smooth low-frequency lumps (smooth normals, no facets)
function lumpy(list, tint) { const P = [], I = [], C = []; let base = 0;
  for (const [r, x, y, z, sy] of list) { const g = new THREE.SphereGeometry(r, 18, 12), p = g.attributes.position; for (let k = 0; k < p.count; k++) { let X = p.getX(k), Y = p.getY(k), Z = p.getZ(k); const l = Math.hypot(X, Y, Z) || 1, nx = X / l, ny = Y / l, nz = Z / l;
      const n = 1 + .13 * Math.sin(nx * 5.1 + ny * 3.3 + x) * Math.cos(nz * 4.7 - ny * 2.1 + z) + .07 * Math.sin(nx * 11 + nz * 9 + y * 3); X *= n; Y *= n * sy; Z *= n; P.push(X + x, Y + y, Z + z); C.push(...tint(Y + y, nx, ny, nz, n)); }
    for (const q of g.index.array) I.push(q + base); base += p.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals(); return g; }
function gbGeo(f) { const b = new GB(); f(b); return b.geo(); }
// ================= TREES v12: species, branch skeletons, painterly alpha-cut foliage cards =================
// platane (plane, mottled bark), marronnier (horse chestnut, white candles in spring), tilleul (lime), peuplier (poplar, quays)
const LEAFT = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const SP = [[[52, 84, 40], [88, 118, 56], [128, 150, 74]], [[34, 64, 34], [58, 92, 46], [92, 124, 60]], [[70, 98, 42], [108, 134, 60], [150, 168, 86]], [[44, 78, 44], [72, 106, 56], [112, 140, 72]]];
  SP.forEach((pal, q) => { const ox = (q % 2) * 256, oy = (q >> 1) * 256; g.save(); g.beginPath(); g.rect(ox, oy, 256, 256); g.clip();
    for (let k = 0; k < 900; k++) { const a = r() * 6.283, d = Math.pow(r(), .7) * 112, x = ox + 128 + Math.cos(a) * d * (q === 3 ? .55 : 1), y = oy + 128 + Math.sin(a) * d, sh = 1 - d / 140; const c0 = pal[Math.min(2, Math.floor(r() * 2 + sh * 1.4))];
      g.fillStyle = `rgb(${c0[0] + (r() * 16 | 0)},${c0[1] + (r() * 16 | 0)},${c0[2] + (r() * 12 | 0)})`; g.save(); g.translate(x, y); g.rotate(r() * 6.3); g.beginPath(); g.ellipse(0, 0, 5 + r() * 6, 2.5 + r() * 3, 0, 0, 7); g.fill(); g.restore(); }
    if (q === 1) for (let k = 0; k < 26; k++) { const a = r() * 6.283, d = r() * 95, x = ox + 128 + Math.cos(a) * d, y = oy + 128 + Math.sin(a) * d; g.fillStyle = 'rgba(246,240,226,.95)'; g.beginPath(); g.ellipse(x, y, 3.2, 7, r() * 6, 0, 7); g.fill(); g.fillStyle = 'rgba(232,170,170,.8)'; g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill(); }
    g.restore(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
export const LEAFM = stdM({ map: LEAFT, alphaTest: .5, side: THREE.DoubleSide, vertexColors: true, roughness: .85 });
LEAFM.onBeforeCompile = CANOPYM.onBeforeCompile; // wind sway (height-weighted, per-instance phase)
function treeGeo(sp, seed) { let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const S = [{ h: 3.1, R: 2.5, cy: 4.5, sy: .78, n: 46, card: 1.9, tr: .2, bark: [.34, .32, .25], br: 6 }, { h: 2.7, R: 2.3, cy: 4.2, sy: .9, n: 50, card: 1.8, tr: .22, bark: [.26, .2, .16], br: 6 },
    { h: 2.9, R: 2.0, cy: 4.4, sy: 1.05, n: 40, card: 1.7, tr: .18, bark: [.3, .26, .22], br: 5 }, { h: 3.0, R: 1.1, cy: 6.0, sy: 2.6, n: 40, card: 1.4, tr: .16, bark: [.36, .34, .3], br: 7 }][sp];
  const b = new GB(); const bark = (x, y, z) => { const n = Math.sin(x * 9.1 + y * 3.7) * Math.cos(z * 8.3 - y * 2.9) + .5 * Math.sin(y * 13 + x * 5); const m = sp === 0 && n > .35 ? 1.4 : 1 + n * .08; return '#' + S.bark.map(v => Math.round(Math.min(1, v * m) * 255).toString(16).padStart(2, '0')).join(''); };
  // trunk (slightly leaning) and a crown of primary + secondary branches; tips poke out of the foliage at the edges
  const lean = (r() - .5) * .12; b.add(new THREE.CylinderGeometry(S.tr * .8, S.tr * 1.25, S.h, 9), bark(0, 1, 0), new THREE.Matrix4().compose(new THREE.Vector3(lean * S.h / 2, S.h / 2, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -lean)), new THREE.Vector3(1, 1, 1)));
  const tips = []; const top = new THREE.Vector3(lean * S.h, S.h, 0);
  const limb = (a, d, len, rad, depth) => { const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); const mid = a.clone().addScaledVector(d.clone().normalize(), len / 2), e = a.clone().addScaledVector(d.clone().normalize(), len);
    b.add(new THREE.CylinderGeometry(rad * .6, rad, len, 6), bark(mid.x, mid.y, mid.z), new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1))); tips.push(e);
    if (depth > 0) for (let k = 0; k < 2; k++) { const nd = d.clone().normalize().add(new THREE.Vector3(r() - .5, r() * .4, r() - .5).multiplyScalar(1.1)); limb(e, nd, len * .62, rad * .6, depth - 1); } };
  for (let k = 0; k < S.br; k++) { const a = k / S.br * 6.283 + r() * .6, up = sp === 3 ? 3.2 : 1 + r() * .5; limb(top.clone().setY(S.h - r() * .5), new THREE.Vector3(Math.cos(a), up, Math.sin(a)), S.R * (sp === 3 ? .55 : .75), S.tr * .55, 1); }
  const wood = b.geo();
  // foliage cards: layered shells around branch tips, mostly facing up so the crown reads from above; vertex colour = self-shadow
  const P = [], N = [], U = [], C = [], Iq = []; const uo = [(sp % 2) * .5, (sp >> 1) * .5]; let vi = 0;
  for (let k = 0, nC = Math.round(S.n * .62); k < nC; k++) { const t = tips[Math.floor(r() * tips.length)], layer = r(); const c = new THREE.Vector3(t.x * 1.05 + (r() - .5) * .9, Math.max(S.h, t.y + (r() - .35) * .9 * S.sy), t.z * 1.05 + (r() - .5) * .9);
    const rel = c.clone().sub(new THREE.Vector3(0, S.cy, 0)); const nrm = rel.clone().multiply(new THREE.Vector3(1, 1 / S.sy, 1)).normalize(); const up = new THREE.Vector3(0, 1, 0).lerp(nrm, .45 + layer * .25).normalize();
    const tx = new THREE.Vector3().crossVectors(up, Math.abs(up.y) > .95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize().applyAxisAngle(up, r() * 6.283), ty = new THREE.Vector3().crossVectors(up, tx);
    const z = S.card * 1.18 * (.75 + r() * .5); const sh = Math.max(.38, Math.min(1.15, .55 + nrm.y * .35 + (c.y - S.h) / (S.cy * 2.2) * .4 + r() * .1));
    for (const [a, bb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = c.clone().addScaledVector(tx, a * z / 2).addScaledVector(ty, bb * z / 2 * (sp === 3 ? 1.5 : 1)); P.push(p.x, p.y, p.z); N.push(nrm.x * .6 + up.x * .4, nrm.y * .6 + up.y * .4, nrm.z * .6 + up.z * .4); U.push(uo[0] + (a + 1) * .25, uo[1] + (bb + 1) * .25); C.push(sh, sh, sh); }
    Iq.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4; }
  const fol = new THREE.BufferGeometry(); fol.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fol.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); fol.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); fol.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); fol.setIndex(Iq);
  return { wood, fol }; }
// two shape variants per species so rows of trees are not clones
const TREES = [0, 1, 2, 3].map(sp => [treeGeo(sp, 101 + sp * 37), treeGeo(sp, 977 + sp * 53)]);
function treeSpecies(p) { const ri = Math.floor(p.x / T), rj = Math.floor(p.z / T); let water = false; for (let a = -3; a <= 3 && !water; a++) for (let c = -3; c <= 3; c++) if (kij(ri + a, rj + c) === K.WATER) { water = true; break; }
  const h = hash(p.x | 0, p.z | 0, 9); if (water) return h < .55 ? 3 : 2; if (kAt(p.x, p.z) === K.PARK) return h < .4 ? 1 : h < .6 ? 2 : 0; return h < .2 ? 1 : 0; }
const GRN = '#1f3a2c', IRON = '#26302c';
const PG = {
  lamp: gbGeo(b => { b.cyl(.15, .2, .4, 0, .2, 0, GRN, 14).cyl(.06, .085, 2.3, 0, 1.5, 0, GRN, 12).cyl(.1, .1, .1, 0, 1.2, 0, '#8a7a40', 12).cyl(.025, .025, .5, 0, 2.2, 0, GRN, 8, 0, 0, Math.PI / 2).cyl(.02, .2, .22, 0, 2.86, 0, GRN, 12).cyl(.2, .2, .04, 0, 2.34, 0, GRN, 14).sph(.04, 0, 2.99, 0, GRN); }),
  arc: gbGeo(b => b.cyl(.2, .27, .5, 0, .25, 0, IRON, 14).cyl(.07, .1, 3.3, 0, 2.1, 0, IRON, 12).cyl(.03, .03, 1.2, 0, 3.5, 0, IRON, 8, 0, 0, Math.PI / 2).cyl(.12, .04, .2, 0, 3.9, 0, IRON, 10)),
  lant: new THREE.CylinderGeometry(.19, .13, .42, 12).translate(0, 2.55, 0), globe: new THREE.SphereGeometry(.34, 16, 12).translate(0, 3.62, 0),
  trunk: gbGeo(b => b.cyl(.14, .22, 2.6, 0, 1.3, 0, '#4a3a2a', 6).cyl(.06, .08, 1, .3, 2.4, 0, '#4a3a2a', 5, 0, 0, -.7).cyl(.04, .07, .5, 0, .05, 0, '#2a2a2a', 6)),
  poster: new THREE.CylinderGeometry(.535, .535, 1.62, 16, 1, true).translate(0, 1.27, 0),
  trunk2: gbGeo(b => b.cyl(.16, .26, 2.9, 0, 1.45, 0, '#3a2c22', 7).cyl(.07, .1, 1.2, -.35, 2.7, .1, '#3a2c22', 5, .4, 0, .6).cyl(.06, .09, 1.1, .3, 2.8, -.2, '#3a2c22', 5, -.3, 0, -.6).cyl(.05, .08, .5, 0, .05, 0, '#2a2a2a', 6)),
  canopy2: lumpy([[1.7, 0, 4.3, 0, 1.2], [1.1, .9, 3.6, .5, 1], [1.1, -.8, 3.7, -.6, 1], [.9, .2, 5.6, -.3, 1]], (y, nx, ny, nz, n) => { const h = Math.abs(Math.sin(nx * 40 + nz * 37 + y * 13)); const v = .5 + (y - 2.6) * .14; return h > .985 && ny > -.2 ? [1.6, 1.5, 1.35] : [v * .8 * n, v * .95 * n, v * .62 * n]; }),
  canopy: lumpy([[1.5, 0, 3.7, 0, .8], [1.15, 1.1, 3.4, .4, .75], [1.2, -1, 3.5, -.3, .8], [1.05, .2, 4.2, -1, .7], [1, -.2, 3.9, 1.05, .75], [.9, .3, 4.5, .2, .7]], (y, nx, ny, nz, n) => { const v = (.5 + (y - 2.2) * .17) * (.8 + (n - .85) * 1.1); return [v * .95, v, v * .66]; }),
  morris: gbGeo(b => { b.cyl(.55, .6, .3, 0, .15, 0, GRN, 12).cyl(.52, .52, 2, 0, 1.3, 0, '#c8b890', 12); b.cyl(.6, .62, .15, 0, 2.35, 0, GRN, 12).sph(.42, 0, 2.5, 0, GRN, 1, .7, 1, 8).sph(.1, 0, 2.9, 0, GRN); }),
  wallace: gbGeo(b => { b.cyl(.35, .45, .5, 0, .25, 0, GRN, 8); for (let k = 0; k < 4; k++) b.cyl(.06, .08, 1.1, Math.cos(k * 1.57) * .2, 1.05, Math.sin(k * 1.57) * .2, GRN, 5); b.sph(.36, 0, 1.7, 0, GRN, 1, .6, 1, 8).cyl(.05, .05, .3, 0, 1.95, 0, GRN); }),
  trough: gbGeo(b => { b.add(new THREE.CapsuleGeometry(.36, 1.0, 4, 14), '#9a9488', (() => { const m = new THREE.Matrix4().makeRotationZ(Math.PI / 2); m.premultiply(new THREE.Matrix4().makeScale(1, .75, 1)); m.setPosition(0, .3, 0); return m; })()); b.add(new THREE.CapsuleGeometry(.28, .9, 4, 14), '#3a5a64', (() => { const m = new THREE.Matrix4().makeRotationZ(Math.PI / 2); m.premultiply(new THREE.Matrix4().makeScale(1, .1, 1)); m.setPosition(0, .56, 0); return m; })()); b.cyl(.1, .12, 1, -.9, .5, 0, IRON, 10).sph(.12, -.9, 1.02, 0, IRON); }),
  pissoir: gbGeo(b => { b.add(new THREE.CylinderGeometry(.82, .82, 1.6, 20, 1, true, .6, 5.4), GRN, new THREE.Matrix4().makeTranslation(0, .95, 0)); b.cyl(.15, .15, 2.2, 0, 1.1, 0, GRN, 10).cyl(.4, .98, .3, 0, 2.3, 0, GRN, 18).sph(.2, 0, 2.5, 0, GRN, 1, .6, 1, 8); }),
  bench: gbGeo(b => { for (let k = 0; k < 4; k++) b.cyl(.045, .045, 1.4, 0, .45, -.14 + k * .095, '#7a5434', 8, 0, 0, Math.PI / 2); for (let k = 0; k < 3; k++) b.cyl(.04, .04, 1.4, 0, .6 + k * .1, -.24, '#7a5434', 8, 0, 0, Math.PI / 2); for (const x of [-.6, .6]) { b.cyl(.035, .035, .5, x, .22, .1, IRON, 8); b.cyl(.035, .035, .8, x, .4, -.18, IRON, 8, -.15); b.add(new THREE.TorusGeometry(.18, .03, 6, 12, Math.PI), IRON, (() => { const m = new THREE.Matrix4().makeRotationY(Math.PI / 2); m.setPosition(x, .45, 0); return m; })()); } }),
  // v14 omnibus stop (Compagnie Générale des Omnibus): green cast-iron post, oval enamel lettered plate, lantern, and a slatted bench for waiting passengers
  omnibus: gbGeo(b => { b.cyl(.13, .17, .3, 0, .15, 0, GRN, 10).cyl(.05, .065, 2.7, 0, 1.6, 0, GRN, 10); b.cyl(.36, .36, .05, 0, 2.75, 0, '#f2ead6', 20, Math.PI / 2, 0, 0).cyl(.29, .29, .06, 0, 2.75, 0, '#1e3a8a', 20, Math.PI / 2, 0, 0).box(.5, .07, .07, 0, 2.75, 0, '#f2ead6');
    b.cyl(.1, .07, .22, 0, 3.15, 0, '#d8b860', 8).sph(.07, 0, 3.3, 0, GRN); b.box(.06, .12, .5, 0, 2.3, 0, '#7a2a1a');
    for (let k = 0; k < 3; k++) b.box(1.5, .04, .1, 0, .46, .75 + k * .12, '#7a5434'); for (let k = 0; k < 2; k++) b.box(1.5, .1, .03, 0, .62 + k * .15, 1.0, '#7a5434'); for (const x of [-.65, .65]) b.box(.05, .48, .4, x, .24, .87, IRON); }),
  kiosk: gbGeo(b => { b.cyl(.9, .95, 2, 0, 1, 0, GRN, 18); for (let k = 0; k < 6; k++) b.add(new THREE.CylinderGeometry(.92, .92, .9, 6, 1, true, k * 1.047 + .12, .82), ['#d8c890', '#b83a2a', '#e8e0d0'][k % 3], new THREE.Matrix4().makeTranslation(0, 1.2, 0)); b.cyl(.25, 1.18, .5, 0, 2.25, 0, GRN, 18).sph(.3, 0, 2.5, 0, GRN, 1, .8, 1, 10).sph(.12, 0, 2.8, 0, '#c8a040'); }),
  chimney: gbGeo(b => { b.box(.42, 1.0, 1.25, 0, .5, 0, '#a07a62'); b.box(.48, .08, 1.31, 0, .98, 0, '#8a6a58'); b.box(.44, .05, 1.27, 0, .7, 0, '#8a6452'); for (const z of [-.45, -.15, .15, .45]) b.cyl(.075, .085, .26, 0, 1.15, z, '#b8603a', 8).cyl(.088, .088, .035, 0, 1.28, z, '#8a4028', 8); }), // v13: crisp brick stack (souche) with a row of terracotta pots
  dome: gbGeo(b => { const P = []; for (let k = 0; k <= 10; k++) { const a = k / 10 * Math.PI / 2; P.push(new THREE.Vector2(Math.max(.001, Math.cos(a) * 2.1), Math.sin(a) * 2.6)); } const g = new THREE.LatheGeometry(P, 22); b.cyl(2.25, 2.3, .35, 0, .15, 0, '#d8ccb4', 22); b.add(g, '#55636e', new THREE.Matrix4().makeTranslation(0, .3, 0)); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; b.add(new THREE.CylinderGeometry(.06, .06, 2.4, 6), '#c8b070', (() => { const m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), .62); m.setPosition(Math.cos(a) * 1.25, 1.55, Math.sin(a) * 1.25); return m; })()); b.sph(.3, Math.cos(a) * 1.9, 1.05, Math.sin(a) * 1.9, '#5a6670', .9, 1.2, .9, 8); } b.cyl(.35, .45, .6, 0, 3.0, 0, '#d8ccb4', 14).sph(.38, 0, 3.4, 0, '#55636e', 1, .9, 1, 10).cyl(.03, .05, .7, 0, 3.9, 0, '#c8a040', 6).sph(.07, 0, 4.25, 0, '#d4b040'); }),
  skylight: gbGeo(b => { b.box(1.5, .14, 1.0, 0, .07, 0, '#3a3c40'); b.box(1.36, .1, .86, 0, .17, 0, '#8fa4b0'); for (const x of [-.34, 0, .34]) b.box(.04, .06, .9, x, .24, 0, '#2a2c30'); }),
  wtower: gbGeo(b => { for (const [x, z] of [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]]) b.cyl(.06, .06, 2.4, x, 1.2, z, '#3a3430', 5); b.cyl(1.15, 1.15, 1.8, 0, 3.2, 0, '#6a5a4c', 14).cyl(1.2, 1.2, .12, 0, 2.3, 0, '#2a2420', 14).cyl(1.2, .2, .5, 0, 4.35, 0, '#4a4a4c', 14); }),
  // tiered Wallace-era fountain read from above: dark stone rims, three basins stepping up, sculpted centre group (water and spray are separate meshes)
  fountain: gbGeo(b => { b.cyl(2.25, 2.35, .5, 0, .25, 0, '#a59b88', 28).cyl(2.25, 2.25, .1, 0, .55, 0, '#5a544a', 28).cyl(1.98, 1.98, .02, 0, .48, 0, '#26343a', 28)
      .cyl(.42, .55, 1.3, 0, .9, 0, '#b4aa94', 12).cyl(1.25, .5, .35, 0, 1.6, 0, '#a59b88', 20).cyl(1.28, 1.28, .07, 0, 1.79, 0, '#4a463e', 20)
      .cyl(.2, .26, .7, 0, 2.1, 0, '#b4aa94', 10).cyl(.62, .22, .22, 0, 2.5, 0, '#a59b88', 16).cyl(.64, .64, .05, 0, 2.62, 0, '#4a463e', 16);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; b.sph(.2, Math.cos(a) * .35, 1.25, Math.sin(a) * .35, '#5a6448', 1, 1.6, 1, 6).sph(.12, Math.cos(a) * .35, 1.62, Math.sin(a) * .35, '#5a6448', 1, 1, 1, 6); }
    b.sph(.16, 0, 2.95, 0, '#5a6a4a', 1, 1.5, 1, 8).sph(.09, 0, 3.25, 0, '#6a7a58', 1, 1, 1, 6);
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; b.box(.07, .5, .07, Math.cos(a) * 3.05, .25, Math.sin(a) * 3.05, '#1e2224'); } }),
  fountainW: gbGeo(b => { b.cyl(1.98, 1.98, .02, 0, .62, 0, '#ffffff', 28).cyl(1.2, 1.2, .02, 0, 1.84, 0, '#ffffff', 20).cyl(.58, .58, .02, 0, 2.665, 0, '#ffffff', 16); }),
  fountainS: gbGeo(b => { b.cyl(.04, .34, .7, 0, 3.0, 0, '#ffffff', 10); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; b.cyl(.03, .1, .55, Math.cos(a) * .95, 2.0, Math.sin(a) * .95, '#ffffff', 6, Math.sin(a) * .5, 0, -Math.cos(a) * .5); } b.cyl(1.0, .5, .25, 0, 1.92, 0, '#ffffff', 20); }),
  spireSq: gbGeo(b => { b.box(2.6, 7, 2.6, 0, 3.5, 0, '#b8ab94').box(2.75, .3, 2.75, 0, 7.1, 0, '#8a8070'); for (const r of [0, Math.PI / 2]) b.box(2.66, 1.5, .5, 0, 5.6, 0, '#2a2622', 0, r); b.cyl(.01, 1.9, 6.5, 0, 10.5, 0, '#4a5058', 4, 0, Math.PI / 4).box(.1, 1, .1, 0, 14.1, 0, '#d0a840').box(.1, .1, .55, 0, 14.3, 0, '#d0a840'); }),
  spireTwin: gbGeo(b => { for (const z of [-2.2, 2.2]) { b.box(2.3, 9, 2.3, 0, 4.5, z, '#c4b8a0').box(2.42, 1.6, 2.42, 0, 7.4, z, '#36302a').box(2.5, .35, 2.5, 0, 9.1, z, '#9a8e7a'); for (const [x, y] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) b.box(.3, .5, .3, x, 9.5, z + y, '#9a8e7a'); b.cyl(.01, 1.4, 7.5, 0, 13.1, z, '#56606a', 8).box(.08, .7, .08, 0, 17.1, z, '#d0a840'); } b.box(2.1, 6, 2.2, 0, 3, 0, '#b8ab94').cyl(.9, .9, .2, 0, 6.1, 0, '#3a3430', 16); }),
  spireDome: gbGeo(b => { b.cyl(2.2, 2.4, 3, 0, 1.5, 0, '#bcae98', 16).sph(2.25, 0, 3.4, 0, '#5a6470', 1, .8, 1, 14).cyl(.45, .55, 1.4, 0, 5.4, 0, '#bcae98', 8).sph(.45, 0, 6.2, 0, '#5a6470', 1, 1, 1, 8).box(.08, .8, .08, 0, 6.9, 0, '#d0a840'); }),
  stack: gbGeo(b => b.cyl(.55, .85, 11, 0, 5.5, 0, '#8a4a34', 10).cyl(.62, .62, .5, 0, 10.8, 0, '#2a2420', 10).cyl(.9, .9, .3, 0, 3, 0, '#6a3a2a', 10)),
};
const POOLTEX = tex(cv(64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }), false);
const POOLM = new THREE.MeshBasicMaterial({ map: POOLTEX, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2 });
export const SPILLM = new THREE.MeshBasicMaterial({ map: POOLTEX, color: 0xffb060, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2 });
const STREAKTEX = tex(cv(32, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.18, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 128); g.globalCompositeOperation = 'destination-in'; const h = g.createLinearGradient(0, 0, 32, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = h; g.fillRect(0, 0, 32, 128); }), false);
export const REFLM = new THREE.MeshBasicMaterial({ map: STREAKTEX, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -3 });
const POOLG = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, .04, 0);
const _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _v4 = new THREE.Vector3(), _s4 = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _c4 = new THREE.Color();
function inst(geo, mat, list, f, shadow = true) { if (!list.length) return null; const m = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((p, k) => { f(p, k, m); m.setMatrixAt(k, _m4); }); m.castShadow = shadow; m.receiveShadow = true; m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); return m; }
const place = (x, y, z, ry, s) => _m4.compose(_v4.set(x, y, z), _q4.setFromAxisAngle(_up, ry), _s4.set(s, s, s));
// ================= CHUNKS =================
const PXT = 32, CPX = CH * PXT; // px per tile, chunk canvas size
const PATS = {}; let patCtx = null;
function pat(g, name) { const c = name === 'water' ? null : GP[name] || GP.under; if (!c) return null; const p = g.createPattern(c, 'repeat'); p.setTransform(new DOMMatrix().scale(PXT * 2 / 128)); return p; }
const CHUNKS = new Map(); export const chunkGroup = new THREE.Group(); scene.add(chunkGroup);
const isBldT = (i, j) => inb(i, j) && kind[ti(i, j)] === K.BLD && (skipT[ti(i, j)] || bldH(i, j) > 0);
// ---- building footprint field: blocks fill the land between the vector streets, contoured by marching squares (1-unit samples) ----
const BF = new Map(), FM = 3, FPU = 4;
// engine collision hook: signed building field at (x,z) from the same field the visible block meshes are contoured from
// (>0 inside a building). Returns null when that chunk's field is not built yet (callers fall back to the tile grid).
export function bldAt(x, z) { const cx = Math.floor(x / CHU), cz = Math.floor(z / CHU), o = BF.get(cx * 1000 + cz); if (!o) return null; const fu = x - o.X0, fv = z - o.Z0, u = Math.floor(fu), v = Math.floor(fv); if (u < 0 || v < 0 || u >= o.N - 1 || v >= o.N - 1) return null;
  const a = fu - u, b = fv - v, F = o.F, N = o.N; return (F[v * N + u] * (1 - a) + F[v * N + u + 1] * a) * (1 - b) + (F[(v + 1) * N + u] * (1 - a) + F[(v + 1) * N + u + 1] * a) * b; }
// parish churches that are not full landmarks: [x, z, model, rotation, scale] (positions fitted from lat/lon to the map's landmark frame)
const SPIRES = [[1406, 1614, 'spireTwin', 0, 1.15], [2364, 706, 'spireTwin', Math.PI / 2, 1], [2481, 1766, 'spireSq', 0, 1.1], [2295, 2156, 'spireSq', .3, 1], [1838, 1333, 'spireDome', 0, 1], [2079, 1580, 'spireSq', 0, .95],
  [2365, 1595, 'spireSq', .2, .9], [2088, 364, 'spireSq', 0, .8], [2480, 1407, 'spireSq', 0, .9], [2213, 1909, 'spireSq', 0, .9]];
const Hb = (i, j) => (inb(i, j) && kind[ti(i, j)] === K.BLD && !skipT[ti(i, j)]) ? bldH(i, j) : 0;
function bldField(cx, cz) { const key = cx * 1000 + cz; if (BF.has(key)) return BF.get(key);
  const ox = cx * CHU, oz = cz * CHU, X0 = ox - FM, Z0 = oz - FM, N = CHU + 2 * FM + 1, bx = X0 - 1, bz = Z0 - 1, CW = (N + 2) * FPU;
  const c = document.createElement('canvas'); c.width = c.height = CW; const g = c.getContext('2d', { willReadFrequently: true }); g.setTransform(FPU, 0, 0, FPU, -bx * FPU, -bz * FPU); g.lineCap = g.lineJoin = 'round';
  const ia = Math.floor(bx / T) - 2, ib = Math.ceil((bx + N + 2) / T) + 2, ja = Math.floor(bz / T) - 2, jb = Math.ceil((bz + N + 2) / T) + 2;
  g.fillStyle = '#fff'; for (let j = ja; j <= jb; j++) for (let i = ia; i <= ib; i++) if (Hb(i, j) > 0) g.fillRect(i * T - .8, j * T - .8, T + 1.6, T + 1.6);
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = g.strokeStyle = '#000';
  for (let j = ja; j <= jb; j++) for (let i = ia; i <= ib; i++) { if (!inb(i, j)) continue; const t = ti(i, j), k = kind[t]; if ((k === K.BLD && (skipT[t] || bldH(i, j) === 0)) || k === K.WATER) g.fillRect(i * T - .15, j * T - .15, T + .3, T + .3); }
  const x1 = X0 + N + 8, z1 = Z0 + N + 8, x0 = X0 - 8, z0 = Z0 - 8;
  for (const o of near(VRAIL, x0, z0, x1, z1)) { g.lineWidth = 3 * T; g.beginPath(); linePath(g, o.p); g.stroke(); }
  for (const r of near(VROADS, x0, z0, x1, z1)) { if (r.c === -2) continue; g.lineWidth = r.c === -1 ? 2 * T : r.pw; g.beginPath(); linePath(g, r.p); g.stroke(); }
  if (ETOILE) { g.beginPath(); g.arc(ETOILE.x, ETOILE.z, ETOILE.ro, 0, 7); g.fill(); }
  // keep street furniture clear of the smoothed frontages
  const FPROPS = []; { const PR = { omnibus: 1.2, tree: 1.5, kiosk: 1.9, morris: 1.5, pissoir: 1.8, wallace: 1.3, trough: 1.6, bench: 1.5, lamp: .7, fountain: 2.6 }; for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { if (a < 0 || b < 0 || a * CHU >= WX || b * CHU >= WZ) continue; for (const p of ensureChunk(a, b)) { const r = PR[p.type]; if (!r || p.x < x0 || p.z < z0 || p.x > x1 || p.z > z1) continue; g.beginPath(); g.arc(p.x, p.z, r, 0, 7); g.fill(); FPROPS.push([p.x, p.z, r * .75]); } } }
  const c2 = document.createElement('canvas'); c2.width = c2.height = CW; const g2 = c2.getContext('2d', { willReadFrequently: true }); g2.filter = 'blur(4.5px)'; g2.drawImage(c, 0, 0); const D = g2.getImageData(0, 0, CW, CW).data;
  const F = new Float32Array(N * N); let fin = 0; for (let v = 0; v < N; v++) for (let u = 0; u < N; u++) { const f = D[(((v + 1) * FPU) * CW + (u + 1) * FPU) * 4 + 3] / 255 - .5; F[v * N + u] = f; if (f > 0) fin++; }
  // root cause of the "missing boulevard building": the mask canvas was a GPU-backed 2D canvas; under GPU memory pressure Chrome evicts
  // such canvases and the read-back comes back empty, so a whole chunk got a zero field and no buildings (ground was drawn from a different canvas).
  // Masks are now CPU canvases (willReadFrequently), and a chunk with building tiles but an empty field is rebuilt from tiles and never cached.
  let bt = 0; for (let j = Math.floor(oz / T); j < Math.floor((oz + CHU) / T); j++) for (let i = Math.floor(ox / T); i < Math.floor((ox + CHU) / T); i++) if (Hb(i, j) > 0) bt++;
  if (bt > 2 && fin < bt) { stats.fieldRetry = (stats.fieldRetry || 0) + 1; BF.delete(key); if (!bldField.retry) { bldField.retry = 1; try { return bldField(cx, cz); } finally { bldField.retry = 0; } }
    for (let v = 0; v < N; v++) for (let u = 0; u < N; u++) F[v * N + u] = Hb(Math.floor((X0 + u) / T), Math.floor((Z0 + v) / T)) > 0 ? .5 : -.5; }
  // hard clearance after the blur: no sample within a prop's radius may be inside a building
  for (const p of FPROPS) { const u0 = Math.floor(p[0] - p[2] - X0), u1 = Math.ceil(p[0] + p[2] - X0), v0 = Math.floor(p[1] - p[2] - Z0), v1 = Math.ceil(p[1] + p[2] - Z0);
    for (let v = Math.max(0, v0); v <= Math.min(N - 1, v1); v++) for (let u = Math.max(0, u0); u <= Math.min(N - 1, u1); u++) { const d = Math.hypot(X0 + u - p[0], Z0 + v - p[1]); if (d < p[2] + .6) F[v * N + u] = Math.min(F[v * N + u], -.25); } }
  // inward distance (chamfer) for the mansard slope
  // drop slivers: tiny disconnected islands left by the blur / prop clearance read as odd broken pieces of a block
  { const seen = new Uint8Array(N * N); for (let q = 0; q < N * N; q++) if (F[q] > 0 && !seen[q]) { const comp = [q], st = [q]; seen[q] = 1; while (st.length) { const z = st.pop(); const u = z % N, v = (z / N) | 0; for (const w of [u + 1 < N ? z + 1 : -1, u > 0 ? z - 1 : -1, v + 1 < N ? z + N : -1, v > 0 ? z - N : -1]) if (w >= 0 && !seen[w] && F[w] > 0) { seen[w] = 1; st.push(w); comp.push(w); } }
    const edge = comp.some(z => { const u = z % N, v = (z / N) | 0; return u === 0 || v === 0 || u === N - 1 || v === N - 1; }); if (comp.length < 8 && !edge) for (const z of comp) F[z] = -.2; } }
  const DI = new Float32Array(N * N).fill(1e3); for (let v = 0; v < N; v++) for (let u = 0; u < N; u++) { const a = F[v * N + u]; if (a <= 0) { DI[v * N + u] = 0; continue; } for (const [du, dv] of N4) { const uu = u + du, vv = v + dv; if (uu < 0 || vv < 0 || uu >= N || vv >= N) continue; const b = F[vv * N + uu]; if (b <= 0) DI[v * N + u] = Math.min(DI[v * N + u], a / (a - b)); } }
  for (let pass = 0; pass < 2; pass++) for (let q = 0; q < N * N; q++) { const k = pass ? N * N - 1 - q : q, u = k % N, v = (k / N) | 0, s = pass ? 1 : -1; for (const [du, dv, w] of [[s, 0, 1], [0, s, 1], [s, s, 1.414], [-s, s, 1.414]]) { const uu = u + du, vv = v + dv; if (uu < 0 || vv < 0 || uu >= N || vv >= N) continue; DI[k] = Math.min(DI[k], DI[vv * N + uu] + w); } }
  // marching squares → cell polygons (CW on screen) + contour segments (outward normal = (dz,-dx))
  const cells = new Array((N - 1) * (N - 1)), segs = [];
  for (let v = 0; v < N - 1; v++) for (let u = 0; u < N - 1; u++) { const id = [v * N + u, v * N + u + 1, (v + 1) * N + u + 1, (v + 1) * N + u], a = id.map(k => F[k]), ins = a.map(q => q > 0), n = ins.filter(Boolean).length; if (!n) continue;
    const C = [[u, v], [u + 1, v], [u + 1, v + 1], [u, v + 1]], EK = ['h' + u + ',' + v, 'v' + (u + 1) + ',' + v, 'h' + u + ',' + (v + 1), 'v' + u + ',' + v];
    const cr = k => { const p = C[k], q = C[(k + 1) % 4], t = a[k] / (a[k] - a[(k + 1) % 4]); return { x: X0 + p[0] + (q[0] - p[0]) * t, z: Z0 + p[1] + (q[1] - p[1]) * t, e: EK[k], k: -1 }; };
    const co = k => ({ x: X0 + C[k][0], z: Z0 + C[k][1], k: id[k] });
    let PL; if (n === 2 && ins[0] === ins[2] && (a[0] + a[1] + a[2] + a[3]) <= 0) { PL = []; for (let k = 0; k < 4; k++) if (ins[k]) PL.push([cr((k + 3) % 4), co(k), cr(k)]); }
    else { const P = []; for (let k = 0; k < 4; k++) { if (ins[k]) P.push(co(k)); if (ins[k] !== ins[(k + 1) % 4]) P.push(cr(k)); } PL = [P]; }
    cells[v * (N - 1) + u] = PL; for (const P of PL) for (let k = 0; k < P.length; k++) { const p = P[k], q = P[(k + 1) % P.length]; if (p.k < 0 && q.k < 0) segs.push([p.x, p.z, q.x, q.z, p.e, q.e, u, v]); } }
  // straighten frontages: chain the contour, simplify each chain (Douglas-Peucker) and project every crossing onto the simplified line,
  // so street fronts, backs and river frontages read as straight runs with crisp corners instead of blur wobble
  { const byStart = new Map(), hasPrev = new Set(); segs.forEach((q, k) => { byStart.set(q[4], k); hasPrev.add(q[5]); }); const seen = new Uint8Array(segs.length), MV = new Map();
    const run = k0 => { const ch = []; let k = k0; while (k != null && !seen[k]) { seen[k] = 1; ch.push(segs[k]); k = byStart.get(segs[k][5]); } return ch; };
    const chains = []; segs.forEach((q, k) => { if (!seen[k] && !hasPrev.has(q[4])) chains.push(run(k)); }); segs.forEach((q, k) => { if (!seen[k]) chains.push(run(k)); });
    const dp = (P, a, b, eps, keep) => { let m = -1, md = eps; const ax = P[a][0], az = P[a][1], dx = P[b][0] - ax, dz = P[b][1] - az, l = Math.hypot(dx, dz) || 1e-6; for (let k = a + 1; k < b; k++) { const d = Math.abs((P[k][0] - ax) * dz - (P[k][1] - az) * dx) / l; if (d > md) { md = d; m = k; } } if (m >= 0) { keep[m] = 1; dp(P, a, m, eps, keep); dp(P, m, b, eps, keep); } };
    for (const ch of chains) { const P = ch.map(q => [q[0], q[1], q[4]]); const last = ch[ch.length - 1]; P.push([last[2], last[3], last[5]]); if (P.length < 3) continue; const keep = new Uint8Array(P.length); keep[0] = keep[P.length - 1] = 1;
      // turn points sharper than ~35 degrees are always corners
      for (let k = 1; k < P.length - 1; k++) { const ax = P[k][0] - P[k - 1][0], az = P[k][1] - P[k - 1][1], bx = P[k + 1][0] - P[k][0], bz = P[k + 1][1] - P[k][1]; const c = (ax * bx + az * bz) / ((Math.hypot(ax, az) * Math.hypot(bx, bz)) || 1); if (c < .55) keep[k] = 1; }
      const K_ = []; for (let k = 0; k < P.length; k++) if (keep[k]) K_.push(k); for (let q = 0; q + 1 < K_.length; q++) dp(P, K_[q], K_[q + 1], .55, keep);
      let a = 0; for (let k = 1; k < P.length; k++) { if (!keep[k]) continue; const ax = P[a][0], az = P[a][1], dx = P[k][0] - ax, dz = P[k][1] - az, l2 = dx * dx + dz * dz || 1e-6;
        for (let m = a + 1; m < k; m++) { const t = Math.max(0, Math.min(1, ((P[m][0] - ax) * dx + (P[m][1] - az) * dz) / l2)); const nxp = ax + dx * t, nzp = az + dz * t; if (Math.hypot(nxp - P[m][0], nzp - P[m][1]) < .45) MV.set(P[m][2], [nxp, nzp]); } a = k; } }
    for (const q of segs) { const A = MV.get(q[4]), B = MV.get(q[5]); if (A) { q[0] = A[0]; q[1] = A[1]; } if (B) { q[2] = B[0]; q[3] = B[1]; } }
    for (const PL of cells) if (PL) for (const P of PL) for (const p of P) if (p.k < 0) { const m = MV.get(p.e); if (m) { p.x = m[0]; p.z = m[1]; } } }
  const o = { F, DI, N, X0, Z0, cells, segs }; BF.set(key, o); if (BF.size > 64) BF.delete(BF.keys().next().value); return o; }
const smoothMask = {};
function groundCanvas(cx, cz) { const it = groundCanvasG(cx, cz); let r; while (!(r = it.next()).done); return r.value; }
// generator form: yields between the heavy canvas passes so chunk builds can be spread across frames (engine: no main-thread hitches)
// engine perf: software (CPU) 2D canvases for chunk ground painting; avoids GPU-raster readback stalls (getImageData/drawImage ping-pong) in the per-chunk pipeline
const CTX2D = { willReadFrequently: true };
function* groundCanvasG(cx, cz) { const c = document.createElement('canvas'); c.width = c.height = CPX; const g = c.getContext('2d', CTX2D); const i0 = cx * CH, j0 = cz * CH; const P = {}; for (const n of CLSN) P[n] = pat(g, n);
  const cls = (i, j) => gclass(i, j);
  // ---- continuous vector ground: everything is drawn in world units from the OSM centre-lines/polygons, patterns anchored in world space (no tile seams) ----
  const vs = PXT / T, vx = i0 * T, vz = j0 * T, VCH = chunkVec(cx, cz); const WT = () => g.setTransform(vs, 0, 0, vs, -vx * vs, -vz * vs);
  const wp = (name, ang = 0, x0 = 0, z0 = 0) => { const p = g.createPattern(GP[name] || GP.under, 'repeat'); p.setTransform(new DOMMatrix().translate(x0, z0).rotate(ang * 57.29578).scale(4 / 128)); return p; };
  const RSF = ['mac', 'pave', 'dirt'];
  const seg = (r, w, style, rot = null) => { g.lineWidth = w; if (rot === null) { g.strokeStyle = typeof style === 'string' && GP[style] ? wp(style) : style; g.beginPath(); linePath(g, r.p); g.stroke(); return; }
    for (let k = 0; k + 3 < r.p.length; k += 2) { const ax = r.p[k], az = r.p[k + 1], bx = r.p[k + 2], bz = r.p[k + 3]; g.strokeStyle = wp(style, Math.atan2(bz - az, bx - ax) + rot, ax, az); g.beginPath(); g.moveTo(ax, az); g.lineTo(bx, bz); g.stroke(); } };
  const disc = (j, r, style) => { g.fillStyle = typeof style === 'string' && GP[style] ? wp(style) : style; g.beginPath(); g.arc(j.x, j.z, r, 0, 7); g.fill(); };
  WT(); g.lineCap = g.lineJoin = 'round'; const X0 = vx - 2, Z0 = vz - 2, SZ = CHU + 4;
  g.fillStyle = wp('yard'); g.fillRect(X0, Z0, SZ, SZ); yield;
  // smooth area layers from the gameplay grid itself (bilinear-upsampled + blurred tile masks, thresholded): plazas, parvis, parks, water — no stair-steps, and exactly where gameplay thinks they are
  const SMR = CPX / 2, SMM = 6, SMN = CH + 2 * SMM; const SMC = smoothMask.c || (smoothMask.c = [document.createElement('canvas'), document.createElement('canvas'), document.createElement('canvas')]);
  const smooth = (test, bl = 5) => { const [mc, tc] = SMC; mc.width = mc.height = SMN; const mg = mc.getContext('2d', CTX2D), id = mg.createImageData(SMN, SMN); let any = 0;
    for (let b = 0; b < SMN; b++) for (let a = 0; a < SMN; a++) { const i = i0 - SMM + a, j = j0 - SMM + b; if (inb(i, j) && test(ti(i, j), i, j)) { id.data[(b * SMN + a) * 4 + 3] = 255; any = 1; } } if (!any) return null; mg.putImageData(id, 0, 0);
    const SQ = SMR / 4, qc = SMC[3] || (SMC[3] = document.createElement('canvas')); qc.width = qc.height = SQ; const qg = qc.getContext('2d', CTX2D); qg.imageSmoothingEnabled = true; qg.filter = `blur(${bl / 4}px)`; const sq = SQ / CH; qg.drawImage(mc, -SMM * sq, -SMM * sq, SMN * sq, SMN * sq); qg.filter = 'none';
    tc.width = tc.height = SMR; const tg = tc.getContext('2d', { willReadFrequently: true }); tg.imageSmoothingEnabled = true; tg.drawImage(qc, 0, 0, SMR, SMR); /* blur at quarter res then bilinear-upsample: same soft edge, ~16x cheaper */
    const im = tg.getImageData(0, 0, SMR, SMR), d = im.data; for (let k = 3; k < d.length; k += 4) { const v = (d[k] - 128) * 10 + 128; d[k] = v < 0 ? 0 : v > 255 ? 255 : v; } tg.putImageData(im, 0, 0); return tc; };
  const layer = (test, style, bl) => { const m = smooth(test, bl); if (!m) return; const lc = SMC[2]; lc.width = lc.height = CPX; const lg = lc.getContext('2d', CTX2D); lg.setTransform(vs, 0, 0, vs, -vx * vs, -vz * vs); lg.fillStyle = (() => { const p = lg.createPattern(GP[style], 'repeat'); p.setTransform(new DOMMatrix().scale(4 / 128)); return p; })(); lg.fillRect(vx, vz, CHU, CHU);
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'destination-in'; lg.drawImage(m, 0, 0, CPX, CPX); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(lc, 0, 0); WT(); };
  const WALK = new Set([K.SIDE, K.ROAD, K.BRIDGE, K.STAIR]);
  layer(t => WALK.has(kind[t]), 'flag'); yield; layer(t => skipT[t] > 0, 'parvis'); yield; layer(t => kind[t] === K.PARK, 'grass', 10); yield;
  { const m = smooth(t => kind[t] === K.WATER, 9); if (m) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(m, 0, 0, CPX, CPX); g.globalCompositeOperation = 'source-over'; WT(); } }
  yield; { /* v15: railway yards (zoning 'railway' land + rail tiles) as ballast with parallel tracks, aligned to the nearest main line */ const ZN = globalThis.__ZN, ZR = ZN && ZN.Z.railway;
    const m = smooth((t, i, j) => kind[t] === K.RAIL || (ZR != null && ZN.zoneTile(i, j) === ZR && !WALK.has(kind[t]) && kind[t] !== K.BLD && kind[t] !== K.WATER && kind[t] !== K.PARK), 4);
    if (m) { let best = null, bl = 0; for (const o of near(VRAIL, vx - 80, vz - 80, vx + CHU + 80, vz + CHU + 80)) for (let k = 0; k + 3 < o.p.length; k += 2) { const l = Math.hypot(o.p[k + 2] - o.p[k], o.p[k + 3] - o.p[k + 1]); if (l > bl) { bl = l; best = [o.p[k], o.p[k + 1], o.p[k + 2], o.p[k + 3]]; } }
      const ang = best ? Math.atan2(best[3] - best[1], best[2] - best[0]) : Math.PI / 2, lc = SMC[2]; lc.width = lc.height = CPX; const lg = lc.getContext('2d', CTX2D); lg.setTransform(vs, 0, 0, vs, -vx * vs, -vz * vs);
      const pt = lg.createPattern(GP.track, 'repeat'); pt.setTransform(new DOMMatrix().translate(best ? best[0] : 0, best ? best[1] : 0).rotate(ang * 57.29578).scale(4.4 / 128)); lg.fillStyle = pt; lg.fillRect(vx, vz, CHU, CHU);
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'destination-in'; lg.drawImage(m, 0, 0, CPX, CPX); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(lc, 0, 0); WT(); } }
  for (const o of VCH.rail) { g.lineWidth = 4.4; for (let k = 0; k + 3 < o.p.length; k += 2) { const ax = o.p[k], az = o.p[k + 1], bx = o.p[k + 2], bz = o.p[k + 3], p = g.createPattern(GP.track, 'repeat'); p.setTransform(new DOMMatrix().translate(ax, az).rotate(Math.atan2(bz - az, bx - ax) * 57.29578).scale(4.4 / 128)); g.strokeStyle = p; g.beginPath(); g.moveTo(ax, az); g.lineTo(bx, bz); g.stroke(); } }
  const RD = VCH.roads.filter(r => !r.br), BR = VCH.roads.filter(r => r.br), JC = VCH.junc, jf = j => j.n >= 3 ? .62 : .5;
  for (const r of RD) if (r.c === -2) seg(r, r.w, 'gravel');
  for (const r of RD) if (r.c >= 0) seg(r, r.pw, 'flag');
  for (const j of JC) disc(j, j.w * .5 + T, 'flag');
  for (const r of RD) if (r.c === -1) seg(r, 2 * T, 'stair', Math.PI / 2);
  for (const r of RD) if (r.c >= 1) seg(r, r.w + .9, 'rgba(30,26,22,.55)'); for (const j of JC) disc(j, j.w * jf(j) + .45, 'rgba(30,26,22,.55)');
  for (const r of RD) if (r.c >= 1) seg(r, r.w + .5, '#cfc8b8'); for (const j of JC) disc(j, j.w * jf(j) + .25, '#cfc8b8');
  for (const r of RD) if (r.c >= 1) seg(r, r.w, RSF[r.sf] || 'pave', r.sf === 1 ? Math.PI / 2 : null);
  for (const j of JC) disc(j, j.w * jf(j), RSF[j.sf] || 'pave');
  // v13 period wear: horses walk the crown of the road (polished centre band), old lanes drain to a stone centre gutter (caniveau), granite kerb edge
  for (const r of RD) if (r.c >= 2 && r.sf !== 0) seg(r, r.w * .42, 'rgba(255,238,205,.06)');
  for (const r of RD) if (r.c === 1) { seg(r, .55, 'rgba(150,140,124,.55)'); seg(r, .22, 'rgba(26,22,18,.55)'); }
  for (const r of BR) { seg(r, r.pw + .7, 'rgba(40,36,30,.7)'); seg(r, r.pw, 'flag'); if (r.c >= 1) { seg(r, r.w + .5, '#cfc8b8'); seg(r, r.w, RSF[r.sf] || 'pave', r.sf === 1 ? Math.PI / 2 : null); } }
  for (const j of JC) if (j.br) disc(j, j.w * .5, RSF[j.sf] || 'pave'); /* v14 bridge heads: carry the street surface over the deck joint */
  g.setTransform(1, 0, 0, 1, 0, 0);
  // Place de l'Étoile: true circles for the ring road and the Arc's island, with radiating paving
  if (ETOILE) { const sc3 = PXT / T, X = (ETOILE.x - i0 * T) * sc3, Y = (ETOILE.z - j0 * T) * sc3, ri = ETOILE.ri * sc3, ro = ETOILE.ro * sc3; if (X > -ro && Y > -ro && X < CPX + ro && Y < CPX + ro) {
    g.save(); g.beginPath(); g.arc(X, Y, ro - 2, 0, 7); g.clip(); g.fillStyle = P.pave; g.fillRect(X - ro, Y - ro, ro * 2, ro * 2); g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1.5; for (let r = ri + 8; r < ro; r += 9) { g.beginPath(); g.arc(X, Y, r, 0, 7); g.stroke(); } g.restore();
    g.fillStyle = 'rgba(30,26,22,.5)'; g.beginPath(); g.arc(X, Y, ri + 3, 0, 7); g.fill(); g.fillStyle = '#cfc8b8'; g.beginPath(); g.arc(X, Y, ri, 0, 7); g.fill(); g.fillStyle = P.flag; g.beginPath(); g.arc(X, Y, ri - 3, 0, 7); g.fill();
    g.strokeStyle = 'rgba(120,110,95,.35)'; g.lineWidth = 2; for (let r = ri * .35; r < ri - 5; r += ri * .2) { g.beginPath(); g.arc(X, Y, r, 0, 7); g.stroke(); } for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.moveTo(X + Math.cos(a) * ri * .35, Y + Math.sin(a) * ri * .35); g.lineTo(X + Math.cos(a) * (ri - 4), Y + Math.sin(a) * (ri - 4)); g.stroke(); } } }
  yield;
  // seamless world-space colour variation (blotches keyed to world cells, identical across chunk borders) + soft AO along the real building outlines
  WT(); g.globalCompositeOperation = 'source-atop'; { const GS = 10;
    for (let b = Math.floor((vz - 16) / GS); b <= Math.floor((vz + CHU + 16) / GS); b++) for (let a = Math.floor((vx - 16) / GS); a <= Math.floor((vx + CHU + 16) / GS); a++) { const x = (a + hash(a, b, 502)) * GS, z = (b + hash(a, b, 503)) * GS, r = 4 + hash(a, b, 504) * 11, al = .03 + hash(a, b, 505) * .07, dk = hash(a, b, 501) < .62;
      const gr = g.createRadialGradient(x, z, 0, x, z, r); gr.addColorStop(0, dk ? `rgba(40,30,20,${al})` : `rgba(255,244,215,${al * .8})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, z - r, 2 * r, 2 * r); } }
  yield; { const F = bldField(cx, cz); g.filter = 'blur(7px)'; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); for (const s of F.segs) { g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); } g.stroke(); g.filter = 'none'; }
  g.globalCompositeOperation = 'source-over'; g.setTransform(1, 0, 0, 1, 0, 0);
  yield;
  // inner courtyards: small gardens (lawn, gravel border, clipped shrubs, a tree) and dark light wells inside blocks
  { const sc2 = PXT / T, ox2 = i0 * T, oz2 = j0 * T; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    for (let j = j0; j < j0 + CH; j++) for (let i = i0; i < i0 + CH; i++) { if (!isYard(i, j)) continue; const X = (i * T - ox2) * sc2, Y = (j * T - oz2) * sc2, S2 = T * sc2, lot = hash(i >> 1, j >> 1, 92);
      const enclosed = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => kij(i + a, j + b) === K.BLD);
      if (enclosed && hash(i, j, 93) < .22) { g.fillStyle = '#8a857c'; g.fillRect(X + 3, Y + 3, S2 - 6, S2 - 6); g.fillStyle = '#1c1a18'; g.fillRect(X + 6, Y + 6, S2 - 12, S2 - 12); g.fillStyle = 'rgba(120,150,170,.35)'; g.fillRect(X + 8, Y + 8, (S2 - 16) * .5, S2 - 16); continue; }
      if (lot < .42) { g.fillStyle = '#a49a86'; g.fillRect(X, Y, S2, S2); g.fillStyle = '#5c7240'; g.fillRect(X + 3, Y + 3, S2 - 6, S2 - 6);
        for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(${70 + hash(i, j, k) * 40 | 0},${100 + hash(j, i, k) * 40 | 0},50,.5)`; g.beginPath(); g.arc(X + 4 + hash(i, j, 100 + k) * (S2 - 8), Y + 4 + hash(i, j, 200 + k) * (S2 - 8), 1.5 + hash(i, j, 300 + k) * 2, 0, 7); g.fill(); }
        for (let k = 0; k < 4; k++) { const sx = X + 5 + (k % 2) * (S2 - 10), sy = Y + 5 + (k >> 1) * (S2 - 10); g.fillStyle = '#2f4a26'; g.beginPath(); g.arc(sx, sy, 3, 0, 7); g.fill(); g.fillStyle = '#4c6e36'; g.beginPath(); g.arc(sx - .8, sy - .8, 1.6, 0, 7); g.fill(); }
        if (hash(i, j, 94) < .3) { const cx2 = X + S2 / 2, cy2 = Y + S2 / 2; for (const [r, c] of [[12, '#2c4424'], [9, '#3f5e30'], [5, '#5a7a40']]) { g.fillStyle = c; g.beginPath(); g.arc(cx2 - (12 - r) * .3, cy2 - (12 - r) * .3, r, 0, 7); g.fill(); } } } }
    g.restore(); }
  yield;
  // baked contact AO under props, autumn leaves under trees, horse droppings on carriageways
  { const sc2 = PXT / T, ox2 = i0 * T, oz2 = j0 * T; const AOR = { omnibus: 1.1, fountain: 3.4, tree: 2.4, kiosk: 1.5, morris: 1.1, pissoir: 1.4, wallace: .8, trough: 1.3, bench: .9, lamp: .45 };
    for (const p of ensureChunk(cx, cz)) { const r = AOR[p.type]; if (!r) continue; const X = (p.x - ox2) * sc2, Y = (p.z - oz2) * sc2, rr = r * sc2; const gr = g.createRadialGradient(X, Y, 0, X, Y, rr); gr.addColorStop(0, `rgba(0,0,0,${p.type === 'tree' ? .1 : .16})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X - rr, Y - rr, rr * 2, rr * 2);
      if (p.type === 'fountain') { g.save(); g.fillStyle = '#c2b8a4'; g.beginPath(); g.arc(X, Y, 4.2 * sc2, 0, 7); g.fill(); g.strokeStyle = 'rgba(70,62,52,.6)'; g.lineWidth = 1;
        for (const r of [2.6, 3.3, 4.2]) { g.beginPath(); g.arc(X, Y, r * sc2, 0, 7); g.stroke(); } for (let a = 0; a < 32; a++) { const c = Math.cos(a / 32 * 6.283), d2 = Math.sin(a / 32 * 6.283), r0 = (a & 1 ? 3.3 : 2.6) * sc2; g.beginPath(); g.moveTo(X + c * r0, Y + d2 * r0); g.lineTo(X + c * 4.2 * sc2, Y + d2 * 4.2 * sc2); g.stroke(); }
        g.restore(); }
      if (p.type === 'tree' && kAt(p.x, p.z) === K.SIDE) { const gr2 = .85 * sc2; g.save(); g.fillStyle = 'rgba(60,46,32,.55)'; g.fillRect(X - gr2, Y - gr2, gr2 * 2, gr2 * 2); g.strokeStyle = 'rgba(28,30,30,.85)'; g.lineWidth = 1.6; g.strokeRect(X - gr2, Y - gr2, gr2 * 2, gr2 * 2); g.lineWidth = .7; g.strokeStyle = 'rgba(40,42,42,.7)';
        for (let r = .3; r < 1; r += .22) { g.beginPath(); g.arc(X, Y, r * gr2, 0, 7); g.stroke(); } for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(X + Math.cos(a * .785) * gr2 * .25, Y + Math.sin(a * .785) * gr2 * .25); g.lineTo(X + Math.cos(a * .785) * gr2, Y + Math.sin(a * .785) * gr2); g.stroke(); } g.restore(); }
      if (p.type === 'tree') { rs = (p.x * 13 + p.z * 7) | 0 || 1; for (let k = 0; k < 26; k++) { const a = rnd() * 6.3, d = Math.sqrt(rnd()) * 3.4 * sc2; g.fillStyle = ['#a8642a', '#c8902a', '#8a4a1e', '#b87a30', '#6a5a24'][k % 5]; g.save(); g.translate(X + Math.cos(a) * d, Y + Math.sin(a) * d); g.rotate(rnd() * 6); g.beginPath(); g.ellipse(0, 0, 2.6, 1.4, 0, 0, 7); g.fill(); g.restore(); } } } }
  for (let j = j0; j < j0 + CH; j++) for (let i = i0; i < i0 + CH; i++) { if (!ROADC(cls(i, j)) || hash(i, j, 91) > .045) continue; const X = (i - i0 + hash(i, j, 92)) * PXT, Y = (j - j0 + hash(i, j, 93)) * PXT;
    for (let k = 0; k < 4; k++) { g.fillStyle = k ? '#3a2a16' : '#2a1e10'; g.beginPath(); g.ellipse(X + (hash(i, j, 94 + k) - .5) * 6, Y + (hash(i, j, 98 + k) - .5) * 6, 2.4, 1.9, 0, 0, 7); g.fill(); } g.fillStyle = 'rgba(220,200,150,.35)'; g.fillRect(X - 1, Y - 2, 2, 1); g.strokeStyle = 'rgba(214,184,110,.75)'; g.lineWidth = .8; for (let k = 0; k < 7; k++) { const a2 = hash(i, j, 110 + k) * 6.3, sx = X + (hash(i, j, 120 + k) - .5) * 14, sy = Y + (hash(i, j, 130 + k) - .5) * 14; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a2) * 4, sy + Math.sin(a2) * 4); g.stroke(); } } // + scattered straw
  yield;
  // rails
  const sc = PXT / T, ox = i0 * T, oz = j0 * T; for (const [P2, gauge, col] of [[TRAM && TRAM.pts, .55, '#2a2826'], [null, .7, '#3a3836']]) { if (!P2 || !P2.length) continue; /* v14 fix: paths are {pts,cum,len}; the rails were never drawn */ /* v14 horse-tram: grooved steel rails set flush in the setts (dark groove, polished head, granite edge) */
    for (const [lw, cc] of P2 === (TRAM && TRAM.pts) ? [[4.2, 'rgba(150,144,132,.55)'], [2.6, '#24221f'], [1.1, '#a8a49c']] : [[2.2, col]]) { g.strokeStyle = cc; g.lineWidth = lw;
    for (const s of [-1, 1]) { g.beginPath(); let started = false; for (let k = 0; k < P2.length; k++) { const [px, pz] = P2[k], nx = P2[Math.min(k + 1, P2.length - 1)], pv = P2[Math.max(0, k - 1)], dx = nx[0] - pv[0], dz = nx[1] - pv[1], l = Math.hypot(dx, dz) || 1;
        const X = (px + (-dz / l) * gauge * s - ox) * sc, Y = (pz + (dx / l) * gauge * s - oz) * sc; if (!started) { g.moveTo(X, Y); started = true; } else g.lineTo(X, Y); } g.stroke(); } } }
  return c; }
function insetPoly(pts, ins) { const n = pts.length, L = []; for (let k = 0; k < n; k++) { const a = pts[k], b = pts[(k + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l; // outward for CW in screen (x right, z down)
    L.push([a[0] - nx * ins[k], a[1] - nz * ins[k], dx, dz]); }
  const out = []; for (let k = 0; k < n; k++) { const p = L[(k + n - 1) % n], q = L[k]; const den = p[2] * q[3] - p[3] * q[2]; if (Math.abs(den) < 1e-9) { out.push([q[0], q[1]]); continue; } const t = ((q[0] - p[0]) * q[3] - (q[1] - p[1]) * q[2]) / den; out.push([p[0] + p[2] * t, p[1] + p[3] * t]); } return out; }
const SLH = [2.0, 1.7, 1.4, 0], SLI = [.9, .8, 1, 0];
function buildingGeo(cx, cz, out) { const A = BM.map(() => ({ p: [], n: [], u: [], c: [] })); const i0 = cx * CH, j0 = cz * CH;
  const tri = (mi, a, b, c, ua, ub, uc, ca, cb, cc, N3) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const T_ = A[mi]; T_.p.push(...a, ...b, ...c); if (N3) T_.n.push(...N3[0], ...N3[1], ...N3[2]); else T_.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz); T_.u.push(...ua, ...ub, ...uc); T_.c.push(...ca, ...cb, ...cc); };
  // quad a,b (bottom, left->right seen from outside), c,d (top right, top left)
  const quad = (mi, a, b, c, d, ua, ub, uc, ud, ca, cb, cc, cd, NA, NB, NC, ND) => { tri(mi, a, c, b, ua, uc, ub, ca, cc, cb, NA && [NA, NC, NB]); tri(mi, a, d, c, ua, ud, uc, ca, cd, cc, NA && [NA, ND, NC]); };
  const chim = [], stacks = [], det = [], domes = [], sky = [], wtow = []; const FD = bldField(cx, cz), { F, DI, N: FN, X0: FX, Z0: FZ, cells: FC, segs: FS } = FD; const ox = cx * CHU, oz = cz * CHU;
  const PI = new Map(); const RING = [[0, 0], ...N4, [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
  const cinfo = (x, z) => { let i = Math.floor(x / T), j = Math.floor(z / T), f = null; for (const [a, b] of RING) if (Hb(i + a, j + b)) { f = [i + a, j + b]; break; } if (!f) return null; [i, j] = f; const k = i * 4096 + j; if (PI.has(k)) return PI.get(k);
    const st = styleOf(i, j), lot = hash(Math.floor(i / 4), Math.floor(j / 4), 61), h = Math.max(2.5, Hb(i, j) * (st >= 2 ? 1 : .92 + lot * .16)), dp = depth[ti(i, j)], work = dp > DCUT[st] && h < 5.5, sl = work ? 0 : SLH[st], inn = work ? 0 : SLI[st]; const bi = i >> 4, bj = j >> 4, tv = .93 + hash(bi, bj, 31) * .12, tint = st === 3 ? [tv, tv * .97, tv * .95] : [tv, tv * (.98 + hash(bi, bj, 32) * .03), tv * (.94 + hash(bi, bj, 33) * .05)]; // one roof/stone tone per block (v13: no per-lot patchwork)
    const o = { i, j, h, st, dp, work, sl, inn, top: h + sl, tint }; PI.set(k, o); return o; };
  const inC = (u, v) => u >= FM && v >= FM && u < FM + CHU && v < FM + CHU; const cellI = (u, v) => cinfo(FX + u + .5, FZ + v + .5);
  const ry = (p, ci) => p.k < 0 || !ci.sl ? ci.h : ci.h + ci.sl * Math.min(1, DI[p.k] / ci.inn);
  // roofs (fan per cell polygon; mansard slope from inward distance)
  for (let v = FM; v < FM + CHU; v++) for (let u = FM; u < FM + CHU; u++) { const PL = FC[v * (FN - 1) + u]; if (!PL) continue; const ci = cellI(u, v); if (!ci) continue; const mt = ci.work ? MI.glass : MI.roof + ci.st;
    for (const P of PL) { const Y = P.map(p => ry(p, ci)), col = Y.map(y => { const f = (ci.sl ? .86 + .14 * (y - ci.h) / ci.sl : 1) * .95; return [ci.tint[0] * f, ci.tint[1] * f, ci.tint[2] * f]; });
      for (let k = 1; k < P.length - 1; k++) { const A_ = [P[0].x, Y[0], P[0].z], B_ = [P[k + 1].x, Y[k + 1], P[k + 1].z], C_ = [P[k].x, Y[k], P[k].z];
        if (ci.sl && Math.min(Y[0], Y[k], Y[k + 1]) < ci.top - .02) { const e1 = [B_[0] - A_[0], B_[1] - A_[1], B_[2] - A_[2]], e2 = [C_[0] - A_[0], C_[1] - A_[1], C_[2] - A_[2]], tnx = e1[1] * e2[2] - e1[2] * e2[1], tnz = e1[0] * e2[1] - e1[1] * e2[0], ax = Math.abs(tnx) > Math.abs(tnz); const hl = Math.hypot(tnx, tnz) || 1, tx = -tnz / hl, tz = tnx / hl; const sv = p => [(p[0] * tx + p[2] * tz) / 4.8, (p[1] - ci.h) / ci.sl]; tri(MI.slo + ci.st, A_, B_, C_, sv(A_), sv(B_), sv(C_), ci.tint, ci.tint, ci.tint); }
        else tri(mt, A_, B_, C_, [A_[0] / 4, A_[2] / 4], [B_[0] / 4, B_[2] / 4], [C_[0] / 4, C_[2] / 4], col[0], col[k + 1], col[k]); } }
    // party walls between neighbouring cells of different height (east and south shared edges, fully inside)
    for (const [du, dv] of [[1, 0], [0, 1]]) { const u2 = u + du, v2 = v + dv; if (!FC[v2 * (FN - 1) + u2]) continue; const c2 = cellI(u2, v2); if (!c2 || c2 === ci) continue;
      const ka = du ? v * FN + u + 1 : (v + 1) * FN + u, kb = du ? (v + 1) * FN + u + 1 : (v + 1) * FN + u + 1; if (F[ka] <= 0 || F[kb] <= 0) continue;
      const pa = { x: FX + ka % FN, z: FZ + ((ka / FN) | 0), k: ka }, pb = { x: FX + kb % FN, z: FZ + ((kb / FN) | 0), k: kb }; const y1 = [ry(pa, ci), ry(pb, ci)], y2 = [ry(pa, c2), ry(pb, c2)]; const d = y1[0] + y1[1] - y2[0] - y2[1]; if (Math.abs(d) < .1) continue;
      const hi = d > 0 ? y1 : y2, lo = d > 0 ? y2 : y1, hc = d > 0 ? ci : c2, pc = [hc.tint[0] * .8, hc.tint[1] * .8, hc.tint[2] * .8];
      // face toward the lower cell: segment direction with outward normal (dz,-dx)
      let A_ = pa, B_ = pb, ya = [lo[0], hi[0]], yb = [lo[1], hi[1]]; const nx = B_.z - A_.z, nz = -(B_.x - A_.x), tox = du * (d > 0 ? 1 : -1), toz = dv * (d > 0 ? 1 : -1); if (nx * tox + nz * toz < 0) { [A_, B_] = [B_, A_];[ya, yb] = [yb, ya]; }
      const ua = du ? A_.z : A_.x, ub = du ? B_.z : B_.x; quad(MI.party, [A_.x, ya[0], A_.z], [B_.x, yb[0], B_.z], [B_.x, yb[1], B_.z], [A_.x, ya[1], A_.z], [ua / 4, ya[0] / 4], [ub / 4, yb[0] / 4], [ub / 4, yb[1] / 4], [ua / 4, ya[1] / 4], pc, pc, hc.tint, hc.tint); } }
  // facades: chain contour segments so the facade texture runs continuously along curved and angled street fronts
  { const byStart = new Map(), hasPrev = new Set(); FS.forEach((s, k) => { byStart.set(s[4], k); hasPrev.add(s[5]); }); const seen = new Uint8Array(FS.length), chains = [];
    const run = k0 => { const ch = []; let k = k0; while (k != null && !seen[k]) { seen[k] = 1; ch.push(FS[k]); k = byStart.get(FS[k][5]); } return ch; };
    FS.forEach((s, k) => { if (!seen[k] && !hasPrev.has(s[4])) chains.push(run(k)); }); FS.forEach((s, k) => { if (!seen[k]) chains.push(run(k)); });
    for (const ch of chains) { let s = 0; const L = ch.length; let ex = 0, ez = 0; for (let q = 0; q < Math.min(L, 4); q++) { ex += ch[q][2] - ch[q][0]; ez += ch[q][3] - ch[q][1]; } const el = Math.hypot(ex, ez) || 1; s = (ch[0][0] * ex + ch[0][1] * ez) / el;
      const U0 = []; for (const q of ch) { U0.push(s); s += Math.hypot(q[2] - q[0], q[3] - q[1]); }
      // walls
      ch.forEach((q, n) => { if (!inC(q[6], q[7])) return; const ci = cellI(q[6], q[7]); if (!ci) return; const wh = ci.h, ua = U0[n], ub = ua + Math.hypot(q[2] - q[0], q[3] - q[1]), lo = [ci.tint[0] * .5, ci.tint[1] * .5, ci.tint[2] * .5];
        quad(MI.fac + ci.st, [q[0], 0, q[1]], [q[2], 0, q[3]], [q[2], wh, q[3]], [q[0], wh, q[1]], [ua / 9.6, 0], [ub / 9.6, 0], [ub / 9.6, wh / 15], [ua / 9.6, wh / 15], lo, lo, ci.tint, ci.tint);
        if (ci.st < 3) { const l = Math.hypot(q[2] - q[0], q[3] - q[1]) || 1, nx = (q[3] - q[1]) / l * .26, nz = -(q[2] - q[0]) / l * .26, fl = ci.sl ? [.62, .64, .68] : [.5, .5, .52], fd = [fl[0] * .55, fl[1] * .55, fl[2] * .58];
          quad(MI.party, [q[0] + nx, wh + .02, q[1] + nz], [q[2] + nx, wh + .02, q[3] + nz], [q[2], wh + .1, q[3]], [q[0], wh + .1, q[1]], [ua / 4, 0], [ub / 4, 0], [ub / 4, .05], [ua / 4, .05], fl, fl, fl, fl);
          quad(MI.party, [q[0] + nx, wh - .2, q[1] + nz], [q[2] + nx, wh - .2, q[3] + nz], [q[2] + nx, wh + .02, q[3] + nz], [q[0] + nx, wh + .02, q[1] + nz], [ua / 4, 0], [ub / 4, 0], [ub / 4, .05], [ua / 4, .05], fd, fd, fl, fl); } });
      // shopfront / balcony detail strips along straight runs
      let a = 0; while (a < L) { const ci = inC(ch[a][6], ch[a][7]) ? cellI(ch[a][6], ch[a][7]) : null; let b = a, arc = 0; while (b < L && arc < 2.4) { const c2 = cellI(ch[b][6], ch[b][7]); if (c2 !== ci || !inC(ch[b][6], ch[b][7])) break; arc += Math.hypot(ch[b][2] - ch[b][0], ch[b][3] - ch[b][1]); b++; }
        if (b === a) { a++; continue; } if (ci && ci.sl && ci.st < 3 && arc > 1.4) { const ax = ch[a][0], az = ch[a][1], bx = ch[b - 1][2], bz = ch[b - 1][3], dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz);
          if (l > arc * .96) { const nx = dz / l, nz = -dx / l, mx = (ax + bx) / 2, mz = (az + bz) / 2; det.push([ax, az, bx, bz, ci.h, ci.st, nx, nz, U0[a], U0[a] + l, Math.floor((mx + nx * 1.3) / T), Math.floor((mz + nz * 1.3) / T), Math.floor((mx - nx * .7) / T), Math.floor((mz - nz * .7) / T)]); } }
        a = b; } } }
  // chimneys / factory stacks at tile centres well inside the field
  for (let j = Math.floor(oz / T); j < Math.floor((oz + CHU) / T); j++) for (let i = Math.floor(ox / T); i < Math.floor((ox + CHU) / T); i++) { const h = Hb(i, j); if (!h) continue; const u = i * T + 1 - FX, v = j * T + 1 - FZ; if (u < 0 || v < 0 || u >= FN || v >= FN || DI[v * FN + u] < 1) continue; const ci = cinfo(i * T + 1, j * T + 1);
    const di = DI[v * FN + u]; if (ci.sl && ci.st < 3 && di >= ci.inn * .85 && ((i + j) & 1) === 0 && hash(i, j, 51) < .55) chim.push([i * T + 1, ci.top - .1, j * T + 1, hash(i >> 3, j >> 3, 53) < .5 ? 0 : Math.PI / 2, .72, .8]); // v14 smaller stacks; v13: orderly stacks on the ridge line, tile-snapped, one orientation per block
    else if (ci.st < 3 && di > 2.2 && hash(i, j, 58) < .07) sky.push([i * T + 1, ci.top, j * T + 1, (hash(i, j, 59) < .5 ? 0 : Math.PI / 2)]);
    if (ci.st === 3 && di > 2 && hash(i >> 1, j >> 1, 62) < .05 && !(i & 1) && !(j & 1)) wtow.push([i * T + 1, ci.top, j * T + 1]);
    if (ci.st === 3 && ci.dp >= 2 && hash(i >> 1, j >> 1, 52) < .05 && !(i & 1) && !(j & 1)) stacks.push([i * T + 1, ci.top, j * T + 1]); }
  // quay walls along the real river banks
  { const qc = [1, 1, 1], qd = [.6, .65, .6]; const wall = (a, b, par) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l, nx = uz, nz = -ux, ua = a[0] * ux + a[1] * uz, ub = ua + l, ins = .28;
      quad(MI.quay, [a[0], -2, a[1]], [b[0], -2, b[1]], [b[0], par, b[1]], [a[0], par, a[1]], [ua / 3.2, 0], [ub / 3.2, 0], [ub / 3.2, .78], [ua / 3.2, .78], qd, qd, qc, qc);
      if (par) { const ai = [a[0] - nx * ins, a[1] - nz * ins], bi = [b[0] - nx * ins, b[1] - nz * ins]; quad(MI.quay, [a[0], par, a[1]], [b[0], par, b[1]], [bi[0], par, bi[1]], [ai[0], par, ai[1]], [ua / 3.2, .9], [ub / 3.2, .9], [ub / 3.2, .95], [ua / 3.2, .95], qc, qc, qc, qc);
        quad(MI.quay, [bi[0], 0, bi[1]], [ai[0], 0, ai[1]], [ai[0], par, ai[1]], [bi[0], par, bi[1]], [ub / 3.2, .8], [ua / 3.2, .8], [ua / 3.2, .9], [ub / 3.2, .9], qd, qd, qc, qc); } };
    // bank line = iso-contour of the bilinear water-tile field on a 1-unit lattice (marching squares), so the wall sits exactly on the gameplay water edge without stair-steps
    const isW = (i, j) => inb(i, j) && kind[ti(i, j)] === K.WATER ? 1 : 0, wf = (x, z) => { const fx = x / T - .5, fz = z / T - .5, i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j; return (isW(i, j) * (1 - a) + isW(i + 1, j) * a) * (1 - b) + (isW(i, j + 1) * (1 - a) + isW(i + 1, j + 1) * a) * b - .5; };
    const NQ = CHU + 1, WF = new Float32Array(NQ * NQ); let anyW = 0; for (let v = 0; v < NQ; v++) for (let u = 0; u < NQ; u++) { const f = wf(ox + u, oz + v); WF[v * NQ + u] = f === 0 ? 1e-3 : f; if (f > 0) anyW = 1; }
    if (anyW) for (let v = 0; v < CHU; v++) for (let u = 0; u < CHU; u++) { const id = [v * NQ + u, v * NQ + u + 1, (v + 1) * NQ + u + 1, (v + 1) * NQ + u], A4 = id.map(k => WF[k]), ins = A4.map(q => q > 0), n = ins.filter(Boolean).length; if (!n || n === 4) continue;
      const C = [[u, v], [u + 1, v], [u + 1, v + 1], [u, v + 1]], cr = k => { const p = C[k], q = C[(k + 1) % 4], t = A4[k] / (A4[k] - A4[(k + 1) % 4]); return [ox + p[0] + (q[0] - p[0]) * t, oz + p[1] + (q[1] - p[1]) * t]; };
      const SG = []; if (n === 2 && ins[0] === ins[2]) { for (let k = 0; k < 4; k++) if (ins[k]) SG.push([cr(k), cr((k + 3) % 4)]); } else { const P_ = []; for (let k = 0; k < 4; k++) { if (ins[k]) P_.push(null); if (ins[k] !== ins[(k + 1) % 4]) P_.push(cr(k)); } for (let k = 0; k < P_.length; k++) { const p = P_[k], q = P_[(k + 1) % P_.length]; if (p && q) SG.push([p, q]); } }
      // SG segment p->q has outward normal (dz,-dx) pointing to land; the wall must face the water, so reverse it
      for (const [p, q] of SG) { const l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l < .02) continue; const nx = (q[1] - p[1]) / l, nz = -(q[0] - p[0]) / l, mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, lk = kAt(mx + nx * .8, mz + nz * .8);
        wall(q, p, (lk === K.SIDE || lk === K.PARK || lk === K.STAIR) ? .5 : 0); } } }
  const geo = new THREE.BufferGeometry(), P = [], Nn = [], U = [], Cc = []; let off = 0;
  A.forEach((t, k) => { const cnt = t.p.length / 3; if (!cnt) return; P.push(...t.p); Nn.push(...t.n); U.push(...t.u); Cc.push(...t.c); geo.addGroup(off, cnt, k); off += cnt; });
  if (!off) return null; geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, BM); mesh.castShadow = mesh.receiveShadow = true; out.chim = chim; out.stacks = stacks; out.det = det; out.domes = domes; out.sky = sky; out.wtow = wtow; out.spires = SPIRES.filter(q => q[0] >= ox && q[0] < ox + CHU && q[1] >= oz && q[1] < oz + CHU).map(q => { let best = null, bd = 1e9; for (let j = Math.floor(q[1] / T) - 5; j <= Math.floor(q[1] / T) + 5; j++) for (let i = Math.floor(q[0] / T) - 5; i <= Math.floor(q[0] / T) + 5; i++) { if (!Hb(i, j)) continue; const u = i * T + 1 - FX, v = j * T + 1 - FZ; if (u < 0 || v < 0 || u >= FN || v >= FN || DI[v * FN + u] < 1.5) continue; const d = (i * T + 1 - q[0]) ** 2 + (j * T + 1 - q[1]) ** 2 - DI[v * FN + u] * 4; if (d < bd) { bd = d; best = [i * T + 1, j * T + 1]; } } if (!best) return null; const ci = cinfo(best[0], best[1]); return [best[0], (ci.top || ci.h) - .2, best[1], q[2], q[3], q[4] || 1]; }).filter(Boolean); return mesh; }
function buildChunk(cx, cz) { const it = buildChunkG(cx, cz); let r; while (!(r = it.next()).done); return r.value; }
function* buildChunkG(cx, cz) { const ch = { cx, cz, g: new THREE.Group(), lamps: [], stacks: [], mats: [] }; bldField(cx, cz); yield; let _t0 = performance.now(); const c = yield* groundCanvasG(cx, cz); stats.tGround = performance.now() - _t0; yield; const t = tex(c, false); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = true;
  const gm = stdM({ map: t, alphaTest: .5, roughness: .95 }); if (Q.bloom && !CFG.ps1) { gm.bumpMap = t; gm.bumpScale = 2.2; } ch.mats.push(gm); ch.tex = t; applyWet(gm); if (!BM.userData_wet) { BM.userData_wet = 1; BM.forEach((m, k) => { m.userData.roof = 1; applyWet(m, 1); }); }
  const nearHill = Math.hypot(cx * CHU + CHU / 2 - HILL.x, cz * CHU + CHU / 2 - HILL.z) < HILL.r + CHU; const gseg = nearHill ? 40 : 1;
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(CHU, CHU, gseg, gseg).rotateX(-Math.PI / 2), gm); gp.position.set(cx * CHU + CHU / 2, 0, cz * CHU + CHU / 2); gp.receiveShadow = true; ch.g.add(gp);
  renderer.initTexture(t); yield; const out = {}; _t0 = performance.now(); const bm = buildingGeo(cx, cz, out); yield; stats.tBld = performance.now() - _t0; if (bm) { bm.userData.bld = 1; ch.g.add(bm); }
  { const dm = detailGeo(out.det || [], cx, cz).mesh(SHOPM); if (dm) ch.g.add(dm); }
  const ch1 = inst(PG.chimney, PROPMAT, out.chim || [], q => _m4.compose(_v4.set(q[0], q[1], q[2]), _q4.setFromAxisAngle(_up, q[3]), _s4.set(q[4] || 1, q[5] || 1, q[4] || 1))); if (ch1) ch.g.add(ch1);
  for (const ty of ['spireSq', 'spireTwin', 'spireDome']) { const L = (out.spires || []).filter(q => q[3] === ty); const m = inst(PG[ty], PROPMAT, L, q => { place(q[0], q[1], q[2], q[4], q[5]); _m4.compose(_v4.set(q[0], q[1], q[2]), _q4.setFromAxisAngle(_up, q[4]), _s4.set(q[5], q[5] * .55, q[5])); }); if (m) ch.g.add(m); } // squashed vertically so the tower stays under the top-down camera yet reads by silhouette + shadow
  const sk1 = inst(PG.skylight, PROPMAT, out.sky || [], q => place(q[0], q[1], q[2], q[3], 1)); if (sk1) ch.g.add(sk1);
  const wt1 = inst(PG.wtower, PROPMAT, out.wtow || [], q => place(q[0], q[1], q[2], 0, 1)); if (wt1) ch.g.add(wt1);
  const dm1 = inst(PG.dome, PROPMAT, out.domes || [], q => place(q[0], q[1], q[2], 0, .55)); if (dm1) ch.g.add(dm1);
  const st1 = inst(PG.stack, PROPMAT, out.stacks || [], q => place(q[0], q[1] - .5, q[2], 0, 1)); if (st1) ch.g.add(st1); ch.chims = out.chim || []; ch.stacks = (out.stacks || []).map(q => [q[0], q[1] + 10.6, q[2]]);
  stats.tMid = performance.now() - _t0; yield; _t0 = performance.now();
  // props
  const props = ensureChunk(cx, cz).filter(p => !p.dyn); const by = {}; for (const p of props) (by[p.type] = by[p.type] || []).push(p);
  const hide = (p, mesh, k) => { (p.inst = p.inst || []).push([mesh, k]); };
  const gas = (by.lamp || []).filter(p => !p.arc), arc = (by.lamp || []).filter(p => p.arc);
  const mk = (list, geo, mat, f, sh) => { const m = inst(geo, mat, list, (p, k, mm) => { f(p, k, mm); hide(p, mm, k); }, sh); if (m) ch.g.add(m); return m; };
  mk(gas, PG.lamp, PROPMAT, p => place(p.x, 0, p.z, -(p.ry || 0), 1)); mk(gas, PG.lant, LANTM, p => place(p.x, 0, p.z, -(p.ry || 0), 1), false);
  mk(arc, PG.arc, PROPMAT, p => place(p.x, 0, p.z, -(p.ry || 0), 1)); mk(arc, PG.globe, GLOBEM, p => place(p.x, 0, p.z, 0, 1), false);
  const pool = mk(by.lamp || [], POOLG, POOLM, p => place(p.x, 0, p.z, 0, p.arc ? 11 : 10), false); if (pool) { (by.lamp || []).forEach((p, k) => pool.setColorAt(k, _c4.set(p.arc ? 0x6a6860 : 0xffa850))); pool.receiveShadow = false; }
  if (Q.fx >= 1) { const L = by.lamp || []; const rf = inst(POOLG, REFLM, L, p => { _m4.compose(_v4.set(p.x, .02, p.z + 3.4), _q4.identity(), _s4.set(1.1, 1, 7)); }, false); if (rf) { L.forEach((p, k) => rf.setColorAt(k, _c4.set(p.arc ? 0x5a5a58 : 0xffa040))); rf.receiveShadow = false; ch.g.add(rf); }
    const sp = (out.det || []).filter(d => hash(d[0] * 7 | 0, d[1] * 7 | 0, 77) < .55); const sm = inst(POOLG, SPILLM, sp, d => { const l = Math.hypot(d[2] - d[0], d[3] - d[1]); _m4.compose(_v4.set((d[0] + d[2]) / 2 + d[6] * 1.1, .03, (d[1] + d[3]) / 2 + d[7] * 1.1), _q4.setFromAxisAngle(_up, -Math.atan2(d[3] - d[1], d[2] - d[0])), _s4.set(l * 1.1, 1, 2.6)); }, false); if (sm) { sm.receiveShadow = false; ch.g.add(sm); } }
  ch.lamps = by.lamp || []; ch.trees = by.tree || [];
  const treesAll = by.tree || []; // v12 species trees (wood + foliage cards), two silhouettes each, varied scale
  for (let sp = 0; sp < 4; sp++) for (let v = 0; v < 2; v++) { const L = treesAll.filter(p => treeSpecies(p) === sp && (Q.fx >= 3 && hash(p.x | 0, p.z | 0, 21) >= .5 ? 1 : 0) === v); /* v14 perf: second silhouette only on Ultra (halves tree draw calls; scale/rotation still vary) */ if (!L.length) continue; const G = TREES[sp][v];
    mk(L, G.wood, PROPMAT, p => place(p.x, 0, p.z, hash(p.x | 0, p.z | 0, 2) * 6, (p.s || 1) * (.88 + hash(p.x | 0, p.z | 0, 22) * .24)));
    const can = mk(L, G.fol, LEAFM, p => place(p.x, 0, p.z, hash(p.x | 0, p.z | 0, 2) * 6, (p.s || 1) * (.88 + hash(p.x | 0, p.z | 0, 22) * .24))); if (can) L.forEach((p, k) => { const h = hash(p.x | 0, p.z | 0, 3); can.setColorAt(k, _c4.setRGB(.86 + h * .22, .9 + h * .14, .82 + h * .12)); }); }
  mk(by.morris || [], PG.poster, POSTERM, p => place(p.x, 0, p.z, hash(p.x | 0, p.z | 0, 5) * 6, 1));
  { const FL = by.fountain || []; mk(FL, PG.fountainW, FWATM, p => place(p.x, 0, p.z, 0, 1), false); mk(FL, PG.fountainS, FSPRM, p => place(p.x, 0, p.z, 0, 1), false); }
  const SMALL = { wallace: 1, trough: 1, bench: 1, omnibus: 1 }; /* v14 perf: street furniture under ~1.5 m casts no sun shadow (baked contact AO covers it) */
  for (const ty of ['morris', 'wallace', 'trough', 'pissoir', 'bench', 'kiosk', 'omnibus', 'fountain']) mk(by[ty] || [], PG[ty], PROPMAT, p => place(p.x, 0, p.z, -(p.ry || 0) + (ty === 'bench' ? Math.PI / 2 : 0), 1), !SMALL[ty]);
  for (const p of props) if (!p.alive) killInst(p);
  stats.tProps = performance.now() - _t0; return ch; }
function killInst(p) { if (!p.inst) return; for (const [m, k] of p.inst) { m.getMatrixAt(k, _m4); _m4.decompose(_v4, _q4, _s4); if (p.type === 'tree' || p.type === 'lamp') { if (m.material === LANTM || m.material === GLOBEM || m.material === POOLM || m.material === CANOPYM || m.material === LEAFM) _s4.set(0, 0, 0); else _q4.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 1.45)); } else _s4.set(0, 0, 0); _m4.compose(_v4, _q4, _s4); m.setMatrixAt(k, _m4); m.instanceMatrix.needsUpdate = true; } }
// ================= STREAMING =================
const LGROUP = new THREE.Group(); scene.add(LGROUP); const LBUILT = new Map();
const _ray = new THREE.Raycaster(), _pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _hit = new THREE.Vector3();
function viewRect() { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]]) { _ray.setFromCamera({ x: u, y: v }, camera); if (_ray.ray.intersectPlane(_pl, _hit)) { x0 = Math.min(x0, _hit.x); x1 = Math.max(x1, _hit.x); z0 = Math.min(z0, _hit.z); z1 = Math.max(z1, _hit.z); } }
  if (x0 > x1) { x0 = camera.position.x - 60; x1 = camera.position.x + 60; z0 = camera.position.z - 40; z1 = camera.position.z + 40; } return [x0, z0, x1, z1]; }
export const stats = { chunks: 0, built: 0, buildMs: 0 };
function wantedChunks(m) { const [x0, z0, x1, z1] = viewRect(); const out = []; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  for (let a = Math.max(0, Math.floor((x0 - m) / CHU)); a <= Math.min(NCX - 1, Math.floor((x1 + m) / CHU)); a++) for (let b = Math.max(0, Math.floor((z0 - m) / CHU)); b <= Math.min(NCZ - 1, Math.floor((z1 + m) / CHU)); b++) out.push([a, b, ((a + .5) * CHU - cx) ** 2 + ((b + .5) * CHU - cz) ** 2]);
  out.sort((p, q) => p[2] - q[2]); return { list: out, cx, cz }; }
// Streaming (engine): chunk builds run as resumable jobs (buildChunkG yields between heavy passes) under a per-frame time budget,
// so a new chunk never stalls a frame. Chunks are prefetched in a wide ring ahead of the view; visible-but-missing chunks get a bigger budget.
let JOB = null; const PREF = 70;
function streamChunks(budgetMs, force) { const { list, cx, cz } = wantedChunks(force ? 20 : PREF); const t0 = performance.now(); const keep = new Set(list.map(q => q[0] * 1000 + q[1]));
  if (force) { if (JOB) { let r; while (!(r = JOB.it.next()).done); finishJob(r.value); } for (const [a, b] of list) { const k = a * 1000 + b; if (CHUNKS.has(k)) continue; const ch = buildChunk(a, b); CHUNKS.set(k, ch); chunkGroup.add(ch.g); stats.built++; } }
  else { const vis = new Set(wantedChunks(4).list.map(q => q[0] * 1000 + q[1])); let urgent = false; for (const k of vis) if (!CHUNKS.has(k)) urgent = true; const B = urgent ? Math.max(budgetMs, 12) : budgetMs; stats.urgent = urgent;
    while (performance.now() - t0 < B) { if (!JOB) { let best = null; for (const q of list) { const k = q[0] * 1000 + q[1]; if (CHUNKS.has(k)) continue; const w = q[2] - (vis.has(k) ? 1e9 : 0); if (!best || w < best[2]) best = [q[0], q[1], w]; } if (!best) break; JOB = { a: best[0], b: best[1], it: buildChunkG(best[0], best[1]) }; }
      const r = JOB.it.next(); if (r.done) finishJob(r.value); } }
  stats.buildMs = performance.now() - t0;
  if (CHUNKS.size > 40) for (const [k, ch] of CHUNKS) { if (keep.has(k)) continue; const d = ((ch.cx + .5) * CHU - cx) ** 2 + ((ch.cz + .5) * CHU - cz) ** 2; if (d < (CHU * 3.5) ** 2) continue; disposeChunk(ch); CHUNKS.delete(k); }
  stats.chunks = CHUNKS.size;
  // landmarks: at most one new build per frame (all of them when forced)
  let lb = 0; for (const L of LMODELS) { const d = (L.x - cx) ** 2 + (L.z - cz) ** 2, r = Math.max(L.w, L.d) / 2; if (d < (130 + r) ** 2) { if (!LBUILT.has(L) && (force || lb < 1)) { lb++; const _tl = performance.now(); const g = buildLandmark(L); stats.tLand = (stats.tLand || 0) + performance.now() - _tl; if (g) { LGROUP.add(g); LBUILT.set(L, g); } } } else if (d > (200 + r) ** 2 && LBUILT.has(L)) { const g = LBUILT.get(L); LGROUP.remove(g); g.traverse(o => o.geometry && o.geometry.dispose()); LBUILT.delete(L); } } }
function finishJob(ch) { const k = JOB.a * 1000 + JOB.b; JOB = null; if (CHUNKS.has(k)) return; CHUNKS.set(k, ch); chunkGroup.add(ch.g); stats.built++; }
function disposeChunk(ch) { chunkGroup.remove(ch.g); ch.g.traverse(o => { if (o.geometry && !Object.values(PG).includes(o.geometry) && o.geometry !== POOLG) o.geometry.dispose(); if (o.dispose && o.isInstancedMesh) o.dispose(); }); ch.tex.dispose(); ch.mats.forEach(m => m.dispose()); for (const p of chunkProps.get(ch.cx * 1000 + ch.cz) || []) delete p.inst; }
// ================= WATER =================
const WN = tex(cv(256, 256, g => { const id = g.createImageData(256, 256); for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const a = x / 256 * 6.283, b = y / 256 * 6.283; const dx = Math.cos(a * 3 + Math.sin(b * 2) * 1.5) * .5 + Math.cos(a * 7 + b * 5) * .25 + Math.cos(a * 13 - b * 4) * .12, dz = Math.cos(b * 4 + Math.sin(a * 2)) * .5 + Math.cos(b * 9 - a * 3) * .25 + Math.sin(a * 5 + b * 11) * .12;
  const i = (y * 256 + x) * 4; id.data[i] = 128 + dx * 70; id.data[i + 1] = 128 + dz * 70; id.data[i + 2] = 255; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); }), true, false);
WN.repeat.set(WX / 14, WZ / 14);
const FWN = WN.clone(); FWN.repeat.set(1.6, 1.6); FWN.needsUpdate = true;
const FWATM = new THREE.MeshStandardMaterial({ color: 0x6a98a2, roughness: .08, metalness: .1, normalMap: FWN, normalScale: new THREE.Vector2(.9, .9), envMapIntensity: 1.4 });
const FSPRM = new THREE.MeshBasicMaterial({ color: 0xe8f0f2, transparent: true, opacity: .45, depthWrite: false });
const WATERM = new THREE.MeshStandardMaterial({ color: 0x2f5258, roughness: .08, metalness: .3, normalMap: WN, normalScale: new THREE.Vector2(.45, .45) });
export const WU = { uT: { value: 0 }, uDay: { value: 1 }, uMark: { value: 0 } };
WATERM.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, WU);
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPw;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPw=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uT, uDay, uMark; varying vec3 vWPw;')
    .replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;', 'vec3 mapN = normalize((texture2D( normalMap, vNormalMapUv ).xyz*2.-1.) + (texture2D( normalMap, vWPw.xz*.031 + vec2(-uT*.021, uT*.013)).xyz*2.-1.) + .6*(texture2D( normalMap, vWPw.xz*.11 + vec2(uT*.05, -uT*.035)).xyz*2.-1.));')
    .replace('#include <color_fragment>', `#include <color_fragment>
      float wb = sin(vWPw.x*.045+uT*.15)*sin(vWPw.z*.037-uT*.11); diffuseColor.rgb *= .9 + .18*wb;`)
    .replace('#include <opaque_fragment>', `vec3 vd = normalize(vViewPosition); float fr = pow(1. - clamp(dot(normal, vd), 0., 1.), 4.);
      outgoingLight = mix(outgoingLight, mix(vec3(.05,.07,.12), vec3(.62,.72,.8), uDay), clamp(fr*1.6 + .06, 0., .55));
      float gl = pow(max(0., normal.x*.5 + normal.z*.4 + normal.y*.2), 24.) * uDay; outgoingLight += vec3(1., .95, .85) * gl * .5;
      #include <opaque_fragment>
      if (uMark > .5) gl_FragColor.a = .2;`); };
WATERM.customProgramCacheKey = () => 'seine3';
const water = new THREE.Mesh(new THREE.PlaneGeometry(WX, WZ).rotateX(-Math.PI / 2), WATERM); water.position.set(WX / 2, -.9, WZ / 2); water.receiveShadow = true; scene.add(water);
// ================= DYNAMIC PROPS =================
const DG = { crate: gbGeo(b => b.box(1, 1, 1, 0, .5, 0, '#8a6a40').box(1.02, .1, 1.02, 0, .2, 0, '#5a4028').box(1.02, .1, 1.02, 0, .8, 0, '#5a4028')),
  table: gbGeo(b => b.cyl(.45, .45, .05, 0, .75, 0, '#d8d0c0', 10).cyl(.04, .06, .75, 0, .37, 0, IRON).box(.4, .05, .4, .65, .45, 0, '#6a4a2a').box(.05, .4, .4, .85, .65, 0, '#6a4a2a').box(.4, .05, .4, -.65, .45, 0, '#6a4a2a').box(.05, .4, .4, -.85, .65, 0, '#6a4a2a')),
  barricade: gbGeo(b => b.box(2.2, .5, 1, 0, .25, 0, '#6a6460').box(1.6, .5, .8, .1, .7, 0, '#7a7068').cyl(.35, .35, .9, -.8, .9, .3, '#6a4a2a', 8).box(1.8, .15, .15, 0, 1.3, -.2, '#5a4028', 0, 0, .3).box(.9, .5, .5, .7, 1, .2, '#8a6a40')),
  phone: gbGeo(b => b.box(.12, 1.7, .12, 0, .85, 0, '#4a3420').box(.36, .5, .2, 0, 1.4, .1, '#6a4a2a').cyl(.06, .06, .08, -.08, 1.55, .22, '#d0a030', 6, Math.PI / 2).cyl(.06, .06, .08, .08, 1.55, .22, '#d0a030', 6, Math.PI / 2)),
  manhole: gbGeo(b => b.cyl(.65, .65, .04, 0, .03, 0, '#2a2a2a', 14).box(1, .045, .06, 0, .03, 0, '#3a3a3a').box(.06, .045, 1, 0, .03, 0, '#3a3a3a')) };
hooks.prop = (p) => { if (p.inst) { if (!p.alive) killInst(p); return; } if (!p.dyn) return; if (!p.mesh && p.alive && DG[p.type]) { p.mesh = new THREE.Mesh(DG[p.type], PROPMAT); p.mesh.castShadow = p.type !== 'manhole'; p.mesh.receiveShadow = true; p.mesh.position.set(p.x, 0, p.z); p.mesh.rotation.y = hash(p.x | 0, p.z | 0, 5) * 6; scene.add(p.mesh); }
  else if (p.mesh && !p.alive) { scene.remove(p.mesh); p.mesh = null; } else if (p.mesh) p.mesh.position.set(p.x, 0, p.z); };
for (const p of dynProps) hooks.prop(p);
// ================= PARTICLES =================
const PTEX = tex(cv(64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }), false);
const PVS = `attribute float size; attribute vec4 rgba; varying vec4 vC; uniform float scale; void main(){ vC=rgba; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*scale/-mv.z; gl_Position=projectionMatrix*mv; }`;
const PFS = `uniform sampler2D map; varying vec4 vC; void main(){ vec4 t=texture2D(map,gl_PointCoord); gl_FragColor=vec4(vC.rgb, vC.a*t.a); if(gl_FragColor.a<.01) discard; }`;
class PSys { constructor(add, n) { this.n = n; this.d = new Float32Array(n * 16); this.live = 0; const g = new THREE.BufferGeometry(); this.pos = new Float32Array(n * 3); this.sz = new Float32Array(n); this.col = new Float32Array(n * 4);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('size', new THREE.BufferAttribute(this.sz, 1).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('rgba', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({ uniforms: { map: { value: PTEX }, scale: { value: 600 } }, vertexShader: PVS, fragmentShader: PFS, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = add ? 3 : 2; scene.add(this.pts); this.g = g; }
  emit(x, y, z, vx, vy, vz, life, s0, s1, r, gg, b, a, grav = 0, drag = 0) { if (this.live >= this.n) return; const o = this.live++ * 16, d = this.d; d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = vx; d[o + 4] = vy; d[o + 5] = vz; d[o + 6] = life; d[o + 7] = life; d[o + 8] = s0; d[o + 9] = s1; d[o + 10] = r; d[o + 11] = gg; d[o + 12] = b; d[o + 13] = a; d[o + 14] = grav; d[o + 15] = drag; }
  update(dt) { const d = this.d; let k = 0; while (k < this.live) { const o = k * 16; d[o + 6] -= dt; if (d[o + 6] <= 0) { this.live--; d.copyWithin(o, this.live * 16, this.live * 16 + 16); continue; } const f = 1 - d[o + 15] * dt; d[o + 3] *= f; d[o + 5] *= f; d[o + 4] = d[o + 4] * f - d[o + 14] * dt;
      d[o] += d[o + 3] * dt; d[o + 1] += d[o + 4] * dt; d[o + 2] += d[o + 5] * dt; if (d[o + 1] < .05 && d[o + 14] > 0) { d[o + 1] = .05; d[o + 4] = 0; d[o + 3] *= .5; d[o + 5] *= .5; } const u = 1 - d[o + 6] / d[o + 7];
      this.pos[k * 3] = d[o]; this.pos[k * 3 + 1] = d[o + 1]; this.pos[k * 3 + 2] = d[o + 2]; this.sz[k] = d[o + 8] + (d[o + 9] - d[o + 8]) * u; this.col[k * 4] = d[o + 10]; this.col[k * 4 + 1] = d[o + 11]; this.col[k * 4 + 2] = d[o + 12]; this.col[k * 4 + 3] = d[o + 13] * (u < .1 ? u * 10 : 1 - (u - .1) / .9); k++; }
    this.g.setDrawRange(0, this.live); for (const a of ['position', 'size', 'rgba']) this.g.attributes[a].needsUpdate = true; this.mat.uniforms.scale.value = renderer.domElement.height / (2 * Math.tan(camera.fov * Math.PI / 360)) * .5; } }
let PA = new PSys(false, 2400), PADD = new PSys(true, 2400);
const R = Math.random;
// decals
const DTEX = tex(cv(64, 64, g => { g.fillStyle = '#fff'; for (let k = 0; k < 9; k++) { g.globalAlpha = .5 + R() * .5; g.beginPath(); g.arc(32 + (R() - .5) * 30, 32 + (R() - .5) * 30, 4 + R() * 12, 0, 7); g.fill(); } }), false);
function decalPool(n, col) { const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: DTEX, color: col, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }), n); m.count = 0; m.frustumCulled = false; scene.add(m); return { m, k: 0, n }; }
const BLOOD = decalPool(80, 0x5a0808), SCORCH = decalPool(40, 0x0a0806);
function decal(P, x, z, s) { const k = P.k++ % P.n; place(x, .03 + (k % 7) * .002, z, R() * 6, s); P.m.setMatrixAt(k, _m4); P.m.count = Math.min(P.n, Math.max(P.m.count, k + 1)); P.m.instanceMatrix.needsUpdate = true; }
// tracers
const TR = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffe0a0, transparent: true, blending: THREE.AdditiveBlending, opacity: .9 })); TR.frustumCulled = false; scene.add(TR); const tracers = [];
function flashLight(x, y, z, col, i, t) { const f = FL.reduce((a, b) => a.t < b.t ? a : b); f.l.position.set(x, y, z); f.l.color.set(col); f.i = i; f.t = t; f.t0 = t; }
export const FX = {
  muzzle(x, z, a, big) { const c = Math.cos(a), s = Math.sin(a); for (let k = 0; k < (big ? 6 : 3); k++) PADD.emit(x + c * .9, 1.3, z + s * .9, c * (6 + R() * 6) + (R() - .5) * 2, R(), s * (6 + R() * 6) + (R() - .5) * 2, .07, big ? 2.2 : 1.4, .4, 1, .8, .4, 1); for (let k = 0; k < 2; k++) PA.emit(x + c, 1.3, z + s, c * 2, .8, s * 2, .9, .5, 2.2, .75, .72, .68, .35, -.3, 2); flashLight(x + c, 1.6, z + s, 0xffc070, 30, .06); },
  tracer(x0, z0, x1, z1) { tracers.push({ a: [x0, 1.3, z0], b: [x1, 1.3, z1], t: .07 }); },
  smoke(x, y, z, n = 4, dark = .5, s = 2) { for (let k = 0; k < n; k++) { const v = .7 - dark * .55; PA.emit(x + (R() - .5), y, z + (R() - .5), (R() - .5) * .8, 1 + R() * 1.2, (R() - .5) * .8, 2.5 + R() * 2, s * .6, s * 2.4, v, v * .97, v * .94, .45, -.2, .3); } },
  fire(x, z, s = 1) { for (let k = 0; k < 2; k++) PADD.emit(x + (R() - .5) * s, .3, z + (R() - .5) * s, (R() - .5) * .5, 2 + R() * 2.5, (R() - .5) * .5, .4 + R() * .4, s * 1.8, s * .5, 1, .45 + R() * .25, .12, .9); if (R() < .4) FX.smoke(x, 1.8 * s, z, 1, .9, s * 1.2); if (R() < .1) flashLight(x, 1.5, z, 0xff8030, 18 * s, .15); },
  explosion(x, z, r = 5) { flashLight(x, 3, z, 0xffa040, 120, .35); for (let k = 0; k < 50; k++) { const a = R() * 6.28, v = R() * r * 2.4; PADD.emit(x, .5 + R(), z, Math.cos(a) * v, 2 + R() * 5, Math.sin(a) * v, .3 + R() * .5, r * .9, r * .3, 1, .5 + R() * .4, .15, 1, 0, 2.5); }
    for (let k = 0; k < 30; k++) { const a = R() * 6.28, v = R() * r * 1.2; PA.emit(x, 1 + R() * 2, z, Math.cos(a) * v, 1.5 + R() * 2.5, Math.sin(a) * v, 2.5 + R() * 2.5, r * .6, r * 1.8, .22, .2, .19, .7, -.15, 1.5); }
    FX.sparks(x, z, 24, 10); for (let k = 0; k < 14; k++) { const a = R() * 6.28, v = 4 + R() * 8; PA.emit(x, 1, z, Math.cos(a) * v, 6 + R() * 6, Math.sin(a) * v, 1.5, .5, .5, .25, .2, .16, 1, 18, .2); } decal(SCORCH, x, z, r * 1.6); },
  blood(x, z, n = 10) { for (let k = 0; k < n; k++) { const a = R() * 6.28, v = R() * 3; PA.emit(x, 1 + R() * .4, z, Math.cos(a) * v, 1 + R() * 2.5, Math.sin(a) * v, .6 + R() * .3, .35, .25, .5, .02, .02, 1, 14, 1); } decal(BLOOD, x + (R() - .5), z + (R() - .5), .9 + R() * .9); },
  sparks(x, z, n = 8, sp = 6, y = 1) { for (let k = 0; k < n; k++) { const a = R() * 6.28, v = sp * (.4 + R()); PADD.emit(x, y, z, Math.cos(a) * v, 1 + R() * 4, Math.sin(a) * v, .3 + R() * .4, .3, .1, 1, .75, .35, 1, 14, .5); } },
  dust(x, z, n = 2) { for (let k = 0; k < n; k++) PA.emit(x + (R() - .5) * .8, .2, z + (R() - .5) * .8, (R() - .5) * .8, .4 + R() * .4, (R() - .5) * .8, 1 + R(), .5, 2.2, .55, .48, .38, .3, -.05, .8); },
  splash(x, z) { for (let k = 0; k < 14; k++) { const a = R() * 6.28, v = R() * 3; PA.emit(x, -.8, z, Math.cos(a) * v, 3 + R() * 4, Math.sin(a) * v, .8, .4, .2, .85, .9, .95, .8, 12, .2); } },
};
// ================= LIGHT POOL / SKY / WET =================
let ENV = { day: 1, rain: 0, t: 0 }; const wetMats = new Set();
// global wetness: ENV.wet ramps up with rain and dries slowly; darker albedo, glossy roughness, sky/lamp reflections,
// broken up only by world-space noise (no shapes). Roofs get a gentler sheen. Noise modulation only on medium+ presets.
export const WETU = { uWet: { value: 0 } };
function wetShader(m, k) { if (m.userData.wetSh) return; m.userData.wetSh = 1; m.onBeforeCompile = sh => { sh.uniforms.uWet = WETU.uWet;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uWet; float wn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5),b=fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.5),c=fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.5),d=fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.5);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nfloat wv = uWet * (.72 + .28 * (wn(vWP.xz * .21) * .6 + wn(vWP.xz * .9) * .4)) * ' + k.toFixed(2) + ';\nroughnessFactor = mix(roughnessFactor, .07, wv);\ndiffuseColor.rgb *= 1. - wv * .4;'); }; m.needsUpdate = true; }
function applyWet(m, roof) { wetMats.add(m); const w = ENV.wet || 0; if (roof) { if (Q.det) wetShader(m, .55); return; }
  if (Q.det) { wetShader(m, 1); m.roughness = .95; m.color.setScalar(1); } else { m.roughness = .95 - w * .7; m.color.setScalar(1 - w * .34); }
  m.metalness = w * .14; m.envMapIntensity = 1 + w * 1.3; }
let lightT = 0;
function assignLights(cx, cz, night) { const cand = []; for (const ch of CHUNKS.values()) { const dx = (ch.cx + .5) * CHU - cx, dz = (ch.cz + .5) * CHU - cz; if (dx * dx + dz * dz > 110 * 110) continue; for (const p of ch.lamps) if (p.alive) { const d = (p.x - cx) ** 2 + (p.z - cz) ** 2; if (d < 70 * 70) cand.push([d, p]); } }
  cand.sort((a, b) => a[0] - b[0]); PL.forEach((l, k) => { const c = cand[k]; if (!c || night < .05) { l.intensity = 0; return; } const p = c[1]; l.position.set(p.x, p.arc ? 3.4 : 2.75, p.z); l.target.position.set(p.x, 0, p.z); l.target.updateMatrixWorld(); l.color.set(p.arc ? 0xdfe6ff : 0xffa050); l.distance = p.arc ? 17 : 15; l.userData.base = (p.arc ? 62 : 40) * night; l.intensity = l.userData.base; }); }
const DAYFOG = new THREE.Color(0xb0aa9c), NIGHTFOG = new THREE.Color(0x0e1018), RAINFOG = new THREE.Color(0x6a6c6e), _fc = new THREE.Color();
export function setEnv(day, rain, hour) { ENV.day = day; ENV.rain = rain; ENV.hour = hour; }
function updateSky(dt, t) { const { day, rain } = ENV, night = 1 - day, dl = day * (1 - rain * .4), h = ENV.hour ?? 12;
  const az = (h - 6) / 13 * Math.PI, el = .52 + Math.sin(Math.max(0, Math.min(1, (h - 6) / 13)) * Math.PI) * .3; ENV.sunDir = new THREE.Vector3(-Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * .25 + .55).normalize();
  ENV.sunTrue = new THREE.Vector3(-Math.cos(az), Math.max(-.2, Math.sin(Math.max(0, Math.min(1, (h - 6) / 13)) * Math.PI) * .9 + .02), Math.sin(az) * .25 + .55).normalize();
  if (night > .5) ENV.sunDir.set(.3, 1, .4).normalize(); // moonlight
  const dusk = Math.max(0, 1 - Math.abs(h - 18.5) / 1.5) + Math.max(0, 1 - Math.abs(h - 6.2) / 1.2);
  // time-of-day palette: cool pearly morning, neutral noon, warm amber afternoon, rose-orange dusk, blue moonlight
  const morn = Math.max(0, 1 - Math.abs(h - 8) / 2.5), aft = Math.max(0, 1 - Math.abs(h - 16) / 3), gray = rain * .7;
  sun.intensity = dl * (2.75 - dusk * .5) + night * .2; sun.color.setRGB(1 - morn * .04, .93 - dusk * .26 - aft * .05 - morn * .01, .82 - dusk * .42 - aft * .12 + morn * .06).lerp(_fc.setRGB(.86, .88, .92), gray); if (night > .5) sun.color.setRGB(.5, .6, 1);
  hemi.intensity = .16 + dl * .34 + rain * .16; hemi.color.setRGB(.74 + .2 * dl + dusk * .12, .8 + .12 * dl - dusk * .02, 1 - dusk * .12); hemi.groundColor.setRGB(.27 + .22 * dl + dusk * .1, .23 + .16 * dl + dusk * .02, .19 + .08 * dl); // v13 GI approx: warm limestone bounce from sunlit streets
  _fc.copy(DAYFOG).lerp(RAINFOG, rain * .7).lerp(NIGHTFOG, night); scene.fog.color.copy(_fc); scene.background.copy(_fc);
  const ch = camera.position.y; scene.fog.near = ch * .9 + 3 - rain * 10; scene.fog.far = ch + 80 - rain * 30 - night * 8;
  scene.environment = night > .6 ? ENV_NIGHT : ENV_DAY; renderer.toneMappingExposure = .82 + night * .3; POST.U.ex.value = renderer.toneMappingExposure; POST.U.night.value = night; POST.bs = .45 + night * .45;
  const fl = .9 + Math.sin(t * 13) * .05 + (R() < .03 ? -.2 : 0);
  for (let k = 0; k < 8; k++) BM[k].emissiveIntensity = night * [1.7, 1.05, 1.45, .75, 1.35, .9, 1.2, .65][k] * (1 + Math.sin(t * .05 + k * 1.7) * .08); LANTM.emissiveIntensity = night * 3 * fl + .05; GLOBEM.emissiveIntensity = night * 4.5; ROSEM.emissiveIntensity = .12 + night * 1.6; LANCET.emissiveIntensity = night * .9; LMK.update(night, t); EIFL.emissiveIntensity = night * 3.2 * (.9 + fl * .1); POOLM.opacity = night * (PL.length ? .3 : .5) * fl; SPILLM.opacity = night * .55; REFLM.opacity = night * ENV.wet * .75 * fl; POOLM.visible = POOLM.opacity > .004; SPILLM.visible = SPILLM.opacity > .004; REFLM.visible = REFLM.opacity > .004; /* v14 perf: no additive light-pool draws by day or when dry */
  for (const l of PL) if (l.userData.base) l.intensity = l.userData.base * fl;
  if (Math.abs((ENV.wetApplied ?? -1) - (ENV.wet || 0)) > .02) { ENV.wetApplied = ENV.wet || 0; for (const m of wetMats) applyWet(m, m.userData.roof); WATERM.roughness = .1 + rain * .15; } WETU.uWet.value = ENV.wet || 0;
  WN.offset.x = t * .012; WN.offset.y = t * .02; FWN.offset.x = Math.sin(t * .7) * .3; FWN.offset.y = t * .25; FWN.rotation = t * .15; FSPRM.opacity = .32 + Math.sin(t * 11) * .06 + Math.sin(t * 17.3) * .04; WU.uT.value = t; WU.uDay.value = day * (1 - rain * .5);
  { const w = ENV.wet || 0; ENV.wet = rain > w ? Math.min(rain, w + dt * .08) : Math.max(rain, w - dt * .004); if (window.__wetNow != null) { ENV.wet = window.__wetNow; window.__wetNow = null; } POST.U.wet.value = ENV.wet * (Q.post === false ? 0 : 1); }
  updateSky2(t, dusk); }
const SKYU = { sunDir: { value: new THREE.Vector3(0, 1, 0) }, moonDir: { value: new THREE.Vector3(-.4, .55, .5).normalize() }, day: { value: 1 }, dusk: { value: 0 }, rain: { value: 0 }, t: { value: 0 }, fogC: { value: new THREE.Color() } };
const SKYM = new THREE.ShaderMaterial({ uniforms: SKYU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `uniform vec3 sunDir, moonDir, fogC; uniform float day, dusk, rain, t; varying vec3 vD;
  float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nz(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hs(i), hs(i + vec2(1., 0.)), f.x), mix(hs(i + vec2(0., 1.)), hs(i + vec2(1., 1.)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * nz(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return v; }
  void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.), night = 1. - day;
    vec3 zen = mix(vec3(.012, .018, .045), vec3(.16, .34, .7), day), hor = mix(vec3(.04, .05, .09), vec3(.7, .76, .82), day);
    hor = mix(hor, vec3(1.25, .52, .22), dusk); zen = mix(zen, vec3(.2, .2, .42), dusk * .7);
    vec3 c = mix(hor, zen, pow(y, .5)); float sd = max(dot(d, sunDir), 0.);
    c += vec3(1., .62, .32) * pow(sd, 6.) * (.2 + dusk * 1.4) * day; c += vec3(1.2, 1., .85) * pow(sd, 400.) * 3. * day + vec3(1., .95, .8) * smoothstep(.9993, .9996, sd) * 30. * day;
    // stars
    vec2 sp = d.xz / (y + .35) * 220.; float st = step(.9965, hs(floor(sp))) * (.5 + .5 * sin(t * 2. + hs(floor(sp) + 3.) * 30.)); c += vec3(.9, .92, 1.) * st * night * smoothstep(.05, .3, y) * (1. - rain);
    // moon: lit disc with maria and a phase terminator, plus a soft halo
    float md = dot(d, moonDir); vec3 mr = normalize(cross(moonDir, vec3(0., 1., 0.))), mu = cross(mr, moonDir); vec2 q = vec2(dot(d, mr), dot(d, mu)) / .045; float ql = length(q);
    if (md > 0. && ql < 1.) { float z = sqrt(max(0., 1. - ql * ql)); float lam = clamp(dot(vec3(q, z), normalize(vec3(.75, .25, .55))) * 1.4 + .1, 0., 1.); float mar = .78 + .22 * nz(q * 3. + 7.) - .25 * smoothstep(.55, .75, nz(q * 2.2 + 1.)); c = mix(c, vec3(1., .96, .86) * (lam * mar * 2.2 + .03), (1. - smoothstep(.93, 1., ql)) * night); }
    c += vec3(.5, .6, .8) * pow(max(md, 0.), 300.) * .5 * night;
    // clouds: fbm on a high plane, self-shadowed toward the sun for a volumetric look
    vec2 uv = d.xz / (y + .1) * .9 + vec2(t * .006, t * .0025); float cl = fbm(uv), cov = mix(.5, .28, rain); float den = smoothstep(cov, cov + .3, cl) * smoothstep(.0, .12, y);
    vec3 L = day > .5 ? sunDir : moonDir; float sh = fbm(uv + L.xz * .09); float lit = clamp(.65 + (cl - sh) * 3.5, .25, 1.35);
    vec3 cc = mix(vec3(.05, .06, .1), vec3(.78, .8, .85), day); cc = mix(cc, vec3(1.15, .62, .45), dusk * .8); cc *= lit; cc = mix(cc, vec3(.42, .43, .46) * (.3 + .7 * day), rain * .7); cc += vec3(1., .7, .4) * pow(sd, 5.) * (1. - den) * .6 * day * (.3 + dusk);
    c = mix(c, cc, den * .92); c = mix(fogC, c, smoothstep(-.03, .22, d.y));
    gl_FragColor = vec4(c, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }` });
const SKY = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), SKYM); SKY.frustumCulled = false; SKY.renderOrder = -10; scene.add(SKY);
export const VIEW = { chase: false };
const _sv = new THREE.Vector3();
function updateSky2(t, dusk) { SKY.position.copy(camera.position); SKYU.t.value = t; SKYU.day.value = ENV.day; SKYU.rain.value = ENV.rain; SKYU.dusk.value = dusk * ENV.day; SKYU.fogC.value.copy(scene.fog.color); if (ENV.sunTrue) SKYU.sunDir.value.copy(ENV.sunTrue);
  // god rays: only when the sun is on screen (low sun near the screen edge)
  let gr = 0; if (POST.bloom && ENV.sunTrue && ENV.day > .3) { _sv.copy(ENV.sunTrue).multiplyScalar(400).add(camera.position).project(camera); if (_sv.z < 1 && Math.abs(_sv.x) < 1.6 && Math.abs(_sv.y) < 1.6) { gr = (1 - Math.min(1, Math.hypot(_sv.x, _sv.y) / 1.6)) * ENV.day * (1 - ENV.rain * .8) * (.5 + dusk); POST.U.sunUV.value.set(_sv.x * .5 + .5, _sv.y * .5 + .5); } } POST.U.gr.value = gr; }
// ================= FRAME =================
let millT = 0;
export function update(dt, t, cx, cz) { { const c = renderer.domElement; CUTU.uRes.value.set(c.width, c.height); } streamChunks(CHUNKS.size < 4 ? 400 : 6, false); updateSky(dt, t);
  // shadows follow view
  if (sun.castShadow) { const sc = sun.shadow.camera, ext = Math.max(40, camera.position.y * .95); if (sc.right !== ext) { sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 260; sc.updateProjectionMatrix(); } const tx = Math.round(cx / 2) * 2, tz = Math.round(cz / 2) * 2; sun.target.position.set(tx, 0, tz); sun.position.set(tx + ENV.sunDir.x * 120, ENV.sunDir.y * 120, tz + ENV.sunDir.z * 120); }
  else if (ENV.sunDir) sun.position.copy(ENV.sunDir).multiplyScalar(100);
  lightT -= dt; if (lightT <= 0) { lightT = .2; assignLights(cx, cz, 1 - ENV.day); }
  for (const f of FL) { if (f.t > 0) { f.t -= dt; f.l.intensity = f.i * Math.max(0, f.t / f.t0); } else f.l.intensity = 0; }
  for (const L of LBUILT.keys()) if (L.sails) L.sails.rotation.x = t * .7 + L.x;
  for (const ch of CHUNKS.values()) for (const s of ch.stacks) if (R() < dt * 2.5) FX.smoke(s[0], s[1], s[2], 1, .85, 2.4);
  updateAmb(dt, t, cx, cz); PA.update(dt); PADD.update(dt);
  for (let k = tracers.length - 1; k >= 0; k--) { tracers[k].t -= dt; if (tracers[k].t <= 0) tracers.splice(k, 1); } const tp = new Float32Array(tracers.length * 6); tracers.forEach((q, k) => tp.set([...q.a, ...q.b], k * 6)); TR.geometry.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  fpsTick(dt); }
function postCfg() { POST.on = !!(Q.post && CFG.post && !CFG.ps1); POST.bloom = !!Q.bloom; POST.ssao = !!Q.ssao; POST.fx = Q.fx ?? 2; POST.paint = (Q.fx ?? 2) >= 2 ? 2 : 1; WU.uMark.value = POST.on && POST.fx >= 1 ? 1 : 0; if (POST.on) postSize(renderer, Q.aa ? 4 : 0); }
function applyBump() { const on = !!(Q.bloom && !CFG.ps1); for (const m of BM) { const want = on ? m.map : null; if (m.bumpMap !== want) { m.bumpMap = want; m.bumpScale = 1.6; m.needsUpdate = true; } } for (const ch of CHUNKS.values()) for (const m of ch.mats) if (m.map) { const want = on ? m.map : null; if (m.bumpMap !== want) { m.bumpMap = want; m.bumpScale = 2.2; m.needsUpdate = true; } } }
// WebGL context loss (blank screen): GPU memory pressure / driver resets kill the context; without preventDefault() it never comes back.
// Keep it restorable, skip drawing while lost, and on restore rebuild the post targets (three re-uploads textures/programs lazily).
export const GL = { lost: false, losses: 0, restores: 0, errors: 0 };
glc.addEventListener('webglcontextlost', e => { e.preventDefault(); GL.lost = true; GL.losses++; console.warn('WebGL context lost'); }, false);
glc.addEventListener('webglcontextrestored', () => { GL.lost = false; GL.restores++; try { POST.w = 0; applyShadow(); postCfg(); resize(); } catch (e) { console.warn(e); } for (const ch of CHUNKS.values()) if (ch.tex) ch.tex.needsUpdate = true; }, false);
renderer.info.autoReset = false; let rT = 0; export function render() { if (GL.lost) return; renderer.info.reset(); CUTU.uCut.value = 1; if (POST.on) { rT += .016; postRender(renderer, scene, camera, rT); } else renderer.render(scene, camera); perf.calls = renderer.info.render.calls; perf.tris = renderer.info.render.triangles; }
export function flush() { const save = CHUNKS.size; streamChunks(1e9, true); for (const L of LBUILT.keys()) {} return CHUNKS.size - save; }
// ================= MAP CANVAS (1px per tile) =================
let MAPC = null;
export function mapCanvas() { if (MAPC) return MAPC; MAPC = document.createElement('canvas'); MAPC.width = NX; MAPC.height = NZ; const g = MAPC.getContext('2d'), id = g.createImageData(NX, NZ), D = id.data;
  const SC = [[178, 170, 156], [200, 190, 172], [190, 120, 90], [150, 104, 80]];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const t = ti(i, j), k = kind[t]; let c;
    switch (k) { case K.WATER: c = [64, 104, 120]; break; case K.PARK: c = [92, 128, 70]; break; case K.ROAD: case K.BRIDGE: c = surf[t] === S.MAC ? [86, 82, 76] : surf[t] === S.DIRT ? [130, 108, 80] : [70, 68, 66]; break; case K.SIDE: c = [140, 136, 128]; break; case K.RAIL: c = [96, 80, 66]; break; case K.STAIR: c = [160, 154, 140]; break;
      case K.BLD: c = skipT[t] ? [214, 196, 150] : bldH(i, j) > 0 ? SC[styleOf(i, j)] : [120, 114, 104]; break; default: c = [30, 28, 26]; }
    if (k === K.ROAD || k === K.SIDE || k === K.BRIDGE || k === K.STAIR) c = [132, 126, 116];
    const o = t * 4; D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 255; } g.putImageData(id, 0, 0);
  // smooth vector streets on a 3x canvas (main.js scales it by explicit size, so resolution is free)
  const BIG = document.createElement('canvas'), MS = 3; BIG.width = NX * MS; BIG.height = NZ * MS; const b = BIG.getContext('2d'); b.imageSmoothingEnabled = true; b.drawImage(MAPC, 0, 0, BIG.width, BIG.height);
  b.setTransform(MS / T, 0, 0, MS / T, 0, 0); b.lineCap = b.lineJoin = 'round';
  for (const r of VROADS) if (r.c >= 0 || r.c === -1) { b.strokeStyle = r.c === -1 ? '#a09a8c' : '#8c867c'; b.lineWidth = r.c >= 1 ? r.pw : r.w; b.beginPath(); linePath(b, r.p); b.stroke(); }
  for (const r of VROADS) if (r.c === -2) { b.strokeStyle = '#b4a888'; b.lineWidth = 1.2; b.beginPath(); linePath(b, r.p); b.stroke(); }
  for (const r of VROADS) if (r.c >= 1) { b.strokeStyle = r.sf === 0 ? '#565248' : r.sf === 2 ? '#826c50' : '#46443f'; b.lineWidth = r.w; b.beginPath(); linePath(b, r.p); b.stroke(); }
  if (ETOILE) { b.fillStyle = '#46443f'; b.beginPath(); b.arc(ETOILE.x, ETOILE.z, ETOILE.ro, 0, 7); b.fill(); b.fillStyle = '#d6c496'; b.beginPath(); b.arc(ETOILE.x, ETOILE.z, ETOILE.ri, 0, 7); b.fill(); }
  MAPC = BIG; return MAPC; }
// ================= SETTINGS UI / FPS =================
const fpsEl = document.createElement('div'); fpsEl.id = 'fps'; fpsEl.style.cssText = 'position:fixed;left:8px;bottom:8px;font:12px monospace;color:#cfc;background:rgba(0,0,0,.5);padding:2px 6px;z-index:30;pointer-events:none;display:none'; document.body.appendChild(fpsEl);
const ft = []; export const perf = { fps: 0, ms: 0, calls: 0, tris: 0 };
function fpsTick(dt) { ft.push(dt); if (ft.length > 60) ft.shift(); const a = ft.reduce((p, q) => p + q, 0) / ft.length; perf.fps = 1 / a; perf.ms = a * 1000; 
  fpsEl.style.display = CFG.fps ? 'block' : 'none'; if (CFG.fps) fpsEl.textContent = `${perf.fps.toFixed(0)} fps · ${perf.ms.toFixed(1)} ms · ${perf.calls} calls · ${(perf.tris / 1000).toFixed(0)}k tris · ${Q.n}${CFG.ps1 ? ' · PS1' : ''}`; }
export function applySettings() { Q = Object.assign({}, PRESETS[CFG.preset] || PRESETS.high); applyShadow(); mkLights(); resize(); saveCfg(); applyBump();
  scene.remove(PA.pts, PADD.pts); PA = new PSys(false, Q.parts); PADD = new PSys(true, Q.parts); for (const m of [...BM, ...Object.values(LMat)]) m.needsUpdate = true; if (Q.det !== lastDet) { lastDet = Q.det; for (const ch of CHUNKS.values()) disposeChunk(ch); CHUNKS.clear(); } }
let lastDet = Q.det;
export function openSettings(onClose) { let el = document.getElementById('gfxSet'); if (!el) { el = document.createElement('div'); el.id = 'gfxSet'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,8,6,.82);z-index:40;font-family:Georgia,serif;color:#e8dcc0';
  const draw = () => { el.innerHTML = `<div style="background:#1e1a14;border:2px solid #b8963e;padding:22px 28px;min-width:380px;box-shadow:0 8px 40px #000"><h2 style="margin:0 0 14px;color:#f4c430;letter-spacing:2px">GRAPHICS</h2>
    <div style="margin-bottom:12px">Preset: ${Object.keys(PRESETS).map(k => `<button data-p="${k}" style="margin:2px;padding:5px 10px;background:${CFG.preset === k ? '#b8963e' : '#3a3228'};color:#fff;border:1px solid #b8963e;cursor:pointer">${PRESETS[k].n}</button>`).join('')}</div>
    <div style="margin-bottom:10px">Resolution scale: <input id="gScale" type="range" min="50" max="100" step="5" value="${Math.round(CFG.scale * 100)}"> <span id="gScaleV">${Math.round(CFG.scale * 100)}%</span></div>
    <label style="display:block;margin-bottom:8px"><input type="checkbox" id="gSh" ${CFG.shadows ? 'checked' : ''}> Sun shadows</label>
    <label style="display:block;margin-bottom:8px"><input type="checkbox" id="gPost" ${CFG.post ? 'checked' : ''}> Post-processing (bloom, colour grade, vignette) ${Q.post ? '' : '· off on this preset'}</label>
    <label style="display:block;margin-bottom:8px"><input type="checkbox" id="gPs1" ${CFG.ps1 ? 'checked' : ''}> Retro PS1 mode (pixelated)</label>
    <label style="display:block;margin-bottom:14px"><input type="checkbox" id="gFps" ${CFG.fps ? 'checked' : ''}> Show FPS counter</label>
    <div style="font-size:12px;opacity:.7;margin-bottom:12px">Target 60 fps. Lamp lights: ${Q.lights} · particles: ${Q.parts} · shadow map: ${Q.smap}${Q.aa ? ' · MSAA (applies after reload)' : ''}</div>
    <button id="gClose" style="padding:6px 18px;background:#b8963e;color:#1e1a14;border:0;font-weight:bold;cursor:pointer">BACK</button></div>`;
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { CFG.preset = b.dataset.p; CFG.scale = PRESETS[CFG.preset].scale; applySettings(); draw(); });
    el.querySelector('#gScale').oninput = e => { CFG.scale = e.target.value / 100; el.querySelector('#gScaleV').textContent = e.target.value + '%'; resize(); saveCfg(); };
    el.querySelector('#gSh').onchange = e => { CFG.shadows = e.target.checked; applySettings(); }; el.querySelector('#gPost').onchange = e => { CFG.post = e.target.checked; applySettings(); }; el.querySelector('#gPs1').onchange = e => { CFG.ps1 = e.target.checked; applySettings(); }; el.querySelector('#gFps').onchange = e => { CFG.fps = e.target.checked; saveCfg(); };
    el.querySelector('#gClose').onclick = () => { el.style.display = 'none'; onClose && onClose(); }; };
  draw(); }
addEventListener('resize', resize); resize(); applyBump();

// ================= AMBIENCE: pigeons, swifts overhead, dust motes, house-chimney wisps, sewer steam =================
const AMB = { g: new THREE.Group(), pig: [], birds: [], init: false };
const PIGG = (() => { const g = new GB(); g.sph(.17, 0, .2, 0, '#8a8e96', 1, .8, 1.35, 8).sph(.09, 0, .33, .18, '#6e7480', 1, 1, 1, 7).sph(.03, 0, .32, .27, '#c8a040', 1, 1, 1, 4).sph(.12, 0, .26, -.02, '#5a6a70', 1.25, .5, 1.1, 7).sph(.07, 0, .18, -.24, '#4a4e56', 1.1, .4, 1.4, 6); return g.geo(); })();
const BIRDG = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .25, -1, .15, -.2, 0, 0, -.15, 0, 0, .25, 0, 0, -.15, 1, .15, -.2], 3)); g.computeVertexNormals(); return g; })();
const BIRDM = new THREE.MeshBasicMaterial({ color: 0x1a1612, side: THREE.DoubleSide });
const MOTEM = new THREE.PointsMaterial({ color: 0xfff0c8, size: .09, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false });
let PIGM = null, BIRDS = null, MOTES = null, ambT = 0;
function walk(x, z) { const k = kij(Math.floor(x / T), Math.floor(z / T)); return k === K.SIDE || k === K.PARK || k === K.ROAD; }
// v13 falling autumn leaves: drift down from the nearest trees with flutter + spin, settle, then fade
const LEAFG = new THREE.PlaneGeometry(.16, .1); const LEAFPM = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: .9 }); let FALL = null, fallT = 0, fallTrees = [];
function updateLeaves(dt, cx, cz, life) { if (!FALL) { FALL = new THREE.InstancedMesh(LEAFG, LEAFPM, 48); FALL.frustumCulled = false; FALL.castShadow = false; scene.add(FALL); FALL.L = []; for (let k = 0; k < 48; k++) { FALL.L.push({ t: -R() * 6, y: 0 }); FALL.setColorAt(k, _c4.set(['#b86a2a', '#c8962e', '#8a4a1e', '#a8782a', '#7a6a28'][k % 5])); } }
  fallT -= dt; if (fallT <= 0) { fallT = 2; fallTrees = []; const ci = Math.floor(cx / CHU), cj = Math.floor(cz / CHU); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const ch = CHUNKS.get((ci + a) * 1000 + cj + b); for (const p of (ch && ch.trees) || []) if ((p.x - cx) ** 2 + (p.z - cz) ** 2 < 45 * 45) fallTrees.push(p); } }
  const on = life > 0 && fallTrees.length && (ENV.rain || 0) < .6; FALL.visible = !!on; if (!on) return; const w = ENV.t || 0;
  for (let k = 0; k < 48; k++) { const L = FALL.L[k]; L.t -= dt; if (L.t < 0 && L.y <= 0) { if (L.t > -.01 || L.t < -6) { const p = fallTrees[Math.floor(R() * fallTrees.length)]; L.x = p.x + (R() - .5) * 4; L.z = p.z + (R() - .5) * 4; L.y = 3.5 + R() * 2; L.ph = R() * 9; L.t = 0; L.g = 0; } else { _m4.makeScale(0, 0, 0); FALL.setMatrixAt(k, _m4); continue; } }
    if (L.y > .03) { L.ph += dt * 3; L.y -= dt * (.55 + Math.sin(L.ph) * .25); L.x += Math.sin(L.ph * .7) * dt * .6 + dt * .25; L.z += Math.cos(L.ph * .5) * dt * .3; if (L.y <= .03) { L.y = .03; L.g = 4; } }
    else { L.g -= dt; if (L.g <= 0) { L.y = 0; L.t = -R() * 3; _m4.makeScale(0, 0, 0); FALL.setMatrixAt(k, _m4); continue; } }
    const fl = L.y > .03; _q4.setFromEuler(new THREE.Euler(fl ? Math.sin(L.ph) * 1.2 : -Math.PI / 2, L.ph, fl ? Math.cos(L.ph * 1.3) * .8 : 0)); const sc = L.y > .03 ? 1 : Math.min(1, L.g); _m4.compose(_v4.set(L.x, L.y, L.z), _q4, _s4.set(sc, sc, sc)); FALL.setMatrixAt(k, _m4); }
  FALL.instanceMatrix.needsUpdate = true; }
function updateAmb(dt, t, cx, cz) { const life = CFG.ps1 ? 0 : (Q.life || 0); if (!AMB.init) { AMB.init = true; scene.add(AMB.g);
    PIGM = new THREE.InstancedMesh(PIGG, VC, 36); PIGM.castShadow = true; PIGM.frustumCulled = false; AMB.g.add(PIGM); for (let k = 0; k < 36; k++) AMB.pig.push({ x: 0, z: 0, y: 0, a: 0, fly: 0, vx: 0, vz: 0, ph: R() * 9, dead: true });
    BIRDS = new THREE.InstancedMesh(BIRDG, BIRDM, 14); BIRDS.castShadow = true; BIRDS.frustumCulled = false; AMB.g.add(BIRDS); for (let k = 0; k < 14; k++) AMB.birds.push({ r: 14 + R() * 30, a: R() * 7, w: (.25 + R() * .3) * (R() < .5 ? -1 : 1), y: 16 + R() * 10, ph: R() * 7 });
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(220 * 3), 3)); MOTES = new THREE.Points(mg, MOTEM); MOTES.frustumCulled = false; AMB.g.add(MOTES); AMB.mp = []; for (let k = 0; k < 220; k++) AMB.mp.push([cx + (R() - .5) * 60, R() * 7, cz + (R() - .5) * 46, R() * 6]); }
  updateLeaves(dt, cx, cz, life); AMB.g.visible = life > 0; if (!life) return; const rain = ENV.rain || 0, day = ENV.day ?? 1, nP = life > 1 ? 36 : 18;
  // pigeons: peck in little flocks on pavements and squares, scatter when anything comes close
  const pl = window.GAME && GAME.player, px = pl ? pl.x : cx, pz = pl ? pl.z : cz;
  for (let k = 0; k < 36; k++) { const p = AMB.pig[k]; if (k >= nP || day < .25 || rain > .5) { p.dead = true; _m4.makeScale(0, 0, 0); PIGM.setMatrixAt(k, _m4); continue; }
    if (p.dead || Math.hypot(p.x - cx, p.z - cz) > 46) { const fk = Math.floor(k / 6); const ax = cx + (hash(fk, Math.floor(t / 40), 3) - .5) * 64, az = cz + (hash(fk, Math.floor(t / 40), 4) - .5) * 44; const x = ax + (R() - .5) * 4, z = az + (R() - .5) * 4; if (walk(x, z)) { Object.assign(p, { x, z, y: 0, a: R() * 7, fly: 0, dead: false }); } else { _m4.makeScale(0, 0, 0); PIGM.setMatrixAt(k, _m4); continue; } }
    const d = Math.hypot(p.x - px, p.z - pz); if (!p.fly && d < 3.2) { p.fly = 1; const a = Math.atan2(p.z - pz, p.x - px) + (R() - .5); p.vx = Math.cos(a) * 7; p.vz = Math.sin(a) * 7; p.a = Math.atan2(p.vx, p.vz); }
    let pitch = 0, sx = 1; if (p.fly) { p.fly += dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y += (4 + p.fly * 3) * dt; pitch = -.4; sx = 1 + Math.sin(t * 40 + k) * .35; if (p.y > 14) p.dead = true; }
    else { p.ph += dt; if (R() < dt * .5) p.a += (R() - .5) * 2; if (R() < dt * .7) { const nx = p.x + Math.sin(p.a) * .25, nz = p.z + Math.cos(p.a) * .25; if (walk(nx, nz)) { p.x = nx; p.z = nz; } } pitch = Math.max(0, Math.sin(p.ph * 5 + k)) > .8 ? .55 : 0; }
    _m4.compose(_v4.set(p.x, p.y + hillH(p.x, p.z), p.z), _q4.setFromEuler(new THREE.Euler(pitch, p.a, 0, 'YXZ')), _s4.set(sx, 1, 1)); PIGM.setMatrixAt(k, _m4); }
  PIGM.instanceMatrix.needsUpdate = true;
  // swifts wheel overhead (their shadows sweep the streets)
  for (let k = 0; k < 14; k++) { const b = AMB.birds[k]; b.a += b.w * dt; const f = Math.sin(t * 9 + b.ph); _m4.compose(_v4.set(cx + Math.cos(b.a) * b.r, b.y + Math.sin(t * .5 + b.ph) * 2, cz + Math.sin(b.a) * b.r * .8), _q4.setFromEuler(new THREE.Euler(0, -b.a - (b.w > 0 ? 0 : Math.PI), f * .5)), _s4.set(.55, 1 + f * .9, .55)); if (k >= (life > 1 ? 14 : 7) || day < .3 || rain > .6) _m4.makeScale(0, 0, 0); BIRDS.setMatrixAt(k, _m4); }
  BIRDS.instanceMatrix.needsUpdate = true;
  // dust motes / drizzle-mist drifting in the light
  const pa = MOTES.geometry.attributes.position.array; for (let k = 0; k < AMB.mp.length; k++) { const m = AMB.mp[k]; m[3] += dt; m[0] += Math.sin(m[3] * .7 + k) * dt * .3 + dt * .25; m[1] += Math.sin(m[3] * .5 + k * 3) * dt * .12; m[2] += Math.cos(m[3] * .6 + k) * dt * .3;
    if (Math.abs(m[0] - cx) > 32) m[0] = cx - Math.sign(m[0] - cx) * 31; if (Math.abs(m[2] - cz) > 24) m[2] = cz - Math.sign(m[2] - cz) * 23; if (m[1] < 0 || m[1] > 7) m[1] = R() * 7; pa[k * 3] = m[0]; pa[k * 3 + 1] = m[1] + hillH(m[0], m[2]); pa[k * 3 + 2] = m[2]; }
  MOTES.geometry.attributes.position.needsUpdate = true; MOTES.geometry.setDrawRange(0, life > 1 ? 220 : 110); MOTEM.opacity = .22 + day * .25 + (1 - day) * .1; MOTEM.color.setHex(day > .5 ? 0xfff0c8 : 0xffc890);
  // house chimney wisps, stronger on cold nights and in rain
  ambT += dt * (life > 1 ? 9 : 4) * (1 + (1 - day) * .6 + rain * .5); while (ambT > 1) { ambT -= 1; const cs = [...CHUNKS.values()]; const ch = cs[Math.floor(R() * cs.length)]; if (ch && ch.chims && ch.chims.length) { const q = ch.chims[Math.floor(R() * ch.chims.length)]; if (Math.abs(q[0] - cx) < 40 && Math.abs(q[2] - cz) < 30) FX.smoke(q[0], q[1] + 1.7, q[2], 1, .15, 1.1); } }
  // sewer steam from manholes on the roads near the camera
  if (R() < dt * (life > 1 ? 6 : 3) * (.4 + (1 - day) + rain)) { const i = Math.floor((cx + (R() - .5) * 56) / T), j = Math.floor((cz + (R() - .5) * 40) / T); if (kij(i, j) === K.ROAD && hash(i, j, 91) < .06) { const x = i * T + 1, z = j * T + 1; PA.emit(x, .2, z, (R() - .5) * .3, .8 + R() * .5, (R() - .5) * .3, 2 + R() * 1.5, .6, 2.6, .85, .85, .86, .32, -.1, .2); } }
}
// ================= AUDIT (test hook) =================
// Builds every chunk's building mesh off-scene and reports chunks that have building tiles but no / broken geometry.
export function auditChunks() { const bad = [], nan = [], frag = []; let n = 0;
  for (let cx = 0; cx < NCX; cx++) for (let cz = 0; cz < NCZ; cz++) { let bt = 0; for (let j = cz * CH; j < Math.min(NZ, cz * CH + CH); j++) for (let i = cx * CH; i < Math.min(NX, cx * CH + CH); i++) if (kind[ti(i, j)] === K.BLD && !skipT[ti(i, j)]) bt++; // tiles replaced by landmark models have no procedural geometry by design
    if (bt < 4) continue; n++; { const fd = bldField(cx, cz), { F, N } = fd, seen = new Uint8Array(N * N); for (let q = 0; q < N * N; q++) if (F[q] > 0 && !seen[q]) { let a = 0; const st = [q]; seen[q] = 1; while (st.length) { const z = st.pop(); a++; const u = z % N, v = (z / N) | 0; for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const uu = u + du, vv = v + dv; if (uu < 0 || vv < 0 || uu >= N || vv >= N) continue; const w = vv * N + uu; if (!seen[w] && F[w] > 0) { seen[w] = 1; st.push(w); } } } if (a < 10) frag.push([cx, cz, a]); } }
    const out = {}; const m = buildingGeo(cx, cz, out); if (!m) { bad.push([cx, cz, bt, 'none']); continue; }
    const P = m.geometry.attributes.position.array; let k = 0; for (let q = 0; q < P.length; q++) if (!Number.isFinite(P[q])) k++; m.geometry.computeBoundingSphere(); const bs = m.geometry.boundingSphere;
    if (k || !Number.isFinite(bs.radius)) nan.push([cx, cz, k]); if (P.length < 9) bad.push([cx, cz, bt, 'empty']); m.geometry.dispose(); }
  return { chunks: n, bad, nan, frags: frag.length, fragEx: frag.slice(0, 8) }; }
// live check: every streamed chunk that has building tiles must carry a non-empty, finite building mesh
export function auditLive() { const miss = []; let n = 0; for (const [k, ch] of CHUNKS) { let bt = 0; for (let j = ch.cz * CH; j < Math.min(NZ, ch.cz * CH + CH); j++) for (let i = ch.cx * CH; i < Math.min(NX, ch.cx * CH + CH); i++) if (Hb(i, j) > 0) bt++;
    if (bt < 3) continue; n++; const m = ch.g.children.find(o => o.userData.bld); const P = m && m.geometry.attributes.position; if (!m || !P || P.count < 3 || !Number.isFinite((m.geometry.computeBoundingSphere(), m.geometry.boundingSphere.radius))) miss.push([ch.cx, ch.cz, bt]); }
  return { chunks: n, miss, retries: stats.fieldRetry || 0 }; }
if (typeof window !== 'undefined') { window.__auditChunks = auditChunks; window.__auditLive = auditLive; window.__spireAt = (cx, cz) => { const o = {}; const m = buildingGeo(cx, cz, o); if (m) m.geometry.dispose(); return o.spires; }; }
export const _buildChunkG = buildChunkG;
