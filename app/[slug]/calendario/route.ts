import { buildIcs, eventTitle } from "@/lib/event";
import { getEvent } from "@/lib/db";
import { buildStrings } from "@/lib/i18n";
import { THEMES } from "@/lib/themes";
import { eventDetails } from "@/lib/view";

export const dynamic = "force-dynamic";

/** Archivo de calendario (.ics) del evento: /<evento>/calendario?lang=es|en */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getEvent(slug, null);
  if (!ev) return new Response("not found", { status: 404 });
  const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "es";
  const title = eventTitle(ev, THEMES[ev.theme].title[lang], lang);
  const ics = buildIcs(ev, title, eventDetails(ev, buildStrings(lang, ev)), `${new URL(req.url).origin}/${ev.slug}`);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${ev.slug}.ics"`,
      "Cache-Control": "public, max-age=600",
    },
  });
}
