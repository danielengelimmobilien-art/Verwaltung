"""Schriftsuche ueber Kandidatenliste statt festem Pfad, damit es auf jedem
Rechner funktioniert. Faellt auf die eingebaute Pillow-Schrift zurueck."""
import os
from PIL import ImageFont

SANS_CANDIDATES = [
    "/System/Library/Fonts/SFCompact.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]
SANS_BOLD_CANDIDATES = [
    "/System/Library/Fonts/SFCompactBold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
MONO_CANDIDATES = [
    "/System/Library/Fonts/SFCompact.ttf",
    "/System/Library/Fonts/Menlo.ttc",
    "C:/Windows/Fonts/consola.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
]
MONO_BOLD_CANDIDATES = [
    "/System/Library/Fonts/Menlo.ttc",
    "C:/Windows/Fonts/consolab.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
]

_cache = {}


def _first_existing(paths):
    for p in paths:
        if os.path.isfile(p):
            return p
    return None


def get_font(size, bold=False, mono=False):
    size = max(1, int(round(size)))
    key = (bold, mono, size)
    if key in _cache:
        return _cache[key]
    if mono:
        candidates = MONO_BOLD_CANDIDATES if bold else MONO_CANDIDATES
    else:
        candidates = SANS_BOLD_CANDIDATES if bold else SANS_CANDIDATES
    path = _first_existing(candidates)
    if path:
        try:
            font = ImageFont.truetype(path, size)
        except Exception:
            font = ImageFont.load_default()
    else:
        try:
            font = ImageFont.load_default(size=size)
        except Exception:
            font = ImageFont.load_default()
    _cache[key] = font
    return font
