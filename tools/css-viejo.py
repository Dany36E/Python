# Respaldo para iPads con iPadOS 15 o anterior (Safari sin color-mix).
# Copia cada regla que usa color-mix(...) a un bloque @supports al final de app/styles.css,
# cambiando la mezcla por rgba(var(--color-rgb), opacidad). Se puede correr las veces que sea:
# reemplaza el bloque anterior.
# Uso: python3 tools/css-viejo.py
import re
import pathlib

CSS = pathlib.Path(__file__).resolve().parent.parent / 'app' / 'styles.css'
START = '/* <respaldo-ipad-viejo> generado por tools/css-viejo.py: no editar a mano */'
END = '/* </respaldo-ipad-viejo> */'
MIX = re.compile(r'color-mix\(in srgb,\s*var\(--([\w-]+)\)\s*(\d+)%,\s*(?:transparent|var\(--[\w-]+\))\)')


def strip_block(text):
    a = text.find(START)
    if a < 0:
        return text
    b = text.find(END, a)
    return (text[:a] + text[b + len(END):]).rstrip() + '\n'


def rules(text, media=()):
    """Recorre las reglas: (media, selector, cuerpo). Entra a @media y @supports."""
    i = 0
    n = len(text)
    while i < n:
        j = text.find('{', i)
        if j < 0:
            return
        head = re.sub(r'/\*.*?\*/', '', text[i:j], flags=re.S).strip()
        depth = 1
        k = j + 1
        while k < n and depth:
            if text[k] == '{':
                depth += 1
            elif text[k] == '}':
                depth -= 1
            k += 1
        body = text[j + 1:k - 1]
        if head.startswith('@media') or head.startswith('@supports') or head.startswith('@container'):
            yield from rules(body, media + (head,))
        elif not head.startswith('@'):
            yield media, head, body
        i = k


def main():
    text = strip_block(CSS.read_text())
    out = []
    for media, sel, body in rules(text):
        if any(m.startswith('@container') for m in media):
            continue
        decls = []
        for d in re.sub(r'/\*.*?\*/', '', body, flags=re.S).split(';'):
            if 'color-mix' not in d or ':' not in d:
                continue
            prop, val = d.split(':', 1)
            val = MIX.sub(lambda m: 'rgba(var(--%s-rgb), %s)' % (m.group(1), str(int(m.group(2)) / 100).rstrip('0').rstrip('.')), val.strip())
            if 'color-mix' in val:
                continue
            decls.append('%s: %s;' % (prop.strip(), val))
        if decls:
            rule = '%s { %s }' % (sel, ' '.join(decls))
            for m in reversed(media):
                rule = '%s { %s }' % (m, rule)
            out.append('  ' + rule)
    block = START + '\n@supports not (color: color-mix(in srgb, red 50%, blue)) {\n' + '\n'.join(out) + '\n}\n' + END + '\n'
    CSS.write_text(text.rstrip() + '\n\n' + block)
    print(len(out), 'reglas con respaldo')


main()
