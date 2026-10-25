import * as THREE from './vendor/three.module.js';
import { FACTIONS, MISSIONS } from './missions.js';
import { K, S, SURF, NX, NZ, T, WX, WZ, kind, surf, dist, DN, LM, LABELS, FLAGGED, tileAt, kAt, pedBlock, vehBlock, snapWalk, POI, POIV, GN, GE, ADJ, nodesIn, nearestNode, edgePts, edgeOther, TRAM, TRAIN, pathAt, pathNear, propsNear, addDynProp, setPropM, dynProps } from './world.js';
import * as G from './gfx.js';
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
const SFX = { shot: () => { noise(.18, .5, 2500); tone(120, .1, 'square', .1, 50); }, shotgun: () => { noise(.35, .7, 1500); }, rifle: () => { noise(.12, .5, 4000); tone(300, .08, 'square', .06, 80); },
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
function lookFor(type, col) { if (type === 'civ') return LOOKS[CIVL[Math.floor(rnd() * CIVL.length)]](); if (type === 'gang') return col ? gangLook(col[0], col[1]) : LOOKS.apache(); return (LOOKS[type] || LOOKS.clerk)(); }
function mkPedMesh(look, mounted) { const P = makePed(look, mounted); scene.add(P.g); P.g.userData.P = P; return P.g; }
function spawnPed(type, x, z, o = {}) { const d = PEDT[type];
  const p = Object.assign({ type, x, z, a: rnd() * 6.28, hp: d.hp, spd: d.spd, alive: true, t: 0, cd: rnd(), wander: rnd() * 6.28, flee: 0, mounted: !!d.mounted }, o);
  if (!o.inVeh) p.mesh = mkPedMesh(lookFor(type, o.col), p.mounted); else p.mesh = new THREE.Group(); p.lx = x; p.lz = z; peds.push(p); return p; }
function removePed(p) { scene.remove(p.mesh); if (p.mesh.userData.P) p.mesh.userData.P.g.traverse(()=>{}); const i = peds.indexOf(p); if (i >= 0) peds.splice(i, 1); }
const VT = {
  brougham: { len: 4.2, wid: 2.2, horses: 2, spd: 23, acc: 15, hp: 110, body: '#1a1a1a', roof: '#3a2a2a', turn: 2.4 },
  phaeton: { len: 3.6, wid: 2, horses: 2, spd: 30, acc: 22, hp: 70, body: '#c0a040', roof: '#7a2a1a', turn: 2.9 },
  barouche: { len: 4.8, wid: 2.4, horses: 2, spd: 20, acc: 11, hp: 240, body: '#2a1a3a', roof: '#4a2a5a', turn: 2.0 },
  gig: { len: 2.8, wid: 1.8, horses: 1, spd: 21, acc: 17, hp: 55, body: '#7a5a30', roof: '#a08050', turn: 3.2 },
  omnibus: { len: 6.5, wid: 2.6, horses: 3, spd: 15, acc: 7, hp: 420, body: '#c8b060', roof: '#3a5a3a', turn: 1.5 },
  police: { len: 4.2, wid: 2.2, horses: 2, spd: 27, acc: 18, hp: 160, body: '#0a0a1e', roof: '#1e2a5a', turn: 2.6 },
  tram: { len: 7, wid: 2.6, horses: 0, spd: 12, acc: 4, hp: 900, body: '#3a5a3a', roof: '#aa3a1a', turn: 0, rail: 'tram' },
  train: { len: 8, wid: 2.6, horses: 0, spd: 22, acc: 5, hp: 5000, body: '#1a1a1a', roof: '#4a1a1a', turn: 0, rail: 'train' },
};
function spawnVeh(type, x, z, a, o = {}) { const d = VT[type], V = makeVeh(type, d), g = V.g;
  const v = Object.assign({ type, x, z, a, vx: 0, vz: 0, av: 0, hp: d.hp, horseHp: d.horses ? 60 * d.horses : 1e9, alive: true, driver: null, mesh: g, V, body: V.body, hs: V.horses.map(h => h.g), d, burn: 0, t: 0, wreck: false, lx: x, lz: z }, o);
  scene.add(g); vehs.push(v); return v; }
function spawnRail(type, s, o = {}) { const P = type === 'tram' ? TRAM : TRAIN; const [x, z, a] = pathAt(P, s); const v = spawnVeh(type, x, z, a, Object.assign({ railAuto: true, rp: P, s, dirS: 1 }, o)); return v; }
function removeVeh(v) { scene.remove(v.mesh); const i = vehs.indexOf(v); if (i >= 0) vehs.splice(i, 1); }
// ================= PLAYER =================
const START = [POI.chien[0] + 8, POI.chien[1] + 6]; { const s = snapWalk(Math.floor(START[0] / T), Math.floor(START[1] / T), false); START[0] = s[0]; START[1] = s[1]; }
const player = { x: START[0], z: START[1], a: 0, hp: 100, alive: true, veh: null, w: 0, ammo: { fists: 1e9 }, cd: 0, punch: 0, walkT: 0, inv: 0, god: false };
player.mesh = mkPedMesh(LOOKS.player(), false); player.lx = player.x; player.lz = player.z;
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
function tracer(x1, z1, x2, z2) { FX.tracer(x1, z1, x2, z2); }
function spr(mat, x, z, s, t, y = 1.5, grow = 0) { const m = new THREE.Mesh(PG, mat); m.position.set(x, y, z); m.scale.set(s, 1, s); scene.add(m); fx.push({ m, t, grow, kill: true }); return m; }
const PROJM = { brick: new THREE.Mesh(new THREE.BoxGeometry(.35, .25, .35), new THREE.MeshLambertMaterial({ color: 0x8a8478 })), dynamite: new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .5, 6).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xc02020, emissive: 0x401000 })), molotov: new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .45, 6).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x60c040, emissive: 0x203010 })) };
function projMesh(t) { const m = PROJM[t].clone(); scene.add(m); fx.push({ m, t: 99, kill: true }); return m; }
function damagePed(p, dmg, src) { if (!p.alive) return; p.hp -= dmg; p.flee = 6; SFX.hit(); if (p.hp <= 0) killPed(p, src); else if (p.type === 'civ') p.hostile = false; }
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
function hitscan(x, z, a, rng, dmg, src, ignore) { const dx = Math.cos(a), dz = Math.sin(a); let ex = x, ez = z;
  for (let s = .5; s < rng; s += .5) { ex = x + dx * s; ez = z + dz * s; if (pedBlock(ex, ez) && kAt(ex, ez) === K.BLD) { FX.sparks(ex, ez, 4, 3, 1.3); FX.dust(ex, ez, 1); break; }
    for (const p of peds) if (p.alive && !p.inVeh && p !== ignore && Math.abs(p.x - ex) < .8 && Math.abs(p.z - ez) < .8) { damagePed(p, dmg, src); FX.blood(ex, ez, 5); return [ex, ez]; }
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
  if (w.throw) { projs.push({ type: w.throw, x, z, vx: Math.cos(a) * 16, vz: Math.sin(a) * 16, t: w.throw === 'dynamite' ? 1.6 : .7, m: projMesh(w.throw) }); SFX.swing(); return true; }
  SFX[w.snd](); crime(copsNear(25) ? 1.2 : .3); FX.muzzle(x + Math.cos(a) * .4, z + Math.sin(a) * .4, a, w.id === 'shotgun');
  for (let k = 0; k < (w.pellets || 1); k++) { const aa = a + (w.spread ? (rnd() - .5) * w.spread : (rnd() - .5) * .04); const e = hitscan(x, z, aa, w.rng, w.dmg, src, ignore || player.veh); tracer(x, z, e[0], e[1]); }
  for (const p of peds) if (p.alive && p.type === 'civ' && d2(p.x, p.z, x, z) < 400) p.flee = 6;
  return true; }
function npcShoot(sh, tx, tz, dmg = 8, acc = .15) { const a = Math.atan2(tz - sh.z, tx - sh.x) + (rnd() - .5) * acc * 2; SFX.shot(); FX.muzzle(sh.x, sh.z, a); const e = hitscan(sh.x + Math.cos(a), sh.z + Math.sin(a), a, 40, dmg, 'npc', sh); tracer(sh.x, sh.z, e[0], e[1]);
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
    if (sp > 8) { damageVeh(v, sp * 1.2); FX.sparks(v.x + Math.cos(v.a) * v.d.len * .5, v.z + Math.sin(v.a) * v.d.len * .5, 8, 5); if (v === player.veh) { SFX.crash(); camShake = .3; } } return; }
  v.x = Math.max(2, Math.min(WX - 2, nx)); v.z = Math.max(2, Math.min(WZ - 2, nz)); if (sp > 9 && v.d.horses && rnd() < .3) FX.dust(v.x - Math.cos(v.a) * v.d.len * .5, v.z - Math.sin(v.a) * v.d.len * .5, 1);
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
    const sp = Math.hypot(v.vx, v.vz) + Math.abs(v.sp || 0); if (v.d.horses && sp > 10 && rnd() < dt * 6) FX.dust(v.x - Math.cos(v.a) * 2, v.z - Math.sin(v.a) * 2, 1); if (v.d.horses && !v.horseDead) { v.hoof = (v.hoof || 0) - dt * sp * .35; if (v.hoof < 0) { v.hoof = 1; SFX.hoof(); } }
    if (v.burn) hurtPlayer(dt * 8); return; }
  const m = Math.hypot(I.mx, I.my); const run = m > .2;
  if (run) { const a = Math.atan2(I.my, I.mx); player.a = a; const sp = 7 * Math.min(1, m) * (keys.ShiftLeft ? .5 : 1); const nx = player.x + Math.cos(a) * sp * dt, nz = player.z + Math.sin(a) * sp * dt;
    const blocked = (x, z) => pedBlock(x, z) || propsNear(x, z).some(p => p.r > 0 && d2(p.x, p.z, x, z) < (p.r + .3) ** 2) || vehs.some(o => o.alive && d2(o.x, o.z, x, z) < (o.d.wid * .5 + .4) ** 2);
    if (!blocked(nx, player.z)) player.x = nx; if (!blocked(player.x, nz)) player.z = nz; player.walkT += dt * sp; }
  if (I.fire) fireWeapon(player.x, player.z, player.a);
  // pickups
  for (const pk of pickups) if (pk.alive && d2(pk.x, pk.z, player.x, player.z) < 2.6) collectPickup(pk); }
// ================= PICKUPS =================
const PKM = {}; const PKG = new THREE.BoxGeometry(1, .18, 1);
function pkMat(kind) { if (PKM[kind]) return PKM[kind]; const col = { brick: '#999', swordcane: '#ccc', revolver: '#ddd', shotgun: '#b84', winchester: '#da6', dynamite: '#d22', molotov: '#6c4', health: '#f44', money: '#fd2', mission: '#f0f', armor: '#48f' }[kind] || '#fff';
  return PKM[kind] = spriteMat('pk' + kind, 16, 16, g => { g.fillStyle = '#000'; g.fillRect(1, 1, 14, 14); g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(2, 2, 12, 12); g.fillStyle = col; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.fillText(kind === 'health' ? '+' : kind === 'money' ? '₣' : kind === 'mission' ? '★' : kind[0].toUpperCase(), 8, 12); }); }
function addPickup(kind, x, z, o = {}) { const m = new THREE.Mesh(PKG, pkMat(kind)); m.scale.set(1.3, 1.3, 1.3); m.position.set(x, 1, z); scene.add(m); const p = Object.assign({ kind, x, z, m, alive: true }, o); pickups.push(p); return p; }
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
const TRAFFIC_T = ['brougham', 'brougham', 'brougham', 'gig', 'gig', 'phaeton', 'barouche', 'omnibus'];
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
function nextFor(f) { return (byFac[f] || []).find(m => !done[m.id]) || null; }
function nearPOI(name, veh) { const p = (veh ? POIV : POI)[name]; return p; }
function ringPos(x, z, r) { for (let k = 0; k < 20; k++) { const a = rnd() * 6.28, rr = r * (.4 + rnd() * .6), xx = x + Math.cos(a) * rr, zz = z + Math.sin(a) * rr; if (!pedBlock(xx, zz) && kAt(xx, zz) !== K.STAIR) return [xx, zz]; } return [x, z]; }
function startMission(def) { if (M) return; M = { def, i: -1, ents: [], vehs: [], props: [], pks: [], t: 0 }; big(def.title, 2.5); pager(`${facName(def.fac)}: "${def.title}"${def.en ? ' (' + def.en + ')' : ''} — ${def.brief}`, 7); SFX.pager(); nextStep(); }
function cleanupStep() { if (!M) return; M.ents.forEach(p => { if (p.alive) { p.hostile = false; p.flee = 5; p.mission = false; } }); M.ents = []; M.props.forEach(p => { if (p.alive) { p.alive = false; setPropM(p); } }); M.props = []; M.pks.forEach(p => { p.alive = false; p.m.visible = false; }); M.pks = []; }
function nextStep() { cleanupStep(); M.i++; const s = M.def.steps[M.i]; if (!s) return completeMission(); M.s = s; M.t = 0; M.timer = s.time || 0; M.cp = 0; M.hold = 0; M.wave = 0; pager(s.text, 4);
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
    case 'escort': { const [x, z] = [POIV[s.at][0] + 1.5, POIV[s.at][1] + 1.5]; M.vip = spawnPed('vip', x, z, { mission: true, stand: true }); M.ents.push(M.vip); M.board = false; break; }
    case 'survive': { if (s.lvl) heat = Math.max(heat, LV[s.lvl] + .5); break; }
    case 'race': { M.cps = s.cps.map(c => POIV[c]); break; }
  }
  M.dtgt = null; if (s.t === 'deliver' && player.veh && player.veh.d.rail) { const P = player.veh.rp, q = pathAt(P, pathNear(P, POIV[s.at][0], POIV[s.at][1])); M.dtgt = [q[0], q[1]]; }
  if (s.time && !['survive', 'hold'].includes(s.t)) { let dd = 0, [qx, qz] = [px, pz]; const pts = s.t === 'race' ? M.cps : [stepTarget(), s.to ? POIV[s.to] : null].filter(Boolean); for (const q of pts) { dd += Math.hypot(q[0] - qx, q[1] - qz); [qx, qz] = q; } M.timer = Math.max(s.time, Math.round(dd / 12 + 15)); } }
function stepTarget() { if (!M || !M.s) return null; const s = M.s; switch (s.t) {
  case 'goto': return POI[s.at]; case 'deliver': return M.dtgt || POIV[s.at];
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
    case 'deliver': if (player.veh && near(M.dtgt || POIV[s.at], 6) && Math.hypot(player.veh.vx, player.veh.vz) < 9) { if (M.veh && player.veh !== M.veh && M.veh.alive) { pager('Wrong carriage! Bring the one you took.', 1); break; } nextStep(); } else if (M.veh && (!M.veh.alive || M.veh.wreck)) return failMission('The cargo is lost!'); break;
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
let tram = spawnRail('tram', TRAM.len * .3); tram.sp = 8;
let train = spawnRail('train', 0); train.sp = 0; train.stopT = 4;
const PARKED = [['phaeton', 'garnier'], ['brougham', 'chien'], ['gig', 'tertre'], ['barouche', 'elysee'], ['omnibus', 'boulmich'], ['brougham', 'procope'], ['phaeton', 'bourse'], ['gig', 'bateau']];
PARKED.forEach(([t, p]) => { const [x, z] = POIV[p]; spawnVeh(t, x + 2, z, 0, { parked: true, home: true }); });
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
    if (v.burn) { v.burn -= dt; FX.fire(v.x + (rnd() - .5) * 2, v.z + (rnd() - .5) * 2, 1.2); if (v.burn <= 0) { v.burn = 0; v.wreck = true; v.hp = 0; v.mesh.traverse(o => { if (o.isMesh && o.material !== LAMPMAT) o.material = charMat; if (o.material === LAMPMAT) o.visible = false; }); v.hs.forEach(h => h.visible = false); explode(v.x, v.z, 5, 100); if (v.police) crime(3); if (player.veh === v) { hurtPlayer(80); enterExitForce(); } v.vx = v.vz = 0; } }
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
let camH = 40, camOverride = 0; const camPos = new THREE.Vector3(); const TILT = .3;
function updateCam(dt) { const v = player.veh; const sp = v ? Math.hypot(v.vx, v.vz) + Math.abs(v.sp || 0) : 0; const tgt = camOverride || (44 + sp * 1.3); camH += (tgt - camH) * Math.min(1, dt * 1.5); if (camOverride) camH = camOverride;
  const lx = v ? v.vx * .5 : 0, lz = v ? v.vz * .5 : 0; const tx = player.x + lx, tz = player.z + lz; camPos.x += (tx - camPos.x) * Math.min(1, dt * 5); camPos.z += (tz - camPos.z) * Math.min(1, dt * 5);
  const sx = camShake > 0 ? (rnd() - .5) * camShake * 2 : 0; camShake = Math.max(0, camShake - dt); camera.position.set(camPos.x + sx, camH, camPos.z + camH * TILT + sx); camera.lookAt(camPos.x + sx, 0, camPos.z + sx); }
// ================= MESH SYNC =================
let lastSync = 0;
function animOf(o, P, dt, punch, dead) { const sp = Math.hypot(o.x - o.lx, o.z - o.lz) / Math.max(dt, 1e-3); o.lx = o.x; o.lz = o.z; animPed(P, Math.min(sp, 14), dt, punch, dead); }
function syncMeshes(t) { const dt = Math.min(.1, Math.max(0, t - lastSync)); lastSync = t; const [cx, cz] = [camPos.x, camPos.z];
  for (const p of peds) { if (p.inVeh) { p.mesh.visible = false; continue; } const far = d2(p.x, p.z, cx, cz) > 90 * 90; p.mesh.visible = !far; if (far) continue; p.mesh.position.set(p.x, 0, p.z); p.mesh.rotation.y = -p.a; const P = p.mesh.userData.P; if (P) animOf(p, P, dt, false, !p.alive); }
  for (const v of vehs) { v.mesh.position.set(v.x, 0, v.z); v.mesh.rotation.y = -v.a; const far = d2(v.x, v.z, cx, cz) > 110 * 110; v.mesh.visible = !far; if (far) continue;
    const fwd = v.d.rail ? (v.sp || 0) : (v.vx * Math.cos(v.a) + v.vz * Math.sin(v.a)); if (!v.wreck) animVeh(v.V, v.horseDead ? 0 : Math.abs(fwd), dt, fwd); }
  player.mesh.position.set(player.x, 0, player.z); player.mesh.rotation.y = -player.a; animOf(player, player.mesh.userData.P, dt, player.punch > 0, !player.alive);
  for (const pk of pickups) if (pk.alive) { pk.m.rotation.y = t * 2; pk.m.position.y = 1 + Math.sin(t * 4) * .2; }
  for (const pk of pickups) if (!pk.alive && pk.rt !== undefined) { pk.rt -= 1 / 60; if (pk.rt <= 0) { pk.alive = true; pk.m.visible = true; delete pk.rt; } }
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
  const ms = sm ? 90 : 130, mx = w - ms - 10, my = sm ? 44 : 52; hx.globalAlpha = .85; hx.imageSmoothingEnabled = false; hx.save(); hx.beginPath(); hx.rect(mx, my, ms, ms); hx.clip(); const zoom = 1.4, [px, pz] = ppos();
  hx.imageSmoothingEnabled = true; hx.drawImage(G.mapCanvas(), mx + ms / 2 - px / T * zoom, my + ms / 2 - pz / T * zoom, NX * zoom, NZ * zoom); hx.fillStyle = '#ff0'; hx.fillRect(mx + ms / 2 - 2, my + ms / 2 - 2, 4, 4);
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
// ================= FULL MAP (M) =================
let mapOpen = false;
function drawFullMap() { const w = innerWidth, h = innerHeight, mc = G.mapCanvas(); const sc = Math.min((w - 40) / NX, (h - 70) / NZ), ox = (w - NX * sc) / 2, oy = 46; hx.fillStyle = 'rgba(10,8,6,.92)'; hx.fillRect(0, 0, w, h); hx.imageSmoothingEnabled = true; hx.drawImage(mc, ox, oy, NX * sc, NZ * sc); hx.strokeStyle = '#f4c430'; hx.strokeRect(ox, oy, NX * sc, NZ * sc);
  const P = (x, z) => [ox + x / T * sc, oy + z / T * sc]; txt('PARIS 1880 — Plan de la Ville  (M to close)', w / 2, 30, 18, '#f4c430', 'center');
  hx.save(); for (const [n, x, z, a] of LABELS) { if (x < 0 || z < 0 || x > WX || z > WZ) continue; const [sx, sy] = P(x, z); hx.save(); hx.translate(sx, sy); hx.rotate(a || 0); hx.font = 'italic 10px Georgia,serif'; hx.textAlign = 'center'; hx.fillStyle = 'rgba(30,24,16,.9)'; hx.fillText(n, 1, 1); hx.fillStyle = '#f0e6cc'; hx.fillText(n, 0, 0); hx.restore(); }
  for (const k in LM) { const L = LM[k]; const [sx, sy] = P(L[1], L[2]); hx.fillStyle = '#e8b040'; hx.beginPath(); hx.arc(sx, sy, 2.5, 0, 7); hx.fill(); hx.font = 'bold 10px "Courier New",monospace'; hx.textAlign = 'left'; hx.fillStyle = '#000'; hx.fillText(L[0], sx + 5, sy + 4); hx.fillStyle = '#ffe6a0'; hx.fillText(L[0], sx + 4, sy + 3); }
  if (!M) for (const p of PHONES) { const [sx, sy] = P(p.x, p.z); hx.fillStyle = p.fac === 'side' ? '#fc0' : '#f3c'; hx.fillRect(sx - 4, sy - 4, 8, 8); }
  const tg = stepTarget(); if (tg) { const [sx, sy] = P(tg[0], tg[1]); hx.strokeStyle = '#ff0'; hx.lineWidth = 2; hx.beginPath(); hx.arc(sx, sy, 7, 0, 7); hx.stroke(); }
  const [px, pz] = ppos(), [sx, sy] = P(px, pz); hx.fillStyle = '#ff2'; hx.beginPath(); hx.arc(sx, sy, 5, 0, 7); hx.fill(); hx.strokeStyle = '#000'; hx.stroke(); hx.restore();
  txt('● landmarks   ■ magneto phones   ◯ objective   ● you', w / 2, h - 10, 12, '#e8dcc0', 'center'); }
addEventListener('keydown', e => { if (e.code === 'KeyM' && state === 'play') mapOpen = !mapOpen; });
// ================= MENUS =================
let state = 'title', paused = false, nearPhone = null, phoneCD = 0, holyCD = 0, holeCD = 0;
const $ = id => document.getElementById(id);
function startGame(cont) { audio(); if (!cont) { localStorage.removeItem('gtaParis1880'); money = 0; mult = 1; done = {}; respect = { apache: 0, avant: 0, velvet: 0, crimson: 0 }; player.ammo = { fists: 1e9 }; giveWeapon('brick', 4); } else load();
  $('title').classList.add('hidden'); state = 'play'; pager('Paris, 1880. Fresh off the night train with nothing but a watchmaker\'s hands. Find a magneto phone (glowing rings) — Maza\'s Apaches at Les Halles are hiring.', 7); }
$('bPlay').onclick = () => startGame(false); $('bCont').onclick = () => startGame(true); if (!localStorage.getItem('gtaParis1880')) $('bCont').style.display = 'none';
function setPause(on) { paused = on; $('pause').classList.toggle('hidden', !on); if (on) buildMenu(); }
$('bRes').onclick = () => setPause(false); $('bSave').onclick = () => { save(); $('bSave').textContent = 'SAVED ✓'; setTimeout(() => $('bSave').textContent = 'SAVE', 1200); };
$('bGfx').onclick = () => { $('pause').classList.add('hidden'); G.openSettings(() => $('pause').classList.remove('hidden')); };
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
  const d = tileAt(player.x, player.z) >= 0 ? dist[tileAt(player.x, player.z)] : undefined; if (d !== undefined && d !== lastDistrict) { lastDistrict = d; districtMsg = DN[d]; districtT = 2.5; }
  musicTick(dt, nearCabaret()); }
function nearCabaret() { let best = 0; for (const n of ['chatnoir', 'lapin', 'galette', 'moulinrouge', 'ratmort']) { const p = POI[n]; const dd = Math.sqrt(d2(p[0], p[1], player.x, player.z)); best = Math.max(best, 1 - dd / 30); } return state === 'title' ? .6 : best; }
function frame(now) { requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; const I = readInput();
  if (state === 'play') { if (I.pause) setPause(!paused); if (!paused && !dbgPause) { simT += dt; step(dt, I); } } else { simT += dt; updateSky(dt * .3); camPos.x = POI.garnier[0] + Math.sin(simT * .05) * 120; camPos.z = POI.garnier[1] + 60 + Math.cos(simT * .05) * 80; musicTick(dt, .6); }
  updateCam(dt); syncMeshes(simT); G.update(dt, simT, camPos.x, camPos.z); G.render(); if (state === 'play') { drawHUD(dt); if (mapOpen) drawFullMap(); } else hx.clearRect(0, 0, hud.width, hud.height); }
addEventListener('resize', G.resize); G.resize(); camPos.set(player.x, 0, player.z);
requestAnimationFrame(frame);
// ================= DEBUG / TEST API =================
window.GAME = { THREE, player, peds, vehs, props: dynProps, MISSIONS, POI, POIV, get M() { return M; }, get wanted() { return wanted; }, get money() { return money; }, get heat() { return heat; }, set heat(v) { heat = v; }, get done() { return done; }, stats, get lastFail() { return lastFail; }, WEAP,
  start: startGame, startMission: (id) => startMission(MISSIONS.find(m => m.id === id)), fail: failMission, step: (n = 60, dt = 1 / 30, I) => { for (let k = 0; k < n; k++) step(dt, I || readInput()); }, pause: (b) => dbgPause = b,
  enter: enterExit, fire: (a) => { if (a !== undefined) player.a = a; player.cd = 0; return fireWeapon(player.veh ? player.veh.x : player.x, player.veh ? player.veh.z : player.z, player.a); },
  give: giveWeapon, sel: (id) => player.w = WI[id], target: stepTarget, setTime: (h) => gameTime = h, setRain: (r) => { rain = rainTarget = r; },
  tp(x, z) { if (player.veh && player.veh.d.rail) { const v = player.veh; v.s = pathNear(v.rp, x, z); v.sp = 0; driveRail(v, 0, 0); x = v.x; z = v.z; } else if (player.veh) { player.veh.x = x; player.veh.z = z; player.veh.vx = player.veh.vz = 0; } player.x = x; player.z = z; camPos.set(x, 0, z); },
  drive: (thr, steer, n = 30) => { for (let k = 0; k < n; k++) { driveVeh(player.veh, thr, steer, 1 / 30); player.x = player.veh.x; player.z = player.veh.z; step(1 / 30, { mx: 0, my: 0, thr: 0, steer: 0 }); } },
  spawnVeh, hitscan, render: () => { updateCam(1); syncMeshes(simT); G.update(1 / 60, simT, camPos.x, camPos.z); G.render(); drawHUD(0); if (mapOpen) drawFullMap(); }, flush: () => { updateCam(1); return G.flush(); }, G, FX, perf: G.perf, spawnRail, setMap: (b) => mapOpen = b, zoom: (h) => camOverride = h, spawnPed, quiet: () => { bigT = 0; pagerT = 0; pagerQ.length = 0; districtT = 0; }, get tram() { return tram; }, get train() { return train; } };
// autopilot: performs the current mission step through normal game actions (used by automated tests)
GAME.solveStep = function () { if (!M || !M.s) return 'none'; const s = M.s, I0 = { mx: 0, my: 0, thr: 0, steer: 0 }; const tick = (n = 5) => GAME.step(n, 1 / 30, I0); const g0 = player.god; player.god = true; player.hp = 100; if (!player.alive) respawn('WASTED');
  const gotoVeh = (x, z) => { GAME.tp(x, z); tick(3); };
  const killAt = (tx, tz, hp) => { if (player.veh) enterExitForce(); let px = tx + 1.5, pz = tz; for (let k = 0; k < 8; k++) { const a = k * .785, x = tx + Math.cos(a) * 2.2, z = tz + Math.sin(a) * 2.2; if (!pedBlock(x, z) && !pedBlock((x + tx) / 2, (z + tz) / 2)) { px = x; pz = z; break; } } player.x = px; player.z = pz; giveWeapon('shotgun', 50); player.w = WI.shotgun; player.cd = 0; fireWeapon(player.x, player.z, Math.atan2(tz - player.z, tx - player.x)); tick(1); };
  const ensureVeh = () => { if (!player.veh) { const [x, z] = snapWalk(Math.floor(player.x / T), Math.floor(player.z / T), true); const v = spawnVeh('brougham', x, z, 0); GAME.tp(x + 2.5, z); enterExit(); if (!player.veh) { player.veh = v; v.driver = 'player'; } } };
  switch (s.t) {
    case 'goto': if ((s.foot || player.veh && player.veh.d.rail) && player.veh) enterExitForce(); { const p = POI[s.at]; if (player.veh) { const q = POIV[s.at]; GAME.tp(q[0], q[1]); } else GAME.tp(p[0], p[1]); } tick(3); break;
    case 'steal': { if (player.veh) enterExitForce(); let v = M.target && M.target.alive && !M.target.wreck ? M.target : vehs.find(x => x.type === s.vtype && x.alive && !x.wreck); if (!v) return 'steal:no-vehicle'; for (const o of vehs) if (o !== v && !o.d.rail && d2(o.x, o.z, v.x, v.z) < 64) { o.x += 12; o.z += 0; } GAME.tp(v.x + Math.cos(v.a) * 0, v.z + v.d.wid / 2 + 1.2); enterExit(); tick(3); break; }
    case 'deliver': case 'race': { if (player.veh && player.veh.d.rail && (s.t === 'race' || player.veh !== M.veh)) enterExitForce(); if (!player.veh && M.veh && M.veh.alive && !M.veh.wreck) { player.veh = M.veh; M.veh.driver = 'player'; M.veh.parked = false; player.mesh.visible = false; } ensureVeh(); const list = s.t === 'race' ? M.cps.slice(M.cp) : [M.dtgt || POIV[s.at]]; for (const q of list) { gotoVeh(q[0], q[1]); } break; }
    case 'kill': for (let r = 0; r < 40 && M && M.s === s; r++) { const p = M.ents.find(e => e.alive); if (!p) { tick(1); break; } killAt(p.x, p.z); } break;
    case 'destroy': case 'smash': for (let r = 0; r < 60 && M && M.s === s; r++) { const v = M.vehs.find(x => x.alive && !x.wreck && !x.burn); const p = M.props.find(x => x.alive); if (v) { killAt(v.x, v.z + v.d.wid / 2 + .2); damageVeh(v, 0); } else if (p) killAt(p.x, p.z); else tick(10); } break;
    case 'collect': for (const pk of [...M.pks]) if (pk.alive) { if (player.veh) enterExitForce(); player.x = pk.x; player.z = pk.z; tick(1); } break;
    case 'escort': { if (player.veh && player.veh.d.rail) enterExitForce(); ensureVeh(); const v = M.vip; const q0 = snapWalk(Math.floor(v.x / T), Math.floor(v.z / T), true); gotoVeh(q0[0], q0[1]); tick(5); if (M && M.board) { const q = POIV[s.to]; gotoVeh(q[0], q[1]); tick(3); } break; }
    case 'survive': if (s.lose) { heat = 0; tick(3); } else { tick(Math.ceil((M.timer + .5) * 30)); } break;
    case 'hold': { const p = POI[s.at]; if (player.veh) enterExitForce(); player.x = p[0]; player.z = p[1]; tick(Math.ceil((s.time + 1) * 30)); break; }
  } player.god = g0; return s.t; };
