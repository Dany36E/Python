// Motor: compone la escena del momento t, las transiciones y los subtítulos.
(function () {
  const { prog, ease, clamp, f, esc } = A;
  const TL = window.TIMELINE;
  const stage = document.getElementById('stage');
  const params = new URLSearchParams(location.search);
  const RENDER = params.has('render');
  const CAPTIONS = params.get('captions') !== '0';
  if (RENDER) document.body.classList.add('render');

  const byId = Object.fromEntries(TL.lines.map((l) => [l.id, l]));
  const XF = 0.9; // duración del fundido entre escenas

  // Ayudas que reciben las escenas.
  const ctx = {
    TL,
    L: (id) => byId[id],
    // Inicio (edge 0) o fin (edge 1) de la frase i de una línea, en tiempo absoluto.
    ph(id, i = 0, edge = 0) {
      const l = byId[id];
      const n = l.phrases.length;
      const k = Math.min(Math.max(i < 0 ? n + i : i, 0), n - 1);
      return l.start + l.phrases[k][edge];
    },
    mouth(id, t) {
      const l = byId[id];
      if (!l || !l.mouth || t < l.start || t > l.end) return 0;
      return l.mouth[Math.floor((t - l.start) * TL.fps)] || 0;
    },
    // Boca para quien habla en t entre varias líneas.
    talk(ids, t) {
      let m = 0;
      for (const id of ids) m = Math.max(m, ctx.mouth(id, t));
      return m;
    },
  };

  // ---------------------------------------------------------------- subtítulos
  const measure = document.createElement('canvas').getContext('2d');
  const CAP_FONT = 46, CAP_MAX = 1480;
  const wrapCache = new Map();
  function wrap(text) {
    if (wrapCache.has(text)) return wrapCache.get(text);
    measure.font = `800 ${CAP_FONT}px Nunito`;
    const words = text.split(' ');
    const rows = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (measure.measureText(test).width > CAP_MAX && cur) { rows.push(cur); cur = w; } else cur = test;
    }
    if (cur) rows.push(cur);
    const width = Math.max(...rows.map((r) => measure.measureText(r).width));
    const out = { rows, width };
    wrapCache.set(text, out);
    return out;
  }
  const NAMES = { santa_anna: ['Santa Anna', '#203a6e'], lupita: ['Lupita', '#e0517f'], francisco: ['Francisco', '#7a4a2e'] };
  // Parte cada línea en frases cortas y las sincroniza con las pausas detectadas en el audio.
  function segmentsOf(l) {
    if (l._segs) return l._segs;
    const parts = l.text.match(/[^.!?…:]+[.!?…:»]*\s*/g).map((x) => x.trim()).filter(Boolean);
    const segs = [];
    for (const p of parts) {
      if (segs.length && (segs[segs.length - 1].length < 14 || p.length < 6) && (segs[segs.length - 1] + ' ' + p).length < 70) segs[segs.length - 1] += ' ' + p;
      else segs.push(p);
    }
    // parte segmentos largos en la coma más cercana al centro
    for (let i = 0; i < segs.length; i++) {
      const x = segs[i];
      if (x.length <= 72) continue;
      const mid = x.length / 2;
      let best = -1;
      for (let j = 0; j < x.length; j++) if (x[j] === ',' && (best < 0 || Math.abs(j - mid) < Math.abs(best - mid))) best = j;
      if (best < 0 || Math.abs(best - mid) > x.length * 0.3) {
        best = -1;
        for (let j = 0; j < x.length; j++) if (x[j] === ' ' && (best < 0 || Math.abs(j - mid) < Math.abs(best - mid))) best = j;
        if (best < 0) continue;
        segs.splice(i, 1, x.slice(0, best).trim(), x.slice(best).trim());
      } else segs.splice(i, 1, x.slice(0, best + 1).trim(), x.slice(best + 1).trim());
      i--;
    }
    const ph = l.phrases;
    const out = [];
    if (segs.length === ph.length) {
      segs.forEach((txt, i) => out.push({ txt, a: l.start + ph[i][0], b: i + 1 < ph.length ? l.start + ph[i + 1][0] : l.end }));
    } else {
      // reparte por proporción de caracteres sobre el tiempo hablado
      const spans = ph.map(([a, b]) => [a, b]);
      const talk = spans.reduce((acc, [a, b]) => acc + (b - a), 0);
      const timeAt = (frac) => {
        let left = frac * talk;
        for (const [a, b] of spans) { if (left <= b - a) return a + left; left -= b - a; }
        return spans[spans.length - 1][1];
      };
      const total = segs.reduce((acc, x) => acc + x.length, 0);
      let acc = 0;
      segs.forEach((txt, i) => {
        const a = l.start + timeAt(acc / total);
        acc += txt.length;
        out.push({ txt, a: i === 0 ? l.start : a, b: 0 });
      });
      out.forEach((o, i) => (o.b = i + 1 < out.length ? out[i + 1].a : l.end));
    }
    l._segs = out;
    return out;
  }

  function caption(t) {
    if (!CAPTIONS) return '';
    const l = TL.lines.find((x) => t >= x.start - 0.2 && t <= x.end + 0.45);
    if (!l) return '';
    const segs = segmentsOf(l);
    let seg = segs[0];
    for (const sg of segs) if (t >= sg.a - 0.1) seg = sg;
    const o = Math.min(prog(t, l.start - 0.2, l.start + 0.05), 1 - prog(t, l.end + 0.2, l.end + 0.45));
    const { rows, width } = wrap(seg.txt);
    const lh = CAP_FONT * 1.28;
    const h = rows.length * lh + 40;
    const w = Math.max(width + 90, 360);
    const x = 960 - w / 2, y = 1080 - 40 - h;
    const segIn = segs.length > 1 ? clamp((t - seg.a + 0.1) / 0.18) : 1;
    let s = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="30" fill="#fffdf7" fill-opacity=".95" stroke="#7fb4e0" stroke-width="5"/>`;
    let txt = '';
    rows.forEach((r, i) => {
      txt += `<text x="960" y="${f(y + 20 + lh * (i + 0.78))}" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="${CAP_FONT}" fill="#26314d">${esc(r)}</text>`;
    });
    s += `<g opacity="${segIn.toFixed(3)}">${txt}</g>`;
    if (l.speaker) {
      const [name, color] = NAMES[l.speaker];
      measure.font = '700 34px Fredoka';
      const nw = measure.measureText(name).width + 48;
      s += `<rect x="${f(x + 30)}" y="${f(y - 32)}" width="${f(nw)}" height="56" rx="28" fill="${color}" stroke="#fff" stroke-width="4"/>` +
        `<text x="${f(x + 30 + nw / 2)}" y="${f(y + 7)}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="34" fill="#fff">${name}</text>`;
    }
    const lift = (1 - ease.out(clamp(o * 1.5))) * 20;
    return `<g opacity="${o.toFixed(3)}" transform="translate(0 ${f(lift)})">${s}</g>`;
  }

  // ---------------------------------------------------------------- composición
  function sceneAt(t) {
    const out = [];
    TL.scenes.forEach((sc, i) => {
      const a = i === 0 ? -1 : sc.start - XF / 2;
      const b = i === TL.scenes.length - 1 ? Infinity : sc.end + XF / 2;
      if (t >= a && t <= b) {
        const fn = window.SCENES[sc.name];
        const alpha = i === 0 ? 1 : ease.inOut(prog(t, sc.start - XF / 2, sc.start + XF / 2));
        out.push({ svg: fn ? fn(t, sc, ctx) : '', alpha });
      }
    });
    return out.map((s) => (s.alpha >= 0.999 ? s.svg : `<g opacity="${s.alpha.toFixed(3)}">${s.svg}</g>`)).join('');
  }

  let frame;
  function renderAt(t) {
    C.resetIds();
    let s = sceneAt(t) + caption(t);
    const fadeOut = prog(t, TL.duration - 1.2, TL.duration);
    const fadeIn = 1 - prog(t, 0, 0.6);
    const black = Math.max(fadeOut, fadeIn);
    if (black > 0) s += `<rect width="1920" height="1080" fill="#000" opacity="${black.toFixed(3)}"/>`;
    frame.innerHTML = s;
  }

  function sheet() {
    C.resetIds();
    const t = 0.4;
    let s = `<rect width="1920" height="1080" fill="#f6e7d2"/>`;
    s += C.santaAnna({ t, x: 260, y: 1010, s: 1.25, blinkSeed: 1 });
    s += C.francisco({ t, x: 730, y: 1010, s: 1.25, armL: [10, 4], blinkSeed: 2, smile: 0.8 });
    s += C.lupita({ t, x: 1190, y: 1010, s: 1.25, blinkSeed: 3, mouth: 0.35, smile: 0.9 });
    s += C.nuno({ t, x: 1660, y: 1010, s: 1.25, blinkSeed: 4 });
    frame.innerHTML = s;
  }

  async function init() {
    stage.innerHTML = (window.DEFS || '<defs></defs>').replace('</defs>', C.DEFS + '</defs>') + '<g id="frame"></g>';
    frame = document.getElementById('frame');
    await Promise.all(['700 40px Fredoka', '600 40px Fredoka', '800 40px Nunito', '700 40px Nunito'].map((x) => document.fonts.load(x)));
    window.renderAt = renderAt;
    if (params.has('sheet')) { window.renderAt = sheet; sheet(); }
    else renderAt(Number(params.get('t') || 0));
    window.__ready = true;
    if (RENDER) return;

    const audio = document.getElementById('audio');
    const seek = document.getElementById('seek');
    const clock = document.getElementById('clock');
    const play = document.getElementById('play');
    seek.max = TL.duration;
    let tFree = 0, last = performance.now(), playing = false;
    play.onclick = () => {
      playing = !playing;
      play.textContent = playing ? '❚❚ Pausa' : '▶ Reproducir';
      if (playing) audio.play().catch(() => {}); else audio.pause();
    };
    seek.oninput = () => { tFree = Number(seek.value); audio.currentTime = tFree; };
    const loop = (now) => {
      if (playing) {
        tFree = audio.readyState >= 2 && !audio.paused ? audio.currentTime : tFree + (now - last) / 1000;
        if (tFree >= TL.duration) { playing = false; play.textContent = '▶ Reproducir'; }
      }
      last = now;
      renderAt(tFree);
      seek.value = tFree;
      clock.textContent = `${Math.floor(tFree / 60)}:${String(Math.floor(tFree % 60)).padStart(2, '0')}`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  init();
})();
