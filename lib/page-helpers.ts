import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getEvent, getGuest, getRsvp } from "./db";
import { asLang, langFromAcceptLanguage, LANG_CHOICE_COOKIE, type Lang } from "./i18n";
import { RSVP_COOKIE } from "./reservation";

/** Una sola consulta por petición aunque la pidan los metadatos y la página. */
export const loadEvent = cache((slug: string, previewKey: string | null) => getEvent(slug, previewKey));
export const loadGuest = cache((slug: string, token: string) => getGuest(slug, token));

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function first(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
}

/** Idioma de quien abre: lo que eligió en el selector ES/EN → el de su teléfono → el que se indique. */
export async function visitorLang(): Promise<Lang | null> {
  const [jar, hdrs] = await Promise.all([cookies(), headers()]);
  return asLang(jar.get(LANG_CHOICE_COOKIE)?.value) ?? langFromAcceptLanguage(hdrs.get("accept-language"));
}

/** La respuesta que ya se dio desde este teléfono para este evento (cookie httpOnly). */
export async function ownRsvp(slug: string) {
  const id = (await cookies()).get(RSVP_COOKIE)?.value ?? "";
  return id ? getRsvp(slug, id) : null;
}
