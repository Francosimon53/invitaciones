import "server-only";
import { supabase } from "./supabase";
import type { EventData } from "./event";
import { asLang } from "./i18n";
import { asTheme } from "./themes";
import type {
  AdminEventRow,
  EventRow,
  ExistingRsvp,
  Guest,
  GuestImportRow,
  GuestRow,
  OrderData,
  OrderRow,
  RsvpRow,
} from "./types";

const SLUG = /^[a-z0-9][a-z0-9-]{2,58}[a-z0-9]$/;
const TOKEN = /^[a-z0-9]{6,32}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isSlug = (s: string) => SLUG.test(s);
export const isUuid = (s: string) => UUID.test(s);

export function toEventData(r: EventRow): EventData {
  const texts = (r.texts ?? {}) as EventData["texts"];
  const covers = (r.cover_paths ?? {}) as EventData["coverPaths"];
  return {
    id: r.id,
    slug: r.slug,
    status: r.status,
    theme: asTheme(r.theme) ?? "azul",
    lang: asLang(r.lang) ?? "es",
    honoree: r.honoree,
    monogram: r.monogram,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    timeZone: r.time_zone,
    venue: r.venue,
    addressLine1: r.address_line1,
    addressLine2: r.address_line2,
    cityLabel: r.city_label,
    phone: r.phone,
    rsvpDeadline: r.rsvp_deadline,
    texts,
    credit: r.credit,
    coverPaths: covers,
  };
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

async function rpcOrNull<T>(fn: string, args: Record<string, unknown>): Promise<T | null> {
  try {
    const { data, error } = await supabase().rpc(fn, args);
    if (error || !data) return null;
    return data as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- invitación (público)

/** Evento publicado; un borrador solo con la clave de Simón o de la anfitriona (vista previa). */
export async function getEvent(slug: string, previewKey?: string | null): Promise<EventData | null> {
  if (!isSlug(slug)) return null;
  const row = await rpcOrNull<EventRow>("inv_get_event", { p_slug: slug, p_preview_key: previewKey || null });
  return row ? toEventData(row) : null;
}

export async function getRsvp(slug: string, id: string): Promise<ExistingRsvp | null> {
  if (!isSlug(slug) || !isUuid(id)) return null;
  return rpcOrNull<ExistingRsvp>("inv_get_rsvp", { p_slug: slug, p_id: id });
}

export async function getGuest(slug: string, token: string): Promise<Guest | null> {
  if (!isSlug(slug) || !TOKEN.test(token)) return null;
  const g = await rpcOrNull<Guest>("inv_get_guest", { p_slug: slug, p_token: token });
  return g ? { ...g, lang: g.lang === "en" ? "en" : "es" } : null;
}

export async function submitOrder(data: OrderData, etsyOrder: string | null): Promise<{ code: string }> {
  return rpc("inv_submit_order", { p_data: data, p_etsy_order: etsyOrder });
}

// ---------------------------------------------------------------- panel de la anfitriona

export async function checkHostKey(slug: string, key: string): Promise<boolean> {
  if (!isSlug(slug) || !key || key.length > 200) return false;
  return (await rpcOrNull<boolean>("inv_check_host_key", { p_slug: slug, p_key: key })) === true;
}

export async function listRsvps(slug: string, key: string): Promise<RsvpRow[]> {
  return (await rpc<RsvpRow[] | null>("inv_list_rsvps", { p_slug: slug, p_key: key })) ?? [];
}

export async function listGuests(slug: string, key: string): Promise<GuestRow[]> {
  return (await rpc<GuestRow[] | null>("inv_list_guests", { p_slug: slug, p_key: key })) ?? [];
}

export async function importGuests(slug: string, key: string, rows: GuestImportRow[]) {
  return rpc<{ inserted: number; updated: number; skipped: number; linked?: number }>("inv_import_guests", { p_slug: slug, p_key: key, p_rows: rows });
}

export async function deleteGuest(slug: string, key: string, id: string): Promise<boolean> {
  return Boolean(await rpc<boolean>("inv_delete_guest", { p_slug: slug, p_key: key, p_id: id }));
}

export async function setGuestCover(slug: string, key: string, token: string, path: string): Promise<void> {
  await rpc("inv_set_guest_cover", { p_slug: slug, p_key: key, p_token: token, p_path: path });
}

// ---------------------------------------------------------------- panel de Simón

export async function checkAdminKey(key: string): Promise<boolean> {
  if (!key || key.length > 200) return false;
  return (await rpcOrNull<boolean>("inv_check_admin_key", { p_key: key })) === true;
}

export async function listOrders(key: string): Promise<OrderRow[]> {
  return (await rpc<OrderRow[] | null>("inv_list_orders", { p_key: key })) ?? [];
}

export async function setOrderStatus(key: string, id: string, status: OrderRow["status"]): Promise<void> {
  await rpc("inv_set_order_status", { p_key: key, p_id: id, p_status: status });
}

export async function listEvents(key: string): Promise<AdminEventRow[]> {
  return (await rpc<AdminEventRow[] | null>("inv_list_events", { p_key: key })) ?? [];
}

export async function getEventAdmin(key: string, id: string): Promise<AdminEventRow | null> {
  if (!isUuid(id)) return null;
  return rpcOrNull<AdminEventRow>("inv_get_event_admin", { p_key: key, p_id: id });
}

export interface EventPayload {
  id: string | null;
  slug: string;
  status: "borrador" | "publicada" | "archivada";
  theme: string;
  lang: string;
  honoree: string;
  monogram: string;
  starts_at: string;
  ends_at: string;
  time_zone: string;
  venue: string;
  address_line1: string;
  address_line2: string;
  city_label: string;
  phone: string | null;
  rsvp_deadline: string;
  texts: Record<string, Record<string, string>>;
  credit: boolean;
  host_name: string | null;
  host_email: string | null;
  host_phone: string | null;
  order_id: string | null;
  /** Solo al crear: clave del panel de la anfitriona. */
  host_key: string | null;
}

export async function saveEvent(key: string, payload: EventPayload): Promise<AdminEventRow> {
  return rpc<AdminEventRow>("inv_save_event", { p_key: key, p_event: payload });
}

/** Cambia la clave del panel de la clienta: el enlace anterior deja de abrir. Devuelve el evento con la clave nueva. */
export async function changeHostKey(key: string, id: string, hostKey: string): Promise<AdminEventRow> {
  return rpc<AdminEventRow>("inv_change_host_key", { p_key: key, p_id: id, p_host_key: hostKey });
}

export async function setEventCovers(key: string, id: string, paths: Record<string, string>): Promise<void> {
  await rpc("inv_set_event_covers", { p_key: key, p_id: id, p_paths: paths });
}
