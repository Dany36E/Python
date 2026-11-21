# Pruebas de Cancha

Pruebas automáticas que abren la app en un navegador y usan todo como lo haría un profe.

| Archivo | Qué revisa |
|---|---|
| `flujo-completo.js` | Clase con pausa y series, modo clase con reloj simulado, pase de lista, duplicar, «Pasar lista hoy», deshacer (también con doble toque), reporte PDF por trimestre, pizarrón, respaldo e importación en otro iPad con un conflicto, iPhone y iPad en claro y oscuro. |
| `regresiones.js` | Errores que encontró el QA (doble toque, terminar sin empezar, trimestre en agosto), Recomendados y clases listas, PDF de clase, apariencia, secciones, filtros, búsqueda, seguir una clase a medias y el tutorial de la primera vez. |
| `opciones.js` | Formularios con opciones para tocar: ejercicio con varias opciones por grupo (edad, alumnos, organización, espacio, material), filtros con las mismas opciones (también en Recomendados), grupo con días y hora, clase con temas y duración, y el selector que filtra por el grupo. |
| `nube.js` | La versión que vive en Claude (almacenamiento simulado): foto, grupo, clase con pausa y modo clase. |
| `actualizacion.js` | Instala la versión publicada, guarda datos de un profe y actualiza a la nueva: no se pierde nada y llegan los ejemplos nuevos. Necesita `OLD` (carpeta con la versión publicada). |

## Cómo correrlas

Necesitas Node 18 o más nuevo.

```
npm install --no-save playwright
npx playwright install chromium
python3 -m http.server 8765        # en otra terminal, desde la carpeta del proyecto
node tests/flujo-completo.js
node tests/regresiones.js
node tests/opciones.js
node tests/nube.js
```

Las pruebas saltan el tutorial (guardan `cancha:onboarded`), salvo la que lo revisa. Cada prueba termina con `TODO BIEN` o con el número de fallas. Las capturas y los PDF quedan en `tests/out/` (no se suben al repositorio). Para probar otra dirección: `CANCHA_URL=https://dany36e.github.io/Python/ node tests/flujo-completo.js`.

Estas pruebas usan Chromium. Antes de publicar cambios grandes, haz también la prueba en un iPad real: [docs/prueba-en-ipad.md](../docs/prueba-en-ipad.md).
