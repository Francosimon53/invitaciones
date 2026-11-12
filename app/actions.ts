"use server";

import { cookies, headers } from "next/headers";
import { supabase } from "@/lib/supabase";
import { isSlug } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import { RSVP_COOKIE, reservationCode, type Reservation } from "@/lib/reservation";

export type SaveResult =
  | { ok: true; reservation: Reservation; updated: boolean }
  | { ok: false; error: "closed" | "name" | "already" | "generic" };

interface Input {
  slug: string;
  family: string;
  attending: boolean;
  guestToken?: string | null;
  lang: Lang;
  /** Trampa para bots: debe llegar vacío. */
  website?: string;
}

interface RpcResult {
  id: string;
  full_name: string;
  attending: boolean;
  updated: boolean;
}

const TOKEN = /^[a-z0-9]{6,32}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveRsvp(input: Input): Promise<SaveResult> {
  if (input.website) {
    return { ok: true, reservation: { id: "", family: input.family, attending: input.attending, code: "" }, updated: false };
  }
  if (!isSlug(String(input.slug ?? ""))) return { ok: false, error: "generic" };
  const family = String(input.family ?? "").replace(/\s+/g, " ").trim();
  if (family.length < 2 || family.length > 90) return { ok: false, error: "name" };
  if (typeof input.attending !== "boolean") return { ok: false, error: "generic" };
  const token = input.guestToken && TOKEN.test(input.guestToken) ? input.guestToken : null;
  const ua = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const jar = await cookies();
  const own = jar.get(RSVP_COOKIE)?.value ?? "";

  const { data, error } = await supabase().rpc("inv_save_rsvp", {
    p_slug: input.slug,
    p_name: family,
    p_attending: input.attending,
    p_lang: input.lang === "en" ? "en" : "es",
    p_user_agent: ua,
    p_guest_token: token,
    p_rsvp_id: UUID.test(own) ? own : null,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("rsvp_closed")) return { ok: false, error: "closed" };
    if (msg.includes("name_invalid")) return { ok: false, error: "name" };
    if (msg.includes("already_confirmed")) return { ok: false, error: "already" };
    console.error("inv_save_rsvp", msg);
    return { ok: false, error: "generic" };
  }

  const r = data as RpcResult;
  jar.set({
    name: RSVP_COOKIE,
    value: r.id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/${input.slug}`,
    maxAge: 60 * 60 * 24 * 300,
  });

  return {
    ok: true,
    updated: r.updated,
    reservation: { id: r.id, family: r.full_name, attending: r.attending, code: reservationCode(r.id) },
  };
}
