import { randomInt } from "node:crypto";
import type { Lang } from "./i18n";
import type { EventData } from "./event";
import { deadlineLabel, longDate, timeRange } from "./event";
import type { GuestImportRow } from "./types";

/** Alfabeto sin caracteres ambiguos (0/o, 1/l/i). 10 caracteres ≈ 49 bits. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function newToken(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function eventLink(siteUrl: string, slug: string): string {
  return `${siteUrl}/${slug}`;
}

export function personalLink(siteUrl: string, slug: string, token: string): string {
  return `${siteUrl}/${slug}/i/${token}`;
}

export function panelLink(siteUrl: string, slug: string, hostKey: string): string {
  return `${siteUrl}/${slug}/panel?key=${encodeURIComponent(hostKey)}`;
}

/** Normaliza un teléfono a dígitos con código de país (EE. UU. por defecto). */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/** "+17135550101" → "(713) 555-0101" para leerlo en el panel; otros países, tal cual. */
export function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

/** Mensaje listo para WhatsApp, en el idioma del invitado. Sin nombre = mensaje del enlace general. */
export function inviteMessage(ev: EventData, lang: Lang, name: string, link: string): string {
  const when = `${longDate(ev, lang)} · ${timeRange(ev).split(" — ")[0]}`;
  const where = `${ev.venue}, ${ev.addressLine1}, ${ev.addressLine2}`;
  const deadline = deadlineLabel(ev, lang);
  if (lang === "en") {
    return (
      `${name ? `Hi ${name}!` : "Hi!"} 🤍\n\n` +
      `With great joy we invite you to celebrate ${ev.honoree}'s XV.\n` +
      `📅 ${when}\n` +
      `📍 ${where}\n\n` +
      `Open your ${name ? "personal " : ""}invitation and RSVP before ${deadline}:\n${link}`
    );
  }
  return (
    `${name ? `¡Hola, ${name}!` : "¡Hola!"} 🤍\n\n` +
    `Con mucha ilusión te invitamos a celebrar los XV de ${ev.honoree}.\n` +
    `📅 ${when}\n` +
    `📍 ${where}\n\n` +
    `Abre tu invitación${name ? " personal" : ""} y confirma tu asistencia antes del ${deadline}:\n${link}`
  );
}

export function whatsappUrl(phone: string | null, text: string): string {
  const base = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Lista pegada a mano: una línea por invitado, campos separados por ; , o tabulador:
 *   Nombre; teléfono; idioma
 * Solo el nombre es obligatorio; idioma por defecto es. Invitado que ya existe: solo cambia lo que trae la línea.
 */
export function parseGuestList(text: string): { rows: GuestImportRow[]; ignored: string[] } {
  const rows: GuestImportRow[] = [];
  const ignored: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\t|;|,/).map((p) => p.trim());
    const display_name = parts[0]?.replace(/\s+/g, " ") ?? "";
    if (display_name.length < 2) {
      ignored.push(line);
      continue;
    }
    let phone: string | null = null;
    let lang: Lang = "es";
    let langGiven = false;
    for (const p of parts.slice(1)) {
      if (!p) continue;
      const low = p.toLowerCase();
      if (low === "en" || low === "english" || low === "inglés" || low === "ingles") {
        lang = "en";
        langGiven = true;
      } else if (low === "es" || low === "español" || low === "espanol" || low === "spanish") {
        lang = "es";
        langGiven = true;
      } else if (p.replace(/\D/g, "").length >= 7) phone = normalizePhone(p);
    }
    rows.push({ token: newToken(), display_name, phone, lang, lang_given: langGiven });
  }
  return { rows, ignored };
}
