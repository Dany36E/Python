// Fondos y utilería en SVG.
(function () {
  const { f, tr, g, blob, rng, lerp, clamp, ease, prog } = A;
  const INK = '#5b3826';

  window.DEFS = `<defs>
  <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb0ea"/><stop offset=".65" stop-color="#bfe3f7"/><stop offset="1" stop-color="#eaf6fb"/></linearGradient>
  <linearGradient id="skyGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbd27a"/><stop offset="1" stop-color="#fff2cf"/></linearGradient>
  <radialGradient id="goldGlow" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#fff6d8"/><stop offset=".6" stop-color="#f9d58a"/><stop offset="1" stop-color="#e9a94c"/></radialGradient>
  <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16204a"/><stop offset="1" stop-color="#3b4f8c"/></linearGradient>
  <linearGradient id="wallWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dcb6"/><stop offset="1" stop-color="#e8bf92"/></linearGradient>
  <linearGradient id="wallNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3350"/><stop offset="1" stop-color="#5a4658"/></linearGradient>
  <linearGradient id="wallPink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8dccb"/><stop offset="1" stop-color="#eebfa6"/></linearGradient>
  <linearGradient id="floorWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9774a"/><stop offset="1" stop-color="#8f5532"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a5a34"/><stop offset=".5" stop-color="#b8723f"/><stop offset="1" stop-color="#94552f"/></linearGradient>
  <linearGradient id="woodDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4426"/><stop offset="1" stop-color="#5c321c"/></linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fa7d6"/><stop offset="1" stop-color="#1c6fa8"/></linearGradient>
  <linearGradient id="curtain" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9e1f2a"/><stop offset=".5" stop-color="#d23a3f"/><stop offset="1" stop-color="#9e1f2a"/></linearGradient>
  <radialGradient id="candle" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset=".35" stop-color="#ffc764" stop-opacity=".45"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
  <radialGradient id="vignette" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1608" stop-opacity=".35"/></radialGradient>
  <radialGradient id="spot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8e0" stop-opacity=".9"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/></radialGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></linearGradient>
  <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f3e6c8"/></linearGradient>
</defs>`;

  const P = {};

  // ---------------------------------------------------------------- exteriores
  P.sky = (id = 'skyDay') => `<rect width="1920" height="1080" fill="url(#${id})"/>`;

  P.cloud = (x, y, s = 1, o = 1) => g(tr(x, y, s), blob([[-90, 10, 50], [-30, -20, 70], [40, -10, 60], [100, 15, 45], [0, 25, 55]], '#ffffff', '#cfe6f4', 3), `opacity="${o}"`);

  P.clouds = (t, seed = 1, n = 5, y0 = 80, y1 = 300, speed = 12) => {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = ((r() * 2400 + t * speed * (0.6 + r() * 0.8)) % 2400) - 240;
      s += P.cloud(x, y0 + r() * (y1 - y0), 0.6 + r() * 0.7, 0.95);
    }
    return s;
  };

  P.hills = (y, color = '#7cc36a', dark = '#5ea653') =>
    `<path d="M0,${y} C300,${y - 70} 600,${y - 40} 900,${y - 10} C1200,${y + 20} 1500,${y - 80} 1920,${y - 30} L1920,1080 L0,1080 Z" fill="${dark}"/>` +
    `<path d="M0,${y + 40} C400,${y - 10} 800,${y + 60} 1200,${y + 20} C1500,${y - 10} 1700,${y + 30} 1920,${y + 10} L1920,1080 L0,1080 Z" fill="${color}"/>`;

  P.tree = (x, y, s = 1, sway = 0) => g(tr(x, y, s),
    `<path d="M-14,0 L-10,-120 L10,-120 L14,0 Z" fill="#8a5a36" stroke="${INK}" stroke-width="3"/>` +
    g(`rotate(${f(sway)} 0 -120)`, blob([[-60, -150, 55], [0, -200, 70], [60, -150, 55], [-30, -110, 45], [35, -105, 45]], '#5fb35a', '#3f7d3d', 3) +
      `<circle cx="-20" cy="-210" r="18" fill="#7fcc6f" opacity=".7"/><circle cx="40" cy="-170" r="12" fill="#7fcc6f" opacity=".7"/>`));

  P.bush = (x, y, s = 1, color = '#4fa557') => g(tr(x, y, s), blob([[-50, 0, 40], [0, -20, 50], [50, 0, 40]], color, '#356e3a', 3));

  P.flowers = (y, t, seed = 3, n = 26) => {
    const r = rng(seed);
    let s = '';
    const cols = ['#e8413c', '#ffffff', '#f6c443', '#f08ab0'];
    for (let i = 0; i < n; i++) {
      const x = r() * 1920, yy = y + r() * 120, c = cols[Math.floor(r() * cols.length)], sc = 0.6 + r() * 0.7;
      const sw = Math.sin(t * 2 + i) * 4;
      let petals = '';
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        petals += `<ellipse cx="${f(Math.cos(a) * 14)}" cy="${f(Math.sin(a) * 14)}" rx="12" ry="9" transform="rotate(${f((a * 180) / Math.PI)} ${f(Math.cos(a) * 14)} ${f(Math.sin(a) * 14)})"/>`;
      }
      s += g(tr(x, yy, sc, sw), `<g fill="${c}" stroke="${INK}" stroke-width="2.5">${petals}</g><circle r="8" fill="#f3b23a" stroke="${INK}" stroke-width="2.5"/>`);
    }
    return s;
  };

  // Catedral Metropolitana simplificada.
  P.cathedral = (x, y, s = 1) => {
    const stone = '#efd8b4', sh = '#d9b78c', ln = '#a57f58', win = '#7d5c45';
    const tower = (tx) => {
      let t = `<rect x="${tx - 62}" y="-300" width="124" height="300" fill="${stone}" stroke="${ln}" stroke-width="3"/>`;
      t += `<rect x="${tx - 62}" y="-300" width="18" height="300" fill="${sh}"/>`;
      t += `<path d="M${tx - 22},-130 L${tx - 22},-180 A22,22 0 0 1 ${tx + 22},-180 L${tx + 22},-130 Z" fill="${win}"/>`;
      t += `<rect x="${tx - 70}" y="-312" width="140" height="16" fill="${sh}" stroke="${ln}" stroke-width="3"/>`;
      t += `<rect x="${tx - 50}" y="-420" width="100" height="108" fill="${stone}" stroke="${ln}" stroke-width="3"/>`;
      t += `<path d="M${tx - 30},-330 L${tx - 30},-372 A12,12 0 0 1 ${tx - 6},-372 L${tx - 6},-330 Z M${tx + 6},-330 L${tx + 6},-372 A12,12 0 0 1 ${tx + 30},-372 L${tx + 30},-330 Z" fill="${win}"/>`;
      t += `<path d="M${tx - 56},-420 C${tx - 56},-470 ${tx - 20},-500 ${tx},-520 C${tx + 20},-500 ${tx + 56},-470 ${tx + 56},-420 Z" fill="${sh}" stroke="${ln}" stroke-width="3"/>`;
      t += `<path d="M${tx - 30},-430 C${tx - 26},-466 ${tx - 8},-486 ${tx},-500" fill="none" stroke="${stone}" stroke-width="6" stroke-linecap="round"/>`;
      t += `<circle cx="${tx}" cy="-528" r="9" fill="${sh}" stroke="${ln}" stroke-width="3"/><path d="M${tx},-536 L${tx},-560 M${tx - 9},-550 L${tx + 9},-550" stroke="${ln}" stroke-width="4"/>`;
      return t;
    };
    let c = '';
    // cúpula central al fondo
    c += `<path d="M-80,-300 C-80,-390 80,-390 80,-300 Z" fill="${sh}" stroke="${ln}" stroke-width="3"/><rect x="-14" y="-410" width="28" height="30" fill="${stone}" stroke="${ln}" stroke-width="3"/>`;
    c += `<rect x="-200" y="-300" width="400" height="300" fill="${stone}" stroke="${ln}" stroke-width="3"/>`;
    c += `<path d="M-120,-300 L0,-380 L120,-300 Z" fill="${stone}" stroke="${ln}" stroke-width="3"/>`;
    c += `<path d="M-46,0 L-46,-110 A46,46 0 0 1 46,-110 L46,0 Z" fill="${win}" stroke="${ln}" stroke-width="3"/>`;
    c += `<circle cx="0" cy="-210" r="26" fill="${win}" stroke="${ln}" stroke-width="3"/>`;
    for (const px of [-150, -100, 100, 150]) c += `<rect x="${px - 8}" y="-270" width="16" height="270" fill="${sh}"/>`;
    c += tower(-262) + tower(262);
    return g(tr(x, y, s), c);
  };

  P.plaza = (y) => `<rect x="0" y="${y}" width="1920" height="${1080 - y}" fill="#e7cfa6"/>` +
    `<path d="M0,${y} L1920,${y}" stroke="#c9a77a" stroke-width="6"/>` +
    Array.from({ length: 12 }, (_, i) => `<path d="M${i * 180 - 200},1080 L${i * 160 + 80},${y}" stroke="#d6b88c" stroke-width="3"/>`).join('');

  // Bandera de México ondeando. (x,y) = esquina superior izquierda junto al asta.
  P.flag = (x, y, w, h, t, amp = 18) => {
    const N = 40;
    const dy = (k) => Math.sin(k * 7.5 - t * 4.2) * amp * k + Math.sin(k * 3 - t * 2.1) * amp * 0.4 * k;
    const sh = (k) => Math.cos(k * 7.5 - t * 4.2);
    let s = '';
    for (let i = 0; i < N; i++) {
      const k0 = i / N, k1 = (i + 1) / N;
      const x0 = k0 * w, x1 = k1 * w + 1.2;
      const c = k0 < 1 / 3 ? '#0f8a4a' : k0 < 2 / 3 ? '#fbfbf7' : '#d52b38';
      const shade = sh(k0) * 0.18;
      s += `<path d="M${f(x0)},${f(dy(k0))} L${f(x1)},${f(dy(k1))} L${f(x1)},${f(h + dy(k1))} L${f(x0)},${f(h + dy(k0))} Z" fill="${c}"/>`;
      if (Math.abs(shade) > 0.02) s += `<path d="M${f(x0)},${f(dy(k0))} L${f(x1)},${f(dy(k1))} L${f(x1)},${f(h + dy(k1))} L${f(x0)},${f(h + dy(k0))} Z" fill="${shade > 0 ? '#fff' : '#000'}" opacity="${f(Math.abs(shade) * 100) / 100}"/>`;
    }
    s += g(tr(w / 2, h / 2 + dy(0.5), h / 300), P.emblem());
    const outline = `M0,${f(dy(0))} ` + Array.from({ length: N + 1 }, (_, i) => `L${f((i / N) * w)},${f(dy(i / N))}`).join(' ') +
      ` L${f(w)},${f(h + dy(1))} ` + Array.from({ length: N + 1 }, (_, i) => `L${f(((N - i) / N) * w)},${f(h + dy((N - i) / N))}`).join(' ') + ' Z';
    s += `<path d="${outline}" fill="none" stroke="#3d4a3a" stroke-opacity=".5" stroke-width="3"/>`;
    return g(tr(x, y), s);
  };

  P.emblem = () => {
    let leaves = '';
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.15 + (i / 8) * 0.7);
      const lx = Math.cos(a) * 62, ly = Math.sin(a) * 46 + 10;
      leaves += `<ellipse cx="${f(-lx)}" cy="${f(ly)}" rx="10" ry="5" transform="rotate(${f(-(a * 180) / Math.PI + 60)} ${f(-lx)} ${f(ly)})"/>`;
      leaves += `<ellipse cx="${f(lx)}" cy="${f(ly)}" rx="10" ry="5" transform="rotate(${f((a * 180) / Math.PI + 120)} ${f(lx)} ${f(ly)})"/>`;
    }
    return `<g fill="#3f8f3f" stroke="#2c5e2c" stroke-width="1.5">${leaves}</g>` +
      `<path d="M-28,52 C-30,30 -14,26 -6,36 C-4,20 14,18 18,34 C30,30 34,46 26,56 Z" fill="#5aa04a" stroke="#2c5e2c" stroke-width="2"/>` +
      `<path d="M-6,30 C-40,-10 -44,-40 -20,-56 C-32,-30 -16,-16 -4,-8 Z" fill="#8a5a2b" stroke="#4a2e16" stroke-width="2"/>` +
      `<path d="M4,30 C40,-16 44,-46 22,-60 C30,-34 18,-18 4,-10 Z" fill="#8a5a2b" stroke="#4a2e16" stroke-width="2"/>` +
      `<ellipse cx="0" cy="6" rx="16" ry="26" fill="#6b4220" stroke="#4a2e16" stroke-width="2"/>` +
      `<circle cx="-10" cy="-22" r="10" fill="#6b4220" stroke="#4a2e16" stroke-width="2"/><path d="M-20,-22 l-8,4 l8,2 z" fill="#e3b03a"/>` +
      `<path d="M-22,-14 C-30,0 -16,6 -24,16" fill="none" stroke="#3f8f3f" stroke-width="4" stroke-linecap="round"/>`;
  };

  P.flagpole = (x, y, h) => `<rect x="${x - 7}" y="${y}" width="14" height="${h}" rx="6" fill="#b88a4a" stroke="${INK}" stroke-width="3"/>` +
    `<circle cx="${x}" cy="${y - 6}" r="14" fill="#e4b84a" stroke="${INK}" stroke-width="3"/>`;

  // ---------------------------------------------------------------- interiores
  P.room = (wall = 'wallWarm', floorY = 820) =>
    `<rect width="1920" height="1080" fill="url(#${wall})"/>` +
    `<rect y="${floorY - 150}" width="1920" height="150" fill="#000" opacity=".06"/>` +
    `<rect y="${floorY - 156}" width="1920" height="14" fill="#c98f62" stroke="${INK}" stroke-width="3"/>` +
    `<rect y="${floorY}" width="1920" height="${1080 - floorY}" fill="url(#floorWood)"/>` +
    Array.from({ length: 9 }, (_, i) => `<path d="M0,${floorY + 26 + i * 30} L1920,${floorY + 26 + i * 30}" stroke="#7a4527" stroke-opacity=".35" stroke-width="3"/>`).join('') +
    `<rect y="${floorY - 6}" width="1920" height="12" fill="#7a4527"/>`;

  P.bookshelf = (x, y, w = 360, h = 520, seed = 7) => {
    const r = rng(seed);
    const cols = ['#c0392b', '#2e7d5b', '#2c5aa0', '#d79b2c', '#7d3c98', '#a0522d', '#3f6f8f', '#b03a5b'];
    let s = `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#woodDark)" stroke="${INK}" stroke-width="4" rx="6"/>`;
    const rows = 4, rh = (h - 30) / rows;
    for (let k = 0; k < rows; k++) {
      const by = 15 + k * rh;
      s += `<rect x="16" y="${f(by)}" width="${w - 32}" height="${f(rh - 14)}" fill="#4a2814"/>`;
      let bx = 22;
      while (bx < w - 40) {
        const bw = 18 + r() * 18, bh = rh * (0.6 + r() * 0.3), c = cols[Math.floor(r() * cols.length)];
        const lean = r() < 0.08 ? 8 : 0;
        s += `<rect x="${f(bx)}" y="${f(by + rh - 14 - bh)}" width="${f(bw)}" height="${f(bh)}" fill="${c}" stroke="${INK}" stroke-width="2.5" rx="3" transform="rotate(${lean} ${f(bx)} ${f(by + rh - 14)})"/>` +
          `<rect x="${f(bx + 3)}" y="${f(by + rh - 14 - bh + 10)}" width="${f(bw - 6)}" height="5" fill="#fff" opacity=".35"/>`;
        bx += bw + 2 + lean;
      }
      s += `<rect x="10" y="${f(by + rh - 14)}" width="${w - 20}" height="12" fill="#8c5330" stroke="${INK}" stroke-width="3"/>`;
    }
    return g(tr(x, y), s);
  };

  P.window = (x, y, w, h, t, night = false, curtains = '#e0607e') => {
    let s = `<rect x="-14" y="-14" width="${w + 28}" height="${h + 28}" rx="10" fill="#f4e6cf" stroke="${INK}" stroke-width="4"/>`;
    s += `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#${night ? 'skyNight' : 'skyDay'})"/>`;
    if (night) {
      const r = rng(9);
      for (let i = 0; i < 18; i++) {
        const sx = r() * w, sy = r() * h * 0.8, tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
        s += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(2 + r() * 2.5)}" fill="#fff8d0" opacity="${f(0.4 + tw * 0.6)}"/>`;
      }
      s += `<circle cx="${w * 0.7}" cy="${h * 0.3}" r="${w * 0.12}" fill="#fff4c4"/><circle cx="${w * 0.7 + w * 0.05}" cy="${h * 0.3 - w * 0.03}" r="${w * 0.11}" fill="#2a3566"/>`;
    } else {
      s += g(tr(w * 0.3 + ((t * 8) % 80), h * 0.3, 0.45), blob([[-60, 0, 40], [0, -20, 50], [60, 0, 40]], '#fff', '#dcefff', 2));
      s += `<path d="M0,${h * 0.75} C${w * 0.3},${h * 0.6} ${w * 0.6},${h * 0.7} ${w},${h * 0.62} L${w},${h} L0,${h} Z" fill="#8bcf7a"/>`;
    }
    s += `<path d="M${w / 2},0 L${w / 2},${h} M0,${h / 2} L${w},${h / 2}" stroke="#f4e6cf" stroke-width="12"/>`;
    s += `<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="3"/>`;
    s += `<rect x="-30" y="${h + 8}" width="${w + 60}" height="20" rx="6" fill="#f4e6cf" stroke="${INK}" stroke-width="3"/>`;
    if (curtains) {
      const sway = Math.sin(t * 1.3) * 6;
      s += `<path d="M-60,-40 L${w * 0.28},-40 C${w * 0.18 + sway},${h * 0.4} ${w * 0.08},${h * 0.7} -20,${h + 60} L-60,${h + 60} Z" fill="${curtains}" stroke="${INK}" stroke-width="3.5"/>`;
      s += `<path d="M${w + 60},-40 L${w * 0.72},-40 C${w * 0.82 - sway},${h * 0.4} ${w * 0.92},${h * 0.7} ${w + 20},${h + 60} L${w + 60},${h + 60} Z" fill="${curtains}" stroke="${INK}" stroke-width="3.5"/>`;
      s += `<path d="M-30,0 C-30,${h * 0.4} -10,${h * 0.7} -20,${h + 50} M${w + 30},0 C${w + 30},${h * 0.4} ${w + 10},${h * 0.7} ${w + 20},${h + 50}" stroke="#000" stroke-opacity=".12" stroke-width="10" fill="none"/>`;
      s += `<rect x="-80" y="-56" width="${w + 160}" height="22" rx="11" fill="#b8854f" stroke="${INK}" stroke-width="3"/>`;
    }
    return g(tr(x, y), s);
  };

  P.beams = (x, y, t) => {
    const o = 0.55 + Math.sin(t * 0.8) * 0.1;
    return `<g opacity="${f(o * 100) / 100}"><path d="M${x},${y} L${x + 160},${y} L${x + 700},${y + 820} L${x + 300},${y + 820} Z" fill="url(#beam)"/>` +
      `<path d="M${x + 200},${y} L${x + 260},${y} L${x + 860},${y + 820} L${x + 740},${y + 820} Z" fill="url(#beam)"/></g>`;
  };

  P.desk = (x, y, w = 900, h = 260) =>
    g(tr(x, y), `<rect x="${-w / 2}" y="0" width="${w}" height="${h}" fill="url(#wood)" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="${-w / 2 - 20}" y="-18" width="${w + 40}" height="34" rx="8" fill="#a8653a" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="${-w / 2 - 20}" y="-18" width="${w + 40}" height="10" rx="5" fill="#c58352"/>` +
      `<rect x="${-w / 2 + 40}" y="50" width="${w / 2 - 80}" height="${h - 90}" rx="8" fill="none" stroke="#7a4527" stroke-width="4"/>` +
      `<rect x="40" y="50" width="${w / 2 - 80}" height="${h - 90}" rx="8" fill="none" stroke="#7a4527" stroke-width="4"/>` +
      `<circle cx="${-w / 4}" cy="${h / 2 + 5}" r="8" fill="#e2b444" stroke="${INK}" stroke-width="2.5"/><circle cx="${w / 4}" cy="${h / 2 + 5}" r="8" fill="#e2b444" stroke="${INK}" stroke-width="2.5"/>`);

  P.paper = (x, y, r = 0, s = 1, lines = 6, written = 1) => {
    let l = '';
    for (let i = 0; i < lines; i++) {
      const k = clamp(written * lines - i);
      if (k > 0) l += `<path d="M-60,${-60 + i * 22} L${f(-60 + 120 * k * (0.75 + ((i * 37) % 25) / 100))},${-60 + i * 22}" stroke="#7a6a8a" stroke-width="4" stroke-linecap="round"/>`;
    }
    return g(tr(x, y, s, r), `<rect x="-80" y="-95" width="160" height="200" rx="6" fill="url(#paper)" stroke="${INK}" stroke-width="3"/>` + l);
  };

  P.inkwell = (x, y, s = 1) => g(tr(x, y, s),
    `<path d="M-30,0 L-30,-40 Q-30,-52 -18,-52 L18,-52 Q30,-52 30,-40 L30,0 Z" fill="#222a3a" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="-14" y="-66" width="28" height="16" rx="4" fill="#222a3a" stroke="${INK}" stroke-width="3"/><path d="M-20,-40 L-20,-10" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>`);

  // Pluma: (x,y) es la punta.
  P.quill = (x, y, rot = -35, s = 1) => g(tr(x, y, s, rot),
    `<path d="M0,0 L-4,-30 C-30,-80 -26,-150 -8,-210 C6,-150 18,-80 4,-30 Z" fill="#fbf6ec" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M0,-20 C-4,-90 -6,-150 -8,-205" stroke="#c9bba5" stroke-width="3" fill="none"/>` +
    `<path d="M-14,-120 l-12,-8 M-16,-150 l-10,-8 M-2,-110 l10,-10 M-2,-140 l10,-10" stroke="#d9cdb8" stroke-width="3"/>` +
    `<path d="M0,0 L-3,-14 L3,-14 Z" fill="#222"/>`);

  P.candle = (x, y, t, h = 110, s = 1) => {
    const fl = Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
    const glowR = 260 + Math.sin(t * 9) * 12;
    return `<circle cx="${x}" cy="${y - h * s - 30}" r="${glowR * s}" fill="url(#candle)"/>` + g(tr(x, y, s),
      `<ellipse cx="0" cy="6" rx="58" ry="14" fill="#c99a3a" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M-40,0 Q0,22 40,0 L34,-10 Q0,6 -34,-10 Z" fill="#e2b444" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="-22" y="${-h}" width="44" height="${h - 8}" rx="6" fill="#fbf2dc" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M-22,${-h + 14} q8,14 6,30" stroke="#f1e2bc" stroke-width="6" fill="none" stroke-linecap="round"/>` +
      `<path d="M0,${-h} L0,${-h - 12}" stroke="#333" stroke-width="3"/>` +
      g(tr(0, -h - 10, 1 + fl, Math.sin(t * 5) * 4), `<path d="M0,-48 C14,-28 16,-8 0,0 C-16,-8 -14,-28 0,-48 Z" fill="#ffb53d"/><path d="M0,-30 C7,-18 7,-6 0,-2 C-7,-6 -7,-18 0,-30 Z" fill="#fff3b0"/>`));
  };

  // Puerta de madera. open: 0 cerrada .. 1 abierta (gira sobre la bisagra izquierda).
  P.door = (x, y, w, h, open = 0, opts = {}) => {
    const sx = Math.cos(open * Math.PI * 0.46);
    let frame = `<rect x="-24" y="-24" width="${w + 48}" height="${h + 24}" fill="#8f5532" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="0" y="0" width="${w}" height="${h}" fill="${opts.inside || '#3a2a20'}"/>`;
    const panel = (px, py, pw, ph) => `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="8" fill="#a5643a" stroke="#6e3a1e" stroke-width="4"/>` +
      `<rect x="${px + 8}" y="${py + 8}" width="${pw - 16}" height="${ph - 16}" rx="5" fill="none" stroke="#c07a48" stroke-width="3"/>`;
    let d = `<rect x="0" y="0" width="${w}" height="${h - 14}" fill="url(#wood)" stroke="${INK}" stroke-width="4"/>`;
    d += panel(w * 0.12, h * 0.07, w * 0.76, h * 0.38) + panel(w * 0.12, h * 0.52, w * 0.76, h * 0.38);
    d += `<rect x="${w * 0.8}" y="${h * 0.44}" width="24" height="70" rx="6" fill="#e2b444" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="${w * 0.8 + 12}" cy="${h * 0.44 + 20}" r="15" fill="#f0c654" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M${w * 0.8 + 12},${h * 0.44 + 42} l0,14" stroke="#3a2a20" stroke-width="5" stroke-linecap="round"/>`;
    const leaf = g(`scale(${f(sx * 100) / 100} 1)`, d);
    const floor = `<rect x="-60" y="${h - 14}" width="${w + 120}" height="14" fill="#000" opacity=".15"/>`;
    return g(tr(x, y), frame + (opts.behind || '') + leaf + floor);
  };

  P.key = (x, y, rot = 0, s = 1) => g(tr(x, y, s, rot),
    `<circle cx="0" cy="0" r="30" fill="none" stroke="#c99a2e" stroke-width="14"/><circle cx="0" cy="0" r="30" fill="none" stroke="#f0c654" stroke-width="8"/>` +
    `<rect x="26" y="-7" width="110" height="14" rx="5" fill="#f0c654" stroke="#9a6d1c" stroke-width="3"/>` +
    `<rect x="104" y="0" width="12" height="26" fill="#f0c654" stroke="#9a6d1c" stroke-width="3"/><rect x="124" y="0" width="12" height="20" fill="#f0c654" stroke="#9a6d1c" stroke-width="3"/>`);

  P.clock = (x, y, r, hours) => {
    const ha = hours * 30, ma = hours * 360;
    return g(tr(x, y), `<circle r="${r + 14}" fill="#e2b444" stroke="${INK}" stroke-width="4"/><circle r="${r}" fill="#fffaf0" stroke="${INK}" stroke-width="3"/>` +
      Array.from({ length: 12 }, (_, i) => `<path d="M0,${-r + 10} L0,${-r + 24}" stroke="#5b3826" stroke-width="5" transform="rotate(${i * 30})"/>`).join('') +
      `<path d="M0,0 L0,${-r * 0.5}" stroke="#2a1a14" stroke-width="10" stroke-linecap="round" transform="rotate(${f(ha)})"/>` +
      `<path d="M0,0 L0,${-r * 0.78}" stroke="#2a1a14" stroke-width="6" stroke-linecap="round" transform="rotate(${f(ma)})"/>` +
      `<circle r="10" fill="#c8312b"/>`);
  };

  P.curtains = (t) => {
    const sway = Math.sin(t * 1.1) * 8;
    const side = (m) => {
      let s = `<path d="M${960 + m * 960},0 L${960 + m * 620},0 C${960 + m * (640 - sway)},300 ${960 + m * 700},700 ${960 + m * 760},1080 L${960 + m * 960},1080 Z" fill="url(#curtain)" stroke="#6a1018" stroke-width="4"/>`;
      for (let i = 1; i < 4; i++) s += `<path d="M${960 + m * (620 + i * 80)},0 C${960 + m * (640 + i * 80 - sway)},300 ${960 + m * (700 + i * 66)},700 ${960 + m * (760 + i * 50)},1080" stroke="#7a1520" stroke-opacity=".5" stroke-width="8" fill="none"/>`;
      return s;
    };
    return side(-1) + side(1) + `<path d="M0,0 L1920,0 L1920,90 C1700,140 1500,80 1280,130 C1100,80 820,80 640,130 C420,80 220,140 0,90 Z" fill="#b5242d" stroke="#6a1018" stroke-width="4"/>` +
      `<path d="M0,96 C220,146 420,86 640,136 C820,86 1100,86 1280,136 C1500,86 1700,146 1920,96" fill="none" stroke="#f0c654" stroke-width="10"/>`;
  };

  P.crowd = (y, t, seed = 5, n = 16) => {
    const r = rng(seed);
    let s = '';
    const hair = ['#3a2318', '#2a1a14', '#5a3a26', '#4a2e1e', '#6a4a30'];
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2000 - 40 + (r() - 0.5) * 40;
      const yy = y + (r() - 0.5) * 30 + Math.abs(Math.sin(t * 6 + i)) * (t > 0 ? 0 : 0);
      const hc = hair[Math.floor(r() * hair.length)], rad = 70 + r() * 20;
      s += `<ellipse cx="${f(x)}" cy="${f(yy + rad * 1.4)}" rx="${f(rad * 1.5)}" ry="${f(rad)}" fill="${['#2f4b7c', '#7a3b3b', '#3d6b4f', '#5b4a7a'][i % 4]}" stroke="${INK}" stroke-width="3"/>`;
      s += blob([[x, yy, rad], [x - rad * 0.6, yy + 10, rad * 0.6], [x + rad * 0.6, yy + 10, rad * 0.6]], hc, INK, 3);
    }
    return s;
  };

  // ---------------------------------------------------------------- mar y barco
  P.sea = (y, t) => {
    let s = `<rect x="0" y="${y}" width="1920" height="${1080 - y}" fill="url(#sea)"/>`;
    for (let k = 0; k < 6; k++) {
      const yy = y + 30 + k * 60, ph = t * (1.2 + k * 0.15) + k;
      let d = `M-40,${yy}`;
      for (let x = -40; x <= 1960; x += 80) d += ` q20,${f(-10 - Math.sin(ph + x * 0.01) * 4)} 40,0 t40,0`;
      s += `<path d="${d}" fill="none" stroke="#bfe8fb" stroke-opacity="${0.55 - k * 0.05}" stroke-width="5" stroke-linecap="round"/>`;
    }
    return s;
  };

  P.ship = (x, y, s, t) => {
    const rock = Math.sin(t * 1.4) * 2;
    return g(tr(x, y + Math.sin(t * 1.4) * 6, s, rock),
      `<path d="M-300,0 L300,0 L250,90 L-240,90 Z" fill="#2b2d3a" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="-300" y="-8" width="600" height="20" fill="#c8312b" stroke="${INK}" stroke-width="3"/>` +
      Array.from({ length: 7 }, (_, i) => `<circle cx="${-210 + i * 70}" cy="45" r="11" fill="#f7e8b8" stroke="${INK}" stroke-width="3"/>`).join('') +
      `<rect x="-200" y="-90" width="330" height="82" rx="8" fill="#f5efe4" stroke="${INK}" stroke-width="4"/>` +
      Array.from({ length: 5 }, (_, i) => `<rect x="${-180 + i * 62}" y="-70" width="34" height="30" rx="4" fill="#7fb4e0" stroke="${INK}" stroke-width="3"/>`).join('') +
      `<rect x="-40" y="-200" width="64" height="112" fill="#c8312b" stroke="${INK}" stroke-width="4"/><rect x="-40" y="-200" width="64" height="22" fill="#2b2d3a"/>` +
      `<path d="M190,-8 L190,-260 M-250,-8 L-250,-220" stroke="#6e4a2e" stroke-width="10"/>` +
      `<path d="M190,-250 L310,-30 L190,-30 Z" fill="#fbf7ee" stroke="${INK}" stroke-width="3"/>` +
      g(tr(-250, -220), P.flag(0, 0, 80, 50, t, 4)));
  };

  P.smoke = (x, y, t) => {
    let s = '';
    for (let i = 0; i < 6; i++) {
      const k = ((t * 0.35 + i / 6) % 1);
      s += `<circle cx="${f(x - k * 160)}" cy="${f(y - k * 220)}" r="${f(20 + k * 50)}" fill="#e9ecf2" opacity="${f((1 - k) * 0.8)}"/>`;
    }
    return s;
  };

  P.morro = (x, y, s = 1) => g(tr(x, y, s),
    `<path d="M-260,0 C-220,-80 -120,-120 0,-130 C120,-120 200,-70 240,0 Z" fill="#9a8a70" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M-180,-60 L-180,-150 L160,-150 L160,-60 Z" fill="#e8d8b4" stroke="${INK}" stroke-width="4"/>` +
    Array.from({ length: 9 }, (_, i) => `<rect x="${-180 + i * 40}" y="-170" width="22" height="22" fill="#e8d8b4" stroke="${INK}" stroke-width="3"/>`).join('') +
    `<path d="M40,-150 L60,-430 L110,-430 L130,-150 Z" fill="#f2e6cc" stroke="${INK}" stroke-width="4"/>` +
    `<rect x="48" y="-470" width="74" height="44" fill="#f7d26a" stroke="${INK}" stroke-width="4"/><path d="M42,-470 L85,-510 L128,-470 Z" fill="#c8312b" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M62,-300 L120,-300 M58,-230 L124,-230" stroke="#d9c39c" stroke-width="8"/>`);

  P.palm = (x, y, s = 1, t = 0) => g(tr(x, y, s),
    `<path d="M0,0 C10,-80 -10,-180 20,-280" fill="none" stroke="#8a5a36" stroke-width="26" stroke-linecap="round"/>` +
    g(tr(20, -280, 1, Math.sin(t * 1.5) * 4), [0, 60, 120, 180, 240, 300].map((a) => `<path d="M0,0 C40,-40 100,-30 150,20 C100,0 50,-10 0,0 Z" fill="#4fa557" stroke="#2f6b36" stroke-width="3" transform="rotate(${a + 15})"/>`).join('')));

  // ---------------------------------------------------------------- música
  P.note = (x, y, s = 1, color = '#c98a1c', rot = 0, kind = 0) => g(tr(x, y, s, rot), kind === 0
    ? `<ellipse cx="0" cy="0" rx="18" ry="13" transform="rotate(-20)" fill="${color}"/><rect x="13" y="-70" width="7" height="70" fill="${color}"/><path d="M20,-70 C40,-60 46,-44 34,-28 C40,-46 32,-54 20,-56 Z" fill="${color}"/>`
    : `<ellipse cx="0" cy="0" rx="16" ry="12" transform="rotate(-20)" fill="${color}"/><ellipse cx="56" cy="-10" rx="16" ry="12" transform="rotate(-20 56 -10)" fill="${color}"/><rect x="11" y="-66" width="7" height="66" fill="${color}"/><rect x="67" y="-76" width="7" height="66" fill="${color}"/><path d="M11,-66 L74,-76 L74,-62 L11,-52 Z" fill="${color}"/>`);

  P.floatingNotes = (t, cx, cy, spread, seed = 4, n = 8, colors = ['#e05555', '#3a9a5a', '#e0a020', '#3a7ad0']) => {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.25 + r()) % 1;
      const x = cx + (r() - 0.5) * spread + Math.sin(t * 1.5 + i) * 30;
      const y = cy - ph * 400 + r() * 80;
      const o = Math.sin(ph * Math.PI);
      s += `<g opacity="${f(o * 100) / 100}">` + P.note(x, y, 0.8 + r() * 0.6, colors[i % colors.length], Math.sin(t * 2 + i) * 15, i % 2) + '</g>';
    }
    return s;
  };

  P.piano = (x, y, s = 1) => {
    let keys = '';
    for (let i = 0; i < 14; i++) keys += `<rect x="${-350 + i * 50}" y="0" width="50" height="90" fill="#fffdf6" stroke="${INK}" stroke-width="2.5"/>`;
    for (let i = 0; i < 13; i++) if (![2, 6, 9, 13].includes(i)) keys += `<rect x="${-350 + i * 50 + 34}" y="0" width="32" height="56" fill="#1e1e24"/>`;
    return g(tr(x, y, s), `<rect x="-380" y="-300" width="760" height="310" rx="16" fill="#26262e" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="-360" y="-280" width="720" height="150" rx="10" fill="#33333d"/><rect x="-200" y="-260" width="400" height="110" rx="6" fill="url(#paper)" stroke="${INK}" stroke-width="3"/>` +
      Array.from({ length: 5 }, (_, i) => `<path d="M-180,${-240 + i * 16} L180,${-240 + i * 16}" stroke="#7a6a8a" stroke-width="2"/>`).join('') +
      `<rect x="-380" y="0" width="760" height="100" fill="#26262e" stroke="${INK}" stroke-width="4"/>` + g('translate(0 4)', keys) +
      `<rect x="-380" y="100" width="760" height="200" fill="#1d1d24" stroke="${INK}" stroke-width="4"/>`);
  };

  P.trumpet = (x, y, s = 1, rot = 0) => g(tr(x, y, s, rot),
    `<rect x="-90" y="-8" width="150" height="16" rx="8" fill="#f0c654" stroke="#8a6116" stroke-width="3"/>` +
    `<path d="M60,-8 L120,-34 L120,34 L60,8 Z" fill="#f0c654" stroke="#8a6116" stroke-width="3"/><ellipse cx="120" cy="0" rx="8" ry="34" fill="#f8dc84" stroke="#8a6116" stroke-width="3"/>` +
    `<rect x="-20" y="-26" width="10" height="20" fill="#e2b444"/><rect x="0" y="-26" width="10" height="20" fill="#e2b444"/><rect x="20" y="-26" width="10" height="20" fill="#e2b444"/>`);

  P.drum = (x, y, s = 1) => g(tr(x, y, s), `<rect x="-60" y="-50" width="120" height="100" fill="#c8312b" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M-60,-40 L-20,40 L20,-40 L60,40" fill="none" stroke="#f0c654" stroke-width="5"/><ellipse cx="0" cy="-50" rx="60" ry="16" fill="#f5efe4" stroke="${INK}" stroke-width="4"/>` +
    `<ellipse cx="0" cy="50" rx="60" ry="16" fill="#c8312b" stroke="${INK}" stroke-width="4"/>`);

  // ---------------------------------------------------------------- efectos y señales
  P.heart = (x, y, s = 1, color = '#ef5b7d', rot = 0) => g(tr(x, y, s, rot),
    `<path d="M0,26 C-40,0 -44,-30 -22,-38 C-10,-42 0,-32 0,-22 C0,-32 10,-42 22,-38 C44,-30 40,0 0,26 Z" fill="${color}" stroke="${INK}" stroke-width="3"/>` +
    `<ellipse cx="-16" cy="-24" rx="7" ry="4" fill="#fff" opacity=".6" transform="rotate(-30 -16 -24)"/>`);

  P.floatingHearts = (t, cx, cy, spread, seed = 8, n = 6, start = -99) => {
    if (t < start) return '';
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) {
      const delay = r() * 1.5;
      const ph = ((t - start - delay) * 0.3) % 1;
      if (t - start - delay < 0) continue;
      const x = cx + (r() - 0.5) * spread + Math.sin(t * 2 + i) * 20;
      const y = cy - ph * 300;
      s += `<g opacity="${f(Math.sin(ph * Math.PI) * 100) / 100}">${P.heart(x, y, 0.6 + r() * 0.6, i % 2 ? '#ef5b7d' : '#f48fb1')}</g>`;
    }
    return s;
  };

  P.sparkle = (x, y, s = 1, color = '#ffd84a') => g(tr(x, y, s),
    `<path d="M0,-40 C6,-8 8,-6 40,0 C8,6 6,8 0,40 C-6,8 -8,6 -40,0 C-8,-6 -6,-8 0,-40 Z" fill="${color}" stroke="#c99a2e" stroke-width="2.5"/>`);

  P.sparkles = (t, cx, cy, rad, seed = 2, n = 8, start = 0, life = 1.6) => {
    if (t < start || t > start + life + 0.6) return '';
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = rad * (0.5 + r() * 0.6), delay = r() * 0.5;
      const k = prog(t, start + delay, start + delay + life);
      if (k <= 0 || k >= 1) continue;
      const sc = Math.sin(k * Math.PI) * (0.5 + r() * 0.6);
      s += P.sparkle(cx + Math.cos(a) * d * (0.6 + k * 0.4), cy + Math.sin(a) * d * (0.6 + k * 0.4), sc);
    }
    return s;
  };

  P.confetti = (t, start, seed = 1, n = 90, colors = ['#0f8a4a', '#ffffff', '#d52b38', '#f6c443', '#3a7ad0', '#f08ab0']) => {
    if (t < start) return '';
    const r = rng(seed);
    let s = '';
    const dt = t - start;
    for (let i = 0; i < n; i++) {
      const x0 = 960 + (r() - 0.5) * 300, vx = (r() - 0.5) * 1500, vy = -600 - r() * 700;
      const x = x0 + vx * dt * 0.8 + Math.sin(dt * 4 + i) * 30;
      const y = 700 + vy * dt + 520 * dt * dt;
      if (y > 1150) continue;
      const rot = dt * (200 + r() * 400) + i * 30, c = colors[i % colors.length];
      s += `<rect x="-9" y="-5" width="18" height="10" rx="2" fill="${c}" stroke="#00000033" stroke-width="1" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(1 ${f(Math.cos(dt * 8 + i) * 100) / 100})"/>`;
    }
    return s;
  };

  P.bulb = (x, y, s = 1, glow = 1) => g(tr(x, y, s),
    `<circle r="${70 + glow * 20}" fill="#fff3a8" opacity="${f(glow * 45) / 100}"/>` +
    Array.from({ length: 8 }, (_, i) => `<path d="M0,-78 L0,-100" stroke="#f6c443" stroke-width="7" stroke-linecap="round" transform="rotate(${i * 45})" opacity="${glow}"/>`).join('') +
    `<path d="M-34,10 C-56,-14 -46,-62 0,-62 C46,-62 56,-14 34,10 L24,30 L-24,30 Z" fill="#fff07a" stroke="${INK}" stroke-width="4"/>` +
    `<rect x="-22" y="30" width="44" height="26" rx="5" fill="#b7b7c4" stroke="${INK}" stroke-width="3.5"/><path d="M-22,40 L22,40 M-22,48 L22,48" stroke="${INK}" stroke-width="2.5"/>` +
    `<ellipse cx="-16" cy="-30" rx="10" ry="16" fill="#fff" opacity=".7" transform="rotate(25 -16 -30)"/>`);

  P.question = (x, y, s = 1, color = '#3a7ad0') => g(tr(x, y, s),
    `<text x="0" y="0" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="200" fill="${color}" stroke="#fff" stroke-width="10" paint-order="stroke">?</text>`);

  P.bubble = (x, y, w, h, tailX, tailY, inner = '', thought = false) => {
    if (thought) {
      return `<circle cx="${tailX}" cy="${tailY}" r="10" fill="#fff" stroke="${INK}" stroke-width="3"/>` +
        `<circle cx="${f(lerp(tailX, x, 0.4))}" cy="${f(lerp(tailY, y + h / 2, 0.4))}" r="16" fill="#fff" stroke="${INK}" stroke-width="3"/>` +
        g(tr(x, y), blob([[w * 0.2, h * 0.3, h * 0.35], [w * 0.5, h * 0.2, h * 0.42], [w * 0.8, h * 0.3, h * 0.35], [w * 0.3, h * 0.7, h * 0.33], [w * 0.7, h * 0.7, h * 0.33]], '#fff', INK, 3.5) + inner);
    }
    return `<path d="M${x + w * 0.35},${y + h - 4} L${tailX},${tailY} L${x + w * 0.55},${y + h - 4} Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#fff" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M${x + w * 0.36},${y + h - 4} L${x + w * 0.54},${y + h - 4}" stroke="#fff" stroke-width="8"/>` + g(tr(x, y), inner);
  };

  // Listón con texto (cartel de nombre).
  P.ribbon = (x, y, text, s = 1, color = '#d52b38', size = 54) => {
    const w = text.length * size * 0.56 + 120;
    return g(tr(x, y, s),
      `<path d="M${-w / 2 - 70},16 L${-w / 2 + 10},16 L${-w / 2 + 10},76 L${-w / 2 - 70},76 L${-w / 2 - 40},46 Z" fill="${color}" stroke="${INK}" stroke-width="4" opacity=".85"/>` +
      `<path d="M${w / 2 + 70},16 L${w / 2 - 10},16 L${w / 2 - 10},76 L${w / 2 + 70},76 L${w / 2 + 40},46 Z" fill="${color}" stroke="${INK}" stroke-width="4" opacity=".85"/>` +
      `<rect x="${-w / 2}" y="-40" width="${w}" height="96" rx="14" fill="${color}" stroke="${INK}" stroke-width="4"/>` +
      `<text x="0" y="${size * 0.32}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${size}" fill="#fff">${A.esc(text)}</text>`);
  };

  P.title = (x, y, text, size, color = '#1f4fa0', stroke = '#fff', sw = 14, weight = 700) =>
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="Fredoka" font-weight="${weight}" font-size="${size}" fill="${color}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke">${A.esc(text)}</text>`;

  P.medal = (x, y, s = 1, rot = 0) => g(tr(x, y, s, rot),
    `<path d="M-40,-120 L-10,-20 L10,-20 L-20,-120 Z" fill="#0f8a4a" stroke="${INK}" stroke-width="3"/><path d="M40,-120 L10,-20 L-10,-20 L20,-120 Z" fill="#d52b38" stroke="${INK}" stroke-width="3"/>` +
    `<circle cx="0" cy="30" r="56" fill="#f0c654" stroke="#8a6116" stroke-width="5"/><circle cx="0" cy="30" r="40" fill="#f8dc84" stroke="#c99a2e" stroke-width="3"/>` +
    `<path d="M0,6 L8,24 L28,26 L13,39 L18,58 L0,48 L-18,58 L-13,39 L-28,26 L-8,24 Z" fill="#e2a72a" stroke="#8a6116" stroke-width="2.5"/>`);

  P.scroll = (x, y, open, s = 1, lines = ['CONCURSO', 'LETRA DEL', 'HIMNO NACIONAL']) => {
    const h = 40 + open * 360;
    let txt = '';
    lines.forEach((l, i) => {
      const yy = -h / 2 + 70 + i * 62;
      if (yy < h / 2 - 50) txt += `<text x="0" y="${f(yy + 20)}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${i === 0 ? 52 : 44}" fill="#5a2e1a">${l}</text>`;
    });
    return g(tr(x, y, s), `<rect x="-200" y="${f(-h / 2)}" width="400" height="${f(h)}" fill="url(#paper)" stroke="${INK}" stroke-width="4"/>` + txt +
      `<rect x="-224" y="${f(-h / 2 - 26)}" width="448" height="44" rx="22" fill="#e8d3a8" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="-224" y="${f(h / 2 - 18)}" width="448" height="44" rx="22" fill="#e8d3a8" stroke="${INK}" stroke-width="4"/>`);
  };

  P.spainPennant = (x, y, s = 1, t = 0) => g(tr(x, y, s),
    `<rect x="-6" y="0" width="12" height="220" rx="5" fill="#b88a4a" stroke="${INK}" stroke-width="3"/>` + P.flagStripes(6, 0, 170, 110, t, ['#c8102e', '#ffc400', '#ffc400', '#c8102e'], [0, 0.25, 0.75, 1]));

  // Bandera de franjas horizontales simple (para España).
  P.flagStripes = (x, y, w, h, t, cols, stops) => {
    const N = 24;
    const dy = (k) => Math.sin(k * 6 - t * 4) * 8 * k;
    let s = '';
    for (let j = 0; j < cols.length; j += 2) {
      const a = stops[j] * h, b = (stops[j + 2] ?? 1) * h;
      void b;
    }
    const bands = [[0, 0.25, '#c8102e'], [0.25, 0.75, '#ffc400'], [0.75, 1, '#c8102e']];
    for (const [a, b, c] of bands) {
      let d = `M0,${f(a * h + dy(0))}`;
      for (let i = 1; i <= N; i++) d += ` L${f((i / N) * w)},${f(a * h + dy(i / N))}`;
      for (let i = N; i >= 0; i--) d += ` L${f((i / N) * w)},${f(b * h + dy(i / N))}`;
      s += `<path d="${d} Z" fill="${c}"/>`;
    }
    void cols;
    return g(tr(x, y), s);
  };

  P.vignette = () => `<rect width="1920" height="1080" fill="url(#vignette)"/>`;

  window.P = P;
})();
