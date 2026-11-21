#!/usr/bin/env node
// Validator for basquet.json (Cancha app). Usage: node validate-basquet.js [path]
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, 'basquet.json');
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`No se pudo leer/parsear ${file}: ${e.message}`);
  process.exit(1);
}

const OBJECTIVES = ['Calentamiento', 'Dribleo', 'Pase', 'Tiro', 'Entrada', 'Defensa', 'Rebote', 'Táctica',
  'Coordinación y físico', 'Juego reducido', 'Vuelta a la calma'];
const LEVELS = ['Inicial', 'Intermedio', 'Avanzado'];
const ARROW_KINDS = ['pase', 'conduccion', 'mov'];
const PAUSE_LABELS = ['Hidratación', 'Descanso', 'Montar material'];
const EXPECTED_COUNTS = { Calentamiento: 2, Dribleo: 2, Pase: 2, Tiro: 2, Entrada: 2, Defensa: 1, Rebote: 1,
  'Vuelta a la calma': 1 };
const SESSION_TOTALS = { 'Secundaria · Dribleo y entradas': 50, 'Sub-14 · Contraataque': 75 };
const RIMS = { half: [[80, 170.5]], full: [[80, 177], [80, 23]] };
const NEAR = 6;          // tolerance for "arrow starts/ends at a piece"
const BALL_NEAR = 10;    // ball piece must sit next to its carrier

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const URL_RE = /(https?:\/\/|www\.|youtube|youtu\.be|\.com\b|\.org\b)/i;

// ---------- top level ----------
if (!Array.isArray(data.exercises)) err('root', 'falta el arreglo "exercises"');
if (!Array.isArray(data.sessions)) err('root', 'falta el arreglo "sessions"');
const exercises = data.exercises || [];
const sessions = data.sessions || [];

// no URLs anywhere
(function scan(v, where) {
  if (typeof v === 'string') { if (URL_RE.test(v)) err(where, `contiene una URL o dominio: "${v.slice(0, 60)}"`); }
  else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${where}[${i}]`));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => scan(x, `${where}.${k}`));
})(data, 'root');

// ---------- exercises ----------
const ids = new Set();
const countByObjective = {};
let schoolCount = 0;
const levels = new Set();

exercises.forEach((ex, idx) => {
  const W = ex && ex.id ? ex.id : `exercises[${idx}]`;
  const required = ['id', 'sport', 'title', 'objective', 'level', 'duration', 'players', 'age', 'space', 'material',
    'description', 'keyPoints', 'variations', 'school', 'diagram'];
  for (const f of required) if (!(f in ex)) err(W, `falta el campo "${f}"`);

  if (!/^cb-\d{2}$/.test(ex.id || '')) err(W, `id con formato inválido "${ex.id}"`);
  if (ids.has(ex.id)) err(W, 'id duplicado');
  ids.add(ex.id);
  const expectedId = `cb-${String(idx + 1).padStart(2, '0')}`;
  if (ex.id !== expectedId) warn(W, `se esperaba el id consecutivo ${expectedId}`);

  if (ex.sport !== 'basquet') err(W, `sport debe ser "basquet" (es "${ex.sport}")`);
  if (!isStr(ex.title)) err(W, 'title vacío');
  else if (ex.title.length > 42) err(W, `title de ${ex.title.length} caracteres (máx. 42)`);
  if (!OBJECTIVES.includes(ex.objective)) err(W, `objective inválido "${ex.objective}"`);
  countByObjective[ex.objective] = (countByObjective[ex.objective] || 0) + 1;
  if (!LEVELS.includes(ex.level)) err(W, `level inválido "${ex.level}"`);
  levels.add(ex.level);
  if (!isNum(ex.duration) || ex.duration <= 0) err(W, 'duration debe ser un número positivo de minutos');
  for (const f of ['players', 'age', 'space', 'material', 'description']) if (!isStr(ex[f])) err(W, `"${f}" vacío`);
  if (typeof ex.school !== 'boolean') err(W, 'school debe ser booleano');
  if (ex.school) schoolCount++;

  if (isStr(ex.description)) {
    const sentences = ex.description.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    if (sentences.length < 2 || sentences.length > 4) err(W, `description con ${sentences.length} oraciones (2 a 4)`);
  }
  if (isStr(ex.keyPoints)) {
    const n = ex.keyPoints.split('\n').filter((s) => s.trim()).length;
    if (n < 3 || n > 4) err(W, `keyPoints con ${n} líneas (3 a 4)`);
  } else err(W, 'keyPoints debe ser texto con líneas separadas por \\n');
  if (isStr(ex.variations)) {
    const n = ex.variations.split('\n').filter((s) => s.trim()).length;
    if (n < 2 || n > 3) err(W, `variations con ${n} líneas (2 a 3)`);
  } else err(W, 'variations debe ser texto con líneas separadas por \\n');

  validateDiagram(ex.diagram, W);
});

function validateDiagram(dg, W) {
  const D = `${W}.diagram`;
  if (!dg || typeof dg !== 'object') { err(D, 'falta el diagrama'); return; }
  if (!['half', 'full'].includes(dg.v)) err(D, `v debe ser "half" o "full" (es "${dg.v}")`);
  if (!Array.isArray(dg.items)) { err(D, 'items debe ser un arreglo'); return; }
  const items = dg.items;
  if (items.length < 6 || items.length > 16) err(D, `${items.length} elementos (6 a 16)`);
  const rims = RIMS[dg.v] || RIMS.half;

  const players = [];
  const cones = [];
  const balls = [];
  const arrows = [];
  const inRange = (x, y) => isNum(x) && isNum(y) && x >= 8 && x <= 152 && y >= 8 && y <= 192;

  items.forEach((it, i) => {
    const I = `${D}.items[${i}]`;
    switch (it.t) {
      case 'a':
      case 'b':
        if (!inRange(it.x, it.y)) err(I, `jugador fuera de rango (${it.x},${it.y})`);
        if (!Number.isInteger(it.n) || it.n < 1) err(I, `n inválido (${it.n})`);
        players.push({ id: `${it.t}${it.n}`, pos: [it.x, it.y], I });
        break;
      case 'cone':
        if (!inRange(it.x, it.y)) err(I, `cono fuera de rango (${it.x},${it.y})`);
        cones.push([it.x, it.y]);
        break;
      case 'ball':
        if (!inRange(it.x, it.y)) err(I, `balón fuera de rango (${it.x},${it.y})`);
        balls.push([it.x, it.y]);
        break;
      case 'arrow':
        if (!ARROW_KINDS.includes(it.k)) err(I, `k de flecha inválido "${it.k}"`);
        if (!inRange(it.x, it.y) || !inRange(it.x2, it.y2)) err(I, `flecha fuera de rango (${it.x},${it.y})→(${it.x2},${it.y2})`);
        if (!Number.isInteger(it.s) || it.s < 1) err(I, `s debe ser entero positivo (es ${it.s})`);
        if (isNum(it.x) && dist([it.x, it.y], [it.x2, it.y2]) < 4) err(I, 'flecha demasiado corta');
        arrows.push({ ...it, I });
        break;
      default:
        err(I, `tipo de pieza desconocido "${it.t}"`);
    }
  });

  // unique numbering per team
  const seen = new Set();
  players.forEach((p) => { if (seen.has(p.id)) err(p.I, `número repetido ${p.id}`); seen.add(p.id); });

  // spacing
  for (let i = 0; i < players.length; i++)
    for (let j = i + 1; j < players.length; j++) {
      const d = dist(players[i].pos, players[j].pos);
      if (d < 15) err(D, `${players[i].id} y ${players[j].id} a ${d.toFixed(1)} px (mín. 15)`);
    }
  for (let i = 0; i < cones.length; i++)
    for (let j = i + 1; j < cones.length; j++) {
      const d = dist(cones[i], cones[j]);
      if (d < 9) err(D, `conos a ${d.toFixed(1)} px (mín. 9)`);
    }

  // ball carriers
  const holders = new Set();
  balls.forEach((b, i) => {
    let best = null;
    players.forEach((p) => { const d = dist(b, p.pos); if (!best || d < best.d) best = { p, d }; });
    if (!best || best.d > BALL_NEAR) warn(D, `balón ${i + 1} no está junto a ningún jugador`);
    else holders.add(best.p.id);
  });
  const trackBall = balls.length > 0;

  // steps contiguous
  const steps = [...new Set(arrows.map((a) => a.s))].sort((a, b) => a - b);
  if (steps.some((s, i) => s !== i + 1)) err(D, `los pasos deben ser consecutivos desde 1 (encontrado ${steps.join(',')})`);

  // static view: a pass/shot line should not cross the drawn starting spot of an uninvolved player
  for (const a of arrows.filter((a) => a.k === 'pase')) {
    for (const p of players) {
      if (dist(p.pos, [a.x, a.y]) <= NEAR || dist(p.pos, [a.x2, a.y2]) <= NEAR) continue;
      const d = segDist(p.pos, [a.x, a.y], [a.x2, a.y2]);
      if (d < 9) warn(a.I, `en la vista fija, el pase cruza la posición inicial de ${p.id} (${d.toFixed(1)} px)`);
    }
  }

  // simulate
  const pos = new Map(players.map((p) => [p.id, p.pos.slice()]));
  const ballAtRim = new Set(); // rim index holding a ball
  const prevEnds = [];
  const findPlayerAt = (pt, map) => {
    let best = null;
    for (const [id, p] of map) { const d = dist(pt, p); if (d <= NEAR && (!best || d < best.d)) best = { id, d }; }
    return best && best.id;
  };
  const rimAt = (pt) => rims.findIndex((r) => dist(pt, r) <= NEAR);

  for (const s of steps) {
    const stepArrows = arrows.filter((a) => a.s === s);
    const startPos = new Map([...pos].map(([k, v]) => [k, v.slice()]));
    // movements of this step
    const moved = new Set();
    for (const a of stepArrows.filter((a) => a.k !== 'pase')) {
      const id = findPlayerAt([a.x, a.y], startPos);
      if (!id) { err(a.I, `la flecha (${a.k}) no empieza en un jugador en el paso ${s}`); continue; }
      if (moved.has(id)) err(a.I, `${id} tiene dos movimientos en el mismo paso`);
      moved.add(id);
      if (a.k === 'conduccion' && trackBall && !holders.has(id)) err(a.I, `${id} dribla sin tener el balón`);
      pos.set(id, [a.x2, a.y2]);
    }
    // passes of this step (receiver may arrive in the same step)
    for (const a of stepArrows.filter((a) => a.k === 'pase')) {
      const from = findPlayerAt([a.x, a.y], startPos);
      const fromRim = rimAt([a.x, a.y]);
      if (!from && fromRim < 0) {
        const nearPrev = prevEnds.some((e) => dist(e, [a.x, a.y]) <= NEAR);
        err(a.I, `el pase no empieza en un jugador ni en el aro${nearPrev ? ' (sí cerca de un final previo)' : ''}`);
      }
      if (from) {
        if (moved.has(from) && !stepArrows.some((m) => m.k !== 'pase' && findPlayerAt([m.x, m.y], startPos) === from
            && dist([m.x2, m.y2], [a.x, a.y]) <= NEAR))
          warn(a.I, `${from} pasa y se mueve en el mismo paso`);
        if (trackBall && !holders.has(from)) err(a.I, `${from} pasa sin tener el balón`);
      }
      if (fromRim >= 0 && trackBall && !ballAtRim.has(fromRim)) err(a.I, 'rebote desde el aro sin un tiro previo');
      const to = findPlayerAt([a.x2, a.y2], pos);
      const toRim = rimAt([a.x2, a.y2]);
      if (!to && toRim < 0) err(a.I, `el pase termina en (${a.x2},${a.y2}) sin jugador ni aro`);
      if (trackBall) {
        if (from) holders.delete(from);
        if (fromRim >= 0) ballAtRim.delete(fromRim);
        if (to) holders.add(to);
        if (toRim >= 0) ballAtRim.add(toRim);
      }
    }
    // generic rule: start near a piece or a previous arrow end
    for (const a of stepArrows) {
      const st = [a.x, a.y];
      const nearPiece = players.some((p) => dist(p.pos, st) <= NEAR) || balls.some((b) => dist(b, st) <= NEAR)
        || cones.some((c) => dist(c, st) <= NEAR);
      const nearPrev = prevEnds.some((e) => dist(e, st) <= NEAR);
      if (!nearPiece && !nearPrev) err(a.I, 'la flecha no empieza cerca de una pieza ni del final de una flecha anterior');
    }
    stepArrows.forEach((a) => prevEnds.push([a.x2, a.y2]));

    // readability: passes/shots should not cross over a player who is not involved
    for (const a of stepArrows.filter((a) => a.k === 'pase')) {
      for (const [id, p] of pos) {
        if (dist(p, [a.x, a.y]) <= NEAR || dist(p, [a.x2, a.y2]) <= NEAR) continue;
        const d = segDist(p, [a.x, a.y], [a.x2, a.y2]);
        if (d < 9) warn(a.I, `el pase pasa a ${d.toFixed(1)} px de ${id}`);
      }
    }
    // readability: players should not end a step on top of each other
    const ids2 = [...pos.keys()];
    for (let i = 0; i < ids2.length; i++)
      for (let j = i + 1; j < ids2.length; j++) {
        const d = dist(pos.get(ids2[i]), pos.get(ids2[j]));
        if (d < 12) warn(D, `tras el paso ${s}, ${ids2[i]} y ${ids2[j]} quedan a ${d.toFixed(1)} px`);
      }
  }
}

function segDist(p, a, b) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}

// ---------- catalog composition ----------
if (exercises.length !== 14) err('catálogo', `${exercises.length} ejercicios (se esperaban 14)`);
for (const [obj, n] of Object.entries(EXPECTED_COUNTS))
  if ((countByObjective[obj] || 0) !== n) err('catálogo', `${obj}: ${countByObjective[obj] || 0} (se esperaban ${n})`);
const jr = (countByObjective['Juego reducido'] || 0) + (countByObjective['Táctica'] || 0);
if (jr !== 1) err('catálogo', `Juego reducido/Táctica: ${jr} (se esperaba 1)`);
if (schoolCount < 6) err('catálogo', `solo ${schoolCount} con school: true (mín. 6)`);
if (levels.size < 3) warn('catálogo', `solo ${levels.size} niveles distintos`);

// ---------- sessions ----------
if (sessions.length !== 2) err('sesiones', `${sessions.length} sesiones (se esperaban 2)`);
sessions.forEach((se, i) => {
  const W = `session[${i}] ${se.name || ''}`.trim();
  for (const f of ['name', 'sport', 'age', 'notes', 'items']) if (!(f in se)) err(W, `falta "${f}"`);
  if (se.sport !== 'basquet') err(W, 'sport debe ser "basquet"');
  for (const f of ['name', 'age', 'notes']) if (!isStr(se[f])) err(W, `"${f}" vacío`);
  if (!Array.isArray(se.items) || se.items.length === 0) { err(W, 'items vacío'); return; }
  let total = 0;
  let hydration = 0;
  se.items.forEach((it, j) => {
    const I = `${W}.items[${j}]`;
    if (!isNum(it.min) || it.min <= 0) err(I, 'min debe ser positivo');
    else total += it.min;
    if (it.type === 'pause') {
      if (!PAUSE_LABELS.includes(it.label)) err(I, `etiqueta de pausa inválida "${it.label}"`);
      if (it.label === 'Hidratación') hydration++;
      if ('exId' in it) err(I, 'una pausa no lleva exId');
    } else {
      if (!ids.has(it.exId)) err(I, `exId inexistente "${it.exId}"`);
      if (it.series) {
        const { n, work, rest } = it.series;
        if (![n, work, rest].every(isNum) || !Number.isInteger(n) || n < 1 || work <= 0 || rest < 0)
          err(I, 'series inválida');
        else if (Math.abs(n * work + (n - 1) * rest - it.min) > 1e-9)
          err(I, `series ${n}×${work} + ${n - 1}×${rest} = ${n * work + (n - 1) * rest} ≠ ${it.min}`);
      }
    }
  });
  if (hydration < 1) err(W, 'no tiene pausa de Hidratación');
  const expected = SESSION_TOTALS[se.name];
  if (expected === undefined) warn(W, 'nombre de sesión no reconocido; no se verificó el total');
  else if (total !== expected) err(W, `los minutos suman ${total} (se esperaban ${expected})`);
  else console.log(`OK sesión "${se.name}": ${total} min, ${se.items.length} bloques`);
});

// ---------- report ----------
console.log(`Ejercicios: ${exercises.length} | escolares: ${schoolCount} | niveles: ${[...levels].join(', ')}`);
console.log('Por objetivo: ' + Object.entries(countByObjective).map(([k, v]) => `${k} ${v}`).join(', '));
warnings.forEach((w) => console.log('AVISO  ' + w));
errors.forEach((e) => console.log('ERROR  ' + e));
console.log(errors.length ? `\n${errors.length} error(es), ${warnings.length} aviso(s)` : `\nSin errores (${warnings.length} aviso(s))`);
process.exit(errors.length ? 1 : 0);
