// Planes por grado: el jefe arma un plan (clases guardadas en orden, días y ciclo), se lo asigna a un maestro
// con un archivo; el maestro lo abre y su Cancha queda a su nombre con su grupo y sus clases del ciclo.
// Luego el jefe cambia el plan y lo reenvía: al maestro solo se le actualiza lo que no dio ni cambió.
const { chromium, devices } = require('playwright');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const OUT = require('path').join(__dirname, 'out') + '/';
require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const W = (p, ms) => p.waitForTimeout(ms || 450);
(async () => {
  const b = await chromium.launch();
  async function open() {
    const ctx = await b.newContext({ ...devices['iPad Pro 11'], deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: true });
    await ctx.addInitScript(() => { try { localStorage.setItem('cancha:onboarded', '1'); } catch (e) { /* */ } });
    const p = await ctx.newPage();
    p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
    await p.clock.install({ time: new Date('2026-11-23T09:00:00') });
    await p.goto(BASE + 'index.html');
    await p.waitForSelector('#screen-clases.active'); await W(p, 1300);
    return { ctx, p };
  }
  const scr = (p) => p.locator('.stack-screen.in').last();
  const sheet = (p) => p.locator('.sheet-wrap.open').last();
  const db = (p, store) => p.evaluate((st) => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const q = r.result.transaction(st).objectStore(st).getAll(); q.onsuccess = () => res(q.result); }; }), store);
  const meta = (p, key) => p.evaluate((k) => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const q = r.result.transaction('meta').objectStore('meta').get(k); q.onsuccess = () => res(q.result); }; }), key);
  async function download(p, zipName) {
    await W(p, 2500);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), sheet(p).locator('[data-file-share]').click()]);
    const f = OUT + zipName; await dl.saveAs(f); await W(p, 600);
    return f;
  }
  async function importFile(p, f) {
    await p.click('#screen-clases [data-act="backup"]'); await W(p, 700);
    await Promise.all([p.waitForEvent('filechooser').then((fc) => fc.setFiles(f)), sheet(p).locator('[data-bk="import"]').click()]);
    await W(p, 1500);
  }

  // ---------- Jefe: arma el plan
  const A = await open();
  let p = A.p;
  ok(await p.locator('#screen-clases [data-act="new-plan"]').count() >= 1, 'la pestaña Clases ofrece «Arma el plan de un grado»');
  await p.locator('#screen-clases .tpl-new[data-act="new-plan"]').click(); await W(p, 800);
  ok((await sheet(p).locator('.sh-title').innerText()) === 'Nuevo plan por grado', 'se abre «Nuevo plan por grado»');
  await sheet(p).locator('#pl-name').fill('5.º de primaria');
  await sheet(p).locator('[data-opts="cat"] [data-opt="Primaria"]').click();
  await sheet(p).locator('[data-opts="days"] [data-opt="2"]').click();
  await sheet(p).locator('[data-opts="days"] [data-opt="4"]').click();
  await sheet(p).locator('#pl-time').fill('09:00'); await W(p, 200);
  const sum = await sheet(p).locator('[data-ref="sum"]').innerText();
  ok(/Son \d+ días de clase del 23 nov al 20 jul, sin vacaciones ni festivos/.test(sum), 'dice cuántos días de clase son: ' + sum);
  await sheet(p).screenshot({ path: OUT + 'planes-editor.png' });
  await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 1800);
  ok((await scr(p).locator('.d-title').innerText()) === '5.º de primaria', 'se abre la pantalla del plan');
  ok(await sheet(p).locator('[data-pk-rec]').count() === 2, 'el selector ofrece las 2 clases recomendadas (plan de ambos deportes)');
  await sheet(p).locator('[data-pk-rec]').first().click(); await W(p, 1500);
  await sheet(p).locator('[data-pk-rec]').first().click(); await W(p, 1500);
  ok(await sheet(p).locator('[data-pk-cls][aria-checked="true"]').count() === 2, 'las recomendadas quedan guardadas y elegidas en orden');
  await sheet(p).screenshot({ path: OUT + 'planes-selector.png' });
  await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 1000);
  let txt = await scr(p).innerText();
  ok(/2 clases que se turnan/.test(txt) && /12 ejercicios/.test(txt) && /12 con video/.test(txt), 'el plan resume clases, ejercicios y videos');
  ok(await scr(p).locator('.list .cell .group-badge').first().innerText() === '1', 'las clases van numeradas en orden');
  await scr(p).screenshot({ path: OUT + 'planes-jefe.png', fullPage: true });

  // Asignar a un maestro
  await scr(p).locator('[data-act="pl-assign"]').click(); await W(p, 800);
  await sheet(p).locator('#as-me').fill('Toño');
  await sheet(p).locator('#as-teacher').fill('Profe Juan');
  await sheet(p).locator('#as-group').fill('5.º A');
  ok(await sheet(p).locator('[data-opts="days"] [data-opt="2"][aria-pressed="true"]').count() === 1, 'los días vienen del plan');
  const asum = await sheet(p).locator('[data-ref="sum"]').innerText();
  ok(/Se le programan \d+ clases del 24 nov al/.test(asum), 'dice cuántas clases se le programan: ' + asum);
  await sheet(p).screenshot({ path: OUT + 'planes-asignar.png' });
  await sheet(p).locator('[data-sh="ok"]').click();
  const zip1 = await download(p, 'plan-juan.zip');
  ok(require('fs').statSync(zip1).size > 2000, 'se crea el archivo del plan');
  txt = await scr(p).innerText();
  ok(txt.includes('Profe Juan') && txt.includes('5.º A'), 'el maestro aparece en «Maestros» con su grupo');
  const nClsBoss = (await db(p, 'classes')).filter((c) => c.planId).length;
  ok(nClsBoss === 0, 'en el iPad del jefe no se crean las clases del maestro');

  // ---------- Maestro: abre su plan
  const B = await open();
  const q = B.p;
  await importFile(q, zip1);
  ok((await sheet(q).locator('.sh-title').innerText()) === 'Tu plan: 5.º de primaria', 'el maestro ve «Tu plan: 5.º de primaria»');
  const itxt = await sheet(q).innerText();
  ok(itxt.includes('Toño') && /\d+ clases/.test(itxt) && itxt.includes('12 ejercicios') && itxt.includes('Se quitan los ejemplos'), 'dice quién lo manda, cuántas clases y ejercicios');
  await sheet(q).screenshot({ path: OUT + 'planes-abrir.png' });
  await sheet(q).locator('[data-sh="ok"]').click(); await W(q, 3500);
  const welcome = await q.locator('.as-wrap.open').innerText();
  ok(welcome.includes('¡Listo, Profe Juan!') && welcome.includes('Tu primera clase es') && welcome.includes('agrega a tus alumnos'), 'le da la bienvenida con su primera clase y le pide agregar alumnos');
  await q.locator('.as-wrap.open .as-btn', { hasText: 'Después' }).click(); await W(q, 700);
  let cls = await db(q, 'classes');
  const mine = cls.filter((c) => c.planId && !c.template);
  ok(mine.length > 40 && mine.every((c) => c.date >= '2026-11-24' && [2, 4].includes(new Date(c.date + 'T12:00').getDay())), 'tiene sus ' + mine.length + ' clases del ciclo en martes y jueves');
  ok(mine.find((c) => c.date === '2026-11-24').name !== mine.find((c) => c.date === '2026-11-26').name, 'las clases se turnan');
  ok(!mine.some((c) => ['2026-12-24', '2026-12-29', '2026-12-31', '2027-03-23', '2027-04-01'].includes(c.date)), 'no hay clases en vacaciones de diciembre ni en Semana Santa');
  ok(!cls.some((c) => c.example), 'se quitaron las clases de ejemplo');
  const grs = await db(q, 'groups');
  ok(grs.some((g) => g.name === '5.º A' && g.planId) && !grs.some((g) => g.example), 'tiene su grupo 5.º A y ya no los de ejemplo');
  ok(cls.filter((c) => c.template).length === 2, 'trae las 2 clases guardadas');
  const chip = q.locator('#screen-clases .acct-chip');
  ok(await chip.count() === 1 && (await chip.innerText()).includes('Profe Juan'), 'arriba dice a nombre de quién está: Profe Juan');
  ok(await q.locator('#screen-clases [data-act="all-up"]').count() === 1, 'las próximas se recortan con «Ver las N próximas»');
  await q.locator('#screen-clases').screenshot({ path: OUT + 'planes-maestro.png' });
  await chip.click(); await W(q, 900);
  txt = await scr(q).innerText();
  ok(txt.includes('Tu plan · de Toño') && txt.includes('Mandar mi avance a Toño'), 'la pantalla del plan del maestro tiene «Mandar mi avance»');
  await scr(q).screenshot({ path: OUT + 'planes-maestro-plan.png', fullPage: true });
  await scr(q).locator('[data-act="pl-progress"]').click(); await W(q, 700);
  const prog = await q.locator('.as-wrap.open').innerText();
  ok(prog.includes('Hola Toño, soy Profe Juan (5.º A)') && prog.includes('Todavía no empiezo el plan') && /Me faltan \d+ clases; la siguiente es mañana/.test(prog), 'el avance suena como lo diría el profe: ' + prog.split('\n').slice(1, 4).join(' | '));
  await q.locator('.as-wrap.open .as-btn.bold').last().click(); await W(q, 500);
  await q.goBack(); await W(q, 600);
  // El maestro cambia una clase (le cambia el nombre)
  const edited = mine.find((c) => c.date === '2026-12-01');
  await q.evaluate((id) => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const tx = r.result.transaction('classes', 'readwrite'); const st = tx.objectStore('classes'); st.get(id).onsuccess = (e) => { const c = e.target.result; c.name = 'Mi clase cambiada'; c.updatedAt = Date.now() + 1000; st.put(c); }; tx.oncomplete = () => res(); }; }), edited.id);

  // Los dos cambian la misma clase guardada
  const setDoc = (pg, id, patch) => pg.evaluate(([cid, pt]) => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const tx = r.result.transaction('classes', 'readwrite'); const st = tx.objectStore('classes'); st.get(cid).onsuccess = (e) => { const c = Object.assign(e.target.result, pt, { updatedAt: Date.now() + 2000 }); st.put(c); }; tx.oncomplete = () => res(); }; }), [id, patch]);
  const tplA = (await db(q, 'classes')).find((c) => c.template && c.sport === 'futbol');
  ok(!/^(Primaria|Secundaria) · /.test(tplA.name), 'las clases guardadas de las recomendadas no traen «Primaria ·» en el nombre: ' + tplA.name);
  await setDoc(q, tplA.id, { name: 'Mi versión de primaria' });
  await setDoc(p, tplA.id, { notes: 'Nota nueva del jefe' });
  await p.reload(); await W(p, 1800);
  await p.locator('#screen-clases [data-open-plan]').first().click(); await W(p, 900);

  // ---------- Jefe: cambia el orden y reenvía
  await scr(p).locator('[data-act="pl-order"]').click(); await W(p, 400);
  await scr(p).locator('[data-pl-down="0"]').click(); await W(p, 900);
  ok((await scr(p).locator('.pl-stale').innerText()).includes('Profe Juan todavía tiene la versión anterior'), 'el jefe ve que Profe Juan tiene la versión anterior');
  await scr(p).locator('.pl-stale [data-pl-resend]').click(); await W(p, 800);
  ok((await sheet(p).locator('.sh-title').innerText()) === 'Reenviar a Profe Juan', 'reenviar abre la misma asignación');
  await sheet(p).locator('[data-sh="ok"]').click();
  const zip2 = await download(p, 'plan-juan-2.zip');

  // ---------- Maestro: recibe la versión nueva
  await q.reload(); await W(q, 1800);
  await importFile(q, zip2);
  ok((await sheet(q).locator('.sh-title').innerText()) === 'Plan actualizado', 'el maestro ve «Plan actualizado»');
  await sheet(q).locator('[data-sh="ok"]').click(); await W(q, 3500);
  cls = await db(q, 'classes');
  const after = cls.filter((c) => c.planId && !c.template);
  ok(after.length === mine.length, 'sigue con el mismo número de clases (' + after.length + ')');
  ok(after.find((c) => c.id === edited.id).name === 'Mi clase cambiada', 'la clase que cambió el maestro se quedó como la dejó');
  const d24 = after.find((c) => c.date === '2026-11-24');
  ok(d24.name === mine.find((c) => c.date === '2026-11-26').name, 'las demás se actualizaron con el nuevo orden');
  ok(!cls.some((c) => !c.template && / \(copia\)$/.test(c.name || '')), 'no se hicieron copias de clases del calendario');
  const tpls2 = cls.filter((c) => c.template);
  const copyA = tpls2.find((c) => c.name === tplA.name + ' (copia)');
  ok(tpls2.find((c) => c.id === tplA.id).name === 'Mi versión de primaria' && copyA && copyA.notes === 'Nota nueva del jefe', 'si los dos cambiaron una clase guardada, el maestro conserva la suya y recibe la del jefe como copia');
  const recP = (await meta(q, 'plans'))[0];
  ok(recP.classIds.includes(copyA.id) && !recP.classIds.includes(tplA.id), 'su plan usa la versión nueva del jefe');
  ok((await meta(q, 'plans')).length === 1, 'sigue un solo plan');

  // Respaldo del jefe lleva el plan
  await p.goBack(); await W(p, 600);
  ok((await meta(p, 'plans'))[0].assigned.length === 1, 'el jefe guarda a quién se lo asignó');
  // Sin clases con fecha también se puede crear un plan
  const C = await open();
  await C.p.evaluate(() => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const tx = r.result.transaction('classes', 'readwrite'); tx.objectStore('classes').clear(); tx.oncomplete = () => res(); }; }));
  await C.p.reload(); await W(C.p, 1800);
  ok(await C.p.locator('#screen-clases .empty').count() === 1 && await C.p.locator('#screen-clases [data-act="new-plan"]').count() >= 1, 'sin clases con fecha sigue «Arma el plan de un grado»');
  // Respaldo con un plan cambiado en los dos aparatos: no se pierde ninguna versión
  const planId = (await meta(p, 'plans'))[0].id;
  for (let i = 0; i < 3 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await W(p, 500); }
  await p.click('#screen-clases [data-act="backup"]'); await W(p, 700);
  await sheet(p).locator('[data-bk="full"]').click(); await W(p, 2500);
  const [bk] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }).catch(() => null), sheet(p).locator('[data-file-share]').click()]);
  await W(p, 600);
  if (bk) {
    const bf = OUT + 'planes-respaldo.zip'; await bk.saveAs(bf);
    await p.evaluate((id) => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const tx = r.result.transaction('meta', 'readwrite'); const st = tx.objectStore('meta'); st.get('plans').onsuccess = (e) => { const l = e.target.result; const x = l.find((y) => y.id === id); x.name = 'Nombre cambiado aquí'; x.updatedAt = Date.now() + 5000; st.put(l, 'plans'); }; tx.oncomplete = () => res(); }; }), planId);
    // el plan del respaldo también es más nuevo que la última vez que se sincronizó
    await p.evaluate((id) => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const tx = r.result.transaction('meta', 'readwrite'); const st = tx.objectStore('meta'); st.get('plans').onsuccess = (e) => { const l = e.target.result; l.find((y) => y.id === id).syncedAt = 1; st.put(l, 'plans'); }; tx.oncomplete = () => res(); }; }), planId);
    await p.reload(); await W(p, 1800);
    await importFile(p, bf);
    await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 2500);
    const pls = await meta(p, 'plans');
    ok(pls.length === 2 && pls.some((x) => x.name === 'Nombre cambiado aquí') && pls.some((x) => / \(copia\)$/.test(x.name)), 'un plan cambiado en los dos aparatos se guarda como copia: ' + pls.map((x) => x.name).join(', '));
  } else ok(false, 'no se pudo crear el respaldo');
  ok(A.p.errs.length === 0 && q.errs.length === 0 && C.p.errs.length === 0, 'sin errores: ' + A.p.errs.concat(q.errs, C.p.errs).join(' / '));
  await b.close();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
