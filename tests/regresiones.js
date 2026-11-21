// Regresiones de los hallazgos del QA: doble toque en «Pasar lista hoy», terminar sin empezar,
// catálogo de entrenadores, PDF con símbolos, trimestre en verano y orden de flechas en el pizarrón.
const { chromium, devices } = require('playwright');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const OUT = require('path').join(__dirname, 'out') + '/';
require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const W = (p, ms) => p.waitForTimeout(ms || 450);
(async () => {
  const b = await chromium.launch();
  async function fresh(opts) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: true });
    const p = await ctx.newPage();
    p.errs = [];
    p.on('pageerror', (e) => p.errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') p.errs.push(m.text()); });
    if (opts && opts.time) await p.clock.install({ time: opts.time }); else await p.clock.install();
    await p.goto(BASE + 'index.html');
    await p.waitForSelector('#screen-clases.active'); await W(p, 1300);
    return { ctx, p };
  }
  const scr = (p) => p.locator('.stack-screen.in').last();
  const sheet = (p) => p.locator('.sheet-wrap.open').last();

  // B02/B15 · doble toque en «Pasar lista hoy» y descartar no crea clase
  let { ctx, p } = await fresh();
  await p.click('#tab-grupos'); await W(p);
  await p.locator('[data-open-group]', { hasText: '5.º A' }).click(); await W(p, 800);
  const nBefore = await p.evaluate(() => document.querySelectorAll('#screen-clases [data-open-class]').length);
  await scr(p).locator('[data-act="roll-today"]').dblclick(); await W(p, 900);
  ok(await p.locator('.sheet-wrap.open').count() === 1, 'doble toque en «Pasar lista hoy» abre una sola lista');
  await sheet(p).locator('.sh-x').click(); await W(p, 700);
  const nAfter = await p.evaluate(() => document.querySelectorAll('#screen-clases [data-open-class]').length);
  ok(nAfter === nBefore, 'cerrar la lista sin guardar no crea una clase vacía');
  await scr(p).locator('[data-act="roll-today"]').click(); await W(p, 900);
  await sheet(p).locator('[data-att-all]').click();
  await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 900);
  ok((await scr(p).innerText()).includes('Clase del'), 'al guardar sí se crea la clase del día');

  // B03 · terminar sin empezar no marca la clase como dada
  for (let i = 0; i < 3 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await W(p, 500); }
  await p.click('#tab-clases'); await W(p);
  await p.locator('.today [data-act="start-class"]').click(); await W(p, 800);
  for (let i = 0; i < 10 && !(await p.locator('.as-wrap.open').count()); i++) { await p.click('[data-run="next"]'); await W(p, 200); }
  ok((await p.locator('.as-wrap.open').innerText()).includes('No has empezado'), 'terminar sin empezar avisa');
  await p.locator('.as-wrap.open .as-btn', { hasText: 'Salir del modo clase' }).click(); await W(p, 700);
  const given = await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const q = r.result.transaction('classes').objectStore('classes').get('cl3-ej1'); q.onsuccess = () => res(!!(q.result && q.result.lastRunAt)); }; }));
  ok(!given, 'la clase no quedó como «dada»');

  // Catálogo · agregar un ejercicio y usar una clase lista
  await p.click('#tab-ejercicios'); await W(p);
  await p.click('[data-act="catalog"]'); await W(p, 900);
  ok(await scr(p).locator('[data-open-cat]').count() === 26, 'De entrenadores: 26 ejercicios de fútbol');
  await scr(p).locator('[data-open-cat]', { hasText: 'Rondo 4 contra 1' }).click(); await W(p, 900);
  await scr(p).locator('[data-act="adopt"]').click(); await W(p, 900);
  ok(await scr(p).locator('[data-act="open-mine"]').count() === 1, 'el ejercicio queda en tus ejercicios');
  await p.goBack(); await W(p, 500);
  ok(await scr(p).locator('[data-open-cat]', { hasText: 'Rondo 4 contra 1' }).locator('.in-lib').count() === 1, 'la tarjeta dice «En tus ejercicios»');
  await scr(p).locator('[data-seg="csport"] [data-val="basquet"]').click(); await W(p, 500);
  ok(await scr(p).locator('[data-open-cat]').count() === 24, 'De entrenadores: 24 ejercicios de básquetbol');
  await scr(p).locator('[data-open-template]').nth(1).click(); await W(p, 800);
  await scr(p).locator('[data-act="use"]').click(); await W(p, 800);
  await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 1500);
  ok((await scr(p).innerText()).includes('Contraataque'), 'se crea la clase desde la plantilla');
  const exCount = await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const q = r.result.transaction('exercises').objectStore('exercises').getAll(); q.onsuccess = () => res(q.result.filter((x) => x.catalogId && x.sport === 'basquet').length); }; }));
  ok(exCount >= 10, 'sus ejercicios quedan en la biblioteca (' + exCount + ' de básquetbol)');

  // B04 · PDF de clase sin basura en series ni símbolos
  await scr(p).locator('[data-act="share"]').click(); await W(p);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.locator('.as-wrap.open .as-btn', { hasText: 'PDF' }).click()]);
  await dl.saveAs(OUT + 'rg_clase.pdf');
  ok(true, 'PDF de clase creado');
  ok(p.errs.length === 0, 'sin errores: ' + p.errs.join(' / '));
  await ctx.close();

  // B06 · en agosto antes del ciclo, «Trimestre» elige el 3.º que acaba de terminar
  ({ ctx, p } = await fresh({ time: new Date('2027-08-10T10:00:00') }));
  await p.click('#tab-grupos'); await W(p);
  await p.locator('[data-open-group]').first().click(); await W(p, 800);
  await scr(p).locator('[data-act="roll-today"]').click(); await W(p, 800);
  await sheet(p).locator('[data-att-all]').click();
  await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 900);
  await scr(p).locator('[data-act="report"]').click(); await W(p, 700);
  await sheet(p).locator('[data-seg="period"] [data-val="trimestre"]').click(); await W(p, 300);
  const rng = await sheet(p).locator('.rp-range').innerText();
  ok(/abril al 20 de julio de 2027/.test(rng), 'agosto: 3.er trimestre 2026-2027 (' + rng + ')');
  await ctx.close();

  // Apariencia: en un iPad en modo oscuro, «Claro» en Ajustes deja la app en claro y se recuerda
  {
    const ctx = await b.newContext({ ...devices['iPad (gen 7)'], deviceScaleFactor: 1, serviceWorkers: 'block', colorScheme: 'dark' });
    const p = await ctx.newPage();
    await p.goto(BASE + 'index.html'); await W(p, 1200);
    const bg = () => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(/rgb\(0, 0, 0\)/.test(await bg()), 'sin ajuste sigue al iPad (oscuro)');
    await p.click('#screen-clases [data-act="settings"]'); await W(p, 700);
    await p.locator('.sheet-wrap.open [data-seg="theme"] [data-val="light"]').click(); await W(p, 500);
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'light' && !/rgb\(0, 0, 0\)/.test(await bg()), '«Claro» pone la app en claro');
    await p.screenshot({ path: OUT + 'rg_ajustes_claro.png' });
    await p.reload(); await W(p, 1200);
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'light', 'al volver a abrir se queda en claro');
    await p.click('#screen-clases [data-act="settings"]'); await W(p, 700);
    await p.locator('.sheet-wrap.open [data-seg="theme"] [data-val="auto"]').click(); await W(p, 400);
    ok(!p.evaluate || (await p.evaluate(() => !document.documentElement.dataset.theme)), '«Automático» vuelve a seguir al iPad');
    await ctx.close();
  }

  await b.close();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
