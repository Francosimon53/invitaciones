import "server-only";
import type { EventData } from "./event";
import type { Lang } from "./i18n";
import type { GuestRow } from "./types";
import { coverStorageUrl, supabase } from "./supabase";
import { coverVersion, generalCoverObject, guestCoverObject, type CoverInput } from "./cover-version";
import { renderCoverJpeg } from "./og-cover";
import { listGuests, setEventCovers, setGuestCover } from "./db";

function guestInput(ev: EventData, g: { display_name: string | null; lang: string }): CoverInput {
  return { theme: ev.theme, honoree: ev.honoree, forName: g.display_name, lang: g.lang === "en" ? "en" : "es" };
}

function generalInput(ev: EventData, lang: Lang): CoverInput {
  return { theme: ev.theme, honoree: ev.honoree, forName: null, lang };
}

/**
 * URL de la portada que leen WhatsApp, iMessage y Telegram. Si la portada estática ya está subida y corresponde a lo
 * que hoy dice la invitación, se usa esa (.jpg, sin query string y sin arranque en frío); si no, la genera /api/cover.
 */
export function guestCoverUrl(siteUrl: string, ev: EventData, g: { token: string; display_name: string; lang: string; cover_path: string | null }) {
  const input = guestInput(ev, g);
  const object = guestCoverObject(ev.slug, g.token, input);
  if (g.cover_path === object) return coverStorageUrl(object);
  return `${siteUrl}/api/cover?e=${encodeURIComponent(ev.slug)}&token=${encodeURIComponent(g.token)}&v=${coverVersion(input)}`;
}

export function generalCoverUrl(siteUrl: string, ev: EventData, lang: Lang) {
  const input = generalInput(ev, lang);
  const object = generalCoverObject(ev.slug, input);
  if (ev.coverPaths[lang] === object) return coverStorageUrl(object);
  return `${siteUrl}/api/cover?e=${encodeURIComponent(ev.slug)}&lang=${lang}&v=${coverVersion(input)}`;
}

async function upload(object: string, jpeg: Buffer): Promise<void> {
  const { error } = await supabase()
    .storage.from("inv-covers")
    .upload(object, jpeg, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  // el nombre lleva la versión del contenido: si ya existe, es exactamente esta portada
  if (error && !/exists|duplicate/i.test(error.message)) throw new Error(error.message);
}

/** Sube las portadas del enlace general (ES y EN) y las marca en el evento. Se llama al publicar o editar. */
export async function publishGeneralCovers(adminKey: string, ev: EventData): Promise<Partial<Record<Lang, string>>> {
  const paths: Partial<Record<Lang, string>> = {};
  for (const lang of ["es", "en"] as Lang[]) {
    const input = generalInput(ev, lang);
    const object = generalCoverObject(ev.slug, input);
    await upload(object, await renderCoverJpeg(input));
    paths[lang] = object;
  }
  await setEventCovers(adminKey, ev.id, paths as Record<string, string>);
  return paths;
}

export function guestCoverReady(ev: EventData, g: GuestRow): boolean {
  return g.cover_path === guestCoverObject(ev.slug, g.token, guestInput(ev, g));
}

export interface CoverSyncResult {
  ready: number;
  uploaded: number;
  failed: number;
  pending: number;
}

/**
 * Genera y sube la portada de cada invitado que no la tenga al día, dentro de un presupuesto de tiempo.
 * Idempotente: se puede llamar tras cada importación y desde el botón del panel.
 */
export async function syncGuestCovers(ev: EventData, key: string, budgetMs = 40_000, concurrency = 4): Promise<CoverSyncResult> {
  const deadline = Date.now() + budgetMs;
  const guests = await listGuests(ev.slug, key);
  const queue = guests.filter((g) => !guestCoverReady(ev, g));
  const result: CoverSyncResult = { ready: guests.length - queue.length, uploaded: 0, failed: 0, pending: 0 };
  const worker = async () => {
    while (queue.length > 0) {
      if (Date.now() > deadline) return;
      const g = queue.shift();
      if (!g) return;
      try {
        const input = guestInput(ev, g);
        const object = guestCoverObject(ev.slug, g.token, input);
        await upload(object, await renderCoverJpeg(input));
        await setGuestCover(ev.slug, key, g.token, object);
        result.uploaded++;
      } catch {
        result.failed++;
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  result.pending = queue.length;
  return result;
}
