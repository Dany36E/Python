# Cancha

Tu biblioteca de ejercicios de **fútbol** y **básquetbol** para preparar y dar clases. Graba o sube videos de cada ejercicio, dibújalos en la pizarra, arma clases por grupo y dalas con el cronómetro en la mano.

Diseño: minimalismo nativo al estilo iOS (títulos grandes, listas agrupadas, hojas modales, barra de pestañas flotante de vidrio, modo claro y oscuro). El color de acento cambia según el deporte: verde cancha para fútbol y naranja para básquetbol; las pausas van en azul.

## Qué puedes hacer

La app tiene tres pestañas: **Clases**, **Ejercicios** y **Grupos**. Arriba a la derecha está **Respaldo**.

- **Clases**: arriba aparece la clase de hoy o la próxima, con «Iniciar» y «Pasar lista» a un toque. Cada clase tiene fecha, grupo y un plan de ejercicios con sus minutos; Cancha calcula el total y el minuto en que empieza cada bloque.
- **Pausas y series**: añade pausas al plan (hidratación, descanso, montar material) y divide un ejercicio en series de juego y descanso (por ejemplo 5 × 3′ con 1′ de descanso).
- **Duplicar una clase** para otro grupo o fecha.
- **Modo clase**: cronómetro por bloque con silbato, el video o la pizarra del ejercicio en pantalla, «+1 min», series con silbato al cambiar de juego a descanso, y la pantalla encendida mientras das la clase. Para terminar pide confirmación.
- **Ejercicios**: de fútbol y de básquetbol, con búsqueda, filtros por objetivo y favoritos. Graba o sube un video o foto, o dibújalo en la **pizarra** (jugadores, conos, balón y flechas de pase, conducción/dribleo o desplazamiento sin balón).
- **Grupos**: lista de alumnos en el orden de tu lista oficial (con número), «Pasar lista hoy», historial de clases y objetivos trabajados.
- **Asistencia**: asistió, retardo o falta; cada alumno muestra su porcentaje.
- **Reporte de asistencia en PDF** tamaño carta: este mes, mes pasado, **trimestre** (aproximado al calendario de la SEP) o fechas; con número de lista, totales por alumno, nombre de la escuela y del profe, y espacio para firma.
- **Compartir una clase**: por WhatsApp, en PDF para imprimir, copiando el texto o como archivo para otro profe.
- **Respaldo**: un toque guarda todo (ejercicios, clases, grupos, listas y videos) en un archivo .zip para guardarlo en Archivos / iCloud Drive. También puedes **mandar** ejercicios o clases a otro profe por AirDrop o WhatsApp e **importar** archivos: no se borra nada tuyo, y si los dos cambiaron el mismo ejemplo se guarda una copia.
- **Funciona sin internet** una vez instalada.

## Cómo instalarla en tu celular

Es una app web instalable (PWA): no necesita App Store ni Google Play.

1. Publica este repositorio con **GitHub Pages**: en GitHub, *Settings → Pages → Build and deployment*, elige *Deploy from a branch*, rama `main` y carpeta `/ (root)`.
2. Abre https://dany36e.github.io/Python/ en el celular o iPad.
3. **iPhone** (Safari): botón Compartir → *Agregar a inicio*. **Android** (Chrome): menú ⋮ → *Instalar app*.

## Dónde se guardan tus datos

- **App instalada**: todo se guarda en el propio dispositivo, en IndexedDB. No sale de tu teléfono o iPad. Si borras los datos del navegador, se pierden, así que conviene hacer un respaldo de vez en cuando (botón **Respaldo** → «Hacer respaldo completo»). La app te lo recuerda.
- **Abierta como Artifact en Claude**: se guarda en tu cuenta de Claude y la ves igual en el celular y en la computadora. Otros profes pueden ver y agregar ejercicios si los invitas como Editores desde el botón Compartir de Claude. Los videos de más de 20 MB se reducen automáticamente antes de subirse.

## Estructura

```
index.html            Punto de entrada de la app
app/styles.css        Estilos (tokens de color, modo claro/oscuro, componentes)
app/app.js            Lógica: navegación, biblioteca, pizarra, clases, grupos, modo clase y almacenamiento
manifest.webmanifest  Datos para instalarla como app
sw.js                 Service worker (funciona sin conexión; sube VERSION en cada cambio publicado)
icons/                Ícono de la app
```

No usa dependencias ni pasos de compilación (jsPDF va incluido en `app/vendor/` y solo se carga cuando pides un PDF). Para probarla en tu computadora:

```
python3 -m http.server 8000
```

y abre `http://localhost:8000`.
