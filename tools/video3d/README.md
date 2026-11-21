# Videos 3D de los ejercicios

Hace los videos verticales (tipo Short) de los ejercicios recomendados con jugadores en 3D.
Cada jugador sigue exactamente las flechas del pizarrón del ejercicio: corre, conduce el balón,
bota en básquetbol, salta vallas y aros, pasa por la escalera y tira a la canasta o a la portería.
No usa servicios de pago ni inteligencia artificial: todo se dibuja con three.js en el navegador.

## Cómo generarlos

```
cd tools/video3d && npm install && cd ../..     # una vez (three.js, solo para esta herramienta)
python3 -m http.server 8765                       # en otra terminal, desde la raíz del proyecto
node tools/video3d/make-videos3d.js               # todos, o pon los ids: cf-21 cb-04
```

Opciones: `WORKERS=3` (cuántos a la vez), `OUT=carpeta` (por defecto `app/videos`).
Por cada ejercicio deja `<id>.mp4` (720 × 1280), `<id>.jpg` (portada) y `<id>-t.jpg` (miniatura 4:5 para las tarjetas).

Para ver un cuadro sin grabar: abre `http://localhost:8765/tools/video3d/render3d.html` y en la consola
`await setup('cf-21'); frameAt(4000)`.

## Cómo decide la cámara

- Si el ejercicio ocupa poca cancha, la cámara se queda fija y lo muestra completo.
- Si alguien recorre mucho (zigzag, escalera, vallas), la cámara lo sigue a unos 8 m, como si lo grabara un profe.
- En los ejercicios de pases (rondos, ruedas) la cámara sube para que se vea la forma del ejercicio.
- En los tiros a la canasta se abre para que se vea el aro.

Si cambias el pizarrón de un ejercicio en `tools/catalogo/*.json`, vuelve a construir el catálogo y a generar su video.
