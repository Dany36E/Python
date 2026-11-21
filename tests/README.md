# Pruebas de Cancha

Pruebas automáticas que abren la app en un navegador y usan todo como lo haría un profe.

| Archivo | Qué revisa |
|---|---|
| `flujo-completo.js` | Clase con pausa y series, modo clase con reloj simulado, pase de lista, duplicar, «Pasar lista hoy», deshacer (también con doble toque), reporte PDF por trimestre, pizarrón, respaldo e importación en otro iPad con un conflicto, iPhone y iPad en claro y oscuro. |
| `regresiones.js` | Errores que encontró el QA: doble toque en «Pasar lista hoy», terminar sin empezar, catálogo «De entrenadores» y plantillas, PDF de clase, trimestre en agosto. |
| `nube.js` | La versión que vive en Claude (almacenamiento simulado): foto, grupo, clase con pausa y modo clase. |

## Cómo correrlas

Necesitas Node 18 o más nuevo.

```
npm install --no-save playwright
npx playwright install chromium
python3 -m http.server 8765        # en otra terminal, desde la carpeta del proyecto
node tests/flujo-completo.js
node tests/regresiones.js
node tests/nube.js
```

Cada prueba termina con `TODO BIEN` o con el número de fallas. Las capturas y los PDF quedan en `tests/out/` (no se suben al repositorio). Para probar otra dirección: `CANCHA_URL=https://dany36e.github.io/Python/ node tests/flujo-completo.js`.

Estas pruebas usan Chromium. Antes de publicar cambios grandes, haz también la prueba en un iPad real: [docs/prueba-en-ipad.md](../docs/prueba-en-ipad.md).
