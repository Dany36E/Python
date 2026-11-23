// Revisión crítica (código, datos y UX): que no regresen los fallos que se encontraron.
// Fecha que cambia con la app abierta, toques rápidos, alumnos dados de baja, archivos de plan viejos o propios,
// clases borradas que no regresan, días del grupo y el aviso de «versión anterior» para el jefe.
const { chromium, devices } = require('playwright');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const OUT = require('path').join(__dirname, 'out') + '/';
require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const W = (p, ms) => p.waitForTimeout(ms || 450);
(async () => {
  const b = await chromium.launch();
  async function open(time) {
    const ctx = await b.newContext({ ...devices['iPad Pro 11'], deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: true, timezoneId: 'America/Mexico_City' });
    await ctx.addInitScript(() => { try { localStorage.setItem('cancha:onboarded', '1'); } catch (e) { /* */ } });
    const p = await ctx.newPage();
    p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
    await p.clock.install({ time: time || new Date('2026-11-23T09:00:00-06:00') });
    await p.goto(BASE + 'index.html');
    await p.waitForSelector('#screen-clases.active'); await W(p, 1300);
    return { ctx, p };
  }
  const scr = (p) => p.locator('.stack-screen.in').last();
  const sheet = (p) => p.locator('.sheet-wrap.open').last();
  const db = (p, store) => p.evaluate((st) => new Promise((res) => { const r = indexedDB.open('cancha'); r.onsuccess = () => { const q = r.result.transaction(st).objectStore(st).getAll(); q.onsuccess = () => res(q.result); }; }), store);
  const back = async (p) => { for (let i = 0; i < 4 && await p.locator('.stack-screen.in').count(); i++) { await p.goBack(); await W(p, 450); } };
  async function download(p, name) {
    await W(p, 2500);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), sheet(p).locator('[data-file-share]').click()]);
    const f = OUT + name; await dl.saveAs(f); await W(p, 600);
    return f;
  }
  async function openFile(p, f) {
    await back(p);
    await Promise.all([p.waitForEvent('filechooser').then((fc) => fc.setFiles(f)), p.locator('#screen-clases [data-act="open-file"]').first().click()]);
    await W(p, 1500);
  }

  // 1. La app abierta de un día para otro: al volver dice la fecha nueva
  {
    const { ctx, p } = await open(new Date('2026-11-23T23:58:00-06:00'));
    await p.clock.runFor(6 * 60 * 1000);
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await W(p, 600);
    ok((await p.locator('#screen-clases [data-ref="count"]').innerText()) === 'Martes, 24 de noviembre', 'a medianoche la pestaña Clases cambia a la fecha nueva');
    await ctx.close();
  }

  // 2. Toques rápidos en «+1 min» no se pierden
  {
    const { ctx, p } = await open();
    const cid = await p.locator('#screen-clases [data-open-class]').first().getAttribute('data-open-class');
    await p.locator('#screen-clases [data-open-class]').first().click(); await W(p, 800);
    await scr(p).locator('[data-act="toggle-edit"]').first().click(); await W(p, 500);
    const before = (await db(p, 'classes')).find((c) => c.id === cid).items[0].min;
    const sel = '.stack-screen.in [data-act="min"][data-i="0"][data-d="1"]';
    for (let k = 0; k < 12; k++) { await p.evaluate((s) => document.querySelector(s).click(), sel); await p.waitForTimeout(25); }
    await W(p, 1500);
    const after = (await db(p, 'classes')).find((c) => c.id === cid).items[0].min;
    ok(after === before + 12, '12 toques rápidos suman 12 minutos (' + before + ' → ' + after + ')');
    await ctx.close();
  }

  // 3. Quitar a un alumno con asistencias: sigue en el reporte como «(baja)»
  {
    const { ctx, p } = await open();
    await p.click('#tab-grupos'); await W(p);
    await p.locator('[data-open-group]').first().click(); await W(p, 800);
    await scr(p).locator('[data-act="roll-today"]').click(); await W(p, 900);
    await sheet(p).locator('[data-att-all]').click();
    await sheet(p).locator('[data-sh="ok"]').click(); await W(p, 1200);
    const first = (await scr(p).locator('.st-row .t1').first().innerText()).trim();
    await scr(p).locator('.st-row').first().click(); await W(p, 500);
    await p.locator('.as-wrap.open .as-btn', { hasText: 'Quitar del grupo' }).click(); await W(p, 900);
    const g = (await db(p, 'groups')).find((x) => x.students.some((s) => s.name === first));
    ok(g && g.students.find((s) => s.name === first).left, 'el alumno con asistencias queda dado de baja (no se borra)');
    ok(!(await scr(p).locator('.st-list').innerText()).includes(first), 'ya no sale en la lista del grupo');
    await scr(p).locator('[data-act="report"]').click(); await W(p, 900);
    const [pdf] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), sheet(p).locator('[data-sh="ok"]').click()]);
    await pdf.saveAs(OUT + 'rev-reporte.pdf'); await W(p, 600);
    const raw = require('fs').readFileSync(OUT + 'rev-reporte.pdf', 'latin1');
    ok(/baja\\?\)/.test(raw), 'pero sí en el reporte de asistencia en PDF, como «(baja)»');
    ok(p.errs.length === 0, 'sin errores: ' + p.errs.join(' / '));
    await ctx.close();
  }

  // 4. Plan: archivo propio del jefe, archivo viejo, clase borrada, días del grupo y «versión anterior»
  {
    const A = await open(); const pa = A.p;
    await pa.locator('#screen-clases .tpl-new[data-act="new-plan"]').click(); await W(pa, 800);
    await sheet(pa).locator('#pl-name').fill('4.º de primaria');
    await sheet(pa).locator('[data-opts="days"] [data-opt="2"]').click();
    await sheet(pa).locator('[data-opts="days"] [data-opt="4"]').click();
    await sheet(pa).locator('[data-sh="ok"]').click(); await W(pa, 1800);
    await sheet(pa).locator('[data-pk-rec]').first().click(); await W(pa, 1500);
    ok((await sheet(pa).locator('[data-pk-cls][aria-checked="true"] .pk-ord').innerText()).trim() === '1', 'el selector muestra el número de orden');
    await sheet(pa).locator('[data-sh="ok"]').click(); await W(pa, 900);
    await scr(pa).locator('[data-act="pl-assign"]').click(); await W(pa, 800);
    await sheet(pa).locator('#as-me').fill('Toño');
    await sheet(pa).locator('#as-teacher').fill('Profe Ana');
    await sheet(pa).locator('#as-group').fill('4.º B');
    await sheet(pa).locator('[data-sh="ok"]').click();
    const v1 = await download(pa, 'rev-plan-v1.zip');
    // El jefe abre su propio archivo: no cambia nada
    const nBoss = (await db(pa, 'classes')).length;
    await openFile(pa, v1);
    ok((await pa.locator('.alert-wrap, .alert').last().innerText()).includes('Es el plan que mandaste a Profe Ana'), 'el jefe que abre su propio archivo ve «Es el plan que mandaste…»');
    await pa.locator('.alert-wrap button, .alert button').last().click().catch(() => {}); await W(pa, 500);
    ok((await db(pa, 'classes')).length === nBoss, 'y su Cancha no cambia');

    const B = await open(); const pb = B.p;
    await openFile(pb, v1);
    await sheet(pb).locator('[data-sh="ok"]').click(); await W(pb, 3500);
    await pb.locator('.as-wrap.open .as-btn', { hasText: 'Después' }).click().catch(() => {}); await W(pb, 600);
    ok(await pb.locator('#screen-clases .acct-chip').count() === 1 && await pb.locator('#screen-clases [data-act="open-file"]').count() >= 1, 'la profe ve su cuenta y cómo abrir un plan desde Clases');
    ok(!(await pb.locator('#screen-clases').innerText()).includes('Clases recomendadas'), 'a la profe no le sale lo del jefe (clases recomendadas)');
    // la profe agrega alumnos y borra una clase
    let cls = (await db(pb, 'classes')).filter((c) => c.planId && !c.template).sort((x, y) => x.date.localeCompare(y.date));
    const del = cls[2];
    const grp = (await db(pb, 'groups')).find((g) => g.planId);
    await pb.click('#tab-grupos'); await W(pb);
    await pb.locator('[data-open-group]', { hasText: '4.º B' }).click(); await W(pb, 800);
    await scr(pb).locator('[data-act="add-students"]').first().click(); await W(pb, 700);
    await sheet(pb).locator('#st-names').fill('López Ana\nPérez Luis');
    await sheet(pb).locator('[data-sh="ok"]').click(); await W(pb, 900);
    await back(pb);
    await pb.click('#tab-clases'); await W(pb);
    await pb.evaluate(() => window.scrollTo(0, 0));
    await pb.locator('[data-act="all-up"]').click(); await W(pb, 900);
    ok((await scr(pb).innerText()).includes('Diciembre'), '«Ver las próximas» abre una pantalla por mes');
    await scr(pb).locator('[data-open-class="' + del.id + '"]').click(); await W(pb, 900);
    await scr(pb).locator('[data-act="delete-class"]').click(); await W(pb, 600);
    await pb.locator('.as-wrap.open .as-btn', { hasText: 'Eliminar' }).click(); await W(pb, 1000);

    // El jefe cambia los días del plan a lunes y miércoles
    await back(pa);
    await pa.locator('#screen-clases [data-open-plan]').first().click(); await W(pa, 900);
    await scr(pa).locator('[data-act="pl-edit"]').click(); await W(pa, 800);
    await sheet(pa).locator('[data-opts="days"] [data-opt="2"]').click();
    await sheet(pa).locator('[data-opts="days"] [data-opt="4"]').click();
    await sheet(pa).locator('[data-opts="days"] [data-opt="1"]').click();
    await sheet(pa).locator('[data-opts="days"] [data-opt="3"]').click();
    await sheet(pa).locator('[data-sh="ok"]').click(); await W(pa, 900);
    ok((await scr(pa).locator('.pl-stale').innerText()).includes('Profe Ana todavía tiene la versión anterior'), 'el jefe ve que Profe Ana tiene la versión anterior');
    await scr(pa).locator('.pl-stale [data-pl-resend]').click(); await W(pa, 800);
    ok(await sheet(pa).locator('[data-opts="days"] [data-opt="1"][aria-pressed="true"]').count() === 1, 'al reenviar ya vienen los días nuevos del plan');
    await sheet(pa).locator('[data-sh="ok"]').click();
    const v2 = await download(pa, 'rev-plan-v2.zip');
    ok(!(await scr(pa).locator('.pl-stale').count()), 'después de reenviar ya no sale el aviso');

    await openFile(pb, v2);
    await sheet(pb).locator('[data-sh="ok"]').click(); await W(pb, 3500);
    cls = (await db(pb, 'classes')).filter((c) => c.planId && !c.template);
    const g2 = (await db(pb, 'groups')).find((g) => g.id === grp.id);
    ok(cls.length > 20 && cls.every((c) => c.date < '2026-11-23' || [1, 3].includes(new Date(c.date + 'T12:00').getDay()) || c.id === del.id), 'las clases pasaron a lunes y miércoles');
    ok(g2 && g2.students.length === 2 && JSON.stringify(g2.days.slice().sort()) === '[1,3]', 'el grupo toma los días nuevos y conserva sus 2 alumnos');
    ok(!cls.some((c) => c.id === del.id), 'la clase que borró la profe no regresa');
    // Abrir otra vez el archivo viejo no regresa el plan
    await openFile(pb, v1);
    ok((await pb.locator('.alert-wrap, .alert').last().innerText()).includes('versión anterior'), 'el archivo viejo dice «versión anterior» y no cambia nada');
    await pb.locator('.alert-wrap button, .alert button').last().click().catch(() => {}); await W(pb, 500);
    ok((await db(pb, 'classes')).filter((c) => c.planId && !c.template).length === cls.length, 'el calendario no cambió');
    ok(pa.errs.length === 0 && pb.errs.length === 0, 'sin errores: ' + pa.errs.concat(pb.errs).join(' / '));
  }

  await b.close();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
