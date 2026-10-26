"""Seine rebuild (v18): smooth continuous quay lines + authored bridge decks.
Reads map/map.png (gameplay raster), writes it back with
  - the river (water + old bridge tiles) re-traced as smoothed contours (dressed quay walls, no tile jags),
  - the small arm south of the Cite opened to a clean channel (Petit-Pont, Pont au Double),
  - BRIDGE tiles = exactly each authored deck rectangle,
and map/bridges.json: per bridge centre, axis, real 1890 width, river span.
Keeps a pristine copy as map/map_orig.png so the tool is repeatable."""
import json, math, os, numpy as np, cv2
from PIL import Image
from scipy.ndimage import gaussian_filter1d
R = os.path.join(os.path.dirname(__file__), '..', 'map')
src = os.path.join(R, 'map_orig.png')
if not os.path.exists(src): Image.open(os.path.join(R, 'map.png')).save(src)
A = np.array(Image.open(src)).copy(); kind = A[:, :, 0]; NZ, NX = kind.shape; T = 2.0
WATER, BRIDGE, SIDE, ROAD, BLD = 3, 4, 1, 0, 2
def ll(la, lo):
    KX = 111320 * math.cos(48.862 * math.pi / 180); return ((lo - 2.270) * KX / 2.5, (48.895 - la) * 111320 / 2.5)
# key: lat, lon, width in metres (1890 state), kind
BR = {'pontneufb': (48.85790, 2.34190, 20, 'stone'), 'pontneufs': (48.85630, 2.34070, 20, 'stone'), 'pontcarrousel': (48.85955, 2.33300, 12, 'iron'),
      'pontroyal': (48.86030, 2.32960, 17, 'stone'), 'pontsolferino': (48.86130, 2.32440, 20, 'iron'), 'pontconcorde': (48.86370, 2.31960, 15.5, 'stone'),
      'pontinvalides': (48.86360, 2.31040, 18, 'stone'), 'pontalma': (48.86350, 2.30160, 20, 'stone'), 'pontiena': (48.85990, 2.29300, 14, 'stone'),
      'pontchange': (48.85650, 2.34680, 30, 'stone'), 'pontnd': (48.85600, 2.34960, 20, 'stone'), 'pontarcole': (48.85520, 2.35090, 20, 'iron'),
      'pontstmichel': (48.85360, 2.34410, 30, 'stone'), 'petitpont': (48.85265, 2.34720, 20, 'stone'), 'pontdouble': (48.85230, 2.34880, 20, 'iron'),
      'pontlp': (48.85470, 2.35460, 15.5, 'stone'), 'pontstlouis': (48.85300, 2.35300, 12, 'iron'), 'pontmarie': (48.85320, 2.35730, 22, 'stone'),
      'ponttournelle': (48.85100, 2.35450, 15, 'stone'), 'pontsully': (48.84980, 2.35950, 20, 'iron'), 'pontausterlitz': (48.84430, 2.36580, 30, 'stone'),
      'pontbercy': (48.83840, 2.37470, 22, 'stone'), 'pontpassy': (48.85560, 2.28760, 6, 'foot'), 'pontarts': (48.85830, 2.33750, 10, 'foot'),
      'pontarcheveche': (48.85159, 2.35163, 17, 'stone')}
SQ = set()
V = json.load(open(os.path.join(R, 'vec.json')))
BRR = [r[3] for r in V['roads'] if r[1]]
wet = ((kind == WATER) | (kind == BRIDGE)).astype(np.uint8)
# --- open the petit bras south of the Cite: widen the channel to >= 7 tiles between Pont Saint-Michel and the Pont au Double
# the raster breaks the arm into separate pools at the bridge heads; carve one continuous channel through their centres (tile coords)
ARM = np.array([(1059, 877), (1090, 909), (1119, 927), (1150, 941), (1175, 955), (1196, 966), (1208, 973)], np.int32)
cv2.polylines(wet, [ARM], False, 1, 7)
# Passy: the Ile aux Cygnes dyke and the old viaduct footing form a land sliver across mid-river; flood it so the river is one sheet
pd = np.zeros_like(wet); cv2.circle(pd, (257, 876), 17, 1, -1); wet[(pd == 1) & (kind != BLD) & (kind != ROAD)] = 1
# bridge crossings: the old raster pinched the river shut around many bridge heads (junction plazas painted across the water). Close the gap
# with a morphological closing, applied only in a disc round each recorded bridge and never over buildings
cl = cv2.morphologyEx(wet, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
near = np.zeros_like(wet)
for k, (la, lo, wm, ty) in BR.items():
    x, z = ll(la, lo); cv2.circle(near, (int(x // T), int(z // T)), 26, 1, -1)
wet[(cl == 1) & (near == 1) & (kind != BLD)] = 1
# --- smooth contours of the river (outer banks + islands)
cs, hier = cv2.findContours(wet, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
out = np.zeros_like(wet); SIG = 5.0
polys = []
for k, c in enumerate(cs):
    if len(c) < 30: continue
    p = c[:, 0, :].astype(np.float64); n = len(p); s = min(SIG * 2, n / 8)
    q = np.stack([gaussian_filter1d(p[:, 0], s, mode='wrap'), gaussian_filter1d(p[:, 1], s, mode='wrap')], 1)
    q = cv2.approxPolyDP(q.astype(np.float32).reshape(-1, 1, 2), 0.9, True).reshape(-1, 2).astype(np.float64)  # dressed-stone quays: straight runs between few vertices
    hole = hier[0][k][3] >= 0
    if hole and np.min(np.hypot(p[:, 0] - 259, p[:, 1] - 883)) < 70: continue  # the Ile aux Cygnes dyke is a 1-tile sliver: leave it under water so the Passy viaduct reads as one span
    polys.append((hole, q))
for hole, q in sorted(polys, key=lambda t: t[0]):
    cv2.fillPoly(out, [np.round(q * 8).astype(np.int32)], 0 if hole else 1, shift=3)
# --- bridges: axis from the OSM bridge way, width from the 1890 record, span across the smoothed river
res = {}
for k, (la, lo, wm, ty) in BR.items():
    c = np.array(ll(la, lo)); best = None; bl = 0
    if not out[int(c[1] // T), int(c[0] // T)]:  # record point on the bank: nearest open water
        jw, iw = np.nonzero(out[int(c[1] // T) - 20:int(c[1] // T) + 20, int(c[0] // T) - 20:int(c[0] // T) + 20])
        if len(iw): q = np.argmin((iw - 20) ** 2 + (jw - 20) ** 2); c = np.array([(int(c[0] // T) - 20 + iw[q] + .5) * T, (int(c[1] // T) - 20 + jw[q] + .5) * T])
    for p in BRR:
        P = np.array(p).reshape(-1, 2); d = np.min(np.hypot(P[:, 0] - c[0], P[:, 1] - c[1]))
        L = np.hypot(*(P[-1] - P[0]))
        if d < 30 and L > bl and k not in SQ: bl, best = L, P
    if best is None:  # no bridge way in OSM extract: the 1890 bridge crosses square to the local river
        jw, iw = np.nonzero(out[int(c[1] // T) - 25:int(c[1] // T) + 25, int(c[0] // T) - 25:int(c[0] // T) + 25]); P = np.stack([iw, jw], 1).astype(float); P -= P.mean(0)
        ev = np.linalg.eigh(P.T @ P)[1][:, 1]; u = np.array([-ev[1], ev[0]]); best = np.array([c - u * 10, c + u * 10]); print('square to river', k)
    u = best[-1] - best[0]; u = u / np.hypot(*u)
    # centre: the way's crossing point nearest the record position
    t0 = np.dot(c - best[0], u); cen = best[0] + u * t0
    W = wm / 2.5
    def wetAt(pt):
        i, j = int(pt[0] // T), int(pt[1] // T); return 0 <= i < NX and 0 <= j < NZ and out[j, i] == 1
    # slide centre to the nearest wet point along the axis
    if not wetAt(cen):
        for d in np.arange(0, 60, .5):
            if wetAt(cen + u * d): cen = cen + u * d; break
            if wetAt(cen - u * d): cen = cen - u * d; break
    s0 = 0
    while s0 > -200 and wetAt(cen + u * (s0 - .25)): s0 -= .25
    s1 = 0
    while s1 < 200 and wetAt(cen + u * (s1 + .25)): s1 += .25
    m = cen + u * (s0 + s1) / 2; L = s1 - s0
    rv = None
    print(k, 'osm' if bl else 'sq', 'axis', np.round(u, 2), 'cen-rec', round(float(np.hypot(*(m - c))), 1), 'L', L)
    res[k] = {'x': round(float(m[0]), 2), 'z': round(float(m[1]), 2), 'ux': round(float(u[0]), 5), 'uz': round(float(u[1]), 5), 'L': round(float(L), 2), 'W': round(W, 2), 'ty': ty}
# --- write the raster: water inside the smoothed river, bridge decks, former water outside -> quay paving
nk = kind.copy(); ns = A[:, :, 1].copy()
wasW = (kind == WATER) | (kind == BRIDGE)
nk[(out == 1)] = WATER; ns[out == 1] = 5
quay = wasW & (out == 0); nk[quay] = SIDE; ns[quay] = 4
jj, ii = np.mgrid[0:NZ, 0:NX]; X = (ii + .5) * T; Z = (jj + .5) * T
for k, b in res.items():
    du = (X - b['x']) * b['ux'] + (Z - b['z']) * b['uz']; dv = -(X - b['x']) * b['uz'] + (Z - b['z']) * b['ux']
    m = (np.abs(du) <= b['L'] / 2 + 1.0) & (np.abs(dv) <= b['W'] / 2) & (out == 1)
    nk[m] = BRIDGE; ns[m] = 1
print('tiles changed', int((nk != kind).sum()), 'roads lost', int(((kind == ROAD) & (nk == WATER)).sum()), 'blds lost', int(((kind == BLD) & (nk == WATER)).sum()))
A[:, :, 0] = nk; A[:, :, 1] = ns; Image.fromarray(A).save(os.path.join(R, 'map.png'))
json.dump(res, open(os.path.join(R, 'bridges.json'), 'w'), indent=0)
print(len(res), 'bridges')
