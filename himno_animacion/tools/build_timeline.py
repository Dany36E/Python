"""Arma la línea de tiempo de la animación y mezcla la pista de audio.

Lee guion.md (textos) y audio_jobs.json (archivos y duraciones), coloca cada
línea en su escena, detecta las frases dentro de cada audio (para sincronizar
eventos con palabras concretas), calcula la apertura de boca de los personajes
que hablan y escribe:

  anim/timeline.js   -> window.TIMELINE, lo consume la animación
  build/mezcla.wav   -> voces + música de fondo + efectos

Uso: python3 tools/build_timeline.py
"""
import json
import math
import pathlib
import re
import subprocess
import wave

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
FPS = 30
SR = 44100

# Escena -> líneas del guion que suenan en ella.
SCENES = [
    ("titulo", []),
    ("plaza", ["N01", "N02", "S01", "N03"]),
    ("estudio", ["N04", "N05", "N06"]),
    ("novios", ["N07", "L01", "N08"]),
    ("encierro", ["N09", "L02"]),
    ("noche", ["N10", "N11", "N12"]),
    ("puerta", ["N13", "F01", "N14", "N15"]),
    ("ganador", ["N16"]),
    ("nuno", ["N17", "N18", "N19"]),
    ("habana", ["N20"]),
    ("musica", ["N21", "N22"]),
    ("bandera", ["N23", "N24"]),
    ("final", ["N25", "N26", "N27"]),
]
TITLE_HOLD = 4.5      # segundos de la portada antes de la primera línea
LEAD_IN = 0.9         # silencio al entrar a una escena
GAP = 0.45            # silencio entre líneas de la misma escena
TAIL = 0.9            # silencio al final de una escena
END_HOLD = 4.0        # cierre después de la última línea
SPEAKERS = {"S": "santa_anna", "L": "lupita", "F": "francisco", "N": None}


def load_lines():
    text = (ROOT / "guion.md").read_text(encoding="utf-8")
    texts = {m.group(1): m.group(3) for m in re.finditer(r"^(\w\d\d) ([A-ZÁ ]+): (.+)$", text, re.M)}
    jobs = json.loads((ROOT / "audio_jobs.json").read_text(encoding="utf-8"))["lines"]
    return texts, {j["line"]: j for j in jobs}


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def trim_silence(x, thresh=0.01):
    """Quita el silencio del principio y del final (deja 40 ms de colchón)."""
    idx = np.flatnonzero(np.abs(x) > thresh)
    if not len(idx):
        return x
    pad = int(0.04 * SR)
    return x[max(0, idx[0] - pad): min(len(x), idx[-1] + pad)]


def envelope(x, rate):
    hop = SR // rate
    n = len(x) // hop
    frames = x[: n * hop].reshape(n, hop)
    return np.sqrt((frames ** 2).mean(axis=1))


def phrases(x):
    """Tramos de voz separados por pausas de al menos 0.17 s."""
    env = envelope(x, 100)
    if not len(env):
        return []
    on = env > max(env.max() * 0.07, 1e-4)
    segs, start, quiet = [], None, 0
    for i, v in enumerate(on):
        if v:
            if start is None:
                start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet >= 17:
                segs.append([start / 100, (i - quiet + 1) / 100])
                start, quiet = None, 0
    if start is not None:
        segs.append([start / 100, (len(on) - quiet) / 100])
    return [[round(a, 2), round(b, 2)] for a, b in segs if b - a > 0.08]


def mouth_track(x):
    """Apertura de boca 0..1 por cuadro, suavizada para que no tiemble."""
    env = envelope(x, FPS)
    if not len(env):
        return []
    env = env / (np.percentile(env, 95) + 1e-6)
    env = np.clip((env - 0.12) * 1.25, 0, 1)
    out, prev = [], 0.0
    for v in env:
        prev = prev + (v - prev) * (0.75 if v > prev else 0.45)
        out.append(round(float(prev), 2))
    return out


# ---------------------------------------------------------------- síntesis
def tone(freq, dur, decay=3.0, harmonics=((1, 1.0), (2, 0.35), (3, 0.12), (4.2, 0.05))):
    t = np.arange(int(dur * SR)) / SR
    wave_ = sum(a * np.sin(2 * math.pi * freq * h * t) for h, a in harmonics)
    attack = np.minimum(1, t / 0.006)
    return (wave_ * attack * np.exp(-decay * t)).astype(np.float32)


def noise(dur, seed):
    return np.random.default_rng(seed).standard_normal(int(dur * SR)).astype(np.float32)


def lowpass(x, alpha):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def sfx(kind, seed=0):
    if kind == "ding":
        return 0.5 * (tone(1568, 1.4, 3.5) + 0.6 * tone(2093, 1.4, 4.0))
    if kind == "brillo":
        notes = [1319, 1568, 2093, 2637]
        out = np.zeros(int(1.6 * SR), np.float32)
        for i, f in enumerate(notes):
            s = tone(f, 1.2, 4.5) * 0.35
            o = int(i * 0.09 * SR)
            out[o:o + len(s)] += s[: len(out) - o]
        return out
    if kind == "papel":
        n = noise(0.45, seed)
        env = np.sin(np.linspace(0, math.pi, len(n))) ** 2
        return 0.22 * (n - lowpass(n, 0.08)) * env
    if kind == "pergamino":
        n = noise(0.9, seed)
        env = np.sin(np.linspace(0, math.pi, len(n))) ** 1.5
        return 0.16 * (n - lowpass(n, 0.05)) * env
    if kind == "puerta":
        t = np.arange(int(0.5 * SR)) / SR
        thump = np.sin(2 * math.pi * 70 * t) * np.exp(-14 * t)
        return (0.7 * thump + 0.15 * lowpass(noise(0.5, seed), 0.05) * np.exp(-20 * t)).astype(np.float32)
    if kind == "llave":
        out = np.zeros(int(0.35 * SR), np.float32)
        for o in (0.0, 0.16):
            c = tone(3200, 0.08, 60, ((1, 1), (1.7, 0.6))) * 0.35
            s = int(o * SR)
            out[s:s + len(c)] += c
        return out
    if kind == "tictac":
        out = np.zeros(int(4.0 * SR), np.float32)
        for k in range(8):
            c = tone(2400 if k % 2 else 1900, 0.05, 80, ((1, 1), (2.3, 0.4))) * 0.18
            s = int(k * 0.5 * SR)
            out[s:s + len(c)] += c
        return out
    if kind == "barco":
        t = np.arange(int(1.8 * SR)) / SR
        env = np.minimum(1, t / 0.15) * np.minimum(1, (1.8 - t) / 0.4)
        return (0.25 * env * (np.sin(2 * math.pi * 116 * t) + 0.5 * np.sin(2 * math.pi * 174 * t)
                              + 0.25 * np.sin(2 * math.pi * 232 * t))).astype(np.float32)
    if kind == "fanfarria":
        out = np.zeros(int(2.4 * SR), np.float32)
        for i, f in enumerate([523, 659, 784, 1047]):
            s = tone(f, 1.8, 2.2, ((1, 1), (2, 0.5), (3, 0.3), (4, 0.15))) * 0.28
            o = int(i * 0.13 * SR)
            out[o:o + len(s)] += s[: len(out) - o]
        return out
    raise ValueError(kind)


def music_bed(total):
    """Caja musical suave en Fa mayor: arpegios de corcheas a 84 bpm."""
    beat = 60 / 84
    prog = [
        [349, 440, 523, 698], [466, 587, 698, 932], [523, 659, 784, 1047], [349, 440, 523, 698],
        [294, 349, 440, 587], [466, 587, 698, 932], [392, 523, 659, 784], [349, 440, 523, 698],
    ]
    pattern = [0, 1, 2, 3, 2, 1, 2, 1]
    out = np.zeros(int(total * SR) + SR * 3, np.float32)
    bar, t = 0, 0.0
    while t < total:
        chord = prog[bar % len(prog)]
        bass = tone(chord[0] / 2, 4 * beat, 1.2, ((1, 1), (2, 0.25))) * 0.16
        s = int(t * SR)
        out[s:s + len(bass)] += bass
        for k, p in enumerate(pattern):
            note = tone(chord[p] * 2, 1.4, 4.0) * (0.1 if k % 2 else 0.13)
            o = int((t + k * beat / 2) * SR)
            out[o:o + len(note)] += note
        t += 4 * beat
        bar += 1
    return out[: int(total * SR)]


# ---------------------------------------------------------------- armado
def main():
    texts, jobs = load_lines()
    audio, missing = {}, []
    for k, j in jobs.items():
        p = ROOT / j["file"]
        if p.exists():
            audio[k] = trim_silence(decode(p))
        else:
            missing.append(k)

    t = 0.0
    scenes, lines = [], []
    for name, ids in SCENES:
        start = t
        if not ids:
            t += TITLE_HOLD
        else:
            t += LEAD_IN
            for i, k in enumerate(ids):
                dur = len(audio[k]) / SR if k in audio else jobs[k]["duration_sec"]
                x = audio.get(k)
                entry = {
                    "id": k, "scene": name, "start": round(t, 3), "end": round(t + dur, 3),
                    "text": texts[k], "speaker": SPEAKERS[k[0]],
                    "phrases": phrases(x) if x is not None else [[0, round(dur, 2)]],
                }
                if SPEAKERS[k[0]]:
                    entry["mouth"] = mouth_track(x) if x is not None else []
                lines.append(entry)
                t += dur + (GAP if i < len(ids) - 1 else TAIL)
        scenes.append({"name": name, "start": round(start, 3), "end": round(t, 3)})
    scenes[-1]["end"] = round(t + END_HOLD, 3)
    total = scenes[-1]["end"]

    by_id = {l["id"]: l for l in lines}

    def at(line, phrase=0, offset=0.0, edge=0):
        l = by_id[line]
        n = len(l["phrases"])
        idx = phrase if phrase >= 0 else n + phrase
        ph = l["phrases"][min(max(idx, 0), n - 1)]
        return round(l["start"] + ph[edge] + offset, 3)

    cues = [
        ("ding", at("N02", 1, 1.7)),
        ("pergamino", at("N03", 1, 0.3)),
        ("ding", at("N08", 2, 0.2)),
        ("puerta", at("N09", 3, 0.9)),
        ("llave", at("N09", 3, 1.5)),
        ("tictac", at("N12", 1, 0.0)),
        ("brillo", at("N12", 3, 0.3)),
        ("papel", at("N14", 2, 0.0)),
        ("papel", at("N14", 3, 0.0)),
        ("papel", at("N14", 4, 0.0)),
        ("puerta", at("N15", 1, 1.4)),
        ("fanfarria", at("N16", 1, 2.0)),
        ("barco", at("N20", 1, 0.2)),
        ("fanfarria", at("N21", 3, 0.0)),
        ("brillo", at("N26", 0, 0.0)),
        ("fanfarria", at("N27", 1, 2.2)),
    ]

    timeline = {
        "fps": FPS, "duration": round(total, 3), "width": 1920, "height": 1080,
        "scenes": scenes, "lines": lines,
        "cues": [{"kind": k, "t": c} for k, c in cues],
        "missing_audio": missing,
    }
    js = "window.TIMELINE = " + json.dumps(timeline, ensure_ascii=False) + ";\n"
    (ROOT / "anim" / "timeline.js").write_text(js, encoding="utf-8")

    # ---- mezcla
    n = int(total * SR) + SR
    voice = np.zeros(n, np.float32)
    for l in lines:
        x = audio.get(l["id"])
        if x is None:
            continue
        s = int(l["start"] * SR)
        voice[s:s + len(x)] += x
    fx = np.zeros(n, np.float32)
    for i, (k, c) in enumerate(cues):
        s = sfx(k, seed=i)
        o = int(c * SR)
        fx[o:o + len(s)] += s[: max(0, n - o)]
    bed = np.zeros(n, np.float32)
    m = music_bed(total + 1)
    bed[: len(m)] = m[:n]
    # baja la música mientras alguien habla
    env = np.repeat(envelope(voice, 100), SR // 100)
    env = np.pad(env, (0, max(0, n - len(env))))[:n]
    speaking = np.convolve((env > 0.01).astype(np.float32), np.ones(SR // 4) / (SR // 4), mode="same")
    duck = 1.0 - 0.55 * np.clip(speaking * 1.5, 0, 1)
    fade = np.minimum(1, np.minimum(np.arange(n) / (1.5 * SR), (n - np.arange(n)) / (3 * SR)))
    mix = voice / (np.abs(voice).max() + 1e-6) * 0.85 + fx * 0.8 + bed * duck * fade * 0.55
    mix = np.clip(mix, -0.99, 0.99)
    out = ROOT / "build"
    out.mkdir(exist_ok=True)
    with wave.open(str(out / "mezcla.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())

    print(f"duración {total:.1f}s ({int(total // 60)}:{total % 60:04.1f}), {len(lines)} líneas, {len(scenes)} escenas")
    for s in scenes:
        print(f"  {s['name']:<9} {s['start']:7.2f} → {s['end']:7.2f}")
    if missing:
        print("faltan audios:", ", ".join(missing))


if __name__ == "__main__":
    main()
