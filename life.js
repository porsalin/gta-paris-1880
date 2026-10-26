// life.js — Paris 1890 street life: NPC conversation, mission givers in the world, letters / newspapers / rumours,
// activities, street events and shops. Plugs into main.js through GAME.HOOKS (update / hud / map / phone / where / known).
import * as THREE from './vendor/three.module.js';
import { POI, POIV, poiFor, LM, dist, tileAt, snapWalk, T, pedBlock, kAt, K, DN } from './world.js';
import { FACTIONS, MISSIONS, CHAPTERS } from './missions.js';
import * as L from './lines.js';
import * as ACT from './acts.js';

let G = null; const SK = 'gtaParis1890life';
export const S = { known: {}, posters: {}, pages: {}, photos: {}, pockets: [], camera: false, tips: 0, shows: {}, wins: 0, told: {}, lastNext: null, papers: 0 };
function loadS() { try { Object.assign(S, JSON.parse(localStorage.getItem(SK)) || {}); } catch (e) { } }
export function saveS() { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) { } }
const d2 = (ax, az, bx, bz) => (ax - bx) ** 2 + (az - bz) ** 2;
export const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return n >>> 0; };
export const label = (k) => (LM[k] ? LM[k][0] : k).replace(/\s*\(.*?\)\s*/g, ' ').trim();
// ---------- 1890 places (runtime additions / relabels; world.json is the graphics worker's) ----------
const EXTRA = { // [label, x, z]
  moulinblanche: ['Moulin Rouge, place Blanche', 1846, 566], mirliton: ['Le Mirliton (Aristide Bruant)', 2065, 538], eldorado: ['L\'Eldorado café-concert', 2470, 1125],
  tailor: ['À la Belle Jardinière (tailors)', 2165, 1625], gunsmith: ['Gastinne Renette, gunsmith', 1250, 1150], nadar: ['Atelier Nadar, rue d\'Anjou', 1525, 1005],
  fence: ['Mme Cahen, brocanteuse, rue Drouot', 2100, 975], billard: ['Café de la Régence (cards & billiards)', 1955, 1400], kiosque: ['Newspaper kiosk, boulevard des Italiens', 1925, 1060],
};
const RELABEL = { hoteldeville: 'Hôtel de Ville (rebuilt 1882)', tuileries: 'Site of the Tuileries Palace (cleared 1883)', pyramides: 'Rue des Pyramides (Joan of Arc statue)', sacrecoeur: 'Sacré-Cœur (building since 1875)',
  chatnoir: 'Le Chat Noir, rue de Laval', moulinrouge: 'Élysée-Montmartre dance hall', lapin: 'Cabaret des Assassins', republique: 'Place de la République', durandruel: 'Galerie Durand-Ruel', goupil: 'Boussod, Valadon & Cie (late Goupil)' };
function setupPlaces() {
  for (const k in RELABEL) if (LM[k]) LM[k][0] = RELABEL[k];
  if (LM.chatnoir) { LM.chatnoir[1] = 1990; LM.chatnoir[2] = 604; } // the Chat Noir moved to rue de Laval in 1885; the Mirliton took its old room
  for (const k in EXTRA) { const e = EXTRA[k]; LM[k] = LM[k] || [e[0], e[1], e[2]]; }
  for (const k of ['chatnoir', ...Object.keys(EXTRA), 'eiffel', 'galerie']) if (LM[k]) poiFor(k);
  if (!POI.eiffel && LM.trocadero && LM.ecolemil) { const a = LM.trocadero, b = LM.ecolemil; LM.eiffel = LM.eiffel || ['Tour Eiffel', a[1] + (b[1] - a[1]) * .31, a[2] + (b[2] - a[2]) * .31]; poiFor('eiffel'); }
}
export function nearestPlace(x, z, skip) { let best = null, bd = 1e18; for (const k in LM) { if (skip && skip(k)) continue; const l = LM[k]; const dd = d2(l[1], l[2], x, z); if (dd < bd) { bd = dd; best = k; } } return best; }
export function districtAt(x, z) { const t = tileAt(x, z); const d = t >= 0 ? dist[t] : undefined; return d === undefined || d < 0 ? -1 : d; }
export function hour() { return G.gameTime % 24; }
export const tod = () => { const h = hour(); return h >= 5 && h < 11 ? 'morning' : h < 17 && h >= 11 ? 'day' : h >= 17 && h < 22 ? 'evening' : 'night'; };
export function actNow() { const n = G.nextStory(); return n ? Math.max(0, n.chapter) : 4; }
// ---------- personas ----------
const FEM = new Set(['lady', 'maid', 'vip']);
export function persona(p) {
  if (p.persona) return p.persona; const seed = hash((p.uid || 1) * 7919 + 17); const kind = p.kind || p.type; const fem = FEM.has(kind) || !!p.fem;
  const tr = L.TRADES[kind] || L.TRADES.clerk; const dd = districtAt(p.x, p.z); const list = (fem ? tr.f : tr.m) || tr.m || tr.f; let trade = list[seed % list.length];
  if (L.DTRADE[dd] && L.DTRADE[dd][tr.g] && seed % 3 === 0) trade = L.DTRADE[dd][tr.g];
  const fn = fem ? L.FIRST_F : L.FIRST_M; let name = fn[(seed >>> 3) % fn.length] + ' ' + L.SURN[(seed >>> 9) % L.SURN.length]; if (tr.g === 'gang') name = L.FIRST_M[(seed >>> 3) % 30] + ' dit ' + L.NICK[(seed >>> 7) % L.NICK.length]; if (tr.g === 'cop') name = (kind === 'cop' ? 'Agent ' : kind === 'gend' ? 'Garde ' : 'Soldat ') + L.SURN[(seed >>> 9) % L.SURN.length];
  const temp = L.TEMPS[(seed >>> 13) % L.TEMPS.length];
  return p.persona = { name, trade, g: tr.g, temp, fem, district: dd, seed, n: 0 };
}
// recent-line memory: no fragment repeats among the last 40 spoken lines anywhere (nearby NPCs never echo each other)
const recent = []; const used = (id) => recent.includes(id); const use = (id) => { recent.push(id); if (recent.length > 40) recent.shift(); };
function pickFrom(arr, seed, tagid) { const n = arr.length; for (let k = 0; k < n; k++) { const i = (seed + k * 7) % n; if (!used(tagid + i)) { use(tagid + i); return arr[i]; } } return arr[seed % n]; }
function fill(t, P, x, z) { return t.replace('{place}', label(nearestPlace(x, z))).replace('{dist}', P.district >= 0 ? DN[P.district] : 'Paris').replace('{trade}', P.trade).replace('{name}', P.name); }
// the generator: greeting + 1-2 context topics (most specific first) + a rumour (sometimes) + sign-off
export function compose(p) {
  const P = persona(p); const sd = hash(P.seed + P.n * 131 + Math.floor(G.gameTime * 4)); P.n++;
  if (P.g === 'cop' || P.g === 'gang') { const pool = L.BANK.map((b, i) => [b, i]).filter(([b]) => b[0] === 'k:' + P.g || (b[0] === 'h:1' && G.wanted > 0 && P.g === 'gang')); const [b, i] = pool[sd % pool.length]; use('b' + i); return P.g === 'cop' && G.wanted > 0 ? 'Halte-là! In the name of the law!' : b[1]; }
  if (P.n > 3) return pickFrom(['I\'ve told you all I know, monsieur.', 'Again? People will talk.', 'Enough chatter — I have a living to earn.', 'You\'re a strange one. Bonne soirée.'], sd, 'x');
  const h = G.wanted > 0 ? 1 : (Object.values(G.respect).reduce((a, b) => a + b, 0) > 120 && sd % 3 === 0 ? 2 : 0), act = actNow(), d = districtAt(p.x, p.z);
  const ctx = { t: tod(), w: G.rain > .3 ? 'rain' : 'dry', d: String(d), k: P.g, h: String(h), a: String(act) };
  const score = (tag) => { if (!tag) return 1; const [k, v] = tag.split(':'); if (ctx[k] !== v) return -1; return { h: 9, a: 5, d: 4, k: 4, w: 3, t: 2 }[k] || 1; };
  const cands = L.BANK.map((b, i) => [score(b[0]), i]).filter(([s, i]) => s > 0 && !used('b' + i));
  const take = (minS) => { const c = cands.filter(([s]) => s >= minS); if (!c.length) return null; const [s, i] = c[(sd >>> 4) % c.length]; use('b' + i); cands.splice(cands.findIndex(q => q[1] === i), 1); return L.BANK[i][1]; };
  const parts = [pickFrom(L.GREET[P.temp], sd, 'g' + P.temp)];
  if (P.n === 1) parts.push(pickFrom([`${P.name}, ${P.trade}.`, `I'm ${P.name.split(' ')[0]} — ${P.trade}, for my sins.`, `${P.name}, ${P.trade}, at your service.`, `They call me ${P.name.split(' ')[0]}. ${P.trade[0].toUpperCase() + P.trade.slice(1)}.`, `${P.name.split(' ').pop()}, ${P.trade}, ${P.district >= 0 ? DN[P.district].split(' &')[0] : 'Paris'} born and bred.`], sd >>> 5, 'i'));
  const first = h ? take(9) : (sd % 2 ? take(4) || take(2) : take(2)) || take(1); if (first) parts.push(first);
  if (!h && sd % 5 < 2) { const r = rumourFor(p, sd); if (r) parts.push(r); else { const t2 = take(1); if (t2) parts.push(t2); } }
  else if (!h && sd % 5 === 2) { const t2 = take(1); if (t2) parts.push(t2); }
  if (sd % 3 === 0 || h) parts.push(pickFrom(L.BYE[P.temp], sd >>> 2, 'y' + P.temp));
  return fill(parts.join(' '), P, p.x, p.z);
}
// rumours point at an undiscovered side job / activity, or at the next story giver
function rumourFor(p, sd) {
  const side = MISSIONS.filter(m => m.fac === 'side' && !G.done[m.id] && !S.known[m.id]);
  const ns = G.nextStory(); const opts = [];
  if (side.length) opts.push(() => { const m = side[sd % side.length]; const g = giverSpec(m); discover(m.id, true); return L.RUMOUR[sd % L.RUMOUR.length].replace('{who}', g.short).replace('{place}', label(g.poi)); });
  if (ns) opts.push(() => { const g = giverSpec(ns); return L.RUMOUR[(sd >>> 3) % L.RUMOUR.length].replace('{who}', g.short).replace('{place}', label(g.poi)); });
  const a = ACT.rumours().filter(r => !used('r' + r.id)); if (a.length) opts.push(() => { const r = a[sd % a.length]; use('r' + r.id); return L.ACT_RUMOUR[sd % 2].replace('{what}', r.what).replace('{place}', label(r.at)); });
  return opts.length ? opts[(sd >>> 6) % opts.length]() : null;
}
// ---------- speech display ----------
const bubbles = [];
export function speak(p, name, text, t) { G.say(`${name}: ${text}`, t); if (p) { p.talkT = Math.max(p.talkT || 0, 4.5); p.hold = [p.x, p.z]; bubbles.push({ p, text: text.length > 90 ? text.slice(0, 88) + '…' : text, t: Math.min(7, 2.5 + text.length * .04) }); } }
export function talk(p) {
  if (p.onTalk) return p.onTalk(p); const P = persona(p); const line = compose(p); speak(p, P.name, line); G.SFX && G.SFX.pager && 0; return line;
}
// ---------- mission givers ----------
const NAMEDLOOK = { Henri: 'vautrin', Vautrin: 'vautrin', Maza: 'maza', Lucie: 'lucie', Vaneau: 'vaneau', Baron: 'vaneau' };
const FEMRE = /^(Mme|Madame|Mlle|Mademoiselle|La |Lucie|Sarah|Berthe|Odile|Sibyl|Pauline|Marie|Jeanne|Louise|Suzanne|Market woman|Laundress|Widow|Yvette|Jane|Mother|Sister|Girl|Countess|Comtesse|Princess|Princesse|Pianist|Augusta|Cosima|Méry|Cécile|Rose|Julie|Nina|Victorine)/;
const HOME = { Eiffel: 'eiffel', Satie: 'chatnoir', Salis: 'chatnoir', Bruant: 'mirliton', Lautrec: 'moulinblanche', 'Toulouse-Lautrec': 'moulinblanche', Tanguy: 'tanguy', Bernhardt: 'republique', Sarah: 'republique' };
const CONTACT = { avant: 'Henri', apache: 'Maza', crimson: 'Lucie', velvet: 'Vaneau' };
const gspec = {};
export function giverSpec(m) {
  if (gspec[m.id]) return gspec[m.id];
  const sp = (m.intro || []).map(l => l.split(':')[0].trim()).find(n => n && n.length < 40 && !/^Th[ée]o/.test(n) && !/\(/.test(n));
  const contact = CONTACT[m.fac]; const s0 = m.steps[0]; let poi;
  const who = sp || (m.fac === 'side' ? 'A Parisian in need' : FACTIONS[m.fac].who);
  if (m.fac !== 'side' && (!sp || sp.startsWith(contact) || NAMEDLOOK[sp.split(' ')[0]] === NAMEDLOOK[contact])) poi = FACTIONS[m.fac].phone;
  else if (sp && HOME[sp.split(' ').pop()] && POI[HOME[sp.split(' ').pop()]]) poi = HOME[sp.split(' ').pop()];
  else { const at = s0 && (s0.at || (s0.cps && s0.cps[0])); poi = at && POI[at] ? at : (m.fac === 'side' ? 'kiosque' : FACTIONS[m.fac].phone); }
  const look = NAMEDLOOK[who.split(' ')[0]] || (FEMRE.test(who) ? 'lady' : /Apache|tough|Porter|Carter|Navvy|Worker|man$/i.test(who) ? 'worker' : /Abbé|Father|Doctor|Baron|Count|Monsieur|M\. /.test(who) ? 'bourgeois' : (m.fac === 'side' ? 'clerk' : 'bourgeois'));
  const short = who.replace(/^(The|A|An) /, m => m.toLowerCase()); const [x0, z0] = POI[poi] || POI.halles;
  const taken = Object.values(gspec).filter(g => g.poi === poi); let x = x0 + 1.5, z = z0; for (let k = 0; k < 24; k++) { const a = k * 1.05, r = 1.5 + Math.floor(k / 6) * 1.6; const cx = x0 + Math.cos(a) * r, cz = z0 + Math.sin(a) * r; if (!pedBlock(cx, cz) && taken.every(g => d2(g.x, g.z, cx, cz) > 2.4 * 2.4)) { x = cx; z = cz; break; } }
  return gspec[m.id] = { id: m.id, who, short, poi, look, x, z, fem: FEMRE.test(who) || look === 'lady' };
}
const givers = new Map(); let ringGeo = null, ringMat = null, ringMatS = null;
function wantGivers() { const out = []; if (G.M) return out; const ns = G.nextStory(); if (ns) out.push(ns); for (const m of MISSIONS) if (m.fac === 'side' && !G.done[m.id]) out.push(m); for (const id of forced) { const m = MISSIONS.find(q => q.id === id); if (m && !out.includes(m)) out.push(m); } return out; }
const forced = new Set();
function spawnGiver(m) {
  const g = giverSpec(m); const [x, z] = [g.x, g.z]; const p = G.spawnPed('civ', x, z, { look: g.look, stand: true, god: true, mission: true, giver: m.id, fem: g.fem });
  p.persona = { name: g.who, trade: '', g: 'giver', temp: 'chatty', fem: g.fem, district: districtAt(x, z), seed: hash(m.n * 31), n: 0 };
  if (!ringGeo) { ringGeo = new THREE.RingGeometry(1.1, 1.45, 28); ringGeo.rotateX(-Math.PI / 2); ringMat = new THREE.MeshBasicMaterial({ color: 0xf4c430, transparent: true, opacity: .8, depthWrite: false }); ringMatS = ringMat.clone(); ringMatS.color.set(0x7ac0ff); }
  const r = new THREE.Mesh(ringGeo, m.fac === 'side' ? ringMatS : ringMat); r.position.y = .08; r.renderOrder = 3; p.mesh.add(r); p.ring = r;
  p.onTalk = () => offerTalk(p, m); return p;
}
function offerTalk(p, m) {
  const g = giverSpec(m); const lines = (m.intro || []).filter(l => !/^Th[ée]o/.test(l));
  const hello = handLine(g.who.split(' ')[0]) || (lines[0] ? lines[0].replace(/^[^:]+:\s*/, '') : m.brief);
  speak(p, g.who, hello); discover(m.id); const go = () => { if (!G.M && givers.get(m.id) === p) { removeGiver(m.id); forced.delete(m.id); G.startDef(m); } }; if (G.DEBUG_FAST) go(); else setTimeout(go, 900); return hello;
}
function removeGiver(id) { const p = givers.get(id); if (p) { if (p.ring) p.mesh.remove(p.ring); G.removePed(p); givers.delete(id); } }
export function handLine(first) { const N = L.NAMEDLINES[first]; if (!N) return null; const a = actNow(); const pool = [...(N[a] || []), ...N.gen]; const sd = hash(Date.now() >>> 10); for (let k = 0; k < pool.length; k++) { const l = pool[(sd + k) % pool.length]; if (!used('n' + l.length + first)) { use('n' + l.length + first); return l; } } return pool[0]; }
function updateGivers() {
  const want = wantGivers(); const ids = new Set(want.map(m => m.id)); const px = G.player.veh ? G.player.veh.x : G.player.x, pz = G.player.veh ? G.player.veh.z : G.player.z;
  for (const [id, p] of givers) if (!ids.has(id) || !p.alive || d2(p.x, p.z, px, pz) > 200 * 200) removeGiver(id);
  for (const m of want) { if (givers.has(m.id)) continue; const g = giverSpec(m); if (d2(g.x, g.z, px, pz) < 150 * 150) givers.set(m.id, spawnGiver(m)); }
  // walking past an unknown side giver: they call out
  for (const [id, p] of givers) if (!S.known[id] && d2(p.x, p.z, px, pz) < 18 * 18) { discover(id); const m = MISSIONS.find(q => q.id === id); speak(p, p.persona.name, 'Hé, vous là! Yes, you — a word?'); }
}
export function discover(id, quiet) { if (S.known[id]) return; S.known[id] = 1; saveS(); const m = MISSIONS.find(q => q.id === id); if (m && !quiet) G.pager(`Noted in your carnet: ${m.title} — ${giverSpec(m).who}, ${label(giverSpec(m).poi)}`, 4); }
// letters: the next story mission arrives as a petit bleu (pneumatic letter) or a note
let letterT = 0;
function updateLetters(dt) {
  const ns = G.nextStory(); const id = ns ? ns.id : null; if (G.M || !id || S.lastNext === id) return; letterT += dt; if (letterT < 3) return; letterT = 0; S.lastNext = id; S.known[id] = 1; saveS();
  const g = giverSpec(ns); const kind = ['A petit bleu by pneumatique', 'A note pushed under your door', 'A message left with the concierge', 'A boy with a folded letter'][ns.n % 4];
  const body = (ns.intro && ns.intro.find(l => !/^Th[ée]o/.test(l))) || ns.brief; const sn = body.replace(/^[^:]+:\s*/, '');
  G.pager(`✉ ${kind}: «${sn.length > 110 ? sn.slice(0, 108) + '…' : sn}» — find ${g.who} at ${label(g.poi)}.`, 8); if (G.SFX && G.SFX.pager) G.SFX.pager();
}
// ---------- input ----------
const V = new THREE.Vector3();
export function screenOf(p, up = 2.3) { (p.mesh || { getWorldPosition: v => v.set(p.x, 0, p.z) }).getWorldPosition(V); V.y += up; V.project(G.camera); if (V.z > 1) return null; return [(V.x + 1) / 2 * innerWidth, (1 - V.y) / 2 * innerHeight]; }
function ppos() { const v = G.player.veh; return v ? [v.x, v.z] : [G.player.x, G.player.z]; }
export function pedAtScreen(sx, sy, range = 14) { const [px, pz] = ppos(); let best = null, bd = 48 * 48; for (const p of G.peds) { if (!p.alive || p.inVeh || d2(p.x, p.z, px, pz) > range * range) continue; const s = screenOf(p, 1.2); if (!s) continue; const dd = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if (dd < bd) { bd = dd; best = p; } } return best; }
export function pedNear(range = 3.5) { const [px, pz] = ppos(); let best = null, bd = range * range; for (const p of G.peds) { if (!p.alive || p.inVeh || p.hostile) continue; const dd = d2(p.x, p.z, px, pz); const w = p.giver ? dd * .2 : p.onTalk ? dd * .5 : dd; if (w < bd) { bd = w; best = p; } } return best; }
// interact: a click at (sx,sy) or the T key (nearest). shift = pickpocket. Returns what happened.
export function interact(sx, sy, shift) {
  if (!G || G.state !== 'play' || (G.paused && !G.DEBUG_FAST) || UI.open) return null; if (!G.player.alive) return null;
  const o = ACT.interactWorld(sx, sy, shift); if (o) return o;
  const p = sx === undefined || sx === null ? pedNear() : pedAtScreen(sx, sy); if (!p) return null;
  if (p.hostile || (G.wanted > 0 && (p.type === 'cop' || p.type === 'gend' || p.type === 'soldier'))) return null;
  if (shift) return ACT.pickpocket(p);
  if (G.M && p.giver) return null; return talk(p);
}
// ---------- tiny DOM UI (shops, cards, billiards, shows) ----------
export const UI = { open: false, el: null,
  show(title, html, buttons, onClose) { if (!this.el) { this.el = document.createElement('div'); this.el.id = 'lifeui'; this.el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);min-width:320px;max-width:560px;background:rgba(20,14,8,.94);border:2px solid #c9a24a;color:#f0e6cc;font:15px Georgia,serif;padding:16px 20px;z-index:50;box-shadow:0 0 30px #000;'; document.body.appendChild(this.el); }
    this.open = true; this.onClose = onClose; G.pause(true); this.el.style.display = 'block'; this.el.innerHTML = `<div style="color:#f4c430;font-size:19px;margin-bottom:8px">${title}</div><div>${html}</div><div id="lifeuib" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px"></div>`;
    const bb = this.el.querySelector('#lifeuib'); this.btns = []; for (const [t, f] of [...buttons, ['Leave', () => this.close()]]) { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'background:#3a2a16;color:#f0e6cc;border:1px solid #c9a24a;padding:5px 10px;font:14px Georgia,serif;cursor:pointer'; b.onclick = () => f(); bb.appendChild(b); this.btns.push([t, f]); } },
  close() { if (!this.open) return; this.open = false; this.el.style.display = 'none'; G.pause(false); const c = this.onClose; this.onClose = null; if (c) c(); },
  press(t) { const b = (this.btns || []).find(([n]) => n.startsWith(t)); if (b) { b[1](); return true; } return false; },
};
// ---------- per-frame ----------
let gT = 0;
function update(dt) {
  gT -= dt; if (gT < 0) { gT = 1; updateGivers(); }
  updateLetters(dt);
  for (const p of G.peds) if (p.talkT > 0) { p.talkT -= dt; if (p.hold) { p.x = p.hold[0]; p.z = p.hold[1]; const [px, pz] = ppos(); p.a = Math.atan2(pz - p.z, px - p.x); } if (p.talkT <= 0) p.hold = null; }
  for (let i = bubbles.length - 1; i >= 0; i--) { bubbles[i].t -= dt; if (bubbles[i].t <= 0 || !bubbles[i].p.alive) bubbles.splice(i, 1); }
  ACT.update(dt);
}
function hud(hx, w, h, sm) {
  hx.save(); hx.textAlign = 'center'; hx.font = (sm ? 12 : 14) + 'px Georgia,serif';
  for (const b of bubbles) { const s = screenOf(b.p, 2.6); if (!s) continue; const tw = Math.min(300, hx.measureText(b.text).width + 16); hx.globalAlpha = Math.min(1, b.t * 2); hx.fillStyle = 'rgba(250,244,228,.93)'; hx.strokeStyle = '#3a2a16'; hx.lineWidth = 1.5; const lines = wrap(hx, b.text, 284); const bh = lines.length * 17 + 8; hx.beginPath(); hx.rect(s[0] - tw / 2, s[1] - bh - 10, tw, bh); hx.fill(); hx.stroke(); hx.beginPath(); hx.moveTo(s[0] - 5, s[1] - 10); hx.lineTo(s[0], s[1] - 2); hx.lineTo(s[0] + 5, s[1] - 10); hx.fill(); hx.fillStyle = '#2a1e10'; lines.forEach((l, i) => hx.fillText(l, s[0], s[1] - bh - 10 + 17 * (i + 1))); }
  hx.globalAlpha = 1;
  for (const [id, p] of givers) { const s = screenOf(p, 2.4); if (!s) continue; hx.fillStyle = p.ring && p.ring.material === ringMatS ? '#7ac0ff' : '#f4c430'; hx.fillText((S.known[id] ? '★ ' : '? ') + p.persona.name, s[0], s[1] - (p.talkT > 0 ? 60 : 4)); }
  if (!G.M) { const ns = G.nextStory(); if (ns) { const g = giverSpec(ns); const [px, pz] = ppos(); const dm = Math.round(Math.hypot(g.x - px, g.z - pz) * 3.3); hx.textAlign = 'left'; hx.fillStyle = '#ffe6a0'; hx.fillText(`✉ ${g.who} — ${label(g.poi)} (${dm < 1000 ? dm + ' m' : (dm / 1000).toFixed(1) + ' km'})`, 14, h - 14); } }
  const p = !G.M || true ? pedNear(3.2) : null; if (p && !p.hostile) { hx.textAlign = 'center'; hx.fillStyle = '#e8dcc0'; hx.fillText(p.giver ? '[T] / click — talk (offers a job)' : p.onTalk ? '[T] / click — talk' : '[T] / click — talk   ·   [Shift+T] — pick pocket', w / 2, h * .66); }
  ACT.hud(hx, w, h, sm); hx.restore();
}
function wrap(hx, t, mw) { const ws = t.split(' '), out = []; let l = ''; for (const x of ws) { const tt = l ? l + ' ' + x : x; if (hx.measureText(tt).width > mw && l) { out.push(l); l = x; } else l = tt; } if (l) out.push(l); return out.slice(0, 4); }
function map(hx, P) {
  hx.save(); hx.font = '12px Georgia,serif'; hx.textAlign = 'left'; const ns = !G.M && G.nextStory();
  for (const m of MISSIONS) { if (G.done[m.id] || (m.fac === 'side' ? !S.known[m.id] : m !== ns)) continue; const g = giverSpec(m); const [sx, sy] = P(g.x, g.z); hx.fillStyle = m.fac === 'side' ? '#7ac0ff' : '#f4c430'; hx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 3 : 7, a = k * .628 - 1.57; hx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } hx.fill(); if (m === ns) { hx.fillText(g.who, sx + 8, sy - 6); } }
  ACT.map(hx, P); hx.fillStyle = '#e8dcc0'; hx.fillText('★ gold: story contact   ★ blue: side job (heard of)   ◆ activities', 20, innerHeight - 26); hx.restore();
}
function phone(ph) { // the telephone exchange: news instead of auto-starting missions
  const ns = G.nextStory(); const g = ns && giverSpec(ns); const sd = hash(Math.floor(G.gameTime * 10)); let msg;
  if (g && sd % 2) msg = `«J'écoute...» The operator puts you through: "${g.who} wants you. ${label(g.poi)} — don't keep them waiting."`;
  else { const r = rumourFor({ x: ph.x, z: ph.z }, sd); msg = r ? `«J'écoute...» A crackling voice: "${r}"` : '«J\'écoute...» Nobody on the line but the hiss of the Seine.'; }
  G.pager(msg, 7); if (G.SFX && G.SFX.bell) G.SFX.bell();
}
// ---------- init ----------
export function init(game) {
  G = game; loadS(); setupPlaces(); ACT.init(G, { S, saveS, speak, talk, persona, label, nearestPlace, districtAt, hour, tod, actNow, screenOf, pedAtScreen, pedNear, UI, hash, discover, giverSpec, handLine });
  const H = G.HOOKS; H.update.push(update); H.hud.push(hud); H.map.push(map); H.phone.push(phone);
  H.where = (m) => { const g = giverSpec(m); return `${g.who}, ${label(g.poi)}`; }; H.known = (m) => !!S.known[m.id] || !!G.done[m.id];
  H.welcome = 'Paris, 1890. Fresh off the night train with nothing but a watchmaker\'s hands. Walk up to people and click (or press T) to talk. Watch the newspapers, letters and gossip for work.';
  addEventListener('keydown', e => { if (e.code === 'KeyT' && !e.repeat) interact(null, null, e.shiftKey); if (UI.open && e.code === 'Escape') UI.close(); });
  addEventListener('mousedown', e => { if (H.clickOwned || e.button !== 0 || !e.target || e.target.tagName !== 'CANVAS') return; interact(e.clientX, e.clientY, e.shiftKey); });
  // public API: the engine's click handler can call GAME.interactAt(x, y, shift); tests use GAME.life
  G.interactAt = interact; G.interact = () => interact(null, null, false);
  G.life = { S, persona, compose, talk, giverSpec, givers, interact, UI, discover, forceOffer: (id) => { forced.add(id); updateGivers(); const g = giverSpec(MISSIONS.find(m => m.id === id)); return [g.x, g.z]; }, refresh: updateGivers, pedNear, ACT, label, nearestPlace, bubbles };
}
