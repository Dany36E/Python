// Hoja para que un profe revise los ejercicios recomendados, lista para imprimir.
// Escribe docs/revision-ejercicios.html con los 50 ejercicios y sus opciones.
// Uso: node tools/catalogo/build_catalog.js && node tools/catalogo/revision.js
// Para el PDF: abrir el HTML en Safari o Chrome → Imprimir → Guardar como PDF.
const fs = require('fs');
const path = require('path');
const FACETS = require('./facetas.js');
global.window = {};
require(path.join(__dirname, '..', '..', 'app', 'catalog.js'));
const CAT = global.window.CANCHA_CATALOG;
const OUT = path.join(__dirname, '..', '..', 'docs', 'revision-ejercicios.html');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const label = (opts, keys) => opts.filter((o) => keys.indexOf(o[0]) >= 0).map((o) => o[1]);
const low = (arr) => arr.map((x, i) => (i ? x.charAt(0).toLowerCase() + x.slice(1) : x));
const list = (arr0, conj) => { const arr = low(arr0); return arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + (conj || ' y ') + arr[arr.length - 1]; };
const LEVEL = { Inicial: 'Básico', Intermedio: 'Intermedio', Avanzado: 'Avanzado' };
function ages(keys) {
  const sel = FACETS.AGES.filter((a) => keys.indexOf(a[0]) >= 0);
  if (!sel.length) return '';
  return FACETS.span(sel[0][0])[0] + ' a ' + FACETS.span(sel[sel.length - 1][0])[1] + ' años';
}
function sizes(keys) {
  const sel = FACETS.SIZES.filter((z) => keys.indexOf(z[0]) >= 0);
  if (!sel.length) return '';
  const lo = sel[0][2]; const hi = sel[sel.length - 1][3];
  return hi >= 99 ? (lo <= 1 ? 'Cualquier número' : 'De ' + lo + ' en adelante') : (lo <= 1 ? 'Hasta ' + hi : lo + ' a ' + hi);
}

function card(x, i) {
  const sp = x.sport;
  const facts = [
    ['Tipo', list(x.tags)], ['Nivel', LEVEL[x.level] || x.level], ['Duración', x.duration + ' min'],
    ['Edad', ages(x.ages) + (x.age ? ' (' + x.age + ')' : '')], ['Alumnos', sizes(x.sizes) + (x.players ? ' (' + x.players + ')' : '')],
    ['Organización', list(label(FACETS.FORMS, x.forms), ' o ')], ['Espacio', list(label(FACETS.SPACES[sp], x.spaces), ' o ') + (x.space ? ' (' + x.space + ')' : '')],
    ['Material', list(label(FACETS.GEAR[sp], x.gear)) + (x.material ? ' (' + x.material + ')' : '')],
  ].filter((f) => f[1]);
  const pts = String(x.keyPoints || '').split('\n').filter(Boolean);
  return '<article><header><span class="n">' + (i + 1) + '</span><h2>' + esc(x.title) + '</h2>' + (x.videoUrl ? '<span class="vid">con video</span>' : '') + '</header>' +
    '<dl>' + facts.map((f) => '<dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd>').join('') + '</dl>' +
    '<p>' + esc(x.description) + '</p>' +
    (pts.length ? '<ul>' + pts.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>' : '') +
    '<div class="check"><span>☐ Sirve así</span><span>☐ Cambiar</span><span>☐ Quitar</span><span>☐ La edad o los alumnos no cuadran</span></div>' +
    '<div class="lines">¿Qué cambiarías?</div></article>';
}

const bySport = (sp) => CAT.exercises.filter((x) => x.sport === sp);
const html = '<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Revisión de ejercicios · Cancha</title><style>' +
  'body{font:15px/1.45 -apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#1c1c1e;margin:0;padding:24px;max-width:860px;margin:auto;background:#fff}' +
  'h1{font-size:28px;margin:0 0 6px}h3{font-size:22px;margin:32px 0 12px;color:#0B7A3B}h3.b{color:#B84708}.lead{color:#555;margin:0 0 18px}' +
  'article{border:1px solid #d9d9de;border-radius:12px;padding:14px 16px;margin:0 0 14px;break-inside:avoid}' +
  'header{display:flex;align-items:baseline;gap:10px}.n{font-weight:700;color:#888}h2{font-size:18px;margin:0;flex:1}.vid{font-size:12px;color:#0B7A3B;border:1px solid #0B7A3B;border-radius:9px;padding:1px 7px}' +
  'dl{display:grid;grid-template-columns:110px 1fr;gap:2px 10px;margin:10px 0;font-size:14px}dt{color:#666}dd{margin:0}' +
  'p{margin:8px 0}ul{margin:6px 0 8px 18px;padding:0}li{margin:2px 0}' +
  '.check{display:flex;flex-wrap:wrap;gap:6px 18px;margin:10px 0 6px;font-size:14px}' +
  '.lines{font-size:13px;color:#666;border-bottom:1px solid #bbb;height:44px;background:repeating-linear-gradient(transparent 0 21px,#ddd 21px 22px)}' +
  '@media print{body{padding:0}article{border-color:#aaa}}</style></head><body>' +
  '<h1>Revisión de ejercicios recomendados</h1>' +
  '<p class="lead">Son los ' + CAT.exercises.length + ' ejercicios que trae Cancha. Para cada uno marca si sirve así, si hay que cambiarlo o quitarlo, y anota qué cambiarías (sobre todo si la edad, el número de alumnos o el material no cuadran con tus grupos). Con tus notas se corrigen en la app.</p>' +
  '<h3>Fútbol</h3>' + bySport('futbol').map(card).join('') +
  '<h3 class="b">Básquetbol</h3>' + bySport('basquet').map((x, i) => card(x, i)).join('') +
  '</body></html>\n';
fs.writeFileSync(OUT, html);
console.log('docs/revision-ejercicios.html:', CAT.exercises.length, 'ejercicios');
