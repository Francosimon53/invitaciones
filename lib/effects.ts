/**
 * Movimiento de cada estilo (lo dibuja components/MagicCanvas.tsx).
 * Las medidas están pensadas para un teléfono de 390×844; el lienzo las escala a la pantalla real.
 * `null` en un estilo = la nieve del diseño original.
 */

export type LayerType = "petal" | "glint" | "ice" | "speck" | "bokeh" | "firefly" | "butterfly" | "lantern" | "dove";

export interface Layer {
  type: LayerType;
  count: number;
  /** Profundidad (0 lejos, 1 cerca): decide tamaño, velocidad y opacidad. */
  zMin?: number;
  zMax?: number;
  size: [number, number];
  speed: [number, number];
  /** "r,g,b", un color CSS o, para pétalos y alas, [base, luz, borde]. */
  colors: (string | string[])[];
  alpha?: [number, number];
  sway?: number;
  wind?: number;
  spin?: number;
  drift?: number;
  dir?: "down" | "up" | "float" | "side";
  /** Franja vertical (fracción de la pantalla) para los que flotan o cruzan. */
  yMin?: number;
  yMax?: number;
  core?: string;
  body?: string;
}

export interface Curtain {
  base: number;
  height: number;
  a1: number;
  a2: number;
  k1: number;
  k2: number;
  k3: number;
  s1: number;
  s2: number;
  s3: number;
  ph: number;
  c0: string;
  c1: string;
  alpha: number;
}

export interface Rays {
  x: number;
  y: number;
  count: number;
  len: number;
  w: number;
  a0: number;
  a1: number;
  color: string;
  alpha: number;
  glow?: number;
}

export interface EffectConfig {
  layers: Layer[];
  /** Lo que vive en el cielo (estrellas, aurora, rayos, estrellas fugaces) se apaga al bajar por la página. */
  stars?: { count: number; yMax: number; color: string };
  shooting?: boolean;
  aurora?: Curtain[];
  rays?: Rays;
}

const DOVES: Layer = {
  type: "dove",
  count: 2,
  zMin: 0.2,
  zMax: 0.5,
  size: [20, 28],
  speed: [26, 38],
  colors: ["#ffffff"],
  alpha: [0.92, 1],
  dir: "side",
  yMin: 0.09,
  yMax: 0.26,
};

const glint = (count: number, color: string, extra: Partial<Layer> = {}): Layer => ({
  type: "glint",
  count,
  zMin: 0.1,
  zMax: 0.7,
  size: [7, 14],
  speed: [6, 12],
  colors: [color],
  alpha: [0.55, 1],
  sway: 5,
  spin: 0.5,
  dir: "down",
  ...extra,
});

const butterflies = (count: number, colors: string[][], body: string, extra: Partial<Layer> = {}): Layer => ({
  type: "butterfly",
  count,
  zMin: 0.3,
  zMax: 1,
  size: [20, 36],
  speed: [16, 30],
  colors,
  body,
  alpha: [0.85, 1],
  sway: 24,
  drift: 6,
  dir: "up",
  ...extra,
});

export const EFFECTS = {
  petalos: {
    stars: { count: 55, yMax: 0.3, color: "#ffe9f0" },
    layers: [
      {
        type: "petal",
        count: 44,
        size: [9, 22],
        speed: [24, 58],
        colors: [
          ["#e98fa5", "#fbd3dc"],
          ["#f2a7b8", "#fde3e9"],
          ["#de7b94", "#f7c2cf"],
          ["#f6bfcb", "#fff0f3"],
        ],
        alpha: [0.55, 0.95],
        sway: 26,
        wind: 6,
        spin: 1.4,
        dir: "down",
      },
      glint(10, "255,236,190", { zMax: 0.6, size: [8, 14], speed: [8, 16], alpha: [0.5, 0.9], sway: 6 }),
    ],
  },
  rosas: {
    stars: { count: 50, yMax: 0.3, color: "#ffe6d6" },
    layers: [
      {
        type: "petal",
        count: 40,
        size: [10, 24],
        speed: [20, 50],
        colors: [
          ["#a8183a", "#e2577a"],
          ["#c42a4c", "#f07a96"],
          ["#8f1230", "#d94a6c"],
          ["#d23c5d", "#f59ab0"],
        ],
        alpha: [0.6, 1],
        sway: 22,
        wind: 4,
        spin: 1.2,
        dir: "down",
      },
      { type: "bokeh", count: 10, zMin: 0, zMax: 0.5, size: [30, 70], speed: [4, 10], colors: ["232,188,110"], alpha: [0.06, 0.16], dir: "float" },
      glint(18, "246,214,150", { zMin: 0, zMax: 0.9, speed: [6, 14], alpha: [0.5, 1], spin: 0.6 }),
    ],
  },
  aurora: {
    stars: { count: 140, yMax: 0.42, color: "#ffffff" },
    shooting: true,
    aurora: [
      { base: 250, height: 150, a1: 26, a2: 14, k1: 0.01, k2: 0.023, k3: 0.017, s1: 0.35, s2: 0.22, s3: 0.5, ph: 0, c0: "72,255,190", c1: "130,96,255", alpha: 0.85 },
      { base: 205, height: 120, a1: 20, a2: 10, k1: 0.014, k2: 0.019, k3: 0.021, s1: 0.28, s2: 0.31, s3: 0.42, ph: 2.1, c0: "60,230,170", c1: "90,150,255", alpha: 0.7 },
      { base: 300, height: 110, a1: 18, a2: 12, k1: 0.008, k2: 0.027, k3: 0.013, s1: 0.4, s2: 0.18, s3: 0.6, ph: 4.2, c0: "110,255,200", c1: "200,90,255", alpha: 0.5 },
    ],
    layers: [{ type: "ice", count: 16, size: [6, 12], speed: [6, 14], colors: ["220,240,255"], alpha: [0.35, 0.85], sway: 4, spin: 0.4, dir: "down" }],
  },
  luciernagas: {
    stars: { count: 45, yMax: 0.3, color: "#f4f0d8" },
    layers: [
      { type: "firefly", count: 42, size: [16, 34], speed: [0, 0], colors: ["214,255,120"], core: "#fbffd6", alpha: [0.55, 1], dir: "float", yMin: 0.3, yMax: 1 },
      { type: "bokeh", count: 6, zMin: 0, zMax: 0.4, size: [60, 110], speed: [2, 5], colors: ["200,230,150"], alpha: [0.04, 0.09], dir: "float" },
    ],
  },
  mariposas: {
    stars: { count: 40, yMax: 0.3, color: "#eef4ff" },
    layers: [
      butterflies(
        11,
        [
          ["rgba(255,255,255,0.97)", "rgba(127,166,214,0.95)", "rgba(80,104,145,0.55)"],
          ["rgba(252,250,255,0.97)", "rgba(169,149,221,0.95)", "rgba(88,80,140,0.5)"],
          ["rgba(255,255,255,0.97)", "rgba(142,160,224,0.95)", "rgba(70,90,150,0.5)"],
        ],
        "#3a4560",
        { zMin: 0, size: [22, 46], speed: [18, 34], alpha: [0.75, 1], drift: 8 },
      ),
      glint(22, "255,255,255", { zMin: 0, size: [6, 12], speed: [4, 10], alpha: [0.45, 0.95], sway: 4, spin: 0.4 }),
    ],
  },
  linternas: {
    stars: { count: 50, yMax: 0.3, color: "#fff1d6" },
    layers: [{ type: "lantern", count: 15, size: [14, 42], speed: [10, 30], colors: ["warm"], alpha: [0.55, 1], sway: 8, dir: "up" }],
  },
  oro: {
    stars: { count: 45, yMax: 0.3, color: "#f3e2b0" },
    layers: [
      { type: "speck", count: 70, size: [1.6, 4.2], speed: [10, 26], colors: ["#f7e3a1", "#e6c36a", "#c9a04a", "#fff1c2"], alpha: [0.5, 1], sway: 8, spin: 2, dir: "down" },
      glint(22, "255,232,170", { zMin: 0, zMax: 1, size: [8, 18], speed: [8, 18], alpha: [0.5, 1], sway: 6 }),
      { type: "bokeh", count: 12, zMin: 0, zMax: 0.5, size: [40, 90], speed: [3, 8], colors: ["214,170,80"], alpha: [0.05, 0.13], dir: "float" },
    ],
  },
  rosapalo: {
    rays: { x: 360, y: -30, count: 6, len: 760, w: 0.05, a0: 1.75, a1: 2.45, color: "255,236,214", alpha: 0.13 },
    layers: [
      {
        type: "petal",
        count: 40,
        size: [9, 21],
        speed: [22, 52],
        colors: [
          ["#e98fa5", "#fbd3dc", "rgba(176,74,106,0.35)"],
          ["#f2a7b8", "#fde3e9", "rgba(176,74,106,0.3)"],
          ["#de7b94", "#f7c2cf", "rgba(150,50,85,0.35)"],
          ["#f6bfcb", "#fff0f3", "rgba(176,74,106,0.3)"],
        ],
        alpha: [0.6, 0.98],
        sway: 26,
        wind: 7,
        spin: 1.4,
        dir: "down",
      },
      glint(12, "232,182,92", { size: [8, 15], speed: [8, 16], alpha: [0.55, 0.95], sway: 6 }),
      DOVES,
    ],
  },
  cerezos: {
    layers: [
      {
        type: "petal",
        count: 58,
        size: [7, 16],
        speed: [26, 60],
        colors: [
          ["#f6b9cb", "#fde8ef", "rgba(190,90,125,0.35)"],
          ["#fbd0dc", "#fff4f7", "rgba(190,100,135,0.3)"],
          ["#ffffff", "#fff1f5", "rgba(180,110,140,0.4)"],
          ["#f2a3ba", "#fcd9e4", "rgba(170,70,110,0.35)"],
        ],
        alpha: [0.62, 1],
        sway: 30,
        wind: 16,
        spin: 1.8,
        dir: "down",
      },
      { type: "bokeh", count: 7, zMin: 0, zMax: 0.4, size: [40, 90], speed: [3, 7], colors: ["255,214,228"], alpha: [0.06, 0.13], dir: "float" },
      glint(8, "255,255,255", { zMax: 0.6, size: [7, 12], alpha: [0.5, 0.9], sway: 4, spin: 0.4 }),
    ],
  },
  lavanda: {
    layers: [
      {
        type: "petal",
        count: 46,
        size: [6, 13],
        speed: [20, 46],
        colors: [
          ["#b48fdc", "#e6d6f7", "rgba(110,70,160,0.35)"],
          ["#9f78cf", "#dccaf2", "rgba(100,60,150,0.35)"],
          ["#cbb2ea", "#f3ebfc", "rgba(120,90,170,0.3)"],
          ["#8e66c2", "#cfb9ee", "rgba(90,50,140,0.35)"],
        ],
        alpha: [0.6, 1],
        sway: 22,
        wind: 5,
        spin: 1.6,
        dir: "down",
      },
      butterflies(
        6,
        [
          ["rgba(255,255,255,0.97)", "rgba(178,150,222,0.95)", "rgba(96,70,140,0.5)"],
          ["rgba(252,248,255,0.97)", "rgba(206,170,232,0.95)", "rgba(110,72,150,0.5)"],
        ],
        "#3f3157",
        { alpha: [0.8, 1] },
      ),
      glint(10, "226,186,100", { zMax: 0.6, size: [7, 13], alpha: [0.5, 0.95] }),
    ],
  },
  azulcielo: {
    rays: { x: 340, y: -40, count: 5, len: 700, w: 0.045, a0: 1.8, a1: 2.4, color: "255,255,255", alpha: 0.12 },
    layers: [
      {
        type: "petal",
        count: 34,
        size: [7, 14],
        speed: [20, 44],
        colors: [
          ["#8fb4e6", "#dbe8fa", "rgba(60,100,160,0.35)"],
          ["#ffffff", "#eef4fc", "rgba(90,120,170,0.4)"],
          ["#a9c4ee", "#e8f0fc", "rgba(70,110,170,0.3)"],
          ["#7ea3dc", "#cfe0f7", "rgba(50,90,150,0.35)"],
        ],
        alpha: [0.6, 1],
        sway: 22,
        wind: 5,
        spin: 1.5,
        dir: "down",
      },
      glint(18, "255,255,255", { zMin: 0, zMax: 0.8, speed: [5, 12], sway: 4 }),
      { ...DOVES, count: 3, size: [20, 30], speed: [26, 40], zMax: 0.55 },
    ],
  },
  salvia: {
    layers: [
      {
        type: "petal",
        count: 36,
        size: [9, 20],
        speed: [20, 46],
        colors: [
          ["#f3ead8", "#fffdf6", "rgba(140,125,90,0.4)"],
          ["#ffffff", "#fbf7ec", "rgba(130,125,100,0.4)"],
          ["#e9e2cc", "#fbf8ee", "rgba(120,110,80,0.4)"],
        ],
        alpha: [0.7, 1],
        sway: 24,
        wind: 5,
        spin: 1.3,
        dir: "down",
      },
      butterflies(
        7,
        [
          ["rgba(255,255,255,0.98)", "rgba(214,228,206,0.95)", "rgba(96,120,96,0.55)"],
          ["rgba(255,255,250,0.98)", "rgba(236,232,206,0.95)", "rgba(120,116,80,0.5)"],
        ],
        "#3d4a3a",
      ),
      glint(10, "226,190,104", { zMax: 0.6, size: [7, 13], alpha: [0.5, 0.95] }),
    ],
  },
  atardecer: {
    rays: { x: 195, y: 452, count: 11, len: 620, w: 0.06, a0: 3.35, a1: 6.07, color: "255,206,140", alpha: 0.16, glow: 150 },
    layers: [
      { type: "speck", count: 46, size: [1.6, 4], speed: [8, 20], colors: ["#f7d58e", "#e9b65a", "#fff0c8", "#d99a4a"], alpha: [0.55, 1], sway: 8, spin: 2, dir: "down" },
      {
        type: "petal",
        count: 20,
        size: [9, 19],
        speed: [18, 40],
        colors: [
          ["#f2a77f", "#fde0cc", "rgba(170,90,50,0.35)"],
          ["#f7c49c", "#fff0e2", "rgba(170,100,60,0.3)"],
          ["#eebd8f", "#fbe6d0", "rgba(160,95,50,0.3)"],
        ],
        alpha: [0.6, 0.98],
        sway: 22,
        wind: 4,
        spin: 1.2,
        dir: "down",
      },
      { type: "bokeh", count: 8, zMin: 0, zMax: 0.45, size: [40, 90], speed: [3, 7], colors: ["255,196,120"], alpha: [0.06, 0.14], dir: "float" },
    ],
  },
  tulipanes: {
    rays: { x: 20, y: -40, count: 6, len: 760, w: 0.05, a0: 0.75, a1: 1.4, color: "255,244,200", alpha: 0.12 },
    layers: [
      butterflies(
        9,
        [
          ["rgba(255,252,236,0.97)", "rgba(246,206,72,0.95)", "rgba(150,110,20,0.55)"],
          ["rgba(255,255,255,0.98)", "rgba(250,226,130,0.95)", "rgba(160,120,30,0.5)"],
          ["rgba(255,255,255,0.98)", "rgba(255,255,255,0.95)", "rgba(120,110,80,0.5)"],
        ],
        "#4a3b12",
        { size: [20, 38], sway: 26 },
      ),
      {
        type: "petal",
        count: 22,
        size: [8, 16],
        speed: [20, 44],
        colors: [
          ["#ffffff", "#fffbea", "rgba(150,130,80,0.4)"],
          ["#fff3c4", "#fffdf0", "rgba(170,140,60,0.35)"],
        ],
        alpha: [0.7, 1],
        sway: 24,
        wind: 8,
        spin: 1.4,
        dir: "down",
      },
      glint(12, "240,196,60"),
    ],
  },
  buganvilias: {
    layers: [
      {
        type: "petal",
        count: 40,
        size: [9, 20],
        speed: [22, 50],
        colors: [
          ["#d61f7f", "#f58cc0", "rgba(120,10,70,0.35)"],
          ["#e8409a", "#fbb3d6", "rgba(130,20,80,0.3)"],
          ["#b8166a", "#ef6fb0", "rgba(100,10,60,0.35)"],
          ["#f06aae", "#fdd0e6", "rgba(140,30,90,0.3)"],
        ],
        alpha: [0.62, 1],
        sway: 26,
        wind: 7,
        spin: 1.6,
        dir: "down",
      },
      glint(12, "236,190,92"),
      butterflies(
        5,
        [
          ["rgba(255,250,252,0.97)", "rgba(236,120,176,0.95)", "rgba(140,40,90,0.5)"],
          ["rgba(255,255,255,0.97)", "rgba(250,170,210,0.95)", "rgba(150,50,100,0.5)"],
        ],
        "#4f0c35",
        { size: [20, 34] },
      ),
    ],
  },
} satisfies Record<string, EffectConfig>;
