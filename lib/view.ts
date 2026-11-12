/**
 * Todo lo que la invitación necesita en el navegador, calculado en el servidor (textos de los dos idiomas incluidos).
 */
import type { EventData } from "./event";
import { directionsUrl, eventTitle, googleCalendarUrl, phoneE164 } from "./event";
import { buildStrings, LANGS, type Lang, type Strings } from "./i18n";
import { THEMES, themeAsset, type ThemeKey } from "./themes";
import { SHOP_URL } from "./site";

export interface InvitationView {
  /** Ruta base de la invitación ("valentina-xv-7k2m" o "demo/lila"). */
  base: string;
  slug: string;
  theme: ThemeKey;
  /** Muestra o vista previa: la confirmación se simula y no se guarda. */
  mode: "live" | "demo" | "preview";
  monogram: string;
  honoree: string;
  honoreeUpper: string;
  startMs: number;
  deadlineMs: number;
  venueUpper: string;
  venue: string;
  addressLine1: string;
  addressLine2: string;
  phone: string | null;
  phoneHref: string | null;
  directionsUrl: string;
  calendar: Record<Lang, { google: string; ics: string }>;
  strings: Record<Lang, Strings>;
  images: { palace: string; envelope: string };
  music: string;
  snow: { stroke: string; fill: string; sparkA: string; sparkB: string };
  creditUrl: string | null;
}

export function eventDetails(ev: EventData, s: Strings): string {
  return `${s.dressTitle}. ${s.attireNote}`;
}

export function buildView(ev: EventData, mode: InvitationView["mode"], base: string): InvitationView {
  const t = THEMES[ev.theme];
  const strings = { es: buildStrings("es", ev), en: buildStrings("en", ev) };
  const calendar = {} as InvitationView["calendar"];
  for (const lang of LANGS) {
    const title = eventTitle(ev, t.title[lang], lang);
    calendar[lang] = {
      google: googleCalendarUrl(ev, title, eventDetails(ev, strings[lang])),
      ics: `/${base}/calendario?lang=${lang}`,
    };
  }
  return {
    base,
    slug: ev.slug,
    theme: ev.theme,
    mode,
    monogram: ev.monogram,
    honoree: ev.honoree,
    honoreeUpper: ev.honoree.toLocaleUpperCase("es"),
    startMs: Date.parse(ev.startsAt),
    deadlineMs: Date.parse(ev.rsvpDeadline),
    venueUpper: ev.venue.toLocaleUpperCase("es"),
    venue: ev.venue,
    addressLine1: ev.addressLine1,
    addressLine2: ev.addressLine2,
    phone: ev.phone,
    phoneHref: phoneE164(ev.phone),
    directionsUrl: directionsUrl(ev),
    calendar,
    strings,
    images: { palace: themeAsset(ev.theme, "palacio.webp"), envelope: themeAsset(ev.theme, "sobre.webp") },
    music: "/audio/musica.mp3",
    snow: t.snow,
    creditUrl: ev.credit && SHOP_URL ? SHOP_URL : null,
  };
}
