import * as THREE from './vendor/three.module.js';
import { FACTIONS, MISSIONS, CHAPTERS, DRAMATIS } from './missions.js';
import { K, S, SURF, NX, NZ, T, WX, WZ, kind, surf, dist, DN, LM, LABELS, FLAGGED, tileAt, kAt, pedBlock, vehBlock, snapWalk, POI, POIV, GN, GE, ADJ, nodesIn, nearestNode, edgePts, edgeOther, TRAM, TRAIN, pathAt, pathNear, propsNear, addDynProp, setPropM, dynProps, skipT } from './world.js';
import * as G from './gfx.js';
import * as LIFE from './life.js';
import { LOOKS, gangLook, makePed, animPed, killHorse, makeVeh, animVeh, charMat, LAMPMAT } from './models.js';
const { renderer, scene, camera, hud, FX, cv } = G; const hx = hud.getContext('2d');
let rs = 1880; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const PG = new THREE.PlaneGeometry(1, 1); PG.rotateX(-Math.PI / 2);
const matCache = {};
function spriteMat(key, w, h, draw) { if (!matCache[key]) matCache[key] = new THREE.MeshBasicMaterial({ map: tex(cv(w * 4, h * 4, (g) => { g.scale(4, 4); draw(g, w, h); })), transparent: true, alphaTest: .4 }); return matCache[key]; }
// ================= AUDIO =================
let AC = null, snd = true, master;
function audio() { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination); } catch (e) { } }
function tone(f, d, type = 'square', v = .1, f2, when = 0) { if (!AC || !snd) return; const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02); }
let nbuf; function noise(d, v = .3, fq = 1200, when = 0) { if (!AC || !snd) return; if (!nbuf) { nbuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const a = nbuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
  const t = AC.currentTime + when, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = nbuf; f.type = 'lowpass'; f.frequency.value = fq; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + d + .02); }
const SFX = { pop: () => { noise(.1, .35, 3200); tone(260, .05, 'square', .05, 90); }, lebel: () => { noise(.09, .55, 5000); tone(420, .05, 'square', .07, 120); }, click: () => { tone(2200, .02, 'square', .04); tone(1400, .03, 'square', .03, 0, .03); },
  putt: (f = 1) => { tone(55 * f, .06, 'sawtooth', .05, 40 * f); noise(.04, .08, 500); }, pedal: () => tone(900 + Math.random() * 200, .02, 'triangle', .015), shot: () => { noise(.18, .5, 2500); tone(120, .1, 'square', .1, 50); }, shotgun: () => { noise(.35, .7, 1500); }, rifle: () => { noise(.12, .5, 4000); tone(300, .08, 'square', .06, 80); },
  boom: () => { noise(1.2, .9, 400); tone(60, .8, 'sine', .4, 25); }, whistle: () => { tone(2600, .5, 'sine', .12); tone(2750, .25, 'sine', .08, 0, .12); }, hit: () => noise(.08, .3, 800), hoof: () => { tone(180 + Math.random() * 40, .05, 'triangle', .07); },
  pager: () => { tone(1800, .08, 'square', .05); tone(1800, .08, 'square', .05, 0, .12); }, crash: () => { noise(.4, .6, 900); }, cash: () => { tone(1320, .08, 'square', .06); tone(1760, .15, 'square', .06, 0, .08); }, swing: () => noise(.1, .15, 3000), bell: () => { tone(523, 1.2, 'sine', .15); tone(784, 1.2, 'sine', .08); } };
// cabaret tune (cancan-ish) — simple sequencer
const TUNE = [72, 0, 74, 72, 77, 76, 0, 74, 72, 0, 74, 72, 79, 77, 0, 76, 74, 0, 76, 74, 81, 79, 77, 76, 74, 72, 71, 72, 74, 0, 72, 0];
let tuneT = 0, tuneI = 0, musicOn = false;
function musicTick(dt, vol) { if (!AC || !snd || vol <= 0.01) return; tuneT -= dt; if (tuneT > 0) return; tuneT = .16; const n = TUNE[tuneI++ % TUNE.length]; if (n) { tone(440 * 2 ** ((n - 69) / 12), .14, 'square', .03 * vol); if (tuneI % 4 === 1) tone(440 * 2 ** ((n - 81) / 12), .3, 'triangle', .05 * vol); } }
// ================= PROPS & LIGHTS =================
// world props (lamps, trees, kiosks...) are streamed & instanced by gfx.js/world.js
const MANHOLES = ['catacombs', 'pantheon', 'halles', 'bastille', 'gare', 'tertre', 'invalides', 'republique'].filter(k => POI[k]).map(k => { const [x, z] = POI[k]; return addDynProp('manhole', x + 1.2, z + 1.2, { r: 0, hp: 1e9 }); });
const tempProps = [];
// ================= ENTITIES =================
const peds = [], vehs = [], fx = [], projs = [], pickups = [];
const PEDT = {
  civ: { hp: 30, spd: 2.2, mats: [['#3a3a46', '#222'], ['#6a4a3a', '#3a2a1a'], ['#7a2a3a', '#d8c8a0'], ['#4a5a3a', '#333'], ['#8a7a5a', '#5a4a3a'], ['#2a2a2a', '#111'], ['#a05a6a', '#e0b0c0']] },
  cop: { hp: 50, spd: 5.4, mats: [['#1e2a5a', '#14183a']] }, gend: { hp: 80, spd: 10.5, mats: [['#2a2a6a', '#d0b040']], mounted: true },
  soldier: { hp: 60, spd: 4, mats: [['#2a3a7a', '#b02020']] }, gang: { hp: 45, spd: 5.2, mats: [['#c8c8c8', '#a01818']] },
  vip: { hp: 60, spd: 3.6, mats: [['#e0e0f0', '#c03080']] }, boss: { hp: 160, spd: 4.6, mats: [['#111', '#f4c430']] },
};
const FCOL = { apache: ['#d8d8d8', '#a01818'], avant: ['#6a4a8a', '#c8a020'], velvet: ['#4a1a4a', '#111'], crimson: ['#8a1a1a', '#222'], side: ['#555', '#a01818'] };
const CIVL = ['bourgeois', 'bourgeois', 'clerk', 'worker', 'worker', 'lady', 'lady', 'maid', 'artist'];
function lookFor(type, col) { if (type === 'civ') { const k = CIVL[Math.floor(rnd() * CIVL.length)]; lookFor.k = k; return LOOKS[k](); } if (type === 'gang') return col ? gangLook(col[0], col[1]) : LOOKS.apache(); return (LOOKS[type] || LOOKS.clerk)(); }
function mkPedMesh(look, mounted) { const P = makePed(look, mounted); scene.add(P.g); P.g.userData.P = P; return P.g; }
function spawnPed(type, x, z, o = {}) { const d = PEDT[type];
  const p = Object.assign({ type, x, z, a: rnd() * 6.28, hp: d.hp, spd: d.spd, alive: true, t: 0, cd: rnd(), wander: rnd() * 6.28, flee: 0, mounted: !!d.mounted }, o);
  if (!o.inVeh) p.mesh = mkPedMesh(lookFor(o.look || type, o.col), p.mounted); else p.mesh = new THREE.Group(); p.kind = o.look || (type === 'civ' ? lookFor.k : type); p.uid = ++spawnPed.n; p.lx = x; p.lz = z; peds.push(p); return p; } spawnPed.n = 0;
// named story figures: pick their look from the step's speaker / escorted name (looks only; ped type and logic unchanged)
const NAMED = { Henri: 'vautrin', Vautrin: 'vautrin', Maza: 'maza', Lucie: 'lucie', Vaneau: 'vaneau' };
function whoLook(s, k = 0) { if (s.t === 'eaves') { const sp = [...new Set((s.say || []).map(l => l.split(':')[0].trim()))]; return NAMED[sp[k]]; } const m = /^(?:Escort|Drive|Walk|Get|Bring|Collect) (\w+)/.exec(s.text || ''); return m ? NAMED[m[1]] : undefined; }
function removePed(p) { scene.remove(p.mesh); if (p.mesh.userData.P) p.mesh.userData.P.g.traverse(()=>{}); const i = peds.indexOf(p); if (i >= 0) peds.splice(i, 1); }
const VT = {
  brougham: { len: 4.2, wid: 2.2, horses: 2, spd: 23, acc: 15, hp: 110, body: '#1a1a1a', roof: '#3a2a2a', turn: 2.4 },
  phaeton: { len: 3.6, wid: 2, horses: 2, spd: 30, acc: 22, hp: 70, body: '#c0a040', roof: '#7a2a1a', turn: 2.9 },
  barouche: { len: 4.8, wid: 2.4, horses: 2, spd: 20, acc: 11, hp: 240, body: '#2a1a3a', roof: '#4a2a5a', turn: 2.0 },
  gig: { len: 2.8, wid: 1.8, horses: 1, spd: 21, acc: 17, hp: 55, body: '#7a5a30', roof: '#a08050', turn: 3.2 },
  omnibus: { len: 6.5, wid: 2.6, horses: 3, spd: 15, acc: 7, hp: 420, body: '#c8b060', roof: '#3a5a3a', turn: 1.5 },
  police: { len: 4.2, wid: 2.2, horses: 2, spd: 27, acc: 18, hp: 160, body: '#0a0a1e', roof: '#1e2a5a', turn: 2.6 },
  // 1890: two-wheelers and the first petrol carriages (ride = rider sits on top, visible; motor = petrol engine)
  bicycle: { len: 1.8, wid: .7, horses: 0, spd: 17, acc: 13, hp: 25, body: '#1a1a1a', roof: '#6a4a2a', turn: 3.6, ride: 'pedal', n: 'Safety Bicycle' },
  pennyfarthing: { len: 1.9, wid: .8, horses: 0, spd: 20, acc: 8, hp: 18, body: '#1a1a1a', roof: '#5a3a1a', turn: 2.1, ride: 'pedal', n: 'Penny-Farthing' },
  velocipede: { len: 1.9, wid: .8, horses: 0, spd: 11, acc: 8, hp: 25, body: '#6a4a2a', roof: '#3a2a1a', turn: 2.8, ride: 'pedal', n: 'Michaux Velocipede' },
  panhard: { len: 3.1, wid: 1.6, horses: 0, spd: 19, acc: 6, hp: 130, body: '#4a1a1a', roof: '#1a1a1a', turn: 1.8, motor: 1, n: 'Panhard et Levassor' },
  peugeot: { len: 2.7, wid: 1.4, horses: 0, spd: 17, acc: 6.5, hp: 90, body: '#1a3a2a', roof: '#c8a040', turn: 2.1, motor: 1, n: 'Peugeot Type 2 (prototype)' },
  benz: { len: 2.7, wid: 1.4, horses: 0, spd: 13, acc: 4.5, hp: 70, body: '#1a1a1a', roof: '#3a2a1a', turn: 1.7, motor: 1, n: 'Benz Patent-Motorwagen' },
  tram: { len: 7, wid: 2.6, horses: 0, spd: 12, acc: 4, hp: 900, body: '#3a5a3a', roof: '#aa3a1a', turn: 0, rail: 'tram' },
  train: { len: 8, wid: 2.6, horses: 0, spd: 22, acc: 5, hp: 5000, body: '#1a1a1a', roof: '#4a1a1a', turn: 0, rail: 'train' },
};
function registerVehicle(type, def, inTraffic = 0) { VT[type] = def; for (let k = 0; k < inTraffic; k++) TRAFFIC_T.push(type); }
function spawnVeh(type, x, z, a, o = {}) { const d = VT[type], V = makeVeh(type, d), g = V.g;
  const v = Object.assign({ type, x, z, a, vx: 0, vz: 0, av: 0, hp: d.hp, horseHp: d.horses ? 60 * d.horses : 1e9, alive: true, driver: null, mesh: g, V, body: V.body, hs: V.horses.map(h => h.g), d, burn: 0, t: 0, wreck: false, lx: x, lz: z }, o);
  scene.add(g); vehs.push(v); return v; }
function spawnRail(type, s, o = {}) { const P = type === 'tram' ? TRAM : TRAIN; const [x, z, a] = pathAt(P, s); const v = spawnVeh(type, x, z, a, Object.assign({ railAuto: true, rp: P, s, dirS: 1 }, o)); return v; }
function removeVeh(v) { scene.remove(v.mesh); const i = vehs.indexOf(v); if (i >= 0) vehs.splice(i, 1); }
// ================= PLAYER =================
const START = [POI.chien[0] + 8, POI.chien[1] + 6]; { const s = snapWalk(Math.floor(START[0] / T), Math.floor(START[1] / T), false); START[0] = s[0]; START[1] = s[1]; }
const player = { x: START[0], z: START[1], a: 0, hp: 100, alive: true, veh: null, w: 0, ammo: { fists: 1e9 }, mag: {}, rel: 0, kick: 0, cd: 0, punch: 0, walkT: 0, inv: 0, god: false };
player.mesh = mkPedMesh(LOOKS.player(), false); player.lx = player.x; player.lz = player.z;
// ================= ARMS OF PARIS, 1890 =================
// Period arms only, all manually operated (no repeaters faster than a hand can cock, no automatic fire). Fields:
// mag = rounds held, rate = s between shots (cocking / double-action pull), rel = reload s (per round if one:true), spr = base cone (rad),
// eff = effective range (beyond it the cone widens and damage falls), smoke = black-powder cloud size (0 = smokeless), mis = misfire chance,
// kick = recoil (adds to the cone for the next shots + camera shake), stop = stopping power (stagger/knock-back).
const WEAP = [
  { id: 'fists', n: 'Savate', melee: true, dmg: 12, rate: .45, rng: 1.9, note: 'French boxing: kicks and open-hand blows' },
  { id: 'cosh', n: 'Cosh (casse-tête)', melee: true, dmg: 22, rate: .7, rng: 1.7, pick: 1e9, stun: 1 },
  { id: 'knife', n: 'Clasp Knife', melee: true, dmg: 30, rate: .5, rng: 1.5, pick: 1e9 },
  { id: 'swordcane', n: 'Sword-Cane', melee: true, dmg: 38, rate: .55, rng: 2.3, pick: 1e9 },
  { id: 'brick', n: 'Cobblestone', throw: 'brick', dmg: 40, rate: .7, pick: 6 },
  { id: 'apache', n: 'Apache Revolver-Knife', dmg: 18, rate: .8, mag: 6, rel: 1.3, one: true, rng: 9, eff: 4, spr: .2, smoke: .8, mis: .12, kick: .12, stop: .3, snd: 'pop', pin: true, meleeDmg: 26, pick: 18, note: 'Pinfire pepperbox: no barrel to speak of, a folding blade and knuckle-duster' },
  { id: 'pinfire', n: 'Lefaucheux Pinfire', dmg: 24, rate: .75, mag: 6, rel: 1.1, one: true, rng: 34, eff: 15, spr: .07, smoke: 1.3, mis: .06, kick: .18, stop: .5, snd: 'shot', pin: true, pick: 24, note: '12 mm pinfire, single-action: cock the hammer every shot' },
  { id: 'velodog', n: 'Velo-Dog', dmg: 14, rate: .5, mag: 5, rel: .9, one: true, rng: 22, eff: 8, spr: .08, smoke: .7, mis: .02, kick: .07, stop: .2, snd: 'pop', pick: 25, note: '5.5 mm pocket revolver for cyclists set upon by dogs' },
  { id: 'derringer', n: 'Remington Derringer', dmg: 28, rate: .45, mag: 2, rel: 2.4, rng: 16, eff: 6, spr: .1, smoke: 1.1, mis: .03, kick: .25, stop: .6, snd: 'shot', pick: 12, note: '.41 rimfire over-under, two shots then a slow reload' },
  { id: 'revolver', n: 'Mle 1873 Revolver', dmg: 32, rate: .55, mag: 6, rel: .75, one: true, rng: 40, eff: 18, spr: .05, smoke: 1.4, mis: .01, kick: .2, stop: .7, snd: 'shot', pick: 24, note: '11 mm army revolver, loaded one chamber at a time through the gate' },
  { id: 'mle1892', n: 'Mle 1892 Revolver (prototype)', dmg: 26, rate: .42, mag: 6, rel: 2.2, rng: 42, eff: 20, spr: .04, smoke: .25, mis: .01, kick: .14, stop: .55, snd: 'pop', pick: 18, rare: true, note: '8 mm smokeless, swing-out cylinder: a trial piece from Saint-Étienne' },
  { id: 'shotgun', n: 'Double-Barrel Shotgun', dmg: 20, rate: .3, mag: 2, rel: 2.3, rng: 20, eff: 10, spr: .32, pellets: 8, smoke: 2.2, mis: .01, kick: .5, stop: 1, snd: 'shotgun', pick: 16, note: 'Hammer side-by-side, 12 bore black powder' },
  { id: 'gras', n: 'Gras Mle 1874 Rifle', dmg: 70, rate: .2, mag: 1, rel: 1.9, rng: 70, eff: 45, spr: .015, smoke: 2, mis: .01, kick: .45, stop: 1, snd: 'rifle', pick: 12, note: '11 mm single-shot bolt-action, black powder' },
  { id: 'lebel', n: 'Lebel Mle 1886 Rifle', dmg: 62, rate: 1.1, mag: 8, rel: .55, one: true, rng: 80, eff: 55, spr: .01, smoke: .15, mis: 0, kick: .35, stop: 1, snd: 'lebel', pick: 16, note: '8 mm smokeless, 8-round tube magazine fed one cartridge at a time; work the bolt between shots' },
  { id: 'dynamite', n: 'Dynamite', throw: 'dynamite', rate: 1, pick: 5 },
  { id: 'molotov', n: 'Petrol Bottle', throw: 'molotov', rate: .8, pick: 6 },
];
const WI = Object.fromEntries(WEAP.map((w, i) => [w.id, i])); WI.winchester = WI.lebel; WI.rifle = WI.lebel; // old save / mission ids
const WALIAS = { winchester: 'lebel', rifle: 'lebel' };
function giveWeapon(id, n) { id = WALIAS[id] || id; const w = WEAP[WI[id]]; player.ammo[id] = Math.min(999999, (player.ammo[id] || 0) + (n || w.pick)); if (w.mag && player.mag[id] === undefined) { const k = Math.min(w.mag, player.ammo[id]); player.mag[id] = k; player.ammo[id] -= k; if (player.ammo[id] <= 0 && k > 0) player.ammo[id] = 0; } }
function haveW(i) { const w = WEAP[i]; return (player.ammo[w.id] || 0) > 0 || (w.mag && (player.mag[w.id] || 0) > 0); }
function cycleW(d) { player.rel = 0; for (let k = 1; k <= WEAP.length; k++) { const i = (player.w + d * k + WEAP.length * 3) % WEAP.length; if (haveW(i)) { player.w = i; return; } } }
function startReload() { const w = WEAP[player.w]; if (!w.mag || player.rel > 0) return; if ((player.mag[w.id] || 0) >= w.mag || !(player.ammo[w.id] > 0)) return; player.rel = w.one ? w.rel : w.rel; SFX.click(); }
function tickReload(dt) { const w = WEAP[player.w]; if (!w.mag || player.rel <= 0) return; player.rel -= dt; if (player.rel > 0) return; const id = w.id;
  if (w.one) { if (player.ammo[id] > 0) { player.mag[id] = (player.mag[id] || 0) + 1; player.ammo[id]--; SFX.click(); } if (player.mag[id] < w.mag && player.ammo[id] > 0) player.rel = w.rel; else player.rel = 0; }
  else { const k = Math.min(w.mag - (player.mag[id] || 0), player.ammo[id]); player.mag[id] = (player.mag[id] || 0) + k; player.ammo[id] -= k; player.rel = 0; SFX.click(); } }
let money = 0, mult = 1, respect = { apache: 0, avant: 0, velvet: 0, crimson: 0 }, done = {}, choices = {}, gallery = [], heat = 0, wanted = 0, sightT = 0;
let gameTime = 20.5, rain = 0, rainTarget = 0, weatherT = 60;
const pagerQ = []; let pagerT = 0, pagerMsg = '', bigMsg = '', bigT = 0, districtMsg = '', districtT = 0, lastDistrict = -1;
function pager(msg, t = 5) { pagerQ.push([msg, t]); }
const sayQ = []; let sayMsg = '', sayT = 0; function say(line, t) { sayQ.push([line, t || Math.min(9, 2.6 + line.length * .045)]); }
function big(msg, t = 3) { bigMsg = msg; bigT = t; }
function addMoney(n, raw) { const v = raw ? n : n * mult; money = Math.max(0, money + v); if (n > 0) SFX.cash(); return v; }
function addHeat(n) { if (player.god === 'noheat') return; heat = Math.min(40, heat + n); }
// ================= INPUT =================
const keys = {}; const pressed = {};
addEventListener('keydown', e => { audio(); if (!keys[e.code]) pressed[e.code] = true; keys[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
let gpPrev = {};
// ---- mouse: the cursor is a point on the street; hold/click left to walk or drive toward it, right to aim/brake ----
const mouse = { sx: 0, sy: 0, wx: 0, wz: 0, L: false, R: false, clickL: false, clickR: false, wheel: 0, on: false };
const _rc = new THREE.Raycaster(), _pl0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _hv = new THREE.Vector3(), _nv = new THREE.Vector2();
addEventListener('mousemove', e => { mouse.sx = e.clientX; mouse.sy = e.clientY; mouse.on = true; });
addEventListener('mousedown', e => { if (state !== 'play' || paused || e.target.closest && e.target.closest('button,#menu,#gfxSet,.panel')) return; audio(); if (e.button === 0) { mouse.L = true; mouse.clickL = true; } if (e.button === 2) { mouse.R = true; mouse.clickR = true; } });
addEventListener('mouseup', e => { if (e.button === 0) mouse.L = false; if (e.button === 2) mouse.R = false; });
addEventListener('contextmenu', e => { if (state === 'play') e.preventDefault(); });
addEventListener('wheel', e => { if (state === 'play') mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
addEventListener('blur', () => { mouse.L = mouse.R = false; for (const k in keys) keys[k] = false; });
function mouseWorld() { _nv.set(mouse.sx / innerWidth * 2 - 1, -(mouse.sy / innerHeight) * 2 + 1); _rc.setFromCamera(_nv, camera); if (_rc.ray.intersectPlane(_pl0, _hv) && isFinite(_hv.x)) { mouse.wx = _hv.x; mouse.wz = _hv.z; } }
function readInput() { const I = { mx: 0, my: 0, fire: false, enter: false, prev: false, next: false, pause: false, stick: false, thr: 0, steer: 0, mouse: false, run: false, aim: false, reload: false, click: false, hand: false };
  mouseWorld(); I.mouse = mouse.on; I.run = !!(keys.ShiftLeft || keys.ShiftRight || keys.Space); I.aim = mouse.R; I.click = mouse.clickL; I.hand = !!keys.Space; I.shift = !!(keys.ShiftLeft || keys.ShiftRight);
  // on foot: right = aim, left (while aiming) = fire. In a vehicle: left = drive toward the cursor, right = brake / reverse, Ctrl = shoot toward the cursor
  I.fire = (mouse.R && mouse.clickL) || keys.ControlLeft || keys.ControlRight; I.enter = pressed.KeyF || pressed.Enter; I.prev = pressed.KeyQ || mouse.wheel < 0; I.next = pressed.KeyE || mouse.wheel > 0; I.pause = pressed.Escape || pressed.KeyP; I.reload = pressed.KeyR;
  mouse.wheel = 0; mouse.clickL = false; mouse.clickR = false;
  const gps = navigator.getGamepads ? navigator.getGamepads() : []; for (const gp of gps) { if (!gp) continue; const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; const b = i => gp.buttons[i] && gp.buttons[i].pressed;
    if (Math.hypot(ax, ay) > .25) { I.mx = ax; I.my = ay; I.stick = true; } if (b(0) || b(7)) I.fire = true; if (b(6)) I.aim = true; if (b(10) || b(2)) I.run = true;
    if (b(14)) { I.mx = -1; I.stick = true; } if (b(15)) { I.mx = 1; I.stick = true; } if (b(12)) { I.my = -1; I.stick = true; } if (b(13)) { I.my = 1; I.stick = true; }
    const e = (i, k) => { if (b(i) && !gpPrev[i]) I[k] = true; }; e(3, 'enter'); e(1, 'enter'); e(4, 'prev'); e(5, 'next'); e(9, 'pause'); gpPrev = Object.fromEntries(gp.buttons.map((x, i) => [i, x.pressed])); break; }
  for (const k in pressed) pressed[k] = false; return I; }
// ================= HELPERS =================
// Collision against what is drawn: the signed building field the block meshes are contoured from (G.bldAt), sampled around
// a body radius, plus water/out-of-map from the grid. Falls back to the tile grid where a chunk's field is not built yet.
const RING8 = [[1, 0], [.707, .707], [0, 1], [-.707, .707], [-1, 0], [-.707, -.707], [0, -1], [.707, -.707]];
function bldHit(x, z) { const t = tileAt(x, z); if (t < 0) return true; if (kind[t] === K.BLD && skipT[t]) return true; /* landmark footprints: the landmark model covers the tile */ const f = G.bldAt(x, z); if (f === null) return kind[t] === K.BLD; return f > -.02; }
function solidPt(x, z, veh) { const k = kAt(x, z); if (k === K.WATER || (veh && k === K.STAIR)) return true; if (x < 1 || z < 1 || x > WX - 1 || z > WZ - 1) return true; return bldHit(x, z); }
function solidBody(x, z, r, veh) { if (solidPt(x, z, veh)) return true; for (const [c, s] of RING8) if (solidPt(x + c * r, z + s * r, veh)) return true; return false; }
function propHit(x, z, r) { for (const p of propsNear(x, z)) if (p.r > 0 && p.alive !== false && d2(p.x, p.z, x, z) < (p.r + r) ** 2) return p; return null; }
const ang = (a) => { while (a > Math.PI) a -= 6.2832; while (a < -Math.PI) a += 6.2832; return a; };
const d2 = (a, b, x, z) => (a - x) ** 2 + (b - z) ** 2;
const ppos = () => player.veh ? [player.veh.x, player.veh.z] : [player.x, player.z];
function copsNear(r) { const [px, pz] = ppos(); return peds.some(p => p.alive && (p.type === 'cop' || p.type === 'gend') && d2(p.x, p.z, px, pz) < r * r) || vehs.some(v => v.police && v.alive && d2(v.x, v.z, px, pz) < r * r); }
function crime(n) { addHeat(copsNear(30) ? n : n * .5); }
// ================= COMBAT =================
function tracer(x1, z1, x2, z2) { FX.tracer(x1, z1, x2, z2); }
function spr(mat, x, z, s, t, y = 1.5, grow = 0) { const m = new THREE.Mesh(PG, mat); m.position.set(x, y, z); m.scale.set(s, 1, s); scene.add(m); fx.push({ m, t, grow, kill: true }); return m; }
const PROJM = { brick: new THREE.Mesh(new THREE.BoxGeometry(.35, .25, .35), new THREE.MeshLambertMaterial({ color: 0x8a8478 })), dynamite: new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .5, 6).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xc02020, emissive: 0x401000 })), molotov: new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .45, 6).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x60c040, emissive: 0x203010 })) };
function projMesh(t) { const m = PROJM[t].clone(); scene.add(m); fx.push({ m, t: 99, kill: true }); return m; }
function damagePed(p, dmg, src) { if (!p.alive || p.god) return; p.hp -= dmg; p.flee = 6; SFX.hit(); if (p.hp <= 0) killPed(p, src); else if (p.type === 'civ') p.hostile = false; }
function killPed(p, src) { p.alive = false; FX.blood(p.x, p.z, 14); p.deadT = 20;
  if (src === 'player') { addMoney(p.type === 'cop' || p.type === 'soldier' || p.type === 'gend' ? 100 : 20); crime(p.type === 'cop' || p.type === 'gend' || p.type === 'soldier' ? 6 : 2); if (rnd() < .25) dropPickup(p.x, p.z); } }
function damageVeh(v, dmg, horse, src) { if (!v.alive || v.d.rail) return; if (horse && v.d.horses) { v.horseHp -= dmg; if (v.horseHp <= 0 && !v.horseDead) { v.horseDead = true; { const sp = Math.hypot(v.vx, v.vz); v.av = (rnd() < .5 ? -1 : 1) * (5 + sp * .5); v.vx *= 1.1; v.vz *= 1.1; v.hp -= 10; if (v.driver && v.driver.inVeh !== undefined) {} } v.V.horses.forEach(killHorse); FX.blood(v.x + Math.cos(v.a) * (v.d.len / 2 + 1.2), v.z + Math.sin(v.a) * (v.d.len / 2 + 1.2), 16); pager(v === player.veh ? 'Your horses are down!' : 'Horses down!', 2); } return; }
  v.hp -= dmg; if (v.hp <= 0 && !v.burn) { v.burn = 3; } if (src === 'player' && v.police) crime(.5); }
function explode(x, z, r = 6, dmg = 160) { SFX.boom(); FX.explosion(x, z, r);
  for (const p of peds) if (p.alive && d2(p.x, p.z, x, z) < r * r) damagePed(p, dmg, 'player');
  for (const v of vehs) if (v.alive && d2(v.x, v.z, x, z) < (r + 2) ** 2) { damageVeh(v, dmg, false, 'player'); damageVeh(v, dmg * .5, true, 'player'); }
  for (const p of propsNear(x, z)) if (d2(p.x, p.z, x, z) < r * r) damageProp(p, dmg);
  if (!player.veh && d2(player.x, player.z, x, z) < r * r) hurtPlayer(dmg * .5); camShake = .6; }
function damageProp(p, dmg) { if (!p.alive || p.hp > 1e8) return; p.hp -= dmg; if (p.hp <= 0) { p.alive = false; setPropM(p); FX.dust(p.x, p.z, 6); FX.sparks(p.x, p.z, 6, 4); if (p.type === 'wallace' || p.type === 'trough') FX.splash(p.x, p.z); SFX.crash(); } }
function hurtPlayer(d) { if (player.god === true || !player.alive) return; player.hp -= d; flash = .25; if (player.hp <= 0) die('WASTED'); }
let flash = 0, camShake = 0;
// hitscan from (x,z) dir a; returns end point
function hitscan(x, z, a, rng, dmg0, src, ignore, w) { const dx = Math.cos(a), dz = Math.sin(a); let ex = x, ez = z, dmg = dmg0;
  for (let s = .5; s < rng; s += .5) { ex = x + dx * s; ez = z + dz * s; if (w && w.eff && s > w.eff) dmg = dmg0 * Math.max(.25, 1 - (s - w.eff) / (rng - w.eff) * .75); 
    for (const p of peds) if (p.alive && !p.inVeh && p !== ignore && Math.abs(p.x - ex) < .8 && Math.abs(p.z - ez) < .8) { damagePed(p, dmg, src); FX.blood(ex, ez, 5); if (w && w.stop && p.alive) { const nx = p.x + dx * w.stop * .6, nz = p.z + dz * w.stop * .6; if (!pedBlock(nx, nz)) { p.x = nx; p.z = nz; } p.stag = w.stop * .8; } return [ex, ez]; } if (pedBlock(ex, ez) && kAt(ex, ez) === K.BLD) { FX.sparks(ex, ez, 4, 3, 1.3); FX.dust(ex, ez, 1); break; }
    for (const v of vehs) { if (!v.alive || v === ignore) continue; const lx = (ex - v.x) * Math.cos(v.a) + (ez - v.z) * Math.sin(v.a), lz = -(ex - v.x) * Math.sin(v.a) + (ez - v.z) * Math.cos(v.a);
      const front = v.d.horses ? v.d.len / 2 + 2.4 + (v.d.horses === 3 ? 2.8 : 0) : 0; const hb = lx > v.d.len / 2 ? .7 : .2; if (Math.abs(lz) < v.d.wid / 2 + hb && lx > -v.d.len / 2 && lx < v.d.len / 2 + front) { damageVeh(v, dmg, lx > v.d.len / 2, src); if (v === player.veh) hurtPlayer(dmg * .15); return [ex, ez]; } }
    if (src !== 'player' && !player.veh && player !== ignore && Math.abs(player.x - ex) < .7 && Math.abs(player.z - ez) < .7) { hurtPlayer(dmg); return [ex, ez]; }
    for (const p of propsNear(ex, ez)) if (p.r > 0 && d2(p.x, p.z, ex, ez) < p.r * p.r) { damageProp(p, dmg); return [ex, ez]; } }
  return [ex, ez]; }
function fireWeapon(x, z, a, src = 'player', ignore) { const w = WEAP[player.w]; if (player.cd > 0) return false; if (w.mag) { if (player.rel > 0 && !(w.one && (player.mag[w.id] || 0) > 0)) return false; player.rel = 0; if (!(player.mag[w.id] > 0)) { player.cd = .35; SFX.click(); startReload(); return false; } } player.cd = w.rate;
  if (w.melee) { SFX.swing(); const hx_ = x + Math.cos(a) * w.rng * .7, hz = z + Math.sin(a) * w.rng * .7; let hit = false;
    for (const p of peds) if (p.alive && d2(p.x, p.z, hx_, hz) < (w.rng * .8) ** 2) { damagePed(p, w.dmg, src); hit = true; if (p.type === 'cop' || p.type === 'gend') crime(2); else crime(.4); break; }
    if (!hit) for (const p of propsNear(hx_, hz)) if (d2(p.x, p.z, hx_, hz) < (p.r + 1) ** 2) { damageProp(p, w.dmg); hit = true; break; }
    if (!hit) for (const v of vehs) if (v.alive && v !== player.veh && d2(v.x, v.z, hx_, hz) < 9) { damageVeh(v, w.dmg * .5, false, src); break; }
    player.punch = .2; return true; }
  if (w.mag) { if (w.pin && rnd() < w.mis) { SFX.click(); pager('Misfire!', .8); player.cd = w.rate + .4; return true; } else if (rnd() < w.mis) { SFX.click(); pager('Misfire!', .8); player.mag[w.id]--; return true; } player.mag[w.id]--; if (!player.mag[w.id] && !(player.ammo[w.id] > 0)) setTimeout(() => { if (!haveW(player.w)) cycleW(1); }, 0); else if (!player.mag[w.id]) setTimeout(startReload, 250); }
  else if (!w.melee) { player.ammo[w.id]--; if (player.ammo[w.id] <= 0) { delete player.ammo[w.id]; setTimeout(() => cycleW(1), 0); } }
  if (w.throw) { projs.push({ type: w.throw, x, z, vx: Math.cos(a) * 16, vz: Math.sin(a) * 16, t: w.throw === 'dynamite' ? 1.6 : .7, m: projMesh(w.throw) }); SFX.swing(); return true; }
  SFX[w.snd](); crime(copsNear(25) ? 1.2 : .3); FX.muzzle(x + Math.cos(a) * .4, z + Math.sin(a) * .4, a, w.id === 'shotgun' || w.id === 'gras');
  if (w.smoke > .5) FX.smoke(x + Math.cos(a) * 1.2, 1.3, z + Math.sin(a) * 1.2, Math.round(2 + w.smoke * 3), .1, 1 + w.smoke); // black powder: a lingering white cloud
  const cone = (w.spr || .04) + player.kick + (player.veh ? .06 : 0) + (player.runT > 0 ? .05 : 0); player.kick = Math.min(.4, player.kick + (w.kick || 0) * .5); camShake = Math.max(camShake, (w.kick || .1) * .5);
  for (let k = 0; k < (w.pellets || 1); k++) { const aa = a + (rnd() - .5) * cone * 2; const e = hitscan(x, z, aa, w.rng, w.dmg, src, ignore || player.veh, w); tracer(x, z, e[0], e[1]); }
  for (const p of peds) if (p.alive && p.type === 'civ' && d2(p.x, p.z, x, z) < 400) p.flee = 6;
  return true; }
function npcShoot(sh, tx, tz, dmg = 8, acc = .15, wid = 'revolver') { const w = WEAP[WI[wid]] || WEAP[WI.revolver]; if (w.pin && rnd() < w.mis) { SFX.click(); return; } const dd = Math.hypot(tx - sh.x, tz - sh.z); acc *= 1 + Math.max(0, dd - (w.eff || 15)) / 15; const a = Math.atan2(tz - sh.z, tx - sh.x) + (rnd() - .5) * acc * 2; (SFX[w.snd] || SFX.shot)(); if (w.smoke > .5) FX.smoke(sh.x + Math.cos(a), 1.3, sh.z + Math.sin(a), 3, .1, 1.5); FX.muzzle(sh.x, sh.z, a); const e = hitscan(sh.x + Math.cos(a), sh.z + Math.sin(a), a, 40, dmg, 'npc', sh); tracer(sh.x, sh.z, e[0], e[1]);
  if (player.veh && d2(e[0], e[1], player.veh.x, player.veh.z) < 30) { } }
// ================= VEHICLE PHYSICS =================
function vehCorners(v, x, z, a) { const c = Math.cos(a), s = Math.sin(a), L = v.d.len / 2 + (v.d.horses ? 2.2 : 0), B = -v.d.len / 2, Wd = v.d.wid / 2, pts = v._pts || (v._pts = []); let n = 0;
  const P = v._loc || (v._loc = (() => { const q = []; const nx = Math.max(2, Math.ceil((L - B) / 1.2)); for (let k = 0; k <= nx; k++) { const lx = B + (L - B) * k / nx; q.push([lx, Wd], [lx, -Wd]); } q.push([L, 0], [B, 0]); return q; })());
  for (const [lx, lz] of P) { const p = pts[n] || (pts[n] = [0, 0]); p[0] = x + lx * c - lz * s; p[1] = z + lx * s + lz * c; n++; } pts.length = n; return pts; }
function vPen(v, x, z, a) { let n = 0; for (const p of vehCorners(v, x, z, a)) if (solidPt(p[0], p[1], true)) n++; return n; }
function driveVeh(v, thr, steer, dt, handbrake) { const d = v.d; if (d.rail) return driveRail(v, thr, dt);
  const t = tileAt(v.x, v.z), sf = SURF[t >= 0 ? surf[t] : 0]; let grip = sf.grip * (1 - rain * .35), top = d.spd * sf.spd;
  if (v.horseDead || v.wreck) { thr = 0; top = 0; }
  const fx_ = Math.cos(v.a), fz = Math.sin(v.a); let fwd = v.vx * fx_ + v.vz * fz, lat = -v.vx * fz + v.vz * fx_;
  if (thr > 0) fwd += d.acc * thr * dt * (fwd < 0 ? 2 : 1); else if (thr < 0) fwd += (fwd > 1 ? -d.acc * 2.2 : -d.acc * .6) * -thr * dt;
  fwd = Math.max(-top * .35, Math.min(top, fwd)); if (Math.abs(thr) < .05) fwd *= (1 - 1.2 * dt);
  if (fwd > top) fwd -= (fwd - top) * 3 * dt;
  lat *= Math.max(0, 1 - (handbrake ? 1.2 : 7 * grip) * dt);
  // horses and drivers can pivot a stopped carriage: a little steering authority even at a standstill when the reins are worked
  const turnK = Math.max(Math.abs(thr) > .05 ? (d.horses ? .35 : d.ride ? .45 : .2) : 0, Math.min(1, Math.abs(fwd) / 5)) * Math.sign(fwd || thr || 1);
  const a0 = v.a; if (v.horseDead) { v.a += v.av * dt; v.av *= (1 - 1.5 * dt); fwd *= (1 - 2 * dt); } else v.a += steer * d.turn * turnK * dt * (1 + (1 - grip) * .4);
  // never rotate the body into a wall (that used to leave a corner inside the block and every later move was rejected: the "stuck carriage")
  if (v.a !== a0 && !d.rail) { const p1 = vPen(v, v.x, v.z, v.a); if (p1 && p1 > vPen(v, v.x, v.z, a0)) { v.a = a0; v.av = 0; } }
  v.vx = fx_ * fwd - fz * lat; v.vz = fz * fwd + fx_ * lat; moveVeh(v, dt); }
function moveVeh(v, dt) { const nx = v.x + v.vx * dt, nz = v.z + v.vz * dt; const sp = Math.hypot(v.vx, v.vz);
  const p0 = vPen(v, v.x, v.z, v.a), pN = vPen(v, nx, nz, v.a);
  if (pN && pN >= p0) { // blocked: slide along the wall instead of bouncing to a dead stop; if already embedded, nudge out toward free space
    const px_ = vPen(v, nx, v.z, v.a), pz_ = vPen(v, v.x, nz, v.a); if ((!px_ || px_ < p0) && Math.abs(v.vx) > .05) { v.x = nx; v.vz *= -.1; } else if ((!pz_ || pz_ < p0) && Math.abs(v.vz) > .05) { v.z = nz; v.vx *= -.1; } else { v.vx *= -.2; v.vz *= -.2; }
    if (p0) { let best = p0, bx = v.x, bz = v.z; for (const [c, s] of RING8) { const q = vPen(v, v.x + c * .35, v.z + s * .35, v.a); if (q < best) { best = q; bx = v.x + c * .35; bz = v.z + s * .35; } } v.x = bx; v.z = bz; }
    if (v.d.ride && sp > 9 && v === player.veh) { hurtPlayer(sp * (v.type === 'pennyfarthing' ? 2.5 : 1.2)); pager(v.type === 'pennyfarthing' ? 'A header over the big wheel!' : 'Thrown from the saddle!', 1.5); const vv = v; enterExitForce(); vv.vx = vv.vz = 0; }
    if (sp > 8) { damageVeh(v, sp * 1.2); FX.sparks(v.x + Math.cos(v.a) * v.d.len * .5, v.z + Math.sin(v.a) * v.d.len * .5, 8, 5); if (v === player.veh) { SFX.crash(); camShake = .3; } } return; }
  v.x = Math.max(2, Math.min(WX - 2, nx)); v.z = Math.max(2, Math.min(WZ - 2, nz)); if (sp > 9 && v.d.horses && rnd() < .3) FX.dust(v.x - Math.cos(v.a) * v.d.len * .5, v.z - Math.sin(v.a) * v.d.len * .5, 1);
  // props: tested at the nose (horses' heads) and both sides of the body, at the real prop radius
  const nose = v.d.len * .5 + (v.d.horses ? 2 : 0); for (const p of propsNear(v.x, v.z)) if (p.r > 0 && p.alive !== false && (d2(p.x, p.z, v.x + Math.cos(v.a) * nose, v.z + Math.sin(v.a) * nose) < (p.r + v.d.wid * .45) ** 2 || d2(p.x, p.z, v.x, v.z) < (p.r + v.d.wid * .5) ** 2)) { if (sp > 6 && p.hp < 400) { damageProp(p, sp * 6); v.vx *= .7; v.vz *= .7; } else { const ax = v.x - p.x, az = v.z - p.z, al = Math.hypot(ax, az) || 1; v.x += ax / al * .25; v.z += az / al * .25; const vn = (v.vx * ax + v.vz * az) / al; if (vn < 0) { v.vx -= ax / al * vn * 1.2; v.vz -= az / al * vn * 1.2; } } }
  // peds
  if (sp > 3) for (const p of peds) if (p.alive && !p.inVeh && !(p.type === 'vip' && sp < 12) && d2(p.x, p.z, v.x + Math.cos(v.a) * v.d.len * .4, v.z + Math.sin(v.a) * v.d.len * .4) < (v.d.len * .5 + 1) ** 2) { damagePed(p, sp * 4, v === player.veh ? 'player' : 'veh'); if (p.alive) { p.x += v.vx * .1; p.z += v.vz * .1; } }
  // vehicles
  for (const o of vehs) { if (o === v || !o.alive) continue; const r = (v.d.len + o.d.len) * .42; const dd = d2(o.x, o.z, v.x, v.z); if (dd < r * r && dd > .01) { const dist = Math.sqrt(dd), nx2 = (v.x - o.x) / dist, nz2 = (v.z - o.z) / dist, push = (r - dist) * .5;
    if (o.d.rail) { v.x += nx2 * push * 2; v.z += nz2 * push * 2; } else { v.x += nx2 * push; v.z += nz2 * push; o.x -= nx2 * push; o.z -= nz2 * push; }
    const rel = (v.vx - o.vx) * nx2 + (v.vz - o.vz) * nz2; if (rel < 0) { v.vx -= rel * nx2 * .8; v.vz -= rel * nz2 * .8; if (!o.d.rail) { o.vx += rel * nx2 * .6; o.vz += rel * nz2 * .6; } if (-rel > 7) { damageVeh(v, -rel * 1.5); damageVeh(o, -rel * 1.5, false, v === player.veh ? 'player' : ''); if (v === player.veh || o === player.veh) { SFX.crash(); camShake = .3; if (o.police || v.police) crime(.6); } } } } }
  // player on foot
  if (!player.veh && sp > 3 && d2(player.x, player.z, v.x, v.z) < (v.d.len * .5 + .8) ** 2) { hurtPlayer(sp * 2); player.x += v.vx * .15; player.z += v.vz * .15; } }
// rail vehicles follow TRAM / TRAIN polylines (pathAt)
function railLocal(v, x, z) { const c = Math.cos(v.a), s = Math.sin(v.a), dx = x - v.x, dz = z - v.z; return [dx * c + dz * s, -dx * s + dz * c]; }
function railHit(v, x, z, pad) { const [lx, lz] = railLocal(v, x, z), back = v.type === 'train' ? v.d.len / 2 + 27 : v.d.len / 2; return lx < v.d.len / 2 + pad && lx > -back - pad && Math.abs(lz) < v.d.wid / 2 + pad; }
function driveRail(v, thr, dt) { const d = v.d, P = v.rp || (v.rp = d.rail === 'tram' ? TRAM : TRAIN); if (v.s === undefined) v.s = 0; let sp = v.sp || 0; sp += thr * d.acc * dt; if (Math.abs(thr) < .05) sp *= 1 - .3 * dt; sp = Math.max(-d.spd, Math.min(d.spd, sp)); v.sp = sp;
  v.s += sp * dt; if (d.rail === 'tram') { if (v.s > P.len - 4) { v.s = P.len - 4; v.sp = -Math.abs(sp) * .2; } if (v.s < 4) { v.s = 4; v.sp = Math.abs(sp) * .2; } } else { if (v.s > P.len) { v.s = 0; v.stopT = 8; v.sp = 0; } if (v.s < 0) v.s = 0; }
  const [x, z, a] = pathAt(P, v.s); v.x = x; v.z = z; v.a = (d.rail === 'tram' && (v.dirS || 1) < 0) ? a + Math.PI : a; const f = v.sp * ((d.rail === 'tram' && (v.dirS || 1) < 0) ? -1 : 1); v.vx = Math.cos(v.a) * f * 0; v.vz = 0;
  const asp = Math.abs(sp); if (asp > 2) { for (const p of peds) if (p.alive && !p.inVeh && railHit(v, p.x, p.z, .6)) damagePed(p, 100, v === player.veh ? 'player' : 'veh');
    for (const o of vehs) if (o !== v && o.alive && !o.d.rail && railHit(v, o.x, o.z, 1.2)) { damageVeh(o, asp * 4); const [, lz] = railLocal(v, o.x, o.z), s2 = lz >= 0 ? 1 : -1; o.vx += -Math.sin(v.a) * s2 * 9; o.vz += Math.cos(v.a) * s2 * 9; FX.sparks(o.x, o.z, 8, 5); }
    if (!player.veh && railHit(v, player.x, player.z, .4)) hurtPlayer(200); } }
// ================= PLAYER CONTROL =================
function enterExit(target) { if (player.veh) { const v = player.veh; const s = Math.hypot(v.vx, v.vz) + Math.abs(v.sp || 0); if (s > 6) return; player.veh = null; v.driver = null;
    let ex = v.x - Math.sin(v.a) * (v.d.wid / 2 + 1), ez = v.z + Math.cos(v.a) * (v.d.wid / 2 + 1); if (pedBlock(ex, ez)) { ex = v.x + Math.sin(v.a) * (v.d.wid / 2 + 1); ez = v.z - Math.cos(v.a) * (v.d.wid / 2 + 1); }
    player.x = ex; player.z = ez; player.mesh.visible = true; return; }
  let best = null, bd = 30; if (target && target.alive && !target.wreck) best = target; else for (const v of vehs) { if (!v.alive || v.wreck) continue; const dd = d2(v.x, v.z, player.x, player.z); const rr = (v.d.len / 2 + 2.5) ** 2 + (v.type === 'train' ? 60 : 0); if (dd < rr && dd < bd) { bd = dd; best = v; } }
  if (!best) return; const v = best;
  if (v.driver && typeof v.driver === 'string') { if (v.driver !== 'player') spawnPed(v.driver, v.x - Math.sin(v.a) * 2, v.z + Math.cos(v.a) * 2, {}); v.driver = null; } if (v.driver) { const dr = v.driver; dr.alive = true; dr.x = v.x - Math.sin(v.a) * 2; dr.z = v.z + Math.cos(v.a) * 2; dr.inVeh = null; dr.mesh.visible = true; dr.flee = 8; if (!peds.includes(dr)) peds.push(dr); v.driver = null; SFX.hit();
    if (v.police) { crime(4); } else crime(1); if (dr.type === 'cop') dr.hostile = true; pager(v.police ? 'You pulled a sergent off his own carriage!' : 'Carriage jacked!', 1.5); }
  if (v.traffic) v.traffic = false; v.parked = false; player.veh = v; v.driver = 'player'; player.mesh.visible = false; if (v.hp < 0) v.hp = 1; }
// ---- hover / interact: what is under the cursor (people, vehicles, registered objects) ----
// Hooks for the other modules: HOOKS.interact(target, ctx) handlers run first (return true to consume); HOOKS.triggers are
// world mission/activity starters { id, x, z, r, label?, click?, onEnter?(ctx), onClick?(ctx), when?() }; HOOKS.objects are clickable things { x, z, r, label, onClick(ctx) }.
const HOOKS = { interact: [], triggers: [], objects: [], update: [], hud: [], map: [], phone: [], where: () => '', known: () => true, welcome: '', clickOwned: true }; let hover = null, pendingI = null;
function hoverAt(x, z) { let best = null, bd = 1e9; const consider = (o, kind, d, r) => { if (d < r * r && d < bd) { bd = d; best = { kind, o }; } };
  for (const p of peds) if (p.alive && !p.inVeh && p.mesh && p.mesh.visible) consider(p, 'ped', d2(p.x, p.z, x, z), 1.3);
  for (const v of vehs) { if (!v.alive || v.wreck || v === player.veh || v.d.rail === 'train') continue; const c = Math.cos(v.a), s_ = Math.sin(v.a), lx = (x - v.x) * c + (z - v.z) * s_, lz = -(x - v.x) * s_ + (z - v.z) * c; if (Math.abs(lx) < v.d.len / 2 + .4 && Math.abs(lz) < v.d.wid / 2 + .4) consider(v, 'veh', d2(v.x, v.z, x, z) * .5, 6); }
  for (const o of HOOKS.objects) if (!o.when || o.when()) consider(o, 'obj', d2(o.x, o.z, x, z), o.r || 1.5);
  for (const o of HOOKS.triggers) if (o.click !== false && (!o.when || o.when())) consider(o, 'trig', d2(o.x, o.z, x, z), o.r || 2);
  for (const p of pickups) if (p.alive) consider(p, 'pick', d2(p.x, p.z, x, z), 1.2);
  return best; }
const REACH = { ped: 2.4, veh: 0, obj: 2.6, trig: 2.6, pick: 1.4 };
function reachOf(h) { return h.kind === 'veh' ? h.o.d.len / 2 + 2.5 : (h.o.reach || REACH[h.kind]); }
function hx_(h) { return [h.o.x, h.o.z]; }
function lifeAt(sx, sy, shift) { const f = window.GAME && GAME.interactAt; if (!f) return null; try { return f(sx, sy, !!shift); } catch (e) { console.error(e); return null; } }
let pendingShift = false;
function doInteract(h, shift = pendingShift) { pendingShift = false; const ctx = { player, say, pager, startMission: (id) => startMission(typeof id === 'string' ? MISSIONS.find(m => m.id === id) : id), get M() { return M; }, money: () => money, addMoney, giveWeapon };
  for (const f of HOOKS.interact) { try { if (f(h.o, h.kind, ctx)) return; } catch (e) { console.error(e); } }
  if (h.kind === 'veh') return enterExit(h.o); if (h.kind === 'pick') { player.dest = [h.o.x, h.o.z]; return; }
  if ((h.kind === 'obj' || h.kind === 'trig') && h.o.onClick) return h.o.onClick(ctx);
  if (h.kind === 'ped') { const [sx, sy] = toScreen(h.o.x, h.o.z, 1); if (lifeAt(sx, sy, shift)) return; if (!shift) return pedTalk(h.o); } }
// default barks (used only when no dialogue module claims the person): stable per person, chosen by type, look and time of day
const BARKS = { civ: ['Pardon, monsieur — I am late for the omnibus.', 'Have you seen the new tower on the Champ-de-Mars? Monstrous. Marvellous.', 'Mind the gutter, it rained all night.', 'They say the Opéra has a ghost. I say it has creditors.', 'My cousin rides one of those bicycles now. Ridiculous.', 'Bread is up two sous again.', 'Not today, thank you.', 'A motor carriage frightened my horse on the Boulevard!', 'Is it true the Salon refused Monsieur Monet again?', 'You look like a man with a plan. I want no part of it.'],
  cop: ['Move along.', 'Papers? ... Hm. Move along.', 'Keep your nose clean, citizen.'], gend: ['Stand clear of the horse.', 'The Garde has eyes on this quarter.'], soldier: ['Halt. This street is closed.'], gang: ['You lost, bourgeois?', 'Wrong street, friend.'], vip: ['Not now, I beg you.'], boss: ['You have nerve, I grant you.'] };
function pedTalk(p) { if (p.hostile || ((p.type === 'cop' || p.type === 'gend') && wanted > 0)) return; const L = BARKS[p.type] || BARKS.civ; if (p.bark === undefined) p.bark = Math.floor(rnd() * L.length); const line = p.lines ? p.lines[(p.talkN = (p.talkN || 0) + 1) % p.lines.length] : L[p.bark]; say((p.name ? p.name + ': ' : '') + line, 3); p.stand = true; p.a = Math.atan2(player.z - p.z, player.x - p.x); p.talkT = 4; }
function updateTriggers() { if (!player.alive) return; const [px, pz] = ppos(); for (const t of HOOKS.triggers) { if (!t.onEnter || (t.when && !t.when())) continue; const inside = d2(t.x, t.z, px, pz) < (t.r || 2) ** 2; if (inside && !t._in) { try { t.onEnter({ startMission: (id) => startMission(MISSIONS.find(m => m.id === id)), get M() { return M; }, player, say, pager }); } catch (e) { console.error(e); } } t._in = inside; } }
// Armurerie (gunsmith): period arms for sale; the 1892 prototype only turns up rarely, and only after Act II
const SHOP = [['velodog', 120], ['derringer', 150], ['pinfire', 180], ['revolver', 320], ['shotgun', 380], ['gras', 450], ['lebel', 900], ['swordcane', 260], ['knife', 40], ['cosh', 25], ['mle1892', 1600]];
let shopEl = null, shopOpen = false, shopShut = 0; function openShop(name) { if (!shopEl) { shopEl = document.createElement('div'); shopEl.className = 'panel'; shopEl.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(20,16,12,.94);color:#e8dcc0;font:14px Georgia,serif;padding:18px 22px;border:1px solid #a08050;z-index:50;min-width:420px;max-height:80vh;overflow:auto'; document.body.appendChild(shopEl); }
  const rare = stats.completed >= 25; const rows = SHOP.filter(([id]) => id !== 'mle1892' || rare).map(([id, pr]) => { const w = WEAP[WI[id]]; return `<div data-id="${id}" data-pr="${pr}" style="cursor:pointer;padding:5px 0;border-bottom:1px solid #3a3020"><b>${w.n}</b> — ${pr} F<br><small style="opacity:.75">${w.note || (w.melee ? 'blade / blunt' : '')}${w.mag ? ` · ${w.mag} rds, ${w.one ? 'loads one at a time' : 'reload ' + w.rel + ' s'}` : ''}</small></div>`; }).join('');
  shopEl.innerHTML = `<div style="font-size:18px;margin-bottom:8px">${name}</div>${rows}<div style="margin-top:10px;opacity:.7">Click to buy (ammunition included) · Esc or click here to leave</div>`; shopEl.style.display = 'block'; shopOpen = true;
  shopEl.onclick = e => { const r = e.target.closest('[data-id]'); if (!r) { shopEl.style.display = 'none'; shopOpen = false; shopShut = performance.now(); return; } const pr = +r.dataset.pr; if (money < pr) { pager('Not enough francs.', 1.5); return; } addMoney(-pr, true); giveWeapon(r.dataset.id); player.w = WI[r.dataset.id]; SFX.cash(); pager(WEAP[WI[r.dataset.id]].n + ' bought.', 1.5); }; }
addEventListener('keydown', e => { if (e.code === 'Escape' && shopEl && shopEl.style.display === 'block') { shopEl.style.display = 'none'; shopOpen = false; shopShut = performance.now(); } });
// the content worker's acts.js owns the Gastinne Renette counter; the engine keeps one more armurerie (period stock) in the faubourg
for (const [poi, name] of [['bastille', 'Armurerie du Faubourg Saint-Antoine']]) { const p = POI[poi]; if (p) HOOKS.objects.push({ x: p[0] + 3, z: p[1] + 3, r: 1.8, label: name, onClick: () => openShop(name) }); }
const WALK = 3.4, RUN = 7.2;
function updatePlayer(I, dt) { player.cd -= dt; player.punch -= dt; player.kick = Math.max(0, player.kick - dt * .6); tickReload(dt);
  if (I.enter) enterExit(); if (I.prev) cycleW(-1); if (I.next) cycleW(1); if (I.reload) startReload();
  const v = player.veh;
  // hover + click to interact (on foot)
  hover = I.mouse && !v ? hoverAt(mouse.wx, mouse.wz) : null; if (I.mouse && v) { const h = hoverAt(mouse.wx, mouse.wz); hover = h && h.kind !== 'veh' ? null : null; }
  if (!v && I.click && !I.aim) { pendingShift = I.shift; if ((!hover || hover.kind === 'obj' && !hover.o.onClick) && lifeAt(mouse.sx, mouse.sy, I.shift)) { /* claimed by a world activity */ } else if (hover) { const [tx, tz] = hx_(hover); if (Math.sqrt(d2(tx, tz, player.x, player.z)) <= reachOf(hover)) { pendingI = null; doInteract(hover); } else { pendingI = hover; player.dest = [tx, tz]; } } else { pendingI = null; player.dest = [mouse.wx, mouse.wz]; } }
  if (v) { let thr = I.thr, steer = I.steer; let tgt = null;
    if (I.stick && Math.hypot(I.mx, I.my) > .2) tgt = [Math.atan2(I.my, I.mx), Math.min(1, Math.hypot(I.mx, I.my))];
    else if (I.mouse && (mouse.L || mouse.R)) { const dx = mouse.wx - v.x, dz = mouse.wz - v.z, dd = Math.hypot(dx, dz); if (mouse.L && dd > 1) tgt = [Math.atan2(dz, dx), Math.min(1, .35 + dd / 14)]; else if (mouse.R) { const fwd = v.vx * Math.cos(v.a) + v.vz * Math.sin(v.a); thr = fwd > .8 ? -1 : -.8; steer = 0; } }
    if (tgt) { const [ta, mag] = tgt, da = ang(ta - v.a);
      if (Math.abs(da) > 2.4 && Math.hypot(v.vx, v.vz) < 4) { thr = -mag; steer = Math.max(-1, Math.min(1, -ang(ta + Math.PI - v.a) * 2)); } else { thr = Math.abs(da) > 1.9 ? -1 : mag * (1 - Math.min(.6, Math.abs(da) * .35)); steer = Math.max(-1, Math.min(1, da * 2.5)); } }
    driveVeh(v, thr, steer, dt, I.hand); player.x = v.x; player.z = v.z;
    const fa = I.mouse ? Math.atan2(mouse.wz - v.z, mouse.wx - v.x) : v.a; if (I.mouse) player.a = fa;
    if (I.fire && !WEAP[player.w].melee && !WEAP[player.w].throw && !v.d.ride) fireWeapon(v.x + Math.cos(fa) * 1.5, v.z + Math.sin(fa) * 1.5, fa);
    else if (I.fire && !WEAP[player.w].melee && !WEAP[player.w].throw && v.d.ride) fireWeapon(v.x + Math.cos(fa) * .8, v.z + Math.sin(fa) * .8, fa);
    else if (I.fire && WEAP[player.w].throw) fireWeapon(v.x, v.z, fa);
    const sp = Math.hypot(v.vx, v.vz) + Math.abs(v.sp || 0); if (v.d.horses && sp > 10 && rnd() < dt * 6) FX.dust(v.x - Math.cos(v.a) * 2, v.z - Math.sin(v.a) * 2, 1); if (v.d.horses && !v.horseDead) { v.hoof = (v.hoof || 0) - dt * sp * .35; if (v.hoof < 0) { v.hoof = 1; SFX.hoof(); } }
    vehSound(v, sp, dt);
    if (v.burn) hurtPlayer(dt * 8); return; }
  // on foot: stick > held left mouse (steer toward cursor) > click-to-move destination
  let mx = 0, mz = 0, m = 0; const run = I.run; player.runT = 0;
  if (I.stick) { mx = I.mx; mz = I.my; m = Math.min(1, Math.hypot(mx, mz)); player.dest = null; }
  else if (I.mouse && mouse.L && !I.aim && !pendingI) { const dx = mouse.wx - player.x, dz = mouse.wz - player.z, dd = Math.hypot(dx, dz); player.dest = null; if (dd > .6) { mx = dx / dd; mz = dz / dd; m = 1; } }
  else if (player.dest) { const dx = player.dest[0] - player.x, dz = player.dest[1] - player.z, dd = Math.hypot(dx, dz); const stop = pendingI ? reachOf(pendingI) * .8 : .35; if (dd < stop) { player.dest = null; if (pendingI) { const h = pendingI; pendingI = null; doInteract(h); } } else { mx = dx / dd; mz = dz / dd; m = 1; } }
  if (I.aim && I.mouse) player.a = Math.atan2(mouse.wz - player.z, mouse.wx - player.x);
  if (m > .2) { const a = Math.atan2(mz, mx); if (!I.aim) player.a = a; const sp = (run ? RUN : WALK) * (I.aim ? .55 : 1) * Math.min(1, m); if (run) player.runT = 1;
    const R = .38, ox = player.x, oz = player.z; const stepX = Math.cos(a) * sp * dt, stepZ = Math.sin(a) * sp * dt;
    const blocked = (x, z) => solidBody(x, z, R, false) || !!propHit(x, z, R) || vehs.some(o => o.alive && o !== player.veh && vehBodyHit(o, x, z, R));
    if (!blocked(ox + stepX, oz + stepZ)) { player.x = ox + stepX; player.z = oz + stepZ; } else { if (!blocked(ox + stepX, oz)) player.x = ox + stepX; else if (!blocked(ox, oz + stepZ)) player.z = oz + stepZ; else if (player.dest && !pendingI) player.dest = null; }
    // if we ever start inside something (spawn, teleport), let the body slide out
    if (solidBody(player.x, player.z, R * .6, false)) for (const [c, s_] of RING8) if (!solidBody(player.x + c * .5, player.z + s_ * .5, R, false)) { player.x += c * .5; player.z += s_ * .5; break; }
    player.walkT += dt * sp; }
  if (I.fire) fireWeapon(player.x, player.z, player.a);
  // pickups
  for (const pk of pickups) if (pk.alive && d2(pk.x, pk.z, player.x, player.z) < 2.6) collectPickup(pk); }
function vehBodyHit(o, x, z, r) { const c = Math.cos(o.a), s_ = Math.sin(o.a), lx = (x - o.x) * c + (z - o.z) * s_, lz = -(x - o.x) * s_ + (z - o.z) * c; const front = o.d.len / 2 + (o.d.horses ? 2.2 : 0); return lx < front + r && lx > -o.d.len / 2 - r && Math.abs(lz) < o.d.wid / 2 + r; }
// engine / pedal sounds
function vehSound(v, sp, dt) { if (v.d.motor) { v.putt = (v.putt || 0) - dt * (5 + sp * 1.6); if (v.putt < 0) { v.putt = 1; SFX.putt(v.type === 'benz' ? .8 : v.type === 'peugeot' ? 1.1 : 1); } if (sp > 4 && rnd() < dt * 3) FX.smoke(v.x - Math.cos(v.a) * v.d.len * .5, .6, v.z - Math.sin(v.a) * v.d.len * .5, 1, .5, .8); }
  else if (v.d.ride && sp > 1) { v.ped_ = (v.ped_ || 0) - dt * sp * .5; if (v.ped_ < 0) { v.ped_ = 1; SFX.pedal(); } } }
// ================= PICKUPS =================
const PKM = {}; const PKG = new THREE.BoxGeometry(1, .18, 1);
function pkMat(kind) { if (PKM[kind]) return PKM[kind]; const col = { brick: '#999', swordcane: '#ccc', revolver: '#ddd', shotgun: '#b84', winchester: '#da6', lebel: '#da6', gras: '#c96', pinfire: '#bbb', velodog: '#eee', derringer: '#cb8', apache: '#a88', mle1892: '#9cf', knife: '#aaa', cosh: '#753', dynamite: '#d22', molotov: '#6c4', health: '#f44', money: '#fd2', mission: '#f0f', armor: '#48f' }[kind] || '#fff';
  return PKM[kind] = spriteMat('pk' + kind, 16, 16, g => { g.fillStyle = '#000'; g.fillRect(1, 1, 14, 14); g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(2, 2, 12, 12); g.fillStyle = col; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.fillText(kind === 'health' ? '+' : kind === 'money' ? '₣' : kind === 'mission' ? '★' : kind[0].toUpperCase(), 8, 12); }); }
function addPickup(kind, x, z, o = {}) { const m = new THREE.Mesh(PKG, pkMat(kind)); m.scale.set(1.3, 1.3, 1.3); m.position.set(x, 1, z); scene.add(m); const p = Object.assign({ kind, x, z, m, alive: true }, o); pickups.push(p); return p; }
function dropPickup(x, z) { addPickup(rnd() < .6 ? 'money' : 'revolver', x, z, { temp: 20 }); }
function collectPickup(pk) { pk.alive = false; pk.m.visible = false; if (pk.respawn) pk.rt = pk.respawn;
  if (pk.kind === 'health') { player.hp = 100; pager('Vin rouge — health restored', 1.5); } else if (pk.kind === 'money') addMoney(pk.amt || 250); else if (pk.kind === 'mission') { pk.got = true; SFX.cash(); }
  else { giveWeapon(pk.kind); player.w = WI[pk.kind]; pager(WEAP[WI[pk.kind]].n + '!', 1.5); SFX.cash(); } }
const PK_SPOTS = [['brick', 'tertre'], ['swordcane', 'garnier'], ['revolver', 'chien'], ['revolver', 'procope'], ['shotgun', 'abattoir'], ['shotgun', 'bourse'], ['gras', 'railyard'], ['lebel', 'sorbonne'], ['pinfire', 'belleville'], ['velodog', 'garnier'], ['derringer', 'chatnoir'], ['apache', 'ratmort'], ['knife', 'abattoir'], ['cosh', 'boulmich'], ['dynamite', 'ivry'], ['dynamite', 'catacombs'], ['molotov', 'ratmort'], ['molotov', 'chatnoir'], ['health', 'hoteldieu'], ['health', 'galette'], ['health', 'cafepaix'], ['brick', 'belleville'], ['revolver', 'boulmich'], ['health', 'cellier']];
PK_SPOTS.forEach(([k, poi], i) => { const [x, z] = POI[poi]; const [x2, z2] = snapWalk(Math.floor(x / T) + (i % 3) - 1, Math.floor(z / T) + 2, false); addPickup(k, x2, z2, { respawn: 30 }); });
// phones & kiosk
const PHONES = []; for (const f in FACTIONS) { const [x, z] = POI[FACTIONS[f].phone]; const p = addDynProp('phone', x, z); p.fac = f; PHONES.push(p); }
{ const [x, z] = POI.boulevard; const p = addDynProp('phone', x, z); p.fac = 'side'; PHONES.push(p); }
const ringMat = new THREE.MeshBasicMaterial({ color: 0xf4c430, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false });
const phoneRings = PHONES.map(p => { const r = new THREE.Mesh(new THREE.RingGeometry(1.6, 2, 16), ringMat.clone()); r.rotation.x = -Math.PI / 2; r.position.set(p.x, .4, p.z); r.material.color.set({ apache: 0xe02020, avant: 0xa060e0, velvet: 0xe060c0, crimson: 0xff4020, side: 0xf4c430 }[p.fac]); scene.add(r); return r; });
const objMarker = new THREE.Mesh(new THREE.RingGeometry(2.2, 3, 20), new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false })); objMarker.rotation.x = -Math.PI / 2; scene.add(objMarker);
const objArrow = new THREE.Mesh(new THREE.ConeGeometry(.9, 2, 4), new THREE.MeshBasicMaterial({ color: 0xffe040 })); objArrow.rotation.x = Math.PI; scene.add(objArrow);
// ================= TRAFFIC =================
const TRAFFIC_T = ['brougham', 'brougham', 'brougham', 'gig', 'gig', 'phaeton', 'barouche', 'omnibus', 'bicycle', 'bicycle', 'pennyfarthing', 'velocipede', 'panhard', 'peugeot', 'benz'];
function pickEdge(n, from) { const L = (ADJ[n] || []).filter(e => GE[e].c !== 9); if (!L.length) return null; const nb = L.length > 1 ? L.filter(e => edgeOther(e, n) !== from) : L; return nb[Math.floor(rnd() * nb.length)]; }
function routeOn(v, n, e) { v.node = n; v.edge = e; v.path = edgePts(e, n); v.pi = 1; v.dest = edgeOther(e, n); }
function spawnTraffic(px, pz) { const cand = nodesIn(px, pz, 130); for (let tries = 0; tries < 8 && cand.length; tries++) { const n = cand[Math.floor(rnd() * cand.length)], [x, z] = GN[n]; const dd = d2(x, z, px, pz); if (dd < 80 * 80 || dd > 130 * 130) continue;
    const e = pickEdge(n, -1); if (e === null) continue; const ty = TRAFFIC_T[Math.floor(rnd() * TRAFFIC_T.length)]; const pts = edgePts(e, n); if (vehs.some(o => d2(o.x, o.z, x, z) < 64)) continue;
    const v = spawnVeh(ty, x, z, Math.atan2(pts[3] - z, pts[2] - x), { traffic: true }); routeOn(v, n, e);
    v.driver = spawnPed('civ', x, z, { inVeh: v }); peds.splice(peds.indexOf(v.driver), 1); return v; } }
function trafficAI(v, dt) { if (v.horseDead || v.burn) { driveVeh(v, 0, 0, dt); return; } if (!v.path) { const n = nearestNode(v.x, v.z); const e = pickEdge(n, -1); if (e === null) { driveVeh(v, 0, 0, dt); return; } routeOn(v, n, e); }
  const P = v.path, i = v.pi, lane = 1.2; const x0 = P[(i - 1) * 2], z0 = P[(i - 1) * 2 + 1], tx = P[i * 2], tz = P[i * 2 + 1]; const dx = tx - x0, dz = tz - z0, l = Math.hypot(dx, dz) || 1;
  const gx = tx - dz / l * lane, gz = tz + dx / l * lane; if (d2(v.x, v.z, gx, gz) < 10) { if (v.pi < P.length / 2 - 1) v.pi++; else { const e = pickEdge(v.dest, v.node); if (e === null) routeOn(v, v.dest, v.edge); else routeOn(v, v.dest, e); } }
  const ta = Math.atan2(gz - v.z, gx - v.x), da = ang(ta - v.a); let thr = Math.abs(da) > 1 ? .2 : .55; const pp = ppos();
  const fx_ = v.x + Math.cos(v.a) * 6, fz = v.z + Math.sin(v.a) * 6; if (d2(fx_, fz, pp[0], pp[1]) < 12 || vehs.some(o => o !== v && o.alive && d2(o.x, o.z, fx_, fz) < 10) || peds.some(p => p.alive && !p.inVeh && d2(p.x, p.z, fx_, fz) < 4)) thr = -.6;
  if (v.panic) thr = 1; driveVeh(v, thr, Math.max(-1, Math.min(1, da * 2)), dt); }
// ================= PED AI =================
function pedAI(p, dt) { if (!p.alive) { p.deadT -= dt; if (p.deadT < 0) removePed(p); return; } p.cd -= dt; p.t += dt; if (p.talkT > 0) { p.talkT -= dt; if (p.talkT <= 0 && !p.keepStand) p.stand = false; } if (p.stag > 0) { p.stag -= dt; return; } const [px, pz] = ppos(); const dP = Math.sqrt(d2(p.x, p.z, px, pz));
  let mx = 0, mz = 0, sp = p.spd;
  const lawman = p.type === 'cop' || p.type === 'gend' || p.type === 'soldier';
  const hostile = (lawman && wanted > 0) || p.hostile;
  if (hostile && player.alive) { const a = Math.atan2(pz - p.z, px - p.x); p.a = a;
    if (p.type === 'soldier') { /* holds the line with the Lebel: bolt-action, smokeless */ if (p.cd < 0 && dP < 50) { p.cd = 2.6 + rnd(); npcShoot(p, px, pz, 16, .08, 'lebel'); } }
    else if (p.type === 'gend') { /* Garde républicaine: mounted, sabre drawn, rides you down */ if (dP > 2.2) { mx = Math.cos(a); mz = Math.sin(a); } else if (p.cd < 0) { p.cd = 1; SFX.swing(); if (!player.veh) { hurtPlayer(18); FX.blood(px, pz, 3); } else bustT += .5; } }
    else if (p.type === 'cop' && wanted >= 2 && dP < 26 && dP > 3) { /* sergent de ville: Mle 1873 service revolver once the chase is serious */ if (p.cd < 0) { p.cd = 1.6 + rnd() * .8; npcShoot(p, px, pz, 9, .14, 'revolver'); } if (dP > 10) { mx = Math.cos(a); mz = Math.sin(a); } }
    else if (p.armed && dP < 28 && dP > 4) { if (p.cd < 0) { p.cd = 1.1 + rnd(); npcShoot(p, player.veh && rnd() < .5 ? player.veh.x + Math.cos(player.veh.a) * player.veh.d.len : px, player.veh ? player.veh.z + Math.sin(player.veh.a) * player.veh.d.len : pz, p.boss ? 12 : 7, .14, p.boss ? 'revolver' : 'pinfire'); } if (dP > 12) { mx = Math.cos(a); mz = Math.sin(a); } }
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
    if (wanted >= 3 && pv < wanted - 1) { const cn = nodesIn(px, pz, 70); for (let k = 0; k < 10 && cn.length; k++) { const n = cn[Math.floor(rnd() * cn.length)], [x, z] = GN[n], dd = d2(x, z, px, pz); if (dd > 35 * 35 && dd < 70 * 70 && ADJ[n].length) { const v = spawnVeh('police', x, z, Math.atan2(pz - z, px - x), { police: true }); v.driver = 'cop'; break; } } } }
  if (wanted >= 4) { barricadeT -= dt; if (barricadeT < 0) { barricadeT = 14; spawnBarricade(); } }
  if (wanted === 0) for (const p of peds) if ((p.type === 'cop' || p.type === 'gend' || p.type === 'soldier') && p.alive && rnd() < dt * .2 && d2(p.x, p.z, ...ppos()) > 900) removePed(p); }
function spawnBarricade() { const [px, pz] = ppos(); const v = player.veh; const a = v ? v.a : player.a; let bx = px + Math.cos(a) * 30, bz = pz + Math.sin(a) * 30;
  { const n = nearestNode(bx, bz); if (n >= 0) { bx = GN[n][0]; bz = GN[n][1]; } }
  if (d2(bx, bz, px, pz) < 300) return; const horiz = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a));
  for (let k = -2; k <= 2; k++) { const x = bx + (horiz ? 0 : k * 2.4), z = bz + (horiz ? k * 2.4 : 0); if (!pedBlock(x, z)) tempProps.push(addDynProp('barricade', x, z, { temp: 40 })); }
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
const STORYM = MISSIONS.filter(m => m.fac !== 'side'); function nextStory() { return STORYM.find(m => !done[m.id]) || null; }
function nextFor(f) { if (f === 'side') return (byFac.side || []).find(m => !done[m.id]) || null; const m = nextStory(); return m && m.fac === f ? m : null; }
function showCard(c) { const el = $('card'); if (!el) return; el.innerHTML = `<div class="ca">${c.act}</div><div class="cs">${c.season}</div><div class="ct">${c.title}</div><div class="cx">${c.text}</div>`; el.classList.remove('hidden'); el.style.opacity = 1; clearTimeout(showCard.t); showCard.t = setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.classList.add('hidden'), 900); }, 4200); }
function nearPOI(name, veh) { const p = (veh ? POIV : POI)[name]; return p; }
function ringPos(x, z, r) { for (let k = 0; k < 20; k++) { const a = rnd() * 6.28, rr = r * (.4 + rnd() * .6), xx = x + Math.cos(a) * rr, zz = z + Math.sin(a) * rr; if (!pedBlock(xx, zz) && kAt(xx, zz) !== K.STAIR) return [xx, zz]; } return [x, z]; }
function startMission(def) { if (M) return; M = { def, i: -1, ents: [], vehs: [], props: [], pks: [], t: 0 }; if (def.card && CHAPTERS[def.chapter]) showCard(CHAPTERS[def.chapter]); big(def.title, 2.5); pager(`${facName(def.fac)}: "${def.title}"${def.en ? ' (' + def.en + ')' : ''} — ${def.brief}`, 7); SFX.pager(); if (def.intro) def.intro.forEach(l => say(l)); if (def.bonus && POI[def.bonus.at]) { const [x, z] = ringPos(POI[def.bonus.at][0], POI[def.bonus.at][1], 10); M.bonus = addPickup('money', x, z, { amt: def.bonus.pay }); pager('OPTIONAL: ' + def.bonus.text, 5); } nextStep(); }
function cleanupStep() { if (!M) return; if (M.cones) { M.cones.forEach(c => { scene.remove(c); c.geometry.dispose(); c.material.dispose(); }); M.cones = null; } if (M.mark) { M.mark.alive = false; M.mark = null; } M.ents.forEach(p => { if (p.alive) { p.hostile = false; p.flee = 5; p.mission = false; } }); M.ents = []; M.props.forEach(p => { if (p.alive) { p.alive = false; setPropM(p); } }); M.props = []; M.pks.forEach(p => { p.alive = false; p.m.visible = false; }); M.pks = []; }

// ---- extended mission mechanics: tail, eavesdrop, choice, sneak (vision cones), timed escape, bonus objectives ----
function roadPath(ax, az, bx, bz) { const A = nearestNode(ax, az), B = nearestNode(bx, bz); if (A < 0 || B < 0 || A === B) return [[ax, az], [bx, bz]];
  const dist_ = new Float64Array(GN.length).fill(1e18), prev = new Int32Array(GN.length).fill(-1), pe = new Int32Array(GN.length).fill(-1); const H = [[0, A]]; dist_[A] = 0;
  const push = (it) => { H.push(it); let i = H.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (H[j][0] <= H[i][0]) break; [H[i], H[j]] = [H[j], H[i]]; i = j; } };
  const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[i], H[m]] = [H[m], H[i]]; i = m; } } return top; };
  let it = 0; while (H.length && it++ < 200000) { const [d, u] = pop(); if (u === B) break; if (d > dist_[u]) continue; for (const k of ADJ[u]) { const e = GE[k], v = e.a === u ? e.b : e.a; let L = 0; for (let q = 2; q < e.p.length; q += 2) L += Math.hypot(e.p[q] - e.p[q - 2], e.p[q + 1] - e.p[q - 1]); if (d + L < dist_[v]) { dist_[v] = d + L; prev[v] = u; pe[v] = k; push([d + L, v]); } } }
  if (prev[B] < 0) return [[ax, az], [bx, bz]]; const segs = []; for (let v = B; v !== A; v = prev[v]) { const e = GE[pe[v]]; const pts = []; for (let q = 0; q < e.p.length; q += 2) pts.push([e.p[q], e.p[q + 1]]); if (e.a === v) pts.reverse(); segs.unshift(pts); }
  const out = [[ax, az]]; segs.forEach(pts => pts.forEach(p => out.push(p))); out.push([bx, bz]); return out; }
function coneMesh(r) { const g = new THREE.CircleGeometry(r, 18, -.55, 1.1); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: .22, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 5; scene.add(m); return m; }
function stepOK(s) { if (!s.only) return true; const [k, v] = s.only.split('='); return (choices[k] || 'a') === v; }
function nextStep() { cleanupStep(); M.i++; while (M.def.steps[M.i] && !stepOK(M.def.steps[M.i])) M.i++; const s = M.def.steps[M.i]; if (!s) return completeMission(); M.s = s; M.t = 0; M.timer = s.t === 'eaves' ? s.time * 2 + 30 : (s.time || 0); M.cp = 0; M.hold = 0; M.wave = 0; M.seen = 0; M.lost = 0; M.said = 0; pager(s.text, 4); if (s.say && s.t !== 'eaves') s.say.forEach(l => say(l)); M.w0 = wanted; if (s.fragile) { const fv = M.veh && M.veh.alive ? M.veh : player.veh; M.fhp = fv ? fv.hp : 0; } if (s.stealth) pager((s.swap ? '[FORGERY SWAP] ' : '[STEALTH] ') + s.text + ' (An alarm fails the job.)', 4); if (s.fragile) pager('[FRAGILE CARGO] ' + s.text, 4);
  const [px, pz] = ppos(); const at = s.at ? POI[s.at] : null;
  switch (s.t) {
    case 'steal': { const have = player.veh && player.veh.type === s.vtype; if (have) break; if (s.vtype === 'tram') { M.target = vehs.find(v => v.type === 'tram' && v.alive) || (tram = spawnRail('tram', 40)); break; }
      const vp = s.at ? POIV[s.at] : snapWalk(Math.floor(px / T) + 4, Math.floor(pz / T), true); const v = spawnVeh(s.vtype, vp[0], vp[1], 0, { parked: true, mission: true }); if (rnd() < .5) { v.driver = spawnPed('civ', vp[0], vp[1], { inVeh: v }); v.driver.mesh.visible = false; peds.splice(peds.indexOf(v.driver), 1); } M.target = v; break; }
    case 'kill': { if (s.give) { giveWeapon(s.give, s.give === 'swordcane' ? 1e9 : 60); player.w = WI[s.give]; } const n = s.n || 3; const col = FCOL[M.def.fac === 'apache' ? 'velvet' : M.def.fac === 'velvet' ? 'apache' : 'velvet'];
      for (let k = 0; k < n; k++) { const [x, z] = ringPos(at[0], at[1], 9); M.ents.push(spawnPed(k === 0 && s.boss ? 'boss' : 'gang', x, z, { mission: true, hostile: true, armed: s.armed && (k % 2 === 0 || s.boss), col: k === 0 && s.boss ? undefined : col })); } break; }
    case 'destroy': { const n = s.n || 2; for (let k = 0; k < n; k++) { const [x, z] = ringPos(at[0], at[1], 7); if (s.what === 'vehicle') { const vp = snapWalk(Math.floor(x / T), Math.floor(z / T), true); const v = spawnVeh(s.vtype || 'gig', vp[0] + k * 1.5, vp[1], k, { parked: true, mission: true }); M.vehs.push(v); }
        else M.props.push(addDynProp('crate', x, z, { hp: 60 })); } giveWeapon('molotov', 3); break; }
    case 'smash': { const n = s.n || 5; for (let k = 0; k < n; k++) { const [x, z] = ringPos(at[0], at[1], 5); M.props.push(addDynProp('table', x, z)); } break; }
    case 'collect': { const n = s.n || 4; for (let k = 0; k < n; k++) { const [x, z] = ringPos(at[0], at[1], 22); M.pks.push(addPickup('mission', x, z)); } break; }
    case 'escort': { const [x, z] = [POIV[s.at][0] + 1.5, POIV[s.at][1] + 1.5]; M.vip = spawnPed('vip', x, z, { mission: true, stand: true, look: whoLook(s) }); M.vip.god = true; M.ents.push(M.vip); M.board = false; break; }
    case 'survive': { if (s.lvl) heat = Math.max(heat, LV[s.lvl] + .5); break; }
    case 'race': { M.cps = s.cps.map(c => POIV[c]); break; }
    case 'tail': { const a = POI[s.at], b = POI[s.to]; M.mark = spawnPed('vip', a[0], a[1], { mission: true, stand: true, col: s.col }); M.mark.god = true; M.ents.push(M.mark); M.path = roadPath(a[0], a[1], b[0], b[1]); M.pi = 1; break; }
    case 'eaves': { const a = POI[s.at]; for (let k = 0; k < 2; k++) { const p = spawnPed('vip', a[0] + (k ? 1.4 : -1.4), a[1], { mission: true, stand: true, look: whoLook(s, k) }); p.god = true; p.a = k ? Math.PI : 0; M.ents.push(p); } M.prog = 0; break; }
    case 'choice': break;
    case 'sneak': { const a = POI[s.at], n = s.n || 3; M.cones = []; M.guards = []; for (let k = 0; k < n; k++) { const ang = k / n * 6.28, rr = 9 + (k % 2) * 5; let [x, z] = [a[0] + Math.cos(ang) * rr, a[1] + Math.sin(ang) * rr]; if (pedBlock(x, z)) [x, z] = ringPos(a[0], a[1], 14); const g = spawnPed('gang', x, z, { mission: true, stand: true, col: FCOL.velvet }); g.a = ang + Math.PI; g.sweep = (k % 2 ? 1 : -1) * (.35 + k * .07); g.a0 = g.a; M.ents.push(g); M.guards.push(g); M.cones.push(coneMesh(s.r || 9)); } break; }
  }
  M.dtgt = null; if (s.t === 'deliver' && player.veh && player.veh.d.rail) { const P = player.veh.rp, q = pathAt(P, pathNear(P, POIV[s.at][0], POIV[s.at][1])); M.dtgt = [q[0], q[1]]; }
  if (s.time && !['survive', 'hold', 'eaves'].includes(s.t)) { let dd = 0, [qx, qz] = [px, pz]; const pts = s.t === 'race' ? M.cps : [stepTarget(), s.to ? POIV[s.to] : null].filter(Boolean); for (const q of pts) { dd += Math.hypot(q[0] - qx, q[1] - qz); [qx, qz] = q; } M.timer = Math.max(s.time, Math.round(dd / 12 + 15)); } }
function stepTarget() { if (!M || !M.s) return null; const s = M.s; switch (s.t) {
  case 'goto': return POI[s.at]; case 'deliver': return M.dtgt || POIV[s.at];
  case 'steal': { const v = M.target; if (v && v.alive) return [v.x, v.z]; return null; }
  case 'kill': { const a = M.ents.filter(p => p.alive); if (!a.length) return null; const [px, pz] = ppos(); a.sort((p, q) => d2(p.x, p.z, px, pz) - d2(q.x, q.z, px, pz)); return [a[0].x, a[0].z]; }
  case 'destroy': { const a = M.vehs.find(v => v.alive && !v.wreck) || M.props.find(p => p.alive); return a ? [a.x, a.z] : null; }
  case 'smash': { const a = M.props.find(p => p.alive); return a ? [a.x, a.z] : null; }
  case 'collect': { const a = M.pks.find(p => p.alive); return a ? [a.x, a.z] : null; }
  case 'escort': return M.board ? POIV[s.to] : [M.vip.x, M.vip.z];
  case 'race': return M.cps[M.cp]; case 'hold': return POI[s.at]; case 'tail': return M.mark && M.mark.alive ? [M.mark.x, M.mark.z] : null; case 'eaves': case 'sneak': return POI[s.at];
  case 'choice': return POI[M.t % 4 < 2 ? s.at : s.to]; default: return null; } }
function updateMission(dt) { if (!M || !M.s || !player.alive) return; const s = M.s; M.t += dt; const [px, pz] = ppos(); const near = (p, r) => p && d2(p[0], p[1], px, pz) < r * r;
  const timed = s.time && !['survive', 'hold'].includes(s.t); if (timed) { M.timer -= dt; if (M.timer <= 0) return failMission('Out of time!'); }
  switch (s.t) {
    case 'goto': if ((near(POI[s.at], 6) || near(POIV[s.at], 6)) && (!s.foot || !player.veh)) { if (s.fence) { const g = addMoney(s.fence); pager(`Fenced: +${g.toLocaleString()} F`, 2); } nextStep(); } break;
    case 'steal': if (player.veh && player.veh.type === s.vtype) { M.veh = player.veh; nextStep(); } else if (M.target && !M.target.alive) return failMission('The carriage was destroyed!'); break;
    case 'deliver': if (s.fragile) { const fv = M.veh && M.veh.alive ? M.veh : player.veh; if (fv && M.fhp && fv.hp < M.fhp - 30) return failMission('The cargo is damaged! Fragile means fragile.'); } if (player.veh && near(M.dtgt || POIV[s.at], 6) && Math.hypot(player.veh.vx, player.veh.vz) < 9) { if (M.veh && player.veh !== M.veh && M.veh.alive) { pager('Wrong carriage! Bring the one you took.', 1); break; } nextStep(); } else if (M.veh && (!M.veh.alive || M.veh.wreck)) return failMission('The cargo is lost!'); break;
    case 'kill': if (M.ents.every(p => !p.alive)) nextStep(); break;
    case 'destroy': if (M.vehs.every(v => !v.alive || v.wreck || v.burn) && M.props.every(p => !p.alive)) nextStep(); break;
    case 'smash': if (M.props.every(p => !p.alive)) { addMoney(500); nextStep(); } break;
    case 'collect': if (s.stealth && wanted > M.w0) return failMission('Alarm bells! You were seen. The job is blown.'); if (M.pks.every(p => !p.alive)) nextStep(); break;
    case 'escort': { const v = M.vip; if (!v.alive) return failMission('Your passenger is dead!');
      if (!M.board) { if (player.veh && d2(v.x, v.z, px, pz) < 64 && Math.hypot(player.veh.vx, player.veh.vz) < 4) { M.board = true; M.bveh = player.veh; v.mesh.visible = false; v.inVeh = player.veh; v.stand = true; pager('Passenger aboard. Drive!', 2); } else if (player.veh && d2(v.x, v.z, px, pz) < 400) v.follow = [px, pz]; }
      else { v.x = M.bveh.x; v.z = M.bveh.z; if (!M.bveh.alive || M.bveh.burn) { if (s.real) { v.mesh.visible = true; v.inVeh = null; v.stand = false; v.flee = 6; return failMission('Your passenger escaped the burning carriage, shaken and unwilling to ride with you again!'); } M.vip.hp = 0; M.vip.alive = false; return failMission('Your passenger is dead!'); }
        if (player.veh === M.bveh && near(POIV[s.to], 6) && Math.hypot(player.veh.vx, player.veh.vz) < 9) { v.mesh.visible = true; v.x += 3; v.inVeh = null; v.stand = false; v.alive = true; addMoney(300); M.ents = M.ents.filter(e => e !== v); v.flee = 3; nextStep(); } } break; }
    case 'survive': { if (s.lose) { if (wanted === 0) nextStep(); } else { M.timer -= dt; if (wanted < s.lvl) heat = Math.max(heat, LV[s.lvl] + .5); if (M.timer <= 0) { heat = s.next0 ? 0 : heat; nextStep(); } } break; }
    case 'race': if (!player.veh) { if (M.t > 1) pager('Get back in a carriage!', .5); } else if (near(M.cps[M.cp], 7)) { M.cp++; SFX.pager(); if (M.cp >= M.cps.length) nextStep(); } break;
    case 'tail': { const p = M.mark; if (!p || !p.alive) return failMission('The mark is gone.'); const q = M.path[M.pi]; if (!q) { nextStep(); break; } const dx = q[0] - p.x, dz = q[1] - p.z, L = Math.hypot(dx, dz), sp = s.veh ? 6.5 : 2.6;
      if (L < .6) M.pi++; else { const st = Math.min(L, sp * dt); p.x += dx / L * st; p.z += dz / L * st; p.a = Math.atan2(dz, dx); p.walkT = (p.walkT || 0) + dt; }
      const dd = Math.sqrt(d2(p.x, p.z, px, pz)); const close = s.veh ? 7 : 4.5, far = s.veh ? 60 : 38;
      if (dd < close) { M.seen += dt; if (M.seen > 1.2) return failMission('Your mark glances back, and knows your face. The tail is blown.'); if (M.seen > .2 && M.seen < .25) pager('Too close! Drop back.', 1); } else M.seen = Math.max(0, M.seen - dt * .5);
      if (dd > far) { M.lost += dt; if (M.lost > 6) return failMission('You have lost your mark in the crowd.'); if (M.lost < dt * 1.5) pager('You are losing the mark! Close up.', 1.5); } else M.lost = 0;
      if (s.say && M.said < s.say.length && M.pi / M.path.length > (M.said + 1) / (s.say.length + 1)) say(s.say[M.said++]); break; }
    case 'eaves': { const a = POI[s.at]; const dd = Math.sqrt(d2(a[0], a[1], px, pz)); if (player.veh) { if (M.t > 1 && M.t % 3 < dt) pager('On foot, or they will hear the wheels.', 1.5); break; }
      if (dd < 2.2) { M.seen += dt; if (M.seen > 1) return failMission('"Monsieur is listening at keyholes?" They have made you.'); } else M.seen = Math.max(0, M.seen - dt);
      if (M.t < 3) M.w0 = Math.max(M.w0, wanted); else if (wanted > M.w0 && wanted >= 2) return failMission('The commotion ends the conversation. Nothing more will be said tonight.');
      if (dd < (s.r || 9)) { M.prog += dt; const L = s.say || [], due = Math.floor(M.prog / s.time * L.length); while (M.said < Math.min(due + 1, L.length)) say(L[M.said++], s.time / Math.max(1, L.length)); if (M.prog >= s.time) nextStep(); } else if (M.t > 1 && M.t % 4 < dt) pager('Move closer to hear, but not too close.', 1.5); break; }
    case 'choice': { const A = POI[s.at], B = POI[s.to]; const pick = near(A, 6) || near(POIV[s.at], 6) ? 'a' : near(B, 6) || near(POIV[s.to], 6) ? 'b' : null; if (pick) { choices[s.key] = pick; save(); const r = pick === 'a' ? s.ra : s.rb; if (r) say(r); if (s.pay) addMoney(pick === 'a' ? s.pay[0] : s.pay[1]); nextStep(); } break; }
    case 'sneak': { const a = POI[s.at]; if (M.guards) { let spotted = false; M.guards.forEach((g, k) => { const c = M.cones[k]; if (!g.alive) { c.visible = false; return; } g.a = g.a0 + Math.sin(M.t * .6 + k * 1.7) * 1.1 * Math.sign(g.sweep); c.position.set(g.x, .12, g.z); c.rotation.z = -g.a; c.visible = true; const dx = px - g.x, dz = pz - g.z, dd = Math.hypot(dx, dz); if (dd < (s.r || 9)) { let da = Math.atan2(dz, dx) - g.a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) < .55 || dd < 1.6) spotted = true; } });
        if (spotted) { M.seen += dt; if (M.seen > .7) { M.guards.forEach(g => { g.hostile = true; g.stand = false; }); return failMission('"Qui va là?" A watchman has seen you. The alarm is up.'); } } else M.seen = Math.max(0, M.seen - dt * .7);
        if (M.guards.some(g => !g.alive)) { return failMission('A watchman down means a watchman missed. The job is blown.'); } }
      if (near(a, 3.5) && !player.veh) nextStep(); else if (player.veh && M.t > 1 && M.t % 4 < dt) pager('Leave the carriage. This is work for soft shoes.', 1.5); break; }
    case 'hold': { const p = POI[s.at]; if (near(p, 14)) { M.hold += dt; M.wave -= dt; if (M.wave < 0) { M.wave = 6; for (let k = 0; k < 2; k++) { const [x, z] = ringPos(p[0], p[1], 26); M.ents.push(spawnPed('gang', x, z, { mission: true, hostile: true, armed: s.armed && k === 0, col: FCOL.velvet })); } } if (M.hold >= s.time) nextStep(); } else if (M.t > 1) pager('Get back to the position!', .5); break; }
  } }
function completeMission() { const d = M.def; if (M.bonus) { if (!M.bonus.alive) { choices['bonus_' + d.id] = 'b'; setTimeout(() => pager('Optional objective complete: ' + d.bonus.text, 3), 3000); } else { M.bonus.alive = false; M.bonus.m.visible = false; } } if (d.outro) d.outro.forEach(l => say(l)); const first = !done[d.id]; done[d.id] = true; if (d.loot && !gallery.includes(d.loot)) { gallery.push(d.loot); setTimeout(() => pager('Added to the safehouse gallery: ' + d.loot, 4), 4200); } const got = addMoney(d.reward); if (d.fac !== 'side') { respect[d.fac] = Math.min(100, respect[d.fac] + d.respect); const r = FACTIONS[d.fac].rival; if (respect[r] !== undefined) respect[r] -= Math.round(d.respect / 2); }
  if (first) mult = Math.min(8, mult + (d.n % 5 === 0 || d.fac === 'side' && d.n % 7 === 0 ? 1 : 0)); big('MISSION COMPLETE', 3); pager(`+${got.toLocaleString()} F  ·  Respect ${d.fac !== 'side' ? facName(d.fac) + ' ' + respect[d.fac] : '+'}  ·  ×${mult}`, 4); SFX.bell();
  M.s = null; cleanupStep(); stats.completed++; M = null; save(); }
let lastFail = ''; function failMission(why) { if (!M) return; if (M.bonus && M.bonus.alive) { M.bonus.alive = false; M.bonus.m.visible = false; } sayQ.length = 0; sayT = 0; lastFail = M.def.id + ':' + (M.s && M.s.t) + ':' + why; big('MISSION FAILED', 3); pager(why, 3); cleanupStep(); M.vehs.forEach(v => v.mission = false); M = null; stats.failed++; }
const stats = { completed: 0, failed: 0 };
// ================= SAVE =================
function save() { try { localStorage.setItem('gtaParis1880', JSON.stringify({ money, mult, respect, done, choices, gallery, ammo: player.ammo, gameTime })); } catch (e) { } }
function load() { try { const s = JSON.parse(localStorage.getItem('gtaParis1880')); if (!s) return false; money = s.money; mult = s.mult; respect = s.respect; done = s.done; gallery = s.gallery || []; choices = s.choices || {}; player.ammo = s.ammo; player.ammo.fists = 1e9; gameTime = s.gameTime; return true; } catch (e) { return false; } }
// ================= WORLD SIM =================
let tram = spawnRail('tram', TRAM.len * .3); tram.sp = 8;
let train = spawnRail('train', 0); train.sp = 0; train.stopT = 4;
const PARKED = [['phaeton', 'garnier'], ['brougham', 'chien'], ['gig', 'tertre'], ['barouche', 'elysee'], ['omnibus', 'boulmich'], ['brougham', 'procope'], ['phaeton', 'bourse'], ['gig', 'bateau'], ['bicycle', 'garnier', 6], ['pennyfarthing', 'boulmich', 5], ['velocipede', 'tertre', 4], ['panhard', 'elysee', 7], ['peugeot', 'bourse', 7], ['benz', 'procope', 6], ['bicycle', 'chien', 5]];
PARKED.forEach(([t, p, off]) => { const [x, z] = POIV[p]; let px = x + 2 + (off || 0), pz = z; for (let k = 0; k < 12 && vPen({ d: VT[t] }, px, pz, 0); k++) { px = x + 2 + Math.cos(k) * (off || 3); pz = z + Math.sin(k) * (off || 3); } spawnVeh(t, px, pz, 0, { parked: true, home: true }); });
function railAuto(v, dt) { if (v.type === 'tram') { if (Math.abs(v.sp) < .5 && (v.s >= v.rp.len - 5 || v.s <= 5)) v.tdir = v.s > v.rp.len / 2 ? -1 : 1; let thr = (v.tdir || 1);
    const [px, pz] = ppos(); const [lx, lz] = railLocal(v, px, pz); if (Math.abs(lz) < 3 && lx * Math.sign(v.sp || 1) > 0 && Math.abs(lx) < 12) thr = -Math.sign(v.sp || 1); if (rnd() < dt * .5 && Math.abs(v.sp) > 3) SFX.hoof(); driveRail(v, thr * .6, dt); v.sp = Math.max(-9, Math.min(9, v.sp));
    v.smk = (v.smk || 0) - dt; if (v.smk < 0 && Math.abs(v.sp) > 1) { v.smk = .5; FX.smoke(v.x, 3.6, v.z, 1, .2, 1.4); } }
  else { if (v.stopT > 0) { v.stopT -= dt; v.sp = 0; driveRail(v, 0, dt); v.sp = 0; if (v.stopT <= 0) { tone(330, .6, 'sawtooth', .05); v.sp = 2; } return; } driveRail(v, .6, dt); v.sp = Math.min(v.sp, 18);
    v.smk = (v.smk || 0) - dt; if (v.smk < 0) { v.smk = .12; const st = v.V.stack || [2.7, 4, 0]; FX.smoke(v.x + Math.cos(v.a) * st[0], st[1] + .3, v.z + Math.sin(v.a) * st[0], 2, .8, 2.4); } } }
function populate(dt) { const [px, pz] = ppos();
  const civs = peds.filter(p => p.type === 'civ' && p.alive).length; const want = G.Q.peds || 42;
  if (civs < want) for (let k = 0; k < 3; k++) { const a = rnd() * 6.28, r = 30 + rnd() * 30, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r; const kk = kAt(x, z); if (kk === K.SIDE || kk === K.PARK || kk === K.STAIR) { spawnPed('civ', x, z); break; } }
  const tr = vehs.filter(v => v.traffic).length; if (tr < (G.Q.traffic || 20)) spawnTraffic(px, pz);
  for (const p of [...peds]) if (!p.mission && d2(p.x, p.z, px, pz) > 100 * 100) removePed(p);
  for (const v of [...vehs]) if ((v.traffic || (v.wreck && !v.mission) || (v.police && wanted === 0)) && v !== player.veh && d2(v.x, v.z, px, pz) > 150 * 150) removeVeh(v);
  for (const p of tempProps) if (p.temp && p.alive) { p.temp -= dt; if (p.temp < 0) { p.alive = false; setPropM(p); } }
  // gang presence by turf when respect low
  if (rnd() < dt * .2) { const d = dist[tileAt(px, pz)] ?? 1; const fac = d === 0 ? 'avant' : d === 2 || d === 9 ? 'apache' : d === 6 || d === 11 ? 'crimson' : d === 1 || d === 7 ? 'velvet' : null;
    if (fac && peds.filter(p => p.gang && p.alive).length < 4) { const a = rnd() * 6.28, x = px + Math.cos(a) * 35, z = pz + Math.sin(a) * 35; if (!pedBlock(x, z)) spawnPed('gang', x, z, { gang: fac, col: FCOL[fac], hostile: respect[fac] < -10, armed: respect[fac] < -30 }); } } }
function updateProjs(dt) { for (let k = projs.length - 1; k >= 0; k--) { const p = projs[k]; p.t -= dt; const nx = p.x + p.vx * dt, nz = p.z + p.vz * dt; let hit = pedBlock(nx, nz) && kAt(nx, nz) === K.BLD;
    if (!hit && p.type !== 'dynamite') hit = peds.some(q => q.alive && d2(q.x, q.z, nx, nz) < 1) || vehs.some(v => v.alive && v !== player.veh && d2(v.x, v.z, nx, nz) < 4) || propsNear(nx, nz).some(q => q.r > 0 && d2(q.x, q.z, nx, nz) < (q.r + .3) ** 2);
    if (hit) { p.vx *= -.2; p.vz *= -.2; } else { p.x = nx; p.z = nz; } p.vx *= (1 - dt * 1.5); p.vz *= (1 - dt * 1.5); p.m.position.set(p.x, 1 + Math.max(0, p.t) * 2, p.z); p.m.rotation.y += dt * 10;
    if (hit && p.type !== 'dynamite' || p.t <= 0) { scene.remove(p.m); fx.splice(fx.findIndex(f => f.m === p.m), 1); projs.splice(k, 1);
      if (p.type === 'brick') { for (const q of peds) if (q.alive && d2(q.x, q.z, p.x, p.z) < 2.5) { damagePed(q, 40, 'player'); break; } for (const q of propsNear(p.x, p.z)) if (d2(q.x, q.z, p.x, p.z) < 4) damageProp(q, 30); for (const v of vehs) if (v.alive && v !== player.veh && d2(v.x, v.z, p.x, p.z) < 9) damageVeh(v, 15, true, 'player'); SFX.hit(); }
      else if (p.type === 'dynamite') explode(p.x, p.z, 6, 170);
      else { SFX.crash(); fires.push({ x: p.x, z: p.z, t: 5 }); FX.sparks(p.x, p.z, 10, 4, .5); crime(1); } } }
  for (let k = fires.length - 1; k >= 0; k--) { const f = fires[k]; f.t -= dt; FX.fire(f.x, f.z, 1.4 * Math.min(1, f.t)); FX.fire(f.x + (rnd() - .5) * 2, f.z + (rnd() - .5) * 2, 1); if (f.t < 0) { fires.splice(k, 1); continue; }
    for (const q of peds) if (q.alive && d2(q.x, q.z, f.x, f.z) < 6) damagePed(q, 30 * dt, 'player'); for (const v of vehs) if (v.alive && d2(v.x, v.z, f.x, f.z) < 9) damageVeh(v, 30 * dt, false, 'player'); for (const q of propsNear(f.x, f.z)) if (d2(q.x, q.z, f.x, f.z) < 9) damageProp(q, 25 * dt);
    if (!player.veh && d2(player.x, player.z, f.x, f.z) < 5) hurtPlayer(15 * dt); } }
const fires = [];
function updateFx(dt) { for (let k = fx.length - 1; k >= 0; k--) { const f = fx[k]; f.t -= dt; if (f.grow) { const s = f.m.scale.x + f.grow * dt; f.m.scale.set(s, 1, s); } if (f.t <= 0) { scene.remove(f.m);  fx.splice(k, 1); } } }
function updateVehs(dt) { for (const v of [...vehs]) { if (!v.alive) continue; v.t += dt;
    if (v.burn) { v.burn -= dt; FX.fire(v.x + (rnd() - .5) * 2, v.z + (rnd() - .5) * 2, 1.2); if (v.burn <= 0) { v.burn = 0; v.wreck = true; v.hp = 0; v.mesh.traverse(o => { if (o.isMesh && o.material !== LAMPMAT && !o.userData.blob) o.material = charMat; if (o.material === LAMPMAT) o.visible = false; }); v.hs.forEach(h => h.visible = false); explode(v.x, v.z, 5, 100); if (v.police) crime(3); if (player.veh === v) { hurtPlayer(80); enterExitForce(); } v.vx = v.vz = 0; } }
    if (v === player.veh) continue;
    if (v.railAuto) railAuto(v, dt); else if (v.police && v.driver && !v.wreck) policeAI(v, dt); else if (v.traffic && v.driver && !v.wreck) trafficAI(v, dt); else if (v.wreck || v.parked || !v.driver) { if (!v.d.rail) driveVeh(v, 0, 0, dt); else driveRail(v, 0, dt); }
    if (v.traffic && v.driver && Math.hypot(v.vx, v.vz) < .5) { v.stk = (v.stk || 0) + dt; if (v.stk > 6) { v.panic = false; v.a += 1.57; v.stk = 0; } } } }
function enterExitForce() { const v = player.veh; if (!v) return; player.veh = null; v.driver = null; player.x = v.x + 3; player.z = v.z; if (pedBlock(player.x, player.z)) player.x = v.x - 3; player.mesh.visible = true; }
// ================= DAY / NIGHT =================
let daylight = 1;
function updateSky(dt) { gameTime = (gameTime + dt / 25) % 24; const h = gameTime; daylight = h > 6 && h < 19 ? 1 : h > 5 && h <= 6 ? h - 5 : h >= 19 && h < 20.5 ? 1 - (h - 19) / 1.5 : 0;
  weatherT -= dt; if (weatherT < 0) { weatherT = 60 + rnd() * 90; rainTarget = rnd() < .35 ? 1 : 0; if (rainTarget) pager('Rain! The pavé turns to glass.', 2); } rain += (rainTarget - rain) * dt * .3;
  G.setEnv(daylight, rain, h); LAMPMAT.color.setScalar(.45 + .55 * (1 - daylight)); }
// ================= CAMERA =================
let camH = 40, camOverride = 0; const camPos = new THREE.Vector3(); const TILT = .34;
function updateCam(dt) { const v = player.veh; const sp = v ? Math.hypot(v.vx, v.vz) + Math.abs(v.sp || 0) : 0; const tgt = camOverride || (44 + sp * 1.3); camH += (tgt - camH) * Math.min(1, dt * 1.5); if (camOverride) camH = camOverride;
  const lx = v ? v.vx * .5 : 0, lz = v ? v.vz * .5 : 0; const tx = player.x + lx, tz = player.z + lz; camPos.x += (tx - camPos.x) * Math.min(1, dt * 5); camPos.z += (tz - camPos.z) * Math.min(1, dt * 5);
  const sx = camShake > 0 ? (rnd() - .5) * camShake * 2 : 0; camShake = Math.max(0, camShake - dt); const hy = G.hillH(camPos.x, camPos.z);
  camera.up.set(0, 0, -1); camera.position.set(camPos.x + sx, camH + hy, camPos.z + camH * TILT + sx); camera.lookAt(camPos.x + sx, hy, camPos.z + sx); }
// ================= MESH SYNC =================
let lastSync = 0;
function animOf(o, P, dt, punch, dead) { const sp = Math.hypot(o.x - o.lx, o.z - o.lz) / Math.max(dt, 1e-3); o.lx = o.x; o.lz = o.z; animPed(P, Math.min(sp, 14), dt, punch, dead); }
function syncMeshes(t) { const dt = Math.min(.1, Math.max(0, t - lastSync)); lastSync = t; const [cx, cz] = [camPos.x, camPos.z];
  for (const p of peds) { if (p.inVeh) { p.mesh.visible = false; continue; } const far = d2(p.x, p.z, cx, cz) > 90 * 90; p.mesh.visible = !far; if (far) continue; p.mesh.position.set(p.x, 0, p.z); p.mesh.rotation.y = -p.a; const P = p.mesh.userData.P; if (P) animOf(p, P, dt, false, !p.alive); }
  for (const v of vehs) { v.mesh.position.set(v.x, 0, v.z); v.mesh.rotation.y = -v.a; const far = d2(v.x, v.z, cx, cz) > 110 * 110; v.mesh.visible = !far; if (far) continue;
    const fwd = v.d.rail ? (v.sp || 0) : (v.vx * Math.cos(v.a) + v.vz * Math.sin(v.a)); if (!v.wreck) animVeh(v.V, v.horseDead ? 0 : Math.abs(fwd), dt, fwd); if (v.V.rider) v.V.rider.visible = !!v.driver && !v.wreck; }
  player.mesh.position.set(player.x, 0, player.z); player.mesh.rotation.y = -player.a; player.mesh.userData.P.aim = !WEAP[player.w].melee && !WEAP[player.w].throw && player.alive; animOf(player, player.mesh.userData.P, dt, player.punch > 0, !player.alive);
  for (const pk of pickups) if (pk.alive) { pk.m.rotation.y = t * 2; pk.m.position.y = 1 + Math.sin(t * 4) * .2; }
  for (const pk of pickups) if (!pk.alive && pk.rt !== undefined) { pk.rt -= 1 / 60; if (pk.rt <= 0) { pk.alive = true; pk.m.visible = true; delete pk.rt; } }
  phoneRings.forEach((r, k) => { r.visible = !M; r.scale.setScalar(1 + Math.sin(t * 4) * .15); });
  const tg = stepTarget(); objMarker.visible = objArrow.visible = !!tg; if (tg) { objMarker.position.set(tg[0], .35, tg[1]); objMarker.rotation.z = t; objArrow.position.set(tg[0], 5 + Math.sin(t * 5) * .6, tg[1]); objArrow.rotation.y = t * 2; } }
// ================= HUD =================
function drawHead(x, y, s, on) { hx.fillStyle = on ? '#1e2a5a' : 'rgba(40,40,40,.5)'; hx.fillRect(x, y + s * .2, s, s * .35); hx.fillRect(x + s * .1, y, s * .8, s * .3); hx.fillStyle = on ? '#e0b898' : 'rgba(90,90,90,.5)'; hx.fillRect(x + s * .2, y + s * .55, s * .6, s * .45); if (on) { hx.fillStyle = '#d4a020'; hx.fillRect(x + s * .4, y + s * .05, s * .2, s * .2); } }
function txt(s, x, y, size, col = '#f4c430', align = 'left') { hx.font = `bold ${size}px "Courier New",monospace`; hx.textAlign = align; hx.fillStyle = '#000'; hx.fillText(s, x + size * .08, y + size * .08); hx.fillStyle = col; hx.fillText(s, x, y); }
function wrap(s, maxW, size) { hx.font = `bold ${size}px "Courier New",monospace`; const words = s.split(' '), lines = []; let l = ''; for (const w of words) { const t = l ? l + ' ' + w : w; if (hx.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; } if (l) lines.push(l); return lines; }
const _pv = new THREE.Vector3(); function toScreen(x, z, y = 0) { _pv.set(x, y, z).project(camera); return [(_pv.x + 1) / 2 * innerWidth, (1 - _pv.y) / 2 * innerHeight]; }
function hoverName(h) { const o = h.o; if (h.kind === 'veh') return (o.d.n || o.type[0].toUpperCase() + o.type.slice(1)) + (o.driver ? '' : ' — climb aboard'); if (h.kind === 'ped') return o.name || (o.type === 'civ' ? 'Talk' : o.type === 'cop' ? 'Sergent de ville' : o.type === 'gend' ? 'Garde républicaine' : 'Talk'); if (h.kind === 'pick') return 'Pick up'; return o.label || 'Interact'; }
function drawHover() { const c = document.body.style; const want = player.veh ? 'crosshair' : mouse.R ? 'crosshair' : hover ? 'pointer' : 'default'; if (c.cursor !== want) c.cursor = want; const tg = pendingI || hover; if (!tg || player.veh) { if (player.dest && !player.veh) { const [x, y] = toScreen(player.dest[0], player.dest[1]); hx.strokeStyle = 'rgba(240,220,170,.6)'; hx.lineWidth = 1.5; hx.beginPath(); hx.arc(x, y, 6, 0, 7); hx.stroke(); } return; }
  const [x, y] = toScreen(tg.o.x, tg.o.z), r = tg.kind === 'veh' ? 34 : 18; hx.strokeStyle = 'rgba(244,196,48,.9)'; hx.lineWidth = 2; hx.setLineDash([5, 4]); hx.beginPath(); hx.ellipse(x, y, r, r * .8, 0, 0, 7); hx.stroke(); hx.setLineDash([]); txt(hoverName(tg), x, y - r - 8, 13, '#f4e0a0', 'center'); }
function drawHUD(dt) { const dpr = hud.width / innerWidth, Wd = hud.width, H = hud.height; hx.setTransform(dpr, 0, 0, dpr, 0, 0); hx.clearRect(0, 0, innerWidth, innerHeight); const w = innerWidth, h = innerHeight, sm = w < 700;
  if (rain > .05) { hx.strokeStyle = `rgba(180,200,220,${rain * .5})`; hx.lineWidth = 1; hx.beginPath(); for (let k = 0; k < 120 * rain; k++) { const x = Math.random() * w, y = Math.random() * h; hx.moveTo(x, y); hx.lineTo(x - 3, y + 12); } hx.stroke(); }
  if (flash > 0) { hx.fillStyle = `rgba(200,0,0,${flash})`; hx.fillRect(0, 0, w, h); flash -= dt; }
  const fs = sm ? 20 : 28; txt('₣ ' + money.toLocaleString('fr-FR'), 12, fs + 8, fs, '#f4c430'); txt('×' + mult, 12, fs * 2 + 10, fs * .8, '#e04020');
  for (let k = 0; k < 4; k++) drawHead(w - (4 - k) * (sm ? 26 : 34) - 10, 10, sm ? 22 : 30, k < wanted);
  // health
  hx.fillStyle = '#300'; hx.fillRect(12, fs * 2 + 18, 120, 8); hx.fillStyle = player.hp > 30 ? '#c02020' : '#ff4040'; hx.fillRect(12, fs * 2 + 18, 120 * Math.max(0, player.hp) / 100, 8);
  // weapon
  const W_ = WEAP[player.w], am = player.ammo[W_.id] || 0; txt(W_.n + (W_.melee ? '' : W_.mag ? `  ${player.mag[W_.id] || 0}/${W_.mag} · ${am}` : '  ' + am) + (player.rel > 0 ? (W_.one ? '  — loading a round…' : '  — reloading…') : ''), 12, fs * 2 + 44, sm ? 12 : 15, player.rel > 0 ? '#e0a040' : '#e8dcc0');
  drawHover();
  if (player.veh) { const v = player.veh; txt(`${v.type.toUpperCase()}  ${Math.round(Math.hypot(v.vx, v.vz) * 2.2 + Math.abs(v.sp || 0) * 2.2)} km/h  ${v.horseDead ? 'HORSES DOWN' : v.d.horses ? 'horses ' + Math.max(0, Math.round(v.horseHp / v.d.horses / .6)) + '%' : ''}`, 12, fs * 2 + 62, sm ? 11 : 13, v.horseDead ? '#f44' : '#bca'); }
  // minimap
  const ms = sm ? 90 : 130, mx = w - ms - 10, my = sm ? 44 : 52; hx.globalAlpha = .85; hx.imageSmoothingEnabled = false; hx.save(); hx.beginPath(); hx.rect(mx, my, ms, ms); hx.clip(); const zoom = 1.4, [px, pz] = ppos();
  hx.imageSmoothingEnabled = true; hx.drawImage(G.mapCanvas(), mx + ms / 2 - px / T * zoom, my + ms / 2 - pz / T * zoom, NX * zoom, NZ * zoom); hx.fillStyle = '#ff0'; hx.fillRect(mx + ms / 2 - 2, my + ms / 2 - 2, 4, 4);
  const tg = stepTarget(); const dot = (q, c) => { const x = mx + ms / 2 + (q[0] - px) / T * zoom, y = my + ms / 2 + (q[1] - pz) / T * zoom; hx.fillStyle = c; hx.fillRect(Math.max(mx, Math.min(mx + ms - 5, x - 3)), Math.max(my, Math.min(my + ms - 5, y - 3)), 6, 6); };
  if (!M) PHONES.forEach(p => dot([p.x, p.z], p.fac === 'side' ? '#fc0' : '#f3c')); if (tg) dot(tg, '#ff0'); for (const p of peds) if (p.alive && (p.type === 'cop' || p.type === 'gend')) dot([p.x, p.z], '#44f');
  hx.restore(); hx.globalAlpha = 1; hx.strokeStyle = '#f4c430'; hx.strokeRect(mx, my, ms, ms); txt(String(Math.floor(gameTime)).padStart(2, '0') + ':' + String(Math.floor(gameTime % 1 * 60)).padStart(2, '0') + (rain > .5 ? ' ☂' : ''), mx, my + ms + 16, 13, '#e8dcc0');
  // pager
  if (sayT <= 0 && sayQ.length) { [sayMsg, sayT] = sayQ.shift(); } if (sayT > 0) { sayT -= dt; const pw = Math.min(w - 120, 760), ci = sayMsg.indexOf(': '), who = ci > 0 && ci < 34 ? sayMsg.slice(0, ci) : '', body = who ? sayMsg.slice(ci + 2) : sayMsg, lines = wrap(body, pw - 30, 16); const ph = lines.length * 21 + (who ? 30 : 14), x0 = (w - pw) / 2, y0 = H / dpr - ph - 70; hx.fillStyle = 'rgba(12,10,8,.78)'; hx.fillRect(x0, y0, pw, ph); hx.strokeStyle = 'rgba(214,180,110,.7)'; hx.strokeRect(x0 + 3, y0 + 3, pw - 6, ph - 6); if (who) txt(who.toUpperCase(), x0 + 15, y0 + 22, 13, '#d8b46a'); lines.forEach((l, k) => txt(l, x0 + 15, y0 + (who ? 42 : 24) + k * 21, 16, '#f2ead8')); }
  if (M && M.s && M.s.text) { const ot = (M.s.t === 'eaves' && M.prog ? `[${Math.min(100, Math.round(M.prog / M.s.time * 100))}%] ` : '') + M.s.text; txt(ot.length > 110 ? ot.slice(0, 107) + '...' : ot, 14, H / dpr - 22, 13, '#e8d9a8'); if (M.seen > .05 && ['tail', 'eaves', 'sneak'].includes(M.s.t)) txt('!! BEING NOTICED !!', w / 2, H / dpr - 46, 16, '#ff5040', 'center'); }
  if (pagerT <= 0 && pagerQ.length) { [pagerMsg, pagerT] = pagerQ.shift(); SFX.pager(); } if (pagerT > 0) { pagerT -= dt; const pw = sm ? w - 20 : Math.min(w - 340, 640), lines = wrap(pagerMsg, pw - 20, sm ? 12 : 15); const ph = lines.length * (sm ? 15 : 19) + 14, x0 = (w - pw) / 2, py = sm ? 150 : 8; hx.save(); hx.translate(0, py - 8);
    hx.fillStyle = 'rgba(30,40,30,.88)'; hx.fillRect(x0, 8, pw, ph); hx.strokeStyle = '#8c8'; hx.strokeRect(x0, 8, pw, ph); lines.forEach((l, k) => txt(l, x0 + 10, 26 + k * (sm ? 15 : 19), sm ? 12 : 15, '#bfe8a8')); hx.restore(); }
  // objective arrow
  if (tg) { const a = Math.atan2(tg[1] - pz, tg[0] - px), dd = Math.hypot(tg[0] - px, tg[1] - pz); if (dd > 12) { const cx = w / 2 + Math.cos(a) * Math.min(w, h) * .3, cy = h / 2 + Math.sin(a) * Math.min(w, h) * .3; hx.save(); hx.translate(cx, cy); hx.rotate(a); hx.fillStyle = '#ffe040'; hx.strokeStyle = '#000'; hx.lineWidth = 2; hx.beginPath(); hx.moveTo(18, 0); hx.lineTo(-10, -12); hx.lineTo(-4, 0); hx.lineTo(-10, 12); hx.closePath(); hx.fill(); hx.stroke(); hx.restore(); } }
  if (M && M.s) { let st = M.s.text; if (M.s.t === 'kill') st += ` ${M.ents.filter(p => p.alive).length} left`; if (M.s.t === 'collect') st += ` ${M.pks.filter(p => p.alive).length} left`; if (M.s.t === 'race') st += ` CP ${M.cp + 1}/${M.cps.length}`; if (M.s.t === 'hold') st += ` ${Math.max(0, Math.ceil(M.s.time - M.hold))}s`; if (M.s.t === 'survive' && !M.s.lose) st += ` ${Math.ceil(M.timer)}s`;
    if (M.timer && !['survive', 'hold'].includes(M.s.t)) st += `  ⏱ ${Math.ceil(M.timer)}`; txt(st, w / 2, h - 30, sm ? 14 : 18, '#ffe040', 'center'); }
  if (bigT > 0) { bigT -= dt; txt(bigMsg, w / 2, h * .38, sm ? 30 : 52, bigMsg === 'WASTED' || bigMsg === 'BUSTED' || bigMsg.includes('FAIL') ? '#e02020' : '#f4c430', 'center'); }
  if (districtT > 0) { districtT -= dt; txt(districtMsg, w / 2, h * .48, sm ? 16 : 22, '#e8dcc0', 'center'); }
  if (!M && nearPhone) txt(nearPhone.fac === 'side' ? 'Newsstand kiosk — side job: walk in' : `${facName(nearPhone.fac)} — magneto phone`, w / 2, h * .6, sm ? 13 : 16, '#ffe040', 'center'); for (const f of HOOKS.hud) f(hx, w, h, sm); }
// ================= FULL MAP (M) =================
let mapOpen = false;
function drawFullMap() { const w = innerWidth, h = innerHeight, mc = G.mapCanvas(); const sc = Math.min((w - 40) / NX, (h - 70) / NZ), ox = (w - NX * sc) / 2, oy = 46; hx.fillStyle = 'rgba(10,8,6,.92)'; hx.fillRect(0, 0, w, h); hx.imageSmoothingEnabled = true; hx.drawImage(mc, ox, oy, NX * sc, NZ * sc); hx.strokeStyle = '#f4c430'; hx.strokeRect(ox, oy, NX * sc, NZ * sc);
  const P = (x, z) => [ox + x / T * sc, oy + z / T * sc]; txt('PARIS 1890 — Plan de la Ville  (M to close)', w / 2, 30, 18, '#f4c430', 'center');
  hx.save(); for (const [n, x, z, a] of LABELS) { if (x < 0 || z < 0 || x > WX || z > WZ) continue; const [sx, sy] = P(x, z); hx.save(); hx.translate(sx, sy); hx.rotate(a || 0); hx.font = 'italic 10px Georgia,serif'; hx.textAlign = 'center'; hx.fillStyle = 'rgba(30,24,16,.9)'; hx.fillText(n, 1, 1); hx.fillStyle = '#f0e6cc'; hx.fillText(n, 0, 0); hx.restore(); }
  for (const k in LM) { const L = LM[k]; const [sx, sy] = P(L[1], L[2]); hx.fillStyle = '#e8b040'; hx.beginPath(); hx.arc(sx, sy, 2.5, 0, 7); hx.fill(); hx.font = 'bold 10px "Courier New",monospace'; hx.textAlign = 'left'; hx.fillStyle = '#000'; hx.fillText(L[0], sx + 5, sy + 4); hx.fillStyle = '#ffe6a0'; hx.fillText(L[0], sx + 4, sy + 3); }
  if (!M) for (const p of PHONES) { const [sx, sy] = P(p.x, p.z); hx.fillStyle = p.fac === 'side' ? '#fc0' : '#f3c'; hx.fillRect(sx - 4, sy - 4, 8, 8); }
  const tg = stepTarget(); if (tg) { const [sx, sy] = P(tg[0], tg[1]); hx.strokeStyle = '#ff0'; hx.lineWidth = 2; hx.beginPath(); hx.arc(sx, sy, 7, 0, 7); hx.stroke(); }
  for (const f of HOOKS.map) f(hx, P); const [px, pz] = ppos(), [sx, sy] = P(px, pz); hx.fillStyle = '#ff2'; hx.beginPath(); hx.arc(sx, sy, 5, 0, 7); hx.fill(); hx.strokeStyle = '#000'; hx.stroke(); hx.restore();
  txt('● landmarks   ■ magneto phones   ◯ objective   ● you', w / 2, h - 10, 12, '#e8dcc0', 'center'); }
addEventListener('keydown', e => { if (e.code === 'KeyM' && state === 'play') mapOpen = !mapOpen; });
// ================= MENUS =================
let state = 'title', paused = false, nearPhone = null, phoneCD = 0, holyCD = 0, holeCD = 0;
const $ = id => document.getElementById(id);
function startGame(cont) { audio(); if (!cont) { localStorage.removeItem('gtaParis1880'); money = 0; mult = 1; done = {}; gallery = []; respect = { apache: 0, avant: 0, velvet: 0, crimson: 0 }; player.ammo = { fists: 1e9 }; giveWeapon('brick', 4); } else load();
  $('title').classList.add('hidden'); state = 'play'; camPos.set(player.x, 0, player.z); pager(HOOKS.welcome || 'Paris, 1890. Fresh off the night train with nothing but a watchmaker\'s hands.', 7); }
$('bPlay').onclick = () => startGame(false); $('bCont').onclick = () => startGame(true); if (!localStorage.getItem('gtaParis1880')) $('bCont').style.display = 'none';
function setPause(on) { paused = on; $('pause').classList.toggle('hidden', !on); if (on) buildMenu(); }
$('bGal').onclick = () => { $('mlist').innerHTML = '<h4>Safehouse Gallery — rescued paintings, scores, instruments &amp; evidence</h4>' + (gallery.length ? gallery.map(g => `<div>🖼 ${g}</div>`).join('') : '<div>Empty, for now. Heists marked ◆ fill these walls.</div>'); };
$('bCodex').onclick = () => { $('mlist').innerHTML = '<h4>Dramatis Personae</h4>' + DRAMATIS.map(d => `<div style="text-align:left;margin:4px 0"><b>${d.name}</b>${d.real ? ' <small>[historical]</small>' : ''}: ${d.role}</div>`).join('') + '<p><small>Historical figures appear as themselves, respectfully; all villains and crimes are fictional.</small></p>'; };
$('bRes').onclick = () => setPause(false); $('bSave').onclick = () => { save(); $('bSave').textContent = 'SAVED ✓'; setTimeout(() => $('bSave').textContent = 'SAVE', 1200); };
$('bGfx').onclick = () => { $('pause').classList.add('hidden'); G.openSettings(() => $('pause').classList.remove('hidden')); };
$('bSnd').onclick = () => { snd = !snd; $('bSnd').textContent = 'SOUND: ' + (snd ? 'ON' : 'OFF'); }; $('bAbort').onclick = () => { if (M) failMission('Mission abandoned.'); setPause(false); };
function buildMenu() { const nd = Object.keys(done).length; $('pstats').innerHTML = `₣ ${money.toLocaleString('fr-FR')} · ×${mult} · Missions ${nd}/${MISSIONS.length} · Respect: ` + Object.entries(respect).map(([k, v]) => `${k} ${v}`).join(' · ');
  let h = ''; const nx = nextStory(); CHAPTERS.forEach((c, ci) => { h += `<h4>${c.act} · ${c.season} · ${c.title}</h4>`; for (const m of STORYM.filter(m => m.chapter === ci)) { const avail = done[m.id] || m === nx; h += `<div class="${done[m.id] ? 'done' : ''}">${avail && DEBUG ? `<button data-m="${m.id}">${done[m.id] ? 'REPLAY' : 'PLAY'}</button>` : avail && !done[m.id] ? '📍 ' + (HOOKS.where(m) || '') + ' — ' : avail ? '' : '🔒 '}${m.n}. ${m.heist ? '◆ ' : ''}${m.title} <small>(${facName(m.fac)})</small>${done[m.id] ? ' ✓' : ''}</div>`; } });
  h += `<h4>${facName('side')}</h4>`; for (const m of byFac.side) { const avail = DEBUG || HOOKS.known(m); h += `<div class="${done[m.id] ? 'done' : ''}">${avail && DEBUG ? `<button data-m="${m.id}">${done[m.id] ? 'REPLAY' : 'PLAY'}</button>` : avail ? '📍 ' + (HOOKS.where(m) || '') + ' — ' : '❔ '}${m.n}. ${m.title}${done[m.id] ? ' ✓' : ''}</div>`; }
  $('mlist').innerHTML = h; $('mlist').querySelectorAll('button').forEach(b => b.onclick = () => { const m = MISSIONS.find(x => x.id === b.dataset.m); if (M) failMission('Abandoned.'); setPause(false); startMission(m); }); }
// ================= MAIN LOOP =================
let last = performance.now(), simT = 0, dbgPause = false;
function step(dt, I) { if (!player.alive) { deadT -= dt; if (deadT <= 0) respawn(bigMsg); } else updatePlayer(I, dt); updateTriggers();
  for (const p of [...peds]) pedAI(p, dt); updateVehs(dt); updateProjs(dt); updateWanted(dt); updateMission(dt); populate(dt); updateSky(dt); updateFx(dt);
  // phones
  phoneCD -= dt; holyCD -= dt; holeCD -= dt; nearPhone = null; if (!player.veh) for (const p of PHONES) if (d2(p.x, p.z, player.x, player.z) < 9) nearPhone = p;
  if (nearPhone && !M && phoneCD < 0 && player.alive && HOOKS.phone.length) { phoneCD = 12; for (const f of HOOKS.phone) f(nearPhone); } else if (nearPhone && !M && phoneCD < 0 && player.alive) { phoneCD = 3; const m = nextFor(nearPhone.fac); SFX.bell(); if (m) startMission(m); else { const ns = nearPhone.fac !== 'side' && nextStory(); pager(ns ? `Not now. ${FACTIONS[ns.fac].who} is waiting for you (${FACTIONS[ns.fac].name}).` : 'Nothing more for you today. (Replay jobs from the pause menu.)', 3); } }
  // Notre-Dame confessional (west door) drops one level
  const nd = POI.notredame; if (!player.veh && wanted > 0 && holyCD < 0 && d2(nd[0], nd[1], player.x, player.z) < 16) { holyCD = 20; heat = wanted > 1 ? LV[wanted - 1] + .1 : 0; addMoney(-300, true); pager('Confessional, Notre-Dame: "Mea culpa." -1 head, 300 F in the alms box.', 3); SFX.bell(); }
  // catacomb manholes: travel underground, lose up to 2 heads
  if (!player.veh && holeCD < 0) for (let k = 0; k < MANHOLES.length; k++) { const h = MANHOLES[k]; if (d2(h.x, h.z, player.x, player.z) < 2) { const o = MANHOLES[(k + 3) % MANHOLES.length]; holeCD = 6; player.x = o.x + 1.5; player.z = o.z; camPos.set(player.x, 0, player.z); if (wanted > 0) heat = wanted > 2 ? LV[wanted - 2] + .1 : 0; pager('Through the Catacombs... you surface elsewhere, unseen.', 3); noise(1, .3, 300); break; } }
  const d = tileAt(player.x, player.z) >= 0 ? dist[tileAt(player.x, player.z)] : undefined; if (d !== undefined && d !== lastDistrict) { lastDistrict = d; districtMsg = DN[d]; districtT = 2.5; }
  musicTick(dt, nearCabaret()); for (const f of HOOKS.update) f(dt); }
function nearCabaret() { let best = 0; for (const n of ['chatnoir', 'lapin', 'galette', 'moulinrouge', 'ratmort']) { const p = POI[n]; const dd = Math.sqrt(d2(p[0], p[1], player.x, player.z)); best = Math.max(best, 1 - dd / 30); } return state === 'title' ? .6 : best; }
// ---- frame-time profiler (F3): per-section ms over the last 300 frames ----
const PROF = { on: false, n: 300, k: 0, buf: { frame: new Float32Array(300), sim: new Float32Array(300), stream: new Float32Array(300), render: new Float32Array(300), hud: new Float32Array(300) },
  summary() { const o = {}; for (const [k, a] of Object.entries(this.buf)) { const v = Array.from(a).filter(x => x > 0).sort((p, q) => p - q); if (!v.length) continue; o[k] = { avg: +(v.reduce((p, q) => p + q, 0) / v.length).toFixed(2), p95: +v[Math.floor(v.length * .95)].toFixed(1), max: +v[v.length - 1].toFixed(1) }; } return o; } };
addEventListener('keydown', e => { if (e.code === 'F3') { PROF.on = !PROF.on; e.preventDefault(); } });
function drawProf() { const s = PROF.summary(), x = innerWidth - 270; hx.fillStyle = 'rgba(0,0,0,.6)'; hx.fillRect(x - 8, 60, 268, 130); let y = 78; txt('frame-time (ms)  avg / p95 / max', x, y, 12, '#fff'); for (const k of ['frame', 'sim', 'stream', 'render', 'hud']) if (s[k]) { y += 18; txt(`${k.padEnd(7)} ${s[k].avg} / ${s[k].p95} / ${s[k].max}`, x, y, 12, s[k].p95 > 25 ? '#f84' : '#cfc'); } y += 18; txt(`chunks ${G.stats.chunks}  gl-lost ${G.GL.losses}`, x, y, 12, '#cfc');
  const a = PROF.buf.frame; hx.strokeStyle = '#ff0'; hx.beginPath(); for (let k = 0; k < PROF.n; k++) { const v = a[(PROF.k + k) % PROF.n]; hx.lineTo(x + k * .85, 186 - Math.min(60, v)); } hx.stroke(); }
let lastGood = null;
function frame(now) { requestAnimationFrame(frame); const _f0 = performance.now(); const dt = Math.min(.05, Math.max(0, (now - last) / 1000) || 0); last = now; const I = readInput(); let _t = performance.now(), tSim = 0, tStream = 0, tRender = 0, tHud = 0;
  // NaN guard: a single NaN in the player/camera made the whole view (camera matrix) invalid = blank screen. Restore the last good state.
  if (!isFinite(player.x) || !isFinite(player.z) || !isFinite(camPos.x) || !isFinite(camPos.z) || !isFinite(camH)) { console.warn('NaN state recovered'); if (lastGood) { player.x = lastGood[0]; player.z = lastGood[1]; } camPos.set(player.x, 0, player.z); camH = 44; if (player.veh && !isFinite(player.veh.x)) { player.veh.x = player.x; player.veh.z = player.z; player.veh.vx = player.veh.vz = 0; player.veh.a = 0; } } else lastGood = [player.x, player.z];
  try { frame2(now, dt, I); } catch (e) { console.error(e); }
  PROF.buf.frame[PROF.k] = performance.now() - _f0; PROF.k = (PROF.k + 1) % PROF.n; }
function frame2(now, dt, I) { let _t = performance.now();
  if (state === 'play') { if (I.pause && !shopOpen && performance.now() - shopShut > 200) setPause(!paused); if (!paused && !dbgPause && !shopOpen) { simT += dt; step(dt, I); } } else { simT += dt; updateSky(dt * .3); camPos.x = POI.garnier[0] + Math.sin(simT * .05) * 120; camPos.z = POI.garnier[1] + 60 + Math.cos(simT * .05) * 80; musicTick(dt, .6); }
  PROF.buf.sim[PROF.k] = performance.now() - _t; _t = performance.now();
  updateCam(dt); syncMeshes(simT); G.update(dt, simT, camPos.x, camPos.z); PROF.buf.stream[PROF.k] = performance.now() - _t; _t = performance.now();
  G.render(); PROF.buf.render[PROF.k] = performance.now() - _t; _t = performance.now();
  if (state === 'play') { drawHUD(dt); if (mapOpen) drawFullMap(); if (PROF.on) drawProf(); if (G.GL.lost) txt('Graphics device reset — restoring…', innerWidth / 2, innerHeight / 2, 18, '#fff', 'center'); } else hx.clearRect(0, 0, hud.width, hud.height); PROF.buf.hud[PROF.k] = performance.now() - _t; }
addEventListener('resize', G.resize); G.resize(); camPos.set(player.x, 0, player.z);
requestAnimationFrame(frame);
// ================= DEBUG / TEST API =================
const DEBUG = /[?&]debug/.test(location.search);
window.GAME = { HOOKS, registerVehicle, VT, mouse, get hover() { return hover; }, prof: PROF, interactObj: (o, kind) => doInteract({ o, kind: kind || (o.d ? 'veh' : 'ped') }), openShop, startReload, get GL() { return G.GL; }, CHAPTERS, DRAMATIS, get gallery() { return gallery; }, get choices() { return choices; }, setChoice: (k, v) => { choices[k] = v; }, THREE, player, peds, vehs, props: dynProps, MISSIONS, POI, POIV, get M() { return M; }, get wanted() { return wanted; }, get money() { return money; }, get heat() { return heat; }, set heat(v) { heat = v; }, get done() { return done; }, stats, get lastFail() { return lastFail; }, WEAP,
  start: startGame, startMission: (id) => startMission(MISSIONS.find(m => m.id === id)), fail: failMission, step: (n = 60, dt = 1 / 30, I) => { for (let k = 0; k < n; k++) step(dt, I || readInput()); }, pause: (b) => dbgPause = b,
  enter: enterExit, fire: (a) => { if (a !== undefined) player.a = a; player.cd = 0; return fireWeapon(player.veh ? player.veh.x : player.x, player.veh ? player.veh.z : player.z, player.a); },
  give: giveWeapon, sel: (id) => player.w = WI[id], target: stepTarget, setTime: (h) => gameTime = h, setRain: (r) => { rain = rainTarget = r; },
  tp(x, z) { if (player.veh && player.veh.d.rail) { const v = player.veh; v.s = pathNear(v.rp, x, z); v.sp = 0; driveRail(v, 0, 0); x = v.x; z = v.z; } else if (player.veh) { player.veh.x = x; player.veh.z = z; player.veh.vx = player.veh.vz = 0; } player.x = x; player.z = z; camPos.set(x, 0, z); },
  drive: (thr, steer, n = 30) => { for (let k = 0; k < n; k++) { driveVeh(player.veh, thr, steer, 1 / 30); player.x = player.veh.x; player.z = player.veh.z; step(1 / 30, { mx: 0, my: 0, thr: 0, steer: 0 }); } },
  spawnVeh, hitscan, render: () => { updateCam(1); syncMeshes(simT); G.update(1 / 60, simT, camPos.x, camPos.z); G.render(); drawHUD(0); if (mapOpen) drawFullMap(); }, flush: () => { updateCam(1); return G.flush(); }, G, FX, perf: G.perf, spawnRail, setMap: (b) => mapOpen = b, zoom: (h) => camOverride = h, spawnPed, quiet: () => { bigT = 0; pagerT = 0; pagerQ.length = 0; districtT = 0; }, get tram() { return tram; }, get train() { return train; } };
// content hooks: life.js (NPC talk, mission givers, letters/newspapers/rumours, activities, street events, shops)
Object.defineProperties(GAME, Object.getOwnPropertyDescriptors({ HOOKS, DEBUG, say, pager, big, addMoney, addHeat, crime, removePed, addPickup, startDef: startMission, nextStory, SFX, fires, VT, LOOKS, scene, camera: G.camera, enterExit, readInput,
  get state() { return state; }, get paused() { return paused || dbgPause; }, get gameTime() { return gameTime; }, get rain() { return rain; }, get respect() { return respect; }, get mult() { return mult; }, get wanted() { return wanted; }, set wanted(v) { wanted = v; }, get sightT() { return sightT; }, set sightT(v) { sightT = v; } }));
LIFE.init(GAME);
// autopilot: performs the current mission step through normal game actions (used by automated tests)
GAME.solveStep = function () { if (!M || !M.s) return 'none'; const s = M.s, I0 = { mx: 0, my: 0, thr: 0, steer: 0 }; const tick = (n = 5) => { for (let q = 0; q < n; q += 2) { if (M && M.s && M.s.t === 'eaves') { heat = 0; wanted = 0; sightT = 0; } GAME.step(Math.min(2, n - q), 1 / 30, I0); } }; const g0 = player.god; player.god = true; player.hp = 100; if (!player.alive) respawn('WASTED');
  const gotoVeh = (x, z) => { GAME.tp(x, z); tick(3); };
  const killAt = (tx, tz, hp) => { if (player.veh) enterExitForce(); let px = tx + 1.5, pz = tz; for (let k = 0; k < 8; k++) { const a = k * .785, x = tx + Math.cos(a) * 2.2, z = tz + Math.sin(a) * 2.2; if (!pedBlock(x, z) && !pedBlock((x + tx) / 2, (z + tz) / 2)) { px = x; pz = z; break; } } player.x = px; player.z = pz; giveWeapon('shotgun', 50); player.w = WI.shotgun; player.cd = 0; player.rel = 0; player.mag.shotgun = 2; player.kick = 0; fireWeapon(player.x, player.z, Math.atan2(tz - player.z, tx - player.x)); tick(1); };
  const ensureVeh = () => { if (!player.veh) { const [x, z] = snapWalk(Math.floor(player.x / T), Math.floor(player.z / T), true); const v = spawnVeh('brougham', x, z, 0); GAME.tp(x + 2.5, z); enterExit(); if (!player.veh) { player.veh = v; v.driver = 'player'; } } };
  switch (s.t) {
    case 'goto': if ((s.foot || player.veh && player.veh.d.rail) && player.veh) enterExitForce(); { const p = POI[s.at]; if (player.veh) { const q = POIV[s.at]; GAME.tp(q[0], q[1]); } else GAME.tp(p[0], p[1]); } tick(3); break;
    case 'steal': { if (player.veh) enterExitForce(); let v = M.target && M.target.alive && !M.target.wreck ? M.target : vehs.find(x => x.type === s.vtype && x.alive && !x.wreck); if (!v) return 'steal:no-vehicle'; for (const o of vehs) if (o !== v && !o.d.rail && d2(o.x, o.z, v.x, v.z) < 64) { o.x += 12; o.z += 0; } GAME.tp(v.x + Math.cos(v.a) * 0, v.z + v.d.wid / 2 + 1.2); enterExit(); tick(3); break; }
    case 'deliver': case 'race': { if (player.veh && player.veh.d.rail && (s.t === 'race' || player.veh !== M.veh)) enterExitForce(); if (!player.veh && M.veh && M.veh.alive && !M.veh.wreck) { player.veh = M.veh; M.veh.driver = 'player'; M.veh.parked = false; player.mesh.visible = false; } ensureVeh(); const list = s.t === 'race' ? M.cps.slice(M.cp) : [M.dtgt || POIV[s.at]]; for (const q of list) { gotoVeh(q[0], q[1]); } break; }
    case 'kill': for (let r = 0; r < 40 && M && M.s === s; r++) { const p = M.ents.find(e => e.alive); if (!p) { tick(1); break; } killAt(p.x, p.z); } break;
    case 'destroy': case 'smash': for (let r = 0; r < 60 && M && M.s === s; r++) { const v = M.vehs.find(x => x.alive && !x.wreck && !x.burn); const p = M.props.find(x => x.alive); if (v) { if (r > 30) damageVeh(v, 999); else { killAt(v.x, v.z + v.d.wid / 2 + .2); damageVeh(v, 0); } } else if (p) { if (r > 30) damageProp(p, 999); else killAt(p.x, p.z); } else tick(10); } break;
    case 'collect': for (const pk of [...M.pks]) if (pk.alive) { if (player.veh) enterExitForce(); player.x = pk.x; player.z = pk.z; tick(1); } break;
    case 'escort': { if (player.veh && !M.board) enterExitForce(); if (!M.board && player.veh) { player.veh.driver = null; player.veh = null; player.mesh.visible = true; } ensureVeh(); for (const vv of [M.veh, M.bveh, player.veh]) if (vv && vv.alive) { vv.hp = Math.max(vv.hp, 100); vv.burn = 0; } const v = M.vip; const q0 = snapWalk(Math.floor(v.x / T), Math.floor(v.z / T), true); gotoVeh(q0[0], q0[1]); tick(5); if (M && M.board) { const q = POIV[s.to]; for (const vv of [M.bveh, player.veh]) if (vv && vv.alive) { vv.hp = Math.max(vv.hp, 100); vv.burn = 0; } gotoVeh(q[0], q[1]); tick(3); } break; }
    case 'survive': if (s.lose) { heat = 0; tick(3); } else { tick(Math.ceil((M.timer + .5) * 30)); } break;
    case 'hold': { const p = POI[s.at]; if (player.veh) enterExitForce(); player.x = p[0]; player.z = p[1]; tick(Math.ceil((s.time + 1) * 30)); break; }
    case 'tail': { if (player.veh && !s.veh) enterExitForce(); for (let r = 0; r < 4000 && M && M.s === s; r++) { const p = M.mark; const q = M.path[Math.max(0, M.pi - 1)]; const a = Math.atan2(p.z - q[1], p.x - q[0]); const off = s.veh ? 15 : 10; if (player.veh) { player.veh.x = p.x - Math.cos(a) * off; player.veh.z = p.z - Math.sin(a) * off; player.veh.vx = player.veh.vz = 0; } player.x = p.x - Math.cos(a) * off; player.z = p.z - Math.sin(a) * off; tick(3); } break; }
    case 'eaves': { if (player.veh) enterExitForce(); const a = POI[s.at]; let best = [a[0] + 5, a[1]]; for (let k = 0; k < 12; k++) { const x = a[0] + Math.cos(k * .52) * 5, z = a[1] + Math.sin(k * .52) * 5; if (!pedBlock(x, z)) { best = [x, z]; break; } } wanted = M.w0 = 0; for (let r = 0; r < 3000 && M && M.s === s; r++) { wanted = 0; heat = 0; sightT = 0; player.x = best[0]; player.z = best[1]; tick(2); } break; }
    case 'choice': { const p = POI[s.at]; if (player.veh) { const q = POIV[s.at]; GAME.tp(q[0], q[1]); } else GAME.tp(p[0], p[1]); tick(3); break; }
    case 'sneak': { if (player.veh) enterExitForce(); const p = POI[s.at]; if (M.guards) M.guards.forEach(g => { g.a0 += Math.PI; }); player.x = p[0]; player.z = p[1]; tick(3); break; }
  } player.god = g0; return s.t; };
