# Cancha

Tu biblioteca de ejercicios de **fútbol** y **básquetbol** para preparar y dar clases. Graba o sube videos de cada ejercicio, dibújalos en la pizarra, arma clases por grupo y dalas con el cronómetro en la mano.

Diseño: minimalismo nativo al estilo iOS (títulos grandes, listas agrupadas, hojas modales, barra de pestañas flotante de vidrio, modo claro y oscuro). El color de acento cambia según el deporte: verde cancha para fútbol y naranja para básquetbol.

## Qué puedes hacer

- **Biblioteca por deporte**: pestañas Fútbol y Básquetbol, con búsqueda, filtros por objetivo, favoritos y «Míos» cuando comparten varios profes.
- **Grabar o subir**: en el celular, «Grabar» abre la cámara; «Subir» toma un video o foto de la galería.
- **Pizarra táctica**: dibuja jugadores de dos equipos, conos, balón, pases, conducciones y desplazamientos sobre campo completo, medio campo, media cancha o cancha completa.
- **Clases**: con fecha y grupo; añade ejercicios, ordénalos y ajusta los minutos. Cancha calcula el tiempo total y el minuto en que empieza cada bloque.
- **Modo clase**: cronómetro por ejercicio con silbato al terminar, el video o la pizarra del ejercicio en pantalla, «+1 min», y la pantalla encendida mientras das la clase.
- **Grupos**: cada grupo guarda su historial de clases, los minutos acumulados y los objetivos que ha trabajado.
- **Compartir una clase**: por WhatsApp, en PDF o copiando el texto.
- **Funciona sin internet** una vez instalada.

## Cómo instalarla en tu celular

Es una app web instalable (PWA): no necesita App Store ni Google Play.

1. Publica este repositorio con **GitHub Pages**: en GitHub, *Settings → Pages → Build and deployment*, elige *Deploy from a branch*, rama `main` y carpeta `/ (root)`.
2. Abre la dirección que te da GitHub (algo como `https://<usuario>.github.io/python/`) en el celular.
3. **iPhone** (Safari): botón Compartir → *Agregar a inicio*. **Android** (Chrome): menú ⋮ → *Instalar app*.

## Dónde se guardan tus datos

- **App instalada**: todo se guarda en el propio dispositivo, en IndexedDB. No sale de tu teléfono. Si borras los datos del navegador, se pierden.
- **Abierta como Artifact en Claude**: se guarda en tu cuenta de Claude y la ves igual en el celular y en la computadora. Otros profes pueden ver y agregar ejercicios si los invitas como Editores desde el botón Compartir de Claude. Los videos de más de 20 MB se reducen automáticamente antes de subirse.

## Estructura

```
index.html            Punto de entrada de la app
app/styles.css        Estilos (tokens de color, modo claro/oscuro, componentes)
app/app.js            Lógica: navegación, biblioteca, pizarra, clases, grupos, modo clase y almacenamiento
manifest.webmanifest  Datos para instalarla como app
sw.js                 Service worker (funciona sin conexión)
icons/                Ícono de la app
```

No usa dependencias ni pasos de compilación (el PDF carga jsPDF desde cdnjs solo cuando lo pides). Para probarla en tu computadora:

```
python3 -m http.server 8000
```

y abre `http://localhost:8000`.
