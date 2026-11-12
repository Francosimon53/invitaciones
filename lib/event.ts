/**
 * Datos de un evento (una quinceañera) y todo lo que se calcula con ellos: fechas en la zona horaria del salón,
 * enlaces de mapa y calendario, y el archivo .ics. Lo usan el servidor y el navegador.
 */
import type { Lang } from "./i18n";
import type { ThemeKey } from "./themes";

export interface EventTexts {
  attire?: Partial<Record<Lang, string>>;
  poem?: Partial<Record<Lang, string>>;
  story?: Partial<Record<Lang, string>>;
}

export interface EventData {
  id: string;
  slug: string;
  status: "borrador" | "publicada" | "archivada";
  theme: ThemeKey;
  /** Idioma principal de los invitados: el de la vista previa del enlace general. */
  lang: Lang;
  honoree: string;
  monogram: string;
  /** Instantes ISO (con zona). */
  startsAt: string;
  endsAt: string;
  timeZone: string;
  venue: string;
  addressLine1: string;
  addressLine2: string;
  /** "Houston, Texas": va en «Hora local de …». */
  cityLabel: string;
  phone: string | null;
  /** Se aceptan respuestas antes de este instante (medianoche local del día que ve el invitado). */
  rsvpDeadline: string;
  texts: EventTexts;
  /** Línea discreta «Pide la tuya» al final de la invitación. */
  credit: boolean;
  /** Portadas generales ya subidas al bucket inv-covers, por idioma. */
  coverPaths: Partial<Record<Lang, string>>;
}

export const TIME_ZONES: { id: string; label: string }[] = [
  { id: "America/New_York", label: "Este (Florida, Nueva York, Georgia…)" },
  { id: "America/Chicago", label: "Centro (Texas, Illinois…)" },
  { id: "America/Denver", label: "Montaña (Colorado, Nuevo México…)" },
  { id: "America/Phoenix", label: "Arizona (sin horario de verano)" },
  { id: "America/Los_Angeles", label: "Pacífico (California, Nevada…)" },
  { id: "America/Anchorage", label: "Alaska" },
  { id: "Pacific/Honolulu", label: "Hawái" },
  { id: "America/Puerto_Rico", label: "Puerto Rico" },
];

const ms = (iso: string) => Date.parse(iso);

export function rsvpIsOpen(ev: Pick<EventData, "rsvpDeadline">, now: number = Date.now()): boolean {
  return now < ms(ev.rsvpDeadline);
}

function parts(iso: string, timeZone: string, locale: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { timeZone, ...opts }).formatToParts(new Date(ms(iso)));
}

function part(list: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return list.find((p) => p.type === type)?.value ?? "";
}

/** "15 · MAY · 2027" (es) / "MAY · 15 · 2027" (en): sin ambigüedad entre día y mes. */
export function dateLabel(ev: Pick<EventData, "startsAt" | "timeZone">, lang: Lang): string {
  const p = parts(ev.startsAt, ev.timeZone, lang === "es" ? "es-US" : "en-US", { day: "numeric", month: "short", year: "numeric" });
  const mon = part(p, "month").replace(/\./g, "").toLocaleUpperCase(lang);
  return lang === "es" ? `${part(p, "day")} · ${mon} · ${part(p, "year")}` : `${mon} · ${part(p, "day")} · ${part(p, "year")}`;
}

/** "Sábado, 15 de mayo de 2027" / "Saturday, May 15, 2027" (mensajes de WhatsApp y paneles). */
export function longDate(ev: Pick<EventData, "startsAt" | "timeZone">, lang: Lang): string {
  const s = new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    timeZone: ev.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(ms(ev.startsAt)));
  return s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);
}

/** "sábado" / "Saturday". */
export function dayName(ev: Pick<EventData, "startsAt" | "timeZone">, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", { timeZone: ev.timeZone, weekday: "long" }).format(new Date(ms(ev.startsAt)));
}

function clock(iso: string, timeZone: string): string {
  // espacio normal antes de AM/PM (algunos motores ponen un espacio fino que no todas las fuentes tienen)
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(ms(iso)))
    .replace(/[\u202f\u00a0]/g, " ");
}

/** "7:00 PM — 12:00 AM". */
export function timeRange(ev: Pick<EventData, "startsAt" | "endsAt" | "timeZone">): string {
  return `${clock(ev.startsAt, ev.timeZone)} — ${clock(ev.endsAt, ev.timeZone)}`;
}

/** Día del cierre tal como lo ve el invitado: "1 de mayo de 2027" / "May 1, 2027". */
export function deadlineLabel(ev: Pick<EventData, "rsvpDeadline" | "timeZone">, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    timeZone: ev.timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(ms(ev.rsvpDeadline)));
}

export function fullAddress(ev: Pick<EventData, "venue" | "addressLine1" | "addressLine2">): string {
  return [ev.venue, ev.addressLine1, ev.addressLine2].filter(Boolean).join(", ");
}

export function eventTitle(ev: Pick<EventData, "honoree">, themeTitle: string, lang: Lang): string {
  return lang === "es" ? `Los 15 de ${ev.honoree} · ${themeTitle}` : `${ev.honoree}’s 15th Birthday · ${themeTitle}`;
}

export function directionsUrl(ev: Pick<EventData, "venue" | "addressLine1" | "addressLine2">): string {
  const u = new URL("https://www.google.com/maps/dir/");
  u.search = new URLSearchParams({ api: "1", destination: fullAddress(ev), travelmode: "driving" }).toString();
  return u.href;
}

function utcStamp(iso: string): string {
  return new Date(ms(iso)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function googleCalendarUrl(ev: EventData, title: string, details: string): string {
  const u = new URL("https://calendar.google.com/calendar/r/eventedit");
  u.search = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${utcStamp(ev.startsAt)}/${utcStamp(ev.endsAt)}`,
    stz: ev.timeZone,
    etz: ev.timeZone,
    location: fullAddress(ev),
    details,
  }).toString();
  return u.href;
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

const enc = new TextEncoder();

/** Pliega líneas largas a 75 octetos como pide RFC 5545. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (enc.encode(cur + ch).length > 73) {
      out.push(cur);
      cur = " " + ch;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.join("\r\n");
}

export function buildIcs(ev: EventData, title: string, details: string, url: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Invitaciones//XV//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.slug}@invitaciones`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${utcStamp(ev.startsAt)}`,
    `DTEND:${utcStamp(ev.endsAt)}`,
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${icsEscape(details + "\n" + url)}`,
    `LOCATION:${icsEscape(fullAddress(ev))}`,
    `URL:${url}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Teléfono para el enlace tel: (+1 si son 10 dígitos de EE. UU.). */
export function phoneE164(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits.length >= 8 ? `+${digits}` : null;
}

// ---------------------------------------------------------------- zonas horarias (formularios del panel)

function tzOffsetMs(utcMs: number, timeZone: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const g = (t: Intl.DateTimeFormatPartTypes) => Number(part(p, t));
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second")) - utcMs;
}

/** "2027-05-15" + "19:00" en America/Chicago → instante UTC (ms). Corrige el horario de verano. */
export function zonedToUtcMs(date: string, time: string, timeZone: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  let guess = wall;
  for (let i = 0; i < 4; i++) {
    const next = wall - tzOffsetMs(guess, timeZone);
    if (next === guess) break;
    guess = next;
  }
  return guess;
}

/** Instante ISO → { date: "2027-05-15", time: "19:00" } en la zona del evento (para rellenar formularios). */
export function utcToZoned(iso: string, timeZone: string): { date: string; time: string } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(ms(iso)));
  return { date: `${part(p, "year")}-${part(p, "month")}-${part(p, "day")}`, time: `${part(p, "hour")}:${part(p, "minute")}` };
}
