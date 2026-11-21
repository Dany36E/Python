# Cancha

Tu biblioteca de ejercicios de **fútbol** y **básquetbol** para preparar y dar clases. Graba o sube videos de cada ejercicio, dibújalos en la pizarra, arma clases por grupo y dalas con el cronómetro en la mano.

Diseño: estructura nativa de iOS con identidad de cancha: pizarrón magnético con pasto en franjas o duela de madera, letra condensada de estadio (Big Shoulders Display, licencia OFL) para títulos y reloj, verde cancha para fútbol, naranja duela para básquetbol y azul para las pausas. Modo claro y oscuro.

## Qué puedes hacer

La app tiene tres pestañas: **Clases**, **Ejercicios** y **Grupos**. Arriba a la derecha está **Respaldo**.

La primera vez que se abre, un **tutorial de 5 pasos** con dibujos animados explica lo básico (se puede saltar y se vuelve a ver en Ajustes → «Ver el tutorial»).

- **Clases**: arriba aparece la clase de hoy o la próxima, con «Iniciar» y «Pasar lista» a un toque. Cada clase tiene fecha, grupo y un plan de ejercicios con sus minutos; Cancha calcula el total y el minuto en que empieza cada bloque.
- **Pausas y series**: agrega pausas al plan (hidratación, descanso, montar material) y divide un ejercicio en series de juego y descanso (por ejemplo 5 × 3′ con 1′ de descanso).
- **Duplicar una clase** para otro grupo o fecha.
- **Modo clase**: cronómetro por bloque con silbato (suena aunque el iPad esté en silencio), la jugada animada en pantalla, «−1» y «+1 min», series con silbato al cambiar de juego a descanso y «Saltar descanso», y la pantalla encendida. Si iOS cierra la app, al volver a abrirla ofrece seguir la clase donde iba.
- **Ejercicios**: de fútbol y de básquetbol, con búsqueda (también en los Recomendados), filtros (objetivo, nivel, edad, duración, con video, para escuela), orden y favoritos. **Secciones** que tú creas (como carpetas), con tres de ejemplo: Calentamientos, Coordinación y velocidad, y Para primaria. Graba o sube un video o foto, pega un **link de YouTube**, o dibújalo en el **pizarrón** (jugadores, conos, balón y flechas de pase, conducción/dribleo o desplazamiento sin balón).
- **La jugada se mueve**: el pizarrón reproduce el ejercicio paso a paso (el balón viaja por los pases y los jugadores corren por sus flechas). En el modo clase se repite mientras corre el bloque.
- **Recomendados**: 50 ejercicios (26 de fútbol y 24 de básquetbol, incluidos coordinación con escalera, vallas, aros y picas; velocidad y agilidad; y fuerza con peso corporal), basados en FIFA 11+ Kids, The FA, US Soccer, FIBA, Jr. NBA, NSCA y otras fuentes, y 6 clases completas para escuela y club. **Cada uno trae su video vertical** (tipo Short) en 3D: jugadores que corren, conducen, saltan vallas y pasan exactamente por las flechas del pizarrón, con el título y las frases clave; se puede mandar por WhatsApp. Agrega a tus ejercicios solo los que te sirvan o usa una clase lista con un toque.
- **Grupos**: lista de alumnos en el orden de tu lista oficial (con número), «Pasar lista hoy» (en iPad, en dos columnas), historial de clases y objetivos trabajados.
- **Asistencia**: asistió, retardo o falta; cada alumno muestra su porcentaje.
- **Reporte de asistencia en PDF** tamaño carta: este mes, mes pasado, **trimestre** (aproximado al calendario de la SEP) o fechas; con número de lista, totales por alumno, nombre de la escuela y del profe, y espacio para firma.
- **Compartir una clase**: por WhatsApp, en PDF para imprimir, copiando el texto o como archivo para otro profe.
- **Respaldo**: un toque guarda todo (ejercicios, clases, grupos, listas y videos) en un archivo .zip para guardarlo en Archivos / iCloud Drive. También puedes **mandar** ejercicios o clases a otro profe por AirDrop o WhatsApp y **abrir** los archivos que te manden: no se borra nada tuyo, y si los dos cambiaron el mismo ejemplo se guarda una copia.
- **Funciona sin internet** una vez instalada.

## Cómo instalarla en tu celular

Es una app web instalable (PWA): no necesita App Store ni Google Play.

1. Publica este repositorio con **GitHub Pages**: en GitHub, *Settings → Pages → Build and deployment*, elige *Deploy from a branch*, rama `main` y carpeta `/ (root)`.
2. Abre https://dany36e.github.io/Python/ en el celular o iPad.
3. **iPhone** (Safari): botón Compartir → *Agregar a inicio*. **Android** (Chrome): menú ⋮ → *Instalar app*.

## Dónde se guardan tus datos

- **App instalada**: todo se guarda en el propio dispositivo, en IndexedDB. No sale de tu teléfono o iPad. Si borras los datos del navegador, se pierden, así que conviene hacer un respaldo de vez en cuando (botón **Respaldo** → «Hacer respaldo completo»). La app te lo recuerda.
- **Abierta como Artifact en Claude**: se guarda en tu cuenta de Claude y la ves igual en el celular y en la computadora. Otros profes pueden ver y agregar ejercicios si los invitas como Editores desde el botón Compartir de Claude. Los videos de más de 20 MB se reducen automáticamente antes de subirse.

## Calidad

- **Pruebas automáticas** en `tests/` (cómo correrlas: [tests/README.md](tests/README.md)).
- **Prueba en un iPad real** antes de recomendarla o después de cambios grandes: [docs/prueba-en-ipad.md](docs/prueba-en-ipad.md).
- **Revisión de los ejercicios de entrenadores** por un profe: [docs/revision-ejercicios.md](docs/revision-ejercicios.md). Las fuentes están en `tools/catalogo/` y `node tools/catalogo/build_catalog.js` regenera `app/catalog.js`.

## Estructura

```
index.html            Punto de entrada de la app
app/styles.css        Estilos (tokens de color, modo claro/oscuro, componentes)
app/app.js            Lógica: navegación, biblioteca, pizarrón, clases, grupos, modo clase y almacenamiento
app/catalog.js        Ejercicios y clases de entrenadores («De entrenadores»)
app/fonts/            Letra de estadio (Big Shoulders Display, OFL)
app/videos/           Videos de los ejercicios recomendados (generados con tools/video3d)
tools/video3d/        Generador de los videos 3D: lee el pizarrón de cada ejercicio y anima jugadores con three.js (Playwright + ffmpeg)
tools/video/          Generador anterior (pizarrón animado en 2D)
manifest.webmanifest  Datos para instalarla como app
sw.js                 Service worker (funciona sin conexión; sube VERSION en cada cambio publicado)
icons/                Ícono de la app
```

No usa dependencias ni pasos de compilación (jsPDF va incluido en `app/vendor/` y solo se carga cuando pides un PDF). Para probarla en tu computadora:

```
python3 -m http.server 8000
```

y abre `http://localhost:8000`.
