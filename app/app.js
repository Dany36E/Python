/* Cancha — biblioteca de ejercicios de fútbol y básquet para preparar clases.
   Sin dependencias. Guarda en IndexedDB (app instalada) o en la cuenta de
   Claude cuando se abre como Artifact (db + assets). */
(function () {
  'use strict';

  // ---------------------------------------------------------------- datos fijos
  const TABS = ['futbol', 'basquet', 'clases'];
  const TAB_META = {
    futbol: { label: 'Fútbol', icon: 'futbol' },
    basquet: { label: 'Básquet', icon: 'basquet' },
    clases: { label: 'Clases', icon: 'clases' },
  };
  const SPORTS = {
    futbol: {
      name: 'Fútbol', noun: 'fútbol',
      tags: ['Calentamiento', 'Pase', 'Conducción', 'Control', 'Tiro', 'Defensa', 'Táctica', 'Portero', 'Físico', 'Juego reducido'],
    },
    basquet: {
      name: 'Básquet', noun: 'básquet',
      tags: ['Calentamiento', 'Bote', 'Pase', 'Tiro', 'Bandeja', 'Defensa', 'Rebote', 'Táctica', 'Físico', 'Juego reducido'],
    },
  };
  const LEVELS = ['Inicial', 'Intermedio', 'Avanzado'];
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
  const dayFmt = (() => { try { return new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return null; } })();
  function fmtDay(s) {
    const d = parseDay(s);
    if (!d) return 'Sin fecha';
    if (s === todayStr()) return 'Hoy';
    if (s === addDays(1)) return 'Mañana';
    return dayFmt ? cap(dayFmt.format(d).replace(/\./g, '')) : s;
  }

  // ---------------------------------------------------------------- dibujos de cancha
  function fieldArt(sport) {
    const g = '<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">';
    if (sport === 'basquet') {
      return '<svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + g +
        '<rect x="14" y="14" width="132" height="172" rx="2"/>' +
        '<path d="M62 14a18 18 0 0 0 36 0"/>' +
        '<rect x="58" y="124" width="44" height="62"/>' +
        '<path d="M64 124a16 16 0 0 1 32 0"/>' +
        '<path d="M64 124a16 16 0 0 0 32 0" stroke-dasharray="3 4"/>' +
        '<path d="M24 186v-37.5a60 60 0 0 1 112 0V186"/>' +
        '<path d="M71 177h18"/><circle cx="80" cy="170.5" r="4.5"/>' +
        '</g></svg>';
    }
    return '<svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + g +
      '<rect x="14" y="14" width="132" height="172" rx="2"/>' +
      '<path d="M14 100h132"/><circle cx="80" cy="100" r="18"/>' +
      '<rect x="44" y="14" width="72" height="30"/><rect x="62" y="14" width="36" height="11"/>' +
      '<path d="M63.9 44a18 18 0 0 0 32.2 0"/>' +
      '<rect x="44" y="156" width="72" height="30"/><rect x="62" y="175" width="36" height="11"/>' +
      '<path d="M63.9 156a18 18 0 0 1 32.2 0"/>' +
      '</g><g fill="currentColor"><circle cx="80" cy="100" r="1.7"/><circle cx="80" cy="35" r="1.3"/><circle cx="80" cy="165" r="1.3"/></g></svg>';
  }

  // ---------------------------------------------------------------- ejemplos (solo modo local)
  function seedData() {
    const t = Date.now() - 864e5 * 3;
    const ex = (o, i) => Object.assign({
      favorite: false, mediaType: null, mediaId: null, thumbId: null, mediaDuration: 0, mediaAspect: null,
      example: true, createdAt: t - i * 60000, updatedAt: t - i * 60000,
    }, o);
    return {
      exercises: [
        ex({ id: 'ej-f1', sport: 'futbol', title: 'Rondo 4 contra 1', objective: 'Pase', level: 'Inicial', duration: 10, players: '5 por grupo', age: 'Desde Sub-8', material: '4 conos y 1 balón por grupo', description: 'Cuatro jugadores en un cuadrado de 6 × 6 m mantienen la posesión ante un defensor en el centro. Quien pierde el balón pasa a defender.', keyPoints: 'Perfil abierto antes de recibir\nPasar al pie alejado del defensor\nMáximo dos toques\nMoverse para ofrecer línea de pase', favorite: true }, 0),
        ex({ id: 'ej-f2', sport: 'futbol', title: 'Conducción en slalom y remate', objective: 'Conducción', level: 'Intermedio', duration: 15, players: '6 a 12', age: 'Sub-10 a Sub-14', material: '8 conos, balones y 1 portería', description: 'Conducción entre seis conos separados 2 m y remate a portería desde el borde del área. Alternar pierna hábil y no hábil en cada serie.', keyPoints: 'Toques cortos y cabeza levantada\nUsar interior y exterior del pie\nAcelerar después del último cono\nRematar con el empeine' }, 1),
        ex({ id: 'ej-f3', sport: 'futbol', title: '3 contra 3 a dos porterías', objective: 'Juego reducido', level: 'Avanzado', duration: 20, players: '6 + 2 porteros', age: 'Sub-12 en adelante', material: 'Petos, 2 porterías pequeñas, balones de reserva', description: 'Partido en un campo de 25 × 20 m. Series de 3 minutos con 1 minuto de descanso. El gol vale doble si llega tras robar en campo rival.', keyPoints: 'Presionar justo después de perder el balón\nOcupar los tres carriles\nComunicación constante' }, 2),
        ex({ id: 'ej-b1', sport: 'basquet', title: 'Bote en zigzag con mano débil', objective: 'Bote', level: 'Inicial', duration: 10, players: 'Todo el grupo', age: 'Desde 8 años', material: '1 balón por jugador y 6 conos', description: 'Recorrido en zigzag de la línea de fondo a medio campo, con cambio de mano por delante en cada cono. A la vuelta, solo con la mano débil.', keyPoints: 'Bote a la altura de la cintura\nMirar al frente, no al balón\nProteger el balón con el cuerpo' }, 0),
        ex({ id: 'ej-b2', sport: 'basquet', title: 'Rueda de bandejas', objective: 'Bandeja', level: 'Inicial', duration: 12, players: '8 a 14', age: 'Desde 9 años', material: '3 o 4 balones', description: 'Dos filas en el ala: una pasa y la otra entra a canasta. Tras la bandeja, cada jugador recoge su rebote y cambia de fila. Cada 2 minutos se cambia de lado.', keyPoints: 'Dos tiempos: derecha e izquierda por el lado derecho\nRodilla arriba en el salto\nApoyar el balón en el tablero', favorite: true }, 1),
        ex({ id: 'ej-b3', sport: 'basquet', title: '2 contra 2 con ayuda defensiva', objective: 'Defensa', level: 'Avanzado', duration: 15, players: '4 por canasta', age: 'Sub-14 en adelante', material: '1 balón y petos', description: 'Ataque 2 contra 2 desde el perímetro. El defensor del jugador sin balón ayuda en la penetración y recupera a su par.', keyPoints: 'Posición de ayuda: ver balón y par\nCerrar la línea de fondo\nAvisar «ayuda» y «tengo»' }, 2),
      ],
      classes: [
        { id: 'cl-ej1', sport: 'futbol', name: 'Sub-12 · Técnica de pase', date: addDays(2), notes: 'Llevar petos de dos colores.', items: [{ exId: 'ej-f1', min: 10 }, { exId: 'ej-f2', min: 15 }, { exId: 'ej-f3', min: 20 }], example: true, createdAt: t, updatedAt: t },
      ],
    };
  }

  // ---------------------------------------------------------------- almacenamiento local
  function idbStore() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('no-idb')); return; }
      let req;
      try { req = indexedDB.open('cancha', 1); } catch (e) { reject(e); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('exercises')) db.createObjectStore('exercises', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('classes')) db.createObjectStore('classes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('media')) db.createObjectStore('media');
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
      req.onerror = () => reject(req.error || new Error('idb'));
      req.onblocked = () => reject(new Error('idb-blocked'));
      req.onsuccess = () => {
        const db = req.result;
        const run = (name, mode, fn) => new Promise((res, rej) => {
          let r;
          const tx = db.transaction(name, mode);
          try { r = fn(tx.objectStore(name)); } catch (e) { rej(e); return; }
          tx.oncomplete = () => res(r ? r.result : undefined);
          tx.onerror = () => rej(tx.error);
          tx.onabort = () => rej(tx.error || new Error('abort'));
        });
        resolve({
          all: (n) => run(n, 'readonly', (s) => s.getAll()),
          get: (n, k) => run(n, 'readonly', (s) => s.get(k)),
          put: (n, v, k) => run(n, 'readwrite', (s) => (k === undefined ? s.put(v) : s.put(v, k))),
          del: (n, k) => run(n, 'readwrite', (s) => s.delete(k)),
        });
      };
    });
  }
  function memStore() {
    const m = { exercises: new Map(), classes: new Map(), media: new Map(), meta: new Map() };
    return {
      all: async (n) => Array.from(m[n].values()),
      get: async (n, k) => m[n].get(k),
      put: async (n, v, k) => { m[n].set(k === undefined ? v.id : k, v); },
      del: async (n, k) => { m[n].delete(k); },
    };
  }

  async function localBackend(kind) {
    const st = kind === 'memory' ? memStore() : await idbStore();
    const listeners = new Set();
    const urls = new Map();
    async function reload() {
      const r = await Promise.all([st.all('exercises'), st.all('classes')]);
      const snap = { exercises: r[0] || [], classes: r[1] || [], fromCache: false };
      listeners.forEach((fn) => fn(snap));
    }
    if (!(await st.get('meta', 'seeded'))) {
      const existing = await st.all('exercises');
      if (!existing.length) {
        const seed = seedData();
        for (const x of seed.exercises) await st.put('exercises', x);
        for (const c of seed.classes) await st.put('classes', c);
      }
      await st.put('meta', true, 'seeded');
    }
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* opcional */ }
    return {
      kind,
      canWrite: true,
      subscribe(fn) { listeners.add(fn); reload().catch(() => {}); return () => listeners.delete(fn); },
      async saveExercise(x) { await st.put('exercises', plain(x)); await reload(); },
      async deleteExercise(id) { await st.del('exercises', id); await reload(); },
      async saveClass(c) { await st.put('classes', plain(c)); await reload(); },
      async deleteClass(id) { await st.del('classes', id); await reload(); },
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
    if (user && canWrite) {
      try { const c = await user.can('data.write'); if (c === false) canWrite = false; } catch (e) { /* sin información */ }
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
      subscribe(fn, onError) {
        let ex = null; let cl = null; let exC = true; let clC = true;
        const emit = () => { if (ex && cl) fn({ exercises: ex, classes: cl, fromCache: exC || clC }); };
        const u1 = db.collection('exercises').onSnapshot((s) => {
          ex = s.docs.map((d) => Object.assign({}, d.data(), { id: d.id })); exC = s.metadata.fromCache; emit();
        }, (e) => onError && onError(e));
        const u2 = db.collection('classes').onSnapshot((s) => {
          cl = s.docs.map((d) => Object.assign({}, d.data(), { id: d.id })); clC = s.metadata.fromCache; emit();
        }, (e) => onError && onError(e));
        return () => { u1(); u2(); };
      },
      saveExercise: (x) => queue('e:' + x.id, () => withRetry(() => db.collection('exercises').doc(x.id).set(body(x)))),
      deleteExercise: (id) => queue('e:' + id, () => withRetry(() => db.collection('exercises').doc(id).delete())),
      saveClass: (c) => queue('c:' + c.id, () => withRetry(() => db.collection('classes').doc(c.id).set(body(c)))),
      deleteClass: (id) => queue('c:' + id, () => withRetry(() => db.collection('classes').doc(id).delete())),
      async putMedia(blob, type) {
        const r = await withRetry(() => assets.upload(blob, type ? { type } : undefined), 'store_unavailable');
        return r.id;
      },
      cachedURL: (id) => (id ? '/_blob/' + id : null),
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
    try { return await localBackend('local'); } catch (e) { return localBackend('memory'); }
  }

  // ---------------------------------------------------------------- estado
  const S = {
    backend: null, ready: false, canWrite: false, stale: false, error: null,
    exercises: [], classes: [],
    tab: 'futbol',
    q: { futbol: '', basquet: '' },
    f: { futbol: 'all', basquet: 'all' },
    scroll: {},
    sig: {},
  };
  const getEx = (id) => S.exercises.find((e) => e.id === id) || null;
  const getClass = (id) => S.classes.find((c) => c.id === id) || null;
  const exOf = (sport) => S.exercises.filter((e) => e.sport === sport).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const classTotal = (c) => (c.items || []).reduce((s, it) => s + (Number(it.min) || 0), 0);
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
  let skipPop = 0;

  function syncLock() { document.documentElement.classList.toggle('locked', layers.length > 0); }
  function pushLayer(layer) {
    layers.push(layer);
    syncLock();
    if (useHistory) { try { history.pushState({ cancha: layers.length }, ''); } catch (e) { /* sin historial */ } }
  }
  function popLayer(layer, fromHistory) {
    const i = layers.lastIndexOf(layer);
    if (i < 0) return;
    layers.splice(i, 1);
    layer.close();
    syncLock();
    if (useHistory && !fromHistory) { skipPop++; try { history.back(); } catch (e) { skipPop--; } }
  }
  window.addEventListener('popstate', () => {
    if (skipPop > 0) { skipPop--; return; }
    const top = layers[layers.length - 1];
    if (top) {
      if (top.onBack) { top.onBack(); if (useHistory) { try { history.pushState({ cancha: layers.length }, ''); } catch (e) { /* */ } } return; }
      popLayer(top, true);
    }
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
      kind: 'screen', el, scroller, body: $('.screen-body', el), refresh: null,
      setTitle(t) { $('.nav-title', el).textContent = t || ''; },
      close() {
        openScreens.delete(api);
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

  // Hoja modal genérica
  function openSheet(o) {
    const wrap = document.createElement('div');
    wrap.className = 'sheet-wrap';
    if (o.tint) wrap.dataset.tint = o.tint;
    wrap.innerHTML =
      '<div class="scrim"></div>' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '">' +
      '<div class="sheet-head"><span class="grabber" aria-hidden="true"></span>' +
      '<span class="sh-left"><button type="button" class="cap" data-sh="cancel">' + esc(o.cancelLabel || 'Cancelar') + '</button></span>' +
      '<span class="sh-title">' + esc(o.title) + '</span>' +
      '<span class="sh-right">' + (o.confirmLabel ? '<button type="button" class="cap filled" data-sh="ok">' + esc(o.confirmLabel) + '</button>' : '') + '</span></div>' +
      '<div class="sheet-progress" hidden><div class="progress"><i></i></div><span class="pl"></span></div>' +
      '<div class="sheet-body">' + (o.bodyHTML || '') + '</div></div>';
    document.body.appendChild(wrap);
    const sheet = $('.sheet', wrap);
    const okBtn = $('[data-sh="ok"]', wrap);
    let busy = false;
    const api = {
      kind: 'sheet', el: wrap, body: $('.sheet-body', wrap),
      close() {
        wrap.classList.remove('open');
        if (o.onClose) o.onClose();
        const rm = () => { if (wrap.parentNode) wrap.remove(); };
        sheet.addEventListener('transitionend', rm, { once: true });
        setTimeout(rm, 700);
      },
      dismiss() { popLayer(api); },
      onBack() { api.requestClose(); },
      requestClose() {
        if (busy) return;
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
    $('.scrim', wrap).addEventListener('click', () => api.requestClose());
    if (okBtn) okBtn.addEventListener('click', () => { if (!busy && !okBtn.disabled && o.onConfirm) o.onConfirm(api); });
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
      acts.map((a, i) => '<button type="button" class="as-btn' + (a.danger ? ' danger' : '') + (a.bold ? ' bold' : '') + '" data-i="' + i + '"><span class="as-row">' + (a.icon ? ic(a.icon) : '') + esc(a.label) + '</span>' + (a.sub ? '<small>' + esc(a.sub) + '</small>' : '') + '</button>').join('') +
      '</div><div class="as-group"><button type="button" class="as-btn bold" data-i="-1">' + esc(o.cancel || 'Cancelar') + '</button></div></div>';
    document.body.appendChild(wrap);
    const api = {
      kind: 'action', el: wrap,
      close() {
        wrap.classList.remove('open');
        const rm = () => { if (wrap.parentNode) wrap.remove(); };
        $('.as', wrap).addEventListener('transitionend', rm, { once: true });
        setTimeout(rm, 600);
      },
    };
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (!b && !e.target.classList.contains('scrim')) return;
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
      close() { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 320); },
    };
    $('button', wrap).addEventListener('click', () => popLayer(api));
    pushLayer(api);
    requestAnimationFrame(() => requestAnimationFrame(() => { wrap.classList.add('open'); $('button', wrap).focus({ preventScroll: true }); }));
  }

  let toastTimer = 0;
  function toast(msg, icon) {
    const t = $('#toast');
    t.innerHTML = ic(icon || 'check') + '<span>' + esc(msg) + '</span>';
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2300);
  }

  function friendlyError(e) {
    const code = e && e.code;
    const msg = e && e.message;
    if (msg === 'too-long') return 'El video es demasiado largo para guardarlo en la nube (máximo unos 3 minutos). Recórtalo y vuelve a intentarlo.';
    if (msg === 'transcode-unsupported' || msg === 'transcode-failed') return 'El video pesa más de 20 MB y este dispositivo no pudo reducirlo. Prueba con un clip más corto o grábalo en 720p.';
    if (e && e.name === 'QuotaExceededError') return 'El dispositivo no tiene espacio suficiente. Borra videos que ya no uses.';
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
    const inp = $(mode === 'capture' ? '#in-capture' : '#in-pick');
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
    const inner = ex.thumbId ? '<img alt="" loading="lazy" decoding="async" ' + srcAttr(ex.thumbId) + '>' : '<span class="art">' + fieldArt(ex.sport) + '</span>';
    let badge = '';
    if (cls !== 'mini') {
      if (ex.mediaType === 'video') badge = '<span class="badge">' + ic('play') + (ex.mediaDuration ? fmtClock(ex.mediaDuration) : 'Video') + '</span>';
      else if (ex.mediaType === 'image') badge = '<span class="badge">' + ic('photo') + 'Foto</span>';
    }
    const extra = cls === 'mini' ? '' : (ex.favorite ? '<span class="fav" aria-label="Favorito">' + ic('heart-fill') + '</span>' : '') + (ex.example ? '<span class="pill-ex">Ejemplo</span>' : '');
    return '<span class="' + (cls || 'thumb') + '" data-tint="' + esc(ex.sport) + '">' + inner + badge + extra + '</span>';
  }

  // ---------------------------------------------------------------- pantallas raíz
  function buildShell() {
    const app = $('#app');
    document.documentElement.lang = document.documentElement.lang || 'es';
    app.innerHTML =
      '<main id="main" class="main">' +
      TABS.map((t) => '<section class="screen" id="screen-' + t + '" data-tab="' + t + '" aria-labelledby="h-' + t + '"></section>').join('') +
      '</main>' +
      '<div class="dock" id="dock"><nav class="tabbar" role="tablist" aria-label="Secciones"><span class="tab-lens" aria-hidden="true"></span>' +
      TABS.map((t) => '<button class="tab" role="tab" id="tab-' + t + '" data-tab="' + t + '" aria-selected="false" aria-controls="screen-' + t + '">' + ic(TAB_META[t].icon) + '<span>' + TAB_META[t].label + '</span></button>').join('') +
      '</nav><button class="fab" id="fab" aria-label="Nuevo ejercicio">' + ic('plus') + '</button></div>' +
      '<div id="layers"></div>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>' +
      '<input class="sr" type="file" id="in-capture" accept="video/*" capture="environment" tabindex="-1" aria-hidden="true">' +
      '<input class="sr" type="file" id="in-pick" accept="video/*,image/*" tabindex="-1" aria-hidden="true">';
    TABS.forEach((t) => {
      const el = $('#screen-' + t);
      const isSport = t !== 'clases';
      el.innerHTML =
        '<header class="navbar"><span></span><span class="nav-title">' + TAB_META[t].label + '</span>' +
        '<span class="nav-right"><button class="glass-btn status-btn" data-act="status" aria-label="Dónde se guardan tus datos">' + ic('cloud') + '</button></span></header>' +
        '<div class="page">' +
        '<h1 class="large-title" id="h-' + t + '">' + TAB_META[t].label + '</h1>' +
        '<p class="subtitle" data-ref="count">&nbsp;</p>' +
        (isSport ? '<label class="search">' + ic('search') + '<input type="search" id="q-' + t + '" placeholder="Buscar ejercicios" autocomplete="off" enterkeyhint="search" aria-label="Buscar ejercicios de ' + SPORTS[t].noun + '"></label><div class="chips" data-ref="chips" role="toolbar" aria-label="Filtrar por objetivo"></div>' : '') +
        '<div data-ref="note"></div><div data-ref="body"></div></div>';
    });
  }

  function ref(tab, name) { return $('#screen-' + tab + ' [data-ref="' + name + '"]'); }

  function noteHTML(tab) {
    const out = [];
    if (S.stale) out.push('<div class="note">' + ic('warn') + '<span class="txt"><b>Sin conexión.</b> Puede que lo que ves no esté al día.</span></div>');
    if (S.error) out.push('<div class="note">' + ic('warn') + '<span class="txt"><b>No se pudieron cargar tus datos.</b> Vuelve a abrir la app en un momento.</span></div>');
    if (S.ready && !S.canWrite) out.push('<div class="note">' + ic('lock') + '<span class="txt"><b>Solo lectura.</b> Puedes ver esta biblioteca, pero solo su dueño puede editarla.</span></div>');
    const hasEx = tab === 'clases' ? S.classes.some((c) => c.example) : S.exercises.some((e) => e.example && e.sport === tab);
    if (S.ready && S.canWrite && hasEx) out.push('<div class="note">' + ic('sparkle') + '<span class="txt"><b>Ejemplos</b> para que veas cómo luce tu biblioteca.</span><button class="link" data-act="clear-examples">Borrar</button></div>');
    return out.join('');
  }

  function renderSport(sport) {
    const all = exOf(sport);
    const favs = all.filter((e) => e.favorite).length;
    ref(sport, 'count').textContent = S.ready ? (all.length ? plural(all.length, 'ejercicio', 'ejercicios') + (favs ? ' · ' + plural(favs, 'favorito', 'favoritos') : '') : 'Sin ejercicios todavía') : 'Cargando…';
    // chips
    const sp = SPORTS[sport];
    const used = sp.tags.filter((t) => all.some((e) => e.objective === t));
    const extra = Array.from(new Set(all.map((e) => e.objective).filter((o) => o && sp.tags.indexOf(o) < 0)));
    const chips = [['all', 'Todos']].concat(favs ? [['fav', 'Favoritos']] : [], used.concat(extra).map((t) => ['t:' + t, t]));
    if (!chips.some((c) => c[0] === S.f[sport])) S.f[sport] = 'all';
    const chipsHTML = all.length > 1 ? chips.map((c) => '<button class="chip" data-chip="' + esc(c[0]) + '" aria-pressed="' + (c[0] === S.f[sport]) + '">' + (c[0] === 'fav' ? ic('heart-fill') : '') + esc(c[1]) + '</button>').join('') : '';
    let list = all;
    const f = S.f[sport];
    if (f === 'fav') list = list.filter((e) => e.favorite);
    else if (f.indexOf('t:') === 0) list = list.filter((e) => e.objective === f.slice(2));
    const q = norm(S.q[sport]).trim();
    if (q) list = list.filter((e) => norm([e.title, e.objective, e.description, e.keyPoints, e.material, e.level, e.age].join(' ')).indexOf(q) >= 0);

    let body;
    if (!S.ready) body = '<div class="grid">' + [0, 1, 2, 3].map(() => '<div class="card"><span class="thumb shimmer"></span><span class="sk-line w60 shimmer"></span><span class="sk-line w40 shimmer"></span></div>').join('') + '</div>';
    else if (!all.length) body = emptySportHTML(sport);
    else if (!list.length) body = '<p class="no-results">' + (q ? 'Nada coincide con «' + esc(S.q[sport]) + '».' : 'No hay ejercicios con este filtro.') + '</p>';
    else body = '<div class="grid">' + list.map(cardHTML).join('') + '</div>';

    const sig = [S.ready, S.canWrite, chipsHTML, body, noteHTML(sport)].join('|');
    if (S.sig[sport] === sig) return;
    S.sig[sport] = sig;
    const chipsEl = ref(sport, 'chips');
    if (chipsEl.innerHTML !== chipsHTML) chipsEl.innerHTML = chipsHTML;
    ref(sport, 'note').innerHTML = noteHTML(sport);
    const b = ref(sport, 'body');
    b.innerHTML = body;
    if (S.backend) hydrate(b);
  }

  function cardHTML(ex) {
    const meta = [ex.duration ? ex.duration + ' min' : null, ex.level].filter(Boolean).join(' · ');
    return '<button class="card" data-open-ex="' + esc(ex.id) + '">' + thumbHTML(ex) +
      '<span class="card-body">' + (ex.objective ? '<span class="eyebrow">' + esc(ex.objective) + '</span>' : '') +
      '<span class="title">' + esc(ex.title || 'Sin título') + '</span>' +
      (meta ? '<span class="meta">' + esc(meta) + '</span>' : '') + '</span></button>';
  }

  function emptySportHTML(sport) {
    return '<div class="empty"><div class="empty-art"><span class="art">' + fieldArt(sport) + '</span></div>' +
      '<h2>Tu biblioteca de ' + SPORTS[sport].noun + ' está vacía</h2>' +
      '<p>' + (S.canWrite ? 'Graba un ejercicio en la cancha o sube un video que ya tengas.' : 'Todavía no hay ejercicios aquí.') + '</p>' +
      (S.canWrite ? '<div class="actions">' +
        (isTouch ? '<button class="btn filled" data-act="new-capture">' + ic('video') + 'Grabar</button>' : '') +
        '<button class="btn ' + (isTouch ? 'tinted' : 'filled') + '" data-act="new-pick">' + ic('upload') + 'Subir video</button></div>' : '') +
      '</div>';
  }

  function renderClases() {
    const list = S.classes.slice().sort(byUpcoming);
    const t = todayStr();
    const next = list.find((c) => c.date && c.date >= t);
    ref('clases', 'count').textContent = S.ready ? (list.length ? plural(list.length, 'clase', 'clases') + (next ? ' · próxima: ' + fmtDay(next.date).toLowerCase() : '') : 'Sin clases todavía') : 'Cargando…';
    let body;
    if (!S.ready) body = '<div class="list">' + [0, 1, 2].map(() => '<div class="cell"><span class="date-tile shimmer"></span><span class="txt"><span class="sk-line w60 shimmer"></span><span class="sk-line w40 shimmer"></span></span></div>').join('') + '</div>';
    else if (!list.length) {
      body = '<div class="empty"><div class="empty-art icon">' + ic('clases') + '</div><h2>Arma tu primera clase</h2>' +
        '<p>Elige ejercicios de tu biblioteca, ordénalos y ajusta los minutos de cada bloque.</p>' +
        (S.canWrite ? '<div class="actions"><button class="btn filled" data-act="new-class">' + ic('plus') + 'Nueva clase</button></div>' : '') + '</div>';
    } else {
      const up = list.filter((c) => !c.date || c.date >= t);
      const past = list.filter((c) => c.date && c.date < t);
      body = '';
      if (up.length) body += '<p class="group-label">Próximas</p><div class="list">' + up.map(classCellHTML).join('') + '</div>';
      if (past.length) body += '<p class="group-label">Anteriores</p><div class="list">' + past.map(classCellHTML).join('') + '</div>';
    }
    const sig = [S.ready, S.canWrite, body, noteHTML('clases')].join('|');
    if (S.sig.clases === sig) return;
    S.sig.clases = sig;
    ref('clases', 'note').innerHTML = noteHTML('clases');
    ref('clases', 'body').innerHTML = body;
  }

  function dateTileHTML(date) {
    const d = parseDay(date);
    if (!d) return '<span class="date-tile">' + ic('calendar') + '</span>';
    return '<span class="date-tile"><span class="dm">' + MONTHS[d.getMonth()] + '</span><span class="dd">' + d.getDate() + '</span></span>';
  }
  function classCellHTML(c) {
    const n = (c.items || []).length;
    const sport = SPORTS[c.sport] ? c.sport : 'futbol';
    return '<button class="cell" data-open-class="' + esc(c.id) + '" data-tint="' + sport + '">' + dateTileHTML(c.date) +
      '<span class="txt"><span class="t1">' + esc(c.name || 'Clase sin nombre') + (c.date === todayStr() ? '<span class="pill">Hoy</span>' : '') + '</span>' +
      '<span class="t2">' + SPORTS[sport].name + ' · ' + plural(n, 'ejercicio', 'ejercicios') + ' · ' + classTotal(c) + ' min</span></span>' +
      ic('chevR', 'chev') + '</button>';
  }

  function renderAll() {
    renderSport('futbol');
    renderSport('basquet');
    renderClases();
    const icon = !S.backend ? 'cloud' : !S.canWrite ? 'lock' : S.backend.kind === 'cloud' ? 'cloud' : S.backend.kind === 'memory' ? 'warn' : 'device';
    $$('.status-btn').forEach((b) => { if (b.dataset.icon !== icon) { b.dataset.icon = icon; b.innerHTML = ic(icon); } });
    document.documentElement.classList.toggle('readonly', !!S.backend && !S.canWrite);
  }
  function refreshScreens() { openScreens.forEach((s) => { if (s.refresh) s.refresh(); }); }

  function setTab(t, initial) {
    if (TABS.indexOf(t) < 0) t = 'futbol';
    if (!initial && t === S.tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (!initial) S.scroll[S.tab] = window.scrollY;
    S.tab = t;
    document.documentElement.dataset.tint = t;
    $$('.screen').forEach((s) => s.classList.toggle('active', s.dataset.tab === t));
    $$('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    $('.tabbar').style.setProperty('--i', TABS.indexOf(t));
    $('#fab').setAttribute('aria-label', t === 'clases' ? 'Nueva clase' : 'Nuevo ejercicio de ' + SPORTS[t].noun);
    window.scrollTo(0, S.scroll[t] || 0);
    onWindowScroll();
    pref.set('tab', t);
    if (location.hash !== '#' + t) { try { history.replaceState(history.state, '', '#' + t); } catch (e) { /* hash no disponible */ } }
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
    if (k === 'cloud') return alertBox('Guardado en tu cuenta', 'Tus ejercicios, videos y clases se guardan en tu cuenta de Claude. Los ves igual en el celular y en la computadora.');
    if (k === 'memory') return alertBox('No se puede guardar', 'Este navegador no permite guardar datos (por ejemplo, en modo privado). Lo que agregues se perderá al cerrar.');
    return alertBox('Guardado en este dispositivo', 'Tus ejercicios y videos se guardan en este dispositivo, sin internet. Si borras los datos del navegador, se pierden.');
  }

  // ---------------------------------------------------------------- flujos: ejercicios
  function newExerciseFlow(sport) {
    if (!S.canWrite) return;
    const actions = [];
    if (isTouch) actions.push({ label: 'Grabar video', icon: 'video', onClick: () => pickFile('capture', (f) => editorWithFile(sport, f)) });
    actions.push({ label: isTouch ? 'Subir de la galería' : 'Subir video o foto', icon: 'upload', onClick: () => pickFile('pick', (f) => editorWithFile(sport, f)) });
    actions.push({ label: 'Escribir sin video', icon: 'pencil', onClick: () => openExerciseEditor({ sport }) });
    actionSheet({ title: 'Nuevo ejercicio de ' + SPORTS[sport].noun, actions, tint: sport });
  }
  function editorWithFile(sport, file) { openExerciseEditor({ sport, file }); }

  function segHTML(name, options, current) {
    const i = Math.max(0, options.findIndex((o) => o[0] === current));
    return '<div class="seg" data-seg="' + name + '" role="radiogroup" style="--n:' + options.length + ';--i:' + i + '"><span class="seg-ind" aria-hidden="true"></span>' +
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
  }
  function stepperHTML(id, value, small) {
    return '<span class="stepper' + (small ? ' sm' : '') + '"><button type="button" class="st-btn" data-step="-1" aria-label="Menos minutos">' + ic('minus') + '</button>' +
      '<span class="st-val"><input id="' + id + '" type="number" inputmode="numeric" min="1" max="240" value="' + (Number(value) || 10) + '" aria-label="Minutos"><span class="st-unit">min</span></span>' +
      '<button type="button" class="st-btn" data-step="1" aria-label="Más minutos">' + ic('plus') + '</button></span>';
  }
  function stepValue(v, dir) {
    v = Math.round(Number(v) || 0);
    if (dir > 0) return Math.min(240, v < 5 ? v + 1 : Math.floor(v / 5) * 5 + 5);
    return Math.max(1, v <= 5 ? v - 1 : Math.ceil(v / 5) * 5 - 5);
  }
  function autoGrow(ta) { ta.style.height = 'auto'; ta.style.height = Math.max(96, ta.scrollHeight) + 'px'; }

  function openExerciseEditor(opts) {
    const editing = !!opts.exercise;
    const ex = editing ? plain(opts.exercise) : {
      id: uid(), sport: opts.sport || 'futbol', title: '', objective: '', level: 'Inicial', duration: 10,
      players: '', age: '', material: '', description: '', keyPoints: '', favorite: false,
      mediaType: null, mediaId: null, thumbId: null, mediaDuration: 0, mediaAspect: null, createdAt: Date.now(),
    };
    let media = null; // nuevo archivo elegido
    let removeMedia = false;
    let dirty = false;
    const body =
      '<div data-ref="media"></div>' +
      segHTML('sport', [['futbol', 'Fútbol'], ['basquet', 'Básquet']], ex.sport) +
      '<div class="group"><input class="field-lg" id="ex-title" placeholder="Nombre del ejercicio" maxlength="120" autocomplete="off" enterkeyhint="done" value="' + esc(ex.title) + '"></div>' +
      '<p class="group-label">Objetivo</p><div class="group pad"><div class="chips wrap" data-ref="tags" role="radiogroup" aria-label="Objetivo"></div></div>' +
      '<p class="group-label">Nivel</p>' + segHTML('level', LEVELS.map((l) => [l, l]), ex.level || 'Inicial') +
      '<div class="group">' +
      '<div class="row"><span class="k">' + ic('clock') + 'Duración</span>' + stepperHTML('ex-duration', ex.duration || 10) + '</div>' +
      '<label class="row"><span class="k">' + ic('people') + 'Jugadores</span><input id="ex-players" placeholder="Ej. 8 a 12" maxlength="40" value="' + esc(ex.players) + '"></label>' +
      '<label class="row"><span class="k">' + ic('age') + 'Edad</span><input id="ex-age" placeholder="Ej. Sub-12" maxlength="40" value="' + esc(ex.age) + '"></label>' +
      '<label class="row"><span class="k">' + ic('cone') + 'Material</span><input id="ex-material" placeholder="Conos, balones…" maxlength="160" value="' + esc(ex.material) + '"></label>' +
      '</div>' +
      '<p class="group-label">Descripción</p><div class="group"><textarea id="ex-desc" placeholder="Cómo se organiza: espacio, grupos, reglas, series…" maxlength="4000">' + esc(ex.description) + '</textarea></div>' +
      '<p class="group-label">Puntos clave</p><div class="group"><textarea id="ex-points" placeholder="Uno por línea" maxlength="2000">' + esc(ex.keyPoints) + '</textarea></div>';

    const sheet = openSheet({
      title: editing ? 'Editar ejercicio' : 'Nuevo ejercicio',
      tint: ex.sport,
      confirmLabel: 'Guardar',
      bodyHTML: body,
      isDirty: () => dirty || !!media || removeMedia,
      onConfirm: save,
      onClose: () => { if (media && media.previewURL) URL.revokeObjectURL(media.previewURL); },
    });
    const root = sheet.body;

    function renderTags() {
      const tags = SPORTS[ex.sport].tags.slice();
      if (ex.objective && tags.indexOf(ex.objective) < 0) tags.push(ex.objective);
      $('[data-ref="tags"]', root).innerHTML = tags.map((t) => '<button type="button" class="chip" role="radio" aria-pressed="' + (t === ex.objective) + '" aria-checked="' + (t === ex.objective) + '" data-tag="' + esc(t) + '">' + esc(t) + '</button>').join('');
    }
    function mediaCaption(kind, size, duration) {
      const parts = [kind === 'video' ? 'Video' : 'Foto'];
      if (kind === 'video' && duration) parts.push(fmtClock(duration));
      if (size) parts.push(fmtMB(size));
      return parts.join(' · ');
    }
    function renderMedia() {
      const box = $('[data-ref="media"]', root);
      if (media && media.loading) {
        box.innerHTML = '<div class="media-preview loading"><span class="spinner"></span>Preparando el archivo…</div>';
        return;
      }
      const bar = (cap) => '<div class="mp-bar"><span class="mp-cap">' + esc(cap) + '</span><button type="button" class="mp-btn" data-media-act="change">Cambiar</button><button type="button" class="mp-btn" data-media-act="remove">Quitar</button></div>';
      if (media) {
        let cap = mediaCaption(media.kind, media.size, media.duration);
        if (media.kind === 'video' && S.backend.kind === 'cloud' && media.size > CLOUD_LIMIT) cap = mediaCaption(media.kind, media.size, media.duration).replace('Video · ', '') + ' · se reducirá';
        box.innerHTML = '<div class="media-preview">' + (media.kind === 'video'
          ? '<video class="mp-media" src="' + esc(media.previewURL) + '" muted playsinline loop autoplay></video>'
          : '<img class="mp-media" alt="" src="' + esc(media.previewURL) + '">') + bar(cap) + '</div>';
        return;
      }
      if (!removeMedia && ex.mediaId) {
        box.innerHTML = '<div class="media-preview">' + (ex.mediaType === 'video'
          ? '<video class="mp-media" muted playsinline loop autoplay data-media="' + esc(ex.mediaId) + '"></video>'
          : '<img class="mp-media" alt="" data-media="' + esc(ex.mediaId) + '">') + bar(mediaCaption(ex.mediaType, 0, ex.mediaDuration)) + '</div>';
        hydrate(box);
        return;
      }
      box.innerHTML = '<div class="media-pick">' +
        (isTouch ? '<button type="button" class="pick-tile" data-pick="capture"><span class="ico">' + ic('video') + '</span><b>Grabar</b><span class="s">Abre la cámara</span></button>' : '') +
        '<button type="button" class="pick-tile" data-pick="pick"><span class="ico">' + ic('upload') + '</span><b>Subir</b><span class="s">Video o foto</span></button></div>';
    }
    async function useFile(file) {
      if (media && media.previewURL) URL.revokeObjectURL(media.previewURL);
      media = { loading: true };
      renderMedia();
      try {
        media = await processPicked(file);
        removeMedia = false;
      } catch (e) {
        media = null;
        alertBox('No se pudo abrir el archivo', 'Elige un video (MP4 o MOV) o una foto.');
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
      sheet.setTint(v); renderTags(); dirty = true;
    });
    bindSeg(root, 'level', (v) => { ex.level = v; dirty = true; });
    root.addEventListener('click', (e) => {
      const tag = e.target.closest('[data-tag]');
      if (tag) {
        ex.objective = ex.objective === tag.dataset.tag ? '' : tag.dataset.tag;
        dirty = true; haptic(5); renderTags(); return;
      }
      const st = e.target.closest('[data-step]');
      if (st) {
        const inp = $('#ex-duration', root);
        inp.value = stepValue(inp.value, Number(st.dataset.step));
        dirty = true; haptic(5); return;
      }
      const pk = e.target.closest('[data-pick]');
      if (pk) { pickFile(pk.dataset.pick, useFile); return; }
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
      if (!title) {
        const inp = $('#ex-title', root);
        inp.closest('.group').classList.remove('shake');
        void inp.offsetWidth;
        inp.closest('.group').classList.add('shake');
        inp.focus();
        return;
      }
      Object.assign(ex, {
        title,
        duration: Math.max(1, Math.min(240, Math.round(Number($('#ex-duration', root).value) || 10))),
        players: $('#ex-players', root).value.trim(),
        age: $('#ex-age', root).value.trim(),
        material: $('#ex-material', root).value.trim(),
        description: $('#ex-desc', root).value.trim(),
        keyPoints: $('#ex-points', root).value.trim(),
        example: false,
        updatedAt: Date.now(),
      });
      sheet.setBusy(true, 'Guardando…');
      const old = [];
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
          const thumbId = media.thumbBlob ? await S.backend.putMedia(media.thumbBlob, 'image/jpeg') : null;
          old.push(ex.mediaId, ex.thumbId);
          Object.assign(ex, { mediaType: media.kind, mediaId, thumbId, mediaDuration: media.duration || 0, mediaAspect: media.aspect || null });
        } else if (removeMedia) {
          old.push(ex.mediaId, ex.thumbId);
          Object.assign(ex, { mediaType: null, mediaId: null, thumbId: null, mediaDuration: 0, mediaAspect: null });
        }
        sheet.progress(null, 'Guardando…');
        replaceLocal('exercises', plain(ex));
        await S.backend.saveExercise(ex);
        old.filter(Boolean).forEach((id) => S.backend.deleteMedia(id).catch(() => {}));
        sheet.setBusy(false);
        if (media && media.previewURL) URL.revokeObjectURL(media.previewURL);
        media = null; dirty = false; removeMedia = false;
        sheet.dismiss();
        renderAll(); refreshScreens();
        haptic(12);
        toast(editing ? 'Cambios guardados' : 'Ejercicio guardado');
        if (!editing) {
          if (S.tab !== ex.sport && S.tab !== 'clases') setTab(ex.sport);
          if (opts.afterCreate) opts.afterCreate(ex);
        }
      } catch (e) {
        sheet.setBusy(false);
        showError(e);
      }
    }
  }

  function mediaDetailHTML(ex) {
    const ar = ex.mediaAspect && isFinite(ex.mediaAspect) ? Math.min(3, Math.max(0.4, ex.mediaAspect)) : null;
    const style = ar ? ' style="--ar:' + ar + '"' : '';
    if (ex.mediaType === 'video' && ex.mediaId) {
      return '<div class="d-frame"' + style + '><video controls playsinline preload="metadata" data-media="' + esc(ex.mediaId) + '"' + (ex.thumbId ? ' data-poster="' + esc(ex.thumbId) + '"' : '') + '></video></div>';
    }
    if (ex.mediaType === 'image' && ex.mediaId) {
      return '<div class="d-frame"' + style + '><img alt="' + esc(ex.title) + '" data-media="' + esc(ex.mediaId) + '"></div>';
    }
    return '<div class="d-frame art-frame"><span class="art">' + fieldArt(ex.sport) + '</span></div>';
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
    const v = (val, unit) => (val ? '<span class="v">' + esc(val) + (unit ? '<small> ' + unit + '</small>' : '') + '</span>' : '<span class="v empty-v">—</span>');
    const points = String(ex.keyPoints || '').split('\n').map((s) => s.trim().replace(/^[-•·*]\s*/, '')).filter(Boolean);
    const eyebrow = [ex.objective, ex.level].filter(Boolean).join(' · ') || SPORTS[ex.sport].name;
    let created = '';
    try { created = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ex.createdAt || Date.now())); } catch (e) { /* */ }
    return '<div class="d-head"><p class="d-eyebrow">' + esc(eyebrow) + '</p><h1 class="d-title">' + esc(ex.title || 'Sin título') + '</h1>' +
      (ex.example ? '<span class="pill-ex inline">Ejemplo</span>' : '') + '</div>' +
      '<div class="stats">' +
      '<div class="stat"><span class="k">' + ic('clock') + 'Duración</span>' + v(ex.duration, 'min') + '</div>' +
      '<div class="stat"><span class="k">' + ic('people') + 'Jugadores</span>' + v(ex.players) + '</div>' +
      '<div class="stat"><span class="k">' + ic('age') + 'Edad</span>' + v(ex.age) + '</div></div>' +
      (S.canWrite ? '<div class="d-actions"><button class="btn filled grow" data-act="add-to-class">' + ic('plus') + 'Añadir a una clase</button>' +
        '<button class="btn icon tinted" data-act="fav" aria-pressed="' + !!ex.favorite + '" aria-label="' + (ex.favorite ? 'Quitar de favoritos' : 'Marcar como favorito') + '">' + ic(ex.favorite ? 'heart-fill' : 'heart') + '</button></div>' : '') +
      (ex.description ? sec('Descripción', '<p>' + esc(ex.description) + '</p>') : '') +
      (points.length ? sec('Puntos clave', '<ul class="points">' + points.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>') : '') +
      (ex.material ? sec('Material', '<p>' + esc(ex.material) + '</p>') : '') +
      (S.canWrite ? '<div class="group" style="margin-top:28px"><button class="row danger" data-act="delete">' + ic('trash') + 'Eliminar ejercicio</button></div>' : '') +
      (created ? '<p class="foot">Agregado el ' + esc(created) + '</p>' : '');
  }

  function openExercise(id) {
    const ex = getEx(id);
    if (!ex) return;
    haptic(4);
    const scr = pushScreen({ tint: ex.sport, rightHTML: S.canWrite ? '<button class="glass-btn cap" data-act="edit">Editar</button>' : '' });
    scr.body.innerHTML = '<div class="d-media" data-ref="media"></div><div data-ref="info"></div>';
    let mediaKey = null;
    function render() {
      const e = getEx(id);
      if (!e) { popLayer(scr); return; }
      scr.el.dataset.tint = e.sport;
      scr.setTitle(e.title);
      const key = [e.mediaType, e.mediaId, e.thumbId].join(':');
      if (key !== mediaKey) {
        mediaKey = key;
        const box = $('[data-ref="media"]', scr.body);
        box.innerHTML = mediaDetailHTML(e);
        bindVideoFallback(box);
        hydrate(box);
      }
      $('[data-ref="info"]', scr.body).innerHTML = exerciseInfoHTML(e);
    }
    render();
    scr.refresh = render;
    scr.el.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-act]');
      if (!a) return;
      const e = getEx(id);
      if (!e) return;
      switch (a.dataset.act) {
        case 'edit': openExerciseEditor({ exercise: e }); break;
        case 'fav': mutateExercise(id, (x) => { x.favorite = !x.favorite; }); haptic(10); break;
        case 'add-to-class': addToClassFlow(e); break;
        case 'delete':
          actionSheet({
            title: '¿Eliminar «' + e.title + '»?',
            message: e.mediaId ? 'También se borrará su ' + (e.mediaType === 'video' ? 'video' : 'foto') + '. No se puede deshacer.' : 'No se puede deshacer.',
            actions: [{ label: 'Eliminar ejercicio', danger: true, onClick: () => deleteExercise(id) }],
          });
          break;
        default: break;
      }
    });
  }

  function mutateExercise(id, fn) {
    const cur = getEx(id);
    if (!cur) return Promise.resolve();
    const x = plain(cur);
    fn(x);
    x.updatedAt = Date.now();
    replaceLocal('exercises', x);
    renderAll(); refreshScreens();
    return S.backend.saveExercise(x).catch((e) => showError(e));
  }
  function mutateClass(id, fn) {
    const cur = getClass(id);
    if (!cur) return Promise.resolve();
    const c = plain(cur);
    c.items = c.items || [];
    fn(c);
    c.updatedAt = Date.now();
    replaceLocal('classes', c);
    renderAll(); refreshScreens();
    return S.backend.saveClass(c).catch((e) => showError(e));
  }

  async function deleteExercise(id) {
    const ex = getEx(id);
    if (!ex) return;
    S.exercises = S.exercises.filter((e) => e.id !== id);
    const affected = S.classes.filter((c) => (c.items || []).some((it) => it.exId === id));
    renderAll(); refreshScreens();
    try {
      for (const c of affected) {
        const nc = plain(c);
        nc.items = nc.items.filter((it) => it.exId !== id);
        nc.updatedAt = Date.now();
        replaceLocal('classes', nc);
        await S.backend.saveClass(nc);
      }
      await S.backend.deleteExercise(id);
      [ex.mediaId, ex.thumbId].filter(Boolean).forEach((m) => S.backend.deleteMedia(m).catch(() => {}));
      renderAll(); refreshScreens();
      toast('Ejercicio eliminado', 'trash');
    } catch (e) { showError(e, 'No se pudo eliminar'); }
  }

  function addToClassFlow(ex) {
    const list = S.classes.filter((c) => c.sport === ex.sport).sort(byUpcoming).slice(0, 6);
    const min = ex.duration || 10;
    const actions = list.map((c) => ({
      label: c.name || 'Clase sin nombre',
      sub: fmtDay(c.date) + ' · ' + classTotal(c) + ' min',
      onClick: () => { mutateClass(c.id, (cc) => { cc.items.push({ exId: ex.id, min }); }); toast('Añadido a «' + (c.name || 'la clase') + '»'); },
    }));
    actions.push({ label: 'Nueva clase', icon: 'plus', onClick: () => openClassEditor({ sport: ex.sport, items: [{ exId: ex.id, min }] }) });
    actionSheet({ title: 'Añadir a una clase de ' + SPORTS[ex.sport].noun, actions, tint: ex.sport });
  }

  // ---------------------------------------------------------------- flujos: clases
  function openClassEditor(opts) {
    const editing = !!opts.cls;
    const c = editing ? plain(opts.cls) : {
      id: uid(), name: '', sport: opts.sport || (S.tab === 'basquet' ? 'basquet' : 'futbol'),
      date: todayStr(), notes: '', items: opts.items || [], createdAt: Date.now(),
    };
    let dirty = false;
    const body =
      '<div class="group"><input class="field-lg" id="cl-name" placeholder="Nombre de la clase" maxlength="80" autocomplete="off" enterkeyhint="done" value="' + esc(c.name) + '"></div>' +
      '<p class="group-label">Deporte</p>' + segHTML('sport', [['futbol', 'Fútbol'], ['basquet', 'Básquet']], c.sport) +
      '<div class="group"><label class="row"><span class="k">' + ic('calendar') + 'Fecha</span><input id="cl-date" type="date" value="' + esc(c.date || '') + '"></label></div>' +
      '<p class="group-label">Notas</p><div class="group"><textarea id="cl-notes" placeholder="Grupo, objetivo del día, recordatorios…" maxlength="2000">' + esc(c.notes) + '</textarea></div>' +
      (editing && c.items.length ? '' : (c.items.length ? '<p class="muted" style="margin:0 16px">Se añadirá «' + esc((getEx(c.items[0].exId) || {}).title || 'el ejercicio') + '».</p>' : ''));
    const sheet = openSheet({
      title: editing ? 'Editar clase' : 'Nueva clase',
      tint: c.sport,
      confirmLabel: editing ? 'Guardar' : 'Crear',
      bodyHTML: body,
      isDirty: () => dirty,
      onConfirm: async () => {
        const root = sheet.body;
        c.date = $('#cl-date', root).value || '';
        c.name = $('#cl-name', root).value.trim() || ('Clase de ' + SPORTS[c.sport].noun + (c.date ? ' · ' + fmtDay(c.date).toLowerCase() : ''));
        c.notes = $('#cl-notes', root).value.trim();
        c.example = false;
        c.updatedAt = Date.now();
        sheet.setBusy(true, 'Guardando…');
        try {
          replaceLocal('classes', plain(c));
          await S.backend.saveClass(c);
          sheet.setBusy(false);
          dirty = false;
          sheet.dismiss();
          renderAll(); refreshScreens();
          haptic(12);
          toast(editing ? 'Cambios guardados' : 'Clase creada');
          if (!editing) setTimeout(() => openClass(c.id), 260);
        } catch (e) { sheet.setBusy(false); showError(e); }
      },
    });
    const root = sheet.body;
    $$('textarea', root).forEach((ta) => { autoGrow(ta); ta.addEventListener('input', () => autoGrow(ta)); });
    root.addEventListener('input', () => { dirty = true; });
    bindSeg(root, 'sport', (v) => { c.sport = v; sheet.setTint(v); dirty = true; });
  }

  function classDetailHTML(c, edit) {
    const items = (c.items || []).map((it) => Object.assign({}, it, { ex: getEx(it.exId) }));
    const total = items.reduce((s, it) => s + (Number(it.min) || 0), 0);
    const sport = SPORTS[c.sport] ? c.sport : 'futbol';
    let t = 0;
    const rows = items.map((it, i) => {
      const start = t;
      t += Number(it.min) || 0;
      const title = it.ex ? it.ex.title : 'Ejercicio eliminado';
      const sub = [it.ex && it.ex.objective, (Number(it.min) || 0) + ' min'].filter(Boolean).join(' · ');
      if (edit) {
        return '<div class="plan-row edit"><button class="rm" data-act="rm" data-i="' + i + '" aria-label="Quitar ' + esc(title) + '">' + ic('minus') + '</button>' +
          '<span class="txt"><span class="t1">' + esc(title) + '</span>' + (it.ex && it.ex.objective ? '<span class="t2">' + esc(it.ex.objective) + '</span>' : '') + '</span>' +
          '<span class="stepper sm"><button type="button" class="st-btn" data-act="min" data-d="-1" data-i="' + i + '" aria-label="Menos minutos">' + ic('minus') + '</button><span class="st-val">' + (Number(it.min) || 0) + '′</span><button type="button" class="st-btn" data-act="min" data-d="1" data-i="' + i + '" aria-label="Más minutos">' + ic('plus') + '</button></span>' +
          '<span class="moves"><button class="mv" data-act="move" data-d="-1" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Subir">' + ic('up') + '</button><button class="mv" data-act="move" data-d="1" data-i="' + i + '"' + (i === items.length - 1 ? ' disabled' : '') + ' aria-label="Bajar">' + ic('down') + '</button></span></div>';
      }
      return '<button class="plan-row"' + (it.ex ? ' data-open-ex="' + esc(it.exId) + '"' : '') + '><span class="time">' + start + '′</span>' +
        (it.ex ? thumbHTML(it.ex, 'mini') : '<span class="mini"></span>') +
        '<span class="txt"><span class="t1">' + esc(title) + '</span><span class="t2">' + esc(sub) + '</span></span>' + ic('chevR', 'chev') + '</button>';
    }).join('');
    const ops = [1, 0.72, 0.5, 0.34];
    return '<div class="d-head"><p class="d-eyebrow">' + SPORTS[sport].name + ' · ' + esc(fmtDay(c.date)) + '</p><h1 class="d-title">' + esc(c.name || 'Clase sin nombre') + '</h1></div>' +
      '<div class="c-summary"><div class="c-figs"><div><span class="num">' + total + '</span><span class="unit">min</span></div>' +
      '<div><span class="num">' + items.length + '</span><span class="unit">' + (items.length === 1 ? 'ejercicio' : 'ejercicios') + '</span></div></div>' +
      (items.length ? '<div class="tl-bar" aria-hidden="true">' + items.map((it, i) => '<i style="flex-grow:' + Math.max(1, Number(it.min) || 0) + ';--o:' + ops[i % 4] + '"></i>').join('') + '</div>' : '') + '</div>' +
      '<div class="section-head"><h2>Plan</h2>' + (S.canWrite && items.length ? '<button class="link" data-act="toggle-edit">' + (edit ? 'Listo' : 'Ordenar') + '</button>' : '') + '</div>' +
      '<div class="list">' + rows +
      (S.canWrite && !edit ? '<button class="cell add-row" data-act="add-ex">' + ic('plus') + '<span>Añadir ejercicios</span></button>' : '') +
      (!items.length && !S.canWrite ? '<p class="muted pad">Esta clase no tiene ejercicios.</p>' : '') + '</div>' +
      (c.notes ? '<section class="sec"><h2>Notas</h2><p>' + esc(c.notes) + '</p></section>' : '') +
      (S.canWrite ? '<div class="group" style="margin-top:28px"><button class="row danger" data-act="delete-class">' + ic('trash') + 'Eliminar clase</button></div>' : '');
  }

  function openClass(id) {
    const c = getClass(id);
    if (!c) return;
    haptic(4);
    let edit = false;
    const scr = pushScreen({ tint: c.sport, rightHTML: S.canWrite ? '<button class="glass-btn cap" data-act="edit-class">Editar</button>' : '' });
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
        case 'toggle-edit': edit = !edit; haptic(5); render(); break;
        case 'add-ex': openPicker(id); break;
        case 'rm': mutateClass(id, (x) => { x.items.splice(i, 1); }); haptic(8); break;
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
            message: 'Los ejercicios seguirán en tu biblioteca.',
            actions: [{ label: 'Eliminar clase', danger: true, onClick: async () => {
              S.classes = S.classes.filter((x) => x.id !== id);
              renderAll(); refreshScreens();
              try { await S.backend.deleteClass(id); toast('Clase eliminada', 'trash'); } catch (e) { showError(e, 'No se pudo eliminar'); }
            } }],
          });
          break;
        default: break;
      }
    });
  }

  function openPicker(classId) {
    const c = getClass(classId);
    if (!c) return;
    const sport = SPORTS[c.sport] ? c.sport : 'futbol';
    const sel = [];
    let q = '';
    const all = exOf(sport);
    const inClass = new Set((c.items || []).map((it) => it.exId));
    const sheet = openSheet({
      title: 'Añadir ejercicios',
      tint: sport,
      confirmLabel: 'Añadir',
      bodyHTML: all.length
        ? '<label class="search">' + ic('search') + '<input type="search" id="pk-q" placeholder="Buscar en ' + SPORTS[sport].noun + '" autocomplete="off" aria-label="Buscar ejercicios"></label><div class="list pick-list" data-ref="list"></div>'
        : '<div class="empty"><div class="empty-art"><span class="art">' + fieldArt(sport) + '</span></div><h2>No hay ejercicios de ' + SPORTS[sport].noun + '</h2><p>Créalos desde la pestaña ' + SPORTS[sport].name + ' y vuelve aquí para armar la clase.</p></div>',
      isDirty: () => sel.length > 0,
      discardTitle: '¿Descartar la selección?',
      onConfirm: () => {
        const add = sel.slice();
        mutateClass(classId, (x) => { add.forEach((id) => x.items.push({ exId: id, min: (getEx(id) || {}).duration || 10 })); });
        sel.length = 0;
        sheet.dismiss();
        haptic(12);
        toast(add.length === 1 ? 'Ejercicio añadido' : add.length + ' ejercicios añadidos');
      },
    });
    sheet.setConfirm(false);
    if (!all.length) return;
    const root = sheet.body;
    function render() {
      const qq = norm(q).trim();
      const list = qq ? all.filter((e) => norm([e.title, e.objective, e.description].join(' ')).indexOf(qq) >= 0) : all;
      $('[data-ref="list"]', root).innerHTML = list.length ? list.map((e) => {
        const n = sel.indexOf(e.id) >= 0;
        const meta = [e.objective, (e.duration || 10) + ' min', inClass.has(e.id) ? 'en la clase' : ''].filter(Boolean).join(' · ');
        return '<button class="cell" role="checkbox" aria-checked="' + n + '" data-pick-ex="' + esc(e.id) + '">' + thumbHTML(e, 'mini') +
          '<span class="txt"><span class="t1">' + esc(e.title) + '</span><span class="t2">' + esc(meta) + '</span></span><span class="check">' + ic('check') + '</span></button>';
      }).join('') : '<p class="muted pad">Nada coincide con tu búsqueda.</p>';
      hydrate(root);
    }
    render();
    $('#pk-q', root).addEventListener('input', (e) => { q = e.target.value; render(); });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick-ex]');
      if (!b) return;
      const id = b.dataset.pickEx;
      const i = sel.indexOf(id);
      if (i >= 0) sel.splice(i, 1); else sel.push(id);
      b.setAttribute('aria-checked', String(i < 0));
      haptic(5);
      sheet.setConfirm(sel.length > 0, sel.length ? 'Añadir (' + sel.length + ')' : 'Añadir');
    });
  }

  function clearExamples() {
    const exs = S.exercises.filter((e) => e.example);
    const cls = S.classes.filter((c) => c.example);
    actionSheet({
      title: '¿Borrar los ejemplos?',
      message: 'Se borrarán ' + plural(exs.length, 'ejercicio', 'ejercicios') + (cls.length ? ' y ' + plural(cls.length, 'clase', 'clases') : '') + ' de ejemplo. Lo que tú agregaste no se toca.',
      actions: [{ label: 'Borrar ejemplos', danger: true, onClick: async () => {
        const exIds = new Set(exs.map((e) => e.id));
        S.exercises = S.exercises.filter((e) => !e.example);
        S.classes = S.classes.filter((c) => !c.example);
        renderAll(); refreshScreens();
        try {
          for (const c of cls) await S.backend.deleteClass(c.id);
          for (const c of S.classes) {
            if ((c.items || []).some((it) => exIds.has(it.exId))) {
              const nc = plain(c);
              nc.items = nc.items.filter((it) => !exIds.has(it.exId));
              replaceLocal('classes', nc);
              await S.backend.saveClass(nc);
            }
          }
          for (const e of exs) {
            await S.backend.deleteExercise(e.id);
            [e.mediaId, e.thumbId].filter(Boolean).forEach((m) => S.backend.deleteMedia(m).catch(() => {}));
          }
          toast('Ejemplos borrados', 'trash');
        } catch (e) { showError(e, 'No se pudieron borrar'); }
      } }],
    });
  }

  // ---------------------------------------------------------------- eventos globales
  function bindGlobal() {
    $('#in-capture').addEventListener('change', onFileInput);
    $('#in-pick').addEventListener('change', onFileInput);
    $('.tabbar').addEventListener('click', (e) => {
      const b = e.target.closest('.tab');
      if (b) { haptic(4); setTab(b.dataset.tab); }
    });
    $('#fab').addEventListener('click', () => {
      if (!S.ready || !S.canWrite) return;
      haptic(8);
      if (S.tab === 'clases') openClassEditor({});
      else newExerciseFlow(S.tab);
    });
    $('#main').addEventListener('click', (e) => {
      const card = e.target.closest('[data-open-ex]');
      if (card) { openExercise(card.dataset.openEx); return; }
      const cl = e.target.closest('[data-open-class]');
      if (cl) { openClass(cl.dataset.openClass); return; }
      const chip = e.target.closest('[data-chip]');
      if (chip) {
        const sport = chip.closest('.screen').dataset.tab;
        S.f[sport] = chip.dataset.chip;
        haptic(4);
        renderSport(sport);
        return;
      }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      switch (a.dataset.act) {
        case 'status': showStatus(); break;
        case 'new-capture': pickFile('capture', (f) => editorWithFile(S.tab, f)); break;
        case 'new-pick': pickFile('pick', (f) => editorWithFile(S.tab, f)); break;
        case 'new-class': openClassEditor({}); break;
        case 'clear-examples': clearExamples(); break;
        default: break;
      }
    });
    ['futbol', 'basquet'].forEach((sport) => {
      $('#q-' + sport).addEventListener('input', (e) => { S.q[sport] = e.target.value; renderSport(sport); });
    });
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener('hashchange', () => {
      const t = location.hash.slice(1);
      if (TABS.indexOf(t) >= 0 && t !== S.tab) setTab(t);
    });
  }

  async function boot() {
    buildShell();
    bindGlobal();
    const h = location.hash.slice(1);
    setTab(TABS.indexOf(h) >= 0 ? h : (pref.get('tab') || 'futbol'), true);
    renderAll();
    let backend;
    try { backend = await initBackend(); } catch (e) { backend = await localBackend('memory'); }
    S.backend = backend;
    S.canWrite = backend.canWrite;
    const timer = setTimeout(() => { if (!S.definitive) { S.stale = true; S.ready = true; S.sig = {}; renderAll(); } }, 10000);
    backend.subscribe((data) => {
      S.exercises = data.exercises.slice();
      S.classes = data.classes.slice();
      S.ready = true;
      if (!data.fromCache) { S.definitive = true; S.stale = false; clearTimeout(timer); }
      renderAll();
      refreshScreens();
    }, (err) => {
      clearTimeout(timer);
      S.error = err; S.ready = true; S.sig = {};
      renderAll();
    });
    renderAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
