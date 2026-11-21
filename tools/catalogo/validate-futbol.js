#!/usr/bin/env node
// Validator for the Cancha football catalog (futbol.json).
// Usage: node validate-futbol.js [path/to/futbol.json]
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, 'futbol.json');
const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const OBJECTIVES = ['Calentamiento', 'Pase', 'Conducción', 'Control', 'Tiro', 'Defensa', 'Táctica',
  'Portero', 'Coordinación y físico', 'Juego reducido', 'Vuelta a la calma'];
const LEVELS = ['Inicial', 'Intermedio', 'Avanzado'];
const REQUIRED_MIX = { 'Calentamiento': 2, 'Pase': 2, 'Control': 1, 'Conducción': 2, 'Tiro': 2,
  'Juego reducido': 2, 'Táctica': 1, 'Portero': 1, 'Vuelta a la calma': 1 };
const PAUSE_LABELS = ['Hidratación', 'Descanso', 'Montar material'];
const SESSION_TOTALS = { 'Primaria 5.º y 6.º · Pase y control': 50, 'Sub-12 · Finalización': 75 };

const PLAYER_GAP = 15;    // min distance between player centres
const CONE_GAP = 9;       // min distance between cones
const START_TOL = 6;      // arrow start must be this close to a player / previous arrow end
const RECEIVE_TOL = 10;   // pass end must be this close to a receiver (after that step's runs)
const BALL_TOL = 13;      // a ball this close to a player belongs to that player at the start

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
if (/(https?:\/\/|www\.|youtube|youtu\.be)/i.test(raw)) err('file', 'contains a URL or YouTube reference');
if (!Array.isArray(data.exercises)) err('file', 'exercises must be an array');
if (!Array.isArray(data.sessions)) err('file', 'sessions must be an array');

const exercises = data.exercises || [];
const ids = new Set();
const mix = {};
let schoolCount = 0;

exercises.forEach((ex, idx) => {
  const W = ex.id || `exercises[${idx}]`;
  // ----- fields -----
  const expectedId = `cf-${String(idx + 1).padStart(2, '0')}`;
  if (ex.id !== expectedId) err(W, `id should be ${expectedId}`);
  if (ids.has(ex.id)) err(W, 'duplicate id');
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
  }
  if (typeof ex.school !== 'boolean') err(W, 'school must be boolean');
  else if (ex.school) schoolCount++;

  // ----- diagram -----
  const d = ex.diagram;
  if (!d || typeof d !== 'object') { err(W, 'diagram missing'); return; }
  if (!['full', 'half'].includes(d.v)) err(W, `diagram.v "${d.v}" must be "full" or "half"`);
  if (!Array.isArray(d.items)) { err(W, 'diagram.items must be an array'); return; }
  if (d.items.length < 6 || d.items.length > 16) err(W, `diagram has ${d.items.length} items (need 6–16)`);

  const players = [];
  const cones = [];
  const balls = [];
  const arrows = [];
  const seenNums = new Set();
  d.items.forEach((it, i) => {
    const I = `${W} item ${i}`;
    if (!['a', 'b', 'cone', 'ball', 'arrow'].includes(it.t)) { err(I, `unknown piece type "${it.t}"`); return; }
    if (!isNum(it.x) || !isNum(it.y)) { err(I, 'x/y must be numbers'); return; }
    if (!inRange(it.x, it.y)) err(I, `(${it.x},${it.y}) out of 8–152 × 8–192`);
    if (it.t === 'a' || it.t === 'b') {
      if (!Number.isInteger(it.n) || it.n < 1) err(I, 'player n must be a positive integer');
      const key = `${it.t}${it.n}`;
      if (seenNums.has(key)) err(I, `duplicate player ${key}`);
      seenNums.add(key);
      players.push({ key, x: it.x, y: it.y });
    } else if (it.t === 'cone') cones.push(it);
    else if (it.t === 'ball') balls.push(it);
    else {
      if (!['pase', 'conduccion', 'mov'].includes(it.k)) err(I, `arrow k "${it.k}" not allowed`);
      if (!isNum(it.x2) || !isNum(it.y2)) { err(I, 'arrow x2/y2 must be numbers'); return; }
      if (!inRange(it.x2, it.y2)) err(I, `arrow end (${it.x2},${it.y2}) out of range`);
      if (!Number.isInteger(it.s) || it.s < 1) err(I, `arrow s "${it.s}" must be a positive integer`);
      if (Math.hypot(it.x2 - it.x, it.y2 - it.y) < 6) err(I, 'arrow is too short');
      arrows.push({ ...it, i });
    }
  });
  if (players.length === 0) err(W, 'diagram has no players');

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const g = dist(players[i], players[j]);
      if (g < PLAYER_GAP) err(W, `players ${players[i].key} and ${players[j].key} are ${g.toFixed(1)} apart (< ${PLAYER_GAP})`);
    }
    cones.forEach((c) => {
      const g = dist(players[i], c);
      if (g < 8) warn(W, `player ${players[i].key} sits on a cone (${g.toFixed(1)})`);
    });
    balls.forEach((b) => {
      const g = dist(players[i], b);
      if (g < 7) warn(W, `ball overlaps player ${players[i].key} (${g.toFixed(1)})`);
    });
  }
  for (let i = 0; i < cones.length; i++) {
    for (let j = i + 1; j < cones.length; j++) {
      const g = dist(cones[i], cones[j]);
      if (g < CONE_GAP) err(W, `cones ${i} and ${j} are ${g.toFixed(1)} apart (< ${CONE_GAP})`);
    }
  }

  // ----- animation: simulate steps -----
  const steps = [...new Set(arrows.map((a) => a.s))].sort((a, b) => a - b);
  if (steps.some((s, i) => s !== i + 1)) err(W, `arrow steps must run 1,2,3… without gaps (found ${steps.join(',')})`);

  const pos = Object.fromEntries(players.map((p) => [p.key, { x: p.x, y: p.y }]));
  // how many balls each player holds (a server may have a small stock)
  const ballCount = new Map();
  const hasBall = {
    has: (k) => (ballCount.get(k) || 0) > 0,
    add: (k) => ballCount.set(k, (ballCount.get(k) || 0) + 1),
    delete: (k) => ballCount.set(k, Math.max(0, (ballCount.get(k) || 0) - 1)),
  };
  balls.forEach((b) => {
    let best = null, bd = Infinity;
    players.forEach((p) => { const g = dist(p, b); if (g < bd) { bd = g; best = p.key; } });
    if (best && bd <= BALL_TOL) hasBall.add(best);
    else warn(W, `ball at (${b.x},${b.y}) is not next to any player`);
  });
  const prevEnds = [];

  for (const s of steps) {
    const stepArrows = arrows.filter((a) => a.s === s);
    const newPos = {};
    const passes = [];
    for (const a of stepArrows) {
      const A = `${W} arrow ${a.i} (s${s}, ${a.k})`;
      const start = { x: a.x, y: a.y };
      let actor = null, ad = Infinity;
      for (const [k, p] of Object.entries(pos)) { const g = dist(p, start); if (g < ad) { ad = g; actor = k; } }
      if (ad > START_TOL) {
        const nearPrev = prevEnds.some((e) => dist(e, start) <= START_TOL);
        const nearPiece = [...cones, ...balls].some((c) => dist(c, start) <= START_TOL);
        if (nearPrev || nearPiece) err(A, `starts at (${a.x},${a.y}) but no player stands there at step ${s}`);
        else err(A, `does not start near a piece or a previous arrow end (${a.x},${a.y})`);
        continue;
      }
      if (a.k === 'mov' || a.k === 'conduccion') {
        if (newPos[actor]) err(A, `${actor} has two movement arrows in step ${s}`);
        newPos[actor] = { x: a.x2, y: a.y2 };
        if (a.k === 'conduccion' && !hasBall.has(actor)) err(A, `${actor} dribbles without having the ball`);
      } else if (a.k === 'pase') {
        if (!hasBall.has(actor)) err(A, `${actor} passes without having the ball`);
        passes.push({ a, A, from: actor });
      }
    }
    // pieces move, then passes find their receivers at the new positions
    Object.assign(pos, newPos);
    for (const { a, A, from } of passes) {
      const end = { x: a.x2, y: a.y2 };
      let recv = null, rd = Infinity;
      for (const [k, p] of Object.entries(pos)) {
        if (k === from) continue;
        const g = dist(p, end); if (g < rd) { rd = g; recv = k; }
      }
      hasBall.delete(from);
      if (recv && rd <= RECEIVE_TOL) hasBall.add(recv);
      else if (!inRealGoal(d.v, end) && !inConeGate(cones, end)) {
        err(A, `pass ends at (${a.x2},${a.y2}) with no receiver, goal or cone gate there`);
      }
    }
    stepArrows.forEach((a) => prevEnds.push({ x: a.x2, y: a.y2 }));
    const keys = Object.keys(pos);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const g = dist(pos[keys[i]], pos[keys[j]]);
        if (g < 12) warn(W, `after step ${s}, ${keys[i]} and ${keys[j]} are only ${g.toFixed(1)} apart`);
      }
    }
  }
});

// ---------- catalog mix ----------
if (exercises.length !== 14) err('catalog', `expected 14 exercises, found ${exercises.length}`);
for (const [obj, n] of Object.entries(REQUIRED_MIX)) {
  if ((mix[obj] || 0) !== n) err('catalog', `objective ${obj}: expected ${n}, found ${mix[obj] || 0}`);
}
if (schoolCount < 6) err('catalog', `only ${schoolCount} exercises with school: true (need ≥ 6)`);
const levelsUsed = new Set(exercises.map((e) => e.level));
if (levelsUsed.size < 3) warn('catalog', 'not all three levels are used');

// ---------- sessions ----------
const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));
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
  let sum = 0, hydration = 0;
  ses.items.forEach((it, i) => {
    const I = `${W} item ${i}`;
    if (!isNum(it.min) || it.min <= 0) err(I, 'min must be a positive number');
    sum += it.min || 0;
    if (it.type === 'pause') {
      if (!PAUSE_LABELS.includes(it.label)) err(I, `pause label "${it.label}" not allowed`);
      if (it.label === 'Hidratación') hydration++;
      if (it.exId) err(I, 'pause must not carry an exId');
    } else {
      if (!byId[it.exId]) err(I, `exId "${it.exId}" does not exist`);
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
  if (/primaria|secundaria/i.test(ses.name || '')) {
    ses.items.filter((it) => it.exId && byId[it.exId] && !byId[it.exId].school)
      .forEach((it) => err(W, `${it.exId} is not marked school: true but is used in a school session`));
  }
});
if ((data.sessions || []).length !== 2) err('sessions', `expected 2 sessions, found ${(data.sessions || []).length}`);

// ---------- report ----------
console.log(`Checked ${exercises.length} exercises and ${(data.sessions || []).length} sessions in ${path.basename(file)}`);
console.log(`Objective mix: ${Object.entries(mix).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`school: true → ${schoolCount}`);
(data.sessions || []).forEach((s) => console.log(`Session "${s.name}": ${s.items.reduce((a, i) => a + (i.min || 0), 0)} min`));
warnings.forEach((w) => console.log(`WARN  ${w}`));
errors.forEach((e) => console.log(`ERROR ${e}`));
console.log(errors.length ? `FAILED: ${errors.length} error(s), ${warnings.length} warning(s)` : `OK: 0 errors, ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
