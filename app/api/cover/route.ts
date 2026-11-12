import { renderCoverJpeg } from "@/lib/og-cover";
import { coverVersion, type CoverInput } from "@/lib/cover-version";
import { getEvent, getGuest } from "@/lib/db";
import { demoEvent } from "@/lib/demo";
import { asLang } from "@/lib/i18n";
import { asTheme } from "@/lib/themes";

export const dynamic = "force-dynamic";

/** Portadas ya generadas en esta instancia (contenido → JPEG). */
const memo = new Map<string, Buffer>();
const MEMO_MAX = 300;

async function jpeg(input: CoverInput): Promise<Buffer> {
  const key = coverVersion(input);
  const hit = memo.get(key);
  if (hit) return hit;
  const out = await renderCoverJpeg(input);
  if (memo.size >= MEMO_MAX) memo.delete(memo.keys().next().value as string);
  memo.set(key, out);
  return out;
}

/**
 * Portada de la invitación para la vista previa del enlace: el sobre cerrado, JPEG liviano.
 *   /api/cover?demo=<estilo>&lang=es[&para=…]  → muestra (con o sin nombre de invitado)
 *   /api/cover?e=<evento>&lang=es&v=…           → enlace general del evento
 *   /api/cover?e=<evento>&token=<token>&v=…     → enlace personal (nombre e idioma del invitado)
 * `v` cambia con el contenido, para que los cachés (CDN y WhatsApp) nunca sirvan una portada vieja.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = asLang(url.searchParams.get("lang")) ?? "es";
  let input: CoverInput | null = null;

  const demo = asTheme(url.searchParams.get("demo"));
  if (demo) {
    // muestra: admite ?para=<nombre> para enseñar cómo llega el enlace personal
    const forName = (url.searchParams.get("para") ?? "").replace(/\s+/g, " ").trim().slice(0, 60) || null;
    input = { theme: demo, honoree: demoEvent(demo).honoree, forName, lang };
  } else {
    const slug = url.searchParams.get("e") ?? "";
    const token = url.searchParams.get("token") ?? "";
    const ev = await getEvent(slug, null);
    if (ev) {
      const guest = token ? await getGuest(ev.slug, token) : null;
      input = guest
        ? { theme: ev.theme, honoree: ev.honoree, forName: guest.display_name, lang: guest.lang }
        : { theme: ev.theme, honoree: ev.honoree, forName: null, lang };
    }
  }
  if (!input) return new Response("not found", { status: 404 });

  const out = await jpeg(input);
  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(out.length),
      "Cache-Control": "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400",
      "CDN-Cache-Control": "public, max-age=31536000",
    },
  });
}
