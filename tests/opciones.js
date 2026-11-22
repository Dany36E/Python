// Formularios con opciones para tocar y los mismos filtros al buscar: ejercicio nuevo con varias
// opciones por grupo, filtros (edad, alumnos, material que tienes…), Recomendados, grupo con días
// y hora, clase con temas y duración, y el selector de ejercicios que filtra por el grupo.
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
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.clock.install({ time: new Date('2026-11-21T10:00:00') });
  await p.goto(BASE + 'index.html');
  await p.waitForSelector('#screen-clases.active'); await W(p, 1300);
  const scr = () => p.locator('.stack-screen.in').last();
  const sheet = () => p.locator('.sheet-wrap.open').last();
  const opt = (k, v) => sheet().locator('[data-opts="' + k + '"] [data-opt="' + v + '"]');
  const gridCount = () => p.locator('#screen-ejercicios .grid [data-open-ex]').count();

  // --- Ejercicio nuevo: todo se elige tocando
  await p.click('#tab-ejercicios'); await W(p);
  await p.click('#fab'); await W(p, 800);
  await sheet().locator('#ex-title').fill('Pases en cuadro con conos');
  await sheet().locator('[data-tag="Pase"]').click();
  await sheet().locator('[data-tag="Control"]').click();
  await opt('dur', '15').click();
  ok(await sheet().locator('#ex-duration').inputValue() === '15', 'el chip de 15 min pone la duración');
  await sheet().locator('[data-step="1"]').click();
  ok(await opt('dur', '20').getAttribute('aria-pressed') === 'true', 'el + del contador marca el chip de 20 min');
  await sheet().locator('[data-step="-1"]').click();
  await opt('ages', '9-10').click(); await opt('ages', '11-12').click();
  ok((await sheet().locator('[data-fb-val="ages"]').innerText()) === '9 a 12 años', 'edades seguidas se juntan: 9 a 12 años');
  await opt('sizes', 'l').click(); await opt('sizes', 'xl').click();
  ok((await sheet().locator('[data-fb-val="sizes"]').innerText()) === '21 a 40', 'alumnos: 21 a 40');
  await opt('sizes', 'xxl').click();
  ok((await sheet().locator('[data-fb-val="sizes"]').innerText()) === 'Más de 20', 'alumnos: Más de 20');
  await opt('forms', 'pair').click(); await opt('forms', 'rows').click();
  await opt('spaces', 'chico').click();
  await opt('gear', 'balon').click(); await opt('gear', 'cono').click();
  await opt('gear', 'nada').click();
  ok(await opt('gear', 'balon').getAttribute('aria-pressed') === 'false', '«Sin material» apaga los demás');
  await opt('gear', 'balon').click(); await opt('gear', 'cono').click();
  ok(await opt('gear', 'nada').getAttribute('aria-pressed') === 'false', 'elegir material apaga «Sin material»');
  await sheet().screenshot({ path: OUT + 'opciones-ejercicio.png' });
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 1000);
  await p.locator('#screen-ejercicios [data-open-ex]', { hasText: 'Pases en cuadro con conos' }).click(); await W(p, 900);
  const det = await scr().innerText();
  ok(/Pase/.test(det) && /Control/.test(det), 'la ficha muestra los dos tipos');
  ok(det.includes('15 min') && det.includes('9 a 12 años') && det.includes('Más de 20'), 'la ficha muestra duración, edad y alumnos');
  ok(/Organización:\s*en parejas o en filas/.test(det), 'la ficha muestra la organización');
  ok(await scr().locator('.pill', { hasText: 'Balones' }).count() === 1 && await scr().locator('.pill', { hasText: 'Conos' }).count() === 1, 'el material aparece como etiquetas');
  await scr().locator('[data-act="edit"]').click(); await W(p, 800);
  ok(await opt('ages', '11-12').getAttribute('aria-pressed') === 'true' && await opt('forms', 'rows').getAttribute('aria-pressed') === 'true', 'al editar, las opciones siguen elegidas');
  ok(await sheet().locator('[data-tag="Control"]').getAttribute('aria-pressed') === 'true', 'al editar, los dos tipos siguen elegidos');
  await sheet().locator('.sh-x').click(); await W(p, 700);
  await p.goBack(); await W(p, 600);

  // --- Filtros con las mismas opciones
  const total = await gridCount();
  await p.click('#screen-ejercicios [data-act="filters"]'); await W(p, 700);
  await opt('gear', 'nada').click(); await W(p, 200);
  const nadaLabel = await sheet().locator('[data-sh="ok"]').innerText();
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 700);
  const sinMaterial = await gridCount();
  ok(sinMaterial < total && nadaLabel === 'Ver ' + sinMaterial, 'filtro «Sin material» (' + total + ' → ' + sinMaterial + ', el botón decía «' + nadaLabel + '»)');
  ok((await p.locator('#screen-ejercicios [data-unfilter]').innerText()).includes('Sin material'), 'chip activo «Sin material»');
  await p.click('#screen-ejercicios [data-act="filters"]'); await W(p, 700);
  await opt('gear', 'cono').click(); await opt('gear', 'balon').click(); await W(p, 200);
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 700);
  const conBalonCono = await gridCount();
  ok(conBalonCono > sinMaterial && conBalonCono < total, 'con balones y conos salen más que sin material y menos que todos (' + conBalonCono + ')');
  ok(await p.locator('#screen-ejercicios [data-open-ex]', { hasText: 'Pases en cuadro con conos' }).count() === 1, 'el ejercicio nuevo sale con balones y conos');
  await p.click('#screen-ejercicios [data-unfilter]'); await W(p, 500);
  await p.click('#screen-ejercicios [data-act="filters"]'); await W(p, 700);
  await opt('sizes', 's').click(); await W(p, 200);
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 700);
  const chicos = await gridCount();
  ok(chicos < total && await p.locator('#screen-ejercicios [data-open-ex]', { hasText: 'Pases en cuadro con conos' }).count() === 0, 'grupos de menos de 10: ' + chicos + ' y no sale el de más de 20');
  await p.click('#screen-ejercicios [data-unfilter]'); await W(p, 500);
  ok(await gridCount() === total, 'quitar el filtro regresa todo');
  // Tipos arriba: se prenden varios a la vez
  await p.click('#screen-ejercicios [data-chip="t:Pase"]'); await W(p, 400);
  const soloPase = await gridCount();
  await p.click('#screen-ejercicios [data-chip="t:Calentamiento"]'); await W(p, 400);
  const paseYCal = await gridCount();
  ok(soloPase > 0 && paseYCal > soloPase, 'Pase + Calentamiento juntos muestran más (' + soloPase + ' → ' + paseYCal + ')');
  await p.click('#screen-ejercicios [data-chip="all"]'); await W(p, 400);
  ok(await gridCount() === total, '«Todos» quita los tipos');
  // Buscar por organización
  await p.fill('#q-ejercicios', 'parejas'); await W(p, 500);
  ok(await p.locator('#screen-ejercicios [data-open-ex]', { hasText: 'Pases en cuadro con conos' }).count() === 1, 'buscar «parejas» encuentra el ejercicio por su organización');
  await p.fill('#q-ejercicios', ''); await W(p, 400);

  // --- Recomendados con los mismos filtros
  await p.click('[data-act="catalog"]'); await W(p, 900);
  const recTotal = await scr().locator('[data-open-cat]').count();
  await scr().locator('[data-act="cat-filters"]').click(); await W(p, 700);
  await opt('ages', '4-5').click(); await W(p, 200);
  const recLabel = await sheet().locator('[data-sh="ok"]').innerText();
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 700);
  const recKinder = await scr().locator('[data-open-cat]').count();
  ok(recKinder > 0 && recKinder < recTotal && recLabel === 'Ver ' + recKinder, 'Recomendados para 4 a 5 años: ' + recTotal + ' → ' + recKinder);
  await scr().locator('[data-unfilter]').first().click(); await W(p, 500);
  ok(await scr().locator('[data-open-cat]').count() === recTotal, 'quitar el filtro en Recomendados regresa todo');
  await p.goBack(); await W(p, 600);

  // --- Grupo nuevo: escuela, edad deducida, días, hora, duración y lugar
  await p.click('#tab-grupos'); await W(p);
  await p.click('#fab'); await W(p, 800);
  await sheet().locator('#gr-name').fill('4.º B');
  await sheet().locator('[data-seg="gsport"] [data-val="futbol"]').click();
  await opt('cat', 'Primaria').click(); await W(p, 200);
  ok(await opt('ages', '9-10').getAttribute('aria-pressed') === 'true', '«4.º B» de primaria marca 9 a 10 años solo');
  await opt('sizes', 'm').click();
  await opt('days', '2').click(); await opt('days', '4').click();
  await sheet().locator('#gr-time').fill('16:30');
  await opt('classMin', '50').click();
  await opt('place', 'Patio').click();
  ok((await sheet().locator('[data-ref="sched-val"]').innerText()) === 'Mar y Jue 16:30', 'el horario se arma solo: Mar y Jue 16:30');
  await sheet().screenshot({ path: OUT + 'opciones-grupo.png' });
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 1000);
  const gtxt = await scr().innerText();
  ok(gtxt.includes('Mar y Jue 16:30') && gtxt.includes('Patio'), 'el grupo guarda horario y lugar');

  // --- Clase nueva desde el grupo: fecha del grupo, duración, temas que le ponen nombre
  await scr().locator('[data-act="new-class"]').first().click(); await W(p, 900);
  ok(await sheet().locator('#cl-date').inputValue() === '2026-11-24', 'la clase toma el próximo martes del grupo');
  ok(await opt('target', '50').getAttribute('aria-pressed') === 'true', 'la duración viene del grupo (50 min)');
  ok(await sheet().locator('[data-gpick]', { hasText: '4.º B' }).getAttribute('aria-pressed') === 'true', 'el grupo viene elegido como opción');
  ok(await sheet().locator('[data-focus="Calentamiento"]').count() === 0, 'calentamiento y cierre no son temas (van siempre)');
  await sheet().locator('[data-focus="Pase"]').click();
  await sheet().locator('[data-focus="Control"]').click();
  ok(await sheet().locator('#cl-name').inputValue() === 'Pase y control', 'los temas le ponen nombre: «Pase y control»');
  await opt('date', '2026-11-24').click(); await opt('date', '2026-11-26').click();
  ok(await sheet().locator('#cl-date').inputValue() === '2026-11-26', 'quitar «Mar 24» y tocar «Jue 26» cambia la fecha');
  await sheet().screenshot({ path: OUT + 'opciones-clase.png' });
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 1800);
  // El selector se abre solo, filtrado para el grupo y los temas
  ok(await sheet().locator('[data-pchip="group"]').getAttribute('aria-pressed') === 'true', 'el selector viene filtrado «Para 4.º B»');
  const secs = await sheet().locator('.pk-sec').allInnerTexts();
  ok(secs[0] === 'Calentamiento' && secs.includes('Pase y control'), 'la lista sigue la clase: ' + secs.join(' / '));
  ok(await sheet().locator('[data-pick-ex^="cat:"]').count() > 0, 'también ofrece recomendados');
  const recName = (await sheet().locator('[data-pick-ex^="cat:"] .t1').first().innerText()).trim();
  await sheet().locator('[data-pick-ex^="cat:"]').first().click();
  await sheet().locator('[data-pick-ex="' + (await sheet().locator('[data-pick-ex]:not([data-pick-ex^="cat:"])').first().getAttribute('data-pick-ex')) + '"]').click();
  ok(/de 50 min · faltan \d+/.test(await sheet().locator('[data-ref="time"]').innerText()), 'la barra de abajo dice cuánto falta para los 50 min');
  await sheet().screenshot({ path: OUT + 'opciones-selector.png' });
  await sheet().locator('[data-pchip="all"]').click(); await W(p, 300);
  await sheet().locator('[data-pick-ex]', { hasText: 'Pases en cuadro con conos' }).click();
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 1500);
  const ctext = await scr().innerText();
  // Al compartir la clase salen las opciones aunque no se hayan escrito detalles
  await scr().locator('[data-act="share"]').click(); await W(p, 600);
  const wa = decodeURIComponent((await p.locator('.as-wrap.open a[href*="wa.me"]').getAttribute('href')).split('text=')[1]);
  ok(wa.includes('Material: Balones y conos') && /en parejas o en filas/.test(wa), 'la clase por WhatsApp lleva material y organización elegidos');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.locator('.as-wrap.open .as-btn', { hasText: 'Crear PDF' }).click()]);
  await dl.saveAs(OUT + 'opciones-clase.pdf');
  ok(require('fs').statSync(OUT + 'opciones-clase.pdf').size > 3000, 'PDF de la clase con ejercicios llenados con opciones');
  await W(p, 600);
  ok(ctext.includes(recName), 'el recomendado quedó en la clase: ' + recName);
  ok(/faltan \d+ de 50 min|min de más|justo 50 min/.test(ctext), 'la clase compara su tiempo con los 50 min');
  await p.goBack(); await W(p, 500);
  await p.goBack(); await W(p, 500);
  await p.click('#tab-ejercicios'); await W(p, 500);
  ok(await p.locator('#screen-ejercicios [data-open-ex]', { hasText: recName }).count() === 1, 'y también quedó en tus ejercicios');

  // --- Equipo extracurricular: entrenamiento de lunes a viernes por dos semanas
  await p.click('#tab-grupos'); await W(p);
  await p.click('#fab'); await W(p, 800);
  await sheet().locator('#gr-name').fill('Selección de fútbol');
  await sheet().locator('[data-seg="gsport"] [data-val="futbol"]').click();
  await opt('cat', 'Equipo extracurricular').click();
  await sheet().locator('[data-act="weekdays"]').click();
  await sheet().locator('#gr-time').fill('17:00');
  ok((await sheet().locator('[data-ref="sched-val"]').innerText()) === 'Lun a Vie 17:00', '«Lunes a viernes» marca los cinco días: Lun a Vie 17:00');
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 1000);
  await scr().locator('[data-act="new-class"]').first().click(); await W(p, 900);
  ok((await sheet().locator('.sh-title').innerText()) === 'Nuevo entrenamiento', 'con un equipo, la hoja dice «Nuevo entrenamiento»');
  ok(await sheet().locator('[data-seg="kind"] [data-val="entrenamiento"]').getAttribute('aria-checked') === 'true', 'y viene marcado «Entrenamiento»');
  await sheet().locator('[data-days="wk"]').click(); await W(p, 200);
  ok(await sheet().locator('[data-opts="date"] [aria-pressed="true"]').count() === 5, '«Lunes a viernes» elige los cinco días');
  await opt('weeks', '2').click(); await W(p, 200);
  ok((await sheet().locator('[data-ref="dates-note"]').innerText()).includes('10 entrenamientos'), 'dos semanas: se crean 10 entrenamientos');
  ok((await sheet().locator('[data-sh="ok"]').innerText()) === 'Guardar (10)', 'el botón dice «Guardar (10)»');
  await sheet().locator('[data-focus="Tiro"]').click();
  await sheet().screenshot({ path: OUT + 'opciones-entrenamiento.png' });
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 2500);
  const serie = await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const q = r.result.transaction('classes').objectStore('classes').getAll(); q.onsuccess = () => res(q.result.filter((c) => c.serie && c.kind === 'entrenamiento').map((c) => c.date).sort()); }; }));
  ok(serie.length === 10 && serie[0] === '2026-11-23' && serie[9] === '2026-12-04' && !serie.includes('2026-11-28'), 'se crearon 10 entrenamientos de lunes a viernes: ' + serie.join(', '));
  ok(await sheet().locator('.pk-sec').count() > 0, 'se abre el selector para el primer día');
  await sheet().locator('[data-pick-ex]').first().click();
  await sheet().locator('[data-sh="ok"]').click(); await W(p, 1200);
  ok(await p.locator('#toast .toast-act', { hasText: 'Copiar a los otros días' }).count() === 1, 'al agregar ofrece copiar a los otros días');
  await p.locator('#toast .toast-act').click(); await W(p, 700);
  await p.locator('.as-wrap.open .as-btn', { hasText: 'Copiar plan' }).click(); await W(p, 2500);
  const planes = await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const q = r.result.transaction('classes').objectStore('classes').getAll(); q.onsuccess = () => res(q.result.filter((c) => c.serie && c.kind === 'entrenamiento').map((c) => (c.items || []).length)); }; }));
  ok(planes.length === 10 && planes.every((n) => n === 1), 'los 10 días quedaron con el mismo plan');
  const det2 = await scr().innerText();
  ok(/Entrenamiento · lunes, 23 de noviembre/i.test(det2) && det2.includes('Día 1 de 10'), 'la ficha dice «Entrenamiento» y «Día 1 de 10»');
  ok(det2.includes('Iniciar entrenamiento'), 'botón «Iniciar entrenamiento»');
  await p.goBack(); await W(p, 500); await p.goBack(); await W(p, 500);

  // --- Grupo viejo: el horario escrito a mano se lee como días y hora
  await p.click('#tab-grupos'); await W(p);
  await p.locator('[data-open-group]', { hasText: '2.º B' }).click(); await W(p, 800);
  await scr().locator('[data-act="edit-group"]').click(); await W(p, 800);
  ok(await opt('days', '2').getAttribute('aria-pressed') === 'true' && await opt('days', '4').getAttribute('aria-pressed') === 'true', '«Mar y Jue 11:00» marca martes y jueves');
  ok(await sheet().locator('#gr-time').inputValue() === '11:00', 'y la hora 11:00');
  ok(await opt('ages', '13-14').getAttribute('aria-pressed') === 'true', '«2.º B» de secundaria marca 13 a 14 años');
  await sheet().locator('.sh-x').click(); await W(p, 600);

  // --- iPhone: las opciones caben sin desbordar
  const ph = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, serviceWorkers: 'block' });
  await ph.addInitScript(() => { try { localStorage.setItem('cancha:onboarded', '1'); } catch (e) { /* */ } });
  const q = await ph.newPage();
  await q.goto(BASE + 'index.html'); await q.waitForSelector('#screen-clases.active'); await W(q, 1300);
  await q.click('#tab-ejercicios'); await W(q);
  await q.click('#fab'); await W(q, 900);
  const over = await q.evaluate(() => { const s = document.querySelector('.sheet-wrap.open .sheet-body'); return s.scrollWidth - s.clientWidth; });
  ok(over <= 0, 'en iPhone el formulario no se sale de lado (' + over + ' px)');
  await q.locator('.sheet-wrap.open [data-fb="ages"]').screenshot({ path: OUT + 'opciones-iphone-edad.png' });
  await ph.close();

  // --- iPad viejo (Safari sin color-mix): los colores de respaldo se aplican
  const old = await b.newContext({ ...devices['iPad Pro 11'], deviceScaleFactor: 1, serviceWorkers: 'block' });
  await old.addInitScript(() => { try { localStorage.setItem('cancha:onboarded', '1'); } catch (e) { /* */ } });
  await old.route('**/app/styles.css', async (route) => {
    const r = await route.fetch();
    const css = (await r.text()).replace('@supports not (color: color-mix(in srgb, red 50%, blue))', '@supports (display: block)').replace(/color-mix\(/g, 'colour-mix(');
    route.fulfill({ response: r, body: css });
  });
  const o = await old.newPage();
  await o.goto(BASE + 'index.html'); await o.waitForSelector('#screen-clases.active'); await W(o, 1300);
  await o.click('#tab-ejercicios'); await W(o);
  await o.click('#screen-ejercicios [data-act="filters"]'); await W(o, 700);
  await o.locator('.sheet-wrap.open [data-opts="ages"] [data-opt="9-10"]').click();
  await o.locator('.sheet-wrap.open [data-sh="ok"]').click(); await W(o, 700);
  const bg = await o.locator('#screen-ejercicios .chip.on-chip').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  ok(/rgba\(11, 122, 59, 0\.14\)/.test(bg), 'en un iPad sin color-mix el filtro activo sigue teniendo color (' + bg + ')');
  await old.close();

  ok(errs.length === 0, 'sin errores: ' + errs.join(' / '));
  await b.close();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
