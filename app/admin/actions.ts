"use server";

import { revalidatePath } from "next/cache";
import { checkAdminKey, saveEvent, setOrderStatus, toEventData, type EventPayload } from "@/lib/db";
import { zonedToUtcMs } from "@/lib/event";
import { newToken } from "@/lib/invite";
import { asTheme } from "@/lib/themes";
import { asLang } from "@/lib/i18n";
import { publishGeneralCovers } from "@/lib/covers";
import { RESERVED_SLUGS } from "@/lib/site";
import { linksFor, type SavedLinks } from "@/lib/admin-links";
import type { AdminEventRow } from "@/lib/types";

export type SaveEventState =
  | { status: "idle" }
  | { status: "ok"; event: AdminEventRow; warnings: string[]; links: SavedLinks }
  | { status: "error"; message: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function t(fd: FormData, name: string, max = 200): string {
  return String(fd.get(name) ?? "")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, max);
}

/** "Valentina Ruiz" → "valentina-ruiz-xv-k7m2pq": legible y difícil de adivinar (la invitación lleva la dirección de la fiesta). */
function newSlug(honoree: string): string {
  const base = honoree
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36)
    .replace(/-+$/g, "");
  const slug = `${base || "xv"}-xv-${newToken(6)}`;
  return RESERVED_SLUGS.has(slug) ? `${slug}x` : slug;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function saveEventAction(_prev: SaveEventState, fd: FormData): Promise<SaveEventState> {
  const key = t(fd, "key");
  if (!(await checkAdminKey(key))) return { status: "error", message: "Clave incorrecta." };

  const theme = asTheme(t(fd, "theme"));
  const lang = asLang(t(fd, "lang")) ?? "es";
  const honoree = t(fd, "honoree", 40);
  const monogram = (t(fd, "monogram", 2) || honoree.charAt(0)).toLocaleUpperCase("es");
  const date = t(fd, "date", 10);
  const start = t(fd, "start", 5);
  const end = t(fd, "end", 5);
  const tz = t(fd, "time_zone", 40);
  const deadlineDate = t(fd, "deadline", 10) || (DATE.test(date) ? addDays(date, -14) : "");
  const status = t(fd, "status") === "publicada" ? "publicada" : "borrador";

  const problems: string[] = [];
  if (!theme) problems.push("estilo");
  if (honoree.length < 2) problems.push("nombre de la quinceañera");
  if (!DATE.test(date) || !TIME.test(start) || !TIME.test(end)) problems.push("fecha u horas");
  if (!DATE.test(deadlineDate)) problems.push("fecha límite para confirmar");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    problems.push("zona horaria");
  }
  for (const [field, label] of [
    ["venue", "salón"],
    ["address_line1", "dirección"],
    ["address_line2", "ciudad, estado y ZIP"],
    ["city_label", "ciudad para «hora local»"],
  ] as const) {
    if (t(fd, field).length < 2) problems.push(label);
  }
  if (problems.length) return { status: "error", message: `Revisa: ${problems.join(", ")}.` };

  const startMs = zonedToUtcMs(date, start, tz);
  let endMs = zonedToUtcMs(date, end, tz);
  if (endMs <= startMs) endMs = zonedToUtcMs(addDays(date, 1), end, tz); // termina pasada la medianoche
  const deadlineMs = zonedToUtcMs(deadlineDate, "00:00", tz);

  const texts: Record<string, Record<string, string>> = {};
  const warnings: string[] = [];
  for (const [name, label] of [
    ["attire", "vestimenta"],
    ["poem", "frase"],
    ["story", "palabras de la quinceañera"],
  ] as const) {
    const es = t(fd, `${name}_es`, 600);
    const en = t(fd, `${name}_en`, 600);
    if (es || en) texts[name] = { ...(es ? { es } : {}), ...(en ? { en } : {}) };
    if (es && !en) warnings.push(`Falta el inglés de «${label}»: los invitados en inglés verán el texto del diseño.`);
    if (en && !es) warnings.push(`Falta el español de «${label}».`);
  }
  if (deadlineMs >= startMs) warnings.push("La fecha límite para confirmar es igual o posterior a la fiesta.");
  if (deadlineMs <= Date.now()) warnings.push("La fecha límite para confirmar ya pasó: nadie podrá confirmar.");

  const id = t(fd, "id");
  const payload: EventPayload = {
    id: id || null,
    slug: t(fd, "slug", 60) || newSlug(honoree),
    status,
    theme: theme!,
    lang,
    honoree,
    monogram,
    starts_at: new Date(startMs).toISOString(),
    ends_at: new Date(endMs).toISOString(),
    time_zone: tz,
    venue: t(fd, "venue", 80),
    address_line1: t(fd, "address_line1", 120),
    address_line2: t(fd, "address_line2", 120),
    city_label: t(fd, "city_label", 60),
    phone: t(fd, "phone", 30) || null,
    rsvp_deadline: new Date(deadlineMs).toISOString(),
    texts,
    credit: fd.get("credit") === "on",
    host_name: t(fd, "host_name", 80) || null,
    host_email: t(fd, "host_email", 120) || null,
    host_phone: t(fd, "host_phone", 30) || null,
    order_id: t(fd, "order_id") || null,
    host_key: id ? null : newToken(16),
  };

  try {
    const saved = await saveEvent(key, payload);
    if (saved.status === "publicada") {
      // portadas del enlace general listas antes de que la clienta lo comparta
      try {
        const ev = toEventData(saved);
        const paths = await publishGeneralCovers(key, ev);
        saved.cover_paths = paths as Record<string, string>;
      } catch (e) {
        warnings.push(`Las portadas del enlace general se generarán al vuelo (${e instanceof Error ? e.message : "error"}).`);
      }
    }
    revalidatePath("/admin");
    return { status: "ok", event: saved, warnings, links: await linksFor(saved) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/duplicate key|unique/i.test(msg)) return { status: "error", message: "Ese enlace ya existe. Vuelve a guardar para generar otro." };
    return { status: "error", message: msg || "No se pudo guardar." };
  }
}

export async function setOrderStatusAction(fd: FormData): Promise<void> {
  const key = t(fd, "key");
  const id = t(fd, "id");
  const status = t(fd, "status");
  if (!(await checkAdminKey(key)) || !/^[0-9a-f-]{36}$/i.test(id)) return;
  if (!["nuevo", "en_proceso", "entregado", "cancelado"].includes(status)) return;
  await setOrderStatus(key, id, status as "nuevo");
  revalidatePath("/admin");
}
