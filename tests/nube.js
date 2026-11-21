// Modo nube (Artifact de Claude) con almacenamiento simulado: crear ejercicio con video, grupo, clase con pausa y darla.
const { chromium, devices } = require('playwright');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const OUT = require('path').join(__dirname, 'out') + '/';
require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('cancha:onboarded', '1'); } catch (e) { /* */ } });
  await ctx.addInitScript(() => {
    const cols = {}; const subs = {};
    const snap = (n) => ({ docs: Object.entries(cols[n] || {}).map(([id, d]) => ({ id, exists: true, data: () => Object.freeze(JSON.parse(JSON.stringify(d))), metadata: { fromCache: false, hasPendingWrites: false } })), metadata: { fromCache: false, hasPendingWrites: false } });
    const notify = (n) => (subs[n] || []).forEach((fn) => setTimeout(() => fn(snap(n)), 5));
    const db = {
      collection: (n) => ({
        onSnapshot(next) { (subs[n] = subs[n] || []).push(next); setTimeout(() => next(snap(n)), 50); return () => {}; },
        doc: (id) => ({
          set: async (d) => { if ('id' in d) throw new Error('id in body'); (cols[n] = cols[n] || {})[id] = d; notify(n); },
          delete: async () => { delete (cols[n] || {})[id]; notify(n); },
        }),
      }),
    };
    window.__uploads = []; window.__cols = cols;
    const assets = {
      upload: async (blob, opts) => {
        const type = (opts && opts.type) || blob.type;
        if (blob.size > 20 * 1024 * 1024) throw { code: 'too_large', message: 'big' };
        const id = Math.random().toString(16).slice(2).padEnd(32, '0').slice(0, 32);
        window.__uploads.push({ id, type, size: blob.size });
        return { id, url: '/_blob/' + id, sizeBytes: blob.size, contentType: type };
      },
      delete: async () => ({ deleted: true }),
    };
    window.claude = { use: async (name) => (name === 'db' ? db : name === 'assets' ? assets : name === 'user' ? { can: async () => true, isOwner: () => true } : null) };
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/_blob|404/.test(m.text())) errors.push(m.text()); });
  const W = (ms) => p.waitForTimeout(ms || 500);
  const sheet = () => p.locator('.sheet-wrap.open').last();
  const scr = () => p.locator('.stack-screen.in').last();
  await p.goto(BASE);
  await p.waitForSelector('#screen-clases .empty');
  ok(true, 'nube: Clases vacío al empezar (sin ejemplos)');
  await p.screenshot({ path: OUT + 'c3_01_vacio.png' });

  // Ejercicio con video
  await p.click('#tab-ejercicios'); await W();
  await p.click('#fab'); await W(700);
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), sheet().locator('[data-pick="pick"]').click()]);
  // Foto de 1×1 generada aquí mismo (no depende de archivos externos).
  await chooser.setFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64') });
  await p.waitForSelector('.media-preview img', { timeout: 20000 });
  await sheet().locator('#ex-title').fill('Pases a un toque');
  await sheet().locator('[data-sh="ok"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached', timeout: 40000 });
  ok((await p.evaluate(() => window.__uploads.length)) >= 1, 'nube: foto subida');
  ok((await p.locator('#screen-ejercicios .card').count()) === 1, 'nube: el ejercicio aparece');

  // Grupo con alumnos
  await p.click('#tab-grupos'); await W();
  await p.click('#fab'); await W(700);
  await sheet().locator('#gr-name').fill('3.º B');
  await sheet().locator('[data-sh="ok"]').click(); await W(1200);
  await scr().locator('[data-act="add-students"]').first().click(); await W(700);
  await sheet().locator('#st-names').fill('1. Luis Pérez\n2. María López\n3. José Ramírez');
  await sheet().locator('[data-sh="ok"]').click(); await W(900);
  const st = await scr().locator('.st-row .t1').allInnerTexts();
  ok(st.join('|') === 'Luis Pérez|María López|José Ramírez', 'nube: alumnos en orden, sin números pegados: ' + st.join(', '));

  // Clase desde el grupo
  await scr().locator('[data-act="new-class"]').click(); await W(700);
  await sheet().locator('#cl-name').fill('Clase de pase');
  await sheet().locator('[data-sh="ok"]').click(); await W(1200);
  ok((await p.locator('.stack-screen.in').count()) >= 1, 'nube: clase creada');
  // Al crear una clase vacía, el selector de ejercicios se abre solo.
  if (!(await p.locator('.sheet-wrap.open [data-pick-ex]').count())) { await scr().locator('[data-act="add-ex"]').click(); await W(700); }
  ok(await p.locator('.sheet-wrap.open [data-pick-ex]').count() > 0, 'nube: al crear la clase se abre «Añadir ejercicios»');
  await sheet().locator('[data-pick-ex]').first().click();
  await sheet().locator('[data-sh="ok"]').click(); await W(900);
  await scr().locator('[data-act="add-pause"]').click(); await W(500);
  await p.locator('.as-wrap.open .as-btn', { hasText: 'Hidratación' }).click(); await W(900);
  const cls = await p.evaluate(() => Object.values(window.__cols.classes || {}));
  ok(cls.length === 1 && cls[0].items.length === 2 && cls[0].items[1].type === 'pause', 'nube: la clase guarda ejercicio + pausa');
  ok(!!cls[0].groupId, 'nube: la clase queda en el grupo');
  await scr().locator('[data-act="start"]').click(); await W(700);
  await p.click('[data-run="toggle"]'); await W(300);
  await p.click('[data-run="next"]'); await W(300);
  ok(await p.locator('.run-pause').count() === 1, 'nube: el modo clase muestra la pausa');
  await p.screenshot({ path: OUT + 'c3_02_run.png' });
  ok(errors.length === 0, 'nube: sin errores ' + errors.join(' / '));
  await b.close();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN');
})().catch((e) => { console.error(e); process.exit(2); });
