/**
 * Estilos de la invitación. Todos comparten el diseño de «Noche invernal»; los demás son el mismo diseño
 * recoloreado en OKLCH (scripts/themes/recolor.py genera public/themes/<tema>.css y sus imágenes).
 * Los colores de la portada y de los fuegos artificiales salen de scripts/themes/palette.json.
 *
 * Tres familias: los cuatro de invierno (nieve), siete de noche con movimiento propio y ocho de día
 * (castillo de primavera, sobre claro y textos oscuros). El movimiento de cada uno está en lib/effects.ts.
 */
import type { Lang } from "./i18n";
import palette from "@/scripts/themes/palette.json";

export const WINTER_KEYS = ["azul", "lila", "rosa", "esmeralda"] as const;
export const NIGHT_KEYS = ["petalos", "rosas", "aurora", "luciernagas", "mariposas", "linternas", "oro"] as const;
export const DAY_KEYS = ["rosapalo", "cerezos", "lavanda", "azulcielo", "salvia", "atardecer", "tulipanes", "buganvilias"] as const;
export const THEME_KEYS = [...WINTER_KEYS, ...NIGHT_KEYS, ...DAY_KEYS] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

/** Grupos para elegir estilo (pedido, panel de Simón y portada del sitio). */
export const THEME_GROUPS: { key: string; label: Record<Lang, string>; themes: readonly ThemeKey[] }[] = [
  { key: "invierno", label: { es: "Noche de invierno, con nieve", en: "Winter night, with snowfall" }, themes: WINTER_KEYS },
  { key: "noche", label: { es: "De noche, con magia propia", en: "Night, with its own magic" }, themes: NIGHT_KEYS },
  { key: "dia", label: { es: "De día, en primavera", en: "Daytime, in spring" }, themes: DAY_KEYS },
];

export interface Theme {
  key: ThemeKey;
  /** Los de día llevan textos oscuros sobre fondo claro. */
  mode: "night" | "day";
  /** Lo que se mueve, en palabras: «Pausar nieve», «Pausar pétalos»… */
  motion: Record<Lang, string>;
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
  og: { background: string; label: string; name: string; note: string; shadow?: string };
  themeColor: string;
  /** Colores "r,g,b" de la nieve y de los fuegos artificiales. */
  snow: { stroke: string; fill: string; sparkA: string; sparkB: string };
}

const SNOW: Pick<Theme, "mode" | "motion"> = { mode: "night", motion: { es: "nieve", en: "snowfall" } };

type Words = Record<Lang, string>;

interface NewTheme {
  key: Exclude<ThemeKey, (typeof WINTER_KEYS)[number]>;
  mode: "night" | "day";
  label: Words;
  colors: Words;
  title: Words;
  motion: Words;
  /** «Sobre rectangular <esto>». */
  envelope: Words;
  /** «Un castillo <esto>». */
  palace: Words;
  /** Colores reservados para la quinceañera: «reserva <esto> para la quinceañera». */
  reserve: Words;
}

/** Los estilos nuevos se describen en corto; los colores salen de la paleta generada. */
function make(n: NewTheme): Theme {
  const c = palette[n.key];
  const day = n.mode === "day";
  return {
    key: n.key,
    mode: n.mode,
    motion: n.motion,
    label: n.label.es,
    colors: n.colors.es,
    labelEn: n.label.en,
    colorsEn: n.colors.en,
    title: n.title,
    header: { es: n.title.es.toLocaleUpperCase("es"), en: n.title.en.toLocaleUpperCase("en") },
    envelopeAlt: { es: `Sobre rectangular ${n.envelope.es}`, en: `Rectangular ${n.envelope.en}` },
    palaceAlt: { es: `Un castillo ${n.palace.es}`, en: `A castle ${n.palace.en}` },
    stepsAlt: day
      ? { es: "Escalinata con faroles hacia el castillo", en: "Lantern-lined steps leading to the castle" }
      : { es: "Escalinata nevada hacia el castillo", en: "Snowy steps leading to the palace" },
    attire: {
      es: `Por favor, reserva ${n.reserve.es} para la quinceañera.`,
      en: `Kindly reserve ${n.reserve.en} for the birthday girl.`,
    },
    og: { background: c.ogBackground, label: c.ogLabel, name: c.ogName, note: c.ogNote, shadow: day ? "0 1px 6px rgba(255,255,255,0.8)" : undefined },
    themeColor: c.themeColor,
    snow: { stroke: c.snowStroke, fill: c.snowFill, sparkA: c.sparkA, sparkB: c.sparkB },
  };
}

const NEW: NewTheme[] = [
  {
    key: "petalos",
    mode: "night",
    label: { es: "Lluvia de pétalos", en: "Petal Rain" },
    colors: { es: "Rosa y dorado", en: "Rose and gold" },
    title: { es: "Lluvia de pétalos", en: "Petal rain" },
    motion: { es: "pétalos", en: "petals" },
    envelope: { es: "rosa ciruela con filigrana rosada y un broche de cristal con rubí", en: "plum-rose envelope with rose filigree and a ruby crystal brooch" },
    palace: { es: "iluminado en una noche rosa, bajo una lluvia de pétalos", en: "glowing on a rose-coloured night under falling petals" },
    reserve: { es: "el rosa y el dorado", en: "pink and gold" },
  },
  {
    key: "rosas",
    mode: "night",
    label: { es: "Rosas de medianoche", en: "Midnight Roses" },
    colors: { es: "Rojo vino y dorado", en: "Wine red and gold" },
    title: { es: "Rosas de medianoche", en: "Midnight roses" },
    motion: { es: "pétalos", en: "petals" },
    envelope: { es: "rojo vino con filigrana dorada y un broche de cristal con rubí", en: "wine-red envelope with gold filigree and a ruby crystal brooch" },
    palace: { es: "iluminado en una noche carmesí, entre pétalos de rosa", en: "glowing on a crimson night among rose petals" },
    reserve: { es: "el rojo vino y el dorado", en: "wine red and gold" },
  },
  {
    key: "aurora",
    mode: "night",
    label: { es: "Aurora boreal", en: "Northern Lights" },
    colors: { es: "Azul noche y verde aurora", en: "Night blue and aurora green" },
    title: { es: "Aurora boreal", en: "Northern lights" },
    motion: { es: "auroras", en: "northern lights" },
    envelope: { es: "azul petróleo con filigrana plateada y un broche de cristal con zafiro", en: "deep-teal envelope with silver filigree and a sapphire crystal brooch" },
    palace: { es: "iluminado bajo la aurora boreal, entre árboles nevados", en: "glowing under the northern lights, framed by snow-covered trees" },
    reserve: { es: "el azul noche y el plateado", en: "night blue and silver" },
  },
  {
    key: "luciernagas",
    mode: "night",
    label: { es: "Jardín de luciérnagas", en: "Firefly Garden" },
    colors: { es: "Verde bosque y dorado", en: "Forest green and gold" },
    title: { es: "Jardín de luciérnagas", en: "Firefly garden" },
    motion: { es: "luciérnagas", en: "fireflies" },
    envelope: { es: "verde bosque con filigrana dorada y un broche de cristal con esmeralda", en: "forest-green envelope with gold filigree and an emerald crystal brooch" },
    palace: { es: "iluminado en una noche verde, entre luciérnagas", en: "glowing on a green night among fireflies" },
    reserve: { es: "el verde bosque y el dorado", en: "forest green and gold" },
  },
  {
    key: "mariposas",
    mode: "night",
    label: { es: "Vuelo de mariposas", en: "Butterfly Flight" },
    colors: { es: "Azul acero y plata", en: "Steel blue and silver" },
    title: { es: "Vuelo de mariposas", en: "Butterfly flight" },
    motion: { es: "mariposas", en: "butterflies" },
    envelope: { es: "azul acero con filigrana plateada y un broche de cristal con zafiro", en: "steel-blue envelope with silver filigree and a sapphire crystal brooch" },
    palace: { es: "iluminado en una noche azul, entre mariposas", en: "glowing on a blue night among butterflies" },
    reserve: { es: "el azul acero y el plateado", en: "steel blue and silver" },
  },
  {
    key: "linternas",
    mode: "night",
    label: { es: "Noche de linternas", en: "Lantern Night" },
    colors: { es: "Morado y ámbar", en: "Purple and amber" },
    title: { es: "Noche de linternas", en: "Lantern night" },
    motion: { es: "linternas", en: "lanterns" },
    envelope: { es: "morado con filigrana dorada y un broche de cristal con amatista", en: "purple envelope with gold filigree and an amethyst crystal brooch" },
    palace: { es: "iluminado en una noche morada, entre linternas que suben al cielo", en: "glowing on a purple night as lanterns rise into the sky" },
    reserve: { es: "el morado y el dorado", en: "purple and gold" },
  },
  {
    key: "oro",
    mode: "night",
    label: { es: "Polvo de oro", en: "Golden Dust" },
    colors: { es: "Negro y dorado", en: "Black and gold" },
    title: { es: "Polvo de oro", en: "Golden dust" },
    motion: { es: "polvo de oro", en: "gold dust" },
    envelope: { es: "negro con filigrana dorada y un broche de cristal", en: "black envelope with gold filigree and a crystal brooch" },
    palace: { es: "iluminado en una noche negra y dorada, bajo polvo de oro", en: "glowing on a black-and-gold night under falling gold dust" },
    reserve: { es: "el negro y el dorado", en: "black and gold" },
  },
  {
    key: "rosapalo",
    mode: "day",
    label: { es: "Rosa palo y dorado", en: "Blush & Gold" },
    colors: { es: "Rosa palo y dorado", en: "Blush pink and gold" },
    title: { es: "Un jardín rosa palo", en: "A blush garden" },
    motion: { es: "pétalos", en: "petals" },
    envelope: { es: "rosa palo con filigrana dorada y un broche dorado", en: "blush-pink envelope with gold filigree and a gold brooch" },
    palace: { es: "de día entre árboles en flor, con una escalinata de faroles y rosas", en: "in daylight among blossoming trees, with a lantern-lined staircase and roses" },
    reserve: { es: "el rosa palo y el dorado", en: "blush pink and gold" },
  },
  {
    key: "cerezos",
    mode: "day",
    label: { es: "Cerezos en flor", en: "Cherry Blossom" },
    colors: { es: "Rosa cerezo y blanco", en: "Cherry pink and white" },
    title: { es: "Cerezos en flor", en: "Cherry blossom" },
    motion: { es: "pétalos", en: "petals" },
    envelope: { es: "rosa claro con filigrana rosada y un broche con rubí", en: "pale-pink envelope with rose filigree and a ruby brooch" },
    palace: { es: "de día entre cerezos en flor, con una escalinata cubierta de pétalos", en: "in daylight among cherry trees in bloom, with a petal-covered staircase" },
    reserve: { es: "el rosa cerezo", en: "cherry pink" },
  },
  {
    key: "lavanda",
    mode: "day",
    label: { es: "Lavanda y glicinias", en: "Lavender & Wisteria" },
    colors: { es: "Lavanda y dorado", en: "Lavender and gold" },
    title: { es: "Lavanda y glicinias", en: "Lavender and wisteria" },
    motion: { es: "pétalos", en: "petals" },
    envelope: { es: "lavanda claro con filigrana dorada y un broche dorado", en: "pale-lavender envelope with gold filigree and a gold brooch" },
    palace: { es: "de día entre glicinias y lavanda, con una escalinata de faroles", en: "in daylight among wisteria and lavender, with a lantern-lined staircase" },
    reserve: { es: "el lavanda y el dorado", en: "lavender and gold" },
  },
  {
    key: "azulcielo",
    mode: "day",
    label: { es: "Azul cielo y plata", en: "Sky Blue & Silver" },
    colors: { es: "Azul cielo y plata", en: "Sky blue and silver" },
    title: { es: "Bajo el cielo azul", en: "Under a blue sky" },
    motion: { es: "pétalos", en: "petals" },
    envelope: { es: "azul muy claro con filigrana plateada y un broche con zafiro", en: "pale-blue envelope with silver filigree and a sapphire brooch" },
    palace: { es: "de día con torres azules, fuentes y hortensias", en: "in daylight with blue spires, fountains and hydrangeas" },
    reserve: { es: "el azul cielo y el plateado", en: "sky blue and silver" },
  },
  {
    key: "salvia",
    mode: "day",
    label: { es: "Jardín salvia", en: "Sage Garden" },
    colors: { es: "Verde salvia y marfil", en: "Sage green and ivory" },
    title: { es: "Un jardín salvia", en: "A sage garden" },
    motion: { es: "mariposas", en: "butterflies" },
    envelope: { es: "verde muy claro con filigrana dorada y un broche con esmeralda", en: "pale-green envelope with gold filigree and an emerald brooch" },
    palace: { es: "de día en un jardín verde con rosas blancas y un arco de flores", en: "in daylight in a green garden with white roses and a flower arch" },
    reserve: { es: "el verde salvia", en: "sage green" },
  },
  {
    key: "atardecer",
    mode: "day",
    label: { es: "Atardecer dorado", en: "Golden Hour" },
    colors: { es: "Durazno y dorado", en: "Peach and gold" },
    title: { es: "Atardecer dorado", en: "Golden hour" },
    motion: { es: "destellos", en: "sparkles" },
    envelope: { es: "durazno claro con filigrana dorada y un broche dorado", en: "pale-peach envelope with gold filigree and a gold brooch" },
    palace: { es: "al atardecer, con el cielo dorado y una escalinata de flores", en: "at sunset, under a golden sky with a flower-lined staircase" },
    reserve: { es: "el durazno y el dorado", en: "peach and gold" },
  },
  {
    key: "tulipanes",
    mode: "day",
    label: { es: "Tulipanes amarillos", en: "Yellow Tulips" },
    colors: { es: "Amarillo y blanco", en: "Yellow and white" },
    title: { es: "Tulipanes amarillos", en: "Yellow tulips" },
    motion: { es: "mariposas", en: "butterflies" },
    envelope: { es: "amarillo muy claro con filigrana dorada y un broche dorado", en: "pale-yellow envelope with gold filigree and a gold brooch" },
    palace: { es: "de día con torres amarillas, entre tulipanes y flores blancas", en: "in daylight with yellow spires, among tulips and white flowers" },
    reserve: { es: "el amarillo", en: "yellow" },
  },
  {
    key: "buganvilias",
    mode: "day",
    label: { es: "Buganvilias fucsia", en: "Fuchsia Bougainvillea" },
    colors: { es: "Fucsia y dorado", en: "Fuchsia and gold" },
    title: { es: "Buganvilias en flor", en: "Bougainvillea in bloom" },
    motion: { es: "pétalos", en: "petals" },
    envelope: { es: "rosa muy claro con filigrana dorada y un broche con rubí", en: "pale-pink envelope with gold filigree and a ruby brooch" },
    palace: { es: "de día con torres fucsia, entre buganvilias en flor", en: "in daylight with fuchsia spires, among bougainvillea in bloom" },
    reserve: { es: "el fucsia", en: "fuchsia" },
  },
];

export const THEMES: Record<ThemeKey, Theme> = {
  azul: {
    key: "azul",
    ...SNOW,
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
    ...SNOW,
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
    ...SNOW,
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
    ...SNOW,
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
  ...(Object.fromEntries(NEW.map((n) => [n.key, make(n)])) as Record<NewTheme["key"], Theme>),
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
