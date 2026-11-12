import { buildIcs, eventTitle } from "@/lib/event";
import { demoEvent } from "@/lib/demo";
import { buildStrings } from "@/lib/i18n";
import { THEMES, asTheme } from "@/lib/themes";
import { eventDetails } from "@/lib/view";
import { SITE_URL } from "@/lib/site";

/** Calendario de la invitación de muestra. */
export async function GET(req: Request, { params }: { params: Promise<{ theme: string }> }) {
  const theme = asTheme((await params).theme);
  if (!theme) return new Response("not found", { status: 404 });
  const ev = demoEvent(theme);
  const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "es";
  const title = eventTitle(ev, THEMES[theme].title[lang], lang);
  const ics = buildIcs({ ...ev, slug: `demo-${theme}` }, title, eventDetails(ev, buildStrings(lang, ev)), `${SITE_URL}/demo/${theme}`);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="muestra-${theme}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
