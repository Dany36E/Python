// Prueba de punta a punta de la versión con pestañas Clases | Ejercicios | Grupos.
const { chromium, devices } = require('playwright');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const fs = require('fs');
const OUT = require('path').join(__dirname, 'out') + '/';
require('fs').mkdirSync(OUT, { recursive: true });
const URL = BASE + 'index.html';
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; };

async function setup(browser, dev, scheme) {
  const ctx = await browser.newContext({ ...dev, deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: true, colorScheme: scheme || 'light' });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', (e) => page.errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errs.push('console: ' + m.text()); });
  await page.clock.install();
  await page.goto(URL);
  await page.waitForSelector('#screen-clases.active');
  await page.waitForTimeout(900);
  return { ctx, page };
}
const wait = (p, ms) => p.waitForTimeout(ms || 450);
const sheet = (p) => p.locator('.sheet-wrap.open').last();
const asBtn = (p, text) => p.locator('.as-wrap.open .as-btn', { hasText: text }).first();
const screen = (p) => p.locator('.stack-screen.in').last();
async function shot(p, name) { await wait(p, 500); await p.screenshot({ path: OUT + name + '.png' }); }

(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await setup(browser, devices['iPhone 13']);
  const p = page;

  // --- Clases: tarjeta de la próxima clase
  ok(await p.locator('.today .today-name').innerText() === 'Coordinación y velocidad', 'tarjeta de próxima clase muestra el ejemplo del entrenador');
  ok((await p.locator('.today .today-meta').innerText()).includes('6 ejercicios') && (await p.locator('.today .today-min').innerText()).includes('50'), 'tarjeta: 6 ejercicios y 50′ (las pausas no cuentan como ejercicio)');
  await shot(p, 'e3_01_clases');

  // --- Detalle con pausa y series
  await p.click('.today-main');
  await wait(p, 700);
  const det = await screen(p).innerText();
  ok(det.includes('Hidratación'), 'el plan muestra la pausa de hidratación');
  ok(/3 × 3′/.test(det), 'el plan muestra las series 3 × 3′');
  await shot(p, 'e3_02_clase');

  // Añadir otra pausa
  await screen(p).locator('[data-act="add-pause"]').click();
  await wait(p);
  await asBtn(p, 'Descanso').click();
  await wait(p, 700);
  ok((await screen(p).innerText()).split('Descanso').length > 1, 'se añadió una pausa «Descanso»');

  // --- Modo clase
  await screen(p).locator('[data-act="start"]').click();
  await wait(p, 700);
  ok(await p.locator('.run.open').count() === 1, 'abre el modo clase');
  ok((await p.locator('[data-ref="step"]').textContent()).includes('Ejercicio 1 de 6'), 'muestra Ejercicio 1 de 6');
  await p.click('[data-run="toggle"]');
  await wait(p, 300);
  await shot(p, 'e3_03_run');
  for (let i = 0; i < 3; i++) { await p.click('[data-run="next"]'); await wait(p, 250); }
  ok(await p.locator('.run-pause').count() === 1, 'la pausa se muestra como bloque de hidratación');
  ok((await p.locator('[data-ref="step"]').innerText()).toLowerCase().includes('pausa'), 'el encabezado dice Pausa');
  await shot(p, 'e3_04_run_pausa');
  for (let i = 0; i < 3; i++) { await p.click('[data-run="next"]'); await wait(p, 300); }
  ok(await p.locator('.run-series i').count() === 3, 'el bloque con series muestra 3 puntos');
  ok((await p.locator('[data-ref="sub"]').innerText()).includes('Serie 1 de 3'), 'muestra Serie 1 de 3');
  await p.clock.fastForward('03:05');
  await wait(p, 400);
  ok((await p.locator('[data-ref="sub"]').innerText()).includes('Descanso'), 'a los 3:05 está en descanso');
  await shot(p, 'e3_05_run_descanso');
  await p.clock.fastForward('01:00');
  await wait(p, 400);
  ok((await p.locator('[data-ref="sub"]').innerText()).includes('Serie 2 de 3'), 'a los 4:05 empieza la serie 2');
  // Ir al final y terminar con confirmación
  for (let i = 0; i < 8 && !(await p.locator('.as-wrap.open').count()); i++) { await p.click('[data-run="next"]'); await wait(p, 250); }
  ok(await p.locator('.as-wrap.open').count() === 1, 'terminar pide confirmación');
  await asBtn(p, 'Terminar clase').click();
  await wait(p, 600);
  ok((await p.locator('.run-done').innerText()).includes('¡Clase terminada!'), 'pantalla de clase terminada');
  await p.click('[data-run="roll"]');
  await wait(p, 900);

  // --- Pase de lista (orden de captura y números)
  const names = await sheet(p).locator('.att-name').allInnerTexts();
  const nums = await sheet(p).locator('.att-n').allInnerTexts();
  ok(names.length === 12 && nums[0] === '1' && nums[11] === '12', 'lista numerada del 1 al 12');
  await sheet(p).locator('[data-att-all]').click();
  await sheet(p).locator('.att-row').nth(1).locator('.att-f').click();
  await sheet(p).locator('.att-row').nth(2).locator('.att-t').click();
  ok((await sheet(p).locator('.att-sum').innerText()).startsWith('11 de 12 asistieron'), 'resumen: 11 de 12 asistieron');
  ok(await sheet(p).locator('.att-row').nth(1).locator('.att-f').getAttribute('aria-label') === names[1] + ': falta', 'botón con etiqueta accesible «Nombre: falta»');
  await shot(p, 'e3_06_lista');
  await sheet(p).locator('[data-sh="ok"]').click();
  await wait(p, 900);
  ok((await screen(p).innerText()).includes('11 de 12'), 'la clase muestra 11 de 12 asistieron');

  // --- Duplicar
  await screen(p).locator('[data-act="duplicate"]').click();
  await wait(p, 600);
  await shot(p, 'e3_07_duplicar');
  await sheet(p).locator('[data-sh="ok"]').click();
  await wait(p, 900);
  const nClasses = await p.evaluate(() => document.querySelectorAll('#screen-clases [data-open-class]').length);
  ok(nClasses >= 2, 'la clase duplicada aparece en Clases (' + nClasses + ')');
  // volver a la raíz
  for (let i = 0; i < 4 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await wait(p, 500); }

  // --- Grupos
  await p.click('#tab-grupos');
  await wait(p);
  await p.click('[data-open-group]');
  await wait(p, 700);
  await shot(p, 'e3_08_grupo');
  ok(await screen(p).locator('[data-act="roll-today"]').count() === 1, 'grupo: botón Pasar lista hoy');
  await screen(p).locator('[data-act="roll-today"]').click();
  await wait(p, 900);
  ok(await sheet(p).locator('.att-row').count() === 12, 'pasar lista hoy abre la lista del grupo');
  await sheet(p).locator('[data-att-all]').click();
  await sheet(p).locator('[data-sh="ok"]').click();
  await wait(p, 900);
  ok((await screen(p).innerText()).includes('Clase del'), 'se creó la clase de hoy en el grupo');

  // Quitar alumno y deshacer
  await screen(p).locator('[data-student]').nth(7).click();
  await wait(p);
  await asBtn(p, 'Quitar del grupo').click();
  await wait(p, 500);
  ok(await screen(p).locator('[data-student]').count() === 11, 'alumno quitado');
  await p.locator('.toast-act').dblclick();
  await wait(p, 900);
  const sids = await screen(p).locator('[data-student]').evaluateAll((els) => els.map((e) => e.dataset.student));
  ok(sids.length === 12 && new Set(sids).size === 12, 'doble toque en «Deshacer» regresa al alumno una sola vez');

  // --- Reporte
  await screen(p).locator('[data-act="report"]').click();
  await wait(p, 600);
  await sheet(p).locator('[data-seg="period"] [data-val="trimestre"]').click();
  await wait(p, 300);
  ok(await sheet(p).locator('[data-ref="tri"]').isVisible(), 'trimestre muestra 1.º/2.º/3.º');
  await sheet(p).locator('#rp-school').fill('Escuela Primaria Benito Juárez');
  await sheet(p).locator('#rp-teacher').fill('Profe Daniel');
  await shot(p, 'e3_09_reporte');
  const prev = await sheet(p).locator('[data-ref="preview"]').innerText();
  ok(/clases? con lista/.test(prev), 'vista previa con clases con lista: ' + prev.replace(/\n/g, ' | '));
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), sheet(p).locator('[data-sh="ok"]').click()]);
  const pdfPath = OUT + 'e3_reporte.pdf';
  await dl.saveAs(pdfPath);
  ok(fs.statSync(pdfPath).size > 3000 && /Asistencia - .+ - Primer trimestre 2026-2027\.pdf/.test(dl.suggestedFilename()), 'PDF del reporte: ' + dl.suggestedFilename());
  await wait(p, 600);
  for (let i = 0; i < 3 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await wait(p, 500); }

  // --- Ejercicios y pizarra
  await p.click('#tab-ejercicios');
  await wait(p);
  await p.click('#screen-ejercicios [data-seg="sport"] [data-val="basquet"]');
  await wait(p, 500);
  ok((await p.locator('#screen-ejercicios [data-ref="count"]').innerText()).includes('básquetbol'), 'cambia a básquetbol');
  await p.locator('#screen-ejercicios [data-open-ex]').first().click();
  await wait(p, 700);
  await screen(p).locator('[data-act="board"]').first().click();
  await wait(p, 700);
  ok(await p.locator('.board-wrap.open').count() === 1, 'abre la pizarra');
  ok(await p.locator('.board-wrap .bt[data-tool]').count() === 6, 'pizarra con 6 herramientas');
  await p.click('.board-wrap [data-tool="arrow"]');
  ok(await p.locator('.board-wrap [data-ref="kind"]').isVisible(), 'al elegir Flecha aparece su tipo');
  ok((await p.locator('.board-wrap [data-seg="akind"]').innerText()).includes('Dribleo'), 'en básquetbol dice Dribleo');
  const box = await p.locator('.board-canvas').boundingBox();
  await p.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.7);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.4, { steps: 6 });
  await p.mouse.up();
  await shot(p, 'e3_10_pizarra');
  await p.click('.board-wrap [data-bd="done"]');
  await wait(p, 600);
  for (let i = 0; i < 3 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await wait(p, 500); }

  // Marcar favorito en un ejemplo de fútbol (lo vuelve «tuyo») para probar el conflicto al importar
  await p.click('#screen-ejercicios [data-seg="sport"] [data-val="futbol"]');
  await wait(p, 400);
  await p.locator('#screen-ejercicios [data-open-ex]', { hasText: 'Pases por porterías de conos' }).click();
  await wait(p, 700);
  await screen(p).locator('[data-act="fav"]').click();
  await wait(p, 600);
  await p.goBack(); await wait(p, 500);

  // --- Respaldo completo
  await p.click('#screen-ejercicios [data-act="backup"]');
  await wait(p, 600);
  await shot(p, 'e3_11_respaldo');
  await sheet(p).locator('[data-bk="full"]').click();
  await wait(p, 2500);
  ok((await sheet(p).innerText()).includes('Archivo listo'), 'el respaldo se prepara');
  const [zdl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), sheet(p).locator('[data-file-share]').click()]);
  const zipPath = OUT + 'e3_respaldo.zip';
  await zdl.saveAs(zipPath);
  ok(/Cancha - Respaldo - .*\.zip/.test(zdl.suggestedFilename()), 'archivo de respaldo: ' + zdl.suggestedFilename());
  await wait(p, 400);
  const last = await p.evaluate(() => localStorage.getItem('cancha:last-backup') || Object.keys(localStorage).filter((k) => k.indexOf('backup') >= 0).map((k) => localStorage.getItem(k))[0]);
  ok(!!last, 'guarda la fecha del último respaldo');
  ok(p.errs.length === 0, 'sin errores en iPhone: ' + p.errs.join(' / '));
  await ctx.close();

  // --- Importar en otro iPad (datos nuevos) con un conflicto
  const b = await setup(browser, devices['iPad (gen 7)']);
  const q = b.page;
  await q.click('#tab-ejercicios'); await wait(q);
  await q.locator('#screen-ejercicios [data-open-ex]', { hasText: 'Pases por porterías de conos' }).click();
  await wait(q, 700);
  await screen(q).locator('[data-act="edit"]').click();
  await wait(q, 700);
  await sheet(q).locator('#ex-title').fill('Porterías mías');
  await sheet(q).locator('[data-sh="ok"]').click();
  await wait(q, 900);
  await q.goBack(); await wait(q, 500);
  await q.click('#screen-ejercicios [data-act="backup"]');
  await wait(q, 600);
  await Promise.all([q.waitForEvent('filechooser').then((fc) => fc.setFiles(zipPath)), sheet(q).locator('[data-bk="import"]').click()]);
  await wait(q, 1500);
  const imp = await sheet(q).innerText();
  ok(imp.includes('como copia'), 'importar detecta el ejemplo cambiado por los dos: ' + imp.replace(/\n/g, ' | '));
  await shot(q, 'e3_12_importar');
  await sheet(q).locator('[data-sh="ok"]').click();
  await wait(q, 1500);
  const titles = await q.locator('#screen-ejercicios .card .title').allInnerTexts();
  ok(titles.includes('Porterías mías') && titles.includes('Pases por porterías de conos (copia)'), 'se conservan las dos versiones: ' + titles.join(', '));
  await q.click('#tab-clases'); await wait(q, 500);
  const clsText = await q.locator('#screen-clases').innerText();
  ok(clsText.includes('Coordinación y velocidad'), 'la clase importada aparece');
  await q.click('#tab-grupos'); await wait(q, 500);
  await q.click('[data-open-group]'); await wait(q, 700);
  ok((await screen(q).innerText()).includes('Clase del'), 'el grupo trae la clase de hoy con su lista');
  await shot(q, 'e3_13_ipad_grupo');
  ok(q.errs.length === 0, 'sin errores en iPad: ' + q.errs.join(' / '));
  await b.ctx.close();

  // --- Modo oscuro en iPad: pantallas principales
  const d = await setup(browser, devices['iPad (gen 7)'], 'dark');
  await shot(d.page, 'e3_14_ipad_dark_clases');
  await d.page.click('.today-main'); await wait(d.page, 700);
  await shot(d.page, 'e3_15_ipad_dark_clase');
  await d.page.locator('.stack-screen.in').last().locator('[data-act="start"]').click(); await wait(d.page, 700);
  await d.page.click('[data-run="toggle"]');
  for (let i = 0; i < 2; i++) { await d.page.click('[data-run="next"]'); await wait(d.page, 250); }
  await shot(d.page, 'e3_16_ipad_dark_pausa');
  ok(d.page.errs.length === 0, 'sin errores en modo oscuro: ' + d.page.errs.join(' / '));
  await d.ctx.close();

  await browser.close();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
