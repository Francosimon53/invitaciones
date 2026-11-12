"""
Recolorea el diseño base (Noche invernal: azul marino y plata) a otras paletas, en OKLCH.

Solo se mueven los tonos fríos del original (azules/plateados): las luces cálidas de las ventanas, los faroles
y el blanco de la nieve se conservan. Mismo algoritmo para el CSS y para las imágenes, así todo combina.

Uso:
  python3 scripts/themes/recolor.py            # genera public/themes/<tema>/ y public/themes/<tema>.css
  python3 scripts/themes/recolor.py --preview  # además, miniaturas en /tmp/theme-previews para revisar a ojo
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "scripts" / "themes" / "base"  # recursos originales (tema azul)
OUT = ROOT / "public" / "themes"


@dataclass(frozen=True)
class Theme:
    key: str
    # tono (grados OKLCH) al que van los oscuros y los claros; entre ambos se interpola por luminosidad
    hue_dark: float
    hue_light: float
    # multiplicador de croma para oscuros y claros
    chroma_dark: float
    chroma_light: float
    # croma que se suma a los claros (convierte el plateado en dorado o rosado); 0 = el plateado sigue plateado
    tint_light: float = 0.0
    tint_hue: float = 85.0
    # desplazamiento de luminosidad de los oscuros (negativo = más profundo)
    lift_dark: float = 0.0
    # en las fotos (palacio) el tinte de los claros se atenúa: la nieve debe seguir pareciendo nieve
    photo_tint_scale: float = 0.35


THEMES: dict[str, Theme] = {
    # El original no se recolorea: es la referencia.
    "lila": Theme("lila", hue_dark=303, hue_light=300, chroma_dark=1.05, chroma_light=1.0, lift_dark=0.01),
    "rosa": Theme(
        "rosa", hue_dark=352, hue_light=355, chroma_dark=1.0, chroma_light=0.9, tint_light=0.028, tint_hue=20, lift_dark=0.015
    ),
    "esmeralda": Theme(
        "esmeralda", hue_dark=168, hue_light=165, chroma_dark=0.95, chroma_light=0.6, tint_light=0.07, tint_hue=88, lift_dark=0.0,
        photo_tint_scale=0.25,
    ),
}

# Ventana de tonos que se recolorean (los fríos del original). Fuera de ella el color no se toca.
SRC_LO, SRC_HI, FEATHER = 195.0, 300.0, 30.0


# ---------------------------------------------------------------- color

def srgb_to_linear(c: np.ndarray) -> np.ndarray:
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c: np.ndarray) -> np.ndarray:
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def rgb_to_oklab(rgb: np.ndarray) -> np.ndarray:
    lin = srgb_to_linear(rgb)
    r, g, b = lin[..., 0], lin[..., 1], lin[..., 2]
    l = np.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m = np.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s = np.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return np.stack(
        [
            0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
        ],
        axis=-1,
    )


def oklab_to_rgb(lab: np.ndarray) -> np.ndarray:
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    lin = np.stack(
        [
            4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
        ],
        axis=-1,
    )
    return linear_to_srgb(lin)


def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def hue_weight(h: np.ndarray) -> np.ndarray:
    """1 dentro de [SRC_LO, SRC_HI], 0 lejos; borde suave para no dejar costuras."""
    inside_lo = smoothstep(SRC_LO - FEATHER, SRC_LO, h)
    inside_hi = 1.0 - smoothstep(SRC_HI, SRC_HI + FEATHER, h)
    return inside_lo * inside_hi


def lerp_hue(h0: float, h1: float, t: np.ndarray) -> np.ndarray:
    d = ((h1 - h0 + 180.0) % 360.0) - 180.0
    return (h0 + d * t) % 360.0


def remap(rgb: np.ndarray, th: Theme, photo: bool) -> np.ndarray:
    """rgb en [0,1], forma (..., 3) → rgb recoloreado."""
    lab = rgb_to_oklab(rgb)
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(a, b)
    h = (np.degrees(np.arctan2(b, a)) + 360.0) % 360.0
    # los grises casi puros no tienen tono fiable: se tratan como del original (plateado frío) si son claros u oscuros
    neutral = smoothstep(0.004, 0.012, C)
    w = hue_weight(h) * neutral + (1.0 - neutral) * 1.0
    tl = smoothstep(0.30, 0.85, L)
    nh = lerp_hue(th.hue_dark, th.hue_light, tl)
    nC = C * (th.chroma_dark + (th.chroma_light - th.chroma_dark) * tl)
    tint = th.tint_light * (th.photo_tint_scale if photo else 1.0)
    if tint:
        # el tinte (dorado/rosado) entra en los claros y en los medios brillantes: el plateado se vuelve metal cálido
        k = smoothstep(0.45, 0.9, L) * (1.0 - smoothstep(0.97, 1.0, L) * (0.85 if photo else 0.4))
        ta = np.cos(np.radians(th.tint_hue)) * tint * k
        tb = np.sin(np.radians(th.tint_hue)) * tint * k
    else:
        ta = tb = 0.0
    nL = L + th.lift_dark * (1.0 - tl)
    na = np.cos(np.radians(nh)) * nC + ta
    nb = np.sin(np.radians(nh)) * nC + tb
    out = np.stack([L + (nL - L) * w, a + (na - a) * w, b + (nb - b) * w], axis=-1)
    # gama: si se sale de sRGB, se reduce el croma hasta entrar
    for _ in range(6):
        test = oklab_to_rgb(out)
        bad = np.any((test < -0.002) | (test > 1.002), axis=-1)
        if not np.any(bad):
            break
        out[..., 1] = np.where(bad, out[..., 1] * 0.9, out[..., 1])
        out[..., 2] = np.where(bad, out[..., 2] * 0.9, out[..., 2])
    return np.clip(oklab_to_rgb(out), 0.0, 1.0)


# ---------------------------------------------------------------- CSS

HEX = re.compile(r"#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b")
RGBA = re.compile(r"rgba?\(\s*([0-9.]+)[ ,]+([0-9.]+)[ ,]+([0-9.]+)\s*(?:[,/]\s*([0-9.]+%?))?\s*\)")


def parse_hex(s: str) -> tuple[list[float], str | None]:
    h = s[1:]
    if len(h) in (3, 4):
        h = "".join(ch * 2 for ch in h)
    rgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    alpha = h[6:8] if len(h) == 8 else None
    return rgb, alpha


def to_hex(rgb: np.ndarray, alpha: str | None) -> str:
    vals = "".join(f"{int(round(float(v) * 255)):02x}" for v in rgb)
    return f"#{vals}{alpha or ''}"


def recolor_css(css: str, th: Theme) -> str:
    def sub_hex(m: re.Match[str]) -> str:
        rgb, alpha = parse_hex(m.group(0))
        out = remap(np.array(rgb, dtype=np.float64), th, photo=False)
        return to_hex(out, alpha)

    def sub_rgba(m: re.Match[str]) -> str:
        r, g, b = (float(m.group(i)) / 255 for i in (1, 2, 3))
        out = remap(np.array([r, g, b], dtype=np.float64), th, photo=False)
        R, G, B = (int(round(float(v) * 255)) for v in out)
        return f"rgba({R},{G},{B},{m.group(4)})" if m.group(4) else f"rgb({R},{G},{B})"

    css = HEX.sub(sub_hex, css)
    css = RGBA.sub(sub_rgba, css)
    return css


def recolor_triplets(text: str, th: Theme) -> str:
    """Colores "r,g,b" sueltos (los que usa el lienzo de nieve)."""

    def sub(m: re.Match[str]) -> str:
        r, g, b = (int(m.group(i)) / 255 for i in (1, 2, 3))
        out = remap(np.array([r, g, b]), th, photo=False)
        return ",".join(str(int(round(float(v) * 255))) for v in out)

    return re.sub(r"\b(\d{1,3}),(\d{1,3}),(\d{1,3})\b", sub, text)


# ---------------------------------------------------------------- imágenes

def recolor_image(src: Path, dst: Path, th: Theme, photo: bool, quality: int) -> None:
    im = Image.open(src)
    has_alpha = im.mode in ("RGBA", "LA")
    rgba = np.asarray(im.convert("RGBA"), dtype=np.float64) / 255.0
    out = remap(rgba[..., :3], th, photo=photo)
    arr = np.concatenate([out, rgba[..., 3:4]], axis=-1) if has_alpha else out
    res = Image.fromarray((arr * 255.0 + 0.5).astype(np.uint8), "RGBA" if has_alpha else "RGB")
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.suffix == ".webp":
        res.save(dst, "WEBP", quality=quality, method=6)
    else:
        res.convert("RGB").save(dst, "JPEG", quality=quality, optimize=True, progressive=True)


# ---------------------------------------------------------------- principal

IMAGES = [
    # (archivo base, archivo de salida, ¿es foto?, calidad)
    ("palacio.webp", "palacio.webp", True, 82),
    ("sobre.webp", "sobre.webp", False, 84),
    ("sobre-og.jpg", "sobre-og.jpg", False, 86),
]


def build(theme_keys: list[str], preview: bool) -> None:
    css_base = (BASE / "invitacion.css").read_text()
    OUT.mkdir(parents=True, exist_ok=True)
    # el tema base (azul) se copia tal cual
    (OUT / "azul").mkdir(exist_ok=True)
    for name, out_name, _, _ in IMAGES:
        shutil.copyfile(BASE / name, OUT / "azul" / out_name)
    (OUT / "azul.css").write_text(css_base.replace("__THEME__", "azul"))
    shutil.copyfile(BASE / "favicon.svg", OUT / "azul" / "favicon.svg")
    palette: dict[str, dict[str, str]] = {}
    for key in theme_keys:
        th = THEMES[key]
        (OUT / f"{key}.css").write_text(recolor_css(css_base, th).replace("__THEME__", key))
        for name, out_name, photo, q in IMAGES:
            recolor_image(BASE / name, OUT / key / out_name, th, photo, q)
        (OUT / key / "favicon.svg").write_text(recolor_css((BASE / "favicon.svg").read_text(), th))
        palette[key] = {
            "ogBackground": recolor_css("#06152d", th),
            "ogLabel": recolor_css("#bbcee6", th),
            "ogName": recolor_css("#f1f5fc", th),
            "ogNote": recolor_css("#d4e3f7", th),
            "themeColor": recolor_css("#07172f", th),
            "snowStroke": recolor_triplets("22,49,83", th),
            "snowFill": recolor_triplets("248,253,255", th),
            "sparkA": recolor_triplets("169,211,255", th),
            "sparkB": recolor_triplets("237,246,255", th),
        }
        print(f"tema {key}: listo")
    (ROOT / "scripts" / "themes" / "palette.json").write_text(json.dumps(palette, indent=2) + "\n")
    if preview:
        prev = Path("/tmp/theme-previews")
        prev.mkdir(exist_ok=True)
        for key in ["azul", *theme_keys]:
            for name in ("palacio.webp", "sobre.webp"):
                im = Image.open(OUT / key / name)
                im.thumbnail((520, 520))
                im.convert("RGB").save(prev / f"{key}-{name.replace('.webp', '.jpg')}", quality=85)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--preview", action="store_true")
    p.add_argument("themes", nargs="*", default=list(THEMES))
    a = p.parse_args()
    unknown = [t for t in a.themes if t not in THEMES]
    if unknown:
        sys.exit(f"temas desconocidos: {unknown}")
    build(a.themes, a.preview)
