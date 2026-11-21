#!/usr/bin/env node
// Validator for the second Cancha football catalog (futbol2.json: cf-15 onwards).
// Extends validate-futbol.js with: coordination equipment (ladder, hurdle, ring, pole), the new
// objectives (Coordinación, Velocidad y agilidad, Fuerza y resistencia), the video object
// (captions + reps) and an animation check that follows the app's own rules (app/app.js
// playDiagram): a "mov" moves the player nearest the arrow start, a "conduccion" moves that
// player and the nearest ball, a "pase" moves the ball nearest the arrow start (all within 13).
// Usage: node validate-futbol2.js [path/to/futbol2.json] [path/to/futbol.json]
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, 'futbol2.json');
const baseFile = process.argv[3] || path.join(path.dirname(file), 'futbol.json');
const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);
const base = fs.existsSync(baseFile) ? JSON.parse(fs.readFileSync(baseFile, 'utf8')) : { exercises: [] };

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const OBJECTIVES = ['Calentamiento', 'Pase', 'Conducción', 'Control', 'Tiro', 'Defensa', 'Táctica', 'Portero',
  'Coordinación', 'Velocidad y agilidad', 'Fuerza y resistencia', 'Juego reducido', 'Vuelta a la calma'];
const LEVELS = ['Inicial', 'Intermedio', 'Avanzado'];
const FIRST_ID = 15;
const EXPECTED_COUNT = 12;
const REQUIRED_MIX = { 'Coordinación': 5, 'Velocidad y agilidad': 4, 'Fuerza y resistencia': 2, 'Calentamiento': 1 };
const MIN_SCHOOL = 7;
const PAUSE_LABELS = ['Hidratación', 'Descanso', 'Preparar material', 'Montar material'];
const SESSION_TOTALS = { 'Primaria · Coordinación y velocidad': 50 };
const EXPECTED_SESSIONS = 1;
// Spain-only words that a Mexican PE teacher would not use (warning only).
const NOT_MX = /\b(coger|coge|cogen|cogéis|vosotros|vosotras|vuestro|vuestra|habéis|chaval\w*|zapatillas|ordenador|móvil|guay|pelota de reglamento|portero\/a)\b/i;

const PLAYER_R = 7;       // player chip radius in the app
const PLAYER_GAP = 15;    // min distance between player centres
const CONE_GAP = 9;       // min distance between cones
const START_TOL = 6;      // arrow start must be this close to the piece it moves
const PICK = 13;          // the app picks the nearest piece within this radius
const RECEIVE_TOL = 10;   // pass end must be this close to a receiver (after that step's runs)
const MAX_ITEMS = 20;
const MIN_ITEMS = 6;
const LADDER_STEP = 10.5; // longest stretch of one arrow inside a ladder (1.5 squares of 7)

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inRange = (x, y) => x >= 8 && x <= 152 && y >= 8 && y <= 192;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const lines = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const sentences = (s) => s.trim().split(/(?<=[.!?…])\s+(?=[¿¡A-ZÁÉÍÓÚÑ0-9'"(])/u).filter(Boolean);

function segDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
// distance from a point to an axis-aligned rectangle {x0,y0,x1,y1} (0 when inside)
function rectDist(p, r) {
  const dx = Math.max(r.x0 - p.x, 0, p.x - r.x1);
  const dy = Math.max(r.y0 - p.y, 0, p.y - r.y1);
  return Math.hypot(dx, dy);
}
const rectsOverlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
// length of the part of segment a→b that lies inside rectangle r (Liang–Barsky clipping)
function clipLen(a, b, r) {
  const dx = b.x - a.x, dy = b.y - a.y;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [a.x - r.x0, r.x1 - a.x, a.y - r.y0, r.y1 - a.y];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return 0; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
  }
  return t1 > t0 ? (t1 - t0) * Math.hypot(dx, dy) : 0;
}
// do segments a→b and c→d cross?
function segCross(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

// Equipment footprints, matching the app's drawing (itemSVG in app/app.js)
function gearRect(it) {
  if (it.t === 'ladder') {
    const h = (it.n * 7) / 2; // n squares of 7 units, 10 wide
    return it.r === 90 ? { x0: it.x - h, y0: it.y - 5, x1: it.x + h, y1: it.y + 5 }
      : { x0: it.x - 5, y0: it.y - h, x1: it.x + 5, y1: it.y + h };
  }
  if (it.t === 'hurdle') {
    return it.r === 90 ? { x0: it.x - 3, y0: it.y - 6.2, x1: it.x + 3, y1: it.y + 6.2 }
      : { x0: it.x - 6.2, y0: it.y - 3, x1: it.x + 6.2, y1: it.y + 3 };
  }
  const rad = it.t === 'ring' ? 5 : it.t === 'pole' ? 2.4 : 4.6; // cone ≈ 4.6
  return { x0: it.x - rad, y0: it.y - rad, x1: it.x + rad, y1: it.y + rad };
}
const rectInRange = (r) => inRange(r.x0, r.y0) && inRange(r.x1, r.y1);

// A pass/shot may end in a real goal (top for both views, bottom for the full pitch)
function inRealGoal(v, p) {
  const xOk = p.x >= 66 && p.x <= 94;
  if (xOk && p.y <= 16) return true;
  if (v === 'full' && xOk && p.y >= 184) return true;
  return false;
}
// ...or through a cone gate (two cones up to 30 apart)
function inConeGate(cones, p) {
  for (let i = 0; i < cones.length; i++) {
    for (let j = i + 1; j < cones.length; j++) {
      if (dist(cones[i], cones[j]) <= 30 && segDist(p, cones[i], cones[j]) <= 6) return true;
    }
  }
  return false;
}

// ---------- global checks ----------
if (/(https?:\/\/|www\.|youtube|youtu\.be|\.com\b|\.mx\b)/i.test(raw)) err('file', 'contains a URL or YouTube reference');
if (!Array.isArray(data.exercises)) err('file', 'exercises must be an array');
if (!Array.isArray(data.sessions)) err('file', 'sessions must be an array');

const exercises = data.exercises || [];
const baseIds = new Set((base.exercises || []).map((e) => e.id));
const ids = new Set();
const mix = {};
let schoolCount = 0;
const features = {}; // per exercise: which equipment / arrow kinds it uses

exercises.forEach((ex, idx) => {
  const W = ex.id || `exercises[${idx}]`;
  // ----- fields -----
  const expectedId = `cf-${String(idx + FIRST_ID).padStart(2, '0')}`;
  if (ex.id !== expectedId) err(W, `id should be ${expectedId}`);
  if (ids.has(ex.id)) err(W, 'duplicate id');
  if (baseIds.has(ex.id)) err(W, `id clashes with ${path.basename(baseFile)}`);
  ids.add(ex.id);
  if (ex.sport !== 'futbol') err(W, 'sport must be "futbol"');
  if (!nonEmpty(ex.title)) err(W, 'title missing');
  else if (ex.title.length > 42) err(W, `title is ${ex.title.length} chars (> 42)`);
  if (!OBJECTIVES.includes(ex.objective)) err(W, `objective "${ex.objective}" not allowed`);
  mix[ex.objective] = (mix[ex.objective] || 0) + 1;
  if (!LEVELS.includes(ex.level)) err(W, `level "${ex.level}" not allowed`);
  if (!Number.isInteger(ex.duration) || ex.duration <= 0) err(W, 'duration must be a positive integer');
  for (const f of ['players', 'age', 'space', 'material', 'description', 'keyPoints', 'variations']) {
    if (!nonEmpty(ex[f])) err(W, `${f} missing`);
  }
  if (nonEmpty(ex.age) && !/Sub-\d+/.test(ex.age)) warn(W, 'age does not use the "Sub-N" format');
  if (nonEmpty(ex.description)) {
    const n = sentences(ex.description).length;
    if (n < 2 || n > 4) err(W, `description has ${n} sentences (need 2–4)`);
  }
  if (nonEmpty(ex.keyPoints)) {
    const k = lines(ex.keyPoints);
    if (k.length < 3 || k.length > 4) err(W, `keyPoints has ${k.length} lines (need 3–4)`);
    k.forEach((l) => { if (l.length > 70) warn(W, `long key point: "${l}"`); });
  }
  if (nonEmpty(ex.variations)) {
    const v = lines(ex.variations);
    if (v.length < 2 || v.length > 3) err(W, `variations has ${v.length} lines (need 2–3)`);
    if (!v.some((l) => l.startsWith('Más fácil:'))) err(W, 'variations need a "Más fácil: …" line');
    if (!v.some((l) => l.startsWith('Más difícil:'))) err(W, 'variations need a "Más difícil: …" line');
  }
  if (typeof ex.school !== 'boolean') err(W, 'school must be boolean');
  else if (ex.school) schoolCount++;
  const text = ['title', 'players', 'space', 'material', 'description', 'keyPoints', 'variations']
    .map((f) => ex[f] || '').join(' ');
  const m = text.match(NOT_MX);
  if (m) warn(W, `"${m[0]}" is not Mexican Spanish`);

  // ----- video -----
  const vid = ex.video;
  if (!vid || typeof vid !== 'object' || Array.isArray(vid)) err(W, 'video object missing');
  else {
    const extra = Object.keys(vid).filter((k) => !['captions', 'reps'].includes(k));
    if (extra.length) warn(W, `video has unknown keys: ${extra.join(', ')}`);
    if (!Array.isArray(vid.captions)) err(W, 'video.captions must be an array');
    else {
      if (vid.captions.length < 3 || vid.captions.length > 5) err(W, `video has ${vid.captions.length} captions (need 3–5)`);
      const seen = new Set();
      vid.captions.forEach((c, i) => {
        if (!nonEmpty(c)) err(W, `video caption ${i + 1} is empty`);
        else {
          if (c.length > 34) err(W, `video caption "${c}" is ${c.length} chars (> 34)`);
          if (seen.has(c.toLowerCase())) err(W, `video caption "${c}" is repeated`);
          if (/\n/.test(c)) err(W, `video caption "${c}" has a line break`);
          seen.add(c.toLowerCase());
          const mc = c.match(NOT_MX);
          if (mc) warn(W, `caption "${c}": "${mc[0]}" is not Mexican Spanish`);
        }
      });
    }
    if (!nonEmpty(vid.reps)) err(W, 'video.reps missing');
    else if (vid.reps.length > 40) err(W, `video.reps is ${vid.reps.length} chars (> 40)`);
  }

  // ----- diagram -----
  const d = ex.diagram;
  if (!d || typeof d !== 'object') { err(W, 'diagram missing'); return; }
  if (!['full', 'half'].includes(d.v)) err(W, `diagram.v "${d.v}" must be "full" or "half"`);
  if (!Array.isArray(d.items)) { err(W, 'diagram.items must be an array'); return; }
  if (d.items.length < MIN_ITEMS || d.items.length > MAX_ITEMS) err(W, `diagram has ${d.items.length} items (need ${MIN_ITEMS}–${MAX_ITEMS})`);

  const players = [];
  const cones = [];
  const balls = [];
  const gear = []; // ladder, hurdle, ring, pole (and cones, for overlap checks)
  const arrows = [];
  const seenNums = new Set();
  const F = features[ex.id] = { ladder: 0, hurdle: 0, ring: 0, pole: 0, pase: 0, conduccion: 0, mov: 0, goal: 0 };
  d.items.forEach((it, i) => {
    const I = `${W} item ${i} (${it.t})`;
    if (!['a', 'b', 'cone', 'ball', 'arrow', 'ladder', 'hurdle', 'ring', 'pole'].includes(it.t)) { err(I, `unknown piece type "${it.t}"`); return; }
    if (!isNum(it.x) || !isNum(it.y)) { err(I, 'x/y must be numbers'); return; }
    if (!inRange(it.x, it.y)) err(I, `(${it.x},${it.y}) out of 8–152 × 8–192`);
    if (it.t === 'a' || it.t === 'b') {
      if (!Number.isInteger(it.n) || it.n < 1) err(I, 'player n must be a positive integer');
      const key = `${it.t}${it.n}`;
      if (seenNums.has(key)) err(I, `duplicate player ${key}`);
      seenNums.add(key);
      players.push({ key, x: it.x, y: it.y, i });
    } else if (it.t === 'cone') { cones.push(it); gear.push({ ...it, i, rect: gearRect(it) }); }
    else if (it.t === 'ball') balls.push({ x: it.x, y: it.y, i });
    else if (it.t === 'arrow') {
      if (!['pase', 'conduccion', 'mov'].includes(it.k)) err(I, `arrow k "${it.k}" not allowed`);
      if (!isNum(it.x2) || !isNum(it.y2)) { err(I, 'arrow x2/y2 must be numbers'); return; }
      if (!inRange(it.x2, it.y2)) err(I, `arrow end (${it.x2},${it.y2}) out of range`);
      if (!Number.isInteger(it.s) || it.s < 1) err(I, `arrow s "${it.s}" must be a positive integer`);
      if (Math.hypot(it.x2 - it.x, it.y2 - it.y) < 6) err(I, 'arrow is too short (< 6)');
      F[it.k] = (F[it.k] || 0) + 1;
      arrows.push({ ...it, i });
    } else {
      // coordination equipment
      if (it.t === 'ladder') {
        if (!Number.isInteger(it.n) || it.n < 4 || it.n > 10) { err(I, 'ladder n (rungs) must be an integer 4–10'); return; }
      }
      if ((it.t === 'ladder' || it.t === 'hurdle') && ![0, 90].includes(it.r === undefined ? 0 : it.r)) {
        err(I, `r must be 0 or 90 (found ${it.r})`);
      }
      const g = { ...it, r: it.r || 0, i };
      g.rect = gearRect(g);
      if (!rectInRange(g.rect)) {
        err(I, `footprint ${g.rect.x0.toFixed(1)}–${g.rect.x1.toFixed(1)} × ${g.rect.y0.toFixed(1)}–${g.rect.y1.toFixed(1)} leaves 8–152 × 8–192`);
      }
      F[it.t]++;
      gear.push(g);
    }
  });
  if (players.length === 0) err(W, 'diagram has no players');

  // players: spacing, and nothing drawn on their start spots
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    for (let j = i + 1; j < players.length; j++) {
      const g = dist(p, players[j]);
      if (g < PLAYER_GAP) err(W, `players ${p.key} and ${players[j].key} are ${g.toFixed(1)} apart (< ${PLAYER_GAP})`);
    }
    gear.forEach((q) => {
      if (q.t === 'cone') {
        const g = dist(p, q);
        if (g < 8) warn(W, `player ${p.key} sits on a cone (${g.toFixed(1)})`);
      } else if (q.t === 'ring' || q.t === 'pole') {
        const need = PLAYER_R + (q.t === 'ring' ? 5 : 2.4);
        const g = dist(p, q);
        if (g < need) err(W, `${q.t} at (${q.x},${q.y}) overlaps player ${p.key}'s start spot (${g.toFixed(1)} < ${need})`);
      } else {
        const g = rectDist(p, q.rect);
        if (g < PLAYER_R) err(W, `${q.t} at (${q.x},${q.y}) overlaps player ${p.key}'s start spot (${g.toFixed(1)} < ${PLAYER_R})`);
      }
    });
    balls.forEach((b) => {
      const g = dist(p, b);
      if (g < 7) warn(W, `ball overlaps player ${p.key} (${g.toFixed(1)})`);
    });
  }
  // equipment must not overlap other equipment or a ball
  for (let i = 0; i < gear.length; i++) {
    for (let j = i + 1; j < gear.length; j++) {
      const a = gear[i], b = gear[j];
      if (a.t === 'cone' && b.t === 'cone') {
        const g = dist(a, b);
        if (g < CONE_GAP) err(W, `cones at (${a.x},${a.y}) and (${b.x},${b.y}) are ${g.toFixed(1)} apart (< ${CONE_GAP})`);
      } else if (a.t === 'ring' && b.t === 'ring') {
        if (dist(a, b) < 10) err(W, `rings at (${a.x},${a.y}) and (${b.x},${b.y}) overlap`);
      } else if (rectsOverlap(a.rect, b.rect)) {
        err(W, `${a.t} at (${a.x},${a.y}) overlaps ${b.t} at (${b.x},${b.y})`);
      }
    }
    balls.forEach((b) => {
      if (gear[i].t !== 'cone' && rectDist(b, gear[i].rect) < 2) warn(W, `ball at (${b.x},${b.y}) lies on the ${gear[i].t} at (${gear[i].x},${gear[i].y})`);
    });
  }

  // footwork: arrows that cross equipment must be split into steps
  const ladders = gear.filter((g) => g.t === 'ladder');
  const hurdles = gear.filter((g) => g.t === 'hurdle');
  const rings = gear.filter((g) => g.t === 'ring');
  const poles = gear.filter((g) => g.t === 'pole');
  arrows.forEach((a) => {
    if (a.k === 'pase') return;
    const A = `${W} arrow ${a.i} (s${a.s}, ${a.k})`;
    const p0 = { x: a.x, y: a.y }, p1 = { x: a.x2, y: a.y2 };
    ladders.forEach((l) => {
      const L = clipLen(p0, p1, l.rect);
      if (L > LADDER_STEP) err(A, `runs ${L.toFixed(1)} units through the ladder at (${l.x},${l.y}); split it into one arrow per square`);
    });
    const crossed = hurdles.filter((h) => {
      const bar = h.r === 90 ? [{ x: h.x, y: h.y - 6.2 }, { x: h.x, y: h.y + 6.2 }] : [{ x: h.x - 6.2, y: h.y }, { x: h.x + 6.2, y: h.y }];
      return segCross(p0, p1, bar[0], bar[1]);
    });
    if (crossed.length > 1) err(A, `jumps ${crossed.length} hurdles in one arrow; use one arrow per hurdle`);
    const ringHits = rings.filter((r) => dist(r, p0) > 5 && dist(r, p1) > 5 && segDist(r, p0, p1) < 5);
    if (ringHits.length > 0) warn(A, `passes over ${ringHits.length} hoop(s) without landing in them`);
    poles.forEach((q) => {
      const g = segDist(q, p0, p1);
      if (g < 3.5) err(A, `runs through the pole at (${q.x},${q.y}) (${g.toFixed(1)} < 3.5)`);
      else if (g < 5) warn(A, `passes very close to the pole at (${q.x},${q.y}) (${g.toFixed(1)})`);
    });
  });

  // ----- animation: simulate the app step by step -----
  const steps = [...new Set(arrows.map((a) => a.s))].sort((a, b) => a - b);
  if (steps.some((s, i) => s !== i + 1)) err(W, `arrow steps must run 1,2,3… without gaps (found ${steps.join(',')})`);

  const pos = players.map((p) => ({ key: p.key, x: p.x, y: p.y }));
  const bpos = balls.map((b) => ({ x: b.x, y: b.y, id: b.i }));
  const nearestIn = (list, pt, max, skip) => {
    let best = null, bd = max, second = Infinity;
    list.forEach((q) => {
      if (skip && skip(q)) return;
      const g = dist(q, pt);
      if (g < bd) { second = bd; bd = g; best = q; } else if (g < second) second = g;
    });
    return { best, d: bd, second };
  };
  const prevEnds = [];

  for (const s of steps) {
    const stepArrows = arrows.filter((a) => a.s === s);
    const moves = [];      // {piece, dx, dy}
    const passes = [];
    const movedPlayers = new Set();
    const movedBalls = new Set();
    for (const a of stepArrows) {
      const A = `${W} arrow ${a.i} (s${s}, ${a.k})`;
      const start = { x: a.x, y: a.y };
      const dx = a.x2 - a.x, dy = a.y2 - a.y;
      const pl = nearestIn(pos, start, PICK);
      if (!pl.best || pl.d > START_TOL) {
        const nearPrev = prevEnds.some((e) => dist(e, start) <= START_TOL);
        if (nearPrev) err(A, `chain broken: starts at (${a.x},${a.y}) but no player stands there at step ${s}`);
        else err(A, `does not start at a player (${a.x},${a.y})`);
        continue;
      }
      if (pl.second - pl.d < 3) warn(A, `two players are about equally close to the start; the app may move the wrong one`);
      const actor = pl.best;
      if (a.k === 'mov' || a.k === 'conduccion') {
        if (movedPlayers.has(actor.key)) err(A, `${actor.key} has two movement arrows in step ${s}`);
        movedPlayers.add(actor.key);
        moves.push({ piece: actor, dx, dy });
        if (a.k === 'conduccion') {
          const b = nearestIn(bpos, start, PICK).best;
          if (!b) err(A, `${actor.key} dribbles but no ball is within ${PICK} of the arrow start`);
          else {
            if (movedBalls.has(b)) err(A, `ball at (${b.x.toFixed(0)},${b.y.toFixed(0)}) is moved twice in step ${s}`);
            movedBalls.add(b);
            const owner = nearestIn(pos, b, Infinity).best;
            if (owner && owner.key !== actor.key && dist(owner, b) + 2 < dist(actor, b)) warn(A, `the ball ${actor.key} dribbles is closer to ${owner.key}`);
            moves.push({ piece: b, dx, dy });
          }
        }
      } else if (a.k === 'pase') {
        const b = nearestIn(bpos, start, PICK).best;
        if (!b) { err(A, `${actor.key} passes but no ball is within ${PICK} of the arrow start (the app would invent one)`); continue; }
        if (movedBalls.has(b)) err(A, `ball at (${b.x.toFixed(0)},${b.y.toFixed(0)}) is moved twice in step ${s}`);
        movedBalls.add(b);
        const owner = nearestIn(pos, b, Infinity).best;
        if (owner && owner.key !== actor.key && dist(owner, b) + 2 < dist(actor, b)) warn(A, `the ball ${actor.key} passes is closer to ${owner.key}`);
        moves.push({ piece: b, dx, dy });
        passes.push({ a, A, from: actor.key, ball: b });
      }
    }
    // the app moves every piece of the step at once
    moves.forEach((m) => { m.piece.x += m.dx; m.piece.y += m.dy; });
    for (const { a, A, from, ball } of passes) {
      const end = { x: a.x2, y: a.y2 };
      const recv = nearestIn(pos, end, Infinity, (q) => q.key === from);
      if (inRealGoal(d.v, end)) F.goal++;
      else if (recv.best && recv.d <= RECEIVE_TOL) {
        if (dist(recv.best, ball) > PICK) warn(A, `ball stops ${dist(recv.best, ball).toFixed(1)} from receiver ${recv.best.key}`);
      } else if (!inConeGate(cones, end)) {
        err(A, `pass ends at (${a.x2},${a.y2}) with no receiver, goal or cone gate there`);
      }
      if (ball.x < 0 || ball.x > 160 || ball.y < 0 || ball.y > 200) warn(A, `ball leaves the canvas at (${ball.x.toFixed(0)},${ball.y.toFixed(0)})`);
    }
    stepArrows.forEach((a) => prevEnds.push({ x: a.x2, y: a.y2 }));
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const g = dist(pos[i], pos[j]);
        if (g < 12) warn(W, `after step ${s}, ${pos[i].key} and ${pos[j].key} are only ${g.toFixed(1)} apart`);
      }
    }
  }
  // a ball that never moves should be at someone's feet or clearly waiting to be picked up
  const touched = new Set();
  // (balls that moved are no longer at their start)
  bpos.forEach((b) => { const o = balls.find((x) => x.i === b.id); if (o && (o.x !== b.x || o.y !== b.y)) touched.add(b.id); });
  balls.forEach((b) => {
    if (touched.has(b.i)) return;
    const near = players.some((p) => dist(p, b) <= PICK);
    if (!near) warn(W, `ball at (${b.x},${b.y}) is not next to any player and never moves`);
  });
});

// ---------- catalog mix and content requirements ----------
if (exercises.length !== EXPECTED_COUNT) err('catalog', `expected ${EXPECTED_COUNT} exercises, found ${exercises.length}`);
for (const [obj, n] of Object.entries(REQUIRED_MIX)) {
  if ((mix[obj] || 0) !== n) err('catalog', `objective ${obj}: expected ${n}, found ${mix[obj] || 0}`);
}
if (schoolCount < MIN_SCHOOL) err('catalog', `only ${schoolCount} exercises with school: true (need ≥ ${MIN_SCHOOL})`);
const levelsUsed = new Set(exercises.map((e) => e.level));
if (levelsUsed.size < 3) warn('catalog', 'not all three levels are used');
const byObj = (o) => exercises.filter((e) => e.objective === o).map((e) => ({ e, f: features[e.id] || {} }));
const need = (label, list, test, n = 1) => {
  const c = list.filter(({ f }) => test(f)).length;
  if (c < n) err('catalog', `${label}: need ${n}, found ${c}`);
};
const coord = byObj('Coordinación');
need('Coordinación with an agility ladder', coord, (f) => f.ladder > 0, 2);
need('Coordinación: ladder finishing with a pass or shot', coord, (f) => f.ladder > 0 && f.pase > 0);
need('Coordinación: mini hurdles + ball', coord, (f) => f.hurdle > 0 && (f.pase > 0 || f.conduccion > 0));
need('Coordinación: hoops footwork', coord, (f) => f.ring > 0);
need('Coordinación: circuit ladder → slalom → shot at goal', coord, (f) => f.ladder > 0 && f.pole > 0 && f.goal > 0);
need('Velocidad y agilidad: zigzag between poles with ball', byObj('Velocidad y agilidad'), (f) => f.pole > 0 && f.conduccion > 0);

// ---------- sessions ----------
const allEx = [...(base.exercises || []), ...exercises];
const byId = Object.fromEntries(allEx.map((e) => [e.id, e]));
(data.sessions || []).forEach((ses, idx) => {
  const W = `session "${ses.name || idx}"`;
  if (!nonEmpty(ses.name)) err(W, 'name missing');
  if (ses.sport !== 'futbol') err(W, 'sport must be "futbol"');
  if (!nonEmpty(ses.age)) err(W, 'age missing');
  if (!nonEmpty(ses.notes)) err(W, 'notes missing');
  else {
    const n = sentences(ses.notes).length;
    if (n < 1 || n > 2) err(W, `notes has ${n} sentences (need 1–2)`);
  }
  if (!Array.isArray(ses.items) || ses.items.length === 0) { err(W, 'items missing'); return; }
  let sum = 0, hydration = 0, newCount = 0, exCount = 0;
  ses.items.forEach((it, i) => {
    const I = `${W} item ${i}`;
    if (!isNum(it.min) || it.min <= 0) err(I, 'min must be a positive number');
    sum += it.min || 0;
    if (it.type === 'pause') {
      if (!PAUSE_LABELS.includes(it.label)) err(I, `pause label "${it.label}" not allowed`);
      if (it.label === 'Hidratación') hydration++;
      if (it.exId) err(I, 'pause must not carry an exId');
    } else {
      exCount++;
      if (!byId[it.exId]) err(I, `exId "${it.exId}" does not exist`);
      if (ids.has(it.exId)) newCount++;
      if (it.type !== undefined) err(I, `unexpected type "${it.type}"`);
      if (it.series !== undefined) {
        const { n, work, rest } = it.series || {};
        if (!Number.isInteger(n) || n < 2 || !isNum(work) || work <= 0 || !isNum(rest) || rest < 0) {
          err(I, 'series needs integer n ≥ 2, work > 0, rest ≥ 0');
        } else if (n * work + (n - 1) * rest !== it.min) {
          err(I, `series ${n}×${work}+${n - 1}×${rest} = ${n * work + (n - 1) * rest} ≠ min ${it.min}`);
        }
      }
    }
  });
  const expected = SESSION_TOTALS[ses.name];
  if (expected === undefined) err(W, 'unknown session name (no expected total)');
  else if (sum !== expected) err(W, `item minutes add up to ${sum}, expected ${expected}`);
  if (hydration < 1) err(W, 'needs at least one "Hidratación" pause');
  if (newCount * 2 <= exCount) err(W, `only ${newCount} of ${exCount} drills are new (cf-${FIRST_ID}+); use mostly new drills`);
  if (/primaria|secundaria/i.test(ses.name || '')) {
    ses.items.filter((it) => it.exId && byId[it.exId] && !byId[it.exId].school)
      .forEach((it) => err(W, `${it.exId} is not marked school: true but is used in a school session`));
  }
});
if ((data.sessions || []).length !== EXPECTED_SESSIONS) err('sessions', `expected ${EXPECTED_SESSIONS} session(s), found ${(data.sessions || []).length}`);

// ---------- report ----------
console.log(`Checked ${exercises.length} exercises and ${(data.sessions || []).length} session(s) in ${path.basename(file)} (base: ${path.basename(baseFile)}, ${baseIds.size} ids)`);
console.log(`Objective mix: ${Object.entries(mix).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`Levels: ${LEVELS.map((l) => `${l} ${exercises.filter((e) => e.level === l).length}`).join(', ')}`);
console.log(`school: true → ${schoolCount}`);
exercises.forEach((e) => {
  const f = features[e.id] || {};
  const gearList = ['ladder', 'hurdle', 'ring', 'pole'].filter((k) => f[k]).map((k) => `${k}×${f[k]}`).join(' ');
  console.log(`  ${e.id} ${e.objective.padEnd(21)} ${String((e.diagram && e.diagram.items || []).length).padStart(2)} items  ${gearList}`);
});
(data.sessions || []).forEach((s) => console.log(`Session "${s.name}": ${s.items.reduce((a, i) => a + (i.min || 0), 0)} min`));
warnings.forEach((w) => console.log(`WARN  ${w}`));
errors.forEach((e) => console.log(`ERROR ${e}`));
console.log(errors.length ? `FAILED: ${errors.length} error(s), ${warnings.length} warning(s)` : `OK: 0 errors, ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
