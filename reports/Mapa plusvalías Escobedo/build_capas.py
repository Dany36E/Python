"""Construye capas.json para el mapa de plusvalías de Escobedo.

Asigna cada colonia (por su punto representativo) a una de las macrozonas del
reporte (1, 2a, 2b, 3, 4, 5, 6) con cortes geográficos (Libramiento Noroeste,
Río Pesquería aprox., meridianos -100.355 / -100.300) y ajustes por nombre y
grado de marginación. Añade el corredor industrial (zona 7) y los puntos.
"""
import json
import re
import sys
from pathlib import Path

from shapely.geometry import shape, mapping, Point, box
from shapely.ops import unary_union

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])


def load(name):
    return json.load(open(SRC / name, encoding="utf-8"))


def rnd(obj, nd=5):
    if isinstance(obj, float):
        return round(obj, nd)
    if isinstance(obj, (list, tuple)):
        return [rnd(x, nd) for x in obj]
    if isinstance(obj, dict):
        return {k: rnd(v, nd) for k, v in obj.items()}
    return obj


vial = load("escobedo_vialidades.geojson")["features"]
by_name = {f["properties"]["nombre"]: f for f in vial}
lib = shape(by_name["Libramiento Noroeste"]["geometry"])
peri = shape(by_name["Anillo Periférico del AMM"]["geometry"])
rio = shape(by_name["Río Pesquería (trazo aproximado)"]["geometry"])
laredo = shape(by_name["Carretera a Laredo (Fed. 85)"]["geometry"])
concordia = shape(by_name["Av. La Concordia"]["geometry"])
limite_g = shape(load("escobedo_limite_detallado.geojson")["features"][0]["geometry"])


def lat_on(line, lng):
    coords = sorted(line.coords)
    if lng <= coords[0][0]:
        return coords[0][1]
    if lng >= coords[-1][0]:
        return coords[-1][1]
    for (x0, y0), (x1, y1) in zip(coords, coords[1:]):
        if x0 <= lng <= x1:
            t = 0 if x1 == x0 else (lng - x0) / (x1 - x0)
            return y0 + t * (y1 - y0)
    return coords[-1][1]


RX_2B = re.compile(r"fomerrey|infonavit|provileon|san genaro|felipe carrillo|hacienda del topo|"
                   r"celestino gasca|balcones de anahuac|las lomas|lomas de aztlan|adelitas|"
                   r"20 de noviembre|campo de tiro|quinto centenario|santa julia", re.I)
RX_2A = re.compile(r"colinas de anahuac|jolla|nexxus|girasoles|villas de escobedo|aviana|"
                   r"residencial escobedo|topo grande", re.I)
RX_1 = re.compile(r"anahuac|canada|puerta de|palmas", re.I)


def zona(name, mg, lat, lng):
    if lat > lat_on(lib, lng):
        return "6" if lng <= -100.330 else "4"
    if lng <= -100.355:
        return "5"
    south_of_rio = lat <= lat_on(rio, lng)
    if lng > -100.300:
        if not south_of_rio:
            return "4"
        if lat > 25.7915 and not RX_1.search(name):
            return "4"
        return "1"
    if not south_of_rio:
        return "3"
    # Franja sur-centro: separar Centro (norte), 2a y 2b
    if lat > 25.7985 or (lat > 25.7915 and lng < -100.316):
        if not re.search(r"aviana", name, re.I):
            return "3"
    if RX_2A.search(name):
        return "2a"
    if RX_2B.search(name):
        return "2b"
    if mg in ("Bajo", "Medio", "Alto", "Muy alto") and lng < -100.318:
        return "2b"
    return "2a"


cols = load("escobedo_colonias_conapo2020.geojson")["features"]
out_cols, counts, pops, cents = [], {}, {}, {}
for f in cols:
    g = shape(f["geometry"])
    p = f["properties"]
    c = g.representative_point()
    pob = int(float(p["pob_2020"])) if p.get("pob_2020") not in (None, "") else 0
    z = zona(p["colonia"], p.get("grado_marginacion_2020"), c.y, c.x)
    counts[z] = counts.get(z, 0) + 1
    pops[z] = pops.get(z, 0) + pob
    cents[p["colonia"].lower()] = (round(c.y, 5), round(c.x, 5))
    g2 = g.simplify(0.00003, preserve_topology=True)
    out_cols.append({
        "type": "Feature",
        "properties": {"n": p["colonia"], "cp": p.get("cp"), "t": p.get("clasif"),
                       "pob": pob, "mg": p.get("grado_marginacion_2020"), "z": z},
        "geometry": rnd(mapping(g2)),
    })

# Corredor industrial (zona 7): franja de ~550 m a cada lado del Libramiento y del Periférico
band = unary_union([lib.buffer(0.0055), peri.buffer(0.0055)])
band = band.intersection(box(-100.400, 25.80, -100.262, 25.86)).intersection(limite_g)
band = band.simplify(0.0004, preserve_topology=True)

def cen(*names):
    pts = [cents[n.lower()] for n in names if n.lower() in cents]
    lat = sum(p[0] for p in pts) / len(pts)
    lng = sum(p[1] for p in pts) / len(pts)
    return round(lat, 5), round(lng, 5)

def inter(a, b):
    i = a.intersection(b)
    if i.is_empty:
        return None
    pt = i if i.geom_type == "Point" else list(i.geoms)[0]
    return round(pt.y, 5), round(pt.x, 5)

tri = inter(laredo, lib) or inter(laredo, peri)
lc = inter(laredo, concordia)
print("Triángulo Norte", tri, "Laredo×Concordia", lc)

extra = {
    "villas_sf": cen("Villas de San Francisco", "Villas de San Francisco 2Do Sector"),
    "praderas_sf": cen("Praderas de San Francisco"),
    "paso_cucharas": cen("Paso de Cucharas (Progreso)"),
    "potrerillos": cen("Monterreal (Infonavit)", "Los Girasoles 2Do Sector", "Privada Residencial Aviana"),
    "laderas_topo": cen("Laderas del Topo Chico"),
    "san_miguel": cen("Laderas de San Miguel", "Hacienda San Miguel, Sector Palmiras"),
    "nueva_castilla": cen("Nueva Castilla"),
    "triangulo": tri,
    "laredo_concordia": lc,
}
print(extra)

limite = load("escobedo_limite_detallado.geojson")["features"][0]
vecinos = load("municipios_vecinos.geojson")["features"]
roads = [{"type": "Feature",
          "properties": {"n": f["properties"]["nombre"], "t": f["properties"].get("tipo")},
          "geometry": rnd(f["geometry"])} for f in vial]

out = {
    "limite": rnd(limite["geometry"]),
    "vecinos": [{"n": f["properties"]["nombre"], "g": rnd(f["geometry"], 4),
                 "c": rnd(list(shape(f["geometry"]).intersection(box(-100.49, 25.745, -100.235, 25.905)).representative_point().coords[0])[::-1], 4)}
                for f in vecinos],
    "colonias": out_cols,
    "vialidades": roads,
    "corredor": rnd(mapping(band)),
}
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(counts, pops, len(out_cols), OUT.stat().st_size)
for z in sorted(counts):
    print(z, "|", "; ".join(f["properties"]["n"] for f in out_cols if f["properties"]["z"] == z)[:900])
