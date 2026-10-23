// Renderiza la animación cuadro por cuadro con Chromium y la codifica con ffmpeg.
//
//   node tools/render.mjs still 12.5 out.png      -> un cuadro suelto
//   node tools/render.mjs sheet out.png           -> hoja de personajes
//   node tools/render.mjs video [desde] [hasta]   -> build/himno.mp4 (o un tramo)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const PAGE = url.pathToFileURL(path.join(ROOT, 'anim', 'index.html')).href;
const EXE = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;

async function openPage(browser, query) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`${PAGE}?${query}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  return page;
}

async function shot(page, t, type = 'png') {
  await page.evaluate((tt) => window.renderAt(tt), t);
  return page.locator('#stage').screenshot({ type, ...(type === 'jpeg' ? { quality: 94 } : {}) });
}

async function launch() {
  return playwright.chromium.launch({ executablePath: EXE, args: ['--disable-gpu', '--font-render-hinting=none'] });
}

async function still(t, out) {
  const browser = await launch();
  const page = await openPage(browser, 'render=1');
  fs.writeFileSync(out, await shot(page, Number(t)));
  await browser.close();
}

async function sheet(out) {
  const browser = await launch();
  const page = await openPage(browser, 'render=1&sheet=1');
  fs.writeFileSync(out, await shot(page, 1.0));
  await browser.close();
}

function ffmpegSink(file, fps) {
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  return ff;
}

async function video(from, to) {
  const tl = JSON.parse(fs.readFileSync(path.join(ROOT, 'anim', 'timeline.js'), 'utf8').replace(/^window\.TIMELINE = /, '').replace(/;\s*$/, ''));
  const fps = tl.fps;
  const start = from ?? 0, end = Math.min(to ?? tl.duration, tl.duration);
  const total = Math.round((end - start) * fps);
  const workers = Number(process.env.WORKERS || 4);
  const per = Math.ceil(total / workers);
  const outDir = path.join(ROOT, 'build');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  const t0 = Date.now();
  let done = 0;
  const parts = [];
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = w * per, b = Math.min(total, a + per);
    if (a >= b) return;
    const file = path.join(outDir, `parte_${w}.mp4`);
    parts[w] = file;
    const page = await openPage(browser, 'render=1');
    const ff = ffmpegSink(file, fps);
    for (let i = a; i < b; i++) {
      const buf = await shot(page, start + i / fps, 'jpeg');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      done++;
      if (done % 150 === 0) {
        const el = (Date.now() - t0) / 1000;
        console.log(`${done}/${total} cuadros · ${el.toFixed(0)} s · faltan ~${((total - done) * el / done).toFixed(0)} s`);
      }
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    await page.close();
  }));
  await browser.close();
  const list = path.join(outDir, 'partes.txt');
  fs.writeFileSync(list, parts.filter(Boolean).map((p) => `file '${p}'`).join('\n'));
  const name = from == null && to == null ? 'himno.mp4' : `tramo_${start}_${end}.mp4`;
  const final = path.join(outDir, name);
  await new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list,
      '-ss', String(start), '-t', String(end - start), '-i', path.join(outDir, 'mezcla.wav'),
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final],
    { stdio: 'inherit' });
    ff.on('close', (c) => (c === 0 ? resolve() : reject(new Error('ffmpeg ' + c))));
  });
  for (const p of parts.filter(Boolean)) fs.unlinkSync(p);
  console.log(`listo: ${final} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

async function stills(times, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const browser = await launch();
  const page = await openPage(browser, 'render=1');
  for (const t of times) fs.writeFileSync(path.join(dir, `t_${Number(t).toFixed(2)}.jpg`), await shot(page, Number(t), 'jpeg'));
  await browser.close();
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'stills') { await stills(a.split(','), b || path.join(ROOT, 'build', 'stills')); process.exit(0); }
if (cmd === 'still') await still(a, b || path.join(ROOT, 'build', 'still.png'));
else if (cmd === 'sheet') await sheet(a || path.join(ROOT, 'build', 'sheet.png'));
else if (cmd === 'video') await video(a != null ? Number(a) : undefined, b != null ? Number(b) : undefined);
else console.log('uso: node tools/render.mjs still <t> [out] | sheet [out] | video [desde] [hasta]');
