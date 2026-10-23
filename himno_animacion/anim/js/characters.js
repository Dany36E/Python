// Personajes dibujados en SVG con el estilo de las ilustraciones de referencia:
// trazo fino café, piel con degradado y sombras suaves, ojos grandes con brillos,
// pelo con mechones de luz y ropa con pliegues. Origen en la cintura (0,0).
(function () {
  const { f, tr, g, limb, arm2, lerp, blink } = A;

  const INK = '#5a3828';
  const LW = 2.6;
  const SKIN = '#f8d0aa';
  const SKIN_SH = '#e2a27c';

  // Ids únicos por cuadro para los clipPath (main.js llama a resetIds en cada cuadro).
  let uidN = 0;
  const uid = (p) => `${p}${uidN++}`;

  const DEFS = `
  <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="blur12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
  <radialGradient id="skinG" gradientUnits="userSpaceOnUse" cx="-18" cy="-24" r="150"><stop offset="0" stop-color="#fee6cb"/><stop offset=".55" stop-color="#f9d2ad"/><stop offset="1" stop-color="#eab089"/></radialGradient>
  <radialGradient id="handG" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fee2c4"/><stop offset="1" stop-color="#ecb48c"/></radialGradient>
  <linearGradient id="hairBrown" gradientUnits="userSpaceOnUse" x1="-60" y1="-150" x2="40" y2="120"><stop offset="0" stop-color="#6e4532"/><stop offset=".45" stop-color="#43271b"/><stop offset="1" stop-color="#2b170f"/></linearGradient>
  <linearGradient id="hairDark" gradientUnits="userSpaceOnUse" x1="-60" y1="-150" x2="40" y2="80"><stop offset="0" stop-color="#4f3a33"/><stop offset=".5" stop-color="#2a1d19"/><stop offset="1" stop-color="#1a1210"/></linearGradient>
  <linearGradient id="hairLong" gradientUnits="userSpaceOnUse" x1="0" y1="-150" x2="0" y2="300"><stop offset="0" stop-color="#5e3826"/><stop offset=".4" stop-color="#3e2218"/><stop offset="1" stop-color="#2b160e"/></linearGradient>
  <linearGradient id="coatBrown" gradientUnits="userSpaceOnUse" x1="-140" y1="-170" x2="140" y2="20"><stop offset="0" stop-color="#6c4433"/><stop offset=".55" stop-color="#4b2d21"/><stop offset="1" stop-color="#341e16"/></linearGradient>
  <linearGradient id="vestBrown" gradientUnits="userSpaceOnUse" x1="-50" y1="-150" x2="50" y2="0"><stop offset="0" stop-color="#4a2b20"/><stop offset="1" stop-color="#2c1912"/></linearGradient>
  <linearGradient id="coatBlack" gradientUnits="userSpaceOnUse" x1="-140" y1="-170" x2="140" y2="20"><stop offset="0" stop-color="#454652"/><stop offset=".55" stop-color="#282932"/><stop offset="1" stop-color="#1a1b22"/></linearGradient>
  <linearGradient id="vestBlack" gradientUnits="userSpaceOnUse" x1="-50" y1="-150" x2="50" y2="0"><stop offset="0" stop-color="#2e2f38"/><stop offset="1" stop-color="#15161b"/></linearGradient>
  <linearGradient id="navy" gradientUnits="userSpaceOnUse" x1="-140" y1="-170" x2="140" y2="20"><stop offset="0" stop-color="#34569a"/><stop offset=".55" stop-color="#213d74"/><stop offset="1" stop-color="#172b55"/></linearGradient>
  <linearGradient id="redCloth" gradientUnits="userSpaceOnUse" x1="-60" y1="-170" x2="60" y2="10"><stop offset="0" stop-color="#e2513f"/><stop offset="1" stop-color="#b3281f"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe08a"/><stop offset=".5" stop-color="#eebd4a"/><stop offset="1" stop-color="#c38f25"/></linearGradient>
  <linearGradient id="pinkDress" gradientUnits="userSpaceOnUse" x1="-120" y1="-170" x2="120" y2="260"><stop offset="0" stop-color="#f9a9c6"/><stop offset=".5" stop-color="#f17fa6"/><stop offset="1" stop-color="#dc6390"/></linearGradient>
  <linearGradient id="shirtW" gradientUnits="userSpaceOnUse" x1="-40" y1="-170" x2="40" y2="-90"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e2d6"/></linearGradient>
  <radialGradient id="irisG" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#9a5a30"/><stop offset=".55" stop-color="#5b321c"/><stop offset="1" stop-color="#24130b"/></radialGradient>`;

  // ---------------------------------------------------------------- cara
  // style: 'young' (ojos grandes oscuros) | 'adult' (más blanco visible)
  function eye(x, y, open, look, o, side) {
    const lx = look[0] * 4.5, ly = look[1] * 3.5;
    const lashes = o.lashes;
    if (open < 0.22) {
      const happy = o.happyClosed;
      return happy
        ? `<path d="M${x - 16},${y + 4} Q${x},${y - 10} ${x + 16},${y + 4}" fill="none" stroke="#2a160d" stroke-width="4" stroke-linecap="round"/>`
        : `<path d="M${x - 17},${y + 1} Q${x},${y + 9} ${x + 17},${y + 1}" fill="none" stroke="#2a160d" stroke-width="4" stroke-linecap="round"/>` +
          (lashes ? `<path d="M${x + side * 17},${y + 1} l${side * 7},-3" stroke="#2a160d" stroke-width="3" stroke-linecap="round"/>` : '');
    }
    const adult = o.eyeStyle === 'adult';
    const rx = adult ? 18 : 20, ry = adult ? 12.5 : 19;
    const id = uid('e');
    const almond = `M${-rx},2 C${-rx + 2},${-ry - 2} ${rx - 2},${-ry - 2} ${rx},0 C${rx - 4},${ry} ${-rx + 4},${ry} ${-rx},2 Z`;
    const ir = adult ? [10.5, 12] : [14.5, 18];
    let s = `<g transform="translate(${f(x)} ${f(y)}) scale(1 ${f(open)})">` +
      `<clipPath id="${id}"><path d="${almond}"/></clipPath>` +
      `<path d="${almond}" fill="#fffaf4"/>` +
      `<g clip-path="url(#${id})">` +
      `<ellipse cx="${f(lx)}" cy="${f(ly + (adult ? 1 : 2))}" rx="${ir[0]}" ry="${ir[1]}" fill="url(#irisG)"/>` +
      `<ellipse cx="${f(lx)}" cy="${f(ly + 1)}" rx="${ir[0] * 0.45}" ry="${ir[1] * 0.5}" fill="#160b06"/>` +
      `<path d="M${-rx},-${ry * 0.2} C${-rx + 4},${-ry - 4} ${rx - 4},${-ry - 4} ${rx},-${ry * 0.3} L${rx},${-ry - 6} L${-rx},${-ry - 6} Z" fill="#000" opacity=".18"/>` +
      `</g>` +
      `<circle cx="${f(lx - ir[0] * 0.38)}" cy="${f(ly - ir[1] * 0.38)}" r="${adult ? 3.6 : 5.4}" fill="#fff"/>` +
      `<circle cx="${f(lx + ir[0] * 0.4)}" cy="${f(ly + ir[1] * 0.42)}" r="${adult ? 1.6 : 2.4}" fill="#fff" opacity=".85"/>` +
      `<path d="M${-rx - 2},3 C${-rx + 1},${-ry - 3} ${rx - 1},${-ry - 4} ${rx + 2},-1" fill="none" stroke="#24130b" stroke-width="${adult ? 3.6 : 4.4}" stroke-linecap="round"/>` +
      `<path d="M${-rx * 0.7},${ry * 0.82} Q0,${ry * 1.08} ${rx * 0.7},${ry * 0.78}" fill="none" stroke="#a8694a" stroke-width="1.6" opacity=".6"/>` +
      (lashes ? `<path d="M${side * (rx + 1)},${side > 0 ? -1 : 2} l${side * 8},-7 M${side * (rx - 4)},${-ry * 0.7} l${side * 6},-8" stroke="#24130b" stroke-width="3" stroke-linecap="round"/>` : '') +
      `</g>`;
    return s;
  }

  function brow(x, y, side, tilt, color, thick) {
    const x1 = x - side * 18, x2 = x + side * 18;
    const y1 = y + side * 0 + tilt, y2 = y - tilt * 0.6;
    const t = thick;
    return `<path d="M${f(x1)},${f(y1)} Q${f(x)},${f(y - 9)} ${f(x2)},${f(y2 + 2)} Q${f(x)},${f(y - 9 + t)} ${f(x1)},${f(y1 + t)} Z" fill="${color}"/>`;
  }

  function mouth(o, smile, y = 58) {
    if (o < 0.08) {
      const d = 4 + smile * 8;
      return `<path d="M-15,${y - 2} Q0,${y + d} 15,${y - 2}" fill="none" stroke="#97473a" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M-8,${y + d * 0.55 + 5} Q0,${y + d * 0.55 + 8} 8,${y + d * 0.55 + 5}" fill="none" stroke="#d98f78" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
    }
    const w = 13 + o * 6 + smile * 4;
    const h = 6 + o * 22;
    const top = y - 3 - smile * 2;
    return `<path d="M${-w},${top} Q0,${top + smile * 6} ${w},${top} Q${w * 0.72},${top + h} 0,${top + h} Q${-w * 0.72},${top + h} ${-w},${top} Z" fill="#7a2620" stroke="#5e2018" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<ellipse cx="0" cy="${f(top + h * 0.76)}" rx="${f(w * 0.5)}" ry="${f(h * 0.24)}" fill="#e57a6e"/>` +
      (o > 0.3 ? `<path d="M${-w * 0.66},${top + 1.5} Q0,${top + 7 + smile * 3} ${w * 0.66},${top + 1.5} Z" fill="#fff"/>` : '');
  }

  // Cabeza completa con sombreado suave.
  function head(o) {
    const w = o.w || 88;
    const turn = o.turn || 0;
    const fx = turn * 13;
    const open = o.eyeOpen ?? 1;
    const look = o.look || [turn * 0.8, 0];
    const browY = -30 - (o.browUp || 0) * 8;
    const bt = (o.browTilt || 0) * 6;
    const browColor = o.browColor || '#3b2217';
    const chin = o.chin || 104;
    const faceD = `M${-w},-12 C${-w},-84 ${-w * 0.55},-114 0,-114 C${w * 0.55},-114 ${w},-84 ${w},-12 C${w},48 ${w * 0.6},${chin - 8} 0,${chin} C${-w * 0.6},${chin - 8} ${-w},48 ${-w},-12 Z`;
    const cid = uid('fc');
    let s = o.hairBack || '';
    // orejas
    const ear = (ex) => `<ellipse cx="${ex}" cy="10" rx="15" ry="23" fill="url(#skinG)" stroke="${INK}" stroke-width="${LW}"/>` +
      `<path d="M${ex + (ex < 0 ? 4 : -4)},0 q${ex < 0 ? -6 : 6},10 0,20" fill="none" stroke="${SKIN_SH}" stroke-width="3.5" stroke-linecap="round"/>`;
    s += ear(-w + 3 + fx * 0.3) + ear(w - 3 + fx * 0.3);
    s += `<clipPath id="${cid}"><path d="${faceD}"/></clipPath>`;
    s += `<path d="${faceD}" fill="url(#skinG)"/>`;
    s += `<g clip-path="url(#${cid})">` +
      `<ellipse cx="0" cy="-104" rx="${w}" ry="46" fill="#b9724f" opacity=".42" filter="url(#blur12)"/>` +
      `<ellipse cx="${w * 0.95}" cy="0" rx="34" ry="120" fill="#d08a64" opacity=".28" filter="url(#blur12)"/>` +
      `<ellipse cx="0" cy="${chin + 4}" rx="${w * 0.7}" ry="22" fill="#cf8661" opacity=".3" filter="url(#blur6)"/>` +
      `</g>`;
    s += `<path d="${faceD}" fill="none" stroke="${INK}" stroke-width="${LW}"/>`;
    s += `<g transform="translate(${f(fx)} 0)">`;
    s += `<ellipse cx="-50" cy="42" rx="20" ry="12" fill="#f07f76" opacity="${o.blush ?? 0.42}" filter="url(#blur6)"/>` +
      `<ellipse cx="50" cy="42" rx="20" ry="12" fill="#f07f76" opacity="${o.blush ?? 0.42}" filter="url(#blur6)"/>`;
    s += brow(-34, browY, -1, bt, browColor, o.browW || 4.5) + brow(34, browY, 1, bt, browColor, o.browW || 4.5);
    s += eye(-34, 8, open, look, o, -1) + eye(34, 8, open, look, o, 1);
    s += `<ellipse cx="6" cy="30" rx="7" ry="5" fill="#d38a68" opacity=".45" filter="url(#blur3)"/>` +
      `<path d="M-1,26 Q4,34 9,29" fill="none" stroke="#bf7b5c" stroke-width="2.6" stroke-linecap="round"/>`;
    s += o.mustache || '';
    s += mouth(o.mouth || 0, o.smile ?? 0.6, o.mouthY || 58);
    s += `</g>`;
    s += o.hairFront || '';
    return g(tr(0, 0, 1, o.tilt || 0), s);
  }

  // ---------------------------------------------------------------- pelo
  const strands = (paths, color = '#8a5a40', w = 3, op = 0.65) =>
    `<g fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}">` + paths.map((d) => `<path d="${d}"/>`).join('') + `</g>`;

  function curlBlob(circles, fill, marks = true) {
    let a = '', b = '', hl = '';
    for (const [x, y, r] of circles) {
      a += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
      hl += `<path d="M${f(x - r * 0.55)},${f(y - r * 0.1)} a${f(r * 0.6)},${f(r * 0.6)} 0 0 1 ${f(r * 0.85)},${f(-r * 0.45)}" />`;
    }
    b = a;
    return `<g fill="${fill}" stroke="${INK}" stroke-width="${LW * 2}">${a}</g><g fill="${fill}">${b}</g>` +
      (marks ? `<g fill="none" stroke="#9a6648" stroke-width="3.2" stroke-linecap="round" opacity=".75">${hl}</g>` : '');
  }

  function hairFrancisco() {
    const r = A.rng(31);
    const back = [];
    for (let i = 0; i < 15; i++) {
      const a = Math.PI * (0.92 + (i / 14) * 1.16);
      back.push([Math.cos(a) * 96 + (r() - 0.5) * 6, -30 + Math.sin(a) * 96 + (r() - 0.5) * 6, 22 + r() * 8]);
    }
    back.push([-94, 6, 20], [94, 6, 20], [-90, 30, 16], [90, 30, 16]);
    const front = [];
    for (let i = 0; i < 9; i++) front.push([-78 + i * 19.5 + (r() - 0.5) * 6, -78 - Math.sin((i / 8) * Math.PI) * 18 + (r() - 0.5) * 6, 19 + r() * 6]);
    for (let i = 0; i < 7; i++) front.push([-60 + i * 20 + (r() - 0.5) * 8, -106 - Math.sin((i / 6) * Math.PI) * 12, 22 + r() * 6]);
    return { back: curlBlob(back, 'url(#hairBrown)'), front: curlBlob(front, 'url(#hairBrown)') };
  }

  function hairLupita() {
    const back = `<path d="M-92,-70 C-128,-10 -118,60 -136,130 C-150,190 -118,226 -132,282 C-90,296 -40,288 0,292 C40,288 90,296 132,282 C118,226 150,190 136,130 C118,60 128,-10 92,-70 C70,-146 -70,-146 -92,-70 Z" fill="url(#hairLong)" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>` +
      strands(['M-110,0 C-130,60 -100,120 -124,190 C-132,230 -112,250 -118,276', 'M-86,40 C-104,100 -82,160 -100,230', 'M110,0 C130,60 100,120 124,190 C132,230 112,250 118,276', 'M86,40 C104,100 82,160 100,230'], '#7a4a32', 4, 0.7);
    const bangs = `<path d="M-94,-4 C-104,-98 -44,-130 6,-124 C68,-118 104,-82 98,-4 C90,-48 66,-78 30,-84 C14,-60 -24,-50 -62,-40 C-78,-30 -90,-18 -94,-4 Z" fill="url(#hairLong)" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>` +
      strands(['M-60,-100 C-30,-114 20,-112 60,-90', 'M-80,-60 C-60,-84 -20,-96 20,-96', 'M40,-80 C66,-70 84,-50 92,-20'], '#8a5a40', 3.5, 0.75);
    const lock = (m) => `<path d="M${-94 * m},-10 C${-120 * m},30 ${-92 * m},64 ${-112 * m},106 C${-124 * m},136 ${-104 * m},166 ${-118 * m},196 ` +
      `C${-98 * m},190 ${-84 * m},166 ${-90 * m},138 C${-96 * m},110 ${-70 * m},82 ${-80 * m},46 C${-86 * m},22 ${-74 * m},6 ${-70 * m},-12 Z" fill="url(#hairLong)" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>` +
      strands([`M${-100 * m},40 C${-108 * m},70 ${-92 * m},98 ${-104 * m},132`], '#8a5a40', 3.5, 0.7);
    const band = `<path d="M-92,-46 C-94,-118 -30,-140 8,-136 C66,-132 100,-96 94,-44" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/>` +
      `<path d="M-92,-46 C-94,-118 -30,-140 8,-136 C66,-132 100,-96 94,-44" fill="none" stroke="#f0719d" stroke-width="12" stroke-linecap="round"/>` +
      `<path d="M-70,-104 C-40,-128 10,-132 50,-118" fill="none" stroke="#fbb6cf" stroke-width="4" stroke-linecap="round"/>`;
    const bow = g(tr(-90, -66, 1, -18),
      `<path d="M-4,-2 C-30,-34 -64,-26 -62,0 C-60,22 -30,24 -4,6 Z" fill="#f0719d" stroke="${INK}" stroke-width="${LW}"/>` +
      `<path d="M4,-4 C26,-34 58,-28 56,-4 C54,18 26,20 4,4 Z" fill="#f0719d" stroke="${INK}" stroke-width="${LW}"/>` +
      `<path d="M-46,-8 C-40,-18 -24,-16 -16,-6 M20,-14 C30,-20 42,-16 44,-8" fill="none" stroke="#fbb6cf" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M-6,6 L-22,44 L-10,38 L-4,50 L4,8 Z" fill="#e05a89" stroke="${INK}" stroke-width="2.2"/>` +
      `<ellipse rx="11" ry="12" fill="#e05a89" stroke="${INK}" stroke-width="${LW}"/>`);
    return { back, front: lock(1) + lock(-1) + bangs + band + bow };
  }

  function hairSantaAnna() {
    const waves = [[-80, -66, 36], [-54, -114, 46], [0, -138, 50], [56, -122, 46], [84, -82, 32], [-92, -32, 24], [92, -40, 22]];
    const vol = curlBlob(waves, 'url(#hairDark)', false);
    const fringe = `<path d="M-84,-48 C-74,-92 -30,-98 6,-86 C30,-100 70,-96 88,-60 C80,-70 60,-76 40,-70 C24,-62 4,-62 -10,-70 C-40,-62 -70,-62 -84,-48 Z" fill="url(#hairDark)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
    const wave = strands(['M-70,-120 C-40,-160 20,-172 70,-140', 'M-84,-80 C-60,-128 -10,-140 40,-128', 'M30,-110 C60,-118 84,-100 92,-70', 'M-60,-150 C-30,-170 10,-176 40,-168'], '#7c6058', 4, 0.7);
    const sideburns = `<path d="M-93,-36 L-94,26 L-82,30 L-78,-28 Z M93,-36 L94,26 L82,30 L78,-28 Z" fill="url(#hairDark)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
    return { back: '', front: sideburns + vol + fringe + wave };
  }

  function hairNuno() {
    const top = `<path d="M-88,-22 C-102,-104 -48,-152 10,-148 C72,-146 106,-104 90,-22 C84,-50 66,-66 34,-70 C2,-74 -36,-70 -62,-60 C-78,-50 -86,-36 -88,-22 Z" fill="url(#hairDark)" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>`;
    const comb = strands(['M-62,-108 C-22,-132 34,-130 76,-100', 'M-74,-80 C-34,-102 30,-104 82,-76', 'M-46,-134 C-10,-146 30,-144 60,-128', 'M-80,-56 C-50,-72 -10,-78 30,-76'], '#8d817a', 3.5, 0.8);
    const side = `<path d="M-90,-30 L-92,22 L-80,24 L-78,-26 Z M90,-30 L92,22 L80,24 L78,-26 Z" fill="url(#hairDark)" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M-88,-10 L-86,16 M88,-10 L86,16" stroke="#9a918b" stroke-width="3" opacity=".7"/>`;
    return { back: '', front: side + top + comb };
  }

  const mustacheNuno = `<path d="M0,40 C-14,34 -34,34 -48,44 C-58,52 -66,48 -70,40 C-66,58 -46,62 -30,56 C-16,52 -6,48 0,48 C6,48 16,52 30,56 C46,62 66,58 70,40 C66,48 58,52 48,44 C34,34 14,34 0,40 Z" fill="url(#hairDark)" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
    strands(['M-10,42 C-24,40 -40,42 -54,50', 'M10,42 C24,40 40,42 54,50'], '#6e625c', 2.5, 0.8);

  function hairBoy(fill = 'url(#hairBrown)') {
    const r = A.rng(3), c = [];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.95 + (i / 8) * 1.1);
      c.push([Math.cos(a) * 82, -30 + Math.sin(a) * 82, 34 + r() * 6]);
    }
    return { back: '', front: curlBlob(c, fill, false) +
      `<path d="M-74,-56 C-50,-84 -10,-92 20,-84 C46,-90 70,-76 82,-54 C62,-66 40,-66 24,-58 C4,-70 -30,-68 -50,-56 C-60,-54 -68,-54 -74,-56 Z" fill="${fill}" stroke="${INK}" stroke-width="2.2"/>` +
      strands(['M-60,-100 C-30,-118 20,-118 60,-100', 'M-40,-80 C-10,-92 30,-92 56,-80'], '#8a5a40', 3.5, 0.7) };
  }

  function hairGirl(fill = 'url(#hairLong)', bandColor = '#e94c6a') {
    const back = `<path d="M-96,-40 C-124,20 -118,80 -110,130 C-80,140 80,140 110,130 C118,80 124,20 96,-40 C80,-140 -80,-140 -96,-40 Z" fill="${fill}" stroke="${INK}" stroke-width="${LW}"/>` +
      strands(['M-100,0 C-112,40 -100,80 -104,120', 'M100,0 C112,40 100,80 104,120'], '#7a4a32', 4, 0.7);
    const bangs = `<path d="M-94,-4 C-102,-100 -40,-128 8,-124 C70,-120 102,-84 96,-4 C84,-46 56,-74 20,-74 C0,-56 -40,-52 -76,-30 Z" fill="${fill}" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>` +
      strands(['M-60,-100 C-30,-114 20,-110 56,-92'], '#8a5a40', 3.5, 0.75);
    const band = `<path d="M-90,-50 C-92,-118 -30,-138 8,-134 C66,-130 98,-96 92,-46" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M-90,-50 C-92,-118 -30,-138 8,-134 C66,-130 98,-96 92,-46" fill="none" stroke="${bandColor}" stroke-width="11" stroke-linecap="round"/>`;
    const bow = g(tr(66, -112, 0.8, 15),
      `<path d="M-4,-2 C-30,-30 -60,-22 -58,0 C-56,20 -30,22 -4,6 Z" fill="${bandColor}" stroke="${INK}" stroke-width="${LW}"/><path d="M4,-2 C30,-30 60,-22 58,0 C56,20 30,22 4,6 Z" fill="${bandColor}" stroke="${INK}" stroke-width="${LW}"/><ellipse rx="10" ry="11" fill="${bandColor}" stroke="${INK}" stroke-width="${LW}"/>`);
    return { back, front: bangs + band + bow };
  }

  // ---------------------------------------------------------------- cuerpos
  function hand(x, y, rot = 0, s = 1) {
    return g(tr(x, y, s, rot),
      `<ellipse cx="0" cy="0" rx="17" ry="16" fill="url(#handG)" stroke="${INK}" stroke-width="${LW}"/>` +
      `<ellipse cx="-11" cy="-6" rx="6.5" ry="9" fill="url(#handG)" stroke="${INK}" stroke-width="2.2" transform="rotate(-30 -11 -6)"/>` +
      `<path d="M2,-10 q6,4 6,12 M-4,-12 q6,4 6,12" fill="none" stroke="#d29572" stroke-width="2" opacity=".7"/>`);
  }

  // Brazo: side -1 (izquierda de la pantalla) o 1; a1/a2 en grados, positivo = hacia afuera/arriba.
  function arm(side, sx, sy, a1, a2, sleeve, opts = {}) {
    const m = -side;
    const l1 = opts.l1 || 104, l2 = opts.l2 || 98;
    const j = arm2(sx, sy, a1 * m, a2 * m, l1, l2);
    const w = opts.width || 44;
    let s = limb(j.pts, sleeve, w, INK, LW);
    // pliegue en el codo y brillo en la manga
    s += `<path d="M${f(lerp(sx, j.elbow[0], 0.2))},${f(lerp(sy, j.elbow[1], 0.2))} L${f(lerp(sx, j.elbow[0], 0.8))},${f(lerp(sy, j.elbow[1], 0.8))}" stroke="#fff" stroke-opacity=".06" stroke-width="${w * 0.3}" stroke-linecap="round" transform="translate(${side * -w * 0.18} 0)"/>`;
    s += `<circle cx="${f(j.elbow[0])}" cy="${f(j.elbow[1])}" r="${w * 0.22}" fill="#000" opacity=".12" filter="url(#blur3)"/>`;
    const [wx, wy] = j.wrist;
    const ang = (Math.atan2(wy - j.elbow[1], wx - j.elbow[0]) * 180) / Math.PI;
    if (opts.cuff !== false) {
      const cx = lerp(j.elbow[0], wx, 0.86), cy = lerp(j.elbow[1], wy, 0.86);
      s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${w * 0.42}" fill="${opts.cuff || '#fbf7ee'}" stroke="${INK}" stroke-width="2.2"/>`;
    }
    const hx = lerp(j.elbow[0], wx, 1.08), hy = lerp(j.elbow[1], wy, 1.08);
    const prop = opts.prop ? opts.prop(hx, hy, ang) : '';
    s += (opts.propBehind ? prop : '') + hand(hx, hy, ang - 90 + (side < 0 ? 0 : 180), side < 0 ? 1 : -1) + (opts.propBehind ? '' : prop);
    return s;
  }

  function bowTie(y) {
    return `<path d="M0,${y} C-10,${y - 6} -24,${y - 16} -32,${y - 14} C-36,${y - 4} -36,${y + 6} -32,${y + 14} C-24,${y + 16} -10,${y + 6} 0,${y} Z" fill="#1d1a1e" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M0,${y} C10,${y - 6} 24,${y - 16} 32,${y - 14} C36,${y - 4} 36,${y + 6} 32,${y + 14} C24,${y + 16} 10,${y + 6} 0,${y} Z" fill="#1d1a1e" stroke="${INK}" stroke-width="2.2"/>` +
      `<rect x="-8" y="${y - 9}" width="16" height="18" rx="5" fill="#2a262c" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M-26,${y - 8} q8,4 14,4 M26,${y - 8} q-8,4 -14,4" stroke="#55505a" stroke-width="2.5" fill="none"/>`;
  }

  function suitTorso(coat, vest, breathe) {
    const sy = -172 - breathe * 3;
    return `<path d="M-42,${sy} Q-112,${sy + 2} -126,-128 L-132,10 L132,10 L126,-128 Q112,${sy + 2} 42,${sy} Z" fill="url(#${coat})" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>` +
      `<path d="M-44,-150 L0,-60 L44,-150 L52,10 L-52,10 Z" fill="url(#${vest})" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M-34,${sy} L0,-96 L34,${sy} Z" fill="url(#shirtW)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M-6,-130 L0,-100 L6,-130" stroke="#d8d0c2" stroke-width="2" fill="none"/>` +
      `<path d="M-42,${sy} L-76,-104 L-48,-110 L-12,-58 Z M42,${sy} L76,-104 L48,-110 L12,-58 Z" fill="url(#${coat})" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M-70,-106 L-46,-110 M70,-106 L46,-110" stroke="#000" stroke-opacity=".25" stroke-width="3"/>` +
      `<path d="M-96,-90 C-90,-60 -94,-30 -100,0 M96,-80 C92,-50 96,-20 100,4 M-30,-30 C-26,-18 -28,-6 -32,6" stroke="#000" stroke-opacity=".18" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      `<path d="M-110,-140 C-100,-150 -80,-156 -60,-158" stroke="#fff" stroke-opacity=".15" stroke-width="6" fill="none" stroke-linecap="round"/>` +
      `<circle cx="0" cy="-40" r="4.5" fill="#d8c9a8" stroke="${INK}" stroke-width="1.8"/><circle cx="0" cy="-14" r="4.5" fill="#d8c9a8" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M-16,${sy - 2} L-4,-150 L-24,-156 Z M16,${sy - 2} L4,-150 L24,-156 Z" fill="#fff" stroke="${INK}" stroke-width="2"/>` +
      bowTie(-160);
  }

  function uniformTorso(breathe) {
    const sy = -172 - breathe * 3;
    let s = `<path d="M-42,${sy} Q-116,${sy + 2} -130,-128 L-136,10 L136,10 L130,-128 Q116,${sy + 2} 42,${sy} Z" fill="url(#navy)" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>`;
    s += `<path d="M-100,-90 C-94,-60 -98,-30 -104,0 M100,-80 C96,-50 100,-20 104,4" stroke="#000" stroke-opacity=".2" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M-58,${sy + 4} L58,${sy + 4} L50,10 L-50,10 Z" fill="url(#redCloth)" stroke="#e5b84a" stroke-width="4.5" stroke-linejoin="round"/>`;
    for (let i = 0; i < 6; i++) {
      const y = -146 + i * 26;
      s += `<circle cx="-30" cy="${y}" r="6.5" fill="url(#gold)" stroke="#8a6116" stroke-width="1.8"/><circle cx="30" cy="${y}" r="6.5" fill="url(#gold)" stroke="#8a6116" stroke-width="1.8"/>`;
      s += `<circle cx="-32" cy="${y - 2}" r="2" fill="#fff" opacity=".7"/><circle cx="28" cy="${y - 2}" r="2" fill="#fff" opacity=".7"/>`;
    }
    s += `<path d="M-16,-150 q6,10 0,20 t0,20 M16,-150 q-6,10 0,20 t0,20 M-14,-80 q8,6 0,14 M14,-80 q-8,6 0,14" fill="none" stroke="#f0c654" stroke-width="2.5" opacity=".85"/>`;
    s += `<rect x="-140" y="-4" width="280" height="22" rx="6" fill="url(#gold)" stroke="#8a6116" stroke-width="2.2"/><rect x="-22" y="-8" width="44" height="30" rx="7" fill="url(#gold)" stroke="#8a6116" stroke-width="2.2"/>`;
    return s;
  }

  function highCollar(breathe) {
    const sy = -172 - breathe * 3;
    return `<path d="M-44,${sy - 26} C-30,${sy - 18} 30,${sy - 18} 44,${sy - 26} L50,${sy + 6} C30,${sy + 14} -30,${sy + 14} -50,${sy + 6} Z" fill="url(#redCloth)" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>` +
      `<path d="M-38,${sy - 8} q8,-8 16,0 t16,0 t16,0 t16,0 M-36,${sy + 2} q8,6 16,0 t16,0 t16,0 t16,0" fill="none" stroke="#f0c654" stroke-width="2.4"/>` +
      `<path d="M-44,${sy - 26} C-30,${sy - 18} 30,${sy - 18} 44,${sy - 26}" fill="none" stroke="#f0c654" stroke-width="3"/>`;
  }

  function epaulette(x, y, side) {
    let fr = '';
    for (let i = 0; i < 10; i++) {
      const fx = x - 42 + i * 9.3;
      fr += `<path d="M${f(fx)},${y + 10} q${side * 2},18 0,34" stroke="#b9882a" stroke-width="7" stroke-linecap="round" fill="none"/>` +
        `<path d="M${f(fx - 1)},${y + 12} q${side * 2},14 0,26" stroke="#f6d77a" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
    }
    return fr + `<ellipse cx="${x}" cy="${y}" rx="52" ry="24" fill="url(#gold)" stroke="#8a6116" stroke-width="2.6"/>` +
      `<ellipse cx="${x}" cy="${y - 3}" rx="32" ry="11" fill="#fbe7a4" opacity=".8"/>`;
  }

  function dressTorso(breathe) {
    const sy = -170 - breathe * 3;
    let s = `<path d="M-40,${sy} Q-100,${sy + 4} -108,-128 L-98,10 L98,10 L108,-128 Q100,${sy + 4} 40,${sy} Z" fill="url(#pinkDress)" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>`;
    s += `<path d="M-60,-120 Q-50,-60 -66,6 M60,-120 Q50,-60 66,6 M0,-110 L0,6" fill="none" stroke="#c94f7c" stroke-width="4" stroke-linecap="round" opacity=".35"/>`;
    let d = `M-62,${sy - 8} L62,${sy - 8} L66,${sy + 4}`;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      pts.push([66 - k * 132, sy + 6 + Math.sin(k * Math.PI) * 30]);
    }
    for (let i = 1; i < pts.length; i++) d += ` A11,11 0 0 1 ${f(pts[i][0])},${f(pts[i][1])}`;
    d += ' Z';
    s += `<path d="${d}" fill="#fff8f5" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      s += `<circle cx="${f(mx)}" cy="${f(my - 4)}" r="3" fill="#f4c2cf"/>`;
    }
    return s;
  }

  function puffSleeve(x, y) {
    return `<path d="M${x - 40},${y + 30} C${x - 50},${y - 10} ${x - 20},${y - 40} ${x},${y - 36} C${x + 26},${y - 40} ${x + 50},${y - 10} ${x + 40},${y + 30} C${x + 20},${y + 42} ${x - 20},${y + 42} ${x - 40},${y + 30} Z" fill="url(#pinkDress)" stroke="${INK}" stroke-width="${LW}"/>` +
      `<path d="M${x - 24},${y - 18} q12,-12 26,-8 M${x - 30},${y + 30} q30,10 60,0" stroke="#fcc6d9" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>` +
      `<path d="M${x - 38},${y + 32} C${x - 20},${y + 46} ${x + 20},${y + 46} ${x + 38},${y + 32}" stroke="#fff8f5" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  }

  function neck(top = -200, bottom = -150) {
    return `<path d="M-23,${top} L-23,${bottom} Q0,${bottom + 14} 23,${bottom} L23,${top} Z" fill="url(#skinG)" stroke="${INK}" stroke-width="${LW}"/>` +
      `<path d="M-23,${top + 6} Q0,${top + 30} 23,${top + 6} L23,${top} L-23,${top} Z" fill="#c9805c" opacity=".45" filter="url(#blur3)"/>`;
  }

  function legs(trousers, shoes, step = 0) {
    const a = Math.sin(step) * 16;
    const L = limb([[-42, 0], [-46 + a * 0.6, 120], [-46 + a, 230]], trousers, 58, INK, LW);
    const R = limb([[42, 0], [46 - a * 0.6, 120], [46 - a, 230]], trousers, 58, INK, LW);
    const shoe = (x) => `<ellipse cx="${f(x + 12)}" cy="246" rx="44" ry="20" fill="${shoes}" stroke="${INK}" stroke-width="${LW}"/><path d="M${f(x - 10)},240 q14,-8 34,-4" stroke="#fff" stroke-opacity=".3" stroke-width="4" fill="none"/>`;
    return L + R + shoe(-46 + a) + shoe(46 - a);
  }

  function skirtShape(sway = 0) {
    let hem = '';
    for (let i = 0; i <= 10; i++) hem += `<circle cx="${f(-176 + i * 35.2 + sway)}" cy="250" r="20"/>`;
    return `<g fill="#e46b97" stroke="${INK}" stroke-width="${LW * 2}">${hem}</g>` +
      `<path d="M-96,0 Q-150,140 ${-176 + sway},250 L${176 + sway},250 Q150,140 96,0 Z" fill="url(#pinkDress)" stroke="${INK}" stroke-width="${LW}"/>` +
      `<g fill="#e46b97">${hem}</g>` +
      `<path d="M-60,30 Q-90,150 -110,240 M0,30 L${sway * 0.5},240 M60,30 Q90,150 110,240" stroke="#c94f7c" stroke-width="5" fill="none" stroke-linecap="round" opacity=".4"/>` +
      `<path d="M${-176 + sway},264 L${176 + sway},264" stroke="#fff8f5" stroke-width="12" stroke-linecap="round"/>`;
  }

  // ---------------------------------------------------------------- ensamblado
  function base(p, torso, hair, headOpts, sleeve, extra = {}) {
    const t = p.t || 0;
    const breathe = Math.sin(t * 2.2 + (p.blinkSeed || 0)) * 0.5 + 0.5;
    const bob = p.bob ?? Math.sin(t * 1.6 + (p.blinkSeed || 0)) * 2;
    const part = p.part || 'all';
    const showBody = part !== 'arms', showArms = part !== 'body';
    let s = '';
    if (showBody && p.full) s += extra.lower ? extra.lower(p) : legs(extra.trousers || '#2a2226', extra.shoes || '#1d1416', p.step || 0);
    const armL = p.armL || [8, 6], armR = p.armR || [8, 6];
    const sh = extra.shoulder || 118;
    const behind = (side) => (side < 0 ? p.armLBehind : p.armRBehind);
    const drawArm = (side, a) => arm(side, side * sh, -146, a[0], a[1], sleeve, { prop: side < 0 ? p.propL : p.propR, cuff: extra.cuff, width: extra.armW, l1: extra.l1, l2: extra.l2 });
    if (showArms && behind(-1)) s += drawArm(-1, armL);
    if (showArms && behind(1)) s += drawArm(1, armR);
    const hs = extra.headScale || 1;
    const hy = -206 - 72 * hs + bob;
    if (showBody) {
      s += hair.back ? g(tr(0, hy, hs, p.tilt || 0), hair.back) : '';
      s += torso(breathe);
      s += extra.overTorso ? extra.overTorso(breathe) : '';
      s += neck(-206 + bob * 0.5, -160);
      s += extra.collar ? extra.collar(breathe) : '';
      s += g(tr(0, hy, hs), head(Object.assign({
        eyeOpen: p.eyeOpen ?? blink(t, p.blinkSeed || 0), mouth: p.mouth || 0, smile: p.smile ?? 0.6,
        turn: p.turn || 0, tilt: p.tilt || 0, look: p.look, browUp: p.browUp, browTilt: p.browTilt, blush: p.blush,
        happyClosed: p.happyClosed, hairFront: hair.front,
      }, headOpts, p.smile != null ? { smile: p.smile } : {})));
    }
    if (showArms && !behind(-1)) s += drawArm(-1, armL);
    if (showArms && !behind(1)) s += drawArm(1, armR);
    if (showBody && extra.top) s += extra.top(breathe);
    return g(tr(p.x || 0, p.y || 0, p.s || 1, p.rot || 0), s);
  }

  const hF = hairFrancisco(), hL = hairLupita(), hS = hairSantaAnna(), hN = hairNuno();

  const C = {
    francisco: (p) => base(p, (b) => suitTorso('coatBrown', 'vestBrown', b), hF, { w: 84 }, '#4b2d21',
      { trousers: '#3a2620', shoes: '#22160f', headScale: 0.92, shoulder: 112 }),
    lupita: (p) => base(p, (b) => dressTorso(b), hL, { w: 84, lashes: true }, '#f28aae',
      { headScale: 0.92, lower: (q) => skirtShape(Math.sin((q.t || 0) * 2) * 4), cuff: '#fff8f5', shoulder: 106, armW: 32, l1: 96, l2: 92,
        overTorso: () => puffSleeve(-102, -140) + puffSleeve(102, -140) }),
    santaAnna: (p) => base(p, (b) => uniformTorso(b), hS, { w: 86, eyeStyle: 'adult', chin: 110, browW: 5.5, smile: 0.45 }, '#213d74',
      { trousers: '#f1ece0', shoes: '#151515', cuff: '#c8312b', headScale: 0.84,
        collar: highCollar, top: () => g('translate(-108 -150) scale(.85)', epaulette(0, 0, -1)) + g('translate(108 -150) scale(.85)', epaulette(0, 0, 1)) }),
    nuno: (p) => base(p, (b) => suitTorso('coatBlack', 'vestBlack', b), hN, { w: 84, eyeStyle: 'adult', chin: 110, browW: 6, mustache: mustacheNuno, mouthY: 66, smile: 0.4 }, '#2a2b34',
      { trousers: '#25262e', shoes: '#111', headScale: 0.84 }),
  };

  // Niños: kind 'boy' | 'girl'; shirt: color; uniform: camisa blanca con cuello marinero.
  C.kid = (p) => {
    const t = p.t || 0;
    const hair = p.kind === 'girl' ? hairGirl('url(#hairLong)', p.band) : hairBoy();
    const shirt = p.shirt || '#3aa35b';
    const bob = Math.sin(t * 2 + (p.blinkSeed || 0)) * 2 - (p.jump || 0);
    let s = '';
    const body = (fill) => `<path d="M-30,-130 Q-86,-128 -94,-96 L-90,10 L90,10 L94,-96 Q86,-128 30,-130 Z" fill="${fill}" stroke="${INK}" stroke-width="${LW}"/>` +
      `<path d="M-70,-80 C-64,-50 -68,-20 -72,8 M70,-74 C66,-44 70,-16 72,8" stroke="#000" stroke-opacity=".12" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    const torso = p.uniform
      ? body('#fbfbfb') +
        `<path d="M-40,-130 L-80,-104 L-40,-74 L0,-96 L40,-74 L80,-104 L40,-130 Z" fill="#26407a" stroke="${INK}" stroke-width="2.2"/><path d="M-36,-124 L-66,-104 L-38,-84 L0,-104 L38,-84 L66,-104 L36,-124" fill="none" stroke="#fff" stroke-width="2.6"/>` +
        `<circle cx="0" cy="-60" r="4.5" fill="#ddd" stroke="${INK}" stroke-width="1.8"/><circle cx="0" cy="-30" r="4.5" fill="#ddd" stroke="${INK}" stroke-width="1.8"/>`
      : p.kind === 'girl'
        ? body(shirt) + `<path d="M-34,-128 Q0,-100 34,-128" fill="#fff" stroke="${INK}" stroke-width="2.2"/>`
        : body(shirt) + `<path d="M-28,-130 L0,-104 L28,-130" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
    const sleeve = p.uniform ? '#fbfbfb' : shirt;
    const armL = p.armL || [10, 6], armR = p.armR || [10, 6];
    s += g(tr(0, -232 + bob), hair.back);
    s += torso;
    s += neck(-160 + bob * 0.5, -124);
    s += g(tr(0, -232 + bob, 1, p.tilt || 0), head({
      w: 92, eyeOpen: p.eyeOpen ?? blink(t, p.blinkSeed || 0), mouth: p.mouth || 0, smile: p.smile ?? 0.9,
      turn: p.turn || 0, look: p.look, lashes: p.kind === 'girl', hairFront: hair.front, blush: 0.55, browUp: p.browUp, happyClosed: p.happyClosed,
    }));
    s += arm(-1, -86, -112, armL[0], armL[1], sleeve, { width: 32, l1: 74, l2: 70, cuff: false, prop: p.propL });
    s += arm(1, 86, -112, armR[0], armR[1], sleeve, { width: 32, l1: 74, l2: 70, cuff: false, prop: p.propR });
    return g(tr(p.x || 0, p.y || 0, p.s || 1, p.rot || 0), s);
  };

  // Músico de banda militar (figura pequeña de fondo).
  C.musician = (p) => {
    const t = p.t || 0;
    const bob = Math.sin(t * 6 + (p.seed || 0)) * 3;
    const ins = p.instrument || 'trumpet';
    let s = `<path d="M-60,-120 Q-66,-130 -30,-136 L30,-136 Q66,-130 60,-120 L66,10 L-66,10 Z" fill="url(#navy)" stroke="${INK}" stroke-width="${LW}"/>` +
      `<path d="M-6,-130 L-6,0 M6,-130 L6,0" stroke="#f0c654" stroke-width="3"/>`;
    s += g(tr(0, -196 + bob, 0.62), head({ w: 84, eyeStyle: 'adult', eyeOpen: blink(t, p.seed || 3), mouth: 0, smile: 0.4, hairFront: '', blush: 0.3,
      mustache: p.mustache ? mustacheNuno : '', mouthY: p.mustache ? 66 : 58 }));
    s += g(tr(0, -196 + bob, 0.62), `<path d="M-74,-60 L-66,-150 L66,-150 L74,-60 Z" fill="#1f2f5a" stroke="${INK}" stroke-width="${LW / 0.62}"/>` +
      `<rect x="-80" y="-74" width="160" height="22" rx="8" fill="#14203f" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-110" r="16" fill="url(#gold)" stroke="#8a6116" stroke-width="3"/>`);
    if (ins === 'trumpet') s += g(tr(20, -170 + bob, 0.9, -8), A.limb([[-70, 50], [0, 6]], '#213d74', 26, INK, LW)) + window.P.trumpet(40, -176 + bob, 0.7, -10);
    else s += window.P.drum(0, -30, 0.8) + A.limb([[-50, -100], [-30, -60 - Math.abs(Math.sin(t * 6)) * 30]], '#213d74', 22, INK, LW) + A.limb([[50, -100], [30, -60 - Math.abs(Math.cos(t * 6)) * 30]], '#213d74', 22, INK, LW);
    return g(tr(p.x || 0, p.y || 0, p.s || 1), s);
  };

  C.hand = hand;
  C.head = head;
  C.INK = INK;
  C.DEFS = DEFS;
  C.resetIds = () => { uidN = 0; };
  window.C = C;
})();
