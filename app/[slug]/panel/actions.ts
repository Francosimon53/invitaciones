"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { checkHostKey, deleteGuest, getEvent, importGuests } from "@/lib/db";
import { parseGuestList } from "@/lib/invite";
import { syncGuestCovers } from "@/lib/covers";

export type ImportState =
  | { status: "idle" }
  | { status: "ok"; inserted: number; updated: number; skipped: number; linked: number; ignored: string[] }
  | { status: "error"; message: string };

export type CoversState =
  | { status: "idle" }
  | { status: "ok"; ready: number; uploaded: number; failed: number; pending: number }
  | { status: "error"; message: string };

function read(formData: FormData) {
  return { slug: String(formData.get("slug") ?? ""), key: String(formData.get("key") ?? "") };
}

export async function importGuestsAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const { slug, key } = read(formData);
  if (!(await checkHostKey(slug, key))) return { status: "error", message: "Clave incorrecta." };
  const { rows, ignored } = parseGuestList(String(formData.get("list") ?? ""));
  if (rows.length === 0) return { status: "error", message: "No encontré ningún nombre válido en la lista." };
  try {
    const r = await importGuests(slug, key, rows);
    revalidatePath(`/${slug}/panel/invitados`);
    // las portadas de WhatsApp se generan y suben en segundo plano; el panel muestra cuáles quedaron listas
    after(async () => {
      const ev = await getEvent(slug, key);
      if (ev) await syncGuestCovers(ev, key).catch(() => undefined);
    });
    return { status: "ok", inserted: r.inserted, updated: r.updated, skipped: r.skipped, linked: r.linked ?? 0, ignored };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Error al importar." };
  }
}

export async function deleteGuestAction(formData: FormData): Promise<void> {
  const { slug, key } = read(formData);
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await checkHostKey(slug, key))) return;
  await deleteGuest(slug, key, id);
  revalidatePath(`/${slug}/panel/invitados`);
}

/** Botón del panel: genera y sube las portadas que falten o hayan cambiado de nombre. */
export async function syncCoversAction(_prev: CoversState, formData: FormData): Promise<CoversState> {
  const { slug, key } = read(formData);
  if (!(await checkHostKey(slug, key))) return { status: "error", message: "Clave incorrecta." };
  const ev = await getEvent(slug, key);
  if (!ev) return { status: "error", message: "No encontré la invitación." };
  try {
    const r = await syncGuestCovers(ev, key, 40_000);
    revalidatePath(`/${slug}/panel/invitados`);
    return { status: "ok", ...r };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "No se pudieron preparar las portadas." };
  }
}
