#!/usr/bin/env node
// Validator for basquet2.json (Cancha app, new drills cb-15+). Usage: node validate-basquet2.js [path]
// Extends validate-basquet.js with: new objectives, equipment pieces (ladder, hurdle, ring, pole),
// the video object (captions + reps), ids cb-15+, chained arrows as the app animates them
// (the moving piece is the one nearest the arrow start, within 13 units) and equipment checks.
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, 'basquet2.json');
const baseFile = path.join(__dirname, 'basquet.json'); // cb-01..cb-14, may be reused by the sessions
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
let base = { exercises: [] };
try { base = JSON.parse(fs.readFileSync(baseFile, 'utf8')); } catch (e) { warn('base', `no se pudo leer ${baseFile}`); }
const baseIds = new Set((base.exercises || []).map((e) => e.id));
const baseTitles = new Set((base.exercises || []).map((e) => (e.title || '').toLowerCase()));

const OBJECTIVES = ['Calentamiento', 'Dribleo', 'Pase', 'Tiro', 'Entrada', 'Defensa', 'Rebote', 'Táctica',
  'Coordinación', 'Velocidad y agilidad', 'Fuerza y resistencia', 'Juego reducido', 'Vuelta a la calma'];
const LEVELS = ['Inicial', 'Intermedio', 'Avanzado'];
const ARROW_KINDS = ['pase', 'conduccion', 'mov'];
const PAUSE_LABELS = ['Hidratación', 'Descanso', 'Preparar material'];
const LEGACY_PAUSE_LABELS = ['Montar material'];
const EXPECTED_TOTAL = 10;
const FIRST_ID = 15;
const EXPECTED_COUNTS = { 'Coordinación': 4, 'Velocidad y agilidad': 4, 'Fuerza y resistencia': 2 };
const SESSION_TOTALS = { 'Secundaria · Pies rápidos y coordinación': 50 };
const EXPECTED_SESSIONS = 1;
const MIN_SCHOOL = 6;
const RIMS = { half: [[80, 170.5]], full: [[80, 177], [80, 23]] };
const NEAR = 6;          // an arrow must start this close to the piece it moves (chained end-to-start)
const APP_PICK = 13;     // the app moves the piece nearest the arrow start within this radius
const BALL_NEAR = 10;    // initial ball piece next to its carrier
const PICKUP = 9.5;      // a loose ball this close to a player who ends a "mov" is picked up
const PLAYER_R = 7;      // drawn radius of a player
const LADDER_STEP = 7;
const LADDER_HALF_W = 5;
const HURDLE_HALF = 6;
const RING_R = 5;
const POLE_R = 2.5;
const CONE_R = 5;
const MIN_X = 8, MAX_X = 152, MIN_Y = 8, MAX_Y = 192;
const CAPTION_MAX = 34;
const TEXT_FIELDS = ['title', 'players', 'age', 'space', 'material', 'description', 'keyPoints', 'variations'];
// Not Mexican usage (or football vocabulary) in user-facing basketball text
const NON_MX = [/\bbaloncesto\b/i, /\bpista\b/i, /\bcog(e|er|en|iendo)\b/i, /\bvosotros\b/i, /\bchaval/i,
  /\bzapatillas\b/i, /\bregate\b/i, /\bconducci[oó]n\b/i, /\bporter[ií]a\b/i, /\bten[eé]is\b/i];
// Children's strength work must be bodyweight only
const LOADS = [/\bpesas?\b/i, /\bmancuernas?\b/i, /\bbarras?\b/i, /\bkg\b/i, /\bkilos?\b/i, /\blastre\b/i,
  /\bmedicinal(es)?\b/i, /\bligas? de resistencia\b/i, /\bchaleco lastrado\b/i, /\bm[aá]quinas?\b/i];

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const URL_RE = /(https?:\/\/|www\.|youtube|youtu\.be|\.com\b|\.org\b|\.mx\b|\.net\b)/i;
const fmt = (p) => `(${p[0]},${p[1]})`;

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
    'description', 'keyPoints', 'variations', 'school', 'video', 'diagram'];
  for (const f of required) if (!(f in ex)) err(W, `falta el campo "${f}"`);

  if (!/^cb-\d{2}$/.test(ex.id || '')) err(W, `id con formato inválido "${ex.id}"`);
  if (ids.has(ex.id)) err(W, 'id duplicado');
  if (baseIds.has(ex.id)) err(W, 'el id ya existe en basquet.json');
  ids.add(ex.id);
  const expectedId = `cb-${String(idx + FIRST_ID).padStart(2, '0')}`;
  if (ex.id !== expectedId) err(W, `se esperaba el id consecutivo ${expectedId}`);

  if (ex.sport !== 'basquet') err(W, `sport debe ser "basquet" (es "${ex.sport}")`);
  if (!isStr(ex.title)) err(W, 'title vacío');
  else {
    if (ex.title.length > 42) err(W, `title de ${ex.title.length} caracteres (máx. 42)`);
    if (baseTitles.has(ex.title.toLowerCase())) err(W, 'title repetido de basquet.json');
  }
  if (!OBJECTIVES.includes(ex.objective)) err(W, `objective inválido "${ex.objective}"`);
  countByObjective[ex.objective] = (countByObjective[ex.objective] || 0) + 1;
  if (!LEVELS.includes(ex.level)) err(W, `level inválido "${ex.level}"`);
  levels.add(ex.level);
  if (!isNum(ex.duration) || ex.duration <= 0) err(W, 'duration debe ser un número positivo de minutos');
  for (const f of ['players', 'age', 'space', 'material', 'description']) if (!isStr(ex[f])) err(W, `"${f}" vacío`);
  if (typeof ex.school !== 'boolean') err(W, 'school debe ser booleano');
  if (ex.school) {
    schoolCount++;
    const nums = (String(ex.players).match(/\d+/g) || []).map(Number);
    if (!nums.length || Math.max(...nums) < 25) warn(W, 'escolar: "players" no contempla un grupo de 25 a 35 alumnos');
  }

  if (isStr(ex.description)) {
    const sentences = ex.description.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    if (sentences.length < 2 || sentences.length > 4) err(W, `description con ${sentences.length} oraciones (2 a 4)`);
  }
  if (isStr(ex.keyPoints)) {
    const lines = ex.keyPoints.split('\n').filter((s) => s.trim());
    if (lines.length < 3 || lines.length > 4) err(W, `keyPoints con ${lines.length} líneas (3 a 4)`);
    lines.forEach((l) => { if (l.length > 70) warn(W, `keyPoint largo (${l.length} caracteres): "${l}"`); });
  } else err(W, 'keyPoints debe ser texto con líneas separadas por \\n');
  if (isStr(ex.variations)) {
    const lines = ex.variations.split('\n').filter((s) => s.trim());
    if (lines.length < 2 || lines.length > 3) err(W, `variations con ${lines.length} líneas (2 a 3)`);
    if (!lines.some((l) => l.startsWith('Más fácil: '))) err(W, 'variations sin línea "Más fácil: …"');
    if (!lines.some((l) => l.startsWith('Más difícil: '))) err(W, 'variations sin línea "Más difícil: …"');
  } else err(W, 'variations debe ser texto con líneas separadas por \\n');

  // vocabulary (Mexican Spanish) and bodyweight-only strength work
  for (const f of TEXT_FIELDS) {
    const t = ex[f];
    if (typeof t !== 'string') continue;
    for (const re of NON_MX) if (re.test(t)) warn(W, `${f}: término poco usado en México (${re.source})`);
    if (ex.objective === 'Fuerza y resistencia')
      for (const re of LOADS) if (re.test(t)) err(W, `${f}: la fuerza para niños debe ser con peso corporal (${re.source})`);
  }

  validateVideo(ex.video, W);
  validateDiagram(ex.diagram, W);
});

function validateVideo(v, W) {
  const V = `${W}.video`;
  if (!v || typeof v !== 'object' || Array.isArray(v)) { err(V, 'falta el objeto video'); return; }
  const extra = Object.keys(v).filter((k) => !['captions', 'reps'].includes(k));
  if (extra.length) warn(V, `campos no esperados: ${extra.join(', ')}`);
  if (!Array.isArray(v.captions)) err(V, 'captions debe ser un arreglo');
  else {
    if (v.captions.length < 3 || v.captions.length > 5) err(V, `${v.captions.length} captions (3 a 5)`);
    const seen = new Set();
    v.captions.forEach((c, i) => {
      if (!isStr(c)) err(`${V}.captions[${i}]`, 'caption vacío');
      else {
        if (c.length > CAPTION_MAX) err(`${V}.captions[${i}]`, `"${c}" tiene ${c.length} caracteres (máx. ${CAPTION_MAX})`);
        if (c !== c.trim()) err(`${V}.captions[${i}]`, 'espacios sobrantes');
        if (seen.has(c)) err(`${V}.captions[${i}]`, 'caption repetido');
        seen.add(c);
      }
    });
  }
  if (!isStr(v.reps)) err(V, 'reps vacío');
  else if (v.reps.length > 48) warn(V, `reps largo (${v.reps.length} caracteres)`);
}

// ---------- geometry helpers ----------
function segDist(p, a, b) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}
// equipment footprint: {kind:'circle', c, r} | {kind:'seg', a, b, r} | {kind:'rect', x0,x1,y0,y1}
function footprint(it) {
  switch (it.t) {
    case 'cone': return { kind: 'circle', c: [it.x, it.y], r: CONE_R };
    case 'ring': return { kind: 'circle', c: [it.x, it.y], r: RING_R };
    case 'pole': return { kind: 'circle', c: [it.x, it.y], r: POLE_R };
    case 'hurdle': {
      const a = ((it.r || 0) * Math.PI) / 180;
      const d = [Math.cos(a) * HURDLE_HALF, Math.sin(a) * HURDLE_HALF];
      return { kind: 'seg', a: [it.x - d[0], it.y - d[1]], b: [it.x + d[0], it.y + d[1]], r: 1.5 };
    }
    case 'ladder': {
      const half = ((it.n - 1) * LADDER_STEP) / 2;
      return it.r === 90
        ? { kind: 'rect', x0: it.x - half, x1: it.x + half, y0: it.y - LADDER_HALF_W, y1: it.y + LADDER_HALF_W }
        : { kind: 'rect', x0: it.x - LADDER_HALF_W, x1: it.x + LADDER_HALF_W, y0: it.y - half, y1: it.y + half };
    }
    default: return null;
  }
}
function fpBox(f) {
  if (f.kind === 'circle') return [f.c[0] - f.r, f.c[1] - f.r, f.c[0] + f.r, f.c[1] + f.r];
  if (f.kind === 'seg') return [Math.min(f.a[0], f.b[0]) - f.r, Math.min(f.a[1], f.b[1]) - f.r, Math.max(f.a[0], f.b[0]) + f.r, Math.max(f.a[1], f.b[1]) + f.r];
  return [f.x0, f.y0, f.x1, f.y1];
}
// distance from a point to the footprint edge (0 inside)
function fpDist(f, p) {
  if (f.kind === 'circle') return Math.max(0, dist(p, f.c) - f.r);
  if (f.kind === 'seg') return Math.max(0, segDist(p, f.a, f.b) - f.r);
  const dx = Math.max(f.x0 - p[0], 0, p[0] - f.x1);
  const dy = Math.max(f.y0 - p[1], 0, p[1] - f.y1);
  return Math.hypot(dx, dy);
}
// length of segment a→b inside rectangle f (sampled)
function lenInRect(f, a, b) {
  const L = dist(a, b);
  const n = Math.max(2, Math.ceil(L));
  let inside = 0;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    if (p[0] >= f.x0 && p[0] <= f.x1 && p[1] >= f.y0 && p[1] <= f.y1) inside++;
  }
  return (inside / n) * L;
}
function fpOverlap(f, g) {
  // coarse: sample points of f's box border/centre against g
  const pts = [];
  if (f.kind === 'circle') for (let k = 0; k < 16; k++) pts.push([f.c[0] + f.r * Math.cos(k * Math.PI / 8), f.c[1] + f.r * Math.sin(k * Math.PI / 8)]), pts.push(f.c);
  else if (f.kind === 'seg') for (let k = 0; k <= 8; k++) pts.push([f.a[0] + (f.b[0] - f.a[0]) * k / 8, f.a[1] + (f.b[1] - f.a[1]) * k / 8]);
  else for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) pts.push([f.x0 + (f.x1 - f.x0) * i / 4, f.y0 + (f.y1 - f.y0) * j / 4]);
  return pts.some((p) => fpDist(g, p) < 0.5);
}

// ---------- diagram ----------
function validateDiagram(dg, W) {
  const D = `${W}.diagram`;
  if (!dg || typeof dg !== 'object') { err(D, 'falta el diagrama'); return; }
  if (!['half', 'full'].includes(dg.v)) err(D, `v debe ser "half" o "full" (es "${dg.v}")`);
  if (!Array.isArray(dg.items)) { err(D, 'items debe ser un arreglo'); return; }
  const items = dg.items;
  if (items.length < 6 || items.length > 20) err(D, `${items.length} elementos (6 a 20)`);
  const rims = RIMS[dg.v] || RIMS.half;

  const players = [];
  const balls = [];
  const equip = []; // cones + new equipment
  const arrows = [];
  const inRange = (x, y) => isNum(x) && isNum(y) && x >= MIN_X && x <= MAX_X && y >= MIN_Y && y <= MAX_Y;

  items.forEach((it, i) => {
    const I = `${D}.items[${i}]`;
    switch (it.t) {
      case 'a':
      case 'b':
        if (!inRange(it.x, it.y)) err(I, `jugador fuera de rango (${it.x},${it.y})`);
        if (!Number.isInteger(it.n) || it.n < 1) err(I, `n inválido (${it.n})`);
        players.push({ id: `${it.t}${it.n}`, pos: [it.x, it.y], I });
        break;
      case 'ball':
        if (!inRange(it.x, it.y)) err(I, `balón fuera de rango (${it.x},${it.y})`);
        balls.push({ pos: [it.x, it.y], I });
        break;
      case 'cone': case 'ring': case 'pole': case 'hurdle': case 'ladder': {
        if (!isNum(it.x) || !isNum(it.y)) { err(I, `${it.t} sin coordenadas válidas`); break; }
        if (it.t === 'ladder') {
          if (!Number.isInteger(it.n) || it.n < 4 || it.n > 10) { err(I, `escalera con n=${it.n} (4 a 10 travesaños)`); break; }
          if (it.r !== 0 && it.r !== 90) { err(I, `escalera con r=${it.r} (0 vertical o 90 horizontal)`); break; }
        }
        if (it.t === 'hurdle' && !isNum(it.r)) { err(I, 'minivalla sin r (0 = barra horizontal)'); break; }
        const f = footprint(it);
        const [x0, y0, x1, y1] = fpBox(f);
        if (x0 < MIN_X || y0 < MIN_Y || x1 > MAX_X || y1 > MAX_Y)
          err(I, `${it.t} sale del lienzo útil: caja (${x0.toFixed(1)},${y0.toFixed(1)})–(${x1.toFixed(1)},${y1.toFixed(1)})`);
        equip.push({ t: it.t, pos: [it.x, it.y], f, I });
        break;
      }
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
  if (!arrows.length) err(D, 'sin flechas: el Short no tendría animación');

  // unique numbering per team
  const seen = new Set();
  players.forEach((p) => { if (seen.has(p.id)) err(p.I, `número repetido ${p.id}`); seen.add(p.id); });

  // spacing between players
  for (let i = 0; i < players.length; i++)
    for (let j = i + 1; j < players.length; j++) {
      const d = dist(players[i].pos, players[j].pos);
      if (d < 15) err(D, `${players[i].id} y ${players[j].id} a ${d.toFixed(1)} px (mín. 15)`);
    }
  // equipment must not overlap players' start spots
  for (const e of equip)
    for (const p of players) {
      const d = fpDist(e.f, p.pos);
      if (d < PLAYER_R) err(e.I, `${e.t} encima de la posición inicial de ${p.id} (${d.toFixed(1)} px del borde; mín. ${PLAYER_R})`);
    }
  // equipment should not overlap other equipment; cones keep their old spacing rule
  for (let i = 0; i < equip.length; i++)
    for (let j = i + 1; j < equip.length; j++) {
      const a = equip[i]; const b = equip[j];
      if (a.t === 'cone' && b.t === 'cone') {
        const d = dist(a.pos, b.pos);
        if (d < 9) err(D, `conos a ${d.toFixed(1)} px (mín. 9)`);
      } else if (fpOverlap(a.f, b.f) || fpOverlap(b.f, a.f)) err(a.I, `${a.t} se encima con ${b.t} ${fmt(b.pos)}`);
    }
  // held balls should not sit on equipment (a loose ball inside a ring is a "base")
  for (const b of balls)
    for (const e of equip) {
      if (e.t === 'ring' && dist(b.pos, e.pos) <= RING_R) continue;
      if (fpDist(e.f, b.pos) < 2) warn(b.I, `balón encima de ${e.t} ${fmt(e.pos)}`);
    }

  // ---- ball state ----
  const pos = new Map(players.map((p) => [p.id, p.pos.slice()]));
  const ballState = balls.map((b) => {
    let best = null;
    players.forEach((p) => { const d = dist(b.pos, p.pos); if (!best || d < best.d) best = { p, d }; });
    const holder = best && best.d <= BALL_NEAR ? best.p.id : null;
    const inRing = equip.some((e) => e.t === 'ring' && dist(b.pos, e.pos) <= RING_R);
    return { pos: b.pos.slice(), holder, rim: -1, loose0: !holder, inRing, I: b.I };
  });
  ballState.forEach((b, i) => {
    if (!b.holder && !b.inRing) {
      const near = players.some((p) => dist(b.pos, p.pos) <= 14);
      if (near) warn(b.I, `balón ${i + 1} a más de ${BALL_NEAR} px de su jugador: queda suelto`);
    }
  });
  const held = (id) => ballState.filter((b) => b.holder === id);

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
  // routes go around cones, not through them
  for (const a of arrows.filter((a) => a.k !== 'pase')) {
    for (const e of equip.filter((e) => e.t === 'cone' || e.t === 'pole')) {
      const d = segDist(e.pos, [a.x, a.y], [a.x2, a.y2]);
      if (d < 4) warn(a.I, `la flecha atraviesa el ${e.t === 'cone' ? 'cono' : 'poste'} ${fmt(e.pos)} (${d.toFixed(1)} px)`);
    }
  }
  // a ladder is walked with several chained short arrows
  for (const e of equip.filter((e) => e.t === 'ladder')) {
    const len = arrows.filter((a) => a.k !== 'pase').map((a) => lenInRect(e.f, [a.x, a.y], [a.x2, a.y2]));
    const crossing = len.filter((l) => l > 3);
    const total = crossing.reduce((s, l) => s + l, 0);
    if (!crossing.length) warn(e.I, 'ninguna flecha recorre la escalera');
    else if (total > 20 && crossing.length < 2) err(e.I, 'la escalera se recorre con una sola flecha: encadena flechas cortas');
    else if (Math.max(...crossing) > 28) warn(e.I, `un tramo de ${Math.max(...crossing).toFixed(0)} px dentro de la escalera; mejor flechas más cortas`);
  }

  // ---- simulate the animation step by step ----
  const rimAt = (pt) => rims.findIndex((r) => dist(pt, r) <= NEAR);
  for (const s of steps) {
    const stepArrows = arrows.filter((a) => a.s === s);
    const startPos = new Map([...pos].map(([k, v]) => [k, v.slice()]));
    const startBall = ballState.map((b) => b.pos.slice());
    // the piece the app would move: nearest player/ball to the arrow start within APP_PICK
    const nearestPiece = (pt, onlyBalls) => {
      let best = null;
      if (!onlyBalls) for (const [id, p] of startPos) { const d = dist(pt, p); if (d <= APP_PICK && (!best || d < best.d)) best = { kind: 'player', id, d }; }
      startBall.forEach((p, i) => { const d = dist(pt, p); if (d <= APP_PICK && (!best || d < best.d)) best = { kind: 'ball', i, d }; });
      return best;
    };
    const nearestEquip = (pt) => Math.min(Infinity, ...equip.map((e) => dist(pt, e.pos)));
    const moved = new Map(); // id -> delta
    const movedKind = new Map();
    for (const a of stepArrows.filter((a) => a.k !== 'pase')) {
      const st = [a.x, a.y];
      const pick = nearestPiece(st, false);
      if (!pick) { err(a.I, `paso ${s}: no hay jugador a menos de ${APP_PICK} px del inicio de la flecha (${a.k}); encadénala al final de la anterior`); continue; }
      if (pick.kind === 'ball') { err(a.I, `paso ${s}: la pieza más cercana al inicio es un balón; la animación movería el balón y no al jugador`); continue; }
      const id = pick.id;
      if (pick.d > NEAR) err(a.I, `paso ${s}: la flecha empieza a ${pick.d.toFixed(1)} px de ${id} (máx. ${NEAR}); encadena desde donde quedó`);
      if (nearestEquip(st) < pick.d) warn(a.I, `paso ${s}: hay material más cerca del inicio que ${id}`);
      if (moved.has(id)) { err(a.I, `${id} tiene dos movimientos en el mismo paso`); continue; }
      if (a.k === 'conduccion' && !held(id).length) err(a.I, `${id} dribla sin tener el balón (paso ${s})`);
      moved.set(id, [a.x2 - startPos.get(id)[0], a.y2 - startPos.get(id)[1]]);
      movedKind.set(id, a.k);
    }
    const passes = [];
    for (const a of stepArrows.filter((a) => a.k === 'pase')) {
      const st = [a.x, a.y];
      let from = null;
      for (const [id, p] of startPos) { const d = dist(st, p); if (d <= NEAR && (!from || d < from.d)) from = { id, d }; }
      const fromRim = rimAt(st);
      if (!from && fromRim < 0) { err(a.I, `paso ${s}: el pase no empieza en un jugador ni en el aro`); continue; }
      const pick = nearestPiece(st, true);
      if (!pick) { err(a.I, `paso ${s}: no hay balón a menos de ${APP_PICK} px del inicio del pase`); continue; }
      const b = ballState[pick.i];
      if (from && fromRim < 0) {
        if (b.holder !== from.id) err(a.I, `paso ${s}: el balón más cercano al inicio del pase no es el que lleva ${from.id}`);
        if (moved.has(from.id)) warn(a.I, `${from.id} pasa y se mueve en el mismo paso`);
      } else if (b.rim !== fromRim) err(a.I, `paso ${s}: rebote desde el aro sin un tiro previo`);
      passes.push({ a, b, from });
    }
    // apply movements (held balls travel with their player)
    for (const [id, d] of moved) {
      const p = pos.get(id);
      pos.set(id, [p[0] + d[0], p[1] + d[1]]);
      for (const b of held(id)) b.pos = [b.pos[0] + d[0], b.pos[1] + d[1]];
    }
    // apply passes / shots (receiver may arrive in the same step)
    for (const { a, b } of passes) {
      const end = [a.x2, a.y2];
      let to = null;
      for (const [id, p] of pos) { const d = dist(end, p); if (d <= NEAR && (!to || d < to.d)) to = { id, d }; }
      const toRim = rimAt(end);
      if (!to && toRim < 0) { err(a.I, `el pase termina en ${fmt(end)} sin jugador ni aro`); continue; }
      b.pos = end.slice();
      b.holder = toRim >= 0 ? null : to.id;
      b.rim = toRim >= 0 ? toRim : -1;
      if (to) { const p = pos.get(to.id); b.pos = [p[0] + 4, p[1] - 4]; }
    }
    // pick up a loose ball at the end of a "mov"
    for (const [id, k] of movedKind) {
      if (k !== 'mov') continue;
      const p = pos.get(id);
      let best = null;
      ballState.forEach((b) => { if (!b.holder && b.rim < 0) { const d = dist(p, b.pos); if (d <= PICKUP && (!best || d < best.d)) best = { b, d }; } });
      if (best) best.b.holder = id;
    }
    // readability: passes/shots should not cross over a player who is not involved
    for (const { a } of passes) {
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
  ballState.forEach((b, i) => {
    if (b.loose0 && !b.holder && b.rim < 0 && dist(b.pos, balls[i].pos) < 0.01 && !b.inRing)
      warn(b.I, `balón ${i + 1} suelto que nadie recoge`);
  });
  // final positions inside the canvas
  for (const [id, p] of pos) if (!inRange(p[0], p[1])) err(D, `${id} termina fuera del lienzo ${fmt(p)}`);
}

// ---------- catalog composition ----------
if (exercises.length !== EXPECTED_TOTAL) err('catálogo', `${exercises.length} ejercicios (se esperaban ${EXPECTED_TOTAL})`);
for (const [obj, n] of Object.entries(EXPECTED_COUNTS))
  if ((countByObjective[obj] || 0) !== n) err('catálogo', `${obj}: ${countByObjective[obj] || 0} (se esperaban ${n})`);
if (schoolCount < MIN_SCHOOL) err('catálogo', `solo ${schoolCount} con school: true (mín. ${MIN_SCHOOL})`);
if (levels.size < 3) warn('catálogo', `solo ${levels.size} niveles distintos`);
const titles = exercises.map((e) => (e.title || '').toLowerCase());
titles.forEach((t, i) => { if (titles.indexOf(t) !== i) err('catálogo', `título repetido "${t}"`); });

// ---------- sessions ----------
const knownIds = new Set([...baseIds, ...ids]);
if (sessions.length !== EXPECTED_SESSIONS) err('sesiones', `${sessions.length} sesiones (se esperaba ${EXPECTED_SESSIONS})`);
sessions.forEach((se, i) => {
  const W = `session[${i}] ${se.name || ''}`.trim();
  for (const f of ['name', 'sport', 'age', 'notes', 'items']) if (!(f in se)) err(W, `falta "${f}"`);
  if (se.sport !== 'basquet') err(W, 'sport debe ser "basquet"');
  for (const f of ['name', 'age', 'notes']) if (!isStr(se[f])) err(W, `"${f}" vacío`);
  if (!Array.isArray(se.items) || se.items.length === 0) { err(W, 'items vacío'); return; }
  let total = 0;
  let hydration = 0;
  let newMin = 0;
  let exMin = 0;
  se.items.forEach((it, j) => {
    const I = `${W}.items[${j}]`;
    if (!isNum(it.min) || it.min <= 0) err(I, 'min debe ser positivo');
    else total += it.min;
    if (it.type === 'pause') {
      if (LEGACY_PAUSE_LABELS.includes(it.label)) warn(I, `etiqueta antigua "${it.label}" (usar "Preparar material")`);
      else if (!PAUSE_LABELS.includes(it.label)) err(I, `etiqueta de pausa inválida "${it.label}"`);
      if (it.label === 'Hidratación') hydration++;
      if ('exId' in it) err(I, 'una pausa no lleva exId');
    } else {
      if (!knownIds.has(it.exId)) err(I, `exId inexistente "${it.exId}"`);
      if (isNum(it.min)) { exMin += it.min; if (ids.has(it.exId)) newMin += it.min; }
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
  if (exMin && newMin / exMin < 0.5) err(W, `solo ${newMin} de ${exMin} min de ejercicio usan los ejercicios nuevos`);
  const expected = SESSION_TOTALS[se.name];
  if (expected === undefined) warn(W, 'nombre de sesión no reconocido; no se verificó el total');
  else if (total !== expected) err(W, `los minutos suman ${total} (se esperaban ${expected})`);
  else console.log(`OK sesión "${se.name}": ${total} min, ${se.items.length} bloques, ${newMin} de ${exMin} min con ejercicios nuevos`);
});

// ---------- report ----------
console.log(`Ejercicios: ${exercises.length} | escolares: ${schoolCount} | niveles: ${[...levels].join(', ')}`);
console.log('Por objetivo: ' + Object.entries(countByObjective).map(([k, v]) => `${k} ${v}`).join(', '));
warnings.forEach((w) => console.log('AVISO  ' + w));
errors.forEach((e) => console.log('ERROR  ' + e));
console.log(errors.length ? `\n${errors.length} error(es), ${warnings.length} aviso(s)` : `\nSin errores (${warnings.length} aviso(s))`);
process.exit(errors.length ? 1 : 0);
