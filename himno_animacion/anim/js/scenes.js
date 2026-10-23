// Las 13 escenas del cuento. Cada escena es una función (t, escena, ctx) -> SVG,
// con t en segundos absolutos; ctx.ph(línea, frase) da el momento exacto de cada frase.
(function () {
  const { f, tr, g, op, prog, ease, pop, win, lerp, clamp, rng } = A;
  const INK = C.INK;

  // Cámara: nunca deja ver fuera del cuadro de 1920x1080 del mundo.
  const cam = (inner, cx, cy, s) => {
    s = Math.max(1, s);
    cx = clamp(cx, 960 / s, 1920 - 960 / s);
    cy = clamp(cy, 540 / s, 1080 - 540 / s);
    return `<g transform="translate(960 540) scale(${f(s * 1000) / 1000}) translate(${f(-cx)} ${f(-cy)})">${inner}</g>`;
  };
  // Interpola la cámara entre llaves [t, cx, cy, s] con suavizado.
  function camKeys(t, keys) {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, ...a] = keys[i], [t1, ...b] = keys[i + 1];
      if (t <= t1) {
        const k = ease.inOut(prog(t, t0, t1));
        return a.map((v, j) => lerp(v, b[j], k));
      }
    }
    return keys[keys.length - 1].slice(1);
  }
  const popIn = (t, start, inner, x, y, d = 0.45) => {
    const k = pop(t, start, d);
    return k <= 0 ? '' : g(`translate(${f(x)} ${f(y)}) scale(${f(Math.max(0.001, k) * 1000) / 1000})`, inner);
  };
  const fadeIn = (t, start, inner, d = 0.4) => op(prog(t, start, start + d), inner);
  const fadeWin = (t, a, b, inner, d = 0.4) => op(win(t, a, b, d, d), inner);
  const label = (x, y, text, size, color = '#2b2b4a') =>
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${size}" fill="${color}" stroke="#fff" stroke-width="${size * 0.16}" stroke-linejoin="round" paint-order="stroke">${A.esc(text)}</text>`;
  // Escritorio visto un poco desde arriba: superficie en trapecio y frente.
  const deskTop = (x, yBack, w, depth) =>
    `<path d="M${x - w / 2 + 60},${yBack} L${x + w / 2 - 60},${yBack} L${x + w / 2},${yBack + depth} L${x - w / 2},${yBack + depth} Z" fill="#b8723f" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M${x - w / 2 + 60},${yBack} L${x + w / 2 - 60},${yBack} L${x + w / 2 - 50},${yBack + 14} L${x - w / 2 + 50},${yBack + 14} Z" fill="#000" opacity=".12"/>` +
    `<rect x="${x - w / 2}" y="${yBack + depth}" width="${w}" height="${1200 - yBack - depth}" fill="url(#woodDark)" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="${x - w / 2}" y="${yBack + depth}" width="${w}" height="16" fill="#9a5a34"/>`;
  const paperFlat = (x, y, w, h, written = 1, rot = 0) => {
    let l = '';
    const n = 6;
    for (let i = 0; i < n; i++) {
      const k = clamp(written * n - i);
      if (k > 0) l += `<path d="M${f(-w * 0.38)},${f(-h * 0.32 + i * h * 0.12)} l${f(w * 0.7 * k * (0.8 + ((i * 37) % 20) / 100))},0" stroke="#6f6585" stroke-width="3" stroke-linecap="round"/>`;
    }
    return g(tr(x, y, 1, rot), `<path d="M${-w / 2 + 12},${-h / 2} L${w / 2 - 12},${-h / 2} L${w / 2},${h / 2} L${-w / 2},${h / 2} Z" fill="url(#paper)" stroke="${INK}" stroke-width="2.5"/>` + l);
  };
  const quillProp = (rot = -30) => (x, y) => P.quill(x + 4, y + 10, rot, 0.7);
  const paperProp = (rot = 0, s = 0.6) => (x, y, a) => P.paper(x + 30, y - 40, rot, s, 6, 1);
  const textureOverlay = () => `<rect width="1920" height="1080" fill="url(#vignette)"/>`;

  const S = {};

  // ---------------------------------------------------------------- 0. portada
  S.titulo = (t) => {
    let s = P.sky() + P.clouds(t, 2, 6, 60, 360, 10);
    s += P.hills(760) + P.tree(170, 860, 1.1, Math.sin(t) * 2) + P.tree(1780, 880, 1.2, Math.sin(t + 1) * 2);
    s += P.flagpole(1480, 250, 640) + P.flag(1487, 262, 330, 210, t, 14);
    s += P.bush(1650, 900, 1.2) + P.bush(260, 930, 1.1);
    s += P.flowers(930, t, 3, 22);
    const k1 = pop(t, 0.3, 0.6), k2 = prog(t, 1.2, 1.8);
    s += g(`translate(820 330) scale(${f(Math.max(0.001, k1) * 1000) / 1000})`, P.title(0, -60, 'El Himno Nacional', 128, '#1f4fa0', '#fff', 22) + P.title(0, 90, 'Mexicano', 150, '#c8312b', '#fff', 22));
    s += op(k2, P.title(820, 560, 'Una historia de amor, poesía y mucho talento', 56, '#2b6b3f', '#fff', 14, 600));
    const up = ease.back(prog(t, 0.8, 1.6));
    s += C.kid({ t, x: 520, y: 1260 - up * 260, s: 1.15, kind: 'boy', shirt: '#3aa35b', blinkSeed: 2, armR: [150 + Math.sin(t * 8) * 15, 20] });
    s += C.kid({ t, x: 820, y: 1280 - up * 260, s: 1.1, kind: 'girl', shirt: '#f48fb1', band: '#e94c6a', blinkSeed: 5, armL: [140 + Math.sin(t * 8 + 1) * 15, 25] });
    s += P.sparkles(t, 820, 300, 420, 4, 10, 0.5, 2.0);
    return s + textureOverlay();
  };

  // ---------------------------------------------------------------- 1. plaza
  S.plaza = (t, sc, X) => {
    const n1 = X.L('N01'), s01 = X.L('S01');
    const showSA = X.ph('N01', 3) - 0.2;
    let world = P.sky() + P.clouds(t, 7, 6, 40, 330, 9);
    world += P.cathedral(1240, 700, 1.05);
    world += P.tree(560, 720, 0.9, Math.sin(t) * 2) + P.tree(1820, 720, 1.0, Math.sin(t + 2) * 2) + P.tree(-20, 740, 1.1);
    world += P.plaza(700);
    world += P.flagpole(300, 180, 760) + P.flag(307, 192, 300, 190, t, 14);
    for (let i = 0; i < 5; i++) world += C.musician({ t, x: 1500 + i * 70, y: 760, s: 0.32, seed: i, instrument: 'trumpet' });
    // Santa Anna
    const enter = ease.out(prog(t, showSA, showSA + 1.2));
    const talk = X.mouth('S01', t);
    const inS01 = t >= s01.start - 0.2 && t <= s01.end + 0.2;
    const fist = inS01 && t < X.ph('S01', 1) ? ease.out(prog(t, s01.start, s01.start + 0.5)) : 0;
    const openArm = inS01 && t >= X.ph('S01', 1) && t < X.ph('S01', 2) ? ease.out(prog(t, X.ph('S01', 1), X.ph('S01', 1) + 0.4)) : 0;
    const chest = inS01 && t >= X.ph('S01', 2) ? ease.out(prog(t, X.ph('S01', 2), X.ph('S01', 2) + 0.4)) : 0;
    const idea = prog(t, X.ph('N02', 1) + 1.5, X.ph('N02', 1) + 2.0) * (1 - prog(t, s01.start - 0.3, s01.start));
    let armR = [12, 8], armL = [12, 8];
    if (idea > 0) armR = [lerp(12, 40, idea), lerp(8, 120, idea)];
    if (fist > 0) armR = [lerp(12, 150, fist), lerp(8, 20, fist)];
    if (openArm > 0) armR = [lerp(150, 70, openArm), lerp(20, 30, openArm)];
    if (chest > 0) { armR = [lerp(70, 18, chest), lerp(30, -120, chest)]; }
    const scrollOpen = ease.inOut(prog(t, X.ph('N03', 1) + 0.3, X.ph('N03', 1) + 1.6));
    if (scrollOpen > 0) armL = [lerp(12, 50, Math.min(1, scrollOpen * 2)), lerp(8, 60, Math.min(1, scrollOpen * 2))];
    if (enter > 0) {
      world += g(`translate(${f(lerp(1150, 0, enter))} 0)`, C.santaAnna({
        t, x: 880, y: 620, s: 1.12, full: true, step: enter < 1 ? t * 7 : 0, mouth: talk, blinkSeed: 1,
        smile: inS01 ? 0.7 : 0.55, armR, armL, look: t < X.ph('N02', 1) ? [0, 0] : [0.3, -0.2], browUp: idea * 0.8 + (inS01 ? 0.3 : 0),
      }));
    }
    if (t < s01.start) world += popIn(t, X.ph('N02', 1) + 1.6, P.bulb(0, 0, 1, 0.8 + 0.2 * Math.sin(t * 6)), 1000, 190);
    world += t < s01.start ? P.sparkles(t, 1000, 190, 140, 5, 8, X.ph('N02', 1) + 1.6, 1.4) : '';
    if (scrollOpen > 0) world += P.scroll(1330, 380, scrollOpen, 0.9) + P.sparkles(t, 1330, 380, 260, 9, 10, X.ph('N03', 1) + 1.2, 1.6);
    if (inS01) world += P.floatingNotes(t, 1100, 520, 300, 6, 6);
    const [cx, cy, cs] = camKeys(t, [
      [sc.start, 960, 540, 1.0], [showSA, 960, 520, 1.04], [X.ph('N02', 0), 900, 470, 1.25], [s01.start, 880, 430, 1.45],
      [s01.end, 880, 430, 1.5], [X.ph('N03', 1), 1020, 470, 1.15], [sc.end, 1040, 480, 1.18],
    ]);
    let s = cam(world, cx, cy, cs);
    // placa "1853" y nombre
    const plate = `<rect x="-190" y="-80" width="380" height="160" rx="26" fill="#fff6dc" stroke="#c99a2e" stroke-width="8"/><rect x="-176" y="-66" width="352" height="132" rx="18" fill="none" stroke="#e9c46a" stroke-width="3"/>` + P.title(0, 38, '1853', 110, '#8a4b14', '#fff6dc', 2);
    s += fadeWin(t, X.ph('N01', 2), X.ph('N01', 3) + 2.5, popIn(t, X.ph('N01', 2), plate, 1500, 170));
    s += fadeWin(t, X.ph('N01', 0) - 0.1, X.ph('N01', 1) + 0.6, P.title(960, 200, 'Había una vez…', 120, '#1f4fa0', '#fff', 18), 0.5);
    s += fadeWin(t, X.ph('N01', 3) + 2.4, X.ph('N02', 0) + 0.5, popIn(t, X.ph('N01', 3) + 2.4, P.ribbon(0, 0, 'Antonio López de Santa Anna', 1, '#203a6e', 50), 960, 150));
    return s + textureOverlay();
  };

  // ---------------------------------------------------------------- 2. estudio
  function studyBg(t, night = false) {
    let s = P.room(night ? 'wallNight' : 'wallWarm', 840);
    s += P.bookshelf(90, 150, 380, 560, 7);
    s += P.window(1300, 150, 420, 340, t, night, night ? '#7a3550' : '#e0607e');
    if (!night) s += P.beams(1300, 150, t);
    return s;
  }
  S.estudio = (t, sc, X) => {
    let world = studyBg(t);
    const enter = ease.back(prog(t, X.ph('N05', 0) + 0.2, X.ph('N05', 0) + 1.1));
    const n6 = X.L('N06');
    const writing = t >= X.ph('N06', 2);
    const wr = writing ? Math.sin(t * 14) * 4 : 0;
    const lookCam = t >= X.ph('N06', 1) && t < X.ph('N06', 2) + 0.2;
    const lines = clamp(prog(t, X.ph('N06', 2), n6.end) * 1.1);
    const pose = {
      armL: writing ? [10, -60 + wr] : [10, -60], armR: [10, -60],
      propL: quillProp(-40 + wr), look: lookCam ? [0, 0] : writing ? [-0.3, 0.8] : [0.4, 0.3],
      eyeOpen: writing && !lookCam ? 0.7 : undefined, smile: 0.8, browUp: lookCam ? 0.7 : 0,
    };
    const desk = paperFlat(860, 850, 300, 110, writing ? lines : 0.35) + P.inkwell(1210, 845, 0.9) +
      `<rect x="420" y="790" width="200" height="50" rx="8" fill="#2e7d5b" stroke="${INK}" stroke-width="3"/><rect x="430" y="770" width="190" height="34" rx="8" fill="#a0522d" stroke="${INK}" stroke-width="3"/>`;
    const dy = (1 - enter) * 420;
    if (enter > 0) world += C.francisco({ t, x: 900, y: 820 + dy, s: 1.25, blinkSeed: 2, part: 'body', ...pose });
    world += deskTop(900, 780, 1100, 120) + desk;
    if (enter > 0) world += C.francisco({ t, x: 900, y: 820 + dy, s: 1.25, blinkSeed: 2, part: 'arms', ...pose });
    // efectos
    const q = 1 - prog(t, X.ph('N05', 0), X.ph('N05', 0) + 0.4);
    world += op(q * prog(t, X.ph('N04', 1) - 0.2, X.ph('N04', 1) + 0.3), P.question(900, 520 + Math.sin(t * 3) * 12, 1.4 + Math.sin(t * 4) * 0.05));
    world += P.floatingHearts(t, 1150, 520, 260, 8, 7, X.ph('N06', 3));
    if (t >= X.ph('N06', 4) - 0.1) world += op(win(t, X.ph('N06', 4), n6.end + 0.5, 0.3, 0.3), popIn(t, X.ph('N06', 4), `<path d="M-90,-50 Q-45,-70 0,-50 Q45,-70 90,-50 L90,50 Q45,30 0,50 Q-45,30 -90,50 Z" fill="#fff8ec" stroke="${INK}" stroke-width="4"/><path d="M0,-50 L0,50" stroke="${INK}" stroke-width="3"/>` + `<path d="M-74,-20 l56,-6 M-74,0 l56,-6 M18,-26 l56,6 M18,-6 l56,6" stroke="#8a7aa0" stroke-width="4"/>`, 640, 360));
    if (t >= X.ph('N06', 5)) {
      const words = ['versos', 'amor', 'patria', 'poesía'];
      words.forEach((w, i) => {
        const st = X.ph('N06', 5) + i * 0.35;
        const k = prog(t, st, st + 3);
        if (k > 0 && k < 1) world += op(Math.sin(k * Math.PI), label(lerp(900, 560 + i * 260, k), lerp(820, 260 + (i % 2) * 80, ease.out(k)), w, 54, ['#c8312b', '#e0517f', '#2e7d5b', '#3a7ad0'][i]));
      });
    }
    const [cx, cy, cs] = camKeys(t, [[sc.start, 960, 540, 1.0], [X.ph('N05', 0), 950, 540, 1.04], [X.ph('N06', 1), 900, 460, 1.22], [X.ph('N06', 2) + 0.5, 920, 560, 1.1], [sc.end, 940, 560, 1.14]]);
    let s = cam(world, cx, cy, cs);
    s += fadeWin(t, X.ph('N05', 1) + 0.6, X.ph('N06', 0) + 0.2, popIn(t, X.ph('N05', 1) + 0.6, P.ribbon(0, 0, 'Francisco González Bocanegra', 1, '#7a4a2e', 50), 960, 130));
    s += fadeWin(t, X.ph('N06', 0), X.ph('N06', 1) + 0.6, popIn(t, X.ph('N06', 0), P.ribbon(0, 0, '¡Poeta!', 1.1, '#c8312b', 64), 960, 130));
    s += t >= X.ph('N06', 1) && t < X.ph('N06', 2) ? popIn(t, X.ph('N06', 1) + 0.3, P.question(0, 0, 0.6, '#e0a020'), 1280, 300) : '';
    return s + textureOverlay();
  };

  // ---------------------------------------------------------------- 3. novios
  function parlor(t) {
    let s = `<rect width="1920" height="1080" fill="url(#wallPink)"/>`;
    s += P.window(1240, 110, 480, 420, t, false, '#d64b5b') + P.beams(1240, 110, t);
    s += `<rect x="0" y="560" width="1920" height="40" fill="#c98f62" stroke="${INK}" stroke-width="3"/>`;
    s += `<rect x="0" y="600" width="1920" height="480" fill="#e8b48e"/>`;
    s += `<path d="M120,720 Q120,600 260,600 L760,600 Q900,600 900,720 L900,900 L120,900 Z" fill="#b8333d" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M160,700 Q160,640 260,640 L760,640 Q860,640 860,700" fill="none" stroke="#d65a62" stroke-width="10" stroke-linecap="round"/>`;
    s += P.bookshelf(1760, 260, 240, 420, 3);
    return s;
  }
  S.novios = (t, sc, X) => {
    let world = parlor(t);
    const lup = ease.out(prog(t, X.ph('N07', 0) + 1.0, X.ph('N07', 0) + 2.2));
    const l01 = X.L('L01');
    const shake = t >= X.ph('N08', 0) && t < X.ph('N08', 0) + 2.6 ? Math.sin((t - X.ph('N08', 0)) * 9) * 7 * (1 - prog(t, X.ph('N08', 0) + 1.8, X.ph('N08', 0) + 2.6)) : 0;
    const worried = t >= X.ph('N08', 0) && t < X.ph('N08', 2) ? 1 : 0;
    const ideaT = X.ph('N08', 2) + 0.2;
    const frTurn = lup > 0.5 ? -0.5 : 0.2;
    world += C.francisco({
      t, x: 1180, y: 930, s: 1.3, blinkSeed: 2, turn: frTurn, tilt: shake, look: lup > 0.5 ? [-0.9, -0.3] : [0.2, -0.6],
      browTilt: worried, smile: worried ? 0.1 : 0.8, blush: worried ? 0.7 : 0.45, armL: [10, -40], armR: [10, -40],
      propL: (x, y) => P.paper(x + 40, y - 20, -10, 0.55, 6, 1),
    });
    if (lup > 0) {
      const talk = X.mouth('L01', t);
      const inL = t >= l01.start - 0.2 && t <= l01.end + 0.2;
      world += C.lupita({
        t, x: lerp(-200, 720, lup), y: 940, s: 1.3, blinkSeed: 3, mouth: talk, smile: 0.9, turn: 0.45, look: [0.9, 0.1],
        armR: inL ? [64 + Math.sin(t * 3) * 4, 14] : [58, 18], armL: inL && t > X.ph('L01', 1) ? [70 + Math.sin(t * 5) * 10, 70] : [10, 6],
        browUp: inL ? 0.4 : 0, tilt: inL ? Math.sin(t * 2) * 3 : 0,
      });
      world += fadeWin(t, X.ph('N07', 0) + 2.0, X.ph('N07', 1) + 1.5, popIn(t, X.ph('N07', 0) + 2.0, P.ribbon(0, 0, 'Lupita', 0.9, '#e0517f', 58), 720, 150));
    }
    world += P.floatingHearts(t, 950, 420, 400, 13, 8, X.ph('N07', 0) + 1.6);
    world += P.sparkles(t, 1250, 760, 160, 3, 8, X.ph('N07', 1), 2.0);
    if (worried) world += `<path d="M1310,300 C1300,320 1296,332 1310,342 C1324,332 1320,320 1310,300 Z" fill="#9fd4f5" stroke="${INK}" stroke-width="3" opacity="${f(prog(t, X.ph('N08', 0) + 0.5, X.ph('N08', 0) + 0.9))}"/>`;
    world += popIn(t, ideaT, P.bulb(0, 0, 0.9, 0.8 + 0.2 * Math.sin(t * 6)), 720, 130) + P.sparkles(t, 720, 130, 140, 6, 8, ideaT, 1.3);
    const [cx, cy, cs] = camKeys(t, [[sc.start, 1100, 500, 1.15], [X.ph('N07', 0) + 1.0, 960, 540, 1.0], [l01.start, 920, 470, 1.12], [X.ph('N08', 0), 1060, 450, 1.18], [ideaT - 0.3, 860, 440, 1.12], [sc.end, 840, 440, 1.15]]);
    return cam(world, cx, cy, cs) + textureOverlay();
  };

  // ---------------------------------------------------------------- 4. encierro
  S.encierro = (t, sc, X) => {
    const closeT = X.ph('N09', 3) + 0.9, keyT = X.ph('N09', 3) + 1.5;
    const l02 = X.L('L02');
    const outside = t >= l02.start - 0.5;
    let world;
    if (!outside) {
      world = P.room('wallWarm', 840);
      world += P.window(160, 170, 300, 260, t, false, '#e0607e');
      const doorOpen = 1 - ease.inOut(prog(t, closeT - 0.5, closeT));
      world += P.door(1420, 200, 330, 640, doorOpen, { inside: '#5a3a28' });
      // mesa con papel y pluma
      world += `<rect x="560" y="640" width="560" height="34" rx="10" fill="#a8653a" stroke="${INK}" stroke-width="4"/><rect x="600" y="674" width="26" height="170" fill="#8f5532" stroke="${INK}" stroke-width="3"/><rect x="1054" y="674" width="26" height="170" fill="#8f5532" stroke="${INK}" stroke-width="3"/>`;
      world += P.paper(780, 600, -8, 0.5, 6, 0) + P.quill(900, 636, -60, 0.6) + P.inkwell(980, 640, 0.7);
      world += P.sparkles(t, 840, 600, 140, 2, 8, X.ph('N09', 1), 1.6);
      // caminata: entran por la puerta y van a la mesa
      const walk = prog(t, sc.start + 0.4, X.ph('N09', 0) + 2.6);
      const fx = lerp(1500, 860, ease.inOut(walk));
      const lupBack = prog(t, X.ph('N09', 2) - 0.3, closeT - 0.4);
      const lx = lerp(lerp(1700, 1120, ease.inOut(walk)), 1620, ease.inOut(lupBack));
      const lupVisible = t < closeT - 0.25;
      const surprised = t > closeT ? 1 : 0;
      world += C.francisco({ t, x: fx, y: 590, s: 0.82, full: true, step: walk > 0 && walk < 1 ? t * 8 : 0, blinkSeed: 2,
        turn: surprised ? 0.6 : -0.3, look: surprised ? [0.9, 0] : [-0.6, 0], browUp: surprised, mouth: surprised ? 0.45 : 0, smile: surprised ? 0.1 : 0.5,
        armR: walk < 1 ? [30, 10] : [12, 8] });
      if (lupVisible) world += C.lupita({ t, x: lx, y: 600, s: 0.82, full: true, blinkSeed: 3, turn: lupBack > 0 ? 0.6 : -0.4, look: lupBack > 0 ? [0.8, 0] : [-0.8, 0],
        armL: walk < 1 ? [60, 10] : [12, 8], smile: 0.9 });
      if (t > keyT - 0.1) world += popIn(t, keyT, P.key(0, 0, -20 + 70 * ease.out(prog(t, keyT, keyT + 0.5)), 0.8) + label(60, -60, '¡clic!', 60, '#c8312b'), 1585, 450);
    } else {
      world = `<rect width="1920" height="1080" fill="url(#wallPink)"/><rect y="840" width="1920" height="240" fill="url(#floorWood)"/>`;
      world += P.door(620, 200, 360, 640, 0);
      const talk = X.mouth('L02', t);
      world += C.lupita({ t, x: 1260, y: 600, s: 1.0, full: true, blinkSeed: 3, mouth: talk, smile: 0.7, turn: -0.5, look: [-0.8, 0],
        armL: [135 + Math.sin(t * 7) * 6, 30], propL: (x, y) => P.key(x - 10, y - 30, -70, 0.55), armR: [25, -100], browTilt: -0.4, browUp: 0.3 });
    }
    const [cx, cy, cs] = outside ? camKeys(t, [[l02.start - 0.5, 1000, 540, 1.05], [sc.end, 1080, 520, 1.15]])
      : camKeys(t, [[sc.start, 1100, 520, 1.0], [X.ph('N09', 1), 900, 560, 1.15], [X.ph('N09', 3) - 0.2, 1300, 520, 1.12], [l02.start - 0.5, 1340, 520, 1.15]]);
    return cam(world, cx, cy, cs) + textureOverlay();
  };

  // ---------------------------------------------------------------- 5. noche
  S.noche = (t, sc, X) => {
    let world = studyBg(t, true);
    const hours = ease.inOut(prog(t, X.ph('N12', 1), X.ph('N12', 1) + 2.4)) * 4;
    const candleH = 120 - hours * 12;
    const thinking = t < X.ph('N11', 0);
    const writing = t >= X.ph('N11', 0) && t < X.ph('N12', 3);
    const wr = writing ? Math.sin(t * 16) * 5 : 0;
    const dots = thinking ? [X.ph('N10', 0), X.ph('N10', 1), X.ph('N10', 2)].filter((x) => t >= x).length : 0;
    const pose = thinking
      ? { armL: [24, -150], armR: [10, -60], look: [0.3, -0.9], smile: 0.4, tilt: 4 }
      : { armL: [10, -60 + wr], armR: [10, -60], propL: quillProp(-40 + wr), look: [-0.3, 0.8], eyeOpen: writing ? 0.75 : undefined, smile: 0.7 };
    const done = t >= X.ph('N12', 3);
    if (done) Object.assign(pose, { armL: [140, 30], armR: [140, 30], look: [0, 0], eyeOpen: undefined, smile: 1, mouth: 0.4, propL: null, happyClosed: true });
    world += C.francisco({ t, x: 900, y: 820, s: 1.25, blinkSeed: 2, part: 'body', ...pose, eyeOpen: done ? 0.1 : pose.eyeOpen });
    world += deskTop(900, 780, 1100, 120);
    const stack = clamp(prog(t, X.ph('N11', 1), X.ph('N12', 3)));
    for (let i = 0; i < Math.floor(stack * 9); i++) world += g(tr(560 + (i % 2) * 6, 830 - i * 7), `<path d="M-100,-20 L100,-20 L110,20 L-110,20 Z" fill="url(#paper)" stroke="${INK}" stroke-width="2"/>`);
    world += paperFlat(880, 850, 300, 110, thinking ? 0 : (t * 0.6) % 1);
    world += P.candle(1240, 850, t, candleH, 0.9);
    world += C.francisco({ t, x: 900, y: 820, s: 1.25, blinkSeed: 2, part: 'arms', ...pose });
    if (dots) {
      let d = '';
      for (let i = 0; i < dots; i++) d += `<circle cx="${80 + i * 70}" cy="80" r="${16 + Math.sin(t * 6 + i) * 2}" fill="#5a4a6a"/>`;
      world += op(1 - prog(t, X.ph('N10', 3), X.ph('N10', 3) + 0.4), P.bubble(1030, 220, 300, 170, 1000, 420, d, true));
    }
    if (t >= X.ph('N10', 3)) world += P.sparkles(t, 900, 350, 220, 11, 10, X.ph('N10', 3), 1.5);
    if (t >= X.ph('N10', 4) && t < X.ph('N11', 1) + 2) {
      const letters = 'AMORPATRIAVERSOS';
      for (let i = 0; i < letters.length; i++) {
        const st = X.ph('N10', 4) + i * 0.18, k = prog(t, st, st + 3.2);
        if (k <= 0 || k >= 1) continue;
        const a = i * 0.9 + k * 2.4, r = 80 + k * 520;
        const lx = 900 + Math.cos(a) * r, ly = 300 + Math.sin(a) * r * 0.45 - k * 120;
        world += op(Math.min(1, Math.sin(k * Math.PI) * 1.6), `<circle cx="${f(lx)}" cy="${f(ly - 30)}" r="60" fill="#fff3b0" opacity=".35" filter="url(#blur12)"/>` +
          `<text x="${f(lx)}" y="${f(ly)}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="96" fill="${['#ffd84a', '#ff9fbf', '#8fdcff', '#b6ec8a'][i % 4]}" stroke="#3a2a50" stroke-width="10" stroke-linejoin="round" paint-order="stroke">${letters[i]}</text>`);
      }
    }
    if (hours > 0) world += fadeWin(t, X.ph('N12', 1) - 0.2, X.ph('N12', 3), popIn(t, X.ph('N12', 1) - 0.2, P.clock(0, 0, 110, 9 + hours) + label(0, 190, `${Math.round(hours)} horas`, 56, '#c8312b'), 520, 380));
    if (done) {
      for (let i = 0; i < 10; i++) {
        const st = X.ph('N12', 3) + 0.4 + i * 0.22;
        const a = Math.PI * (1.08 + (i / 9) * 0.84);
        world += popIn(t, st, P.paper(0, 0, (i - 4.5) * 7, 0.55, 6, 1) + label(0, 90, String(i + 1), 54, '#c8312b'), 900 + Math.cos(a) * 560, 640 + Math.sin(a) * 440);
      }
      world += P.sparkles(t, 900, 300, 500, 14, 14, X.ph('N12', 3) + 0.3, 2.5);
    }
    const [cx, cy, cs] = camKeys(t, [[sc.start, 960, 540, 1.0], [X.ph('N10', 0), 960, 420, 1.15], [X.ph('N11', 0), 900, 560, 1.22], [X.ph('N12', 1) - 0.3, 900, 520, 1.05], [X.ph('N12', 3), 920, 470, 1.0], [sc.end, 920, 470, 1.04]]);
    return cam(world, cx, cy, cs) + `<rect width="1920" height="1080" fill="#1a1440" opacity=".18"/>` + textureOverlay();
  };

  // ---------------------------------------------------------------- 6. puerta
  S.puerta = (t, sc, X) => {
    const f01 = X.L('F01'), n15 = X.L('N15');
    const openT = X.ph('N15', 1) + 1.4;
    const open = ease.inOut(prog(t, openT - 0.2, openT + 0.8));
    const leave = ease.inOut(prog(t, X.ph('N15', 2) + 0.6, n15.end + 1.2));
    let world = `<rect width="1920" height="1080" fill="url(#wallPink)"/>` +
      `<rect y="560" width="1920" height="30" fill="#c98f62" stroke="${INK}" stroke-width="3"/><rect y="840" width="1920" height="240" fill="url(#floorWood)"/>` +
      Array.from({ length: 8 }, (_, i) => `<path d="M${i * 280 - 100},1080 L${i * 240 + 40},840" stroke="#7a4527" stroke-opacity=".3" stroke-width="3"/>`).join('');
    world += `<rect x="1500" y="250" width="200" height="150" rx="10" fill="#f4e6cf" stroke="${INK}" stroke-width="4"/><circle cx="1600" cy="325" r="45" fill="#f6c443" opacity=".6"/>`;
    // Francisco dentro (visible al abrir)
    const inside = C.francisco({ t, x: 0, y: 0, s: 0.86, full: true, blinkSeed: 2, smile: 1, happyClosed: true, eyeOpen: 0.1, armL: [130, 30], armR: [20, 10] });
    const behind = open > 0 ? `<g clip-path="url(#doorClip)"><rect width="420" height="640" fill="#4b3a5a"/>` + (leave <= 0 ? g('translate(200 380)', inside) : '') + `</g>` : '';
    world += `<clipPath id="doorClip"><rect x="0" y="0" width="420" height="640"/></clipPath>`;
    world += P.door(420, 200, 420, 640, open, { inside: '#4b3a5a', behind });
    // hojas que salen por debajo
    const papers = [2, 3, 4].map((i, k) => ({ t0: X.ph('N14', i), k }));
    papers.forEach(({ t0, k }) => {
      const m = ease.out(prog(t, t0, t0 + 0.9));
      if (m <= 0) return;
      const pickup = prog(t, X.ph('N15', 0) - 0.4, X.ph('N15', 0) + 0.2);
      if (pickup >= 1) return;
      world += op(1 - pickup, g(tr(lerp(640, 980 + k * 120, m), 848 + k * 6, 1, (k - 1) * 8), `<path d="M-90,-10 L90,-10 L110,14 L-110,14 Z" fill="url(#paper)" stroke="${INK}" stroke-width="2.5"/><path d="M-60,-2 l100,0 M-66,6 l90,0" stroke="#7a6a8a" stroke-width="2.5"/>`));
    });
    // Lupita
    const lt = X.ph('N13', 0);
    const excited = t >= X.ph('N15', 0) && t < X.ph('N15', 2);
    const jump = excited ? Math.abs(Math.sin((t - X.ph('N15', 0)) * 7)) * 50 * (1 - prog(t, X.ph('N15', 1), X.ph('N15', 1) + 0.6)) : 0;
    const holding = t >= X.ph('N15', 0) - 0.2;
    const listen = t >= lt + 0.4;
    const lx = lerp(1260, 2400, leave);
    world += C.lupita({ t, x: lx, y: 590 - jump, s: 0.95, full: true, blinkSeed: 3, turn: -0.5, look: listen ? [-0.9, holding ? 0.4 : 0] : [0, 0],
      browUp: listen ? 0.6 : 0, mouth: t >= X.ph('N14', 2) && t < X.ph('N15', 0) ? 0.35 : excited ? 0.5 : 0, smile: 1,
      armL: holding ? [40, -90] : [10, 6], armR: holding ? [40, -90] : [10, 6], step: leave > 0 && leave < 1 ? t * 8 : 0,
      propL: holding ? (x, y) => P.paper(x + 40, y - 70, 6, 0.55, 6, 1) : null });
    if (excited) world += P.floatingHearts(t, 1260, 260, 260, 4, 7, X.ph('N15', 0));
    if (leave > 0) world += C.francisco({ t, x: lerp(640, 2200, leave), y: 590, s: 0.86, full: true, step: t * 8, blinkSeed: 2, smile: 1, armR: [30, 10] });
    // globo de diálogo
    world += fadeWin(t, f01.start - 0.1, f01.end + 0.6, popIn(t, f01.start - 0.1, P.bubble(-240, -70, 480, 140, -40, 120, label(240, 92, '¡Ya terminé!', 64, '#7a4a2e')), 680, 120));
    world += P.sparkles(t, 860, 560, 420, 7, 10, openT, 1.6);
    const [cx, cy, cs] = camKeys(t, [[sc.start, 960, 540, 1.0], [f01.start, 860, 500, 1.08], [X.ph('N14', 2) - 0.4, 920, 650, 1.18], [X.ph('N15', 0), 1050, 560, 1.08], [openT, 900, 540, 1.0], [sc.end, 1000, 540, 1.0]]);
    return cam(world, cx, cy, cs) + textureOverlay();
  };

  // ---------------------------------------------------------------- 7. ganador
  S.ganador = (t, sc, X) => {
    const winT = X.ph('N16', 1) + 2.0;
    const won = t >= winT;
    let world = `<rect width="1920" height="1080" fill="#f2dcb8"/>` + `<rect y="0" width="1920" height="700" fill="#ead1a8"/>`;
    world += P.flagpole(360, 180, 560) + P.flag(367, 192, 260, 166, t, 10) + P.flagpole(1560, 180, 560) + P.flag(1567, 192, 260, 166, t + 1, 10);
    world += P.curtains(t);
    const jumpF = won && t > X.ph('N16', 2) ? Math.abs(Math.sin((t - X.ph('N16', 2)) * 7)) * 40 : 0;
    world += C.santaAnna({ t, x: 1250, y: 820, s: 1.2, blinkSeed: 1, smile: won ? 0.9 : 0.5, turn: -0.4, look: [-0.8, 0],
      armL: won ? [60 + Math.sin(t * 12) * 12, 90] : [12, 8], armR: won ? [60 - Math.sin(t * 12) * 12, 90] : [12, 8] });
    world += C.francisco({ t, x: 680, y: 830 - jumpF, s: 1.2, blinkSeed: 2, smile: won ? 1 : 0.6, mouth: won ? 0.5 : 0, happyClosed: won, eyeOpen: won ? 0.1 : undefined,
      turn: 0.3, armR: won ? [150, 20] : [30, -100], armL: [30, -100], propR: won ? null : (x, y) => P.paper(x - 40, y - 40, -6, 0.6, 6, 1), propL: (x, y) => P.paper(x + 30, y - 40, 6, 0.6, 6, 1) });
    if (won) world += popIn(t, winT + 0.2, P.medal(0, 0, 0.6), 680, 680 - jumpF);
    world += `<rect x="300" y="880" width="1320" height="60" rx="10" fill="#b5242d" stroke="${INK}" stroke-width="4"/>`;
    world += P.crowd(900, t, 5, 16);
    world += won ? P.confetti(t, winT, 3, 120) : '';
    if (won) world += popIn(t, winT + 0.1, P.ribbon(0, 0, '¡Ganador de la letra!', 1, '#0f8a4a', 56), 960, 140);
    const spot = won ? 0 : 0.25 * prog(t, X.ph('N16', 0), X.ph('N16', 0) + 0.5);
    const [cx, cy, cs] = camKeys(t, [[sc.start, 960, 540, 1.0], [winT - 0.5, 820, 500, 1.15], [winT + 0.3, 960, 540, 1.0], [sc.end, 960, 520, 1.03]]);
    return cam(world, cx, cy, cs) + (spot ? `<rect width="1920" height="1080" fill="#000" opacity="${f(spot * 100) / 100}"/>` : '') + textureOverlay();
  };

  // ---------------------------------------------------------------- 8. Jaime Nunó
  S.nuno = (t, sc, X) => {
    const appear = X.ph('N18', 1);
    let world = `<rect width="1920" height="1080" fill="url(#goldGlow)"/>`;
    world += P.floatingNotes(t, 960, 900, 1700, 21, 12, ['#c98a1c', '#b5651d', '#d4a017', '#a0522d']);
    if (t < appear) {
      // letra sin música
      const k = ease.back(prog(t, sc.start + 0.2, sc.start + 1.0));
      let sheet = `<rect x="-360" y="-300" width="720" height="560" rx="16" fill="url(#paper)" stroke="${INK}" stroke-width="5"/>` +
        P.title(0, -220, 'HIMNO NACIONAL', 54, '#5a2e1a', '#fff', 0);
      for (let i = 0; i < 5; i++) sheet += `<path d="M-280,${-150 + i * 34} l${520 - (i % 2) * 80},0" stroke="#6f6585" stroke-width="6" stroke-linecap="round"/>`;
      sheet += `<path d="M220,-130 l22,24 l44,-52" fill="none" stroke="#0f8a4a" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
      for (let i = 0; i < 5; i++) sheet += `<path d="M-280,${60 + i * 22} L280,${60 + i * 22}" stroke="#8a7a6a" stroke-width="3"/>`;
      sheet += P.note(-250, 130, 0.9, '#8a7a6a');
      sheet += op(prog(t, X.ph('N17', 1), X.ph('N17', 1) + 0.4), P.question(150, 170, 0.75 + Math.sin(t * 5) * 0.04, '#c8312b'));
      world += g(`translate(960 470) scale(${f(Math.max(0.001, k) * 1000) / 1000})`, sheet);
    } else {
      const conduct = t >= X.ph('N19', 2);
      const swing = Math.sin(t * 5);
      if (conduct) {
        const k = ease.out(prog(t, X.ph('N19', 2), X.ph('N19', 2) + 1));
        for (let i = 0; i < 6; i++) world += g(`translate(0 ${f((1 - k) * 300)})`, C.musician({ t, x: 200 + i * 230 + (i > 2 ? 600 : 0), y: 720, s: 0.9, seed: i, instrument: i % 3 === 1 ? 'drum' : 'trumpet', mustache: i % 2 === 0 }));
      }
      const k = ease.back(prog(t, appear, appear + 0.7));
      world += g(`translate(0 ${f((1 - k) * 600)})`, C.nuno({ t, x: 960, y: 930, s: 1.4, blinkSeed: 4, smile: 0.6, turn: conduct ? 0.2 : 0,
        armR: conduct ? [120 + swing * 25, 40 + swing * 20] : [12, 8], propR: conduct ? (x, y, a) => g(tr(x, y, 1, a - 60), `<rect x="0" y="-4" width="170" height="8" rx="4" fill="#f4ead2" stroke="${INK}" stroke-width="2"/>`) : null,
        armL: conduct ? [70 - swing * 10, 50] : [12, 8] }));
      world += P.sparkles(t, 960, 400, 400, 17, 12, appear, 1.6);
      if (t >= X.ph('N19', 0)) world += popIn(t, X.ph('N19', 0) + 0.3, P.spainPennant(0, 0, 1.2, t) + label(110, -30, 'España', 56, '#c8102e'), 230, 120);
    }
    const [cx, cy, cs] = camKeys(t, [[sc.start, 960, 540, 1.05], [appear, 960, 540, 1.0], [X.ph('N19', 2), 960, 540, 1.0], [sc.end, 960, 520, 1.03]]);
    let s = cam(world, cx, cy, cs);
    s += fadeWin(t, X.ph('N18', 2), X.ph('N19', 0) + 0.8, popIn(t, X.ph('N18', 2), P.ribbon(0, 0, 'Jaime Nunó', 1.1, '#25262e', 62), 960, 130));
    return s + textureOverlay();
  };

  // ---------------------------------------------------------------- 9. La Habana
  S.habana = (t, sc, X) => {
    const sail = X.ph('N20', 1);
    let s;
    if (t < sail - 0.2) {
      let world = P.sky() + P.clouds(t, 12, 5, 40, 260, 14) + P.sea(560, t);
      world += P.morro(260, 600, 0.8) + P.ship(1450, 560, 0.75, t) + P.smoke(1450, 380, t);
      world += P.palm(80, 720, 1, t) + P.palm(1860, 740, 0.9, t + 1);
      world += `<rect x="0" y="760" width="1920" height="320" fill="#b88a5a" stroke="${INK}" stroke-width="4"/>` + Array.from({ length: 12 }, (_, i) => `<path d="M${i * 170},760 L${i * 170},1080" stroke="#8a5f3a" stroke-width="5"/>`).join('');
      const shake = Math.sin(t * 10) * 6;
      world += C.santaAnna({ t, x: 600, y: 990, s: 1.25, blinkSeed: 1, smile: 0.8, turn: 0.5, look: [0.9, 0], armR: [64, 26 + shake] });
      world += C.nuno({ t, x: 1330, y: 990, s: 1.25, blinkSeed: 4, smile: 0.7, turn: -0.5, look: [-0.9, 0], armL: [64, 26 - shake] });
      world += popIn(t, X.ph('N20', 0) + 2.6, P.ribbon(0, 0, 'La Habana, Cuba', 1, '#1c6fa8', 56), 960, 140);
      const [cx, cy, cs] = camKeys(t, [[sc.start, 960, 520, 1.0], [sail - 0.2, 960, 560, 1.08]]);
      s = cam(world, cx, cy, cs);
    } else {
      const k = ease.inOut(prog(t, sail, sc.end));
      let world = P.sky() + P.clouds(t, 13, 6, 40, 300, 14) + P.sea(520, t);
      world += P.morro(160, 560, 0.5);
      world += `<path d="M1500,560 C1600,500 1760,500 1920,520 L1920,600 L1500,600 Z" fill="#7cc36a" stroke="${INK}" stroke-width="3"/>` + P.flagpole(1740, 330, 200) + P.flag(1747, 342, 150, 96, t, 8);
      world += label(1720, 300, 'México', 64, '#0f8a4a');
      world += `<path d="M420,700 C800,560 1200,560 1640,600" fill="none" stroke="#fff" stroke-width="8" stroke-dasharray="4 26" stroke-linecap="round" opacity=".9"/>`;
      const sx = lerp(460, 1450, k), sy = 690 - Math.sin(k * Math.PI) * 110;
      world += P.smoke(sx, sy - 150, t) + P.ship(sx, sy, 0.42, t);
      s = world;
    }
    return s + textureOverlay();
  };

  // ---------------------------------------------------------------- 10. música
  S.musica = (t, sc, X) => {
    const n22 = X.L('N22');
    const split = t >= n22.start - 0.3;
    let s;
    if (!split) {
      const winT = X.ph('N21', 3);
      const won = t >= winT;
      let world = P.room('wallWarm', 840) + P.window(1360, 120, 380, 300, t, false, '#b8333d') + P.beams(1360, 120, t);
      world += g('translate(280 560) scale(.55)', P.piano(0, 0, 1));
      const writing = !won && t < X.ph('N21', 2);
      const wr = writing ? Math.sin(t * 14) * 5 : 0;
      const pose = won
        ? { armL: [150, 20], armR: [150, 20], happyClosed: true, eyeOpen: 0.1, mouth: 0.4, smile: 1, look: [0, 0] }
        : { armL: [10, -60 + wr], armR: [10, -60], propL: quillProp(-40 + wr), look: t >= X.ph('N21', 2) ? [0, 0] : [-0.3, 0.8], smile: 0.7,
            eyeOpen: writing ? 0.75 : undefined };
      world += C.nuno({ t, x: 960, y: 820, s: 1.25, blinkSeed: 4, part: 'body', ...pose });
      world += deskTop(960, 780, 1100, 120);
      const notes = clamp(prog(t, X.ph('N21', 1), X.ph('N21', 2)));
      let sheet = `<path d="M-160,-60 L160,-60 L180,60 L-180,60 Z" fill="url(#paper)" stroke="${INK}" stroke-width="2.5"/>`;
      for (let i = 0; i < 5; i++) sheet += `<path d="M${-150 + i * 2},${-40 + i * 16} L${150 + i * 4},${-40 + i * 16}" stroke="#8a7a6a" stroke-width="2"/>`;
      for (let i = 0; i < Math.floor(notes * 9); i++) sheet += P.note(-120 + i * 30, -10 + ((i * 7) % 4) * 8, 0.32, '#2a2030');
      world += g(tr(960, 850), sheet) + P.inkwell(1300, 845, 0.9);
      world += C.nuno({ t, x: 960, y: 820, s: 1.25, blinkSeed: 4, part: 'arms', ...pose });
      if (writing) world += P.floatingNotes(t, 960, 640, 900, 25, 12);
      if (won) world += P.confetti(t, winT, 4, 110) + popIn(t, winT + 0.2, P.medal(0, 0, 0.6), 960, 630) + popIn(t, winT, P.ribbon(0, 0, '¡Ganador de la música!', 1, '#0f8a4a', 56), 960, 140);
      const [cx, cy, cs] = camKeys(t, [[sc.start, 960, 540, 1.0], [X.ph('N21', 2), 960, 460, 1.15], [winT, 960, 520, 1.0]]);
      s = cam(world, cx, cy, cs);
    } else {
      const fr = t < X.ph('N22', 1) + 0.2 ? 1 : 0.5, nu = t >= X.ph('N22', 1) - 0.2 ? 1 : 0.6;
      let world = `<rect width="960" height="1080" fill="#f6dcc0"/><rect x="960" width="960" height="1080" fill="#e8d6f2"/>`;
      world += P.floatingNotes(t, 1440, 900, 800, 31, 8);
      world += P.floatingHearts(t, 480, 800, 700, 32, 5, n22.start);
      world += op(0.5 + fr * 0.5, C.francisco({ t, x: 480, y: 980, s: 1.35, blinkSeed: 2, smile: 0.9, armR: [40, -110], propR: (x, y) => P.paper(x - 30, y - 50, -6, 0.7, 6, 1) }));
      world += op(0.5 + nu * 0.5, C.nuno({ t, x: 1440, y: 980, s: 1.35, blinkSeed: 4, smile: 0.8, armL: [40, -110], propL: (x, y) => g(tr(x + 30, y - 50, 0.7, 6), `<rect x="-80" y="-95" width="160" height="200" rx="6" fill="url(#paper)" stroke="${INK}" stroke-width="3"/>` + Array.from({ length: 4 }, (_, i) => `<path d="M-60,${-60 + i * 40} L60,${-60 + i * 40}" stroke="#6f6585" stroke-width="2"/>` + P.note(-30 + i * 25, -60 + i * 40, 0.4, '#3a2a40')).join('')) }));
      world += popIn(t, n22.start + 0.6, P.ribbon(0, 0, 'LETRA', 1, '#7a4a2e', 60), 480, 120);
      world += popIn(t, X.ph('N22', 1), P.ribbon(0, 0, 'MÚSICA', 1, '#5b3a8a', 60), 1440, 120);
      world += popIn(t, X.ph('N22', 2) + 0.8, P.heart(0, 0, 2.2), 960, 520);
      world += popIn(t, X.ph('N22', 2) + 1.6, `<rect x="-560" y="-70" width="1120" height="130" rx="30" fill="#fffdf7" stroke="#c99a2e" stroke-width="7"/>` + P.title(0, 30, 'Himno Nacional Mexicano', 78, '#0f8a4a', '#fffdf7', 0), 960, 300);
      s = world;
    }
    return s + textureOverlay();
  };

  // ---------------------------------------------------------------- 11. bandera
  function kidsRow(t, X, o = {}) {
    const kids = [
      { kind: 'boy', uniform: true, x: 430, seed: 1 }, { kind: 'girl', uniform: true, band: '#e94c6a', x: 790, seed: 2 },
      { kind: 'boy', uniform: true, x: 1130, seed: 3 }, { kind: 'girl', uniform: true, band: '#3a7ad0', x: 1490, seed: 4 },
    ];
    return kids.map((k, i) => C.kid({ t, x: k.x, y: (o.y ?? 1000) - (o.jump ? Math.abs(Math.sin(t * 7 + i)) * o.jump : 0), s: o.s ?? 1.25, kind: k.kind, uniform: k.uniform, band: k.band,
      blinkSeed: k.seed + 6, mouth: o.mouth ? o.mouth(i) : 0, smile: o.smile ?? 0.9, armR: o.armR ? o.armR(i) : [10, 6], armL: o.armL ? o.armL(i) : [10, 6],
      look: o.look || [0, 0], tilt: o.tilt ? o.tilt(i) : 0, happyClosed: o.happy, eyeOpen: o.happy ? 0.1 : undefined, turn: o.turn ? o.turn(i) : 0 })).join('');
  }
  S.bandera = (t, sc, X) => {
    let world = P.sky() + P.clouds(t, 17, 6, 40, 300, 10);
    world += P.flagpole(560, 60, 900) + P.flag(567, 72, 760, 480, t, 26);
    world += P.hills(820);
    const standing = t >= X.ph('N24', 1);
    const salute = ease.inOut(prog(t, X.ph('N24', 3) - 0.3, X.ph('N24', 3) + 0.5));
    world += kidsRow(t, X, {
      look: standing ? [0, -0.6] : [0, 0], smile: standing ? 0.5 : 0.9,
      armL: () => (salute > 0 ? [lerp(10, 10, salute), lerp(6, -125, salute)] : [10, 6]),
    });
    world += P.flowers(960, t, 5, 30);
    if (t >= X.ph('N23', 1) && t < X.ph('N24', 1)) world += P.floatingNotes(t, 960, 700, 1500, 41, 10);
    if (t >= X.ph('N23', 2) - 0.2 && t < X.ph('N24', 0) + 0.6) {
      const who = [
        (p) => C.santaAnna(p), (p) => C.francisco(p), (p) => C.nuno(p),
      ];
      who.forEach((fn, i) => {
        const st = X.ph('N23', 2) + i * 0.5;
        const inner = `<circle r="110" fill="#fff6e6" stroke="#c99a2e" stroke-width="8"/><clipPath id="med${i}"><circle r="104"/></clipPath><g clip-path="url(#med${i})">` + fn({ t, x: 0, y: 250, s: 0.95, blinkSeed: i + 1 }) + `</g>`;
        world += fadeWin(t, st, X.ph('N24', 0) + 0.6, popIn(t, st, inner, 1180 + i * 260, 220 + (i % 2) * 70));
      });
    }
    if (t >= X.ph('N24', 2) && t < X.ph('N24', 3) + 0.8) world += popIn(t, X.ph('N24', 2), label(0, 0, 'Shhh…', 80, '#3a7ad0'), 1600, 520);
    const [cx, cy, cs] = camKeys(t, [[sc.start, 960, 520, 1.05], [X.ph('N24', 1), 960, 560, 1.0], [X.ph('N24', 3), 960, 640, 1.12], [sc.end, 960, 660, 1.16]]);
    return cam(world, cx, cy, cs) + textureOverlay();
  };

  // ---------------------------------------------------------------- 12. final
  S.final = (t, sc, X) => {
    const n26 = X.L('N26'), n27 = X.L('N27');
    const cheer = t >= X.ph('N26', 0);
    let world = P.sky() + P.clouds(t, 23, 6, 40, 300, 10);
    world += P.flagpole(1700, 120, 820) + P.flag(1707, 132, 300, 190, t, 14) + P.hills(780);
    const end = t >= n27.start - 0.2;
    const quizzical = t >= X.ph('N25', 3) && !cheer;
    world += kidsRow(t, X, {
      s: 1.3, y: 1030, jump: cheer && !end ? 40 : 0, happy: cheer && !end, smile: 1,
      tilt: (i) => (quizzical ? (i % 2 ? 8 : -8) : 0),
      armR: (i) => (cheer ? [150 + Math.sin(t * 9 + i) * 12, 20] : [10, 6]), armL: (i) => (end ? [140 + Math.sin(t * 8 + i) * 18, 30] : [10, 6]),
      mouth: (i) => (cheer && !end ? 0.5 : 0),
    });
    world += P.flowers(980, t, 9, 30);
    if (quizzical) for (let i = 0; i < 4; i++) world += popIn(t, X.ph('N25', 3) + i * 0.15, P.question(0, 0, 0.45, '#3a7ad0'), 430 + i * 360 + 90, 420);
    // "Mexicanos al grito de guerra…"
    const q0 = X.ph('N25', 2), q1 = X.ph('N25', 2, 1);
    if (t >= q0 - 0.3 && t < X.ph('N25', 3) + 0.4) {
      const text = '«Mexicanos al grito de guerra…»';
      const n = Math.floor(clamp(prog(t, q0, q1)) * text.length);
      const box = `<rect x="-760" y="-90" width="1520" height="170" rx="40" fill="#fffdf7" stroke="#c99a2e" stroke-width="8"/>` + P.title(0, 25, text.slice(0, Math.max(1, n)), 84, '#8a4b14', '#fffdf7', 0, 600) +
        P.note(-700, -60, 0.7, '#0f8a4a') + P.note(660, -60, 0.7, '#c8312b', 0, 1);
      world += fadeWin(t, q0 - 0.3, X.ph('N25', 3) + 0.4, popIn(t, q0 - 0.3, box, 960, 330));
    }
    if (cheer) world += P.confetti(t, X.ph('N26', 0), 7, 140) + P.floatingNotes(t, 960, 700, 1600, 51, 10);
    if (t >= X.ph('N26', 1) && !end) world += popIn(t, X.ph('N26', 1), `<rect x="-600" y="-80" width="1200" height="150" rx="36" fill="#fffdf7" stroke="#0f8a4a" stroke-width="8"/>` + P.title(0, 25, '¡Himno Nacional Mexicano!', 84, '#0f8a4a', '#fffdf7', 0), 960, 300);
    if (end) {
      const book = popIn(t, n27.start, `<rect x="-470" y="-200" width="940" height="360" rx="40" fill="#fff6dc" stroke="#c99a2e" stroke-width="10"/>` +
        P.title(0, -40, 'Colorín colorado…', 92, '#8a4b14', '#fff6dc', 0) +
        (t >= X.ph('N27', 1) + 1.6 ? popIn(t, X.ph('N27', 1) + 1.6, P.title(0, 0, '¡Viva México!', 104, '#c8312b', '#fff6dc', 0), 0, 100) : ''), 960, 320);
      world += book + P.sparkles(t, 960, 320, 520, 27, 14, X.ph('N27', 1) + 1.6, 2.4);
      if (t >= X.ph('N27', 1) + 2.2) world += P.confetti(t, X.ph('N27', 1) + 2.2, 9, 120);
    }
    const [cx, cy, cs] = camKeys(t, [[sc.start, 960, 600, 1.12], [X.ph('N25', 2) - 0.4, 960, 520, 1.0], [n26.start, 960, 540, 1.0], [sc.end, 960, 520, 1.02]]);
    return cam(world, cx, cy, cs) + textureOverlay();
  };

  window.SCENES = S;
})();
