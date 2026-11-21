# Cancha

Tu biblioteca de ejercicios de **fútbol** y **básquet** para preparar clases. Graba o sube videos de cada ejercicio, anótalos (objetivo, nivel, duración, jugadores, edad, material, puntos clave) y arma clases ordenando bloques con sus minutos.

Diseño: minimalismo nativo al estilo iOS (títulos grandes, listas agrupadas, hojas modales, barra de pestañas flotante de vidrio, modo claro y oscuro). El color de acento cambia según el deporte: verde cancha para fútbol y naranja para básquet.

## Qué puedes hacer

- **Biblioteca por deporte**: pestañas Fútbol y Básquet, con búsqueda, filtros por objetivo y favoritos.
- **Grabar o subir**: en el celular, «Grabar» abre la cámara; «Subir» toma un video o foto de la galería. También puedes crear un ejercicio solo con texto.
- **Ficha del ejercicio**: video, duración, jugadores, edad, descripción, puntos clave y material.
- **Clases**: crea una clase con fecha, añade ejercicios de tu biblioteca, ordénalos y ajusta los minutos. La app calcula el tiempo total y el minuto en que empieza cada bloque.
- **Funciona sin internet** una vez instalada.

## Cómo instalarla en tu celular

Es una app web instalable (PWA): no necesita App Store ni Google Play.

1. Publica este repositorio con **GitHub Pages**: en GitHub, *Settings → Pages → Build and deployment*, elige *Deploy from a branch*, rama `main` y carpeta `/ (root)`.
2. Abre la dirección que te da GitHub (algo como `https://<usuario>.github.io/python/`) en el celular.
3. **iPhone** (Safari): botón Compartir → *Agregar a inicio*. **Android** (Chrome): menú ⋮ → *Instalar app*.

## Dónde se guardan tus datos

- **App instalada**: todo (ejercicios, videos y clases) se guarda en el propio dispositivo, en IndexedDB. No sale de tu teléfono. Si borras los datos del navegador, se pierden.
- **Abierta como Artifact en Claude**: se guarda en tu cuenta de Claude y la ves igual en el celular y en la computadora. Los videos de más de 20 MB se reducen automáticamente antes de subirse.

## Estructura

```
index.html            Punto de entrada de la app
app/styles.css        Estilos (tokens de color, modo claro/oscuro, componentes)
app/app.js            Lógica: navegación, biblioteca, editor, clases y almacenamiento
manifest.webmanifest  Datos para instalarla como app
sw.js                 Service worker (funciona sin conexión)
icons/                Ícono de la app
```

No usa dependencias ni pasos de compilación. Para probarla en tu computadora:

```
python3 -m http.server 8000
```

y abre `http://localhost:8000`.
