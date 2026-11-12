import { createHash } from "node:crypto";
import type { Lang } from "./i18n";
import type { ThemeKey } from "./themes";

const DEFAULT_GUEST: Record<Lang, string> = { es: "Familia invitada", en: "Our special guests" };

/** Nombre que lleva el sobre: el del invitado o el genérico ("Familia invitada" / "Our special guests"). */
export function coverName(forName: string | null | undefined, lang: Lang): string {
  const clean = (forName ?? "").replace(/\s+/g, " ").trim();
  return clean || DEFAULT_GUEST[lang];
}

export interface CoverInput {
  theme: ThemeKey;
  honoree: string;
  forName: string | null;
  lang: Lang;
}

/** Versión corta: cambia si cambia cualquier cosa que se ve en la portada, así ningún caché sirve una vieja. */
export function coverVersion(c: CoverInput): string {
  return createHash("sha1").update(`${c.theme}|${c.honoree}|${c.lang}|${coverName(c.forName, c.lang)}`).digest("hex").slice(0, 8);
}

/** Archivo en el bucket inv-covers: <evento>/<nombre>-<versión>.jpg */
export function guestCoverObject(slug: string, token: string, c: CoverInput): string {
  return `${slug}/${token}-${coverVersion(c)}.jpg`;
}

export function generalCoverObject(slug: string, c: CoverInput): string {
  return `${slug}/general-${c.lang}-${coverVersion(c)}.jpg`;
}
