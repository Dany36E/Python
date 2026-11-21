// Genera los videos verticales (tipo «Short») de los ejercicios de «De entrenadores».
// Uso: python3 -m http.server 8765   (en la raíz del proyecto, en otra terminal)
//      node tools/video/make-videos.js [id ...]
// Necesita ffmpeg con libx264 y Playwright con Chromium. Deja app/videos/<id>.mp4 y <id>.jpg.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const OUT = path.join(__dirname, '..', '..', 'app', 'videos');
const FPS = 25;

function encoder(file) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-movflags', '+faststart', '-an', file]);
  ff.stderr.on('data', (d) => process.stderr.write(d));
  return ff;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1 });
  await page.goto(BASE + 'tools/video/render.html');
  await page.evaluate(() => document.fonts.ready);
  const all = await page.evaluate(() => window.CANCHA_CATALOG.exercises.filter((x) => x.diagram && x.diagram.items && x.diagram.items.some((i) => i.t === 'arrow')).map((x) => x.id));
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : all;
  for (const id of ids) {
    const t0 = Date.now();
    const info = await page.evaluate((x) => window.setup(x), id);
    const file = path.join(OUT, id + '.mp4');
    if (!process.env.ONLY_IMAGES) await encodeVideo(id, info, file);
    await images(id, info);
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(id, (info.total / 1000).toFixed(1) + ' s', kb + ' KB', Math.round((Date.now() - t0) / 1000) + ' s de trabajo');
  }
  await b.close();

  async function encodeVideo(id, info, file) {
    const ff = encoder(file);
    const done = new Promise((res, rej) => { ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))); });
    const frames = Math.ceil((info.total / 1000) * FPS);
    for (let f = 0; f < frames; f++) {
      await page.evaluate((ms) => window.frameAt(ms), (f * 1000) / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await done;
  }
  // Portada del video (9:16, 360 × 640) y miniatura del pizarrón (4:5, 320 × 400) para las tarjetas.
  async function images(id, info) {
    await page.evaluate((ms) => window.frameAt(ms), info.poster);
    // Portada chica (360 × 640) para las tarjetas de la biblioteca.
    const poster = await page.screenshot({ type: 'jpeg', quality: 90 });
    await new Promise((res, rej) => {
      const ff2 = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', 'scale=360:640', '-q:v', '6', path.join(OUT, id + '.jpg')]);
      ff2.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
      ff2.stdin.end(poster);
    });
    const box = await page.locator('#board').boundingBox();
    const thumb = await page.screenshot({ type: 'jpeg', quality: 92, clip: box });
    await new Promise((res, rej) => {
      const ff3 = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', 'scale=320:400', '-q:v', '5', path.join(OUT, id + '-t.jpg')]);
      ff3.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
      ff3.stdin.end(thumb);
    });
  }
})().catch((e) => { console.error(e); process.exit(1); });
