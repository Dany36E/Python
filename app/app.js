/* Cancha — biblioteca de ejercicios de fútbol y básquetbol para preparar clases.
   Sin dependencias (jsPDF se carga solo al exportar un PDF). Guarda en
   IndexedDB (app instalada) o en la cuenta de Claude cuando se abre como
   Artifact (db + assets). */
(function () {
  'use strict';

  // ---------------------------------------------------------------- datos fijos
  const TABS = ['clases', 'ejercicios', 'grupos'];
  const TAB_META = {
    clases: { label: 'Clases', icon: 'clases' },
    ejercicios: { label: 'Ejercicios', icon: 'cone' },
    grupos: { label: 'Grupos', icon: 'people' },
  };
  const SPORTS = {
    futbol: {
      name: 'Fútbol', noun: 'fútbol',
      tags: ['Calentamiento', 'Pase', 'Conducción', 'Control', 'Tiro', 'Defensa', 'Táctica', 'Portero', 'Coordinación', 'Velocidad y agilidad', 'Fuerza y resistencia', 'Juego reducido', 'Vuelta a la calma'],
    },
    basquet: {
      name: 'Básquetbol', noun: 'básquetbol',
      tags: ['Calentamiento', 'Dribleo', 'Pase', 'Tiro', 'Entrada', 'Defensa', 'Rebote', 'Táctica', 'Coordinación', 'Velocidad y agilidad', 'Fuerza y resistencia', 'Juego reducido', 'Vuelta a la calma'],
    },
  };
  const LEVELS = ['Inicial', 'Intermedio', 'Avanzado'];
  const VARIANTS = {
    futbol: [['full', 'Campo completo'], ['half', 'Medio campo']],
    basquet: [['half', 'Media cancha'], ['full', 'Cancha completa']],
  };
  const APP_NAME = 'Cancha';
  const PAUSES = ['Hidratación', 'Descanso', 'Preparar material'];
  const isPause = (it) => !!it && it.type === 'pause';
  const itemMin = (it) => Math.max(0, Number(it && it.min) || 0);
  const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const CLOUD_LIMIT = Math.floor(19.5 * 1024 * 1024);

  const ICONS = {
    futbol: '<circle cx="12" cy="12" r="9"/><path d="M12 8.4l3.42 2.49-1.3 4.02H9.88l-1.3-4.02z"/><path d="M12 8.4V3M15.42 10.89l5.14-1.67M14.12 14.91l3.17 4.37M9.88 14.91l-3.17 4.37M8.58 10.89L3.44 9.22"/>',
    basquet: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.7 5.6c1.9 1.7 3 3.9 3 6.4s-1.1 4.7-3 6.4M18.3 5.6c-1.9 1.7-3 3.9-3 6.4s1.1 4.7 3 6.4"/>',
    clases: '<rect x="5" y="4.5" width="14" height="16.5" rx="2.6"/><path d="M9 4.5v-.6c0-.7.5-1.3 1.2-1.3h3.6c.7 0 1.2.6 1.2 1.3v.6M8.6 10h6.8M8.6 13.5h6.8M8.6 17h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M6 12h12"/>',
    chevL: '<path d="M15 5l-7 7 7 7"/>',
    chevR: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    video: '<rect x="2.8" y="6.5" width="12.7" height="11" rx="2.6"/><path d="M15.5 10.4l5.2-3v9.2l-5.2-3z"/>',
    upload: '<path d="M12 15.5V4M7.2 8.6L12 3.8l4.8 4.8M5 14.5v3.7c0 1 .8 1.8 1.8 1.8h10.4c1 0 1.8-.8 1.8-1.8v-3.7"/>',
    photo: '<rect x="3.5" y="5" width="17" height="14" rx="2.6"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 15.5L16 11l-8.2 8"/>',
    pencil: '<path d="M4 20l1.1-4.3L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.3 18.9z"/><path d="M13.8 7l3.2 3.2"/>',
    heart: '<path d="M12 20s-7.6-4.6-7.6-10.3A4.3 4.3 0 0 1 12 7.1a4.3 4.3 0 0 1 7.6 2.6C19.6 15.4 12 20 12 20z"/>',
    'heart-fill': '<path d="M12 20s-7.6-4.6-7.6-10.3A4.3 4.3 0 0 1 12 7.1a4.3 4.3 0 0 1 7.6 2.6C19.6 15.4 12 20 12 20z" fill="currentColor"/>',
    trash: '<path d="M4.5 7h15M10 7V5.4c0-.6.4-1 1-1h2c.6 0 1 .4 1 1V7M6.6 7l.8 11.2c.1 1 .9 1.8 1.9 1.8h5.4c1 0 1.8-.8 1.9-1.8L17.4 7"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.6V12l3 2"/>',
    people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.6 19c.6-3 2.8-4.8 5.4-4.8s4.8 1.8 5.4 4.8"/><circle cx="16.6" cy="9.4" r="2.3"/><path d="M15.7 14.3c2.3-.3 4.2 1.2 4.8 3.8"/>',
    age: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6"/>',
    cone: '<path d="M10.2 3.8h3.6l4.4 15.4H5.8z"/><path d="M4 19.2h16M8.6 9.4h6.8M7.3 14.2h9.4"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2.6"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    check: '<path d="M5 12.5l4.4 4.4L19 7.4"/>',
    xmark: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    up: '<path d="M6.5 14.5L12 9l5.5 5.5"/>',
    down: '<path d="M6.5 9.5L12 15l5.5-5.5"/>',
    play: '<path d="M7.5 5.2v13.6L18.6 12z" fill="currentColor" stroke="none"/>',
    cloud: '<path d="M7.2 18.5h9.9a4 4 0 0 0 .5-7.96A5.6 5.6 0 0 0 6.9 10.1a4.2 4.2 0 0 0 .3 8.4z"/>',
    device: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.6"/><path d="M10.8 18h2.4"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="10" rx="2.6"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    warn: '<path d="M12 4l8.5 15H3.5z"/><path d="M12 10v4M12 16.8v.2"/>',
    sparkle: '<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/>',
    whistle: '<path d="M14.6 13.6a5.6 5.6 0 1 1-5.6-5.6h11.4v4.4h-5.9z"/><circle cx="9" cy="13.6" r="1.5"/><path d="M3.6 5.2l1.6 1.4"/>',
    share: '<path d="M12 3.6v11M8.2 7.4L12 3.6l3.8 3.8"/><path d="M8.6 10.4H7.2c-1.1 0-2 .9-2 2v6.4c0 1.1.9 2 2 2h9.6c1.1 0 2-.9 2-2v-6.4c0-1.1-.9-2-2-2h-1.4"/>',
    pause: '<rect x="6.4" y="5" width="3.8" height="14" rx="1.3" fill="currentColor" stroke="none"/><rect x="13.8" y="5" width="3.8" height="14" rx="1.3" fill="currentColor" stroke="none"/>',
    prev: '<path d="M18 6.2v11.6L9.6 12z" fill="currentColor" stroke="none"/><path d="M6.6 6.2v11.6"/>',
    next: '<path d="M6 6.2v11.6l8.4-5.8z" fill="currentColor" stroke="none"/><path d="M17.4 6.2v11.6"/>',
    move: '<path d="M12 3.5v17M3.5 12h17M9.6 5.9L12 3.5l2.4 2.4M9.6 18.1l2.4 2.4 2.4-2.4M5.9 9.6L3.5 12l2.4 2.4M18.1 9.6l2.4 2.4-2.4 2.4"/>',
    erase: '<path d="M8.6 19.6l-4-4a1.6 1.6 0 0 1 0-2.3l8.7-8.7a1.6 1.6 0 0 1 2.3 0l4 4a1.6 1.6 0 0 1 0 2.3l-8.6 8.7z"/><path d="M8.6 19.6H20M9 9.3l5.9 5.9"/>',
    undo: '<path d="M9 14.2L4.6 9.8 9 5.4"/><path d="M4.6 9.8h9.6a5.4 5.4 0 0 1 0 10.8H11"/>',
    board: '<rect x="3.5" y="4" width="17" height="13" rx="2.3"/><path d="M8.2 21l1.9-4M15.8 21l-1.9-4"/><circle cx="8.4" cy="10.4" r="1.7"/><path d="M13.4 8.6l3.4 3.4M16.8 8.6l-3.4 3.4"/>',
    arrowPass: '<path d="M4.6 19.4L17.6 6.4" stroke-dasharray="2.4 2.6"/><path d="M11 6h7v7"/>',
    arrowDrib: '<path d="M4.6 19.4l1.4-3.6 3 1.2 1.4-3.6 3 1.2 1.4-3.6 2.8-2.6"/><path d="M11.6 6H18v6.4"/>',
    arrowRun: '<path d="M4.6 19.4L17.6 6.4"/><path d="M11 6h7v7"/>',
    timer: '<circle cx="12" cy="13.4" r="7.4"/><path d="M12 9.6v3.8l2.4 1.6M9.6 2.8h4.8M18.6 6.6l1.4-1.4"/>',
    flag: '<path d="M5.5 21V4.2M5.5 4.6h11.6l-2.4 4 2.4 4H5.5"/>',
    chat: '<path d="M4.4 19.6l1.3-3.8a7.9 7.9 0 1 1 3 2.6z"/><path d="M9 10.6c.3 1.6 1.8 3.2 3.6 3.8l1.1-1.1 1.8.8-.4 1.6c-3 .3-6.6-2.8-6.9-6.2l1.5-.5.8 1.8z" fill="currentColor" stroke="none"/>',
    doc: '<path d="M7 3.5h7l4.5 4.5v11.5c0 .8-.7 1.5-1.5 1.5H7c-.8 0-1.5-.7-1.5-1.5v-14.5c0-.8.7-1.5 1.5-1.5z"/><path d="M13.6 3.6V8.4h4.8M8.8 13h6.4M8.8 16.4h4.4"/>',
    box: '<rect x="3.5" y="4.5" width="17" height="5" rx="1.6"/><path d="M5 9.5v8.8c0 1 .8 1.7 1.8 1.7h10.4c1 0 1.8-.7 1.8-1.7V9.5M10 13.2h4"/>',
    download: '<path d="M12 4v11.5M7.2 10.7L12 15.5l4.8-4.8M5 15v3.2c0 1 .8 1.8 1.8 1.8h10.4c1 0 1.8-.8 1.8-1.8V15"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.2M12 7.8v.2"/>',
    drop: '<path d="M12 3.2c3.3 4 5.6 7.2 5.6 10.4a5.6 5.6 0 0 1-11.2 0c0-3.2 2.3-6.4 5.6-10.4z"/><path d="M9.4 14.6a2.7 2.7 0 0 0 2.2 2.4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    sliders: '<path d="M4 7.5h9M19 7.5h1M4 16.5h3M13 16.5h7"/><circle cx="16" cy="7.5" r="2.4"/><circle cx="10" cy="16.5" r="2.4"/>',
    folder: '<path d="M3.5 7.2c0-1 .8-1.8 1.8-1.8h4.1l2 2.1h7.3c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8H5.3c-1 0-1.8-.8-1.8-1.8z"/>',
    copy: '<rect x="8.6" y="8.6" width="11" height="11" rx="2.2"/><path d="M15.4 8.6V6.2c0-.9-.7-1.6-1.6-1.6H6.2c-.9 0-1.6.7-1.6 1.6v7.6c0 .9.7 1.6 1.6 1.6h2.4"/>',
  };

  // ---------------------------------------------------------------- utilidades
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const plain = (o) => JSON.parse(JSON.stringify(o));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const haptic = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) { /* sin vibración */ } };
  const fmtClock = (sec) => { sec = Math.round(sec || 0); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
  const fmtMin = (m) => String(Math.round((Number(m) || 0) * 10) / 10);
  const fmtSize = (b) => (b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : fmtMB(b));
  const fmtMB = (b) => (b / 1048576 >= 10 ? Math.round(b / 1048576) : (b / 1048576).toFixed(1)) + ' MB';
  const isTouch = (() => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
  const pref = {
    get(k) { try { return localStorage.getItem('cancha:' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('cancha:' + k, v); } catch (e) { /* sin almacenamiento */ } },
  };
  function ic(name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }

  const pad2 = (n) => String(n).padStart(2, '0');
  const dayStr = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const todayStr = () => dayStr(new Date());
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dayStr(d); };
  function parseDay(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const p = s.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  const dayFmt = (() => { try { return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return null; } })();
  function fmtLong(ts) {
    try { return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long' }).format(new Date(ts)); } catch (e) { return ''; }
  }
  function fmtDay(s) {
    const d = parseDay(s);
    if (!d) return 'Sin fecha';
    if (s === todayStr()) return 'Hoy';
    if (s === addDays(1)) return 'Mañana';
    return dayFmt ? cap(dayFmt.format(d).replace(/\./g, '')) : s;
  }

  // ---------------------------------------------------------------- canchas y pizarra
  // Todo se dibuja en un lienzo vertical de 160 × 200 (proporción 4:5).
  const COURT = {
    'futbol-full':
      '<rect x="14" y="14" width="132" height="172" rx="2"/>' +
      '<path d="M14 100h132"/><circle cx="80" cy="100" r="18"/>' +
      '<rect x="44" y="14" width="72" height="30"/><rect x="62" y="14" width="36" height="11"/>' +
      '<path d="M63.9 44a18 18 0 0 0 32.2 0"/>' +
      '<rect x="44" y="156" width="72" height="30"/><rect x="62" y="175" width="36" height="11"/>' +
      '<path d="M63.9 156a18 18 0 0 1 32.2 0"/>' +
      '<g fill="currentColor" stroke="none"><circle cx="80" cy="100" r="1.7"/><circle cx="80" cy="35" r="1.3"/><circle cx="80" cy="165" r="1.3"/></g>',
    'futbol-half':
      '<rect x="14" y="14" width="132" height="172" rx="2"/>' +
      '<rect x="34" y="14" width="92" height="40"/><rect x="58" y="14" width="44" height="14"/>' +
      '<path d="M61.6 54a22 22 0 0 0 36.8 0"/><path d="M54 186a26 26 0 0 1 52 0"/><path d="M68 14V9h24v5"/>' +
      '<g fill="currentColor" stroke="none"><circle cx="80" cy="42" r="1.4"/><circle cx="80" cy="186" r="1.7"/></g>',
    'basquet-half':
      '<rect x="14" y="14" width="132" height="172" rx="2"/>' +
      '<path d="M62 14a18 18 0 0 0 36 0"/>' +
      '<rect x="58" y="124" width="44" height="62"/>' +
      '<path d="M64 124a16 16 0 0 1 32 0"/>' +
      '<path d="M64 124a16 16 0 0 0 32 0" stroke-dasharray="3 4"/>' +
      '<path d="M24 186v-37.5a60 60 0 0 1 112 0V186"/>' +
      '<path d="M71 177h18"/><circle cx="80" cy="170.5" r="4.5"/>',
    'basquet-full':
      '<rect x="14" y="14" width="132" height="172" rx="2"/>' +
      '<path d="M14 100h132"/><circle cx="80" cy="100" r="14"/>' +
      '<rect x="64" y="152" width="32" height="34"/><path d="M68 152a12 12 0 0 1 24 0"/>' +
      '<path d="M26 186v-23.8a56 56 0 0 1 108 0V186"/><path d="M73 181h14"/><circle cx="80" cy="177" r="3.5"/>' +
      '<rect x="64" y="14" width="32" height="34"/><path d="M68 48a12 12 0 0 0 24 0"/>' +
      '<path d="M26 14v23.8a56 56 0 0 0 108 0V14"/><path d="M73 19h14"/><circle cx="80" cy="23" r="3.5"/>',
  };
  // Pizarra magnética: pasto podado en franjas o duela de madera, fichas roja/azul con número,
  // conos naranjas y flechas de gis. Son «objetos físicos»: mismos colores en pantalla y en el PDF.
  const BOARD = {
    futbol: {
      bands: ['#2F8C48', '#37944F'], out: 'rgba(0,0,0,0.10)', line: 'rgba(255,255,255,0.82)',
      a: '#E2382C', aInk: '#FFFFFF', b: '#1F55CF', bInk: '#FFFFFF', ring: '#FFFFFF',
      arrow: '#FFFFFF', halo: 'rgba(0,0,0,0.30)', cone: '#FF9A1F', coneEdge: '#C96A00',
    },
    basquet: {
      planks: ['#DDA56A', '#D69D61', '#E0AA71', '#D19859'], seam: 'rgba(110,60,20,0.16)', out: 'rgba(90,45,10,0.16)',
      line: 'rgba(255,255,255,0.92)', key: 'rgba(181,64,16,0.55)',
      a: '#16264A', aInk: '#FFFFFF', b: '#FFFFFF', bInk: '#16264A', ring: '#16264A',
      arrow: '#18120C', halo: 'rgba(255,255,255,0.38)', cone: '#FFD23F', coneEdge: '#B98F00',
    },
  };
  const KEY_FILL = {
    'basquet-half': '<rect x="58" y="124" width="44" height="62"/>',
    'basquet-full': '<rect x="64" y="152" width="32" height="34"/><rect x="64" y="14" width="32" height="34"/>',
  };
  const defaultVariant = (sport) => (sport === 'basquet' ? 'half' : 'full');
  const hasDiagram = (ex) => !!(ex && ex.diagram && ex.diagram.items && ex.diagram.items.length);
  const r1 = (n) => Math.round(n * 10) / 10;
  const BOARD_FONT = "'Big Shoulders Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";

  function arrowGeom(it) {
    const dx = it.x2 - it.x; const dy = it.y2 - it.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L; const uy = dy / L;
    const ex = it.x2 - ux * 4.2; const ey = it.y2 - uy * 4.2;
    let body;
    if (it.k === 'conduccion' && L > 10) {
      const n = Math.max(2, Math.floor((L - 6) / 3.4));
      const pts = [[it.x, it.y]];
      for (let i = 1; i < n; i++) {
        const t = (i / n) * (L - 6);
        const off = i % 2 ? 1.9 : -1.9;
        pts.push([it.x + ux * t - uy * off, it.y + uy * t + ux * off]);
      }
      pts.push([ex, ey]);
      body = 'M' + pts.map((q) => r1(q[0]) + ' ' + r1(q[1])).join('L');
    } else body = 'M' + r1(it.x) + ' ' + r1(it.y) + 'L' + r1(ex) + ' ' + r1(ey);
    const bx = it.x2 - ux * 5.4; const by = it.y2 - uy * 5.4;
    const head = 'M' + r1(it.x2) + ' ' + r1(it.y2) + 'L' + r1(bx - uy * 2.9) + ' ' + r1(by + ux * 2.9) + 'L' + r1(bx + uy * 2.9) + ' ' + r1(by - ux * 2.9) + 'Z';
    return { body, head };
  }

  function turfSVG(sport, v) {
    const P = BOARD[sport] || BOARD.futbol;
    let s = '';
    if (sport === 'basquet') {
      for (let i = 0; i < 20; i++) s += '<rect x="' + i * 8 + '" width="8" height="200" fill="' + P.planks[(i * 3 + (i >> 2)) % 4] + '"/>';
      s += '<g stroke="' + P.seam + '" stroke-width="0.5">';
      for (let i = 1; i < 20; i++) s += '<path d="M' + i * 8 + ' 0v200"/>';
      for (let i = 0; i < 20; i++) { const y = 18 + ((i * 47) % 160); s += '<path d="M' + i * 8 + ' ' + y + 'h8"/>'; }
      s += '</g><g fill="' + P.key + '">' + (KEY_FILL['basquet-' + v] || '') + '</g>';
    } else {
      for (let i = 0; i < 10; i++) s += '<rect y="' + i * 20 + '" width="160" height="20" fill="' + P.bands[i % 2] + '"/>';
    }
    // Fuera de las líneas, un poco más oscuro.
    s += '<path fill="' + P.out + '" fill-rule="evenodd" d="M0 0h160v200H0zM14 14v172h132V14z"/>';
    return s;
  }

  function itemSVG(it, i, sport, opts) {
    const P = BOARD[sport] || BOARD.futbol;
    const di = (i == null ? '' : ' data-i="' + i + '"') + (opts && opts.anim ? ' data-ai="' + opts.idx + '"' : '');
    const tr = ' transform="translate(' + r1(it.x) + ' ' + r1(it.y) + ')"';
    if (it.t === 'a' || it.t === 'b') {
      const fill = it.t === 'a' ? P.a : P.b; const ink = it.t === 'a' ? P.aInk : P.bInk;
      const ring = it.t === 'b' && sport === 'basquet' ? P.ring : '#FFFFFF';
      return '<g class="bd-p bd-' + it.t + '"' + di + tr + '><circle cx="0.5" cy="1.1" r="7.2" fill="rgba(0,0,0,0.28)"/>' +
        '<circle r="7" fill="' + fill + '" stroke="' + ring + '" stroke-width="1.2"/>' +
        '<text y="2.9" text-anchor="middle" font-size="8.4" font-weight="800" font-family="' + BOARD_FONT + '" fill="' + ink + '">' + esc(it.n || '') + '</text></g>';
    }
    if (it.t === 'cone') {
      return '<g class="bd-cone"' + di + tr + '><path d="M0.6-4.4L5.4 4.2h-9.6z" fill="rgba(0,0,0,0.22)"/>' +
        '<path d="M0-5.4L4.6 3.4h-9.2z" fill="' + P.cone + '" stroke="' + P.coneEdge + '" stroke-width="0.6" stroke-linejoin="round"/>' +
        '<path d="M-1.6-1.6h3.2" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/><circle r="9" fill="transparent"/></g>';
    }
    if (it.t === 'ladder') {
      // Escalera de coordinación: n travesaños cada 7 unidades, 10 de ancho; r 0 = vertical, 90 = horizontal.
      const n = Math.max(2, Math.min(14, Math.round(Number(it.n) || 6)));
      const L = n * 7; const h = L / 2;
      let rungs = '';
      for (let k = 0; k <= n; k++) rungs += '<path d="M-5 ' + r1(-h + k * 7) + 'h10"/>';
      return '<g class="bd-gear bd-ladder"' + di + ' transform="translate(' + r1(it.x) + ' ' + r1(it.y) + ') rotate(' + (Number(it.r) === 90 ? 90 : 0) + ')">' +
        '<rect x="-5.6" y="' + r1(-h - 0.6) + '" width="11.2" height="' + r1(L + 1.2) + '" fill="rgba(0,0,0,0.12)" rx="1"/>' +
        '<g stroke="#FFD23F" stroke-width="1.3" stroke-linecap="round">' + rungs + '<path d="M-5 ' + r1(-h) + 'V' + r1(h) + 'M5 ' + r1(-h) + 'V' + r1(h) + '"/></g>' +
        '<rect x="-7" y="' + r1(-h - 2) + '" width="14" height="' + r1(L + 4) + '" fill="transparent"/></g>';
    }
    if (it.t === 'hurdle') {
      return '<g class="bd-gear bd-hurdle"' + di + ' transform="translate(' + r1(it.x) + ' ' + r1(it.y) + ') rotate(' + (Number(it.r) === 90 ? 90 : 0) + ')">' +
        '<rect x="-5.6" y="-0.4" width="12.4" height="3" rx="1.4" fill="rgba(0,0,0,0.22)"/>' +
        '<rect x="-6.2" y="-1.4" width="12.4" height="2.8" rx="1.4" fill="#F25C2A" stroke="#A8360F" stroke-width="0.5"/>' +
        '<path d="M-6.2-3v6M6.2-3v6" stroke="#A8360F" stroke-width="1.2" stroke-linecap="round"/><rect x="-9" y="-6" width="18" height="12" fill="transparent"/></g>';
    }
    if (it.t === 'ring') {
      return '<g class="bd-gear bd-ring"' + di + tr + '><circle cx="0.4" cy="0.8" r="5" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="1.8"/>' +
        '<circle r="5" fill="none" stroke="#E83E8C" stroke-width="1.6"/><circle r="8" fill="transparent"/></g>';
    }
    if (it.t === 'pole') {
      return '<g class="bd-gear bd-pole"' + di + tr + '><ellipse cx="1.6" cy="1.4" rx="2.6" ry="1.4" fill="rgba(0,0,0,0.25)"/>' +
        '<circle r="2.4" fill="#FFFFFF" stroke="#D62828" stroke-width="1.2"/><circle r="0.8" fill="#D62828"/><circle r="8" fill="transparent"/></g>';
    }
    if (it.t === 'ball') {
      const inner = sport === 'basquet'
        ? '<circle r="3.6" fill="#E8701E" stroke="#3A1A05" stroke-width="0.7"/><path d="M-3.6 0h7.2M0-3.6v7.2M-2.5-2.6a3.6 3.6 0 0 1 0 5.2M2.5-2.6a3.6 3.6 0 0 0 0 5.2" fill="none" stroke="#3A1A05" stroke-width="0.5"/>'
        : '<circle r="3.6" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="0.7"/><path d="M0-1.5l1.4 1-.5 1.6h-1.8l-.5-1.6z" fill="#1A1A1A"/>';
      return '<g class="bd-ball"' + di + tr + '><circle cx="0.4" cy="0.9" r="3.7" fill="rgba(0,0,0,0.25)"/>' + inner + '<circle r="8" fill="transparent"/></g>';
    }
    if (it.t === 'arrow') {
      const g = arrowGeom(it);
      const dash = it.k === 'pase' ? ' stroke-dasharray="3.2 2.4"' : '';
      return '<g class="bd-arrow"' + di + (opts && opts.anim ? ' data-s="' + (Number(it.s) || 0) + '"' : '') + '>' +
        '<path class="hit" d="M' + r1(it.x) + ' ' + r1(it.y) + 'L' + r1(it.x2) + ' ' + r1(it.y2) + '" stroke="transparent" stroke-width="10" fill="none"/>' +
        '<path d="' + g.body + '" fill="none" stroke="' + P.halo + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"' + dash + '/>' +
        '<path d="' + g.body + '" fill="none" stroke="' + P.arrow + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"' + dash + '/>' +
        '<path d="' + g.head + '" fill="' + P.arrow + '" stroke="' + P.halo + '" stroke-width="0.6"/></g>';
    }
    return '';
  }

  // Dibujo de cancha con (opcionalmente) jugadores, conos, balón y flechas.
  // opts: interactive (índices para editar), anim (para reproducir la jugada), fit, cls, export [ancho, alto].
  function boardSVG(sport, d, opts) {
    opts = opts || {};
    sport = BOARD[sport] ? sport : 'futbol';
    const v = (d && d.v) || defaultVariant(sport);
    const P = BOARD[sport];
    const items = (d && d.items) || [];
    const size = opts.export ? ' xmlns="http://www.w3.org/2000/svg" width="' + opts.export[0] + '" height="' + opts.export[1] + '"' : '';
    return '<svg' + size + ' viewBox="' + (opts.crop ? cropBox(items) : '0 0 160 200') + '" preserveAspectRatio="' + (opts.fit || 'xMidYMid slice') + '" aria-hidden="true" class="bd bd-' + sport + (opts.cls ? ' ' + opts.cls : '') + '">' +
      turfSVG(sport, v) +
      '<g fill="none" stroke="' + P.line + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" color="' + P.line + '">' + (COURT[sport + '-' + v] || COURT['futbol-full']) + '</g>' +
      '<g class="bd-items">' + items.map((it, i) => (it.t === 'arrow' ? itemSVG(it, opts.interactive ? i : null, sport, { anim: opts.anim, idx: i }) : '')).join('') +
      items.map((it, i) => (it.t !== 'arrow' ? itemSVG(it, opts.interactive ? i : null, sport, { anim: opts.anim, idx: i }) : '')).join('') + '</g></svg>';
  }
  const fieldArt = (sport) => boardSVG(sport, null);
  // Recorte 4:5 alrededor de las piezas (mínimo 60 % de la cancha) para miniaturas legibles.
  function cropBox(items) {
    if (!items || !items.length) return '0 0 160 200';
    const xs = []; const ys = [];
    items.forEach((it) => { xs.push(it.x); ys.push(it.y); if (it.t === 'arrow') { xs.push(it.x2); ys.push(it.y2); } });
    const x0 = Math.min.apply(null, xs) - 18; const x1 = Math.max.apply(null, xs) + 18;
    const y0 = Math.min.apply(null, ys) - 18; const y1 = Math.max.apply(null, ys) + 18;
    let w = Math.max(96, x1 - x0); let h = Math.max(120, y1 - y0);
    if (w / h > 0.8) h = w / 0.8; else w = h * 0.8;
    if (w > 160 || h > 200) return '0 0 160 200';
    const cx = Math.max(0, Math.min(160 - w, (x0 + x1) / 2 - w / 2)); const cy = Math.max(0, Math.min(200 - h, (y0 + y1) / 2 - h / 2));
    return [cx, cy, w, h].map(r1).join(' ');
  }

  // ---------------------------------------------------------------- la jugada en movimiento
  // Reproduce un diagrama paso a paso: el balón viaja por los pases y los jugadores corren por sus flechas.
  // Las flechas con el mismo «s» pasan al mismo tiempo; sin «s» van en el orden en que se dibujaron.
  const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  function diagramSteps(d) {
    const arrows = ((d && d.items) || []).map((it, i) => ({ it, i })).filter((x) => x.it.t === 'arrow');
    const withS = arrows.some((x) => Number(x.it.s) > 0);
    const groups = new Map();
    arrows.forEach((x, n) => {
      const k = withS ? Number(x.it.s) || 99 : n + 1;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(x);
    });
    return Array.from(groups.keys()).sort((a, b) => a - b).map((k) => groups.get(k));
  }
  const canPlay = (d) => diagramSteps(d).length > 0;
  const MOVERS = { a: 1, b: 1, ball: 1 };

  function playDiagram(host, d, opts) {
    opts = opts || {};
    const svg = host && host.querySelector('svg');
    if (!svg || !canPlay(d)) return { stop() {} };
    const items = d.items;
    const layer = svg.querySelector('.bd-items');
    const steps = diagramSteps(d);
    const sport = svg.classList.contains('bd-basquet') ? 'basquet' : 'futbol';
    let raf = 0; let timer = 0; let stopped = false;
    const pieceEl = (i) => layer.querySelector('[data-ai="' + i + '"]');
    const ghosts = [];
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let pos;
    function reset() {
      ghosts.splice(0).forEach((g) => g.remove());
      pos = items.map((it) => ({ x: it.x, y: it.y }));
      items.forEach((it, i) => {
        const el = pieceEl(i);
        if (!el) return;
        if (it.t === 'arrow') { el.style.transition = 'none'; el.style.opacity = '0'; } else if (MOVERS[it.t]) el.setAttribute('transform', 'translate(' + r1(it.x) + ' ' + r1(it.y) + ')');
      });
    }
    function nearest(type, x, y, max) {
      let best = -1; let bd = max;
      items.forEach((it, i) => {
        if (it.t === 'arrow' || !type(it)) return;
        const q = pos[i]; const dd = Math.hypot(q.x - x, q.y - y);
        if (dd < bd) { bd = dd; best = i; }
      });
      ghosts.forEach((g) => { const dd = Math.hypot(g.p.x - x, g.p.y - y); if (dd < bd) { bd = dd; best = g; } });
      return best;
    }
    function ghostBall(x, y) {
      const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tmp.innerHTML = itemSVG({ t: 'ball', x, y }, null, sport);
      const g = tmp.firstChild;
      layer.appendChild(g);
      const o = { el: g, p: { x, y }, ghost: true, remove() { g.remove(); } };
      ghosts.push(o);
      return o;
    }
    function runStep(si) {
      if (stopped) return;
      if (si >= steps.length) {
        if (opts.onEnd) opts.onEnd();
        if (opts.loop) timer = setTimeout(() => { reset(); timer = setTimeout(() => runStep(0), 700); }, 1800);
        return;
      }
      const moves = [];
      steps[si].forEach(({ it, i }) => {
        const el = pieceEl(i);
        if (el) { el.style.transition = 'opacity 0.25s ease'; el.style.opacity = '1'; }
        const isBall = (x) => x.t === 'ball';
        const isPlayer = (x) => x.t === 'a' || x.t === 'b';
        const add = (who) => {
          if (who === -1 || who == null) return;
          const p = who.ghost ? who.p : pos[who];
          const node = who.ghost ? who.el : pieceEl(who);
          moves.push({ node, p, x0: p.x, y0: p.y, dx: it.x2 - it.x, dy: it.y2 - it.y });
        };
        if (it.k === 'pase') {
          let b = nearest(isBall, it.x, it.y, 13);
          if (b === -1) b = ghostBall(it.x, it.y);
          add(b);
        } else {
          add(nearest(isPlayer, it.x, it.y, 13));
          if (it.k === 'conduccion') add(nearest(isBall, it.x, it.y, 13));
        }
      });
      const dur = Math.max(...steps[si].map(({ it }) => Math.min(1300, 520 + Math.hypot(it.x2 - it.x, it.y2 - it.y) * 9)));
      const t0 = performance.now();
      const frame = (now) => {
        if (stopped) return;
        const t = Math.min(1, (now - t0) / dur);
        const e = ease(t);
        moves.forEach((m) => {
          m.p.x = m.x0 + m.dx * e; m.p.y = m.y0 + m.dy * e;
          if (m.node) m.node.setAttribute('transform', 'translate(' + r1(m.p.x) + ' ' + r1(m.p.y) + ')');
        });
        if (t < 1) raf = requestAnimationFrame(frame);
        else timer = setTimeout(() => runStep(si + 1), 260);
      };
      raf = requestAnimationFrame(frame);
    }
    reset();
    timer = setTimeout(() => runStep(0), opts.delay == null ? 450 : opts.delay);
    return {
      stop(showAll) {
        stopped = true; cancelAnimationFrame(raf); clearTimeout(timer);
        if (showAll !== false) {
          ghosts.splice(0).forEach((g) => g.remove());
          items.forEach((it, i) => {
            const el = pieceEl(i);
            if (!el) return;
            if (it.t === 'arrow') { el.style.transition = 'none'; el.style.opacity = '1'; } else if (MOVERS[it.t]) el.setAttribute('transform', 'translate(' + r1(it.x) + ' ' + r1(it.y) + ')');
          });
        }
      },
    };
  }


  // ---------------------------------------------------------------- ejemplos (solo modo local)
  // Versión 2: ejemplos revisados por un profe (sesión con inicio, pausa, series y cierre).
  const SEED_VERSION = 4;
  function nextWeekday(days) {
    const d = new Date();
    for (let i = 1; i <= 7; i++) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      if (days.indexOf(x.getDay()) >= 0) return dayStr(x);
    }
    return addDays(1);
  }
  function seedFromCatalog(cat) {
    const t = Date.now() - 864e5 * 3;
    // Clases de ejemplo: las de coordinación (con videos); la biblioteca también trae las de pase y dribleo.
    const pick = (sport, re) => cat.sessions.find((x) => x.sport === sport && re.test(x.name)) || cat.sessions.find((x) => x.sport === sport);
    const fut = pick('futbol', /coordinaci/i);
    const bas = pick('basquet', /pies r|coordinaci/i);
    if (!fut || !bas) return null;
    const firsts = ['futbol', 'basquet'].map((sp) => cat.sessions.find((x) => x.sport === sp)).filter(Boolean);
    const ids = new Set([fut, bas].concat(firsts).reduce((a, ses) => a.concat(ses.items.map((it) => it.exId).filter(Boolean)), []));
    let n = 0;
    const exercises = cat.exercises.filter((x) => ids.has(x.id)).map((x) => Object.assign({}, x, {
      id: 'ex3-' + x.id, catalogId: x.id, favorite: false, mediaType: null, mediaId: null, thumbId: null, mediaDuration: 0, mediaAspect: null,
      diagram: JSON.parse(JSON.stringify(x.diagram)), example: true, createdAt: t - (n += 1) * 60000, updatedAt: t - n * 60000,
    }));
    exercises.forEach((x) => { x.updatedAt = x.createdAt; });
    const plan = (ses) => ses.items.map((it) => (isPause(it) ? { type: 'pause', label: it.label, min: it.min } : Object.assign({ exId: 'ex3-' + it.exId, min: it.min }, it.series ? { series: Object.assign({}, it.series) } : {})));
    const short = (name) => String(name).split(' · ').pop();
    const kids = (pre, names) => names.map((nm, i) => ({ id: 'al3-' + pre + (i + 1), name: nm }));
    return {
      exercises,
      classes: [
        { id: 'cl3-ej1', sport: 'futbol', name: short(fut.name), date: nextWeekday([1, 3]), groupId: 'gr3-ej1', notes: fut.notes, items: plan(fut), example: true, createdAt: t, updatedAt: t },
        { id: 'cl3-ej2', sport: 'basquet', name: short(bas.name), date: nextWeekday([2, 4]), groupId: 'gr3-ej2', notes: bas.notes, items: plan(bas), example: true, createdAt: t, updatedAt: t },
      ],
      groups: [
        { id: 'gr3-ej1', name: '5.º A', sport: 'futbol', category: 'Primaria', schedule: 'Lun y Mié 9:00', place: 'Patio', example: true, createdAt: t, updatedAt: t,
          students: kids('a', ['Aguilar Ruiz Sofía', 'Castillo Pérez Diego', 'Domínguez Luna Valeria', 'Flores Ortega Emiliano', 'García Mendoza Regina', 'Hernández Cruz Santiago', 'Jiménez Ramos Ximena', 'López Torres Mateo', 'Martínez Vega Camila', 'Morales Díaz Leonardo', 'Ramírez Soto Renata', 'Sánchez Reyes Iker']) },
        { id: 'gr3-ej2', name: '2.º B', sport: 'basquet', category: 'Secundaria', schedule: 'Mar y Jue 11:00', place: 'Cancha techada', example: true, createdAt: t, updatedAt: t,
          students: kids('b', ['Acosta Medina Andrea', 'Bautista Rojas Emilio', 'Cervantes Lara Fernanda', 'Delgado Núñez Sebastián', 'Escobar Ríos Mariana', 'Fuentes Salas Daniel', 'Guerrero Peña Paola', 'Ibarra Campos Rodrigo', 'Juárez Molina Natalia', 'Navarro Lozano Jesús', 'Orozco Trejo Daniela', 'Vázquez Ponce Alejandro']) },
      ],
    };
  }
  // Tres secciones de ejemplo que se llenan con los ejercicios de ejemplo.
  function defaultSections(exs, t) {
    const ids = (fn) => exs.filter(fn).map((e) => e.id);
    const primaria = (e) => { const r = ageRange(e.age); return e.school && (!r || r[0] <= 12); };
    return [
      { id: 'sc4-ej1', name: 'Calentamientos', exIds: ids((e) => e.objective === 'Calentamiento'), order: 1 },
      { id: 'sc4-ej2', name: 'Coordinación y velocidad', exIds: ids((e) => e.objective === 'Coordinación' || e.objective === 'Velocidad y agilidad'), order: 2 },
      { id: 'sc4-ej3', name: 'Para primaria', exIds: ids(primaria), order: 3 },
    ].map((x) => Object.assign(x, { example: true, createdAt: t, updatedAt: t }));
  }
  function seedData(cat) {
    const fromCat = cat ? seedFromCatalog(cat) : null;
    if (fromCat) return fromCat;
    const t = Date.now() - 864e5 * 3;
    const ex = (o, i) => Object.assign({
      favorite: false, mediaType: null, mediaId: null, thumbId: null, mediaDuration: 0, mediaAspect: null, diagram: null,
      level: 'Inicial', example: true, createdAt: t - i * 60000, updatedAt: t - i * 60000,
    }, o);
    return {
      exercises: [
        ex({ id: 'ex2-f1', sport: 'futbol', title: 'Pases en parejas con movilidad', objective: 'Calentamiento', duration: 10, players: 'Todo el grupo, en parejas', age: 'Sub-8 a Sub-12', material: '1 balón por pareja y 4 conos', space: '20 × 20 m', description: 'Por parejas, trote suave dentro del cuadrado pasándose el balón con la parte interna. A la señal, movilidad sin dejar de pasarse el balón: rodillas arriba, talones al glúteo y desplazamiento lateral.', keyPoints: 'Empezar suave y subir el ritmo poco a poco\nPase con la parte interna del pie\nLevantar la mirada para no chocar con otras parejas' }, 0),
        ex({ id: 'ex2-f2', sport: 'futbol', title: 'Rondo 4 contra 1', objective: 'Pase', duration: 15, players: '5 por grupo', age: 'Sub-8 a Sub-12', material: '4 conos y 1 balón por grupo, chalecos', space: '10 × 10 m', description: 'Cuatro jugadores, uno en cada lado del cuadrado, mantienen el balón ante un defensor en el centro. Si el defensor lo recupera, cambia de lugar con quien lo perdió. Al inicio, toques libres.', keyPoints: 'Perfil abierto antes de recibir\nPasar al pie alejado del defensor\nMoverse por el lado para dar línea de pase\nProgresión: máximo dos toques', favorite: true, diagram: SEED_DIAGRAMS.rondo }, 1),
        ex({ id: 'ex2-f3', sport: 'futbol', title: 'Conducción en slalom y tiro', objective: 'Conducción', level: 'Intermedio', duration: 15, players: '8 a 12, en 2 filas', age: 'Sub-10 a Sub-14', material: '12 conos, 1 balón por jugador y 2 porterías', space: 'Medio campo', description: 'Dos filas de 4 a 6 jugadores, cada una frente a una portería. Conducción entre seis conos separados 2 m y tiro desde el borde del área. Después de tirar, recoge su balón y regresa por fuera a la otra fila.', keyPoints: 'Toques cortos y cabeza levantada\nUsar interior y exterior del pie\nAcelerar después del último cono\nAlternar pierna hábil y no hábil en cada vuelta', diagram: SEED_DIAGRAMS.slalom }, 2),
        ex({ id: 'ex2-f4', sport: 'futbol', title: '3 contra 3 a porterías pequeñas', objective: 'Juego reducido', level: 'Intermedio', duration: 19, players: '6 por cancha', age: 'Sub-10 en adelante', material: 'Chalecos, 2 porterías pequeñas o conos, balones de reserva', space: '25 × 20 m', description: 'Partido 3 contra 3 sin porteros. Series de 3 minutos con 1 minuto de descanso; en cada serie se cambia de rival. El gol vale doble si llega después de recuperar el balón en campo rival.', keyPoints: 'Presionar justo después de perder el balón\nAbrirse para dar opciones de pase\nHablar: «solo», «atrás», «cambio»', diagram: SEED_DIAGRAMS.tres }, 3),
        ex({ id: 'ex2-f5', sport: 'futbol', title: 'Estiramientos y cierre en círculo', objective: 'Vuelta a la calma', duration: 5, players: 'Todo el grupo', age: 'Todas', material: 'Ninguno', description: 'En círculo, estiramientos suaves de piernas de 20 segundos cada uno: cuádriceps, isquiotibiales y gemelos. Para cerrar, cada quien dice algo que hizo bien en la sesión.', keyPoints: 'Respirar lento\nNo rebotar al estirar\nHidratarse al terminar' }, 4),
        ex({ id: 'ex2-b1', sport: 'basquet', title: 'Dribleo en zigzag con mano débil', objective: 'Dribleo', duration: 10, players: 'Todo el grupo, en 4 filas', age: 'Sub-8 a Sub-12', material: '1 balón por jugador y 4 conos por fila', space: 'De la línea de fondo a medio campo', description: 'Desde la línea de fondo hacia medio campo, dribleo en zigzag con cambio de mano por delante en cada cono. De regreso, solo con la mano débil.', keyPoints: 'Driblar a la altura de la cintura\nMirar al frente, no al balón\nProteger el balón con el cuerpo', diagram: SEED_DIAGRAMS.zigzag }, 0),
        ex({ id: 'ex2-b2', sport: 'basquet', title: 'Rueda de entradas', objective: 'Entrada', duration: 12, players: '8 a 14, en 2 filas', age: 'Sub-10 a Sub-14', material: '3 o 4 balones', space: 'Media cancha', description: 'Dos filas en el ala: una pasa y la otra entra a la canasta. Después de la entrada, cada jugador toma su rebote y cambia de fila. Cada 2 minutos se cambia de lado.', keyPoints: 'Dos tiempos: derecha e izquierda por el lado derecho\nRodilla arriba en el salto\nApoyar el balón en el tablero', favorite: true }, 1),
        ex({ id: 'ex2-b3', sport: 'basquet', title: '2 contra 2 con ayuda defensiva', objective: 'Defensa', level: 'Avanzado', duration: 15, players: '4 por canasta', age: 'Sub-14 en adelante', material: '1 balón y chalecos', space: 'Media cancha', description: 'Ataque 2 contra 2 desde el perímetro. El defensor del jugador sin balón ayuda en la penetración y regresa con su marca.', keyPoints: 'Posición de ayuda: ver balón y marca\nCerrar la línea de fondo\nAvisar «ayuda» y «tengo»' }, 2),
      ],
      classes: [
        { id: 'cl2-ej1', sport: 'futbol', name: 'Pase y posesión', date: nextWeekday([2, 4]), groupId: 'gr2-ej1', notes: 'Llevar chalecos de dos colores y suficiente agua.',
          items: [{ exId: 'ex2-f1', min: 10 }, { exId: 'ex2-f2', min: 15 }, { type: 'pause', label: 'Hidratación', min: 3 }, { exId: 'ex2-f4', min: 19, series: { n: 5, work: 3, rest: 1 } }, { exId: 'ex2-f5', min: 5 }],
          example: true, createdAt: t, updatedAt: t },
      ],
      groups: [
        { id: 'gr2-ej1', name: 'Sub-12 A', sport: 'futbol', category: 'Sub-12', schedule: 'Mar y Jue 16:00', place: 'Cancha 1', example: true, createdAt: t, updatedAt: t,
          students: ['Ana', 'Bruno', 'Camila', 'Diego', 'Emiliano', 'Fernanda', 'Mateo', 'Valeria'].map((n, i) => ({ id: 'al2-ej' + (i + 1), name: n })) },
      ],
    };
  }
  const SEED_DIAGRAMS = {
    rondo: { v: 'full', items: [
      { t: 'cone', x: 52, y: 72 }, { t: 'cone', x: 108, y: 72 }, { t: 'cone', x: 108, y: 128 }, { t: 'cone', x: 52, y: 128 },
      { t: 'a', x: 80, y: 74, n: 1 }, { t: 'a', x: 106, y: 100, n: 2 }, { t: 'a', x: 80, y: 126, n: 3 }, { t: 'a', x: 54, y: 100, n: 4 },
      { t: 'b', x: 82, y: 98, n: 1 }, { t: 'ball', x: 87, y: 79 },
      { t: 'arrow', k: 'pase', x: 87, y: 80, x2: 101, y2: 93 }, { t: 'arrow', k: 'mov', x: 74, y: 126, x2: 62, y2: 116 },
    ] },
    slalom: { v: 'half', items: [
      { t: 'cone', x: 80, y: 160 }, { t: 'cone', x: 80, y: 144 }, { t: 'cone', x: 80, y: 128 }, { t: 'cone', x: 80, y: 112 }, { t: 'cone', x: 80, y: 96 }, { t: 'cone', x: 80, y: 80 },
      { t: 'a', x: 80, y: 177, n: 1 }, { t: 'a', x: 64, y: 184, n: 2 }, { t: 'ball', x: 89, y: 172 },
      { t: 'arrow', k: 'conduccion', x: 92, y: 164, x2: 92, y2: 78 },
      { t: 'arrow', k: 'pase', x: 86, y: 68, x2: 80, y2: 24 },
      { t: 'arrow', k: 'mov', x: 120, y: 60, x2: 120, y2: 170 },
    ] },
    tres: { v: 'half', items: [
      { t: 'a', x: 56, y: 120, n: 1 }, { t: 'a', x: 92, y: 104, n: 2 }, { t: 'a', x: 116, y: 138, n: 3 },
      { t: 'b', x: 70, y: 92, n: 1 }, { t: 'b', x: 104, y: 84, n: 2 }, { t: 'b', x: 98, y: 124, n: 3 },
      { t: 'ball', x: 63, y: 115 },
      { t: 'arrow', k: 'pase', x: 62, y: 116, x2: 86, y2: 107 }, { t: 'arrow', k: 'mov', x: 116, y: 130, x2: 122, y2: 96 },
    ] },
    zigzag: { v: 'half', items: [
      { t: 'a', x: 44, y: 176, n: 1 }, { t: 'ball', x: 52, y: 170 },
      { t: 'cone', x: 62, y: 150 }, { t: 'cone', x: 100, y: 124 }, { t: 'cone', x: 62, y: 98 }, { t: 'cone', x: 100, y: 72 },
      { t: 'arrow', k: 'conduccion', x: 52, y: 162, x2: 90, y2: 134 }, { t: 'arrow', k: 'conduccion', x: 92, y: 118, x2: 70, y2: 104 },
      { t: 'arrow', k: 'conduccion', x: 70, y: 90, x2: 92, y2: 76 },
    ] },
  };

  // ---------------------------------------------------------------- almacenamiento local
  // Abre IndexedDB y vuelve a conectarse si Safari cierra la conexión.
  function idbStore() {
    let dbp = null;
    function open() {
      return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) { reject(new Error('no-idb')); return; }
        let req;
        try { req = indexedDB.open('cancha', 2); } catch (e) { reject(e); return; }
        const timer = setTimeout(() => reject(new Error('idb-timeout')), 12000);
        req.onupgradeneeded = () => {
          const db = req.result;
          ['exercises', 'classes', 'groups'].forEach((n) => { if (!db.objectStoreNames.contains(n)) db.createObjectStore(n, { keyPath: 'id' }); });
          if (!db.objectStoreNames.contains('media')) db.createObjectStore('media');
          if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        };
        req.onerror = () => { clearTimeout(timer); reject(req.error || new Error('idb')); };
        req.onblocked = () => { /* otra pestaña tiene una versión vieja abierta: esperamos */ };
        req.onsuccess = () => {
          clearTimeout(timer);
          const db = req.result;
          db.onversionchange = () => { try { db.close(); } catch (e) { /* */ } dbp = null; };
          db.onclose = () => { dbp = null; };
          resolve(db);
        };
      });
    }
    const getDB = () => {
      if (!dbp) dbp = open().catch((e) => { dbp = null; throw e; });
      return dbp;
    };
    async function run(name, mode, fn, retry) {
      const db = await getDB();
      try {
        return await new Promise((res, rej) => {
          let r; let tx;
          try { tx = db.transaction(name, mode); r = fn(tx.objectStore(name)); } catch (e) { rej(e); return; }
          tx.oncomplete = () => res(r ? r.result : undefined);
          tx.onerror = () => rej(tx.error);
          tx.onabort = () => rej(tx.error || new Error('abort'));
        });
      } catch (e) {
        if (retry !== false && e && (e.name === 'InvalidStateError' || e.name === 'TransactionInactiveError')) { dbp = null; return run(name, mode, fn, false); }
        throw e;
      }
    }
    return getDB().then(() => ({
      all: (n) => run(n, 'readonly', (s) => s.getAll()),
      get: (n, k) => run(n, 'readonly', (s) => s.get(k)),
      put: (n, v, k) => run(n, 'readwrite', (s) => (k === undefined ? s.put(v) : s.put(v, k))),
      del: (n, k) => run(n, 'readwrite', (s) => s.delete(k)),
      keys: (n) => run(n, 'readonly', (s) => s.getAllKeys()),
    }));
  }
  function memStore() {
    const m = { exercises: new Map(), classes: new Map(), groups: new Map(), media: new Map(), meta: new Map() };
    return {
      all: async (n) => Array.from(m[n].values()),
      get: async (n, k) => m[n].get(k),
      put: async (n, v, k) => { m[n].set(k === undefined ? v.id : k, v); },
      del: async (n, k) => { m[n].delete(k); },
      keys: async (n) => Array.from(m[n].keys()),
    };
  }

  // Cambia los ejemplos viejos por los nuevos sin tocar nada que el profe haya usado o editado.
  async function migrateSeeds(st, cat) {
    const [exs, cls, grs] = await Promise.all([st.all('exercises'), st.all('classes'), st.all('groups')]);
    const pristine = (x) => x.example && Number(x.updatedAt) === Number(x.createdAt);
    const keepCls = cls.filter((c) => !pristine(c));
    const usedEx = new Set(); const usedGr = new Set();
    keepCls.forEach((c) => { (c.items || []).forEach((it) => { if (it.exId) usedEx.add(it.exId); }); if (c.groupId) usedGr.add(c.groupId); });
    let replaced = 0;
    for (const c of cls) {
      if (pristine(c)) { await st.del('classes', c.id); replaced++; } else if (c.example) { c.example = false; await st.put('classes', c); }
    }
    for (const e of exs) {
      if (pristine(e) && !usedEx.has(e.id)) { await st.del('exercises', e.id); replaced++; } else if (e.example) { e.example = false; await st.put('exercises', e); }
    }
    for (const g of grs) {
      if (pristine(g) && !usedGr.has(g.id)) { await st.del('groups', g.id); replaced++; } else if (g.example) { g.example = false; await st.put('groups', g); }
    }
    if (replaced) {
      const seed = seedData(cat);
      // Nunca se pisa lo que sigue ahí (un ejemplo que el profe cambió conserva su versión).
      for (const x of seed.exercises) if (!(await st.get('exercises', x.id))) await st.put('exercises', x);
      for (const c of seed.classes) if (!(await st.get('classes', c.id))) await st.put('classes', c);
      for (const g of seed.groups) if (!(await st.get('groups', g.id))) await st.put('groups', g);
    }
  }

  async function localBackend(kind) {
    const st = kind === 'memory' ? memStore() : await idbStore();
    const listeners = new Set();
    const urls = new Map();
    let chain = Promise.resolve();
    let pending = 0;
    async function reload() {
      const r = await Promise.all([st.all('exercises'), st.all('classes'), st.all('groups'), st.get('meta', 'sections')]);
      const snap = { exercises: r[0] || [], classes: r[1] || [], groups: r[2] || [], sections: Array.isArray(r[3]) ? r[3] : [], fromCache: false };
      listeners.forEach((fn) => fn(snap));
    }
    // Las escrituras van en fila; la pantalla se recarga desde la base solo cuando ya no hay pendientes.
    function write(fn) {
      pending++;
      const p = chain.then(fn);
      chain = p.catch(() => {});
      return p.finally(() => { pending--; if (!pending) return reload().catch(() => {}); return null; });
    }
    if (kind !== 'memory') {
      const seeded = await st.get('meta', 'seeded');
      const version = Number(await st.get('meta', 'seed-version')) || (seeded ? 1 : 0);
      // Los ejemplos salen del catálogo; si no se pudo cargar, quedan los anteriores y se intenta otro día.
      const cat = !seeded || version < SEED_VERSION ? await loadCatalog().catch(() => null) : null;
      const seedVersion = cat ? SEED_VERSION : 2;
      if (!seeded) {
        const existing = await st.all('exercises');
        if (!existing.length) {
          const seed = seedData(cat);
          for (const x of seed.exercises) await st.put('exercises', x);
          for (const c of seed.classes) await st.put('classes', c);
          for (const g of seed.groups) await st.put('groups', g);
        }
        await st.put('meta', true, 'seeded');
        await st.put('meta', seedVersion, 'seed-version');
      } else if (version < seedVersion) {
        await migrateSeeds(st, cat);
        await st.put('meta', seedVersion, 'seed-version');
      }
      // Secciones de ejemplo: se crean una vez; las que siguen intactas se rellenan con los ejemplos nuevos.
      const secs = await st.get('meta', 'sections');
      const exampleEx = (await st.all('exercises')).filter((e) => e.example);
      const defs = defaultSections(exampleEx, Date.now() - 864e5 * 3);
      if (!Array.isArray(secs)) await st.put('meta', defs, 'sections');
      else if (version < seedVersion && secs.some((x) => x.example)) {
        await st.put('meta', secs.map((x) => { const d = defs.find((y) => y.id === x.id); return x.example && d ? Object.assign({}, x, { exIds: d.exIds }) : x; }), 'sections');
      }
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* opcional */ }
    }
    return {
      kind,
      canWrite: true,
      subscribe(fn) { listeners.add(fn); reload().catch(() => {}); return () => listeners.delete(fn); },
      saveExercise: (x) => write(() => st.put('exercises', plain(x))),
      deleteExercise: (id) => write(() => st.del('exercises', id)),
      saveClass: (c) => write(() => st.put('classes', plain(c))),
      deleteClass: (id) => write(() => st.del('classes', id)),
      saveGroup: (g) => write(() => st.put('groups', plain(g))),
      deleteGroup: (id) => write(() => st.del('groups', id)),
      saveSection: (sec) => write(async () => {
        const list = (await st.get('meta', 'sections')) || [];
        const i = list.findIndex((x) => x.id === sec.id);
        if (i >= 0) list[i] = plain(sec); else list.push(plain(sec));
        await st.put('meta', list, 'sections');
      }),
      deleteSection: (id) => write(async () => {
        const list = (await st.get('meta', 'sections')) || [];
        await st.put('meta', list.filter((x) => x.id !== id), 'sections');
      }),
      me: null,
      profiles: async () => ({}),
      async putMedia(blob) {
        const id = uid();
        try { await st.put('media', blob, id); } catch (e) {
          if (e && e.name === 'QuotaExceededError') throw e;
          const buf = await blob.arrayBuffer();
          await st.put('media', { buf, type: blob.type }, id);
        }
        return id;
      },
      cachedURL: (id) => urls.get(id) || null,
      async mediaBlob(id) {
        const v = await st.get('media', id);
        if (!v) return null;
        return v instanceof Blob ? v : new Blob([v.buf], { type: v.type });
      },
      async mediaSize(id) {
        const v = await st.get('media', id);
        return v ? (v instanceof Blob ? v.size : v.buf.byteLength) : 0;
      },
      async mediaURL(id) {
        if (!id) return null;
        if (urls.has(id)) return urls.get(id);
        let v = await st.get('media', id);
        if (!v) return null;
        if (!(v instanceof Blob)) v = new Blob([v.buf], { type: v.type });
        const u = URL.createObjectURL(v);
        urls.set(id, u);
        return u;
      },
      async deleteMedia(id) {
        if (!id) return;
        const u = urls.get(id);
        if (u) { URL.revokeObjectURL(u); urls.delete(id); }
        await st.del('media', id);
      },
      // Borra videos y fotos que ya ningún ejercicio usa (quedan si un guardado falla a medias).
      async cleanOrphans(usedIds) {
        try {
          const keys = await st.keys('media');
          for (const k of keys) { if (!usedIds.has(k)) await st.del('media', k); }
        } catch (e) { /* no es grave */ }
      },
    };
  }

  // ---------------------------------------------------------------- almacenamiento en Claude (Artifact)
  async function withRetry(fn, code) {
    try { return await fn(); } catch (e) {
      if (e && e.code === (code || 'unavailable')) { await sleep(400 + Math.random() * 700); return fn(); }
      throw e;
    }
  }
  async function cloudBackend(db, assets, user) {
    let canWrite = !!assets;
    let me = null;
    if (user) {
      try { me = await user.id(); } catch (e) { /* sin identidad */ }
      if (canWrite) { try { const c = await user.can('data.write'); if (c === false) canWrite = false; } catch (e) { /* sin información */ } }
    }
    const queues = new Map();
    const queue = (key, fn) => {
      const next = (queues.get(key) || Promise.resolve()).catch(() => {}).then(fn);
      queues.set(key, next);
      return next;
    };
    const body = (x) => { const o = plain(x); delete o.id; return o; };
    return {
      kind: 'cloud',
      canWrite,
      me,
      async profiles(ids) {
        if (!user || !ids.length) return {};
        try { return (await user.profiles(ids)) || {}; } catch (e) { return {}; }
      },
      subscribe(fn, onError) {
        let ex = null; let cl = null; let gr = null; let sc = []; let exC = true; let clC = true; let grC = true;
        const emit = () => { if (ex && cl && gr) fn({ exercises: ex, classes: cl, groups: gr, sections: sc, fromCache: exC || clC || grC }); };
        const u1 = db.collection('exercises').onSnapshot((s) => {
          ex = s.docs.map((d) => Object.assign({}, d.data(), { id: d.id })); exC = s.metadata.fromCache; emit();
        }, (e) => onError && onError(e));
        const u2 = db.collection('classes').onSnapshot((s) => {
          cl = s.docs.map((d) => Object.assign({}, d.data(), { id: d.id })); clC = s.metadata.fromCache; emit();
        }, (e) => onError && onError(e));
        const u3 = db.collection('groups').onSnapshot((s) => {
          gr = s.docs.map((d) => Object.assign({}, d.data(), { id: d.id })); grC = s.metadata.fromCache; emit();
        }, (e) => onError && onError(e));
        let u4 = () => {};
        try {
          u4 = db.collection('sections').onSnapshot((snp) => { sc = snp.docs.map((d) => Object.assign({}, d.data(), { id: d.id })); emit(); }, () => {});
        } catch (e) { /* sin secciones */ }
        return () => { u1(); u2(); u3(); u4(); };
      },
      saveExercise: (x) => queue('e:' + x.id, () => withRetry(() => db.collection('exercises').doc(x.id).set(body(x)))),
      deleteExercise: (id) => queue('e:' + id, () => withRetry(() => db.collection('exercises').doc(id).delete())),
      saveClass: (c) => queue('c:' + c.id, () => withRetry(() => db.collection('classes').doc(c.id).set(body(c)))),
      deleteClass: (id) => queue('c:' + id, () => withRetry(() => db.collection('classes').doc(id).delete())),
      saveGroup: (g) => queue('g:' + g.id, () => withRetry(() => db.collection('groups').doc(g.id).set(body(g)))),
      deleteGroup: (id) => queue('g:' + id, () => withRetry(() => db.collection('groups').doc(id).delete())),
      saveSection: (x) => queue('s:' + x.id, () => withRetry(() => db.collection('sections').doc(x.id).set(body(x)))),
      deleteSection: (id) => queue('s:' + id, () => withRetry(() => db.collection('sections').doc(id).delete())),
      async putMedia(blob, type) {
        const r = await withRetry(() => assets.upload(blob, type ? { type } : undefined), 'store_unavailable');
        return r.id;
      },
      cachedURL: (id) => (id ? '/_blob/' + id : null),
      async mediaBlob(id) {
        const r = await fetch('/_blob/' + id);
        if (!r.ok) throw new Error('fetch');
        return r.blob();
      },
      mediaURL: async (id) => (id ? '/_blob/' + id : null),
      async deleteMedia(id) { if (!id || !assets) return; try { await assets.delete(id); } catch (e) { /* ya no existe */ } },
    };
  }

  async function initBackend() {
    const c = window.claude;
    if (c && typeof c.use === 'function') {
      try {
        const db = await c.use('db');
        if (db) {
          const r = await Promise.all([c.use('assets').catch(() => null), c.use('user').catch(() => null)]);
          return await cloudBackend(db, r[0], r[1]);
        }
      } catch (e) { /* sigue con almacenamiento local */ }
    }
    try { return await localBackend('local'); } catch (e) { return null; }
  }

  // ---------------------------------------------------------------- estado
  const S = {
    backend: null, ready: false, canWrite: false, stale: false, error: null,
    exercises: [], classes: [], groups: [], sections: [],
    fx: {},
    names: {}, namesAsked: new Set(),
    tab: 'clases',
    sport: 'futbol',
    q: { futbol: '', basquet: '' },
    f: { futbol: 'all', basquet: 'all' },
    scroll: {},
    sig: {},
  };
  const getEx = (id) => S.exercises.find((e) => e.id === id) || null;
  const getClass = (id) => S.classes.find((c) => c.id === id) || null;
  const getGroup = (id) => (id ? S.groups.find((g) => g.id === id) || null : null);
  const groupTint = (g) => (g && SPORTS[g.sport] ? g.sport : 'clases');
  const exOf = (sport) => S.exercises.filter((e) => e.sport === sport).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const classTotal = (c) => (c.items || []).reduce((s, it) => s + itemMin(it), 0);
  function replaceLocal(kind, obj) {
    const arr = S[kind];
    const i = arr.findIndex((x) => x.id === obj.id);
    if (i >= 0) arr.splice(i, 1, obj); else arr.push(obj);
  }
  function byUpcoming(a, b) {
    const t = todayStr();
    const ka = a.date ? (a.date >= t ? 0 : 1) : 2;
    const kb = b.date ? (b.date >= t ? 0 : 1) : 2;
    if (ka !== kb) return ka - kb;
    if (ka === 0) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    if (ka === 1) return a.date > b.date ? -1 : a.date < b.date ? 1 : 0;
    return (b.createdAt || 0) - (a.createdAt || 0);
  }

  // ---------------------------------------------------------------- capas (pantallas, hojas, avisos)
  const layers = [];
  const openScreens = new Set();
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const useHistory = !framed;
  // El botón «atrás» del teléfono cierra la capa de arriba. Las entradas de historial
  // se sincronizan con las capas abiertas en un solo paso (cerrar una y abrir otra en el
  // mismo toque no toca el historial), y nunca se retrocede más allá de la app.
  let histDepth = 0;
  let skipPop = 0;
  let syncQueued = false;

  function syncLock() { document.documentElement.classList.toggle('locked', layers.length > 0); }
  // Solo la capa de arriba se puede tocar o leer con VoiceOver; lo de abajo queda inerte.
  function syncInert() {
    const top = layers[layers.length - 1];
    const set = (el, v) => { if (el) { if (v) el.setAttribute('inert', ''); else el.removeAttribute('inert'); } };
    set($('#main'), !!top);
    set($('#dock'), !!top);
    layers.forEach((l) => set(l.el, l !== top));
  }
  function focusLayer(layer) {
    setTimeout(() => {
      if (layers[layers.length - 1] !== layer || !layer.el) return;
      const t = layer.focusEl ? layer.focusEl() : null;
      if (t) { try { t.focus({ preventScroll: true }); } catch (e) { /* */ } }
    }, 380);
  }
  function syncHistory() {
    if (!useHistory || skipPop > 0) return;
    const want = layers.length;
    try {
      while (histDepth < want) { histDepth++; history.pushState({ cancha: histDepth }, ''); }
      if (histDepth > want) {
        const n = histDepth - want;
        histDepth = want;
        skipPop++;
        history.go(-n);
      }
    } catch (e) { /* historial no disponible */ }
  }
  function scheduleSync() {
    if (!useHistory || syncQueued) return;
    syncQueued = true;
    setTimeout(() => { syncQueued = false; syncHistory(); }, 0);
  }
  function pushLayer(layer) {
    layer.returnFocus = document.activeElement;
    layers.push(layer);
    syncLock();
    syncInert();
    scheduleSync();
    focusLayer(layer);
  }
  function popLayer(layer) {
    const i = layers.lastIndexOf(layer);
    if (i < 0) return;
    layers.splice(i, 1);
    layer.close();
    syncLock();
    syncInert();
    scheduleSync();
    const back = layer.returnFocus;
    if (back && back.isConnected && typeof back.focus === 'function') { try { back.focus({ preventScroll: true }); } catch (e) { /* */ } }
  }
  window.addEventListener('popstate', () => {
    if (skipPop > 0) { skipPop--; scheduleSync(); return; }
    if (histDepth > 0) histDepth--;
    const top = layers[layers.length - 1];
    if (top) {
      if (top.onBack) top.onBack();
      else { layers.pop(); top.close(); syncLock(); syncInert(); }
    }
    scheduleSync();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const top = layers[layers.length - 1];
    if (!top) return;
    if (top.onBack) top.onBack(); else popLayer(top);
  });

  function topSurface() {
    for (let i = layers.length - 1; i >= 0; i--) if (layers[i].kind === 'screen') return layers[i].el;
    return $('#main');
  }
  // Si la pantalla que se quiere abrir ya está en la pila, regresa a ella en vez de apilar otra igual.
  function backToScreen(key) {
    const i = layers.findIndex((l) => l.kind === 'screen' && l.key === key);
    if (i < 0) return false;
    for (let j = layers.length - 1; j > i; j--) popLayer(layers[j]);
    return true;
  }

  function pushScreen(opts) {
    const prev = topSurface();
    const el = document.createElement('section');
    el.className = 'stack-screen';
    el.dataset.tint = opts.tint || 'futbol';
    el.innerHTML =
      '<div class="edge" aria-hidden="true"></div>' +
      '<div class="scroller">' +
      '<header class="navbar"><span class="nav-left"><button class="glass-btn back" aria-label="Volver">' + ic('chevL') + '</button></span>' +
      '<span class="nav-title"></span><span class="nav-right">' + (opts.rightHTML || '') + '</span></header>' +
      '<div class="page screen-body"></div></div>';
    $('#layers').appendChild(el);
    const scroller = $('.scroller', el);
    const api = {
      kind: 'screen', key: opts.key || null, el, scroller, body: $('.screen-body', el), refresh: null,
      setTitle(t) { $('.nav-title', el).textContent = t || ''; },
      focusEl() { const h = $('.d-title', el); if (h) { h.setAttribute('tabindex', '-1'); return h; } return $('.back', el); },
      close() {
        openScreens.delete(api);
        if (api.onClose) { try { api.onClose(); } catch (e) { /* */ } }
        el.classList.remove('in');
        prev.classList.remove('behind');
        const rm = () => { if (el.parentNode) el.remove(); };
        el.addEventListener('transitionend', rm, { once: true });
        setTimeout(rm, 700);
      },
    };
    $('.back', el).addEventListener('click', () => popLayer(api));
    scroller.addEventListener('scroll', () => updateNav(scroller, $('.navbar', el), $('.d-title', el)), { passive: true });
    edgeSwipe(el, api, prev);
    openScreens.add(api);
    pushLayer(api);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add('in'); prev.classList.add('behind'); }));
    return api;
  }

  function edgeSwipe(el, api, prev) {
    const edge = $('.edge', el);
    let x0 = 0; let t0 = 0; let dx = 0; let on = false; let w = 1;
    edge.addEventListener('pointerdown', (e) => {
      on = true; x0 = e.clientX; t0 = performance.now(); dx = 0; w = el.offsetWidth || 1;
      el.style.transition = 'none'; prev.style.transition = 'none';
      try { edge.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    });
    edge.addEventListener('pointermove', (e) => {
      if (!on) return;
      dx = Math.max(0, e.clientX - x0);
      el.style.transform = 'translateX(' + dx + 'px)';
      prev.style.transform = 'translateX(' + (-24 + (24 * dx) / w) + '%)';
    });
    const end = () => {
      if (!on) return;
      on = false;
      const v = dx / Math.max(1, performance.now() - t0);
      el.style.transition = ''; prev.style.transition = '';
      el.style.transform = ''; prev.style.transform = '';
      if (dx > w * 0.33 || (v > 0.45 && dx > 30)) popLayer(api);
    };
    edge.addEventListener('pointerup', end);
    edge.addEventListener('pointercancel', end);
  }

  function updateNav(scrollEl, nav, titleEl) {
    if (!nav) return;
    const y = scrollEl === window ? window.scrollY : scrollEl.scrollTop;
    nav.classList.toggle('scrolled', y > 4);
    let titled = y > 60;
    if (titleEl) titled = titleEl.getBoundingClientRect().bottom < nav.getBoundingClientRect().bottom;
    nav.classList.toggle('titled', titled);
  }

  // Hoja modal genérica. A la izquierda una ✕ para cerrar; a la derecha la acción principal.
  function openSheet(o) {
    const wrap = document.createElement('div');
    wrap.className = 'sheet-wrap' + (o.wide ? ' wide' : '');
    if (o.tint) wrap.dataset.tint = o.tint;
    if (o.z) wrap.style.zIndex = o.z;
    wrap.innerHTML =
      '<div class="scrim"></div>' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '" tabindex="-1">' +
      '<div class="sheet-head"><span class="grabber" aria-hidden="true"></span>' +
      '<span class="sh-left"><button type="button" class="glass-btn sh-x" data-sh="cancel" aria-label="' + esc(o.cancelLabel || 'Cancelar') + '">' + ic('xmark') + '</button></span>' +
      '<h2 class="sh-title">' + esc(o.title) + '</h2>' +
      '<span class="sh-right">' + (o.confirmLabel ? '<button type="button" class="cap filled" data-sh="ok">' + esc(o.confirmLabel) + '</button>' : '') + '</span></div>' +
      '<div class="sheet-progress" hidden><div class="progress"><i></i></div><span class="pl" role="status"></span></div>' +
      '<div class="sheet-body">' + (o.bodyHTML || '') + '</div></div>';
    document.body.appendChild(wrap);
    const sheet = $('.sheet', wrap);
    const okBtn = $('[data-sh="ok"]', wrap);
    let busy = false; let closing = false; let confirming = false;
    const api = {
      kind: 'sheet', el: wrap, body: $('.sheet-body', wrap),
      focusEl() { return sheet; },
      close() {
        closing = true;
        wrap.classList.add('closing');
        wrap.classList.remove('open');
        if (o.onClose) o.onClose();
        const rm = () => { if (wrap.parentNode) wrap.remove(); };
        sheet.addEventListener('transitionend', rm, { once: true });
        setTimeout(rm, 700);
      },
      dismiss() { if (!closing) popLayer(api); },
      onBack() { api.requestClose(); },
      requestClose() {
        if (busy || closing) return;
        if (o.isDirty && o.isDirty()) {
          actionSheet({
            title: o.discardTitle || '¿Descartar los cambios?',
            actions: [{ label: 'Descartar cambios', danger: true, onClick: () => api.dismiss() }],
            cancel: 'Seguir editando',
          });
        } else api.dismiss();
      },
      setTint(t) { wrap.dataset.tint = t; },
      setConfirm(enabled, label) {
        if (!okBtn) return;
        okBtn.disabled = !enabled;
        if (label) okBtn.textContent = label;
      },
      setBusy(b, label) {
        busy = b;
        api.body.classList.toggle('busy', b);
        $('[data-sh="cancel"]', wrap).disabled = b;
        if (okBtn) {
          okBtn.disabled = b;
          okBtn.innerHTML = b ? '<span class="spinner"></span>' : esc(o.confirmLabel);
        }
        api.progress(b ? null : undefined, label);
      },
      progress(p, label) {
        const box = $('.sheet-progress', wrap);
        if (p === undefined) { box.hidden = true; return; }
        box.hidden = false;
        const bar = $('.progress', box);
        bar.classList.toggle('indet', p === null);
        bar.style.setProperty('--p', p === null ? '0%' : Math.round(p * 100) + '%');
        $('.pl', box).textContent = label || '';
      },
    };
    $('[data-sh="cancel"]', wrap).addEventListener('click', () => api.requestClose());
    const openedAt = performance.now();
    $('.scrim', wrap).addEventListener('click', () => { if (performance.now() - openedAt > 450) api.requestClose(); });
    if (okBtn) {
      okBtn.addEventListener('click', async () => {
        if (busy || closing || confirming || okBtn.disabled || !o.onConfirm) return;
        confirming = true;
        try { await o.onConfirm(api); } finally { confirming = false; }
      });
    }
    // arrastrar hacia abajo para cerrar
    const head = $('.sheet-head', wrap);
    let y0 = 0; let t0 = 0; let dy = 0; let on = false;
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || busy) return;
      on = true; y0 = e.clientY; t0 = performance.now(); dy = 0;
      sheet.style.transition = 'none';
      try { head.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    });
    head.addEventListener('pointermove', (e) => {
      if (!on) return;
      dy = Math.max(0, e.clientY - y0);
      sheet.style.setProperty('--drag', dy + 'px');
    });
    const end = () => {
      if (!on) return;
      on = false;
      sheet.style.transition = '';
      const v = dy / Math.max(1, performance.now() - t0);
      sheet.style.setProperty('--drag', '0px');
      if (dy > 140 || (v > 0.6 && dy > 40)) api.requestClose();
    };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
    pushLayer(api);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
    return api;
  }

  function actionSheet(o) {
    const wrap = document.createElement('div');
    wrap.className = 'as-wrap';
    if (o.tint) wrap.dataset.tint = o.tint;
    const acts = o.actions || [];
    wrap.innerHTML =
      '<div class="scrim"></div><div class="as" role="dialog" aria-modal="true"' + (o.title ? ' aria-label="' + esc(o.title) + '"' : '') + '>' +
      '<div class="as-group">' + (o.title || o.message ? '<div class="as-title">' + (o.title ? '<b>' + esc(o.title) + '</b>' : '') + (o.message ? (o.title ? '<br>' : '') + esc(o.message) : '') + '</div>' : '') +
      acts.map((a, i) => {
        const inner = '<span class="as-row">' + (a.icon ? ic(a.icon) : '') + esc(a.label) + '</span>' + (a.sub ? '<small>' + esc(a.sub) + '</small>' : '');
        const cls = 'as-btn' + (a.danger ? ' danger' : '') + (a.bold ? ' bold' : '');
        return a.href
          ? '<a class="' + cls + '" href="' + esc(a.href) + '" target="_blank" rel="noopener noreferrer" data-i="' + i + '">' + inner + '</a>'
          : '<button type="button" class="' + cls + '" data-i="' + i + '">' + inner + '</button>';
      }).join('') +
      '</div><div class="as-group"><button type="button" class="as-btn bold" data-i="-1">' + esc(o.cancel || 'Cancelar') + '</button></div></div>';
    document.body.appendChild(wrap);
    let done = false;
    const api = {
      kind: 'action', el: wrap,
      focusEl() { return $('.as-btn', wrap); },
      close() {
        wrap.classList.remove('open');
        const rm = () => { if (wrap.parentNode) wrap.remove(); };
        $('.as', wrap).addEventListener('transitionend', rm, { once: true });
        setTimeout(rm, 600);
      },
    };
    const asOpenedAt = performance.now();
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (!b && !e.target.classList.contains('scrim')) return;
      if (!b && performance.now() - asOpenedAt < 450) return;
      if (done) return;
      done = true;
      popLayer(api);
      const i = b ? Number(b.dataset.i) : -1;
      haptic(6);
      if (i >= 0 && acts[i] && acts[i].onClick) acts[i].onClick(); // síncrono: mantiene el gesto para abrir la cámara
    });
    pushLayer(api);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
    return api;
  }

  function alertBox(title, message, button) {
    const wrap = document.createElement('div');
    wrap.className = 'alert-wrap';
    wrap.innerHTML = '<div class="scrim"></div><div class="alert" role="alertdialog" aria-modal="true" aria-label="' + esc(title) + '"><h3>' + esc(title) + '</h3><p>' + esc(message) + '</p><button type="button">' + esc(button || 'Entendido') + '</button></div>';
    document.body.appendChild(wrap);
    const api = {
      kind: 'alert', el: wrap,
      focusEl() { return $('button', wrap); },
      close() { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 320); },
    };
    $('button', wrap).addEventListener('click', () => popLayer(api));
    pushLayer(api);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  }

  // Aviso breve arriba. Con `action` muestra un botón (por ejemplo «Deshacer») durante 5 segundos.
  let toastTimer = 0;
  let toastDone = null;
  function toast(msg, icon, action) {
    const t = $('#toast');
    if (toastDone) { const f = toastDone; toastDone = null; f(); }
    t.innerHTML = ic(icon || 'check') + '<span>' + esc(msg) + '</span>' + (action ? '<button type="button" class="toast-act">' + esc(action.label) + '</button>' : '');
    t.classList.toggle('has-act', !!action);
    t.classList.add('show');
    clearTimeout(toastTimer);
    if (action) {
      let used = false;
      toastDone = () => { if (!used && action.onExpire) action.onExpire(); };
      $('.toast-act', t).addEventListener('click', () => {
        if (used) return;
        used = true; toastDone = null;
        t.classList.remove('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('has-act'), 500);
        action.onClick();
      });
    }
    toastTimer = setTimeout(() => {
      t.classList.remove('show', 'has-act');
      if (toastDone) { const f = toastDone; toastDone = null; f(); }
    }, action ? 5500 : 2800);
  }

  function friendlyError(e) {
    const code = e && e.code;
    const msg = e && e.message;
    if (msg === 'too-long') return 'El video es demasiado largo para guardarlo en la nube (máximo unos 3 minutos). Recórtalo y vuelve a intentarlo.';
    if (msg === 'transcode-unsupported' || msg === 'transcode-failed') return 'El video pesa más de 20 MB y este dispositivo no pudo reducirlo. Prueba con un clip más corto o grábalo en 720p.';
    if (e && e.name === 'QuotaExceededError') return 'Tu iPad no tiene espacio. Elimina videos que ya no uses.';
    switch (code) {
      case 'too_large': return 'El archivo supera 20 MB. Prueba con un clip más corto.';
      case 'unsupported_type': return 'Ese formato no es compatible. Usa un video MP4 o MOV, o una foto.';
      case 'quota_or_state':
      case 'quota_exceeded': return 'Se llenó el espacio disponible. Borra ejercicios o videos que ya no uses.';
      case 'rate_limited':
      case 'resource_exhausted': return 'Demasiadas acciones seguidas. Espera unos segundos y vuelve a intentarlo.';
      case 'not_granted':
      case 'upstream_auth':
      case 'invalid_argument': return 'No tienes permiso para guardar cambios en esta biblioteca.';
      default: return 'No se pudo guardar. Revisa tu conexión y vuelve a intentarlo.';
    }
  }
  const showError = (e, title) => alertBox(title || 'No se pudo guardar', friendlyError(e));

  // ---------------------------------------------------------------- medios
  let fileCb = null;
  function pickFile(mode, cb) {
    fileCb = cb;
    const inp = $(mode === 'capture' ? '#in-capture' : mode === 'import' ? '#in-import' : '#in-pick');
    inp.value = '';
    inp.click();
  }
  function onFileInput(e) {
    const f = e.target.files && e.target.files[0];
    const cb = fileCb;
    fileCb = null;
    if (f && cb) cb(f);
  }

  function hideOffscreen(el) {
    el.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(el);
  }
  function drawToBlob(src, w0, h0, maxSide, q, fillWhite) {
    const s = Math.min(1, maxSide / Math.max(w0 || 1, h0 || 1));
    const w = Math.max(1, Math.round(w0 * s));
    const h = Math.max(1, Math.round(h0 * s));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (fillWhite) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(src, 0, 0, w, h);
    return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', q));
  }
  function videoMeta(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      hideOffscreen(v);
      let done = false;
      const finish = (thumb) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        const out = {
          thumb,
          duration: isFinite(v.duration) ? v.duration : 0,
          aspect: v.videoWidth && v.videoHeight ? +(v.videoWidth / v.videoHeight).toFixed(4) : null,
        };
        try { v.pause(); } catch (e) { /* */ }
        v.removeAttribute('src'); v.load(); v.remove();
        URL.revokeObjectURL(url);
        resolve(out);
      };
      const timer = setTimeout(() => finish(null), 12000);
      v.addEventListener('error', () => finish(null), { once: true });
      v.addEventListener('loadedmetadata', async () => {
        try { await v.play(); v.pause(); } catch (e) { /* algunos navegadores no reproducen sin gesto */ }
        const d = isFinite(v.duration) ? v.duration : 2;
        const t = Math.min(1.2, Math.max(0.05, d * 0.15));
        v.addEventListener('seeked', () => {
          requestAnimationFrame(() => {
            if (!v.videoWidth) { finish(null); return; }
            drawToBlob(v, v.videoWidth, v.videoHeight, 800, 0.8).then(finish, () => finish(null));
          });
        }, { once: true });
        try { v.currentTime = t; } catch (e) { finish(null); }
      }, { once: true });
      v.src = url;
    });
  }
  function loadImg(file) {
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => res({ im, u });
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('image')); };
      im.src = u;
    });
  }
  async function processImage(file) {
    const r = await loadImg(file);
    try {
      const W = r.im.naturalWidth; const H = r.im.naturalHeight;
      const full = await drawToBlob(r.im, W, H, 2048, 0.86, true);
      const thumb = await drawToBlob(r.im, W, H, 800, 0.8, true);
      return { full, thumb, aspect: W && H ? +(W / H).toFixed(4) : null };
    } finally { URL.revokeObjectURL(r.u); }
  }
  async function processPicked(file) {
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    if (type.indexOf('video/') === 0 || /\.(mov|mp4|m4v|webm|3gp|mkv)$/.test(name)) {
      const m = await videoMeta(file);
      return { kind: 'video', file, size: file.size, thumbBlob: m.thumb, duration: m.duration, aspect: m.aspect, previewURL: URL.createObjectURL(file) };
    }
    if (type.indexOf('image/') === 0 || /\.(jpe?g|png|heic|heif|webp|gif)$/.test(name)) {
      const r = await processImage(file);
      return { kind: 'image', file: r.full, size: r.full.size, thumbBlob: r.thumb, aspect: r.aspect, previewURL: URL.createObjectURL(r.full) };
    }
    throw Object.assign(new Error('format'), { code: 'unsupported_type' });
  }

  function waitEvent(el, ev, ms) {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('transcode-failed')), ms);
      el.addEventListener(ev, () => { clearTimeout(t); res(); }, { once: true });
      el.addEventListener('error', () => { clearTimeout(t); rej(new Error('transcode-failed')); }, { once: true });
    });
  }
  // Reduce un video pesado volviéndolo a grabar en tiempo real (canvas + MediaRecorder).
  async function transcodeVideo(file, maxBytes, onProgress) {
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) throw new Error('transcode-unsupported');
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
    hideOffscreen(v);
    let actx = null; let raf = 0; let stream = null;
    const cleanup = () => {
      cancelAnimationFrame(raf);
      try { v.pause(); } catch (e) { /* */ }
      if (stream) stream.getTracks().forEach((t) => t.stop());
      v.removeAttribute('src'); v.load(); v.remove();
      URL.revokeObjectURL(url);
      if (actx) actx.close().catch(() => {});
    };
    try {
      const meta = waitEvent(v, 'loadedmetadata', 15000);
      v.src = url;
      await meta;
      const dur = v.duration;
      if (!isFinite(dur) || dur <= 0) throw new Error('transcode-failed');
      const aBps = 64000;
      const vBps = Math.min(2500000, Math.floor((maxBytes * 8 * 0.88) / dur - aBps));
      if (vBps < 300000) throw new Error('too-long');
      const side = vBps > 1500000 ? 1280 : vBps > 800000 ? 960 : 720;
      const s = Math.min(1, side / Math.max(v.videoWidth, v.videoHeight));
      const w = Math.max(2, Math.round((v.videoWidth * s) / 2) * 2);
      const h = Math.max(2, Math.round((v.videoHeight * s) / 2) * 2);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      stream = canvas.captureStream(30);
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC();
        const src = actx.createMediaElementSource(v);
        const dest = actx.createMediaStreamDestination();
        src.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        if (actx.state === 'suspended') await actx.resume().catch(() => {});
      } catch (e) { v.muted = true; }
      const types = ['video/mp4;codecs=avc1.42E01F,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mime = types.find((t) => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } });
      if (!mime) throw new Error('transcode-unsupported');
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: vBps, audioBitsPerSecond: aBps });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((r) => { rec.onstop = r; });
      const ended = new Promise((res, rej) => { v.onended = res; v.onerror = () => rej(new Error('transcode-failed')); });
      const draw = () => {
        ctx.drawImage(v, 0, 0, w, h);
        if (onProgress) onProgress(Math.min(1, v.currentTime / dur));
        if (!v.ended && !v.paused) raf = requestAnimationFrame(draw);
      };
      v.onplay = () => { cancelAnimationFrame(raf); draw(); };
      try { await v.play(); } catch (e) { v.muted = true; await v.play(); }
      rec.start(1000);
      draw();
      await ended;
      ctx.drawImage(v, 0, 0, w, h);
      rec.stop();
      await stopped;
      const type = ((rec.mimeType || mime).split(';')[0]) || 'video/webm';
      const blob = new Blob(chunks, { type });
      if (!blob.size) throw new Error('transcode-failed');
      if (blob.size > maxBytes) throw new Error('too-long');
      return blob;
    } finally { cleanup(); }
  }
  async function prepareCloudVideo(file, onProgress) {
    let type = (file.type || '').split(';')[0].toLowerCase();
    if (!type) type = /\.webm$/i.test(file.name || '') ? 'video/webm' : 'video/mp4';
    const mp4Like = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/3gpp', 'video/3gpp2'].indexOf(type) >= 0;
    const ok = mp4Like ? 'video/mp4' : type === 'video/webm' ? 'video/webm' : null;
    if (ok && file.size <= CLOUD_LIMIT) return { blob: file, type: ok };
    const blob = await transcodeVideo(file, CLOUD_LIMIT, onProgress);
    return { blob, type: blob.type.split(';')[0] };
  }

  // Carga perezosa de imágenes y videos guardados
  async function hydrate(root) {
    const els = $$('[data-media],[data-poster]', root);
    for (const el of els) {
      const id = el.getAttribute('data-media');
      const pid = el.getAttribute('data-poster');
      el.removeAttribute('data-media');
      el.removeAttribute('data-poster');
      if (pid) { const pu = await S.backend.mediaURL(pid).catch(() => null); if (pu) el.poster = pu; }
      if (id) {
        const u = await S.backend.mediaURL(id).catch(() => null);
        if (u) el.src = u; else markMissing(el);
      }
    }
  }
  function markMissing(el) {
    const box = el.closest('.thumb, .mini');
    if (box && !$('.art', box)) {
      const sport = (el.closest('[data-tint]') || {}).dataset ? el.closest('[data-tint]').dataset.tint : 'futbol';
      el.insertAdjacentHTML('afterend', '<span class="art">' + fieldArt(sport) + '</span>');
      el.remove();
    }
  }
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.closest && t.closest('.thumb, .mini')) markMissing(t);
  }, true);

  function srcAttr(id) {
    const u = S.backend ? S.backend.cachedURL(id) : null;
    return u ? 'src="' + esc(u) + '"' : 'data-media="' + esc(id) + '"';
  }
  function thumbHTML(ex, cls) {
    const inner = ex.thumbId ? '<img alt="" loading="lazy" decoding="async" ' + srcAttr(ex.thumbId) + '>'
      : !ex.mediaId && ex.thumbUrl ? '<img alt="" loading="lazy" decoding="async" src="' + esc(ex.thumbUrl) + '">'
        : '<span class="art">' + (hasDiagram(ex) ? boardSVG(ex.sport, ex.diagram, { crop: true }) : fieldArt(ex.sport)) + '</span>';
    let badge = '';
    if (cls !== 'mini') {
      if (ex.mediaType === 'video') badge = '<span class="badge vid' + (ex.mediaDuration ? ' dur' : '') + '">' + ic('play') + (ex.mediaDuration ? fmtClock(ex.mediaDuration) : '') + '<span class="sr">Con video</span></span>';
      else if (!ex.mediaId && ex.videoUrl) badge = '<span class="badge vid">' + ic('play') + '<span class="sr">Con video</span></span>';
      else if (ex.mediaType === 'image') badge = '<span class="badge vid">' + ic('photo') + '<span class="sr">Con foto</span></span>';
    }
    const extra = cls === 'mini' ? '' : (ex.favorite ? '<span class="fav" aria-label="Favorito">' + ic('heart-fill') + '</span>' : '');
    return '<span class="' + (cls || 'thumb') + '" data-tint="' + esc(ex.sport) + '">' + inner + badge + extra + '</span>';
  }

  // ---------------------------------------------------------------- pantallas raíz
  const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
  const isAppleMobile = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const hasOwnData = () => S.exercises.some((e) => !e.example) || S.classes.some((c) => !c.example) || S.groups.some((g) => !g.example);
  function needsBackup() {
    if (!S.backend || S.backend.kind !== 'local' || !S.canWrite || !hasOwnData()) return false;
    const last = Number(pref.get('last-backup')) || 0;
    const oldest = Math.min.apply(null, S.exercises.concat(S.classes, S.groups).filter((x) => !x.example).map((x) => Number(x.createdAt) || Date.now()));
    if (!last) return Date.now() - oldest > 7 * 864e5;
    return Date.now() - last > 30 * 864e5;
  }
  function fmtAgo(ts) {
    const d = Math.floor((Date.now() - ts) / 864e5);
    if (d <= 0) return 'hoy';
    if (d === 1) return 'ayer';
    return 'hace ' + d + ' días';
  }

  function buildShell() {
    const app = $('#app');
    document.documentElement.lang = document.documentElement.lang || 'es';
    const title = { clases: 'Clases', ejercicios: 'Ejercicios', grupos: 'Grupos' };
    app.innerHTML =
      '<main id="main" class="main">' +
      TABS.map((t) => '<section class="screen" id="screen-' + t + '" data-tab="' + t + '" aria-labelledby="h-' + t + '"></section>').join('') +
      '</main>' +
      '<div class="dock" id="dock"><nav class="tabbar" role="tablist" aria-label="Secciones"><span class="tab-lens" aria-hidden="true"></span>' +
      TABS.map((t) => '<button class="tab" role="tab" id="tab-' + t + '" data-tab="' + t + '" aria-selected="false" aria-controls="screen-' + t + '">' + ic(TAB_META[t].icon) + '<span>' + TAB_META[t].label + '</span></button>').join('') +
      '</nav><button class="fab" id="fab" aria-label="Nueva clase">' + ic('plus') + '</button></div>' +
      '<div id="layers"></div>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>' +
      '<input class="sr" type="file" id="in-capture" accept="video/*" capture="environment" tabindex="-1" aria-hidden="true">' +
      '<input class="sr" type="file" id="in-pick" accept="video/*,image/*" tabindex="-1" aria-hidden="true">' +
      '<input class="sr" type="file" id="in-import" accept=".zip,.json,application/zip,application/json" tabindex="-1" aria-hidden="true">';
    TABS.forEach((t) => {
      $('#screen-' + t).innerHTML =
        '<header class="navbar"><span class="nav-left"><button class="glass-btn" data-act="settings" aria-label="Ajustes">' + ic('gear') + '</button></span><span class="nav-title">' + title[t] + '</span>' +
        '<span class="nav-right"><button class="glass-btn cap backup-btn" data-act="backup">Respaldo</button></span></header>' +
        '<div class="page">' +
        '<h1 class="large-title" id="h-' + t + '">' + title[t] + '</h1>' +
        '<p class="subtitle" data-ref="count">&nbsp;</p>' +
        (t === 'ejercicios'
          ? segHTML('sport', [['futbol', 'Fútbol'], ['basquet', 'Básquetbol']], S.sport) +
            '<div class="search-row"><label class="search">' + ic('search') + '<input type="search" id="q-ejercicios" placeholder="Buscar por nombre, material, edad…" autocomplete="off" enterkeyhint="search" aria-label="Buscar ejercicios"></label>' +
            '<button class="filter-btn" data-act="filters" aria-label="Filtros">' + ic('sliders') + '<b data-ref="fcount"></b></button></div>' +
            '<div class="chips active-filters" data-ref="afilters" aria-label="Filtros activos"></div>' +
            '<div class="chips" data-ref="chips" role="toolbar" aria-label="Filtrar por objetivo"></div>'
          : '') +
        '<div data-ref="note"></div><div data-ref="body"></div></div>';
    });
  }

  function ref(tab, name) { return $('#screen-' + tab + ' [data-ref="' + name + '"]'); }

  function noteHTML(tab) {
    const out = [];
    const k = S.backend ? S.backend.kind : '';
    if (k === 'memory') out.push('<div class="note warn">' + ic('warn') + '<span class="txt"><b>No se está guardando.</b> Lo que hagas se perderá al cerrar Cancha.</span></div>');
    if (S.stale) out.push('<div class="note">' + ic('warn') + '<span class="txt"><b>Sin conexión.</b> Puede que lo que ves no esté al día.</span></div>');
    if (S.error) out.push('<div class="note">' + ic('warn') + '<span class="txt"><b>No se pudieron cargar tus datos.</b> Vuelve a abrir la app en un momento.</span></div>');
    if (S.ready && !S.canWrite) out.push('<div class="note">' + ic('lock') + '<span class="txt"><b>Solo lectura.</b> Puedes ver esta biblioteca, pero solo su dueño puede editarla.</span></div>');
    if (S.ready && tab === 'clases' && k === 'local' && !framed && isAppleMobile() && !isStandalone()) {
      out.push('<div class="note">' + ic('device') + '<span class="txt"><b>Instala Cancha</b> en tu pantalla de inicio para que Safari no borre tus datos.</span><button class="link" data-act="install-help">Ver cómo</button></div>');
    }
    if (S.ready && tab === 'clases' && needsBackup()) {
      const last = Number(pref.get('last-backup')) || 0;
      out.push('<div class="note">' + ic('box') + '<span class="txt"><b>Haz un respaldo.</b> ' + (last ? 'El último fue ' + fmtAgo(last) + '.' : 'Tus datos solo están en este iPad.') + '</span><button class="link" data-act="backup-now">Respaldar</button></div>');
    }
    return out.join('');
  }
  function examplesNoteHTML() {
    const hasEx = S.classes.some((c) => c.example) || S.exercises.some((e) => e.example) || S.groups.some((g) => g.example) || S.sections.some((x) => x.example);
    return S.ready && S.canWrite && hasEx ? '<div class="note quiet ex-note"><span class="txt">Los ejemplos te muestran cómo funciona Cancha.</span><button class="link" data-act="clear-examples">Eliminar ejemplos</button></div>' : '';
  }

  // --- Ejercicios
  function renderEjercicios() {
    const sport = S.sport;
    const all = exOf(sport);
    const favs = all.filter((e) => e.favorite).length;
    ref('ejercicios', 'count').textContent = S.ready ? (all.length ? plural(all.length, 'ejercicio', 'ejercicios') + ' de ' + SPORTS[sport].noun : 'Sin ejercicios de ' + SPORTS[sport].noun) : 'Cargando…';
    const sp = SPORTS[sport];
    const used = sp.tags.filter((t) => all.some((e) => e.objective === t));
    const extra = Array.from(new Set(all.map((e) => e.objective).filter((o) => o && sp.tags.indexOf(o) < 0)));
    const me = S.backend && S.backend.me;
    const authors = new Set(all.map((e) => e.authorId || ''));
    const showMine = me && authors.size > 1 && authors.has(me);
    const chips = [['all', 'Todos']].concat(showMine ? [['mine', 'Míos']] : [], favs ? [['fav', 'Favoritos']] : [], used.concat(extra).map((t) => ['t:' + t, t]));
    const fk = S.f[sport];
    if (!chips.some((c) => c[0] === fk)) S.f[sport] = 'all';
    const chipsHTML = all.length > 1 ? chips.map((c) => '<button class="chip" data-chip="' + esc(c[0]) + '" aria-pressed="' + (c[0] === S.f[sport]) + '">' + (c[0] === 'fav' ? ic('heart-fill') : '') + esc(c[1]) + '</button>').join('') : '';
    let list = all;
    const f = S.f[sport];
    if (f === 'fav') list = list.filter((e) => e.favorite);
    else if (f === 'mine') list = list.filter((e) => e.authorId === me);
    else if (f.indexOf('t:') === 0) list = list.filter((e) => e.objective === f.slice(2));
    const q = norm(S.q[sport]).trim();
    if (q) list = list.filter((e) => norm([e.title, e.objective, e.description, e.keyPoints, e.material, e.level, e.age, e.players, e.space, e.variations, sectionsOf(e.id).map((x) => x.name).join(' ')].join(' ')).indexOf(q) >= 0);
    list = applyFilters(list, sport);
    const nf = activeFilterCount(sport) + (fx(sport).sort !== 'recent' ? 1 : 0);
    const plain0 = f === 'all' && !q && !nf;

    let body;
    if (!S.ready) body = '<div class="grid">' + [0, 1, 2, 3].map(() => '<div class="card"><span class="thumb shimmer"></span><span class="sk-line w60 shimmer"></span><span class="sk-line w40 shimmer"></span></div>').join('') + '</div>';
    else if (!all.length) body = emptyExercisesHTML(sport);
    else if (!list.length) body = '<p class="no-results">' + (q ? 'Nada coincide con «' + esc(S.q[sport]) + '» en tus ejercicios.' : 'No hay ejercicios con estos filtros.') + (nf ? '<br><button class="link" data-act="clear-filters">Quitar filtros</button>' : '') + '</p>';
    else body = (plain0 ? sectionsStripHTML() + catEntryHTML(sport) : '<p class="result-count">' + plural(list.length, 'ejercicio', 'ejercicios') + (q ? ' tuyos' : '') + '</p>') + '<div class="grid">' + list.map(cardHTML).join('') + '</div>';
    if (q && S.ready) {
      const recs = applyFilters(catExercises(sport).filter((cx) => !inLibrary(cx.id) && norm([cx.title, cx.objective, cx.description, cx.keyPoints, cx.material, cx.variations, cx.age].join(' ')).indexOf(q) >= 0), sport);
      if (recs.length) body += '<p class="group-label">Recomendados</p><div class="grid">' + recs.map(catCardHTML).join('') + '</div>';
      else if (!list.length) body += catEntryHTML(sport);
    }
    const afHTML = activeFiltersHTML(sport);

    const sig = ['ej', sport, S.ready, S.canWrite, chipsHTML, afHTML, body, noteHTML('ejercicios')].join('|');
    if (S.sig.ejercicios === sig) return;
    S.sig.ejercicios = sig;
    $('#screen-ejercicios .search').hidden = S.ready && !all.length;
    const chipsEl = ref('ejercicios', 'chips');
    if (chipsEl.innerHTML !== chipsHTML) chipsEl.innerHTML = chipsHTML;
    ref('ejercicios', 'afilters').innerHTML = afHTML;
    const fc = ref('ejercicios', 'fcount');
    fc.textContent = activeFilterCount(sport) ? String(activeFilterCount(sport)) : '';
    fc.closest('.filter-btn').classList.toggle('on', activeFilterCount(sport) > 0);
    ref('ejercicios', 'note').innerHTML = noteHTML('ejercicios');
    const b = ref('ejercicios', 'body');
    b.innerHTML = body;
    if (S.backend) hydrate(b);
  }

  function cardHTML(ex) {
    const meta = [ex.objective, ex.duration ? ex.duration + ' min' : null].filter(Boolean).join(' · ');
    return '<button class="card" data-open-ex="' + esc(ex.id) + '">' + thumbHTML(ex) +
      '<span class="card-body"><span class="title">' + esc(ex.title || 'Sin título') + '</span>' +
      (meta ? '<span class="meta">' + esc(meta) + '</span>' : '') + '</span></button>';
  }

  function emptyExercisesHTML(sport) {
    return '<div class="empty"><div class="empty-art"><span class="art">' + fieldArt(sport) + '</span></div>' +
      '<h2>Aún no tienes ejercicios de ' + SPORTS[sport].noun + '</h2>' +
      '<p>' + (S.canWrite ? 'Agrega uno con video, foto o un dibujo en el pizarrón.' : 'Todavía no hay ejercicios aquí.') + '</p>' +
      (S.canWrite ? '<div class="actions">' + (catExercises(sport).length ? '<button class="btn filled" data-act="catalog">Ver ' + catExercises(sport).length + ' recomendados</button><button class="btn tinted" data-act="new-ex">' + ic('plus') + 'Nuevo ejercicio</button>' : '<button class="btn filled" data-act="new-ex">' + ic('plus') + 'Nuevo ejercicio</button>') + '</div>' : '') + '</div>';
  }

  // --- Clases
  function todayCardHTML(c) {
    const g = getGroup(c.groupId);
    const n = (c.items || []).filter((it) => !isPause(it)).length;
    const isToday = c.date === todayStr();
    const canRoll = S.canWrite && isToday && g && studentsOf(g).length;
    const sp = SPORTS[c.sport] ? c.sport : 'futbol';
    return '<div class="today" data-tint="' + sp + '">' +
      '<button class="today-main" data-open-class="' + esc(c.id) + '"><span class="today-band band-' + sp + '"><span class="today-when">' + (isToday ? 'Hoy' : esc(fmtDay(c.date))) + '</span>' + (n ? '<span class="today-min">' + fmtMin(classTotal(c)) + '′</span>' : '') + '</span>' +
      '<span class="today-body"><span class="today-name">' + esc(c.name || 'Clase sin nombre') + '</span>' +
      '<span class="today-meta">' + (g ? '<span class="mini-chip">' + ic('people') + esc(g.name) + '</span>' : '') + '<span>' + plural(n, 'ejercicio', 'ejercicios') + '</span></span></span></button>' +
      '<div class="today-actions">' +
      (n ? '<button class="btn filled" data-act="start-class" data-id="' + esc(c.id) + '">' + ic('play') + 'Iniciar</button>' : S.canWrite ? '<button class="btn filled" data-act="plan-class" data-id="' + esc(c.id) + '">' + ic('plus') + 'Agregar ejercicios</button>' : '') +
      (canRoll ? '<button class="btn tinted" data-act="roll-class" data-id="' + esc(c.id) + '">' + ic('check') + 'Pasar lista</button>' : '') +
      '</div></div>';
  }
  function renderClases() {
    const list = S.classes.slice().sort(byUpcoming);
    const t = todayStr();
    const todays = list.filter((c) => c.date === t).sort((a, b) => ((b.items || []).length ? 1 : 0) - ((a.items || []).length ? 1 : 0));
    // Arriba va la próxima clase que tiene plan (hoy o en los próximos 7 días); si no hay, la de hoy.
    const hasPlan = (c) => (c.items || []).some((it) => it.exId && getEx(it.exId));
    const soon = list.filter((c) => c.date && c.date > t && c.date <= addDays(7));
    const next = todays.find(hasPlan) || soon.find(hasPlan) || todays[0] || soon[0];
    ref('clases', 'count').textContent = longDate(t);
    let body;
    if (!S.ready) body = '<div class="list">' + [0, 1, 2].map(() => '<div class="cell"><span class="date-tile shimmer"></span><span class="txt"><span class="sk-line w60 shimmer"></span><span class="sk-line w40 shimmer"></span></span></div>').join('') + '</div>';
    else if (!list.length) {
      body = '<div class="empty"><div class="empty-art"><span class="art">' + fieldArt('futbol') + '</span></div><h2>Arma tu primera clase</h2>' +
        '<p>Elige ejercicios, ordénalos y ajusta los minutos. Luego la das con el cronómetro.</p>' +
        (S.canWrite ? '<div class="actions"><button class="btn filled" data-act="new-class">' + ic('plus') + 'Nueva clase</button>' + (CAT() ? '<button class="btn tinted" data-act="catalog">Usar una clase lista</button>' : '') + '</div>' : '') + '</div>';
    } else {
      const rest = list.filter((c) => c !== next);
      const up = rest.filter((c) => !c.date || c.date >= t);
      const past = rest.filter((c) => c.date && c.date < t);
      body = (next ? todayCardHTML(next) : '');
      if (up.length) body += '<p class="group-label">Próximas</p><div class="list">' + up.map((c) => classCellHTML(c)).join('') + '</div>';
      if (past.length) body += '<p class="group-label">Anteriores</p><div class="list">' + past.map((c) => classCellHTML(c)).join('') + '</div>';
    }
    if (S.ready && S.canWrite) body += templatesHTML();
    body += examplesNoteHTML();
    const sig = ['cl', S.ready, S.canWrite, body, noteHTML('clases')].join('|');
    if (S.sig.clases === sig) return;
    S.sig.clases = sig;
    ref('clases', 'note').innerHTML = noteHTML('clases');
    ref('clases', 'body').innerHTML = body;
  }

  function dateTileHTML(date) {
    const d = parseDay(date);
    if (!d) return '<span class="date-tile" aria-hidden="true">' + ic('calendar') + '</span>';
    return '<span class="date-tile" aria-hidden="true"><span class="dm">' + MONTHS[d.getMonth()] + '</span><span class="dd">' + d.getDate() + '</span></span>';
  }
  function classCellHTML(c, inGroup) {
    const n = (c.items || []).filter((it) => !isPause(it)).length;
    const sport = SPORTS[c.sport] ? c.sport : 'futbol';
    const g = getGroup(c.groupId);
    const first = inGroup || !g ? SPORTS[sport].name : g.name;
    const done = c.lastRunAt || c.attendanceAt;
    return '<button class="cell" data-open-class="' + esc(c.id) + '" data-tint="' + sport + '">' + dateTileHTML(c.date) +
      '<span class="txt"><span class="t1">' + esc(c.name || 'Clase sin nombre') + (c.date === todayStr() ? '<span class="pill">Hoy</span>' : '') + '</span>' +
      '<span class="t2">' + (inGroup ? '' : esc(first) + ', ') + plural(n, 'ejercicio', 'ejercicios') + ', ' + fmtMin(classTotal(c)) + ' min</span></span>' +
      (done ? '<span class="done-mark" title="Dada" aria-label="Dada">' + ic('check') + '</span>' : '') + ic('chevR', 'chev') + '</button>';
  }

  // --- Grupos
  function renderGroups() {
    const list = S.groups.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
    ref('grupos', 'count').textContent = S.ready && list.length ? list.reduce((n, g) => n + studentsOf(g).length, 0) + ' alumnos en ' + plural(list.length, 'grupo', 'grupos') : '';
    let body;
    if (!S.ready) body = '<div class="list">' + [0, 1].map(() => '<div class="cell"><span class="icon-sq shimmer"></span><span class="txt"><span class="sk-line w60 shimmer"></span><span class="sk-line w40 shimmer"></span></span></div>').join('') + '</div>';
    else if (!list.length) {
      body = '<div class="empty"><div class="empty-art"><span class="art">' + fieldArt('basquet') + '</span></div><h2>Agrega tus grupos</h2>' +
        '<p>Un grupo por equipo o salón: ahí pasas lista y ves su historial.</p>' +
        (S.canWrite ? '<div class="actions"><button class="btn filled" data-act="new-group">' + ic('plus') + 'Nuevo grupo</button></div>' : '') + '</div>';
    } else body = '<div class="g-grid">' + list.map(groupCellHTML).join('') + '</div>';
    const sig = ['gr', S.ready, S.canWrite, body, noteHTML('grupos')].join('|');
    if (S.sig.grupos === sig) return;
    S.sig.grupos = sig;
    ref('grupos', 'note').innerHTML = noteHTML('grupos');
    ref('grupos', 'body').innerHTML = body;
  }

  function renderAll() {
    renderClases();
    renderEjercicios();
    renderGroups();
    document.documentElement.classList.toggle('readonly', !!S.backend && !S.canWrite);
  }
  function refreshScreens() { openScreens.forEach((s) => { if (s.refresh) s.refresh(); }); }

  const tabTint = (t) => (t === 'ejercicios' ? S.sport : 'clases');
  function setTab(t, initial) {
    if (TABS.indexOf(t) < 0) t = 'clases';
    if (!initial && t === S.tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (!initial) S.scroll[S.tab] = window.scrollY;
    S.tab = t;
    document.documentElement.dataset.tint = tabTint(t);
    $$('.screen').forEach((s) => s.classList.toggle('active', s.dataset.tab === t));
    $$('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    $('.tabbar').style.setProperty('--i', TABS.indexOf(t));
    $('#fab').setAttribute('aria-label', t === 'clases' ? 'Nueva clase' : t === 'grupos' ? 'Nuevo grupo' : 'Nuevo ejercicio');
    window.scrollTo(0, S.scroll[t] || 0);
    onWindowScroll();
    pref.set('tab', t);
    if (location.hash !== '#' + t) { try { history.replaceState(history.state, '', '#' + t); } catch (e) { /* hash no disponible */ } }
  }
  function setSport(sport) {
    S.sport = sport === 'basquet' ? 'basquet' : 'futbol';
    pref.set('sport', S.sport);
    $('#screen-ejercicios').dataset.tint = S.sport;
    if (S.tab === 'ejercicios') document.documentElement.dataset.tint = S.sport;
    const q = $('#q-ejercicios');
    if (q) q.value = S.q[S.sport] || '';
    renderEjercicios();
  }
  function onWindowScroll() {
    const scr = $('#screen-' + S.tab);
    if (!scr) return;
    updateNav(window, $('.navbar', scr), $('.large-title', scr));
    document.documentElement.classList.toggle('scrolled', window.scrollY > 4);
  }

  function showStatus() {
    const k = S.backend ? S.backend.kind : 'cloud';
    if (S.backend && !S.canWrite) return alertBox('Solo lectura', 'Estás viendo una biblioteca compartida. Solo su dueño puede agregar o cambiar ejercicios.');
    if (k === 'cloud') return alertBox('Dónde se guardan tus datos', 'En tu cuenta de Claude. Los ves en el celular y en la computadora.');
    if (k === 'memory') return alertBox('No se está guardando', 'Este navegador no deja guardar datos (por ejemplo, en modo privado). Lo que agregues se perderá al cerrar.');
    return alertBox('Dónde se guardan tus datos', 'Solo en este iPad, no en internet. Si el iPad se pierde o se borra, solo los recuperas con un respaldo. Haz uno de vez en cuando.');
  }
  function showInstallHelp() {
    alertBox('Instalar Cancha', 'En Safari toca el botón Compartir (el cuadrito con la flecha) y elige «Agregar a pantalla de inicio». Abre Cancha siempre desde ese ícono: ahí tus datos quedan guardados.');
  }

  // ---------------------------------------------------------------- flujos: ejercicios
  function segHTML(name, options, current, label) {
    const i = Math.max(0, options.findIndex((o) => o[0] === current));
    return '<div class="seg" data-seg="' + name + '" role="radiogroup"' + (label ? ' aria-label="' + esc(label) + '"' : '') + ' style="--n:' + options.length + ';--i:' + i + '"><span class="seg-ind" aria-hidden="true"></span>' +
      options.map((o) => '<button type="button" role="radio" aria-checked="' + (o[0] === current) + '" data-val="' + esc(o[0]) + '">' + esc(o[1]) + '</button>').join('') + '</div>';
  }
  function bindSeg(root, name, onChange) {
    const seg = $('[data-seg="' + name + '"]', root);
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-val]');
      if (!b) return;
      const btns = $$('button[data-val]', seg);
      btns.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      seg.style.setProperty('--i', btns.indexOf(b));
      haptic(5);
      onChange(b.dataset.val);
    });
    seg.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const btns = $$('button[data-val]', seg);
      const i = btns.findIndex((x) => x.getAttribute('aria-checked') === 'true');
      const n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
      e.preventDefault(); n.focus(); n.click();
    });
  }
  function stepperHTML(id, value, small, label) {
    return '<span class="stepper' + (small ? ' sm' : '') + '"><button type="button" class="st-btn" data-step="-1" aria-label="Menos">' + ic('minus') + '</button>' +
      '<span class="st-val"><input id="' + id + '" type="number" inputmode="numeric" min="1" max="240" value="' + (Number(value) || 10) + '" aria-label="' + esc(label || 'Minutos') + '"><span class="st-unit">min</span></span>' +
      '<button type="button" class="st-btn" data-step="1" aria-label="Más">' + ic('plus') + '</button></span>';
  }
  function stepValue(v, dir) {
    v = Math.round(Number(v) || 0);
    if (dir > 0) return Math.min(240, v < 5 ? v + 1 : Math.floor(v / 5) * 5 + 5);
    return Math.max(1, v <= 5 ? v - 1 : Math.ceil(v / 5) * 5 - 5);
  }
  function autoGrow(ta) { ta.style.height = 'auto'; ta.style.height = Math.max(88, ta.scrollHeight) + 'px'; }

  // Guarda primero y, si falla, regresa la pantalla a como estaba.
  const SAVE = { exercises: 'saveExercise', classes: 'saveClass', groups: 'saveGroup', sections: 'saveSection' };
  async function commit(kind, obj, prev) {
    replaceLocal(kind, obj);
    renderAll(); refreshScreens();
    try {
      await S.backend[SAVE[kind]](obj);
      return true;
    } catch (e) {
      if (prev) replaceLocal(kind, prev); else S[kind] = S[kind].filter((x) => x.id !== obj.id);
      renderAll(); refreshScreens();
      showError(e);
      return false;
    }
  }
  function mutateExercise(id, fn) {
    const cur = getEx(id);
    if (!cur) return Promise.resolve(false);
    const x = plain(cur);
    fn(x);
    x.example = false;
    x.updatedAt = Date.now();
    return commit('exercises', x, cur);
  }
  function mutateClass(id, fn) {
    const cur = getClass(id);
    if (!cur) return Promise.resolve(false);
    const c = plain(cur);
    c.items = c.items || [];
    fn(c);
    c.example = false;
    c.updatedAt = Date.now();
    return commit('classes', c, cur);
  }

  function openExerciseEditor(opts) {
    const editing = !!opts.exercise;
    const ex = editing ? plain(opts.exercise) : {
      id: uid(), sport: opts.sport || S.sport || 'futbol', title: '', objective: '', level: 'Inicial', duration: 10,
      players: '', age: '', space: '', material: '', description: '', keyPoints: '', favorite: false,
      mediaType: null, mediaId: null, thumbId: null, mediaDuration: 0, mediaAspect: null, createdAt: Date.now(),
    };
    let media = null;
    let removeMedia = false;
    let dirty = false;
    let diagram = ex.diagram ? plain(ex.diagram) : null;
    let diagramChanged = false;
    const moreOpen = !!(ex.players || ex.age || ex.space || ex.material || ex.variations || (ex.level && ex.level !== 'Inicial'));
    const row = (id, icon, label, ph, max, val) => '<label class="row"><span class="k">' + ic(icon) + label + '</span><input id="' + id + '" placeholder="' + esc(ph) + '" maxlength="' + max + '" value="' + esc(val || '') + '" aria-label="' + esc(label) + '"></label>';
    const body =
      '<div class="group"><input class="field-lg" id="ex-title" placeholder="Nombre del ejercicio" aria-label="Nombre del ejercicio" maxlength="120" autocomplete="off" enterkeyhint="done" value="' + esc(ex.title) + '"></div>' +
      '<p class="group-label" id="lbl-obj">Objetivo</p><div class="group pad"><div class="chips wrap" data-ref="tags" role="group" aria-labelledby="lbl-obj"></div></div>' +
      '<div data-ref="media"></div>' +
      '<div class="group"><div class="row"><span class="k">' + ic('clock') + 'Duración</span>' + stepperHTML('ex-duration', ex.duration || 10, false, 'Duración en minutos') + '</div></div>' +
      '<p class="group-label" id="lbl-desc">Cómo se hace</p><div class="group"><textarea id="ex-desc" aria-labelledby="lbl-desc" placeholder="Organización, reglas, series…" maxlength="4000">' + esc(ex.description) + '</textarea></div>' +
      '<p class="group-label" id="lbl-pts">Puntos clave</p><div class="group"><textarea id="ex-points" aria-labelledby="lbl-pts" placeholder="Uno por línea" maxlength="2000">' + esc(ex.keyPoints) + '</textarea></div>' +
      '<div class="group"><label class="row"><span class="k">' + ic('video') + 'YouTube</span><input id="ex-link" type="url" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Pega el link aquí" aria-label="Link de video de YouTube" maxlength="400" value="' + esc(ex.link || '') + '"></label></div>' +
      '<button type="button" class="more-btn" data-more aria-expanded="' + moreOpen + '">Más detalles' + ic('down') + '</button>' +
      '<div data-ref="more"' + (moreOpen ? '' : ' hidden') + '>' +
      '<p class="group-label">Deporte</p>' + segHTML('sport', [['futbol', 'Fútbol'], ['basquet', 'Básquetbol']], ex.sport, 'Deporte') +
      '<p class="group-label">Nivel</p>' + segHTML('level', LEVELS.map((l) => [l, l]), ex.level || 'Inicial', 'Nivel') +
      '<div class="group">' +
      row('ex-players', 'people', 'Jugadores', 'Ej. 8 a 12', 60, ex.players) +
      row('ex-age', 'age', 'Edad', 'Ej. Sub-10 a Sub-12', 60, ex.age) +
      row('ex-space', 'flag', 'Espacio', 'Ej. 20 × 15 m', 60, ex.space) +
      row('ex-material', 'cone', 'Material', 'Conos, balones…', 200, ex.material) +
      '</div>' +
      '<p class="group-label" id="lbl-var">Variantes (más fácil / más difícil)</p><div class="group"><textarea id="ex-vars" aria-labelledby="lbl-var" placeholder="Más fácil: …&#10;Más difícil: …" maxlength="1500">' + esc(ex.variations || '') + '</textarea></div>' +
      '</div>';

    const sheet = openSheet({
      title: editing ? 'Editar ejercicio' : 'Nuevo ejercicio',
      tint: ex.sport,
      confirmLabel: 'Guardar',
      bodyHTML: body,
      isDirty: () => dirty || !!media || removeMedia || diagramChanged,
      onConfirm: save,
      onClose: () => { if (media && media.previewURL) URL.revokeObjectURL(media.previewURL); },
    });
    const root = sheet.body;

    function renderTags() {
      const tags = SPORTS[ex.sport].tags.slice();
      if (ex.objective && tags.indexOf(ex.objective) < 0) tags.push(ex.objective);
      $('[data-ref="tags"]', root).innerHTML = tags.map((t) => '<button type="button" class="chip" aria-pressed="' + (t === ex.objective) + '" data-tag="' + esc(t) + '">' + esc(t) + '</button>').join('');
    }
    function mediaCaption(kind, size, duration) {
      const parts = [kind === 'video' ? 'Video' : 'Foto'];
      if (kind === 'video' && duration) parts.push(fmtClock(duration));
      if (size) parts.push(fmtSize(size));
      return parts.join(' · ');
    }
    function boardTileHTML(compact) {
      if (diagram && diagram.items && diagram.items.length) {
        return '<div class="board-prev"><button type="button" class="bp-art" data-board="edit" aria-label="Editar el pizarrón"><span class="art">' + boardSVG(ex.sport, diagram) + '</span></button>' +
          '<div class="bp-txt"><b>Pizarrón</b><span>' + plural(diagram.items.length, 'elemento', 'elementos') + '</span><div class="bp-actions"><button type="button" class="cap" data-board="edit">Editar</button><button type="button" class="cap" data-board="remove">Quitar</button></div></div></div>';
      }
      return compact
        ? '<button type="button" class="pick-tile" data-board="edit"><span class="ico">' + ic('board') + '</span><b>Pizarrón</b></button>'
        : '<button type="button" class="board-add" data-board="edit"><span class="ico">' + ic('board') + '</span><span class="txt"><b>Dibujar en el pizarrón</b><span class="s">Jugadores, conos y flechas</span></span>' + ic('chevR', 'chev') + '</button>';
    }
    function renderMedia() {
      const box = $('[data-ref="media"]', root);
      const bar = (capTxt) => '<div class="mp-bar"><span class="mp-cap">' + esc(capTxt) + '</span><button type="button" class="mp-btn" data-media-act="change">Cambiar</button><button type="button" class="mp-btn" data-media-act="remove">Quitar</button></div>';
      if (media && media.loading) {
        box.innerHTML = '<div class="media-preview loading"><span class="spinner"></span>Preparando el archivo…</div>' + boardTileHTML(false);
        return;
      }
      if (media) {
        let capTxt = mediaCaption(media.kind, media.size, media.duration);
        if (media.kind === 'video' && S.backend.kind === 'cloud' && media.size > CLOUD_LIMIT) capTxt += ' · se reducirá';
        box.innerHTML = '<div class="media-preview">' + (media.kind === 'video'
          ? '<video class="mp-media" src="' + esc(media.previewURL) + '" muted playsinline loop autoplay></video>'
          : '<img class="mp-media" alt="" src="' + esc(media.previewURL) + '">') + bar(capTxt) + '</div>' + boardTileHTML(false);
        return;
      }
      if (!removeMedia && ex.mediaId) {
        box.innerHTML = '<div class="media-preview">' + (ex.mediaType === 'video'
          ? '<video class="mp-media" muted playsinline loop autoplay data-media="' + esc(ex.mediaId) + '"></video>'
          : '<img class="mp-media" alt="" data-media="' + esc(ex.mediaId) + '">') + bar(mediaCaption(ex.mediaType, 0, ex.mediaDuration)) + '</div>' + boardTileHTML(false);
        hydrate(box);
        return;
      }
      const hasBoard = diagram && diagram.items && diagram.items.length;
      box.innerHTML = '<div class="media-pick">' +
        (isTouch ? '<button type="button" class="pick-tile" data-pick="capture"><span class="ico">' + ic('video') + '</span><b>Grabar</b></button>' : '') +
        '<button type="button" class="pick-tile" data-pick="pick"><span class="ico">' + ic('upload') + '</span><b>' + (isTouch ? 'De tus fotos' : 'Elegir video o foto') + '</b></button>' +
        (hasBoard ? '' : boardTileHTML(true)) + '</div>' + (hasBoard ? boardTileHTML(false) : '');
    }
    async function useFile(file) {
      if (media && media.previewURL) URL.revokeObjectURL(media.previewURL);
      media = { loading: true };
      renderMedia();
      try { media = await processPicked(file); removeMedia = false; } catch (e) {
        media = null;
        alertBox('No se pudo abrir el archivo', 'Elige un video o una foto de tu iPad.');
      }
      renderMedia();
    }

    renderTags();
    renderMedia();
    if (opts.file) useFile(opts.file);
    $$('textarea', root).forEach((ta) => { autoGrow(ta); ta.addEventListener('input', () => autoGrow(ta)); });
    root.addEventListener('input', () => { dirty = true; });
    bindSeg(root, 'sport', (v) => {
      ex.sport = v;
      if (SPORTS[v].tags.indexOf(ex.objective) < 0) ex.objective = '';
      sheet.setTint(v); renderTags(); renderMedia(); dirty = true;
    });
    bindSeg(root, 'level', (v) => { ex.level = v; dirty = true; });
    root.addEventListener('click', (e) => {
      const tag = e.target.closest('[data-tag]');
      if (tag) { ex.objective = ex.objective === tag.dataset.tag ? '' : tag.dataset.tag; dirty = true; haptic(5); renderTags(); return; }
      const st = e.target.closest('[data-step]');
      if (st) { const inp = $('#ex-duration', root); inp.value = stepValue(inp.value, Number(st.dataset.step)); dirty = true; haptic(5); return; }
      const more = e.target.closest('[data-more]');
      if (more) { const box = $('[data-ref="more"]', root); box.hidden = !box.hidden; more.setAttribute('aria-expanded', String(!box.hidden)); return; }
      const pk = e.target.closest('[data-pick]');
      if (pk) { pickFile(pk.dataset.pick, useFile); return; }
      const bd = e.target.closest('[data-board]');
      if (bd) {
        if (bd.dataset.board === 'remove') { diagram = null; diagramChanged = true; renderMedia(); return; }
        openBoard({ sport: ex.sport, diagram, onDone: (d) => { diagram = d; diagramChanged = true; renderMedia(); } });
        return;
      }
      const ma = e.target.closest('[data-media-act]');
      if (ma) {
        if (ma.dataset.mediaAct === 'change') pickFile('pick', useFile);
        else {
          if (media && media.previewURL) URL.revokeObjectURL(media.previewURL);
          media = null;
          if (ex.mediaId) removeMedia = true;
          renderMedia();
        }
      }
    });
    if (!opts.file && !editing && !isTouch) setTimeout(() => { try { $('#ex-title', root).focus({ preventScroll: true }); } catch (e) { /* */ } }, 450);

    async function save() {
      if (media && media.loading) return;
      const title = $('#ex-title', root).value.trim();
      if (!title) { shake($('#ex-title', root)); toast('Ponle nombre al ejercicio', 'pencil'); return; }
      const nx = Object.assign(plain(ex), {
        title,
        duration: (() => { const v = Number($('#ex-duration', root).value); return Number.isFinite(v) && $('#ex-duration', root).value !== '' ? Math.max(1, Math.min(240, Math.round(v))) : 10; })(),
        players: $('#ex-players', root).value.trim(),
        age: $('#ex-age', root).value.trim(),
        space: $('#ex-space', root).value.trim(),
        material: $('#ex-material', root).value.trim(),
        description: $('#ex-desc', root).value.trim(),
        keyPoints: $('#ex-points', root).value.trim(),
        variations: $('#ex-vars', root).value.trim(),
        link: cleanLink($('#ex-link', root).value),
        diagram: diagram && diagram.items && diagram.items.length ? diagram : null,
        example: false,
        updatedAt: Date.now(),
      });
      if (!editing && S.backend.me) nx.authorId = S.backend.me;
      { const tmp = plain(ex); dropStaleVideo(tmp, nx.diagram); if (!tmp.videoUrl) { delete nx.videoUrl; delete nx.posterUrl; delete nx.thumbUrl; } }
      sheet.setBusy(true, 'Guardando…');
      const fresh = []; const old = [];
      try {
        if (media) {
          let blob = media.file;
          let type = media.kind === 'image' ? 'image/jpeg' : null;
          if (media.kind === 'video' && S.backend.kind === 'cloud') {
            const r = await prepareCloudVideo(media.file, (p) => sheet.progress(p, 'Reduciendo el video · ' + Math.round(p * 100) + '% · mantén la app abierta'));
            blob = r.blob; type = r.type;
          }
          sheet.progress(null, S.backend.kind === 'cloud' ? 'Subiendo ' + (media.kind === 'video' ? 'video' : 'foto') + '…' : 'Guardando…');
          const mediaId = await S.backend.putMedia(blob, type);
          fresh.push(mediaId);
          const thumbId = media.thumbBlob ? await S.backend.putMedia(media.thumbBlob, 'image/jpeg') : null;
          if (thumbId) fresh.push(thumbId);
          old.push(ex.mediaId, ex.thumbId);
          Object.assign(nx, { mediaType: media.kind, mediaId, thumbId, mediaDuration: media.duration || 0, mediaAspect: media.aspect || null });
        } else if (removeMedia) {
          old.push(ex.mediaId, ex.thumbId);
          Object.assign(nx, { mediaType: null, mediaId: null, thumbId: null, mediaDuration: 0, mediaAspect: null });
        }
        sheet.progress(null, 'Guardando…');
        await S.backend.saveExercise(nx);
      } catch (e) {
        fresh.forEach((id) => S.backend.deleteMedia(id).catch(() => {}));
        sheet.setBusy(false);
        showError(e);
        return;
      }
      replaceLocal('exercises', nx);
      old.filter(Boolean).forEach((id) => S.backend.deleteMedia(id).catch(() => {}));
      sheet.setBusy(false);
      if (media && media.previewURL) URL.revokeObjectURL(media.previewURL);
      media = null; dirty = false; removeMedia = false; diagramChanged = false;
      sheet.dismiss();
      renderAll(); refreshScreens();
      haptic(12);
      toast(editing ? 'Cambios guardados' : 'Ejercicio guardado');
      if (!editing) {
        if (S.tab === 'ejercicios' && nx.sport !== S.sport) setSport(nx.sport);
        if (opts.afterCreate) opts.afterCreate(nx);
      }
    }
  }

  function mediaDetailHTML(ex) {
    const ar = ex.mediaAspect && isFinite(ex.mediaAspect) ? Math.min(3, Math.max(0.4, Number(ex.mediaAspect))) : null;
    const style = ar ? ' style="--ar:' + ar + '"' : '';
    if (ex.mediaType === 'video' && ex.mediaId) {
      return '<div class="d-frame"' + style + '><video controls playsinline preload="metadata" data-media="' + esc(ex.mediaId) + '"' + (ex.thumbId ? ' data-poster="' + esc(ex.thumbId) + '"' : '') + '></video></div>';
    }
    if (ex.mediaType === 'image' && ex.mediaId) {
      return '<div class="d-frame"' + style + '><img alt="' + esc(ex.title) + '" data-media="' + esc(ex.mediaId) + '"></div>';
    }
    if (ex.videoUrl) return coachVideoHTML(ex);
    if (hasDiagram(ex)) return boardFrameHTML(ex);
    if (!S.canWrite) return '';
    return '<button type="button" class="board-add" data-act="board"><span class="ico">' + ic('board') + '</span><span class="txt"><b>Dibujar en el pizarrón</b><span class="s">Jugadores, conos y flechas</span></span>' + ic('chevR', 'chev') + '</button>';
  }
  // Video vertical generado para los ejercicios de entrenador (app/videos/…): se ve como un Short.
  function coachVideoHTML(ex) {
    return '<button type="button" class="d-frame coach-video" data-act="vtoggle" aria-label="Pausar o seguir el video"><video playsinline muted loop autoplay preload="metadata" src="' + esc(ex.videoUrl) + '"' + (ex.posterUrl ? ' poster="' + esc(ex.posterUrl) + '"' : '') + '></video><span class="v-state" aria-hidden="true">' + ic('play') + '</span></button>';
  }
  function boardSummary(ex) {
    const its = (ex.diagram && ex.diagram.items) || [];
    const a = its.filter((i) => i.t === 'a').length; const b = its.filter((i) => i.t === 'b').length;
    const arrows = its.filter((i) => i.t === 'arrow').length; const cones = its.filter((i) => i.t !== 'arrow' && i.t !== 'a' && i.t !== 'b' && i.t !== 'ball').length;
    return 'Pizarrón: ' + [a ? plural(a, 'jugador del equipo A', 'jugadores del equipo A') : '', b ? plural(b, 'jugador del equipo B', 'jugadores del equipo B') : '', cones ? plural(cones, 'pieza de material', 'piezas de material') : '', arrows ? plural(arrows, 'flecha', 'flechas') : ''].filter(Boolean).join(', ');
  }
  function boardFrameHTML(ex) {
    const playable = canPlay(ex.diagram);
    return '<div class="d-frame board-frame"><span class="art" role="img" aria-label="' + esc(boardSummary(ex)) + '">' + boardSVG(ex.sport, ex.diagram, { fit: 'xMidYMid meet', anim: playable }) + '</span>' +
      '<div class="bf-ctrls">' + (playable ? '<button type="button" class="bf-btn" data-act="play">' + ic('play') + '<span>Ver jugada</span></button>' : '<span></span>') +
      (S.canWrite ? '<button type="button" class="bf-btn" data-act="board">' + ic('pencil') + '<span>Editar</span></button>' : '') + '</div></div>';
  }
  // Links de video (YouTube u otro sitio): se guardan como link; Cancha no descarga videos ajenos.
  function ytId(url) {
    const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  function cleanLink(v) {
    let s = String(v || '').trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s) && /^(www\.|m\.|youtu)/i.test(s)) s = 'https://' + s;
    try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.href.slice(0, 400) : ''; } catch (e) { return ''; }
  }
  function linkCardHTML(link) {
    const id = ytId(link);
    let host = '';
    try { host = new URL(link).hostname.replace(/^www\./, ''); } catch (e) { /* */ }
    return '<a class="yt-card" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="yt-thumb">' + (id ? '<img alt="" loading="lazy" src="https://i.ytimg.com/vi/' + id + '/mqdefault.jpg" onerror="this.remove()">' : '') + '<span class="yt-play">' + ic('play') + '</span></span>' +
      '<span class="txt"><b>' + (id ? 'Ver video en YouTube' : 'Abrir el video') + '</b><span>' + esc(host || link) + '</span></span>' + ic('chevR', 'chev') + '</a>';
  }
  function bindVideoFallback(box) {
    const v = $('video', box);
    if (!v) return;
    let tried = false;
    v.addEventListener('error', async () => {
      if (tried || !v.currentSrc || v.currentSrc.indexOf('blob:') === 0) {
        if (!$('.media-msg', box)) box.querySelector('.d-frame').insertAdjacentHTML('beforeend', '<p class="media-msg">Este video no se puede reproducir en este navegador.</p>');
        return;
      }
      tried = true;
      try {
        const r = await fetch(v.currentSrc);
        if (!r.ok) throw new Error('fetch');
        v.src = URL.createObjectURL(await r.blob());
      } catch (e) {
        if (!$('.media-msg', box)) box.querySelector('.d-frame').insertAdjacentHTML('beforeend', '<p class="media-msg">No se pudo cargar el video.</p>');
      }
    });
  }

  function exerciseInfoHTML(ex) {
    const sec = (t, inner) => '<section class="sec"><h2>' + t + '</h2>' + inner + '</section>';
    const points = String(ex.keyPoints || '').split('\n').map((s) => s.trim().replace(/^[-•·*]\s*/, '')).filter(Boolean);
    const stats = [['clock', 'Duración', (Number(ex.duration) || 0) + ' min'], ['people', 'Jugadores', ex.players], ['age', 'Edad', ex.age], ['flag', 'Espacio', ex.space]].filter((s) => s[2]);
    const vars = String(ex.variations || '').split('\n').map((s) => s.trim().replace(/^[-•·*]\s*/, '')).filter(Boolean);
    const varHTML = vars.map((v) => { const m = v.match(/^([^:]{2,24}):\s*(.+)$/); return '<li>' + (m ? '<b>' + esc(m[1]) + '</b> ' + esc(m[2]) : esc(v)) + '</li>'; }).join('');
    let created = '';
    try { created = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ex.createdAt || Date.now())); } catch (e) { /* */ }
    return '<div class="d-head"><p class="d-tags">' + (ex.objective ? '<span class="tag">' + esc(ex.objective) + '</span>' : '<span class="tag">' + esc(SPORTS[ex.sport].name) + '</span>') + (ex.level ? '<span class="tag ghost">' + esc(ex.level) + '</span>' : '') + '</p><h1 class="d-title">' + esc(ex.title || 'Sin título') + '</h1></div>' +
      '<div class="stats" style="--cols:' + stats.length + '">' + stats.map((s) => '<div class="stat"><span class="k">' + ic(s[0]) + s[1] + '</span><span class="v">' + esc(s[2]) + '</span></div>').join('') + '</div>' +
      (S.canWrite ? '<div class="d-actions"><button class="btn filled grow" data-act="add-to-class">' + ic('plus') + 'Agregar a una clase</button>' +
        '<button class="btn icon tinted" data-act="sections" aria-label="Guardar en sección">' + ic('folder') + '</button>' +
        '<button class="btn icon tinted" data-act="fav" aria-pressed="' + !!ex.favorite + '" aria-label="Favorito">' + ic(ex.favorite ? 'heart-fill' : 'heart') + '</button></div>' : '') +
      (sectionsOf(ex.id).length ? '<p class="in-sections">' + ic('folder') + sectionsOf(ex.id).map((x) => '<button class="link sm" data-open-section="' + esc(x.id) + '">' + esc(x.name) + '</button>').join('') + '</p>' : '') +
      (ex.mediaId && hasDiagram(ex) ? sec('Pizarrón', boardFrameHTML(ex)) : '') +
      (ex.description ? sec('Cómo se hace', '<p>' + esc(ex.description) + '</p>') : '') +
      (points.length ? sec('Puntos clave', '<ul class="points">' + points.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>') : '') +
      (vars.length ? sec('Variantes', '<ul class="vars">' + varHTML + '</ul>') : '') +
      (ex.link ? sec('Video de referencia', linkCardHTML(ex.link)) : '') +
      (ex.material ? sec('Material', '<p>' + esc(ex.material) + '</p>') : '') +
      (S.canWrite ? '<div class="group" style="margin-top:28px"><button class="row danger" data-act="delete">' + ic('trash') + 'Eliminar ejercicio</button></div>' : '') +
      footHTML(ex.authorId, created);
  }
  function authorLabel(id) {
    if (!id || !S.backend) return '';
    if (id === S.backend.me) return 'ti';
    if (!(id in S.names)) { requestNames([id]); return ''; }
    return S.names[id] || 'otro profe';
  }
  function requestNames(ids) {
    const need = ids.filter((id) => id && !S.namesAsked.has(id));
    if (!need.length || !S.backend) return;
    need.forEach((id) => S.namesAsked.add(id));
    S.backend.profiles(need).then((ps) => {
      need.forEach((id) => { S.names[id] = (ps && ps[id] && ps[id].name) || ''; });
      refreshScreens();
    });
  }
  function footHTML(authorId, created) {
    const who = authorLabel(authorId);
    if (!who && !created) return '';
    return '<p class="foot">Agregado' + (who ? ' por ' + esc(who) : '') + (created ? ' el ' + esc(created) : '') + '</p>';
  }

  // El video de un recomendado es su pizarrón en movimiento: si cambias el dibujo, deja de coincidir.
  function dropStaleVideo(x, d) {
    if (x.videoUrl && JSON.stringify(d || null) !== JSON.stringify(x.diagram || null)) { delete x.videoUrl; delete x.posterUrl; delete x.thumbUrl; }
  }
  function openExercise(id) {
    const ex = getEx(id);
    if (!ex) return;
    if (backToScreen('ex:' + id)) return;
    haptic(4);
    const scr = pushScreen({ key: 'ex:' + id, tint: ex.sport, rightHTML: '<button class="glass-btn" data-act="share" aria-label="Compartir">' + ic('share') + '</button>' + (S.canWrite ? '<button class="glass-btn cap" data-act="edit">Editar</button>' : '') });
    scr.body.classList.add('wide');
    scr.body.innerHTML = '<div class="ex-layout"><div class="d-media" data-ref="media"></div><div class="ex-info" data-ref="info"></div></div>';
    let mediaKey = null;
    let player = null;
    function play(delay) {
      const e = getEx(id);
      const frame = $('.board-frame', scr.body);
      if (!e || !frame || !hasDiagram(e)) return;
      if (player) player.stop(false);
      frame.classList.add('playing');
      player = playDiagram(frame, e.diagram, { delay, onEnd: () => frame.classList.remove('playing') });
    }
    function render() {
      const e = getEx(id);
      if (!e) { popLayer(scr); return; }
      scr.el.dataset.tint = e.sport;
      scr.setTitle(e.title);
      const key = [e.mediaType, e.mediaId, e.thumbId, JSON.stringify(e.diagram || null)].join(':');
      if (key !== mediaKey) {
        const first = mediaKey === null;
        mediaKey = key;
        if (player) { player.stop(); player = null; }
        const box = $('[data-ref="media"]', scr.body);
        box.innerHTML = mediaDetailHTML(e);
        bindVideoFallback(box);
        hydrate(box);
        $('[data-ref="info"]', scr.body).innerHTML = exerciseInfoHTML(e);
        if (first && !reduceMotion()) play(650);
        return;
      }
      $('[data-ref="info"]', scr.body).innerHTML = exerciseInfoHTML(e);
    }
    render();
    scr.refresh = render;
    scr.onClose = () => { if (player) player.stop(); };
    scr.el.addEventListener('click', (ev) => {
      const so = ev.target.closest('[data-open-section]');
      if (so) { openSection(so.dataset.openSection); return; }
      const a = ev.target.closest('[data-act]');
      if (!a) return;
      const e = getEx(id);
      if (!e) return;
      switch (a.dataset.act) {
        case 'edit': openExerciseEditor({ exercise: e }); break;
        case 'share': shareExercise(e); break;
        case 'board': if (S.canWrite) { if (player) player.stop(); openBoard({ sport: e.sport, diagram: e.diagram, onDone: (d) => { mutateExercise(id, (x) => { dropStaleVideo(x, d); x.diagram = d; }); } }); } break;
        case 'play': haptic(6); play(150); break;
        case 'sections': openExerciseSections(id); break;
        case 'fav': mutateExercise(id, (x) => { x.favorite = !x.favorite; }); haptic(10); break;
        case 'add-to-class': addToClassFlow(e); break;
        case 'delete': confirmDeleteExercise(id); break;
        default: break;
      }
    });
  }

  function confirmDeleteExercise(id) {
    const e = getEx(id);
    if (!e) return;
    const uses = S.classes.filter((c) => (c.items || []).some((it) => it.exId === id)).length;
    actionSheet({
      title: '¿Eliminar «' + e.title + '»?',
      message: [uses ? 'Se quitará de ' + plural(uses, 'clase', 'clases') + '; en las que ya diste se queda el nombre.' : '', e.mediaId ? 'También se borrará su ' + (e.mediaType === 'video' ? 'video' : 'foto') + '.' : ''].filter(Boolean).join(' ') || undefined,
      actions: [{ label: 'Eliminar ejercicio', danger: true, onClick: () => deleteExercise(id) }],
    });
  }
  const classGiven = (c) => !!(c.lastRunAt || c.attendanceAt || (c.date && c.date < todayStr()));
  async function deleteExercise(id) {
    const ex = getEx(id);
    if (!ex) return;
    const before = S.classes.filter((c) => (c.items || []).some((it) => it.exId === id)).map((c) => plain(c));
    const after = before.map((c) => {
      const nc = plain(c);
      nc.items = classGiven(c)
        ? nc.items.map((it) => (it.exId === id ? Object.assign({}, it, { exId: undefined, gone: { title: ex.title, objective: ex.objective || '' } }) : it))
        : nc.items.filter((it) => it.exId !== id);
      nc.updatedAt = Date.now();
      return plain(nc);
    });
    S.exercises = S.exercises.filter((e) => e.id !== id);
    after.forEach((c) => replaceLocal('classes', c));
    renderAll(); refreshScreens();
    try {
      for (const c of after) await S.backend.saveClass(c);
      await S.backend.deleteExercise(id);
    } catch (e) {
      replaceLocal('exercises', ex);
      before.forEach((c) => replaceLocal('classes', c));
      renderAll(); refreshScreens();
      showError(e, 'No se pudo eliminar');
      return;
    }
    toast('Ejercicio eliminado', 'trash', {
      label: 'Deshacer',
      onClick: async () => {
        replaceLocal('exercises', ex);
        before.forEach((c) => replaceLocal('classes', c));
        renderAll(); refreshScreens();
        try { await S.backend.saveExercise(ex); for (const c of before) await S.backend.saveClass(c); toast('Ejercicio recuperado'); } catch (e) { showError(e); }
      },
      onExpire: () => { [ex.mediaId, ex.thumbId].filter(Boolean).forEach((m) => S.backend.deleteMedia(m).catch(() => {})); },
    });
  }

  function addToClassFlow(ex) {
    const list = S.classes.filter((c) => c.sport === ex.sport).sort(byUpcoming).slice(0, 6);
    const min = ex.duration || 10;
    const actions = list.map((c) => ({
      label: c.name || 'Clase sin nombre',
      sub: fmtDay(c.date) + ' · ' + fmtMin(classTotal(c)) + ' min',
      onClick: () => {
        if ((c.items || []).some((it) => it.exId === ex.id)) { toast('Ya está en «' + (c.name || 'la clase') + '»', 'check'); return; }
        mutateClass(c.id, (cc) => { cc.items.push({ exId: ex.id, min }); }).then((ok) => { if (ok) toast('Agregado a «' + (c.name || 'la clase') + '»'); });
      },
    }));
    actions.push({ label: 'Nueva clase', icon: 'plus', onClick: () => openClassEditor({ sport: ex.sport, items: [{ exId: ex.id, min }] }) });
    actionSheet({ title: 'Agregar a una clase de ' + SPORTS[ex.sport].noun, actions, tint: ex.sport });
  }

  function exerciseText(ex) {
    const points = String(ex.keyPoints || '').split('\n').map((x) => x.trim().replace(/^[-•·*]\s*/, '')).filter(Boolean);
    const lines = ['*' + ex.title + '*', [ex.objective, ex.level, (Number(ex.duration) || 0) + ' min'].filter(Boolean).join(' · ')];
    const facts = [ex.players ? 'Jugadores: ' + ex.players : '', ex.age ? 'Edad: ' + ex.age : '', ex.space ? 'Espacio: ' + ex.space : ''].filter(Boolean).join(' · ');
    if (facts) lines.push(facts);
    if (ex.material) lines.push('Material: ' + ex.material);
    if (ex.description) { lines.push(''); lines.push(ex.description); }
    if (points.length) { lines.push(''); points.forEach((p) => lines.push('• ' + p)); }
    return lines.join('\n');
  }
  function shareExercise(ex) {
    const text = exerciseText(ex);
    actionSheet({
      title: 'Compartir «' + ex.title + '»',
      tint: ex.sport,
      actions: [
        { label: 'Mandar texto por WhatsApp', icon: 'chat', href: 'https://wa.me/?text=' + encodeURIComponent(text) },
      ].concat(ex.videoUrl || ex.mediaType === 'video' ? [{ label: 'Mandar el video', icon: 'video', onClick: () => shareVideo(ex) }] : []).concat([
        { label: 'Mandar a otro profe', icon: 'box', onClick: () => sendExercise(ex) },
        { label: 'Copiar texto', icon: 'copy', onClick: () => copyText(text) },
      ]),
    });
  }
  // El video del ejercicio (propio o de entrenador) como archivo: WhatsApp, AirDrop o Fotos.
  async function shareVideo(ex) {
    try {
      const blob = ex.mediaType === 'video' && ex.mediaId ? await S.backend.mediaBlob(ex.mediaId) : await (await fetch(ex.videoUrl)).blob();
      if (!blob) throw new Error('video');
      const type = (blob.type || 'video/mp4').split(';')[0];
      const name = safeName(ex.title || 'Ejercicio') + (type.indexOf('quicktime') >= 0 ? '.mov' : '.mp4');
      const file = new File([blob], name, { type });
      if (!framed && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: ex.title }); } catch (e) { if (!e || e.name !== 'AbortError') throw e; }
        return;
      }
      await saveFile(file, name, 'Video');
    } catch (e) {
      alertBox('No se pudo preparar el video', 'Revisa tu conexión y vuelve a intentarlo.');
    }
  }

  // ---------------------------------------------------------------- flujos: clases
  function openClassEditor(opts) {
    const editing = !!opts.cls;
    const firstGroup = opts.groupId ? getGroup(opts.groupId) : null;
    const c = editing ? plain(opts.cls) : {
      id: uid(), name: '', sport: opts.sport || (firstGroup && SPORTS[firstGroup.sport] ? firstGroup.sport : S.sport || 'futbol'),
      date: todayStr(), notes: opts.notes || '', items: opts.items || [], groupId: opts.groupId || null, createdAt: Date.now(),
    };
    if (!editing && opts.name) c.name = opts.name;
    if (!editing && S.backend && S.backend.me) c.authorId = S.backend.me;
    let dirty = false;
    const body =
      '<div class="group"><input class="field-lg" id="cl-name" placeholder="Nombre de la clase" aria-label="Nombre de la clase" maxlength="80" autocomplete="off" enterkeyhint="done" value="' + esc(c.name) + '"></div>' +
      '<div class="group">' +
      '<button type="button" class="row row-btn" data-act="pick-group"><span class="k">' + ic('people') + 'Grupo</span><span class="val" data-ref="group-val"></span>' + ic('chevR', 'chev') + '</button>' +
      '<label class="row"><span class="k">' + ic('calendar') + 'Fecha</span><input id="cl-date" type="date" aria-label="Fecha" value="' + esc(c.date || '') + '"></label></div>' +
      '<div data-ref="sport-box"><p class="group-label">Deporte</p>' + segHTML('sport', [['futbol', 'Fútbol'], ['basquet', 'Básquetbol']], c.sport, 'Deporte') + '</div>' +
      '<p class="group-label" id="lbl-notes">Notas</p><div class="group"><textarea id="cl-notes" aria-labelledby="lbl-notes" placeholder="Objetivo del día, recordatorios…" maxlength="2000">' + esc(c.notes) + '</textarea></div>' +
      (opts.templateNote ? '<p class="muted" style="margin:0 16px">' + esc(opts.templateNote) + '</p>'
        : !editing && c.items.length && c.items[0].exId ? '<p class="muted" style="margin:0 16px">Se agregará «' + esc((getEx(c.items[0].exId) || {}).title || 'el ejercicio') + '».</p>' : '');
    const sheet = openSheet({
      title: editing ? 'Editar clase' : 'Nueva clase',
      tint: c.sport,
      confirmLabel: editing ? 'Guardar' : 'Crear',
      bodyHTML: body,
      isDirty: () => dirty,
      onConfirm: async () => {
        const root = sheet.body;
        c.date = $('#cl-date', root).value || '';
        c.name = $('#cl-name', root).value.trim() || ('Clase de ' + SPORTS[c.sport].noun + (c.date && parseDay(c.date) ? ' del ' + parseDay(c.date).getDate() + ' de ' + MONTHS_LONG[parseDay(c.date).getMonth()] : ''));
        c.notes = $('#cl-notes', root).value.trim();
        c.example = false;
        c.updatedAt = Date.now();
        sheet.setBusy(true, 'Guardando…');
        if (opts.prepare) {
          const items = await opts.prepare();
          if (!items) { sheet.setBusy(false); return; }
          c.items = items;
        }
        const ok = await commit('classes', plain(c), editing ? opts.cls : null);
        sheet.setBusy(false);
        if (!ok) return;
        dirty = false;
        sheet.dismiss();
        haptic(12);
        toast(editing ? 'Cambios guardados' : 'Clase creada');
        if (!editing) setTimeout(() => { openClass(c.id); if (!c.items.length) setTimeout(() => openPicker(c.id), 480); }, 260);
      },
    });
    const root = sheet.body;
    const groupOk = (g) => g && (g.sport === c.sport || !SPORTS[g.sport]);
    function renderGroupVal() {
      const g = getGroup(c.groupId);
      $('[data-ref="group-val"]', root).textContent = g ? g.name : 'Sin grupo';
      // si el grupo es de un solo deporte, la clase usa ese deporte y no se pregunta
      const fixed = g && SPORTS[g.sport];
      $('[data-ref="sport-box"]', root).hidden = !!fixed;
      if (fixed && c.sport !== g.sport) { c.sport = g.sport; sheet.setTint(c.sport); }
    }
    renderGroupVal();
    $$('textarea', root).forEach((ta) => { autoGrow(ta); ta.addEventListener('input', () => autoGrow(ta)); });
    root.addEventListener('input', () => { dirty = true; });
    bindSeg(root, 'sport', (v) => {
      c.sport = v; sheet.setTint(v); dirty = true;
      if (c.groupId && !groupOk(getGroup(c.groupId))) { c.groupId = null; renderGroupVal(); }
    });
    root.addEventListener('click', (e) => {
      if (!e.target.closest('[data-act="pick-group"]')) return;
      const list = S.groups.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
      const actions = list.map((g) => ({ label: g.name, sub: [g.category, g.schedule].filter(Boolean).join(' · ') || undefined, onClick: () => { c.groupId = g.id; dirty = true; renderGroupVal(); } }));
      if (c.groupId) actions.push({ label: 'Sin grupo', onClick: () => { c.groupId = null; dirty = true; renderGroupVal(); } });
      actions.push({ label: 'Nuevo grupo', icon: 'plus', onClick: () => openGroupEditor({ sport: c.sport, onCreate: (g) => { c.groupId = g.id; dirty = true; renderGroupVal(); } }) });
      actionSheet({ title: 'Grupo de la clase', actions, tint: c.sport });
    });
  }

  const seriesText = (s) => (s ? s.n + ' × ' + fmtMin(s.work) + '′' + (s.rest ? ' · ' + (s.rest < 1 ? Math.round(s.rest * 60) + ' s' : fmtMin(s.rest) + '′') + ' de descanso' : '') : '');
  function itemTitle(it) {
    if (isPause(it)) return it.label || 'Pausa';
    const ex = it.exId ? getEx(it.exId) : null;
    if (ex) return ex.title;
    return it.gone ? it.gone.title : 'Ejercicio eliminado';
  }
  function planRowsHTML(c, edit) {
    const items = c.items || [];
    let t = 0;
    return items.map((it, i) => {
      const start = t;
      t += itemMin(it);
      const pause = isPause(it);
      const ex = it.exId ? getEx(it.exId) : null;
      const title = itemTitle(it);
      const sub = pause ? 'Pausa' : [ex ? ex.objective : it.gone ? (it.gone.objective || '') + ' (ya no está en tus ejercicios)' : '', seriesText(it.series)].filter(Boolean).join(' · ');
      const mins = fmtMin(itemMin(it));
      if (edit) {
        return '<div class="plan-row edit' + (pause ? ' pause' : '') + '">' +
          '<button class="rm" data-act="rm" data-i="' + i + '" aria-label="Quitar ' + esc(title) + '">' + ic('minus') + '</button>' +
          '<span class="txt"><span class="t1">' + esc(title) + '</span>' + (sub ? '<span class="t2">' + esc(sub) + '</span>' : '') +
          (ex ? '<button type="button" class="link sm" data-act="series" data-i="' + i + '">' + (it.series ? 'Cambiar series' : 'Dividir en series') + '</button>' : '') + '</span>' +
          (it.series ? '<span class="st-fixed">' + mins + '′</span>'
            : '<span class="stepper sm"><button type="button" class="st-btn" data-act="min" data-d="-1" data-i="' + i + '" aria-label="Menos minutos para ' + esc(title) + '">' + ic('minus') + '</button><span class="st-val">' + mins + '′</span><button type="button" class="st-btn" data-act="min" data-d="1" data-i="' + i + '" aria-label="Más minutos para ' + esc(title) + '">' + ic('plus') + '</button></span>') +
          '<span class="moves"><button class="mv" data-act="move" data-d="-1" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Subir ' + esc(title) + '">' + ic('up') + '</button><button class="mv" data-act="move" data-d="1" data-i="' + i + '"' + (i === items.length - 1 ? ' disabled' : '') + ' aria-label="Bajar ' + esc(title) + '">' + ic('down') + '</button></span></div>';
      }
      const inner = '<span class="time">' + fmtMin(start) + '′</span>' +
        (pause ? '<span class="mini pause-ico">' + ic('drop') + '</span>' : ex ? thumbHTML(ex, 'mini') : '<span class="mini"></span>') +
        '<span class="txt"><span class="t1">' + esc(title) + '</span><span class="t2">' + esc([sub, mins + ' min'].filter(Boolean).join(' · ')) + '</span></span>';
      return ex ? '<button class="plan-row" data-open-ex="' + esc(it.exId) + '">' + inner + ic('chevR', 'chev') + '</button>'
        : '<div class="plan-row' + (pause ? ' pause' : '') + '">' + inner + '</div>';
    }).join('');
  }

  function classDetailHTML(c, edit) {
    const items = c.items || [];
    const total = classTotal(c);
    const nEx = items.filter((it) => !isPause(it)).length;
    const sport = SPORTS[c.sport] ? c.sport : 'futbol';
    const ops = [1, 0.72, 0.5, 0.34];
    let k = 0;
    const g = getGroup(c.groupId);
    const nP = items.length - nEx;
    let at = 0; let lastLabel = -1;
    const segs = items.map((it) => {
      const m = itemMin(it);
      const room = total ? (at - lastLabel) / total >= 0.12 && (total - at) / total >= 0.1 : at === 0;
      const label = at === 0 || (lastLabel >= 0 && room);
      if (label) lastLabel = at;
      const h = '<span class="tl-seg' + (isPause(it) ? ' p' : '') + '" style="flex-grow:' + Math.max(1, m) + ';--o:' + (isPause(it) ? 1 : ops[(k++) % 4]) + '"><i></i>' + (label ? '<b>' + fmtMin(at) + '′</b>' : '') + '</span>';
      at += m;
      return h;
    }).join('');
    return '<div class="d-head"><p class="d-eyebrow">' + ic(sport) + esc(c.date ? longDate(c.date) : 'Sin fecha') + '</p><h1 class="d-title">' + esc(c.name || 'Clase sin nombre') + '</h1>' +
      (g ? '<button class="group-chip" data-act="open-group" data-tint="' + groupTint(g) + '">' + ic('people') + esc(g.name) + ic('chevR') + '</button>' : '') + '</div>' +
      '<div class="c-summary"><p class="c-line"><span class="c-total">' + fmtMin(total) + '<small> min</small></span><span class="c-sub">' + plural(nEx, 'ejercicio', 'ejercicios') + (nP ? ' y ' + plural(nP, 'pausa', 'pausas') : '') + '</span></p>' +
      (items.length ? '<div class="tl" aria-hidden="true">' + segs + '<b class="tl-end">' + fmtMin(total) + '′</b></div>' : '') +
      (items.some((it) => it.exId && getEx(it.exId)) && !edit ? '<button class="btn filled start-btn" data-act="start">' + ic('play') + 'Iniciar clase</button>' : '') +
      (c.lastRunAt ? '<p class="c-done">' + ic('check') + 'Ya la diste el ' + esc(fmtLong(c.lastRunAt)) + '</p>' : '') + '</div>' +
      '<div class="section-head"><h2>Plan</h2>' + (S.canWrite && items.length ? '<button class="link" data-act="toggle-edit">' + (edit ? 'Listo' : 'Editar plan') + '</button>' : '') + '</div>' +
      '<div class="list">' + planRowsHTML(c, edit) +
      (S.canWrite && !edit ? '<button class="cell add-row" data-act="add-ex">' + ic('plus') + '<span>Agregar ejercicios</span></button><button class="cell add-row" data-act="add-pause">' + ic('drop') + '<span>Agregar pausa</span></button>' : '') +
      (!items.length && !S.canWrite ? '<p class="muted pad">Esta clase no tiene ejercicios.</p>' : '') + '</div>' +
      attendanceSectionHTML(c) +
      (c.notes ? '<section class="sec"><h2>Notas</h2><p>' + esc(c.notes) + '</p></section>' : '') +
      (S.canWrite ? '<div class="group" style="margin-top:28px"><button class="row row-act" data-act="duplicate">' + ic('copy') + 'Duplicar para otro grupo o fecha</button><button class="row danger" data-act="delete-class">' + ic('trash') + 'Eliminar clase</button></div>' : '');
  }

  function openClass(id) {
    const c = getClass(id);
    if (!c) return;
    if (backToScreen('cl:' + id)) return;
    haptic(4);
    let edit = false;
    const scr = pushScreen({ key: 'cl:' + id, tint: c.sport, rightHTML: '<button class="glass-btn" data-act="share" aria-label="Compartir la clase">' + ic('share') + '</button>' + (S.canWrite ? '<button class="glass-btn cap" data-act="edit-class">Editar</button>' : '') });
    function render() {
      const cc = getClass(id);
      if (!cc) { popLayer(scr); return; }
      if (!(cc.items || []).length) edit = false;
      scr.el.dataset.tint = SPORTS[cc.sport] ? cc.sport : 'futbol';
      scr.setTitle(cc.name);
      scr.body.innerHTML = classDetailHTML(cc, edit);
      hydrate(scr.body);
    }
    render();
    scr.refresh = render;
    scr.el.addEventListener('click', (ev) => {
      const open = ev.target.closest('[data-open-ex]');
      if (open && !edit) { openExercise(open.dataset.openEx); return; }
      const a = ev.target.closest('[data-act]');
      if (!a) return;
      const cc = getClass(id);
      if (!cc) return;
      const i = Number(a.dataset.i);
      switch (a.dataset.act) {
        case 'edit-class': openClassEditor({ cls: cc }); break;
        case 'share': shareClass(cc); break;
        case 'start': runClass(id); break;
        case 'open-group': if (cc.groupId) openGroup(cc.groupId); break;
        case 'attendance': openAttendance(id); break;
        case 'add-students': if (cc.groupId) openAddStudents(cc.groupId); break;
        case 'toggle-edit': edit = !edit; haptic(5); render(); break;
        case 'add-ex': openPicker(id); break;
        case 'add-pause': addPauseFlow(id); break;
        case 'series': openSeriesSheet(id, i); break;
        case 'duplicate': openDuplicate(id); break;
        case 'rm': {
          const removed = plain(cc.items[i]);
          const before = JSON.stringify(cc.items);
          mutateClass(id, (x) => { x.items.splice(i, 1); }).then((ok) => {
            if (!ok) return;
            const after = JSON.stringify((getClass(id) || {}).items || []);
            toast('Quitado del plan', 'trash', { label: 'Deshacer', onClick: () => mutateClass(id, (x) => {
              // Solo si el plan sigue igual que después de quitarlo; así un doble toque no lo repite.
              if (JSON.stringify(x.items) === after) x.items = JSON.parse(before);
              else if (!x.items.some((y) => JSON.stringify(y) === JSON.stringify(removed))) x.items.splice(Math.min(i, x.items.length), 0, removed);
            }) });
          });
          haptic(8);
          break;
        }
        case 'min': mutateClass(id, (x) => { x.items[i].min = stepValue(x.items[i].min, Number(a.dataset.d)); }); haptic(4); break;
        case 'move': {
          const j = i + Number(a.dataset.d);
          mutateClass(id, (x) => { if (j < 0 || j >= x.items.length) return; const tmp = x.items[i]; x.items[i] = x.items[j]; x.items[j] = tmp; });
          haptic(4);
          break;
        }
        case 'delete-class':
          actionSheet({
            title: '¿Eliminar «' + (cc.name || 'esta clase') + '»?',
            message: cc.attendance && Object.keys(cc.attendance).length ? 'También se elimina su asistencia. Tus ejercicios se quedan.' : 'Tus ejercicios se quedan.',
            actions: [{ label: 'Eliminar clase', danger: true, onClick: () => deleteClassWithUndo(id) }],
          });
          break;
        default: break;
      }
    });
  }

  async function deleteClassWithUndo(id) {
    const prev = getClass(id);
    if (!prev) return;
    S.classes = S.classes.filter((x) => x.id !== id);
    renderAll(); refreshScreens();
    try { await S.backend.deleteClass(id); } catch (e) {
      replaceLocal('classes', prev); renderAll(); refreshScreens();
      showError(e, 'No se pudo eliminar');
      return;
    }
    toast('Clase eliminada', 'trash', { label: 'Deshacer', onClick: () => commit('classes', plain(prev), null).then((ok) => { if (ok) toast('Clase recuperada'); }) });
  }

  function addPauseFlow(classId) {
    const opts = [['Hidratación', 3], ['Descanso', 2], ['Preparar material', 3]];
    actionSheet({
      title: 'Agregar pausa',
      message: 'Se suma al tiempo de la clase.',
      actions: opts.map((o) => ({ label: o[0] + ' · ' + o[1] + ' min', icon: 'drop', onClick: () => { mutateClass(classId, (x) => { x.items.push({ type: 'pause', label: o[0], min: o[1] }); }).then((ok) => { if (ok) toast('Pausa agregada'); }); } })),
    });
  }

  function openSeriesSheet(classId, i) {
    const c = getClass(classId);
    const it = c && c.items[i];
    if (!it || isPause(it)) return;
    const fitSeries = (m) => { for (let n = 4; n >= 2; n--) { const w = Math.floor((m - (n - 1)) / n); if (w >= 2) return { n, work: Math.min(30, w), rest: 1 }; } return { n: 2, work: Math.max(1, Math.floor(m / 2) || 1), rest: 0 }; };
    const s0 = it.series || fitSeries(itemMin(it));
    const st = { n: s0.n, work: s0.work, rest: s0.rest };
    const rests = [['0', 'Sin'], ['0.5', '30 s'], ['1', '1 min'], ['2', '2 min']];
    const counter = (k, label, val, unit) => '<div class="row"><span class="k">' + label + '</span><span class="stepper"><button type="button" class="st-btn" data-k="' + k + '" data-d="-1" aria-label="Menos">' + ic('minus') + '</button><span class="st-val" data-v="' + k + '">' + val + unit + '</span><button type="button" class="st-btn" data-k="' + k + '" data-d="1" aria-label="Más">' + ic('plus') + '</button></span></div>';
    const sheet = openSheet({
      title: 'Series',
      tint: c.sport,
      confirmLabel: 'Guardar',
      bodyHTML:
        '<p class="att-head"><b>' + esc(itemTitle(it)) + '</b></p>' +
        '<div class="group">' + counter('n', 'Series', st.n, '') + counter('work', 'Minutos por serie', st.work, '′') + '</div>' +
        '<p class="group-label">Descanso entre series</p>' + segHTML('rest', rests, String(st.rest), 'Descanso entre series') +
        '<p class="series-sum" data-ref="sum"></p>' +
        (it.series ? '<button type="button" class="btn tinted wide-btn" data-act="no-series">Quitar series</button>' : ''),
      onConfirm: async () => {
        const total = st.n * st.work + (st.n - 1) * st.rest;
        if (total > 240) { toast('Máximo 240 min por ejercicio', 'clock'); return; }
        const ok = await mutateClass(classId, (x) => {
          const y = x.items[i];
          if (st.n <= 1) { delete y.series; y.min = st.work; delete y.minBefore; } else { if (!y.series && y.minBefore == null) y.minBefore = y.min; y.series = { n: st.n, work: st.work, rest: st.rest }; y.min = total; }
        });
        if (ok) { sheet.dismiss(); toast('Series guardadas'); }
      },
    });
    const root = sheet.body;
    function paint() {
      $('[data-v="n"]', root).textContent = st.n;
      $('[data-v="work"]', root).textContent = st.work + '′';
      const total = st.n * st.work + (st.n - 1) * st.rest;
      $('[data-ref="sum"]', root).textContent = st.n <= 1 ? 'Una sola serie de ' + st.work + ' min.' : st.n + ' series de ' + st.work + ' min' + (st.rest ? ' con ' + (st.rest < 1 ? '30 s' : st.rest + ' min') + ' de descanso' : ' sin descanso') + ' = ' + fmtMin(total) + ' min.' + (total > 240 ? ' Es demasiado: máximo 240 min.' : '');
      sheet.setConfirm(total <= 240);
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (b) {
        const d = Number(b.dataset.d);
        if (b.dataset.k === 'n') st.n = Math.max(1, Math.min(12, st.n + d));
        else st.work = Math.max(1, Math.min(30, st.work + d));
        haptic(4); paint(); return;
      }
      if (e.target.closest('[data-act="no-series"]')) {
        mutateClass(classId, (x) => { const y = x.items[i]; delete y.series; y.min = y.minBefore != null ? y.minBefore : y.min; delete y.minBefore; }).then((ok) => { if (ok) { sheet.dismiss(); toast('Series quitadas'); } });
      }
    });
    bindSeg(root, 'rest', (v) => { st.rest = Number(v); paint(); });
    paint();
  }

  function openDuplicate(classId) {
    const c = getClass(classId);
    if (!c) return;
    const t = todayStr();
    const base = parseDay(c.date);
    let date = t;
    if (base && c.date >= t) { const d = new Date(base); d.setDate(d.getDate() + 7); date = dayStr(d); }
    let groupId = c.groupId || null;
    const sheet = openSheet({
      title: 'Duplicar clase',
      tint: c.sport,
      confirmLabel: 'Duplicar',
      bodyHTML:
        '<p class="att-head">Se copia el plan de <b>' + esc(c.name || 'la clase') + '</b>, sin la asistencia.</p>' +
        '<div class="group"><button type="button" class="row row-btn" data-act="pick-group"><span class="k">' + ic('people') + 'Grupo</span><span class="val" data-ref="group-val"></span>' + ic('chevR', 'chev') + '</button>' +
        '<label class="row"><span class="k">' + ic('calendar') + 'Fecha</span><input id="dp-date" type="date" aria-label="Fecha" value="' + esc(date) + '"></label></div>',
      onConfirm: async () => {
        const nc = plain(c);
        Object.assign(nc, { id: uid(), date: $('#dp-date', sheet.body).value || '', groupId, example: false, createdAt: Date.now(), updatedAt: Date.now() });
        delete nc.attendance; delete nc.attendanceAt; delete nc.lastRunAt;
        if (S.backend && S.backend.me) nc.authorId = S.backend.me;
        const ok = await commit('classes', nc, null);
        if (!ok) return;
        sheet.dismiss();
        toast('Clase duplicada');
        setTimeout(() => openClass(nc.id), 300);
      },
    });
    const root = sheet.body;
    const renderGroupVal = () => { const g = getGroup(groupId); $('[data-ref="group-val"]', root).textContent = g ? g.name : 'Sin grupo'; };
    renderGroupVal();
    root.addEventListener('click', (e) => {
      if (!e.target.closest('[data-act="pick-group"]')) return;
      const list = S.groups.filter((g) => g.sport === c.sport || !SPORTS[g.sport]).sort((a, b) => a.name.localeCompare(b.name, 'es'));
      const actions = list.map((g) => ({ label: g.name, sub: [g.category, g.schedule].filter(Boolean).join(' · ') || undefined, onClick: () => { groupId = g.id; renderGroupVal(); } }));
      if (groupId) actions.push({ label: 'Sin grupo', onClick: () => { groupId = null; renderGroupVal(); } });
      actionSheet({ title: 'Grupo', actions, tint: c.sport });
    });
  }

  function openPicker(classId) {
    const c = getClass(classId);
    if (!c) return;
    const sport = SPORTS[c.sport] ? c.sport : 'futbol';
    const sel = [];
    let q = '';
    const all = exOf(sport);
    const inClass = new Set((c.items || []).map((it) => it.exId).filter(Boolean));
    const sheet = openSheet({
      title: 'Agregar ejercicios',
      tint: sport,
      confirmLabel: 'Agregar',
      bodyHTML: (all.length ? '<label class="search">' + ic('search') + '<input type="search" id="pk-q" placeholder="Buscar en ' + SPORTS[sport].noun + '" autocomplete="off" aria-label="Buscar ejercicios"></label>' : '<p class="att-head">Aún no tienes ejercicios de ' + SPORTS[sport].noun + '.</p>') +
        '<div class="list pick-list" data-ref="list"></div>',
      isDirty: () => sel.length > 0,
      discardTitle: '¿Descartar la selección?',
      onConfirm: async () => {
        const add = sel.slice();
        const ok = await mutateClass(classId, (x) => { add.forEach((id) => x.items.push({ exId: id, min: (getEx(id) || {}).duration || 10 })); });
        if (!ok) return;
        sel.length = 0;
        sheet.dismiss();
        haptic(12);
        toast(add.length === 1 ? 'Ejercicio agregado' : add.length + ' ejercicios agregados');
      },
    });
    sheet.setConfirm(false);
    const root = sheet.body;
    function render() {
      const qq = norm(q).trim();
      const list = qq ? all.filter((e) => norm([e.title, e.objective, e.description].join(' ')).indexOf(qq) >= 0) : all;
      $('[data-ref="list"]', root).innerHTML =
        (S.canWrite ? '<button class="cell add-row" data-act="new-ex">' + ic('plus') + '<span>Nuevo ejercicio</span></button>' : '') +
        list.map((e) => {
          const n = sel.indexOf(e.id) >= 0;
          const meta = [e.objective, (e.duration || 10) + ' min', inClass.has(e.id) ? 'ya en la clase' : ''].filter(Boolean).join(' · ');
          return '<button class="cell" role="checkbox" aria-checked="' + n + '" data-pick-ex="' + esc(e.id) + '">' + thumbHTML(e, 'mini') +
            '<span class="txt"><span class="t1">' + esc(e.title) + '</span><span class="t2">' + esc(meta) + '</span></span><span class="check">' + ic('check') + '</span></button>';
        }).join('') +
        (all.length && !list.length ? '<p class="muted pad">Nada coincide con tu búsqueda.</p>' : '');
      hydrate(root);
    }
    render();
    const qi = $('#pk-q', root);
    if (qi) qi.addEventListener('input', (e) => { q = e.target.value; render(); });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="new-ex"]')) {
        openExerciseEditor({ sport, afterCreate: (nx) => { all.unshift(nx); sel.push(nx.id); render(); sheet.setConfirm(true, 'Agregar (' + sel.length + ')'); } });
        return;
      }
      const b = e.target.closest('[data-pick-ex]');
      if (!b) return;
      const id = b.dataset.pickEx;
      const i = sel.indexOf(id);
      if (i >= 0) sel.splice(i, 1); else sel.push(id);
      b.setAttribute('aria-checked', String(i < 0));
      haptic(5);
      sheet.setConfirm(sel.length > 0, sel.length ? 'Agregar (' + sel.length + ')' : 'Añadir');
    });
  }

  // Borra solo los ejemplos que nadie tocó; lo que el profe usó o editó se vuelve suyo.
  function clearExamples() {
    const userCls = S.classes.filter((c) => !c.example);
    const usedEx = new Set(); const usedGr = new Set();
    userCls.forEach((c) => { (c.items || []).forEach((it) => { if (it.exId) usedEx.add(it.exId); }); if (c.groupId) usedGr.add(c.groupId); });
    const exs = S.exercises.filter((e) => e.example && !usedEx.has(e.id));
    const cls = S.classes.filter((c) => c.example);
    const grs = S.groups.filter((g) => g.example && !usedGr.has(g.id));
    const adopt = S.exercises.filter((e) => e.example && usedEx.has(e.id)).map((e) => ['exercises', e]).concat(S.groups.filter((g) => g.example && usedGr.has(g.id)).map((g) => ['groups', g]));
    const parts = [exs.length ? plural(exs.length, 'ejercicio', 'ejercicios') : '', cls.length ? plural(cls.length, 'clase', 'clases') : '', grs.length ? plural(grs.length, 'grupo', 'grupos') : ''].filter(Boolean);
    const joined = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1] : parts.join('');
    actionSheet({
      title: '¿Eliminar los ejemplos?',
      message: (joined ? 'Se eliminarán ' + joined + ' de ejemplo. ' : '') + 'Lo que agregaste, editaste o usaste en tus clases se queda.',
      actions: [{ label: 'Eliminar ejemplos', danger: true, onClick: async () => {
        const snap = { exs: exs.map(plain), cls: cls.map(plain), grs: grs.map(plain) };
        S.exercises = S.exercises.filter((e) => exs.indexOf(e) < 0);
        S.classes = S.classes.filter((c) => !c.example);
        S.groups = S.groups.filter((g) => grs.indexOf(g) < 0);
        const secs = S.sections.filter((x) => x.example);
        snap.secs = secs.map(plain);
        S.sections = S.sections.filter((x) => !x.example);
        adopt.forEach((p) => { const x = plain(p[1]); x.example = false; replaceLocal(p[0], x); });
        renderAll(); refreshScreens();
        try {
          for (const p of adopt) await S.backend[SAVE[p[0]]](Object.assign(plain(p[1]), { example: false }));
          for (const c of cls) await S.backend.deleteClass(c.id);
          for (const g of grs) await S.backend.deleteGroup(g.id);
          for (const e of exs) await S.backend.deleteExercise(e.id);
          for (const x of snap.secs) await S.backend.deleteSection(x.id);
        } catch (e) { showError(e, 'No se pudieron eliminar'); return; }
        toast('Ejemplos eliminados', 'trash', {
          label: 'Deshacer',
          onClick: async () => {
            try {
              for (const e of snap.exs) { replaceLocal('exercises', e); await S.backend.saveExercise(e); }
              for (const g of snap.grs) { replaceLocal('groups', g); await S.backend.saveGroup(g); }
              for (const c of snap.cls) { replaceLocal('classes', c); await S.backend.saveClass(c); }
              for (const x of snap.secs || []) { replaceLocal('sections', x); await S.backend.saveSection(x); }
              renderAll(); refreshScreens();
            } catch (e) { showError(e); }
          },
          onExpire: () => { snap.exs.forEach((e) => [e.mediaId, e.thumbId].filter(Boolean).forEach((m) => S.backend.deleteMedia(m).catch(() => {}))); },
        });
      } }],
    });
  }

  // ---------------------------------------------------------------- secciones de la biblioteca
  // Carpetas que arma el profe («Calentamientos», «Para primaria»…). Un ejercicio puede estar en varias.
  const getSection = (id) => S.sections.find((x) => x.id === id) || null;
  const sectionExercises = (sec) => (sec ? sec.exIds.map(getEx).filter(Boolean) : []);
  const sectionsOf = (exId) => S.sections.filter((x) => x.exIds.indexOf(exId) >= 0);
  function mutateSection(id, fn) {
    const cur = getSection(id);
    if (!cur) return Promise.resolve(false);
    const x = plain(cur);
    x.exIds = (x.exIds || []).slice();
    fn(x);
    x.exIds = Array.from(new Set(x.exIds));
    x.example = false;
    x.updatedAt = Date.now();
    return commit('sections', x, cur);
  }
  function mosaicHTML(exs) {
    const three = exs.slice(0, 3);
    if (!three.length) return '<span class="mo-empty">' + ic('board') + '</span>';
    return three.map((e) => '<span class="mo-cell">' + (e.thumbId ? '<img alt="" loading="lazy" ' + srcAttr(e.thumbId) + '>' : e.thumbUrl ? '<img alt="" loading="lazy" src="' + esc(e.thumbUrl) + '">' : boardSVG(e.sport, hasDiagram(e) ? e.diagram : null, { crop: true })) + '</span>').join('');
  }
  function sectionsStripHTML() {
    const list = S.sections.slice().sort((a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || 0) - (b.createdAt || 0));
    if (!list.length && !S.canWrite) return '';
    return '<div class="section-head"><h2>Secciones</h2>' + (S.canWrite ? '<button class="link" data-act="new-section">' + ic('plus') + 'Nueva</button>' : '') + '</div>' +
      '<div class="sec-strip" role="list">' + list.map((sec) => {
        const exs = sectionExercises(sec);
        const pics = exs.filter((e) => e.sport === S.sport).concat(exs.filter((e) => e.sport !== S.sport));
        return '<button class="sec-card" role="listitem" data-open-section="' + esc(sec.id) + '"><span class="sec-mosaic n' + Math.min(3, exs.length) + '">' + mosaicHTML(pics) + '</span>' +
          '<span class="sec-name">' + esc(sec.name) + '</span><span class="sec-count">' + plural(exs.length, 'ejercicio', 'ejercicios') + '</span></button>';
      }).join('') +
      (S.canWrite && !list.length ? '<button class="sec-card sec-new" data-act="new-section"><span class="sec-mosaic">' + ic('plus') + '</span><span class="sec-name">Nueva sección</span><span class="sec-count">Agrupa tus ejercicios</span></button>' : '') +
      '</div>';
  }
  function openSectionEditor(opts) {
    const editing = !!opts.section;
    const sec = editing ? plain(opts.section) : { id: uid(), name: '', exIds: opts.exIds || [], createdAt: Date.now(), order: Date.now() };
    const sheet = openSheet({
      title: editing ? 'Editar sección' : 'Nueva sección',
      confirmLabel: editing ? 'Guardar' : 'Crear',
      isDirty: () => $('#sec-name', sheet.body).value.trim() !== (opts.section ? opts.section.name : ''),
      bodyHTML: '<div class="group"><input class="field-lg" id="sec-name" placeholder="Ej. Calentamientos, Para 3.º B, Torneo" aria-label="Nombre de la sección" maxlength="40" autocomplete="off" enterkeyhint="done" value="' + esc(sec.name) + '"></div>' +
        (editing ? '<div class="group" style="margin-top:28px"><button type="button" class="row danger" data-act="del-section">' + ic('trash') + 'Eliminar sección</button></div><p class="muted small" style="margin:0 16px">Solo se elimina la sección. Tus ejercicios se quedan.</p>' : ''),
      onConfirm: async () => {
        const inp = $('#sec-name', sheet.body);
        const name = inp.value.replace(/\s+/g, ' ').trim();
        if (!name) { shake(inp); return; }
        Object.assign(sec, { name, example: false, updatedAt: Date.now() });
        const ok = await commit('sections', plain(sec), editing ? opts.section : null);
        if (!ok) return;
        sheet.dismiss();
        haptic(10);
        toast(editing ? 'Sección guardada' : 'Sección creada');
        if (!editing && !opts.exIds) setTimeout(() => openSection(sec.id), 280);
        if (opts.onDone) opts.onDone(sec);
      },
    });
    sheet.body.addEventListener('click', (e) => {
      if (!e.target.closest('[data-act="del-section"]')) return;
      const prev = plain(opts.section);
      sheet.dismiss();
      S.sections = S.sections.filter((x) => x.id !== prev.id);
      renderAll(); refreshScreens();
      S.backend.deleteSection(prev.id).then(() => {
        toast('Sección eliminada', 'trash', { label: 'Deshacer', onClick: () => commit('sections', prev, null) });
      }).catch((err) => { replaceLocal('sections', prev); renderAll(); refreshScreens(); showError(err, 'No se pudo eliminar'); });
    });
    setTimeout(() => { try { $('#sec-name', sheet.body).focus({ preventScroll: true }); } catch (e) { /* */ } }, 420);
  }
  function openSection(id) {
    const sec0 = getSection(id);
    if (!sec0) return;
    if (backToScreen('sec:' + id)) return;
    haptic(4);
    let editing = false;
    const scr = pushScreen({ key: 'sec:' + id, tint: 'clases', rightHTML: S.canWrite ? '<button class="glass-btn cap" data-act="sec-edit">Editar</button>' : '' });
    function render() {
      const sec = getSection(id);
      if (!sec) { popLayer(scr); return; }
      const exs = sectionExercises(sec);
      scr.setTitle(sec.name);
      const bySport = ['futbol', 'basquet'].map((sp) => [sp, exs.filter((e) => e.sport === sp)]).filter((x) => x[1].length);
      scr.body.innerHTML =
        '<div class="d-head"><h1 class="d-title">' + esc(sec.name) + '</h1><p class="sec-sub">' + plural(exs.length, 'ejercicio', 'ejercicios') + '</p></div>' +
        (S.canWrite ? '<div class="d-actions"><button class="btn filled grow" data-act="sec-add">' + ic('plus') + 'Agregar ejercicios</button>' +
          (exs.length ? '<button class="btn tinted" data-act="sec-toggle-edit">' + (editing ? 'Listo' : 'Quitar ejercicios') + '</button>' : '') + '</div>' : '') +
        (editing ? '<p class="hint">Toca − en un ejercicio para sacarlo de esta sección. No se elimina de tus ejercicios.</p>' : '') +
        (!exs.length ? '<p class="muted center">Esta sección está vacía. Toca «Agregar ejercicios».</p>' : '') +
        bySport.map((x) => (bySport.length > 1 ? '<p class="group-label">' + SPORTS[x[0]].name + '</p>' : '') +
          '<div class="grid' + (editing ? ' editing' : '') + '">' + x[1].map((e) => (editing
            ? '<div class="card-wrap">' + cardHTML(e) + '<button class="card-rm" data-rm-ex="' + esc(e.id) + '" aria-label="Quitar «' + esc(e.title) + '» de la sección">' + ic('minus') + '</button></div>'
            : cardHTML(e))).join('') + '</div>').join('');
      hydrate(scr.body);
    }
    render();
    scr.refresh = render;
    scr.el.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm-ex]');
      if (rm) {
        const exId = rm.dataset.rmEx;
        const sec = getSection(id);
        const idx = sec ? sec.exIds.indexOf(exId) : -1;
        mutateSection(id, (x) => { x.exIds = x.exIds.filter((y) => y !== exId); }).then((ok) => {
          if (ok) toast('Quitado de la sección', 'trash', { label: 'Deshacer', onClick: () => mutateSection(id, (x) => { if (x.exIds.indexOf(exId) < 0) x.exIds.splice(Math.max(0, idx), 0, exId); }) });
        });
        return;
      }
      const card = e.target.closest('[data-open-ex]');
      if (card && !editing) { openExercise(card.dataset.openEx); return; }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'sec-edit') openSectionEditor({ section: getSection(id) });
      else if (a.dataset.act === 'sec-toggle-edit') { editing = !editing; render(); }
      else if (a.dataset.act === 'sec-add') openSectionPicker(id);
    });
  }
  // Elegir ejercicios de la biblioteca para una sección (los dos deportes).
  function openSectionPicker(id) {
    const sec = getSection(id);
    if (!sec) return;
    const chosen = new Set(sec.exIds);
    let sport = S.sport;
    let q = '';
    const sheet = openSheet({
      title: 'Agregar a «' + sec.name + '»',
      confirmLabel: 'Listo',
      bodyHTML: segHTML('pksport', [['futbol', 'Fútbol'], ['basquet', 'Básquetbol']], sport, 'Deporte') +
        '<label class="search">' + ic('search') + '<input type="search" id="sp-q" placeholder="Buscar ejercicios" autocomplete="off" aria-label="Buscar ejercicios"></label>' +
        '<div class="list pick-list" data-ref="list"></div>',
      onConfirm: async () => {
        const ok = await mutateSection(id, (x) => { x.exIds = x.exIds.filter((y) => chosen.has(y)).concat(Array.from(chosen).filter((y) => x.exIds.indexOf(y) < 0)); });
        if (!ok) return;
        sheet.dismiss();
        toast('Sección actualizada');
      },
    });
    const root = sheet.body;
    function paint() {
      const nq = norm(q).trim();
      const list = exOf(sport).filter((e) => !nq || norm(e.title + ' ' + (e.objective || '')).indexOf(nq) >= 0);
      $('[data-ref="list"]', root).innerHTML = list.length ? list.map((e) => '<button type="button" class="cell" role="checkbox" aria-checked="' + chosen.has(e.id) + '" data-pick-sec="' + esc(e.id) + '">' + thumbHTML(e, 'mini') +
        '<span class="txt"><span class="t1">' + esc(e.title) + '</span><span class="t2">' + esc([e.objective, e.duration ? e.duration + ' min' : ''].filter(Boolean).join(', ')) + '</span></span><span class="check">' + ic('check') + '</span></button>').join('')
        : '<p class="muted pad">No hay ejercicios' + (nq ? ' con esa búsqueda' : ' de ' + SPORTS[sport].noun) + '.</p>';
      hydrate(root);
    }
    bindSeg(root, 'pksport', (v) => { sport = v; paint(); });
    $('#sp-q', root).addEventListener('input', (e) => { q = e.target.value; paint(); });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick-sec]');
      if (!b) return;
      const x = b.dataset.pickSec;
      if (chosen.has(x)) chosen.delete(x); else chosen.add(x);
      b.setAttribute('aria-checked', String(chosen.has(x)));
      haptic(4);
    });
    paint();
  }
  // Desde un ejercicio: en qué secciones está.
  function openExerciseSections(exId) {
    const ex = getEx(exId);
    if (!ex) return;
    const sheet = openSheet({
      title: 'Guardar en sección',
      cancelLabel: 'Listo',
      bodyHTML: '<p class="att-head"><b>' + esc(ex.title) + '</b></p><div class="group" data-ref="list"></div>' +
        '<button type="button" class="btn tinted wide-btn" data-act="new-sec">' + ic('plus') + 'Nueva sección</button>',
    });
    const root = sheet.body;
    function paint() {
      const list = S.sections.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
      $('[data-ref="list"]', root).innerHTML = list.length ? list.map((sec) => switchRow('sx-' + sec.id, ic('box'), esc(sec.name), plural(sectionExercises(sec).length, 'ejercicio', 'ejercicios'), sec.exIds.indexOf(exId) >= 0, false)).join('')
        : '<p class="muted pad">Todavía no tienes secciones.</p>';
    }
    root.addEventListener('change', (e) => {
      const inp = e.target.closest('input[id^="sx-"]');
      if (!inp) return;
      const secId = inp.id.slice(3);
      mutateSection(secId, (x) => { if (inp.checked) x.exIds.push(exId); else x.exIds = x.exIds.filter((y) => y !== exId); });
      haptic(6);
    });
    root.addEventListener('click', (e) => {
      if (!e.target.closest('[data-act="new-sec"]')) return;
      openSectionEditor({ exIds: [exId], onDone: () => paint() });
    });
    paint();
  }

  // ---------------------------------------------------------------- filtros de la biblioteca
  const AGE_BANDS = [['', 'Cualquiera'], ['6-8', '6 a 8'], ['9-10', '9 a 10'], ['11-12', '11 a 12'], ['13-14', '13 a 14'], ['15-18', '15 o más']];
  const DUR_BANDS = [['', 'Cualquiera'], ['0-10', 'Hasta 10 min'], ['11-20', '11 a 20 min'], ['21-999', 'Más de 20 min']];
  const SORTS = [['recent', 'Recientes'], ['az', 'A–Z'], ['short', 'Más cortos']];
  const fx = (sport) => (S.fx[sport] = S.fx[sport] || { levels: [], age: '', dur: '', video: false, school: false, sort: 'recent' });
  const hasVideo = (e) => e.mediaType === 'video' || !!e.videoUrl || !!e.link;
  // «Sub-12» → 11 a 12; «9 a 15 años» → 9 a 15; sin edad → sirve para todos.
  function ageRange(txtAge) {
    const s = String(txtAge || '');
    const nums = [];
    s.replace(/sub-?\s*(\d{1,2})/gi, (m, n) => { nums.push(Number(n) - 1, Number(n)); return m; });
    s.replace(/(\d{1,2})\s*(?:a|-|–)\s*(\d{1,2})\s*años/gi, (m, a, b) => { nums.push(Number(a), Number(b)); return m; });
    s.replace(/(\d{1,2})\s*años/gi, (m, a) => { nums.push(Number(a)); return m; });
    if (!nums.length) return null;
    return [Math.min.apply(null, nums), /en adelante|o más|\+/i.test(s) ? 99 : Math.max.apply(null, nums)];
  }
  function activeFilterCount(sport) {
    const f = fx(sport);
    return f.levels.length + (f.age ? 1 : 0) + (f.dur ? 1 : 0) + (f.video ? 1 : 0) + (f.school ? 1 : 0);
  }
  function applyFilters(list, sport) {
    const f = fx(sport);
    let out = list;
    if (f.levels.length) out = out.filter((e) => f.levels.indexOf(e.level || 'Inicial') >= 0);
    if (f.age) { const [lo, hi] = f.age.split('-').map(Number); out = out.filter((e) => { const r = ageRange(e.age); return !r || (r[0] <= hi && r[1] >= lo); }); }
    if (f.dur) { const [lo, hi] = f.dur.split('-').map(Number); out = out.filter((e) => (Number(e.duration) || 0) >= lo && (Number(e.duration) || 0) <= hi); }
    if (f.video) out = out.filter(hasVideo);
    if (f.school) out = out.filter((e) => e.school);
    if (f.sort === 'az') out = out.slice().sort((a, b) => String(a.title).localeCompare(String(b.title), 'es'));
    else if (f.sort === 'short') out = out.slice().sort((a, b) => (Number(a.duration) || 0) - (Number(b.duration) || 0));
    return out;
  }
  function activeFiltersHTML(sport) {
    const f = fx(sport);
    const chips = [];
    f.levels.forEach((l) => chips.push(['lvl:' + l, l]));
    if (f.age) chips.push(['age', (AGE_BANDS.find((x) => x[0] === f.age) || [])[1] + ' años']);
    if (f.dur) chips.push(['dur', (DUR_BANDS.find((x) => x[0] === f.dur) || [])[1]]);
    if (f.video) chips.push(['video', 'Con video']);
    if (f.school) chips.push(['school', 'Para escuela']);
    if (f.sort !== 'recent') chips.push(['sort', 'Orden: ' + (SORTS.find((x) => x[0] === f.sort) || [])[1]]);
    return chips.map((c) => '<button class="chip on-chip" data-unfilter="' + esc(c[0]) + '" aria-label="Quitar filtro ' + esc(c[1]) + '">' + esc(c[1]) + ic('xmark') + '</button>').join('');
  }
  function removeFilter(sport, key) {
    const f = fx(sport);
    if (key.indexOf('lvl:') === 0) f.levels = f.levels.filter((l) => l !== key.slice(4));
    else if (key === 'age') f.age = '';
    else if (key === 'dur') f.dur = '';
    else if (key === 'video') f.video = false;
    else if (key === 'school') f.school = false;
    else if (key === 'sort') f.sort = 'recent';
  }
  function openFilters(sport) {
    const f = fx(sport);
    const draft = JSON.parse(JSON.stringify(f));
    const chipGroup = (name, opts, isOn) => '<div class="chips wrap static fchips" data-fgroup="' + name + '">' + opts.map((o) => '<button type="button" class="chip" data-fval="' + esc(o[0]) + '" aria-pressed="' + isOn(o[0]) + '">' + esc(o[1]) + '</button>').join('') + '</div>';
    const sheet = openSheet({
      title: 'Filtros',
      tint: sport,
      confirmLabel: 'Ver',
      bodyHTML:
        '<p class="group-label">Nivel</p>' + chipGroup('levels', LEVELS.map((l) => [l, l]), (v) => draft.levels.indexOf(v) >= 0) +
        '<p class="group-label">Edad de tus alumnos</p>' + chipGroup('age', AGE_BANDS, (v) => draft.age === v) +
        '<p class="group-label">Duración</p>' + chipGroup('dur', DUR_BANDS, (v) => draft.dur === v) +
        '<div class="group" style="margin-top:20px">' + switchRow('f-video', ic('video'), 'Con video', 'Tuyo, de Recomendados o de YouTube', draft.video, false) +
        switchRow('f-school', ic('people'), 'Para escuela', 'Para grupos de 25 a 35 alumnos', draft.school, false) + '</div>' +
        '<p class="group-label">Ordenar</p>' + segHTML('fsort', SORTS, draft.sort, 'Ordenar') +
        '<button type="button" class="btn tinted wide-btn" data-act="f-clear">Quitar filtros</button>',
      onConfirm: () => { S.fx[sport] = draft; S.sig = {}; renderEjercicios(); sheet.dismiss(); },
    });
    const root = sheet.body;
    function count() {
      const saved = S.fx[sport]; S.fx[sport] = draft;
      const n = applyFilters(exOf(sport), sport).length;
      S.fx[sport] = saved;
      $('[data-sh="ok"]', sheet.el).textContent = 'Ver ' + n;
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-fval]');
      if (b) {
        const g = b.closest('[data-fgroup]').dataset.fgroup; const v = b.dataset.fval;
        if (g === 'levels') draft.levels = draft.levels.indexOf(v) >= 0 ? draft.levels.filter((x) => x !== v) : draft.levels.concat(v);
        else draft[g] = v;
        $$('[data-fval]', b.parentNode).forEach((x) => x.setAttribute('aria-pressed', String(g === 'levels' ? draft.levels.indexOf(x.dataset.fval) >= 0 : draft[g] === x.dataset.fval)));
        haptic(4); count(); return;
      }
      if (e.target.closest('[data-act="f-clear"]')) {
        Object.assign(draft, { levels: [], age: '', dur: '', video: false, school: false, sort: 'recent' });
        S.fx[sport] = draft; S.sig = {}; renderEjercicios(); sheet.dismiss();
      }
    });
    root.addEventListener('change', (e) => {
      if (e.target.id === 'f-video') draft.video = e.target.checked;
      if (e.target.id === 'f-school') draft.school = e.target.checked;
      count();
    });
    bindSeg(root, 'fsort', (v) => { draft.sort = v; count(); });
    count();
  }

  // ---------------------------------------------------------------- grupos
  const groupClasses = (id) => S.classes.filter((c) => c.groupId === id);
  function shake(el) {
    const box = el.closest('.group') || el;
    box.classList.remove('shake');
    void box.offsetWidth;
    box.classList.add('shake');
    try { el.focus(); } catch (e) { /* */ }
  }
  // «Sub-12 A» → «12A», «3.º B» → «3B», «Selección» → «SE»: para la ficha del grupo.
  function groupShort(name) {
    const n = String(name || '').trim();
    const num = n.match(/\d+/);
    const letter = n.match(/(?:^|\s)([A-Za-zÁÉÍÓÚÑ])\s*$/);
    if (num) return (num[0] + (letter ? letter[1].toUpperCase() : '')).slice(0, 4);
    const w = n.split(/\s+/).filter(Boolean);
    return ((w[0] || '·').slice(0, w.length > 1 ? 1 : 2) + (w[1] ? w[1][0] : '')).toUpperCase();
  }
  function groupCellHTML(g) {
    const ns = studentsOf(g).length;
    const rate = groupRate(g);
    const t = todayStr();
    const next = groupClasses(g.id).filter((c) => c.date && c.date >= t).sort(byUpcoming)[0];
    const sp = SPORTS[g.sport] ? g.sport : 'futbol';
    const sub = [SPORTS[g.sport] ? SPORTS[g.sport].name : 'Fútbol y básquetbol', g.category].filter(Boolean).join(' · ');
    const facts = ['<span><b>' + ns + '</b>' + (ns === 1 ? 'alumno' : 'alumnos') + '</span>'];
    if (rate != null) facts.push('<span><b' + (rate < 75 ? ' class="low"' : '') + '>' + rate + '%</b>asistencia</span>');
    if (next) facts.push('<span><b>' + esc(fmtDay(next.date)) + '</b>próxima clase</span>');
    return '<button class="g-card" data-open-group="' + esc(g.id) + '" data-tint="' + groupTint(g) + '">' +
      '<span class="g-top"><span class="group-badge band-' + sp + '" aria-hidden="true">' + esc(groupShort(g.name)) + '</span>' +
      '<span class="g-name"><b>' + esc(g.name) + '</b><small>' + esc(sub) + '</small></span>' + ic('chevR', 'chev') + '</span>' +
      '<span class="g-facts">' + facts.join('') + '</span>' +
      (g.schedule ? '<span class="g-when">' + ic('clock') + esc(g.schedule) + '</span>' : '') + '</button>';
  }
  function openGroupEditor(opts) {
    const editing = !!opts.group;
    const g = editing ? plain(opts.group) : { id: uid(), name: '', sport: opts.sport || 'ambos', category: '', schedule: '', place: '', students: [], createdAt: Date.now() };
    if (!editing && S.backend && S.backend.me) g.authorId = S.backend.me;
    let dirty = false;
    const sheet = openSheet({
      title: editing ? 'Editar grupo' : 'Nuevo grupo',
      tint: groupTint(g),
      confirmLabel: editing ? 'Guardar' : 'Crear',
      isDirty: () => dirty,
      bodyHTML:
        '<div class="group"><input class="field-lg" id="gr-name" placeholder="Nombre (Ej. Sub-12 A, 3.º B)" aria-label="Nombre del grupo" maxlength="60" autocomplete="off" enterkeyhint="done" value="' + esc(g.name) + '"></div>' +
        '<p class="group-label">Deporte</p>' + segHTML('gsport', [['ambos', 'Ambos'], ['futbol', 'Fútbol'], ['basquet', 'Básquetbol']], SPORTS[g.sport] ? g.sport : 'ambos', 'Deporte') +
        '<div class="group">' +
        '<label class="row"><span class="k">' + ic('age') + 'Categoría</span><input id="gr-cat" placeholder="Ej. Sub-12, 4.º de primaria" aria-label="Categoría" maxlength="60" value="' + esc(g.category) + '"></label>' +
        '<label class="row"><span class="k">' + ic('clock') + 'Horario</span><input id="gr-sched" placeholder="Ej. Lun y Mié 16:00" aria-label="Horario" maxlength="60" value="' + esc(g.schedule) + '"></label>' +
        '<label class="row"><span class="k">' + ic('flag') + 'Lugar</span><input id="gr-place" placeholder="Ej. Cancha 2" aria-label="Lugar" maxlength="60" value="' + esc(g.place) + '"></label>' +
        '</div>',
      onConfirm: async () => {
        const root = sheet.body;
        const name = $('#gr-name', root).value.trim();
        if (!name) { shake($('#gr-name', root)); toast('Ponle nombre al grupo', 'pencil'); return; }
        Object.assign(g, { name, category: $('#gr-cat', root).value.trim(), schedule: $('#gr-sched', root).value.trim(), place: $('#gr-place', root).value.trim(), example: false, updatedAt: Date.now() });
        sheet.setBusy(true, 'Guardando…');
        const ok = await commit('groups', plain(g), editing ? opts.group : null);
        sheet.setBusy(false);
        if (!ok) return;
        dirty = false;
        sheet.dismiss();
        haptic(12);
        toast(editing ? 'Cambios guardados' : 'Grupo creado');
        if (!editing) {
          if (opts.onCreate) opts.onCreate(g);
          else setTimeout(() => openGroup(g.id), 260);
        }
      },
    });
    const root = sheet.body;
    root.addEventListener('input', () => { dirty = true; });
    bindSeg(root, 'gsport', (v) => { g.sport = v; sheet.setTint(groupTint(g)); dirty = true; });
  }

  function groupDetailHTML(g, showAll) {
    const t = todayStr();
    const cls = groupClasses(g.id).sort(byUpcoming);
    const up = cls.filter((c) => !c.date || c.date >= t);
    const past = cls.filter((c) => c.date && c.date < t);
    const given = cls.filter(classGiven);
    const minutes = given.reduce((sum, c) => sum + classTotal(c), 0);
    const rate = groupRate(g);
    const counts = {};
    given.forEach((c) => (c.items || []).forEach((it) => { const e = it.exId ? getEx(it.exId) : null; if (e && e.objective) counts[e.objective] = (counts[e.objective] || 0) + 1; }));
    const worked = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 8);
    const meta = [g.schedule ? ic('clock') + esc(g.schedule) : '', g.place ? ic('flag') + esc(g.place) : ''].filter(Boolean);
    const hasStudents = studentsOf(g).length > 0;
    return '<div class="d-head"><p class="d-eyebrow">' + esc([SPORTS[g.sport] ? SPORTS[g.sport].name : 'Fútbol y básquetbol', g.category].filter(Boolean).join(' · ')) + '</p>' +
      '<h1 class="d-title">' + esc(g.name) + '</h1>' + (meta.length ? '<p class="g-meta">' + meta.map((m) => '<span>' + m + '</span>').join('') + '</p>' : '') + '</div>' +
      '<div class="c-summary">' +
      (given.length || rate != null ? '<div class="c-figs' + (rate != null ? ' g3' : '') + '"><div><span class="num">' + given.length + '</span><span class="unit">' + (given.length === 1 ? 'clase dada' : 'clases dadas') + '</span></div>' +
      '<div><span class="num">' + minutes + '</span><span class="unit">minutos</span></div>' +
      (rate != null ? '<div><span class="num">' + rate + '%</span><span class="unit">asistencia</span></div>' : '') + '</div>' : '') +
      (S.canWrite ? '<div class="g-actions">' +
        (hasStudents ? '<button class="btn filled" data-act="roll-today">' + ic('check') + 'Pasar lista hoy</button>' : '<button class="btn filled" data-act="add-students">' + ic('plus') + 'Agregar alumnos</button>') +
        '<button class="btn tinted" data-act="new-class">' + ic('plus') + 'Nueva clase</button>' +
        (hasStudents ? '<button class="btn tinted" data-act="report">' + ic('doc') + 'Reporte</button>' : '') + '</div>'
        : hasStudents ? '<div class="g-actions"><button class="btn tinted" data-act="report">' + ic('doc') + 'Reporte de asistencia</button></div>' : '') +
      '</div>' +
      (up.length ? '<p class="group-label">Próximas</p><div class="list">' + up.map((c) => classCellHTML(c, true)).join('') + '</div>' : '') +
      (past.length ? '<p class="group-label">Anteriores</p><div class="list">' + past.map((c) => classCellHTML(c, true)).join('') + '</div>' : '') +
      (!cls.length ? '<p class="muted center">Este grupo todavía no tiene clases.</p>' : '') +
      (worked.length ? '<section class="sec"><h2>Lo que han trabajado</h2><div class="chips wrap static">' + worked.map((w) => '<span class="chip">' + esc(w) + ' <b>' + counts[w] + '</b></span>').join('') + '</div></section>' : '') +
      studentsSectionHTML(g, showAll) +
      (S.canWrite ? '<div class="group" style="margin-top:28px"><button class="row danger" data-act="delete-group">' + ic('trash') + 'Eliminar grupo</button></div>' : '');
  }

  function openGroup(id) {
    const g0 = getGroup(id);
    if (!g0) return;
    if (backToScreen('gr:' + id)) return;
    haptic(4);
    let showAll = false;
    const scr = pushScreen({ key: 'gr:' + id, tint: groupTint(g0), rightHTML: S.canWrite ? '<button class="glass-btn cap" data-act="edit-group">Editar</button>' : '' });
    function render() {
      const g = getGroup(id);
      if (!g) { popLayer(scr); return; }
      scr.el.dataset.tint = groupTint(g);
      scr.setTitle(g.name);
      scr.body.innerHTML = groupDetailHTML(g, showAll);
    }
    render();
    scr.refresh = render;
    scr.el.addEventListener('click', (ev) => {
      const oc = ev.target.closest('[data-open-class]');
      if (oc) { openClass(oc.dataset.openClass); return; }
      const stb = ev.target.closest('[data-student]');
      if (stb && S.canWrite) {
        const sid = stb.dataset.student;
        const st = studentsOf(getGroup(id)).find((x) => x.id === sid);
        if (!st) return;
        actionSheet({
          title: st.name,
          tint: groupTint(getGroup(id)),
          actions: [
            { label: 'Cambiar nombre', icon: 'pencil', onClick: () => openRenameStudent(id, sid) },
            { label: 'Quitar del grupo', icon: 'trash', danger: true, onClick: () => {
              const gPrev = getGroup(id);
              const idx = studentsOf(gPrev).findIndex((y) => y.id === sid);
              const removed = plain(st);
              mutateGroup(id, (x) => { x.students = x.students.filter((y) => y.id !== sid); }).then((ok) => {
                if (ok) toast('Quitaste a ' + st.name, 'trash', { label: 'Deshacer', onClick: () => mutateGroup(id, (x) => { if (!x.students.some((y) => y.id === removed.id)) x.students.splice(Math.max(0, idx), 0, removed); }) });
              });
            } },
          ],
        });
        return;
      }
      const a = ev.target.closest('[data-act]');
      const g = getGroup(id);
      if (!a || !g) return;
      switch (a.dataset.act) {
        case 'edit-group': openGroupEditor({ group: g }); break;
        case 'add-students': openAddStudents(id); break;
        case 'roll-today': rollCallToday(id); break;
        case 'report': openAttendanceReport(id); break;
        case 'show-all': showAll = true; render(); break;
        case 'new-class': openClassEditor({ sport: SPORTS[g.sport] ? g.sport : undefined, groupId: g.id }); break;
        case 'delete-group': {
          const cls = groupClasses(id);
          const lists = cls.filter((c) => c.attendance && Object.keys(c.attendance).length).length;
          const n = studentsOf(g).length;
          actionSheet({
            title: '¿Eliminar el grupo «' + g.name + '»?',
            message: (n ? 'Se borra la lista de ' + plural(n, 'alumno', 'alumnos') + (lists ? ' y ya no podrás ver la asistencia de ' + plural(lists, 'clase', 'clases') : '') + '. ' : '') + 'Las clases se quedan, sin grupo.',
            actions: [{ label: 'Eliminar grupo', danger: true, onClick: async () => {
              const prevG = plain(g);
              const prevCls = cls.map(plain);
              S.groups = S.groups.filter((x) => x.id !== id);
              const nextCls = prevCls.map((c) => Object.assign(plain(c), { groupId: null, updatedAt: Date.now() }));
              nextCls.forEach((c) => replaceLocal('classes', c));
              renderAll(); refreshScreens();
              try {
                for (const c of nextCls) await S.backend.saveClass(c);
                await S.backend.deleteGroup(id);
              } catch (e) {
                replaceLocal('groups', prevG); prevCls.forEach((c) => replaceLocal('classes', c));
                renderAll(); refreshScreens(); showError(e, 'No se pudo eliminar');
                return;
              }
              toast('Grupo eliminado', 'trash', { label: 'Deshacer', onClick: async () => {
                try {
                  replaceLocal('groups', prevG); await S.backend.saveGroup(prevG);
                  for (const c of prevCls) { replaceLocal('classes', c); await S.backend.saveClass(c); }
                  renderAll(); refreshScreens(); toast('Grupo recuperado');
                } catch (e) { showError(e); }
              } });
            } }],
          });
          break;
        }
        default: break;
      }
    });
  }

  // ---------------------------------------------------------------- asistencia
  const ATT = {
    p: { label: 'Asistió', glyph: 'check' },
    t: { label: 'Retardo', glyph: null },
    f: { label: 'Falta', glyph: 'xmark' },
  };
  // La lista queda en el orden en que se capturó (como la lista oficial del grupo).
  const studentsOf = (g) => (g && Array.isArray(g.students) ? g.students : []);
  function attendanceCounts(c, g) {
    const att = (c && c.attendance) || {};
    const out = { p: 0, t: 0, f: 0, total: 0, marked: 0 };
    studentsOf(g).forEach((s) => {
      out.total++;
      const v = att[s.id];
      if (v === 'p' || v === 't' || v === 'f') { out[v]++; out.marked++; }
    });
    return out;
  }
  function studentRate(g, sid) {
    let marked = 0; let ok = 0;
    groupClasses(g.id).forEach((c) => {
      const v = c.attendance && c.attendance[sid];
      if (v) { marked++; if (v === 'p' || v === 't') ok++; }
    });
    return marked ? Math.round((ok * 100) / marked) : null;
  }
  function groupRate(g) {
    let marked = 0; let ok = 0;
    const ids = new Set(studentsOf(g).map((s) => s.id));
    groupClasses(g.id).forEach((c) => {
      Object.keys(c.attendance || {}).forEach((sid) => {
        if (!ids.has(sid)) return;
        marked++;
        if (c.attendance[sid] === 'p' || c.attendance[sid] === 't') ok++;
      });
    });
    return marked ? Math.round((ok * 100) / marked) : null;
  }
  function mutateGroup(id, fn) {
    const cur = getGroup(id);
    if (!cur) return Promise.resolve(false);
    const g = plain(cur);
    g.students = studentsOf(g);
    fn(g);
    g.example = false;
    g.updatedAt = Date.now();
    return commit('groups', g, cur);
  }

  function attendanceSectionHTML(c) {
    const g = getGroup(c.groupId);
    if (!g) return '';
    let inner;
    if (!studentsOf(g).length) {
      inner = '<p class="muted">El grupo ' + esc(g.name) + ' todavía no tiene alumnos.</p>' +
        (S.canWrite ? '<button class="btn tinted" data-act="add-students">' + ic('plus') + 'Agregar alumnos</button>' : '');
    } else {
      const k = attendanceCounts(c, g);
      inner = k.marked
        ? '<p class="att-line"><b>' + (k.p + k.t) + ' de ' + k.marked + '</b> asistieron' + (k.t ? ' · ' + plural(k.t, 'retardo', 'retardos') : '') + (k.f ? ' · ' + plural(k.f, 'falta', 'faltas') : '') + '</p>' +
          (S.canWrite ? '<button class="btn tinted" data-act="attendance">' + ic('check') + 'Editar lista</button>' : '')
        : '<p class="muted">Todavía no has pasado lista.</p>' + (S.canWrite ? '<button class="btn tinted" data-act="attendance">' + ic('check') + 'Pasar lista</button>' : '');
    }
    return '<section class="sec"><h2>Asistencia</h2><div class="att-card">' + inner + '</div></section>';
  }

  function rollCallToday(groupId) {
    const g = getGroup(groupId);
    if (!g) return;
    const t = todayStr();
    const todays = S.classes.filter((x) => x.groupId === groupId && x.date === t);
    const c = todays.find((x) => (x.items || []).length) || todays[0];
    if (c) { openAttendance(c.id); return; }
    // Si hoy no hay clase de este grupo, se crea al guardar la lista (si la descartas, no queda nada).
    const draft = { id: uid(), name: 'Clase del ' + fmtLong(Date.now()), sport: SPORTS[g.sport] ? g.sport : S.sport || 'futbol', date: t, groupId, items: [], notes: '', createdAt: Date.now(), updatedAt: Date.now() };
    if (S.backend && S.backend.me) draft.authorId = S.backend.me;
    openAttendance(draft);
  }

  const openRolls = new Set();
  function openAttendance(classRef, z) {
    const draft = typeof classRef === 'object' ? classRef : null;
    const classId = draft ? draft.id : classRef;
    const c = draft || getClass(classId);
    const g = c && getGroup(c.groupId);
    if (!c || !g) return;
    const rollKey = draft ? 'draft:' + c.groupId + ':' + c.date : classId;
    if (openRolls.has(rollKey)) return;
    openRolls.add(rollKey);
    const att = Object.assign({}, c.attendance || {});
    let dirty = false;
    const list = studentsOf(g);
    const sheet = openSheet({
      title: 'Pasar lista',
      tint: SPORTS[c.sport] ? c.sport : 'futbol',
      confirmLabel: 'Guardar',
      wide: true,
      z,
      isDirty: () => dirty,
      discardTitle: '¿Descartar la lista?',
      bodyHTML:
        '<p class="att-head"><b>' + esc(g.name) + '</b> · ' + esc(fmtDay(c.date)) + '</p>' +
        '<p class="att-legend"><span>' + ic('check') + ' asistió</span><span><b>R</b> retardo</span><span>' + ic('xmark') + ' falta</span></p>' +
        '<p class="hint">Si casi todos vinieron, toca «Marcar a todos presentes» y luego cambia a los que faltaron.</p>' +
        '<button type="button" class="btn tinted att-all" data-att-all>' + ic('check') + 'Marcar a todos presentes</button>' +
        '<p class="att-sum" data-ref="sum" aria-live="polite"></p>' +
        '<div class="list att-list">' + list.map((s, n) =>
          '<div class="att-row" data-sid="' + esc(s.id) + '"><span class="att-n">' + (n + 1) + '</span><span class="att-name">' + esc(s.name) + '</span>' +
          '<span class="att-btns" role="group" aria-label="' + esc(s.name) + '">' +
          ['p', 't', 'f'].map((v) => '<button type="button" class="att-b att-' + v + '" data-v="' + v + '" aria-pressed="false" aria-label="' + esc(s.name) + ': ' + ATT[v].label.toLowerCase() + '">' + (ATT[v].glyph ? ic(ATT[v].glyph) : 'R') + '</button>').join('') +
          '</span></div>').join('') + '</div>',
      onClose: () => openRolls.delete(rollKey),
      onConfirm: async () => {
        const clean = {};
        Object.keys(att).forEach((k) => { if (att[k]) clean[k] = att[k]; });
        sheet.setBusy(true, 'Guardando…');
        const ok = draft && !getClass(classId)
          ? await commit('classes', Object.assign(plain(draft), { attendance: clean, attendanceAt: Date.now(), updatedAt: Date.now() }), null)
          : await mutateClass(classId, (x) => { x.attendance = clean; x.attendanceAt = Date.now(); });
        sheet.setBusy(false);
        if (!ok) return;
        dirty = false;
        sheet.dismiss();
        haptic(12);
        toast('Lista guardada');
      },
    });
    const root = sheet.body;
    function paint(cascade) {
      $$('.att-row', root).forEach((row, n) => {
        const v = att[row.dataset.sid] || '';
        $$('.att-b', row).forEach((b) => {
          const on = b.dataset.v === v;
          if (on && b.getAttribute('aria-pressed') !== 'true') b.style.animationDelay = cascade ? Math.min(n, 30) * 28 + 'ms' : '';
          b.setAttribute('aria-pressed', String(on));
        });
        row.dataset.state = v;
      });
      const k = { p: 0, t: 0, f: 0 };
      list.forEach((s) => { const v = att[s.id]; if (k[v] !== undefined) k[v]++; });
      const none = list.length - k.p - k.t - k.f;
      $('[data-ref="sum"]', root).textContent = (k.p + k.t) + ' de ' + list.length + ' asistieron' + (k.t ? ' · ' + plural(k.t, 'retardo', 'retardos') : '') + (k.f ? ' · ' + plural(k.f, 'falta', 'faltas') : '') + (none ? ' · ' + none + ' sin marcar' : '');
    }
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-att-all]')) {
        list.forEach((s) => { if (!att[s.id]) att[s.id] = 'p'; });
        dirty = true; haptic(10); paint(true); return;
      }
      const b = e.target.closest('.att-b');
      if (!b) return;
      const sid = b.closest('.att-row').dataset.sid;
      att[sid] = att[sid] === b.dataset.v ? '' : b.dataset.v;
      dirty = true; haptic(5); paint();
    });
    paint();
  }

  function openAddStudents(groupId) {
    const g = getGroup(groupId);
    if (!g) return;
    const sheet = openSheet({
      title: 'Agregar alumnos',
      tint: groupTint(g),
      confirmLabel: 'Agregar',
      isDirty: () => !!$('#st-names', sheet.body).value.trim(),
      bodyHTML:
        '<p class="group-label" id="lbl-st">Un nombre por línea, en el orden de tu lista</p>' +
        '<div class="group"><textarea id="st-names" aria-labelledby="lbl-st" placeholder="Ana Martínez&#10;Diego López&#10;Valeria Ruiz" style="min-height:220px" autocapitalize="words"></textarea></div>' +
        '<p class="muted" style="margin:0 16px">Puedes pegar la lista completa de tu grupo.</p>',
      onConfirm: async () => {
        const ta = $('#st-names', sheet.body);
        const have = new Set(studentsOf(getGroup(groupId)).map((s) => norm(s.name)));
        const names = []; let skipped = 0;
        ta.value.split(/\r?\n/).map((x) => x.replace(/^\s*\d{1,3}\s*[.)\-]\s*/, '').replace(/\s+/g, ' ').trim()).filter(Boolean).forEach((n) => {
          if (have.has(norm(n))) { skipped++; return; }
          names.push(n.slice(0, 80));
        });
        if (!names.length) { shake(ta); toast(skipped ? 'Esos alumnos ya están en el grupo' : 'Escribe al menos un nombre', 'pencil'); return; }
        const ok = await mutateGroup(groupId, (x) => { names.forEach((n) => x.students.push({ id: uid(), name: n })); });
        if (!ok) return;
        ta.value = '';
        sheet.dismiss();
        haptic(12);
        toast((names.length === 1 ? 'Alumno agregado' : names.length + ' alumnos agregados') + (skipped ? ', ' + skipped + ' ya estaban' : ''));
      },
    });
    setTimeout(() => { try { $('#st-names', sheet.body).focus({ preventScroll: true }); } catch (e) { /* */ } }, 450);
  }

  function openRenameStudent(groupId, sid) {
    const g = getGroup(groupId);
    const st = studentsOf(g).find((s) => s.id === sid);
    if (!st) return;
    const sheet = openSheet({
      title: 'Cambiar nombre',
      tint: groupTint(g),
      confirmLabel: 'Guardar',
      isDirty: () => $('#st-name', sheet.body).value.trim() !== st.name,
      bodyHTML: '<div class="group"><input class="field-lg" id="st-name" aria-label="Nombre del alumno" maxlength="80" autocomplete="off" value="' + esc(st.name) + '"></div>',
      onConfirm: async () => {
        const inp = $('#st-name', sheet.body);
        const name = inp.value.replace(/\s+/g, ' ').trim();
        if (!name) { shake(inp); return; }
        const ok = await mutateGroup(groupId, (x) => { const s = x.students.find((y) => y.id === sid); if (s) s.name = name; });
        if (!ok) return;
        sheet.dismiss();
        toast('Nombre actualizado');
      },
    });
  }

  function studentsSectionHTML(g, showAll) {
    const list = studentsOf(g);
    const limit = showAll || list.length <= 12 ? list.length : 10;
    const rows = list.slice(0, limit).map((s, n) => {
      const r = studentRate(g, s.id);
      return '<button class="cell st-row" data-student="' + esc(s.id) + '"' + (S.canWrite ? '' : ' disabled') + '><span class="att-n">' + (n + 1) + '</span>' +
        '<span class="txt"><span class="t1">' + esc(s.name) + '</span></span>' +
        (r == null ? '' : '<span class="st-rate' + (r < 75 ? ' low' : '') + '">' + r + '%' + (r < 75 ? ' ' + ic('warn') : '') + '</span>') + '</button>';
    }).join('');
    const anyRate = list.some((x) => studentRate(g, x.id) != null);
    return '<div class="section-head"><h2>Alumnos' + (list.length ? ' <small class="muted">' + list.length + '</small>' : '') + '</h2><span class="muted small">' + (anyRate ? 'Asistencia' : '') + '</span></div>' +
      '<div class="list st-list">' + rows +
      (limit < list.length ? '<button class="cell add-row" data-act="show-all">' + ic('down') + '<span>Ver los ' + list.length + ' alumnos</span></button>' : '') +
      (S.canWrite ? '<button class="cell add-row" data-act="add-students">' + ic('plus') + '<span>Agregar alumnos</span></button>' : '') +
      (!list.length && !S.canWrite ? '<p class="muted pad">Sin alumnos.</p>' : '') + '</div>';
  }

  // ---------------------------------------------------------------- reporte de asistencia (PDF)
  const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function monthRange(offset) {
    const d = new Date();
    return [dayStr(new Date(d.getFullYear(), d.getMonth() + offset, 1)), dayStr(new Date(d.getFullYear(), d.getMonth() + offset + 1, 0))];
  }
  // Trimestres aproximados del calendario de la SEP; si tu escuela usa otras fechas, elige «Fechas».
  function trimesters() {
    const d = new Date();
    const t = todayStr();
    const y = t >= d.getFullYear() + '-08-25' ? d.getFullYear() : d.getFullYear() - 1;
    const cy = ' ' + y + '-' + (y + 1);
    return [
      ['1', '1.er', y + '-08-25', y + '-11-30', 'Primer trimestre' + cy],
      ['2', '2.º', y + '-12-01', (y + 1) + '-03-31', 'Segundo trimestre' + cy],
      ['3', '3.er', (y + 1) + '-04-01', (y + 1) + '-07-20', 'Tercer trimestre' + cy],
    ];
  }
  function currentTrimester() {
    const t = todayStr();
    const tr = trimesters();
    const hit = tr.find((x) => t >= x[2] && t <= x[3]);
    return hit ? hit[0] : '3';
  }
  function periodRange(kind, tri, from, to) {
    if (kind === 'mes') return monthRange(0);
    if (kind === 'anterior') return monthRange(-1);
    if (kind === 'trimestre') { const x = trimesters().find((q) => q[0] === tri) || trimesters()[0]; return [x[2], x[3]]; }
    return [from || '', to || ''];
  }
  const classDay = (c) => c.date || (c.attendanceAt ? dayStr(new Date(c.attendanceAt)) : '');
  function reportClasses(g, from, to) {
    return groupClasses(g.id)
      .filter((c) => c.attendance && Object.keys(c.attendance).length && classDay(c) && (!from || classDay(c) >= from) && (!to || classDay(c) <= to))
      .sort((a, b) => (classDay(a) < classDay(b) ? -1 : classDay(a) > classDay(b) ? 1 : 0));
  }
  function fmtRange(from, to) {
    const a = parseDay(from); const b = parseDay(to);
    if (!a && !b) return 'Todas las fechas';
    if (!a) return 'Hasta el ' + b.getDate() + ' de ' + MONTHS_LONG[b.getMonth()] + ' de ' + b.getFullYear();
    if (!b) return 'Desde el ' + a.getDate() + ' de ' + MONTHS_LONG[a.getMonth()] + ' de ' + a.getFullYear();
    if (a.getFullYear() === b.getFullYear()) {
      if (a.getMonth() === b.getMonth()) return a.getDate() + ' al ' + b.getDate() + ' de ' + MONTHS_LONG[a.getMonth()] + ' de ' + a.getFullYear();
      return a.getDate() + ' de ' + MONTHS_LONG[a.getMonth()] + ' al ' + b.getDate() + ' de ' + MONTHS_LONG[b.getMonth()] + ' de ' + a.getFullYear();
    }
    return a.getDate() + ' de ' + MONTHS_LONG[a.getMonth()] + ' de ' + a.getFullYear() + ' al ' + b.getDate() + ' de ' + MONTHS_LONG[b.getMonth()] + ' de ' + b.getFullYear();
  }
  function reportStats(g, cls) {
    const rows = studentsOf(g).map((s, i) => {
      const r = { s, n: i + 1, p: 0, t: 0, f: 0 };
      cls.forEach((c) => { const v = c.attendance[s.id]; if (v === 'p' || v === 't' || v === 'f') r[v]++; });
      const m = r.p + r.t + r.f;
      r.rate = m ? Math.round(((r.p + r.t) * 100) / m) : null;
      return r;
    });
    const tot = rows.reduce((a, r) => ({ p: a.p + r.p, t: a.t + r.t, f: a.f + r.f }), { p: 0, t: 0, f: 0 });
    const m = tot.p + tot.t + tot.f;
    tot.rate = m ? Math.round(((tot.p + tot.t) * 100) / m) : null;
    return { rows, tot };
  }
  function reportInfo() { try { return JSON.parse(pref.get('report-info') || '{}') || {}; } catch (e) { return {}; } }

  function openAttendanceReport(groupId) {
    const g = getGroup(groupId);
    if (!g) return;
    let kind = 'mes';
    let tri = currentTrimester();
    const info = reportInfo();
    const tr = trimesters();
    const sheet = openSheet({
      title: 'Reporte de asistencia',
      tint: groupTint(g),
      confirmLabel: 'Crear PDF',
      bodyHTML:
        '<p class="att-head"><b>' + esc(g.name) + '</b> · ' + plural(studentsOf(g).length, 'alumno', 'alumnos') + '</p>' +
        '<p class="group-label">Periodo</p>' + segHTML('period', [['mes', 'Este mes'], ['anterior', 'Mes pasado'], ['trimestre', 'Trimestre'], ['fechas', 'Otras fechas']], kind, 'Periodo') +
        '<div data-ref="tri" hidden>' + segHTML('tri', tr.map((x) => [x[0], x[1]]), tri, 'Trimestre') + '</div>' +
        '<div class="group" data-ref="dates" hidden>' +
        '<label class="row"><span class="k">' + ic('calendar') + 'Desde</span><input id="rp-from" type="date" aria-label="Desde" value="' + monthRange(0)[0] + '"></label>' +
        '<label class="row"><span class="k">' + ic('calendar') + 'Hasta</span><input id="rp-to" type="date" aria-label="Hasta" value="' + todayStr() + '"></label></div>' +
        '<div class="att-card" data-ref="preview"></div>' +
        '<p class="group-label">Datos que salen en el reporte</p><div class="group">' +
        '<label class="row"><span class="k">' + ic('flag') + 'Escuela o club</span><input id="rp-school" placeholder="Opcional" aria-label="Escuela o club" maxlength="80" value="' + esc(info.school || '') + '"></label>' +
        '<label class="row"><span class="k">' + ic('age') + 'Docente</span><input id="rp-teacher" placeholder="Opcional" aria-label="Nombre del docente" maxlength="80" value="' + esc(info.teacher || '') + '"></label></div>' +
        '<p class="muted" style="margin:0 16px;font-size:14px">Tamaño carta, con número de lista, totales por alumno y espacio para firma.</p>',
      onConfirm: async () => {
        const r = range();
        const cls = reportClasses(g, r[0], r[1]);
        if (!cls.length) return;
        const inf = { school: $('#rp-school', sheet.body).value.trim(), teacher: $('#rp-teacher', sheet.body).value.trim() };
        pref.set('report-info', JSON.stringify(inf));
        sheet.setBusy(true, 'Creando el PDF…');
        await exportAttendancePDF(getGroup(groupId) || g, cls, r[0], r[1], inf, kind === 'trimestre' ? tr.find((x) => x[0] === tri)[4] : '');
        sheet.setBusy(false);
        sheet.dismiss();
      },
    });
    const root = sheet.body;
    function range() { return periodRange(kind, tri, $('#rp-from', root).value, $('#rp-to', root).value); }
    function preview() {
      const r = range();
      const cls = reportClasses(g, r[0], r[1]);
      const st = reportStats(g, cls);
      if (r[0] && r[1] && r[0] > r[1]) { $('[data-ref="preview"]', root).innerHTML = '<p class="muted">La fecha «Desde» es después de «Hasta».</p>'; sheet.setConfirm(false); return; }
      $('[data-ref="preview"]', root).innerHTML = '<p class="rp-range">' + esc(fmtRange(r[0], r[1])) + '</p>' + (cls.length
        ? '<p class="att-line"><b>' + plural(cls.length, 'clase', 'clases') + '</b> con lista' + (st.tot.rate != null ? ' · ' + st.tot.rate + '% de asistencia' : '') + ' · ' + plural(st.tot.f, 'falta', 'faltas') + '</p>'
        : '<p class="muted">No pasaste lista en este periodo. Elige otras fechas.</p>');
      sheet.setConfirm(cls.length > 0);
    }
    bindSeg(root, 'period', (v) => { kind = v; $('[data-ref="dates"]', root).hidden = v !== 'fechas'; $('[data-ref="tri"]', root).hidden = v !== 'trimestre'; preview(); });
    bindSeg(root, 'tri', (v) => { tri = v; preview(); });
    root.addEventListener('input', preview);
    root.addEventListener('change', preview);
    preview();
  }

  async function exportAttendancePDF(g, cls, from, to, info, periodLabel) {
    let JsPDF;
    try { JsPDF = await loadJsPDF(); } catch (e) { alertBox('No se pudo crear el PDF', 'Vuelve a intentarlo en un momento.'); return; }
    info = info || {};
    try {
      const doc = safePDF(new JsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' }));
      const W = 792; const H = 612; const M = 36;
      const OK = [30, 158, 79]; const WARN = [168, 100, 0]; const BAD = [200, 40, 30];
      const ink = [17, 17, 20]; const grey = [100, 100, 108]; const faint = [190, 190, 198];
      const { rows, tot } = reportStats(g, cls);
      const numW = 22; const nameW = 170; const totCols = [['Asist.', 'p'], ['Ret.', 't'], ['Faltas', 'f'], ['%', 'rate']]; const totW = 38;
      const rowH = 16.5;
      const tableTop = 150;
      const avail = W - 2 * M - numW - nameW - totCols.length * totW;
      const perCols = Math.max(1, Math.floor(avail / 21));
      const perRows = Math.max(1, Math.floor((H - M - 92 - tableTop) / rowH));
      const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out.length ? out : [[]]; };
      const colChunks = chunk(cls, perCols);
      const rowChunks = chunk(rows, perRows);
      const rateColor = (r) => (r == null ? grey : r >= 75 ? ink : r >= 60 ? WARN : BAD);
      const fit = (text, w) => { let t = String(text); if (doc.getTextWidth(t) <= w) return t; while (t.length > 1 && doc.getTextWidth(t + '…') > w) t = t.slice(0, -1); return t + '…'; };

      function header() {
        let y = M + 8;
        const wMax = W - 2 * M;
        if (info.school) { doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...ink); doc.text(fit(info.school, wMax), M, y); y += 22; } else y += 8;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...ink);
        doc.text(fit('Asistencia: ' + g.name, wMax), M, y + 6);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...grey);
        const meta = doc.splitTextToSize([periodLabel, fmtRange(from, to), plural(cls.length, 'clase', 'clases'), plural(rows.length, 'alumno', 'alumnos'), g.category || '', g.schedule || '', info.teacher ? 'Docente: ' + info.teacher : ''].filter(Boolean).join('   ·   '), wMax).slice(0, 2);
        doc.text(meta, M, y + 24);
        doc.text('Asistencia promedio: ' + (tot.rate != null ? tot.rate + '%' : '—') + '   ·   Retardos: ' + tot.t + '   ·   Faltas: ' + tot.f, M, y + 28 + meta.length * 12);
      }
      function table(colSet, rowSet, last) {
        const colW = Math.min(30, avail / Math.max(1, colSet.length));
        const x0 = M; const xn = M + numW; const xd = xn + nameW; const xt = xd + colSet.length * colW;
        const right = xt + totCols.length * totW;
        let y = tableTop;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...grey);
        doc.text('#', x0 + numW / 2, y - 6, { align: 'center' });
        doc.text('Alumno', xn + 4, y - 6);
        colSet.forEach((c, i) => {
          const d = parseDay(classDay(c));
          const cx = xd + i * colW + colW / 2;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...ink);
          doc.text(String(d ? d.getDate() : ''), cx, y - 14, { align: 'center' });
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...grey);
          doc.text(d ? MONTHS[d.getMonth()].toLowerCase() : '', cx, y - 5, { align: 'center' });
        });
        totCols.forEach((t, i) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...grey); doc.text(t[0], xt + i * totW + totW / 2, y - 6, { align: 'center' }); });
        doc.setDrawColor(...faint); doc.setLineWidth(0.6); doc.line(x0, y, right, y);
        rowSet.forEach((r, ri) => {
          if (ri % 2 === 1) { doc.setFillColor(245, 245, 247); doc.rect(x0, y, right - x0, rowH, 'F'); }
          const ty = y + 11.5;
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...grey);
          doc.text(String(r.n), x0 + numW / 2, ty, { align: 'center' });
          doc.setFontSize(10); doc.setTextColor(...ink);
          doc.text(fit(r.s.name, nameW - 8), xn + 4, ty);
          colSet.forEach((c, i) => {
            const v = c.attendance[r.s.id];
            const cx = xd + i * colW + colW / 2;
            if (v === 'p') { doc.setFillColor(...OK); doc.circle(cx, y + rowH / 2, 3.2, 'F'); } else if (v === 't') {
              doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WARN); doc.text('R', cx, ty, { align: 'center' });
            } else if (v === 'f') {
              doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...BAD); doc.text('F', cx, ty, { align: 'center' });
            } else { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...faint); doc.text('–', cx, ty, { align: 'center' }); }
          });
          totCols.forEach((t, i) => {
            const val = r[t[1]];
            const cx = xt + i * totW + totW / 2;
            doc.setFont('helvetica', t[1] === 'rate' ? 'bold' : 'normal'); doc.setFontSize(10);
            doc.setTextColor(...(t[1] === 'rate' ? rateColor(val) : t[1] === 'f' && val ? BAD : ink));
            doc.text(val == null ? '—' : t[1] === 'rate' ? val + '%' : String(val), cx, ty, { align: 'center' });
          });
          y += rowH;
        });
        doc.setDrawColor(...faint); doc.line(x0, y, right, y);
        if (last) {
          const ty = y + 13;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...grey);
          doc.text('Asistieron', xn + 4, ty);
          colSet.forEach((c, i) => {
            const n = rows.filter((r) => { const v = c.attendance[r.s.id]; return v === 'p' || v === 't'; }).length;
            doc.setTextColor(...ink);
            doc.text(String(n), xd + i * colW + colW / 2, ty, { align: 'center' });
          });
        }
        const ly = H - M - 40;
        doc.setFillColor(...OK); doc.circle(M + 3.2, ly - 3, 3.2, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...grey);
        doc.text('Asistió', M + 10, ly);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...WARN); doc.text('R', M + 50, ly);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...grey); doc.text('Retardo (cuenta como asistencia)', M + 58, ly);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...BAD); doc.text('F', M + 196, ly);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...grey); doc.text('Falta', M + 204, ly);
        doc.setTextColor(...faint); doc.text('–', M + 236, ly);
        doc.setTextColor(...grey); doc.text('Sin registro', M + 244, ly);
        // firma
        const sx = W - M - 230;
        doc.setDrawColor(...ink); doc.setLineWidth(0.7); doc.line(sx, H - M - 30, W - M, H - M - 30);
        doc.setFontSize(9); doc.setTextColor(...grey);
        doc.text(info.teacher ? fit(info.teacher, 228) : 'Nombre y firma del docente', sx + 115, H - M - 18, { align: 'center' });
      }
      let first = true;
      colChunks.forEach((colSet) => {
        rowChunks.forEach((rowSet, ri) => {
          if (!first) doc.addPage();
          first = false;
          header();
          table(colSet, rowSet, ri === rowChunks.length - 1);
        });
      });
      const pages = doc.getNumberOfPages();
      if (pages > 1) {
        for (let pg = 1; pg <= pages; pg++) {
          doc.setPage(pg);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...grey);
          doc.text('Página ' + pg + ' de ' + pages, M, H - M);
        }
      }
      const a = parseDay(from);
      const label = periodLabel || (a && isWholeMonth(from, to) ? MONTHS_LONG[a.getMonth()] + ' ' + a.getFullYear() : fmtRange(from, to));
      const name = ('Asistencia - ' + cutText(g.name, 40) + ' - ' + label).replace(/[\\/:*?"<>|º°ª]+/g, '') + '.pdf';
      await saveFile(doc.output('blob'), name);
    } catch (e) {
      alertBox('No se pudo crear el PDF', 'Vuelve a intentarlo en un momento.');
    }
  }
  function isWholeMonth(from, to) {
    const a = parseDay(from); const b = parseDay(to);
    return a && b && a.getDate() === 1 && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() && new Date(b.getFullYear(), b.getMonth() + 1, 0).getDate() === b.getDate();
  }

  // ---------------------------------------------------------------- exportar e importar (archivo .zip)
  // Un archivo .zip con cancha.json (ejercicios, clases, grupos) y la carpeta media/ con videos y fotos.
  // Se manda por AirDrop o WhatsApp y sirve como respaldo en Archivos / iCloud Drive.
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(buf, crc) {
    const u = new Uint8Array(buf);
    for (let i = 0; i < u.length; i++) crc = CRC_TABLE[(crc ^ u[i]) & 0xFF] ^ (crc >>> 8);
    return crc;
  }
  const ZIP_CHUNK = 4 * 1024 * 1024;
  async function buildZip(files, onProgress) {
    const enc = new TextEncoder();
    const now = new Date();
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const total = files.reduce((s, f) => s + (typeof f.data === 'string' ? f.data.length : f.data.size), 0) || 1;
    const parts = []; const central = [];
    let offset = 0; let done = 0;
    for (const f of files) {
      const blob = typeof f.data === 'string' ? new Blob([enc.encode(f.data)]) : f.data;
      const name = enc.encode(f.name);
      let crc = 0xFFFFFFFF;
      for (let pos = 0; pos < blob.size; pos += ZIP_CHUNK) {
        crc = crc32(await blob.slice(pos, pos + ZIP_CHUNK).arrayBuffer(), crc);
        done += Math.min(ZIP_CHUNK, blob.size - pos);
        if (onProgress) onProgress(done / total);
      }
      crc = (crc ^ 0xFFFFFFFF) >>> 0;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, blob.size, true); lh.setUint32(22, blob.size, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, name, blob);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, blob.size, true); ch.setUint32(24, blob.size, true);
      ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true);
      ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + blob.size;
    }
    const cdSize = central.reduce((s, p) => s + p.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(4, 0, true); end.setUint16(6, 0, true);
    end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true); end.setUint16(20, 0, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }
  async function readZip(file) {
    const tailLen = Math.min(file.size, 65557);
    const tail = new DataView(await file.slice(file.size - tailLen).arrayBuffer());
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--) { if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error('not-zip');
    const count = tail.getUint16(eocd + 10, true);
    const cdSize = tail.getUint32(eocd + 12, true);
    const cdOff = tail.getUint32(eocd + 16, true);
    const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
    const dec = new TextDecoder();
    const entries = {};
    let p = 0;
    for (let i = 0; i < count; i++) {
      if (cd.getUint32(p, true) !== 0x02014b50) throw new Error('not-zip');
      const nlen = cd.getUint16(p + 28, true); const xlen = cd.getUint16(p + 30, true); const clen = cd.getUint16(p + 32, true);
      const name = dec.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nlen));
      entries[name] = { method: cd.getUint16(p + 10, true), csize: cd.getUint32(p + 20, true), lho: cd.getUint32(p + 42, true) };
      p += 46 + nlen + xlen + clen;
    }
    async function blobOf(name, type) {
      const e = entries[name] || entries[Object.keys(entries).find((k) => k.endsWith('/' + name) && k.indexOf('__MACOSX') < 0)];
      if (!e) return null;
      const lh = new DataView(await file.slice(e.lho, e.lho + 30).arrayBuffer());
      const start = e.lho + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
      const raw = file.slice(start, start + e.csize);
      if (e.method === 0) return new Blob([raw], { type: type || '' });
      if (e.method === 8 && typeof DecompressionStream !== 'undefined') {
        const out = await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
        return new Blob([out], { type: type || '' });
      }
      throw new Error('zip-method');
    }
    return { blobOf };
  }

  const EXT = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/x-m4v': 'm4v', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const safeName = (s) => cutText(String(s || '').replace(/[\\/:*?"<>|º°ª]+/g, '').replace(/\s+/g, ' ').trim(), 60);
  function shortDate() { const d = new Date(); return d.getDate() + ' ' + MONTHS[d.getMonth()].toLowerCase() + ' ' + d.getFullYear(); }
  // El .zip usa posiciones de 32 bits: más de ~4 GB no se puede abrir después.
  const ZIP_MAX = 3.8e9;

  async function buildExport(opt, onProgress) {
    const exercises = S.exercises.filter((e) => opt.exIds.has(e.id)).map((e) => plain(e));
    const classes = S.classes.filter((c) => opt.classIds.has(c.id)).map((c) => {
      const x = plain(c);
      if (!opt.groupIds.has(x.groupId)) { delete x.attendance; delete x.attendanceAt; delete x.groupId; }
      return x;
    });
    const groups = S.groups.filter((g) => opt.groupIds.has(g.id)).map((g) => plain(g));
    const want = [];
    exercises.forEach((e) => { if (e.thumbId) want.push(e.thumbId); if (opt.withMedia && e.mediaId) want.push(e.mediaId); });
    const media = {}; const files = [];
    let bytes = 0;
    for (let i = 0; i < want.length; i++) {
      if (onProgress) onProgress(i / Math.max(1, want.length) * 0.5, 'Reuniendo videos y fotos · ' + (i + 1) + ' de ' + want.length);
      const blob = await S.backend.mediaBlob(want[i]).catch(() => null);
      if (!blob || !blob.size) continue;
      bytes += blob.size;
      if (bytes > ZIP_MAX) { const err = new Error('too-big'); err.code = 'too-big'; throw err; }
      const type = (blob.type || '').split(';')[0] || 'application/octet-stream';
      const path = 'media/' + String(want[i]).replace(/[^A-Za-z0-9_-]/g, '') + '.' + (EXT[type] || 'bin');
      media[want[i]] = { path, type, size: blob.size };
      files.push({ name: path, data: blob });
    }
    const sections = opt.kind === 'respaldo' ? S.sections.map((x) => plain(x)) : [];
    const manifest = { format: 'cancha', version: 3, app: APP_NAME, kind: opt.kind, title: opt.title, exportedAt: Date.now(), exercises, classes, groups, sections, media };
    files.unshift({ name: 'cancha.json', data: JSON.stringify(manifest) });
    const zip = await buildZip(files, (p) => onProgress && onProgress(0.5 + p * 0.5, 'Armando el archivo · ' + Math.round(p * 100) + '%'));
    return new File([zip], APP_NAME + ' - ' + safeName(opt.title) + ' - ' + shortDate() + '.zip', { type: 'application/zip' });
  }

  function markBackup() { pref.set('last-backup', String(Date.now())); S.sig = {}; renderAll(); }

  // Comparte el archivo ya creado: en Claude se descarga; en iPad abre el menú de compartir (AirDrop, WhatsApp, Archivos).
  async function deliverFile(file, what, isBackup) {
    const cl = window.claude;
    if (framed && cl && typeof cl.use === 'function') { if (await saveFile(file, file.name, 'Archivo') && isBackup) markBackup(); return; }
    const canShare = (() => { try { return !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { return false; } })();
    const sheet = openSheet({
      title: 'Archivo listo',
      cancelLabel: 'Cerrar',
      bodyHTML:
        '<div class="file-card"><span class="file-ico">' + ic('box') + '</span><span class="txt"><b>' + esc(file.name) + '</b><span>' + esc(what) + ' · ' + fmtSize(file.size) + '</span></span></div>' +
        '<button type="button" class="btn filled wide-btn" data-file-share>' + ic('share') + (canShare ? (isBackup ? 'Guardar respaldo' : 'Compartir') : 'Descargar archivo') + '</button>' +
        '<div class="help">' + (isBackup
          ? (canShare ? '<p>Elige <b>AirDrop</b> o <b>Guardar en Archivos</b> → <b>iCloud Drive</b>. Así lo recuperas si cambias de iPad.</p>' : '<p>Descarga el archivo y guárdalo en un lugar seguro (por ejemplo, tu nube).</p>')
          : (canShare ? '<p>Elige <b>AirDrop</b> o <b>WhatsApp</b> y mándalo al otro profe.</p>' : '<p>Descarga el archivo y mándalo por AirDrop, WhatsApp o correo.</p>')) +
        '<p>Para abrirlo en otro iPad: guarda el archivo, abre Cancha y toca <b>Respaldo → Abrir archivo de Cancha</b>.</p></div>',
    });
    sheet.body.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-file-share]')) return;
      if (canShare) {
        try { await navigator.share({ files: [file], title: file.name }); if (isBackup) markBackup(); sheet.dismiss(); toast(isBackup ? 'Respaldo guardado' : 'Archivo enviado'); return; } catch (err) { if (err && err.name === 'AbortError') return; }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 8000);
      if (isBackup) markBackup();
      sheet.dismiss();
      toast(isBackup ? 'Respaldo descargado' : 'Archivo descargado');
    });
  }

  async function runExport(opt, what) {
    const sheet = openSheet({ title: 'Preparando archivo', cancelLabel: 'Cerrar', bodyHTML: '<div class="media-preview loading prep"><span class="spinner"></span><span data-ref="lbl">Preparando…</span></div>' });
    sheet.setBusy(true, 'Preparando…');
    try {
      const file = await buildExport(opt, (p, label) => { sheet.progress(p, label); });
      sheet.setBusy(false);
      sheet.dismiss();
      setTimeout(() => deliverFile(file, what, opt.kind === 'respaldo'), 350);
    } catch (e) {
      sheet.setBusy(false);
      sheet.dismiss();
      alertBox('No se pudo crear el archivo',
        e && e.code === 'too-big' ? 'Hay demasiados videos para un solo archivo. En «Mandar a otro profe» apaga «Videos y fotos» o manda por partes.'
          : e && e.name === 'QuotaExceededError' ? 'No hay espacio suficiente en el dispositivo.'
            : 'Vuelve a intentarlo en un momento.');
    }
  }
  function backupAll(withMedia) {
    const exIds = new Set(S.exercises.filter((e) => !e.example).map((e) => e.id));
    const classIds = new Set(S.classes.filter((c) => !c.example).map((c) => c.id));
    const groupIds = new Set(S.groups.filter((g) => !g.example).map((g) => g.id));
    S.classes.forEach((c) => { if (classIds.has(c.id)) (c.items || []).forEach((it) => { if (it.exId && getEx(it.exId)) exIds.add(it.exId); }); if (classIds.has(c.id) && c.groupId && getGroup(c.groupId)) groupIds.add(c.groupId); });
    if (!exIds.size && !classIds.size && !groupIds.size) { alertBox('Nada que respaldar', 'Todavía no tienes ejercicios, clases ni grupos propios.'); return; }
    runExport({ exIds, classIds, groupIds, withMedia: withMedia !== false, kind: 'respaldo', title: 'Respaldo' },
      [exIds.size ? plural(exIds.size, 'ejercicio', 'ejercicios') : '', classIds.size ? plural(classIds.size, 'clase', 'clases') : '', groupIds.size ? plural(groupIds.size, 'grupo', 'grupos') : ''].filter(Boolean).join(', '));
  }

  function switchRow(id, iconHTML, label, sub, checked, disabled) {
    return '<label class="row sw-row' + (disabled ? ' off' : '') + '"><span class="k">' + iconHTML + '<span class="sw-txt"><span>' + label + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></span>' +
      '<span class="switch"><input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' role="switch"><i></i></span></label>';
  }
  function openExportSheet() {
    const nF = S.exercises.filter((e) => e.sport === 'futbol').length;
    const nB = S.exercises.filter((e) => e.sport === 'basquet').length;
    const nC = S.classes.length; const nG = S.groups.length;
    const sheet = openSheet({
      title: 'Mandar a otro profe',
      confirmLabel: 'Crear archivo',
      bodyHTML:
        '<p class="att-head">Elige qué mandar. El otro profe lo abre en su Cancha, en «Respaldo».</p>' +
        '<div class="group">' +
        switchRow('xp-f', ic('futbol'), 'Ejercicios de fútbol', plural(nF, 'ejercicio', 'ejercicios'), nF > 0, !nF) +
        switchRow('xp-b', ic('basquet'), 'Ejercicios de básquetbol', plural(nB, 'ejercicio', 'ejercicios'), nB > 0, !nB) +
        switchRow('xp-c', ic('clases'), 'Clases', plural(nC, 'clase', 'clases') + ' con sus ejercicios', nC > 0, !nC) +
        switchRow('xp-g', ic('people'), 'Grupos y asistencia', nG ? 'Incluye nombres de alumnos' : 'Sin grupos', false, !nG) +
        '</div><div class="group">' +
        switchRow('xp-m', ic('video'), 'Videos y fotos', 'Sin ellos el archivo pesa muy poco', true, false) +
        '</div><p class="muted xp-sum" data-ref="sum"></p>',
      onConfirm: () => {
        const o = collect();
        if (!o.exIds.size && !o.classIds.size && !o.groupIds.size) return;
        sheet.dismiss();
        const parts = [o.exIds.size ? plural(o.exIds.size, 'ejercicio', 'ejercicios') : '', o.classIds.size ? plural(o.classIds.size, 'clase', 'clases') : '', o.groupIds.size ? plural(o.groupIds.size, 'grupo', 'grupos') : ''].filter(Boolean);
        setTimeout(() => runExport(Object.assign(o, { kind: 'biblioteca', title: 'Biblioteca' }), parts.join(', ')), 300);
      },
    });
    const root = sheet.body;
    function collect() {
      const on = (id) => { const el = $('#' + id, root); return el && el.checked && !el.disabled; };
      const exIds = new Set(); const classIds = new Set(); const groupIds = new Set();
      const addCls = (c) => { classIds.add(c.id); (c.items || []).forEach((it) => { if (it.exId && getEx(it.exId)) exIds.add(it.exId); }); };
      if (on('xp-f')) S.exercises.forEach((e) => { if (e.sport === 'futbol') exIds.add(e.id); });
      if (on('xp-b')) S.exercises.forEach((e) => { if (e.sport === 'basquet') exIds.add(e.id); });
      if (on('xp-c')) S.classes.forEach(addCls);
      if (on('xp-g')) S.groups.forEach((g) => { groupIds.add(g.id); groupClasses(g.id).forEach(addCls); });
      return { exIds, classIds, groupIds, withMedia: on('xp-m') };
    }
    async function summary() {
      const o = collect();
      const exs = S.exercises.filter((e) => o.exIds.has(e.id));
      const nMedia = o.withMedia ? exs.filter((e) => e.mediaId).length : 0;
      let size = null;
      if (o.withMedia && S.backend.mediaSize) {
        const sizes = await Promise.all(exs.map((e) => (e.mediaId ? S.backend.mediaSize(e.mediaId).catch(() => null) : 0)));
        if (sizes.every((x) => x != null)) size = sizes.reduce((a, b) => a + b, 0);
      }
      const parts = [o.exIds.size ? plural(o.exIds.size, 'ejercicio', 'ejercicios') : '', o.classIds.size ? plural(o.classIds.size, 'clase', 'clases') : '', o.groupIds.size ? plural(o.groupIds.size, 'grupo', 'grupos') : '', nMedia ? plural(nMedia, 'video o foto', 'videos y fotos') : ''].filter(Boolean);
      $('[data-ref="sum"]', root).textContent = parts.length ? 'Se mandan ' + parts.join(', ') + (size ? ' (cerca de ' + fmtMB(size) + ')' : '') + '.' : 'Elige al menos una opción.';
      sheet.setConfirm(parts.length > 0);
    }
    root.addEventListener('change', summary);
    summary();
  }

  function sendExercise(ex) {
    runExport({ exIds: new Set([ex.id]), classIds: new Set(), groupIds: new Set(), withMedia: true, kind: 'ejercicio', title: ex.title }, 'Ejercicio «' + ex.title + '»');
  }
  function sendClass(c) {
    const exIds = new Set((c.items || []).map((it) => it.exId).filter((id) => id && getEx(id)));
    runExport({ exIds, classIds: new Set([c.id]), groupIds: new Set(), withMedia: true, kind: 'clase', title: c.name || 'Clase' }, 'Clase con ' + plural(exIds.size, 'ejercicio', 'ejercicios'));
  }

  // --- importar: todo lo que viene del archivo se revisa antes de guardarlo.
  const SEED_RE = /^(ej-[fb]\d+|cl-ej\d+|gr-ej\d+|ex2-[fb]\d+|cl2-ej\d+|gr2-ej\d+|ex3-c[fb]-\d+|cl3-ej\d+|gr3-ej\d+)$/;
  const isId = (v) => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,80}$/.test(v);
  const txt = (v, max) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '').slice(0, max);
  const numIn = (v, lo, hi, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def; };
  const dayOk = (v) => { if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return ''; const d = parseDay(v); return d && dayStr(d) === v ? v : ''; };
  function cleanDiagram(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.items)) return null;
    const items = d.items.slice(0, 300).filter((it) => it && typeof it === 'object' && ['a', 'b', 'cone', 'ball', 'arrow', 'ladder', 'hurdle', 'ring', 'pole'].indexOf(it.t) >= 0).map((it) => {
      const o = { t: it.t, x: numIn(it.x, 0, 160, 80), y: numIn(it.y, 0, 200, 100) };
      if (it.t === 'ladder' || it.t === 'hurdle') o.r = Number(it.r) === 90 ? 90 : 0;
      if (it.t === 'ladder') o.n = Math.round(numIn(it.n, 2, 14, 6));
      if (it.t === 'arrow') { o.k = ['pase', 'conduccion', 'mov'].indexOf(it.k) >= 0 ? it.k : 'pase'; o.x2 = numIn(it.x2, 0, 160, o.x); o.y2 = numIn(it.y2, 0, 200, o.y); }
      if (it.n != null && it.t !== 'ladder') o.n = Math.round(numIn(it.n, 0, 99, 1));
      if (it.t === 'arrow' && it.s != null) o.s = Math.round(numIn(it.s, 1, 50, 1));
      return o;
    });
    return items.length ? { v: txt(d.v, 30), items } : null;
  }
  function cleanBase(x, o) {
    o.id = x.id;
    o.createdAt = numIn(x.createdAt, 0, 9e15, Date.now());
    o.updatedAt = numIn(x.updatedAt, 0, 9e15, o.createdAt);
    o.example = x.example === true;
    if (isId(x.authorId)) o.authorId = x.authorId;
    return o;
  }
  function cleanEx(x) {
    if (!x || typeof x !== 'object' || !isId(x.id)) return null;
    const mt = x.mediaType === 'video' || x.mediaType === 'image' ? x.mediaType : null;
    return cleanBase(x, {
      sport: SPORTS[x.sport] ? x.sport : 'futbol', title: txt(x.title, 120).trim() || 'Ejercicio', objective: txt(x.objective, 60), level: txt(x.level, 30),
      duration: Math.round(numIn(x.duration, 0, 240, 10)), players: txt(x.players, 80), age: txt(x.age, 80), space: txt(x.space, 80), material: txt(x.material, 300),
      description: txt(x.description, 4000), keyPoints: txt(x.keyPoints, 2000), variations: txt(x.variations, 1500), link: cleanLink(txt(x.link, 400)), favorite: x.favorite === true,
      mediaType: mt, mediaId: mt && isId(x.mediaId) ? x.mediaId : null, thumbId: isId(x.thumbId) ? x.thumbId : null,
      mediaDuration: numIn(x.mediaDuration, 0, 36000, 0), mediaAspect: x.mediaAspect == null ? null : numIn(x.mediaAspect, 0.1, 10, null), diagram: cleanDiagram(x.diagram),
      catalogId: isId(x.catalogId) ? x.catalogId : undefined,
      school: x.school === true,
      videoUrl: typeof x.videoUrl === 'string' && /^app\/videos\/[\w-]+\.mp4$/.test(x.videoUrl) ? x.videoUrl : undefined,
      posterUrl: typeof x.posterUrl === 'string' && /^app\/videos\/[\w-]+\.jpg$/.test(x.posterUrl) ? x.posterUrl : undefined,
      thumbUrl: typeof x.thumbUrl === 'string' && /^app\/videos\/[\w-]+-t\.jpg$/.test(x.thumbUrl) ? x.thumbUrl : undefined,
    });
  }
  function cleanItem(it) {
    if (!it || typeof it !== 'object') return null;
    if (it.type === 'pause') return { type: 'pause', label: txt(it.label, 40).trim() || 'Pausa', min: Math.round(numIn(it.min, 1, 240, 3)) };
    const gone = it.gone && typeof it.gone === 'object';
    if (!isId(it.exId) && !gone) return null;
    const o = { min: Math.round(numIn(it.min, 0, 240, 10)) };
    if (isId(it.exId)) o.exId = it.exId; else o.gone = { title: txt(it.gone.title, 120) || 'Ejercicio', objective: txt(it.gone.objective, 60) };
    if (it.series && typeof it.series === 'object') {
      const n = Math.round(numIn(it.series.n, 0, 30, 0));
      if (n > 1) o.series = { n, work: numIn(it.series.work, 0.25, 60, 3), rest: numIn(it.series.rest, 0, 30, 1) };
    }
    return o;
  }
  function cleanClass(x) {
    if (!x || typeof x !== 'object' || !isId(x.id)) return null;
    const o = cleanBase(x, {
      name: txt(x.name, 120), sport: SPORTS[x.sport] ? x.sport : 'futbol', date: dayOk(x.date), groupId: isId(x.groupId) ? x.groupId : null,
      items: (Array.isArray(x.items) ? x.items : []).slice(0, 80).map(cleanItem).filter(Boolean), notes: txt(x.notes, 4000),
    });
    if (x.attendance && typeof x.attendance === 'object') {
      const att = {};
      Object.keys(x.attendance).slice(0, 500).forEach((k) => { const v = x.attendance[k]; if (isId(k) && (v === 'p' || v === 't' || v === 'f')) att[k] = v; });
      if (Object.keys(att).length) { o.attendance = att; o.attendanceAt = numIn(x.attendanceAt, 0, 9e15, o.updatedAt); }
    }
    if (x.lastRunAt) o.lastRunAt = numIn(x.lastRunAt, 0, 9e15, 0);
    return o;
  }
  function cleanSection(x) {
    if (!x || typeof x !== 'object' || !isId(x.id)) return null;
    return cleanBase(x, { name: txt(x.name, 40).trim() || 'Sección', exIds: (Array.isArray(x.exIds) ? x.exIds : []).filter(isId).slice(0, 500), order: numIn(x.order, 0, 9e15, 0) });
  }
  function cleanGroup(x) {
    if (!x || typeof x !== 'object' || !isId(x.id)) return null;
    const seen = new Set();
    return cleanBase(x, {
      name: txt(x.name, 60).trim() || 'Grupo', sport: SPORTS[x.sport] ? x.sport : 'ambos', category: txt(x.category, 60), schedule: txt(x.schedule, 60), place: txt(x.place, 60),
      students: (Array.isArray(x.students) ? x.students : []).slice(0, 300).filter((s) => s && isId(s.id) && !seen.has(s.id) && seen.add(s.id)).map((s) => ({ id: s.id, name: txt(s.name, 80).trim() || 'Alumno' })),
    });
  }
  const IGNORE = { createdAt: 1, updatedAt: 1, example: 1, authorId: 1, syncedAt: 1 };
  const sameContent = (a, b) => JSON.stringify(a, (k, v) => (IGNORE[k] ? undefined : v)) === JSON.stringify(b, (k, v) => (IGNORE[k] ? undefined : v));

  function planImport(m) {
    const bucket = (list, clean, get) => {
      const out = { nuevos: [], actualiza: [], iguales: [], copias: [] };
      const seen = new Set();
      (Array.isArray(list) ? list : []).forEach((raw) => {
        const x = clean(raw);
        if (!x || seen.has(x.id)) return;
        seen.add(x.id);
        const cur = get(x.id);
        if (!cur) { out.nuevos.push(x); return; }
        if (sameContent(x, cleanAny(cur, clean))) { out.iguales.push(x); return; }
        if (cur.example && !x.example) { out.actualiza.push(x); return; }
        // ¿Cambió aquí desde la última vez que llegó por archivo? (los ejemplos se comparan aunque nunca hayan llegado)
        const localEdited = cur.syncedAt != null ? Number(cur.syncedAt) !== Number(cur.updatedAt) : SEED_RE.test(x.id);
        const remoteEdited = cur.syncedAt != null ? x.updatedAt > Number(cur.syncedAt) : true;
        if (!x.example && !cur.example && localEdited && remoteEdited) out.copias.push(x);
        else if (x.updatedAt > (Number(cur.updatedAt) || 0)) out.actualiza.push(x);
        else out.iguales.push(x);
      });
      return out;
    };
    const cleanAny = (cur, clean) => clean(cur) || cur;
    const ex = bucket(m.exercises, cleanEx, getEx);
    const cl = bucket(m.classes, cleanClass, getClass);
    const gr = bucket(m.groups, cleanGroup, getGroup);
    const sc = bucket(m.sections, cleanSection, getSection);
    const media = new Set();
    const mediaOk = (k) => k && m.media && m.media[k] && typeof m.media[k].path === 'string';
    ex.nuevos.concat(ex.actualiza, ex.copias).forEach((x) => { [x.mediaId, x.thumbId].forEach((k) => { if (mediaOk(k)) media.add(k); }); });
    return { ex, cl, gr, sc, media: Array.from(media) };
  }
  function importLine(b, one, many, fem) {
    const n = b.nuevos.length + b.actualiza.length + b.iguales.length + b.copias.length;
    if (!n) return '';
    const o = fem ? 'a' : 'o';
    const bits = [b.nuevos.length ? b.nuevos.length + ' nuev' + o + (b.nuevos.length === 1 ? '' : 's') : '', b.actualiza.length ? b.actualiza.length + ' se actualiza' + (b.actualiza.length === 1 ? '' : 'n') : '', b.copias.length ? b.copias.length + ' como copia' : '', b.iguales.length ? b.iguales.length + ' sin cambios' : ''].filter(Boolean);
    return '<div class="imp-line"><b>' + plural(n, one, many) + '</b><span>' + bits.join(' · ') + '</span></div>';
  }
  async function startImport(file) {
    let m; let zip = null; let damaged = false;
    try {
      const isJSON = /\.json$/i.test(file.name || '') || file.type === 'application/json';
      if (isJSON) m = JSON.parse(await file.text());
      else { zip = await readZip(file); const mb = await zip.blobOf('cancha.json', 'application/json'); m = mb ? JSON.parse(await mb.text()) : null; }
    } catch (e) { m = null; damaged = !(e && e.message === 'not-zip') || /^Cancha/i.test(file.name || ''); }
    if (damaged && !m) { alertBox('El archivo está dañado o incompleto', 'Vuelve a descargarlo o pide que te lo manden otra vez.'); return; }
    if (!m || typeof m !== 'object' || m.format !== 'cancha') { alertBox('Ese archivo no es de Cancha', 'Elige un respaldo o un archivo que te mandaron desde Cancha.'); return; }
    const plan = planImport(m);
    const mediaSize = plan.media.reduce((s, k) => s + (Number(m.media[k].size) || 0), 0);
    const mainMedia = plan.ex.nuevos.concat(plan.ex.actualiza, plan.ex.copias).filter((x) => x.mediaId && plan.media.indexOf(x.mediaId) >= 0).length;
    const changes = (b) => b.nuevos.length + b.actualiza.length + b.copias.length;
    const nothing = !changes(plan.ex) && !changes(plan.cl) && !changes(plan.gr) && !changes(plan.sc);
    const copies = plan.ex.copias.length + plan.cl.copias.length + plan.gr.copias.length;
    let when = '';
    try { when = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(m.exportedAt)); } catch (e) { /* */ }
    const sheet = openSheet({
      title: 'Abrir archivo',
      confirmLabel: 'Agregar',
      bodyHTML:
        '<p class="att-head"><b>' + esc(txt(m.title, 80) || 'Archivo de Cancha') + '</b>' + (when ? ' · del ' + esc(when) : '') + '</p>' +
        '<div class="att-card imp-card">' +
        importLine(plan.ex, 'ejercicio', 'ejercicios') + importLine(plan.cl, 'clase', 'clases', true) + importLine(plan.gr, 'grupo', 'grupos') + importLine(plan.sc, 'sección', 'secciones', true) +
        (mainMedia ? '<div class="imp-line"><b>' + plural(mainMedia, 'video o foto', 'videos y fotos') + '</b><span>' + fmtMB(mediaSize) + '</span></div>' : '') +
        '</div>' +
        '<p class="muted" style="margin:14px 16px 0;font-size:14px">' + (nothing ? 'Ya tienes todo lo que trae este archivo.' : 'Lo que venga más nuevo en el archivo se actualiza aquí.' + (copies ? ' Si tú también lo cambiaste, se agrega como copia y no pierdes tu versión.' : '')) + '</p>',
      onConfirm: async () => {
        sheet.setBusy(true, 'Agregando…');
        try {
          const r = await applyImport(m, zip, plan, (p, label) => sheet.progress(p, label));
          sheet.setBusy(false);
          sheet.dismiss();
          haptic(14);
          const parts = [r.ex ? plural(r.ex, 'ejercicio', 'ejercicios') : '', r.cl ? plural(r.cl, 'clase', 'clases') : '', r.gr ? plural(r.gr, 'grupo', 'grupos') : ''].filter(Boolean);
          toast(parts.length ? 'Se agregaron ' + parts.join(', ') : 'Listo');
        } catch (e) {
          sheet.setBusy(false);
          renderAll(); refreshScreens();
          showError(e, 'No se pudo agregar todo');
        }
      },
    });
    sheet.setConfirm(!nothing);
  }
  async function applyImport(m, zip, plan, onProgress) {
    const idMap = {};
    for (let i = 0; i < plan.media.length; i++) {
      const key = plan.media[i];
      const info = m.media[key];
      onProgress(i / Math.max(1, plan.media.length), 'Copiando videos y fotos · ' + (i + 1) + ' de ' + plan.media.length);
      let blob = zip ? await zip.blobOf(info.path, info.type).catch(() => null) : null;
      if (!blob || !blob.size) continue;
      let type = typeof info.type === 'string' ? info.type : '';
      if (S.backend.kind === 'cloud' && type.indexOf('video/') === 0) {
        const r = await prepareCloudVideo(new File([blob], info.path.split('/').pop(), { type }), (p) => onProgress(i / plan.media.length, 'Reduciendo video ' + (i + 1) + ' de ' + plan.media.length + ' · ' + Math.round(p * 100) + '% · mantén la app abierta'));
        blob = r.blob; type = r.type;
      }
      idMap[key] = await S.backend.putMedia(blob, type);
    }
    onProgress(null, 'Guardando…');
    // Copias: cuando tú y el otro profe cambiaron el mismo ejemplo, se guarda el suyo aparte.
    const exRe = {}; const grRe = {};
    plan.ex.copias.forEach((x) => { exRe[x.id] = uid(); });
    plan.gr.copias.forEach((x) => { grRe[x.id] = uid(); });
    const now = Date.now();
    let nEx = 0; let nCl = 0; let nGr = 0;
    for (const x of plan.gr.nuevos.concat(plan.gr.actualiza, plan.gr.copias)) {
      const g = plain(x);
      if (grRe[x.id]) { g.id = grRe[x.id]; g.name = g.name + ' (copia)'; g.example = false; } else g.syncedAt = g.updatedAt;
      replaceLocal('groups', g);
      await S.backend.saveGroup(g);
      nGr++;
    }
    for (const x of plan.ex.nuevos.concat(plan.ex.actualiza, plan.ex.copias)) {
      const copy = !!exRe[x.id];
      const cur = copy ? null : getEx(x.id);
      const nx = plain(x);
      if (copy) { nx.id = exRe[x.id]; nx.title = nx.title + ' (copia)'; nx.example = false; nx.updatedAt = now; } else nx.syncedAt = nx.updatedAt;
      const old = [];
      if (x.mediaId && idMap[x.mediaId]) { nx.mediaId = idMap[x.mediaId]; if (cur && cur.mediaId) old.push(cur.mediaId); } else if (cur && cur.mediaId) {
        Object.assign(nx, { mediaId: cur.mediaId, mediaType: cur.mediaType, mediaDuration: cur.mediaDuration, mediaAspect: cur.mediaAspect });
      } else Object.assign(nx, { mediaId: null, mediaType: null, mediaDuration: 0 });
      if (x.thumbId && idMap[x.thumbId]) { nx.thumbId = idMap[x.thumbId]; if (cur && cur.thumbId) old.push(cur.thumbId); } else nx.thumbId = cur ? cur.thumbId || null : null;
      replaceLocal('exercises', nx);
      await S.backend.saveExercise(nx);
      old.filter((id) => id !== nx.mediaId && id !== nx.thumbId).forEach((id) => S.backend.deleteMedia(id).catch(() => {}));
      nEx++;
    }
    const clRe = {};
    plan.cl.copias.forEach((x) => { clRe[x.id] = uid(); });
    for (const x of plan.cl.nuevos.concat(plan.cl.actualiza, plan.cl.copias)) {
      const copy = !!clRe[x.id];
      const cur = copy ? null : getClass(x.id);
      const nc = plain(x);
      if (copy) { nc.id = clRe[x.id]; nc.name = (nc.name || 'Clase') + ' (copia)'; nc.example = false; nc.updatedAt = now; } else nc.syncedAt = nc.updatedAt;
      nc.items = nc.items.map((it) => (it.exId && exRe[it.exId] ? Object.assign({}, it, { exId: exRe[it.exId] }) : it));
      if (nc.groupId && grRe[nc.groupId]) nc.groupId = grRe[nc.groupId];
      if (!nc.groupId || !getGroup(nc.groupId)) { nc.groupId = cur && cur.groupId ? cur.groupId : null; if (!nc.groupId) { delete nc.attendance; delete nc.attendanceAt; } }
      if (!nc.attendance && cur && cur.attendance) { nc.attendance = cur.attendance; nc.attendanceAt = cur.attendanceAt; }
      replaceLocal('classes', nc);
      await S.backend.saveClass(nc);
      nCl++;
    }
    for (const x of plan.sc.nuevos.concat(plan.sc.actualiza, plan.sc.copias)) {
      const sec = plain(x);
      sec.exIds = sec.exIds.map((y) => exRe[y] || y);
      if (plan.sc.copias.indexOf(x) >= 0) { sec.id = uid(); sec.name = sec.name + ' (copia)'; sec.example = false; } else sec.syncedAt = sec.updatedAt;
      replaceLocal('sections', sec);
      await S.backend.saveSection(sec);
    }
    renderAll(); refreshScreens();
    return { ex: nEx, cl: nCl, gr: nGr };
  }

  // --- Apariencia: «Automático» sigue al iPad (modo oscuro de noche si así está); «Claro» y «Oscuro» la fijan.
  const prefersDark = () => { try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; } };
  function applyTheme(t) {
    const root = document.documentElement;
    if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
    const dark = t === 'dark' || (t !== 'light' && prefersDark());
    $$('meta[name="theme-color"]').forEach((m) => m.remove());
    const m = document.createElement('meta');
    m.name = 'theme-color';
    m.content = dark ? '#000000' : '#F2F2F7';
    document.head.appendChild(m);
  }
  function openSettings() {
    const cur = pref.get('theme') || 'auto';
    const sheet = openSheet({
      title: 'Ajustes',
      cancelLabel: 'Cerrar',
      bodyHTML:
        '<p class="group-label">Apariencia</p>' + segHTML('theme', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']], cur, 'Apariencia') +
        '<p class="muted small" style="margin:-12px 16px 22px">«Automático» usa el mismo modo que tu iPad o celular.</p>' +
        '<div class="group">' +
        '<button type="button" class="row row-act" data-st="backup">' + ic('box') + '<span>Respaldo</span>' + ic('chevR', 'chev') + '</button>' +
        '<button type="button" class="row row-act" data-st="where">' + ic('info') + '<span>¿Dónde se guardan mis datos?</span>' + ic('chevR', 'chev') + '</button>' +
        '<button type="button" class="row row-act" data-st="tutorial">' + ic('sparkle') + '<span>Ver el tutorial</span>' + ic('chevR', 'chev') + '</button>' +
        '</div>',
    });
    bindSeg(sheet.body, 'theme', (v) => { pref.set('theme', v); applyTheme(v); });
    sheet.body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-st]');
      if (!b) return;
      sheet.dismiss();
      setTimeout(() => (b.dataset.st === 'backup' ? openBackupSheet() : b.dataset.st === 'tutorial' ? showTutorial() : showStatus()), 320);
    });
  }

  // --- Respaldo: un toque para guardarlo todo; también mandar a otro profe e importar.
  function openBackupSheet() {
    const k = S.backend ? S.backend.kind : 'cloud';
    const last = Number(pref.get('last-backup')) || 0;
    const where = !S.canWrite ? 'Estás viendo una biblioteca compartida.' : k === 'cloud' ? 'Tus datos se guardan en tu cuenta de Claude.' : k === 'memory' ? 'Este navegador no está guardando tus datos.' : 'Tus datos solo están en este ' + devWord() + '.';
    const sheet = openSheet({
      title: 'Respaldo',
      cancelLabel: 'Cerrar',
      bodyHTML:
        (S.canWrite
          ? '<div class="att-card bk-card"><p class="att-line">' + esc(where) + '</p>' +
            '<p class="muted">' + (last ? 'Último respaldo: ' + esc(fmtAgo(last)) + '.' : 'Todavía no has hecho ningún respaldo.') + '</p>' +
            '<button type="button" class="btn filled wide-btn" data-bk="full">' + ic('box') + 'Hacer respaldo</button>' +
            '<p class="muted small">Junta ejercicios, clases, grupos, asistencia y videos en un archivo. Mándalo por AirDrop o guárdalo en iCloud Drive.</p></div>'
          : '<p class="att-head">' + esc(where) + '</p>') +
        '<div class="group">' +
        '<button type="button" class="row row-act" data-bk="send">' + ic('upload') + '<span>Mandar a otro profe</span>' + ic('chevR', 'chev') + '</button>' +
        (S.canWrite ? '<button type="button" class="row row-act" data-bk="import">' + ic('download') + '<span class="row-2"><span>Abrir archivo de Cancha</span><small>Tu respaldo o lo que te mandó otro profe</small></span>' + ic('chevR', 'chev') + '</button>' : '') +
        '<button type="button" class="row row-act" data-bk="where">' + ic('info') + '<span>¿Dónde se guardan mis datos?</span>' + ic('chevR', 'chev') + '</button>' +
        '</div>',
    });
    sheet.body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-bk]');
      if (!b) return;
      const act = b.dataset.bk;
      sheet.dismiss();
      setTimeout(() => {
        if (act === 'full') backupAll(true);
        else if (act === 'send') openExportSheet();
        else if (act === 'import') pickFile('import', startImport);
        else showStatus();
      }, 320);
    });
  }

  // ---------------------------------------------------------------- de entrenadores (catálogo)
  // Ejercicios y clases armados con entrenadores de fútbol y básquetbol. Viven en app/catalog.js;
  // el profe agrega a su biblioteca solo los que le sirven (se copian, así puede cambiarlos).
  let catalogP = null;
  function loadCatalog() {
    if (window.CANCHA_CATALOG) return Promise.resolve(window.CANCHA_CATALOG);
    if (!catalogP) {
      catalogP = loadScript('app/catalog.js')
        .then(() => { if (!window.CANCHA_CATALOG) throw new Error('catalog'); return window.CANCHA_CATALOG; })
        .catch((e) => { catalogP = null; throw e; });
    }
    return catalogP;
  }
  const CAT = () => window.CANCHA_CATALOG || null;
  const catExercises = (sport) => (CAT() ? CAT().exercises.filter((x) => !sport || x.sport === sport) : []);
  const catSessions = (sport) => (CAT() ? CAT().sessions.filter((x) => !sport || x.sport === sport) : []);
  const catEx = (id) => (CAT() ? CAT().exercises.find((x) => x.id === id) || null : null);
  const inLibrary = (cid) => S.exercises.find((e) => e.catalogId === cid) || null;

  async function adoptCatalogEx(cx, quiet) {
    const have = inLibrary(cx.id);
    if (have) return have;
    const now = Date.now();
    const ex = Object.assign(cleanEx(Object.assign({}, cx, { id: uid(), createdAt: now, updatedAt: now })), { catalogId: cx.id, example: false, favorite: false, mediaType: null, mediaId: null, thumbId: null });
    if (S.backend && S.backend.me) ex.authorId = S.backend.me;
    const ok = await commit('exercises', ex, null);
    if (!ok) return null;
    if (!quiet) haptic(12);
    return ex;
  }

  function catCardHTML(cx) {
    const have = inLibrary(cx.id);
    const meta = [cx.duration ? cx.duration + ' min' : '', cx.age].filter(Boolean).join(', ');
    return '<button class="card" data-open-cat="' + esc(cx.id) + '"><span class="thumb">' + (cx.thumbUrl ? '<img alt="" loading="lazy" decoding="async" src="' + esc(cx.thumbUrl) + '"><span class="badge vid">' + ic('play') + '<span class="sr">Con video</span></span>' : '<span class="art">' + boardSVG(cx.sport, cx.diagram, { crop: true }) + '</span>') +
      (have ? '<span class="badge in-lib">' + ic('check') + 'En tus ejercicios</span>' : cx.school ? '<span class="badge">Para escuela</span>' : '') + '</span>' +
      '<span class="card-body"><span class="title">' + esc(cx.title) + '</span><span class="meta">' + esc(meta) + '</span></span></button>';
  }
  function catEntryHTML(sport) {
    const all = catExercises(sport);
    const n = all.length;
    const pics = all.filter((x) => x.thumbUrl).slice(0, 3);
    const sample = all.find((x) => x.diagram && x.diagram.items && x.diagram.items.length > 6);
    const art = pics.length === 3
      ? pics.map((x, i) => '<img class="ce-p' + i + '" alt="" loading="lazy" decoding="async" src="' + esc(x.thumbUrl) + '">').join('')
      : '<span class="ce-board">' + boardSVG(sport, sample ? sample.diagram : null) + '</span>';
    return '<button class="cat-entry" data-act="catalog" data-tint="' + sport + '"><span class="txt"><span class="ce-kick">' + ic('sparkle') + 'Listos para usar</span><b>Recomendados</b>' +
      '<span class="ce-sub">' + (n ? n + ' ejercicios de ' + SPORTS[sport].noun + ' con video' : 'Ejercicios listos para usar') + '</span><span class="ce-cta">Ver ejercicios' + ic('chevR') + '</span></span>' +
      '<span class="ce-art" aria-hidden="true">' + art + '</span></button>';
  }
  function templatesHTML() {
    const list = catSessions();
    if (!list.length) return '';
    return '<p class="group-label">Clases listas</p><div class="list">' + list.map((t) => {
      const nEx = t.items.filter((it) => !isPause(it)).length;
      const total = t.items.reduce((sum, it) => sum + itemMin(it), 0);
      return '<button class="cell" data-open-template="' + esc(t.id) + '" data-tint="' + t.sport + '"><span class="group-badge band-' + t.sport + '" aria-hidden="true">' + total + '′</span>' +
        '<span class="txt"><span class="t1">' + esc(t.name) + '</span><span class="t2">' + esc(SPORTS[t.sport].name + ', ' + plural(nEx, 'ejercicio', 'ejercicios') + (t.age ? ', ' + t.age : '')) + '</span></span>' + ic('chevR', 'chev') + '</button>';
    }).join('') + '</div>';
  }

  function openCatalog(sport0) {
    if (backToScreen('cat')) return;
    let sport = SPORTS[sport0] ? sport0 : S.sport;
    let filter = 'all';
    const scr = pushScreen({ key: 'cat', tint: sport });
    function render() {
      scr.el.dataset.tint = sport;
      scr.setTitle('Recomendados');
      if (!CAT()) { scr.body.innerHTML = '<div class="empty"><span class="spinner"></span><p>Cargando…</p></div>'; return; }
      const all = catExercises(sport);
      const objs = SPORTS[sport].tags.filter((t) => all.some((x) => x.objective === t));
      const list = filter === 'school' ? all.filter((x) => x.school) : filter === 'all' ? all : all.filter((x) => x.objective === filter);
      const groups = objs.filter((o) => list.some((x) => x.objective === o));
      const sessions = catSessions(sport);
      scr.body.innerHTML =
        '<div class="d-head"><h1 class="d-title">Recomendados</h1><p class="cat-lead">Ejercicios y clases armados con base en FIFA, FIBA y otras federaciones. Agrega los que te sirvan y cámbialos a tu gusto.</p></div>' +
        segHTML('csport', [['futbol', 'Fútbol'], ['basquet', 'Básquetbol']], sport, 'Deporte') +
        (sessions.length ? '<p class="group-label">Clases listas</p><div class="list">' + sessions.map((t) => {
          const total = t.items.reduce((sum, it) => sum + itemMin(it), 0);
          return '<button class="cell" data-open-template="' + esc(t.id) + '"><span class="group-badge band-' + t.sport + '" aria-hidden="true">' + total + '′</span><span class="txt"><span class="t1">' + esc(t.name) + '</span><span class="t2">' + esc(t.notes || '') + '</span></span>' + ic('chevR', 'chev') + '</button>';
        }).join('') + '</div>' : '') +
        '<div class="chips" role="toolbar" aria-label="Filtrar">' + [['all', 'Todos'], ['school', 'Para escuela']].concat(objs.map((o) => [o, o])).map((c) => '<button class="chip" data-cf="' + esc(c[0]) + '" aria-pressed="' + (c[0] === filter) + '">' + esc(c[1]) + '</button>').join('') + '</div>' +
        groups.map((o) => '<p class="group-label">' + esc(o) + '</p><div class="grid">' + list.filter((x) => x.objective === o).map(catCardHTML).join('') + '</div>').join('');
      bindSeg(scr.body, 'csport', (v) => { sport = v; filter = 'all'; render(); scr.scroller.scrollTo({ top: 0 }); });
    }
    render();
    if (!CAT()) loadCatalog().then(render).catch(() => { scr.body.innerHTML = '<div class="empty"><h2>No se pudo abrir</h2><p>Vuelve a intentarlo en un momento.</p></div>'; });
    scr.refresh = render;
    scr.el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-open-cat]');
      if (c) { openCatalogEx(c.dataset.openCat); return; }
      const t = e.target.closest('[data-open-template]');
      if (t) { openTemplate(t.dataset.openTemplate); return; }
      const f = e.target.closest('[data-cf]');
      if (f) { filter = f.dataset.cf; haptic(4); render(); }
    });
  }

  function openCatalogEx(id) {
    const cx = catEx(id);
    if (!cx) return;
    if (backToScreen('cx:' + id)) return;
    haptic(4);
    const scr = pushScreen({ key: 'cx:' + id, tint: cx.sport });
    let player = null;
    function render() {
      const have = inLibrary(id);
      const stats = [['clock', 'Duración', cx.duration + ' min'], ['people', 'Jugadores', cx.players], ['age', 'Edad', cx.age], ['flag', 'Espacio', cx.space]].filter((x) => x[2]);
      const points = String(cx.keyPoints || '').split('\n').filter(Boolean);
      const vars = String(cx.variations || '').split('\n').filter(Boolean);
      scr.setTitle(cx.title);
      scr.body.classList.add('wide');
      scr.body.innerHTML =
        '<div class="ex-layout"><div class="d-media">' + (cx.videoUrl ? coachVideoHTML(cx) : '<div class="d-frame board-frame"><span class="art" role="img" aria-label="Pizarrón del ejercicio">' + boardSVG(cx.sport, cx.diagram, { fit: 'xMidYMid meet', anim: canPlay(cx.diagram) }) + '</span>' +
        '<div class="bf-ctrls">' + (canPlay(cx.diagram) ? '<button type="button" class="bf-btn" data-act="play">' + ic('play') + '<span>Ver jugada</span></button>' : '') + '</div></div>') + '</div>' +
        '<div class="ex-info"><div class="d-head"><p class="d-tags"><span class="tag">' + esc(cx.objective) + '</span><span class="tag ghost">' + esc(cx.level) + '</span>' + (cx.school ? '<span class="tag ghost">Para escuela</span>' : '') + '</p><h1 class="d-title">' + esc(cx.title) + '</h1></div>' +
        '<div class="stats" style="--cols:' + stats.length + '">' + stats.map((x) => '<div class="stat"><span class="k">' + ic(x[0]) + x[1] + '</span><span class="v">' + esc(x[2]) + '</span></div>').join('') + '</div>' +
        (S.canWrite ? '<div class="d-actions">' + (have
          ? '<button class="btn tinted grow" data-act="open-mine">' + ic('check') + 'Ya está en tus ejercicios</button>'
          : '<button class="btn filled grow" data-act="adopt">' + ic('plus') + 'Agregar a tus ejercicios</button>') +
          '<button class="btn tinted" data-act="adopt-class">' + ic('clases') + 'Agregar a una clase</button></div>' : '') +
        '<section class="sec"><h2>Cómo se hace</h2><p>' + esc(cx.description) + '</p></section>' +
        (points.length ? '<section class="sec"><h2>Puntos clave</h2><ul class="points">' + points.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul></section>' : '') +
        (vars.length ? '<section class="sec"><h2>Variantes</h2><ul class="vars">' + vars.map((v) => { const m = v.match(/^([^:]{2,24}):\s*(.+)$/); return '<li>' + (m ? '<b>' + esc(m[1]) + '</b> ' + esc(m[2]) : esc(v)) + '</li>'; }).join('') + '</ul></section>' : '') +
        (cx.material ? '<section class="sec"><h2>Material</h2><p>' + esc(cx.material) + '</p></section>' : '') + '</div></div>';
    }
    function play(delay) {
      const frame = $('.board-frame', scr.body);
      if (!frame) return;
      if (player) player.stop(false);
      frame.classList.add('playing');
      player = playDiagram(frame, cx.diagram, { delay, onEnd: () => frame.classList.remove('playing') });
    }
    render();
    if (!reduceMotion() && !cx.videoUrl) play(650);
    scr.refresh = () => { if (player) player.stop(); render(); };
    scr.onClose = () => { if (player) player.stop(); };
    scr.el.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'play') { play(150); return; }
      if (a.dataset.act === 'open-mine') { const m = inLibrary(id); if (m) openExercise(m.id); return; }
      if (a.dataset.act === 'adopt-class') { const ex = await adoptCatalogEx(cx, true); if (ex) addToClassFlow(ex); return; }
      if (a.dataset.act === 'adopt') {
        a.disabled = true;
        const ex = await adoptCatalogEx(cx);
        a.disabled = false;
        if (ex) toast('Agregado a tus ejercicios', 'check', { label: 'Ver', onClick: () => openExercise(ex.id) });
      }
    });
  }

  function openTemplate(id) {
    const t = CAT() ? CAT().sessions.find((x) => x.id === id) : null;
    if (!t) return;
    if (backToScreen('tp:' + id)) return;
    haptic(4);
    const scr = pushScreen({ key: 'tp:' + id, tint: t.sport });
    const total = t.items.reduce((sum, it) => sum + itemMin(it), 0);
    const nEx = t.items.filter((it) => !isPause(it)).length;
    const ops = [1, 0.72, 0.5, 0.34];
    let k = 0; let at = 0;
    const segs = t.items.map((it) => { const m = itemMin(it); const h = '<span class="tl-seg' + (isPause(it) ? ' p' : '') + '" style="flex-grow:' + Math.max(1, m) + ';--o:' + (isPause(it) ? 1 : ops[(k++) % 4]) + '"><i></i>' + (at === 0 ? '<b>0′</b>' : '') + '</span>'; at += m; return h; }).join('');
    let mt = 0;
    const rows = t.items.map((it) => {
      const start = mt; mt += itemMin(it);
      if (isPause(it)) return '<div class="plan-row"><span class="time">' + fmtMin(start) + '′</span><span class="mini pause-ico">' + ic('drop') + '</span><span class="txt"><span class="t1">' + esc(it.label) + '</span><span class="t2">Pausa, ' + fmtMin(it.min) + ' min</span></span></div>';
      const cx = catEx(it.exId);
      return '<button class="plan-row" data-open-cat="' + esc(it.exId) + '"><span class="time">' + fmtMin(start) + '′</span><span class="mini">' + (cx && cx.thumbUrl ? '<img alt="" loading="lazy" src="' + esc(cx.thumbUrl) + '">' : '<span class="art">' + boardSVG(t.sport, cx && cx.diagram, { crop: true }) + '</span>') + '</span>' +
        '<span class="txt"><span class="t1">' + esc(cx ? cx.title : 'Ejercicio') + '</span><span class="t2">' + esc([cx ? cx.objective : '', fmtMin(it.min) + ' min', seriesText(it.series)].filter(Boolean).join(', ')) + '</span></span>' + ic('chevR', 'chev') + '</button>';
    }).join('');
    scr.setTitle(t.name);
    scr.body.innerHTML =
      '<div class="d-head"><p class="d-eyebrow">' + ic(t.sport) + esc(SPORTS[t.sport].name + (t.age ? ', ' + t.age : '')) + '</p><h1 class="d-title">' + esc(t.name) + '</h1></div>' +
      '<div class="c-summary"><p class="c-line"><span class="c-total">' + total + '<small> min</small></span><span class="c-sub">' + plural(nEx, 'ejercicio', 'ejercicios') + '</span></p>' +
      '<div class="tl" aria-hidden="true">' + segs + '<b class="tl-end">' + total + '′</b></div>' +
      (S.canWrite ? '<button class="btn filled start-btn" data-act="use">' + ic('plus') + 'Usar esta clase</button>' : '') + '</div>' +
      (t.notes ? '<section class="sec"><h2>Objetivo</h2><p>' + esc(t.notes) + '</p></section>' : '') +
      '<div class="section-head"><h2>Plan</h2></div><div class="list">' + rows + '</div>';
    scr.el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-open-cat]');
      if (c) { openCatalogEx(c.dataset.openCat); return; }
      if (!e.target.closest('[data-act="use"]')) return;
      openClassEditor({
        sport: t.sport, name: t.name, notes: t.notes || '',
        items: t.items.map((it) => Object.assign({}, it)),
        templateNote: 'Se copia el plan completo. Sus ' + plural(nEx, 'ejercicio', 'ejercicios') + ' también quedan en Ejercicios.',
        prepare: async () => {
          const out = [];
          for (const it of t.items) {
            if (isPause(it)) { out.push({ type: 'pause', label: it.label, min: it.min }); continue; }
            const cx = catEx(it.exId);
            if (!cx) continue;
            const ex = await adoptCatalogEx(cx, true);
            if (!ex) return null;
            const o = { exId: ex.id, min: it.min };
            if (it.series) o.series = Object.assign({}, it.series);
            out.push(o);
          }
          return out;
        },
      });
    });
  }

  // ---------------------------------------------------------------- pizarra táctica
  // Pocas herramientas: poner piezas, una flecha (con su tipo) y borrar. Arrastrar siempre mueve.
  const BOARD_TOOLS = [['a', 'Equipo A'], ['b', 'Equipo B'], ['cone', 'Material'], ['ball', 'Balón'], ['arrow', 'Flecha'], ['erase', 'Borrar']];
  const GEAR_KINDS = [['cone', 'Cono'], ['ladder', 'Escalera'], ['hurdle', 'Valla'], ['ring', 'Aro'], ['pole', 'Poste']];
  const ARROW_KINDS = (sport) => [['pase', 'Pase o tiro'], ['conduccion', sport === 'basquet' ? 'Dribleo' : 'Conducción'], ['mov', 'Sin balón']];
  const BOARD_HINT = {
    a: 'Toca la cancha para poner un jugador. Arrastra para moverlo.',
    b: 'Toca la cancha para poner un rival. Arrastra para moverlo.',
    cone: 'Toca para poner material. Toca una escalera o valla para girarla.',
    ball: 'Toca la cancha para poner el balón. Arrastra para moverlo.',
    arrow: 'Arrastra el dedo para dibujar la flecha.',
    erase: 'Toca lo que quieras borrar.',
  };
  function openBoard(o) {
    const sport = SPORTS[o.sport] ? o.sport : 'futbol';
    const d = o.diagram ? plain(o.diagram) : { v: defaultVariant(sport), items: [] };
    if (!VARIANTS[sport].some((x) => x[0] === d.v)) d.v = defaultVariant(sport);
    d.items = d.items || [];
    const hist = [];
    let tool = 'a';
    let arrowKind = 'pase';
    let gearKind = 'cone';
    let changed = false;
    let drag = null;
    const toolIcon = (t) => (t === 'a' || t === 'b' ? '<span class="dot" style="background:' + BOARD[sport][t] + ';color:' + BOARD[sport][t + 'Ink'] + (t === 'b' && sport === 'basquet' ? ';box-shadow:inset 0 0 0 1.5px ' + BOARD[sport].ring : '') + '">' + t.toUpperCase() + '</span>' : ic(t === 'ball' ? sport : t === 'arrow' ? 'arrowPass' : t));
    const wrap = document.createElement('div');
    wrap.className = 'board-wrap';
    wrap.dataset.tint = sport;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Pizarrón');
    wrap.innerHTML =
      '<div class="board-head"><button type="button" class="cap" data-bd="cancel">Cancelar</button><span class="sh-title">Pizarrón</span><button type="button" class="cap filled" data-bd="done">Listo</button></div>' +
      '<div class="board-sub">' + segHTML('variant', VARIANTS[sport], d.v, 'Cancha') + '</div>' +
      '<div class="board-stage"><div class="board-canvas art"></div></div>' +
      '<div class="board-kinds"><div class="board-kind" data-ref="kind" hidden>' + segHTML('akind', ARROW_KINDS(sport), arrowKind, 'Tipo de flecha') + '</div>' +
      '<div class="board-kind" data-ref="gear" hidden>' + segHTML('gkind', GEAR_KINDS, gearKind, 'Material') + '</div></div>' +
      '<p class="board-hint" aria-live="polite"></p>' +
      '<div class="board-tools" role="toolbar" aria-label="Herramientas">' +
      BOARD_TOOLS.map((t) => '<button type="button" class="bt" data-tool="' + t[0] + '" aria-pressed="false">' + toolIcon(t[0]) + '<span>' + t[1] + '</span></button>').join('') +
      '<span class="bt-sep" aria-hidden="true"></span>' +
      '<button type="button" class="bt" data-bd="undo">' + ic('undo') + '<span>Deshacer</span></button>' +
      '<button type="button" class="bt" data-bd="clear">' + ic('trash') + '<span>Limpiar</span></button></div>';
    document.body.appendChild(wrap);
    const canvas = $('.board-canvas', wrap);

    function render() {
      canvas.innerHTML = boardSVG(sport, d, { interactive: true, fit: 'xMidYMid meet', cls: 'board-svg' });
      $('[data-bd="undo"]', wrap).disabled = !hist.length;
      $('[data-bd="clear"]', wrap).disabled = !d.items.length;
    }
    function setTool(t) {
      tool = t;
      $$('[data-tool]', wrap).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
      $('.board-hint', wrap).textContent = BOARD_HINT[t] || '';
      $('[data-ref="kind"]', wrap).hidden = t !== 'arrow';
      $('[data-ref="gear"]', wrap).hidden = t !== 'cone';
      canvas.dataset.tool = t;
    }
    const snapshot = () => { hist.push(JSON.stringify({ v: d.v, items: d.items })); if (hist.length > 60) hist.shift(); changed = true; };
    const restore = () => { const h = JSON.parse(hist.pop()); d.v = h.v; d.items = h.items; syncVariant(); render(); };
    function syncVariant() {
      const seg = $('[data-seg="variant"]', wrap);
      if (!seg) return;
      const btns = $$('button[data-val]', seg);
      btns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.val === d.v)));
      seg.style.setProperty('--i', Math.max(0, btns.findIndex((b) => b.dataset.val === d.v)));
    }
    const clampX = (x) => Math.min(154, Math.max(6, x));
    const clampY = (y) => Math.min(194, Math.max(6, y));
    function toBoard(e) {
      const svg = $('svg', canvas);
      const m = svg && svg.getScreenCTM();
      if (!m) return null;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(m.inverse());
      return { x: r1(p.x), y: r1(p.y) };
    }
    const nextNum = (team) => d.items.filter((it) => it.t === team).reduce((mx, it) => Math.max(mx, Number(it.n) || 0), 0) + 1;

    canvas.addEventListener('pointerdown', (e) => {
      const p = toBoard(e);
      if (!p) return;
      const hit = e.target.closest('[data-i]');
      const hi = hit ? Number(hit.dataset.i) : -1;
      if (tool === 'erase') {
        if (hi >= 0) { snapshot(); d.items.splice(hi, 1); haptic(6); render(); }
        return;
      }
      if (tool === 'arrow') {
        // La flecha sale del centro de la pieza tocada (si hay) para que quede alineada.
        const from = hi >= 0 && d.items[hi].t !== 'arrow' ? d.items[hi] : p;
        snapshot();
        d.items.push({ t: 'arrow', k: arrowKind, x: clampX(from.x), y: clampY(from.y), x2: clampX(p.x), y2: clampY(p.y) });
        drag = { kind: 'arrow', i: d.items.length - 1 };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* */ }
        render();
        return;
      }
      if (hi >= 0) {
        snapshot();
        drag = { kind: 'move', i: hi, last: p, moved: false };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* */ }
        return;
      }
      snapshot();
      const it = { t: tool === 'cone' ? gearKind : tool, x: clampX(p.x), y: clampY(p.y) };
      if (it.t === 'ladder') { it.r = 0; it.n = 6; it.y = Math.min(194 - 21, Math.max(6 + 21, it.y)); }
      if (it.t === 'hurdle') it.r = 0;
      if (tool === 'a' || tool === 'b') it.n = nextNum(tool);
      d.items.push(it);
      haptic(5);
      render();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = toBoard(e);
      if (!p) return;
      const it = d.items[drag.i];
      if (!it) return;
      if (drag.kind === 'arrow') { it.x2 = clampX(p.x); it.y2 = clampY(p.y); } else {
        const dx = p.x - drag.last.x; const dy = p.y - drag.last.y;
        if (Math.abs(dx) + Math.abs(dy) > 0.2) drag.moved = true;
        drag.last = p;
        it.x = clampX(r1(it.x + dx)); it.y = clampY(r1(it.y + dy));
        if (it.t === 'arrow') { it.x2 = clampX(r1(it.x2 + dx)); it.y2 = clampY(r1(it.y2 + dy)); }
      }
      render();
    });
    const endDrag = () => {
      if (!drag) return;
      const it = d.items[drag.i];
      if (drag.kind === 'arrow' && it && Math.hypot(it.x2 - it.x, it.y2 - it.y) < 7) { d.items.splice(drag.i, 1); hist.pop(); }
      else if (drag.kind === 'arrow' && it) {
        // Orden de la jugada: cada flecha nueva es el siguiente paso.
        const arrows = d.items.filter((x) => x.t === 'arrow' && x !== it);
        arrows.forEach((x, n) => { if (!(Number(x.s) > 0)) x.s = n + 1; });
        it.s = arrows.reduce((mx, x) => Math.max(mx, Number(x.s) || 0), 0) + 1;
      }
      if (drag.kind === 'move' && !drag.moved) {
        // Un toque (sin arrastrar) sobre una escalera o valla la gira 90°.
        if (it && (it.t === 'ladder' || it.t === 'hurdle')) { it.r = Number(it.r) === 90 ? 0 : 90; haptic(5); } else hist.pop();
      }
      drag = null;
      render();
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    const layer = {
      kind: 'board', el: wrap,
      close() { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 450); },
      onBack() { cancel(); },
    };
    function cancel() {
      if (!changed) { popLayer(layer); return; }
      actionSheet({ title: '¿Descartar los cambios del pizarrón?', actions: [{ label: 'Descartar cambios', danger: true, onClick: () => popLayer(layer) }], cancel: 'Seguir dibujando' });
    }
    wrap.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tool]');
      if (t) { setTool(t.dataset.tool); haptic(4); return; }
      const b = e.target.closest('[data-bd]');
      if (!b) return;
      switch (b.dataset.bd) {
        case 'cancel': cancel(); break;
        case 'done': popLayer(layer); o.onDone(d.items.length ? { v: d.v, items: d.items } : null); break;
        case 'undo': if (hist.length) restore(); break;
        case 'clear': if (d.items.length) { snapshot(); d.items = []; render(); toast('Pizarrón limpio', 'trash', { label: 'Deshacer', onClick: () => { if (hist.length) restore(); } }); } break;
        default: break;
      }
    });
    bindSeg(wrap, 'variant', (v) => { if (v === d.v) return; snapshot(); d.v = v; render(); });
    bindSeg(wrap, 'akind', (v) => { arrowKind = v; });
    bindSeg(wrap, 'gkind', (v) => { gearKind = v; });
    setTool(tool);
    render();
    pushLayer(layer);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  }

  // ---------------------------------------------------------------- modo clase (cronómetro + silbato)
  let audioCtx = null;
  let silentEl = null;
  function silentWavURL() {
    const rate = 8000; const n = rate / 2;
    const buf = new ArrayBuffer(44 + n);
    const v = new DataView(buf);
    const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
    v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function audioPlayback(on) {
    try {
      if (navigator.audioSession) { navigator.audioSession.type = on ? 'playback' : 'auto'; return; }
      if (!isAppleMobile()) return;
      if (on) {
        if (!silentEl) { silentEl = new Audio(silentWavURL()); silentEl.loop = true; silentEl.setAttribute('playsinline', ''); }
        const pr = silentEl.play();
        if (pr && pr.catch) pr.catch(() => {});
      } else if (silentEl) silentEl.pause();
    } catch (e) { /* sin audio */ }
  }
  function unlockAudio() {
    audioPlayback(true);
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const b = audioCtx.createBuffer(1, 1, 22050);
      const src = audioCtx.createBufferSource();
      src.buffer = b; src.connect(audioCtx.destination); src.start(0);
    } catch (e) { /* sin audio */ }
  }
  // Silbato de árbitro sintetizado: tono agudo con trino.
  function whistle(pattern) {
    try {
      if (!audioCtx) unlockAudio();
      if (!audioCtx) return;
      const ctx = audioCtx;
      const t0 = ctx.currentTime + 0.02;
      const blow = (start, dur) => {
        const o = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 2750;
        lfo.frequency.value = 36;
        depth.gain.value = 170;
        lfo.connect(depth); depth.connect(o.frequency);
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.32, start + 0.025);
        g.gain.setValueAtTime(0.32, start + dur - 0.06);
        g.gain.linearRampToValueAtTime(0, start + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(start); lfo.start(start); o.stop(start + dur + 0.02); lfo.stop(start + dur + 0.02);
      };
      const seq = pattern === 'end' ? [[0, 0.22], [0.32, 0.22], [0.64, 0.75]] : pattern === 'start' ? [[0, 0.5]] : [[0, 0.35]];
      seq.forEach((q) => blow(t0 + q[0], q[1]));
    } catch (e) { /* sin audio */ }
  }
  const fmtTimer = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // Series: juego y descanso alternados dentro de un ejercicio (sin descanso después de la última).
  function seriesPhase(s, el) {
    const n = Math.round(Number(s && s.n) || 0);
    const work = (Number(s && s.work) || 0) * 60000;
    const rest = (Number(s && s.rest) || 0) * 60000;
    if (n < 2 || work <= 0) return null;
    const cyc = work + rest;
    const k = Math.floor(el / cyc);
    if (k >= n) return null;
    const within = el - k * cyc;
    if (within < work) return { k, n, rest: false, left: work - within, len: work };
    if (k === n - 1) return null;
    return { k, n, rest: true, left: cyc - within, len: rest };
  }

  function saveRun(id, st) { pref.set('run', JSON.stringify({ id, i: st.i, acc: st.acc, extra: st.extra, started: st.started, running: st.running, since: st.since, savedAt: Date.now() })); }
  function clearRun() { pref.set('run', ''); }
  function savedRun() { try { const r = JSON.parse(pref.get('run') || 'null'); return r && r.id && Date.now() - r.savedAt < 4 * 3600e3 ? r : null; } catch (e) { return null; } }
  function offerResume() {
    const r = savedRun();
    const c = r && getClass(r.id);
    if (!c) { if (r) clearRun(); return; }
    actionSheet({
      title: 'Tienes una clase en curso',
      message: (c.name || 'Clase') + (() => { const it = (c.items || [])[r.i]; const nm = !it ? '' : isPause(it) ? (it.label || 'Pausa') : ((getEx(it.exId) || {}).title || ''); return nm ? ' · ibas en «' + nm + '»' : ''; })(),
      tint: SPORTS[c.sport] ? c.sport : 'futbol',
      actions: [{ label: 'Seguir con la clase', icon: 'play', onClick: () => runClass(r.id, r) }, { label: 'Descartar', danger: true, onClick: clearRun }],
    });
  }
  function runClass(id, resume) {
    const c = getClass(id);
    if (!c) return;
    const items = (c.items || []).map((it) => (isPause(it) ? Object.assign({}, it, { pause: true }) : Object.assign({}, it, { ex: getEx(it.exId) }))).filter((it) => it.pause || it.ex);
    const exCount = items.filter((it) => !it.pause).length;
    if (!exCount) return;
    unlockAudio();
    const st = { i: 0, running: false, since: 0, acc: items.map(() => 0), extra: items.map(() => 0), whistled: items.map(() => false), phase: items.map(() => null), started: false, done: false };
    let wake = null;
    const RING = 2 * Math.PI * 96;
    const wrap = document.createElement('div');
    wrap.className = 'run';
    wrap.dataset.tint = SPORTS[c.sport] ? c.sport : 'futbol';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Clase en curso');
    wrap.innerHTML =
      '<header class="run-head"><button type="button" class="glass-btn" data-run="close" aria-label="Salir del modo clase">' + ic('xmark') + '</button>' +
      '<div class="run-hd"><span class="run-step" data-ref="step" aria-live="polite"></span><span class="run-class">' + esc(c.name || 'Clase') + '</span></div>' +
      '<button type="button" class="glass-btn" data-run="whistle" aria-label="Tocar el silbato">' + ic('whistle') + '</button></header>' +
      '<div class="run-body" data-ref="body"></div>';
    document.body.appendChild(wrap);
    const body = $('[data-ref="body"]', wrap);

    const elapsed = (i) => st.acc[i] + (st.running && st.i === i ? Date.now() - st.since : 0);
    const baseMin = (i) => Math.max(1, itemMin(items[i]));
    const durMs = (i) => (baseMin(i) + st.extra[i]) * 60000;
    const title = (it) => (it.pause ? it.label || 'Pausa' : it.ex.title);
    function pin() { if (st.running) { st.acc[st.i] += Date.now() - st.since; st.since = Date.now(); } }
    const totalElapsed = () => items.reduce((s, it, i) => s + elapsed(i), 0);
    const plannedMs = () => items.reduce((s, it, i) => s + durMs(i), 0);
    const exNumber = (i) => items.slice(0, i + 1).filter((x) => !x.pause).length;

    function mediaHTML(ex) {
      if (ex.mediaType === 'video' && ex.mediaId) return '<video muted playsinline loop autoplay preload="auto" data-media="' + esc(ex.mediaId) + '"' + (ex.thumbId ? ' data-poster="' + esc(ex.thumbId) + '"' : '') + '></video>';
      if (ex.mediaType === 'image' && ex.mediaId) return '<img alt="" data-media="' + esc(ex.mediaId) + '">';
      if (ex.videoUrl && !hasDiagram(ex)) return '<video muted playsinline loop autoplay preload="auto" src="' + esc(ex.videoUrl) + '"' + (ex.posterUrl ? ' poster="' + esc(ex.posterUrl) + '"' : '') + '></video>';
      // En el modo clase, el pizarrón acercado a la jugada (se lee mejor que el video vertical en la franja ancha).
      return '<span class="art">' + boardSVG(ex.sport, hasDiagram(ex) ? ex.diagram : null, { fit: 'xMidYMid meet', crop: true, anim: hasDiagram(ex) && canPlay(ex.diagram) }) + '</span>';
    }
    let runPlayer = null;
    let dir = '';
    let lastSave = 0;
    function renderBlock() {
      if (runPlayer) { runPlayer.stop(); runPlayer = null; }
      body.classList.remove('go-next', 'go-prev');
      if (dir) { void body.offsetWidth; body.classList.add('go-' + dir); dir = ''; }
      if (st.done) { body.innerHTML = doneHTML(); return; }
      const it = items[st.i];
      const nxt = items[st.i + 1];
      const ex = it.ex;
      const points = ex ? String(ex.keyPoints || '').split('\n').map((x) => x.trim().replace(/^[-•·*]\s*/, '')).filter(Boolean).slice(0, 3) : [];
      body.innerHTML =
        (it.pause
          ? '<div class="run-media run-pause">' + ic('drop') + '</div><div class="run-ex"><h2>' + esc(title(it)) + '</h2></div>'
          : '<div class="run-media">' + mediaHTML(ex) + '</div><div class="run-ex"><p class="d-eyebrow">' + esc([ex.objective, ex.space].filter(Boolean).join(' · ') || SPORTS[ex.sport].name) + '</p><h2>' + esc(ex.title) + '</h2></div>') +
        '<div class="run-ring"><svg viewBox="0 0 220 220" aria-hidden="true"><circle class="rr-track" cx="110" cy="110" r="96"/><circle class="rr-bar" cx="110" cy="110" r="96" stroke-dasharray="' + RING.toFixed(1) + '" transform="rotate(-90 110 110)"/></svg>' +
        '<div class="rr-txt"><span class="rr-time" data-ref="time">0:00</span><span class="rr-sub" data-ref="sub"></span></div></div>' +
        (it.series && it.series.n > 1 ? '<div class="run-series" data-ref="dots" aria-hidden="true"></div>' : '') +
        '<div class="run-ctrls"><button type="button" class="rc" data-run="prev" aria-label="Anterior"' + (st.i === 0 ? ' disabled' : '') + '>' + ic('prev') + '</button>' +
        '<button type="button" class="rc big" data-run="toggle" aria-label="Empezar"></button>' +
        '<button type="button" class="rc" data-run="next" aria-label="' + (nxt ? 'Siguiente' : 'Terminar la clase') + '">' + ic(nxt ? 'next' : 'flag') + '</button></div>' +
        '<div class="run-sec"><span class="run-adj"><button type="button" class="cap" data-run="minus" aria-label="Quitar un minuto">−1 min</button><button type="button" class="cap" data-run="plus" aria-label="Agregar un minuto">+1 min</button></span>' +
        '<button type="button" class="cap skip-rest" data-run="skiprest" hidden>Saltar descanso</button><span class="run-next">' +
        (nxt ? 'Sigue: <b>' + esc(title(nxt)) + '</b> · ' + esc(fmtMin(itemMin(nxt))) + ' min' : 'Es lo último de la clase') + '</span></div>' +
        (points.length ? '<ul class="points run-points">' + points.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>' : '') +
        '<div class="run-foot"><div class="tl-bar" data-ref="bar">' + items.map((x, i) => '<i style="flex-grow:' + Math.max(1, itemMin(x)) + '" class="' + (x.pause ? 'pz ' : '') + (i < st.i ? 'past' : i === st.i ? 'cur' : '') + '"></i>').join('') + '</div>' +
        '<p class="run-total" data-ref="total"></p></div>';
      if (!it.pause) hydrate(body);
      if (ex && !ex.mediaId && hasDiagram(ex) && canPlay(ex.diagram) && !reduceMotion()) runPlayer = playDiagram($('.run-media', body), ex.diagram, { loop: true, delay: 700 });
      update();
    }
    function doneHTML() {
      const tot = totalElapsed();
      const cc = getClass(id);
      const rolled = cc && cc.attendance && Object.keys(cc.attendance).length;
      return '<div class="run-done"><div class="empty-art icon">' + ic('check') + '</div><h2>Clase terminada</h2>' +
        '<p>Duró ' + Math.max(1, Math.round(tot / 60000)) + ' de ' + Math.round(plannedMs() / 60000) + ' min planeados.</p>' +
        (canRoll() && !rolled ? '<button type="button" class="btn filled" data-run="roll">' + ic('check') + 'Pasar lista</button><button type="button" class="btn tinted" data-run="exit">Listo</button>' : '<button type="button" class="btn filled" data-run="exit">Listo</button>') + '</div>';
    }
    function canRoll() {
      const cc = getClass(id);
      return S.canWrite && cc && studentsOf(getGroup(cc.groupId)).length > 0;
    }
    function alarm(kind) {
      whistle(kind);
      try { if (navigator.vibrate) navigator.vibrate(kind === 'end' ? [220, 120, 220, 120, 500] : [200]); } catch (e) { /* */ }
    }
    function update() {
      if (st.done) return;
      const it = items[st.i];
      $('[data-ref="step"]', wrap).textContent = it.pause ? 'Pausa' : 'Ejercicio ' + exNumber(st.i) + ' de ' + exCount;
      const el = elapsed(st.i);
      const dur = durMs(st.i);
      const rem = dur - el;
      const over = rem < 0;
      const ph = !over && it.series ? seriesPhase(it.series, el) : null;
      const t = $('[data-ref="time"]', body);
      if (!t) return;
      t.textContent = ph ? fmtTimer(ph.left) : over ? '+' + fmtTimer(-rem) : fmtTimer(rem);
      const mins = esc(fmtMin(baseMin(st.i) + st.extra[st.i]));
      $('[data-ref="sub"]', body).textContent = ph
        ? (st.running ? '' : 'Pausado · ') + (ph.rest ? 'Descanso · sigue serie ' + (ph.k + 2) : 'Serie ' + (ph.k + 1) + ' de ' + ph.n)
        : over ? 'Tiempo cumplido' : (st.running ? 'de ' : st.started ? 'Pausado · ' : 'Dura ') + mins + ' min';
      wrap.classList.toggle('over', over);
      wrap.classList.toggle('running', st.running);
      wrap.classList.toggle('resting', !!(ph && ph.rest) || !!it.pause);
      const bar = $('.rr-bar', body);
      const prog = ph ? 1 - ph.left / ph.len : el / dur;
      if (bar) bar.style.strokeDashoffset = over ? '0' : (RING * Math.min(1, Math.max(0, prog))).toFixed(1);
      const dots = $('[data-ref="dots"]', body);
      if (dots) {
        const n = it.series.n;
        const cur = ph ? ph.k : n;
        const html = Array.from({ length: n }, (_, k) => '<i class="' + (k < cur ? 'done' : k === cur ? (ph && ph.rest ? 'done' : 'cur') : '') + '"></i>').join('');
        if (dots.innerHTML !== html) dots.innerHTML = html;
      }
      const tg = $('[data-run="toggle"]', body);
      if (tg) {
        const key = String(st.running) + st.started;
        if (tg.dataset.state !== key) {
          tg.innerHTML = st.running ? ic('pause') : ic('play') + (!st.started ? '<span>Empezar</span>' : '');
          tg.setAttribute('aria-label', st.running ? 'Pausar' : st.started ? 'Seguir' : 'Empezar');
          tg.dataset.state = key;
        }
        tg.classList.toggle('wide', !st.started);
      }
      $('[data-ref="total"]', body).textContent = 'Llevas ' + fmtTimer(totalElapsed()) + ' de ' + fmtTimer(plannedMs());
      const curBar = $('[data-ref="bar"] .cur', body);
      if (curBar) curBar.style.setProperty('--p', Math.min(100, Math.round((el / dur) * 100)) + '%');
      // Silbato al cambiar de serie o de descanso, y al terminar el tiempo.
      const sk = $('[data-run="skiprest"]', body);
      if (sk) sk.hidden = !(ph && ph.rest);
      if (st.started && Date.now() - lastSave > 1000) { lastSave = Date.now(); saveRun(id, st); }
      const pk = ph ? ph.k + (ph.rest ? 'r' : 'w') : over ? 'over' : 'x';
      if (st.running && st.phase[st.i] !== null && pk !== st.phase[st.i] && ph) alarm(ph.rest ? 'short' : 'start');
      st.phase[st.i] = pk;
      if (over && !st.whistled[st.i] && st.running) { st.whistled[st.i] = true; alarm('end'); }
    }
    async function keepAwake() {
      try { if (navigator.wakeLock && document.visibilityState === 'visible') wake = await navigator.wakeLock.request('screen'); } catch (e) { wake = null; }
    }
    function go(i) {
      pin();
      const ni = Math.max(0, Math.min(items.length - 1, i));
      dir = ni > st.i ? 'next' : ni < st.i ? 'prev' : '';
      st.i = ni;
      if (st.running) st.since = Date.now();
      haptic(8);
      renderBlock();
    }
    function finish() {
      pin();
      st.running = false;
      st.done = true;
      $('[data-ref="step"]', wrap).textContent = 'Terminada';
      wrap.classList.remove('over', 'running', 'resting');
      clearRun();
      whistle('end');
      renderBlock();
      if (S.canWrite && totalElapsed() >= 60000) mutateClass(id, (x) => { x.lastRunAt = Date.now(); });
    }
    const onVis = () => { if (document.visibilityState === 'visible') { keepAwake(); update(); } };
    document.addEventListener('visibilitychange', onVis);
    const timer = setInterval(update, 250);
    const layer = {
      kind: 'run', el: wrap,
      focusEl() { return $('[data-run="toggle"]', wrap) || $('[data-run="close"]', wrap); },
      close() {
        clearInterval(timer);
        audioPlayback(false);
        if (runPlayer) runPlayer.stop();
        document.removeEventListener('visibilitychange', onVis);
        try { if (wake) wake.release(); } catch (e) { /* */ }
        wrap.classList.remove('open');
        setTimeout(() => wrap.remove(), 450);
      },
      onBack() { exit(); },
    };
    function exit() {
      if (st.done || !st.started) { popLayer(layer); return; }
      actionSheet({ title: '¿Salir del modo clase?', message: 'Se pierde el tiempo y la clase no cuenta como dada.', actions: [{ label: 'Salir', danger: true, onClick: () => { clearRun(); popLayer(layer); } }], cancel: 'Seguir con la clase' });
    }
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-run]');
      if (!b) return;
      switch (b.dataset.run) {
        case 'close': exit(); break;
        case 'exit': popLayer(layer); break;
        case 'roll': popLayer(layer); setTimeout(() => openAttendance(id), 380); break;
        case 'whistle': unlockAudio(); whistle('short'); haptic(20); break;
        case 'toggle':
          unlockAudio();
          if (st.running) { pin(); st.running = false; } else {
            if (!st.started) { st.started = true; whistle('start'); keepAwake(); }
            st.running = true; st.since = Date.now();
          }
          haptic(10);
          update();
          break;
        case 'prev': go(st.i - 1); break;
        case 'next':
          if (st.i < items.length - 1) { go(st.i + 1); break; }
          if (!st.started) { actionSheet({ title: 'No has empezado el cronómetro', message: 'La clase no se marcará como dada.', actions: [{ label: 'Salir del modo clase', onClick: () => popLayer(layer) }], cancel: 'Seguir aquí' }); break; }
          actionSheet({ title: '¿Terminar la clase?', actions: [{ label: 'Terminar clase', onClick: finish }], cancel: 'Seguir con la clase' });
          break;
        case 'minus':
          st.extra[st.i] = Math.max(1 - baseMin(st.i), st.extra[st.i] - 1);
          haptic(6);
          update();
          break;
        case 'skiprest': {
          const it = items[st.i];
          const ph = it.series ? seriesPhase(it.series, elapsed(st.i)) : null;
          if (ph && ph.rest) { pin(); st.acc[st.i] += ph.left + 1; haptic(8); update(); }
          break;
        }
        case 'plus':
          st.extra[st.i] += 1;
          if (durMs(st.i) - elapsed(st.i) > 0) st.whistled[st.i] = false;
          haptic(6);
          update();
          break;
        default: break;
      }
    });
    if (resume && Array.isArray(resume.acc) && resume.acc.length === items.length) {
      st.i = Math.max(0, Math.min(items.length - 1, Number(resume.i) || 0));
      st.acc = resume.acc.map((x) => Number(x) || 0);
      st.extra = (resume.extra || []).map((x) => Number(x) || 0).concat(items.map(() => 0)).slice(0, items.length);
      st.started = !!resume.started;
      st.running = !!resume.running;
      st.since = st.running ? Number(resume.since) || Date.now() : 0;
      st.whistled = items.map((x, k) => k < st.i || st.acc[k] >= durMs(k));
      if (st.started) keepAwake();
    }
    renderBlock();
    pushLayer(layer);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  }

  // ---------------------------------------------------------------- compartir (WhatsApp, PDF, texto)
  function longDate(s) {
    const d = parseDay(s);
    if (!d) return '';
    try { return cap(new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)); } catch (e) { return s; }
  }
  // Renglones del plan para compartir: ejercicios (aunque ya no estén en la biblioteca) y pausas.
  function planForShare(c) {
    return (c.items || []).map((it) => {
      if (isPause(it)) return { pause: true, title: it.label || 'Pausa', min: itemMin(it) };
      const ex = it.exId ? getEx(it.exId) : null;
      if (!ex && !it.gone) return null;
      return { ex, title: ex ? ex.title : it.gone.title, min: itemMin(it), series: it.series || null };
    }).filter(Boolean);
  }
  function classText(c) {
    const g = getGroup(c.groupId);
    const rows = planForShare(c);
    const nEx = rows.filter((r) => !r.pause).length;
    const lines = ['*' + (c.name || 'Clase') + '*', [SPORTS[c.sport] ? SPORTS[c.sport].name : '', longDate(c.date), g ? 'Grupo ' + g.name : ''].filter(Boolean).join(' · '), fmtMin(classTotal(c)) + ' min · ' + plural(nEx, 'ejercicio', 'ejercicios'), ''];
    let t = 0;
    rows.forEach((r) => {
      if (r.pause) { lines.push('_' + fmtMin(t) + '′ · ' + r.title + ' (' + fmtMin(r.min) + ' min)_'); lines.push(''); t += r.min; return; }
      lines.push('*' + fmtMin(t) + '′ · ' + r.title + '* (' + fmtMin(r.min) + ' min' + (r.series ? ' · ' + seriesText(r.series) : '') + ')');
      t += r.min;
      const ex = r.ex;
      if (ex) {
        const meta = [ex.objective, ex.players, ex.space].filter(Boolean).join(' · ');
        if (meta) lines.push(meta);
        if (ex.material) lines.push('Material: ' + ex.material);
        String(ex.keyPoints || '').split('\n').map((x) => x.trim().replace(/^[-•·*]\s*/, '')).filter(Boolean).slice(0, 4).forEach((p) => lines.push('• ' + p));
        if (ex.link) lines.push('Video: ' + ex.link);
      }
      lines.push('');
    });
    if (c.notes) lines.push('Notas: ' + c.notes);
    return lines.join('\n').trim();
  }
  function copyText(text) {
    const fallback = () => {
      const sheet = openSheet({ title: 'Copiar texto', cancelLabel: 'Cerrar', bodyHTML: '<p class="muted" style="margin:0 4px 10px">Mantén presionado el texto para copiarlo.</p><div class="group"><textarea id="copy-txt" readonly aria-label="Texto de la clase" style="min-height:320px">' + esc(text) + '</textarea></div>' });
      const ta = $('#copy-txt', sheet.body);
      setTimeout(() => { try { ta.focus(); ta.select(); } catch (e) { /* */ } }, 450);
    };
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) { fallback(); return; }
      navigator.clipboard.writeText(text).then(() => toast('Texto copiado'), fallback);
    } catch (e) { fallback(); }
  }
  function shareClass(c) {
    const text = classText(c);
    actionSheet({
      title: 'Compartir «' + (c.name || 'la clase') + '»',
      tint: SPORTS[c.sport] ? c.sport : 'futbol',
      actions: [
        { label: 'Mandar texto por WhatsApp', icon: 'chat', href: 'https://wa.me/?text=' + encodeURIComponent(text) },
        { label: 'PDF para imprimir', icon: 'doc', onClick: () => exportPDF(c) },
        { label: 'Mandar a otro profe', icon: 'box', onClick: () => sendClass(c) },
        { label: 'Copiar texto', icon: 'copy', onClick: () => copyText(text) },
      ],
    });
  }

  // La letra del PDF (Helvetica) solo tiene caracteres latinos: ′ → ', → → ->, emojis fuera.
  const WIN_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  function pdfClean(v) {
    if (Array.isArray(v)) return v.map(pdfClean);
    if (typeof v !== 'string') return v;
    return v.replace(/[′‘’]/g, "'").replace(/[″“”]/g, '"').replace(/[→⟶➜➔]/g, '->').replace(/[←]/g, '<-').replace(/[✓✔☑]/g, '')
      .replace(/[\u2010-\u2012\u2212]/g, '-').replace(/\u00a0/g, ' ')
      .replace(/[^\u0000-\u00ff]/gu, (ch) => (WIN_EXTRA.indexOf(ch) >= 0 ? ch : ''))
      .replace(/ {2,}/g, ' ');
  }
  function safePDF(doc) {
    ['text', 'splitTextToSize', 'getTextWidth', 'textWithLink'].forEach((fn) => {
      const orig = doc[fn] && doc[fn].bind(doc);
      if (orig) doc[fn] = (t, ...rest) => orig(pdfClean(t), ...rest);
    });
    return doc;
  }
  // Corta por letras completas (no parte un emoji a la mitad).
  const cutText = (s, n) => Array.from(String(s || '')).slice(0, n).join('');

  // jsPDF va incluido en app/vendor (funciona sin internet); cdnjs queda de respaldo.
  const JSPDF_URLS = ['app/vendor/jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
  let jspdfPromise = null;
  function loadScript(src) {
    return new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = src;
      sc.async = true;
      sc.onload = res;
      sc.onerror = () => { sc.remove(); rej(new Error('script')); };
      document.head.appendChild(sc);
    });
  }
  function loadJsPDF() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (!jspdfPromise) {
      jspdfPromise = (async () => {
        for (const u of JSPDF_URLS) {
          try { await loadScript(u); if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF; } catch (e) { /* siguiente */ }
        }
        jspdfPromise = null;
        throw new Error('pdf');
      })();
    }
    return jspdfPromise;
  }
  function imageToDataURL(src, w, h) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d');
          const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) || 1;
          const dw = img.naturalWidth * s; const dh = img.naturalHeight * s;
          ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
          res(cv.toDataURL('image/jpeg', 0.86));
        } catch (e) { res(null); }
      };
      img.onerror = () => res(null);
      img.src = src;
    });
  }
  async function exImage(ex) {
    if (!ex.thumbId && ex.posterUrl && !hasDiagram(ex)) { const r = await imageToDataURL(ex.posterUrl, 240, 300); if (r) return r; }
    if (ex.thumbId) {
      const u = await S.backend.mediaURL(ex.thumbId).catch(() => null);
      if (u) { const r = await imageToDataURL(u, 240, 300); if (r) return r; }
    }
    const svg = boardSVG(ex.sport, hasDiagram(ex) ? ex.diagram : null, { export: [240, 300] });
    return imageToDataURL('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), 240, 300);
  }
  // Guarda o comparte un archivo. Regresa true si se guardó o se compartió.
  async function saveFile(blob, filename, what) {
    what = what || 'PDF';
    const cl = window.claude;
    if (framed && cl && typeof cl.use === 'function') {
      const dl = await cl.use('downloads').catch(() => null);
      if (!dl) { alertBox('No se puede descargar aquí', 'Abre Cancha en el navegador de tu celular o computadora para descargar el archivo.'); return false; }
      try { const r = await dl.save({ filename, data: blob }); if (r && r.status === 'saved') { toast(what + ' descargado'); return true; } } catch (e) {
        if (!e || e.code !== 'declined') alertBox('No se pudo descargar', 'Vuelve a intentarlo en un momento.');
      }
      return false;
    }
    try {
      const file = new File([blob], filename, { type: blob.type || 'application/pdf' });
      if (isTouch && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return true; }
    } catch (e) { if (e && e.name === 'AbortError') return false; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
    toast(what + ' descargado');
    return true;
  }
  async function exportPDF(c) {
    toast('Preparando el PDF…', 'doc');
    let JsPDF;
    try { JsPDF = await loadJsPDF(); } catch (e) { alertBox('No se pudo crear el PDF', 'Revisa tu conexión a internet y vuelve a intentarlo.'); return; }
    try {
      const doc = safePDF(new JsPDF({ unit: 'pt', format: 'letter' }));
      const W = 612; const H = 792; const M = 46;
      const tint = c.sport === 'basquet' ? [196, 78, 8] : [14, 128, 62];
      const soft = (o) => tint.map((v) => Math.round(255 - (255 - v) * o));
      const ink = [17, 17, 20]; const grey = [100, 100, 108]; const water = [40, 120, 200];
      const g = getGroup(c.groupId);
      const rows = planForShare(c);
      const total = classTotal(c);
      const nEx = rows.filter((r) => !r.pause).length;
      const imgs = await Promise.all(rows.map((r) => (r.ex ? exImage(r.ex).catch(() => null) : null)));
      let y = M + 4;
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...ink); doc.setFontSize(24);
      const title = doc.splitTextToSize(c.name || 'Clase', W - 2 * M);
      doc.text(title, M, y + 18);
      y += (title.length - 1) * 28 + 40;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...grey);
      doc.text([SPORTS[c.sport] ? SPORTS[c.sport].name : '', longDate(c.date), g ? 'Grupo ' + g.name : ''].filter(Boolean).join('   ·   '), M, y);
      y += 16;
      doc.text(fmtMin(total) + ' min   ·   ' + plural(nEx, 'ejercicio', 'ejercicios'), M, y);
      y += 16;
      if (total > 0) {
        let x = M; const bw = W - 2 * M - (rows.length - 1) * 3;
        let k = 0;
        rows.forEach((r) => {
          const w = Math.max(3, (bw * r.min) / total);
          if (r.pause) doc.setFillColor(200, 222, 245); else { doc.setFillColor(...soft([1, 0.72, 0.5, 0.34][k % 4])); k++; }
          doc.roundedRect(x, y, w, 7, 3.5, 3.5, 'F');
          x += w + 3;
        });
      }
      y += 30;
      let t = 0;
      const TX = M + 108; const TW = W - TX - M - 8;
      rows.forEach((r, i) => {
        if (r.pause) {
          if (y + 34 > H - M - 16) { doc.addPage(); y = M + 10; }
          doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...water);
          doc.text(fmtMin(t) + "'", M, y + 12);
          doc.setFontSize(12); doc.text(r.title, TX, y + 12);
          const tw = doc.getTextWidth(r.title);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...grey);
          doc.text('Pausa, ' + fmtMin(r.min) + ' min', TX + tw + 12, y + 12);
          t += r.min;
          y += 34;
          doc.setDrawColor(225, 225, 230); doc.setLineWidth(0.6); doc.line(M, y - 12, W - M, y - 12);
          return;
        }
        const ex = r.ex || { title: r.title };
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const desc = ex.description ? doc.splitTextToSize(ex.description, TW) : [];
        const pts = String(ex.keyPoints || '').split('\n').map((x) => x.trim().replace(/^[-•·*]\s*/, '')).filter(Boolean);
        const ptLines = pts.map((p) => doc.splitTextToSize(p, TW - 12));
        const meta = [ex.objective, fmtMin(r.min) + ' min', r.series ? seriesText(r.series) : '', ex.players ? 'Jugadores: ' + ex.players : '', ex.space ? 'Espacio: ' + ex.space : '', ex.age].filter(Boolean).join('  ·  ');
        const metaLines = doc.splitTextToSize(meta, TW);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
        const tl = doc.splitTextToSize(ex.title, TW);
        const textH = tl.length * 16 + metaLines.length * 12 + 4 + (desc.length ? desc.length * 13 + 6 : 0) + ptLines.reduce((s, l) => s + l.length * 13 + 3, 0) + (ex.material ? 15 : 0) + (ex.link ? 15 : 0);
        const blockH = Math.max(84, textH) + 22;
        if (y + blockH > H - M - 16) { doc.addPage(); y = M + 10; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...tint);
        doc.text(fmtMin(t) + "'", M, y + 12);
        if (imgs[i]) { try { doc.addImage(imgs[i], 'JPEG', M + 38, y, 56, 70); } catch (e) { /* imagen no válida */ } }
        let ty = y + 12;
        doc.setTextColor(...ink); doc.text(tl, TX, ty);
        ty += (tl.length - 1) * 16 + 15;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...grey);
        doc.text(metaLines, TX, ty);
        ty += metaLines.length * 12 + 4;
        doc.setFontSize(10); doc.setTextColor(...ink);
        if (desc.length) { doc.text(desc, TX, ty); ty += desc.length * 13 + 6; }
        ptLines.forEach((l) => { doc.setTextColor(...tint); doc.text('•', TX, ty); doc.setTextColor(...ink); doc.text(l, TX + 12, ty); ty += l.length * 13 + 3; });
        if (ex.material) { doc.setFontSize(9.5); doc.setTextColor(...grey); doc.text('Material: ' + ex.material, TX, ty + 2, { maxWidth: TW }); ty += 15; }
        if (ex.link) { doc.setFontSize(9.5); doc.setTextColor(...tint); try { doc.textWithLink('Ver video de referencia', TX, ty + 2, { url: ex.link }); } catch (e) { doc.text('Video: ' + ex.link, TX, ty + 2, { maxWidth: TW }); } }
        t += r.min;
        y += blockH;
        doc.setDrawColor(225, 225, 230); doc.setLineWidth(0.6); doc.line(M, y - 12, W - M, y - 12);
      });
      if (c.notes) {
        doc.setFontSize(10);
        const nl = doc.splitTextToSize(c.notes, W - 2 * M);
        if (y + nl.length * 13 + 30 > H - M - 16) { doc.addPage(); y = M + 10; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...ink); doc.text('Notas', M, y + 4);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(nl, M, y + 22);
      }
      const pages = doc.getNumberOfPages();
      if (pages > 1) {
        for (let p = 1; p <= pages; p++) {
          doc.setPage(p);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...grey);
          doc.text('Página ' + p + ' de ' + pages, W / 2, H - 24, { align: 'center' });
        }
      }
      const name = cutText((c.name || 'Clase').replace(/[\\/:*?"<>|º°ª]+/g, ''), 80) + '.pdf';
      await saveFile(doc.output('blob'), name);
    } catch (e) {
      alertBox('No se pudo crear el PDF', 'Vuelve a intentarlo en un momento.');
    }
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act="vtoggle"]');
    if (!b) return;
    const v = $('video', b);
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); b.classList.remove('paused'); } else { v.pause(); b.classList.add('paused'); }
  });

  // ---------------------------------------------------------------- tutorial (la primera vez)
  // Cinco pasos cortos con dibujos que se mueven. Se puede saltar y se vuelve a ver desde Ajustes.
  const TUT_BOARD = { v: 'full', items: [
    { t: 'cone', x: 50, y: 70 }, { t: 'cone', x: 110, y: 70 }, { t: 'cone', x: 110, y: 130 }, { t: 'cone', x: 50, y: 130 },
    { t: 'a', x: 80, y: 66, n: 1 }, { t: 'a', x: 114, y: 100, n: 2 }, { t: 'a', x: 80, y: 134, n: 3 }, { t: 'a', x: 46, y: 100, n: 4 },
    { t: 'b', x: 66, y: 80, n: 1 }, { t: 'ball', x: 88, y: 72 },
    { t: 'arrow', x: 80, y: 66, k: 'pase', x2: 114, y2: 100, s: 1 }, { t: 'arrow', x: 66, y: 80, k: 'mov', x2: 100, y2: 114, s: 1 },
    { t: 'arrow', x: 114, y: 100, k: 'pase', x2: 46, y2: 100, s: 2 }, { t: 'arrow', x: 100, y: 114, k: 'mov', x2: 62, y2: 88, s: 2 },
    { t: 'arrow', x: 46, y: 100, k: 'pase', x2: 80, y2: 134, s: 3 },
  ] };
  const devWord = () => (/iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iPad'
    : /iPhone|iPod|Android.*Mobile/.test(navigator.userAgent) ? 'celular' : 'computadora');
  const needsTutorial = () => !!S.canWrite && !pref.get('onboarded');

  function tutorialSlides() {
    const cloud = S.backend && S.backend.kind === 'cloud';
    const n = CAT() ? CAT().exercises.length : 0;
    return [
      { art: 'board', title: 'Bienvenido a Cancha', text: 'Aquí preparas y das tus clases de fútbol y básquetbol.' },
      { art: 'cards', title: 'Ejercicios con video', text: (n ? n + ' ejercicios' : 'Ejercicios') + ' recomendados, listos para usar. También puedes crear los tuyos.' },
      { art: 'timer', title: 'El reloj te guía', text: 'Toca Iniciar y Cancha lleva el tiempo de cada ejercicio. El silbato suena al cambiar.' },
      { art: 'roll', title: 'Pasa lista en segundos', text: 'Marca quién vino con un toque y saca el reporte en PDF.' },
      cloud
        ? { art: 'safe', title: 'Se guarda en tu cuenta', text: 'Tus clases quedan en tu cuenta de Claude. Las ves en el celular y en la computadora.' }
        : { art: 'safe', title: 'Todo se queda en tu ' + devWord(), text: 'No necesitas cuenta ni internet. De vez en cuando toca «Respaldo» para guardar una copia.' },
    ];
  }

  function tutArtHTML(kind) {
    const cx = (id) => (CAT() ? CAT().exercises.find((e) => e.id === id) : null);
    if (kind === 'board') return '<div class="ta-board"><span class="art">' + boardSVG('futbol', TUT_BOARD, { crop: true }) + '</span></div>';
    if (kind === 'cards') {
      return '<div class="ta-cards">' + [['cf-15', 'Escalera de coordinación', 'futbol'], ['cf-02', 'Rondo 4 contra 1', 'futbol'], ['cb-18', 'Circuito con escalera', 'basquet']].map((c, i) => {
        const x = cx(c[0]);
        const meta = x ? [x.objective, x.duration ? x.duration + ' min' : ''].filter(Boolean).join(' · ') : SPORTS[c[2]].name;
        return '<span class="ta-card c' + i + '" data-tint="' + c[2] + '"><span class="ta-img"><img alt="" decoding="async" src="' + esc((x && x.thumbUrl) || 'app/videos/' + c[0] + '-t.jpg') + '"><span class="ta-play">' + ic('play') + '</span></span>' +
          '<b>' + esc(c[1]) + '</b><small>' + esc(meta) + '</small></span>';
      }).join('') + '</div>';
    }
    if (kind === 'timer') {
      return '<div class="ta-timer" data-tint="futbol"><span class="tt-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="tt-track" cx="60" cy="60" r="52"/><circle class="tt-bar" cx="60" cy="60" r="52" pathLength="100"/></svg>' +
        '<span class="tt-txt"><b class="tt-time">0:05</b><small class="tt-name">Rondo 4 contra 1</small></span></span>' +
        '<span class="tt-whistle">' + ic('whistle') + '<i></i><i></i></span></div>';
    }
    if (kind === 'roll') {
      const kids = [['Ana', 'p'], ['Luis', 'p'], ['Sofía', 't'], ['Diego', 'p'], ['Mateo', 'f']];
      return '<div class="ta-roll" data-tint="clases"><div class="tr-head"><b>5.º A</b><span class="tr-count"><b>0</b> de ' + kids.length + '</span></div>' +
        kids.map((k, i) => '<div class="tr-row" style="--d:' + (0.35 + i * 0.42).toFixed(2) + 's" data-st="' + k[1] + '"><span class="avatar">' + esc(k[0][0]) + '</span><span class="tr-name">' + esc(k[0]) + '</span>' +
          '<span class="tr-mark">' + (k[1] === 'p' ? ic('check') : k[1] === 't' ? '<b>R</b>' : ic('xmark')) + '</span></div>').join('') +
        '<span class="tr-pdf">' + ic('doc') + 'Reporte de asistencia.pdf</span></div>';
    }
    return '<div class="ta-safe" data-tint="clases"><span class="ts-dev"><span class="ts-cam"></span><span class="ts-app">' + ic('clases') + '</span></span>' +
      '<span class="ts-file">' + ic('box') + 'Respaldo</span><span class="ts-ok">' + ic('check') + '</span></div>';
  }

  // Lo que se mueve en cada paso (la jugada, el reloj, el pase de lista). Regresa cómo pararlo.
  function tutAnimate(slide, kind) {
    const still = reduceMotion();
    if (kind === 'board') {
      const host = $('.ta-board', slide);
      if (still) return () => {};
      const pl = playDiagram(host, TUT_BOARD, { loop: true, delay: 500 });
      return () => pl.stop();
    }
    if (kind === 'timer') {
      const bar = $('.tt-bar', slide); const time = $('.tt-time', slide); const name = $('.tt-name', slide); const wrap = $('.ta-timer', slide);
      const names = ['Rondo 4 contra 1', 'Escalera de coordinación', 'Tiros libres'];
      const tints = ['futbol', 'futbol', 'basquet'];
      let k = 0; let left = 5; let iv = 0; let to = 0;
      const paint = () => { time.textContent = '0:0' + left; bar.style.strokeDashoffset = String(100 - left * 20); };
      if (still) { paint(); return () => {}; }
      const tick = () => {
        left--;
        paint();
        if (left > 0) return;
        clearInterval(iv);
        wrap.classList.add('blow');
        to = setTimeout(() => {
          wrap.classList.remove('blow');
          k = (k + 1) % names.length;
          name.textContent = names[k];
          wrap.dataset.tint = tints[k];
          left = 5; paint();
          iv = setInterval(tick, 1000);
        }, 1600);
      };
      paint();
      iv = setInterval(tick, 1000);
      return () => { clearInterval(iv); clearTimeout(to); };
    }
    if (kind === 'roll') {
      const box = $('.ta-roll', slide); const cnt = $('.tr-count b', slide);
      const rows = $$('.tr-row', slide);
      let tos = [];
      const run = () => {
        box.classList.remove('go'); void box.offsetWidth; box.classList.add('go');
        cnt.textContent = '0';
        tos = rows.map((r, i) => setTimeout(() => { cnt.textContent = String(rows.slice(0, i + 1).filter((x) => x.dataset.st !== 'f').length); }, (0.35 + i * 0.42) * 1000 + 150));
        tos.push(setTimeout(run, 6200));
      };
      if (still) { box.classList.add('go', 'still'); cnt.textContent = String(rows.filter((x) => x.dataset.st !== 'f').length); return () => {}; }
      run();
      return () => tos.forEach(clearTimeout);
    }
    return () => {};
  }

  function showTutorial(done) {
    if ($('.onb-wrap')) return;
    const slides = tutorialSlides();
    const last = slides.length - 1;
    let i = 0;
    let stopArt = () => {};
    const wrap = document.createElement('div');
    wrap.className = 'onb-wrap';
    wrap.dataset.tint = 'clases';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Cómo funciona Cancha');
    wrap.innerHTML =
      '<div class="onb">' +
      '<div class="onb-top"><span class="onb-step" aria-live="polite"></span><button type="button" class="onb-skip" data-onb="skip">Saltar</button></div>' +
      '<div class="onb-view"><div class="onb-track">' +
      slides.map((s, k) => '<section class="onb-slide" data-k="' + k + '" aria-hidden="true"><div class="onb-art">' + tutArtHTML(s.art) + '</div>' +
        '<h2>' + esc(s.title) + '</h2><p>' + esc(s.text) + '</p></section>').join('') +
      '</div></div>' +
      '<div class="onb-dots" role="tablist" aria-label="Pasos">' + slides.map((s, k) => '<button type="button" role="tab" data-dot="' + k + '" aria-label="Paso ' + (k + 1) + '"></button>').join('') + '</div>' +
      '<button type="button" class="btn filled onb-next" data-onb="next"><span></span>' + ic('chevR') + '</button>' +
      '</div>';
    document.body.appendChild(wrap);
    const track = $('.onb-track', wrap);
    const nextBtn = $('[data-onb="next"]', wrap);
    function go(n, quiet) {
      i = Math.max(0, Math.min(last, n));
      stopArt();
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      $$('.onb-slide', wrap).forEach((s, k) => { s.setAttribute('aria-hidden', String(k !== i)); s.classList.toggle('on', k === i); });
      $$('[data-dot]', wrap).forEach((d, k) => d.setAttribute('aria-selected', String(k === i)));
      $('.onb-step', wrap).textContent = 'Paso ' + (i + 1) + ' de ' + slides.length;
      $('span', nextBtn).textContent = i === last ? 'Empezar' : 'Siguiente';
      nextBtn.classList.toggle('end', i === last);
      $('.onb-skip', wrap).style.visibility = i === last ? 'hidden' : '';
      const slide = $$('.onb-slide', wrap)[i];
      stopArt = tutAnimate(slide, slides[i].art);
      if (!quiet) haptic(4);
    }
    let closed = false;
    function finish() {
      if (closed) return;
      closed = true;
      pref.set('onboarded', '1');
      popLayer(layer);
      if (done) setTimeout(done, 450);
    }
    const layer = {
      kind: 'tutorial', el: wrap,
      focusEl() { return nextBtn; },
      close() { stopArt(); wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 450); },
      onBack() { if (i > 0) go(i - 1); else finish(); },
    };
    wrap.addEventListener('click', (e) => {
      const d = e.target.closest('[data-dot]');
      if (d) { go(Number(d.dataset.dot)); return; }
      const b = e.target.closest('[data-onb]');
      if (!b) return;
      if (b.dataset.onb === 'skip' || i === last) finish(); else go(i + 1);
    });
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); if (i < last) go(i + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (i > 0) go(i - 1); }
    });
    // Deslizar con el dedo para pasar de paso
    const view = $('.onb-view', wrap);
    let x0 = null; let y0 = 0; let dx = 0; let horiz = null;
    view.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; dx = 0; horiz = null; });
    view.addEventListener('pointermove', (e) => {
      if (x0 == null) return;
      dx = e.clientX - x0;
      if (horiz == null && (Math.abs(dx) > 8 || Math.abs(e.clientY - y0) > 8)) horiz = Math.abs(dx) > Math.abs(e.clientY - y0);
      if (!horiz) return;
      const edge = (i === 0 && dx > 0) || (i === last && dx < 0) ? 0.3 : 1;
      track.style.transition = 'none';
      track.style.transform = 'translateX(calc(' + (-i * 100) + '% + ' + Math.round(dx * edge) + 'px))';
    });
    const up = () => {
      if (x0 == null) return;
      x0 = null;
      track.style.transition = '';
      if (horiz && dx < -50 && i < last) go(i + 1);
      else if (horiz && dx > 50 && i > 0) go(i - 1);
      else track.style.transform = 'translateX(' + (-i * 100) + '%)';
    };
    view.addEventListener('pointerup', up);
    view.addEventListener('pointercancel', up);
    go(0, true);
    pushLayer(layer);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  }

  // ---------------------------------------------------------------- eventos globales
  function bindGlobal() {
    $('#in-capture').addEventListener('change', onFileInput);
    $('#in-pick').addEventListener('change', onFileInput);
    $('#in-import').addEventListener('change', onFileInput);
    $('.tabbar').addEventListener('click', (e) => {
      const b = e.target.closest('.tab');
      if (b) { haptic(4); setTab(b.dataset.tab); }
    });
    $('.tabbar').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = TABS.indexOf(S.tab);
      const t = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
      e.preventDefault(); setTab(t); $('#tab-' + t).focus();
    });
    $('#fab').addEventListener('click', () => {
      if (!S.ready || !S.canWrite) return;
      haptic(8);
      if (S.tab === 'grupos') openGroupEditor({});
      else if (S.tab === 'ejercicios') openExerciseEditor({ sport: S.sport });
      else openClassEditor({});
    });
    $('#main').addEventListener('click', (e) => {
      const card = e.target.closest('[data-open-ex]');
      if (card) { openExercise(card.dataset.openEx); return; }
      const a = e.target.closest('[data-act]');
      if (a) {
        switch (a.dataset.act) {
          case 'backup': openBackupSheet(); return;
          case 'settings': openSettings(); return;
          case 'backup-now': backupAll(true); return;
          case 'install-help': showInstallHelp(); return;
          case 'clear-examples': clearExamples(); return;
          case 'new-ex': openExerciseEditor({ sport: S.sport }); return;
          case 'new-class': openClassEditor({}); return;
          case 'new-group': openGroupEditor({}); return;
          case 'start-class': runClass(a.dataset.id); return;
          case 'roll-class': openAttendance(a.dataset.id); return;
          case 'plan-class': openClass(a.dataset.id); setTimeout(() => openPicker(a.dataset.id), 450); return;
          case 'catalog': openCatalog(S.sport); return;
          case 'new-section': openSectionEditor({}); return;
          case 'filters': openFilters(S.sport); return;
          case 'clear-filters': S.fx[S.sport] = null; S.sig = {}; renderEjercicios(); return;
          default: break;
        }
      }
      const cl = e.target.closest('[data-open-class]');
      if (cl) { openClass(cl.dataset.openClass); return; }
      const gr = e.target.closest('[data-open-group]');
      if (gr) { openGroup(gr.dataset.openGroup); return; }
      const tp = e.target.closest('[data-open-template]');
      if (tp) { openTemplate(tp.dataset.openTemplate); return; }
      const oc = e.target.closest('[data-open-cat]');
      if (oc) { openCatalogEx(oc.dataset.openCat); return; }
      const sc = e.target.closest('[data-open-section]');
      if (sc) { openSection(sc.dataset.openSection); return; }
      const uf = e.target.closest('[data-unfilter]');
      if (uf) { removeFilter(S.sport, uf.dataset.unfilter); haptic(4); S.sig = {}; renderEjercicios(); return; }
      const chip = e.target.closest('[data-chip]');
      if (chip) {
        S.f[S.sport] = chip.dataset.chip;
        haptic(4);
        renderEjercicios();
      }
    });
    $('#q-ejercicios').addEventListener('input', (e) => { S.q[S.sport] = e.target.value; renderEjercicios(); });
    bindSeg($('#screen-ejercicios'), 'sport', (v) => setSport(v));
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener('hashchange', () => routeHash(false));
  }
  // Enlaces viejos (#futbol, #basquet) llevan a Ejercicios con ese deporte.
  function routeHash(initial) {
    const h = location.hash.slice(1);
    if (h === 'futbol' || h === 'basquet') {
      if (h !== S.sport) setSport(h);
      // Al abrir desde el ícono viejo (#futbol) se respeta la última pestaña usada.
      const saved = pref.get('tab');
      setTab(initial ? (TABS.indexOf(saved) >= 0 ? saved : 'clases') : 'ejercicios', initial);
      return true;
    }
    if (TABS.indexOf(h) >= 0) { if (h !== S.tab || initial) setTab(h, initial); return true; }
    return false;
  }
  function syncSportSeg() {
    const seg = $('#screen-ejercicios [data-seg="sport"]');
    if (!seg) return;
    const btns = $$('button[data-val]', seg);
    btns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.val === S.sport)));
    seg.style.setProperty('--i', Math.max(0, btns.findIndex((b) => b.dataset.val === S.sport)));
  }

  async function boot() {
    applyTheme(pref.get('theme') || 'auto');
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(pref.get('theme') || 'auto')); } catch (e) { /* navegador viejo */ }
    S.sport = pref.get('sport') === 'basquet' ? 'basquet' : 'futbol';
    buildShell();
    bindGlobal();
    $('#screen-ejercicios').dataset.tint = S.sport;
    if (!routeHash(true)) {
      const saved = pref.get('tab');
      if (saved === 'basquet' && !pref.get('sport')) setSport('basquet');
      setTab(TABS.indexOf(saved) >= 0 ? saved : 'clases', true);
    }
    syncSportSeg();
    renderAll();
    let backend = null;
    try { backend = await initBackend(); } catch (e) { backend = null; }
    if (!backend) {
      backend = await localBackend('memory');
      setTimeout(() => alertBox('No se pudieron abrir tus datos', 'Cierra Cancha por completo y vuelve a abrirla. Mientras tanto, lo que hagas no se guardará.'), 400);
    }
    S.backend = backend;
    S.canWrite = backend.canWrite;
    let cleaned = false;
    const timer = setTimeout(() => { if (!S.definitive) { S.stale = true; S.ready = true; S.sig = {}; renderAll(); } }, 10000);
    backend.subscribe((data) => {
      S.exercises = data.exercises.slice();
      S.classes = data.classes.slice();
      S.groups = (data.groups || []).slice();
      S.sections = (data.sections || []).slice();
      S.ready = true;
      if (!data.fromCache) { S.definitive = true; S.stale = false; clearTimeout(timer); }
      // Una vez al abrir: borra videos que ya no usa ningún ejercicio (antes de que empieces a editar).
      if (S.definitive && !S.resumeAsked) { S.resumeAsked = true; setTimeout(() => (needsTutorial() ? showTutorial(offerResume) : offerResume()), 600); }
      if (!cleaned && S.definitive && backend.cleanOrphans && S.canWrite) {
        cleaned = true;
        const used = new Set();
        S.exercises.forEach((x) => { if (x.mediaId) used.add(x.mediaId); if (x.thumbId) used.add(x.thumbId); });
        backend.cleanOrphans(used);
      }
      renderAll();
      refreshScreens();
    }, (err) => {
      clearTimeout(timer);
      S.error = err; S.ready = true; S.sig = {};
      renderAll();
    });
    renderAll();
    setTimeout(() => { loadCatalog().then(() => { S.sig = {}; renderAll(); refreshScreens(); }).catch(() => {}); }, 400);
    if ('serviceWorker' in navigator && !framed) watchUpdates();
  }

  // La versión nueva se descarga sola; la siguiente vez que abras Cancha ya la tienes.
  function watchUpdates() {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) toast('Hay una versión nueva de Cancha', 'sparkle', { label: 'Actualizar', onClick: () => location.reload() });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {});
    });
  }

  // Herramienta de videos (tools/video): usa el mismo dibujo del pizarrón sin arrancar la app.
  if (window.CANCHA_RENDER_ONLY) { window.CanchaRender = { boardSVG, itemSVG, diagramSteps, r1 }; return; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
