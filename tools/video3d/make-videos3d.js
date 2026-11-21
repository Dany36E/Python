// Genera los videos 3D (tipo «Short») de los ejercicios recomendados: jugadores que corren y conducen
// exactamente por las flechas del pizarrón. Gratis y sin servicios externos.
// Uso:  cd tools/video3d && npm install        (una vez; instala three.js solo para esta herramienta)
//       python3 -m http.server 8765            (en la raíz del proyecto, en otra terminal)
//       node tools/video3d/make-videos3d.js [id ...]
// Opciones: OUT=carpeta (por defecto app/videos), WORKERS=3 (ventanas en paralelo), ONLY_IMAGES=1.
// Deja <id>.mp4 (720 × 1280), <id>.jpg (portada 360 × 640) y <id>-t.jpg (miniatura 4:5 para las tarjetas).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const BASE = (process.env.CANCHA_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const OUT = process.env.OUT || path.join(__dirname, '..', '..', 'app', 'videos');
const FPS = 25;
const WORKERS = Math.max(1, Number(process.env.WORKERS) || 3);

function ffmpeg(args, input) {
  return new Promise((res, rej) => {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error'].concat(args));
    ff.stderr.on('data', (d) => process.stderr.write(d));
    ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
    if (input) ff.stdin.end(input);
  });
}

async function work(browser, queue) {
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('error en la página:', e.message));
  await page.goto(BASE + 'tools/video3d/render3d.html');
  await page.waitForFunction(() => window.ready3d, null, { timeout: 30000 });
  while (queue.length) {
    const id = queue.shift();
    const t0 = Date.now();
    const info = await page.evaluate((x) => window.setup(x), id);
    const file = path.join(OUT, id + '.mp4');
    if (!process.env.ONLY_IMAGES) {
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-movflags', '+faststart', '-an', file]);
      ff.stderr.on('data', (d) => process.stderr.write(d));
      const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
      const frames = Math.ceil((info.total / 1000) * FPS);
      for (let f = 0; f < frames; f++) {
        await page.evaluate((ms) => window.frameAt(ms), (f * 1000) / FPS);
        const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      }
      ff.stdin.end();
      await done;
    }
    // Portada (con textos) y miniatura sin textos, recortada a 4:5 alrededor de la acción.
    await page.evaluate(() => document.getElementById('v').classList.add('cover'));
    await page.evaluate((ms) => window.frameAt(ms), info.thumb);
    await page.evaluate(() => document.getElementById('v').classList.remove('small'));
    await ffmpeg(['-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', 'scale=360:640', '-q:v', '5', path.join(OUT, id + '.jpg')], await page.screenshot({ type: 'jpeg', quality: 92 }));
    await page.evaluate(() => document.getElementById('v').classList.add('bare'));
    await page.evaluate((ms) => window.frameAt(ms), info.thumb);
    await ffmpeg(['-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', 'crop=720:900:0:250,scale=320:400', '-q:v', '5', path.join(OUT, id + '-t.jpg')], await page.screenshot({ type: 'jpeg', quality: 92 }));
    await page.evaluate(() => document.getElementById('v').classList.remove('bare', 'cover'));
    const kb = fs.existsSync(file) ? Math.round(fs.statSync(file).size / 1024) : 0;
    console.log(id, (info.total / 1000).toFixed(1) + ' s', kb + ' KB', Math.round((Date.now() - t0) / 1000) + ' s de trabajo');
  }
  await page.close();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let ids = process.argv.slice(2);
  if (!ids.length) {
    const p = await browser.newPage();
    await p.goto(BASE + 'tools/video3d/render3d.html');
    ids = await p.evaluate(() => window.CANCHA_CATALOG.exercises.filter((x) => x.diagram && x.diagram.items && x.diagram.items.some((i) => i.t === 'arrow')).map((x) => x.id));
    await p.close();
  }
  const queue = ids.slice();
  await Promise.all(Array.from({ length: Math.min(WORKERS, ids.length) }, () => work(browser, queue)));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
