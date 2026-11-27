# Geografía y georreferencia de General Escobedo, N.L. (límite, colonias, corredores, industria, vialidades)

> Nota de método (léase primero). El proxy de esta sesión bloqueó Nominatim, Overpass, Wikipedia, inegi.org.mx, escobedo.gob.mx y los portales inmobiliarios, tanto con curl como con WebFetch. Por eso las coordenadas **no salen de geocodificar nombres**. Salen de **datos oficiales espaciales copiados en GitHub**, que sí eran accesibles:
> 1. **INEGI Marco Geoestadístico 2025**: polígonos municipales de N.L. y localidades de Escobedo, en el repositorio [MacWilliXD/INEGI-geojson](https://github.com/MacWilliXD/INEGI-geojson).
> 2. **Capa de colonias de Escobedo del Índice de Marginación por Colonia 2020** (campos CVE_COL, IM_2020, GM_2020 y POBTOT, propios de CONAPO). Tiene 302 polígonos con nombre, CP, población y grado de marginación. Está en [Raul-QU/Marginacion_colonias_Monterrey](https://github.com/Raul-QU/Marginacion_colonias_Monterrey). La proyección original es ITRF2008 LCC y la convertí a WGS84 con pyproj.
> 3. **INEGI Red Nacional de Caminos 2023**: vialidades con nombre, en [CentroGeo/RedNacionalCaminos_2019_2023](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023).
> 4. **Estaciones de Metrorrey**: export de Overpass/OSM con IDs de nodo, en [alvaropg5/proyecto_IA](https://github.com/alvaropg5/proyecto_IA) (paradas.json).
> 5. **Polígonos SEPOMEX por código postal**, en [open-mexico/mexico-geojson](https://github.com/open-mexico/mexico-geojson).
>
> Los centroides se calcularon con shapely. Cada punto del JSON trae el municipio en que cae según el polígono INEGI y la distancia al límite de Escobedo, como verificación.

## 1. Límites municipales y polígono simplificado de General Escobedo

### Takeaway
El límite oficial del INEGI (CVEGEO 19021) mide unos 149 km² y va de 25.762° a 25.898° N y de -100.468° a -100.261° O. Escobedo colinda con **8 municipios**: Monterrey, García, Hidalgo, Abasolo (contacto de ~0.4 km), El Carmen, Salinas Victoria, Apodaca y San Nicolás de los Garza. El límite sur con San Nicolás corre casi sobre la **Av. Sendero** ("Sendero Divisorio"). Guardé un polígono simplificado de 31 vértices (error menor a ~100 m) en `escobedo_limite.geojson`.

### Cited Findings
- Polígono municipal de General Escobedo (cvegeo 19021, población 2020 de 481,213 y 131,741 viviendas), del Marco Geoestadístico INEGI 2025. El polígono de 2025 es idéntico al de la versión "OLD" del mismo repositorio (diferencia simétrica de 0 km²) — [MacWilliXD/INEGI-geojson](https://github.com/MacWilliXD/INEGI-geojson)
- Cálculos propios sobre ese polígono:
  - Extensión: lon -100.46846 a -100.26125 y lat 25.76221 a 25.89846.
  - Centroide: 25.82187, -100.35558.
  - Área aproximada: 149.0 km².
  — [MacWilliXD/INEGI-geojson](https://github.com/MacWilliXD/INEGI-geojson)
- Colindancias, medidas como longitud de límite compartido con cada polígono INEGI vecino:
  - El Carmen ≈ 16.1 km (norte y noreste)
  - García ≈ 13.1 km (poniente)
  - Monterrey ≈ 10.7 km (sur-poniente, incluido el Cerro del Topo Chico)
  - Apodaca ≈ 9.9 km (oriente)
  - San Nicolás de los Garza ≈ 7.5 km (sur)
  - Hidalgo ≈ 5.2 km (noroeste)
  - Salinas Victoria ≈ 2.8 km (norte)
  - Abasolo ≈ 0.4 km
  - **Salinas Victoria y El Carmen sí colindan; Hidalgo y Abasolo también, y no estaban en la lista original.** — [MacWilliXD/INEGI-geojson](https://github.com/MacWilliXD/INEGI-geojson)
- Unos 6.0 de los ~7.5 km de límite con San Nicolás quedan a menos de 80 m del eje de la Av. Sendero ("Sendero Norte" en INEGI). Es decir, la Av. Sendero hace de divisoria Escobedo–San Nicolás. La Av. República Mexicana coincide con ~1.5 km del límite oriente. — [INEGI RNC 2023 vía CentroGeo](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023) + [INEGI MG](https://github.com/MacWilliXD/INEGI-geojson)
- La localidad urbana "Ciudad General Escobedo" (190210001) tiene 454,967 habitantes. Hay 8 localidades más, rurales o semiurbanas, en el norte y el norponiente: Praderas de San Francisco (17,284), Palmiras (4,076), Monclova 1er y 2do sector, San Miguel de los Garza, Unión Agropecuarios Lázaro Cárdenas del Norte, Unión de Colonos Santana y Navistar. — [INEGI AGLOC 19021](https://github.com/MacWilliXD/INEGI-geojson)

#### Polígono simplificado (31 vértices, [lng, lat], Douglas-Peucker con tolerancia de 0.001°)
```json
[[-100.46376, 25.89837], [-100.44448, 25.89321], [-100.44233, 25.89178], [-100.44281, 25.89048], [-100.42758, 25.8957], [-100.4074, 25.86398], [-100.39733, 25.85363], [-100.37959, 25.84852], [-100.32724, 25.84657], [-100.32734, 25.84858], [-100.27276, 25.84942], [-100.27062, 25.84573], [-100.26746, 25.82999], [-100.26587, 25.83021], [-100.26125, 25.80201], [-100.26787, 25.80401], [-100.26998, 25.80203], [-100.26698, 25.77055], [-100.34048, 25.76221], [-100.34291, 25.76802], [-100.35593, 25.78513], [-100.36305, 25.78936], [-100.36615, 25.78938], [-100.36731, 25.79142], [-100.38719, 25.79735], [-100.39343, 25.79277], [-100.4035, 25.79654], [-100.41106, 25.79033], [-100.41746, 25.78968], [-100.45812, 25.88026], [-100.46846, 25.89827], [-100.46376, 25.89837]]
```

#### Archivos generados (misma carpeta)
- `escobedo_limite.geojson`: polígono simplificado de 31 vértices (el solicitado).
- `escobedo_limite_detallado.geojson`: versión de 86 vértices (tolerancia ≈ 20 m), para mapas a zoom alto.
- `municipios_vecinos.geojson`: los 8 municipios colindantes, simplificados, como contexto del mapa.
- `escobedo_colonias_conapo2020.geojson`: **302 polígonos de colonias** con colonia, CP, clasificación, población 2020, grado de marginación 2020, área y centroide. Sirve como base de las zonas de plusvalía.
- `escobedo_vialidades.geojson`: 20 ejes viales (INEGI RNC 2023, una calzada, simplificados a ~25 m) y el trazo aproximado del Río Pesquería.
- `escobedo_puntos.json`: 132 puntos con los campos name, type, lat, lng, confidence y source. Además incluye municipio_segun_poligono_inegi, dist_limite_escobedo_m, cp, pob_2020, grado_marginacion_2020, sector_inferido y nota.
- `escobedo_mapa_verificacion.png`: render estático de control con límite, colonias, ejes y puntos.

### Inferences
- El polígono simplificado se aparta menos de ~100 m del oficial (el área cambia un 0.4%). Basta para un mapa de zonas, pero no sirve para decidir si un predio concreto queda dentro o fuera del municipio.
- Las colindancias se calcularon con un buffer de ~50 m, así que el contacto con Abasolo (0.4 km) puede ser solo un vértice.

### Gaps
- No pude descargar la relación de OSM (admin_level=6) porque Nominatim y Overpass estaban bloqueados. El límite es el del INEGI, que es la fuente oficial. Si se necesita la geometría de OSM, hay que habilitar `nominatim.openstreetmap.org` / `overpass-api.de` en la red de la sesión.

## 2. Coordenadas de colonias y fraccionamientos residenciales

### Takeaway
Las 302 colonias de la capa de marginación 2020 permiten ubicar con **confianza alta** casi todas las zonas pedidas. Los sectores tienen centroides de unión: Anáhuac, El Canadá, Pedregal del Topo Chico, Fomerrey, Nuevo Escobedo, Santa Luz, Monte Real, Los Altos y Centro, además de los desarrollos del norponiente (Alianza Real, San Miguel, Praderas y Villas de San Francisco). **No encontré en Escobedo** "Paseo de Cumbres", "Arcos de Escobedo", "Riberas de Escobedo" ni "Valle de Santa Elena".

### Cited Findings
- Coordenadas (centroide del polígono o de la unión de sectores). Las columnas GM y Pob. vienen de la capa de colonias 2020 — [Raul-QU/Marginacion_colonias_Monterrey](https://github.com/Raul-QU/Marginacion_colonias_Monterrey). Las filas marcadas "Localidad INEGI" vienen de [INEGI AGLOC](https://github.com/MacWilliXD/INEGI-geojson).

| Zona | Lat | Lng | Conf. | Sector inferido | CP | Pob. 2020 | GM 2020 | Fuente |
|---|---|---|---|---|---|---|---|---|
| Centro de Gral. Escobedo (colonia) | 25.80874 | -100.32638 | alta | Centro | 66050 | 5839 | Muy bajo | Colonias 2020 (CONAPO) |
| Privadas de Anáhuac (5 sectores) | 25.77854 | -100.27804 | alta | Sur-Oriente (Anáhuac) | 66050 | 4081 | Muy bajo | Colonias 2020 (CONAPO) |
| Puerta de Anáhuac (4 privadas) | 25.79366 | -100.28322 | alta | Sur-Oriente (Anáhuac) | 66050 | 477 | Muy bajo | Colonias 2020 (CONAPO) |
| Anáhuac San Patricio | 25.78812 | -100.29567 | alta | Sur-Oriente (Anáhuac) | 66058 | 668 | Bajo | Colonias 2020 (CONAPO) |
| Villas de Anáhuac | 25.77051 | -100.28481 | alta | Sur-Oriente (Anáhuac) | 66059 | 711 | Muy bajo | Colonias 2020 (CONAPO) |
| Colinas de Anáhuac (3 sectores) | 25.77300 | -100.32468 | alta | Sur-Poniente | 66056 | 5051 | Bajo, Muy bajo | Colonias 2020 (CONAPO) |
| Jolla de Anáhuac (sectores Florencia, Nápoles, Venecia) — CONAPO escribe "Jolla". Distinto de "Joyas de Anáhuac" (CP 66054, junto a Av. Sendero/Carretera Laredo, donde está el Costco); ver nota. | 25.77700 | -100.31336 | alta | Sur-Poniente | 66050 | 4241 | Muy bajo | Colonias 2020 (CONAPO) |
| Cerradas de Anáhuac | 25.77393 | -100.27215 | alta | Sur-Oriente (Anáhuac) | 66050 | 4800 | Muy bajo | Colonias 2020 (CONAPO) |
| Misión Anáhuac (3 sectores) | 25.78178 | -100.27081 | alta | Sur-Oriente (Anáhuac) | 66050 | 2593 | Muy bajo | Colonias 2020 (CONAPO) |
| Anáhuac La Pérgola / Madeira / Campoamor / Premier | 25.78743 | -100.27955 | alta | Sur-Oriente (Anáhuac) | 66050, 66054, 66059 | 4301 | Muy bajo | Colonias 2020 (CONAPO) |
| Calzada de Anáhuac | 25.79005 | -100.27586 | alta | Sur-Oriente (Anáhuac) | 66059 | 1476 | Muy bajo | Colonias 2020 (CONAPO) |
| Paraje Anáhuac | 25.78714 | -100.27125 | alta | Sur-Oriente (Anáhuac) | 66050 | 2175 | Muy bajo | Colonias 2020 (CONAPO) |
| Quintas de Anáhuac | 25.78171 | -100.27416 | alta | Sur-Oriente (Anáhuac) | 66050 | 1157 | Muy bajo | Colonias 2020 (CONAPO) |
| Balcones de Anáhuac (I-III) — Un polígono tiene CP 66422 (San Nicolás) y área ~0; posible artefacto de la capa. | 25.76566 | -100.32380 | alta | Sur (límite San Nicolás) | 66056, 66422 | 5564 | Bajo, Muy bajo | Colonias 2020 (CONAPO) |
| La Encomienda (9 sectores) | 25.77399 | -100.28105 | alta | Sur-Oriente (Anáhuac) | 66050, 66054 | 2820 | Muy bajo | Colonias 2020 (CONAPO) |
| Hacienda Los Cantú | 25.77500 | -100.26828 | alta | Sur-Oriente (Anáhuac) | 66050 | 1743 | Muy bajo | Colonias 2020 (CONAPO) |
| Valle de las Palmas — Polígonos con CP de Apodaca (6661x/6663x) y área ~0 en la capa; verificar. | 25.78281 | -100.26820 | alta | Oriente | 66612, 66635 | 4980 | Muy bajo | Colonias 2020 (CONAPO) |
| Hacienda El Canadá (Ex-Hacienda) | 25.78195 | -100.28988 | alta | Sur (corredor Sendero/Canadá) | 66054 | 1209 | Medio, Muy bajo | Colonias 2020 (CONAPO) |
| Valle del Canadá | 25.77350 | -100.28718 | alta | Sur-Oriente (Anáhuac) | 66059 | 2437 | Muy bajo | Colonias 2020 (CONAPO) |
| Desarrollo Urbano El Canadá (reserva / sitio Canadá City Center) | 25.77342 | -100.29904 | alta | Sur (corredor Sendero/Canadá) | 66050 | 2251 | Muy bajo | Colonias 2020 (CONAPO) |
| Privadas del Canadá (Montreal, Toronto, Ontario, Quebec, Vancouver) | 25.79142 | -100.27186 | alta | Sur-Oriente (Anáhuac) | 66059 | 753 | Muy bajo | Colonias 2020 (CONAPO) |
| Jardines del Canadá | 25.79902 | -100.30662 | alta | Centro-Sur | 66050 | 3071 | Muy bajo | Colonias 2020 (CONAPO) |
| Nexxus Residencial (7 sectores) | 25.77278 | -100.31059 | alta | Sur | 66050 | 2219 | Muy bajo | Colonias 2020 (CONAPO) |
| Puerta del Norte | 25.77520 | -100.29049 | alta | Sur (corredor Sendero/Canadá) | 66054 | 1933 | Muy bajo | Colonias 2020 (CONAPO) |
| Las Hadas | 25.78506 | -100.29524 | alta | Centro-Sur | 66058 | 1678 | Muy bajo | Colonias 2020 (CONAPO) |
| Hacienda de Escobedo | 25.78350 | -100.30527 | alta | Centro-Sur | 66057 | 3189 | Muy bajo | Colonias 2020 (CONAPO) |
| Privada Residencial Aviana / Cerradas Aviana | 25.79357 | -100.31264 | alta | Centro-Sur | 66056, 66057 | 3999 | Muy bajo | Colonias 2020 (CONAPO) |
| Residencial Escobedo | 25.78827 | -100.30863 | alta | Centro-Sur | 66057 | 3000 | Muy bajo | Colonias 2020 (CONAPO) |
| Los Girasoles (4 sectores) y Rivera/Valle/Praderas de Girasoles | 25.78619 | -100.32375 | alta | Centro-Sur | 66050, 66056 | 10463 | Bajo, Muy bajo | Colonias 2020 (CONAPO) |
| Topo Grande | 25.78278 | -100.31400 | alta | Centro-Sur | 66056 | 4643 | Muy bajo | Colonias 2020 (CONAPO) |
| Felipe Carrillo Puerto (Infonavit) | 25.78135 | -100.32170 | alta | Sur-Poniente | 66055 | 8667 | Bajo | Colonias 2020 (CONAPO) |
| Celestino Gasca | 25.77273 | -100.31851 | alta | Sur-Poniente | 66050 | 5579 | Muy bajo | Colonias 2020 (CONAPO) |
| Lomas de San Genaro / Infonavit San Genaro | 25.77881 | -100.33534 | alta | Sur-Poniente | 66050, 66073 | 11495 | Muy bajo | Colonias 2020 (CONAPO) |
| Provileón (Alfonso Martínez Domínguez) | 25.78657 | -100.33602 | alta | Sur-Poniente | 66073 | 7276 | Bajo | Colonias 2020 (CONAPO) |
| Hacienda del Topo | 25.78798 | -100.33048 | alta | Sur-Poniente | 66072 | 4250 | Bajo | Colonias 2020 (CONAPO) |
| Monte Real | 25.79946 | -100.32172 | alta | Centro | 66050 | 1652 | Bajo | Colonias 2020 (CONAPO) |
| Monterreal (Infonavit) | 25.79663 | -100.31784 | alta | Centro | 66056 | 7177 | Bajo | Colonias 2020 (CONAPO) |
| Santa Luz | 25.79889 | -100.34447 | alta | Centro-Poniente | 66050 | 4478 | Muy bajo | Colonias 2020 (CONAPO) |
| Mirasur / Villas de Mirasur | 25.79689 | -100.34173 | alta | Centro-Poniente | 66050 | 6821 | Muy bajo | Colonias 2020 (CONAPO) |
| Paseo Real | 25.79794 | -100.33519 | alta | Centro-Poniente | 66050 | 3428 | Muy bajo | Colonias 2020 (CONAPO) |
| Brianzzas Residencial | 25.80408 | -100.33854 | alta | Centro-Poniente | 66050 | 2295 | Muy bajo | Colonias 2020 (CONAPO) |
| Bosques de Escobedo | 25.80300 | -100.33702 | alta | Centro-Poniente | 66050 | 1923 | Muy bajo | Colonias 2020 (CONAPO) |
| Pedregal de San Agustín | 25.79330 | -100.34989 | alta | Centro-Poniente | 66050 | 3357 | Muy bajo | Colonias 2020 (CONAPO) |
| Las Encinas / Rincón de las Encinas | 25.80377 | -100.31002 | alta | Centro | 66050 | 7495 | Bajo, Muy bajo | Colonias 2020 (CONAPO) |
| Jardines de Escobedo (sectores 1-2) | 25.79964 | -100.31826 | alta | Centro | 66050 | 3799 | Bajo, Muy bajo | Colonias 2020 (CONAPO) |
| Miravista (3 sectores) | 25.80531 | -100.31417 | alta | Centro | 66050 | 2774 | Muy bajo | Colonias 2020 (CONAPO) |
| Privadas del Sauce | 25.81672 | -100.30962 | alta | Centro-Norte | 66050 | 2620 | Muy bajo | Colonias 2020 (CONAPO) |
| Los Altos (polígono principal, 117 ha) — La capa tiene 3 polígonos "Los Altos"; el grande (CP 66050) está en 25.7977,-100.2866; dos pequeños (CP 66614) junto al límite con Apodaca (~25.803,-100.262). | 25.79777 | -100.28643 | alta | Oriente (Río Pesquería) | 66050, 66614 | 2208 | Bajo, Medio | Colonias 2020 (CONAPO) |
| Fernando Amilpa / Río Pesquería (Fernando Amilpa) | 25.80151 | -100.27213 | alta | Oriente (Río Pesquería) | 66050, 66052 | 11826 | Medio, Muy bajo | Colonias 2020 (CONAPO) |
| Las Malvinas | 25.79668 | -100.29537 | alta | Oriente (Río Pesquería) | 66050 | 1899 | Medio | Colonias 2020 (CONAPO) |
| Lázaro Cárdenas | 25.78905 | -100.29880 | alta | Centro-Oriente | 66050, 66058 | 4334 | Bajo, Muy bajo | Colonias 2020 (CONAPO) |
| Nueva Castilla | 25.81735 | -100.27293 | alta | Norte-Oriente (Carretera Laredo) | 66052 | 188 | Bajo | Colonias 2020 (CONAPO) |
| Arboledas de Escobedo | 25.81397 | -100.26679 | alta | Norte-Oriente (Carretera Laredo) | 66050 | 3062 | Muy bajo | Colonias 2020 (CONAPO) |
| Balcones del Norte | 25.80920 | -100.26334 | alta | Oriente | 66050, 66613 | 4061 | Bajo, Muy bajo | Colonias 2020 (CONAPO) |
| Agropecuaria Emiliano Zapata (Col. Nueva Esperanza, oriente) | 25.81521 | -100.28549 | alta | Norte-Oriente (Carretera Colombia) | 66050 | 5397 | Medio | Colonias 2020 (CONAPO) |
| Raúl Caballero (Unión de Agrop. Lázaro Cárdenas) | 25.81527 | -100.30003 | alta | Norte (Carretera Colombia) | 66050 | 2202 | Muy bajo | Colonias 2020 (CONAPO) |
| U de A y S Andrés Caballero Moreno | 25.83791 | -100.30036 | alta | Norte (Carretera Colombia) | 66050 | 931 | Alto | Colonias 2020 (CONAPO) |
| Unión de Colonos Benito Juárez | 25.82013 | -100.33885 | alta | Centro-Norte (entre Las Torres y Libramiento) | 66050 | 8105 | Bajo | Colonias 2020 (CONAPO) |
| Pedregal del Topo Chico | 25.80019 | -100.36216 | alta | Poniente | 66061 | 10949 | Alto, Medio | Colonias 2020 (CONAPO) |
| Nuevo Escobedo | 25.79904 | -100.37785 | alta | Poniente | 66063, 66064 | 4900 | Medio, Muy alto | Colonias 2020 (CONAPO) |
| Fomerrey 35 (Tierra Propia) — Polígono de área ~0 y CP 64229 en la capa: centroide aproximado. | 25.79487 | -100.37858 | media | Poniente | 64229 | 7184 | Medio | Colonias 2020 (CONAPO) |
| Fomerrey 36 | 25.77534 | -100.33035 | alta | Sur-Poniente | 66075 | 4169 | Medio | Colonias 2020 (CONAPO) |
| Fomerrey 9 (Solidaridad Social) | 25.78462 | -100.32839 | alta | Sur-Poniente | 66073 | 4292 | Medio | Colonias 2020 (CONAPO) |
| Fomerrey 129 (Mirador San Nicolás) — Polígono de área ~0 en la capa. | 25.76420 | -100.31965 | media | Sur (límite San Nicolás) | 66079 | 3591 | Medio | Colonias 2020 (CONAPO) |
| CROC — Polígono de área ~0 (CP 64200) en la capa. | 25.79353 | -100.37377 | media | Poniente | 64200 | 16320 | Medio | Colonias 2020 (CONAPO) |
| Colinas / Laderas del Topo Chico | 25.79655 | -100.37265 | alta | Poniente | 66065 | 3538 | Alto, Medio | Colonias 2020 (CONAPO) |
| Serranías | 25.80166 | -100.36759 | alta | Poniente | 66061 | 2728 | Medio | Colonias 2020 (CONAPO) |
| Gloria Mendiola | 25.80909 | -100.37881 | alta | Poniente | 66050 | 3344 | Alto | Colonias 2020 (CONAPO) |
| San Martín (Rancho) / Jardines de San Martín | 25.80716 | -100.37024 | alta | Poniente | 66050, 66061 | 1855 | Medio, Muy alto | Colonias 2020 (CONAPO) |
| Eulalio Villarreal / Santa Lucía / San Isidro Labrador | 25.80264 | -100.37133 | alta | Poniente | 66050, 66063 | 5423 | Alto, Medio | Colonias 2020 (CONAPO) |
| Santa Martha / Nueva Esperanza (poniente) / La Concordia | 25.80046 | -100.39049 | alta | Poniente | 66050 | 13367 | Bajo, Medio | Colonias 2020 (CONAPO) |
| Valle de San Francisco | 25.80686 | -100.39501 | alta | Poniente | 66050 | 4971 | Bajo | Colonias 2020 (CONAPO) |
| Ciudad San Marcos / San Marcos III-IV | 25.80201 | -100.40839 | alta | Poniente (límite García) | 66050, 66058, 66064 | 7443 | Bajo | Colonias 2020 (CONAPO) |
| La Unidad | 25.79502 | -100.41559 | alta | Poniente (límite García) | 66050 | 9683 | Medio | Colonias 2020 (CONAPO) |
| Portal del Fraile | 25.79936 | -100.41193 | alta | Poniente (límite García) | 66050 | 2745 | Bajo | Colonias 2020 (CONAPO) |
| Villa de San Martín | 25.79367 | -100.41918 | media | Poniente (límite García) | 66000, 66050 | 2695 | Bajo | Colonias 2020 (CONAPO) |
| Rivera de los Naranjos / Riveras del Río (Río Pesquería poniente) — Posible equivalente a "Riberas" solicitado; "Riveras del Río" tiene área ~0 en la capa. | 25.79315 | -100.39412 | media | Poniente (límite García) | 64000, 66050 | 10981 | Medio | Colonias 2020 (CONAPO) |
| Privadas de Camino Real (I) | 25.80844 | -100.39113 | alta | Poniente (Libramiento) | 66050 | 1694 | Bajo | Colonias 2020 (CONAPO) |
| Praderas de San Francisco | 25.81936 | -100.41209 | alta | Norponiente (Libramiento/Periférico) | 66085 | 15426 | Bajo | Colonias 2020 (CONAPO) |
| Villas de San Francisco (1er y 2do sector) | 25.83474 | -100.36710 | alta | Norte (entre Libramiento y Periférico) | 66050 | 15607 | Medio | Colonias 2020 (CONAPO) |
| San Miguel Residencial | 25.83535 | -100.37171 | alta | Norte (Periférico) | 66050 | 12393 | Medio | Colonias 2020 (CONAPO) |
| Alianza Real (Nuevo León Estado de Progreso) | 25.84634 | -100.39161 | alta | Norponiente (Distrito Norponiente / La Alianza) | 66050, 66084 | 29330 | Medio | Colonias 2020 (CONAPO) |
| Laderas de San Miguel | 25.84403 | -100.40599 | alta | Norponiente | 66084 | 6206 | Bajo | Colonias 2020 (CONAPO) |
| Hacienda San Miguel, Sector Palmiras | 25.84323 | -100.42538 | alta | Norponiente | 66050 | 2810 | Medio | Colonias 2020 (CONAPO) |
| Portal de San Francisco (3 sectores) | 25.84196 | -100.41099 | alta | Norponiente | 66084 | 2469 | Bajo, Medio | Colonias 2020 (CONAPO) |
| Privadas de Camino Real II | 25.84150 | -100.40057 | alta | Norponiente | 66084 | 5681 | Medio | Colonias 2020 (CONAPO) |
| Hacienda La Providencia | 25.84207 | -100.37680 | alta | Norte | 66062 | 2151 | Bajo | Colonias 2020 (CONAPO) |
| Puerta del Sol (Alianza) | 25.84482 | -100.40355 | alta | Norponiente | 66084 | 1749 | Medio | Colonias 2020 (CONAPO) |
| Privadas Querétaro | 25.85054 | -100.38665 | media | Norponiente | 66084 | 381 | Medio | Colonias 2020 (CONAPO) |
| Paso de Cucharas (Progreso) | 25.81366 | -100.35680 | alta | Centro-Norte | 66050 | 611 | Alto | Colonias 2020 (CONAPO) |
| Localidad INEGI: Palmiras (4,076 hab.) | 25.84444 | -100.42403 | alta |  |  |  |  | INEGI localidades |
| Localidad INEGI: Praderas de San Francisco (17,284 hab.) | 25.81854 | -100.40247 | alta |  |  |  |  | INEGI localidades |

- **"Joyas de Anáhuac" ≠ "Jolla de Anáhuac"**:
  - El Costco nuevo está en "Avenida Sendero Divisorio 751, colonia Joyas de Anáhuac, CP 66054" — [Players of Life](https://playersoflife.com/monterrey/como-llegar-al-nuevo-costco-escobedo-direccion-y-rutas-desde-monterrey/).
  - En la capa de colonias, el CP 66054 corresponde a Hacienda El Canadá, Puerta del Norte, La Encomienda (algunos sectores) y Privadas del Ángel, al oriente del eje Carretera Laredo/Colombia — [Raul-QU](https://github.com/Raul-QU/Marginacion_colonias_Monterrey).
  - La calle "De las Joyas" de INEGI está en 25.7766, -100.2794 — [INEGI RNC](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023).
  - En cambio, "Jolla de Anáhuac" (sectores Florencia, Nápoles y Venecia, CP 66050) está ~3 km al poniente, en 25.777, -100.313 — [Raul-QU](https://github.com/Raul-QU/Marginacion_colonias_Monterrey).
- Nombres pedidos que no aparecen en Escobedo:
  - "Paseo de Cumbres": INEGI RNC solo tiene una calle "Paseo de las Cumbres" en Escobedo (25.8001, -100.3213). Las avenidas "Cumbres Élite", "Cumbres del Sol" y "Real Cumbres" están en Monterrey.
  - "Santa Elena": la "Av. Santa Elena" está en García (25.781, -100.485). En Escobedo solo hay una calle "Hacienda de Santa Elena" (25.7867, -100.3308).
  — [INEGI RNC 2023](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023)
- La búsqueda de códigos postales tampoco encontró "Valle de Santa Elena", "Paseo de Cumbres", "Riberas de Escobedo" ni "Arcos de Escobedo" en Escobedo. Sí aparecen Valle de Escobedo (CP 66053), Riberas de Girasoles (CP 66056) y Paseo Real (CP 66072) — [micodigopostal 66053](https://www.micodigopostal.org/codigo-postal/66053/), [66056](https://micodigopostal.org/codigo-postal/66056/), [66072](https://www.micodigopostal.org/codigo-postal/66072/)
- Advertencias sobre la capa de colonias:
  - Unos 10 polígonos tienen área ~0 ha y CP de otros municipios (CROC, Fomerrey 35, Fomerrey 129, Riveras del Río, Balcones de Anáhuac con CP 66422, Valle de las Palmas). Sus centroides son aproximados y van con confianza "media".
  - La suma de POBTOT es 522,614, mayor que los 481,213 habitantes del censo, así que hay doble conteo en esos polígonos.
  — [Raul-QU](https://github.com/Raul-QU/Marginacion_colonias_Monterrey); [INEGI](https://github.com/MacWilliXD/INEGI-geojson)

### Inferences
- Los posibles equivalentes de "Riberas" son "Rivera de los Naranjos", "Riveras del Río", "Rivera de los Girasoles" y "Balcones del Río". Están en la ribera del Río Pesquería, al poniente (25.79–25.80, -100.39/-100.40).
- La capa de 2020 **no incluye fraccionamientos posteriores a 2020**. Para esos, la posición más probable es la reserva sin urbanizar entre el Libramiento y el Periférico, o el norponiente (zona de La Alianza).
- En la cartografía de plusvalía, el **polígono de colonia** es mejor unidad de zona que el punto. El GeoJSON de colonias permite colorear cada polígono según precio por m².

### Gaps
- No pude verificar coordenadas de "Paseo de Cumbres", "Arcos de Escobedo", "Riberas de Escobedo" ni "Valle de Santa Elena". Lo más probable es que sean nombres comerciales, desarrollos posteriores a 2020 o que estén fuera de Escobedo (Valle de Santa Elena podría estar en García o General Zuazua).
- No pude consultar Google Maps ni portales inmobiliarios (bloqueados) para ubicar privadas nuevas de 2021 a 2026.

## 3. Zonas industriales y comerciales

### Takeaway
La industria **consolidada** está en la mancha urbana:
- **Parque Industrial Escobedo**, sobre la Av. De las Industrias (25.805, -100.351).
- **Nexxus XXI** (25.769, -100.308) y **Nexxus CPA** (25.782, -100.283), en el sur.
- Un parque "Del Norte" en el oriente (25.826, -100.266).
- La **planta Navistar** en el norte (25.845, -100.324).

La industria **nueva** (Areya, VYNMSA, FINSA) está sobre el **Libramiento Noroeste** (que la prensa llama "Libramiento Noreste") y el **Anillo Periférico**, entre las latitudes 25.81 y 25.84. El polo comercial emergente es el **nodo Sendero**: Metro Sendero, Costco Sendero y el proyecto Canadá City Center.

### Cited Findings
| Nombre | Tipo | Lat | Lng | Conf. | Municipio (polígono INEGI) | Fuente / nota |
|---|---|---|---|---|---|---|
| Parque Industrial Escobedo (Escobedo I y II, Av. De las Industrias) | industrial | 25.80504 | -100.35083 | alta | General Escobedo | Colonias 2020 (CONAPO). Clasificado "Parque industrial" por CONAPO; calles Industria del Latón/Cobre/Aluminio/Vidrio en INEGI RNC confirman. |
| Parque Industrial Nexxus XXI | industrial | 25.76910 | -100.30754 | alta | General Escobedo | Colonias 2020 (CONAPO) |
| Parque Industrial Nexxus CPA | industrial | 25.78178 | -100.28298 | alta | General Escobedo | Colonias 2020 (CONAPO) |
| Parque industrial "Del Norte" (CONAPO) | industrial | 25.82559 | -100.26580 | alta | General Escobedo | Colonias 2020 (CONAPO). Nombre en capa: "Del Norte", clase Parque industrial, CP 66615. |
| Planta Navistar Escobedo (localidad INEGI "Navistar") | industrial | 25.84503 | -100.32398 | media | General Escobedo | INEGI localidades. Localidad INEGI 190210158 "Navistar" (0 hab.). Planta de ensamble con >110 ha según Navistar/medios. |
| Stiva Jaral Industrial Park (aprox., Av. El Jaral / Carretera a Monclova) | industrial | 25.85134 | -100.31938 | baja | El Carmen (277 m fuera) | Ubicación de "Avenida El Jaral" en INEGI RNC 2023 |
| Canadá City Center (proyecto; Av. Sendero entre Carretera Colombia y Nueva Escocia) | comercial | 25.76900 | -100.29600 | media | General Escobedo | Ubicación descrita por Posta/Publimetro (Av. Sendero entre Carretera Colombia y Nueva Escocia). Proyecto de centro comercial (~70% de avance en ene-2026 según Publimetro). |
| Costco Sendero Escobedo (Av. Sendero Divisorio 751, Joyas de Anáhuac, CP 66054) | comercial | 25.76800 | -100.29050 | baja | General Escobedo | Domicilio según Players of Life (may-2026). Posición estimada ±300 m. |
| Plaza Sendero Escobedo (aprox., corredor Av. Sendero junto a Metro Sendero) | comercial | 25.77000 | -100.29150 | baja | General Escobedo | Wikipedia (lista de Plaza Sendero) confirma sucursal en Escobedo. Posición estimada ±500 m; verificar. |
| AREYA Escobedo Industrial Park (acceso: Libramiento × Camino a Santa Engracia) | industrial | 25.81059 | -100.39100 | media | General Escobedo | INEGI RNC (cruce calculado). Parque de ~65 ha; el punto es el acceso/cruce, no el centroide del predio. "Libramiento Noreste" en prensa = "Libramiento Noroeste de Monterrey" (código 40) en INEGI. |
| Smart Park FINSA Escobedo (aprox.: Anillo Periférico × Carretera a Monclova) | industrial | 25.83352 | -100.30963 | baja | General Escobedo | Dirección "Anillo Periférico, lotes 031 y 206" (FINSA/Mexico Industry). Ubicación sobre el Periférico no verificada con mapa; ±1–2 km. |
| VYNMSA Escobedo Park II (aprox.: Anillo Periférico 200, CP 66083) | industrial | 25.82895 | -100.32875 | baja | General Escobedo | Domicilio "Anillo Periférico 200, C.P. 66083" (listado citado en notas de mercado industrial). VYNMSA/ProMéxico también da "Libramiento Norte 3707 Km 28+500" para Park II: direcciones en conflicto. ±2 km. |
| VYNMSA Escobedo Park I (aprox.: "Lib. Noreste 4001", CP 66053) | industrial | 25.82196 | -100.31934 | baja | General Escobedo | Domicilio "Lib. Noreste 4001, Cd. General Escobedo, 66053" (ProMéxico Industry vía búsqueda). ±2 km; el CP 66053 cubre ~4 km del Libramiento. |

- La capa de colonias clasifica como "Parque industrial" a Escobedo I, Escobedo II, Nexxus XXI, Nexxus CPA y "Del Norte". Las calles Industria del Latón, del Cobre, del Aluminio, del Vidrio y Eléctrica, junto con la Av. Parque Industrial (INEGI), confirman el Parque Industrial Escobedo entre 25.795 y 25.81 N y -100.346 y -100.354 O — [Raul-QU](https://github.com/Raul-QU/Marginacion_colonias_Monterrey); [INEGI RNC](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023)
- INEGI registra una localidad "Navistar" (190210158, 0 habitantes) en 25.8450, -100.3240 — [INEGI AGLOC](https://github.com/MacWilliXD/INEGI-geojson). La planta de ensamble de Navistar en Escobedo cumplió 25 años — [Navistar](https://news.navistar.com/25-Year-Anniversary-of-Escobedo-Assembly-Plant)
- Fuentes sobre los parques nuevos:
  - VYNMSA Escobedo Park está "en el Libramiento, a ~30 km del aeropuerto de Monterrey" — [VYNMSA](https://vynmsa.com/en/industrial-parks/nuevo-leon/escobedo/vynmsa-escobedo-park)
  - Park I y Park II tienen fichas en ProMéxico Industry — [Park I](https://www.promexicoindustry.com/parks/en/mexico/nuevo-leon/escobedo/vynmsa-escobedo-park-i-1), [Park II](https://www.promexicoindustry.com/parks/en/mexico/nuevo-leon/escobedo/vynmsa-escobedo-park-ii-1)
  - Smart Park FINSA Escobedo: "Anillo Periférico, lotes 031 y 206" — [FINSA](https://www.finsa.net/en/blog/Smart-Park-FINSA-Escobedo-Clave-para-la-logistica-y-manufactura-en-Nuevo-Leon); [Mexico Industry](https://mexicoindustry.com/noticia/smart-park-finsa-escobedo-clave-para-la-logistica-y-manufactura-en-nuevo-leon)
  - Areya Escobedo: "intersección Libramiento Noreste y Camino Real" — [Mexico Business News](https://mexicobusiness.news/trade-and-investment/news/areya-escobedo-industrial-park-joins-forces-mercado-libre)
  - Stiva Jaral Industrial Park: sobre la carretera a Monclova, 88 ha — [ProMéxico Industry](https://www.promexicoindustry.com/parks/en/mexico/nuevo-leon/escobedo/stiva-jaral-industrial-park-1)
  - Pocket Park Libramiento de GP Desarrollos — [Mexico Industry](https://mexicoindustry.com/noticia/gp-desarrollos-inicio-la-construccion-de-pocket-park-libramiento)
- Kalos es desarrollador de parques en **Apodaca**, no en Escobedo — [Posta](https://www.posta.com.mx/nuevo-leon/estos-son-los-parques-industriales-sustentables-de-nl-segun-la-ia/vl2019194). No encontré ningún "Prologis Park Escobedo"; los resultados de Prologis son de Apodaca y de La Silla — [Prologis](https://prologis.com/industrial-properties/building/mon01004-periferico-building-4)
- Según Posta, Escobedo tiene 11 parques industriales y es segundo en el estado después de Apodaca — [Posta](https://www.posta.com.mx/nuevoleon/nearshoring-convierte-a-escobedo-y-cienega-de-flores-en-polos-de-crecimiento/vl1751283). Las notas paralelas de mercado industrial citan 23 parques registrados en Invest Nuevo León (cifra no verificada aquí).
- Nodo comercial Sendero:
  - Costco Sendero Escobedo: abrió en mayo de 2026 en Av. Sendero Divisorio 751, Joyas de Anáhuac, CP 66054 — [Players of Life](https://playersoflife.com/monterrey/como-llegar-al-nuevo-costco-escobedo-direccion-y-rutas-desde-monterrey/); [Tus Buenas Noticias](https://www.tusbuenasnoticias.com/amp/noticias/mexico/2026/05/14/60053-ya-abrio-el-costco-mas-grande-de-latinoamerica-asi-es-la-nueva-sucursal-de-nuevo-leon)
  - Canadá City Center: proyecto sobre la Av. Sendero entre Carretera a Colombia y Nueva Escocia, a metros de la Línea 2, con ~70% de avance en enero de 2026 — [Posta](https://www.posta.com.mx/nuevoleon/centro-comercial-mas-grande-de-latinoamerica-estara-en-nuevo-leon-y-tendra-un-lago/v-vl1753228); [Publimetro](https://www.publimetro.com.mx/nuevo-leon/2026/01/26/centro-comercial-mas-grande-de-latinoamerica-ubicado-en-escobedo-lleva-un-avance-del-70/); [Players of Life](https://playersoflife.com/branded-content/conoce-los-avances-en-la-construccion-de-el-canada-city-center/)
  - La calle Nueva Escocia está, según INEGI, entre 25.7673 y 25.7726 N y -100.2986 y -100.2926 O — [INEGI RNC](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023)
  - La lista de Wikipedia de Plaza Sendero confirma una sucursal en General Escobedo, sin domicilio — [Wikipedia](https://en.wikipedia.org/wiki/Plaza_Sendero)
- **Discrepancia con las notas paralelas** (`mercado_industrial_nearshoring.md`), que dan coordenadas redondeadas a 2 decimales:
  - Areya en "~25.86, -100.30" y VYNMSA I en "~25.86, -100.33" quedan **fuera** del polígono de Escobedo (el límite norte en esas longitudes está en ~25.847–25.849) y lejos del Libramiento, que en INEGI pasa por 25.81–25.83.
  - FINSA en "~25.83, -100.37" está a ~6 km del cruce Periférico × Carretera a Monclova que esas mismas notas usan como referencia. Ese cruce, calculado con INEGI, está en 25.8335, -100.3096.
  - **Recomiendo usar los valores de esta nota.** — [INEGI RNC](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023); [INEGI MG](https://github.com/MacWilliXD/INEGI-geojson)

### Inferences
- El Areya calculado (cruce de la calle Santa Engracia con el Libramiento, 25.8106, -100.3910) concuerda con "Camino Real". La calle Camino Real (INEGI) y Privadas de Camino Real (25.808, -100.391) están en el mismo punto. Por eso le doy confianza "media".
- La industria nueva (franja del Libramiento y el Periférico) queda **al norte** de la mancha residencial consolidada. Esto puede presionar la plusvalía de la vivienda obrera del poniente y el norponiente (Praderas y Villas de San Francisco, Alianza Real, San Miguel).

### Gaps
- No tengo coordenadas verificadas en mapa para VYNMSA I y II, FINSA, Pocket Park Libramiento, Grand Park Escobedo ni Centro Logístico Escobedo. Las posiciones de VYNMSA y FINSA son estimaciones (CP × eje vial) con confianza baja. Además, las direcciones de VYNMSA II se contradicen: "Anillo Periférico 200" frente a "Libramiento Norte 3707 Km 28+500".
- No pude verificar el domicilio de Plaza Sendero Escobedo. El punto es aproximado (±500 m) y lo dejé junto al Metro Sendero.

## 4. Infraestructura clave: Metro, vialidades, río, aeropuerto y Topo Chico

### Takeaway
- **Metro Sendero**, terminal norte de la Línea 2 (25.76881, -100.29287), es la **única estación de Metrorrey dentro de Escobedo**. Santiago Tapia está ~0.8 km al sur del límite, en San Nicolás. La Línea 1 (Talleres) termina en Monterrey, a ~2.6 km.
- Las vialidades troncales salen de INEGI RNC 2023 y se guardaron como polilíneas: Carretera a Laredo (Fed. 85), Carretera a Colombia (NL-1), Libramiento Noroeste, Anillo Periférico (de cuota), Carretera a Monclova (Fed. 53), Av. Sendero, Av. Raúl Salinas Lozano, Av. Las Torres, Av. Concordia y otras.
- El **Aeropuerto del Norte no está en Escobedo**: según el polígono INEGI cae en General Zuazua, ~4 km al noreste del límite.
- La **cima del Topo Chico** queda ~180 m fuera del límite, en Monterrey.

### Cited Findings
| Nombre | Tipo | Lat | Lng | Conf. | Municipio (polígono INEGI) | Fuente |
|---|---|---|---|---|---|---|
| Centro de Escobedo / Palacio Municipal (punto INEGI de la cabecera) | landmark | 25.80799 | -100.32264 | media | General Escobedo | INEGI localidades — INEGI ubica la localidad 190210001 (Cd. General Escobedo, 454,967 hab.) en este punto, normalmente la plaza principal/palacio. Domicilio exacto del Palacio no verificado; el Registro Civil de la cabecera está en Benito Juárez 110, CP 66050. |
| Metro Sendero / nodo Sendero–Carretera a Colombia–Carretera a Laredo | infraestructura | 25.76881 | -100.29287 | alta | General Escobedo | OSM (nodo) — Terminal norte de Línea 2. |
| Metro Santiago Tapia (Línea 2) | infraestructura | 25.75937 | -100.29565 | alta | San Nicolás de los Garza (813 m fuera) | OSM (nodo) |
| Metro San Nicolás (Línea 2) | infraestructura | 25.75267 | -100.29804 | alta | San Nicolás de los Garza (1476 m fuera) | OSM (nodo) |
| Metro Anáhuac (Línea 2) | infraestructura | 25.73985 | -100.30263 | alta | San Nicolás de los Garza (2743 m fuera) | OSM (nodo) |
| Metro Universidad (Línea 2) | infraestructura | 25.72438 | -100.30821 | alta | San Nicolás de los Garza (4285 m fuera) | OSM (nodo) |
| Metro Talleres (Línea 1 (terminal norte)) | infraestructura | 25.75922 | -100.36844 | alta | Monterrey (2623 m fuera) | OSM (nodo) |
| Metro San Bernabé (Línea 1) | infraestructura | 25.74841 | -100.36168 | alta | Monterrey (2655 m fuera) | OSM (nodo) |
| Cerro del Topo Chico (cima) | landmark | 25.77333 | -100.34972 | media | Monterrey (181 m fuera) | Wikipedia (en) / DBpedia: 25°46′24″N 100°20′59″W, 1,178 m — Mountain-forecast redondea a 25.77,-100.35. |
| Aeropuerto Internacional del Norte (NTR/MMAN) | infraestructura | 25.86556 | -100.23806 | media | General Zuazua (3998 m fuera) | Wikipedia (en, vía espejo): 25°51′56″N 100°14′17″W — Fuera del polígono INEGI de Escobedo (en Apodaca), al oriente de Carretera a Laredo. |
| Localidad INEGI: San Miguel de los Garza (397 hab.) | landmark | 25.83041 | -100.41551 | alta | General Escobedo | INEGI localidades |
| Localidad INEGI: Unión Agropecuarios Lázaro Cárdenas del Norte (1,397 hab.) | landmark | 25.83222 | -100.38437 | alta | General Escobedo | INEGI localidades |
| Localidad INEGI: Monclova Primer Sector (1,682 hab.) | landmark | 25.81449 | -100.40207 | alta | General Escobedo | INEGI localidades |
| Localidad INEGI: Monclova Segundo Sector (1,226 hab.) | landmark | 25.81559 | -100.39644 | alta | General Escobedo | INEGI localidades |
| Localidad INEGI: Unión de Colonos Santana (91 hab.) | landmark | 25.83794 | -100.42437 | alta | General Escobedo | INEGI localidades |
| Cruce Libramiento Noroeste × Carretera a Colombia | infraestructura | 25.82561 | -100.29566 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Anillo Periférico × Carretera a Colombia | infraestructura | 25.83446 | -100.29550 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Libramiento Noroeste × Av. Raúl Salinas Lozano | infraestructura | 25.81762 | -100.34748 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Entronque Carretera a Laredo × Carretera a Monclova | infraestructura | 25.80291 | -100.27618 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Anillo Periférico × Carretera a Monclova | infraestructura | 25.83352 | -100.30963 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Anillo Periférico × Libramiento Norte (poniente) | infraestructura | 25.81765 | -100.39601 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Av. Sendero × Av. Raúl Salinas Lozano | infraestructura | 25.76478 | -100.31545 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Av. Sendero × Av. Manuel L. Barragán | infraestructura | 25.76600 | -100.30548 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Av. Las Torres × Av. Raúl Caballero Escamilla | infraestructura | 25.79268 | -100.32299 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Av. Las Torres × Av. Raúl Salinas Lozano | infraestructura | 25.80609 | -100.34204 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Av. La Concordia × Carretera a Colombia | infraestructura | 25.78655 | -100.29273 | alta | General Escobedo | INEGI RNC (cruce calculado) |
| Cruce Av. Benito Juárez × Carretera a Colombia | infraestructura | 25.78154 | -100.29233 | alta | General Escobedo | INEGI RNC (cruce calculado) |

#### Ejes viales (escobedo_vialidades.geojson)
| Eje | Tipo | Km en Escobedo (±80 m del límite) | Km del trazo | Vértices | Extremo A (lat, lng) | Extremo B (lat, lng) | Conf. |
|---|---|---|---|---|---|---|---|
| Carretera a Laredo (Fed. 85) | carretera | 6.4 | 8.7 | 3 (1 parte/s) | 25.8405, -100.2512 | 25.7676, -100.2920 | alta |
| Av. Universidad (San Nicolás, hasta Metro Sendero) | avenida | 0.1 | 2.3 | 3 (1 parte/s) | 25.7676, -100.2917 | 25.7472, -100.2999 | alta |
| Carretera a Colombia (NL-1) | carretera | 8.6 | 10.6 | 6 (1 parte/s) | 25.8682, -100.2900 | 25.7673, -100.2931 | alta |
| Libramiento Noroeste | carretera | 16.8 | 21.3 | 8 (1 parte/s) | 25.7805, -100.4480 | 25.8312, -100.2534 | alta |
| Anillo Periférico del AMM | carretera | 16.9 | 21.7 | 11 (1 parte/s) | 25.8003, -100.4523 | 25.8417, -100.2505 | alta |
| Libramiento Norte (Km 21+500 - Pedreras San Miguel) | carretera | 10.2 | 12.1 | 15 (1 parte/s) | 25.8113, -100.3915 | 25.8722, -100.4631 | alta |
| Carretera a Monclova (Fed. 53) | carretera | 6.8 | 8.5 | 3 (1 parte/s) | 25.8634, -100.3306 | 25.8028, -100.2760 | alta |
| Av. Sendero (Sendero Norte / "Sendero Divisorio") | avenida | 5.9 | 6.3 | 5 (1 parte/s) | 25.7639, -100.3225 | 25.7708, -100.2625 | alta |
| Av. Lic. Raúl Salinas Lozano | avenida | 7.1 | 7.1 | 8 (1 parte/s) | 25.7645, -100.3154 | 25.8178, -100.3476 | alta |
| Av. Las Torres | avenida | 7.7 | 7.7 | 9 (3 parte/s) | 25.8035, -100.3852 | 25.8060, -100.3422 | alta |
| Av. La Concordia | avenida | 3.7 | 7.1 | 13 (1 parte/s) | 25.7843, -100.2589 | 25.7889, -100.3005 | alta |
| Av. Benito Juárez | avenida | 4.7 | 4.7 | 4 (1 parte/s) | 25.7807, -100.2855 | 25.8068, -100.3198 | alta |
| Av. República Mexicana | avenida | 2.8 | 4.6 | 10 (2 parte/s) | 25.7848, -100.2733 | 25.7530, -100.2778 | alta |
| Av. Raúl Caballero Escamilla | avenida | 5.1 | 5.1 | 8 (3 parte/s) | 25.7910, -100.3229 | 25.8097, -100.3227 | alta |
| Av. Acueducto | avenida | 3.4 | 3.4 | 4 (1 parte/s) | 25.7934, -100.3359 | 25.7642, -100.3226 | alta |
| Av. De las Industrias | avenida | 3.8 | 3.8 | 8 (1 parte/s) | 25.8070, -100.3495 | 25.7840, -100.3407 | alta |
| Av. Manuel L. Barragán | avenida | 2.1 | 4.7 | 14 (1 parte/s) | 25.7475, -100.3106 | 25.7853, -100.3030 | alta |
| Av. Paseo de la Amistad | avenida | 2.5 | 2.5 | 9 (1 parte/s) | 25.7890, -100.3185 | 25.8115, -100.3144 | alta |
| Av. Constitución (Alianza Real) | avenida | 2.9 | 3.2 | 2 (1 parte/s) | 25.8373, -100.4126 | 25.8535, -100.3859 | alta |
| Blvd. Camino Real | avenida | 1.4 | 1.4 | 8 (1 parte/s) | 25.7689, -100.2843 | 25.7761, -100.2816 | alta |
| Río Pesquería (trazo aproximado) | rio | 16.6 | 16.9 | 21 (1 parte/s) | 25.7920, -100.4175 | 25.8025, -100.2600 | baja |

Fuente de todos los ejes: [INEGI Red Nacional de Caminos 2023 vía CentroGeo/RedNacionalCaminos_2019_2023](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023). Son ejes de una sola calzada, simplificados a ~25 m. El km en Escobedo se midió sobre el eje con un margen de 80 m del límite, para no perder la Av. Sendero, que corre sobre él. El Río Pesquería es una aproximación propia (confianza baja).

- Sendero es la terminal norte de la Línea 2 y está en Escobedo — [Wikipedia: Sendero metro station](https://en.wikipedia.org/wiki/Sendero_metro_station). Las coordenadas de las estaciones son nodos OSM (por ejemplo, Sendero 25.7688063, -100.2928666) — [alvaropg5/proyecto_IA](https://github.com/alvaropg5/proyecto_IA)
- Aeropuerto del Norte (NTR/MMAN):
  - Wikipedia lo sitúa en 25°51′56″N 100°14′17″O y Helis en 25°51′56.16″N 100°14′13.2″O.
  - Las fuentes no coinciden en el municipio: Wikipedia lo ubica en Escobedo o Apodaca, y Uber en "Carretera a Nuevo Laredo Km 1006, Apodaca".
  - — [Wikipedia](https://en.wikipedia.org/wiki/Del_Norte_International_Airport); [Helis](https://www.helis.com/database/gps/MMAN); [Uber](https://www.uber.com/global/es/airports/ntr)
  - **Según el polígono INEGI 2025, ese punto cae en General Zuazua**, a ~4.0 km del límite de Escobedo (cálculo propio).
- Cerro del Topo Chico: 25°46′24″N 100°20′59″O (25.7733, -100.3497), 1,178 m — [Wikipedia](https://en.wikipedia.org/wiki/Cerro_del_Topo_Chico); [DBpedia](https://dbpedia.org/page/Cerro_del_Topo_Chico). Mountain-forecast da 25.77, -100.35 y 1,000 m — [mountain-forecast](https://mountain-forecast.com/peaks/Cerro-del-Topo-Chico). Según el polígono INEGI, la cima queda ~181 m dentro de Monterrey. Las colonias "del Topo Chico" de Escobedo (Pedregal, Colinas y Laderas) están 3–4 km al norte de la cima, por lo que el nombre es una referencia regional.
- Datos del INEGI RNC 2023 sobre las vías:
  - El Periférico tiene peaje ("Si") y es estatal.
  - El Libramiento Noroeste (código 40) es federal y libre.
  - La Carretera Monterrey–Nuevo Laredo es la federal 85.
  - "A Colombia" / "Monterrey–Colombia" es la estatal 1.
  - La Monterrey–Castaños (carretera a Monclova) es la federal 53 y entronca con la 85 en 25.8029, -100.2762.
  - El tramo de la Fed. 85 entre Metro Sendero y ~25.79 aparece como "Blvd. Lic. José López Portillo".
  - — [INEGI RNC 2023](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023)
- En el INEGI, **"Av. Lic. Raúl Salinas Lozano" es una avenida distinta de la Carretera a Laredo**. Sale de la Av. Sendero en 25.7645, -100.3154, sube al norte hasta ~25.79 (Av. Las Torres / Raúl Caballero) y gira al noroeste hasta el Libramiento en 25.8176, -100.3475. Está ~2.3 km al poniente del eje Laredo/Colombia — [INEGI RNC 2023](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023)
- Río Pesquería: INEGI tiene calles "Río Pesquería" y "Pesquería" en 25.800–25.806 N, entre -100.270 y -100.395. Hay colonias ribereñas: Los Ébanos (Río Pesquería) en 25.802, -100.285; Río Pesquería (Fernando Amilpa) en 25.797, -100.275; Balcones del Río en 25.805, -100.376; Riveras del Río en 25.796, -100.401 — [INEGI RNC](https://github.com/CentroGeo/RedNacionalCaminos_2019_2023); [Raul-QU](https://github.com/Raul-QU/Marginacion_colonias_Monterrey)

### Inferences
- **No existe una "Av. Raúl Salinas" que sea la Carretera a Laredo.** El brief los igualaba. Para el mapa conviene dibujarlas como dos ejes separados: el eje Laredo/Colombia (oriente) y Raúl Salinas Lozano (centro-poniente).
- Al norte de Metro Sendero el corredor se divide en dos. La **Carretera a Colombia (NL-1)** sigue recta al norte por ~-100.293. La **Carretera a Laredo (Fed. 85)** gira al noreste hacia Apodaca y el Aeropuerto del Norte y bordea el límite oriente de Escobedo.
- El Río Pesquería que dibujé es una aproximación (confianza baja). El tramo central, entre -100.37 y -100.30, está interpolado.

### Gaps
- No obtuve la geometría oficial del Río Pesquería (la hidrografía INEGI no estaba accesible).
- Algunos ejes salen en 2 o 3 partes por huecos en el RNC (Av. Las Torres, Raúl Caballero, República Mexicana).
- La "Av. Concordia" del INEGI va de 25.784 a 25.789 N, entre -100.256 y -100.300 (sector Anáhuac). No es la "Av. Concordia" de Apodaca y San Nicolás.
- La geometría vial es de 2023. No incluye obras de 2024 a 2026, como posibles ampliaciones del Periférico o del Libramiento.

## 5. Organización territorial: sectores y divisoria norte–sur

### Takeaway
No encontré una zonificación oficial por sectores numerados con límites publicados. Los instrumentos municipales hablan de **"Escobedo Norte"** como gran área de oportunidad (PDU 2021), del **Distrito Norponiente / sector La Alianza** (Plan Parcial, mayo de 2025) y de un **Distrito Industrial y de Logística** (Programa Parcial 2023). Con los datos espaciales, la división práctica es:
1. **Sur** (de la Av. Sendero al Río Pesquería): sector Anáhuac, El Canadá y Nexxus, de marginación muy baja.
2. **Centro y franja del río**: cabecera, Las Torres y el Parque Industrial.
3. **Poniente**: Pedregal del Topo Chico, Nuevo Escobedo, Fomerrey 35, San Marcos y La Unidad, de marginación media.
4. **Norte**, al norte del **Libramiento Noroeste** y el **Anillo Periférico**: Alianza Real, San Miguel, Praderas y Villas de San Francisco, y los nuevos parques industriales.

El **Libramiento Noroeste** (y en paralelo el Periférico) es la divisoria norte–sur más clara. El Río Pesquería separa el sur consolidado del centro-norte.

### Cited Findings
- El PDU del Centro de Población 2021 tiene un apartado "Escobedo Norte" que describe el norte del municipio como "una gran área de oportunidad en materia de desarrollo urbano" — [PDU Escobedo (escobedo.gob.mx)](https://escobedo.gob.mx/gob/docs/PDUV2.pdf)
- Plan Parcial del Distrito Norponiente (revisión de mayo de 2025), para ordenar el crecimiento del sector de La Alianza — [Plan Parcial Norponiente](https://escobedo.gob.mx/inmplan/20250516_PlanParcialdelDistritoNorponiente.pdf); [Posta](https://www.posta.com.mx/nuevoleon/escobedo-apuesta-por-un-crecimiento-ordenado-con-el-distrito-norponiente/v-vl1595576)
- Existe un Programa Parcial del Distrito Industrial y de Logística de Escobedo (PDI 2023) — [escobedo.gob.mx](https://escobedo.gob.mx/inmplan/PROGRAMA_PARCIAL_ESCOBEDO_PDI2023_V13.pdf)
- Población 2020 y grado de marginación por franja, a partir de los centroides de colonia de la capa 2020, cortados por el Libramiento, el Río Pesquería (aproximado) y las longitudes -100.355 y -100.300 (cálculo propio) — [Raul-QU](https://github.com/Raul-QU/Marginacion_colonias_Monterrey):

| Franja | Colonias | Pob. 2020 | % muy bajo + bajo | % medio | % alto + muy alto |
|---|---|---|---|---|---|
| Sur (Sendero → Río Pesquería), Centro (-100.355 a -100.300) | 111 | 177,461 | 93% | 7% | 0% |
| Sur, Oriente (> -100.300: Anáhuac, Canadá) | 71 | 58,730 | 91% | 9% | 0% |
| Sur, Poniente (< -100.355) | 22 | 52,847 | 3% | 89% | 8% |
| Centro-Norte (Río → Libramiento), Centro | 37 | 35,434 | 100% | 0% | 0% |
| Centro-Norte, Oriente | 12 | 23,508 | 37% | 63% | 0% |
| Centro-Norte, Poniente (Pedregal Topo Chico, Nuevo Escobedo) | 28 | 71,098 | 33% | 60% | 7% |
| Norte (al norte del Libramiento) | 21 | 103,536 | 32% | 68% | 1% |

### Inferences
- Para el mapa de plusvalía propongo 6 macrozonas:
  1. **Sur-Oriente / Anáhuac–Canadá–Sendero**: privadas de marginación muy baja junto a Metro Sendero, Costco y Canadá City Center. Es la zona de mayor plusvalía probable.
  2. **Sur-Centro / corredor Raúl Salinas–Manuel L. Barragán–Acueducto**: Nexxus, Jolla de Anáhuac, Colinas de Anáhuac, Girasoles.
  3. **Centro / cabecera y Las Torres**: Monte Real, Santa Luz, Mirasur, Paseo Real, Las Encinas.
  4. **Poniente popular**: Pedregal del Topo Chico, Nuevo Escobedo, Fomerrey 35, San Marcos, La Unidad, Gloria Mendiola.
  5. **Norponiente / La Alianza–San Miguel–Praderas de San Francisco**: vivienda económica de expansión.
  6. **Corredor industrial norte** (Libramiento–Periférico–Carretera a Monclova–Carretera a Colombia) y el **oriente/Laredo** (Nueva Castilla, Arboledas, Los Altos).
- La avenida que divide norte y sur en el habla local probablemente es el **Libramiento** ("de Libramiento para allá"). Es una inferencia geográfica, no una cita.

### Gaps
- No pude abrir los PDF municipales (PDU 2021, PMD 2024–2027, planes parciales) porque escobedo.gob.mx estaba bloqueado. No verifiqué si definen sectores o delegaciones con límites. Si existen, convendría reemplazar las macrozonas inferidas por las oficiales.
