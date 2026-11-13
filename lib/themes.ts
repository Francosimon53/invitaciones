/**
 * Estilos de la invitación. Todos comparten el diseño de «Noche invernal»; los demás son el mismo diseño
 * recoloreado en OKLCH (scripts/themes/recolor.py genera public/themes/<tema>.css y sus imágenes).
 * Los colores de la portada y de la nieve salen de scripts/themes/palette.json.
 */
import type { Lang } from "./i18n";

export const THEME_KEYS = ["azul", "lila", "rosa", "esmeralda"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

export interface Theme {
  key: ThemeKey;
  /** Nombre del estilo en el pedido y en los paneles. */
  label: string;
  /** Colores en palabras, para el pedido y las fichas. */
  colors: string;
  /** Nombre y colores en inglés, para el pedido en inglés. */
  labelEn: string;
  colorsEn: string;
  title: Record<Lang, string>;
  header: Record<Lang, string>;
  envelopeAlt: Record<Lang, string>;
  palaceAlt: Record<Lang, string>;
  stepsAlt: Record<Lang, string>;
  /** Nota de vestimenta por defecto (el color reservado para la quinceañera). */
  attire: Record<Lang, string>;
  og: { background: string; label: string; name: string; note: string };
  themeColor: string;
  /** Colores "r,g,b" de la nieve y de los fuegos artificiales. */
  snow: { stroke: string; fill: string; sparkA: string; sparkB: string };
}

export const THEMES: Record<ThemeKey, Theme> = {
  azul: {
    key: "azul",
    label: "Noche invernal",
    colors: "Azul marino y plata",
    labelEn: "Winter Night",
    colorsEn: "Navy blue and silver",
    title: { es: "Una noche invernal", en: "A winter night" },
    header: { es: "UNA NOCHE INVERNAL", en: "A WINTER NIGHT" },
    envelopeAlt: {
      es: "Sobre rectangular azul medianoche con filigrana plateada y un sello de copo de nieve con zafiro",
      en: "Rectangular midnight-blue envelope with silver filigree and a sapphire snowflake seal",
    },
    palaceAlt: {
      es: "Un castillo iluminado en una noche invernal, entre árboles nevados y luces",
      en: "An illuminated castle on a winter night, framed by snow-covered trees and lights",
    },
    stepsAlt: { es: "Escalinata nevada hacia el castillo", en: "Snowy steps leading to the palace" },
    attire: {
      es: "Por favor, reserva el azul marino y el plateado para la quinceañera.",
      en: "Kindly reserve navy blue and silver for the birthday girl.",
    },
    og: { background: "#06152d", label: "#bbcee6", name: "#f1f5fc", note: "#d4e3f7" },
    themeColor: "#07172f",
    snow: { stroke: "22,49,83", fill: "248,253,255", sparkA: "169,211,255", sparkB: "237,246,255" },
  },
  lila: {
    key: "lila",
    label: "Sueño lila",
    colors: "Lila y plata",
    labelEn: "Lilac Dream",
    colorsEn: "Lilac and silver",
    title: { es: "Un sueño lila", en: "A lilac dream" },
    header: { es: "UN SUEÑO LILA", en: "A LILAC DREAM" },
    envelopeAlt: {
      es: "Sobre rectangular morado con filigrana plateada y un sello de copo de nieve con amatista",
      en: "Rectangular purple envelope with silver filigree and an amethyst snowflake seal",
    },
    palaceAlt: {
      es: "Un castillo iluminado en una noche lila, entre árboles nevados y luces",
      en: "An illuminated castle on a lilac night, framed by snow-covered trees and lights",
    },
    stepsAlt: { es: "Escalinata nevada hacia el castillo", en: "Snowy steps leading to the palace" },
    attire: {
      es: "Por favor, reserva el lila y el plateado para la quinceañera.",
      en: "Kindly reserve lilac and silver for the birthday girl.",
    },
    og: { background: "#1d102c", label: "#d0c7e3", name: "#f6f3fb", note: "#e4ddf4" },
    themeColor: "#1f122e",
    snow: { stroke: "59,41,81", fill: "252,251,255", sparkA: "214,196,250", sparkB: "246,243,254" },
  },
  rosa: {
    key: "rosa",
    label: "Noche encantada",
    colors: "Rosa y plata rosada",
    labelEn: "Enchanted Night",
    colorsEn: "Pink and rose silver",
    title: { es: "Una noche encantada", en: "An enchanted night" },
    header: { es: "NOCHE ENCANTADA", en: "ENCHANTED NIGHT" },
    envelopeAlt: {
      es: "Sobre rectangular rosa vino con filigrana plateada y un sello de copo de nieve con rubí",
      en: "Rectangular rose-wine envelope with silver filigree and a ruby snowflake seal",
    },
    palaceAlt: {
      es: "Un castillo iluminado en una noche rosa, entre árboles nevados y luces",
      en: "An illuminated castle on a pink night, framed by snow-covered trees and lights",
    },
    stepsAlt: { es: "Escalinata nevada hacia el castillo", en: "Snowy steps leading to the palace" },
    attire: {
      es: "Por favor, reserva el rosa para la quinceañera.",
      en: "Kindly reserve pink for the birthday girl.",
    },
    og: { background: "#2b0d1c", label: "#f0bcc6", name: "#ffebed", note: "#ffd3db" },
    themeColor: "#2d0f1d",
    snow: { stroke: "79,36,56", fill: "255,246,247", sparkA: "255,181,202", sparkB: "255,234,237" },
  },
  esmeralda: {
    key: "esmeralda",
    label: "Noche esmeralda",
    colors: "Verde esmeralda y dorado",
    labelEn: "Emerald Night",
    colorsEn: "Emerald green and gold",
    title: { es: "Una noche esmeralda", en: "An emerald night" },
    header: { es: "NOCHE ESMERALDA", en: "EMERALD NIGHT" },
    envelopeAlt: {
      es: "Sobre rectangular verde esmeralda con filigrana dorada y un sello de copo de nieve con esmeralda",
      en: "Rectangular emerald-green envelope with gold filigree and an emerald snowflake seal",
    },
    palaceAlt: {
      es: "Un castillo iluminado en una noche esmeralda, entre árboles nevados y luces",
      en: "An illuminated castle on an emerald night, framed by snow-covered trees and lights",
    },
    stepsAlt: { es: "Escalinata nevada hacia el castillo", en: "Snowy steps leading to the palace" },
    attire: {
      es: "Por favor, reserva el verde esmeralda y el dorado para la quinceañera.",
      en: "Kindly reserve emerald green and gold for the birthday girl.",
    },
    og: { background: "#001c11", label: "#d2d096", name: "#fff5be", note: "#ebe4a9" },
    themeColor: "#001e13",
    snow: { stroke: "0,59,42", fill: "255,252,215", sparkA: "201,215,147", sparkB: "255,245,190" },
  },
};

export function asTheme(value: unknown): ThemeKey | null {
  return typeof value === "string" && (THEME_KEYS as readonly string[]).includes(value) ? (value as ThemeKey) : null;
}

/** Recurso público de un estilo: /themes/<tema>/<archivo>. */
export function themeAsset(key: ThemeKey, file: "palacio.webp" | "sobre.webp" | "favicon.svg"): string {
  return `/themes/${key}/${file}`;
}

export function themeCss(key: ThemeKey): string {
  return `/themes/${key}.css`;
}
