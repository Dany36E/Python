// Instalar Cancha: aviso y botón «Instalar» en Android (Chrome), pasos de Safari en iPad y nada en computadora si el navegador no lo ofrece.
const { chromium, devices } = require('playwright');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const OUT = require('path').join(__dirname, 'out') + '/';
require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  async function open(dev, name) {
    const ctx = await b.newContext({ ...dev, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { try { localStorage.setItem('cancha:onboarded', '1'); } catch (e) { /* */ } });
    const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
    await p.goto(BASE + 'index.html'); await p.waitForSelector('#screen-clases.active'); await p.waitForTimeout(1300);
    return { ctx, p };
  }
  // Android: aviso con «Ver cómo» y pasos de Chrome
  let { ctx, p } = await open(devices['Pixel 7']);
  const note = p.locator('#screen-clases .note', { hasText: 'Instala Cancha' });
  ok(await note.count() === 1 && (await note.innerText()).includes('celular'), 'Android: aparece «Instala Cancha en tu celular»');
  await p.screenshot({ path: OUT + 'android-nota.png' });
  await note.locator('[data-act="install-help"]').click(); await p.waitForTimeout(600);
  ok((await p.locator('body').innerText()).includes('tres puntos'), 'Android: «Ver cómo» explica los tres puntos de Chrome');
  await p.screenshot({ path: OUT + 'android-pasos.png' });
  // Simula que Chrome avisa que se puede instalar
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  const btn = p.locator('.alert-wrap.open button, .as-wrap.open .as-btn, .alert button').first();
  if (await btn.count()) { await btn.click().catch(() => {}); await p.waitForTimeout(500); }
  await p.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => { window.__prompted = true; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
  await p.waitForTimeout(500);
  ok((await note.locator('[data-act="install-help"]').innerText()) === 'Instalar', 'con el aviso del navegador el botón dice «Instalar»');
  await note.locator('[data-act="install-help"]').click(); await p.waitForTimeout(500);
  ok(await p.evaluate(() => window.__prompted === true), '«Instalar» abre la instalación del navegador');
  await p.locator('#screen-clases [data-act="settings"]').click(); await p.waitForTimeout(700);
  ok(await p.locator('.sheet-wrap.open [data-st="install"]', { hasText: 'Instalar Cancha en este celular' }).count() === 1, 'Ajustes tiene «Instalar Cancha en este celular»');
  await p.screenshot({ path: OUT + 'android-ajustes.png' });
  ok(p.errs.length === 0, 'sin errores: ' + p.errs.join(' / '));
  await ctx.close();
  // iPad: pasos de Safari
  ({ ctx, p } = await open(devices['iPad Pro 11']));
  const n2 = p.locator('#screen-clases .note', { hasText: 'Instala Cancha' });
  ok(await n2.count() === 1 && (await n2.innerText()).includes('iPad'), 'iPad: aparece «Instala Cancha en tu iPad»');
  await n2.locator('[data-act="install-help"]').click(); await p.waitForTimeout(600);
  ok((await p.locator('body').innerText()).includes('Agregar a pantalla de inicio'), 'iPad: explica Safari');
  ok(p.errs.length === 0, 'sin errores iPad: ' + p.errs.join(' / '));
  await ctx.close();
  // Computadora sin aviso del navegador: no estorba
  ({ ctx, p } = await open({ viewport: { width: 1280, height: 800 } }));
  ok(await p.locator('#screen-clases .note', { hasText: 'Instala Cancha' }).count() === 0, 'computadora: no sale el aviso si el navegador no lo ofrece');
  await ctx.close();
  await b.close();
  console.log(fails ? fails + ' FALLAS' : 'TODO BIEN'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
