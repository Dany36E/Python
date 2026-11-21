// Junta futbol.json y basquet.json (los escribieron los entrenadores) en app/catalog.js.
// Uso: node tools/catalogo/build_catalog.js
const fs = require('fs');
const COACH = __dirname + '/';
const OUT = require('path').join(__dirname, '..', '..', 'app', 'catalog.js');
const exercises = []; const sessions = [];
const FIELDS = ['id', 'sport', 'title', 'objective', 'level', 'duration', 'players', 'age', 'space', 'material', 'description', 'keyPoints', 'variations', 'school', 'diagram'];
for (const sport of ['futbol', 'basquet']) {
  const f = COACH + sport + '.json';
  if (!fs.existsSync(f)) { console.log('falta', f); continue; }
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  data.exercises.forEach((x) => {
    const o = {};
    FIELDS.forEach((k) => { if (x[k] !== undefined) o[k] = x[k]; });
    o.sport = sport;
    o.diagram = { v: x.diagram.v, items: x.diagram.items.map((it) => {
      const r = { t: it.t, x: it.x, y: it.y };
      if (it.n != null) r.n = it.n;
      if (it.t === 'arrow') Object.assign(r, { k: it.k, x2: it.x2, y2: it.y2, s: it.s });
      return r;
    }) };
    exercises.push(o);
  });
  data.sessions.forEach((t, i) => {
    sessions.push({ id: 'tp-' + sport + '-' + (i + 1), sport, name: t.name, age: t.age || '', notes: String(t.notes || '').replace(/^Objetivo( del día)?:\s*/i, '').replace(/^./, (c) => c.toUpperCase()), items: t.items.map((it) => (it.type === 'pause' ? { type: 'pause', label: it.label === 'Montar material' ? 'Preparar material' : it.label, min: it.min } : Object.assign({ exId: it.exId, min: it.min }, it.series ? { series: it.series } : {}))) });
  });
}
const ids = new Set(exercises.map((x) => x.id));
sessions.forEach((t) => t.items.forEach((it) => { if (it.exId && !ids.has(it.exId)) throw new Error('falta ' + it.exId + ' en ' + t.name); }));
const js = '/* Cancha · ejercicios y clases de entrenadores (generado). */\nwindow.CANCHA_CATALOG = ' + JSON.stringify({ version: 1, exercises, sessions }) + ';\n';
fs.writeFileSync(OUT, js);
console.log('catalog.js:', exercises.length, 'ejercicios,', sessions.length, 'clases,', Math.round(js.length / 1024), 'KB');
