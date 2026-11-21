// Junta futbol.json y basquet.json (los escribieron los entrenadores) en app/catalog.js.
// Uso: node tools/catalogo/build_catalog.js
const fs = require('fs');
const COACH = __dirname + '/';
const OUT = require('path').join(__dirname, '..', '..', 'app', 'catalog.js');
const exercises = []; const sessions = [];
const FIELDS = ['id', 'sport', 'title', 'objective', 'level', 'duration', 'players', 'age', 'space', 'material', 'description', 'keyPoints', 'variations', 'school', 'video', 'diagram'];
const VIDEOS = require('path').join(__dirname, '..', '..', 'app', 'videos');
// Opciones para filtrar (tipos, edad, alumnos, organización, espacio, material), revisadas a mano.
// Para revisar lo que la app deduce del texto: node tools/catalogo/facetas.js
const FACETAS = JSON.parse(fs.readFileSync(COACH + 'facetas.json', 'utf8'));
for (const sport of ['futbol', 'basquet']) {
  const f = COACH + sport + '.json';
  if (!fs.existsSync(f)) { console.log('falta', f); continue; }
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  // Ejercicios agregados después (coordinación, velocidad…): futbol2.json, basquet2.json
  const more = COACH + sport + '2.json';
  if (fs.existsSync(more)) { const d2 = JSON.parse(fs.readFileSync(more, 'utf8')); data.exercises = data.exercises.concat(d2.exercises || []); data.sessions = data.sessions.concat(d2.sessions || []); }
  data.exercises.forEach((x) => {
    const o = {};
    FIELDS.forEach((k) => { if (x[k] !== undefined) o[k] = x[k]; });
    o.sport = sport;
    const fc = FACETAS[o.id];
    if (!fc) throw new Error('faltan las opciones de ' + o.id + ' en facetas.json');
    if (fc.tags[0] !== o.objective) throw new Error('el primer tipo de ' + o.id + ' debe ser ' + o.objective);
    Object.assign(o, fc);
    o.diagram = { v: x.diagram.v, items: x.diagram.items.map((it) => {
      const r = { t: it.t, x: it.x, y: it.y };
      if (it.n != null) r.n = it.n;
      if (it.r != null) r.r = it.r;
      if (it.t === 'arrow') Object.assign(r, { k: it.k, x2: it.x2, y2: it.y2, s: it.s });
      return r;
    }) };
    // Video generado (tools/video/make-videos.js): se enlaza si ya existe.
    if (fs.existsSync(VIDEOS + '/' + o.id + '.mp4')) { o.videoUrl = 'app/videos/' + o.id + '.mp4'; o.posterUrl = 'app/videos/' + o.id + '.jpg'; o.thumbUrl = 'app/videos/' + o.id + '-t.jpg'; }
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
