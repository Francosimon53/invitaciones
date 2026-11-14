"""
Recolorea el diseño base (Noche invernal: azul marino y plata) a otras paletas, en OKLCH.

Solo se mueven los tonos fríos del original (azules/plateados): las luces cálidas de las ventanas, los faroles
y el blanco de la nieve se conservan. Mismo algoritmo para el CSS y para las imágenes, así todo combina.

Hay dos familias:
  - de noche (THEMES): el castillo nevado recoloreado, textos claros sobre fondo oscuro;
  - de día (DAY_THEMES): un castillo de primavera propio (scripts/themes/dia/<tema>.webp), sobre claro con
    filigrana metálica y textos oscuros sobre fondo claro. El CSS sale del mismo original con la luminosidad
    invertida, más un bloque corto de ajustes (DAY_EXTRA).

Uso:
  python3 scripts/themes/recolor.py            # genera public/themes/<tema>/ y public/themes/<tema>.css
  python3 scripts/themes/recolor.py rosas lavanda   # solo esos estilos
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
    # --- estilos de noche con movimiento propio (14 nov 2026)
    "petalos": Theme("petalos", hue_dark=352, hue_light=356, chroma_dark=0.8, chroma_light=0.85,
                     tint_light=0.05, tint_hue=8, lift_dark=0.05, photo_tint_scale=0.85),
    "rosas": Theme("rosas", hue_dark=14, hue_light=24, chroma_dark=1.15, chroma_light=0.7,
                   tint_light=0.06, tint_hue=75, lift_dark=-0.01, photo_tint_scale=0.35),
    "aurora": Theme("aurora", hue_dark=222, hue_light=200, chroma_dark=1.0, chroma_light=0.8,
                    tint_light=0.03, tint_hue=165, lift_dark=-0.01, photo_tint_scale=0.45),
    "luciernagas": Theme("luciernagas", hue_dark=132, hue_light=110, chroma_dark=0.42, chroma_light=0.4,
                         tint_light=0.06, tint_hue=92, lift_dark=0.02, photo_tint_scale=0.35),
    "mariposas": Theme("mariposas", hue_dark=248, hue_light=252, chroma_dark=0.55, chroma_light=0.6,
                       tint_light=0.0, lift_dark=0.12, photo_tint_scale=0.35),
    "linternas": Theme("linternas", hue_dark=306, hue_light=62, chroma_dark=1.0, chroma_light=0.6,
                       tint_light=0.07, tint_hue=70, lift_dark=0.0, photo_tint_scale=0.55),
    "oro": Theme("oro", hue_dark=70, hue_light=85, chroma_dark=0.15, chroma_light=0.2,
                 tint_light=0.09, tint_hue=85, lift_dark=-0.04, photo_tint_scale=0.6),
}


@dataclass(frozen=True)
class DayTheme:
    key: str
    hue: float          # tono de las tintas y del papel
    paper_c: float      # croma del papel del sobre y de los fondos claros
    metal_hue: float    # filigrana del sobre: dorado (≈82) o plateado (croma casi 0)
    metal_c: float
    gem_hue: float      # la gema del broche
    # cielo real de la imagen (franja superior) y tintas ya medidas contra él: ≥4.5:1 (≥3:1 el nombre)
    seam: str
    zenith: str
    brand: str
    ink2: str
    ink: str
    name: str
    button: str         # botón principal (confirmar)
    ink_c: float = 0.075


DAY_THEMES: dict[str, DayTheme] = {
    "rosapalo": DayTheme("rosapalo", 355, 0.022, 82, 0.10, 0, "#aab6ea", "#96a3dc", "#612143", "#652948", "#5a2340", "#7b2a4d", "#8c3557"),
    "cerezos": DayTheme("cerezos", 350, 0.020, 20, 0.045, 355, "#85b3f8", "#6da0ec", "#582442", "#562947", "#4f2440", "#962a58", "#a3335f"),
    "lavanda": DayTheme("lavanda", 300, 0.032, 82, 0.10, 300, "#a6b6ea", "#92a3dc", "#432f65", "#463567", "#3b2a5a", "#5a3a8c", "#5b3d8f"),
    "azulcielo": DayTheme("azulcielo", 252, 0.030, 250, 0.012, 255, "#62a4ee", "#4591e3", "#05274b", "#0b2a4f", "#1d3557", "#1b467b", "#2a5a92"),
    "salvia": DayTheme("salvia", 152, 0.030, 85, 0.09, 150, "#82b6e8", "#69a3da", "#213a2a", "#273d2f", "#26392d", "#2f5a43", "#40624e"),
    "atardecer": DayTheme("atardecer", 55, 0.030, 78, 0.11, 45, "#989ed9", "#858bcb", "#432005", "#45230c", "#4a2a18", "#753800", "#8f5a22"),
    "tulipanes": DayTheme("tulipanes", 92, 0.035, 80, 0.11, 70, "#70a8ee", "#5695e2", "#3a2a00", "#3a2d00", "#3b300c", "#5c4006", "#6b4f08"),
    "buganvilias": DayTheme("buganvilias", 347, 0.042, 82, 0.10, 350, "#68a1e3", "#4e8ed7", "#500031", "#520536", "#4f0c35", "#87064c", "#b0186c"),
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


# ---------------------------------------------------------------- de día

def _fit_gamut(out: np.ndarray) -> np.ndarray:
    for _ in range(8):
        test = oklab_to_rgb(out)
        bad = np.any((test < -0.002) | (test > 1.002), axis=-1)
        if not np.any(bad):
            break
        out[..., 1] = np.where(bad, out[..., 1] * 0.9, out[..., 1])
        out[..., 2] = np.where(bad, out[..., 2] * 0.9, out[..., 2])
    return np.clip(oklab_to_rgb(out), 0.0, 1.0)


def remap_day_css(rgb: np.ndarray, th: DayTheme) -> np.ndarray:
    """Color del CSS original → versión de día: la luminosidad se invierte (fondo oscuro → claro, texto claro →
    tinta) y los tonos fríos y los grises pasan al tono del estilo. Los cálidos (errores, avisos) conservan su tono."""
    lab = rgb_to_oklab(rgb)
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(a, b)
    h = (np.degrees(np.arctan2(b, a)) + 360.0) % 360.0
    neutral = smoothstep(0.004, 0.012, C)
    w = hue_weight(h) * neutral + (1.0 - neutral)
    nL = np.clip(1.147 - 0.913 * L, 0.16, 0.99)
    surface = smoothstep(0.62, 0.86, nL)  # 1 = fondo claro, 0 = tinta
    nC = np.maximum(C * 0.9, th.ink_c) * (1.0 - surface) + np.minimum(C * 0.4, th.paper_c * 1.4) * surface
    na = np.cos(np.radians(th.hue)) * nC
    nb = np.sin(np.radians(th.hue)) * nC
    out = np.stack([nL, a + (na - a) * w, b + (nb - b) * w], axis=-1)
    return _fit_gamut(out)


# curva de luminosidad del sobre: el papel oscuro pasa a claro; la filigrana clara, a metal medio
ENV_L = ([0.0, 0.12, 0.32, 0.45, 0.60, 0.80, 1.0], [1.0, 0.975, 0.915, 0.83, 0.50, 0.66, 0.84])


def remap_day_envelope(rgb: np.ndarray, th: DayTheme) -> np.ndarray:
    lab = rgb_to_oklab(rgb)
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(a, b)
    nL = np.interp(L, ENV_L[0], ENV_L[1])
    metal = smoothstep(0.45, 0.60, L)
    gem = smoothstep(0.13, 0.17, C) * (1.0 - metal) * smoothstep(0.25, 0.33, L)
    cp = th.paper_c * (1.0 + 1.2 * np.clip((0.95 - nL) / 0.15, 0.0, 1.0))
    cm = th.metal_c * (0.8 + 0.45 * np.clip((0.86 - nL) / 0.3, 0.0, 1.0))
    hh = np.radians(th.hue * (1.0 - metal) + th.metal_hue * metal)
    c = cp * (1.0 - metal) + cm * metal
    na, nb = np.cos(hh) * c, np.sin(hh) * c
    gL = 0.42 + (L - 0.3) * 0.9
    ga, gb = np.cos(np.radians(th.gem_hue)) * 0.16, np.sin(np.radians(th.gem_hue)) * 0.16
    out = np.stack([nL * (1 - gem) + gL * gem, na * (1 - gem) + ga * gem, nb * (1 - gem) + gb * gem], axis=-1)
    return _fit_gamut(out)


def hex_rgb(h: str) -> np.ndarray:
    return np.array(parse_hex(h)[0], dtype=np.float64)


def mix_hex(a: str, b: str, t: float) -> str:
    return to_hex(hex_rgb(a) * (1 - t) + hex_rgb(b) * t, None)


def day_extra(th: DayTheme) -> str:
    """Ajustes que la inversión sola no resuelve: el cielo del sobre, las tintas medidas y los brillos."""
    paper = to_hex(remap_day_css(hex_rgb("#07172f"), th), None)
    metal = to_hex(_fit_gamut(np.array([0.72, np.cos(np.radians(th.metal_hue)) * max(th.metal_c, 0.02), np.sin(np.radians(th.metal_hue)) * max(th.metal_c, 0.02)])), None)
    glow = "0 1px 0 #ffffff8c,0 0 14px #ffffffd9"
    soft = "0 0 10px #ffffffb0"
    return (
        ":root{color-scheme:light}"
        f".envelope-gate{{background:linear-gradient({th.zenith} 0,{th.seam} 30%,{mix_hex(th.seam, paper, 0.55)} 62%,{paper} 100%)}}"
        ".gate-stars{display:none}.gate-light{background:radial-gradient(at 50% 78%,#ffffff8c,#0000 62%)}"
        f".gate-intro .eyebrow,.site-header .header-title{{color:{th.brand};text-shadow:{soft}}}"
        f".gate-intro h1,.envelope-open-help,.gate-date,.envelope-gate .sound-hint{{color:{th.ink2};text-shadow:{soft}}}"
        f".tiny-divider svg,.hero-crystal{{color:{th.brand}}}.gate-intro .tiny-divider i{{background:linear-gradient(90deg,#0000,{th.brand})}}"
        f".envelope-stage{{filter:drop-shadow(0 24px 30px {th.ink}47)}}"
        f".envelope-addressee{{color:{th.ink}}}.envelope-addressee>span,.envelope-note{{color:{th.ink2}}}"
        ".envelope-addressee h2{text-shadow:0 1px 6px #ffffffcc}"
        f".seal-sparkle,.seal-sparkle:before,.seal-sparkle:after{{background:#fff}}.seal-sparkle{{box-shadow:0 0 8px #fff,0 0 17px {metal}}}"
        f".seal-halo{{background:radial-gradient(#ffffff59,#0000 68%);box-shadow:0 0 35px #ffffff40}}"
        f".letter-glimmer{{color:{th.name};background:linear-gradient(#fff,{paper});border-color:#fff;box-shadow:0 0 70px #ffffffb3}}"
        f".site-header{{background:linear-gradient(#ffffff59,#0000);border-bottom-color:{th.ink}1f}}"
        f".monogram{{color:{th.ink}}}.languages button{{color:{th.brand};text-shadow:{soft}}}.languages button[aria-pressed=true]{{color:{th.brand};font-weight:800;text-decoration:underline;text-underline-offset:3px}}.languages span{{color:{th.ink2}80}}"
        f".icon-button{{color:{th.ink};background:#ffffff8c;border-color:{th.ink}40}}.icon-button.selected{{background:#ffffffd9}}.music-bars i{{background:{th.ink}}}"
        f".hero-title{{text-shadow:{soft}}}.hero-title .eyebrow{{color:{th.brand}}}"
        f".hero-title h1{{color:{th.name};text-shadow:{glow}}}"
        f".palace-hero .xv-title,.invitation .hero-subtitle{{color:{th.brand};text-shadow:{glow};background:radial-gradient(ellipse 58% 62% at 50% 50%,#ffffffc7,#ffffff8f 55%,#fff0 100%)}}.xv-title i{{background:{th.brand}8c}}"
        f".royal-frame{{border-color:{th.ink}47}}.royal-frame:before{{border-color:{th.ink}1f}}.royal-frame>span{{border-color:{th.ink}}}"
        f".hero-wash{{background:linear-gradient(#ffffff26 0%,#fff0 20%,#fff0 40%,{paper}99 56%,{paper}e6 74%,{paper}f5 92%,{paper} 100%)}}"
        ".palace-hero:after{background:none}.sky-glow,.firework-illumination{display:none}"
        f".hero-bottom .hero-poem,.hero-bottom .hero-event span,.hero-bottom .hero-event strong,.hero-bottom .hero-address,.hero-bottom .hero-address>span,.hero-bottom .hero-attire,.hero-bottom .discover-link,.invitation .hero-bottom .hero-poem{{color:{th.ink};text-shadow:{glow}}}"
        f".hero-actions>.outline-button{{color:{th.ink};background:#ffffffd6;border-color:{th.ink}66}}"
        f".silver-button,.envelope-gate .envelope-open-cta,.mobile-rsvp{{color:#fff;background:{th.button};border-color:{th.button};box-shadow:0 5px 22px {th.ink}40}}"
        f".envelope-gate .envelope-open-cta:hover{{background:{th.ink};box-shadow:0 5px 26px {th.ink}59}}"
        f".attendance-options button.selected{{color:#fff;background:{th.button};border-color:{th.button}}}"
        f".dress-swatches i{{background:{th.name};border-color:{th.ink}66}}.dress-swatches i+i{{background:linear-gradient(135deg,{metal},#fff,{metal})}}"
        f".evening-image{{background-image:linear-gradient(#0000,#fff2),url(/themes/{th.key}/palacio.webp)}}"
    )


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


def css_map(th: "Theme | DayTheme"):
    if isinstance(th, DayTheme):
        return lambda rgb: remap_day_css(rgb, th)
    return lambda rgb: remap(rgb, th, photo=False)


def recolor_css(css: str, th: "Theme | DayTheme") -> str:
    fn = css_map(th)

    def sub_hex(m: re.Match[str]) -> str:
        rgb, alpha = parse_hex(m.group(0))
        out = fn(np.array(rgb, dtype=np.float64))
        return to_hex(out, alpha)

    def sub_rgba(m: re.Match[str]) -> str:
        r, g, b = (float(m.group(i)) / 255 for i in (1, 2, 3))
        out = fn(np.array([r, g, b], dtype=np.float64))
        R, G, B = (int(round(float(v) * 255)) for v in out)
        return f"rgba({R},{G},{B},{m.group(4)})" if m.group(4) else f"rgb({R},{G},{B})"

    css = HEX.sub(sub_hex, css)
    css = RGBA.sub(sub_rgba, css)
    return css


def recolor_triplets(text: str, th: "Theme | DayTheme") -> str:
    """Colores "r,g,b" sueltos (los que usa el lienzo de nieve)."""
    fn = css_map(th)

    def sub(m: re.Match[str]) -> str:
        r, g, b = (int(m.group(i)) / 255 for i in (1, 2, 3))
        out = fn(np.array([r, g, b]))
        return ",".join(str(int(round(float(v) * 255))) for v in out)

    return re.sub(r"\b(\d{1,3}),(\d{1,3}),(\d{1,3})\b", sub, text)


# ---------------------------------------------------------------- imágenes

def recolor_image(src: Path, dst: Path, th: "Theme | DayTheme", photo: bool, quality: int) -> None:
    im = Image.open(src)
    has_alpha = im.mode in ("RGBA", "LA")
    rgba = np.asarray(im.convert("RGBA"), dtype=np.float64) / 255.0
    out = remap_day_envelope(rgba[..., :3], th) if isinstance(th, DayTheme) else remap(rgba[..., :3], th, photo=photo)
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


DAY_SRC = ROOT / "scripts" / "themes" / "dia"  # castillos de día: <tema>.webp (1024×1536)


def triplet(h: str) -> str:
    return ",".join(str(int(round(v * 255))) for v in hex_rgb(h))


def build(theme_keys: list[str], preview: bool) -> None:
    css_base = (BASE / "invitacion.css").read_text()
    OUT.mkdir(parents=True, exist_ok=True)
    # el tema base (azul) se copia tal cual
    (OUT / "azul").mkdir(exist_ok=True)
    for name, out_name, _, _ in IMAGES:
        shutil.copyfile(BASE / name, OUT / "azul" / out_name)
    (OUT / "azul.css").write_text(css_base.replace("__THEME__", "azul"))
    shutil.copyfile(BASE / "favicon.svg", OUT / "azul" / "favicon.svg")
    palette_path = ROOT / "scripts" / "themes" / "palette.json"
    palette: dict[str, dict[str, str]] = json.loads(palette_path.read_text()) if palette_path.exists() else {}
    for key in theme_keys:
        if key in DAY_THEMES:
            d = DAY_THEMES[key]
            (OUT / key).mkdir(exist_ok=True)
            (OUT / f"{key}.css").write_text(recolor_css(css_base, d).replace("__THEME__", key) + day_extra(d))
            Image.open(DAY_SRC / f"{key}.webp").convert("RGB").save(OUT / key / "palacio.webp", "WEBP", quality=82, method=6)
            for name, out_name, photo, q in IMAGES[1:]:
                recolor_image(BASE / name, OUT / key / out_name, d, photo, q)
            (OUT / key / "favicon.svg").write_text(recolor_css((BASE / "favicon.svg").read_text(), d))
            paper = recolor_css("#07172f", d)
            palette[key] = {
                "ogBackground": paper,
                "ogLabel": d.ink2,
                "ogName": d.ink,
                "ogNote": d.ink2,
                "themeColor": d.seam,
                "snowStroke": triplet(d.ink2),
                "snowFill": "255,255,255",
                "sparkA": triplet(d.button),
                "sparkB": triplet(mix_hex(d.name, "#ffffff", 0.35)),
            }
            print(f"tema {key} (día): listo")
            continue
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
    palette_path.write_text(json.dumps(palette, indent=2) + "\n")
    if preview:
        prev = Path("/tmp/theme-previews")
        prev.mkdir(exist_ok=True)
        for key in ["azul", *theme_keys]:
            for name in ("palacio.webp", "sobre.webp"):
                im = Image.open(OUT / key / name)
                im.thumbnail((520, 520))
                im.convert("RGB").save(prev / f"{key}-{name.replace('.webp', '.jpg')}", quality=85)


if __name__ == "__main__":
    ALL = {**THEMES, **DAY_THEMES}
    p = argparse.ArgumentParser()
    p.add_argument("--preview", action="store_true")
    p.add_argument("themes", nargs="*", default=list(ALL))
    a = p.parse_args()
    unknown = [t for t in a.themes if t not in ALL]
    if unknown:
        sys.exit(f"temas desconocidos: {unknown}")
    build(a.themes, a.preview)
