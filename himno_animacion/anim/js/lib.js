// Utilidades de animación: tiempo, interpolación, azar reproducible y SVG.
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  // Progreso 0..1 de t entre a y b.
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const ease = {
    inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out: (k) => 1 - Math.pow(1 - k, 3),
    in: (k) => k * k * k,
    back: (k) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    },
    elastic: (k) => (k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
    sine: (k) => 0.5 - 0.5 * Math.cos(Math.PI * k),
  };
  // Entra en [a, a+fin] y sale en [b-fout, b]; 0 fuera, 1 en medio.
  const win = (t, a, b, fin = 0.3, fout = 0.3) => Math.min(prog(t, a, a + fin), 1 - prog(t, b - fout, b));
  // Aparición con rebote: 0 antes de a, sobrepasa un poco y se asienta en 1.
  const pop = (t, a, d = 0.45) => (t < a ? 0 : ease.back(prog(t, a, a + d)));

  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let r = Math.imul(s ^ (s >>> 15), 1 | s);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Parpadeo reproducible: devuelve apertura del ojo 0..1.
  function blink(t, seed = 0) {
    const period = 3.1 + (seed % 7) * 0.37;
    const ph = (t + seed * 1.37) % period;
    if (ph < 0.07) return 1 - ph / 0.07;
    if (ph < 0.15) return (ph - 0.07) / 0.08;
    return 1;
  }

  const f = (n) => (Math.round(n * 10) / 10).toString();
  const tr = (x, y, s = 1, r = 0) =>
    `translate(${f(x)} ${f(y)})` + (r ? ` rotate(${f(r)})` : '') + (s !== 1 ? ` scale(${f(s * 100) / 100})` : '');
  const g = (transform, inner, extra = '') => `<g transform="${transform}" ${extra}>${inner}</g>`;
  const op = (o, inner) => (o <= 0.001 ? '' : o >= 0.999 ? inner : `<g opacity="${o.toFixed(3)}">${inner}</g>`);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Une círculos en una sola mancha con contorno (pelo rizado, nubes, árboles):
  // primero todos con borde grueso y luego todos sin borde encima.
  function blob(circles, fill, stroke, sw) {
    let a = '', b = '';
    for (const [x, y, r] of circles) {
      a += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
      b += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
    }
    return `<g fill="${fill}" stroke="${stroke}" stroke-width="${sw * 2}">${a}</g><g fill="${fill}">${b}</g>`;
  }

  // Trazo grueso con contorno (brazos, piernas, mangas).
  function limb(points, color, width, outline = '#4a2e20', ow = 3.5) {
    const d = 'M' + points.map((p) => `${f(p[0])},${f(p[1])}`).join(' L');
    return `<path d="${d}" fill="none" stroke="${outline}" stroke-width="${width + ow * 2}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  // Articulación de dos segmentos: hombro -> codo -> muñeca (ángulos en grados, 0 = abajo).
  function arm2(x, y, a1, a2, l1, l2) {
    const r1 = (a1 * Math.PI) / 180, r2 = ((a1 + a2) * Math.PI) / 180;
    const ex = x - Math.sin(r1) * l1, ey = y + Math.cos(r1) * l1;
    const wx = ex - Math.sin(r2) * l2, wy = ey + Math.cos(r2) * l2;
    return { elbow: [ex, ey], wrist: [wx, wy], pts: [[x, y], [ex, ey], [wx, wy]] };
  }

  window.A = { clamp, lerp, prog, ease, win, pop, rng, blink, f, tr, g, op, esc, blob, limb, arm2 };
})();
