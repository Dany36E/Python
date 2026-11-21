// Prueba de actualización: con datos de la versión publicada, la nueva conserva lo del profe y trae los ejemplos nuevos.
const { chromium, devices } = require('playwright');
const { spawn } = require('child_process');
// Uso: OLD=carpeta-version-publicada NEW=carpeta-version-nueva node tests/actualizacion.js
// (por ejemplo: mkdir /tmp/vieja && git archive origin/main | tar -x -C /tmp/vieja; OLD=/tmp/vieja NEW=. node tests/actualizacion.js)
const OLD = process.env.OLD; const NEW = process.env.NEW || require('path').join(__dirname, '..');
if (!OLD) { console.log('Falta OLD (carpeta con la versión publicada).'); process.exit(2); }
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const serve = (dir) => { const s = spawn('python3', ['-m', 'http.server', '8767'], { cwd: dir, stdio: 'ignore' }); return new Promise((r) => setTimeout(() => r(s), 900)); };
const dump = (p) => p.evaluate(() => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const t = r.result.transaction(['exercises', 'classes', 'meta']); const out = {}; t.objectStore('exercises').getAll().onsuccess = (e) => { out.ex = e.target.result; }; t.objectStore('classes').getAll().onsuccess = (e) => { out.cl = e.target.result; }; t.objectStore('meta').get('sections').onsuccess = (e) => { out.sec = e.target.result; }; t.oncomplete = () => res(out); }; }));
(async () => {
  let srv = await serve(OLD);
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPad (gen 7)'], deviceScaleFactor: 1, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('cancha:onboarded', '1'); } catch (e) { /* */ } });
  await ctx.route('**/*', (r) => r.continue());
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:8767/'); await p.waitForTimeout(1800);
  await p.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('cancha');
    r.onsuccess = () => {
      const db = r.result; const tx = db.transaction(['exercises', 'classes'], 'readwrite'); const ex = tx.objectStore('exercises');
      ex.get('ex3-cf-03').onsuccess = (e) => { const x = e.target.result; if (x) { x.title = 'Porterías de Daniel'; x.example = false; x.updatedAt = Date.now() + 5; ex.put(x); } };
      ex.put({ id: 'mine1', sport: 'futbol', title: 'Mi ejercicio propio', objective: 'Tiro', duration: 12, createdAt: Date.now(), updatedAt: Date.now(), example: false });
      tx.objectStore('classes').put({ id: 'myc1', name: 'Mi clase', sport: 'futbol', date: '2026-11-20', items: [{ exId: 'mine1', min: 12 }, { exId: 'ex3-cf-03', min: 10 }], createdAt: Date.now(), updatedAt: Date.now() });
      tx.oncomplete = () => res();
    };
  }));
  srv.kill('SIGKILL'); await new Promise((r) => setTimeout(r, 800));
  srv = await serve(NEW);
  await p.goto('http://localhost:8767/'); await p.reload(); await p.waitForTimeout(2500);
  const d = await dump(p);
  const byId = Object.fromEntries(d.ex.map((x) => [x.id, x]));
  ok(!!byId.mine1, 'se conserva el ejercicio propio');
  ok(byId['ex3-cf-03'] && byId['ex3-cf-03'].title === 'Porterías de Daniel', 'se conserva el ejemplo que el profe cambió');
  ok(byId['ex3-cf-15'] && byId['ex3-cf-15'].videoUrl, 'llegan los ejemplos nuevos de coordinación con video');
  ok(byId['ex3-cf-01'] && byId['ex3-cf-01'].videoUrl, 'los ejemplos sin tocar ahora traen video');
  ok(d.cl.some((c) => c.id === 'myc1'), 'se conserva la clase propia');
  ok(d.cl.some((c) => c.id === 'cl3-ej1' && c.name === 'Coordinación y velocidad'), 'la clase de ejemplo es la de coordinación');
  ok(Array.isArray(d.sec) && d.sec.length === 3 && d.sec.every((x) => x.exIds.length > 0), 'tres secciones de ejemplo con ejercicios: ' + (d.sec || []).map((x) => x.name + ' ' + x.exIds.length).join(', '));
  ok(errors.length === 0, 'sin errores: ' + errors.join(' / '));
  await b.close(); srv.kill();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN');
})();
