// Errores que encontró la revisión de calidad en iPad (noviembre 2026), para que no regresen.
const { chromium, devices } = require('playwright');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const W = (p, ms) => p.waitForTimeout(ms || 450);
(async () => {
  const b = await chromium.launch();
  async function fresh(opts) {
    const ctx = await b.newContext({ ...devices['iPad Pro 11'], deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: true, ...(opts || {}) });
    await ctx.addInitScript(() => { try { localStorage.setItem('cancha:onboarded', '1'); } catch (e) { /* */ } });
    const p = await ctx.newPage();
    p.errs = [];
    p.on('pageerror', (e) => p.errs.push(e.message));
    await p.clock.install({ time: new Date('2026-11-23T09:00:00') });
    await p.goto(BASE + 'index.html');
    await p.waitForSelector('#screen-clases.active'); await W(p, 1300);
    return { ctx, p };
  }
  const scr = (p) => p.locator('.stack-screen.in').last();
  const sheet = (p) => p.locator('.sheet-wrap.open').last();
  const db = (p, store) => p.evaluate((st) => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const q = r.result.transaction(st).objectStore(st).getAll(); q.onsuccess = () => res(q.result); }; }), store);

  let { ctx, p } = await fresh();

  // Pegar una lista numerada de muchas formas
  await p.click('#tab-grupos'); await W(p);
  await p.locator('[data-open-group]', { hasText: '5.º A' }).click(); await W(p, 800);
  const addBtn = scr(p).locator('[data-act="add-students"]');
  if (await addBtn.count()) {
    await addBtn.first().click(); await W(p, 700);
    await sheet(p).locator('#st-names').fill('41.- Dávila Ruiz Ana\n42\tLozano Peña Beto\n43) Mora Sosa Ceci');
    ok((await sheet(p).locator('[data-sh="ok"]').innerText()) === 'Agregar 3', 'el botón dice cuántos se agregan');
    await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 900);
    const g = (await db(p, 'groups')).find((x) => x.name === '5.º A');
    const names = g.students.map((s) => s.name);
    ok(names.includes('Dávila Ruiz Ana') && names.includes('Lozano Peña Beto') && names.includes('Mora Sosa Ceci'), 'la numeración pegada se limpia: ' + names.slice(-3).join(', '));
  } else ok(false, 'no se encontró «Agregar alumnos»');

  // Doble toque en «Guardar» de una hoja: no se abre lo que está debajo
  await scr(p).locator('[data-act="edit-group"]').click(); await W(p, 800);
  await sheet(p).locator('[data-sh="ok"]').dblclick(); await W(p, 900);
  ok(await p.locator('.sheet-wrap.open').count() === 0, 'doble toque en «Guardar» no abre otra hoja');

  // El aviso de «Deshacer» no tapa la hoja de acciones
  await scr(p).locator('[data-student]').first().click(); await W(p, 600);
  const asOpen = await p.locator('.as-wrap.open').count();
  if (asOpen) {
    const toastTop = await p.evaluate(() => { const t = document.getElementById('toast'); t.classList.add('show'); return t.getBoundingClientRect().top; });
    ok(toastTop < 200, 'con una hoja de acciones abierta, el aviso sube (top ' + Math.round(toastTop) + ')');
    await p.evaluate(() => document.getElementById('toast').classList.remove('show'));
    await p.locator('.as-wrap.open .as-btn', { hasText: 'Cancelar' }).click().catch(() => p.mouse.click(10, 10)); await W(p, 600);
  }
  await p.goBack(); await W(p, 500);

  // Equipo extracurricular: «Pasar lista hoy» crea un entrenamiento
  await p.click('#fab'); await W(p, 800);
  await sheet(p).locator('#gr-name').fill('Equipo de prueba');
  await sheet(p).locator('[data-opts="cat"] [data-opt="Equipo extracurricular"]').click();
  await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 1000);
  ok((await scr(p).innerText()).includes('Nuevo entrenamiento'), 'en un equipo el botón dice «Nuevo entrenamiento»');
  await p.goBack(); await W(p, 500);

  // Edad deducida de «3 C» y «Tercero C»
  await p.click('#fab'); await W(p, 800);
  await sheet(p).locator('[data-opts="cat"] [data-opt="Primaria"]').click();
  await sheet(p).locator('#gr-name').fill('3 C'); await W(p, 200);
  ok(await sheet(p).locator('[data-opts="ages"] [data-opt="6-8"]').getAttribute('aria-pressed') === 'true', '«3 C» de primaria marca 6 a 8 años');
  await sheet(p).locator('[data-act="weekdays"]').click();
  ok(await sheet(p).locator('[data-act="weekdays"]').getAttribute('aria-pressed') === 'true', '«Lunes a viernes» se ve marcado');
  await sheet(p).locator('[data-act="weekdays"]').click();
  ok(await sheet(p).locator('[data-opts="days"] [aria-pressed="true"]').count() === 0, 'otro toque quita los días');
  await sheet(p).locator('.sh-x').click(); await W(p, 600);
  if (await p.locator('.as-wrap.open').count()) { await p.locator('.as-wrap.open .as-btn').first().click(); await W(p, 600); }

  // Ejercicios: búsqueda con ✕, recomendados «Agregar a una clase» → cancelar no agrega
  await p.click('#tab-ejercicios'); await W(p);
  await p.fill('#q-ejercicios', 'zzzz'); await W(p, 400);
  ok(await p.locator('#screen-ejercicios .search-x').isVisible(), 'con texto aparece la ✕ para borrar la búsqueda');
  await p.click('#screen-ejercicios .search-x'); await W(p, 400);
  ok((await p.inputValue('#q-ejercicios')) === '' && await p.locator('#screen-ejercicios .grid [data-open-ex]').count() > 0, 'la ✕ borra la búsqueda');
  const before = (await db(p, 'exercises')).length;
  await p.click('[data-act="catalog"]'); await W(p, 900);
  await scr(p).locator('[data-open-cat]', { hasText: 'Rondo 4 contra 1' }).click(); await W(p, 900);
  await scr(p).locator('[data-act="adopt-class"]').click(); await W(p, 700);
  await p.locator('.as-wrap.open .as-btn', { hasText: 'Cancelar' }).click(); await W(p, 700);
  ok((await db(p, 'exercises')).length === before, 'cancelar «Agregar a una clase» no guarda el recomendado');
  await p.goBack(); await W(p, 500); await p.goBack(); await W(p, 500);

  // «Guardar en sección»: la sección nueva se crea ahí mismo (sin otra hoja encima)
  await p.locator('#screen-ejercicios .grid [data-open-ex]').first().click(); await W(p, 900);
  await scr(p).locator('[data-act="sections"]').click(); await W(p, 800);
  await sheet(p).locator('#nsx-name').fill('Días de lluvia');
  await sheet(p).locator('[data-act="new-sec"]').click(); await W(p, 900);
  ok(await p.locator('.sheet-wrap.open').count() === 1 && await sheet(p).locator('.sw-row', { hasText: 'Días de lluvia' }).locator('input:checked').count() === 1, 'la sección nueva se crea en la misma hoja y ya trae el ejercicio');
  await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 600);
  await p.goBack(); await W(p, 500);

  // Filtro «Menos de 10» encuentra ejercicios
  await p.click('#screen-ejercicios [data-act="filters"]'); await W(p, 700);
  await sheet(p).locator('[data-opts="sizes"] [data-opt="s"]').click(); await W(p, 200);
  ok((await sheet(p).locator('[data-sh="ok"]').innerText()) !== 'Ver 0', 'el filtro «Menos de 10» sí encuentra ejercicios (' + await sheet(p).locator('[data-sh="ok"]').innerText() + ')');
  await sheet(p).locator('[data-act="f-clear"]').click(); await W(p, 600);

  // Editar un ejercicio y cambiarle el deporte: la lista cambia de deporte
  await p.locator('#screen-ejercicios [data-open-ex]').first().click(); await W(p, 900);
  const exTitle = (await scr(p).locator('.d-title').innerText()).trim();
  await scr(p).locator('[data-act="edit"]').click(); await W(p, 800);
  const more = sheet(p).locator('[data-more]');
  if ((await more.getAttribute('aria-expanded')) === 'false') await more.click();
  await sheet(p).locator('[data-seg="sport"] [data-val="basquet"]').click();
  await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 1000);
  await p.goBack(); await W(p, 600);
  ok((await p.locator('#screen-ejercicios [data-ref="count"]').innerText()).includes('básquetbol') && await p.locator('#screen-ejercicios [data-open-ex]', { hasText: exTitle }).count() === 1, 'al cambiar el deporte, la lista lo muestra en básquetbol');

  // Modo clase: «Ahora no» y luego «Iniciar» sigue donde iba
  await p.click('#tab-clases'); await W(p, 500);
  await p.locator('.today [data-act="start-class"]').click(); await W(p, 700);
  await p.click('[data-run="toggle"]'); await W(p, 300);
  await p.click('[data-run="next"]'); await W(p, 1300);
  await p.reload(); await W(p, 2200);
  await p.locator('.as-wrap.open .as-btn', { hasText: 'Ahora no' }).click(); await W(p, 700);
  ok((await p.locator('.today [data-act="start-class"]').innerText()).includes('Seguir'), 'la tarjeta dice «Seguir clase»');
  await p.locator('.today [data-act="start-class"]').click(); await W(p, 800);
  ok((await p.locator('[data-ref="step"]').textContent()).includes('Ejercicio 2'), '«Seguir» retoma el mismo bloque');
  // Terminar la de mañana: avisa la fecha y al pasar lista queda de hoy
  for (let i = 0; i < 12 && !(await p.locator('.as-wrap.open').count()); i++) { await p.click('[data-run="next"]'); await W(p, 200); }
  await p.locator('.as-wrap.open .as-btn', { hasText: 'Terminar' }).click(); await W(p, 900);
  ok((await p.locator('.run-done').innerText()).includes('Estaba para el'), 'al terminar avisa que era de otro día');
  await p.click('[data-run="roll"]'); await W(p, 1200);
  const cls = await db(p, 'classes');
  const moved = cls.find((c) => c.id === 'cl3-ej2');
  ok(moved && moved.date === '2026-11-23', 'al pasar lista la clase quedó con fecha de hoy (' + (moved && moved.date) + ')');

  // Reporte de asistencia: la hoja no brinca al cambiar de periodo
  await p.keyboard.press('Escape').catch(() => {}); await W(p, 400);
  for (let i = 0; i < 3 && await p.locator('.sheet-wrap.open').count(); i++) { await sheet(p).locator('.sh-x').click(); await W(p, 600); }
  for (let i = 0; i < 3 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await W(p, 500); }
  await p.click('#tab-grupos'); await W(p);
  await p.locator('[data-open-group]', { hasText: '5.º A' }).click(); await W(p, 800);
  await scr(p).locator('[data-act="report"]').first().click(); await W(p, 900);
  const tops = [];
  for (const v of ['mes', 'trimestre', 'fechas']) { await sheet(p).locator('[data-seg="period"] [data-val="' + v + '"]').click(); await W(p, 500); tops.push(await sheet(p).locator('.sheet').evaluate((el) => Math.round(el.getBoundingClientRect().top))); }
  ok(tops.every((t) => t === tops[0]), 'el reporte no brinca al cambiar de periodo (' + tops.join(', ') + ')');

  ok(p.errs.length === 0, 'sin errores: ' + p.errs.join(' / '));
  await ctx.close();
  await b.close();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
