# El Himno Nacional Mexicano — animación

Cuento animado para niños (4:09, 1920×1080). Las voces son de Higgsfield con el motor
ElevenLabs (Elena, Leo, Pixie y Sterling). Todo lo visual está dibujado y animado con código (SVG).

## Estructura

- `guion.md`: el guion dividido en líneas por personaje (N = narradora, S = Santa Anna,
  L = Lupita, F = Francisco).
- `audio_jobs.json`: la toma de Higgsfield, el enlace y la duración de cada línea.
  `descargar_audios.sh` las baja a `audio/`.
- `tools/build_timeline.py`: coloca cada línea en su escena, detecta las frases dentro de
  cada audio (para sincronizar acciones con palabras), calcula el movimiento de boca y
  mezcla voces, música de caja musical y efectos en `build/mezcla.wav`.
- `anim/`: la animación. `js/characters.js` (personajes), `js/props.js` (fondos y
  utilería), `js/scenes.js` (las 13 escenas), `js/main.js` (transiciones y subtítulos).
- `tools/render.mjs`: captura cada cuadro con Chromium y lo codifica con ffmpeg.
- `arte/fuentes/`: las ilustraciones de referencia de estilo.

## Uso

```bash
python3 tools/build_timeline.py               # línea de tiempo + mezcla de audio
node tools/render.mjs stills 15,52,140        # cuadros sueltos en build/stills/
node tools/render.mjs video                   # video completo en build/himno.mp4
node tools/render.mjs video 128 153           # solo un tramo (segundos)
```

Para verla en el navegador con controles de reproducción, abre `anim/index.html`.
Con `?captions=0` se ocultan los subtítulos.
