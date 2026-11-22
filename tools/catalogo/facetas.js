// Saca las opciones (edad, alumnos, organización, espacio, material) de cada ejercicio recomendado
// con la misma lógica que la app, para revisarlas a mano.
// Uso: node tools/catalogo/facetas.js            → imprime lo que deduce
//      node tools/catalogo/facetas.js --borrador → además escribe facetas-borrador.json
// Las correctas viven en facetas.json (build_catalog.js las copia al catálogo).
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'app.js'), 'utf8');
const block = src.slice(src.indexOf('// <facetas>'), src.indexOf('// </facetas>'));
const FACETS = new Function(block + '\nreturn FACETS;')();
module.exports = FACETS;
if (require.main === module) {
  const out = {};
  for (const sport of ['futbol', 'basquet']) {
    for (const f of [sport + '.json', sport + '2.json']) {
      const file = path.join(__dirname, f);
      if (!fs.existsSync(file)) continue;
      JSON.parse(fs.readFileSync(file, 'utf8')).exercises.forEach((x) => {
        const i = FACETS.infer;
        out[x.id] = { ages: i.ages(x.age), sizes: i.sizes(x.players, x.school), forms: i.forms(x.players), spaces: i.spaces(x.space, sport), gear: i.gear(x.material, sport) };
        console.log(x.id, JSON.stringify(out[x.id]), '|', x.players, '|', x.space, '|', x.material);
      });
    }
  }
  if (process.argv.includes('--borrador')) fs.writeFileSync(path.join(__dirname, 'facetas-borrador.json'), JSON.stringify(out, null, 1));
}
