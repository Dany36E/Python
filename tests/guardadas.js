// Clases guardadas: guardar una clase para reusarla, programarla para un grupo y varios días,
// empezar una clase nueva desde una guardada, crear una desde cero, guardar una recomendada,
// editarla y eliminarla. Las guardadas no salen como clases con fecha.
const { chromium, devices } = require('playwright');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const OUT = require('path').join(__dirname, 'out') + '/';
require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const W = (p, ms) => p.waitForTimeout(ms || 450);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPad Pro 11'], deviceScaleFactor: 1, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('cancha:onboarded', '1'); } catch (e) { /* */ } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-11-23T09:00:00') });
  await p.goto(BASE + 'index.html');
  await p.waitForSelector('#screen-clases.active'); await W(p, 1300);
  const scr = () => p.locator('.stack-screen.in').last();
  const sheet = () => p.locator('.sheet-wrap.open').last();
  const all = () => p.evaluate(() => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const q = r.result.transaction('classes').objectStore('classes').getAll(); q.onsuccess = () => res(q.result); }; }));

  // 1. Guardar una clase para reusarla
  await p.locator('#screen-clases [data-open-class]').first().click(); await W(p, 900);
  const srcName = (await scr().locator('.d-title').innerText()).trim();
  const srcItems = (await all()).find((c) => c.name === srcName).items.length;
  await scr().locator('[data-act="save-tpl"]').click(); await W(p, 700);
  ok((await sheet().locator('#tpl-name').inputValue()) === srcName, 'el nombre viene de la clase');
  await sheet().locator('#tpl-name').fill('Mi clase de coordinación');
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 900);
  let tpls = (await all()).filter((c) => c.template);
  ok(tpls.length === 1 && tpls[0].items.length === srcItems && !tpls[0].date && !tpls[0].groupId, 'se guardó el plan sin fecha ni grupo (' + srcItems + ' bloques)');
  await p.goBack(); await W(p, 600);
  ok(await p.locator('#screen-clases .tpl-card', { hasText: 'Mi clase de coordinación' }).count() === 1, 'aparece en «Clases guardadas»');
  ok(await p.locator('#screen-clases .list [data-open-class]', { hasText: 'Mi clase de coordinación' }).count() === 0, 'no sale entre las clases con fecha');
  await p.locator('#screen-clases').screenshot({ path: OUT + 'guardadas-pestana.png' });

  // 2. La ficha de una clase guardada: Programar, sin asistencia
  await p.locator('#screen-clases .tpl-card', { hasText: 'Mi clase de coordinación' }).click(); await W(p, 900);
  const d = await scr().innerText();
  ok(/Clase guardada/.test(d) && d.includes('Programar') && !d.includes('Iniciar clase') && !d.includes('Asistencia'), 'la ficha dice «Clase guardada», tiene «Programar» y no tiene asistencia');
  await scr().screenshot({ path: OUT + 'guardadas-ficha.png' });

  // 3. Programar: grupo y lunes a viernes
  await scr().locator('[data-act="schedule"]').click(); await W(p, 900);
  ok(await sheet().locator('[data-from][aria-pressed="true"]', { hasText: 'Mi clase de coordinación' }).count() === 1, 'la hoja viene con «Empezar desde» la guardada');
  ok((await sheet().locator('#cl-name').inputValue()) === 'Mi clase de coordinación', 'y con su nombre');
  ok(await sheet().locator('[data-gpick]', { hasText: '5.º A' }).count() === 0, 'una guardada de básquetbol no ofrece grupos de fútbol');
  await sheet().locator('[data-gpick]', { hasText: '2.º B' }).click(); await W(p, 300);
  await sheet().locator('[data-days="wk"]').click(); await W(p, 300);
  ok((await sheet().locator('[data-sh="ok"]').innerText()) === 'Guardar (5)', 'lunes a viernes: Guardar (5)');
  await sheet().screenshot({ path: OUT + 'guardadas-programar.png' });
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 2200);
  const made = (await all()).filter((c) => !c.template && c.fromTemplate === tpls[0].id);
  ok(made.length === 5 && made.every((c) => c.items.length === srcItems && c.groupId), 'se programaron 5 clases con el mismo plan para el grupo');
  ok(await p.locator('.sheet-wrap.open').count() === 0, 'no se abre el selector porque ya tienen plan');
  for (let i = 0; i < 3 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await W(p, 600); }
  await p.locator('#screen-clases .tpl-card', { hasText: 'Mi clase de coordinación' }).click(); await W(p, 900);
  ok((await scr().innerText()).includes('La programaste 5 veces'), 'la ficha dice cuántas veces se programó');
  await p.goBack(); await W(p, 600);

  // 4. Nueva clase: «Empezar desde» una guardada y volver a «En blanco»
  await p.click('#fab'); await W(p, 900);
  await sheet().locator('[data-from]', { hasText: 'Mi clase de coordinación' }).click(); await W(p, 300);
  ok((await sheet().locator('[data-ref="from-note"]').innerText()).includes('Se copia su plan'), 'al elegir una guardada dice qué se copia');
  await sheet().locator('[data-from=""]').click(); await W(p, 300);
  ok((await sheet().locator('#cl-name').inputValue()) === '' && await sheet().locator('[data-ref="from-note"]').isHidden(), '«En blanco» la deja vacía');
  await sheet().locator('.sh-x').click(); await W(p, 600);
  if (await p.locator('.as-wrap.open').count()) { await p.locator('.as-wrap.open .as-btn').first().click(); await W(p, 600); }

  // 5. Clase guardada desde cero
  await p.locator('#screen-clases [data-act="new-saved"]').first().click(); await W(p, 900);
  ok((await sheet().locator('.sh-title').innerText()) === 'Nueva clase guardada', 'la hoja dice «Nueva clase guardada»');
  ok(await sheet().locator('[data-ref="groups"]').count() === 0 && await sheet().locator('#cl-date').count() === 0, 'no pregunta grupo ni fecha');
  await sheet().locator('[data-focus="Pase"]').click();
  await sheet().locator('[data-opts="target"] [data-opt="45"]').click();
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 1800);
  ok(await sheet().locator('.pk-sec').count() > 0, 'se abre el selector para armar su plan');
  await sheet().locator('[data-pick-ex]').first().click();
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 1200);
  tpls = (await all()).filter((c) => c.template);
  const fresh = tpls.find((c) => c.name === 'Pase');
  ok(fresh && fresh.items.length === 1 && fresh.target === 45, 'la guardada desde cero tiene nombre, duración y su ejercicio');
  // Editar: sigue siendo guardada
  await scr().locator('[data-act="edit-class"]').click(); await W(p, 800);
  ok((await sheet().locator('.sh-title').innerText()) === 'Editar clase guardada', 'editar dice «Editar clase guardada»');
  await sheet().locator('#cl-name').fill('Pase en parejas');
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 900);
  ok((await all()).some((c) => c.template && c.name === 'Pase en parejas' && !c.date), 'al editarla sigue sin fecha');
  for (let i = 0; i < 3 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await W(p, 600); }

  // 6. Recomendada → «Guardar en mis clases»
  await p.click('#tab-ejercicios'); await W(p);
  await p.click('[data-act="catalog"]'); await W(p, 1000);
  await scr().locator('[data-open-template]').first().click(); await W(p, 900);
  await scr().locator('[data-act="keep"]').click(); await W(p, 700);
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 1800);
  tpls = (await all()).filter((c) => c.template);
  ok(tpls.length === 3 && tpls.every((t) => t.items.every((it) => it.type === 'pause' || !/^c[fb]-/.test(it.exId))), 'la recomendada quedó guardada con sus ejercicios en tu biblioteca');
  for (let i = 0; i < 4 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await W(p, 500); }

  // 7. Eliminar una guardada (con deshacer) no borra las clases programadas
  await p.click('#tab-clases'); await W(p, 500);
  await p.locator('#screen-clases .tpl-card', { hasText: 'Mi clase de coordinación' }).click(); await W(p, 900);
  await scr().locator('[data-act="delete-class"]').click(); await W(p, 600);
  ok((await p.locator('.as-wrap.open').innerText()).includes('ya programaste'), 'avisa que las clases programadas se quedan');
  await p.locator('.as-wrap.open .as-btn', { hasText: 'Eliminar' }).click(); await W(p, 1000);
  const after = await all();
  ok(!after.some((c) => c.template && c.name === 'Mi clase de coordinación') && after.filter((c) => c.fromTemplate === tpls.concat([{ id: made[0].fromTemplate }]).pop().id).length === 5, 'se eliminó la guardada y las 5 clases se quedaron');
  ok(await p.locator('#toast .toast-act', { hasText: 'Deshacer' }).count() === 1, 'ofrece deshacer');

  // 8. En el grupo no aparecen las guardadas
  await p.click('#tab-grupos'); await W(p);
  await p.locator('[data-open-group]', { hasText: '2.º B' }).click(); await W(p, 800);
  ok(!(await scr().innerText()).includes('Pase en parejas'), 'las guardadas no salen en el grupo');

  ok(errs.length === 0, 'sin errores: ' + errs.join(' / '));
  await b.close();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
